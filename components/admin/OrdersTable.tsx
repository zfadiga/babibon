'use client';

import React, { useState, useEffect } from 'react';
import { Order } from '@/types';
import { fetchOrders } from '@/lib/api';
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
  User,
  AlertCircle,
  MapPin,
  Phone,
} from 'lucide-react';
import { formatPrice } from '@/utils/formatters';

export default function OrdersTable() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const loadOrders = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await fetchOrders();
      setOrders(data);
    } catch (err: any) {
      setErrorMsg(
        err.message || 'Impossible de récupérer les commandes clients.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

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
    const matchesStatus =
      statusFilter === 'all' ||
      status === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  // KPI Metrics
  const totalRevenue = safeOrders.reduce(
    (acc, curr) => acc + (curr.total_amount ?? curr.totalAmount ?? 0),
    0
  );
  const pendingCount = safeOrders.filter(
    (o) => (o.status || '').toLowerCase() === 'pending'
  ).length;
  const completedCount = safeOrders.filter(
    (o) => (o.status || '').toLowerCase() === 'completed'
  ).length;

  const getStatusBadge = (status: string) => {
    switch ((status || '').toLowerCase()) {
      case 'completed':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
            <CheckCircle className="w-3.5 h-3.5 mr-1 text-emerald-600" />
            Livrée
          </span>
        );
      case 'processing':
      case 'preparing':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
            <Clock className="w-3.5 h-3.5 mr-1 text-blue-600" />
            En préparation
          </span>
        );
      case 'delivering':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">
            <Clock className="w-3.5 h-3.5 mr-1 text-indigo-600" />
            En livraison
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
            Annulée
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
            <Clock className="w-3.5 h-3.5 mr-1 text-amber-600" />
            En attente
          </span>
        );
    }
  };

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

      {/* Main Table Container */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
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
                <option value="pending">En attente</option>
                <option value="processing">En préparation</option>
                <option value="delivering">En livraison</option>
                <option value="completed">Livrées</option>
                <option value="cancelled">Annulées</option>
              </select>
            </div>

            {/* Refresh */}
            <button
              onClick={loadOrders}
              disabled={loading}
              className="p-2 text-gray-600 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-gray-200 transition-colors disabled:opacity-50 cursor-pointer"
              title="Actualiser"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="mx-6 my-4 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                <th className="py-3.5 px-6">Réf. Commande</th>
                <th className="py-3.5 px-6">Client</th>
                <th className="py-3.5 px-6">Date</th>
                <th className="py-3.5 px-6">Articles</th>
                <th className="py-3.5 px-6">Total</th>
                <th className="py-3.5 px-6">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {loading && filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-rose-500 mb-2" />
                    <span>Chargement des commandes...</span>
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    <ShoppingBag className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                    <p className="font-semibold text-gray-600">Aucune commande trouvée</p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const clientName = order.customer_name || order.childName || 'Client invité';
                  const dateStr = order.created_at || order.createdAt;
                  const total = order.total_amount ?? order.totalAmount ?? 0;

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

                      <td className="py-4 px-6">
                        {getStatusBadge(order.status)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
