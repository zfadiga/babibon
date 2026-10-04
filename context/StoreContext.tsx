'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { CandyProduct, CartItem, ChildUser, StoreSettings, OrderRecord } from '@/types/candy';
import { DEFAULT_CANDIES, DEFAULT_STORE_SETTINGS, INITIAL_MOCK_ORDERS } from '@/data/defaultCandies';
import { submitOrder, fetchCandies } from '@/lib/api';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';

interface StoreContextType {
  candies: CandyProduct[];
  setCandies: React.Dispatch<React.SetStateAction<CandyProduct[]>>;
  refreshCandies: () => Promise<void>;
  currentUser: ChildUser | null;
  setCurrentUser: React.Dispatch<React.SetStateAction<ChildUser | null>>;
  cart: CartItem[];
  addToCart: (candy: CandyProduct, quantity?: number) => void;
  updateQuantity: (candyId: string | number, delta: number) => void;
  removeFromCart: (candyId: string | number) => void;
  clearCart: () => void;
  settings: StoreSettings;
  setSettings: React.Dispatch<React.SetStateAction<StoreSettings>>;
  toggleCurrency: () => void;
  orders: OrderRecord[];
  placeOrder: (order: OrderRecord) => Promise<void>;
  // UI Modals State
  isCartDrawerOpen: boolean;
  setIsCartDrawerOpen: (open: boolean) => void;
  isLoginOpen: boolean;
  setIsLoginOpen: (open: boolean) => void;
  isSignupOpen: boolean;
  setIsSignupOpen: (open: boolean) => void;
  isProfileOpen: boolean;
  setIsProfileOpen: (open: boolean) => void;
  isWhatsAppModalOpen: boolean;
  setIsWhatsAppModalOpen: (open: boolean) => void;
  selectedCandyForDetails: CandyProduct | null;
  setSelectedCandyForDetails: (candy: CandyProduct | null) => void;
  // Auth helpers
  loginUser: (user: ChildUser) => void;
  logoutUser: () => void;
  updateUserProfile: (user: ChildUser) => void;
}

