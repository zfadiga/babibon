'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Package,
  Clock,
  CheckCircle2,
  Truck,
  MessageCircle,
  Sparkles,
  ArrowLeft,
  MapPin,
  Phone,
  Lock,
  ShoppingBag,
  ShieldCheck,
  LogIn,
  UserPlus,
} from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { formatPrice } from '@/utils/formatters';
import { OrderRecord } from '@/types/candy';

export const OrdersView: React.FC = () => {
  const { orders, currentUser, settings, setIsLoginOpen, setIsSignupOpen } = useStore();
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

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
      case 'processing':
      case 'preparing':
        return {
          label: 'En cours de préparation 🍬',
          bg: 'bg-pink-100 text-pink-800 border-pink-200',
          icon: <Sparkles className="w-4 h-4 text-pink-600 animate-spin" style={{ animationDuration: '8s' }} />,
        };
      case 'pending':
      default:
        return {
          label: 'En attente de validation ⏳',
          bg: 'bg-amber-100 text-amber-800 border-amber-200',
          icon: <Clock className="w-4 h-4 text-amber-600" />,
        };
    }
  };

  const getWhatsAppFollowupLink = (order: OrderRecord) => {
    const cleanNumber = (settings.whatsappNumber || '2250779323716').replace(/[^0-9]/g, '');
    const clientName = order.childName || order.customer_name || 'Client';
    const message = encodeURIComponent(
      `Bonjour ${settings.storeName} ! 👋 Je viens aux nouvelles concernant ma commande *${order.id}* passée par ${clientName}. Merci d'avance ! 🍬`
    );
    return `https://wa.me/${cleanNumber}?text=${message}`;
  };

  // 1. If not logged in, enforce strict privacy: NO ORDERS OR DETAILS VISIBLE
  if (!currentUser) {
    return (
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-16">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-pink-600 hover:bg-pink-50 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Retour à la boutique</span>
          </Link>
        </div>

        <div className="bg-white rounded-3xl p-8 sm:p-14 text-center max-w-lg mx-auto shadow-xl shadow-pink-100/60 border border-pink-100 animate-fade-in">
          <div className="w-20 h-20 mx-auto mb-5 rounded-3xl bg-pink-50 border border-pink-100 flex items-center justify-center text-pink-600 shadow-inner">
            <Lock className="w-10 h-10" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-100 text-pink-700 text-xs font-bold mb-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Session Privée Requise</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-candy font-bold text-slate-900 mb-2">
            Espace Commandes Sécurisé 🔒
          </h2>
          <p className="text-slate-600 text-xs sm:text-sm mb-6 max-w-md mx-auto leading-relaxed">
            Vos informations personnelles, adresses et historiques de commandes sont strictement confidentiels.
            Veuillez vous connecter avec votre identifiant et votre mot de passe pour y accéder.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => setIsLoginOpen(true)}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-candy font-bold text-xs sm:text-sm shadow-md shadow-pink-200 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <LogIn className="w-4 h-4" />
              <span>Me connecter 🍬</span>
            </button>
            <button
              onClick={() => setIsSignupOpen(true)}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200 font-candy font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              <span>Créer un compte</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Only show orders belonging to this active private session
  const userOrders = orders.filter((o) => {
    if (o.childId) return o.childId === currentUser.id;
    if (o.childUsername) return o.childUsername.toLowerCase() === currentUser.username.toLowerCase();
    return false;
  });

  const activeOrders = userOrders.filter((o) => (o.status || 'pending') !== 'completed');
  const completedOrders = userOrders.filter((o) => (o.status || 'pending') === 'completed');

  const displayedOrders = filter === 'active'
    ? activeOrders
    : filter === 'completed'
    ? completedOrders
    : userOrders;

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Top Back link */}
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-pink-600 hover:bg-pink-50 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Retour à la boutique</span>
        </Link>
      </div>

      {/* Page Title & Subtitle */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold mb-3 shadow-2xs">
          <Package className="w-3.5 h-3.5 text-amber-600" />
          <span>Session de {currentUser.firstName}</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-candy font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
          <span>Mes Commandes Privées</span>
          <span className="text-3xl sm:text-4xl">📦</span>
        </h1>
        <p className="text-slate-600 text-sm sm:text-base mt-1">
          Suis l'état de préparation et de livraison de tes bonbons en temps réel.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-pink-100 pb-3">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
            filter === 'all'
              ? 'bg-pink-500 text-white shadow-md shadow-pink-200'
              : 'bg-white text-slate-600 hover:bg-pink-50 border border-pink-100'
          }`}
        >
          Toutes ({userOrders.length})
        </button>

        <button
          onClick={() => setFilter('active')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
            filter === 'active'
              ? 'bg-amber-500 text-white shadow-md shadow-amber-200'
              : 'bg-white text-slate-600 hover:bg-amber-50 border border-pink-100'
          }`}
        >
          En cours ({activeOrders.length})
        </button>

        <button
          onClick={() => setFilter('completed')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
            filter === 'completed'
              ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200'
              : 'bg-white text-slate-600 hover:bg-emerald-50 border border-pink-100'
          }`}
        >
          Livrées ({completedOrders.length})
        </button>
      </div>

      {/* Orders List */}
      {displayedOrders.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 sm:p-14 text-center max-w-xl mx-auto shadow-xl shadow-pink-100/60 border border-pink-100 animate-fade-in">
          <div className="w-24 h-24 sm:w-28 sm:h-28 mx-auto mb-6 rounded-3xl bg-gradient-to-tr from-amber-100 via-rose-50 to-pink-100 flex items-center justify-center text-5xl sm:text-6xl shadow-inner">
            📭
          </div>
          <h2 className="text-xl sm:text-2xl font-candy font-bold text-slate-900 mb-2">
            Aucune commande trouvée
          </h2>
          <p className="text-slate-600 text-sm sm:text-base mb-8 max-w-md mx-auto">
            {filter !== 'all'
              ? "Aucune commande ne correspond à ce filtre actuellement."
              : "Tu n'as pas encore passé de commande avec ton compte. Remplis vite ton panier de délicieux bonbons !"}
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-candy font-bold text-sm shadow-lg shadow-pink-200 transition-all cursor-pointer active:scale-95"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Faire le plein de bonbons</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-4 animate-fade-in">
          {displayedOrders.map((order) => {
            const status = getStatusBadge(order.status);
            const orderDate = new Date(order.createdAt || order.created_at || Date.now());
            const formattedDate = orderDate.toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });
            const total = order.totalAmount ?? order.total_amount ?? 0;

            return (
              <div
                key={order.id}
                className="bg-white rounded-3xl border border-pink-100 shadow-sm hover:shadow-md transition-all p-5 sm:p-6"
              >
                {/* Order Top Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-pink-50 pb-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-pink-50 border border-pink-200 flex items-center justify-center text-pink-600 font-bold text-sm">
                      #{String(order.id).slice(-4)}
                    </div>
                    <div>
                      <h3 className="font-candy font-bold text-base sm:text-lg text-slate-900">
                        Commande {order.id}
                      </h3>
                      <p className="text-xs text-slate-400">Passée le {formattedDate}</p>
                    </div>
                  </div>

                  {/* Status badge & WhatsApp Followup */}
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${status.bg}`}
                    >
                      {status.icon}
                      <span>{status.label}</span>
                    </span>

                    <a
                      href={getWhatsAppFollowupLink(order)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                      title="Contacter le gérant sur WhatsApp pour cette commande"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Suivre sur WhatsApp</span>
                    </a>
                  </div>
                </div>

                {/* Items Breakdown */}
                <div className="space-y-2 mb-4">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    Friandises commandées :
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {order.items?.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-2xl bg-pink-50/50 border border-pink-100 flex items-center justify-between text-xs"
                      >
                        <span className="font-semibold text-slate-800 truncate mr-2">
                          {item.name || item.candy_name}
                        </span>
                        <span className="font-bold text-pink-600 shrink-0">
                          x{item.quantity} ({formatPrice(item.price * item.quantity, settings.currency, settings.eurToFcfaRate)})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Delivery info & Total */}
                <div className="pt-3 border-t border-pink-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
                  <div className="flex flex-wrap items-center gap-4">
                    {order.deliveryAddress && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-pink-500 shrink-0" />
                        <span className="truncate max-w-xs">{order.deliveryAddress}</span>
                      </span>
                    )}
                    {order.customerPhone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-pink-500 shrink-0" />
                        <span>{order.customerPhone}</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <span className="text-slate-400 font-medium">Total :</span>
                    <span className="font-candy font-extrabold text-base sm:text-lg text-pink-600">
                      {formatPrice(total, settings.currency, settings.eurToFcfaRate)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
