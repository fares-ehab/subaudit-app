import { useState, useCallback } from 'react';
import { analyzeTransactionsForSubscriptions } from '../lib/plaid';
import { addSubscription } from '../lib/subscriptions';
import { DetectedSubscription } from '../types';
import { toast } from 'react-hot-toast';

export const useBankIntegration = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [detectedSubscriptions, setDetectedSubscriptions] = useState<DetectedSubscription[]>([]);
  const [importStatus, setImportStatus] = useState<Record<string, 'importing' | 'imported'>>({});

  const connectBankAccount = useCallback(async () => {
    setIsLoading(true);
    setDetectedSubscriptions([]);
    setImportStatus({});
    try {
      const detected = await analyzeTransactionsForSubscriptions();
      setDetectedSubscriptions(detected);
      if (detected.length > 0) {
        toast.success(`Found ${detected.length} potential subscriptions!`);
      } else {
        toast.info('No new recurring subscriptions were detected.');
      }
    } catch (error) {
      toast.error('Failed to connect bank account.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const importSubscription = useCallback(async (sub: DetectedSubscription) => {
    setImportStatus(prev => ({ ...prev, [sub.merchant_name]: 'importing' }));
    try {
      const nextRenewal = new Date(sub.last_payment_date);
      if (sub.frequency === 'monthly') nextRenewal.setMonth(nextRenewal.getMonth() + 1);
      if (sub.frequency === 'yearly') nextRenewal.setFullYear(nextRenewal.getFullYear() + 1);
      if (sub.frequency === 'weekly') nextRenewal.setDate(nextRenewal.getDate() + 7);

      await addSubscription({
        name: sub.merchant_name,
        cost: sub.amount,
        billing_cycle: sub.frequency,
        next_renewal_date: nextRenewal.toISOString().split('T')[0],
        category: sub.category,
        currency: 'USD', // Default currency
        is_trial: false,
      });

      setImportStatus(prev => ({ ...prev, [sub.merchant_name]: 'imported' }));
      toast.success(`${sub.merchant_name} imported successfully!`);

      // Give a moment for the user to see the "Imported" status before removing
      setTimeout(() => {
          setDetectedSubscriptions(prev => prev.filter(d => d.merchant_name !== sub.merchant_name));
      }, 1200);

    } catch (error: any) {
      toast.error(error.message || `Failed to import ${sub.merchant_name}`);
      setImportStatus(prev => {
          const newStatus = { ...prev };
          delete newStatus[sub.merchant_name];
          return newStatus;
      });
    }
  }, []);

  return {
    isLoading,
    detectedSubscriptions,
    importStatus,
    connectBankAccount,
    importSubscription,
  };
};
