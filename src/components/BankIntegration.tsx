import React from 'react';
import { CreditCard, Plus, Check, Loader, X, Inbox } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- NEW: Import the REAL hook ---
import { useBankIntegration } from '../hooks/useBankIntegration';
import { DetectedSubscription } from '../types';
import LoadingSpinner from './LoadingSpinner';

const BankIntegration: React.FC = () => {
  // --- FIX: Use the hook for all data and state management ---
  const {
    isLoading,
    detectedSubscriptions,
    importStatus,
    connectBankAccount,
    importSubscription,
  } = useBankIntegration();

  const handleImportAll = () => {
    detectedSubscriptions.forEach(sub => {
        if (!importStatus[sub.merchant_name]) {
            importSubscription(sub);
        }
    });
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-600 bg-green-100';
    if (confidence >= 0.7) return 'text-yellow-600 bg-yellow-100';
    return 'text-orange-600 bg-orange-100';
  };

  const availableSubscriptions = detectedSubscriptions.filter(s => importStatus[s.merchant_name] !== 'imported');

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex items-center space-x-3 mb-6">
        <CreditCard className="w-6 h-6 text-indigo-600" />
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Bank Integration</h3>
          <p className="text-sm text-gray-600">Automatically detect subscriptions from your bank transactions.</p>
        </div>
      </div>

      {detectedSubscriptions.length === 0 ? (
        <div className="text-center py-8">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-8 h-8 text-indigo-500" />
          </div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">Discover Hidden Subscriptions</h4>
          <button onClick={connectBankAccount} disabled={isLoading} className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center space-x-2 mx-auto">
            {isLoading ? <><Loader className="w-4 h-4 animate-spin" /><span>Connecting...</span></> : <><Plus className="w-4 h-4" /><span>Connect Bank Account</span></>}
          </button>
          <div className="mt-4 text-xs text-gray-500"><p>🔒 Powered by Plaid with bank-level security</p></div>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between pb-4 border-b mb-4">
            <h4 className="font-medium text-gray-900">Detected Subscriptions ({availableSubscriptions.length})</h4>
            {availableSubscriptions.length > 0 && (
                <button onClick={handleImportAll} className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">Import All</button>
            )}
          </div>
          
          <AnimatePresence>
            {detectedSubscriptions.map((sub) => {
              const status = importStatus[sub.merchant_name];
              if (status === 'imported') return null;
              
              return (
                <motion.div
                  key={sub.merchant_name}
                  layout
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -50, transition: { duration: 0.3 } }}
                  className="border rounded-lg p-4 mb-3 flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <h5 className="font-medium text-gray-900">{sub.merchant_name}</h5>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(sub.confidence)}`}>
                        {Math.round(sub.confidence * 100)}% match
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      ${sub.amount.toFixed(2)} / {sub.frequency}
                    </p>
                  </div>
                  <button onClick={() => importSubscription(sub)} disabled={!!status} className={`w-32 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center space-x-2 ${
                      status === 'imported' ? 'bg-green-500' : 'bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50'
                  }`}>
                    {status === 'importing' ? <><Loader size={16} className="animate-spin" /><span>Importing</span></> :
                     status === 'imported' ? <><Check size={16} /><span>Imported</span></> :
                     <><Plus size={16} /><span>Import</span></>}
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
          {availableSubscriptions.length === 0 && !isLoading && (
            <div className="text-center py-6"><Inbox className="w-12 h-12 text-gray-300 mx-auto mb-2" /><p className="text-gray-500">All subscriptions have been imported.</p></div>
          )}
        </div>
      )}
    </div>
  );
};

export default BankIntegration;
