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
  XCircle,
  Loader2,
  Camera,
  ExternalLink,
  Edit3,
  Save,
  X,
  FileText,
  Info,
  HelpCircle,
} from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { formatPrice } from '@/utils/formatters';
import { OrderRecord } from '@/types/candy';

export const OrdersView: React.FC = () => {
  const { orders, currentUser, settings, setIsLoginOpen, setIsSignupOpen, modifyOrder } = useStore();
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'cancelled'>('all');

  // Edit Order state
  const [orderToEdit, setOrderToEdit] = useState<OrderRecord | null>(null);
  const [editAddress, setEditAddress] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editFeedback, setEditFeedback] = useState<string | null>(null);

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
      case 'cancelled':
        return {
          label: 'Commande supprimée / annulée ❌',
          bg: 'bg-rose-100 text-rose-800 border-rose-200',
          icon: <XCircle className="w-4 h-4 text-rose-600" />,
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
    const clientName = order.childName || order.customer_name || currentUser?.firstName || 'Client';
    const mediaImg = order.imageUrl || order.image_url || order.items?.find((i) => i.image_url || i.imageUrl)?.image_url;

    let text = `Bonjour ${settings.storeName} ! 👋 Je viens aux nouvelles concernant ma commande *#${order.id}* passée par ${clientName}.`;
    if (mediaImg && mediaImg.startsWith('http')) {
      text += `\n📸 Photo commande : ${mediaImg}`;
    }
    text += `\nMerci d'avance ! 🍬`;

    return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(text)}`;
  };

  const getWhatsAppCancellationRequestLink = (order: OrderRecord) => {
    const cleanNumber = (settings.whatsappNumber || '2250779323716').replace(/[^0-9]/g, '');
    const clientName = order.childName || order.customer_name || currentUser?.firstName || 'Client';
    const text = `Bonjour ${settings.storeName} ! 👋\nJe souhaite demander l'annulation de ma commande *#${order.id}* passée au nom de *${clientName}*.\nConformément aux règles de la boutique, seul l'administrateur peut la supprimer du tableau de bord.\nPouvez-vous s'il vous plaît procéder à son annulation/suppression ? Merci beaucoup ! 🍬`;
    return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(text)}`;
  };

  const handleOpenEdit = (order: OrderRecord) => {
    setOrderToEdit(order);
    setEditAddress(order.deliveryAddress || '');
    setEditPhone(order.customerPhone || '');
    setEditNotes(order.notes || '');
    setEditFeedback(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderToEdit) return;

    setIsSavingEdit(true);
    setEditFeedback(null);

    try {
      const ok = await modifyOrder(orderToEdit.id, {
        deliveryAddress: editAddress.trim(),
        customerPhone: editPhone.trim(),
        notes: editNotes.trim(),
      });

      if (ok) {
        setEditFeedback('✅ Votre commande a été modifiée avec succès !');
        setTimeout(() => {
          setOrderToEdit(null);
          setEditFeedback(null);
        }, 1200);
      } else {
        setEditFeedback('❌ Impossible d’enregistrer les modifications. Veuillez réessayer.');
      }
    } catch {
      setEditFeedback('❌ Une erreur est survenue lors de la mise à jour.');
    } finally {
      setIsSavingEdit(false);
    }
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
            Veuillez vous connecter avec vos identifiants clients pour y accéder.
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

  const activeOrders = userOrders.filter((o) => {
    const s = (o.status || 'pending').toLowerCase();
    return s !== 'completed' && s !== 'delivered' && s !== 'cancelled' && s !== 'canceled';
  });
  const completedOrders = userOrders.filter((o) => {
    const s = (o.status || 'pending').toLowerCase();
    return s === 'completed' || s === 'delivered';
  });
  const cancelledOrders = userOrders.filter((o) => {
    const s = (o.status || 'pending').toLowerCase();
    return s === 'cancelled' || s === 'canceled';
  });

  const displayedOrders =
    filter === 'active'
      ? activeOrders
      : filter === 'completed'
      ? completedOrders
      : filter === 'cancelled'
      ? cancelledOrders
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
          <span>Session client de {currentUser.firstName}</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-candy font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
          <span>Mes Commandes Privées</span>
          <span className="text-3xl sm:text-4xl">📦</span>
        </h1>
        <p className="text-slate-600 text-sm sm:text-base mt-1">
          Suis l'état de ta commande, modifie tes coordonnées de livraison ou contacte l'administrateur en cas de besoin.
        </p>

        {/* Informative policy note */}
        <div className="mt-4 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-xs text-amber-900 max-w-3xl">
          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Règle de gestion des commandes :</strong> Une fois lancée, vous pouvez modifier les informations de votre commande (adresse, téléphone, notes). En revanche, la commande ne peut pas être annulée directement depuis votre espace client. Seul l'administrateur peut la supprimer si vous lui adressez une demande d'annulation sur WhatsApp.
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
            filter === 'all'
              ? 'bg-pink-600 text-white shadow-md shadow-pink-200'
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

        <button
          onClick={() => setFilter('cancelled')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
            filter === 'cancelled'
              ? 'bg-rose-500 text-white shadow-md shadow-rose-200'
              : 'bg-white text-slate-600 hover:bg-rose-50 border border-pink-100'
          }`}
        >
          Supprimées ({cancelledOrders.length})
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
              ? 'Aucune commande ne correspond à ce filtre actuellement.'
              : 'Tu n\'as pas encore passé de commande avec ton compte. Remplis vite ton panier de délicieux bonbons !'}
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
            const normStatus = (order.status || 'pending').toLowerCase();
            const canModify = ['pending', 'processing', 'preparing'].includes(normStatus);
            const isFinished = ['completed', 'delivered', 'cancelled', 'canceled'].includes(normStatus);

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

                  {/* Status badge and Action buttons */}
                  <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${status.bg}`}
                    >
                      {status.icon}
                      <span>{status.label}</span>
                    </span>

                    {/* 1. Modify Order Button */}
                    {canModify && (
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(order)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-pink-700 bg-pink-50 hover:bg-pink-100 border border-pink-200 transition-all cursor-pointer active:scale-95"
                        title="Modifier les coordonnées de livraison ou notes"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-pink-600" />
                        <span>Modifier ma commande</span>
                      </button>
                    )}

                    {/* 2. Cancellation Request via WhatsApp (Client cannot cancel directly; only admin can delete) */}
                    {!isFinished && (
                      <a
                        href={getWhatsAppCancellationRequestLink(order)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors"
                        title="Envoyer une demande d'annulation sur WhatsApp à l'administrateur"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-rose-500" />
                        <span>Demander l&apos;annulation WhatsApp</span>
                      </a>
                    )}

                    {/* 3. Followup link */}
                    <a
                      href={getWhatsAppFollowupLink(order)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                      title="Contacter le gérant sur WhatsApp pour cette commande"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Suivre</span>
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

                {/* Delivery info, Notes & Total */}
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
                    {order.notes && (
                      <span className="flex items-center gap-1 text-slate-500 italic max-w-xs truncate">
                        <FileText className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span>Note : {order.notes}</span>
                      </span>
                    )}
                    {(order.imageUrl || order.image_url || order.mediaUrl || order.media_url) && (
                      <a
                        href={(order.imageUrl || order.image_url || order.mediaUrl || order.media_url) as string}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-pink-600 hover:text-pink-700 font-semibold bg-pink-50 hover:bg-pink-100 px-2 py-0.5 rounded-lg border border-pink-200 transition-colors"
                        title="Voir la photo jointe à la commande"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Photo jointe</span>
                        <ExternalLink className="w-3 h-3 text-pink-400" />
                      </a>
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

      {/* Order Modification Modal */}
      {orderToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-pink-100 animate-scale-up relative"
            role="dialog"
            aria-modal="true"
          >
            <button
              onClick={() => setOrderToEdit(null)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-pink-50 border border-pink-200 flex items-center justify-center text-pink-600 mb-4">
              <Edit3 className="w-6 h-6" />
            </div>

            <h3 className="text-lg sm:text-xl font-candy font-bold text-slate-900 mb-1">
              Modifier ma commande #{orderToEdit.id}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Mettez à jour vos coordonnées de livraison ou vos instructions avant la préparation.
            </p>

            {editFeedback && (
              <div
                className={`p-3 rounded-2xl mb-4 text-xs font-semibold ${
                  editFeedback.includes('✅')
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {editFeedback}
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Adresse de livraison
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    placeholder="Ex: Cocody Angré, Rue L12, Villa 45"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-pink-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Numéro de téléphone
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="tel"
                    required
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="Ex: 07 79 32 37 16"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-pink-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Instructions particulières (notes)
                </label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Ex: Appeler à l'arrivée, sonner au portail bleu..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-pink-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOrderToEdit(null)}
                  disabled={isSavingEdit}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-5 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold shadow-md shadow-pink-200 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-60"
                >
                  {isSavingEdit ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Enregistrement...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Enregistrer</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
