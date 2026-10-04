'use client';

import React, { useState } from 'react';
import { createNewUser } from '@/lib/api';
import { CreateUserPayload } from '@/types';
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
} from 'lucide-react';

export default function UserManagement() {
  const [formData, setFormData] = useState<CreateUserPayload>({
    username: '',
    email: '',
    password: '',
    role: 'customer',
  });
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [createdUsers, setCreatedUsers] = useState<
    Array<{ username: string; email: string; role: string; timestamp: string }>
  >([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    if (!formData.username.trim()) {
      setErrorMsg("Le nom d'utilisateur est obligatoire.");
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setErrorMsg('Le mot de passe doit comporter au moins 6 caractères.');
      setLoading(false);
      return;
    }

    try {
      await createNewUser({
        ...formData,
        username: formData.username.trim(),
      });

      setSuccessMsg(
        `Compte utilisateur "${formData.username.trim()}" (${formData.email}) créé avec succès avec le rôle "${formData.role}".`
      );

      setCreatedUsers((prev) => [
        {
          username: formData.username.trim(),
          email: formData.email,
          role: formData.role,
          timestamp: new Date().toLocaleTimeString('fr-FR'),
        },
        ...prev,
      ]);

      setFormData({
        username: '',
        email: '',
        password: '',
        role: 'customer',
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Impossible de créer le compte utilisateur.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 animate-fade-in">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
          <Users className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Gestion des Utilisateurs & Équipe
          </h2>
          <p className="text-xs text-gray-500">
            Créez de nouveaux profils avec attribution de rôles (Administrateur ou Client)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Creation Form */}
        <div className="lg:col-span-7 space-y-4">
          {successMsg && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Nom d'utilisateur *
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
                  placeholder="nouveau.collaborateur@babibon.com"
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
                    setFormData((prev) => ({ ...prev, role: 'admin' }))
                  }
                  className={`p-3 rounded-2xl border text-left flex items-start space-x-3 transition-all cursor-pointer ${
                    formData.role === 'admin'
                      ? 'border-rose-500 bg-rose-50/70 text-rose-900 ring-2 ring-rose-200'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  <Shield className="w-4 h-4 text-rose-600 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold">Admin</p>
                    <p className="text-[10px] text-gray-500">Accès complet au tableau de bord</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, role: 'customer' }))
                  }
                  className={`p-3 rounded-2xl border text-left flex items-start space-x-3 transition-all cursor-pointer ${
                    formData.role === 'customer'
                      ? 'border-rose-500 bg-rose-50/70 text-rose-900 ring-2 ring-rose-200'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  <UserCheck className="w-4 h-4 text-emerald-600 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold">Client</p>
                    <p className="text-[10px] text-gray-500">Accès boutique uniquement</p>
                  </div>
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-rose-200 transition-all flex items-center space-x-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                <span>Créer l'utilisateur</span>
              </button>
            </div>
          </form>
        </div>

        {/* History / Created during session */}
        <div className="lg:col-span-5 bg-gray-50/70 p-5 rounded-2xl border border-gray-100">
          <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">
            Créés durant cette session
          </h3>

          {createdUsers.length === 0 ? (
            <p className="text-xs text-gray-400 italic">
              Aucun utilisateur créé pour l'instant.
            </p>
          ) : (
            <div className="space-y-2">
              {createdUsers.map((u, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-white rounded-xl border border-gray-200/80 text-xs flex items-center justify-between shadow-2xs"
                >
                  <div className="truncate mr-2">
                    <p className="font-semibold text-gray-800 truncate">@{u.username}</p>
                    <p className="text-[11px] text-gray-500 truncate">{u.email}</p>
                    <p className="text-[10px] text-gray-400">{u.timestamp}</p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      u.role === 'admin'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {u.role}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
