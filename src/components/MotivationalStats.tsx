import React, { useState, useEffect, useMemo } from 'react';
import { TrendingDown, Award, Zap, Flame, Star, Share2, HelpCircle, Target } from 'lucide-react';
import { motion, AnimatePresence, useInView, useAnimate } from 'framer-motion';
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react';
import { toast } from 'react-hot-toast';
import { Subscription } from '../types';

// --- Custom Hook for all Analytics Logic ---
const useSubscriptionAnalytics = (subscriptions: Subscription[]) => {
  return useMemo(() => {
    const monthlySavings = subscriptions
      .filter(s => !s.is_active)
      .reduce((total, sub) => {
        if (sub.billing_cycle === 'monthly') return total + sub.cost;
        if (sub.billing_cycle === 'yearly') return total + sub.cost / 12;
        if (sub.billing_cycle === 'weekly') return total + (sub.cost * 52) / 12;
        return total;
      }, 0);

    const ratedSubs = subscriptions.filter(s => typeof s.value_rating === 'number');
    const highValueSubsCount = ratedSubs.filter(s => s.value_rating! >= 4).length;
    const lowValueSubs = ratedSubs.filter(s => s.value_rating! <= 2);
    const optimizationScore = Math.round((highValueSubsCount / Math.max(ratedSubs.length, 1)) * 100);

    const now = new Date();
    let mindfulStreak = 0;
    for (let i = 0; i < 12; i++) {
        const monthToCheck = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const hasActivity = subscriptions.some(s => new Date(s.created_at) >= monthToCheck && new Date(s.created_at) < new Date(now.getFullYear(), now.getMonth() - i + 1, 1));
        if (hasActivity) mindfulStreak++;
        else break;
    }

    const subscriptionOfTheMonth = [...subscriptions]
        .filter(s => s.is_active && typeof s.value_rating === 'number')
        .sort((a, b) => b.value_rating! - a.value_rating!)[0] || null;

    let challenge = null;
    if (lowValueSubs.length > 0) {
        challenge = { title: "Cancel a low-value sub", description: `You have ${lowValueSubs.length} subs rated 2 stars or less. Cancel one to save money!` };
    } else if (ratedSubs.length < subscriptions.length) {
        challenge = { title: "Review your subscriptions", description: `You have ${subscriptions.length - ratedSubs.length} unrated subs. Rate them to improve your score!` };
    }

    return { monthlySavings, highValueSubsCount, optimizationScore, mindfulStreak, subscriptionOfTheMonth, challenge };
  }, [subscriptions]);
};


const MotivationalStats: React.FC<{ subscriptions: Subscription[] }> = ({ subscriptions }) => {
  const analytics = useSubscriptionAnalytics(subscriptions);
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    if (analytics.monthlySavings >= 100 && sessionStorage.getItem('hasSharedSavings') !== 'true') {
      setShowShareModal(true);
      sessionStorage.setItem('hasSharedSavings', 'true');
    }
  }, [analytics.monthlySavings]);

  const stats = [
    { title: 'Money Saved', value: analytics.monthlySavings, prefix: '$', suffix: '/mo', icon: TrendingDown, color: 'green', show: analytics.monthlySavings > 0, tooltip: "Total monthly cost of all subscriptions you've cancelled." },
    { title: 'Mindful Streak', value: analytics.mindfulStreak, suffix: ' months', icon: Flame, color: 'orange', show: analytics.mindfulStreak > 1, tooltip: "Consecutive months you've actively managed (added/reviewed) subscriptions." },
    { title: 'Optimization Score', value: analytics.optimizationScore, suffix: '%', icon: Zap, color: 'purple', show: subscriptions.some(s => s.value_rating), tooltip: "Percentage of your rated subscriptions that you consider high-value (4+ stars)." }
  ].filter(stat => stat.show);

  if (stats.length === 0 && !analytics.subscriptionOfTheMonth) return null;

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Award className="w-5 h-5 text-indigo-600" />
          <h3 className="text-lg font-semibold text-gray-900">Your Achievements 🎉</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stats.map((stat) => <StatCard key={stat.title} {...stat} />)}
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {analytics.subscriptionOfTheMonth && <SubscriptionOfTheMonth sub={analytics.subscriptionOfTheMonth} />}
            {analytics.challenge && <PersonalizedChallenge challenge={analytics.challenge} />}
        </div>
      </div>
      <ShareableAchievementModal isOpen={showShareModal} onClose={() => setShowShareModal(false)} savings={analytics.monthlySavings} />
    </>
  );
};


