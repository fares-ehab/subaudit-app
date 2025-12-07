import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase'; // Make sure this path is correct

// Use Vite's special import.meta.env object to access environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// --- THIS IS THE CRITICAL CHECK ---
// If the keys are missing, throw a hard error immediately.
// This will stop the app from ever getting into a "hanging" state.
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL and/or Anon Key are not defined in your environment variables. Please check your .env file or Vercel environment settings.");
}

// Create the single, reusable Supabase client for your application
export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

// --- Your Auth Functions (can remain here or in a separate file) ---

export const signUp = (email: string, password: string) => {
    return supabase.auth.signUp({ email, password });
};

export const signIn = (email: string, password: string) => {
    return supabase.auth.signInWithPassword({ email, password });
};

export const signOut = () => {
    return supabase.auth.signOut();
};