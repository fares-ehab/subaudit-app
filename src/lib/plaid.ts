import { supabase } from './supabase';

// --- Types ---
export interface PlaidTransaction {
  account_id: string;
  amount: number;
  date: string;
  name: string;
  merchant_name?: string;
  category: string[];
  transaction_id: string;
}

export interface DetectedSubscription {
  merchant_name: string;
  amount: number;
  frequency: 'monthly' | 'yearly' | 'weekly';
  category: string;
  confidence: number;
  transactions: PlaidTransaction[];
  last_payment_date: string; // Added for consistency
}

/**
 * Simulates initializing Plaid Link for bank account connection.
 */
export const initializePlaidLink = async (): Promise<{ public_token: string }> => {
  console.log('🏦 Initializing Plaid Link (Demo Mode)');
  await new Promise(resolve => setTimeout(resolve, 1500));
  // In a real app, this token comes from the Plaid Link onSuccess callback
  return { public_token: 'fake-public-token-from-link' };
};

/**
 * Analyzes bank transactions to detect recurring subscriptions.
 */
export const analyzeTransactionsForSubscriptions = async (): Promise<DetectedSubscription[]> => {
  try {
    // In production, you would get transactions from your server after token exchange
    const sampleTransactions = getSampleTransactions();
    const detectedSubscriptions = detectRecurringPayments(sampleTransactions);
    return detectedSubscriptions;
  } catch (error) {
    console.error('Error analyzing transactions:', error);
    return [];
  }
};

/**
 * Pattern matching algorithm to detect recurring payments.
 */
const detectRecurringPayments = (transactions: PlaidTransaction[]): DetectedSubscription[] => {
  const merchantGroups: { [key: string]: PlaidTransaction[] } = {};
  
  transactions.forEach(transaction => {
    const merchant = transaction.merchant_name || transaction.name;
    if (!merchantGroups[merchant]) {
      merchantGroups[merchant] = [];
    }
    merchantGroups[merchant].push(transaction);
  });
  
  const detectedSubscriptions: DetectedSubscription[] = [];
  
  Object.entries(merchantGroups).forEach(([merchant, merchantTransactions]) => {
    if (merchantTransactions.length < 2) return;
    
    merchantTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    const amounts = merchantTransactions.map(t => Math.abs(t.amount));
    const uniqueAmounts = [...new Set(amounts)];
    
    if (uniqueAmounts.length <= 2) { // Allow for slight variations
      const avgAmount = amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length;
      
      const intervals: number[] = [];
      for (let i = 1; i < merchantTransactions.length; i++) {
        const daysDiff = Math.abs(
          (new Date(merchantTransactions[i].date).getTime() - new Date(merchantTransactions[i-1].date).getTime()) / (1000 * 60 * 60 * 24)
        );
        intervals.push(daysDiff);
      }
      
      const avgInterval = intervals.reduce((sum, int) => sum + int, 0) / intervals.length;
      let frequency: 'monthly' | 'yearly' | 'weekly' = 'monthly';
      let confidence = 0.5;
      
      if (avgInterval >= 28 && avgInterval <= 35) {
        frequency = 'monthly';
        confidence = 0.9;
      } else if (avgInterval >= 360 && avgInterval <= 370) {
        frequency = 'yearly';
        confidence = 0.9;
      } else if (avgInterval >= 6 && avgInterval <= 8) {
        frequency = 'weekly';
        confidence = 0.8;
      }
      
      const category = categorizeMerchant(merchant);
      
      detectedSubscriptions.push({
        merchant_name: merchant,
        amount: avgAmount,
        frequency,
        category,
        confidence,
        transactions: merchantTransactions,
        last_payment_date: merchantTransactions[0].date,
      });
    }
  });
  
  return detectedSubscriptions.filter(sub => sub.confidence > 0.6);
};

/**
 * Categorizes a merchant based on name patterns.
 */
const categorizeMerchant = (merchantName: string): string => {
  const name = merchantName.toLowerCase();
  if (name.includes('netflix') || name.includes('hulu') || name.includes('disney') || name.includes('amazon prime')) return 'Entertainment';
  if (name.includes('spotify') || name.includes('apple music')) return 'Music';
  if (name.includes('adobe') || name.includes('microsoft') || name.includes('notion')) return 'Productivity';
  if (name.includes('gym') || name.includes('fitness') || name.includes('peloton')) return 'Health & Fitness';
  if (name.includes('github') || name.includes('aws') || name.includes('vercel')) return 'Business';
  return 'Other';
};

/**
 * Provides sample transaction data for demo purposes.
 */
const getSampleTransactions = (): PlaidTransaction[] => {
  return [
    { account_id: 'acc_1', amount: -15.99, date: '2025-08-15', name: 'NETFLIX.COM', merchant_name: 'Netflix', category: ['Entertainment'], transaction_id: 'txn_1' },
    { account_id: 'acc_1', amount: -15.99, date: '2025-07-15', name: 'NETFLIX.COM', merchant_name: 'Netflix', category: ['Entertainment'], transaction_id: 'txn_2' },
    { account_id: 'acc_1', amount: -9.99, date: '2025-08-10', name: 'SPOTIFY', merchant_name: 'Spotify', category: ['Music'], transaction_id: 'txn_3' },
    { account_id: 'acc_1', amount: -9.99, date: '2025-07-10', name: 'SPOTIFY', merchant_name: 'Spotify', category: ['Music'], transaction_id: 'txn_4' },
    { account_id: 'acc_1', amount: -5.75, date: '2025-08-12', name: 'STARBUCKS', merchant_name: 'Starbucks', category: ['Food and Drink'], transaction_id: 'txn_5' },
  ];
};
