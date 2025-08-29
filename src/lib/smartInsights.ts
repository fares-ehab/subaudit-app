import { supabase } from './supabase';
import { Subscription, SmartRecommendation } from '../types';

/**
 * Fetches all active subscriptions for the current user.
 * This is a helper for the analysis functions.
 */
const getActiveSubscriptions = async (userId: string): Promise<Subscription[]> => {
    const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true);
    if (error) throw error;
    return data || [];
};

/**
 * Analyzes subscriptions to find smart recommendations.
 * In a real-world app, this could be a complex call to a machine learning model.
 * Here, we simulate the analysis with logic.
 */
export const generateSmartRecommendations = async (): Promise<SmartRecommendation[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const subscriptions = await getActiveSubscriptions(user.id);
    const recommendations: SmartRecommendation[] = [];

    // --- Simulation of AI Logic ---

    // 1. Find underutilized subscriptions (low value rating)
    const lowValueSubs = subscriptions.filter(s => s.value_rating && s.value_rating <= 2);
    lowValueSubs.forEach(sub => {
        recommendations.push({
            id: `rec-${sub.id}-low-value`,
            subscription_id: sub.id,
            priority: 'high',
            title: `Consider Canceling ${sub.name}`,
            message: `You rated this subscription ${sub.value_rating}/5 stars. Canceling it could save you money.`,
            action_recommended: 'cancel',
            confidence: 0.90,
            reasoning: {
                last_used_date: '',
                usage_frequency: 'high',
                cost_per_use: null
            }
        });
    });

    // 2. Find duplicate categories
    const categoryCounts = subscriptions.reduce((acc, sub) => {
        acc[sub.category] = (acc[sub.category] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    Object.entries(categoryCounts).forEach(([category, count]) => {
        if (count > 1) {
            const sub = subscriptions.find(s => s.category === category);
            if (sub) {
                recommendations.push({
                    id: `rec-${sub.id}-duplicate`,
                    subscription_id: sub.id,
                    priority: 'medium',
                    title: `Review ${category} Category`,
                    message: `You have ${count} subscriptions in this category. Could you consolidate them?`,
                    action_recommended: 'review',
                    confidence: 0.85,
                    reasoning: {
                        last_used_date: '',
                        usage_frequency: 'high',
                        cost_per_use: null
                    }
                });
            }
        }
    });
    
    // 3. Keep high-value subscriptions
    const highValueSubs = subscriptions.filter(s => s.value_rating && s.value_rating >= 4);
    highValueSubs.forEach(sub => {
        recommendations.push({
            id: `rec-${sub.id}-keep`,
            subscription_id: sub.id,
            priority: 'low',
            title: `Keep ${sub.name}`,
            message: "Your usage is consistent and provides good value for the cost.",
            action_recommended: 'keep',
            confidence: 0.98,
            reasoning: {
                last_used_date: '',
                usage_frequency: 'high',
                cost_per_use: null
            }
        });
    });

    return recommendations;
};
