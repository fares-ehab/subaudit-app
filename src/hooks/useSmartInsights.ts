import { useState, useEffect, useCallback } from 'react';
import { generateSmartRecommendations } from '../lib/smartInsights';
import { SmartRecommendation, Subscription } from '../types';
import { getSubscriptions } from '../lib/subscriptions'; // We need this to get subscription names
import { toast } from 'react-hot-toast';

export const useSmartInsights = () => {
  const [recommendations, setRecommendations] = useState<SmartRecommendation[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInsights = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch both recommendations and the full list of subscriptions in parallel
      const [recsData, subsData] = await Promise.all([
        generateSmartRecommendations(),
        getSubscriptions(),
      ]);
      setRecommendations(recsData);
      setSubscriptions(subsData);
    } catch (error) {
      toast.error("Failed to generate smart insights.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  const getSubscriptionById = (id: string): Subscription | undefined => {
    return subscriptions.find(sub => sub.id === id);
  };

  const dismissRecommendation = (id: string) => {
    setRecommendations(prev => prev.filter(rec => rec.id !== id));
    toast.success("Insight dismissed.");
  };

  const provideFeedback = (id: string, isHelpful: boolean) => {
    // In a real app, you would send this feedback to your analytics or AI model
    console.log(`Feedback for ${id}: ${isHelpful ? 'Helpful' : 'Not Helpful'}`);
    dismissRecommendation(id);
    toast.success("Thanks for your feedback!");
  };

  return {
    loading,
    recommendations,
    getSubscriptionById,
    dismissRecommendation,
    provideFeedback,
    refreshInsights: fetchInsights,
  };
};
