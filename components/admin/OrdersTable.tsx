'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Order } from '@/types';
import { fetchOrders, updateOrderStatus, deleteOrder } from '@/lib/api';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import {
  ShoppingBag,
  TrendingUp,
  Clock,
  CheckCircle,
  RefreshCw,
  Search,
  Filter,
  Loader2,
  Calendar,
  AlertCircle,
  Phone,
  Trash2,
  ChevronDown,
  Check,
  XCircle,
  CheckCircle2,
} from 'lucide-react';
import { formatPrice } from '@/utils/formatters';

export const ORDER_STATUS_CONFIG: Record<
  string,
  {
    label: string;
    badgeBg: string;
    badgeText: string;
    border: string;
    dotColor: string;
    hoverBg: string;
    icon: typeof Clock;
  }
> = {
  pending: {
    label: 'En attente',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-800',
    border: 'border-amber-200',
    dotColor: 'bg-amber-500',
    hoverBg: 'hover:bg-amber-100',
    icon: Clock,
  },
  processing: {
    label: 'En cours',
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-800',
    border: 'border-blue-200',
    dotColor: 'bg-blue-500',
    hoverBg: 'hover:bg-blue-100',
    icon: RefreshCw,
  },
  completed: {
    label: 'Livrée',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-800',
    border: 'border-emerald-200',
    dotColor: 'bg-emerald-500',
    hoverBg: 'hover:bg-emerald-100',
    icon: CheckCircle,
  },
  cancelled: {
    label: 'Annulée',
    badgeBg: 'bg-rose-50',
    badgeText: 'text-rose-800',
    border: 'border-rose-200',
    dotColor: 'bg-rose-500',
    hoverBg: 'hover:bg-rose-100',
    icon: XCircle,
  },
};

export function normalizeStatus(
  rawStatus?: string
): 'pending' | 'processing' | 'completed' | 'cancelled' {
  const s = (rawStatus || '').toLowerCase().trim();
  if (s === 'completed' || s === 'delivered') return 'completed';
  if (
    s === 'processing' ||
    s === 'preparing' ||
    s === 'delivering' ||
    s === 'in_progress'
  )
    return 'processing';
  if (s === 'cancelled' || s === 'canceled') return 'cancelled';
  return 'pending';
}

