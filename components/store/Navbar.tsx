'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sparkles,
  User,
  LogOut,
  ShoppingBag,
  Home,
  ChevronDown,
  ClipboardList,
} from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { formatPrice } from '@/utils/formatters';

export const StoreNavbar: React.FC = () => {
  const pathname = usePathname();
  const {
    currentUser,
    cart,
    orders,
    settings,
    toggleCurrency,
    setIsLoginOpen,
    setIsSignupOpen,
    setIsProfileOpen,
    logoutUser,
  } = useStore();

  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartDistinctCount = cart.length;
  const userOrdersCount = currentUser
    ? orders.filter((o) => o.childId === currentUser.id || (o.childUsername && o.childUsername.toLowerCase() === currentUser.username.toLowerCase())).length
    : 0;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsAccountDropdownOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsAccountDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-pink-100 shadow-sm transition-all">
      {/* Top notice banner */}
      <div className="bg-gradient-to-r from-pink-500 via-rose-400 to-amber-400 text-white text-xs font-medium py-1 px-4 text-center flex items-center justify-center gap-2">
        <Sparkles className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '8s' }} />
        <span className="truncate">
          {settings.storeNotice || "🎉 Bienvenue chez BonbonMagique ! Commande tes friandises sur WhatsApp !"}
        </span>
        <span className="hidden sm:inline">🍬✨</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
        {/* Brand Wordmark */}
        <Link
          href="/"
          className="flex items-center gap-2.5 text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-400 rounded-xl p-1 shrink-0"
          title="Retour à la boutique"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 to-amber-400 flex items-center justify-center text-xl shadow-md shadow-pink-200 group-hover:scale-105 transition-transform duration-200">
            🍭
          </div>
          <div>
            <span className="text-xl sm:text-2xl font-candy font-bold tracking-tight bg-gradient-to-r from-pink-600 via-rose-500 to-amber-500 bg-clip-text text-transparent block leading-tight">
              BonbonMagique
            </span>
            <span className="text-[11px] font-medium text-pink-500 tracking-wider uppercase block">
              La confiserie des champions
            </span>
          </div>
        </Link>

        {/* Center / Navigation Links */}
        <nav className="hidden md:flex items-center gap-1.5 bg-pink-50/70 p-1.5 rounded-2xl border border-pink-100/60">
          <Link
            href="/"
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              pathname === '/'
                ? 'bg-white text-pink-600 shadow-xs'
                : 'text-slate-600 hover:text-pink-600 hover:bg-white/50'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>Boutique</span>
          </Link>

          <Link
            href="/cart"
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 relative ${
              pathname === '/cart'
                ? 'bg-white text-pink-600 shadow-xs'
                : 'text-slate-600 hover:text-pink-600 hover:bg-white/50'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Mon Panier</span>
            {cartDistinctCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-pink-500 text-white text-[10px] font-black">
                {cartDistinctCount}
              </span>
            )}
          </Link>

          <Link
            href="/orders"
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              pathname === '/orders'
                ? 'bg-white text-pink-600 shadow-xs'
                : 'text-slate-600 hover:text-pink-600 hover:bg-white/50'
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5" />
            <span>Mes Commandes</span>
            {userOrdersCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-amber-200 text-amber-900 text-[10px] font-black">
                {userOrdersCount}
              </span>
            )}
          </Link>
        </nav>

        {/* Right Action Icons: Currency toggle, Cart badge button, Account dropdown */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Currency Toggle */}
          <button
            onClick={toggleCurrency}
            className="px-2.5 py-1.5 rounded-xl text-xs font-black border border-pink-200 bg-pink-50 hover:bg-pink-100 text-pink-700 transition-colors shadow-2xs"
            title="Changer de devise"
          >
            {settings.currency}
          </button>

          {/* Cart Button */}
          <Link
            href="/cart"
            className="relative p-2.5 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white shadow-md shadow-pink-200 transition-all flex items-center gap-2 group active:scale-95"
            title="Ouvrir mon panier"
          >
            <ShoppingBag className="w-5 h-5 group-hover:scale-110 transition-transform" />
            {cartDistinctCount > 0 && (
              <span className="flex items-center justify-center min-w-5 h-5 px-1 rounded-full bg-white text-pink-600 text-xs font-black shadow-xs">
                {cartDistinctCount}
              </span>
            )}
          </Link>

          {/* Account Profile / Login Dropdown */}
          <div className="relative" ref={dropdownRef}>
            {currentUser ? (
              <button
                onClick={() => setIsAccountDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2 p-1.5 pl-2.5 pr-2 rounded-2xl bg-white hover:bg-pink-50 border border-pink-200 shadow-2xs transition-all text-left"
              >
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center text-sm border ${currentUser.avatarBg || 'bg-pink-100 border-pink-300'}`}
                >
                  {currentUser.avatar}
                </div>
                <div className="hidden sm:block text-left pr-1">
                  <span className="block text-xs font-bold text-slate-800 leading-tight truncate max-w-[100px]">
                    {currentUser.firstName}
                  </span>
                  <span className="block text-[10px] text-pink-600 font-semibold leading-none">
                    Gourmand
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setIsLoginOpen(true)}
                  className="px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-pink-600 hover:bg-pink-50 transition-colors"
                >
                  Connexion
                </button>
                <button
                  onClick={() => setIsSignupOpen(true)}
                  className="hidden sm:inline-flex px-3.5 py-2 rounded-xl text-xs font-candy font-bold bg-pink-100 text-pink-700 hover:bg-pink-200 border border-pink-200 transition-all shadow-2xs"
                >
                  Créer un compte 🍭
                </button>
              </div>
            )}

            {/* Dropdown Menu */}
            {isAccountDropdownOpen && currentUser && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-pink-100 py-2 z-50 animate-fade-in">
                <div className="px-4 py-2 border-b border-pink-50">
                  <p className="text-xs text-slate-500 font-medium">Connecté en tant que</p>
                  <p className="text-sm font-bold text-slate-900 truncate">
                    {currentUser.firstName} ({currentUser.username})
                  </p>
                </div>

                <div className="p-1">
                  <button
                    onClick={() => {
                      setIsAccountDropdownOpen(false);
                      setIsProfileOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-pink-50 hover:text-pink-700 transition-colors text-left"
                  >
                    <User className="w-4 h-4 text-pink-500" />
                    <span>Modifier mon profil</span>
                  </button>

                  <Link
                    href="/"
                    onClick={() => setIsAccountDropdownOpen(false)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-pink-50 hover:text-pink-700 transition-colors text-left"
                  >
                    <Home className="w-4 h-4 text-pink-500" />
                    <span>Boutique</span>
                  </Link>

                  <Link
                    href="/orders"
                    onClick={() => setIsAccountDropdownOpen(false)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-pink-50 hover:text-pink-700 transition-colors text-left"
                  >
                    <ClipboardList className="w-4 h-4 text-amber-500" />
                    <span>Mes commandes</span>
                  </Link>

                  <div className="border-t border-pink-50 my-1" />

                  <button
                    onClick={() => {
                      setIsAccountDropdownOpen(false);
                      logoutUser();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4 text-rose-500" />
                    <span>Déconnexion</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
