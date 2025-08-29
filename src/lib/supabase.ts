import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

// Use Vite's special variable to securely access your environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// This check is crucial. If the keys are missing, the app will stop with a clear error.
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL and Anon Key are not defined in your .env.local file.");
}

// This creates the single, reusable Supabase client for your entire application.
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

// --- Authentication Functions ---

/**
 * Signs up a new user.
 */
export const signUp = (email: string, password: string) => {
    return supabase.auth.signUp({ email, password });
};

/**
 * Signs in an existing user.
 */
export const signIn = (email: string, password: string) => {
    return supabase.auth.signInWithPassword({ email, password });
};

/**
 * Signs out the current user.
 */
export const signOut = () => {
    return supabase.auth.signOut();
};


export async function deleteSubscriptions(ids: string[]) {
  if (!ids || ids.length === 0) return;

  const { error } = await supabase
    .from("subscriptions")   // table name
    .delete()
    .in("id", ids);          // delete all matching IDs

  if (error) {
    console.error("Supabase delete error:", error);
    throw error;
  }
}