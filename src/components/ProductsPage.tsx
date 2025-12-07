import React, { useState } from 'react';
import { CheckCircle, Loader2, Star } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthProvider';

const plans = [
  {
    id: 'Free Starter',
    name: 'Free Starter',
    price: '$0',
    description: 'Get started with the basics of subscription tracking.',
    features: ['Track up to 10 subscriptions', 'Basic analytics', 'Email reminders'],
  },
  {
    id: 'Pro',
    name: 'SubAudit Pro',
    price: '$10.99',
    priceFrequency: '/ month',
    description: 'For power users who want ultimate control and insights.',
    features: [
      'Track unlimited subscriptions',
      'Advanced analytics & reports',
      'AI-powered savings insights',
      'Bank account integration',
      'Priority support',
    ],
    isFeatured: true,
  },
];

const ProductsPage: React.FC = () => {
  const { profile } = useAuth();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleUpgrade = async () => {
    setIsRedirecting(true);
    try {
      const siteUrl = import.meta.env.VITE_SITE_URL;
      if (!siteUrl) {
        throw new Error("VITE_SITE_URL is not configured in your environment variables.");
      }

      const successUrl = `${siteUrl}/settings?upgrade=success`;
      const cancelUrl = `${siteUrl}/products`;

      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          successUrl,
          cancelUrl,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error("Could not retrieve checkout URL.");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to start the upgrade process.");
      setIsRedirecting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-center text-gray-900">Choose Your Plan</h1>
        <p className="text-gray-600 text-center mt-2">Take control of your subscriptions and start saving today.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {plans.map((plan) => {
          const isCurrentPlan = profile?.subscription_plan === plan.id;
          return (
            <div key={plan.id} className={`p-8 rounded-xl border-2 ${plan.isFeatured ? 'bg-indigo-600 text-white border-indigo-700 shadow-2xl' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center space-x-3 mb-4">
                <div className={`p-2 rounded-lg ${plan.isFeatured ? 'bg-white/20' : 'bg-indigo-100'}`}>
                  <Star className={`w-6 h-6 ${plan.isFeatured ? 'text-white' : 'text-indigo-600'}`} />
                </div>
                <h3 className="text-xl font-bold">{plan.name}</h3>
              </div>
              <p className={`my-4 ${plan.isFeatured ? 'text-white' : 'text-gray-900'}`}>
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className={plan.isFeatured ? 'text-indigo-200' : 'text-gray-500'}>{plan.priceFrequency}</span>
              </p>
              <ul className="space-y-3">
                {plan.features.map(f => <li key={f} className="flex items-center space-x-2"><CheckCircle className={`w-5 h-5 ${plan.isFeatured ? 'text-green-300' : 'text-green-500'}`} /><span>{f}</span></li>)}
              </ul>
              <p className={`mt-6 text-sm ${plan.isFeatured ? 'text-indigo-200' : 'text-gray-600'}`}>{plan.description}</p>
              
              {isCurrentPlan ? (
                <div className="w-full mt-8 py-3 rounded-lg font-semibold text-center bg-gray-200 text-gray-500 cursor-default">Current Plan</div>
              ) : (
                <button
                  onClick={plan.id === 'Pro' ? handleUpgrade : undefined}
                  disabled={isRedirecting}
                  className={`w-full mt-8 py-3 rounded-lg font-semibold ${plan.isFeatured ? 'bg-white text-indigo-600 hover:bg-gray-200' : 'bg-indigo-600 text-white hover:bg-indigo-700'} disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isRedirecting ? <Loader2 className="animate-spin mx-auto" /> : 'Upgrade'}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProductsPage;