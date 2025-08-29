/**
 * Jest Tests for SubscriptionCard Component
 * 
 * Run with: npm test
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SubscriptionCard from '../../src/components/SubscriptionCard';
import { Subscription } from '../../src/types';

// Mock the subscription library
jest.mock('../../src/lib/subscriptions', () => ({
  cancelSubscription: jest.fn(),
  updateSubscriptionRating: jest.fn()
}));

const mockSubscription: Subscription = {
  id: '1',
  user_id: 'user1',
  name: 'Netflix',
  cost: 15.99,
  billing_cycle: 'monthly',
  next_renewal_date: '2024-03-15',
  category: 'Entertainment',
  last_used_date: '2024-02-01',
  value_rating: 4,
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
};

describe('SubscriptionCard', () => {
  const mockOnUpdate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders subscription information correctly', () => {
    render(
      <SubscriptionCard 
        subscription={mockSubscription} 
        onUpdate={mockOnUpdate} 
      />
    );

    expect(screen.getByText('Netflix')).toBeInTheDocument();
    expect(screen.getByText('Entertainment')).toBeInTheDocument();
    expect(screen.getByText('$15.99/month')).toBeInTheDocument();
    expect(screen.getByText('Mar 15, 2024')).toBeInTheDocument();
  });

  test('shows star rating when available', () => {
    render(
      <SubscriptionCard 
        subscription={mockSubscription} 
        onUpdate={mockOnUpdate} 
      />
    );

    // Should show 4 filled stars and 1 empty star
    const stars = screen.getAllByTestId(/star-/);
    expect(stars).toHaveLength(5);
  });

  test('handles selection when onSelect is provided', () => {
    const mockOnSelect = jest.fn();
    
    render(
      <SubscriptionCard 
        subscription={mockSubscription} 
        onUpdate={mockOnUpdate}
        onSelect={mockOnSelect}
      />
    );

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    
    expect(mockOnSelect).toHaveBeenCalledWith(true);
  });

  test('shows upcoming renewal warning', () => {
    const upcomingSubscription = {
      ...mockSubscription,
      next_renewal_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    };

    render(
      <SubscriptionCard 
        subscription={upcomingSubscription} 
        onUpdate={mockOnUpdate} 
      />
    );

    expect(screen.getByText(/Renewal coming up/)).toBeInTheDocument();
  });

  test('shows overdue warning for past renewals', () => {
    const overdueSubscription = {
      ...mockSubscription,
      next_renewal_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    };

    render(
      <SubscriptionCard 
        subscription={overdueSubscription} 
        onUpdate={mockOnUpdate} 
      />
    );

    expect(screen.getByText(/Payment overdue/)).toBeInTheDocument();
  });

  test('opens rating modal when star button is clicked', () => {
    render(
      <SubscriptionCard 
        subscription={mockSubscription} 
        onUpdate={mockOnUpdate} 
      />
    );

    const rateButton = screen.getByTitle('Rate subscription');
    fireEvent.click(rateButton);

    expect(screen.getByText('Rate Subscription')).toBeInTheDocument();
  });

  test('handles cancel subscription', async () => {
    const { cancelSubscription } = require('../../src/lib/subscriptions');
    cancelSubscription.mockResolvedValue(undefined);

    // Mock window.confirm
    window.confirm = jest.fn(() => true);

    render(
      <SubscriptionCard 
        subscription={mockSubscription} 
        onUpdate={mockOnUpdate} 
      />
    );

    const cancelButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(cancelSubscription).toHaveBeenCalledWith('1');
      expect(mockOnUpdate).toHaveBeenCalled();
    });
  });

  test('does not cancel when user cancels confirmation', async () => {
    const { cancelSubscription } = require('../../src/lib/subscriptions');
    
    // Mock window.confirm to return false
    window.confirm = jest.fn(() => false);

    render(
      <SubscriptionCard 
        subscription={mockSubscription} 
        onUpdate={mockOnUpdate} 
      />
    );

    const cancelButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(cancelSubscription).not.toHaveBeenCalled();
    });
  });
});