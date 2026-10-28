'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { CandyProduct, CartItem, ChildUser, StoreSettings, OrderRecord } from '@/types/candy';
import { DEFAULT_CANDIES, DEFAULT_STORE_SETTINGS, INITIAL_MOCK_ORDERS } from '@/data/defaultCandies';
import { submitOrder, fetchCandies, updateOrderStatus, updateOrderDetails, fetchStoreSettings } from '@/lib/api';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { registerActiveSession, verifyCurrentSession } from '@/lib/authSecurity';
import { fireCandyConfetti } from '@/utils/formatters';

interface StoreContextType {
  candies: CandyProduct[];
  setCandies: React.Dispatch<React.SetStateAction<CandyProduct[]>>;
  refreshCandies: () => Promise<void>;
  currentUser: ChildUser | null;
  setCurrentUser: React.Dispatch<React.SetStateAction<ChildUser | null>>;
  cart: CartItem[];
  addToCart: (candy: CandyProduct, quantity?: number) => boolean;
  updateQuantity: (candyId: string | number, delta: number) => void;
  removeFromCart: (candyId: string | number) => void;
  clearCart: () => void;
  settings: StoreSettings;
  setSettings: React.Dispatch<React.SetStateAction<StoreSettings>>;
  refreshSettings: () => Promise<void>;
  toggleCurrency: () => void;
  orders: OrderRecord[];
  placeOrder: (order: OrderRecord) => Promise<void>;
  cancelOrder: (orderId: string | number) => Promise<boolean>;
  modifyOrder: (
    orderId: string | number,
    updates: { deliveryAddress?: string; customerPhone?: string; notes?: string }
  ) => Promise<boolean>;
  concurrentSessionAlert: string | null;
  setConcurrentSessionAlert: (alert: string | null) => void;
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
  // Protection Guard for adding candy
  isAuthRequiredModalOpen: boolean;
  setIsAuthRequiredModalOpen: (open: boolean) => void;
  pendingCandyToAdd: { candy: CandyProduct; quantity: number } | null;
  setPendingCandyToAdd: React.Dispatch<React.SetStateAction<{ candy: CandyProduct; quantity: number } | null>>;
  authPromptMessage: string | null;
  setAuthPromptMessage: (msg: string | null) => void;
  successToast: string | null;
  setSuccessToast: (msg: string | null) => void;
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

