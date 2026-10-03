'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { StoreNavbar } from '@/components/store/Navbar';
import { CandyCard } from '@/components/store/CandyCard';
import { useStore } from '@/context/StoreContext';
import { CATEGORY_INFO } from '@/data/defaultCandies';
import {
  Search,
  Sparkles,
} from 'lucide-react';
import { CandyProduct } from '@/types/candy';

export default function StoreHomePage() {
  const {
    candies,
    cart,
    addToCart,
    updateQuantity,
    setSelectedCandyForDetails,
    settings,
    setIsWhatsAppModalOpen,
  } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'popular' | 'price-asc' | 'price-desc' | 'name'>('popular');

  // Filtered and sorted candies
  const filteredCandies = useMemo(() => {
    return candies
      .filter((candy) => {
        const matchesCategory =
          selectedCategory === 'all' ||
          candy.category?.toLowerCase() === selectedCategory.toLowerCase();

        const query = searchQuery.toLowerCase().trim();
        const matchesSearch =
          !query ||
          candy.name.toLowerCase().includes(query) ||
          candy.description.toLowerCase().includes(query) ||
          (candy.flavorBadge && candy.flavorBadge.toLowerCase().includes(query));

        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return a.price - b.price;
        if (sortBy === 'price-desc') return b.price - a.price;
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        // Popular default
        if (a.isPopular && !b.isPopular) return -1;
        if (!a.isPopular && b.isPopular) return 1;
        return 0;
      });
  }, [candies, selectedCategory, searchQuery, sortBy]);

  const getCartQuantity = (candyId: string | number) => {
    const item = cart.find((i) => String(i.candy.id) === String(candyId));
    return item ? item.quantity : 0;
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FFF9FB]">
      <StoreNavbar />

      <main className="flex-1">
        {/* CATALOG SECTION */}
        <section id="catalog" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-100 text-rose-700 text-xs font-bold mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Nos Trésors Sucrés</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-candy font-extrabold text-slate-900 tracking-tight">
                Toutes nos friandises en rayon
              </h2>
              <p className="text-slate-500 text-xs sm:text-sm mt-1">
                Fais ton choix parmi nos bonbons festifs et prépare ton panier
              </p>
            </div>

            {/* Live Search and Sort Controls */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Search input */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Rechercher un bonbon..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-pink-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-400 shadow-2xs"
                />
              </div>

              {/* Sort By Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3.5 py-2.5 rounded-2xl bg-white border border-pink-200 text-xs sm:text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-pink-400 shadow-2xs cursor-pointer"
              >
                <option value="popular">⭐ Populaire d'abord</option>
                <option value="price-asc">Prix croissant</option>
                <option value="price-desc">Prix décroissant</option>
                <option value="name">Ordre alphabétique</option>
              </select>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none">
            {CATEGORY_INFO.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-candy font-bold whitespace-nowrap transition-all duration-200 flex items-center gap-2 cursor-pointer shadow-2xs active:scale-95 ${
                    isSelected
                      ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md shadow-pink-200 scale-105'
                      : 'bg-white hover:bg-pink-50 text-slate-700 border border-pink-100 hover:border-pink-200'
                  }`}
                >
                  <span className="text-base">{cat.emoji}</span>
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Candies Grid */}
          {filteredCandies.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center max-w-md mx-auto border border-pink-100 shadow-sm animate-fade-in">
              <div className="w-20 h-20 rounded-3xl bg-pink-50 text-pink-400 flex items-center justify-center text-4xl mx-auto mb-4">
                🔍
              </div>
              <h3 className="font-candy font-bold text-lg text-slate-800">
                Aucun bonbon trouvé
              </h3>
              <p className="text-xs text-slate-500 mt-1 mb-6">
                Aucune friandise ne correspond à votre recherche &quot;{searchQuery}&quot;.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="px-5 py-2.5 rounded-xl bg-pink-500 text-white font-candy font-bold text-xs shadow-md shadow-pink-200 hover:bg-pink-600 transition-colors cursor-pointer"
              >
                Réinitialiser les filtres
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-fade-in">
              {filteredCandies.map((candy) => (
                <CandyCard
                  key={candy.id}
                  candy={candy}
                  cartQuantity={getCartQuantity(candy.id)}
                  onAddToCart={(c) => addToCart(c, 1)}
                  onUpdateQuantity={(id, delta) => updateQuantity(id, delta)}
                  onOpenDetails={(c) => setSelectedCandyForDetails(c)}
                  settings={settings}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t border-pink-100 mt-16 py-10 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3 text-center md:text-left">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 to-amber-400 flex items-center justify-center text-xl text-white shadow-md shadow-pink-200">
              🍭
            </div>
            <div>
              <p className="font-candy font-bold text-base text-slate-800">
                BonbonMagique - Confiserie Enchanteresse
              </p>
              <p className="text-[11px] text-slate-400">
                Commandes directes WhatsApp &bull; Abidjan, Côte d'Ivoire
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 font-semibold">
            <Link href="/" className="hover:text-pink-600 transition-colors">
              Boutique
            </Link>
            <Link href="/cart" className="hover:text-pink-600 transition-colors">
              Mon Panier
            </Link>
            <Link href="/orders" className="hover:text-pink-600 transition-colors">
              Mes Commandes
            </Link>
          </div>

          <p className="text-slate-400 text-center md:text-right">
            &copy; 2026 {settings.storeName}. Tous droits réservés.
          </p>
        </div>
      </footer>
    </div>
  );
}
