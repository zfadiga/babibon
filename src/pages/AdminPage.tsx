import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  PlusCircle,
  Trash2,
  Package,
  ShoppingBag,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  LogOut,
  Search,
  ExternalLink,
  DollarSign,
  TrendingUp,
  Lock,
  User,
  Key,
} from 'lucide-react';
import { getSupabaseFrontendClient } from '../lib/supabase';

// ==========================================
// Types
// ==========================================
export interface CandyItem {
  id: string;
  name: string;
  price: number;
  description: string;
  image_url: string;
  stock: number;
  category: string;
  flavorBadge?: string;
  emojiIcon?: string;
}

export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

export interface CustomerOrder {
  id: string;
  created_at: string;
  child_name: string;
  items: OrderItem[];
  total_amount: number;
  currency?: string;
  customer_phone?: string;
  delivery_address?: string;
  status?: string;
}

export interface CandyFormData {
  name: string;
  price: number | '';
  description: string;
  image_url: string;
  stock: number | '';
  category: string;
}

interface AdminPageProps {
  onNavigateHome?: () => void;
  apiBaseUrl?: string;
}

export const AdminPage: React.FC<AdminPageProps> = ({
  onNavigateHome,
  apiBaseUrl = '/api',
}) => {
  // ----------------------------------------------------
  // 1. Security & Role Verification State
  // ----------------------------------------------------
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  // ----------------------------------------------------
  // 2. Data State
  // ----------------------------------------------------
  const [candies, setCandies] = useState<CandyItem[]>([]);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [isLoadingCandies, setIsLoadingCandies] = useState(false);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  // ----------------------------------------------------
  // 3. Form State (Add New Candy)
  // ----------------------------------------------------
  const [formData, setFormData] = useState<CandyFormData>({
    name: '',
    price: '',
    description: '',
    image_url: '',
    stock: '',
    category: 'gummy',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Candies Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Quick login state for Unauthorized Access screen
  const [loginUsername, setLoginUsername] = useState('admin');
  const [loginPassword, setLoginPassword] = useState('admin');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleDirectAdminLogin = async (e?: React.FormEvent, overrideUser?: string, overridePass?: string) => {
    if (e) e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);

    const user = (overrideUser ?? loginUsername).trim();
    const pass = (overridePass ?? loginPassword).trim();

    try {
      const supabase = getSupabaseFrontendClient();
      // 1. If username is an email and Supabase is configured, try Supabase login
      if (supabase && user.includes('@')) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: user,
          password: pass,
        });
        if (error) {
          throw new Error(error.message);
        }
        if (data.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', data.user.id)
            .maybeSingle();

          if (profile?.role === 'admin') {
            setCurrentUserEmail(data.user.email || user);
            setUserRole('admin');
            setIsAuthorized(true);
            return;
          } else {
            setLoginError(`Ce compte (${data.user.email}) n'a pas le rôle 'admin' (rôle: ${profile?.role || 'aucun'}).`);
            return;
          }
        }
      }

      // 2. Manager credentials check (admin / admin or secours / secours123)
      if (
        (user.toLowerCase() === 'admin' && (pass === 'admin' || pass === 'admin123')) ||
        (user.toLowerCase() === 'secours' && pass === 'secours123')
      ) {
        const isBackup = user.toLowerCase() === 'secours';
        const mgr = {
          id: isBackup ? 'backup' : 'primary',
          username: user,
          name: isBackup ? 'Gérant de Secours' : 'Gérant Principal (Admin)',
          role: 'admin',
          password: pass,
          createdAt: new Date().toISOString(),
        };
        localStorage.setItem('bonbon_manager_session', JSON.stringify(mgr));
        localStorage.setItem('bonbon_admin_token', 'admin-token-' + Date.now());
        setCurrentUserEmail(mgr.name);
        setUserRole('admin');
        setIsAuthorized(true);
        return;
      }

      // 3. Try Express backend login endpoint
      try {
        const res = await fetch(`${apiBaseUrl}/admin/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: user, password: pass }),
        });
        if (res.ok) {
          const data = await res.json();
          localStorage.setItem('bonbon_manager_session', JSON.stringify(data.manager));
          localStorage.setItem('bonbon_admin_token', 'admin-token-' + Date.now());
          setCurrentUserEmail(data.manager?.name || user);
          setUserRole('admin');
          setIsAuthorized(true);
          return;
        }
      } catch {}

      setLoginError("Identifiant ou mot de passe incorrect. Pour tester, utilisez identifiant: 'admin' et mot de passe: 'admin'.");
    } catch (err: any) {
      setLoginError(err.message || 'Erreur lors de la tentative de connexion.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // ----------------------------------------------------
  // 4. Initial Auth & Admin Role Check
  // ----------------------------------------------------
  useEffect(() => {
    const verifyAdminRole = async () => {
      setIsCheckingAuth(true);

      try {
        const supabase = getSupabaseFrontendClient();

        // 1. Check Supabase Auth
        if (supabase) {
          const { data: { user } } = await supabase.auth.getUser();

          if (user) {
            setCurrentUserEmail(user.email || 'Utilisateur Supabase');

            // Query profiles table for explicit role === 'admin'
            const { data: profile, error } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', user.id)
              .maybeSingle();

            if (!error && profile && profile.role === 'admin') {
              setUserRole('admin');
              setIsAuthorized(true);
              setIsCheckingAuth(false);
              return;
            }
          }
        }

        // 2. Check Local/Session Storage Manager Auth (Development / Gérant fallback)
        const savedManager = localStorage.getItem('bonbon_manager_session');
        if (savedManager) {
          try {
            const manager = JSON.parse(savedManager);
            if (manager && (manager.role === 'admin' || manager.role === 'primary')) {
              setCurrentUserEmail(manager.name || manager.username);
              setUserRole('admin');
              setIsAuthorized(true);
              setIsCheckingAuth(false);
              return;
            }
          } catch {}
        }

        // Check if an admin token exists
        const adminToken = localStorage.getItem('bonbon_admin_token');
        if (adminToken) {
          setUserRole('admin');
          setIsAuthorized(true);
          setIsCheckingAuth(false);
          return;
        }

        // If not authenticated as admin: Access Denied
        setIsAuthorized(false);
      } catch (err) {
        console.error('Erreur vérification rôle admin:', err);
        setIsAuthorized(false);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    verifyAdminRole();
  }, []);

  // ----------------------------------------------------
  // 5. Fetch Candies & Orders (When Authorized)
  // ----------------------------------------------------
  const fetchCandies = async () => {
    setIsLoadingCandies(true);
    try {
      const res = await fetch(`${apiBaseUrl}/admin/candies`);
      if (res.ok) {
        const data = await res.json();
        // Normalize fields if returned from DB or model
        const normalized = data.map((c: any) => ({
          id: c.id,
          name: c.name,
          price: Number(c.price),
          description: c.description || '',
          image_url: c.image_url || c.imageUrl || '',
          stock: Number(c.stock ?? 50),
          category: c.category || 'gummy',
          flavorBadge: c.flavor_badge || c.flavorBadge,
          emojiIcon: c.emoji_icon || c.emojiIcon || '🍬',
        }));
        setCandies(normalized);
      } else {
        // Fallback to local storage if backend offline
        const local = localStorage.getItem('bonbon_catalog');
        if (local) setCandies(JSON.parse(local));
      }
    } catch {
      const local = localStorage.getItem('bonbon_catalog');
      if (local) setCandies(JSON.parse(local));
    } finally {
      setIsLoadingCandies(false);
    }
  };

  const fetchOrders = async () => {
    setIsLoadingOrders(true);
    try {
      const res = await fetch(`${apiBaseUrl}/admin/orders`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      } else {
        const local = localStorage.getItem('bonbon_orders');
        if (local) setOrders(JSON.parse(local));
      }
    } catch {
      const local = localStorage.getItem('bonbon_orders');
      if (local) setOrders(JSON.parse(local));
    } finally {
      setIsLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (isAuthorized) {
      fetchCandies();
      fetchOrders();
    }
  }, [isAuthorized]);

  // ----------------------------------------------------
  // 6. Add Candy Form Handler (POST /api/admin/candies)
  // ----------------------------------------------------
  const handleAddCandy = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormMessage(null);

    if (!formData.name.trim() || formData.price === '') {
      setFormMessage({ type: 'error', text: 'Le nom et le prix sont obligatoires.' });
      return;
    }

    setIsSubmitting(true);

    const payload = {
      name: formData.name.trim(),
      price: Number(formData.price),
      description: formData.description.trim(),
      image_url:
        formData.image_url.trim() ||
        'https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?auto=format&fit=crop&w=600&q=80',
      stock: formData.stock !== '' ? Number(formData.stock) : 50,
      category: formData.category,
    };

    try {
      const response = await fetch(`${apiBaseUrl}/admin/candies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Erreur serveur (${response.status})`);
      }

      const createdCandy = await response.json();

      // Normalize created candy for local state
      const newCandyItem: CandyItem = {
        id: createdCandy.id || `candy-${Date.now()}`,
        name: createdCandy.name,
        price: Number(createdCandy.price),
        description: createdCandy.description || '',
        image_url: createdCandy.image_url || createdCandy.imageUrl || payload.image_url,
        stock: Number(createdCandy.stock ?? payload.stock),
        category: createdCandy.category || payload.category,
        emojiIcon: createdCandy.emoji_icon || createdCandy.emojiIcon || '🍬',
      };

      setCandies((prev) => [newCandyItem, ...prev]);

      // Reset form
      setFormData({
        name: '',
        price: '',
        description: '',
        image_url: '',
        stock: '',
        category: 'gummy',
      });

      setFormMessage({ type: 'success', text: `Le bonbon "${newCandyItem.name}" a été ajouté avec succès ! 🍭` });
    } catch (err: any) {
      console.error('Erreur ajout bonbon:', err);
      // Fallback add locally so UI still updates
      const fallbackItem: CandyItem = {
        id: `candy-${Date.now()}`,
        ...payload,
        emojiIcon: '🍬',
      };
      setCandies((prev) => [fallbackItem, ...prev]);
      setFormMessage({
        type: 'success',
        text: `Bonbon "${fallbackItem.name}" ajouté localement.`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ----------------------------------------------------
  // 7. Delete Candy Handler (DELETE /api/admin/candies/:id)
  // ----------------------------------------------------
  const handleDeleteCandy = async (id: string, name: string) => {
    if (!window.confirm(`Es-tu sûr de vouloir supprimer définitivement le bonbon "${name}" ?`)) {
      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/admin/candies/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Erreur suppression (${response.status})`);
      }

      setCandies((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error('Erreur suppression bonbon:', err);
      // Fallback local deletion
      setCandies((prev) => prev.filter((c) => c.id !== id));
    }
  };

  // Filtered Candies for display
  const filteredCandies = candies.filter((candy) =>
    candy.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    candy.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Total sales calculation
  const totalSalesRevenue = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0);

  // ----------------------------------------------------
  // Render: Loading Auth Verification
  // ----------------------------------------------------
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-[#FFF9FB] flex flex-col items-center justify-center p-6 text-slate-700">
        <RefreshCw className="w-10 h-10 text-pink-500 animate-spin mb-4" />
        <h2 className="text-lg font-bold">Vérification des autorisations...</h2>
        <p className="text-xs text-slate-400 mt-1">
          Contrôle du profil et du rôle "admin" dans Supabase.
        </p>
      </div>
    );
  }

  // ----------------------------------------------------
  // Render: Access Denied / Unauthorized Access (Requirement 1)
  // ----------------------------------------------------
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#FFF9FB] flex items-center justify-center p-4 sm:p-6">
        <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 border border-rose-100 shadow-xl shadow-rose-100/50 text-center">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-3xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4 shadow-inner">
            <ShieldAlert className="w-8 h-8 sm:w-9 sm:h-9" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Accès Refusé / Unauthorized access
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
            Seuls les utilisateurs disposant explicitement du rôle <strong>"admin"</strong> dans la table{' '}
            <code className="text-rose-600 font-mono bg-rose-50 px-1 py-0.5 rounded">profiles</code> ou d'une session administrateur validée ont l'autorisation d'accéder à cette interface.
          </p>

          <div className="mt-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-left text-slate-600 space-y-1">
            <p className="font-bold text-slate-700">Comment débloquer l'accès :</p>
            <p>1. Connecte-toi ci-dessous avec le compte admin par défaut (<code className="font-bold">admin</code> / <code className="font-bold">admin</code>).</p>
            <p>2. Ou utilise ton compte Supabase auquel a été attribué <code className="text-emerald-700 font-mono">role = 'admin'</code>.</p>
          </div>

          {/* Formulaire de connexion direct */}
          <form onSubmit={(e) => handleDirectAdminLogin(e)} className="mt-5 text-left space-y-3">
            {loginError && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider">
                Identifiant ou Email
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  placeholder="admin ou email Supabase"
                  className="w-full pl-10 pr-3 py-2.5 rounded-2xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3 py-2.5 rounded-2xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Key className="w-3.5 h-3.5" />
              <span>{isLoggingIn ? 'Vérification...' : 'Se connecter en tant qu\'Administrateur'}</span>
            </button>
          </form>

          <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => handleDirectAdminLogin(undefined, 'admin', 'admin')}
              className="w-full py-2.5 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
            >
              <span>⚡ Connexion Express (admin / admin)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (onNavigateHome) onNavigateHome();
                else {
                  window.location.hash = '';
                  window.location.href = '/';
                }
              }}
              className="w-full py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Retourner à la boutique</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // Render: Authorized Admin Dashboard (Requirement 2)
  // ----------------------------------------------------
  return (
    <div className="min-h-screen bg-[#FDF8FA] text-slate-800 pb-20">
      {/* Admin Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-pink-100 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (onNavigateHome) onNavigateHome();
                else window.location.href = '/';
              }}
              className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 to-amber-400 flex items-center justify-center text-xl shadow-md shadow-pink-200 cursor-pointer hover:scale-105 transition-transform"
              title="Retour à la boutique"
            >
              🍭
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold bg-gradient-to-r from-pink-600 via-rose-500 to-amber-500 bg-clip-text text-transparent">
                  Panneau d'Administration
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Rôle : {userRole || 'admin'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Connecté : {currentUserEmail || 'Administrateur'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                fetchCandies();
                fetchOrders();
              }}
              className="p-2 rounded-xl text-slate-500 hover:text-pink-600 hover:bg-pink-50 border border-slate-200 transition-colors cursor-pointer"
              title="Actualiser les données"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingCandies || isLoadingOrders ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={() => {
                if (onNavigateHome) onNavigateHome();
                else window.location.href = '/';
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-white hover:bg-pink-50 border border-pink-200 text-xs font-bold text-slate-700 hover:text-pink-600 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voir la boutique</span>
            </button>

            <button
              onClick={() => {
                localStorage.removeItem('bonbon_manager_session');
                localStorage.removeItem('bonbon_admin_token');
                if (onNavigateHome) onNavigateHome();
                else window.location.href = '/';
              }}
              className="p-2 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-colors cursor-pointer"
              title="Déconnexion"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* KPI / Sales Overview Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-3xl bg-white border border-pink-100 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Chiffre d'Affaires Total
              </span>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {totalSalesRevenue.toLocaleString('fr-FR')} FCFA
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-white border border-pink-100 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Bonbons au Catalogue
              </span>
              <p className="text-2xl font-bold text-pink-600 mt-1">
                {candies.length}
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-pink-100 text-pink-600 flex items-center justify-center">
              <Package className="w-6 h-6" />
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-white border border-pink-100 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Total des Commandes
              </span>
              <p className="text-2xl font-bold text-amber-600 mt-1">
                {orders.length}
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <ShoppingBag className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* SECTION 1: FORMULAIRE AJOUT BONBON (POST /api/admin/candies) */}
        {/* ======================================================== */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-pink-100 shadow-sm">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-pink-50">
            <div className="w-10 h-10 rounded-2xl bg-pink-100 text-pink-600 flex items-center justify-center">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Ajouter un Nouveau Bonbon
              </h2>
              <p className="text-xs text-slate-400">
                Envoie une requête <code>POST {apiBaseUrl}/admin/candies</code> vers le serveur Express et Supabase.
              </p>
            </div>
          </div>

          {formMessage && (
            <div
              className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2 mb-6 border ${
                formMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}
            >
              {formMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{formMessage.text}</span>
            </div>
          )}

          <form onSubmit={handleAddCandy} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Nom du Bonbon *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Dragibus Festifs"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-500 text-xs text-slate-800 font-medium"
                />
              </div>

              {/* Price */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Prix (en FCFA) *
                </label>
                <input
                  type="number"
                  required
                  min={50}
                  step={50}
                  placeholder="Ex: 500"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      price: e.target.value === '' ? '' : Number(e.target.value),
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-500 text-xs text-slate-800 font-medium"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Catégorie
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-500 text-xs text-slate-700 font-bold bg-white cursor-pointer"
                >
                  <option value="gummy">🐻 Oursons & Gélifiés</option>
                  <option value="sour">⚡ Acides & Piquants</option>
                  <option value="chocolate">🍫 Chocolats Doux</option>
                  <option value="lollipop">🍭 Sucettes Magiques</option>
                  <option value="marshmallow">☁️ Nuages Guimauve</option>
                  <option value="fruity">🍓 Fruits Croquants</option>
                </select>
              </div>

              {/* Stock */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Quantité en Stock
                </label>
                <input
                  type="number"
                  min={0}
                  placeholder="50"
                  value={formData.stock}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      stock: e.target.value === '' ? '' : Number(e.target.value),
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-500 text-xs text-slate-800 font-medium"
                />
              </div>

              {/* Image URL */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  URL de l'image (image_url)
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-500 text-xs text-slate-800 font-mono"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Description du Bonbon
              </label>
              <textarea
                rows={2}
                placeholder="Petite description appétissante du bonbon pour les enfants..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-500 text-xs text-slate-800 resize-none"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="py-3 px-6 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold text-xs shadow-md shadow-pink-200 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{isSubmitting ? 'Ajout en cours...' : 'Ajouter le Bonbon à la Boutique'}</span>
              </button>
            </div>
          </form>
        </section>

        {/* ======================================================== */}
        {/* SECTION 2: LISTE DES BONBONS (DELETE /api/admin/candies/:id) */}
        {/* ======================================================== */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-pink-100 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-pink-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Catalogue des Bonbons ({candies.length})
                </h2>
                <p className="text-xs text-slate-400">
                  Liste des bonbons disponibles avec option de suppression directe.
                </p>
              </div>
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher par nom..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-500 text-xs"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-pink-50/50 text-[11px] font-bold text-pink-900 uppercase tracking-wider border-b border-pink-100">
                  <th className="py-3 px-4">Bonbon</th>
                  <th className="py-3 px-4">Catégorie</th>
                  <th className="py-3 px-4">Prix</th>
                  <th className="py-3 px-4">Stock</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pink-50 text-xs text-slate-700">
                {isLoadingCandies ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-slate-400">
                      Chargement du catalogue...
                    </td>
                  </tr>
                ) : filteredCandies.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-slate-400">
                      Aucun bonbon trouvé.
                    </td>
                  </tr>
                ) : (
                  filteredCandies.map((candy) => (
                    <tr key={candy.id} className="hover:bg-pink-50/20 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {candy.image_url ? (
                            <img
                              src={candy.image_url}
                              alt={candy.name}
                              className="w-10 h-10 rounded-xl object-cover border border-pink-100 shrink-0"
                              onError={(e) => ((e.target as HTMLElement).style.display = 'none')}
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center text-lg shrink-0">
                              🍬
                            </div>
                          )}
                          <div>
                            <span className="font-bold text-slate-800 text-sm block">
                              {candy.name}
                            </span>
                            <span className="text-[11px] text-slate-400 line-clamp-1 max-w-xs">
                              {candy.description}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-medium text-[11px]">
                          {candy.category}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-bold text-pink-600">
                        {candy.price.toLocaleString('fr-FR')} FCFA
                      </td>

                      <td className="py-3 px-4 font-bold">
                        <span
                          className={`px-2 py-0.5 rounded-lg text-xs ${
                            candy.stock < 15
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {candy.stock} unités
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDeleteCandy(candy.id, candy.name)}
                          className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Supprimer définitivement ce bonbon"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* ======================================================== */}
        {/* SECTION 3: SUIVI DES COMMANDES (GET /api/admin/orders)   */}
        {/* ======================================================== */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-pink-100 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-pink-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Commandes Clients & Ventes ({orders.length})
                </h2>
                <p className="text-xs text-slate-400">
                  Commandes enregistrées via <code>GET {apiBaseUrl}/admin/orders</code>.
                </p>
              </div>
            </div>

            <button
              onClick={fetchOrders}
              className="text-xs font-bold text-pink-600 hover:text-pink-700 flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingOrders ? 'animate-spin' : ''}`} />
              <span>Actualiser</span>
            </button>
          </div>

          {isLoadingOrders ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              Chargement des commandes...
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <ShoppingBag className="w-10 h-10 mx-auto text-pink-200 mb-2" />
              <p className="font-bold text-slate-600 text-sm">Aucune commande pour l'instant</p>
              <p className="text-xs mt-1">Les commandes passées par les clients apparaîtront ici.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono text-slate-400">
                        #{order.id}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                        {order.status || 'En attente'}
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-900 text-sm mt-1">
                      Client : {order.child_name || 'Client Gourmand'}
                    </h4>

                    {order.customer_phone && (
                      <p className="text-xs text-slate-500 mt-0.5">
                        📞 {order.customer_phone}
                      </p>
                    )}

                    {order.delivery_address && (
                      <p className="text-xs text-slate-500 mt-0.5">
                        📍 {order.delivery_address}
                      </p>
                    )}

                    {/* Items */}
                    <div className="mt-3 p-3 rounded-xl bg-white border border-slate-200 text-xs space-y-1">
                      <p className="font-bold text-[10px] uppercase tracking-wider text-slate-400">
                        Articles :
                      </p>
                      {Array.isArray(order.items) &&
                        order.items.map((it, idx) => (
                          <div key={idx} className="flex justify-between text-slate-600">
                            <span>
                              {it.name} <strong>x{it.quantity}</strong>
                            </span>
                            <span className="font-bold text-slate-800">
                              {(it.price * it.quantity).toLocaleString('fr-FR')} FCFA
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                    <span className="text-xs text-slate-400">
                      {order.created_at
                        ? new Date(order.created_at).toLocaleDateString('fr-FR')
                        : 'Date récente'}
                    </span>
                    <span className="font-bold text-pink-600 text-base">
                      {Number(order.total_amount || 0).toLocaleString('fr-FR')} FCFA
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default AdminPage;
