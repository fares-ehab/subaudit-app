/**
 * Smart Notifications with ML-based Usage Pattern Analysis
 * 
 * This module analyzes user behavior patterns to provide intelligent
 * renewal recommendations beyond simple date-based notifications.
 */

import { supabase } from './supabase';
import { Subscription } from '../types';
import { differenceInDays, parseISO } from 'date-fns';

export interface UsagePattern {
  subscription_id: string;
  usage_frequency: 'daily' | 'weekly' | 'monthly' | 'rarely' | 'never';
  value_trend: 'increasing' | 'stable' | 'decreasing';
  cost_per_use: number;
  recommendation: 'keep' | 'review' | 'cancel';
  confidence: number;
  reasons: string[];
}

export interface SmartNotification {
  subscription_id: string;
  type: 'high_value' | 'low_value' | 'unused' | 'expensive' | 'duplicate';
  priority: 'high' | 'medium' | 'low';
  message: string;
  action_recommended: 'keep' | 'cancel' | 'downgrade' | 'review';
  confidence: number;
}

/**
 * Analyze usage patterns for all user subscriptions
 * Uses ML-like algorithms to determine subscription value
 */
export const analyzeUsagePatterns = async (): Promise<UsagePattern[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Get all user subscriptions with ratings and usage data
    const { data: subscriptions, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (error) throw error;
    if (!subscriptions) return [];

    const patterns: UsagePattern[] = [];

    for (const subscription of subscriptions) {
      const pattern = await analyzeSubscriptionPattern(subscription);
      patterns.push(pattern);
    }

    return patterns;
  } catch (error) {
    console.error('Error analyzing usage patterns:', error);
    return [];
  }
};

/**
 * Analyze individual subscription usage pattern
 */
const analyzeSubscriptionPattern = async (subscription: Subscription): Promise<UsagePattern> => {
  // Calculate usage frequency based on last_used_date
  const usageFrequency = calculateUsageFrequency(subscription);
  
  // Analyze value trend based on rating history
  const valueTrend = analyzeValueTrend(subscription);
  
  // Calculate cost per use
  const costPerUse = calculateCostPerUse(subscription);
  
  // Generate recommendation using ML-like decision tree
  const { recommendation, confidence, reasons } = generateRecommendation(
    subscription,
    usageFrequency,
    valueTrend,
    costPerUse
  );

  return {
    subscription_id: subscription.id,
    usage_frequency: usageFrequency,
    value_trend: valueTrend,
    cost_per_use: costPerUse,
    recommendation,
    confidence,
    reasons
  };
};

/**
 * Calculate usage frequency based on last_used_date
 */
const calculateUsageFrequency = (subscription: Subscription): 'daily' | 'weekly' | 'monthly' | 'rarely' | 'never' => {
  if (!subscription.last_used_date) return 'never';
  
  const daysSinceLastUse = differenceInDays(new Date(), parseISO(subscription.last_used_date));
  
  if (daysSinceLastUse <= 1) return 'daily';
  if (daysSinceLastUse <= 7) return 'weekly';
  if (daysSinceLastUse <= 30) return 'monthly';
  if (daysSinceLastUse <= 90) return 'rarely';
  return 'never';
};

/**
 * Analyze value trend based on rating and usage patterns
 */
const analyzeValueTrend = (subscription: Subscription): 'increasing' | 'stable' | 'decreasing' => {
  // In a real ML implementation, this would analyze historical ratings
  // For now, we'll use simple heuristics
  
  if (!subscription.value_rating) return 'stable';
  
  const rating = subscription.value_rating;
  const daysSinceCreated = differenceInDays(new Date(), parseISO(subscription.created_at));
  
  // High rating + recent creation = increasing value
  if (rating >= 4 && daysSinceCreated <= 30) return 'increasing';
  
  // Low rating = decreasing value
  if (rating <= 2) return 'decreasing';
  
  // Default to stable
  return 'stable';
};

/**
 * Calculate cost per use based on usage frequency and subscription cost
 */
const calculateCostPerUse = (subscription: Subscription): number => {
  if (!subscription.last_used_date) return Infinity;
  
  const daysSinceLastUse = differenceInDays(new Date(), parseISO(subscription.last_used_date));
  
  // Estimate monthly usage based on frequency
  let monthlyUses = 0;
  if (daysSinceLastUse <= 1) monthlyUses = 30; // Daily use
  else if (daysSinceLastUse <= 7) monthlyUses = 4; // Weekly use
  else if (daysSinceLastUse <= 30) monthlyUses = 1; // Monthly use
  else monthlyUses = 0.1; // Rarely used
  
  // Convert subscription cost to monthly
  let monthlyCost = subscription.cost;
  if (subscription.billing_cycle === 'yearly') monthlyCost = subscription.cost / 12;
  if (subscription.billing_cycle === 'weekly') monthlyCost = subscription.cost * 4.33;
  
  return monthlyUses > 0 ? monthlyCost / monthlyUses : Infinity;
};

/**
 * Generate ML-like recommendation using decision tree logic
 */
