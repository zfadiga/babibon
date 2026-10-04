'use client';

import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { useAdminAuth } from './AdminGuard';
import {
  Lock,
  User,
  CheckCircle2,
  AlertCircle,
  Loader2,
  KeyRound,
} from 'lucide-react';

export default function AccountSettings() {
  const { user, refreshProfile } = useAdminAuth();

  const currentUsername =
    (user as any)?.username ||
    user?.user_metadata?.username ||
    (user?.email ? user.email.split('@')[0] : 'admin');

  const [newUsername, setNewUsername] = useState('');
  const [usernameLoading, setUsernameLoading] = useState(false);
  const [usernameSuccess, setUsernameSuccess] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handleUpdateUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    setUsernameLoading(true);
    setUsernameSuccess(null);
    setUsernameError(null);

    const clean = newUsername.trim();

    if (clean.length < 3) {
      setUsernameError("Le nom d'utilisateur doit comporter au moins 3 caractères.");
      setUsernameLoading(false);
      return;
    }

    if (clean.toLowerCase() === currentUsername.toLowerCase()) {
      setUsernameError("Le nouveau nom d'utilisateur ne peut pas être identique à l'actuel.");
      setUsernameLoading(false);
      return;
    }

    try {
      if (isSupabaseConfigured && user) {
        const { error } = await supabase.auth.updateUser({
          data: { username: clean },
        });
        if (error) throw error;

        try {
          await supabase
            .from('profiles')
            .update({ username: clean })
            .eq('id', user.id);
        } catch (dbErr) {
          console.warn('Profiles table update notice:', dbErr);
        }
      }

      // Update admin session in local storage
      if (typeof window !== 'undefined') {
        try {
          const savedSession = localStorage.getItem('bonbon_admin_session');
          if (savedSession) {
            const parsed = JSON.parse(savedSession);
            parsed.username = clean;
            localStorage.setItem('bonbon_admin_session', JSON.stringify(parsed));
          }

          const savedSettings = localStorage.getItem('bonbon_settings');
          if (savedSettings) {
            const parsedSettings = JSON.parse(savedSettings);
            if (parsedSettings.managers && Array.isArray(parsedSettings.managers)) {
              parsedSettings.managers = parsedSettings.managers.map((m: any) =>
                m.username === currentUsername || m.id === user?.id
                  ? { ...m, username: clean }
                  : m
              );
              localStorage.setItem('bonbon_settings', JSON.stringify(parsedSettings));
            }
          }
        } catch (storageErr) {
          console.warn('LocalStorage session update error:', storageErr);
        }
      }

      await refreshProfile();
      setUsernameSuccess(`Nom d'utilisateur mis à jour avec succès : "${clean}" !`);
      setNewUsername('');
    } catch (err: any) {
      setUsernameError(err.message || "Impossible de mettre à jour le nom d'utilisateur.");
    } finally {
      setUsernameLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordSuccess(null);
    setPasswordError(null);

    if (newPassword.length < 6) {
      setPasswordError('Le mot de passe doit comporter au moins 6 caractères.');
      setPasswordLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Les mots de passe ne correspondent pas.');
      setPasswordLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;

      setPasswordSuccess('Mot de passe mis à jour avec succès !');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordError(err.message || 'Impossible de mettre à jour le mot de passe.');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 animate-fade-in">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
          <KeyRound className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Sécurité & Identifiants Admin
          </h2>
          <p className="text-xs text-gray-500">
            Mettez à jour vos identifiants d'accès administrateur
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Username Form */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
            <User className="w-4 h-4 text-rose-500" />
            <span>Changer de nom d'utilisateur</span>
          </h3>

          {usernameSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{usernameSuccess}</span>
            </div>
          )}

          {usernameError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{usernameError}</span>
            </div>
          )}

          <form onSubmit={handleUpdateUsername} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Nom d'utilisateur actuel
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  disabled
                  value={currentUsername}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-600 font-medium text-xs cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Nouveau nom d'utilisateur *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="ex: admin_principal"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={usernameLoading || !newUsername.trim()}
              className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center space-x-2 cursor-pointer"
            >
              {usernameLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              <span>Mettre à jour le nom d'utilisateur</span>
            </button>
          </form>
        </div>

        {/* Password Form */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
            <Lock className="w-4 h-4 text-rose-500" />
            <span>Changer de mot de passe</span>
          </h3>

          {passwordSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{passwordSuccess}</span>
            </div>
          )}

          {passwordError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Nouveau mot de passe (min. 6 caractères)
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Confirmer le mot de passe
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <button
              type="submit"
              disabled={passwordLoading || !newPassword}
              className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center space-x-2 cursor-pointer"
            >
              {passwordLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              <span>Mettre à jour le mot de passe</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
