import React, { useState } from 'react';
import { Plus, Star } from 'lucide-react';
import { useSubscriptions } from '../hooks/useSubscriptions';
import { useAuth } from '../contexts/AuthProvider'; // Make sure path is correct
import { Subscription } from '../types';

// Import all required UI components
import SubscriptionForm from './SubscriptionForm';
import SubscriptionCard from './SubscriptionCard';
import SubscriptionStats from './SubscriptionStats';
import UpcomingRenewalsAlert from './UpcomingRenewalsAlert';
import EmptyState from './EmptyState';
import LoadingSpinner from './LoadingSpinner';
import SearchAndFilter from './SearchAndFilter';
import BulkActions from './BulkActions';
import VisualDashboard from './VisualDashboard';
import PersonalizedGreeting from './PersonalizedGreeting';
import MotivationalStats from './MotivationalStats';
import SavingsTracker from './SavingsTracker';
import SubscriptionInsights from './SubscriptionInsights';
import QuickStats from './QuickStats';

// Define plan limits for the frontend
const PLAN_LIMITS = {
    'Free Starter': 10,
    'Individual': 30,
    'Family': 50,
};

const Dashboard: React.FC = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const [filters, setFilters] = useState({
    search: '', category: 'all', billing_cycle: 'all', sort_by: 'renewal_date_asc',
    price_min: 0, price_max: 1000,
  });
  
  const { profile } = useAuth(); // Use 'profile' from our auth context
  const { subscriptions, loading, refreshSubscriptions, analytics, allSubscriptions } = useSubscriptions(filters);

  const handleSelectSubscription = (id: string, isSelected: boolean) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (isSelected) newSet.add(id);
      else newSet.delete(id);
      return newSet;
    });
  };

  // Calculate if the user has reached their limit
  const userPlan = profile?.subscription_plan || 'Free Starter';
  const limit = PLAN_LIMITS[userPlan as keyof typeof PLAN_LIMITS] || 10;
  const currentCount = allSubscriptions.filter(sub => sub.is_active).length;
  const isLimitReached = currentCount >= limit;

  if (loading && allSubscriptions.length === 0) {
    return <LoadingSpinner variant="overlay" message="Loading your subscriptions..." />;
  }

  const selectedSubscriptions: Subscription[] = allSubscriptions.filter(s => selectedIds.has(s.id));

  return (
    <div className="space-y-8">
      <PersonalizedGreeting user={null} subscriptions={allSubscriptions} mindfulStreak={analytics.mindfulStreak} />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Your Subscriptions</h1>
          <p className="text-gray-600 mt-1">Manage your recurring payments and find savings.</p>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          disabled={isLimitReached}
          className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" />
          <span>Add Subscription</span>
        </button>
      </div>

      {/* Show an upgrade message when the limit is reached */}
      {isLimitReached && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
          <div className="flex items-center space-x-3">
            <Star className="w-6 h-6 text-yellow-500" />
            <div>
              <p className="font-semibold text-yellow-800">You've reached your subscription limit!</p>
              <p className="text-sm text-yellow-700">
                You're on the "{userPlan}" plan, which allows for {limit} subscriptions. Please upgrade to add more.
              </p>
            </div>
          </div>
        </div>
      )}

      {allSubscriptions.length > 0 && (
        <SearchAndFilter
            filters={filters}
            onFiltersChange={setFilters}
            subscriptions={allSubscriptions}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
        />
      )}

      {allSubscriptions.length === 0 ? (
        <EmptyState onAddSubscription={() => setIsFormOpen(true)} hasSubscriptions={false} isBankConnected={false} />
      ) : (
        <>
          <QuickStats subscriptions={allSubscriptions} />
          <SubscriptionStats
            totalMonthlyCost={analytics.totalMonthlyCost}
            lastMonthCost={analytics.lastMonthCost}
            upcomingRenewals={analytics.upcomingRenewals}
          />
          <VisualDashboard
            subscriptions={allSubscriptions}
            analytics={analytics}
          />
          <UpcomingRenewalsAlert
            upcomingRenewals={analytics.upcomingRenewals}
            lastWeekCost={analytics.lastWeekCost}
          />
          <MotivationalStats subscriptions={allSubscriptions} />
          <SavingsTracker subscriptions={allSubscriptions} />
          <SubscriptionInsights insights={analytics.recommendations} subscriptions={allSubscriptions} />

          {selectedSubscriptions.length > 0 && (
            <BulkActions
              selectedSubscriptions={selectedSubscriptions}
              onSuccess={() => {
                setSelectedIds(new Set());
                refreshSubscriptions();
              }}
            />
          )}

          <div className={`mt-4 ${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}`}>
            {subscriptions.map((subscription: Subscription) => (
              <SubscriptionCard
                key={subscription.id}
                subscription={subscription}
                selected={selectedIds.has(subscription.id)}
                onSelect={handleSelectSubscription}
                onUpdate={refreshSubscriptions}
              />
            ))}
          </div>
        </>
      )}

      <SubscriptionForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={(addAnother) => {
            refreshSubscriptions();
            setIsFormOpen(!!addAnother);
        }}
      />
    </div>
  );
};

export default Dashboard;