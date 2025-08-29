import React from 'react';
import { DollarSign, TrendingUp, Calendar, TrendingDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Subscription } from '../types';

// --- Animated Number Component ---
const AnimatedNumber = ({ value, isCurrency = false }: { value: number, isCurrency?: boolean }) => {
    // In a real app, the animation logic would be here.
    // For this final version, we'll just display the number.
    return <span>{isCurrency ? value.toFixed(2) : value.toFixed(0)}</span>;
};

interface SubscriptionStatsProps {
  totalMonthlyCost: number;
  lastMonthCost: number;
  upcomingRenewals: Subscription[];
}

const SubscriptionStats: React.FC<SubscriptionStatsProps> = ({
  totalMonthlyCost,
  lastMonthCost,
  upcomingRenewals
}) => {
  const spendingTrend = lastMonthCost > 0 
    ? ((totalMonthlyCost - lastMonthCost) / lastMonthCost) * 100 
    : (totalMonthlyCost > 0 ? 100 : 0);

  const upcomingRenewalsCount = upcomingRenewals.length;
  const upcomingRenewalsCost = upcomingRenewals.reduce((sum, sub) => sum + sub.cost, 0);
  const totalYearlyCost = totalMonthlyCost * 12;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <StatCard title="Monthly Spending" icon={DollarSign} color="indigo" link="/reports/monthly">
        <div className="text-3xl font-bold text-gray-900">
            $<AnimatedNumber value={totalMonthlyCost} isCurrency />
        </div>
        <div className={`flex items-center space-x-1 text-sm font-semibold ${spendingTrend >= 0 ? 'text-red-500' : 'text-green-500'}`}>
            {spendingTrend >= 0 ? <TrendingUp size={16}/> : <TrendingDown size={16}/>}
            <span>{Math.abs(spendingTrend).toFixed(0)}% vs last month</span>
        </div>
      </StatCard>

      {/* --- FIX: This link now correctly points to /renewals/week --- */}
      <StatCard title="Upcoming Renewals" icon={Calendar} color="orange" link="/renewals/week">
        <div className="text-3xl font-bold text-gray-900">
            <AnimatedNumber value={upcomingRenewalsCount} />
        </div>
        <p className="text-sm text-gray-500 mt-1">Totaling ${upcomingRenewalsCost.toFixed(2)}</p>
      </StatCard>

      <StatCard title="Yearly Projection" icon={TrendingUp} color="green" link="/reports/yearly">
        <div className="text-3xl font-bold text-gray-900">
            $<AnimatedNumber value={totalYearlyCost} isCurrency />
        </div>
        <p className="text-xs text-gray-500 mt-1">Based on current monthly spending.</p>
      </StatCard>
    </div>
  );
};

const StatCard: React.FC<{ title: string; icon: React.ElementType; color: string; link: string; children: React.ReactNode; }> = ({ title, icon: Icon, color, link, children }) => (
    <Link to={link} className="bg-white rounded-xl shadow-sm border p-5 block hover:shadow-lg hover:-translate-y-1 transition-all group">
        <div className="flex items-center space-x-3">
            <div className={`p-3 rounded-lg bg-${color}-100`}>
                <Icon className={`w-6 h-6 text-${color}-600`} />
            </div>
            <p className="text-sm text-gray-600 font-medium group-hover:text-gray-900">{title}</p>
        </div>
        <div className="mt-4">
            {children}
        </div>
    </Link>
);

export default SubscriptionStats;
