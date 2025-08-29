import { supabase } from './supabase';
import { Subscription, NotificationLog } from '../types';

export interface OfflineAction {
  id: string;
  type: 'create' | 'update' | 'delete';
  table: 'subscriptions' | 'notification_logs';
  data: any;
  timestamp: number;
}

/**
 * Check if user is online
 */
export const isOnline = (): boolean => {
  return navigator.onLine;
};

/**
 * Store action for offline sync
 */
export const storeOfflineAction = (action: Omit<OfflineAction, 'id' | 'timestamp'>): void => {
  const offlineAction: OfflineAction = {
    ...action,
    id: crypto.randomUUID(),
    timestamp: Date.now()
  };
  
  const existingActions = getOfflineActions();
  existingActions.push(offlineAction);
  
  localStorage.setItem('subaudit_offline_actions', JSON.stringify(existingActions));
  console.log('Stored offline action:', offlineAction);
};

/**
 * Get all pending offline actions
 */
export const getOfflineActions = (): OfflineAction[] => {
  const stored = localStorage.getItem('subaudit_offline_actions');
  return stored ? JSON.parse(stored) : [];
};

/**
 * Clear offline actions after successful sync
 */
export const clearOfflineActions = (): void => {
  localStorage.removeItem('subaudit_offline_actions');
  console.log('Cleared offline actions');
};

/**
 * Sync offline actions when connection is restored
 */
export const syncOfflineActions = async (): Promise<void> => {
  if (!isOnline()) {
    console.log('Still offline, cannot sync');
    return;
  }
  
  const actions = getOfflineActions();
  if (actions.length === 0) {
    console.log('No offline actions to sync');
    return;
  }
  
  console.log(`Syncing ${actions.length} offline actions...`);
  
  const failedActions: OfflineAction[] = [];
  
  for (const action of actions) {
    try {
      await executeOfflineAction(action);
      console.log('Synced action:', action.id);
    } catch (error) {
      console.error('Failed to sync action:', action.id, error);
      failedActions.push(action);
    }
  }
  
  // Keep failed actions for retry
  if (failedActions.length > 0) {
    localStorage.setItem('subaudit_offline_actions', JSON.stringify(failedActions));
    console.log(`${failedActions.length} actions failed to sync, will retry later`);
  } else {
    clearOfflineActions();
    console.log('All offline actions synced successfully');
  }
};

/**
 * Execute a single offline action
 */
const executeOfflineAction = async (action: OfflineAction): Promise<void> => {
  const { type, table, data } = action;
  
  switch (type) {
    case 'create':
      await supabase.from(table).insert([data]);
      break;
      
    case 'update':
      await supabase.from(table).update(data).eq('id', data.id);
      break;
      
    case 'delete':
      await supabase.from(table).delete().eq('id', data.id);
      break;
      
    default:
      throw new Error(`Unknown action type: ${type}`);
  }
};

/**
 * Cache subscription data for offline access
 */
export const cacheSubscriptions = (subscriptions: Subscription[]): void => {
  localStorage.setItem('subaudit_cached_subscriptions', JSON.stringify(subscriptions));
  localStorage.setItem('subaudit_cache_timestamp', Date.now().toString());
  console.log(`Cached ${subscriptions.length} subscriptions`);
};

/**
 * Get cached subscriptions
 */
export const getCachedSubscriptions = (): Subscription[] => {
  const cached = localStorage.getItem('subaudit_cached_subscriptions');
  return cached ? JSON.parse(cached) : [];
};

/**
 * Cache notifications for offline access
 */
export const cacheNotifications = (notifications: NotificationLog[]): void => {
  localStorage.setItem('subaudit_cached_notifications', JSON.stringify(notifications));
  console.log(`Cached ${notifications.length} notifications`);
};

/**
 * Get cached notifications
 */
export const getCachedNotifications = (): NotificationLog[] => {
  const cached = localStorage.getItem('subaudit_cached_notifications');
  return cached ? JSON.parse(cached) : [];
};

/**
 * Check if cached data is stale (older than 1 hour)
 */
export const isCacheStale = (): boolean => {
  const timestamp = localStorage.getItem('subaudit_cache_timestamp');
  if (!timestamp) return true;
  
  const cacheAge = Date.now() - parseInt(timestamp);
  const oneHour = 60 * 60 * 1000;
  
  return cacheAge > oneHour;
};

/**
 * Register service worker for offline support
 */
export const registerServiceWorker = async (): Promise<void> => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', registration);
      
      // Listen for updates
      registration.addEventListener('updatefound', () => {
        console.log('Service Worker update found');
      });
      
      // Check for background sync support
      if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
        console.log('Background sync supported');
      } else {
        console.log('Background sync not supported');
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('Service Workers are not yet supported on StackBlitz')) {
        console.warn('Service Workers not supported in this environment (StackBlitz). Offline features will be limited.');
      } else {
        console.error('Service Worker registration failed:', error);
      }
    }
  } else {
    console.log('Service Workers not supported');
  }
};

/**
 * Request background sync for offline actions
 */
export const requestBackgroundSync = async (tag: string): Promise<void> => {
  if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register(tag);
      console.log('Background sync requested:', tag);
    } catch (error) {
      console.error('Background sync request failed:', error);
    }
  }
};

/**
 * Setup offline event listeners
 */
export const setupOfflineListeners = (): void => {
  window.addEventListener('online', () => {
    console.log('Connection restored');
    syncOfflineActions();
  });
  
  window.addEventListener('offline', () => {
    console.log('Connection lost');
  });
  
  // Sync on page visibility change (when user returns to tab)
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && isOnline()) {
      syncOfflineActions();
    }
  });
};

/**
 * Offline-aware subscription operations
 */
export const offlineAwareSubscriptionCreate = async (subscriptionData: any): Promise<void> => {
  if (isOnline()) {
    // Try online operation first
    try {
      await supabase.from('subscriptions').insert([subscriptionData]);
      return;
    } catch (error) {
      console.error('Online create failed, storing for offline sync:', error);
    }
  }
  
  // Store for offline sync
  storeOfflineAction({
    type: 'create',
    table: 'subscriptions',
    data: subscriptionData
  });
  
  // Request background sync
  await requestBackgroundSync('subscription-sync');
};

export const offlineAwareSubscriptionUpdate = async (id: string, updates: any): Promise<void> => {
  if (isOnline()) {
    try {
      await supabase.from('subscriptions').update(updates).eq('id', id);
      return;
    } catch (error) {
      console.error('Online update failed, storing for offline sync:', error);
    }
  }
  
  storeOfflineAction({
    type: 'update',
    table: 'subscriptions',
    data: { id, ...updates }
  });
  
  await requestBackgroundSync('subscription-sync');
};

export const offlineAwareSubscriptionDelete = async (id: string): Promise<void> => {
  if (isOnline()) {
    try {
      await supabase.from('subscriptions').delete().eq('id', id);
      return;
    } catch (error) {
      console.error('Online delete failed, storing for offline sync:', error);
    }
  }
  
  storeOfflineAction({
    type: 'delete',
    table: 'subscriptions',
    data: { id }
  });
  
  await requestBackgroundSync('subscription-sync');
};

/**
 * Initialize offline support
 */
export const initializeOfflineSupport = async (): Promise<void> => {
  await registerServiceWorker();
  setupOfflineListeners();
  
  // Sync any pending actions on startup
  if (isOnline()) {
    await syncOfflineActions();
  }
  
  console.log('Offline support initialized');
};