const StatCard: React.FC<{ title: string; value: number; prefix?: string; suffix?: string; icon: React.ElementType; color: string; tooltip: string }> = ({ title, value, prefix, color, suffix, icon: Icon, tooltip }) => {
    const colors: Record<string, any> = { green: 'text-green-600 bg-green-50 border-green-200', orange: 'text-orange-600 bg-orange-50 border-orange-200', purple: 'text-purple-600 bg-purple-50 border-purple-200' };
    return (
        <motion.div className={`border rounded-lg p-4 ${colors[color]}`}>
            <div className="flex items-center justify-between">
                <h4 className="font-semibold flex items-center space-x-1"><Icon size={16}/><span>{title}</span></h4>
                <Popover className="relative">
                    <PopoverButton className="p-1 rounded-full hover:bg-black/10"><HelpCircle size={16}/></PopoverButton>
                    <PopoverPanel anchor="bottom end" className="z-10 mt-2 w-64 rounded-lg bg-gray-800 text-white text-xs p-3 shadow-lg">{tooltip}</PopoverPanel>
                </Popover>
            </div>
            <div className="text-3xl font-bold mt-2"><AnimatedNumber value={value} prefix={prefix} suffix={suffix} /></div>
        </motion.div>
    );
};

const SubscriptionOfTheMonth: React.FC<{ sub: Subscription }> = ({ sub }) => (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center space-x-2 text-yellow-700 font-semibold">
            <Star size={16}/><h4>Subscription of the Month</h4>
        </div>
        <p className="mt-2 text-2xl font-bold text-yellow-800">{sub.name}</p>
        <p className="text-sm text-yellow-700">You rated it {sub.value_rating}/5 stars!</p>
    </div>
);

const PersonalizedChallenge: React.FC<{ challenge: { title: string; description: string } }> = ({ challenge }) => (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center space-x-2 text-blue-700 font-semibold">
            <Target size={16}/><h4>Your Next Challenge</h4>
        </div>
        <p className="mt-2 text-lg font-semibold text-blue-800">{challenge.title}</p>
        <p className="text-sm text-blue-700">{challenge.description}</p>
    </div>
);

const ShareableAchievementModal: React.FC<{ isOpen: boolean; onClose: () => void; savings: number }> = ({ isOpen, onClose, savings }) => (
    <AnimatePresence>
        {isOpen && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white rounded-xl shadow-2xl max-w-md w-full">
                    <div className="p-6 text-center">
                        <Award className="w-16 h-16 text-yellow-500 mx-auto"/>
                        <h3 className="text-2xl font-bold mt-4">Achievement Unlocked!</h3>
                        <p className="text-gray-600 mt-2">You're now saving over <span className="font-bold text-green-600">${savings.toFixed(0)} every month!</span> That's amazing progress.</p>
                        <button onClick={() => toast.success("Shared to your profile!")} className="mt-6 w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 flex items-center justify-center space-x-2"><Share2 size={18}/><span>Share Achievement</span></button>
                        <button onClick={onClose} className="mt-2 text-sm text-gray-500">Close</button>
                    </div>
                </motion.div>
            </div>
        )}
    </AnimatePresence>
);

const AnimatedNumber = ({ value, prefix = '', suffix = '' }: { value: number, prefix?: string, suffix?: string }) => {
    const [scope, animate] = useAnimate();
    const isInView = useInView(scope, { once: true, margin: "-50px" });

    useEffect(() => {
        if (isInView) {
            animate(0, value, {
                duration: 1.5,
                ease: "easeOut",
                onUpdate: (latest) => {
                    if (scope.current) {
                        const isDecimal = value % 1 !== 0;
                        scope.current.textContent = `${prefix}${isDecimal ? latest.toFixed(2) : latest.toFixed(0)}${suffix}`;
                    }
                }
            });
        }
    }, [isInView, value, prefix, suffix, animate, scope]);

    const isDecimal = value % 1 !== 0;
    const initialValue = `${prefix}${isDecimal ? (0).toFixed(2) : 0}${suffix}`;

    return <span ref={scope}>{initialValue}</span>;
};

export default MotivationalStats;
