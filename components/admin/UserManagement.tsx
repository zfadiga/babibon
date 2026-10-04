'use client';

import React, { useState, useEffect } from 'react';
import { createNewUser, fetchProfiles, deleteUserProfile } from '@/lib/api';
import { CreateUserPayload, UserProfile } from '@/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import {
  UserPlus,
  Shield,
  UserCheck,
  Mail,
  Lock,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Users,
  User,
  Trash2,
  Search,
  RefreshCw,
  Calendar,
  Phone,
  MapPin,
} from 'lucide-react';

export default function UserManagement() {
  const [formData, setFormData] = useState<CreateUserPayload>({
    username: '',
    email: '',
    password: '',
    role: 'client',
  });
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Database profiles state
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'client' | 'admin'>('all');

  // Deletion modal state
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadProfiles = async (silent = false) => {
    if (!silent) setLoadingProfiles(true);
    try {
      const data = await fetchProfiles();
      setProfiles(data);
    } catch (err: any) {
      console.warn('Error fetching profiles:', err);
    } finally {
      if (!silent) setLoadingProfiles(false);
    }
  };

  // Initial load + Supabase Realtime subscription
  useEffect(() => {
    loadProfiles();

    if (!isSupabaseConfigured) return;

    const channel = supabase
      .channel('realtime_profiles_mgmt')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        (payload: any) => {
          if (payload.eventType === 'INSERT' && payload.new) {
            setProfiles((prev) => {
              if (prev.some((p) => p.id === payload.new.id)) return prev;
              return [payload.new as UserProfile, ...prev];
            });
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            setProfiles((prev) =>
              prev.map((p) => (p.id === payload.new.id ? { ...p, ...payload.new } : p))
            );
          } else if (payload.eventType === 'DELETE' && payload.old) {
            setProfiles((prev) => prev.filter((p) => p.id !== payload.old.id));
          }
          loadProfiles(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    const cleanUsername = formData.username.trim().toLowerCase();
    const cleanEmail = formData.email.trim().toLowerCase();

    if (!cleanUsername) {
      setErrorMsg("Le nom d'utilisateur est obligatoire.");
      setSubmitting(false);
      return;
    }

    if (!cleanEmail) {
      setErrorMsg("L'adresse email est obligatoire.");
      setSubmitting(false);
      return;
    }

    if (formData.password.length < 6) {
      setErrorMsg('Le mot de passe doit comporter au moins 6 caractères.');
      setSubmitting(false);
      return;
    }

    try {
      await createNewUser({
        username: cleanUsername,
        email: cleanEmail,
        password: formData.password,
        role: formData.role,
      });

      const roleLabel = formData.role === 'admin' ? 'Administrateur' : 'Client';
      setSuccessMsg(
        `Compte @${cleanUsername} (${cleanEmail}) créé et enregistré dans la base de données avec le rôle "${roleLabel}".`
      );

      setFormData({
        username: '',
        email: '',
        password: '',
        role: 'client',
      });

      await loadProfiles(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Impossible de créer le compte utilisateur.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    setDeleting(true);
    setErrorMsg(null);

    try {
      const res = await deleteUserProfile(userToDelete.id);
      if (res.success) {
        setProfiles((prev) => prev.filter((p) => p.id !== userToDelete.id));
        setSuccessMsg(`Profil de @${userToDelete.username || userToDelete.email} supprimé avec succès.`);
        setUserToDelete(null);
      } else {
        setErrorMsg(res.message || 'Erreur lors de la suppression.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Impossible de supprimer ce profil.');
    } finally {
      setDeleting(false);
    }
  };

  // KPI Metrics
  const totalUsers = profiles.length;
  const adminUsers = profiles.filter((p) => p.role === 'admin' || p.role === 'manager').length;
  const clientUsers = profiles.filter((p) => p.role !== 'admin' && p.role !== 'manager').length;

  // Filtered profiles
  const filteredProfiles = profiles.filter((p) => {
    const q = searchTerm.toLowerCase().trim();
    const matchesQuery =
      !q ||
      p.username?.toLowerCase().includes(q) ||
      p.email?.toLowerCase().includes(q) ||
      p.full_name?.toLowerCase().includes(q);

    let matchesRole = true;
    if (roleFilter === 'admin') {
      matchesRole = p.role === 'admin' || p.role === 'manager';
    } else if (roleFilter === 'client') {
      matchesRole = p.role === 'client' || p.role === 'customer' || !p.role;
    }

    return matchesQuery && matchesRole;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Gestion des Utilisateurs & Équipe
              </h2>
              <p className="text-xs text-gray-500">
                Gérez les comptes clients et administrateurs stockés en base de données Supabase
              </p>
            </div>
          </div>

          <button
            onClick={() => loadProfiles(false)}
            disabled={loadingProfiles}
            className="self-start sm:self-auto p-2 text-gray-600 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-gray-200 transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
            title="Actualiser la liste"
          >
            <RefreshCw className={`w-4 h-4 ${loadingProfiles ? 'animate-spin' : ''}`} />
            <span>Actualiser</span>
          </button>
        </div>

        {/* Top KPI Cards for Users */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-6">
          <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100 flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-purple-600 uppercase tracking-wider">
                Total Comptes
              </p>
              <p className="text-xl font-bold text-purple-900">{totalUsers}</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider">
                Clients / Gourmands
              </p>
              <p className="text-xl font-bold text-emerald-900">{clientUsers}</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-100 flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-rose-600 uppercase tracking-wider">
                Administrateurs
              </p>
              <p className="text-xl font-bold text-rose-900">{adminUsers}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Creation Form | Right Database Users List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Creation Form */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-gray-100 space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-gray-100">
            <UserPlus className="w-5 h-5 text-rose-500" />
            <h3 className="text-base font-bold text-gray-900">
              Créer un nouvel utilisateur
            </h3>
          </div>

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2 animate-fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Nom d'utilisateur (Pseudo) *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="ex: amina_diop"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, username: e.target.value }))
                  }
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Adresse email *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="utilisateur@babibon.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Mot de passe temporaire *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="Min. 6 caractères"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, password: e.target.value }))
                  }
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Rôle attribué *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, role: 'client' }))
                  }
                  className={`p-3 rounded-2xl border text-left flex items-start space-x-2.5 transition-all cursor-pointer ${
                    formData.role === 'client' || formData.role === 'customer'
                      ? 'border-emerald-500 bg-emerald-50/70 text-emerald-900 ring-2 ring-emerald-200'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  <UserCheck className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-bold">Client</p>
                    <p className="text-[10px] text-gray-500">Accès boutique</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, role: 'admin' }))
                  }
                  className={`p-3 rounded-2xl border text-left flex items-start space-x-2.5 transition-all cursor-pointer ${
                    formData.role === 'admin'
                      ? 'border-rose-500 bg-rose-50/70 text-rose-900 ring-2 ring-rose-200'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  <Shield className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-bold">Admin</p>
                    <p className="text-[10px] text-gray-500">Accès dashboard</p>
                  </div>
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-rose-200 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer active:scale-98"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Création en cours...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Enregistrer dans Supabase</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Database Profiles List */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-gray-100 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
            <div>
              <h3 className="text-base font-bold text-gray-900">
                Comptes enregistrés ({filteredProfiles.length})
              </h3>
              <p className="text-xs text-gray-500">
                Données persistées dans la table Supabase `profiles`
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 self-start sm:self-auto bg-gray-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setRoleFilter('all')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  roleFilter === 'all'
                    ? 'bg-white text-gray-900 shadow-2xs'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Tous
              </button>
              <button
                type="button"
                onClick={() => setRoleFilter('client')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  roleFilter === 'client'
                    ? 'bg-white text-emerald-700 shadow-2xs'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Clients
              </button>
              <button
                type="button"
                onClick={() => setRoleFilter('admin')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  roleFilter === 'admin'
                    ? 'bg-white text-rose-700 shadow-2xs'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Admins
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher par nom, pseudo ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          {/* Users List */}
          {loadingProfiles ? (
            <div className="py-12 text-center text-gray-400">
              <Loader2 className="w-7 h-7 animate-spin mx-auto text-rose-500 mb-2" />
              <p className="text-xs">Chargement des profils...</p>
            </div>
          ) : filteredProfiles.length === 0 ? (
            <div className="py-10 text-center text-gray-400">
              <Users className="w-10 h-10 mx-auto text-gray-300 mb-2" />
              <p className="text-xs font-semibold text-gray-600">Aucun utilisateur trouvé</p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Créez un nouveau compte avec le formulaire ci-contre.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
              {filteredProfiles.map((p) => {
                const isAdmin = p.role === 'admin' || p.role === 'manager';
                const displayName = p.full_name || p.username || 'Utilisateur';
                const createdDate = p.created_at
                  ? new Date(p.created_at).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })
                  : 'Nouveau';

                return (
                  <div
                    key={p.id}
                    className="p-3.5 bg-gray-50/70 hover:bg-gray-50 rounded-2xl border border-gray-100 transition-all flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                          isAdmin
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {p.avatar || (isAdmin ? '🛡️' : displayName.charAt(0).toUpperCase())}
                      </div>

                      <div className="min-w-0 truncate">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-gray-900 truncate">
                            {displayName}
                          </p>
                          {p.username && (
                            <span className="text-[11px] text-gray-400 truncate">
                              @{p.username}
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-gray-500 truncate">{p.email}</p>

                        <div className="flex items-center gap-3 text-[10px] text-gray-400 mt-0.5">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-gray-300" />
                            <span>Inscrit le {createdDate}</span>
                          </span>
                          {p.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-gray-300" />
                              <span>{p.phone}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                          isAdmin
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {isAdmin ? 'Admin' : 'Client'}
                      </span>

                      {/* Delete profile button */}
                      <button
                        type="button"
                        onClick={() => setUserToDelete(p)}
                        className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Supprimer ce profil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal for Profile Deletion */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-rose-100 animate-scale-up">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-center text-gray-900 mb-1">
              Supprimer cet utilisateur ?
            </h3>

            <p className="text-xs text-center text-gray-600 mb-4">
              Le compte de <strong className="text-gray-900">@{userToDelete.username || userToDelete.email}</strong> ({userToDelete.role}) sera retiré de la base de données.
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                disabled={deleting}
                className="w-1/2 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="w-1/2 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-md shadow-rose-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {deleting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>Supprimer</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