  // 2. Current Child User (Strictly in sessionStorage - isolated to client active session)
  const [currentUser, setCurrentUser] = useState<ChildUser | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const saved = sessionStorage.getItem('bonbon_current_user');
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });

  // 3. Cart State (stored in sessionStorage for current user's session)
  const [cart, setCart] = useState<CartItem[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const savedCart = sessionStorage.getItem('bonbon_cart');
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

  // Protection Guard states for adding candy
  const [isAuthRequiredModalOpen, setIsAuthRequiredModalOpen] = useState(false);
  const [pendingCandyToAdd, setPendingCandyToAdd] = useState<{ candy: CandyProduct; quantity: number } | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const saved = sessionStorage.getItem('bonbon_pending_candy');
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });
  const [authPromptMessage, setAuthPromptMessage] = useState<string | null>(
    'Veuillez vous connecter ou créer un compte pour ajouter un bonbon'
  );
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [concurrentSessionAlert, setConcurrentSessionAlert] = useState<string | null>(null);

  // Security: Clean any lingering user session keys from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem('bonbon_current_user');
      localStorage.removeItem('bonbon_session_user_id');
      localStorage.removeItem('bonbon_pending_candy');
    } catch {}
  }, []);

  // Sync state
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('bonbon_catalog', JSON.stringify(candies));
    } catch {}
  }, [candies]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.setItem('bonbon_cart', JSON.stringify(cart));
    } catch {}
  }, [cart]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      if (currentUser) {
        sessionStorage.setItem('bonbon_current_user', JSON.stringify(currentUser));
      } else {
        sessionStorage.removeItem('bonbon_current_user');
      }
    } catch {}
  }, [currentUser]);

  // Synchronize active Supabase Auth session, ensuring client space is only for clients
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const verifyAndSetUser = async (user: any) => {
      if (!user) return;
      const meta = user.user_metadata || {};
      const { data: prof } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      const role = prof?.role || meta.role;
      if (role === 'admin' || role === 'manager') {
        // Disallow admin account in client storefront
        return;
      }

      setCurrentUser((prev) => prev || {
        id: user.id,
        username: meta.username || user.email?.split('@')[0] || 'Client',
        firstName: meta.full_name || meta.firstName || 'Client',
        avatar: meta.avatar || '🐻',
        avatarBg: meta.avatarBg || 'bg-pink-100 text-pink-700 border-pink-300',
        favoriteFlavor: meta.favoriteFlavor || 'Fraise',
        phone: meta.phone,
        deliveryAddress: meta.deliveryAddress,
        joinedAt: user.created_at || new Date().toISOString(),
      });
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        verifyAndSetUser(session.user);
      }
    }).catch(() => {});

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        verifyAndSetUser(session.user);
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // Single-device concurrent session monitor
  useEffect(() => {
    if (!currentUser || !isSupabaseConfigured) return;

    // 1. Realtime listener on user profile
    const profileChannel = supabase
      .channel(`profile_session_${currentUser.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${currentUser.id}`,
        },
        (payload: any) => {
          const currentToken = typeof window !== 'undefined' ? sessionStorage.getItem('bonbon_session_token') : null;
          if (payload.new?.active_session_id && currentToken && payload.new.active_session_id !== currentToken) {
            setConcurrentSessionAlert(
              'Votre compte a été connecté sur un autre appareil. Votre session sur cet appareil a été fermée.'
            );
            logoutUser();
          }
        }
      )
      .subscribe();

    // 2. Periodic and focus heartbeat check
    const checkSession = async () => {
      const isValid = await verifyCurrentSession(currentUser.id);
      if (!isValid) {
        setConcurrentSessionAlert(
          'Votre compte a été connecté sur un autre appareil. Votre session sur cet appareil a été fermée.'
        );
        logoutUser();
      }
    };

    const intervalId = setInterval(checkSession, 10000);
    window.addEventListener('focus', checkSession);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', checkSession);
      supabase.removeChannel(profileChannel);
    };
  }, [currentUser]);

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
      if (Array.isArray(remote)) {
        setCandies(remote as unknown as CandyProduct[]);
      }
    } catch (e) {
      console.warn('Candies refresh warning:', e);
    }
  };

  const refreshSettings = async () => {
    try {
      const remote = await fetchStoreSettings();
      if (remote) {
        setSettings(remote);
      }
    } catch (e) {
      console.warn('Store settings refresh warning:', e);
    }
  };

  // Fetch initial catalog and settings from Supabase on mount
  useEffect(() => {
    refreshCandies();
    refreshSettings();

    if (!isSupabaseConfigured) return;

    // Realtime listener for store_settings updates (e.g. hero carousel changes)
    const settingsChannel = supabase
      .channel('public_store_settings')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'store_settings',
        },
        () => {
          refreshSettings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(settingsChannel);
    };
  }, []);

  // Cart operations
  const addToCart = (candy: CandyProduct, quantityToAdd: number = 1): boolean => {
    // 1. Authentication Guard: Check if a user is currently logged in before allowing them to add a candy
    if (!currentUser) {
      const pending = { candy, quantity: quantityToAdd };
      setPendingCandyToAdd(pending);
      try {
        sessionStorage.setItem('bonbon_pending_candy', JSON.stringify(pending));
      } catch {}

      setAuthPromptMessage('Veuillez vous connecter ou créer un compte pour ajouter un bonbon');
      setIsAuthRequiredModalOpen(true);
      return false;
    }

    // 2. Normal add to cart for authenticated users
    fireCandyConfetti();
    setCart((prev) => {
      const existing = prev.find((item) => String(item.candy.id) === String(candy.id));
      let nextCart: CartItem[];
      if (existing) {
        nextCart = prev.map((item) =>
          String(item.candy.id) === String(candy.id)
            ? { ...item, quantity: item.quantity + quantityToAdd }
            : item
        );
      } else {
        nextCart = [...prev, { candy, quantity: quantityToAdd }];
      }

      if (typeof window !== 'undefined') {
        try {
          sessionStorage.setItem('bonbon_cart', JSON.stringify(nextCart));
        } catch {}
      }
      return nextCart;
    });

    setSuccessToast(`🍬 "${candy.name}" a été ajouté à votre panier !`);
    setTimeout(() => {
      setSuccessToast((curr) => (curr?.includes(candy.name) ? null : curr));
    }, 3500);

    return true;
  };

  const updateQuantity = (candyId: string | number, delta: number) => {
    if (!currentUser) {
      const candy = candies.find((c) => String(c.id) === String(candyId));
      if (candy && delta > 0) {
        addToCart(candy, delta);
      }
      return;
    }

    setCart((prev) => {
      const nextCart = prev
        .map((item) => {
          if (String(item.candy.id) === String(candyId)) {
            const nextQty = item.quantity + delta;
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];

      if (typeof window !== 'undefined') {
        try {
          sessionStorage.setItem('bonbon_cart', JSON.stringify(nextCart));
        } catch {}
      }
      return nextCart;
    });
  };

  const removeFromCart = (candyId: string | number) => {
    setCart((prev) => {
      const nextCart = prev.filter((item) => String(item.candy.id) !== String(candyId));
      if (typeof window !== 'undefined') {
        try {
          sessionStorage.setItem('bonbon_cart', JSON.stringify(nextCart));
        } catch {}
      }
      return nextCart;
    });
  };

  const clearCart = () => {
    setCart([]);
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('bonbon_cart', JSON.stringify([]));
      } catch {}
    }
  };

  const toggleCurrency = () => {
    setSettings((prev) => ({
      ...prev,
      currency: prev.currency === 'FCFA' ? 'EUR' : 'FCFA',
    }));
  };

  // Auth & Private Session Handlers
  const loginUser = async (user: ChildUser) => {
    // Strip raw password from active runtime session object
    const safeUser: ChildUser = { ...user };
    delete safeUser.password;

    setCurrentUser(safeUser);
    try {
      sessionStorage.setItem('bonbon_current_user', JSON.stringify(safeUser));

      // Register active session in DB and sessionStorage for single-device enforcement
      await registerActiveSession(safeUser.id);

      // Load this user's private cart
      const userCart = sessionStorage.getItem('bonbon_cart');
      let parsedCart: CartItem[] = [];
      if (userCart) {
        try {
          parsedCart = JSON.parse(userCart);
        } catch {}
      }

      // Check if there was a pending candy action intercepted by the auth guard
      let pending = pendingCandyToAdd;
      if (!pending) {
        const storedPending = sessionStorage.getItem('bonbon_pending_candy');
        if (storedPending) {
          try {
            pending = JSON.parse(storedPending);
          } catch {}
        }
      }

      if (pending) {
        const pendingItem = pending;
        const existing = parsedCart.find(
          (item) => String(item.candy.id) === String(pendingItem.candy.id)
        );
        if (existing) {
          parsedCart = parsedCart.map((item) =>
            String(item.candy.id) === String(pendingItem.candy.id)
              ? { ...item, quantity: item.quantity + pendingItem.quantity }
              : item
          );
        } else {
          parsedCart = [...parsedCart, { candy: pendingItem.candy, quantity: pendingItem.quantity }];
        }

        // Save updated cart in sessionStorage
        sessionStorage.setItem('bonbon_cart', JSON.stringify(parsedCart));
        sessionStorage.removeItem('bonbon_pending_candy');
        setPendingCandyToAdd(null);
        fireCandyConfetti();
        setSuccessToast(`🎉 Connexion réussie ! "${pendingItem.candy.name}" a été ajouté à votre panier !`);
        setTimeout(() => setSuccessToast(null), 4500);
      }

      setCart(parsedCart);
      setIsAuthRequiredModalOpen(false);
      setIsLoginOpen(false);
      setIsSignupOpen(false);
    } catch {}
  };

  const logoutUser = () => {
    if (isSupabaseConfigured) {
      supabase.auth.signOut().catch(() => {});
    }
    setCurrentUser(null);
    setCart([]);
    setIsProfileOpen(false);
    setIsAuthRequiredModalOpen(false);
    setPendingCandyToAdd(null);
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem('bonbon_current_user');
        sessionStorage.removeItem('bonbon_session_token');
        sessionStorage.removeItem('bonbon_cart');
        sessionStorage.removeItem('bonbon_pending_candy');
        localStorage.removeItem('bonbon_current_user');
        localStorage.removeItem('bonbon_session_user_id');
        localStorage.removeItem('bonbon_cart_guest');
        localStorage.removeItem('bonbon_pending_candy');
      } catch {}
    }
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

  // Realtime synchronization on candies table
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const channel = supabase
      .channel('store_realtime_candies')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'candies' },
        (payload) => {
          if (payload.eventType === 'INSERT' && payload.new) {
            setCandies((prev) => {
              if (prev.some((c) => String(c.id) === String(payload.new.id))) return prev;
              const newCandy: CandyProduct = {
                ...(payload.new as any),
                imageUrl: payload.new.image_url || payload.new.imageUrl,
              };
              return [newCandy, ...prev];
            });
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            setCandies((prev) =>
              prev.map((c) =>
                String(c.id) === String(payload.new.id)
                  ? { ...(payload.new as any), imageUrl: payload.new.image_url || payload.new.imageUrl }
                  : c
              )
            );
          } else if (payload.eventType === 'DELETE' && payload.old) {
            setCandies((prev) =>
              prev.filter((c) => String(c.id) !== String(payload.old.id))
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Realtime synchronization on orders table
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const channel = supabase
      .channel('store_realtime_orders')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          if (payload.eventType === 'UPDATE' && payload.new) {
            setOrders((prev) =>
              prev.map((o) =>
                String(o.id) === String(payload.new.id)
                  ? { ...o, status: payload.new.status }
                  : o
              )
            );
          } else if (payload.eventType === 'DELETE' && payload.old) {
            setOrders((prev) =>
              prev.filter((o) => String(o.id) !== String(payload.old.id))
            );
          } else if (payload.eventType === 'INSERT' && payload.new) {
            setOrders((prev) => {
              if (prev.some((o) => String(o.id) === String(payload.new.id))) return prev;
              return [payload.new as OrderRecord, ...prev];
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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

  const cancelOrder = async (orderId: string | number): Promise<boolean> => {
    // Optimistic local update
    setOrders((prev) =>
      prev.map((o) =>
        String(o.id) === String(orderId) ? { ...o, status: 'cancelled' } : o
      )
    );

    try {
      const res = await updateOrderStatus(orderId, 'cancelled');
      if (res && res.success === false) {
        return false;
      }
      return true;
    } catch (e) {
      console.warn('cancelOrder error:', e);
      return false;
    }
  };

  const modifyOrder = async (
    orderId: string | number,
    updates: { deliveryAddress?: string; customerPhone?: string; notes?: string }
  ): Promise<boolean> => {
    // Optimistic local update
    setOrders((prev) =>
      prev.map((o) =>
        String(o.id) === String(orderId)
          ? {
              ...o,
              deliveryAddress: updates.deliveryAddress ?? o.deliveryAddress,
              customerPhone: updates.customerPhone ?? o.customerPhone,
              notes: updates.notes ?? o.notes,
            }
          : o
      )
    );

    try {
      const res = await updateOrderDetails(orderId, updates);
      if (res && res.success) {
        setSuccessToast('Votre commande a été modifiée avec succès !');
        setTimeout(() => setSuccessToast(null), 4000);
        return true;
      }
      return false;
    } catch (e) {
      console.warn('modifyOrder error:', e);
      return false;
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
        refreshSettings,
        toggleCurrency,
        orders,
        placeOrder,
        cancelOrder,
        modifyOrder,
        concurrentSessionAlert,
        setConcurrentSessionAlert,
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
        isAuthRequiredModalOpen,
        setIsAuthRequiredModalOpen,
        pendingCandyToAdd,
        setPendingCandyToAdd,
        authPromptMessage,
        setAuthPromptMessage,
        successToast,
        setSuccessToast,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};
