import React, { useState, useMemo } from 'react';
import { Trash2, Star, AlertTriangle, PauseCircle, PlayCircle, Loader,  Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { bulkUpdateSubscriptions } from '../lib/subscriptions';
import { Subscription } from '../types';

interface BulkActionsProps {
  selectedSubscriptions: Subscription[];
  onSuccess: () => void;
}

type ActionType = 'cancel' | 'pause' | 'resume' | 'favorite';

const BulkActions: React.FC<BulkActionsProps> = ({ selectedSubscriptions, onSuccess }) => {
  const [activeAction, setActiveAction] = useState<ActionType | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  
  const selectedIds = selectedSubscriptions.map(s => s.id);

  const totalMonthlyCost = useMemo(() => {
    return selectedSubscriptions.reduce((total, sub) => {
        if (sub.billing_cycle === 'monthly') return total + sub.cost;
        if (sub.billing_cycle === 'yearly') return total + sub.cost / 12;
        if (sub.billing_cycle === 'weekly') return total + (sub.cost * 52) / 12;
        return total;
    }, 0);
  }, [selectedSubscriptions]);


  const handleActionClick = (action: ActionType) => {
    setActiveAction(action);
    if (action === 'cancel') {
      setIsConfirming(true);
    } else {
      executeAction(action);
    }
  };

  const executeAction = async (action: ActionType) => {
    setIsConfirming(false);
    const toastId = toast.loading(`Processing ${selectedIds.length} subscription(s)...`);
    
    let updates: Partial<Subscription> = {};
    if (action === 'cancel') updates = { is_active: false, cancellation_date: new Date().toISOString() };
    if (action === 'pause') updates = { is_active: false };
    if (action === 'resume') updates = { is_active: true };
    
    try {
      await bulkUpdateSubscriptions(selectedIds, updates);
      toast.success('Action successful!', { id: toastId });
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || 'An unknown error occurred.', { id: toastId });
    } finally {
      setActiveAction(null);
    }
  };

  const actionConfig: Record<ActionType, { icon: React.ElementType; label: string; style: string; }> = {
    favorite: { icon: Star, label: 'Favorite', style: 'bg-blue-600 hover:bg-blue-700' },
    pause: { icon: PauseCircle, label: 'Pause', style: 'bg-yellow-600 hover:bg-yellow-700' },
    resume: { icon: PlayCircle, label: 'Resume', style: 'bg-green-600 hover:bg-green-700' },
    cancel: { icon: Trash2, label: 'Cancel', style: 'bg-red-600 hover:bg-red-700' },
  };

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="bg-indigo-100 border border-indigo-200 rounded-xl p-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-600 text-white rounded-full p-2">
                <Check size={16}/>
            </div>
            <div>
                <span className="font-medium text-indigo-900">
                  {selectedIds.length} subscription{selectedIds.length > 1 ? 's' : ''} selected
                </span>
                <p className="text-sm text-indigo-700 font-mono">
                  Total: ${totalMonthlyCost.toFixed(2)} / month
                </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {Object.keys(actionConfig).map((key) => {
                const action = key as ActionType;
                const { icon: Icon, label, style } = actionConfig[action];
                const isProcessing = activeAction === action;
                return (
                    <button
                        key={action}
                        onClick={() => handleActionClick(action)}
                        disabled={!!activeAction}
                        className={`text-white px-4 py-2 rounded-lg disabled:opacity-50 transition-colors flex items-center space-x-2 ${style}`}
                    >
                        {isProcessing ? <Loader className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}
                        <span>{label}</span>
                    </button>
                )
            })}
          </div>
        </div>
      </motion.div>

      {/* --- FIX: Modal JSX is now integrated directly into this component --- */}
      <AnimatePresence>
        {isConfirming && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 text-center"
                >
                    <AlertTriangle className="mx-auto w-16 h-16 text-red-500" />
                    <h3 className="text-xl font-semibold mt-4 text-gray-900">Are you sure?</h3>
                    <p className="text-gray-600 mt-2">You are about to cancel {selectedIds.length} subscription(s).</p>
                    <div className="flex space-x-3 mt-6">
                        <button onClick={() => { setIsConfirming(false); setActiveAction(null); }} className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium">
                            Go Back
                        </button>
                        <button onClick={() => executeAction('cancel')} disabled={activeAction === 'cancel'} className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium flex items-center justify-center">
                            {activeAction === 'cancel' ? <Loader className="animate-spin" size={20}/> : 'Yes, Cancel'}
                        </button>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default BulkActions;
