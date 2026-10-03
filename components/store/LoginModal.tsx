'use client';

import React, { useState } from 'react';
import { X, LogIn, Sparkles, AlertCircle, Lock, User, KeyRound } from 'lucide-react';
import { ChildUser } from '@/types/candy';
import { fireCandyConfetti } from '@/utils/formatters';
import { useStore } from '@/context/StoreContext';

export const LoginModal: React.FC = () => {
  const { isLoginOpen, setIsLoginOpen, setIsSignupOpen, loginUser } = useStore();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (!isLoginOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanIdentifier = identifier.trim();
    const cleanPassword = password.trim();

    // 1. Mandatory validation
    if (!cleanIdentifier) {
      setError("Le nom d'utilisateur est obligatoire.");
      return;
    }

    if (!cleanPassword) {
      setError('Le mot de passe est obligatoire.');
      return;
    }

    try {
      const stored = localStorage.getItem('bonbon_registered_users');
      let users: ChildUser[] = stored ? JSON.parse(stored) : [];

      // Seed sample users if brand new database
      if (users.length === 0) {
        users = [
          {
            id: 'child-1',
            username: 'lucas',
            password: 'password123',
            firstName: 'Lucas',
            avatar: '🐻',
            avatarBg: 'bg-pink-100 text-pink-700 border-pink-300',
            favoriteFlavor: 'Fraise',
            joinedAt: new Date().toISOString(),
          },
          {
            id: 'child-2',
            username: 'amina',
            password: 'password123',
            firstName: 'Amina',
            avatar: '🦄',
            avatarBg: 'bg-purple-100 text-purple-700 border-purple-300',
            favoriteFlavor: 'Pomme',
            joinedAt: new Date().toISOString(),
          },
        ];
        localStorage.setItem('bonbon_registered_users', JSON.stringify(users));
      }

      // Find user by username
      const found = users.find(
        (u) =>
          u.username.toLowerCase() === cleanIdentifier.toLowerCase() ||
          u.firstName.toLowerCase() === cleanIdentifier.toLowerCase()
      );

      if (!found) {
        setError(
          "Aucun compte trouvé avec ce nom d'utilisateur. Clique ci-dessous sur « Créer un compte » pour t'inscrire !"
        );
        return;
      }

      // Check password
      if (!found.password || found.password !== cleanPassword) {
        setError('Mot de passe incorrect. Veuillez vérifier votre saisie.');
        return;
      }

      // Successful login into private session
      fireCandyConfetti();
      loginUser(found);
      setIsLoginOpen(false);
      setIdentifier('');
      setPassword('');
      setError('');
    } catch {
      setError('Une erreur est survenue lors de la connexion.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={() => setIsLoginOpen(false)}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
      />

      <div className="relative bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-pink-100 z-10 animate-fade-in my-8">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 text-white relative">
          <button
            onClick={() => setIsLoginOpen(false)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl mb-3 shadow-inner">
            🍭
          </div>
          <h2 className="text-xl sm:text-2xl font-candy font-bold">
            Connexion à ton Espace Privé
          </h2>
          <p className="text-pink-100 text-xs mt-1">
            L'identifiant et le mot de passe sont obligatoires pour ouvrir ta session sécurisée.
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleLogin} className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span className="font-semibold">{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-pink-500" />
              <span>Nom d'utilisateur (pseudo)</span>
              <span className="text-rose-500 font-extrabold">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ex: lucas ou ton pseudo"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-pink-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-pink-500" />
              <span>Mot de passe</span>
              <span className="text-rose-500 font-extrabold">*</span>
            </label>
            <input
              type="password"
              required
              placeholder="Ton mot de passe secret"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-pink-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-candy font-bold text-sm shadow-lg shadow-pink-200 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 mt-2"
          >
            <LogIn className="w-4 h-4" />
            <span>Ouvrir ma session privée 🍬</span>
          </button>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => {
                setIsLoginOpen(false);
                setIsSignupOpen(true);
              }}
              className="text-xs text-pink-600 hover:text-pink-700 font-bold"
            >
              Pas encore de profil ? Clique ici pour t'inscrire !
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
