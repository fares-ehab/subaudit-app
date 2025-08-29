import React, { useState, useEffect } from 'react';
import { Brain, AlertTriangle, Clock, ThumbsUp, ThumbsDown, HelpCircle, X, Layers, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react';
import { Subscription, Insight } from '../types'; // <-- FIX: Import the correct Insight type

// --- The main component now receives live data as props ---
interface SmartInsightsProps {
  insights: Insight[];
  subscriptions: Subscription[];
}

const SmartInsights: React.FC<SmartInsightsProps> = ({ insights, subscriptions }) => {
  const [visibleInsights, setVisibleInsights] = useState(insights);

  useEffect(() => {
    setVisibleInsights(insights);
  }, [insights]);

  const handleDismiss = (id: string) => {
    setVisibleInsights(prev => prev.filter(insight => insight.id !== id));
    toast.success("Insight dismissed.");
  };

  const handleFeedback = (id: string, isHelpful: boolean) => {
    console.log(`Feedback for ${id}: ${isHelpful ? 'Helpful' : 'Not Helpful'}`);
    handleDismiss(id);
    toast.success("Thanks for your feedback!");
  };

  if (insights.length === 0) {
    return (
        <div className="bg-white rounded-xl shadow-sm border p-6 text-center">
            <Brain className="w-12 h-12 text-gray-300 mx-auto mb-4"/>
            <h3 className="text-xl font-semibold text-gray-800">No Insights Yet</h3>
            <p className="text-gray-500 mt-2">Add more subscriptions or track your usage to get AI-powered recommendations.</p>
        </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex items-center space-x-3 mb-4">
        <Brain className="w-6 h-6 text-purple-600" />
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Smart Insights</h3>
          <p className="text-sm text-gray-600">Actionable recommendations based on your habits.</p>
        </div>
      </div>

      <div className="space-y-4">
        <AnimatePresence>
          {visibleInsights.map((insight) => (
            <RecommendationCard 
              key={insight.id} 
              insight={insight}
              onDismiss={handleDismiss}
              onFeedback={handleFeedback}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

// --- Actionable Recommendation Card Component ---
const RecommendationCard: React.FC<{
  insight: Insight;
  onDismiss: (id: string) => void;
  onFeedback: (id: string, helpful: boolean) => void;
}> = ({ insight, onDismiss, onFeedback }) => {
  
  const recommendationInfo = {
    low_value: { icon: AlertTriangle, color: 'red', actionText: 'Review & Cancel' },
    underutilized: { icon: Clock, color: 'orange', actionText: 'Review Usage' },
    price_increase: { icon: TrendingUp, color: 'yellow', actionText: 'Confirm Price' },
    duplicate_category: { icon: Layers, color: 'blue', actionText: 'Review Category' },
  };
  const info = recommendationInfo[insight.type];
  const colorClasses = {
    red: { border: 'border-red-200', bg: 'bg-red-50/80', text: 'text-red-700' },
    orange: { border: 'border-orange-200', bg: 'bg-orange-50/80', text: 'text-orange-700' },
    yellow: { border: 'border-yellow-200', bg: 'bg-yellow-50/80', text: 'text-yellow-700' },
    blue: { border: 'border-blue-200', bg: 'bg-blue-50/80', text: 'text-blue-700' },
  };
  const colors = colorClasses[info.color as keyof typeof colorClasses];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100, transition: { duration: 0.3 } }}
      className={`rounded-xl border p-5 ${colors.border} ${colors.bg}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className={`font-semibold flex items-center space-x-2 text-sm ${colors.text}`}>
            <info.icon size={16}/><span>{insight.title}</span>
          </div>
          <p className="mt-2 text-gray-800 font-semibold">{insight.subscription.name}</p>
          <p className="mt-1 text-sm text-gray-600">{insight.reason}</p>
        </div>
        <button onClick={() => onDismiss(insight.id)} className="p-1 text-gray-400 hover:text-gray-600"><X size={16} /></button>
      </div>
      <div className="mt-4 pt-4 border-t flex items-center justify-between">
        <div className="flex items-center space-x-4 text-sm text-gray-500">
            <Popover className="relative">
                <PopoverButton className="flex items-center space-x-1 text-indigo-600 hover:underline"><HelpCircle size={14}/><span>Why?</span></PopoverButton>
                <PopoverPanel anchor="top" className="z-10 mb-2 w-72 rounded-lg bg-gray-800 text-white text-xs p-3 shadow-lg">
                    <strong>Reason:</strong> {insight.reason}
                </PopoverPanel>
            </Popover>
            <div className="flex items-center space-x-2">
                <span>Helpful?</span>
                <button onClick={() => onFeedback(insight.id, true)} className="p-1 rounded-full hover:bg-green-200"><ThumbsUp size={16}/></button>
                <button onClick={() => onFeedback(insight.id, false)} className="p-1 rounded-full hover:bg-red-200"><ThumbsDown size={16}/></button>
            </div>
        </div>
        <div className="flex items-center space-x-2">
            <Link to="#" className={`px-4 py-2 rounded-lg text-sm font-semibold text-white ${info.color === 'red' ? 'bg-red-600' : 'bg-indigo-600'} hover:opacity-90`}>
                {info.action}
            </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default SmartInsights;
