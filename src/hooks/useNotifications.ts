import { useState, useEffect, useCallback } from 'react';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  clearAllNotifications, // Assuming you add this to your lib
} from '../lib/notifications';
import { Notification } from '../types';
import { toast } from 'react-hot-toast';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getNotifications();
      setNotifications(data);
    } catch (error) {
      toast.error('Failed to fetch notifications.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = async (id: string) => {
    try {
      await markNotificationAsRead(id);
      // Optimistically update the UI before refetching
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      // No toast needed for this simple action
    } catch (error) {
      toast.error('Failed to mark as read.');
    }
  };

  const markAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      await fetchNotifications(); // Refetch to get the latest state
      toast.success('All notifications marked as read.');
    } catch (error) {
      toast.error('Failed to mark all as read.');
    }
  };

  const clearAll = async () => {
    try {
      // Assuming you will add a `clearAllNotifications` function to your lib
      // await clearAllNotifications(); 
      setNotifications([]); // Optimistically clear UI
      toast.success('All notifications cleared.');
    } catch (error) {
      toast.error('Failed to clear notifications.');
    }
  };

  return {
    notifications,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    clearAll,
  };
};
