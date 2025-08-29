import React, { useState, useEffect } from 'react';
import { TrendingDown, Target, Edit, Check, DollarSign, Award } from 'lucide-react';
import { motion, useAnimate, useInView } from 'framer-motion';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Subscription } from '../types';
import { supabase } from '../lib/supabase';
// import Confetti from 'react-confetti';

// --- Animated Number Component ---
const AnimatedNumber = ({ value }: { value: number }) => {
    const [scope, animate] = useAnimate();
    const isInView = useInView(scope, { once: true, margin: "-20px" });

    useEffect(() => {
        if (isInView) {
            animate(0, value, {
                duration: 1.5,
                ease: "easeOut",
                onUpdate: (latest) => {
                    if (scope.current) {
                        scope.current.textContent = latest.toFixed(2);
                    }
                }
            });
        }
    }, [isInView, value, animate, scope]);

    return <span ref={scope}>0.00</span>;
};

interface SavingsTrackerProps {
  subscriptions: Subscription[];
}

const SavingsTracker: React.FC<SavingsTrackerProps> = ({ subscriptions }) => {
  const [savingsGoal, setSavingsGoal] = useState<number | null>(null);
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState('');
  const [goalReached, setGoalReached] = useState(false);
  const [loadingGoal, setLoadingGoal] = useState(true);

  // --- FIX: This useEffect now automatically creates a profile if one doesn't exist ---
  useEffect(() => {
    const fetchAndEnsureProfile = async () => {
        setLoadingGoal(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setLoadingGoal(false);
            return;
        }

        // 1. Try to fetch the user's profile
        let { data: profile } = await supabase
            .from('user_profiles')
            .select('savings_goal')
            .eq('id', user.id)
            .single();

        // 2. If no profile exists, create one
        if (!profile) {
            const { data: newProfile, error: insertError } = await supabase
                .from('user_profiles')
                .insert({ id: user.id, savings_goal: 50 }) // Create with default goal
                .select()
                .single();
            
            if (insertError) {
                toast.error("Failed to create user profile.");
                setLoadingGoal(false);
                return;
            }
            profile = newProfile;
        }
        
        // 3. Set the goal from the (now guaranteed to exist) profile
        const goal = profile?.savings_goal || 50;
        setSavingsGoal(goal);
        setGoalInput(goal.toString());
        setLoadingGoal(false);
    };
    fetchAndEnsureProfile();
  }, []);


  const getMonthlyCost = (sub: Subscription) => {
    if (sub.billing_cycle === 'monthly') return sub.cost;
    if (sub.billing_cycle === 'yearly') return sub.cost / 12;
    if (sub.billing_cycle === 'weekly') return (sub.cost * 52) / 12;
    return 0;
  };

  const savedFromCancelled = subscriptions
    .filter(s => !s.is_active)
    .reduce((total, sub) => total + getMonthlyCost(sub), 0);

  const potentialFromLowValue = subscriptions
    .filter(s => s.is_active && s.value_rating && s.value_rating <= 2)
    .reduce((total, sub) => total + getMonthlyCost(sub), 0);

  useEffect(() => {
    if (savingsGoal && savedFromCancelled >= savingsGoal && !goalReached) {
      setGoalReached(true);
      toast.success("Congratulations! You've reached your savings goal!");
    } else if (savingsGoal && savedFromCancelled < savingsGoal) {
      setGoalReached(false);
    }
  }, [savedFromCancelled, savingsGoal, goalReached]);

  const handleSetGoal = async () => {
    const newGoal = parseFloat(goalInput);
    if (isNaN(newGoal) || newGoal <= 0) {
        toast.error("Please enter a valid savings goal.");
        return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        toast.error("You must be logged in to set a goal.");
        return;
    }

    const { error } = await supabase
        .from('user_profiles')
        .update({ savings_goal: newGoal })
        .eq('id', user.id);

    if (error) {
        toast.error("Failed to save your goal.");
    } else {
        setSavingsGoal(newGoal);
        setIsEditingGoal(false);
        toast.success("Savings goal updated!");
    }
  };

  const progressPercent = savingsGoal ? Math.min((savedFromCancelled / savingsGoal) * 100, 100) : 0;
  
  if (loadingGoal) {
      return <div className="bg-gray-100 rounded-xl p-6 animate-pulse h-48"></div>;
  }

  return (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl shadow-sm border border-green-200 p-6">
      {/* {goalReached && <Confetti width={window.innerWidth} height={window.innerHeight} recycle={false} />} */}
      
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <TrendingDown className="w-5 h-5 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-900">Savings Goal Tracker</h3>
        </div>
      </div>

      {savedFromCancelled === 0 && !savingsGoal ? (
        <div className="text-center py-8">
            <p className="text-gray-600 mb-4">Set a monthly savings goal to get started!</p>
            <button onClick={() => setIsEditingGoal(true)} className="bg-green-600 text-white font-semibold px-6 py-2 rounded-lg hover:bg-green-700">Set a Goal</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
            <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle className="text-gray-200" strokeWidth="10" stroke="currentColor" fill="transparent" r="45" cx="50" cy="50" />
                <motion.circle
                    className="text-green-500"
                    strokeWidth="10"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="45" cx="50" cy="50"
                    initial={{ strokeDashoffset: 283 }}
                    animate={{ strokeDashoffset: 283 - (progressPercent / 100) * 283 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    style={{ strokeDasharray: 283 }}
                    transform="rotate(-90 50 50)"
                />
            </svg>
            <div className="absolute text-center">
                {progressPercent >= 100 ? (
                    <Award className="w-16 h-16 text-yellow-500" />
                ) : (
                    <p className="text-3xl font-bold text-green-700">{progressPercent.toFixed(0)}%</p>
                )}
                <p className="text-sm text-gray-600">Goal Reached</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
                <p className="text-sm text-gray-600 flex items-center space-x-1"><DollarSign size={14}/><span>Current Savings</span></p>
                <p className="text-2xl font-bold text-green-600">$<AnimatedNumber value={savedFromCancelled} /></p>
            </div>
             <div>
                <p className="text-sm text-gray-600 flex items-center space-x-1"><DollarSign size={14}/><span>Monthly Goal</span></p>
                {isEditingGoal ? (
                    <div className="flex items-center space-x-2">
                        <input type="number" value={goalInput} onChange={(e) => setGoalInput(e.target.value)} className="w-24 p-1 border rounded-md" placeholder="e.g., 50"/>
                        <button onClick={handleSetGoal} className="p-2 bg-green-600 text-white rounded-md"><Check size={16}/></button>
                    </div>
                ) : (
                    <div className="flex items-center space-x-2">
                        <p className="text-2xl font-bold text-gray-800">${savingsGoal ? savingsGoal.toFixed(2) : 'Not set'}</p>
                        <button onClick={() => { setIsEditingGoal(true); setGoalInput(savingsGoal?.toString() || ''); }} className="p-1 text-gray-500 hover:text-gray-800"><Edit size={14}/></button>
                    </div>
                )}
            </div>
             {potentialFromLowValue > 0 && (
                <div>
                    <p className="text-sm text-orange-600 flex items-center space-x-1">
                        <Target size={14}/>
                        <span>Potential Savings</span>
                    </p>
                    <p className="text-lg font-bold text-orange-700">$<AnimatedNumber value={potentialFromLowValue} /></p>
                    <Link to="/subscriptions/low-value" className="text-xs text-indigo-600 hover:underline">Review {subscriptions.filter(s => s.is_active && s.value_rating && s.value_rating <= 2).length} subs</Link>
                </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SavingsTracker;
