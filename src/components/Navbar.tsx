import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  User,
  LogOut,
  ShoppingBag,
  Home,
  ChevronDown,
  ClipboardList,
  ShieldCheck,
} from 'lucide-react';
import { ChildUser, StoreSettings } from '../types/candy';

interface NavbarProps {
  user: ChildUser | null;
  currentView: 'landing' | 'orders' | 'cart' | 'admin';
  onNavigateCart: () => void;
  onNavigateOrders: () => void;
  onNavigateHome: () => void;
  onOpenSignup: () => void;
  onOpenLogin: () => void;
  onOpenProfile: () => void;
  onLogout: () => void;
  onOpenAdmin: () => void;
  isManagerLoggedIn?: boolean;
  ordersCount: number;
  cartTypesCount: number;
  settings: StoreSettings;
  onToggleCurrency?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  currentView,
  onNavigateCart,
  onNavigateOrders,
  onNavigateHome,
  onOpenSignup,
  onOpenLogin,
  onOpenProfile,
  onLogout,
  onOpenAdmin,
  isManagerLoggedIn = false,
  ordersCount = 0,
  cartTypesCount = 0,
  settings,
}) => {
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click or escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsAccountDropdownOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsAccountDropdownOpen(false);
      }
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
        {/* Brand Wordmark (Always clickable to return home) */}
        <button
          onClick={onNavigateHome}
          className="flex items-center gap-2.5 text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-400 rounded-xl p-1 cursor-pointer shrink-0"
          title="Retour à la page d'accueil"
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
        </button>

        {/* Middle Navigation Links (Desktop) */}
        <nav className="hidden lg:flex items-center gap-5 text-sm font-semibold text-slate-600">
          {currentView !== 'landing' ? (
            <button
              onClick={onNavigateHome}
              className="hover:text-pink-600 transition-colors cursor-pointer flex items-center gap-1.5 text-slate-700"
            >
              <Home className="w-4 h-4 text-pink-500" />
              <span>Accueil</span>
            </button>
          ) : (
            <a
              href="#catalogue"
              className="hover:text-pink-600 transition-colors cursor-pointer"
            >
              Nos Saveurs
            </a>
          )}
          {currentView !== 'admin' && (
            <button
              onClick={onOpenAdmin}
              className="hover:text-amber-800 text-slate-600 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200"
              title="Accéder à l'interface d'administration"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
              <span>{isManagerLoggedIn ? 'Admin 👑' : 'Espace Gérant'}</span>
            </button>
          )}
        </nav>

        {/* Right Actions: [Compte] [Commande] [Panier] */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* 1. Bouton "Compte" (à gauche de "commande") */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsAccountDropdownOpen((prev) => !prev)}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-2 rounded-2xl border text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-xs active:scale-95 ${
                user
                  ? 'bg-pink-50 hover:bg-pink-100 border-pink-200 text-pink-700'
                  : 'bg-white hover:bg-pink-50/80 border-pink-200 text-slate-700 hover:text-pink-600'
              }`}
              aria-expanded={isAccountDropdownOpen}
              aria-label="Menu Compte"
              title={user ? `Compte de ${user.firstName}` : 'Compte'}
            >
              {user ? (
                <>
                  <span className="text-base sm:text-lg leading-none">{user.avatar || '🐻'}</span>
                  <span className="max-w-[75px] sm:max-w-[110px] truncate">{user.firstName}</span>
                </>
              ) : (
                <>
                  <User className="w-4 h-4 text-pink-500" />
                  <span>Compte</span>
                </>
              )}
              <ChevronDown
                className={`w-3.5 h-3.5 text-pink-500 transition-transform duration-200 ${
                  isAccountDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Liste déroulante */}
            {isAccountDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl shadow-pink-200/50 border border-pink-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                {user ? (
                  <>
                    {/* User Info Header */}
                    <div className="px-4 py-2.5 bg-gradient-to-r from-pink-50 to-rose-50 border-b border-pink-100 flex items-center gap-2.5 mb-1">
                      <span className="text-2xl">{user.avatar}</span>
                      <div className="overflow-hidden">
                        <p className="text-xs sm:text-sm font-bold text-pink-900 truncate">
                          {user.firstName}
                        </p>
                        <p className="text-[10px] font-medium text-pink-600">Compte Enfant Connecté ✨</p>
                      </div>
                    </div>

                    {/* Option renommée : "gérer mon profil enfant" */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsAccountDropdownOpen(false);
                        onOpenProfile();
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-pink-50 flex items-center gap-2.5 transition-colors cursor-pointer text-xs sm:text-sm font-semibold text-slate-700 hover:text-pink-600"
                    >
                      <User className="w-4 h-4 text-pink-500" />
                      <span>gérer mon profil enfant</span>
                    </button>

                    <div className="border-t border-pink-100/80 my-1" />

                    {/* Déconnexion */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsAccountDropdownOpen(false);
                        onLogout();
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-rose-50 flex items-center gap-2.5 transition-colors cursor-pointer text-xs font-bold text-rose-600 hover:text-rose-700"
                    >
                      <LogOut className="w-4 h-4 text-rose-500" />
                      <span>Déconnexion</span>
                    </button>
                  </>
                ) : (
                  <>
                    <div className="px-4 py-2 border-b border-pink-50 mb-1">
                      <p className="text-[11px] font-bold text-pink-500 uppercase tracking-wider">
                        Espace Confiserie
                      </p>
                    </div>

                    {/* Choix 1: créer mon profil enfant */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsAccountDropdownOpen(false);
                        onOpenSignup();
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-pink-50/80 flex items-center gap-3 transition-colors cursor-pointer group"
                    >
                      <div className="w-9 h-9 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center text-lg group-hover:scale-110 transition-transform shrink-0">
                        🐻
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-pink-600">
                          créer mon profil enfant
                        </p>
                        <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                          Rejoins le club des gourmands
                        </p>
                      </div>
                    </button>

                    {/* Choix 2: j'ai déjà un compte */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsAccountDropdownOpen(false);
                        onOpenLogin();
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-amber-50/80 flex items-center gap-3 transition-colors cursor-pointer group border-t border-pink-50"
                    >
                      <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center text-lg group-hover:scale-110 transition-transform shrink-0">
                        🔑
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-amber-600">
                          j'ai déjà un compte
                        </p>
                        <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                          Retrouve tes bonbons favoris
                        </p>
                      </div>
                    </button>
                  </>
                )}

                {/* Option Espace Gérant / Admin */}
                <div className="border-t border-pink-100 my-1" />
                <button
                  type="button"
                  onClick={() => {
                    setIsAccountDropdownOpen(false);
                    onOpenAdmin();
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-amber-50/90 flex items-center gap-2.5 transition-colors cursor-pointer text-xs font-bold text-amber-900 group"
                >
                  <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block leading-tight">
                      {isManagerLoggedIn ? 'Tableau de Bord Admin' : 'Accès Gérant Confiserie'}
                    </span>
                    <span className="text-[10px] text-amber-600 font-medium">Stocks, prix & WhatsApp</span>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* 2. Bouton "commande" avec badge de nombre (0 si pas de commande, n si n commandes) */}
          <button
            type="button"
            onClick={onNavigateOrders}
            className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-2xl border text-xs sm:text-sm font-candy font-bold transition-all cursor-pointer shadow-xs active:scale-95 ${
              currentView === 'orders'
                ? 'bg-amber-500 text-white border-amber-600 shadow-md shadow-amber-200'
                : 'bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-900'
            }`}
            title="Voir mes commandes"
          >
            <ClipboardList
              className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
                currentView === 'orders' ? 'text-white' : 'text-amber-600'
              }`}
            />
            <span>commande</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[11px] font-black leading-none ml-0.5 shadow-xs ${
                currentView === 'orders'
                  ? 'bg-white text-amber-900'
                  : 'bg-amber-200 text-amber-950'
              }`}
            >
              {ordersCount}
            </span>
          </button>

          {/* 3. Bouton "panier" avec badge de nombre de types de bonbons (0 si vide, n si n types) */}
          <button
            type="button"
            onClick={onNavigateCart}
            className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-2xl border text-xs sm:text-sm font-candy font-bold transition-all cursor-pointer shadow-xs active:scale-95 ${
              currentView === 'cart'
                ? 'bg-pink-600 text-white border-pink-700 shadow-md shadow-pink-300'
                : 'bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white border-transparent shadow-md shadow-pink-200'
            }`}
            title="Accéder à mon panier"
          >
            <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>panier</span>
            <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-amber-950 text-[11px] font-black leading-none ml-0.5 shadow-xs">
              {cartTypesCount}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
