import React, { useState } from 'react';
import { Plus, Minus, ShoppingBag, Info, Flame, Sparkles } from 'lucide-react';
import { CandyProduct, StoreSettings } from '../types/candy';
import { formatPrice, fireCandyConfetti } from '../utils/formatters';

interface CandyCardProps {
  candy: CandyProduct;
  cartQuantity: number;
  onAddToCart: (candy: CandyProduct) => void;
  onUpdateQuantity: (candyId: string, delta: number) => void;
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
          className={`px-3 py-1 rounded-full text-xs font-bold border shadow-xs tracking-tight ${candy.badgeColor}`}
        >
          {candy.flavorBadge}
        </span>

        {candy.isNew && (
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-white text-[11px] font-extrabold uppercase tracking-wide shadow-xs flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Nouveau
          </span>
        )}
        {!candy.isNew && candy.isPopular && (
          <span className="px-2.5 py-0.5 rounded-full bg-rose-500 text-white text-[11px] font-extrabold uppercase tracking-wide shadow-xs flex items-center gap-1">
            <Flame className="w-3 h-3" /> Top Vente
          </span>
        )}
      </div>

      {/* Visual Image container with Resilient Fallback */}
      <div
        onClick={() => onOpenDetails(candy)}
        className="relative h-48 sm:h-52 w-full overflow-hidden cursor-pointer bg-gradient-to-br from-pink-50 via-rose-50 to-amber-50 flex items-center justify-center p-3"
      >
        {!imageFailed && candy.imageUrl ? (
          <img
            src={candy.imageUrl}
            alt={candy.name}
            referrerPolicy="no-referrer"
            onError={() => setImageFailed(true)}
            className="w-full h-full object-cover rounded-2xl group-hover:scale-108 transition-transform duration-500 ease-out"
          />
        ) : (
          <div
            className={`w-full h-full rounded-2xl bg-gradient-to-tr ${candy.gradientBg} flex flex-col items-center justify-center text-center p-4 shadow-inner`}
          >
            <span className="text-6xl mb-2 drop-shadow-md animate-float">
              {candy.emojiIcon || '🍬'}
            </span>
            <span className="text-xs font-bold text-slate-700 max-w-[150px] truncate">
              {candy.name}
            </span>
          </div>
        )}

        {/* Quick View Button on Hover */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenDetails(candy);
          }}
          className="absolute bottom-3 right-3 p-2 rounded-xl bg-white/90 backdrop-blur-md text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-white hover:text-pink-600"
          title="Voir la fiche détaillée"
          aria-label="Voir la fiche détaillée"
        >
          <Info className="w-4 h-4" />
        </button>
      </div>

      {/* Content Area */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-baseline justify-between gap-2 mb-1.5">
            <h3
              onClick={() => onOpenDetails(candy)}
              className="font-candy font-bold text-base sm:text-lg text-slate-900 line-clamp-1 hover:text-pink-600 transition-colors cursor-pointer"
            >
              {candy.name}
            </h3>
          </div>

          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">
            {candy.description}
          </p>
        </div>

        {/* Pricing & Add to Cart Controls */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
              {candy.weightGrams ? `${candy.weightGrams}g de douceur` : 'Sachet gourmand'}
            </span>
            <span className="text-base sm:text-lg font-bold text-pink-600 font-mono tabular-nums">
              {formatPrice(candy.price, settings.currency, settings.eurToFcfaRate)}
            </span>
          </div>

          {actionType === 'order' ? (
            <button
              onClick={() => (onOrderClick ? onOrderClick(candy) : handleAdd())}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold text-xs shadow-md shadow-pink-200 hover:shadow-lg active:scale-95 transition-all cursor-pointer"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Commander</span>
            </button>
          ) : cartQuantity === 0 ? (
            <button
              onClick={handleAdd}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold text-xs shadow-md shadow-pink-200 hover:shadow-lg active:scale-95 transition-all cursor-pointer ${
                isBouncing ? 'scale-110' : ''
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Ajouter</span>
            </button>
          ) : (
            <div className="flex items-center gap-1 bg-pink-50 border border-pink-200 rounded-2xl p-1 shadow-xs">
              <button
                onClick={() => onUpdateQuantity(candy.id, -1)}
                className="w-7 h-7 rounded-xl bg-white hover:bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-xs transition-colors cursor-pointer shadow-xs active:scale-90"
                aria-label="Diminuer la quantité"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-7 text-center font-bold text-sm text-pink-900 font-mono tabular-nums">
                {cartQuantity}
              </span>
              <button
                onClick={() => onUpdateQuantity(candy.id, 1)}
                className="w-7 h-7 rounded-xl bg-pink-500 hover:bg-pink-600 text-white flex items-center justify-center font-bold text-xs transition-colors cursor-pointer shadow-xs active:scale-90"
                aria-label="Augmenter la quantité"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
