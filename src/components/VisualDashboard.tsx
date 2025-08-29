import React, { useState } from 'react';
import { PieChart, BarChart3, TrendingUp, TrendingDown } from 'lucide-react';
import { Pie, PieChart as RechartsPieChart, Bar, BarChart as RechartsBarChart, ResponsiveContainer, Cell, Tooltip, XAxis, YAxis } from 'recharts';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Subscription } from '../types';

// --- The component now receives all its data as props ---
interface VisualDashboardProps {
  subscriptions: Subscription[];
  analytics: {
    categoryBreakdown: Record<string, number>;
    historicalData: { name: string; cost: number }[];
    largestIncrease: (Subscription & { increase: number }) | null;
    biggestSaving: Subscription | null;
  };
}

const VisualDashboard: React.FC<VisualDashboardProps> = ({ subscriptions, analytics }) => {
  const { categoryBreakdown, historicalData, largestIncrease, biggestSaving } = analytics;
  const totalMonthlyCost = Object.values(categoryBreakdown).reduce((sum, cost) => sum + cost, 0);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const pieData = Object.entries(categoryBreakdown)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
  
  const COLORS = ['#4f46e5', '#7c3aed', '#ec4899', '#f59e0b', '#10b981'];
  const currentMonthName = format(new Date(), 'MMM');

  if (subscriptions.length === 0) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Category Breakdown Donut Chart */}
      <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center space-x-2 mb-4">
          <PieChart className="w-5 h-5 text-indigo-600" />
          <h3 className="text-lg font-semibold text-gray-900">Spending by Category</h3>
        </div>
        <div className="w-full h-52 relative">
            <ResponsiveContainer>
                <RechartsPieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} fill="#8884d8" paddingAngle={5} onMouseEnter={(_, index) => setActiveIndex(index)} onMouseLeave={() => setActiveIndex(null)}>
                        {/* --- FIX: The 'entry' variable is now used in the key --- */}
                        {pieData.map((entry, index) => <Cell key={entry.name} fill={COLORS[index % COLORS.length]} opacity={activeIndex === null || activeIndex === index ? 1 : 0.3} />)}
                    </Pie>
                    <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                </RechartsPieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xs text-gray-500">Total Monthly</span>
                <span className="text-2xl font-bold text-gray-900">${totalMonthlyCost.toFixed(2)}</span>
            </div>
        </div>
        <div className="mt-4 space-y-2">
            {pieData.slice(0, 4).map((entry, index) => (
                <div key={entry.name} className="flex items-center justify-between text-sm cursor-pointer" onMouseEnter={() => setActiveIndex(index)} onMouseLeave={() => setActiveIndex(null)}>
                    <div className="flex items-center space-x-2"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}/><span>{entry.name}</span></div>
                    <span className="font-medium">${entry.value.toFixed(2)}</span>
                </div>
            ))}
        </div>
      </div>

      {/* 6-Month Spending Trend Bar Chart */}
      <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center space-x-2 mb-4">
          <BarChart3 className="w-5 h-5 text-indigo-600" />
          <h3 className="text-lg font-semibold text-gray-900">6-Month Spending Trend</h3>
        </div>
        <div className="w-full h-64">
            <ResponsiveContainer>
                <RechartsBarChart data={historicalData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={(value) => `$${value.toFixed(0)}`} tick={{ fontSize: 12 }} />
                    <Tooltip cursor={{ fill: 'rgba(79, 70, 229, 0.1)' }} formatter={(value: number) => `$${value.toFixed(2)}`} />
                    <Bar dataKey="cost" radius={[4, 4, 0, 0]}>
                        {historicalData.map((entry, index) => (
                            <Cell 
                                key={entry.name} 
                                fill={COLORS[index % COLORS.length]} 
                                opacity={entry.name === currentMonthName ? 1 : 0.6}
                            />
                        ))}
                    </Bar>
                </RechartsBarChart>
            </ResponsiveContainer>
        </div>
        {/* Key Movers Section */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {largestIncrease && (
                <Link to={`/subscriptions/${largestIncrease.id}`} className="block p-3 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors">
                    <div className="flex items-center space-x-2 text-yellow-800"><TrendingUp size={16}/> <span className="text-sm font-semibold">Largest Increase</span></div>
                    <p className="mt-1 text-sm">{largestIncrease.name} went up by ${largestIncrease.increase.toFixed(2)}.</p>
                </Link>
            )}
            {biggestSaving && (
                <Link to={`/subscriptions/${biggestSaving.id}`} className="block p-3 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors">
                    <div className="flex items-center space-x-2 text-green-800"><TrendingDown size={16}/> <span className="text-sm font-semibold">Biggest Saving</span></div>
                    <p className="mt-1 text-sm">You saved ${biggestSaving.cost.toFixed(2)}/mo by canceling {biggestSaving.name}.</p>
                </Link>
            )}
        </div>
      </div>
    </div>
  );
};

export default VisualDashboard;
