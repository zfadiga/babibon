'use client';

import React, { useState, useEffect } from 'react';
import { X, LogOut, Check, Phone, MapPin, Save, AlertCircle } from 'lucide-react';
import { ChildUser } from '@/types/candy';
import { FUN_AVATARS } from '@/data/defaultCandies';
import { fireCandyConfetti } from '@/utils/formatters';
import { useStore } from '@/context/StoreContext';

export const ProfileModal: React.FC = () => {
  const { isProfileOpen, setIsProfileOpen, currentUser, updateUserProfile, logoutUser } = useStore();
  const [firstName, setFirstName] = useState('');
  const [username, setUsername] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(FUN_AVATARS[0]);
  const [phone, setPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (isProfileOpen && currentUser) {
      setError('');
      setSuccessMessage('');
      setFirstName(currentUser.firstName || '');
      setUsername(currentUser.username || '');
      const match = FUN_AVATARS.find((a) => a.emoji === currentUser.avatar) || FUN_AVATARS[0];
      setSelectedAvatar(match);
      setPhone(currentUser.phone || '');
      setDeliveryAddress(currentUser.deliveryAddress || '');
      setNewPassword('');
    }
  }, [isProfileOpen, currentUser]);

  if (!isProfileOpen || !currentUser) return null;

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!firstName.trim()) {
      setError('Le prénom ne peut pas être vide.');
      return;
    }

    if (newPassword && newPassword.trim().length < 4) {
      setError('Le nouveau mot de passe doit comporter au moins 4 caractères.');
      return;
    }

    const updatedUser: ChildUser = {
      ...currentUser,
      firstName: firstName.trim(),
      username: username.trim() || currentUser.username,
      avatar: selectedAvatar.emoji,
      avatarBg: selectedAvatar.bg,
      phone: phone.trim() || undefined,
      deliveryAddress: deliveryAddress.trim() || undefined,
      ...(newPassword.trim() ? { password: newPassword.trim() } : {}),
    };

    updateUserProfile(updatedUser);
    fireCandyConfetti();
    setSuccessMessage('Profil mis à jour avec succès ! 🎉');
    setTimeout(() => {
      setIsProfileOpen(false);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={() => setIsProfileOpen(false)}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
      />

      <div className="relative bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-pink-100 z-10 animate-fade-in">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 text-white relative">
          <button
            onClick={() => setIsProfileOpen(false)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl border-2 border-white shadow-md ${selectedAvatar.bg}`}
            >
              {selectedAvatar.emoji}
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-candy font-bold">
                Mon Profil Gourmand
              </h2>
              <p className="text-pink-100 text-xs">
                Modifie tes coordonnées et tes préférences
              </p>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleUpdate} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Change Avatar */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-2">
              Changer d'avatar :
            </label>
            <div className="grid grid-cols-4 gap-2">
              {FUN_AVATARS.map((av) => {
                const isSelected = selectedAvatar.id === av.id;
                return (
                  <button
                    key={av.id}
                    type="button"
                    onClick={() => setSelectedAvatar(av)}
                    className={`p-2 rounded-xl flex flex-col items-center gap-1 border-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-pink-500 bg-pink-50 shadow-xs'
                        : 'border-slate-100 bg-slate-50/60 hover:border-pink-200'
                    }`}
                  >
                    <span className="text-xl">{av.emoji}</span>
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
              <label className="text-xs font-bold text-slate-700">Prénom</label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-pink-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Pseudo</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-pink-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-pink-500" />
              <span>Numéro WhatsApp de livraison</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-pink-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-pink-500" />
              <span>Adresse de livraison préférée</span>
            </label>
            <textarea
              rows={2}
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-pink-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <span>Changer de mot de passe</span>
              <span className="text-[10px] text-slate-400 font-normal">(laisser vide pour conserver l'actuel)</span>
            </label>
            <input
              type="password"
              placeholder="Nouveau mot de passe (min. 4 caractères)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-pink-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-candy font-bold text-sm shadow-md shadow-pink-200 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <Save className="w-4 h-4" />
              <span>Sauvegarder</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsProfileOpen(false);
                logoutUser();
              }}
              className="p-3 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-colors cursor-pointer"
              title="Me déconnecter"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