const generateRecommendation = (
  subscription: Subscription,
  usageFrequency: string,
  valueTrend: string,
  costPerUse: number
): { recommendation: 'keep' | 'review' | 'cancel'; confidence: number; reasons: string[] } => {
  const reasons: string[] = [];
  let score = 0;
  
  // Usage frequency scoring
  switch (usageFrequency) {
    case 'daily':
      score += 40;
      reasons.push('Used daily - high engagement');
      break;
    case 'weekly':
      score += 30;
      reasons.push('Used weekly - good engagement');
      break;
    case 'monthly':
      score += 15;
      reasons.push('Used monthly - moderate engagement');
      break;
    case 'rarely':
      score -= 10;
      reasons.push('Rarely used - low engagement');
      break;
    case 'never':
      score -= 30;
      reasons.push('Never used - no engagement');
      break;
  }
  
  // Value rating scoring
  if (subscription.value_rating) {
    const ratingScore = (subscription.value_rating - 3) * 10;
    score += ratingScore;
    
    if (subscription.value_rating >= 4) {
      reasons.push('High user rating - valuable service');
    } else if (subscription.value_rating <= 2) {
      reasons.push('Low user rating - questionable value');
    }
  }
  
  // Cost per use scoring
  if (costPerUse < 1) {
    score += 20;
    reasons.push('Excellent cost per use ratio');
  } else if (costPerUse < 5) {
    score += 10;
    reasons.push('Good cost per use ratio');
  } else if (costPerUse > 20) {
    score -= 20;
    reasons.push('High cost per use - expensive for usage');
  }
  
  // Value trend scoring
  switch (valueTrend) {
    case 'increasing':
      score += 15;
      reasons.push('Value trend is increasing');
      break;
    case 'decreasing':
      score -= 15;
      reasons.push('Value trend is decreasing');
      break;
  }
  
  // Generate recommendation based on score
  let recommendation: 'keep' | 'review' | 'cancel';
  let confidence: number;
  
  if (score >= 40) {
    recommendation = 'keep';
    confidence = Math.min(0.9, score / 50);
    reasons.push('Strong indicators suggest keeping this subscription');
  } else if (score >= 10) {
    recommendation = 'review';
    confidence = 0.7;
    reasons.push('Mixed signals - review usage and value');
  } else {
    recommendation = 'cancel';
    confidence = Math.min(0.9, Math.abs(score) / 30);
    reasons.push('Multiple indicators suggest canceling');
  }
  
  return { recommendation, confidence, reasons };
};

/**
 * Generate smart notifications based on usage patterns
 */
export const generateSmartNotifications = async (): Promise<SmartNotification[]> => {
  try {
    const patterns = await analyzeUsagePatterns();
    const notifications: SmartNotification[] = [];
    
    for (const pattern of patterns) {
      const notification = createNotificationFromPattern(pattern);
      if (notification) {
        notifications.push(notification);
      }
    }
    
    // Sort by priority and confidence
    return notifications.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.confidence - a.confidence;
    });
    
  } catch (error) {
    console.error('Error generating smart notifications:', error);
    return [];
  }
};

/**
 * Create notification from usage pattern analysis
 */
const createNotificationFromPattern = (pattern: UsagePattern): SmartNotification | null => {
  const { subscription_id, usage_frequency, cost_per_use, recommendation, confidence, reasons } = pattern;
  
  // High-value subscription notification
  if (recommendation === 'keep' && confidence > 0.8) {
    return {
      subscription_id,
      type: 'high_value',
      priority: 'low',
      message: `This subscription provides excellent value based on your usage patterns.`,
      action_recommended: 'keep',
      confidence
    };
  }
  
  // Unused subscription notification
  if (usage_frequency === 'never' || usage_frequency === 'rarely') {
    return {
      subscription_id,
      type: 'unused',
      priority: 'high',
      message: `You haven't used this service recently. Consider canceling to save money.`,
      action_recommended: 'cancel',
      confidence
    };
  }
  
  // Expensive per use notification
  if (cost_per_use > 20) {
    return {
      subscription_id,
      type: 'expensive',
      priority: 'medium',
      message: `This subscription costs $${cost_per_use.toFixed(2)} per use. Consider if it's worth the cost.`,
      action_recommended: 'review',
      confidence
    };
  }
  
  // Low value notification
  if (recommendation === 'cancel' && confidence > 0.7) {
    return {
      subscription_id,
      type: 'low_value',
      priority: 'high',
      message: `Multiple factors suggest this subscription may not be worth keeping.`,
      action_recommended: 'cancel',
      confidence
    };
  }
  
  return null;
};

/**
 * Update usage tracking when user interacts with a service
 * This would be called from various parts of the app
 */
export const trackServiceUsage = async (subscriptionId: string) => {
  try {
    const { error } = await supabase
      .from('subscriptions')
      .update({ 
        last_used_date: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString()
      })
      .eq('id', subscriptionId);
      
    if (error) throw error;
    
    console.log(`Usage tracked for subscription: ${subscriptionId}`);
  } catch (error) {
    console.error('Error tracking usage:', error);
  }
};