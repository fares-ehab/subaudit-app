import React, { useState } from 'react';
import { Plus, CreditCard, CheckCircle2, HelpCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface EmptyStateProps {
  onAddSubscription: (name?: string) => void;
  // NEW: Props to make the checklist stateful
  hasSubscriptions: boolean;
  isBankConnected: boolean;
}

const popularServices = ['Netflix', 'Spotify', 'Adobe', 'GitHub', 'Notion', 'Disney+'];

const EmptyState: React.FC<EmptyStateProps> = ({ onAddSubscription, hasSubscriptions, isBankConnected }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [subCount, setSubCount] = useState(5); // Default value for the calculator

  const potentialSavings = (count: number) => {
    // Average savings logic (can be adjusted)
    const averageMonthlyCost = 15;
    const cancellationRate = 0.15; // Assume user might cancel 15%
    return Math.round(count * averageMonthlyCost * cancellationRate * 12);
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } },
  };

  return (
    <>
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="text-center py-16 px-4">
        <motion.div variants={itemVariants} className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
          <CreditCard className="w-12 h-12 text-indigo-400" />
        </motion.div>
        
        <motion.h3 variants={itemVariants} className="text-2xl font-semibold text-gray-900 mb-3">
          Ready to take control? 🎯
        </motion.h3>
        
        <motion.p variants={itemVariants} className="text-gray-600 mb-8 max-w-md mx-auto">
          Let's turn sneaky subscription charges into mindful spending. Add your first one to get started!
        </motion.p>
        
        <motion.div variants={itemVariants}>
          <button onClick={() => onAddSubscription()} className="bg-indigo-600 text-white px-8 py-3 rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2 mx-auto shadow-lg hover:shadow-indigo-500/50">
            <Plus className="w-5 h-5" />
            <span>Add First Subscription</span>
          </button>
        </motion.div>

        <motion.div variants={itemVariants} className="mt-12 max-w-2xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Quick Add Section */}
          <div className="bg-gray-50 border border-gray-200/80 rounded-xl p-6">
              <h4 className="font-medium text-gray-700 mb-4">Quick Start</h4>
              <p className="text-sm text-gray-500 mb-4">Click a popular service to add it instantly.</p>
              <div className="flex flex-wrap justify-center gap-2">
                {popularServices.map((service) => (
                  <button key={service} onClick={() => onAddSubscription(service)} className="bg-white border border-gray-300 px-3 py-1 rounded-full text-sm text-gray-700 hover:bg-indigo-50 hover:border-indigo-300 transition-colors">
                    {service}
                  </button>
                ))}
              </div>
          </div>

          {/* NEW: Savings Calculator Section */}
          <div className="bg-gray-50 border border-gray-200/80 rounded-xl p-6">
              <h4 className="font-medium text-gray-700 mb-4">Potential Savings</h4>
              <p className="text-sm text-gray-500 mb-4">Estimate how many subscriptions you have:</p>
              <input 
                type="range" 
                min="1" 
                max="20" 
                value={subCount}
                onChange={(e) => setSubCount(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="text-center mt-2">
                <span className="text-indigo-600 font-bold text-lg">{subCount}</span>
                <span className="text-gray-600"> subscriptions</span>
              </div>
              <p className="text-center mt-4 text-2xl font-bold text-green-600">
                ~${potentialSavings(subCount)} / year
              </p>
          </div>
        </motion.div>

        {/* Onboarding Checklist */}
        <motion.div variants={itemVariants} className="mt-8 max-w-lg mx-auto">
            <div className="mt-6 pt-6">
                 <h4 className="font-medium text-gray-700 mb-3">Your Onboarding Progress</h4>
                 <ul className="space-y-2 text-left text-sm text-gray-600 inline-block">
                    <li className="flex items-center space-x-2"><CheckCircle2 className="w-4 h-4 text-green-500"/><span>Account Created</span></li>
                    <li className={`flex items-center space-x-2 transition-opacity ${hasSubscriptions ? '' : 'opacity-60'}`}>
                        {hasSubscriptions ? <CheckCircle2 className="w-4 h-4 text-green-500"/> : <div className="w-4 h-4 border-2 border-gray-400 rounded-full"/>}
                        <span>Add your first subscription</span>
                    </li>
                    <li className={`flex items-center space-x-2 transition-opacity ${isBankConnected ? '' : 'opacity-60'}`}>
                        {isBankConnected ? <CheckCircle2 className="w-4 h-4 text-green-500"/> : <div className="w-4 h-4 border-2 border-gray-400 rounded-full"/>}
                        <span>(Optional) Connect your bank</span>
                    </li>
                 </ul>
                 <div className="mt-4">
                    <button onClick={() => setIsModalOpen(true)} className="text-sm text-indigo-600 hover:underline flex items-center space-x-1 mx-auto">
                        <HelpCircle size={16}/>
                        <span>How do I find my subscriptions?</span>
                    </button>
                 </div>
            </div>
        </motion.div>
      </motion.div>

      {/* --- NEW: "How to Find" Modal --- */}
      <AnimatePresence>
        {isModalOpen && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
                    <div className="flex items-center justify-between p-4 border-b">
                        <h3 className="text-lg font-semibold flex items-center space-x-2"><HelpCircle className="text-indigo-500"/><span>Where to Find Your Subscriptions</span></h3>
                        <button onClick={() => setIsModalOpen(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"><X/></button>
                    </div>
                    <div className="p-6 text-left space-y-4 text-gray-700">
                        <p>Finding all your recurring payments can be tricky! Here are the best places to look:</p>
                        <ul className="list-disc list-inside space-y-2">
                            <li><strong>Bank & Credit Card Statements:</strong> Look for familiar names that appear every month or year (e.g., NETFLIX, SPOTIFY, AMZNPRIME).</li>
                            <li><strong>Email Invoices:</strong> Search your inbox for terms like "receipt," "invoice," "subscription renewal," or "your order."</li>
                            <li><strong>App Stores:</strong> Check the "Subscriptions" section on your Apple App Store or Google Play Store account.</li>
                            <li><strong>PayPal Account:</strong> Log in to PayPal and look for "Automatic Payments" in your settings.</li>
                        </ul>
                        <p className="pt-2">The easiest method is to use our <strong>Bank Integration</strong> feature to find them automatically!</p>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default EmptyState;
