import React, { useState, useEffect } from 'react';
import { CreditCard, Loader } from 'lucide-react';
// --- FIX: Import the 'Variants' type from framer-motion ---
import { motion, AnimatePresence, Variants } from 'framer-motion';

interface LoadingSpinnerProps {
  message?: string;
  variant?: 'default' | 'inline' | 'overlay' | 'skeleton' | 'progress';
  progress?: number;
  customIcon?: React.ReactNode;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = 'Loading...', 
  variant = 'default',
  progress = 0,
  customIcon = <CreditCard className="absolute inset-0 m-auto w-6 h-6 text-indigo-600" />
}) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(true);
    }, 300); // Only show spinner if loading takes more than 300ms
    return () => clearTimeout(timer);
  }, []);

  // --- FIX: Explicitly define the type as 'Variants' ---
  const spinnerVariants: Variants = {
    initial: { rotate: 0 },
    animate: { rotate: 360, transition: { duration: 1, repeat: Infinity, ease: 'linear' } },
  };

  const textVariants: Variants = {
    initial: { opacity: 0.7 },
    animate: { opacity: 1, transition: { duration: 0.8, repeat: Infinity, repeatType: 'reverse' } },
  };

  if (!show) return null;

  if (variant === 'skeleton') {
    return (
      <div role="status" className="w-full p-4 space-y-4 border border-gray-200 rounded shadow animate-pulse">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-2.5 bg-gray-300 rounded-full w-24 mb-2.5"></div>
            <div className="w-32 h-2 bg-gray-200 rounded-full"></div>
          </div>
          <div className="h-2.5 bg-gray-300 rounded-full w-12"></div>
        </div>
      </div>
    );
  }

  if (variant === 'progress') {
    return (
        <div role="status" className="w-full">
            <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">{message}</span>
                <span className="text-sm font-medium text-indigo-700">{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
                <motion.div 
                    className="bg-indigo-600 h-2.5 rounded-full" 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div role="status" className="flex items-center space-x-2">
        <Loader className="w-4 h-4 animate-spin text-indigo-600" />
        <span className="text-sm text-gray-600">{message}</span>
      </div>
    );
  }

  if (variant === 'overlay') {
    return (
      <AnimatePresence>
        <motion.div
          role="status"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-50"
        >
          <div className="relative w-16 h-16">
            <motion.div variants={spinnerVariants} initial="initial" animate="animate" className="w-full h-full rounded-full border-4 border-indigo-100 border-t-indigo-600" />
            {React.cloneElement(customIcon as React.ReactElement, { className: "absolute inset-0 m-auto w-8 h-8 text-indigo-600" })}
          </div>
          <motion.p variants={textVariants} initial="initial" animate="animate" className="text-gray-700 font-medium mt-4 text-base">
            {message}
          </motion.p>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <div role="status" className="flex flex-col items-center justify-center min-h-64 py-12">
      <div className="relative w-12 h-12">
        <motion.div variants={spinnerVariants} initial="initial" animate="animate" className="w-full h-full rounded-full border-4 border-indigo-100 border-t-indigo-600" />
        {customIcon}
      </div>
      <motion.p variants={textVariants} initial="initial" animate="animate" className="text-gray-600 mt-4 text-sm">
        {message}
      </motion.p>
    </div>
  );
};

export default LoadingSpinner;
