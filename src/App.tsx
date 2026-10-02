import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Sparkles,
  ShoppingBag,
  PackageOpen,
  MessageCircle,
} from 'lucide-react';

import { CandyProduct, CartItem, ChildUser, StoreSettings, OrderRecord, CandyCategory } from './types/candy';
import { DEFAULT_CANDIES, DEFAULT_STORE_SETTINGS, CATEGORY_INFO } from './data/defaultCandies';
import { formatPrice, fireCandyConfetti, formatPhoneNumber } from './utils/formatters';

import { Navbar } from './components/Navbar';
import { CandyCard } from './components/CandyCard';
import { CartPage } from './components/CartPage';
import { OrdersPage } from './components/OrdersPage';
import { WhatsAppOrderModal } from './components/WhatsAppOrderModal';
import { SignupModal } from './components/SignupModal';
import { LoginModal } from './components/LoginModal';
import { ProfileModal } from './components/ProfileModal';
import { CandyDetailsModal } from './components/CandyDetailsModal';

export default function App() {
  // 1. Candies Catalog State (with localStorage persistence)
  const [candies, setCandies] = useState<CandyProduct[]>(() => {
    try {
      const saved = localStorage.getItem('bonbon_catalog');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Fallback
    }
    return DEFAULT_CANDIES;
  });

  // 2. Child User Session (with localStorage persistence)
  const [currentUser, setCurrentUser] = useState<ChildUser | null>(() => {
    try {
      const saved = localStorage.getItem('bonbon_current_user');
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return null;
  });

  // 3. Cart State (stored per child user - strictly private session)
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const savedUser = localStorage.getItem('bonbon_current_user');
      if (savedUser) {
        const u = JSON.parse(savedUser);
        if (u && u.id) {
          const userCart = localStorage.getItem(`bonbon_cart_${u.id}`);
          if (userCart) return JSON.parse(userCart);
        }
      }
    } catch {
      // Fallback
    }
    return [];
  });

  // 4. Store Settings (with localStorage persistence & manager migration)
  const [settings, setSettings] = useState<StoreSettings>(() => {
    try {
      const saved = localStorage.getItem('bonbon_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Automatically migrate previous default or empty number to the requested +225 07 79 32 37 16
        if (parsed.whatsappNumber === '2250700112233' || !parsed.whatsappNumber) {
          parsed.whatsappNumber = '2250779323716';
        }
        if (!parsed.managers || !Array.isArray(parsed.managers) || parsed.managers.length === 0) {
          parsed.managers = [
            {
              id: 'primary',
              username: 'admin',
              name: 'Gérant Principal',
              role: 'primary',
              password: parsed.adminPassword || 'admin',
              createdAt: new Date().toISOString(),
            },
            {
              id: 'backup',
              username: 'secours',
              name: 'Gérant de Secours',
              role: 'backup',
              password: 'secours123',
              createdAt: new Date().toISOString(),
            },
          ];
        }
        return parsed;
      }
    } catch {
      // Fallback
    }
    return DEFAULT_STORE_SETTINGS;
  });

  // 5. Order Records History
  const [orders, setOrders] = useState<OrderRecord[]>(() => {
    try {
      const saved = localStorage.getItem('bonbon_orders');
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return [];
  });

  // UI Views & Modals States
  const [currentView, setCurrentView] = useState<'landing' | 'orders' | 'cart'>('landing');
  const [isSignupOpen, setIsSignupOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [selectedCandyForDetails, setSelectedCandyForDetails] = useState<CandyProduct | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CandyCategory>('all');
  const [sortBy, setSortBy] = useState<'popular' | 'price-asc' | 'price-desc' | 'name'>('popular');

  // Synchronize to localStorage
  useEffect(() => {
    localStorage.setItem('bonbon_catalog', JSON.stringify(candies));
  }, [candies]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('bonbon_current_user', JSON.stringify(currentUser));
      localStorage.setItem(`bonbon_cart_${currentUser.id}`, JSON.stringify(cart));
    } else {
      localStorage.removeItem('bonbon_current_user');
      localStorage.removeItem('bonbon_cart');
    }
  }, [currentUser, cart]);

  useEffect(() => {
    localStorage.setItem('bonbon_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('bonbon_orders', JSON.stringify(orders));
  }, [orders]);

  // Cart operations (strictly for authenticated child user session)
  const handleAddToCart = (candy: CandyProduct, quantityToAdd: number = 1) => {
    if (!currentUser) {
      setIsSignupOpen(true);
      return;
    }
    setCart((prev) => {
      const existing = prev.find((item) => item.candy.id === candy.id);
      if (existing) {
        return prev.map((item) =>
          item.candy.id === candy.id
            ? { ...item, quantity: item.quantity + quantityToAdd }
            : item
        );
      }
      return [...prev, { candy, quantity: quantityToAdd }];
    });
    fireCandyConfetti();
  };

  // Handler when ordering a candy directly from the vitrine (landing showcase) -> opens special Cart page
  const handleOrderCandyFromVitrine = (candy: CandyProduct) => {
    if (!currentUser) {
      setIsSignupOpen(true);
      return;
    }
    handleAddToCart(candy, 1);
    setCurrentView('cart');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdateQuantity = (candyId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.candy.id === candyId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null)
    );
  };

  const handleRemoveItem = (candyId: string) => {
    setCart((prev) => prev.filter((item) => item.candy.id !== candyId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  const totalCartItems = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  // Distinct types of candies for the Panier badge ("n" types or "0")
  // Strictly "0" when disconnected, private to session
  const cartTypesCount = currentUser ? cart.length : 0;

  // Number of orders for the Commande badge ("n" or "0")
  // Strictly "0" when disconnected, private to session
  const userOrdersCount = useMemo(() => {
    if (!currentUser) {
      return 0;
    }
    return orders.filter(
      (o) =>
        o.childId === currentUser.id ||
        (o.childName && o.childName.toLowerCase() === currentUser.firstName.toLowerCase())
    ).length;
  }, [orders, currentUser]);

  // Session Handlers (Login / Logout)
  const handleUserLogin = (user: ChildUser) => {
    setCurrentUser(user);
    try {
      const userCart = localStorage.getItem(`bonbon_cart_${user.id}`);
      if (userCart) {
        setCart(JSON.parse(userCart));
      } else {
        setCart([]);
      }
    } catch {
      setCart([]);
    }
    setCurrentView('landing');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = () => {
    if (currentUser) {
      try {
        localStorage.setItem(`bonbon_cart_${currentUser.id}`, JSON.stringify(cart));
      } catch {
        // Fallback
      }
    }
    setCurrentUser(null);
    setCart([]);
    localStorage.removeItem('bonbon_current_user');
    localStorage.removeItem('bonbon_cart');
    setCurrentView('landing');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Currency Toggle
  const handleToggleCurrency = () => {
    setSettings((prev) => ({
      ...prev,
      currency: prev.currency === 'FCFA' ? 'EUR' : 'FCFA',
    }));
  };

  // WhatsApp Order Completion
  const handleOrderSuccess = (order: OrderRecord) => {
    setOrders((prev) => [order, ...prev]);
    setIsWhatsAppModalOpen(false);
    handleClearCart();
    setCurrentView('orders');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Filtered and Sorted Candies
  const filteredCandies = useMemo(() => {
    return candies
      .filter((candy) => {
        const matchesCategory =
          selectedCategory === 'all' || candy.category === selectedCategory;
        const matchesSearch =
          candy.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          candy.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          candy.flavorBadge.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return a.price - b.price;
        if (sortBy === 'price-desc') return b.price - a.price;
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        // default: popular or new first
        if (a.isPopular && !b.isPopular) return -1;
        if (!a.isPopular && b.isPopular) return 1;
        return 0;
      });
  }, [candies, selectedCategory, searchQuery, sortBy]);

  return (
    <div className="min-h-screen bg-[#FFF9FB] flex flex-col selection:bg-pink-300 selection:text-pink-900">
      {/* 1. Global Navigation Bar */}
      <Navbar
        user={currentUser}
        currentView={currentView}
        onNavigateCart={() => {
          setCurrentView('cart');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onNavigateOrders={() => {
          setCurrentView('orders');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onNavigateHome={() => {
          setCurrentView('landing');
          setSelectedCategory('all');
          setSearchQuery('');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenSignup={() => setIsSignupOpen(true)}
        onOpenLogin={() => setIsLoginOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onLogout={handleLogout}
        ordersCount={userOrdersCount}
        cartTypesCount={cartTypesCount}
        settings={settings}
      />

      {currentView === 'cart' ? (
        <CartPage
          cart={cart}
          user={currentUser}
          settings={settings}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          onClearCart={handleClearCart}
          onNavigateHome={() => {
            setCurrentView('landing');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onProceedWhatsApp={() => setIsWhatsAppModalOpen(true)}
          onOpenSignup={() => setIsSignupOpen(true)}
          onOpenLogin={() => setIsLoginOpen(true)}
          onOpenDetails={(c) => setSelectedCandyForDetails(c)}
        />
      ) : currentView === 'orders' ? (
        <OrdersPage
          orders={orders}
          user={currentUser}
          settings={settings}
          onNavigateHome={() => {
            setCurrentView('landing');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onNavigateCart={() => {
            setCurrentView('cart');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onOpenLogin={() => setIsLoginOpen(true)}
          onOpenSignup={() => setIsSignupOpen(true)}
        />
      ) : (
        <main className="flex-1">
          {/* 2. Hero Section */}
          <section className="relative overflow-hidden pt-8 pb-12 sm:pt-14 sm:pb-16 bg-gradient-to-b from-white via-pink-50/50 to-[#FFF9FB]">
            {/* Subtle playful background circles */}
            <div className="absolute top-10 left-10 w-72 h-72 bg-pink-200/30 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute top-20 right-10 w-80 h-80 bg-amber-200/25 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-5 left-1/3 w-60 h-60 bg-sky-200/25 rounded-full blur-2xl pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              {/* Full Width Hero Card: Sélection de la semaine */}
              <div className="relative w-full bg-white rounded-3xl p-4 sm:p-6 lg:p-7 shadow-xl shadow-pink-100/70 border border-pink-100">
                <div className="relative h-64 sm:h-80 md:h-96 lg:h-[420px] w-full rounded-2xl overflow-hidden bg-gradient-to-tr from-pink-400 via-rose-300 to-amber-200 flex items-center justify-center">
                  <img
                    src="https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?auto=format&fit=crop&w=1600&q=80"
                    alt="Bonbons multicolores"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover rounded-2xl shadow-inner"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  {/* Floating mascot bubble */}
                  <div className="absolute top-4 right-4 sm:top-6 sm:right-6 w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white shadow-xl flex items-center justify-center text-3xl sm:text-4xl border-2 border-pink-300 animate-float">
                    🍭
                  </div>
                  <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-amber-100 shadow-lg flex items-center justify-center text-2xl sm:text-3xl border-2 border-amber-300 animate-pulse-subtle">
                    🐻
                  </div>
                  <div className="absolute top-4 left-4 sm:top-6 sm:left-6 hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 backdrop-blur-md shadow-md border border-pink-200 text-pink-700 font-bold text-xs">
                    <Sparkles className="w-3.5 h-3.5 text-pink-500" />
                    <span>Sélection Spéciale Gourmande</span>
                  </div>
                </div>

                {/* Card Banner */}
                <div className="mt-4 sm:mt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-pink-600 block mb-1">
                      ⭐ Sélection de la semaine
                    </span>
                    <h3 className="font-candy font-bold text-xl sm:text-2xl lg:text-3xl text-slate-900">
                      Oursons Câlins & Ceintures Fizz
                    </h3>
                  </div>
                  <button
                    onClick={() => {
                      const target = candies[0];
                      if (target) handleOrderCandyFromVitrine(target);
                    }}
                    className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 hover:from-pink-600 hover:to-rose-600 text-white font-candy font-bold text-sm sm:text-base shadow-md shadow-pink-200 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
                    title="Commander"
                  >
                    <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>Commander</span>
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* 3. Catalogue & Filter Section */}
        <section id="catalogue" className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
            <div>
              <span className="text-xs font-extrabold text-pink-600 uppercase tracking-widest block mb-1">
                Notre Vitrine Enchantée
              </span>
              <h2 className="text-3xl sm:text-4xl font-candy font-bold text-slate-900">
                Choisis tes douceurs préférées
              </h2>
            </div>

            {/* Live Search Input & Sort Dropdown */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <div className="relative min-w-[220px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Chercher un bonbon..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-white border border-pink-100 text-xs text-slate-800 placeholder-slate-400 shadow-2xs focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400 transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Sort Selector */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="px-3.5 py-2.5 rounded-2xl bg-white border border-pink-100 text-xs font-medium text-slate-700 shadow-2xs focus:outline-none focus:ring-2 focus:ring-pink-400 cursor-pointer"
              >
                <option value="popular">⭐ Les plus populaires</option>
                <option value="price-asc">🪙 Prix : Moins cher</option>
                <option value="price-desc">💎 Prix : Plus cher</option>
                <option value="name">🔤 Nom : De A à Z</option>
              </select>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-none">
            {CATEGORY_INFO.map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id as CandyCategory)}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all duration-200 flex items-center gap-1.5 cursor-pointer shrink-0 ${
                    isActive
                      ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md shadow-pink-200 scale-102'
                      : 'bg-white hover:bg-pink-50 text-slate-600 border border-pink-100 shadow-2xs'
                  }`}
                >
                  <span className="text-base">{cat.emoji}</span>
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Grid of Candies */}
          {filteredCandies.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-pink-100 max-w-md mx-auto my-8 shadow-xs">
              <div className="w-20 h-20 rounded-full bg-pink-50 flex items-center justify-center text-4xl mx-auto mb-3">
                🔍
              </div>
              <h3 className="font-candy font-bold text-lg text-slate-900 mb-1">
                Aucun bonbon trouvé
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Essaie de chercher avec un autre mot-clé ou sélectionne "Tous les bonbons".
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="px-4 py-2 rounded-xl bg-pink-500 text-white font-bold text-xs hover:bg-pink-600 transition-colors cursor-pointer"
              >
                Réinitialiser la recherche
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6">
              {filteredCandies.map((candy) => {
                const cartItem = cart.find((item) => item.candy.id === candy.id);
                const cartQuantity = cartItem ? cartItem.quantity : 0;
                return (
                  <CandyCard
                    key={candy.id}
                    candy={candy}
                    cartQuantity={cartQuantity}
                    onAddToCart={handleAddToCart}
                    onUpdateQuantity={handleUpdateQuantity}
                    onOpenDetails={(c) => setSelectedCandyForDetails(c)}
                    settings={settings}
                    actionType="order"
                    onOrderClick={(c) => handleOrderCandyFromVitrine(c)}
                  />
                );
              })}
            </div>
          )}
        </section>
      </main>
      )}

      {/* 4. Footer */}
      <footer className="bg-slate-900 text-white pt-12 pb-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-slate-800">
            {/* Brand column */}
            <div className="space-y-3 md:col-span-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🍭</span>
                <span className="font-candy font-bold text-xl text-white">
                  BonbonMagique
                </span>
              </div>
              <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                La confiserie en ligne colorée et féerique qui donne le sourire aux enfants et simplifie la commande pour les familles.
              </p>
              <div className="flex items-center gap-2 text-xs text-emerald-400">
                <MessageCircle className="w-4 h-4" />
                <span>Commandes actives via WhatsApp : {formatPhoneNumber(settings.whatsappNumber)}</span>
              </div>
            </div>

            {/* Quick links */}
            <div>
              <h4 className="font-candy font-bold text-sm text-pink-400 mb-3 uppercase tracking-wider">
                Catégories
              </h4>
              <ul className="space-y-2 text-xs text-slate-400">
                {CATEGORY_INFO.slice(1, 6).map((c) => (
                  <li key={c.id}>
                    <button
                      onClick={() => {
                        setSelectedCategory(c.id as CandyCategory);
                        const el = document.getElementById('catalogue');
                        el?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="hover:text-pink-300 transition-colors cursor-pointer"
                    >
                      {c.emoji} {c.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Mon Espace */}
            <div>
              <h4 className="font-candy font-bold text-sm text-pink-400 mb-3 uppercase tracking-wider">
                Mon Espace
              </h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li>
                  <button
                    onClick={() => {
                      if (currentUser) {
                        setIsProfileOpen(true);
                      } else {
                        setIsLoginOpen(true);
                      }
                    }}
                    className="hover:text-pink-300 transition-colors cursor-pointer"
                  >
                    Mon Compte Enfant
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      if (currentUser) {
                        setCurrentView('orders');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      } else {
                        setIsLoginOpen(true);
                      }
                    }}
                    className="hover:text-pink-300 transition-colors cursor-pointer"
                  >
                    Suivi de mes commandes
                  </button>
                </li>
                <li>
                  <span className="text-[11px] text-slate-500">
                    Devise active : {settings.currency} (1 € = {settings.eurToFcfaRate} FCFA)
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
            <span>© {new Date().getFullYear()} BonbonMagique. Fait avec amour pour les petits gourmands.</span>
            <div className="flex items-center gap-4">
              <span>Livraison Fraîcheur</span>
              <span>·</span>
              <span>Paiement à la livraison / WhatsApp</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Modals & Dialogs */}
      <WhatsAppOrderModal
        isOpen={isWhatsAppModalOpen}
        onClose={() => setIsWhatsAppModalOpen(false)}
        cart={cart}
        user={currentUser}
        settings={settings}
        onOrderSuccess={handleOrderSuccess}
        onOpenAuth={() => {
          setIsWhatsAppModalOpen(false);
          setIsSignupOpen(true);
        }}
      />

      {/* 1. Modal: Je m'inscris / Créer mon profil enfant */}
      <SignupModal
        isOpen={isSignupOpen}
        onClose={() => setIsSignupOpen(false)}
        onSuccess={(u) => {
          handleUserLogin(u);
        }}
        onSwitchToLogin={() => {
          setIsSignupOpen(false);
          setIsLoginOpen(true);
        }}
      />

      {/* 2. Modal: J'ai déjà un compte / Se connecter */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onSuccess={(u) => {
          handleUserLogin(u);
        }}
        onSwitchToSignup={() => {
          setIsLoginOpen(false);
          setIsSignupOpen(true);
        }}
      />

      {/* 3. Modal: Modifier mon profil enfant */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        currentUser={currentUser}
        onSaveUser={(u) => {
          setCurrentUser(u);
        }}
        onLogout={handleLogout}
      />

      <CandyDetailsModal
        candy={selectedCandyForDetails}
        onClose={() => setSelectedCandyForDetails(null)}
        onAddToCart={(c, q) => handleAddToCart(c, q)}
        settings={settings}
        actionType={currentView === 'landing' ? 'order' : 'add'}
        onOrder={(c) => handleOrderCandyFromVitrine(c)}
      />
    </div>
  );
}
