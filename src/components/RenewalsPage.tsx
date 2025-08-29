import React from 'react';
import { useSubscriptions } from '../hooks/useSubscriptions';
import { Link, useParams } from 'react-router-dom';
import { Calendar, AlertTriangle } from 'lucide-react';
import { format, isWithinInterval, addDays, endOfMonth, parseISO } from 'date-fns';
import { Subscription } from '../types';
import LoadingSpinner from './LoadingSpinner';

const RenewalItem: React.FC<{ subscription: Subscription }> = ({ subscription }) => {
  const isHighCost = subscription.cost > 50;
  return (
    <Link to={`/subscriptions/${subscription.id}`} className="flex items-center justify-between bg-white p-4 rounded-lg border hover:border-indigo-300 transition-colors">
      <div className="flex items-center space-x-4">
        <img 
            src={`https://logo.clearbit.com/${subscription.name.toLowerCase().replace(/\s+/g, '')}.com`}
            alt={`${subscription.name} logo`}
            className="h-10 w-10 rounded-full object-contain border"
            onError={(e) => { (e.currentTarget as HTMLImageElement).src = `https://placehold.co/40/EBF4FF/7F9CF5?text=${subscription.name.charAt(0)}`; }}
        />
        <div>
            <p className="font-semibold text-gray-800">{subscription.name}</p>
            <p className="text-sm text-gray-500">{subscription.category}</p>
        </div>
      </div>
      <div className="text-right flex items-center space-x-3">
        {isHighCost && (
          <span title="High Cost">
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </span>
        )}
        <div>
            <p className="font-bold text-lg text-gray-900">${subscription.cost.toFixed(2)}</p>
            <p className="text-xs text-gray-500">due {format(new Date(subscription.next_renewal_date), 'MMM d')}</p>
        </div>
      </div>
    </Link>
  );
};

const RenewalsPage: React.FC = () => {
  const { timeframe } = useParams<{ timeframe: 'week' | 'month' }>();
  const { allSubscriptions, loading } = useSubscriptions({});

  const renewals = React.useMemo(() => {
    const now = new Date();
    if (timeframe === 'week') {
      const next7Days = { start: now, end: addDays(now, 7) };
      return allSubscriptions.filter(s => s.is_active && isWithinInterval(parseISO(s.next_renewal_date), next7Days));
    }
    if (timeframe === 'month') {
      const monthInterval = { start: now, end: endOfMonth(now) };
      return allSubscriptions.filter(s => s.is_active && isWithinInterval(parseISO(s.next_renewal_date), monthInterval));
    }
    return [];
  }, [allSubscriptions, timeframe]);

  const pageTitle = timeframe === 'week' ? "Renewals This Week" : "Renewals This Month";
  const pageDescription = timeframe === 'week' ? "These subscriptions are renewing in the next 7 days." : "These subscriptions are renewing before the end of the month.";

  if (loading) {
    return <LoadingSpinner message="Loading renewals..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Calendar className="w-8 h-8 text-indigo-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{pageTitle}</h1>
          <p className="text-gray-600">{pageDescription}</p>
        </div>
      </div>

      {renewals.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4"/>
            <h3 className="text-xl font-semibold text-gray-800">All Clear!</h3>
            <p className="text-gray-500 mt-2">You have no subscriptions renewing in this period.</p>
        </div>
      ) : (
        <div className="space-y-3">
            {renewals.map(sub => <RenewalItem key={sub.id} subscription={sub} />)}
        </div>
      )}
    </div>
  );
};

export default RenewalsPage;
