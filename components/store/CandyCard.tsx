'use client';

import React, { useState } from 'react';
import { Plus, Minus, ShoppingBag, Info, Flame, Sparkles } from 'lucide-react';
import { CandyProduct, StoreSettings } from '@/types/candy';
import { formatPrice, fireCandyConfetti } from '@/utils/formatters';

interface CandyCardProps {
  candy: CandyProduct;
  cartQuantity: number;
  onAddToCart: (candy: CandyProduct) => void;
  onUpdateQuantity: (candyId: string | number, delta: number) => void;
  onOpenDetails: (candy: CandyProduct) => void;
  settings: StoreSettings;
  actionType?: 'add' | 'order';
  onOrderClick?: (candy: CandyProduct) => void;
}

export const CandyCard: React.FC<CandyCardProps> = ({
  candy,
  cartQuantity,
  onAddToCart,
  onUpdateQuantity,
  onOpenDetails,
  settings,
  actionType = 'add',
  onOrderClick,
}) => {
  const [imageFailed, setImageFailed] = useState(false);
  const [isBouncing, setIsBouncing] = useState(false);

  const candyImage = candy.imageUrl || candy.image_url;

  const handleAdd = () => {
    setIsBouncing(true);
    fireCandyConfetti();
    onAddToCart(candy);
    setTimeout(() => setIsBouncing(false), 300);
  };

  return (
    <div className="group relative bg-white rounded-3xl border border-pink-100 shadow-sm hover:shadow-xl hover:shadow-pink-100/60 transition-all duration-300 flex flex-col overflow-hidden hover:-translate-y-1">
      {/* Decorative Badges (Popular / New / Flavor) */}
      <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
        <span
          className={`px-3 py-1 rounded-full text-xs font-bold border shadow-2xs tracking-tight ${
            candy.badgeColor || 'bg-pink-100 text-pink-800 border-pink-200'
          }`}
        >
          {candy.flavorBadge || 'Bonbon ✨'}
        </span>

        {candy.isNew && (
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-white text-[11px] font-extrabold uppercase tracking-wide shadow-2xs flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Nouveau
          </span>
        )}
        {!candy.isNew && candy.isPopular && (
          <span className="px-2.5 py-0.5 rounded-full bg-rose-500 text-white text-[11px] font-extrabold uppercase tracking-wide shadow-2xs flex items-center gap-1">
            <Flame className="w-3 h-3" /> Top Vente
          </span>
        )}
      </div>

      {/* Visual Image container with Resilient Fallback */}
      <div
        onClick={() => onOpenDetails(candy)}
        className="relative h-48 sm:h-52 w-full bg-gradient-to-tr from-pink-100 via-rose-50 to-amber-50 overflow-hidden cursor-pointer flex items-center justify-center p-4"
      >
        {candyImage && !imageFailed ? (
          <img
            src={candyImage}
            alt={candy.name}
            onError={() => setImageFailed(true)}
            className="w-full h-full object-cover rounded-2xl group-hover:scale-108 transition-transform duration-500 ease-out"
            loading="lazy"
          />
        ) : (
          <div
            className={`w-full h-full rounded-2xl flex flex-col items-center justify-center text-5xl bg-gradient-to-tr ${
              candy.gradientBg || 'from-pink-200 via-rose-100 to-amber-100'
            }`}
          >
            <span>{candy.emojiIcon || '🍬'}</span>
          </div>
        )}

        {/* Quick detail trigger overlay button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenDetails(candy);
          }}
          className="absolute bottom-3 right-3 p-2 rounded-xl bg-white/90 backdrop-blur-md text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:text-pink-600 hover:bg-white shadow-md cursor-pointer"
          title="Voir la description complète"
        >
          <Info className="w-4 h-4" />
        </button>
      </div>

      {/* Card Body */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          <h3
            onClick={() => onOpenDetails(candy)}
            className="font-candy font-bold text-base sm:text-lg text-slate-900 line-clamp-1 group-hover:text-pink-600 transition-colors cursor-pointer"
          >
            {candy.name}
          </h3>
          <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
            {candy.description}
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-pink-50 flex items-center justify-between gap-2">
          {/* Price */}
          <div>
            <span className="text-xs text-slate-400 block font-medium">Prix unitaire</span>
            <span className="text-base sm:text-lg font-candy font-extrabold text-pink-600">
              {formatPrice(candy.price, settings.currency, settings.eurToFcfaRate)}
            </span>
          </div>

          {/* Add to Cart / Quantity Modifier */}
          {actionType === 'order' ? (
            <button
              onClick={() => onOrderClick && onOrderClick(candy)}
              className="px-3.5 py-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-candy font-bold text-xs shadow-md shadow-emerald-200 transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <span>Commander</span>
            </button>
          ) : cartQuantity > 0 ? (
            <div className="flex items-center gap-1.5 bg-pink-50 p-1 rounded-2xl border border-pink-200">
              <button
                onClick={() => onUpdateQuantity(candy.id, -1)}
                className="w-7 h-7 rounded-xl bg-white hover:bg-pink-100 text-pink-700 flex items-center justify-center font-bold text-sm shadow-2xs transition-colors cursor-pointer active:scale-90"
                title="Diminuer la quantité"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="min-w-6 text-center font-bold text-xs text-pink-900">
                {cartQuantity}
              </span>
              <button
                onClick={() => onUpdateQuantity(candy.id, 1)}
                className="w-7 h-7 rounded-xl bg-pink-500 hover:bg-pink-600 text-white flex items-center justify-center font-bold text-sm shadow-2xs transition-colors cursor-pointer active:scale-90"
                title="Augmenter la quantité"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleAdd}
              className={`p-2.5 px-3.5 rounded-2xl bg-pink-50 hover:bg-pink-500 text-pink-600 hover:text-white font-candy font-bold text-xs transition-all duration-200 flex items-center gap-1.5 border border-pink-200 hover:border-pink-500 hover:shadow-md hover:shadow-pink-200 cursor-pointer active:scale-95 ${
                isBouncing ? 'scale-90' : ''
              }`}
              title="Ajouter au panier"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Ajouter</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
