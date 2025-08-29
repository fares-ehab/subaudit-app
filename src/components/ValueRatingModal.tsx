import React, { useState, useEffect, useMemo } from 'react';
import { Star, X, Calendar, Check, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { format, differenceInDays, parseISO } from 'date-fns';
import { updateSubscriptionRating } from '../lib/subscriptions';
import { Subscription } from '../types';

interface ValueRatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscription: Subscription;
  onSuccess: () => void;
}

const ValueRatingModal: React.FC<ValueRatingModalProps> = ({
  isOpen,
  onClose,
  subscription,
  onSuccess
}) => {
  const [rating, setRating] = useState(0);
  const [lastUsedDate, setLastUsedDate] = useState('');
  const [notes, setNotes] = useState('');
  const [cancellationReason, setCancellationReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
        setRating(subscription.value_rating || 0);
        setLastUsedDate(subscription.last_used_date ? format(parseISO(subscription.last_used_date), 'yyyy-MM-dd') : '');
        setNotes(subscription.notes || '');
        setCancellationReason(subscription.cancellation_reason || '');
    }
  }, [isOpen, subscription]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }
    setIsSubmitting(true);
    try {
      await updateSubscriptionRating(subscription.id, rating, lastUsedDate, notes, cancellationReason);
      toast.success('Rating updated successfully!');
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update rating');
    } finally {
      setIsSubmitting(false);
    }
  };

  const ratingFeedback = [
    "", "Not valuable - consider canceling.", "Low value - is this really worth it?",
    "Moderate value - useful, but not essential.", "High value - a great subscription.",
    "Essential - can't live without it!",
  ];

  const monthlyCost = useMemo(() => {
    if (subscription.billing_cycle === 'monthly') return subscription.cost;
    if (subscription.billing_cycle === 'yearly') return subscription.cost / 12;
    if (subscription.billing_cycle === 'weekly') return (subscription.cost * 52) / 12;
    return 0;
  }, [subscription]);
  
  const coffeeEquivalent = (monthlyCost / 4).toFixed(0);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="flex items-center justify-between p-5 border-b">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Rate Your Subscription</h2>
                <p className="text-sm text-gray-600 mt-1">{subscription.name}</p>
              </div>
              <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100"><X className="w-6 h-6 text-gray-500" /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">How valuable is this subscription to you?</label>
                <div className="flex items-center space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <motion.button whileTap={{ scale: 1.2 }} key={star} type="button" onClick={() => setRating(star)}>
                      <Star className={`w-8 h-8 transition-all duration-150 ${star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300 hover:text-yellow-300'}`} />
                    </motion.button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2 h-4">{rating > 0 && ratingFeedback[rating]}</p>
              </div>

              <AnimatePresence>
                {rating > 0 && rating <= 2 && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Why the low rating? (Optional)</label>
                        <select value={cancellationReason} onChange={(e) => setCancellationReason(e.target.value)} className="w-full p-2 border rounded-lg">
                            <option value="">Select a reason...</option>
                            <option value="too_expensive">Too expensive</option>
                            <option value="not_using_enough">Not using it enough</option>
                            <option value="found_alternative">Found a better alternative</option>
                            <option value="bad_service">Bad service/experience</option>
                        </select>
                    </motion.div>
                )}
              </AnimatePresence>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">When did you last use this? (Optional)</label>
                <div className="flex items-center space-x-2">
                    <div className="relative flex-grow">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input type="date" value={lastUsedDate} onChange={(e) => setLastUsedDate(e.target.value)} max={format(new Date(), 'yyyy-MM-dd')} className="w-full pl-10 pr-4 py-2 border rounded-lg" />
                    </div>
                    <button type="button" onClick={() => setLastUsedDate(format(new Date(), 'yyyy-MM-dd'))} className="bg-indigo-100 text-indigo-700 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-indigo-200">Used Today</button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                <div className="relative">
                    <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-gray-400"/>
                    <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="e.g., Planning to cancel in December..." className="w-full pl-10 pr-4 py-2 border rounded-lg"/>
                </div>
              </div>

              {monthlyCost > 0 && (
                <div className="text-xs text-center text-gray-500 bg-gray-50 p-2 rounded-md">
                    💡 This subscription costs about the same as <strong>{coffeeEquivalent} cup{coffeeEquivalent === '1' ? '' : 's'} of coffee</strong> per month.
                </div>
              )}

              <div className="flex space-x-3 pt-4 border-t">
                <button type="button" onClick={onClose} className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium">Cancel</button>
                <button type="submit" disabled={isSubmitting || rating === 0} className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center space-x-2 font-medium">
                    {isSubmitting ? <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin"/> : <Check/>}
                    <span>{isSubmitting ? 'Saving...' : 'Save Rating'}</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ValueRatingModal;
