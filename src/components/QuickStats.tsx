import React, { useEffect } from 'react';
// --- FIX: All icons are now correctly used ---
import { Calendar, DollarSign, TrendingUp, TrendingDown, Tag, Repeat } from 'lucide-react';
import { Link } from 'react-router-dom';
// --- FIX: 'motion' is now used for animations ---
import { motion, useAnimate, useInView } from 'framer-motion';
import { differenceInDays, isSameMonth, isSameYear, parseISO, subMonths } from 'date-fns';
import { Subscription } from '../types';

// --- Animated Number Component ---
const AnimatedNumber = ({ value, isCurrency = false }: { value: number, isCurrency?: boolean }) => {
    const [scope, animate] = useAnimate();
    const isInView = useInView(scope, { once: true, margin: "-20px" });

    useEffect(() => {
        if (isInView) {
            animate(0, value, {
                duration: 1.5,
                ease: "easeOut",
                onUpdate: (latest) => {
                    if (scope.current) {
                        scope.current.textContent = isCurrency ? latest.toFixed(2) : latest.toFixed(0);
                    }
                }
            });
        }
    }, [isInView, value, isCurrency, animate, scope]);

    return <span ref={scope}>{isCurrency ? '0.00' : '0'}</span>;
};

interface QuickStatsProps { 
    subscriptions: Subscription[]; 
}

const QuickStats: React.FC<QuickStatsProps> = ({ subscriptions }) => {
  const activeSubs = subscriptions.filter(s => s.is_active);
  const now = new Date();
  const lastMonthDate = subMonths(now, 1);

  // --- Calculations ---
  const thisMonthRenewals = activeSubs.filter(sub => isSameMonth(parseISO(sub.next_renewal_date), now) && isSameYear(parseISO(sub.next_renewal_date), now));
  const thisMonthCost = thisMonthRenewals.reduce((total, sub) => total + sub.cost, 0);
  
  const lastMonthRenewals = activeSubs.filter(sub => isSameMonth(parseISO(sub.next_renewal_date), lastMonthDate) && isSameYear(parseISO(sub.next_renewal_date), lastMonthDate));
  const lastMonthCost = lastMonthRenewals.reduce((total, sub) => total + sub.cost, 0);

  const upcomingRenewalsCount = activeSubs.filter(sub => {
    const days = differenceInDays(parseISO(sub.next_renewal_date), now);
    return days <= 7 && days >= 0;
  }).length;

  const spendingTrend = lastMonthCost > 0 ? ((thisMonthCost - lastMonthCost) / lastMonthCost) * 100 : (thisMonthCost > 0 ? 100 : 0);

  const annualizedCost = activeSubs.reduce((total, sub) => {
    if (sub.billing_cycle === 'monthly') return total + sub.cost * 12;
    if (sub.billing_cycle === 'yearly') return total + sub.cost;
    if (sub.billing_cycle === 'weekly') return total + sub.cost * 52;
    return total;
  }, 0);
  
  const topCategory = thisMonthRenewals.reduce((acc, sub) => {
      acc[sub.category] = (acc[sub.category] || 0) + sub.cost;
      return acc;
  }, {} as Record<string, number>);
  const topCategoryName = Object.keys(topCategory).reduce((a, b) => topCategory[a] > topCategory[b] ? a : b, 'None');


  const stats = [
    { title: 'This Month Charges', value: thisMonthCost, icon: DollarSign, color: 'blue', subtitle: `${thisMonthRenewals.length} renewals`, isCurrency: true, trend: spendingTrend, link: '/renewals/month' },
    { title: 'Next 7 Days', value: upcomingRenewalsCount, icon: Calendar, color: 'orange', subtitle: 'renewals due', link: '/renewals/week' },
    { title: 'Annualized Cost', value: annualizedCost, icon: Repeat, color: 'green', subtitle: 'projected yearly spend', isCurrency: true, link: '/reports/annual' },
    // --- FIX: Added "Top Category" stat back in ---
    { title: 'Top Category', value: topCategoryName, icon: Tag, color: 'purple', subtitle: 'highest spend this month', isText: true, link: '/reports/categories' },
  ];
  
  // --- FIX: Animation variants for the container ---
  const containerVariants = {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  return (
    <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
    >
      {stats.map((stat) => <StatCard key={stat.title} {...stat} />)}
    </motion.div>
  );
};

// --- Stat Card Component ---
const StatCard = (props: any) => {
    const { title, value, icon: Icon, color, subtitle, isCurrency, isText, trend, link } = props;
    const colorClasses = {
      blue: { bg: 'bg-blue-50', text: 'text-blue-600', pattern: 'bg-blue-100' },
      orange: { bg: 'bg-orange-50', text: 'text-orange-600', pattern: 'bg-orange-100' },
      green: { bg: 'bg-green-50', text: 'text-green-600', pattern: 'bg-green-100' },
      purple: { bg: 'bg-purple-50', text: 'text-purple-600', pattern: 'bg-purple-100' },
    };
    const colors = colorClasses[color as keyof typeof colorClasses];
    
    // --- FIX: Animation variants for each card ---
    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    return (
        <motion.div variants={itemVariants}>
            <Link to={link} className={`relative block h-full overflow-hidden rounded-xl border p-4 shadow-sm transition-transform hover:-translate-y-1 ${colors.bg}`}>
                <div className="flex items-start justify-between">
                    <div>
                        <p className={`font-semibold ${colors.text}`}>{title}</p>
                        <div className={`mt-2 text-3xl font-bold ${colors.text}`}>
                            {isCurrency && '$'}
                            {isText ? value : <AnimatedNumber value={value} isCurrency={isCurrency} />}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
                    </div>
                    <div className={`p-2 rounded-lg ${colors.pattern}`}><Icon className="w-5 h-5" /></div>
                </div>
                {trend !== undefined && (
                    <div className={`mt-2 flex items-center space-x-1 text-xs ${trend >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                        {trend >= 0 ? <TrendingUp size={14}/> : <TrendingDown size={14}/>}
                        <span>{Math.abs(trend).toFixed(0)}% vs last month</span>
                    </div>
                )}
            </Link>
        </motion.div>
    );
};

export default QuickStats;
