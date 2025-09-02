import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

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
        // --- START OF NEW LOGIC ---

        // Set the user based on the session regardless of the event
        setUser(session?.user ?? null);

        // Now, perform specific actions based on the event type
        switch (event) {
          case 'SIGNED_IN': {
            if (!session?.user) {
               console.error("SIGNED_IN event fired without a session/user.");
               setLoading(false); // Make sure to stop loading
               break; // or return;
               }
            setLoading(true); // Show a loading state while we fetch the profile
            toast.success('Signed in successfully!');
            
            // Fetch the user's profile data since they just logged in
            const { data: userProfile, error } = await supabase
              .from('user_profiles')
              .select('subscription_plan')
              .eq('id', session.user.id)
              .single();
            
            if (error) console.error("Error fetching user profile:", error);
            setProfile(userProfile as UserProfile);
            setLoading(false);
            break;
          }

          case 'SIGNED_OUT': {
            // Clear the profile and any other user-specific state
            setProfile(null);
            // In a larger app, you might call functions here to clear other caches,
            // e.g., clearSubscriptionsCache();
            setLoading(false);
            break;
          }

          case 'USER_UPDATED': {
            // If the user changes their email/password, re-fetch their data
            if (session?.user) {
              const { data: userProfile } = await supabase
                .from('user_profiles')
                .select('subscription_plan')
                .eq('id', session.user.id)
                .single();
              setProfile(userProfile as UserProfile);
              toast.success('Your profile has been updated.');
            }
            break;
          }

          case 'TOKEN_REFRESHED': {
            // This happens automatically in the background.
            // We usually don't need to do anything here, but we can handle it
            // explicitly to avoid running other logic unnecessarily.
            console.log('Token refreshed.');
            // Make sure loading is false if it hasn't been set yet.
            setLoading(false);
            break;
          }

          default: {
            setLoading(false);
          }
        }
        // --- END OF NEW LOGIC ---
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return { user, profile, loading };
};

