import React from 'react';
import { AlertTriangle, ChevronDown, MoreVertical, TrendingUp, TrendingDown } from 'lucide-react';
import { format, addDays, isSameDay, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { Subscription } from '../types';

interface UpcomingRenewalsAlertProps {
  upcomingRenewals: Subscription[];
  lastWeekCost: number;
}

const UpcomingRenewalsAlert: React.FC<UpcomingRenewalsAlertProps> = ({ upcomingRenewals, lastWeekCost }) => {
  const [isOpen, setIsOpen] = React.useState(true);
  const [visibleRenewals, setVisibleRenewals] = React.useState(upcomingRenewals);

  React.useEffect(() => {
    setVisibleRenewals(upcomingRenewals);
  }, [upcomingRenewals]);

  const handleSnooze = (id: string) => {
    setVisibleRenewals(prev => prev.filter(sub => sub.id !== id));
    toast.success("Renewal snoozed for 24 hours.");
  };

  if (visibleRenewals.length === 0) return null;

  const totalUpcomingCost = visibleRenewals.reduce((sum, sub) => sum + sub.cost, 0);
  const costTrend = lastWeekCost > 0 ? ((totalUpcomingCost - lastWeekCost) / lastWeekCost) * 100 : (totalUpcomingCost > 0 ? 100 : 0);

  const today = new Date();
  const timelineDays = Array.from({ length: 7 }, (_, i) => addDays(today, i));
  const renewalsByDay = timelineDays.map(day => ({
      day,
      renewals: visibleRenewals.filter(sub => isSameDay(parseISO(sub.next_renewal_date), day))
  }));

  return (
    <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl shadow-sm border border-orange-200">
      <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-start justify-between p-5 text-left">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-6 h-6 text-orange-600 mt-1 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-orange-800">{visibleRenewals.length} renewals this week</h3>
            <div className="flex items-center space-x-4 text-sm text-orange-700">
                <span>Total: <span className="font-semibold">${totalUpcomingCost.toFixed(2)}</span></span>
                <div className={`flex items-center space-x-1 ${costTrend >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                    {costTrend >= 0 ? <TrendingUp size={14}/> : <TrendingDown size={14}/>}
                    <span>{Math.abs(costTrend).toFixed(0)}% vs last week</span>
                </div>
            </div>
          </div>
        </div>
        <ChevronDown className={`w-5 h-5 text-orange-700 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="px-5 pb-5 space-y-4">
              {renewalsByDay.map(({ day, renewals }) => renewals.length > 0 && (
                <div key={day.toString()}>
                    <p className="text-xs font-semibold text-orange-700 uppercase tracking-wider mb-2">
                        {format(day, 'EEEE, MMM d')}
                    </p>
                    <div className="space-y-2">
                        <AnimatePresence>
                            {renewals.map(sub => <RenewalItem key={sub.id} subscription={sub} onSnooze={handleSnooze} />)}
                        </AnimatePresence>
                    </div>
                </div>
              ))}
              <div className="pt-2">
                {/* --- FIX: This link now correctly points to /renewals/week --- */}
                <Link to="/renewals/week" className="w-full text-center block bg-white text-orange-700 font-semibold px-4 py-2 rounded-lg border border-orange-300 hover:bg-orange-100">View Full Calendar</Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Renewal Item Component ---
const RenewalItem: React.FC<{ subscription: Subscription; onSnooze: (id: string) => void; }> = ({ subscription, onSnooze }) => {
  const isHighCost = subscription.cost > 50;
  return (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }} className="flex items-center justify-between bg-white/60 rounded-md p-3">
      <div className="flex items-center space-x-3">
        {isHighCost && (
            <span title="High Cost">
                <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
            </span>
        )}
        <span className="font-medium text-orange-800">{subscription.name}</span>
      </div>
      <div className="flex items-center space-x-2">
        <div className="text-sm font-semibold text-orange-800">${subscription.cost.toFixed(2)}</div>
        <Menu as="div" className="relative">
            <MenuButton className="p-1.5 rounded-full text-orange-600 hover:bg-orange-200"><MoreVertical size={16} /></MenuButton>
            <MenuItems anchor="bottom end" className="w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 z-10">
                <div className="py-1">
                    <MenuItem><Link to={`/subscriptions/${subscription.id}`} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 data-[focus]:bg-gray-100">Review Details</Link></MenuItem>
                    <MenuItem><button onClick={() => onSnooze(subscription.id)} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 data-[focus]:bg-gray-100">Snooze Alert</button></MenuItem>
                    <div className="my-1 h-px bg-gray-100"/>
                    <MenuItem><Link to={`/subscriptions/${subscription.id}/cancel`} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 data-[focus]:bg-red-50">Cancel Subscription</Link></MenuItem>
                </div>
            </MenuItems>
        </Menu>
      </div>
    </motion.div>
  );
};

export default UpcomingRenewalsAlert;
