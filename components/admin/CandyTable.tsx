'use client';

import React, { useState } from 'react';
import { Candy } from '@/types';
import { deleteCandy } from '@/lib/api';
import {
  Trash2,
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
  Loader2,
  Package,
} from 'lucide-react';
import { formatPrice } from '@/utils/formatters';

interface CandyTableProps {
  candies: Candy[];
  loading: boolean;
  onRefresh: () => void;
}

export default function CandyTable({ candies, loading, onRefresh }: CandyTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [deletingId, setDeletingId] = useState<string | number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [candyToDelete, setCandyToDelete] = useState<Candy | null>(null);

  const safeCandies = Array.isArray(candies) ? candies : [];
  const categories = ['all', ...Array.from(new Set(safeCandies.map((c) => c?.category).filter(Boolean)))];

  const filteredCandies = safeCandies.filter((candy) => {
    if (!candy) return false;
    const matchesSearch =
      (candy.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (candy.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' || candy.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const confirmDelete = async () => {
    if (!candyToDelete) return;

    setDeletingId(candyToDelete.id);
    setErrorMsg(null);

    try {
      await deleteCandy(candyToDelete.id);
      setCandyToDelete(null);
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Impossible de supprimer la friandise.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden animate-fade-in">
      {/* Table Header and Controls */}
      <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
            <span>Catalogue des friandises</span>
            <span className="text-xs bg-rose-100 text-rose-800 font-semibold px-2.5 py-0.5 rounded-full">
              {filteredCandies.length} article{filteredCandies.length > 1 ? 's' : ''}
            </span>
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Gérez vos bonbons en stock et supprimez les références obsolètes
          </p>
        </div>

        {/* Search, Filter & Refresh */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 w-48 sm:w-60"
            />
          </div>

          {/* Category Filter */}
          <div className="relative">
            <Filter className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="pl-9 pr-8 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'Toutes catégories' : cat}
                </option>
              ))}
            </select>
          </div>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
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
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/80 border-b border-gray-100 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
              <th className="py-3.5 px-6">Friandise</th>
              <th className="py-3.5 px-6">Catégorie</th>
              <th className="py-3.5 px-6">Prix</th>
              <th className="py-3.5 px-6">Stock</th>
              <th className="py-3.5 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {loading && filteredCandies.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-gray-400">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-rose-500 mb-2" />
                  <span>Chargement du catalogue...</span>
                </td>
              </tr>
            ) : filteredCandies.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-gray-400">
                  <Package className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                  <p className="font-semibold text-gray-600">Aucun bonbon trouvé</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Essayez de modifier votre recherche ou ajoutez un nouveau bonbon ci-dessus.
                  </p>
                </td>
              </tr>
            ) : (
              filteredCandies.map((candy) => {
                const img = candy.image_url || candy.imageUrl;
                return (
                  <tr key={candy.id} className="hover:bg-gray-50/50 transition-colors">
                    {/* Candy image & name */}
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-xl bg-gray-100 border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center">
                          {img ? (
                            <img
                              src={img}
                              alt={candy.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <span className="text-xl">{candy.emojiIcon || '🍬'}</span>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 line-clamp-1">
                            {candy.name}
                          </p>
                          <p className="text-xs text-gray-400 line-clamp-1 max-w-xs">
                            {candy.description || 'Sans description'}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                        {candy.category || 'Général'}
                      </span>
                    </td>

                    {/* Price */}
                    <td className="py-4 px-6 font-bold text-rose-600">
                      {formatPrice(candy.price)}
                    </td>

                    {/* Stock */}
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          candy.stock > 10
                            ? 'bg-emerald-100 text-emerald-800'
                            : candy.stock > 0
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {candy.stock > 0 ? `${candy.stock} en stock` : 'Rupture'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => setCandyToDelete(candy)}
                        disabled={deletingId === candy.id}
                        className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                        title="Supprimer la friandise"
                      >
                        {deletingId === candy.id ? (
                          <Loader2 className="w-4 h-4 animate-spin text-rose-600" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      {candyToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div
            onClick={() => setCandyToDelete(null)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
          />

          <div className="relative bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl border border-gray-100 z-10 animate-fade-in">
            <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <h3 className="text-lg font-bold text-gray-900 mb-1">
              Supprimer cette friandise ?
            </h3>
            <p className="text-xs text-gray-500 mb-6 leading-relaxed">
              Êtes-vous sûr de vouloir supprimer{' '}
              <strong className="text-gray-800">&quot;{candyToDelete.name}&quot;</strong> du catalogue ?
              Cette action est irréversible.
            </p>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setCandyToDelete(null)}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-rose-200 transition-colors cursor-pointer"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
