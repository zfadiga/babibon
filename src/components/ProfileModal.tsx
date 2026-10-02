import React, { useState, useEffect } from 'react';
import {
  X,
  LogOut,
  Check,
  Heart,
  Phone,
  MapPin,
  Save,
  CheckCircle2,
  Smile,
  AlertCircle,
} from 'lucide-react';
import { ChildUser } from '../types/candy';
import { FUN_AVATARS } from '../data/defaultCandies';
import { fireCandyConfetti } from '../utils/formatters';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: ChildUser | null;
  onSaveUser: (user: ChildUser) => void;
  onLogout: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSaveUser,
  onLogout,
}) => {
  const [firstName, setFirstName] = useState('');
  const [username, setUsername] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(FUN_AVATARS[0]);
  const [favoriteFlavor, setFavoriteFlavor] = useState('Fraise');
  const [phone, setPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (isOpen && currentUser) {
      setError('');
      setSuccessMessage('');
      setFirstName(currentUser.firstName || '');
      setUsername(currentUser.username || '');
      const match = FUN_AVATARS.find((a) => a.emoji === currentUser.avatar) || FUN_AVATARS[0];
      setSelectedAvatar(match);
      setFavoriteFlavor(currentUser.favoriteFlavor || 'Fraise');
      setPhone(currentUser.phone || '');
      setDeliveryAddress(currentUser.deliveryAddress || '');
    }
  }, [isOpen, currentUser]);

  if (!isOpen || !currentUser) return null;

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName.trim()) {
      setError('Veuillez renseigner ton prénom !');
      return;
    }
    if (!username.trim()) {
      setError('Choisis un pseudo rigolo !');
      return;
    }

    const updatedUser: ChildUser = {
      ...currentUser,
      firstName: firstName.trim(),
      username: username.trim(),
      avatar: selectedAvatar.emoji,
      avatarBg: selectedAvatar.bg,
      favoriteFlavor,
      phone: phone.trim() || undefined,
      deliveryAddress: deliveryAddress.trim() || undefined,
    };

    // Update in users registry
    try {
      const stored = localStorage.getItem('bonbon_registered_users');
      const users: ChildUser[] = stored ? JSON.parse(stored) : [];
      const updatedList = users.map((u) => (u.id === currentUser.id ? updatedUser : u));
      if (!updatedList.some((u) => u.id === currentUser.id)) {
        updatedList.push(updatedUser);
      }
      localStorage.setItem('bonbon_registered_users', JSON.stringify(updatedList));
    } catch {
      // Ignore
    }

    fireCandyConfetti();
    onSaveUser(updatedUser);
    setSuccessMessage('Tes informations ont été mises à jour avec succès ! 🎉');
    setError('');
    setTimeout(() => {
      setSuccessMessage('');
    }, 3500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
      />

      <div className="relative bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-pink-100 z-10 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Decorative candy bar top */}
        <div className="absolute top-0 left-0 right-0 h-2.5 bg-gradient-to-r from-pink-400 via-amber-300 to-rose-400" />

        {/* Modal Header */}
        <div className="flex items-center justify-between mb-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="text-3xl leading-none">{currentUser.avatar}</span>
            <div>
              <h3 className="font-candy font-bold text-xl text-slate-900 leading-tight">
                Modifier mon Profil Enfant
              </h3>
              <p className="text-xs text-slate-500">
                Personnalise tes coordonnées, ton adresse et ton avatar gourmand
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

        {/* Alerts */}
        {error && (
          <div className="mb-3 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-3 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 shrink-0 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form Body */}
        <div className="overflow-y-auto pr-1 flex-1">
          <form onSubmit={handleUpdate} className="space-y-4">
            {/* Avatar Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Smile className="w-3.5 h-3.5 text-pink-500" />
                  <span>Ton avatar gourmand :</span>
                </span>
                <span className="text-pink-600 font-semibold">{selectedAvatar.label}</span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {FUN_AVATARS.map((avatar) => {
                  const isSelected = selectedAvatar.id === avatar.id;
                  return (
                    <button
                      key={avatar.id}
                      type="button"
                      onClick={() => setSelectedAvatar(avatar)}
                      className={`relative p-2 rounded-2xl flex flex-col items-center justify-center border-2 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-pink-500 bg-pink-100/70 scale-105 shadow-sm'
                          : 'border-slate-100 bg-slate-50 hover:bg-pink-50/50'
                      }`}
                    >
                      <span className="text-2xl sm:text-3xl mb-0.5">{avatar.emoji}</span>
                      <span className="text-[10px] font-bold text-slate-600 truncate w-full text-center">
                        {avatar.label.split(' ')[0]}
                      </span>
                      {isSelected && (
                        <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-pink-500 text-white flex items-center justify-center text-[10px]">
                          <Check className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Prénom & Pseudo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ton prénom :
                </label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Ex : Lucas, Awa..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ton pseudo rigolo :
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ex : CapitaineFraise"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400"
                />
              </div>
            </div>

            {/* Saveur préférée */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 text-pink-500 fill-pink-500" />
                <span>Ta saveur préférée :</span>
              </label>
              <select
                value={favoriteFlavor}
                onChange={(e) => setFavoriteFlavor(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400"
              >
                <option value="Fraise">🍓 Fraise gourmande</option>
                <option value="Cola Fizz">🥤 Cola pétillant</option>
                <option value="Chocolat">🍫 Chocolat fondant</option>
                <option value="Acide Pomme">🍏 Pomme ultra-acide</option>
                <option value="Barbapapa">☁️ Barbapapa guimauve</option>
                <option value="Caramel">🍯 Doux caramel</option>
              </select>
            </div>

            {/* Numéro de téléphone */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Numéro de téléphone :</span>
                </span>
                <span className="text-[10px] text-slate-400">Pour tes commandes WhatsApp</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ex : 07 01 02 03 04"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400"
              />
            </div>

            {/* Adresse de livraison */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-pink-500" />
                  <span>Adresse ou quartier habituel :</span>
                </span>
                <span className="text-[10px] text-slate-400">Pour la livraison</span>
              </label>
              <input
                type="text"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder="Ex : Cocody Angré 8ème tranche..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400"
              />
            </div>

            {/* Actions */}
            <div className="pt-2 space-y-2">
              <button
                type="submit"
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-candy font-bold text-sm shadow-md shadow-pink-200 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Enregistrer mes modifications ✨</span>
              </button>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onLogout();
                  }}
                  className="flex-1 py-2.5 px-4 rounded-2xl border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Se déconnecter</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
