import React, { useState, useMemo } from 'react';
import { Bell, Check, Settings, Tag, Zap  } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow, isThisWeek, isToday } from 'date-fns';
import { useNotifications } from '../hooks/useNotifications';
import { Notification } from '../types';
import LoadingSpinner from './LoadingSpinner';

const NotificationCenter: React.FC = () => {
  const { notifications, markAsRead, markAllAsRead, clearAll, loading } = useNotifications();
  const [filter, setFilter] = useState<'all' | 'unread'>('unread');

  const groupedNotifications = useMemo(() => {
    const filtered = notifications.filter(n => filter === 'all' || !n.is_read);
    return filtered.reduce((acc, notification) => {
      const date = new Date(notification.created_at);
      let group = 'Older';
      if (isToday(date)) group = 'Today';
      else if (isThisWeek(date, { weekStartsOn: 1 })) group = 'This Week';
      if (!acc[group]) acc[group] = [];
      acc[group].push(notification);
      return acc;
    }, {} as Record<string, Notification[]>);
  }, [notifications, filter]);

  // --- FIX: Removed the unused getIconForType function from this component ---

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Bell className="w-8 h-8 text-indigo-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
            <p className="text-gray-600">Updates and insights about your subscriptions.</p>
          </div>
        </div>
        <a href="#" className="text-sm text-indigo-600 hover:underline flex items-center space-x-1">
          <Settings size={16} />
          <span>Notification Settings</span>
        </a>
      </div>

      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <button onClick={() => setFilter('unread')} className={`px-3 py-1 text-sm font-medium rounded-md ${filter === 'unread' ? 'bg-white shadow' : 'text-gray-600'}`}>Unread</button>
            <button onClick={() => setFilter('all')} className={`px-3 py-1 text-sm font-medium rounded-md ${filter === 'all' ? 'bg-white shadow' : 'text-gray-600'}`}>All</button>
          </div>
          <div className="flex space-x-4">
            <button onClick={markAllAsRead} className="text-sm text-indigo-600 hover:underline">Mark all as read</button>
            <button onClick={clearAll} className="text-sm text-red-600 hover:underline">Clear all</button>
          </div>
        </div>
        
        {loading ? (
          <LoadingSpinner message="Loading notifications..." />
        ) : Object.keys(groupedNotifications).length === 0 ? (
          <div className="p-16 text-center">
            <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600"/>
            </div>
            <h3 className="text-xl font-semibold text-gray-900">You're all caught up!</h3>
            <p className="text-gray-600 mt-2">No new notifications for you right now.</p>
          </div>
        ) : (
          <div>
            <AnimatePresence>
              {Object.entries(groupedNotifications).map(([group, groupNotifications]) => (
                <motion.div key={group} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <h4 className="text-sm font-semibold text-gray-500 px-4 pt-4 pb-2">{group}</h4>
                  <ul className="divide-y">
                    {groupNotifications.map((notification) => (
                      <NotificationItem key={notification.id} notification={notification} onMarkRead={markAsRead} />
                    ))}
                  </ul>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Notification Item Component ---
const NotificationItem: React.FC<{
  notification: Notification;
  onMarkRead: (id: string) => void;
}> = ({ notification, onMarkRead }) => {
  const getIconForType = (type: string) => {
    switch (type) {
      case 'renewal': return <Tag className="text-blue-500" />;
      case 'insight': return <Zap className="text-purple-500" />;
      default: return <Bell className="text-gray-500" />;
    }
  };
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -50, transition: { duration: 0.2 } }}
      className={`p-4 flex items-start space-x-4 hover:bg-gray-50/80 ${!notification.is_read ? 'bg-indigo-50/50' : ''}`}
    >
      <div className="mt-1">{getIconForType(notification.type)}</div>
      <div className="flex-1">
        <p className={`font-semibold text-gray-900 ${!notification.is_read ? '' : 'font-normal'}`}>{notification.title}</p>
        <p className={`text-sm ${!notification.is_read ? 'text-gray-700' : 'text-gray-500'}`}>{notification.message}</p>
      </div>
      <div className="text-right">
        <p className="text-xs text-gray-400">{formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}</p>
        {!notification.is_read && (
            <button onClick={() => onMarkRead(notification.id)} className="mt-2 p-2 rounded-full hover:bg-indigo-100" title="Mark as read">
                <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full"></div>
            </button>
        )}
      </div>
    </motion.li>
  );
};

export default NotificationCenter;
