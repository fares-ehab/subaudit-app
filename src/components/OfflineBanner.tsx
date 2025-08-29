import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, X, RefreshCw, Loader } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useOfflineSync } from '../hooks/useOfflineSync'; // NEW: Import the real hook

const OfflineBanner: React.FC = () => {
  const { isOnline, syncStatus, syncProgress, queueCount } = useOfflineSync();
  const [isVisible, setIsVisible] = useState(!isOnline);

  useEffect(() => {
    // Show banner if offline or currently syncing
    if (!isOnline || syncStatus === 'syncing') {
      setIsVisible(true);
    } 
    // If we come back online and there's nothing to sync, show a temporary "Back online" message
    else if (isOnline && syncStatus === 'idle' && queueCount === 0) {
      setIsVisible(true);
      const timer = setTimeout(() => setIsVisible(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, syncStatus, queueCount]);
  
  const handleRetry = () => {
    if (navigator.onLine) {
        window.dispatchEvent(new Event('online'));
    } else {
        toast.error("Still offline. Please check your connection.");
    }
  }

  const bannerVariants = {
    hidden: { y: '-100%', opacity: 0 },
    visible: { y: 0, opacity: 1 },
    exit: { y: '-100%', opacity: 0 }
  };

  const renderContent = () => {
    if (!isOnline) {
      return {
        bg: 'bg-gray-800',
        icon: <WifiOff className="w-5 h-5" />,
        message: `You're offline. ${queueCount} change${queueCount !== 1 ? 's' : ''} waiting to sync.`,
        actions: <button onClick={handleRetry} className="ml-4 flex items-center space-x-2 text-sm bg-white/20 px-3 py-1 rounded-md hover:bg-white/30"><RefreshCw size={14}/><span>Retry</span></button>
      };
    }
    if (syncStatus === 'syncing') {
      return {
        bg: 'bg-blue-600',
        icon: <Loader className="w-5 h-5 animate-spin" />,
        message: `Syncing ${syncProgress.current} of ${syncProgress.total} changes...`,
        actions: null
      };
    }
    return {
      bg: 'bg-green-600',
      icon: <Wifi className="w-5 h-5" />,
      message: "You're back online!",
      actions: null
    };
  };

  const content = renderContent();

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          variants={bannerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className={`fixed top-0 left-0 right-0 z-50 p-3 text-center text-white shadow-lg ${content.bg}`}
        >
          <div className="flex items-center justify-center max-w-7xl mx-auto px-4">
            <div className="flex-1 flex items-center justify-center space-x-2">
              {content.icon}
              <span>{content.message}</span>
              {content.actions}
            </div>
            <button onClick={() => setIsVisible(false)} className="p-1 rounded-full hover:bg-white/20 transition-colors" aria-label="Dismiss">
              <X className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OfflineBanner;
