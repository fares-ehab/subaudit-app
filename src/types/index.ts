// --- Core Data Structures ---

import { ReactNode } from "react";

export interface Subscription {
  id: string;
  name: string;
  cost: number;
  billing_cycle: "weekly" | "monthly" | "yearly";
  next_renewal_date: string;
  category: string;
  is_trial: boolean;
  currency: string;
  is_paused?: boolean;
  is_active: boolean;
  cancellation_date?: string | null;
  is_favorite?: boolean; 
  last_used_date?: string | null;
  value_rating?: number | null;
  created_at: string; 
  updated_at?: string;
  cancellation_reason?: string;
  notes?: string;
  price_history?: { date: string; cost: number }[];
}

export interface SubscriptionFormData {
  id: string;
  name: string;
  cost: number;
  category: string;
  billing_cycle: "weekly" | "monthly" | "yearly";
  start_date: string;
  renewal_date: string;
  is_active: boolean;
  is_paused?: boolean;   // 👈 NEW
  cancellation_date?: string;
   last_used_date?: string | null;
}

// --- Family Sharing ---

export interface FamilyGroup {
  members: any;
  id: string;
  name: string;
  created_by: string;
}

export interface FamilyMember {
  email: ReactNode;
  id: string;
  user_id: string;
  user_email?: string; // Joined from another table
  role: 'admin' | 'member' | 'viewer';
  joined_at: string;
}

// --- FIX: Added FamilyInvite type ---
export interface FamilyInvite {
    id: string;
    email: string;
    role: 'admin' | 'member' | 'viewer';
    sent_at: string;
}

// --- Notifications & Insights ---

export interface Notification {
  id: string;
  user_id: string;
  created_at: string;
  type: 'renewal' | 'insight' | 'announcement';
  title: string;
  message: string;
  is_read: boolean;
  action_url?: string;
}

// --- FIX: Added NotificationLog type ---
export interface NotificationLog {
    id: string;
    subscription_id: string;
    user_id: string;
    notification_type: 'renewal_reminder' | 'value_check';
    sent_at: string;
    user_response?: 'keep' | 'cancel';
    response_at?: string;
    subscriptions?: Subscription; // For joined data
}

// --- Bank Integration ---

export interface DetectedSubscription {
  id: string;
  merchant_name: string;
  amount: number;
  frequency: 'weekly' | 'monthly' | 'yearly';
  category: string;
  confidence: number;
  last_payment_date: string;
  transactions: any[]; // Can be more specific if needed
}
// types.ts
export interface SubscriptionUpdate {
  name?: string;
  cost?: number;
  billing_cycle?: "weekly" | "monthly" | "yearly";
  category?: string;
  next_renewal_date?: string;
  last_used_date?: string;
  value_rating?: number;
  cancellation_date?: string;
  is_active?: boolean;  // ✅ allowed here for updates
}
// --- FIX: Added the missing Insight type ---
export interface Insight {
    id: string;
    subscription: Subscription; // Contains the full subscription object
    type: 'low_value' | 'underutilized' | 'price_increase' | 'duplicate_category';
    title: string;
    reason: string;
    potential_savings: number;
}
export interface SmartRecommendation {
  id: string;
  subscription_id: string;
  type: 'low_value' | 'underutilized' | 'price_increase' | 'duplicate_category';
  priority: 'high' | 'medium' | 'low';
  title: string;
  message: string;
  action_recommended: 'cancel' | 'review' | 'keep';
  confidence: number;
  reasoning: {
    last_used_date: string;
    usage_frequency: 'low' | 'medium' | 'high';
    cost_per_use: number | null; };
}