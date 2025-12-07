import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export interface UserProfile {
  subscription_plan: 'Free Starter' | 'Individual' | 'Family';
  full_name: string | null;
  avatar_url: string | null;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
   refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
   const fetchProfile = async (userId: string) => {
    const { data: userProfile, error } = await supabase
      .from('user_profiles')
      // Make sure to select the new columns
      .select('subscription_plan, full_name, avatar_url')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    setProfile(userProfile);
  };
  
  // Create a refresh function to be used after updates
  const refreshProfile = async () => {
      if (user) {
          await fetchProfile(user.id);
      }
  }

  useEffect(() => {
    // This useEffect will now run only ONCE when the app starts.
    const getInitialSession = async () => {
      try {
        console.log("AuthProvider: Getting initial session...");
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        setUser(session?.user ?? null);
        if (session?.user) {
          const { data: userProfile, error: profileError } = await supabase
            .from('user_profiles')
            .select('subscription_plan')
            .eq('id', session.user.id)
            .single();

          if (profileError && profileError.code !== 'PGRST116') throw profileError;
          setProfile(userProfile);
        }
      } catch (error) {
        console.error("AuthProvider: Error in getInitialSession:", error);
      } finally {
        setLoading(false);
      }
    };
    
    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log(`AuthProvider: Auth state changed (${_event}). User is now:`, session?.user?.id ?? 'null');
      setUser(session?.user ?? null);
            if (_event === 'SIGNED_OUT') {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const value = { user, profile, loading, refreshProfile  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};