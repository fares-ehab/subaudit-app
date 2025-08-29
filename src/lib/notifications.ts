import { supabase } from './supabase';
import { Notification, NotificationLog } from '../types'; // Assuming a types file with both types

/**
 * Logs that a notification has been sent to a user.
 */
export const logNotification = async (
  subscriptionId: string,
  userId: string,
  type: 'renewal_reminder' | 'value_check'
): Promise<NotificationLog> => {
  const { data, error } = await supabase
    .from('notification_logs')
    .insert([{
      subscription_id: subscriptionId,
      user_id: userId,
      notification_type: type,
      sent_at: new Date().toISOString()
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Records a user's response to a specific notification.
 */
export const recordNotificationResponse = async (
  notificationId: string,
  response: 'keep' | 'cancel'
): Promise<void> => {
  if (!notificationId) {
    throw new Error('Notification ID is required');
  }
  if (!response || !['keep', 'cancel'].includes(response)) {
    throw new Error('Valid response (keep/cancel) is required');
  }

  const { error } = await supabase
    .from('notification_logs')
    .update({
      user_response: response,
      response_at: new Date().toISOString()
    })
    .eq('id', notificationId);

  if (error) {
    console.error('Error recording notification response:', error);
    throw new Error(`Failed to record response: ${error.message}`);
  }
};

/**
 * Fetches all notifications for the current user that have not yet been responded to.
 * This joins with the subscriptions table to get context.
 */
export const getPendingNotifications = async (): Promise<NotificationLog[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('notification_logs')
    .select(`
      *,
      subscriptions (
        id, name, cost, billing_cycle, next_renewal_date
      )
    `)
    .eq('user_id', user.id)
    .is('user_response', null)
    .order('sent_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

// --- Kept from previous version for general UI notifications ---

/**
 * Fetches all general UI notifications for the current user.
 */
export const getNotifications = async (): Promise<Notification[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching notifications:", error);
    throw error;
  }
  return data || [];
};

/**
 * Marks a single UI notification as read.
 */
export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId);

  if (error) {
    console.error("Error marking notification as read:", error);
    throw error;
  }
};

/**
 * Marks all unread UI notifications as read for the current user.
 */
export const markAllNotificationsAsRead = async (): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', user.id)
    .eq('is_read', false);

  if (error) {
    console.error("Error marking all as read:", error);
    throw error;
  }
};
