import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

// NEW: Define a type for the user's profile data
export interface UserProfile {
  subscription_plan: 'Free Starter' | 'Individual' | 'Family';
  // Add other profile fields here later, like full_name or avatar_url
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);

        // If a user is logged in, fetch their profile
        if (session?.user) {
          const { data: userProfile, error } = await supabase
            .from('user_profiles')
            .select('subscription_plan')
            .eq('id', session.user.id)
            .single();
          
          if (error) {
            console.error("Error fetching user profile:", error);
          }
          setProfile(userProfile as UserProfile);
        } else {
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return { user, profile, loading };
};
