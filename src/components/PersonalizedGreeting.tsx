import React, { useMemo } from 'react';
// --- FIX: All icons are now correctly used ---
import { Coffee, Sun, Moon, Star, Target, Bell, Flame } from 'lucide-react';
import { differenceInDays, parseISO } from 'date-fns';
import { motion } from 'framer-motion';
import { Subscription } from '../types';
import { User } from '@supabase/supabase-js';
import { Link } from 'react-router-dom';

// --- Randomized Motivational Tips ---
const motivationalTips = [
    "Did you know the average person saves over $200/year by tracking subs?",
    "Reviewing your subscriptions once a month is a great habit.",
    "Look for yearly plans on services you love to save up to 20%.",
    "A quick audit today could save you money tomorrow!",
];

interface PersonalizedGreetingProps {
  user: User | null;
  subscriptions: Subscription[];
  mindfulStreak: number;
}

const PersonalizedGreeting: React.FC<PersonalizedGreetingProps> = ({ user, subscriptions, mindfulStreak }) => {
  const randomTip = useMemo(() => motivationalTips[Math.floor(Math.random() * motivationalTips.length)], []);

  const getTimeBasedContent = () => {
    const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'there';
    const hour = new Date().getHours();
    if (hour < 12) return { text: `Good morning, ${userName}`, icon: Sun, gradient: 'from-yellow-50 via-orange-50 to-red-50' };
    if (hour < 17) return { text: `Good afternoon, ${userName}`, icon: Coffee, gradient: 'from-orange-50 via-red-50 to-pink-50' };
    return { text: `Good evening, ${userName}`, icon: Moon, gradient: 'from-indigo-50 via-purple-50 to-pink-50' };
  };

  // --- FIX: The logic now returns a dynamic message, icon, and action ---
  const personalizedContent = useMemo(() => {
    const activeSubs = subscriptions.filter(s => s.is_active);
    const upcomingRenewal = activeSubs.find(s => {
        const daysUntilRenewal = differenceInDays(parseISO(s.next_renewal_date), new Date());
        return daysUntilRenewal >= 0 && daysUntilRenewal <= 5;
    });
    const totalMonthlyCost = activeSubs.reduce((total, sub) => {
      if (sub.billing_cycle === 'monthly') return total + sub.cost;
      if (sub.billing_cycle === 'yearly') return total + sub.cost / 12;
      if (sub.billing_cycle === 'weekly') return total + (sub.cost * 52) / 12;
      return total;
    }, 0);

    if (upcomingRenewal) {
      return { 
          message: `Heads up! Your ${upcomingRenewal.name} subscription renews in a few days.`,
          icon: Bell,
          action: { text: "Review Renewal", link: `/subscriptions/${upcomingRenewal.id}` }
      };
    }
    if (totalMonthlyCost > 100) {
      return { 
          message: `You're spending over $${totalMonthlyCost.toFixed(0)}/month. Time to optimize?`,
          icon: Target,
          action: { text: "Optimize Spending", link: "/insights" }
      };
    }
    return { 
        message: randomTip,
        icon: Star,
        action: null
    };
  }, [subscriptions, randomTip]);

  const greeting = getTimeBasedContent();
  const GreetingIcon = greeting.icon;
  const MessageIcon = personalizedContent.icon;

  return (
    <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={`bg-gradient-to-r ${greeting.gradient} rounded-xl p-6 border`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <GreetingIcon className="w-8 h-8 text-gray-700" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{greeting.text}! 👋</h2>
            <div className="flex items-center space-x-2 text-gray-600 mt-1">
                <MessageIcon className="w-4 h-4 flex-shrink-0" />
                <p>{personalizedContent.message}</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
            {personalizedContent.action && (
                <Link to={personalizedContent.action.link} className="hidden lg:inline-block bg-white text-indigo-600 font-semibold px-4 py-2 rounded-lg border border-indigo-200 hover:bg-indigo-50 transition-colors">
                    {personalizedContent.action.text}
                </Link>
            )}
            {mindfulStreak > 0 && (
                <div className="hidden sm:flex items-center space-x-2 bg-white/60 rounded-full px-4 py-2 border">
                    <Flame className="w-5 h-5 text-orange-500" />
                    <span className="font-semibold text-orange-600">{mindfulStreak}-Month Mindful Streak</span>
                </div>
            )}
        </div>
      </div>
    </motion.div>
  );
};

export default PersonalizedGreeting;
