import { createClient } from '@supabase/supabase-js';

// const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
// const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabaseUrl = 'https://qfqqeobtlycwwppaynur.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmcXFlb2J0bHljd3dwcGF5bnVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIxMDUwMzksImV4cCI6MjA1NzY4MTAzOX0.3U3EoDvR4A3mvWVZpKgIAiLlHhhUSDCvridxkFH__4Q';

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Helper function to check if user is authenticated
export const isAuthenticated = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return !!session;
};

// Admin credentials
export const ADMIN_EMAIL = 'janani@gmail.com';
export const ADMIN_PASSWORD = 'janani';