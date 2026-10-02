import React, { useState } from 'react';
import { X, Sparkles, Heart, Phone, MapPin, Check, Smile, LogIn, AlertCircle } from 'lucide-react';
import { ChildUser } from '../types/candy';
import { FUN_AVATARS } from '../data/defaultCandies';
import { fireCandyConfetti } from '../utils/formatters';

interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: ChildUser) => void;
  onSwitchToLogin: () => void;
}

export const SignupModal: React.FC<SignupModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onSwitchToLogin,
}) => {
  const [firstName, setFirstName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(FUN_AVATARS[0]);
  const [favoriteFlavor, setFavoriteFlavor] = useState('Fraise');
  const [phone, setPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName.trim()) {
      setError('Veuillez entrer ton prénom !');
      return;
    }
    if (!username.trim()) {
      setError('Choisis un nom d\'utilisateur (pseudo) !');
      return;
    }

    const newUser: ChildUser = {
      id: `user-${Date.now()}`,
      username: username.trim(),
      firstName: firstName.trim(),
      avatar: selectedAvatar.emoji,
      avatarBg: selectedAvatar.bg,
      favoriteFlavor,
      phone: phone.trim() || undefined,
      deliveryAddress: deliveryAddress.trim() || undefined,
      joinedAt: new Date().toISOString(),
    };

    // Store in users registry
    try {
      const stored = localStorage.getItem('bonbon_registered_users');
      const users: ChildUser[] = stored ? JSON.parse(stored) : [];
      const filtered = users.filter(
        (u) => u.username.toLowerCase() !== newUser.username.toLowerCase()
      );
      filtered.push(newUser);
      localStorage.setItem('bonbon_registered_users', JSON.stringify(filtered));
    } catch {
      // Ignore
    }

    fireCandyConfetti();
    onSuccess(newUser);
    onClose();
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
        <div className="absolute top-0 left-0 right-0 h-2.5 bg-gradient-to-r from-pink-500 via-rose-400 to-amber-400" />

        {/* Modal Header */}
        <div className="flex items-center justify-between mb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-400 text-white flex items-center justify-center text-2xl shadow-md shadow-pink-200">
              🍬
            </div>
            <div>
              <h3 className="font-candy font-bold text-xl sm:text-2xl text-slate-900 leading-tight">
                Je m'inscris au Club 🐻
              </h3>
              <p className="text-xs text-slate-500">
                Crée ton profil enfant pour accéder à ton Dashboard & Panier
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
          <div className="mb-3 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Modal Form */}
        <div className="overflow-y-auto pr-1 flex-1">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Avatar Picker */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Smile className="w-3.5 h-3.5 text-pink-500" />
                  <span>Choisis ton avatar rigolo :</span>
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
                  Ton prénom <span className="text-rose-500">*</span> :
                </label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => {
                    setFirstName(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="Ex : Lucas, Awa..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ton pseudo rigolo <span className="text-rose-500">*</span> :
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="Ex : CapitaineFraise"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400"
                />
              </div>
            </div>

            {/* Mot de passe secret */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span>Code secret ou mot de passe :</span>
                <span className="text-[10px] text-slate-400 font-normal">Pour te reconnecter facilement</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ex : bonbon123"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400"
              />
            </div>

            {/* Saveur préférée */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 text-pink-500 fill-pink-500" />
                <span>Ta saveur de bonbon préférée :</span>
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
                <span className="text-[10px] text-slate-400">Pour te livrer tes bonbons</span>
              </label>
              <input
                type="text"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder="Ex : Cocody Angré 8ème tranche..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2 space-y-3">
              <button
                type="submit"
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-candy font-bold text-sm shadow-md shadow-pink-200 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-200" />
                <span>Créer mon profil magique ✨</span>
              </button>

              {/* Direct Link to Login Modal */}
              <div className="pt-2 text-center border-t border-slate-100">
                <span className="text-xs text-slate-500">Tu as déjà un compte ? </span>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onSwitchToLogin();
                  }}
                  className="text-xs font-bold text-pink-600 hover:text-pink-700 underline cursor-pointer inline-flex items-center gap-1"
                >
                  <LogIn className="w-3 h-3" />
                  <span>J'ai déjà un compte</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
