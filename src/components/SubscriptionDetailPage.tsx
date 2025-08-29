import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, PauseCircle, PlayCircle, Star, Calendar, DollarSign, Clock } from 'lucide-react';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { Subscription } from '../types';
import { getSubscriptionById, updateSubscription, cancelSubscription } from '../lib/subscriptions';
import LoadingSpinner from './LoadingSpinner';
import ValueRatingModal from './ValueRatingModal';
import { toast } from 'react-hot-toast';

// --- Sub-components for easy customization ---

const DetailHeader: React.FC<{ subscription: Subscription }> = ({ subscription }) => (
    <div className="flex items-center space-x-4">
        <img 
            src={`https://logo.clearbit.com/${subscription.name.toLowerCase().replace(/\s+/g, '')}.com`}
            alt={`${subscription.name} logo`}
            className="h-16 w-16 rounded-full object-contain border"
            onError={(e) => { (e.currentTarget as HTMLImageElement).src = `https://placehold.co/64/EBF4FF/7F9CF5?text=${subscription.name.charAt(0)}`; }}
        />
        <div>
            <h1 className="text-3xl font-bold text-gray-900">{subscription.name}</h1>
            <span className="text-sm bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">{subscription.category}</span>
        </div>
    </div>
);

const KeyStats: React.FC<{ subscription: Subscription }> = ({ subscription }) => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={DollarSign} title="Cost" value={`$${subscription.cost.toFixed(2)} / ${subscription.billing_cycle}`} />
        <StatCard icon={Calendar} title="Next Renewal" value={format(parseISO(subscription.next_renewal_date), 'MMM d, yyyy')} />
        <StatCard icon={Star} title="Your Rating" value={subscription.value_rating ? `${subscription.value_rating} / 5` : 'Not Rated'} />
        <StatCard icon={Clock} title="Last Used" value={subscription.last_used_date ? formatDistanceToNow(parseISO(subscription.last_used_date), { addSuffix: true }) : 'Not Tracked'} />
    </div>
);

const StatCard: React.FC<{ icon: React.ElementType; title: string; value: string }> = ({ icon: Icon, title, value }) => (
    <div className="bg-gray-50 p-4 rounded-lg border">
        <div className="flex items-center space-x-2 text-gray-500">
            <Icon size={14}/>
            <p className="text-xs font-semibold uppercase tracking-wider">{title}</p>
        </div>
        <p className="text-lg font-bold text-gray-800 mt-1">{value}</p>
    </div>
);


const SubscriptionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);

  const fetchSubscription = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await getSubscriptionById(id);
      if (data) {
        setSubscription(data);
      } else {
        toast.error("Subscription not found.");
        navigate('/'); // Redirect to dashboard if not found
      }
    } catch (error) {
      toast.error("Failed to load subscription.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, [id]);

  const handleToggleActive = async () => {
    if (!subscription) return;
    const newStatus = !subscription.is_active;
    await toast.promise(updateSubscription(subscription.id, { is_active: newStatus }), {
        loading: 'Updating...', success: 'Status updated!', error: 'Failed to update.'
    });
    fetchSubscription(); // Refresh data
  };
  
  const handleDelete = async () => {
    if (!subscription) return;
    await toast.promise(cancelSubscription(subscription.id), {
        loading: 'Canceling...', success: 'Subscription Canceled!', error: 'Failed to cancel.'
    });
    navigate('/'); // Go back to dashboard after canceling
  };


  if (loading) {
    return <LoadingSpinner message="Loading subscription details..." />;
  }

  if (!subscription) {
    return <div className="text-center">Subscription not found.</div>;
  }

  return (
    <>
      <div className="space-y-6">
        <Link to="/" className="flex items-center space-x-2 text-sm text-gray-500 hover:text-gray-800">
          <ArrowLeft size={16} />
          <span>Back to Dashboard</span>
        </Link>

        <div className="bg-white p-6 rounded-xl border shadow-sm space-y-6">
            <DetailHeader subscription={subscription} />
            <KeyStats subscription={subscription} />
            <div className="flex items-center space-x-2 pt-6 border-t">
                <button onClick={() => setIsRatingModalOpen(true)} className="flex-1 bg-indigo-600 text-white font-semibold px-4 py-3 rounded-lg hover:bg-indigo-700 flex items-center justify-center space-x-2">
                    <Edit size={16}/><span>Edit / Rate</span>
                </button>
                <button onClick={handleToggleActive} className="bg-gray-200 text-gray-800 font-semibold px-4 py-3 rounded-lg hover:bg-gray-300 flex items-center justify-center space-x-2">
                    {subscription.is_active ? <><PauseCircle size={16}/><span>Pause</span></> : <><PlayCircle size={16}/><span>Resume</span></>}
                </button>
                <button onClick={handleDelete} className="bg-red-100 text-red-700 font-semibold px-4 py-3 rounded-lg hover:bg-red-200">
                    <Trash2 size={16}/>
                </button>
            </div>
        </div>
      </div>

      <ValueRatingModal
        isOpen={isRatingModalOpen}
        onClose={() => setIsRatingModalOpen(false)}
        subscription={subscription}
        onSuccess={() => {
            fetchSubscription(); // Refresh data after rating
            setIsRatingModalOpen(false);
        }}
      />
    </>
  );
};

export default SubscriptionDetailPage;
