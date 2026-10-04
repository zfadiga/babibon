'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Lock,
  LogIn,
  UserPlus,
  Sparkles,
  X,
  ArrowRight,
  ShoppingBag,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { formatPrice } from '@/utils/formatters';

export const AuthRequiredModal: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname() || '/';
  const {
    isAuthRequiredModalOpen,
    setIsAuthRequiredModalOpen,
    pendingCandyToAdd,
    settings,
    setIsLoginOpen,
    setIsSignupOpen,
  } = useStore();

  const [countdown, setCountdown] = useState<number>(3);
  const [isPaused, setIsPaused] = useState(false);

  // Reset countdown each time the modal opens
  useEffect(() => {
    if (isAuthRequiredModalOpen) {
      setCountdown(3);
      setIsPaused(false);
    }
  }, [isAuthRequiredModalOpen]);

  // Countdown timer for automatic redirection
  useEffect(() => {
    if (!isAuthRequiredModalOpen || isPaused) return;

    if (countdown <= 0) {
      handleRedirectToLogin('login');
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [isAuthRequiredModalOpen, countdown, isPaused]);

  if (!isAuthRequiredModalOpen) return null;

  const candy = pendingCandyToAdd?.candy;
  const quantity = pendingCandyToAdd?.quantity || 1;

  const handleRedirectToLogin = (tab: 'login' | 'signup' = 'login') => {
    setIsAuthRequiredModalOpen(false);
    const redirectUrl = encodeURIComponent(pathname);
    const candyParam = candy ? `&candyId=${encodeURIComponent(candy.id)}` : '';
    router.push(`/login?redirect=${redirectUrl}&reason=add_candy&tab=${tab}${candyParam}`);
  };

  const handleOpenInlineLogin = () => {
    setIsAuthRequiredModalOpen(false);
    setIsLoginOpen(true);
  };

  const handleOpenInlineSignup = () => {
    setIsAuthRequiredModalOpen(false);
    setIsSignupOpen(true);
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div
        className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-pink-100 relative animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={() => setIsAuthRequiredModalOpen(false)}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
          title="Fermer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Lock & Candy Header Icon */}
        <div className="relative w-16 h-16 rounded-3xl bg-gradient-to-tr from-pink-500 to-rose-400 text-white flex items-center justify-center mx-auto mb-4 shadow-lg shadow-pink-200">
          <Lock className="w-8 h-8" />
          <span className="absolute -bottom-1 -right-1 text-2xl filter drop-shadow">
            🍬
          </span>
        </div>

        {/* Header Text */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-50 text-pink-700 text-xs font-bold border border-pink-200 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-pink-500" />
            <span>Connexion requise</span>
          </div>
          <h3 className="font-candy font-bold text-xl sm:text-2xl text-slate-900 tracking-tight">
            Envie de cette douceur ?
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 mt-1.5 font-medium leading-relaxed">
            Veuillez vous connecter ou créer un compte pour ajouter un bonbon à votre panier.
          </p>
        </div>

        {/* Pending Candy Preview Card (if any) */}
        {candy && (
          <div className="mb-5 p-3.5 rounded-2xl bg-gradient-to-r from-pink-50/80 to-rose-50/80 border border-pink-200/80 flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl bg-white border border-pink-100 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
              {candy.imageUrl || candy.image_url ? (
                <img
                  src={candy.imageUrl || candy.image_url}
                  alt={candy.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-2xl">{candy.emojiIcon || '🍬'}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[11px] font-bold text-pink-600 block uppercase tracking-wider">
                Article sélectionné (x{quantity})
              </span>
              <p className="font-candy font-bold text-slate-900 text-sm truncate">
                {candy.name}
              </p>
              <p className="text-xs text-pink-600 font-extrabold">
                {formatPrice(candy.price * quantity, settings.currency, settings.eurToFcfaRate)}
              </p>
            </div>
          </div>
        )}

        {/* Auto-redirect indicator & Progress bar */}
        <div className="mb-5 p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-center">
          <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 font-medium">
            <Clock className="w-3.5 h-3.5 text-pink-500 animate-pulse" />
            <span>
              {isPaused ? (
                'Redirection en pause (survol souris)'
              ) : (
                <>
                  Redirection vers la page de connexion dans{' '}
                  <strong className="text-pink-600 font-bold">{countdown}s</strong>...
                </>
              )}
            </span>
          </div>
          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-2">
            <div
              className="bg-gradient-to-r from-pink-500 to-rose-500 h-full transition-all duration-1000 ease-linear"
              style={{ width: `${(countdown / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5">
          <button
            type="button"
            onClick={() => handleRedirectToLogin('login')}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-candy font-bold text-sm shadow-md shadow-pink-200 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <LogIn className="w-4 h-4" />
            <span>Se connecter maintenant</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>

          <button
            type="button"
            onClick={() => handleRedirectToLogin('signup')}
            className="w-full py-3 px-4 rounded-2xl bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200 font-candy font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <UserPlus className="w-4 h-4" />
            <span>Créer un compte 🍭</span>
          </button>

          <div className="pt-2 flex items-center justify-between text-xs text-slate-500">
            <button
              type="button"
              onClick={handleOpenInlineLogin}
              className="text-pink-600 hover:text-pink-700 font-semibold underline underline-offset-2 transition-colors cursor-pointer"
            >
              Connexion rapide ici
            </button>

            <button
              type="button"
              onClick={() => setIsAuthRequiredModalOpen(false)}
              className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
