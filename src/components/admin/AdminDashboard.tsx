import React, { useState, useMemo } from 'react';
import {
  Package,
  ShoppingBag,
  TrendingUp,
  AlertTriangle,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  Truck,
  MessageCircle,
  Database,
  ArrowLeft,
  DollarSign,
  Save,
  Check,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  Server,
  X,
  PhoneCall,
} from 'lucide-react';
import {
  CandyProduct,
  CandyCategory,
  OrderRecord,
  StoreSettings,
  ManagerAccount,
} from '../../types/candy';
import { CATEGORY_INFO } from '../../data/defaultCandies';
import { formatPrice, formatPhoneNumber } from '../../utils/formatters';
import { SupabaseModal } from './SupabaseModal';
import {
  apiSaveCandy,
  apiDeleteCandy,
  apiUpdateOrderStatus,
  apiDeleteOrder,
  apiSaveSettings,
  BackendStatus,
} from '../../services/api';

interface AdminDashboardProps {
  currentManager: ManagerAccount;
  candies: CandyProduct[];
  orders: OrderRecord[];
  settings: StoreSettings;
  backendStatus: BackendStatus;
  onRefreshData: () => Promise<void>;
  onNavigateHome: () => void;
  onLogout: () => void;
  onUpdateCandiesState: (candies: CandyProduct[]) => void;
  onUpdateOrdersState: (orders: OrderRecord[]) => void;
  onUpdateSettingsState: (settings: StoreSettings) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentManager,
  candies,
  orders,
  settings,
  backendStatus,
  onRefreshData,
  onNavigateHome,
  onLogout,
  onUpdateCandiesState,
  onUpdateOrdersState,
  onUpdateSettingsState,
}) => {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'overview' | 'candies' | 'orders' | 'settings'>('overview');

  // Supabase connection guide modal
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);

  // Candy CRUD modal state
  const [isCandyModalOpen, setIsCandyModalOpen] = useState(false);
  const [editingCandy, setEditingCandy] = useState<CandyProduct | null>(null);

  // Filters for Candies
  const [candySearch, setCandySearch] = useState('');
  const [candyCategoryFilter, setCandyCategoryFilter] = useState<string>('all');

  // Filters for Orders
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');

  // Candy Form State
  const [candyForm, setCandyForm] = useState<Partial<CandyProduct>>({
    name: '',
    description: '',
    price: 500,
    category: 'gummy',
    stock: 50,
    weightGrams: 100,
    imageUrl: '',
    emojiIcon: '🍬',
    flavorBadge: 'Gourmandise 🍭',
    isPopular: false,
    isNew: true,
  });

  // Settings local edit state
  const [settingsForm, setSettingsForm] = useState<StoreSettings>({ ...settings });
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsSavedSuccess, setSettingsSavedSuccess] = useState(false);

  // Overview Stats
  const stats = useMemo(() => {
    const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const totalOrders = orders.length;
    const pendingOrders = orders.filter((o) => o.status === 'pending').length;
    const deliveringOrders = orders.filter((o) => o.status === 'delivering').length;
    const completedOrders = orders.filter((o) => o.status === 'completed').length;
    const lowStockCandies = candies.filter((c) => (c.stock || 0) < 15);

    return {
      totalRevenue,
      totalOrders,
      pendingOrders,
      deliveringOrders,
      completedOrders,
      lowStockCandies,
    };
  }, [orders, candies]);

  // Filtered Candies
  const filteredCandies = useMemo(() => {
    return candies.filter((candy) => {
      const matchSearch =
        candy.name.toLowerCase().includes(candySearch.toLowerCase()) ||
        candy.description.toLowerCase().includes(candySearch.toLowerCase());
      const matchCategory =
        candyCategoryFilter === 'all' || candy.category === candyCategoryFilter;
      return matchSearch && matchCategory;
    });
  }, [candies, candySearch, candyCategoryFilter]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (orderStatusFilter === 'all') return true;
      return order.status === orderStatusFilter;
    });
  }, [orders, orderStatusFilter]);

  // Handle Candy Edit Click
  const handleOpenAddCandy = () => {
    setEditingCandy(null);
    setCandyForm({
      name: '',
      description: '',
      price: 500,
      category: 'gummy',
      stock: 50,
      weightGrams: 100,
      imageUrl: 'https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?auto=format&fit=crop&w=600&q=80',
      emojiIcon: '🍬',
      flavorBadge: 'Gélatine 🐻',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
      gradientBg: 'from-amber-200 via-yellow-100 to-orange-100',
      isPopular: false,
      isNew: true,
    });
    setIsCandyModalOpen(true);
  };

  const handleOpenEditCandy = (candy: CandyProduct) => {
    setEditingCandy(candy);
    setCandyForm({ ...candy });
    setIsCandyModalOpen(true);
  };

  // Submit Candy Add/Edit
  const handleSaveCandySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candyForm.name || !candyForm.price) return;

    const candyToSave: CandyProduct = {
      id: editingCandy ? editingCandy.id : `candy-${Date.now()}`,
      name: candyForm.name.trim(),
      description: candyForm.description || '',
      price: Number(candyForm.price),
      category: candyForm.category as any,
      flavorBadge: candyForm.flavorBadge || 'Délicieux ✨',
      badgeColor: candyForm.badgeColor || 'bg-pink-100 text-pink-800 border-pink-200',
      imageUrl: candyForm.imageUrl || 'https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?auto=format&fit=crop&w=600&q=80',
      gradientBg: candyForm.gradientBg || 'from-pink-200 via-rose-100 to-amber-100',
      emojiIcon: candyForm.emojiIcon || '🍬',
      isPopular: Boolean(candyForm.isPopular),
      isNew: Boolean(candyForm.isNew),
      stock: Number(candyForm.stock || 0),
      weightGrams: Number(candyForm.weightGrams || 100),
    };

    let updatedCandies: CandyProduct[];
    if (editingCandy) {
      updatedCandies = candies.map((c) => (c.id === candyToSave.id ? candyToSave : c));
    } else {
      updatedCandies = [candyToSave, ...candies];
    }

    onUpdateCandiesState(updatedCandies);
    await apiSaveCandy(candyToSave, Boolean(editingCandy));
    setIsCandyModalOpen(false);
  };

  // Quick Stock Adjustment (+1 / -1)
  const handleAdjustStock = async (candyId: string, delta: number) => {
    const target = candies.find((c) => c.id === candyId);
    if (!target) return;

    const newStock = Math.max(0, (target.stock || 0) + delta);
    const updated = { ...target, stock: newStock };
    const newCandies = candies.map((c) => (c.id === candyId ? updated : c));

    onUpdateCandiesState(newCandies);
    await apiSaveCandy(updated, true);
  };

  // Delete Candy
  const handleDeleteCandy = async (candyId: string) => {
    if (!window.confirm('Es-tu sûr de vouloir supprimer ce bonbon du catalogue ?')) return;

    const newCandies = candies.filter((c) => c.id !== candyId);
    onUpdateCandiesState(newCandies);
    await apiDeleteCandy(candyId);
  };

  // Change Order Status
  const handleUpdateOrderStatus = async (orderId: string, newStatus: OrderRecord['status']) => {
    const updatedOrders = orders.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o));
    onUpdateOrdersState(updatedOrders);
    await apiUpdateOrderStatus(orderId, newStatus);
  };

  // Delete Order
  const handleDeleteOrder = async (orderId: string) => {
    if (!window.confirm('Supprimer définitivement cette commande ?')) return;
    const updatedOrders = orders.filter((o) => o.id !== orderId);
    onUpdateOrdersState(updatedOrders);
    await apiDeleteOrder(orderId);
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      await apiSaveSettings(settingsForm);
      onUpdateSettingsState(settingsForm);
      setSettingsSavedSuccess(true);
      setTimeout(() => setSettingsSavedSuccess(false), 3000);
    } catch {
      alert('Erreur lors de la sauvegarde des paramètres.');
    } finally {
      setIsSavingSettings(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDF8FA] text-slate-800 pb-20">
      {/* Admin Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-pink-100 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
          {/* Brand & Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={onNavigateHome}
              className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 to-amber-400 flex items-center justify-center text-xl shadow-md shadow-pink-200 cursor-pointer hover:scale-105 transition-transform"
              title="Retour à la boutique"
            >
              🍭
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-candy font-bold bg-gradient-to-r from-pink-600 via-rose-500 to-amber-500 bg-clip-text text-transparent">
                  Administration Confiserie
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-pink-100 text-pink-700 border border-pink-200">
                  {currentManager.role === 'primary' ? '👑 Gérant Principal' : '🛡️ Gérant de Secours'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Connecté en tant que <strong>{currentManager.name}</strong> ({currentManager.username})
              </p>
            </div>
          </div>

          {/* Status Pills & Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Supabase status badge */}
            <button
              onClick={() => setIsSupabaseModalOpen(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border text-xs font-bold transition-all cursor-pointer shadow-xs ${
                backendStatus.isSupabaseConnected
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
              }`}
              title="Gérer la connexion Supabase"
            >
              <Database className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Supabase :</span>
              <span>{backendStatus.isSupabaseConnected ? 'Connecté' : 'À configurer'}</span>
            </button>

            {/* Express Backend badge */}
            <div
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border text-xs font-bold ${
                backendStatus.isBackendReachable
                  ? 'bg-sky-50 text-sky-700 border-sky-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}
              title="Statut Express"
            >
              <Server className="w-3.5 h-3.5" />
              <span>{backendStatus.isBackendReachable ? 'Express : 3001' : 'Mode Local'}</span>
            </div>

            {/* Back to vitrine */}
            <button
              onClick={onNavigateHome}
              className="flex items-center gap-1 px-3 py-1.5 rounded-2xl bg-white hover:bg-pink-50 border border-pink-200 text-xs font-bold text-slate-700 hover:text-pink-600 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Boutique</span>
            </button>

            {/* Logout */}
            <button
              onClick={onLogout}
              className="px-3 py-1.5 rounded-2xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-xs font-bold text-rose-600 transition-colors cursor-pointer"
            >
              Quitter
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1 sm:gap-2 overflow-x-auto border-t border-pink-50">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-4 text-xs sm:text-sm font-candy font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'overview'
                ? 'border-pink-500 text-pink-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Tableau de Bord</span>
          </button>

          <button
            onClick={() => setActiveTab('candies')}
            className={`py-3 px-4 text-xs sm:text-sm font-candy font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'candies'
                ? 'border-pink-500 text-pink-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Gestion des Bonbons</span>
            <span className="px-1.5 py-0.2 rounded-full bg-pink-100 text-pink-700 text-[10px]">
              {candies.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`py-3 px-4 text-xs sm:text-sm font-candy font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'orders'
                ? 'border-pink-500 text-pink-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Commandes</span>
            {stats.pendingOrders > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-amber-950 text-[10px] font-black animate-pulse">
                {stats.pendingOrders}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`py-3 px-4 text-xs sm:text-sm font-candy font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'settings'
                ? 'border-pink-500 text-pink-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Paramètres & WhatsApp</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* ======================================================== */}
        {/* TAB 1: OVERVIEW (Tableau de Bord)                        */}
        {/* ======================================================== */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Low stock alert banner */}
            {stats.lowStockCandies.length > 0 && (
              <div className="p-4 rounded-3xl bg-amber-50 border border-amber-200 text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-200 text-amber-800 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-amber-950">
                      Attention aux stocks faibles ! ({stats.lowStockCandies.length} produit{stats.lowStockCandies.length > 1 ? 's' : ''})
                    </h4>
                    <p className="text-xs text-amber-800 mt-0.5">
                      Certains bonbons ont moins de 15 unités restantes :{' '}
                      {stats.lowStockCandies.map((c) => `${c.name} (${c.stock})`).join(', ')}.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('candies')}
                  className="px-4 py-2 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shrink-0 cursor-pointer shadow-xs transition-colors"
                >
                  Réapprovisionner
                </button>
              </div>
            )}

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Chiffre d'Affaires */}
              <div className="p-5 rounded-3xl bg-white border border-pink-100 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Chiffre d'Affaires
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center">
                    💰
                  </div>
                </div>
                <p className="text-2xl font-candy font-bold text-slate-900 mt-2">
                  {formatPrice(stats.totalRevenue, settings.currency, settings.eurToFcfaRate)}
                </p>
                <p className="text-[11px] text-pink-600 font-medium mt-1">
                  Sur {stats.totalOrders} commande{stats.totalOrders > 1 ? 's' : ''} enregistrée{stats.totalOrders > 1 ? 's' : ''}
                </p>
              </div>

              {/* Card 2: Commandes en attente */}
              <div className="p-5 rounded-3xl bg-white border border-pink-100 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    En attente WhatsApp
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                    ⏳
                  </div>
                </div>
                <p className="text-2xl font-candy font-bold text-amber-600 mt-2">
                  {stats.pendingOrders}
                </p>
                <p className="text-[11px] text-slate-500 font-medium mt-1">
                  {stats.deliveringOrders} en livraison · {stats.completedOrders} livrées
                </p>
              </div>

              {/* Card 3: Bonbons au Catalogue */}
              <div className="p-5 rounded-3xl bg-white border border-pink-100 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Bonbons Actifs
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                    🍬
                  </div>
                </div>
                <p className="text-2xl font-candy font-bold text-purple-700 mt-2">
                  {candies.length}
                </p>
                <p className="text-[11px] text-slate-500 font-medium mt-1">
                  {stats.lowStockCandies.length} en stock faible
                </p>
              </div>

              {/* Card 4: WhatsApp Gérant */}
              <div className="p-5 rounded-3xl bg-white border border-pink-100 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Réception WhatsApp
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-sm font-bold text-emerald-700 mt-3 truncate font-mono">
                  {formatPhoneNumber(settings.whatsappNumber)}
                </p>
                <a
                  href={`https://wa.me/${settings.whatsappNumber}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1 mt-1 cursor-pointer"
                >
                  <span>Tester le lien WhatsApp</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Quick Actions & Recent Orders */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Quick Actions Box */}
              <div className="p-6 rounded-3xl bg-gradient-to-br from-pink-500 via-rose-500 to-amber-500 text-white shadow-lg shadow-pink-200/50 flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl mb-3 shadow-inner">
                    ✨
                  </div>
                  <h3 className="text-lg font-candy font-bold">
                    Actions Rapides de Gérance
                  </h3>
                  <p className="text-xs text-pink-100 mt-1 leading-relaxed">
                    Ajoute un nouveau bonbon à la vitrine, gère les stocks ou connecte ta base de données Supabase.
                  </p>
                </div>

                <div className="space-y-2 mt-6">
                  <button
                    onClick={handleOpenAddCandy}
                    className="w-full py-2.5 px-4 rounded-2xl bg-white text-pink-600 hover:bg-pink-50 font-candy font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Ajouter un Bonbon au Catalogue</span>
                  </button>

                  <button
                    onClick={() => setIsSupabaseModalOpen(true)}
                    className="w-full py-2.5 px-4 rounded-2xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-2 backdrop-blur-xs"
                  >
                    <Database className="w-4 h-4" />
                    <span>Configurer Supabase Cloud</span>
                  </button>
                </div>
              </div>

              {/* Recent Orders List */}
              <div className="lg:col-span-2 p-6 rounded-3xl bg-white border border-pink-100 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-candy font-bold text-slate-900 flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4 text-pink-500" />
                      Dernières Commandes Clients
                    </h3>
                    <button
                      onClick={() => setActiveTab('orders')}
                      className="text-xs font-bold text-pink-600 hover:text-pink-700 cursor-pointer"
                    >
                      Voir toutes ({orders.length})
                    </button>
                  </div>

                  {orders.length === 0 ? (
                    <div className="text-center py-10 text-slate-400">
                      <p className="text-sm">Aucune commande enregistrée pour le moment.</p>
                      <p className="text-xs mt-1">Les commandes passées par WhatsApp apparaîtront ici.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {orders.slice(0, 4).map((order) => (
                        <div
                          key={order.id}
                          className="p-3.5 rounded-2xl bg-pink-50/50 hover:bg-pink-50 border border-pink-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs sm:text-sm text-slate-800">
                                {order.childName}
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                order.status === 'completed'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : order.status === 'delivering'
                                  ? 'bg-sky-100 text-sky-800'
                                  : order.status === 'preparing'
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}>
                                {order.status === 'completed' ? 'Livrée' : order.status === 'delivering' ? 'En livraison' : order.status === 'preparing' ? 'Préparation' : 'En attente'}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {order.items.map((it) => `${it.name} (x${it.quantity})`).join(', ')}
                            </p>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-xs sm:text-sm font-candy font-bold text-pink-600">
                              {formatPrice(order.totalAmount, settings.currency, settings.eurToFcfaRate)}
                            </span>
                            {order.customerPhone && (
                              <a
                                href={`https://wa.me/${order.customerPhone.replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="p-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white transition-colors"
                                title="Contacter le client sur WhatsApp"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <span>Actualisation en temps réel</span>
                  <button
                    onClick={onRefreshData}
                    className="hover:text-pink-600 flex items-center gap-1 font-bold cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Recharger</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: CANDIES (Gestion des Bonbons)                     */}
        {/* ======================================================== */}
        {activeTab === 'candies' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Header toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-white border border-pink-100 shadow-sm">
              <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={candySearch}
                    onChange={(e) => setCandySearch(e.target.value)}
                    placeholder="Rechercher un bonbon..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-500 text-xs font-medium text-slate-800"
                  />
                </div>

                {/* Category filter */}
                <select
                  value={candyCategoryFilter}
                  onChange={(e) => setCandyCategoryFilter(e.target.value)}
                  className="px-3.5 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-500 text-xs font-bold text-slate-700 bg-white cursor-pointer"
                >
                  <option value="all">Toutes les catégories</option>
                  {CATEGORY_INFO.slice(1).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.emoji} {c.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Add Candy Button */}
              <button
                onClick={handleOpenAddCandy}
                className="py-2.5 px-4 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-candy font-bold text-xs shadow-md shadow-pink-200 transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Nouveau Bonbon</span>
              </button>
            </div>

            {/* Candies Table / Grid */}
            <div className="bg-white rounded-3xl border border-pink-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-pink-50/60 border-b border-pink-100 text-[11px] font-bold text-pink-900 uppercase tracking-wider">
                      <th className="py-3.5 px-4">Bonbon</th>
                      <th className="py-3.5 px-4">Catégorie</th>
                      <th className="py-3.5 px-4">Prix</th>
                      <th className="py-3.5 px-4">Stock</th>
                      <th className="py-3.5 px-4">Badges</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-pink-50 text-xs text-slate-700">
                    {filteredCandies.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400">
                          Aucun bonbon ne correspond à ta recherche.
                        </td>
                      </tr>
                    ) : (
                      filteredCandies.map((candy) => (
                        <tr key={candy.id} className="hover:bg-pink-50/30 transition-colors">
                          {/* Image & Name */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={candy.imageUrl}
                                alt={candy.name}
                                className="w-11 h-11 rounded-2xl object-cover border border-pink-100 shadow-xs shrink-0"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                              <div>
                                <p className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                                  <span>{candy.emojiIcon}</span>
                                  <span>{candy.name}</span>
                                </p>
                                <p className="text-[11px] text-slate-400 line-clamp-1 max-w-xs mt-0.5">
                                  {candy.description}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Category */}
                          <td className="py-3 px-4">
                            <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 font-medium text-[11px]">
                              {candy.category}
                            </span>
                          </td>

                          {/* Price */}
                          <td className="py-3 px-4 font-candy font-bold text-pink-600 text-sm">
                            {formatPrice(candy.price, settings.currency, settings.eurToFcfaRate)}
                          </td>

                          {/* Stock (+ / - buttons) */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleAdjustStock(candy.id, -1)}
                                className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold flex items-center justify-center transition-colors cursor-pointer text-xs"
                                title="Retirer 1"
                              >
                                -
                              </button>
                              <span className={`font-bold px-2 py-0.5 rounded-lg text-xs ${
                                (candy.stock || 0) < 15
                                  ? 'bg-rose-100 text-rose-700 font-black'
                                  : 'text-slate-800'
                              }`}>
                                {candy.stock ?? 50}
                              </span>
                              <button
                                onClick={() => handleAdjustStock(candy.id, 1)}
                                className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold flex items-center justify-center transition-colors cursor-pointer text-xs"
                                title="Ajouter 1"
                              >
                                +
                              </button>
                              {(candy.stock || 0) < 15 && (
                                <span className="text-[10px] text-rose-500 font-bold ml-1">
                                  Bas !
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Badges */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {candy.isPopular && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                  ⭐ Populaire
                                </span>
                              )}
                              {candy.isNew && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  ✨ Nouveau
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenEditCandy(candy)}
                                className="p-2 rounded-xl text-slate-500 hover:text-pink-600 hover:bg-pink-50 transition-colors cursor-pointer"
                                title="Modifier ce bonbon"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteCandy(candy.id)}
                                className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Supprimer ce bonbon"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: ORDERS (Commandes WhatsApp & Clients)             */}
        {/* ======================================================== */}
        {activeTab === 'orders' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Filter toolbar */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {[
                { id: 'all', label: 'Toutes les commandes', icon: ShoppingBag },
                { id: 'pending', label: 'En attente', icon: Clock },
                { id: 'preparing', label: 'En préparation', icon: Package },
                { id: 'delivering', label: 'En livraison', icon: Truck },
                { id: 'completed', label: 'Livrées', icon: CheckCircle2 },
              ].map((tab) => {
                const Icon = tab.icon;
                const count =
                  tab.id === 'all'
                    ? orders.length
                    : orders.filter((o) => o.status === tab.id).length;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setOrderStatusFilter(tab.id)}
                    className={`py-2 px-3.5 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap shadow-xs ${
                      orderStatusFilter === tab.id
                        ? 'bg-pink-600 text-white shadow-pink-200'
                        : 'bg-white text-slate-600 hover:bg-pink-50 border border-pink-100'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                      orderStatusFilter === tab.id ? 'bg-white text-pink-700' : 'bg-pink-100 text-pink-700'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Orders Cards Grid */}
            {filteredOrders.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-white border border-pink-100 text-slate-400">
                <ShoppingBag className="w-10 h-10 mx-auto text-pink-300 mb-2" />
                <p className="font-bold text-slate-700">Aucune commande trouvée</p>
                <p className="text-xs mt-1">Il n'y a pas de commandes correspondant à ce statut.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredOrders.map((order) => {
                  const cleanPhone = order.customerPhone ? order.customerPhone.replace(/[^0-9]/g, '') : '';
                  const whatsappUrl = cleanPhone
                    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                        `Bonjour ${order.childName} ! C'est BonbonMagique 🍭 concernant ta commande #${order.id} :`
                      )}`
                    : null;

                  return (
                    <div
                      key={order.id}
                      className="p-5 rounded-3xl bg-white border border-pink-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"
                    >
                      <div>
                        {/* Header */}
                        <div className="flex items-center justify-between pb-3 border-b border-pink-50">
                          <div>
                            <span className="text-[11px] font-mono text-slate-400 block">
                              Commande #{order.id}
                            </span>
                            <h4 className="font-bold text-slate-900 text-sm mt-0.5">
                              Client : {order.childName}
                            </h4>
                          </div>

                          {/* Status dropdown */}
                          <select
                            value={order.status || 'pending'}
                            onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value as any)}
                            className={`px-3 py-1 rounded-xl text-xs font-bold border focus:outline-none cursor-pointer ${
                              order.status === 'completed'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : order.status === 'delivering'
                                ? 'bg-sky-50 text-sky-800 border-sky-200'
                                : order.status === 'preparing'
                                ? 'bg-purple-50 text-purple-800 border-purple-200'
                                : 'bg-amber-50 text-amber-800 border-amber-200'
                            }`}
                          >
                            <option value="pending">⏳ En attente</option>
                            <option value="preparing">🍭 En préparation</option>
                            <option value="delivering">🚚 En cours de livraison</option>
                            <option value="completed">✅ Livrée / Terminée</option>
                          </select>
                        </div>

                        {/* Customer details */}
                        <div className="py-3 text-xs space-y-1 text-slate-600">
                          {order.customerPhone && (
                            <p className="flex items-center gap-2">
                              <span className="text-slate-400">Téléphone :</span>
                              <span className="font-semibold">{order.customerPhone}</span>
                            </p>
                          )}
                          {order.deliveryAddress && (
                            <p className="flex items-start gap-2">
                              <span className="text-slate-400 shrink-0">Adresse :</span>
                              <span className="font-medium text-slate-700">{order.deliveryAddress}</span>
                            </p>
                          )}
                          <p className="flex items-center gap-2 text-[11px] text-slate-400">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{new Date(order.createdAt).toLocaleString('fr-FR')}</span>
                          </p>
                        </div>

                        {/* Items list */}
                        <div className="p-3 rounded-2xl bg-pink-50/50 border border-pink-100 mb-3 space-y-1 text-xs">
                          <p className="font-bold text-[11px] text-pink-900 uppercase tracking-wider mb-1">
                            Articles commandés :
                          </p>
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-slate-700">
                              <span>
                                {item.name} <strong>x{item.quantity}</strong>
                              </span>
                              <span className="font-semibold text-slate-900">
                                {formatPrice(item.price * item.quantity, settings.currency, settings.eurToFcfaRate)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Total & Action Footer */}
                      <div className="pt-3 border-t border-pink-50 flex items-center justify-between">
                        <div>
                          <span className="text-[11px] text-slate-400 block">Total à payer</span>
                          <span className="text-lg font-candy font-bold text-pink-600">
                            {formatPrice(order.totalAmount, settings.currency, settings.eurToFcfaRate)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {whatsappUrl && (
                            <a
                              href={whatsappUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span>WhatsApp</span>
                            </a>
                          )}
                          <button
                            onClick={() => handleDeleteOrder(order.id)}
                            className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Supprimer la commande"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 4: SETTINGS (Paramètres du Magasin & Supabase)       */}
        {/* ======================================================== */}
        {activeTab === 'settings' && (
          <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-200">
            <form onSubmit={handleSaveSettings} className="p-6 rounded-3xl bg-white border border-pink-100 shadow-sm space-y-6">
              <div>
                <h3 className="text-lg font-candy font-bold text-slate-900">
                  Paramètres de la Confiserie & Commandes
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure le numéro WhatsApp de réception des commandes, les frais de livraison et la devise.
                </p>
              </div>

              {settingsSavedSuccess && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Paramètres sauvegardés avec succès dans la base de données !</span>
                </div>
              )}

              {/* Store Name & WhatsApp */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                    Nom de la Boutique
                  </label>
                  <input
                    type="text"
                    value={settingsForm.storeName}
                    onChange={(e) => setSettingsForm({ ...settingsForm, storeName: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-500 text-xs font-medium text-slate-800"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                    Numéro WhatsApp de Réception
                  </label>
                  <div className="relative">
                    <PhoneCall className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={settingsForm.whatsappNumber}
                      onChange={(e) => setSettingsForm({ ...settingsForm, whatsappNumber: e.target.value })}
                      placeholder="2250779323716"
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-500 text-xs font-mono text-slate-800"
                      required
                    />
                  </div>
                  <span className="text-[11px] text-slate-400 block mt-1">
                    Format international sans '+' ni espaces (ex: 2250779323716).
                  </span>
                </div>
              </div>

              {/* Delivery Settings */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                    Frais de Livraison (FCFA)
                  </label>
                  <input
                    type="number"
                    value={settingsForm.deliveryFee}
                    onChange={(e) => setSettingsForm({ ...settingsForm, deliveryFee: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-500 text-xs font-medium text-slate-800"
                    min={0}
                    step={100}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                    Seuil Livraison Gratuite (FCFA)
                  </label>
                  <input
                    type="number"
                    value={settingsForm.freeDeliveryThreshold}
                    onChange={(e) => setSettingsForm({ ...settingsForm, freeDeliveryThreshold: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-500 text-xs font-medium text-slate-800"
                    min={0}
                    step={500}
                    required
                  />
                </div>
              </div>

              {/* Store notice message */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Bannière d'Annonce Magique (Haut du site)
                </label>
                <textarea
                  rows={2}
                  value={settingsForm.storeNotice || ''}
                  onChange={(e) => setSettingsForm({ ...settingsForm, storeNotice: e.target.value })}
                  placeholder="Livraison rapide chez toi ou à l'école !"
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-500 text-xs text-slate-800 resize-none"
                />
              </div>

              {/* Currency & Exchange Rate */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                    Devise Principale
                  </label>
                  <select
                    value={settingsForm.currency}
                    onChange={(e) => setSettingsForm({ ...settingsForm, currency: e.target.value as any })}
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-500 text-xs font-bold text-slate-700 bg-white"
                  >
                    <option value="FCFA">FCFA (Franc CFA)</option>
                    <option value="EUR">EUR (€ Euro)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                    Taux Euro vers FCFA
                  </label>
                  <input
                    type="number"
                    value={settingsForm.eurToFcfaRate}
                    onChange={(e) => setSettingsForm({ ...settingsForm, eurToFcfaRate: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-500 text-xs font-medium text-slate-800"
                    step={0.001}
                    required
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSavingSettings}
                  className="py-2.5 px-6 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-candy font-bold text-xs shadow-md shadow-pink-200 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSavingSettings ? 'Enregistrement...' : 'Sauvegarder les Paramètres'}</span>
                </button>
              </div>
            </form>

            {/* Supabase Integration Card */}
            <div className="p-6 rounded-3xl bg-white border border-emerald-100 shadow-sm flex items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-candy font-bold text-slate-900 flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-600" />
                  Intégration Supabase Cloud PostgreSQL
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Connecte ta base de données Supabase pour synchroniser en temps réel les bonbons, les stocks et les commandes WhatsApp.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsSupabaseModalOpen(true)}
                className="py-2.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shrink-0 cursor-pointer shadow-md shadow-emerald-200 transition-colors flex items-center gap-2"
              >
                <span>Configurer Supabase</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ======================================================== */}
      {/* MODAL: ADD / EDIT CANDY PRODUCT                         */}
      {/* ======================================================== */}
      {isCandyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-pink-100 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 p-6 text-white relative shrink-0">
              <button
                onClick={() => setIsCandyModalOpen(false)}
                className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-1.5 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-xl font-candy font-bold">
                {editingCandy ? 'Modifier le Bonbon' : 'Ajouter un Nouveau Bonbon'}
              </h3>
              <p className="text-xs text-pink-100 mt-0.5">
                Renseigne les informations de la friandise pour la vitrine.
              </p>
            </div>

            <form onSubmit={handleSaveCandySubmit} className="p-6 overflow-y-auto space-y-4">
              {/* Name & Emoji */}
              <div className="grid grid-cols-4 gap-3">
                <div className="col-span-3">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nom du Bonbon *
                  </label>
                  <input
                    type="text"
                    required
                    value={candyForm.name || ''}
                    onChange={(e) => setCandyForm({ ...candyForm, name: e.target.value })}
                    placeholder="Ex: Dragées Tutti Frutti"
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-500 text-xs font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Émoji
                  </label>
                  <input
                    type="text"
                    value={candyForm.emojiIcon || '🍬'}
                    onChange={(e) => setCandyForm({ ...candyForm, emojiIcon: e.target.value })}
                    className="w-full text-center px-2 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-500 text-base"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Description Gourmande
                </label>
                <textarea
                  rows={2}
                  value={candyForm.description || ''}
                  onChange={(e) => setCandyForm({ ...candyForm, description: e.target.value })}
                  placeholder="Décris le goût, les arômes ou le croustillant..."
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-500 text-xs text-slate-800 resize-none"
                />
              </div>

              {/* Price, Stock, Category */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Prix (FCFA) *
                  </label>
                  <input
                    type="number"
                    required
                    min={50}
                    step={50}
                    value={candyForm.price || 500}
                    onChange={(e) => setCandyForm({ ...candyForm, price: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-500 text-xs font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Stock
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={candyForm.stock ?? 50}
                    onChange={(e) => setCandyForm({ ...candyForm, stock: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-500 text-xs font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Catégorie
                  </label>
                  <select
                    value={candyForm.category || 'gummy'}
                    onChange={(e) => setCandyForm({ ...candyForm, category: e.target.value as any })}
                    className="w-full px-2.5 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-500 text-xs font-bold text-slate-700 bg-white"
                  >
                    {CATEGORY_INFO.slice(1).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.emoji} {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Image URL & Preview */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  URL de l'image
                </label>
                <input
                  type="url"
                  value={candyForm.imageUrl || ''}
                  onChange={(e) => setCandyForm({ ...candyForm, imageUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-500 text-xs font-mono text-slate-800"
                />
                {candyForm.imageUrl && (
                  <div className="mt-2 flex items-center gap-3">
                    <img
                      src={candyForm.imageUrl}
                      alt="Aperçu"
                      className="w-12 h-12 rounded-xl object-cover border border-pink-100"
                      onError={(e) => ((e.target as HTMLElement).style.display = 'none')}
                    />
                    <span className="text-[11px] text-slate-400">Aperçu de l'image</span>
                  </div>
                )}
              </div>

              {/* Badges Toggles */}
              <div className="pt-2 flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={Boolean(candyForm.isPopular)}
                    onChange={(e) => setCandyForm({ ...candyForm, isPopular: e.target.checked })}
                    className="w-4 h-4 rounded text-pink-600 focus:ring-pink-500 cursor-pointer"
                  />
                  <span>⭐ Coup de cœur (Populaire)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={Boolean(candyForm.isNew)}
                    onChange={(e) => setCandyForm({ ...candyForm, isNew: e.target.checked })}
                    className="w-4 h-4 rounded text-pink-600 focus:ring-pink-500 cursor-pointer"
                  />
                  <span>✨ Nouveauté</span>
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCandyModalOpen(false)}
                  className="px-4 py-2.5 rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-candy font-bold text-xs shadow-md shadow-pink-200 cursor-pointer"
                >
                  {editingCandy ? 'Mettre à jour' : 'Ajouter le Bonbon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Supabase Connection Modal */}
      <SupabaseModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        onConfigUpdated={onRefreshData}
        isBackendConnected={backendStatus.isBackendReachable}
      />
    </div>
  );
};
