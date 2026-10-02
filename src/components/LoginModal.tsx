import React, { useState } from 'react';
import { X, LogIn, UserPlus, Sparkles, AlertCircle, KeyRound } from 'lucide-react';
import { ChildUser } from '../types/candy';
import { FUN_AVATARS } from '../data/defaultCandies';
import { fireCandyConfetti } from '../utils/formatters';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: ChildUser) => void;
  onSwitchToSignup: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onSwitchToSignup,
}) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    if (!identifier.trim()) {
      setError('Entre ton pseudo ou ton prénom !');
      return;
    }

    try {
      const stored = localStorage.getItem('bonbon_registered_users');
      const users: ChildUser[] = stored ? JSON.parse(stored) : [];
      const found = users.find(
        (u) =>
          u.username.toLowerCase() === identifier.trim().toLowerCase() ||
          u.firstName.toLowerCase() === identifier.trim().toLowerCase()
      );

      if (found) {
        fireCandyConfetti();
        onSuccess(found);
        onClose();
        return;
      }

      // If user isn't found in registered list, automatically create a friendly profile with their entered identifier
      const randomAvatar = FUN_AVATARS[Math.floor(Math.random() * FUN_AVATARS.length)];
      const autoUser: ChildUser = {
        id: `user-${Date.now()}`,
        username: identifier.trim(),
        firstName: identifier.trim(),
        avatar: randomAvatar.emoji,
        avatarBg: randomAvatar.bg,
        favoriteFlavor: 'Fraise',
        joinedAt: new Date().toISOString(),
      };

      // Also persist to registered users list
      users.push(autoUser);
      localStorage.setItem('bonbon_registered_users', JSON.stringify(users));

      fireCandyConfetti();
      onSuccess(autoUser);
      onClose();
    } catch {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
      />

      <div className="relative bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-pink-100 z-10 overflow-hidden flex flex-col">
        {/* Decorative bar top */}
        <div className="absolute top-0 left-0 right-0 h-2.5 bg-gradient-to-r from-amber-400 via-pink-500 to-rose-500" />

        {/* Modal Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center text-2xl shadow-sm border border-amber-200">
              🔑
            </div>
            <div>
              <h3 className="font-candy font-bold text-xl sm:text-2xl text-slate-900 leading-tight">
                J'ai déjà un compte
              </h3>
              <p className="text-xs text-slate-500">
                Connecte-toi pour retrouver ton Dashboard et ton panier
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Ton pseudo ou prénom <span className="text-rose-500">*</span> :
            </label>
            <input
              type="text"
              required
              value={identifier}
              onChange={(e) => {
                setIdentifier(e.target.value);
                if (error) setError('');
              }}
              placeholder="Ex : CapitaineFraise ou Lucas"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <KeyRound className="w-3 h-3 text-slate-400" />
                <span>Code secret ou mot de passe :</span>
              </span>
              <span className="text-[10px] text-slate-400 font-normal">Optionnel</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ton mot de passe secret"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2 space-y-3">
            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-candy font-bold text-sm shadow-md shadow-pink-200 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Me connecter à mon espace 🍭</span>
              <Sparkles className="w-4 h-4 text-amber-200" />
            </button>

            {/* Direct Link to Signup Modal */}
            <div className="pt-2 text-center border-t border-slate-100">
              <span className="text-xs text-slate-500">Nouveau gourmand ? </span>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onSwitchToSignup();
                }}
                className="text-xs font-bold text-pink-600 hover:text-pink-700 underline cursor-pointer inline-flex items-center gap-1"
              >
                <UserPlus className="w-3 h-3" />
                <span>Créer mon profil enfant</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