export default function OrdersTable() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [mounted, setMounted] = useState(false);

  // Interactive status dropdown state with portal coordinates
  const [openStatusMenuId, setOpenStatusMenuId] = useState<string | number | null>(null);
  const [menuPosition, setMenuPosition] = useState<{
    top: number;
    left: number;
    openUpwards: boolean;
  } | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | number | null>(null);

  // Deletion modal state
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const loadOrders = async (silent = false) => {
    if (!silent) setLoading(true);
    setErrorMsg(null);
    try {
      const data = await fetchOrders();
      setOrders(data);
    } catch (err: any) {
      setErrorMsg(
        err.message || 'Impossible de récupérer les commandes clients.'
      );
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Close status dropdown menu when clicking anywhere outside or scrolling
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenStatusMenuId(null);
      setMenuPosition(null);
    };

    const handleScrollOrResize = () => {
      setOpenStatusMenuId(null);
      setMenuPosition(null);
    };

    window.addEventListener('click', handleClickOutside);
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);

    return () => {
      window.removeEventListener('click', handleClickOutside);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, []);

  // Initial load + Supabase Realtime subscription
  useEffect(() => {
    loadOrders();

    if (!isSupabaseConfigured) return;

    const channel = supabase
      .channel('realtime_admin_orders')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload: any) => {
          // Immediately reflect status updates in local state for instantaneous counter updates
          if (payload.eventType === 'UPDATE' && payload.new) {
            setOrders((prev) =>
              prev.map((o) =>
                String(o.id) === String(payload.new.id)
                  ? {
                      ...o,
                      status: payload.new.status,
                      customer_name: payload.new.customer_name || o.customer_name,
                      deliveryAddress: payload.new.delivery_address || o.deliveryAddress,
                      customerPhone: payload.new.customer_phone || o.customerPhone,
                      total_amount:
                        payload.new.total_amount != null
                          ? Number(payload.new.total_amount)
                          : o.total_amount,
                      totalAmount:
                        payload.new.total_amount != null
                          ? Number(payload.new.total_amount)
                          : o.totalAmount,
                    }
                  : o
              )
            );
          } else if (payload.eventType === 'DELETE' && payload.old) {
            setOrders((prev) =>
              prev.filter((o) => String(o.id) !== String(payload.old.id))
            );
          }
          // Also perform background silent refresh to guarantee complete consistency
          loadOrders(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Update order status with optimistic reload
  const handleStatusChange = async (
    orderId: string | number,
    newStatus: string
  ) => {
    setOpenStatusMenuId(null);
    setMenuPosition(null);
    setUpdatingStatusId(orderId);
    setErrorMsg(null);

    // Optimistic state update: counters update dynamically
    setOrders((prev) =>
      prev.map((o) =>
        String(o.id) === String(orderId) ? { ...o, status: newStatus } : o
      )
    );

    try {
      await updateOrderStatus(orderId, newStatus);
      const label = ORDER_STATUS_CONFIG[newStatus]?.label || newStatus;
      setFeedbackMsg(
        `Statut de la commande #${orderId} modifié avec succès : "${label}".`
      );
      setTimeout(() => setFeedbackMsg(null), 3500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur lors de la mise à jour du statut.');
      loadOrders(); // Rollback if error
    } finally {
      setUpdatingStatusId(null);
    }
  };

  // Confirm delete with optimistic state reload
  const handleConfirmDelete = async () => {
    if (!orderToDelete) return;
    setDeleting(true);
    setErrorMsg(null);

    const idToDelete = orderToDelete.id;

    // Optimistic delete: counters update dynamically
    setOrders((prev) =>
      prev.filter((o) => String(o.id) !== String(idToDelete))
    );

    try {
      await deleteOrder(idToDelete);
      setOrderToDelete(null);
      setFeedbackMsg(
        `La commande #${idToDelete} a été définitivement supprimée.`
      );
      setTimeout(() => setFeedbackMsg(null), 3500);
    } catch (err: any) {
      setErrorMsg(
        err.message || 'Erreur lors de la suppression de la commande.'
      );
      loadOrders(); // Rollback if error
    } finally {
      setDeleting(false);
    }
  };

  const safeOrders = Array.isArray(orders) ? orders : [];

  const filteredOrders = safeOrders.filter((order) => {
    if (!order) return false;
    const name = order.customer_name || order.childName || '';
    const email = order.customer_email || '';
    const id = String(order.id || '');

    const matchesSearch =
      id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.toLowerCase().includes(searchTerm.toLowerCase());

    const status = (order.status || '').toLowerCase();
    let matchesStatus = true;
    if (statusFilter === 'pending') {
      matchesStatus = status === 'pending';
    } else if (statusFilter === 'processing') {
      matchesStatus =
        status === 'processing' ||
        status === 'preparing' ||
        status === 'delivering' ||
        status === 'in_progress';
    } else if (statusFilter === 'completed') {
      matchesStatus = status === 'completed' || status === 'delivered';
    } else if (statusFilter === 'cancelled') {
      matchesStatus = status === 'cancelled';
    }

    return matchesSearch && matchesStatus;
  });

  // KPI Metrics (Calculated dynamically from safeOrders)
  const totalRevenue = safeOrders
    .filter((o) => (o.status || '').toLowerCase() !== 'cancelled')
    .reduce(
      (acc, curr) => acc + (curr.total_amount ?? curr.totalAmount ?? 0),
      0
    );
  const pendingCount = safeOrders.filter(
    (o) => (o.status || '').toLowerCase() === 'pending'
  ).length;
  const completedCount = safeOrders.filter((o) => {
    const s = (o.status || '').toLowerCase();
    return s === 'completed' || s === 'delivered';
  }).length;

  const activeOrderForMenu = safeOrders.find((o) => o.id === openStatusMenuId);

  return (
    <div className="space-y-6">
      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Orders */}
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Total Commandes
            </p>
            <p className="text-2xl font-bold text-gray-900">{safeOrders.length}</p>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Chiffre d'Affaires
            </p>
            <p className="text-xl font-bold text-emerald-600">
              {formatPrice(totalRevenue)}
            </p>
          </div>
        </div>

        {/* Pending */}
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              En Attente
            </p>
            <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
          </div>
        </div>

        {/* Completed */}
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Livrées avec succès
            </p>
            <p className="text-2xl font-bold text-blue-600">{completedCount}</p>
          </div>
        </div>
      </div>

      {/* Main Table Container: overflow-visible ensures no clipping */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100">
        {/* Controls */}
        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
              <span>Historique des commandes</span>
              <span className="text-xs bg-rose-100 text-rose-800 font-semibold px-2.5 py-0.5 rounded-full">
                {filteredOrders.length}
              </span>
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Consultez le statut des commandes et les détails de livraison
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Client, ID, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 w-48 sm:w-60"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <Filter className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-9 pr-8 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
              >
                <option value="all">Tous les statuts</option>
                <option value="pending">En attente (Pending)</option>
                <option value="processing">En cours (In progress)</option>
                <option value="completed">Livrées (Delivered)</option>
                <option value="cancelled">Annulées (Cancelled)</option>
              </select>
            </div>

            {/* Refresh */}
            <button
              onClick={() => loadOrders(false)}
              disabled={loading}
              className="p-2 text-gray-600 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-gray-200 transition-colors disabled:opacity-50 cursor-pointer"
              title="Actualiser"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {feedbackMsg && (
          <div className="mx-6 my-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between shadow-2xs animate-fade-in">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{feedbackMsg}</span>
            </div>
            <button
              onClick={() => setFeedbackMsg(null)}
              className="text-emerald-600 hover:text-emerald-800 text-xs font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {errorMsg && (
          <div className="mx-6 my-4 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Table wrapper with min-height */}
        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                <th className="py-3.5 px-6">Réf. Commande</th>
                <th className="py-3.5 px-6">Client</th>
                <th className="py-3.5 px-6">Date</th>
                <th className="py-3.5 px-6">Articles</th>
                <th className="py-3.5 px-6">Total</th>
                <th className="py-3.5 px-6">Statut (Cliquer pour changer)</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {loading && filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-rose-500 mb-2" />
                    <span>Chargement des commandes...</span>
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    <ShoppingBag className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                    <p className="font-semibold text-gray-600">Aucune commande trouvée</p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const clientName = order.customer_name || order.childName || 'Client invité';
                  const dateStr = order.created_at || order.createdAt;
                  const total = order.total_amount ?? order.totalAmount ?? 0;
                  const normStatus = normalizeStatus(order.status);
                  const cfg = ORDER_STATUS_CONFIG[normStatus];
                  const StatusIcon = cfg.icon;
                  const isMenuOpen = openStatusMenuId === order.id;

                  return (
                    <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-4 px-6 font-mono font-bold text-xs text-gray-700">
                        #{order.id}
                      </td>

                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-xs">
                            {clientName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{clientName}</p>
                            {order.customerPhone && (
                              <p className="text-xs text-gray-500 flex items-center gap-1">
                                <Phone className="w-3 h-3 text-gray-400" />
                                <span>{order.customerPhone}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6 text-xs text-gray-500">
                        <div className="flex items-center space-x-1.5">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          <span>
                            {dateStr
                              ? new Date(dateStr).toLocaleDateString('fr-FR', {
                                  day: '2-digit',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : 'Récent'}
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        {order.items && order.items.length > 0 ? (
                          <div className="text-xs text-gray-600 max-w-xs space-y-0.5">
                            {order.items.slice(0, 2).map((item, idx) => (
                              <p key={idx} className="truncate">
                                &bull; {item.quantity}x {item.candy_name || item.name}
                              </p>
                            ))}
                            {order.items.length > 2 && (
                              <p className="text-[11px] text-gray-400 font-medium">
                                +{order.items.length - 2} autre(s) friandise(s)
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">Détail non disponible</span>
                        )}
                      </td>

                      <td className="py-4 px-6 font-bold text-gray-900">
                        {formatPrice(total)}
                      </td>

                      {/* Interactive Status Selector */}
                      <td className="py-4 px-6" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (openStatusMenuId === order.id) {
                              setOpenStatusMenuId(null);
                              setMenuPosition(null);
                              return;
                            }
                            const rect = e.currentTarget.getBoundingClientRect();
                            const dropdownHeight = 175;
                            const spaceBelow = window.innerHeight - rect.bottom;
                            const openUpwards = spaceBelow < dropdownHeight && rect.top > dropdownHeight;
                            const top = openUpwards
                              ? rect.top - dropdownHeight - 6
                              : rect.bottom + 6;
                            const left = Math.max(12, Math.min(rect.left, window.innerWidth - 204));

                            setMenuPosition({ top, left, openUpwards });
                            setOpenStatusMenuId(order.id);
                          }}
                          disabled={updatingStatusId === order.id}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-95 ${cfg.badgeBg} ${cfg.border} ${cfg.badgeText} ${cfg.hoverBg}`}
                          title="Cliquer pour changer le statut instantanément"
                        >
                          {updatingStatusId === order.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-current" />
                          ) : (
                            <StatusIcon className="w-3.5 h-3.5" />
                          )}
                          <span>{cfg.label}</span>
                          <ChevronDown
                            className={`w-3.5 h-3.5 opacity-60 transition-transform ${
                              isMenuOpen ? 'rotate-180' : ''
                            }`}
                          />
                        </button>
                      </td>

                      {/* Delete Action Button */}
                      <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => setOrderToDelete(order)}
                          className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer inline-flex items-center justify-center group"
                          title="Supprimer la commande"
                        >
                          <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Portal Dropdown Menu: completely escapes all overflow-hidden and overflow-x-auto containers */}
      {mounted && openStatusMenuId && menuPosition && activeOrderForMenu && createPortal(
        <div
          style={{
            position: 'fixed',
            top: `${menuPosition.top}px`,
            left: `${menuPosition.left}px`,
            zIndex: 99999,
          }}
          className="w-48 rounded-2xl bg-white shadow-2xl border border-gray-100 py-1.5 ring-1 ring-black/10 animate-in fade-in zoom-in-95 duration-100"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-50 mb-1">
            Statut de la commande
          </div>
          {(['pending', 'processing', 'completed', 'cancelled'] as const).map((key) => {
            const opt = ORDER_STATUS_CONFIG[key];
            const isSelected = normalizeStatus(activeOrderForMenu.status) === key;
            const OptIcon = opt.icon;
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleStatusChange(activeOrderForMenu.id, key)}
                className={`w-full px-3 py-2 text-xs flex items-center justify-between transition-colors hover:bg-gray-50 cursor-pointer ${
                  isSelected
                    ? 'font-bold text-gray-900 bg-gray-50/80'
                    : 'text-gray-600'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${opt.dotColor}`} />
                  <OptIcon className={`w-3.5 h-3.5 ${opt.badgeText}`} />
                  <span>{opt.label}</span>
                </span>
                {isSelected && <Check className="w-3.5 h-3.5 text-rose-600" />}
              </button>
            );
          })}
        </div>,
        document.body
      )}

      {/* Delete Confirmation Modal */}
      {orderToDelete && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => !deleting && setOrderToDelete(null)}
        >
          <div
            className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Supprimer la commande #{orderToDelete.id} ?
            </h3>

            <p className="text-xs text-gray-500 mb-5 leading-relaxed">
              Cette action est irréversible. La commande de{' '}
              <strong className="text-gray-800">
                {orderToDelete.customer_name ||
                  orderToDelete.childName ||
                  'ce client'}
              </strong>{' '}
              d'un montant de{' '}
              <strong className="text-rose-600">
                {formatPrice(
                  orderToDelete.total_amount ??
                    orderToDelete.totalAmount ??
                    0
                )}
              </strong>{' '}
              sera définitivement supprimée de la base de données.
            </p>

            <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100 text-xs mb-6 space-y-2 text-gray-600">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Date :</span>
                <span className="font-medium text-gray-800">
                  {orderToDelete.created_at || orderToDelete.createdAt
                    ? new Date(
                        orderToDelete.created_at || orderToDelete.createdAt!
                      ).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'Récent'}
                </span>
              </div>
              {orderToDelete.customerPhone && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Téléphone :</span>
                  <span className="font-medium text-gray-800">
                    {orderToDelete.customerPhone}
                  </span>
                </div>
              )}
              {orderToDelete.deliveryAddress && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Livraison :</span>
                  <span className="font-medium text-gray-800 truncate max-w-[200px]">
                    {orderToDelete.deliveryAddress}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setOrderToDelete(null)}
                disabled={deleting}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white text-xs font-semibold shadow-md shadow-rose-200 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Suppression...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Confirmer la suppression</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
