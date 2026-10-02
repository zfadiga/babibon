import React, { useState } from 'react';
import {
  Package,
  Clock,
  CheckCircle2,
  Truck,
  MessageCircle,
  Sparkles,
  ExternalLink,
  MapPin,
  Phone,
  User,
} from 'lucide-react';
import { OrderRecord, ChildUser, StoreSettings } from '../types/candy';
import { formatPrice } from '../utils/formatters';

interface OrdersPageProps {
  orders: OrderRecord[];
  user: ChildUser | null;
  settings: StoreSettings;
  onNavigateHome: () => void;
  onNavigateCart?: () => void;
  onOpenLogin: () => void;
  onOpenSignup: () => void;
}

export const OrdersPage: React.FC<OrdersPageProps> = ({
  orders,
  user,
  settings,
  onNavigateHome,
  onOpenLogin,
  onOpenSignup,
}) => {
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  // Filter orders strictly according to user (private session only)
  const userOrders = user
    ? orders.filter((o) => {
        if (o.childId) return o.childId === user.id;
        return o.childName.toLowerCase().includes(user.firstName.toLowerCase());
      })
    : [];

  const activeOrders = userOrders.filter((o) => (o.status || 'preparing') !== 'completed');
  const completedOrders = userOrders.filter((o) => (o.status || 'preparing') === 'completed');

  const displayedOrders = filter === 'active'
    ? activeOrders
    : filter === 'completed'
    ? completedOrders
    : userOrders;

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'completed':
        return {
          label: 'Livrée avec succès 🎉',
          bg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
        };
      case 'delivering':
        return {
          label: 'En cours de livraison 🛵',
          bg: 'bg-indigo-100 text-indigo-800 border-indigo-200',
          icon: <Truck className="w-4 h-4 text-indigo-600 animate-pulse" />,
        };
      case 'pending':
        return {
          label: 'En attente de validation ⏳',
          bg: 'bg-amber-100 text-amber-800 border-amber-200',
          icon: <Clock className="w-4 h-4 text-amber-600" />,
        };
      case 'preparing':
      default:
        return {
          label: 'En cours de préparation 🍬',
          bg: 'bg-pink-100 text-pink-800 border-pink-200',
          icon: <Sparkles className="w-4 h-4 text-pink-600 animate-spin" style={{ animationDuration: '8s' }} />,
        };
    }
  };

  const getWhatsAppFollowupLink = (order: OrderRecord) => {
    const cleanNumber = settings.whatsappNumber.replace(/[^0-9]/g, '');
    const message = encodeURIComponent(
      `Bonjour ${settings.storeName} ! 👋 Je viens aux nouvelles concernant ma commande *${order.id}* passée par ${order.childName}. Merci d'avance ! 🍬`
    );
    return `https://wa.me/${cleanNumber}?text=${message}`;
  };

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Page Title & Subtitle */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold mb-3 shadow-xs">
          <Package className="w-3.5 h-3.5 text-amber-600" />
          <span>Suivi des Livraisons</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-candy font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
          <span>Mes Commandes Gourmandes</span>
          <span className="text-3xl sm:text-4xl">📦</span>
        </h1>
        <p className="text-slate-600 text-sm sm:text-base mt-1">
          Suis l'état de préparation et de livraison de tes bonbons favoris commandés sur WhatsApp !
        </p>
      </div>

      {/* Guest Notice (if not logged in) */}
      {!user && (
        <div className="mb-8 p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-amber-50 to-pink-50 border border-amber-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center text-xl shrink-0">
              🐻
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Tu as déjà commandé avec ton profil enfant ?
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Connecte-toi pour retrouver l'historique complet de toutes tes commandes.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onOpenLogin}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
            >
              J'ai déjà un compte
            </button>
            <button
              onClick={onOpenSignup}
              className="px-3.5 py-2 rounded-xl bg-pink-500 hover:bg-pink-600 text-white text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
            >
              Créer mon profil
            </button>
          </div>
        </div>
      )}

      {/* Tab Filter (All, In Progress, Completed) */}
      {userOrders.length > 0 && (
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              filter === 'all'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            Toutes ({userOrders.length})
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              filter === 'active'
                ? 'bg-amber-500 text-white shadow-md'
                : 'bg-white hover:bg-amber-50 text-slate-700 border border-slate-200'
            }`}
          >
            En cours ({activeOrders.length})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              filter === 'completed'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-white hover:bg-emerald-50 text-slate-700 border border-slate-200'
            }`}
          >
            Livrées ({completedOrders.length})
          </button>
        </div>
      )}

      {/* Orders List or Empty State */}
      {!user ? (
        <div className="bg-white rounded-3xl p-8 sm:p-14 text-center max-w-xl mx-auto shadow-xl shadow-pink-100/60 border border-pink-100">
          <div className="w-24 h-24 sm:w-28 sm:h-28 mx-auto mb-6 rounded-3xl bg-gradient-to-tr from-amber-100 via-rose-50 to-pink-100 flex items-center justify-center text-5xl sm:text-6xl shadow-inner">
            🔒
          </div>
          <h2 className="text-xl sm:text-2xl font-candy font-bold text-slate-900 mb-2">
            Session privée requise
          </h2>
          <p className="text-slate-600 text-sm sm:text-base mb-8 max-w-md mx-auto">
            Tes commandes et informations personnelles sont confidentielles. Connecte-toi à ton profil enfant pour consulter le suivi de tes commandes.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onOpenLogin}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 font-bold text-sm shadow-xs transition-all cursor-pointer active:scale-95"
            >
              J'ai déjà un compte 🔑
            </button>
            <button
              onClick={onOpenSignup}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-candy font-bold text-sm shadow-lg shadow-pink-200 transition-all cursor-pointer active:scale-95"
            >
              Créer mon profil enfant 🐻
            </button>
          </div>
        </div>
      ) : userOrders.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 sm:p-14 text-center max-w-xl mx-auto shadow-xl shadow-pink-100/60 border border-pink-100">
          <div className="w-24 h-24 sm:w-28 sm:h-28 mx-auto mb-6 rounded-3xl bg-gradient-to-tr from-amber-100 via-rose-50 to-pink-100 flex items-center justify-center text-5xl sm:text-6xl shadow-inner animate-pulse">
            📦
          </div>
          <h2 className="text-xl sm:text-2xl font-candy font-bold text-slate-900 mb-2">
            Aucune commande pour le moment !
          </h2>
          <p className="text-slate-600 text-sm sm:text-base mb-8 max-w-md mx-auto">
            Tu n'as pas encore passé de commande avec ton profil {user.firstName}. Choisis tes friandises préférées et commande en un clin d'œil sur WhatsApp !
          </p>
          <button
            onClick={onNavigateHome}
            className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-candy font-bold text-sm sm:text-base shadow-lg shadow-pink-200 transition-all cursor-pointer active:scale-95"
          >
            <Sparkles className="w-4 h-4" />
            <span>Choisir mes bonbons 🍭</span>
          </button>
        </div>
      ) : displayedOrders.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 text-center max-w-md mx-auto border border-pink-100">
          <p className="text-sm font-bold text-slate-700">Aucune commande dans cette catégorie.</p>
          <button
            onClick={() => setFilter('all')}
            className="mt-3 text-xs text-pink-600 font-bold hover:underline cursor-pointer"
          >
            Voir toutes mes commandes
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {displayedOrders.map((order) => {
            const badge = getStatusBadge(order.status);
            const totalItemsCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
            const formattedDate = new Date(order.createdAt).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={order.id}
                className="bg-white rounded-3xl p-5 sm:p-7 shadow-md shadow-pink-100/50 border border-pink-100 transition-all hover:shadow-lg hover:border-pink-200"
              >
                {/* Header: Order ID, Date, Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-pink-50">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center font-black text-sm">
                      #{order.id.slice(-4)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-candy font-bold text-base sm:text-lg text-slate-900">
                          Commande {order.id}
                        </span>
                        <span className="text-xs text-slate-500 font-medium hidden sm:inline">•</span>
                        <span className="text-xs text-slate-500 font-medium">
                          {formattedDate}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>Destinataire : <strong className="text-slate-700">{order.childName}</strong></span>
                      </p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="self-start sm:self-auto">
                    <span className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold border shadow-2xs ${badge.bg}`}>
                      {badge.icon}
                      <span>{badge.label}</span>
                    </span>
                  </div>
                </div>

                {/* Items & Order Details */}
                <div className="py-4 grid grid-cols-1 md:grid-cols-12 gap-6">
                  {/* Left: Items breakdown */}
                  <div className="md:col-span-7 space-y-2.5">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Articles ({totalItemsCount} friandises) :
                    </h4>
                    <div className="space-y-2">
                      {order.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-xs sm:text-sm py-1.5 px-3 rounded-xl bg-pink-50/40 border border-pink-100/50"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-bold text-pink-600 shrink-0">
                              {item.quantity}x
                            </span>
                            <span className="font-semibold text-slate-800 truncate">
                              {item.name}
                            </span>
                          </div>
                          <span className="font-bold text-slate-700 shrink-0 ml-2">
                            {formatPrice(item.price * item.quantity, order.currency, settings.eurToFcfaRate)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right: Delivery Info & Price Total */}
                  <div className="md:col-span-5 bg-slate-50/70 p-4 rounded-2xl border border-slate-100 flex flex-col justify-between gap-4">
                    <div className="space-y-2 text-xs">
                      <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        Informations de livraison :
                      </h4>
                      {order.deliveryAddress && (
                        <p className="flex items-start gap-1.5 text-slate-700">
                          <MapPin className="w-3.5 h-3.5 text-pink-500 shrink-0 mt-0.5" />
                          <span>{order.deliveryAddress}</span>
                        </p>
                      )}
                      {order.customerPhone && (
                        <p className="flex items-center gap-1.5 text-slate-700">
                          <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{order.customerPhone}</span>
                        </p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-200/80 flex items-baseline justify-between">
                      <span className="text-xs font-bold text-slate-600">Total payé/prévu :</span>
                      <span className="text-lg font-candy font-black text-pink-600">
                        {formatPrice(order.totalAmount, order.currency, settings.eurToFcfaRate)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Action: WhatsApp Followup button */}
                <div className="pt-3 border-t border-pink-50 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span>Commande transmise au gérant de la confiserie</span>
                  </div>

                  <a
                    href={getWhatsAppFollowupLink(order)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
                    <span>Suivre ma commande sur WhatsApp</span>
                    <ExternalLink className="w-3 h-3 text-emerald-600" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
