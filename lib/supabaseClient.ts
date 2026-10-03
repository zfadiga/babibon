import { createClient, SupabaseClient } from '@supabase/supabase-js';

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Check if valid credentials are provided (not default placeholders or empty)
export const isSupabaseConfigured = Boolean(
  rawUrl &&
  rawKey &&
  rawUrl.startsWith('http') &&
  !rawUrl.includes('your-supabase-project') &&
  !rawKey.includes('your-supabase-anon-key')
);

// Fallback dummy credentials to prevent createClient from crashing during initialization
const supabaseUrl = isSupabaseConfigured
  ? rawUrl
  : 'https://placeholder.supabase.co';

const supabaseAnonKey = isSupabaseConfigured
  ? rawKey
  : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.fake-anon-key-placeholder';

if (!isSupabaseConfigured && typeof window !== 'undefined') {
  console.info(
    '%c[Supabase]%c No custom credentials detected. Running in mock/local state preview mode until .env.local is configured.',
    'background: #f43f5e; color: white; padding: 2px 6px; border-radius: 4px; font-weight: bold;',
    'color: inherit;'
  );
}

// Client-side singleton Supabase client
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: typeof window !== 'undefined',
    autoRefreshToken: isSupabaseConfigured,
    detectSessionInUrl: isSupabaseConfigured,
  },
});
