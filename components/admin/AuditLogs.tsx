'use client';

import React, { useState, useEffect } from 'react';
import { fetchAuditLogs } from '@/lib/api';
import { AuditLogEntry } from '@/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import {
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  Search,
  Filter,
  Clock,
  User,
  AlertTriangle,
  FileText,
  Lock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'SUCCESS' | 'DENIED'>('all');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const loadLogs = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await fetchAuditLogs(100, 0);
      setLogs(data);
    } catch (e) {
      console.warn('Failed to load audit logs:', e);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();

    if (!isSupabaseConfigured) return;

    // Realtime subscription for audit logs
    const channel = supabase
      .channel('realtime_audit_logs')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'audit_logs' },
        (payload: any) => {
          if (payload.new) {
            setLogs((prev) => [payload.new as AuditLogEntry, ...prev]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredLogs = logs.filter((log) => {
    if (statusFilter !== 'all' && log.status !== statusFilter) return false;
    if (!searchTerm.trim()) return true;

    const q = searchTerm.toLowerCase();
    const action = log.action.toLowerCase();
    const actor = (log.actor_email || '').toLowerCase();
    const target = (log.target_id || '').toLowerCase();
    const details = JSON.stringify(log.details || {}).toLowerCase();

    return action.includes(q) || actor.includes(q) || target.includes(q) || details.includes(q);
  });

  const getActionBadge = (action: string, status: string) => {
    const isDenied = status === 'DENIED' || status === 'FAILED' || action.includes('UNAUTHORIZED') || action.includes('BLOCKED');
    if (isDenied) {
      return {
        bg: 'bg-rose-50 border-rose-200 text-rose-700',
        icon: <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />,
        label: action,
      };
    }
    if (action.includes('DELETED')) {
      return {
        bg: 'bg-amber-50 border-amber-200 text-amber-800',
        icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />,
        label: action,
      };
    }
    return {
      bg: 'bg-emerald-50 border-emerald-200 text-emerald-700',
      icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />,
      label: action,
    };
  };

  const deniedCount = logs.filter((l) => l.status === 'DENIED' || l.action.includes('UNAUTHORIZED')).length;

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50/80 via-white to-pink-50/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-md">
              <FileText className="w-6 h-6 text-pink-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-gray-900">
                  Journal d&apos;Audit de Sécurité
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                  Immuable
                </span>
                {deniedCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200 flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3" />
                    <span>{deniedCount} alerte{deniedCount > 1 ? 's' : ''}</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Traçabilité certifiée des actions sensibles (suppressions de compte, tentatives non autorisées, règles serveur).
              </p>
            </div>
          </div>

          <button
            onClick={() => loadLogs(false)}
            disabled={loading}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 shadow-2xs transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualiser</span>
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="mt-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Rechercher par action, email, cible..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-pink-400"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Tous ({logs.length})
            </button>
            <button
              onClick={() => setStatusFilter('SUCCESS')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'SUCCESS'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              Succès
            </button>
            <button
              onClick={() => setStatusFilter('DENIED')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'DENIED'
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
              }`}
            >
              Refusés / Alertes ({deniedCount})
            </button>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-50/75 border-b border-gray-100 text-gray-500 font-semibold uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4">Horodatage</th>
              <th className="py-3 px-4">Action & Statut</th>
              <th className="py-3 px-4">Auteur (Acteur)</th>
              <th className="py-3 px-4">Cible</th>
              <th className="py-3 px-4">Détails & Métadonnées</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-gray-400">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-pink-500" />
                  <span>Chargement du journal d&apos;audit...</span>
                </td>
              </tr>
            ) : filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-gray-400">
                  <FileText className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <span>Aucun événement d&apos;audit trouvé.</span>
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => {
                const dateObj = new Date(log.created_at);
                const formattedDate = dateObj.toLocaleDateString('fr-FR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                });
                const badge = getActionBadge(log.action, log.status);
                const isExpanded = expandedLogId === log.id;

                return (
                  <tr key={log.id} className="hover:bg-gray-50/60 transition-colors">
                    {/* Timestamp */}
                    <td className="py-3 px-4 text-gray-500 whitespace-nowrap font-mono text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span>{formattedDate}</span>
                      </div>
                    </td>

                    {/* Action & Status */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-[10px] border ${badge.bg}`}
                        >
                          {badge.icon}
                          <span>{badge.label}</span>
                        </span>
                        <span
                          className={`font-black text-[10px] ${
                            log.status === 'SUCCESS' ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {log.status}
                        </span>
                      </div>
                    </td>

                    {/* Actor */}
                    <td className="py-3 px-4 text-gray-700">
                      {log.actor_email ? (
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span className="font-semibold">{log.actor_email}</span>
                          {log.actor_role && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-gray-100 text-gray-600 font-bold uppercase">
                              {log.actor_role}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">Non authentifié / Système</span>
                      )}
                    </td>

                    {/* Target */}
                    <td className="py-3 px-4 text-gray-600 font-mono text-[11px]">
                      {log.target_id ? (
                        <span className="truncate max-w-[140px] block" title={log.target_id}>
                          #{log.target_id.slice(0, 8)}...
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>

                    {/* Details */}
                    <td className="py-3 px-4">
                      {log.details && Object.keys(log.details).length > 0 ? (
                        <div>
                          <button
                            type="button"
                            onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-pink-600 hover:text-pink-700 cursor-pointer"
                          >
                            <span>
                              {isExpanded ? 'Masquer' : 'Voir métadonnées'} (
                              {Object.keys(log.details).length})
                            </span>
                            {isExpanded ? (
                              <ChevronUp className="w-3 h-3" />
                            ) : (
                              <ChevronDown className="w-3 h-3" />
                            )}
                          </button>
                          {isExpanded && (
                            <pre className="mt-1.5 p-2 rounded-xl bg-gray-900 text-gray-100 font-mono text-[10px] overflow-x-auto max-w-sm">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-[11px]">-</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
