import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { Subscription, Insight } from '../types';
import { subMonths, isSameMonth, isSameYear, format, differenceInDays, parseISO, startOfWeek, addDays, subWeeks } from 'date-fns';
import {  SubscriptionFormData } from '../types';


// --- NEW: Define plan limits in one place ---
const PLAN_LIMITS = {
    'Free Starter': 10,
    'Individual': 30,
    'Family': 12, // Per person, but we'll handle the total limit here for simplicity
};

/**
 * Add a new subscription with plan limit checks.
 */
export const addSubscription = async (subscriptionData: SubscriptionFormData): Promise<Subscription> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // --- NEW: Security Check ---
  // 1. Fetch the user's profile and their current subscription count in parallel
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('subscription_plan')
    .eq('id', user.id)
    .single();

  const { count, error: countError } = await supabase
    .from('subscriptions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_active', true);

  if (profileError || countError) throw profileError || countError;

  // 2. Check if the user has reached their limit
  const plan = profile?.subscription_plan || 'Free Starter';
  const limit = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS];
  const currentCount = count || 0;

  if (currentCount >= limit) {
      throw new Error(`You have reached your limit of ${limit} subscriptions for the ${plan} plan. Please upgrade.`);
  }

  // 3. If the check passes, proceed to add the subscription
  // ... (rest of the addSubscription function remains the same)
  const { data, error } = await supabase
    .from('subscriptions')
    .insert([{ ...subscriptionData, user_id: user.id }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

// A default, empty state for analytics to prevent crashes during initial load
const initialAnalytics = {
  totalMonthlyCost: 0,
  lastMonthCost: 0,
  upcomingRenewals: [],
  categoryBreakdown: {},
  historicalData: [],
  largestIncrease: null,
  biggestSaving: null,
  mindfulStreak: 0,
  subscriptionOfTheMonth: null,
  lowValueSubs: [],
  recommendations: [],
  lastWeekCost: 0,
};

export const useSubscriptions = (filters: any) => {
  const [allSubscriptions, setAllSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSubscriptions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated.");
      const { data, error } = await supabase.from('subscriptions').select('*').eq('user_id', user.id);
      if (error) throw error;
      setAllSubscriptions((data as Subscription[]) || []);
    } catch (err: any) {
      setError(err);
      console.error("Failed to fetch subscriptions:", err); // Keep this for actual error logging
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

 useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  // This is the filtered and sorted list for display
  const subscriptions = useMemo(() => {
    // --- FIX: This is the critical change. Start by only showing active subscriptions. ---
    let filtered = allSubscriptions.filter(s => s.is_active);

    // Then, apply the user's filters to the active list
    if (filters.search) {
      filtered = filtered.filter(s => s.name.toLowerCase().includes(filters.search.toLowerCase()));
    }
    if (filters.category !== 'all') {
      filtered = filtered.filter(s => s.category === filters.category);
    }
    if (filters.billing_cycle !== 'all') {
      filtered = filtered.filter(s => s.billing_cycle === filters.billing_cycle);
    }
    if (filters.price_min > 0 || filters.price_max < 1000) { // Assuming 1000 is the max
        filtered = filtered.filter(s => s.cost >= filters.price_min && s.cost <= filters.price_max);
    }

    // Finally, sort the filtered list
    switch (filters.sort_by) {
      case 'cost_desc':
        filtered.sort((a, b) => b.cost - a.cost);
        break;
      case 'cost_asc':
        filtered.sort((a, b) => a.cost - b.cost);
        break;
      case 'name_asc':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'renewal_date_asc':
      default:
        filtered.sort((a, b) => new Date(a.next_renewal_date).getTime() - new Date(b.next_renewal_date).getTime());
        break;
    }

    return filtered;
  }, [allSubscriptions, filters]);

  // This performs all analytics calculations on the complete dataset
  const analytics = useMemo(() => {
    if (allSubscriptions.length === 0) return initialAnalytics;

    const activeSubs = allSubscriptions.filter(s => s.is_active);
    const now = new Date();
    
    const getMonthlyCost = (sub: Subscription) => {
        if (sub.billing_cycle === 'monthly') return sub.cost;
        if (sub.billing_cycle === 'yearly') return sub.cost / 12;
        if (sub.billing_cycle === 'weekly') return (sub.cost * 52) / 12;
        return 0;
    };

    const totalMonthlyCost = activeSubs.reduce((total, sub) => total + getMonthlyCost(sub), 0);

    const lastMonthDate = subMonths(now, 1);
    const lastMonthCost = allSubscriptions.filter(s => {
        const createdAt = new Date(s.created_at);
        return isSameMonth(createdAt, lastMonthDate) && isSameYear(createdAt, lastMonthDate);
    }).reduce((total, sub) => total + getMonthlyCost(sub), 0);
    
    const upcomingRenewals = activeSubs.filter(sub => {
        const daysUntil = differenceInDays(parseISO(sub.next_renewal_date), now);
        return daysUntil >= 0 && daysUntil <= 7;
    });
    
    const lastWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
    const lastWeekEnd = addDays(lastWeekStart, 6);
    const lastWeekCost = allSubscriptions.filter(s => {
        const renewalDate = parseISO(s.next_renewal_date);
        return renewalDate >= lastWeekStart && renewalDate <= lastWeekEnd;
    }).reduce((sum, sub) => sum + sub.cost, 0);

    const categoryBreakdown = activeSubs.reduce((acc, sub) => {
        acc[sub.category] = (acc[sub.category] || 0) + getMonthlyCost(sub);
        return acc;
    }, {} as Record<string, number>);

    const historicalData = Array.from({ length: 6 }).map((_, i) => {
        const month = subMonths(now, 5 - i);
        const cost = allSubscriptions.filter(s => new Date(s.created_at) <= month).reduce((total, sub) => total + getMonthlyCost(sub), 0);
        return { name: format(month, 'MMM'), cost };
    });

    const largestIncrease = activeSubs.filter(s => s.price_history && s.price_history.length > 0).map(s => ({ ...s, increase: s.cost - s.price_history![0].cost })).sort((a, b) => b.increase - a.increase)[0] || null;
    const biggestSaving = allSubscriptions.filter(s => !s.is_active && s.cancellation_date).sort((a, b) => getMonthlyCost(b) - getMonthlyCost(a))[0] || null;

    let mindfulStreak = 0;
    for (let i = 0; i < 12; i++) {
        const monthToCheck = subMonths(now, i);
        if (allSubscriptions.some(s => isSameMonth(new Date(s.created_at), monthToCheck))) mindfulStreak++;
        else break;
    }

    const subscriptionOfTheMonth = [...activeSubs].filter(s => s.value_rating).sort((a, b) => b.value_rating! - a.value_rating!)[0] || null;
    const lowValueSubs = activeSubs.filter(s => s.value_rating && s.value_rating <= 2);

    const recommendations: Insight[] = [];
    const categoryCounts = activeSubs.reduce((acc, sub) => {
        acc[sub.category] = (acc[sub.category] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    activeSubs.forEach(sub => {
        const monthlyCost = getMonthlyCost(sub);
        if (sub.value_rating && sub.value_rating <= 2) {
            recommendations.push({ id: `${sub.id}-low`, subscription: sub, type: 'low_value', title: 'Low Value', reason: `You rated this ${sub.value_rating}/5 stars.`, potential_savings: monthlyCost });
        }
        if (sub.last_used_date && differenceInDays(now, parseISO(sub.last_used_date)) > 30) {
             recommendations.push({ id: `${sub.id}-unused`, subscription: sub, type: 'underutilized', title: 'Underutilized', reason: `Not used in over a month.`, potential_savings: monthlyCost });
        }
        if (sub.price_history && sub.price_history.length > 0 && sub.cost > sub.price_history[0].cost) {
            recommendations.push({ id: `${sub.id}-price`, subscription: sub, type: 'price_increase', title: 'Price Increase', reason: `Price increased from $${sub.price_history[0].cost}.`, potential_savings: 0 });
        }
        if (categoryCounts[sub.category] > 1 && !recommendations.some(i => i.type === 'duplicate_category' && i.subscription.category === sub.category)) {
            recommendations.push({ id: `${sub.id}-dupe`, subscription: sub, type: 'duplicate_category', title: 'Duplicate Category', reason: `You have multiple subs in '${sub.category}'.`, potential_savings: 0 });
        }
    });


    return { totalMonthlyCost, lastMonthCost, upcomingRenewals, categoryBreakdown, historicalData, largestIncrease, biggestSaving, mindfulStreak, subscriptionOfTheMonth, lowValueSubs, recommendations, lastWeekCost };
  }, [allSubscriptions]);

  return { subscriptions, allSubscriptions, loading, error, refreshSubscriptions: fetchSubscriptions, analytics };
};
export const getSubscriptionById = async (id: string): Promise<Subscription | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("User not authenticated.");

  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id) // Security: Ensure user can only fetch their own subs
    .single();

  if (error) {
    // Gracefully handle 'not found' as null instead of an error
    if (error.code === 'PGRST116') return null; 
    throw error;
  }
  
  return data as Subscription;
};
