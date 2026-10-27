import { supabase, isSupabaseConfigured } from './supabaseClient';

const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes lockout
const MAX_ATTEMPTS = 3;
export const GENERIC_LOCKOUT_MESSAGE = 'Trop de tentatives, réessayez plus tard';

/**
 * Checks if the user or device is currently blocked due to excessive failed login attempts.
 */
export async function checkLoginLockout(identifier: string): Promise<{ locked: boolean; message?: string }> {
  const cleanId = (identifier || '').trim().toLowerCase();
  const now = Date.now();

  // 1. Device-wide temporary block check
  if (typeof window !== 'undefined') {
    try {
      const generalUntil = Number(localStorage.getItem('bonbon_lockout_general') || '0');
      if (generalUntil > now) {
        return { locked: true, message: GENERIC_LOCKOUT_MESSAGE };
      }

      if (cleanId) {
        const userUntil = Number(localStorage.getItem(`bonbon_lockout_${cleanId}`) || '0');
        if (userUntil > now) {
          return { locked: true, message: GENERIC_LOCKOUT_MESSAGE };
        }
      }
    } catch {}
  }

  // 2. Database level block check (persisted across devices/tabs)
  if (isSupabaseConfigured && cleanId) {
    try {
      const { data: isLocked } = await supabase.rpc('is_user_locked', {
        p_identifier: cleanId,
      });
      if (isLocked) {
        // Synchronize local storage lockout
        if (typeof window !== 'undefined') {
          localStorage.setItem('bonbon_lockout_general', String(now + LOCKOUT_DURATION_MS));
          localStorage.setItem(`bonbon_lockout_${cleanId}`, String(now + LOCKOUT_DURATION_MS));
        }
        return { locked: true, message: GENERIC_LOCKOUT_MESSAGE };
      }
    } catch (e) {
      console.warn('is_user_locked check notice:', e);
    }
  }

  return { locked: false };
}

/**
 * Records a failed login attempt. Locks the account/device if >= 3 failed attempts.
 */
export async function recordFailedLogin(identifier: string): Promise<{ locked: boolean; message?: string }> {
  const cleanId = (identifier || '').trim().toLowerCase();
  const now = Date.now();
  let locked = false;

  // 1. Device-level attempt counter
  if (typeof window !== 'undefined') {
    try {
      const generalAttempts = Number(localStorage.getItem('bonbon_failed_attempts_general') || '0') + 1;
      localStorage.setItem('bonbon_failed_attempts_general', String(generalAttempts));

      let userAttempts = 0;
      if (cleanId) {
        userAttempts = Number(localStorage.getItem(`bonbon_failed_${cleanId}`) || '0') + 1;
        localStorage.setItem(`bonbon_failed_${cleanId}`, String(userAttempts));
      }

      if (generalAttempts >= MAX_ATTEMPTS || userAttempts >= MAX_ATTEMPTS) {
        locked = true;
        localStorage.setItem('bonbon_lockout_general', String(now + LOCKOUT_DURATION_MS));
        if (cleanId) {
          localStorage.setItem(`bonbon_lockout_${cleanId}`, String(now + LOCKOUT_DURATION_MS));
        }
      }
    } catch {}
  }

  // 2. Database-level attempt recording (via SECURITY DEFINER PostgreSQL RPC)
  if (isSupabaseConfigured && cleanId) {
    try {
      const { data } = await supabase.rpc('handle_login_attempt', {
        p_identifier: cleanId,
        p_success: false,
      });
      if (data?.locked) {
        locked = true;
      }
    } catch (e) {
      console.warn('handle_login_attempt notice:', e);
    }
  }

  if (locked) {
    return { locked: true, message: GENERIC_LOCKOUT_MESSAGE };
  }

  return { locked: false };
}

/**
 * Resets failed attempts after a successful login.
 */
export async function recordSuccessfulLogin(identifier: string): Promise<void> {
  const cleanId = (identifier || '').trim().toLowerCase();

  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('bonbon_failed_attempts_general');
      localStorage.removeItem('bonbon_lockout_general');
      if (cleanId) {
        localStorage.removeItem(`bonbon_failed_${cleanId}`);
        localStorage.removeItem(`bonbon_lockout_${cleanId}`);
      }
    } catch {}
  }

  if (isSupabaseConfigured && cleanId) {
    try {
      await supabase.rpc('handle_login_attempt', {
        p_identifier: cleanId,
        p_success: true,
      });
    } catch (e) {
      console.warn('handle_login_attempt success reset notice:', e);
    }
  }
}

/**
 * Generates and registers a new active session token for single-device login.
 */
export async function registerActiveSession(userId: string): Promise<string> {
  const sessionToken = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem('bonbon_session_token', sessionToken);
    } catch {}
  }

  if (isSupabaseConfigured && userId) {
    try {
      await supabase.rpc('set_user_active_session', {
        p_user_id: userId,
        p_session_id: sessionToken,
      });
    } catch (e) {
      console.warn('set_user_active_session error:', e);
    }
  }

  return sessionToken;
}

/**
 * Checks if the current session token matches the database active session token.
 */
export async function verifyCurrentSession(userId: string): Promise<boolean> {
  if (typeof window === 'undefined') return true;
  const currentToken = sessionStorage.getItem('bonbon_session_token');
  if (!currentToken || !userId || !isSupabaseConfigured) return true;

  try {
    const { data } = await supabase.rpc('get_user_active_session', {
      p_user_id: userId,
    });
    // If the database has a session token and it differs from our local token, session is invalidated
    if (data && data !== currentToken) {
      return false;
    }
  } catch {}

  return true;
}
