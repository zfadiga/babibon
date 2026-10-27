'use client';

import React, { useState, useEffect } from 'react';
import { X, LogOut, Check, Phone, MapPin, Save, AlertCircle, Trash2, Loader2, ShieldAlert } from 'lucide-react';
import { ChildUser } from '@/types/candy';
import { FUN_AVATARS } from '@/data/defaultCandies';
import { fireCandyConfetti } from '@/utils/formatters';
import { useStore } from '@/context/StoreContext';
import { deleteUserProfile } from '@/lib/api';

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
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

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

  const handleDeleteAccount = async () => {
    if (!currentUser) return;
    setIsDeleting(true);
    setDeleteError('');

    try {
      const res = await deleteUserProfile(
        currentUser.id,
        'Suppression du compte demandée par le client lui-même'
      );
      if (res.success) {
        setIsDeleteModalOpen(false);
        setIsProfileOpen(false);
        logoutUser();
      } else {
        setDeleteError(res.message || 'Impossible de supprimer le compte.');
      }
    } catch (err: any) {
      setDeleteError(err.message || 'Erreur lors de la suppression.');
    } finally {
      setIsDeleting(false);
    }
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

          {/* Delete Account link */}
          <div className="pt-3 border-t border-pink-100 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(true)}
              className="text-xs text-rose-500 hover:text-rose-700 font-medium hover:underline flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Supprimer définitivement mon compte</span>
            </button>
          </div>
        </form>
      </div>

      {/* Confirmation Modal for Account Self-Deletion */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-rose-100 animate-scale-up text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-gray-900 mb-1">
              Supprimer votre compte ?
            </h3>

            <p className="text-xs text-gray-600 mb-4 leading-relaxed">
              Cette action supprimera définitivement votre profil, votre panier et vos informations de connexion.
            </p>

            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 mb-4 text-left leading-snug">
              🔒 <strong>Sécurité & Audit :</strong> Cette opération est protégée par les permissions serveur et sera consignée dans le journal d&apos;audit de sécurité.
            </div>

            {deleteError && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs mb-4">
                {deleteError}
              </div>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeleteError('');
                }}
                disabled={isDeleting}
                className="w-1/2 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="w-1/2 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-md shadow-rose-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>Confirmer</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
