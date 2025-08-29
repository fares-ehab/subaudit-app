/**
 * Jest Tests for Subscription Library Functions
 */

import { getSubscriptions, addSubscription, updateSubscriptionRating } from '../../src/lib/subscriptions';
import { supabase } from '../../src/lib/supabase';

// Mock Supabase
jest.mock('../../src/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn()
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => Promise.resolve({ data: [], error: null }))
          }))
        }))
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: {}, error: null }))
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ error: null }))
      }))
    }))
  }
}));

describe('Subscription Library', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock authenticated user
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: { id: 'user123' } }
    });
  });

  describe('getSubscriptions', () => {
    test('fetches subscriptions for authenticated user', async () => {
      const mockSubscriptions = [
        { id: '1', name: 'Netflix', cost: 15.99 },
        { id: '2', name: 'Spotify', cost: 9.99 }
      ];

      const mockChain = {
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              order: jest.fn(() => Promise.resolve({ 
                data: mockSubscriptions, 
                error: null 
              }))
            }))
          }))
        }))
      };

      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await getSubscriptions();

      expect(supabase.from).toHaveBeenCalledWith('subscriptions');
      expect(result).toEqual(mockSubscriptions);
    });

    test('applies search filter correctly', async () => {
      const mockChain = {
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              or: jest.fn(() => ({
                order: jest.fn(() => Promise.resolve({ data: [], error: null }))
              }))
            }))
          }))
        }))
      };

      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      await getSubscriptions({ search: 'Netflix' });

      expect(mockChain.select().eq().eq().or).toHaveBeenCalledWith(
        'name.ilike.%Netflix%,category.ilike.%Netflix%'
      );
    });

    test('throws error when user not authenticated', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null }
      });

      await expect(getSubscriptions()).rejects.toThrow('User not authenticated');
    });
  });

  describe('addSubscription', () => {
    test('adds subscription for authenticated user', async () => {
      const subscriptionData = {
        name: 'Netflix',
        cost: 15.99,
        billing_cycle: 'monthly' as const,
        next_renewal_date: '2024-03-15',
        category: 'Entertainment'
      };

      const mockResult = { id: '1', ...subscriptionData, user_id: 'user123' };

      const mockChain = {
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ 
              data: mockResult, 
              error: null 
            }))
          }))
        }))
      };

      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await addSubscription(subscriptionData);

      expect(supabase.from).toHaveBeenCalledWith('subscriptions');
      expect(mockChain.insert).toHaveBeenCalledWith([{
        ...subscriptionData,
        user_id: 'user123',
        is_active: true
      }]);
      expect(result).toEqual(mockResult);
    });
  });

  describe('updateSubscriptionRating', () => {
    test('updates subscription rating and last used date', async () => {
      const mockChain = {
        update: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({ error: null }))
        }))
      };

      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      await updateSubscriptionRating('sub123', 4, '2024-02-15');

      expect(supabase.from).toHaveBeenCalledWith('subscriptions');
      expect(mockChain.update).toHaveBeenCalledWith({
        value_rating: 4,
        last_used_date: '2024-02-15',
        updated_at: expect.any(String)
      });
      expect(mockChain.update().eq).toHaveBeenCalledWith('id', 'sub123');
    });

    test('updates rating without last used date', async () => {
      const mockChain = {
        update: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({ error: null }))
        }))
      };

      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      await updateSubscriptionRating('sub123', 5);

      expect(mockChain.update).toHaveBeenCalledWith({
        value_rating: 5,
        updated_at: expect.any(String)
      });
    });
  });
});