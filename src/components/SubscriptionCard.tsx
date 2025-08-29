import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Edit, Trash2, MoreVertical, PauseCircle, PlayCircle, Star, CalendarCheck2, CheckCircle } from 'lucide-react';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { toast } from 'react-hot-toast';
import { format, formatDistanceToNow, parseISO, isValid, differenceInDays } from 'date-fns';
import { updateSubscription, cancelSubscription, updateSubscriptionRating, renewSubscription } from '../lib/subscriptions';
import { Subscription } from '../types';
import ValueRatingModal from './ValueRatingModal';

// --- Helper function ---
const getRenewalInfo = (dateString: string) => {
  const renewalDate = parseISO(dateString);
  if (!isValid(renewalDate)) {
    return { text: 'Invalid Date', color: 'text-red-500' };
  }

  const today = new Date();
  const diffDays = Math.ceil((renewalDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { text: 'Expired', color: 'text-red-500' };
  if (diffDays === 0) return { text: 'Renews Today', color: 'text-orange-500 font-bold' };
  if (diffDays <= 7) return { text: `in ${diffDays} day(s)`, color: 'text-yellow-600' };
  return { text: `on ${format(renewalDate, 'MMM d')}`, color: 'text-gray-500' };
};

// --- Star Rating ---
const StarRating: React.FC<{ rating: number; onRate: (rating: number) => void }> = ({ rating, onRate }) => (
  <div className="flex items-center space-x-1">
    {[1, 2, 3, 4, 5].map((star) => (
      <button key={star} type="button" onClick={() => onRate(star)}>
        <Star
          className={`w-5 h-5 transition-colors ${
            star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300 hover:text-yellow-300'
          }`}
        />
      </button>
    ))}
  </div>
);

const SubscriptionCard: React.FC<{
  subscription: Subscription;
  selected: boolean;
  onSelect: (id: string, selected: boolean) => void;
  onUpdate: () => void;
}> = ({ subscription, selected, onSelect, onUpdate }) => {
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);

   const handleRenew = async () => {
    const promise = renewSubscription(subscription);
    toast.promise(promise, {
        loading: 'Updating renewal date...',
        success: () => {
            onUpdate();
            return `"${subscription.name}" marked as renewed!`;
        },
        error: 'Failed to update renewal.',
    });
  };

  const handleDelete = async () => {
    const promise = cancelSubscription(subscription.id);
    toast.promise(promise, {
      loading: 'Canceling...',
      success: 'Canceled!',
      error: 'Failed.',
    });
    await promise.catch(() => {});
    onUpdate();
  };

  const handleToggleActive = async () => {
    const promise = updateSubscription(subscription.id, { is_active: !subscription.is_active });
    toast.promise(promise, {
      loading: 'Updating...',
      success: 'Status updated!',
      error: 'Failed.',
    });
    await promise.catch(() => {});
    onUpdate();
  };

  const handleRate = async (rating: number) => {
    try {
      await updateSubscriptionRating(subscription.id, rating);
      toast.success(`Rated ${rating} stars!`);
      onUpdate();
    } catch {
      toast.error('Failed to save rating.');
    }
  };

  const handleMarkAsUsed = async () => {
    const promise = updateSubscription(subscription.id, { last_used_date: new Date().toISOString() });
    toast.promise(promise, {
      loading: 'Updating...',
      success: 'Usage updated!',
      error: 'Failed.',
    });
    await promise.catch(() => {});
    onUpdate();
  };

  const renewalInfo = getRenewalInfo(subscription.next_renewal_date);
  const daysUntilRenewal = differenceInDays(parseISO(subscription.next_renewal_date), new Date());
  const isDueForRenewal = daysUntilRenewal <= 7;
  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className={`relative rounded-xl border transition-all ${
          selected ? 'border-indigo-500 ring-2' : 'border-gray-200 bg-white'
        } ${!subscription.is_active ? 'opacity-60 bg-gray-50' : ''}`}
      >
        <div className="p-5 space-y-4">
          {/* --- Top Section --- */}
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              <input
                type="checkbox"
                checked={selected}
                onChange={(e) => onSelect(subscription.id, e.target.checked)}
                className="mt-1 h-5 w-5 rounded border-gray-300 text-indigo-600"
              />
              <div className="flex items-center space-x-3">
                <img
                  src={`https://logo.clearbit.com/${subscription.name.toLowerCase().replace(/\s+/g, '')}.com`}
                  alt={`${subscription.name} logo`}
                  className="h-10 w-10 rounded-full object-contain border"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = `https://placehold.co/40/EBF4FF/7F9CF5?text=${subscription.name.charAt(
                      0
                    )}`;
                  }}
                />
                <div>
                  <h3 className="font-bold text-lg text-gray-800">{subscription.name}</h3>
                  <span className="text-sm bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
                    {subscription.category}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">
                ${parseFloat(subscription.cost.toString()).toFixed(2)}
              </p>
              <p className="text-sm text-gray-500 capitalize">/ {subscription.billing_cycle}</p>
            </div>
          </div>

          {/* --- Renewal + Last Used --- */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-gray-50 p-2 rounded-md">
              <p className="text-xs text-gray-500">Next Renewal</p>
              <p className={`font-medium ${renewalInfo.color}`}>{renewalInfo.text}</p>
            </div>
            <div className="bg-gray-50 p-2 rounded-md">
              <p className="text-xs text-gray-500">Last Used</p>
              <p className="font-medium text-gray-700">
                {subscription.last_used_date
                  ? formatDistanceToNow(parseISO(subscription.last_used_date), { addSuffix: true })
                  : 'Not tracked'}
              </p>
            </div>
          </div>
          
          {isDueForRenewal && subscription.is_active && (
            <div className="pt-4 border-t">
                <button 
                    onClick={handleRenew}
                    className="w-full bg-green-100 text-green-700 font-semibold px-4 py-2 rounded-lg hover:bg-green-200 transition-colors flex items-center justify-center space-x-2"
                >
                    <CheckCircle size={16}/>
                    <span>Mark as Renewed</span>
                </button>
            </div>
          )}
          {/* --- Actions --- */}
          <div className="pt-4 border-t flex items-center justify-between">
            <StarRating rating={subscription.value_rating || 0} onRate={handleRate} />
            <div className="flex items-center space-x-2">
              <button
                onClick={handleMarkAsUsed}
                className="p-2 rounded-md hover:bg-gray-100 text-gray-500"
                title="Mark as used today"
              >
                <CalendarCheck2 size={18} />
              </button>
              <button
                onClick={() => setIsRatingModalOpen(true)}
                className="p-2 rounded-md hover:bg-gray-100 text-gray-500"
                title="Edit"
              >
                <Edit size={18} />
              </button>

              {/* Menu */}
              <Menu as="div" className="relative">
                <MenuButton className="p-2 rounded-md hover:bg-gray-100 text-gray-500">
                  <MoreVertical size={18} />
                </MenuButton>
                <MenuItems className="absolute right-0 mt-2 w-40 rounded-md bg-white shadow-lg ring-1 ring-black/5 z-10">
                  <div className="py-1">
                    <MenuItem>
                      <button
                        onClick={handleToggleActive}
                        className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100"
                      >
                        {subscription.is_active ? (
                          <>
                            <PauseCircle size={16} /> Pause
                          </>
                        ) : (
                          <>
                            <PlayCircle size={16} /> Resume
                          </>
                        )}
                      </button>
                    </MenuItem>
                    <div className="my-1 h-px bg-gray-100" />
                    <MenuItem>
                      <button
                        onClick={handleDelete}
                        className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <Trash2 size={16} /> Delete
                      </button>
                    </MenuItem>
                  </div>
                </MenuItems>
              </Menu>
            </div>
          </div>
        </div>

        {/* Overlay for paused/canceled */}
        {!subscription.is_active && (
          <div className="absolute inset-0 bg-gray-200/50 rounded-xl flex items-center justify-center">
            <span className="bg-gray-700 text-white px-3 py-1 rounded-full text-sm font-semibold">
              {subscription.cancellation_date ? 'Canceled' : 'Paused'}
            </span>
          </div>
        )}
      </motion.div>

      {/* Rating Modal */}
      <ValueRatingModal
        isOpen={isRatingModalOpen}
        onClose={() => setIsRatingModalOpen(false)}
        subscription={subscription}
        onSuccess={() => {
          onUpdate();
          setIsRatingModalOpen(false);
        }}
      />
    </>
  );
};

export default SubscriptionCard;
