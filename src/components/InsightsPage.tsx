import React from 'react';
import { Brain } from 'lucide-react';
import { useSubscriptions } from '../hooks/useSubscriptions';
import LoadingSpinner from './LoadingSpinner';
import SubscriptionInsights from './SubscriptionInsights';

const InsightsPage: React.FC = () => {
  // We use the main subscriptions hook, as it already calculates all the recommendations
  const { analytics, allSubscriptions, loading } = useSubscriptions({});

  if (loading) {
    return <LoadingSpinner message="Analyzing your subscriptions..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Brain className="w-8 h-8 text-indigo-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Smart Insights</h1>
          <p className="text-gray-600">AI-powered recommendations to help you save money.</p>
        </div>
      </div>

      <div>
        <SubscriptionInsights
          insights={analytics.recommendations}
          subscriptions={allSubscriptions}
        />
      </div>
    </div>
  );
};

export default InsightsPage;