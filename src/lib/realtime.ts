/**
 * Real-time Updates with Supabase Subscriptions
 * 
 * This module provides real-time synchronization of subscription data
 * across multiple devices and family members using Supabase's real-time features.
 */

import { supabase } from './supabase';
import { Subscription, NotificationLog } from '../types';
import { RealtimeChannel } from '@supabase/supabase-js';

export type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE';

export interface RealtimeSubscriptionChange {
  eventType: RealtimeEvent;
  new: Subscription;
  old: Subscription;
}

export interface RealtimeNotificationChange {
  eventType: RealtimeEvent;
  new: NotificationLog;
  old: NotificationLog;
}

/**
 * Subscribe to real-time subscription changes
 */
export const subscribeToSubscriptionChanges = (
  userId: string,
  onSubscriptionChange: (change: RealtimeSubscriptionChange) => void
): RealtimeChannel => {
  const channel = supabase
    .channel('subscription-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'subscriptions',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        console.log('Real-time subscription change:', payload);
        onSubscriptionChange({
          eventType: payload.eventType as RealtimeEvent,
          new: payload.new as Subscription,
          old: payload.old as Subscription
        });
      }
    )
    .subscribe();

  return channel;
};

/**
 * Subscribe to real-time notification changes
 */
export const subscribeToNotificationChanges = (
  userId: string,
  onNotificationChange: (change: RealtimeNotificationChange) => void
): RealtimeChannel => {
  const channel = supabase
    .channel('notification-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'notification_logs',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        console.log('Real-time notification change:', payload);
        onNotificationChange({
          eventType: payload.eventType as RealtimeEvent,
          new: payload.new as NotificationLog,
          old: payload.old as NotificationLog
        });
      }
    )
    .subscribe();

  return channel;
};

/**
 * Subscribe to family subscription changes
 */
export const subscribeToFamilyChanges = (
  familyGroupId: string,
  onFamilyChange: (change: any) => void
): RealtimeChannel => {
  const channel = supabase
    .channel(`family-${familyGroupId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'family_members',
        filter: `family_group_id=eq.${familyGroupId}`
      },
      (payload) => {
        console.log('Real-time family change:', payload);
        onFamilyChange(payload);
      }
    )
    .subscribe();

  return channel;
};

/**
 * Broadcast presence to other family members
 */
export const broadcastPresence = (
  familyGroupId: string,
  userInfo: { id: string; email: string; status: 'online' | 'away' }
): RealtimeChannel => {
  const channel = supabase
    .channel(`presence-${familyGroupId}`)
    .on('presence', { event: 'sync' }, () => {
      const newState = channel.presenceState();
      console.log('Presence sync:', newState);
    })
    .on('presence', { event: 'join' }, ({ key, newPresences }) => {
      console.log('User joined:', key, newPresences);
    })
    .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
      console.log('User left:', key, leftPresences);
    })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track(userInfo);
      }
    });

  return channel;
};

/**
 * Send real-time message to family members
 */
export const sendFamilyMessage = async (
  familyGroupId: string,
  message: {
    type: 'subscription_added' | 'subscription_cancelled' | 'renewal_reminder';
    data: any;
    sender: string;
  }
) => {
  const channel = supabase.channel(`family-${familyGroupId}`);
  
  await channel.send({
    type: 'broadcast',
    event: 'family_message',
    payload: message
  });
};

/**
 * Custom hook for real-time subscription updates
 */
import React from 'react';

export const useRealtimeSubscriptions = (
  initialSubscriptions: Subscription[],
  userId: string
) => {
  const [subscriptions, setSubscriptions] = React.useState(initialSubscriptions);
  const [channel, setChannel] = React.useState<RealtimeChannel | null>(null);

  React.useEffect(() => {
    if (!userId) return;

    const subscriptionChannel = subscribeToSubscriptionChanges(
      userId,
      (change) => {
        setSubscriptions(prev => {
          switch (change.eventType) {
            case 'INSERT':
              return [...prev, change.new];
            case 'UPDATE':
              return prev.map(sub => 
                sub.id === change.new.id ? change.new : sub
              );
            case 'DELETE':
              return prev.filter(sub => sub.id !== change.old.id);
            default:
              return prev;
          }
        });
      }
    );

    setChannel(subscriptionChannel);

    return () => {
      subscriptionChannel.unsubscribe();
    };
  }, [userId]);

  return { subscriptions, channel };
};

/**
 * Custom hook for real-time notifications
 */
export const useRealtimeNotifications = (
  initialNotifications: NotificationLog[],
  userId: string
) => {
  const [notifications, setNotifications] = React.useState(initialNotifications);
  const [channel, setChannel] = React.useState<RealtimeChannel | null>(null);

  React.useEffect(() => {
    if (!userId) return;

    const notificationChannel = subscribeToNotificationChanges(
      userId,
      (change) => {
        setNotifications(prev => {
          switch (change.eventType) {
            case 'INSERT':
              return [...prev, change.new];
            case 'UPDATE':
              return prev.map(notif => 
                notif.id === change.new.id ? change.new : notif
              );
            case 'DELETE':
              return prev.filter(notif => notif.id !== change.old.id);
            default:
              return prev;
          }
        });
      }
    );

    setChannel(notificationChannel);

    return () => {
      notificationChannel.unsubscribe();
    };
  }, [userId]);

  return { notifications, channel };
};

/**
 * Cleanup all real-time subscriptions
 */
export const cleanupRealtimeSubscriptions = () => {
  supabase.removeAllChannels();
};