const StoreContext = createContext<StoreContextType | null>(null);

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Candies Catalog
  const [candies, setCandies] = useState<CandyProduct[]>(() => {
    if (typeof window === 'undefined') return DEFAULT_CANDIES;
    try {
      const saved = localStorage.getItem('bonbon_catalog');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_CANDIES;
  });

  // 2. Current Child User (Active Private Session)
  const [currentUser, setCurrentUser] = useState<ChildUser | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const saved = localStorage.getItem('bonbon_current_user');
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });

  // 3. Cart State (stored per child user session or guest)
  const [cart, setCart] = useState<CartItem[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const savedUser = localStorage.getItem('bonbon_current_user');
      const key = savedUser ? `bonbon_cart_${JSON.parse(savedUser).id}` : 'bonbon_cart_guest';
      const savedCart = localStorage.getItem(key);
      if (savedCart) return JSON.parse(savedCart);
    } catch {}
    return [];
  });

  // 4. Store Settings
  const [settings, setSettings] = useState<StoreSettings>(() => {
    if (typeof window === 'undefined') return DEFAULT_STORE_SETTINGS;
    try {
      const saved = localStorage.getItem('bonbon_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.whatsappNumber === '2250700112233' || !parsed.whatsappNumber) {
          parsed.whatsappNumber = '2250779323716';
        }
        return parsed;
      }
    } catch {}
    return DEFAULT_STORE_SETTINGS;
  });

  // 5. Orders History
  const [orders, setOrders] = useState<OrderRecord[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem('bonbon_orders');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter(
            (o: any) => !['CMD-9042', 'CMD-9043', 'CMD-9044'].includes(String(o?.id))
          );
          if (filtered.length !== parsed.length) {
            localStorage.setItem('bonbon_orders', JSON.stringify(filtered));
          }
          return filtered;
        }
      }
    } catch {}
    return [];
  });

  // Modals state
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSignupOpen, setIsSignupOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [selectedCandyForDetails, setSelectedCandyForDetails] = useState<CandyProduct | null>(null);

  // Sync state to localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('bonbon_catalog', JSON.stringify(candies));
    } catch {}
  }, [candies]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const key = currentUser ? `bonbon_cart_${currentUser.id}` : 'bonbon_cart_guest';
      localStorage.setItem(key, JSON.stringify(cart));
    } catch {}
  }, [cart, currentUser]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      if (currentUser) {
        localStorage.setItem('bonbon_current_user', JSON.stringify(currentUser));
      } else {
        localStorage.removeItem('bonbon_current_user');
      }
    } catch {}
  }, [currentUser]);

  // Synchronize active Supabase Auth session
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const meta = session.user.user_metadata || {};
        setCurrentUser((prev) => prev || {
          id: session.user.id,
          username: meta.username || session.user.email?.split('@')[0] || 'Client',
          firstName: meta.full_name || meta.firstName || 'Client',
          avatar: meta.avatar || '🐻',
          avatarBg: meta.avatarBg || 'bg-pink-100 text-pink-700 border-pink-300',
          favoriteFlavor: meta.favoriteFlavor || 'Fraise',
          phone: meta.phone,
          deliveryAddress: meta.deliveryAddress,
          joinedAt: session.user.created_at || new Date().toISOString(),
        });
      }
    }).catch(() => {});

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const meta = session.user.user_metadata || {};
        setCurrentUser({
          id: session.user.id,
          username: meta.username || session.user.email?.split('@')[0] || 'Client',
          firstName: meta.full_name || meta.firstName || 'Client',
          avatar: meta.avatar || '🐻',
          avatarBg: meta.avatarBg || 'bg-pink-100 text-pink-700 border-pink-300',
          favoriteFlavor: meta.favoriteFlavor || 'Fraise',
          phone: meta.phone,
          deliveryAddress: meta.deliveryAddress,
          joinedAt: session.user.created_at || new Date().toISOString(),
        });
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('bonbon_settings', JSON.stringify(settings));
    } catch {}
  }, [settings]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('bonbon_orders', JSON.stringify(orders));
    } catch {}
  }, [orders]);

  const refreshCandies = async () => {
    try {
      const remote = await fetchCandies();
      if (remote && remote.length > 0) {
        setCandies(remote as unknown as CandyProduct[]);
      }
    } catch (e) {
      console.warn('Candies refresh warning:', e);
    }
  };

  // Cart operations
  const addToCart = (candy: CandyProduct, quantityToAdd: number = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => String(item.candy.id) === String(candy.id));
      if (existing) {
        return prev.map((item) =>
          String(item.candy.id) === String(candy.id)
            ? { ...item, quantity: item.quantity + quantityToAdd }
            : item
        );
      }
      return [...prev, { candy, quantity: quantityToAdd }];
    });
  };

  const updateQuantity = (candyId: string | number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (String(item.candy.id) === String(candyId)) {
            const nextQty = item.quantity + delta;
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (candyId: string | number) => {
    setCart((prev) => prev.filter((item) => String(item.candy.id) !== String(candyId)));
  };

  const clearCart = () => {
    setCart([]);
  };

  const toggleCurrency = () => {
    setSettings((prev) => ({
      ...prev,
      currency: prev.currency === 'FCFA' ? 'EUR' : 'FCFA',
    }));
  };

  // Auth & Private Session Handlers
  const loginUser = (user: ChildUser) => {
    // Strip raw password from active runtime session object
    const safeUser: ChildUser = { ...user };
    delete safeUser.password;

    setCurrentUser(safeUser);
    try {
      localStorage.setItem('bonbon_session_user_id', safeUser.id);
      localStorage.setItem('bonbon_current_user', JSON.stringify(safeUser));
      // Load this user's private cart
      const userCart = localStorage.getItem(`bonbon_cart_${safeUser.id}`);
      if (userCart) {
        setCart(JSON.parse(userCart));
      } else {
        setCart([]);
      }
    } catch {}
  };

  const logoutUser = () => {
    if (isSupabaseConfigured) {
      supabase.auth.signOut().catch(() => {});
    }
    setCurrentUser(null);
    setCart([]);
    setIsProfileOpen(false);
    try {
      localStorage.removeItem('bonbon_current_user');
      localStorage.removeItem('bonbon_session_user_id');
      localStorage.removeItem('bonbon_cart_guest');
    } catch {}
  };

  const updateUserProfile = (updated: ChildUser) => {
    const safeUser: ChildUser = { ...updated };
    delete safeUser.password;
    setCurrentUser(safeUser);
    try {
      localStorage.setItem('bonbon_current_user', JSON.stringify(safeUser));
      const stored = localStorage.getItem('bonbon_registered_users');
      if (stored) {
        const users: ChildUser[] = JSON.parse(stored);
        const nextUsers = users.map((u) => {
          if (u.id === updated.id) {
            return {
              ...u,
              ...updated,
              password: updated.password || u.password,
            };
          }
          return u;
        });
        localStorage.setItem('bonbon_registered_users', JSON.stringify(nextUsers));
      }
    } catch {}
  };

  const placeOrder = async (order: OrderRecord) => {
    const enrichedOrder: OrderRecord = {
      ...order,
      childId: currentUser?.id || order.childId,
      childUsername: currentUser?.username || order.childUsername,
      childName: currentUser ? currentUser.firstName : (order.childName || order.customer_name),
    };
    const res = await submitOrder(enrichedOrder);
    if (res.success) {
      setOrders((prev) => [res.order, ...prev]);
      clearCart();
    }
  };

  return (
    <StoreContext.Provider
      value={{
        candies,
        setCandies,
        refreshCandies,
        currentUser,
        setCurrentUser,
        cart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        settings,
        setSettings,
        toggleCurrency,
        orders,
        placeOrder,
        isCartDrawerOpen,
        setIsCartDrawerOpen,
        isLoginOpen,
        setIsLoginOpen,
        isSignupOpen,
        setIsSignupOpen,
        isProfileOpen,
        setIsProfileOpen,
        isWhatsAppModalOpen,
        setIsWhatsAppModalOpen,
        selectedCandyForDetails,
        setSelectedCandyForDetails,
        loginUser,
        logoutUser,
        updateUserProfile,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};
