'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Lock,
  LogIn,
  UserPlus,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  User,
  KeyRound,
  Phone,
  MapPin,
  Heart,
  ShoppingBag,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import { StoreNavbar } from '@/components/store/Navbar';
import { useStore } from '@/context/StoreContext';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { ChildUser } from '@/types/candy';
import { fireCandyConfetti, formatPrice } from '@/utils/formatters';

const AVATAR_OPTIONS = [
  { emoji: '🐻', bg: 'bg-amber-100 text-amber-700 border-amber-300' },
  { emoji: '🦄', bg: 'bg-purple-100 text-purple-700 border-purple-300' },
  { emoji: '🐰', bg: 'bg-pink-100 text-pink-700 border-pink-300' },
  { emoji: '🍭', bg: 'bg-rose-100 text-rose-700 border-rose-300' },
  { emoji: '🍓', bg: 'bg-red-100 text-red-700 border-red-300' },
  { emoji: '🍫', bg: 'bg-amber-100 text-amber-900 border-amber-400' },
];

const FAVORITE_FLAVORS = [
  'Fraise Sauvage',
  'Framboise Bleue',
  'Pomme Acidulée',
  'Cola Pétillant',
  'Chocolat Fondant',
  'Barbe à Papa',
];

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get('redirect') || '/';
  const reason = searchParams.get('reason');
  const initialTab = searchParams.get('tab') === 'signup' ? 'signup' : 'login';

  const {
    currentUser,
    loginUser,
    pendingCandyToAdd,
    settings,
  } = useStore();

  const [activeTab, setActiveTab] = useState<'login' | 'signup'>(initialTab);

  // Login form state
  const [identifier, setIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Signup form state
  const [firstName, setFirstName] = useState('');
  const [username, setUsername] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [favoriteFlavor, setFavoriteFlavor] = useState(FAVORITE_FLAVORS[0]);
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_OPTIONS[0]);
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupError, setSignupError] = useState('');

  // If already logged in, redirect smoothly back
  useEffect(() => {
    if (currentUser) {
      router.replace(redirectTarget);
    }
  }, [currentUser, router, redirectTarget]);

  // Handle Login submission
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const cleanIdentifier = identifier.trim();
    const cleanPassword = loginPassword.trim();

    if (!cleanIdentifier) {
      setLoginError("Le nom d'utilisateur ou l'email est obligatoire.");
      return;
    }
    if (!cleanPassword) {
      setLoginError('Le mot de passe est obligatoire.');
      return;
    }

    setLoginLoading(true);

    try {
      // 1. Supabase Auth Attempt
      if (isSupabaseConfigured) {
        try {
          const userEmail = cleanIdentifier.includes('@')
            ? cleanIdentifier
            : `${cleanIdentifier.toLowerCase().replace(/[^a-z0-9]/g, '')}@babibon.local`;

          const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: userEmail,
            password: cleanPassword,
          });

          if (!authError && authData?.user) {
            const meta = authData.user.user_metadata || {};
            const loggedUser: ChildUser = {
              id: authData.user.id,
              username: meta.username || cleanIdentifier,
              firstName: meta.full_name || meta.firstName || cleanIdentifier,
              avatar: meta.avatar || '🐻',
              avatarBg: meta.avatarBg || 'bg-pink-100 text-pink-700 border-pink-300',
              favoriteFlavor: meta.favoriteFlavor || 'Fraise',
              phone: meta.phone,
              deliveryAddress: meta.deliveryAddress,
              joinedAt: authData.user.created_at || new Date().toISOString(),
            };

            loginUser(loggedUser);
            fireCandyConfetti();
            router.push(redirectTarget);
            return;
          }
        } catch (sbErr) {
          console.warn('Supabase login warning:', sbErr);
        }
      }

      // 2. Local Storage Fallback
      const stored = localStorage.getItem('bonbon_registered_users');
      let users: ChildUser[] = stored ? JSON.parse(stored) : [];

      if (users.length === 0) {
        users = [
          {
            id: 'child-1',
            username: 'yacine',
            password: 'password123',
            firstName: 'Yacine',
            avatar: '🐻',
            avatarBg: 'bg-amber-100 text-amber-700 border-amber-300',
            favoriteFlavor: 'Fraise',
            joinedAt: new Date().toISOString(),
          },
        ];
        localStorage.setItem('bonbon_registered_users', JSON.stringify(users));
      }

      const found = users.find(
        (u) =>
          u.username.toLowerCase() === cleanIdentifier.toLowerCase() ||
          u.firstName.toLowerCase() === cleanIdentifier.toLowerCase()
      );

      if (!found) {
        setLoginError(
          "Aucun compte trouvé avec cet identifiant. Cliquez sur « Créer un compte » pour vous inscrire !"
        );
        return;
      }

      if (!found.password || found.password !== cleanPassword) {
        setLoginError('Mot de passe incorrect. Veuillez vérifier votre saisie.');
        return;
      }

      loginUser(found);
      fireCandyConfetti();
      router.push(redirectTarget);
    } catch {
      setLoginError('Une erreur est survenue lors de la connexion.');
    } finally {
      setLoginLoading(false);
    }
  };

  // Handle Signup submission
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError('');

    const cleanFirst = firstName.trim();
    const cleanUsername = username.trim().toLowerCase();
    const cleanPassword = signupPassword.trim();

    if (!cleanFirst) {
      setSignupError('Veuillez entrer votre prénom.');
      return;
    }
    if (!cleanUsername || cleanUsername.length < 3) {
      setSignupError("Le nom d'utilisateur doit comporter au moins 3 caractères.");
      return;
    }
    if (!cleanPassword || cleanPassword.length < 6) {
      setSignupError('Le mot de passe doit comporter au moins 6 caractères.');
      return;
    }
    if (cleanPassword !== confirmPassword.trim()) {
      setSignupError('Les deux mots de passe ne correspondent pas.');
      return;
    }

    setSignupLoading(true);

    try {
      const stored = localStorage.getItem('bonbon_registered_users');
      const users: ChildUser[] = stored ? JSON.parse(stored) : [];

      if (users.some((u) => u.username.toLowerCase() === cleanUsername)) {
        setSignupError("Ce nom d'utilisateur est déjà utilisé. Choisis-en un autre !");
        setSignupLoading(false);
        return;
      }

      let assignedId = `child-${Date.now()}`;
      const userEmail = `${cleanUsername.replace(/[^a-z0-9]/g, '')}@babibon.local`;

      // 1. Supabase Auth signup + profiles storage
      if (isSupabaseConfigured) {
        try {
          const { data: authData, error: authError } = await supabase.auth.signUp({
            email: userEmail,
            password: cleanPassword,
            options: {
              data: {
                username: cleanUsername,
                full_name: cleanFirst,
                firstName: cleanFirst,
                avatar: selectedAvatar.emoji,
                avatarBg: selectedAvatar.bg,
                favoriteFlavor,
                phone: phone.trim() || undefined,
                deliveryAddress: deliveryAddress.trim() || undefined,
                role: 'client',
              },
            },
          });

          if (!authError && authData?.user?.id) {
            assignedId = authData.user.id;
            await supabase.from('profiles').upsert([
              {
                id: authData.user.id,
                email: userEmail,
                username: cleanUsername,
                full_name: cleanFirst,
                avatar: selectedAvatar.emoji,
                avatar_bg: selectedAvatar.bg,
                favorite_flavor: favoriteFlavor,
                phone: phone.trim() || null,
                delivery_address: deliveryAddress.trim() || null,
                role: 'client',
              },
            ]);
          }
        } catch (sbErr) {
          console.warn('Supabase signup notice:', sbErr);
        }
      }

      const newUser: ChildUser = {
        id: assignedId,
        username: cleanUsername,
        password: cleanPassword,
        firstName: cleanFirst,
        avatar: selectedAvatar.emoji,
        avatarBg: selectedAvatar.bg,
        favoriteFlavor,
        phone: phone.trim() || undefined,
        deliveryAddress: deliveryAddress.trim() || undefined,
        joinedAt: new Date().toISOString(),
      };

      localStorage.setItem('bonbon_registered_users', JSON.stringify([...users, newUser]));

      loginUser(newUser);
      fireCandyConfetti();
      router.push(redirectTarget);
    } catch {
      setSignupError("Une erreur est survenue lors de l'inscription.");
    } finally {
      setSignupLoading(false);
    }
  };

  const pendingCandy = pendingCandyToAdd?.candy;
  const pendingQty = pendingCandyToAdd?.quantity || 1;

  return (
    <div className="min-h-screen flex flex-col bg-[#FFF9FB]">
      <StoreNavbar />

      <main className="flex-1 max-w-xl w-full mx-auto px-4 py-8 sm:py-12 flex flex-col justify-center">
        {/* Back Link */}
        <div className="mb-4">
          <Link
            href={redirectTarget}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-pink-600 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Retour à la boutique</span>
          </Link>
        </div>

        {/* Protection Alert Banner (when redirected from adding candy) */}
        {reason === 'add_candy' && (
          <div className="mb-6 p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 text-white shadow-lg shadow-pink-200 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl shrink-0">
                🍬
              </div>
              <div className="flex-1">
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-bold uppercase tracking-wider mb-1">
                  Connexion requise
                </span>
                <h2 className="font-candy font-bold text-base sm:text-lg leading-tight">
                  Veuillez vous connecter ou créer un compte pour ajouter un bonbon
                </h2>
                <p className="text-xs text-white/90 mt-1 leading-relaxed">
                  Dès votre connexion, votre bonbon sera automatiquement placé dans votre panier et vous pourrez continuer vos achats !
                </p>
              </div>
            </div>

            {/* Pending candy summary */}
            {pendingCandy && (
              <div className="mt-4 pt-3 border-t border-white/20 flex items-center gap-3 bg-black/10 p-2.5 rounded-2xl">
                <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center overflow-hidden shrink-0">
                  {pendingCandy.imageUrl || pendingCandy.image_url ? (
                    <img
                      src={pendingCandy.imageUrl || pendingCandy.image_url}
                      alt={pendingCandy.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xl">{pendingCandy.emojiIcon || '🍬'}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-candy font-bold text-white text-xs truncate">
                    {pendingCandy.name} (x{pendingQty})
                  </p>
                  <p className="text-[11px] text-pink-100 font-extrabold">
                    {formatPrice(pendingCandy.price * pendingQty, settings.currency, settings.eurToFcfaRate)}
                  </p>
                </div>
                <span className="text-[11px] font-bold text-white bg-white/20 px-2.5 py-1 rounded-full shrink-0">
                  En attente
                </span>
              </div>
            )}
          </div>
        )}

        {/* Main Authentication Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-pink-100 shadow-xl shadow-pink-100/50">
          {/* Tab Selector */}
          <div className="flex rounded-2xl bg-pink-50/70 p-1.5 mb-6 border border-pink-100">
            <button
              type="button"
              onClick={() => setActiveTab('login')}
              className={`flex-1 py-2.5 rounded-xl font-candy font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'login'
                  ? 'bg-white text-pink-600 shadow-xs'
                  : 'text-slate-600 hover:text-pink-600'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>Se connecter</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('signup')}
              className={`flex-1 py-2.5 rounded-xl font-candy font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'signup'
                  ? 'bg-white text-pink-600 shadow-xs'
                  : 'text-slate-600 hover:text-pink-600'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Créer un compte</span>
            </button>
          </div>

          {/* TAB 1: LOGIN FORM */}
          {activeTab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {loginError && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{loginError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nom d&apos;utilisateur ou Email
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="Ex: yacine ou client@babibon.local"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 border border-pink-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 border border-pink-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full mt-2 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-candy font-bold text-sm shadow-md shadow-pink-200 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
              >
                {loginLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Connexion en cours...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Me connecter 🍬</span>
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <p className="text-xs text-slate-500">
                  Pas encore de compte ?{' '}
                  <button
                    type="button"
                    onClick={() => setActiveTab('signup')}
                    className="text-pink-600 font-bold hover:underline cursor-pointer"
                  >
                    Créer un compte gratuitement
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* TAB 2: SIGNUP FORM */}
          {activeTab === 'signup' && (
            <form onSubmit={handleSignupSubmit} className="space-y-4">
              {signupError && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{signupError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Prénom *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Yacine"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-pink-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Nom d&apos;utilisateur *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: yacine85"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-pink-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Téléphone (optionnel)
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      placeholder="Ex: 0700000000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-2xl bg-slate-50 border border-pink-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Adresse de livraison
                  </label>
                  <div className="relative">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Ex: Cocody Angré"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-2xl bg-slate-50 border border-pink-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 focus:bg-white transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Mot de passe *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Min 6 caractères"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-pink-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Confirmer le mot de passe *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Répétez le mot de passe"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-pink-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Avatar Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Choisis ton avatar bonbon
                </label>
                <div className="flex items-center gap-2">
                  {AVATAR_OPTIONS.map((opt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedAvatar(opt)}
                      className={`w-10 h-10 rounded-2xl text-xl flex items-center justify-center border transition-all cursor-pointer ${
                        selectedAvatar.emoji === opt.emoji
                          ? `${opt.bg} ring-2 ring-pink-500 scale-110 shadow-xs`
                          : 'bg-slate-50 border-slate-200 hover:bg-pink-50'
                      }`}
                    >
                      {opt.emoji}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={signupLoading}
                className="w-full mt-2 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-candy font-bold text-sm shadow-md shadow-pink-200 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
              >
                {signupLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Création du compte...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Créer mon compte 🍭</span>
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <p className="text-xs text-slate-500">
                  Déjà un compte ?{' '}
                  <button
                    type="button"
                    onClick={() => setActiveTab('login')}
                    className="text-pink-600 font-bold hover:underline cursor-pointer"
                  >
                    Se connecter ici
                  </button>
                </p>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#FFF9FB]">
          <div className="p-8 rounded-3xl bg-white border border-pink-100 shadow-md text-center">
            <Loader2 className="w-8 h-8 animate-spin text-pink-500 mx-auto mb-2" />
            <p className="text-xs text-slate-500 font-medium">Chargement...</p>
          </div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
