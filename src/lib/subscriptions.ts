// src/services/subscriptionService.ts
import { supabase } from "./supabase";
import { Database } from "../types/supabase"; 
import { addYears, addWeeks, addMonths } from "date-fns";

// ✅ Use Supabase-generated types
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
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id);

    if (error) throw error;

    return data || [];
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
    if (error.code === 'PGRST116') return null; // Handle 'not found' gracefully
    throw error;
  }
  return data as Subscription;
};
/**
 * Add a new subscription with validation and duplicate checking.
 */
export const addSubscription = async (
  subscriptionData: Omit<SubscriptionInsert, "user_id" | "is_active">
): Promise<Subscription> => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const sanitizedName = sanitizeInput(subscriptionData.name ?? "");
    if (!sanitizedName || sanitizedName.length < 2) {
      throw new Error("Subscription name must be at least 2 characters long");
    }
    if ((subscriptionData.cost ?? 0) <= 0) {
      throw new Error("Cost must be greater than 0");
    }

    const isDuplicate = await checkDuplicateSubscription(sanitizedName, user.id);
    if (isDuplicate) {
      throw new Error(
        `You already have an active subscription for "${sanitizedName}"`
      );
    }

    const { data, error } = await supabase
      .from("subscriptions")
      .insert([
        {
          ...subscriptionData,
          name: sanitizedName,
          category: sanitizeInput(subscriptionData.category ?? ""),
          user_id: user.id,
          is_active: true,
        } satisfies SubscriptionInsert,
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
 * Update a subscription's value rating and last used date.
 * (make sure these columns exist in your DB!)
 */
export const updateSubscriptionRating = async (
id: string, rating: number, lastUsedDate?: string, notes?: string, cancellationReason?: string): Promise<Subscription> => {
  if (rating < 1 || rating > 5) {
    throw new Error("Rating must be between 1 and 5");
  }

  return updateSubscription(id, {
    value_rating: rating,
    last_used_date: lastUsedDate ?? new Date().toISOString(),
  });
};

/**
 * Bulk update multiple subscriptions
 */
export const bulkUpdateSubscriptions = async (
  ids: string[],
  updates: SubscriptionUpdate
): Promise<void> => {
  if (!ids.length) {
    throw new Error("No subscriptions selected for update");
  }

  const { error } = await supabase
    .from("subscriptions")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .in("id", ids);

  if (error) throw error;
};

export const renewSubscription = async (subscription: Subscription): Promise<Subscription> => {
  const currentRenewal = new Date(subscription.next_renewal_date);
  let nextRenewal: Date;

  // Calculate the next renewal date
  if (subscription.billing_cycle === 'monthly') {
    nextRenewal = addMonths(currentRenewal, 1);
  } else if (subscription.billing_cycle === 'yearly') {
    nextRenewal = addYears(currentRenewal, 1);
  } else if (subscription.billing_cycle === 'weekly') {
    nextRenewal = addWeeks(currentRenewal, 7);
  } else {
    throw new Error("Invalid billing cycle.");
  }

  const { data, error } = await supabase
    .from('subscriptions')
    .update({ 
        next_renewal_date: nextRenewal.toISOString().split('T')[0],
        updated_at: new Date().toISOString()
    })
    .eq('id', subscription.id)
    .select()
    .single();

  if (error) throw error;
  return data;
};


