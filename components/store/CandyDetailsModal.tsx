'use client';

import React, { useState } from 'react';
import { X, Plus, Minus, ShoppingBag, Sparkles, CheckCircle2 } from 'lucide-react';
import { CandyProduct, StoreSettings } from '@/types/candy';
import { formatPrice, fireCandyConfetti } from '@/utils/formatters';

interface CandyDetailsModalProps {
  candy: CandyProduct | null;
  onClose: () => void;
  onAddToCart: (candy: CandyProduct, quantity: number) => void;
  settings: StoreSettings;
  actionType?: 'add' | 'order';
  onOrder?: (candy: CandyProduct, quantity: number) => void;
}

export const CandyDetailsModal: React.FC<CandyDetailsModalProps> = ({
  candy,
  onClose,
  onAddToCart,
  settings,
  actionType = 'add',
  onOrder,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [imageFailed, setImageFailed] = useState(false);

  if (!candy) return null;

  const handleAction = () => {
    if (actionType === 'order' && onOrder) {
      onOrder(candy, quantity);
      onClose();
    } else {
      fireCandyConfetti();
      onAddToCart(candy, quantity);
      onClose();
    }
  };

  const candyImage = candy.imageUrl || candy.image_url;
  const totalPrice = candy.price * quantity;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
      />

      <div className="relative bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-pink-100 z-10 animate-fade-in">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-20 p-2 rounded-full bg-white/80 backdrop-blur-md text-slate-700 hover:text-rose-600 hover:bg-white transition-all shadow-sm cursor-pointer"
          aria-label="Fermer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Media Banner */}
        <div className="relative h-64 w-full bg-gradient-to-tr from-pink-100 via-rose-50 to-amber-50 overflow-hidden flex items-center justify-center">
          {candyImage && !imageFailed ? (
            <img
              src={candyImage}
              alt={candy.name}
              onError={() => setImageFailed(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className={`w-full h-full flex flex-col items-center justify-center text-7xl bg-gradient-to-tr ${
                candy.gradientBg || 'from-pink-200 via-rose-100 to-amber-100'
              }`}
            >
              <span>{candy.emojiIcon || '🍭'}</span>
            </div>
          )}

          {/* Flavor Pill on top */}
          <div className="absolute bottom-3 left-4">
            <span
              className={`px-3.5 py-1 rounded-full text-xs font-bold border shadow-md backdrop-blur-md ${
                candy.badgeColor || 'bg-white/90 text-pink-700 border-pink-200'
              }`}
            >
              {candy.flavorBadge || 'Gourmandise ✨'}
            </span>
          </div>
        </div>

        {/* Content Details */}
        <div className="p-6">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-candy font-bold text-slate-900 leading-tight">
                {candy.name}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-medium text-pink-600 bg-pink-50 px-2 py-0.5 rounded-full border border-pink-200">
                  {candy.category}
                </span>
                {candy.weightGrams && (
                  <span className="text-xs text-slate-500 font-medium">
                    Sachet de {candy.weightGrams}g
                  </span>
                )}
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-xs text-slate-400 block font-medium">Prix unitaire</span>
              <span className="text-xl font-candy font-extrabold text-pink-600">
                {formatPrice(candy.price, settings.currency, settings.eurToFcfaRate)}
              </span>
            </div>
          </div>

          <p className="text-slate-600 text-sm leading-relaxed mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            {candy.description}
          </p>

          {/* Quantity Selector & Action Button */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 border-t border-pink-100">
            {/* Quantity Controls */}
            <div className="flex items-center justify-between w-full sm:w-auto gap-3 bg-pink-50/70 p-1.5 rounded-2xl border border-pink-200">
              <button
                onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                className="w-10 h-10 rounded-xl bg-white hover:bg-pink-100 text-pink-700 flex items-center justify-center font-bold text-base shadow-2xs transition-colors cursor-pointer active:scale-95"
                title="Diminuer la quantité"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="font-candy font-bold text-lg text-pink-900 min-w-8 text-center">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity((prev) => prev + 1)}
                className="w-10 h-10 rounded-xl bg-pink-500 hover:bg-pink-600 text-white flex items-center justify-center font-bold text-base shadow-2xs transition-colors cursor-pointer active:scale-95"
                title="Augmenter la quantité"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Action Trigger Button */}
            <button
              onClick={handleAction}
              className="w-full sm:flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-candy font-bold text-sm sm:text-base shadow-lg shadow-pink-200 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <ShoppingBag className="w-5 h-5" />
              <span>
                {actionType === 'order' ? 'Commander' : 'Ajouter au Panier'} (
                {formatPrice(totalPrice, settings.currency, settings.eurToFcfaRate)})
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
