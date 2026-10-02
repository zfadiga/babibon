import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Retrieve credentials from Vite env or localStorage (configured via Admin Settings)
export function getSavedSupabaseConfig(): { url: string; anonKey: string } {
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

  const localUrl = localStorage.getItem('bonbon_supabase_url') || '';
  const localKey = localStorage.getItem('bonbon_supabase_anon_key') || '';

  const url = localUrl || envUrl;
  const anonKey = localKey || envKey;

  return { url: url.trim(), anonKey: anonKey.trim() };
}

let clientInstance: SupabaseClient | null = null;
let lastUsedUrl = '';
let lastUsedKey = '';

export function getSupabaseFrontendClient(): SupabaseClient | null {
  const { url, anonKey } = getSavedSupabaseConfig();

  if (!url || !anonKey || url.includes('your-project-id')) {
    return null;
  }

  if (clientInstance && lastUsedUrl === url && lastUsedKey === anonKey) {
    return clientInstance;
  }

  try {
    clientInstance = createClient(url, anonKey, {
      auth: { persistSession: false },
    });
    lastUsedUrl = url;
    lastUsedKey = anonKey;
    return clientInstance;
  } catch (err) {
    console.warn('Erreur initialisation Supabase Frontend:', err);
    return null;
  }
}

export function isFrontendSupabaseConfigured(): boolean {
  return getSupabaseFrontendClient() !== null;
}

export function saveFrontendSupabaseConfig(url: string, anonKey: string) {
  if (url) localStorage.setItem('bonbon_supabase_url', url.trim());
  else localStorage.removeItem('bonbon_supabase_url');

  if (anonKey) localStorage.setItem('bonbon_supabase_anon_key', anonKey.trim());
  else localStorage.removeItem('bonbon_supabase_anon_key');

  clientInstance = null; // force reload
}
