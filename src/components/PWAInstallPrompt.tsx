import React, { useState, useEffect, useCallback } from 'react';
import { Download, X, Smartphone, Clock, Share } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Types ---
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// --- Reusable Hook for PWA Install Logic ---
const usePwaInstall = () => {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detect if the user is on an iOS device
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    // Check if it's a standalone PWA on iOS
    const isStandalone = 'standalone' in window.navigator && (window.navigator as any).standalone;
    
    // The prompt event is not supported on iOS, so we show a custom guide
    if (isIOSDevice && !isStandalone) {
      setIsIOS(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const install = useCallback(() => {
    if (!prompt) return;
    prompt.prompt();
    prompt.userChoice.then(() => {
      setPrompt(null);
    });
  }, [prompt]);

  return { canInstall: !!prompt || isIOS, install, isIOS };
};


const PWAInstallPrompt: React.FC = () => {
  const { canInstall, install, isIOS } = usePwaInstall();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const isInstalled = window.matchMedia('(display-mode: standalone)').matches;
    const snoozedUntil = localStorage.getItem('pwa-prompt-snoozed');
    
    if (isInstalled || (snoozedUntil && new Date().getTime() < parseInt(snoozedUntil))) {
      return;
    }

    if (canInstall) {
      const timer = setTimeout(() => setIsVisible(true), 10000);
      return () => clearTimeout(timer);
    }
  }, [canInstall]);

  const handleInstallClick = () => {
    install();
    setIsVisible(false);
  };

  const handleSnooze = () => {
    const oneWeekFromNow = new Date().getTime() + 7 * 24 * 60 * 60 * 1000;
    localStorage.setItem('pwa-prompt-snoozed', oneWeekFromNow.toString());
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50"
        >
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-4">
            <div className="flex items-start space-x-3">
              <div className="bg-indigo-100 p-2 rounded-lg mt-1">
                <Smartphone className="w-5 h-5 text-indigo-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">Get the SubAudit App</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Enjoy a faster, full-screen experience with offline access.
                </p>
                {/* --- NEW: Platform-Specific UI --- */}
                {isIOS ? (
                    <div className="text-sm bg-gray-100 p-2 rounded-md">
                        <p>To install, tap the <Share className="inline w-4 h-4 mx-1"/> Share icon and then <strong>'Add to Home Screen'</strong>.</p>
                    </div>
                ) : (
                    <div className="flex items-center space-x-2">
                        <button onClick={handleInstallClick} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center space-x-1.5">
                            <Download className="w-4 h-4" /><span>Install</span>
                        </button>
                        <button onClick={handleSnooze} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 flex items-center space-x-1.5">
                            <Clock className="w-4 h-4" /><span>Not Now</span>
                        </button>
                    </div>
                )}
              </div>
              <button onClick={() => setIsVisible(false)} className="text-gray-400 hover:text-gray-600 p-1"><X className="w-4 h-4" /></button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PWAInstallPrompt;
