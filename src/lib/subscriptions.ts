// src/services/subscriptionService.ts
import { supabase } from "./supabase";
import { Database } from "../types/supabase";
import { addYears, addWeeks, addMonths } from "date-fns";

// Use Supabase-generated types
export type Subscription = Database["public"]["Tables"]["subscriptions"]["Row"];
export type SubscriptionInsert = Database["public"]["Tables"]["subscriptions"]["Insert"];
export type SubscriptionUpdate = Database["public"]["Tables"]["subscriptions"]["Update"];

// --- Input sanitization helper ---
const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, ""); // Prevent basic script injection
};

// --- Check for duplicate active subscriptions ---
const checkDuplicateSubscription = async (
  name: string,
  userId: string
): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("user_id", userId)
      .eq("is_active", true)
      .ilike("name", name.trim());

    if (error) throw error;
    return (data?.length || 0) > 0;
  } catch (error) {
    console.error("Error checking duplicate subscription:", error);
    return false; // Fail safe
  }
};

/**
 * Get all subscriptions for the current user
 */
export const getSubscriptions = async (): Promise<Subscription[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id);

    if (error) throw error;
    // This requires a type assertion because the auto-generated types might be slightly different
    return (data as Subscription[]) || [];
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    throw error instanceof Error ? error : new Error("Failed to fetch subscriptions");
  }
};

export const getSubscriptionById = async (id: string): Promise<Subscription | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("User not authenticated.");

  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data as Subscription;
};

// --- Plan Limits Definition ---
const PLAN_LIMITS = {
    'Free Starter': 10,
    'Individual': 30,
    'Family': 50,
};

/**
 * Add a new subscription with validation and plan limit checking.
 */
export const addSubscription = async (
  subscriptionData: Omit<SubscriptionInsert, "user_id" | "is_active">
): Promise<Subscription> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    // Check plan limits first
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('subscription_plan')
      .eq('id', user.id)
      .single();

    if (profileError) throw profileError;

     const { count, error: countError } = await supabase
      .from('subscriptions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_active', true);
      
    if (countError) throw countError;

    const plan = profile?.subscription_plan || 'Free Starter';
    const limit = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS];
    const currentCount = count || 0;

    if (currentCount >= limit) {
      throw new Error(`You have reached your limit of ${limit} subscriptions for the ${plan} plan. Please upgrade to add more.`);
    }

    // Proceed with validation and insertion
    const sanitizedName = sanitizeInput(subscriptionData.name ?? "");
    if (!sanitizedName || sanitizedName.length < 2) {
      throw new Error("Subscription name must be at least 2 characters long");
    }
    if ((subscriptionData.cost ?? 0) <= 0) {
      throw new Error("Cost must be greater than 0");
    }

    const isDuplicate = await checkDuplicateSubscription(sanitizedName, user.id);
    if (isDuplicate) {
      throw new Error(`You already have an active subscription for "${sanitizedName}"`);
    }

    const { data, error } = await supabase
      .from("subscriptions")
      .insert([
        {
          ...subscriptionData,
          name: sanitizedName,
          category: sanitizeInput(subscriptionData.category ?? "Other"),
          user_id: user.id,
          is_active: true,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error adding subscription:", error);
    throw error instanceof Error ? error : new Error("Failed to add subscription");
  }
};


/**
 * Update an existing subscription.
 */
export const updateSubscription = async (
  id: string,
  updates: SubscriptionUpdate
): Promise<Subscription> => {
  const { data, error } = await supabase
    .from("subscriptions")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Cancel a subscription (soft delete).
 */
export const cancelSubscription = async (id: string): Promise<Subscription> => {
  return updateSubscription(id, {
    is_active: false,
    cancellation_date: new Date().toISOString(),
  });
};

/**
 * Update a subscription's value rating and other details.
 */
export const updateSubscriptionRating = async (
  id: string, rating: number, lastUsedDate?: string, notes?: string, cancellationReason?: string
): Promise<Subscription> => {
  if (rating < 1 || rating > 5) {
    throw new Error("Rating must be between 1 and 5");
  }
  return updateSubscription(id, {
    value_rating: rating,
    last_used_date: lastUsedDate || new Date().toISOString(),
    notes: notes,
    cancellation_reason: cancellationReason
  });
};

/**
 * Bulk update multiple subscriptions
 */
export const bulkUpdateSubscriptions = async (
  ids: string[],
  updates: SubscriptionUpdate
): Promise<void> => {
  if (!ids || ids.length === 0) {
    return; // Do nothing if no IDs are provided
  }
  const { error } = await supabase
    .from("subscriptions")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .in("id", ids);

  if (error) throw error;
};

/**
 * Renew a subscription by updating its next renewal date.
 */
export const renewSubscription = async (subscription: Subscription): Promise<Subscription> => {
  const currentRenewal = new Date(subscription.next_renewal_date);
  let nextRenewal: Date;

  if (subscription.billing_cycle === 'monthly') {
    nextRenewal = addMonths(currentRenewal, 1);
  } else if (subscription.billing_cycle === 'yearly') {
    nextRenewal = addYears(currentRenewal, 1);
  } else if (subscription.billing_cycle === 'weekly') {
    nextRenewal = addWeeks(currentRenewal, 1);
  } else {
    throw new Error("Invalid billing cycle.");
  }

  return updateSubscription(subscription.id, {
    next_renewal_date: nextRenewal.toISOString().split('T')[0]
  });
};