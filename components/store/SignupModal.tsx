'use client';

import React, { useState } from 'react';
import { X, Sparkles, Phone, MapPin, Check, AlertCircle, Lock, User } from 'lucide-react';
import { ChildUser } from '@/types/candy';
import { FUN_AVATARS } from '@/data/defaultCandies';
import { fireCandyConfetti } from '@/utils/formatters';
import { useStore } from '@/context/StoreContext';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';

export const SignupModal: React.FC = () => {
  const { isSignupOpen, setIsSignupOpen, setIsLoginOpen, loginUser } = useStore();
  const [firstName, setFirstName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(FUN_AVATARS[0]);
  const [favoriteFlavor, setFavoriteFlavor] = useState('Fraise');
  const [phone, setPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [error, setError] = useState('');

  if (!isSignupOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanFirstName = firstName.trim();
    const cleanUsername = username.trim();
    const cleanPassword = password.trim();

    if (!cleanFirstName) {
      setError('Ton prénom est obligatoire.');
      return;
    }
    if (!cleanUsername) {
      setError("Le nom d'utilisateur (pseudo) est obligatoire.");
      return;
    }
    if (!cleanPassword) {
      setError('Le mot de passe est obligatoire.');
      return;
    }
    if (cleanPassword.length < 4) {
      setError('Le mot de passe doit comporter au moins 4 caractères.');
      return;
    }
    if (cleanPassword !== confirmPassword.trim()) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    try {
      const stored = localStorage.getItem('bonbon_registered_users');
      const users: ChildUser[] = stored ? JSON.parse(stored) : [];

      // Check if username is already taken locally
      const userExists = users.some(
        (u) => u.username.toLowerCase() === cleanUsername.toLowerCase()
      );
      if (userExists) {
        setError("Ce nom d'utilisateur est déjà utilisé. Choisis-en un autre !");
        return;
      }

      let assignedId = `user-${Date.now()}`;

      if (isSupabaseConfigured) {
        try {
          const userEmail = cleanUsername.includes('@')
            ? cleanUsername
            : `${cleanUsername.toLowerCase().replace(/[^a-z0-9]/g, '')}@babibon.local`;

          const { data: authData, error: authError } = await supabase.auth.signUp({
            email: userEmail,
            password: cleanPassword,
            options: {
              data: {
                full_name: cleanFirstName,
                username: cleanUsername,
                avatar: selectedAvatar.emoji,
                avatarBg: selectedAvatar.bg,
                favoriteFlavor,
                phone: phone.trim() || undefined,
                deliveryAddress: deliveryAddress.trim() || undefined,
                role: 'customer',
              },
            },
          });

          if (authData?.user?.id) {
            assignedId = authData.user.id;
            try {
              await supabase.from('profiles').upsert([
                {
                  id: authData.user.id,
                  email: userEmail,
                  username: cleanUsername,
                  full_name: cleanFirstName,
                  avatar: selectedAvatar.emoji,
                  avatar_bg: selectedAvatar.bg,
                  favorite_flavor: favoriteFlavor,
                  phone: phone.trim() || null,
                  delivery_address: deliveryAddress.trim() || null,
                  role: 'client',
                },
              ]);
            } catch (pErr) {
              console.warn('Profile upsert notice:', pErr);
            }
          }
        } catch (authErr) {
          console.warn('Supabase auth signup fallback:', authErr);
        }
      }

      const newUser: ChildUser = {
        id: assignedId,
        username: cleanUsername,
        password: cleanPassword,
        firstName: cleanFirstName,
        avatar: selectedAvatar.emoji,
        avatarBg: selectedAvatar.bg,
        favoriteFlavor,
        phone: phone.trim() || undefined,
        deliveryAddress: deliveryAddress.trim() || undefined,
        joinedAt: new Date().toISOString(),
      };

      localStorage.setItem('bonbon_registered_users', JSON.stringify([...users, newUser]));

      fireCandyConfetti();
      loginUser(newUser);
      setIsSignupOpen(false);
      // Reset form fields
      setFirstName('');
      setUsername('');
      setPassword('');
      setConfirmPassword('');
      setPhone('');
      setDeliveryAddress('');
    } catch {
      setError("Une erreur est survenue lors de l'enregistrement.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={() => setIsSignupOpen(false)}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
      />

      <div className="relative bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-pink-100 z-10 animate-fade-in my-8">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 text-white relative">
          <button
            onClick={() => setIsSignupOpen(false)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-amber-200" />
            <span className="text-pink-100 text-xs font-bold uppercase tracking-wider">
              Nouveau Gourmand
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-candy font-bold">
            Créer un compte 🍭
          </h2>
          <p className="text-pink-100 text-xs mt-1">
            L'identifiant et le mot de passe sont obligatoires pour sécuriser ton espace personnel.
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span className="font-semibold">{error}</span>
            </div>
          )}

          {/* Avatar Selector */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-2">
              Choisis ton avatar :
            </label>
            <div className="grid grid-cols-4 gap-2">
              {FUN_AVATARS.map((av) => {
                const isSelected = selectedAvatar.id === av.id;
                return (
                  <button
                    key={av.id}
                    type="button"
                    onClick={() => setSelectedAvatar(av)}
                    className={`p-2 rounded-2xl flex flex-col items-center gap-1 border-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-pink-500 bg-pink-50 shadow-xs scale-105'
                        : 'border-slate-100 bg-slate-50/60 hover:border-pink-200'
                    }`}
                  >
                    <span className="text-2xl">{av.emoji}</span>
                    <span className="text-[10px] font-bold text-slate-700 truncate w-full text-center">
                      {av.label.split(' ')[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <span>Ton prénom</span>
                <span className="text-rose-500 font-extrabold">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Lucas"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-pink-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-pink-500" />
                <span>Nom d'utilisateur (pseudo)</span>
                <span className="text-rose-500 font-extrabold">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ex: RoiSucette"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-pink-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
              />
            </div>
          </div>

          {/* Compulsory Password Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-pink-500" />
                <span>Mot de passe</span>
                <span className="text-rose-500 font-extrabold">*</span>
              </label>
              <input
                type="password"
                required
                placeholder="Min. 4 caractères"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-pink-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-pink-500" />
                <span>Confirmer mot de passe</span>
                <span className="text-rose-500 font-extrabold">*</span>
              </label>
              <input
                type="password"
                required
                placeholder="Confirme ton code"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-pink-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-pink-500" />
              <span>Numéro WhatsApp (pour la livraison)</span>
            </label>
            <input
              type="tel"
              placeholder="Ex: 07 79 32 37 16"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-pink-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-pink-500" />
              <span>Adresse / Quartier de livraison habituel</span>
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Cocody Angré 7e Tranche, Abidjan..."
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-pink-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-candy font-bold text-sm sm:text-base shadow-lg shadow-pink-200 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 mt-2"
          >
            <Check className="w-4 h-4" />
            <span>Créer mon compte et me connecter ✨</span>
          </button>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => {
                setIsSignupOpen(false);
                setIsLoginOpen(true);
              }}
              className="text-xs text-pink-600 hover:text-pink-700 font-bold"
            >
              Déjà un compte ? Connecte-toi ici !
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
