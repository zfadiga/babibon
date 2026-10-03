'use client';

import React, { useEffect, useState, createContext, useContext } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { User } from '@supabase/supabase-js';
import { UserProfile } from '@/types';
import LoginForm from './LoginForm';
import {
  ShieldAlert,
  Loader2,
  LogOut,
  Candy,
} from 'lucide-react';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: false,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export const useAdminAuth = () => useContext(AuthContext);

interface AdminGuardProps {
  children: React.ReactNode;
}

export default function AdminGuard({ children }: AdminGuardProps) {
  // Session persisted in localStorage
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const saved = localStorage.getItem('bonbon_admin_session');
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });

  const [profile, setProfile] = useState<UserProfile | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const saved = localStorage.getItem('bonbon_admin_session');
      if (saved) {
        const u = JSON.parse(saved);
        return {
          id: u.id || 'admin-1',
          email: u.email || `${u.username || 'admin'}@babibon-candyshop.com`,
          role: u.role || 'admin',
          created_at: u.created_at || new Date().toISOString(),
        };
      }
    } catch {}
    return null;
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchProfile = async (currentUser: User) => {
    if ((currentUser as any).username || currentUser.id?.startsWith('primary-') || currentUser.id?.startsWith('backup-')) {
      return;
    }

    if (!isSupabaseConfigured) {
      setProfile({
        id: currentUser.id,
        email: currentUser.email,
        role: 'admin',
      });
      return;
    }

    try {
      setErrorMsg(null);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, role, created_at')
        .eq('id', currentUser.id)
        .single();

      if (error) {
        const metadataRole = currentUser.user_metadata?.role;
        if (metadataRole) {
          setProfile({
            id: currentUser.id,
            email: currentUser.email,
            role: metadataRole,
          });
          return;
        }

        setErrorMsg(error.message || 'Compte introuvable dans la table des profils.');
        setProfile(null);
        return;
      }

      setProfile(data as UserProfile);
    } catch (err: any) {
      setErrorMsg(err.message || 'Impossible de vérifier le profil.');
      setProfile(null);
    }
  };

  const handleLoginSuccess = (adminData: { id: string; username: string; email: string; role: string }) => {
    const adminUser: any = {
      id: adminData.id,
      email: adminData.email,
      username: adminData.username,
      app_metadata: {},
      user_metadata: { role: adminData.role },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    };

    setUser(adminUser);
    setProfile({
      id: adminData.id,
      email: adminData.email,
      role: adminData.role,
      created_at: new Date().toISOString(),
    });

    try {
      localStorage.setItem('bonbon_admin_session', JSON.stringify(adminUser));
    } catch {}
  };

  const handleSignOut = async () => {
    setUser(null);
    setProfile(null);
    try {
      localStorage.removeItem('bonbon_admin_session');
    } catch {}

    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Sign out warning:', err);
      }
    }
  };

  const handleRefresh = async () => {
    if (user) {
      setLoading(true);
      await fetchProfile(user);
      setLoading(false);
    }
  };

  // 1. Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-amber-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-rose-100 flex flex-col items-center max-w-sm w-full text-center">
          <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center mb-4 text-rose-500">
            <Candy className="w-8 h-8 animate-bounce" />
          </div>
          <Loader2 className="w-7 h-7 text-rose-500 animate-spin mb-3" />
          <h3 className="text-lg font-semibold text-gray-800">
            Vérification de l'accès Admin
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Connexion au tableau de bord...
          </p>
        </div>
      </div>
    );
  }

  // 2. Not Logged In State (Clean form with username "admin" and password "admin")
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-amber-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
          <div className="inline-flex items-center justify-center p-3.5 bg-gradient-to-tr from-rose-500 to-pink-500 text-white rounded-2xl shadow-lg mb-3 shadow-rose-200">
            <Candy className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Candy Shop Admin
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Espace d'administration et de gestion des commandes
          </p>
        </div>

        {/* Clean Login Form (Username / Password) */}
        <LoginForm onSuccess={handleLoginSuccess} />
      </div>
    );
  }

  // 3. Logged in, but NOT an admin
  const isAdmin = profile?.role === 'admin';

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-rose-50 to-orange-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-lg w-full bg-white rounded-2xl shadow-2xl border border-red-200 p-8 text-center animate-fade-in">
          <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <ShieldAlert className="w-10 h-10" />
          </div>

          <span className="inline-block py-1 px-3 rounded-full text-xs font-bold tracking-wider uppercase bg-red-100 text-red-700 mb-3">
            Accès Refusé
          </span>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Accès non autorisé
          </h2>

          <p className="text-gray-600 text-sm mb-6 leading-relaxed">
            Ce compte ne possède pas les privilèges administrateur nécessaires pour accéder au tableau de bord.
          </p>

          <button
            onClick={handleSignOut}
            className="inline-flex items-center justify-center px-6 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-colors shadow-sm cursor-pointer"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Se déconnecter
          </button>
        </div>
      </div>
    );
  }

  // 4. Authorized Admin
  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signOut: handleSignOut,
        refreshProfile: handleRefresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
