import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create Supabase client with session handling configuration
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    // Set session timeout to 8 hours (in seconds)
    storageKey: 'supabase.auth.token',
    storage: window.localStorage
  }
});

// Helper function to check if user is authenticated
export const isAuthenticated = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return !!session;
};

// Helper function to check session expiry
export const isSessionExpired = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return true;
  
  const expiresAt = session.expires_at;
  if (!expiresAt) return true;
  
  // Check if current time is past expiry
  return Date.now() / 1000 >= expiresAt;
};

// Helper function to get current user's role
export const getCurrentUserRole = async (): Promise<string> => {
  const { data: { user } } = await supabase.auth.getUser();
  // Default to 'user' if not set
  return user?.user_metadata?.role || 'user';
};

// Admin credentials
export const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL;
export const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD;