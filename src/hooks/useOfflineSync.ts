import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';

// In a real app, this queue would be managed by a more robust system
// like IndexedDB and a Service Worker.
let offlineActionQueue: any[] = [
    { type: 'ADD_SUBSCRIPTION', payload: { name: 'Pending Sub 1' } },
    { type: 'UPDATE_SUBSCRIPTION', payload: { id: 'xyz', cost: 12.99 } },
];

export const useOfflineSync = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing'>('idle');
  const [syncProgress, setSyncProgress] = useState({ current: 0, total: 0 });

  const processQueue = useCallback(async () => {
    if (offlineActionQueue.length === 0) return;

    setSyncStatus('syncing');
    const total = offlineActionQueue.length;
    setSyncProgress({ current: 0, total });

    for (let i = 0; i < total; i++) {
      // Simulate sending the action to the server
      await new Promise(resolve => setTimeout(resolve, 700));
      setSyncProgress({ current: i + 1, total });
    }

    offlineActionQueue = []; // Clear the queue
    setSyncStatus('idle');
    toast.success("All changes have been synced!");
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      processQueue();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    if (navigator.onLine) {
        processQueue();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [processQueue]);

  return { isOnline, syncStatus, syncProgress, queueCount: offlineActionQueue.length };
};
