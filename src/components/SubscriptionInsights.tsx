import React, { useState, useEffect } from 'react';
import { TrendingDown, Star, Clock, HelpCircle, X, AlertTriangle, Copy, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react';
import { toast } from 'react-hot-toast';
import { Subscription, Insight } from '../types';

// --- FIX: The component now correctly accepts 'insights' and 'subscriptions' as props ---
interface SubscriptionInsightsProps {
  insights: Insight[];
  subscriptions: Subscription[];
}

const SubscriptionInsights: React.FC<SubscriptionInsightsProps> = ({ insights, subscriptions }) => {
  const [visibleInsights, setVisibleInsights] = useState(insights);

  useEffect(() => {
    setVisibleInsights(insights);
  }, [insights]);

  const handleDismiss = (id: string) => {
    setVisibleInsights(prev => prev.filter(insight => insight.id !== id));
    toast.success("Insight dismissed.");
  };
  
  const handleSnooze = (id: string) => {
    setVisibleInsights(prev => prev.filter(insight => insight.id !== id));
    toast.success("Insight snoozed for 30 days.");
  };

  const highValueCount = subscriptions.filter(s => s.is_active && s.value_rating && s.value_rating >= 4).length;
  const totalRatedCount = subscriptions.filter(s => s.is_active && s.value_rating).length;
  const healthScore = totalRatedCount > 0 ? (highValueCount / totalRatedCount) * 100 : 100;

  const handleCopySummary = () => {
    const summaryText = `Subscription Health: ${healthScore.toFixed(0)}% with ${insights.length} action items.`;
    navigator.clipboard.writeText(summaryText);
    toast.success("Summary copied to clipboard!");
  };

  if (insights.length === 0) {
    return (
        <div className="bg-white rounded-xl shadow-sm border p-6 text-center">
            <Star className="w-12 h-12 text-green-400 mx-auto mb-4"/>
            <h3 className="text-xl font-semibold text-gray-900">Looking Good!</h3>
            <p className="text-gray-600 mt-2">No immediate savings opportunities found.</p>
        </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Action Items</h3>
      
      <div className="mb-6 p-4 bg-gray-50 rounded-lg flex items-center justify-between">
          <div className="flex items-center space-x-4">
              <div className="relative w-20 h-20">
                  <svg className="w-full h-full" viewBox="0 0 36 36"><path className="text-gray-200" strokeWidth="4" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" /><motion.path className={healthScore > 75 ? "text-green-500" : healthScore > 50 ? "text-yellow-500" : "text-red-500"} strokeWidth="4" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" initial={{ strokeDashoffset: 100 }} animate={{ strokeDashoffset: 100 - healthScore }} transition={{ duration: 1.5 }} style={{ strokeDasharray: 100 }} transform="rotate(-90 18 18)"/></svg>
                  <div className="absolute inset-0 flex items-center justify-center text-2xl font-bold">{healthScore.toFixed(0)}%</div>
              </div>
              <div>
                  <h4 className="font-semibold text-gray-800">Subscription Health</h4>
                  <p className="text-sm text-gray-600">You have {insights.length} opportunities to optimize.</p>
              </div>
          </div>
          <button onClick={handleCopySummary} className="flex items-center space-x-2 text-sm bg-white border px-3 py-2 rounded-lg hover:bg-gray-100">
              <Copy size={14}/>
              <span>Copy Summary</span>
          </button>
      </div>

      <div className="space-y-3">
        <AnimatePresence>
          {visibleInsights.map((insight) => (
            <InsightCard key={insight.id} insight={insight} onDismiss={handleDismiss} onSnooze={handleSnooze} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

// --- Actionable Insight Card Component ---
const InsightCard: React.FC<{ insight: Insight; onDismiss: (id: string) => void; onSnooze: (id: string) => void; }> = ({ insight, onDismiss, onSnooze }) => {
    const info = {
        low_value: { icon: TrendingDown, color: 'red', action: 'Review & Cancel' },
        underutilized: { icon: Clock, color: 'orange', action: 'Mark as Used' },
        price_increase: { icon: AlertTriangle, color: 'yellow', action: 'Confirm Price' },
        duplicate_category: { icon: Layers, color: 'blue', action: 'Review Category' },
    }[insight.type];

    const colors = {
        red: { bg: 'bg-red-50/80', text: 'text-red-700', border: 'border-red-200' },
        orange: { bg: 'bg-orange-50/80', text: 'text-orange-700', border: 'border-orange-200' },
        yellow: { bg: 'bg-yellow-50/80', text: 'text-yellow-700', border: 'border-yellow-200' },
        blue: { bg: 'bg-blue-50/80', text: 'text-blue-700', border: 'border-blue-200' },
    };
    const color = colors[info.color as keyof typeof colors];

    return (
        <motion.div layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -50 }} className={`p-4 rounded-lg border ${color.bg} ${color.border}`}>
            <div className={`font-semibold flex items-center justify-between text-sm ${color.text}`}>
                <div className="flex items-center space-x-2">
                    <info.icon size={16}/><span>{insight.title}</span>
                </div>
                <Popover className="relative">
                    <PopoverButton className="p-1 rounded-full hover:bg-black/10"><HelpCircle size={14}/></PopoverButton>
                    <PopoverPanel anchor="bottom end" className="z-10 mt-2 w-64 rounded-lg bg-gray-800 text-white text-xs p-3 shadow-lg"><strong>Reason:</strong> {insight.reason}</PopoverPanel>
                </Popover>
            </div>
            <div className="mt-2 flex items-center justify-between">
                <div>
                    <p className="font-bold text-gray-800">{insight.subscription.name}</p>
                    {insight.potential_savings > 0 && <p className="text-xs text-green-600 font-medium">+${insight.potential_savings.toFixed(2)} potential savings</p>}
                </div>
                <div className="flex items-center space-x-1">
                    {insight.type === 'underutilized' && <button onClick={() => onSnooze(insight.id)} className="text-xs font-semibold bg-white border px-3 py-1 rounded-md hover:bg-gray-50">Snooze</button>}
                    <Link to={`/subscriptions/${insight.subscription.id}`} className="bg-indigo-600 text-white text-xs font-semibold px-3 py-1 rounded-md hover:bg-indigo-700">{info.action}</Link>
                    <button onClick={() => onDismiss(insight.id)} className="p-1 text-gray-400 hover:text-gray-600"><X size={14}/></button>
                </div>
            </div>
        </motion.div>
    );
};

export default SubscriptionInsights;
