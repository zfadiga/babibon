import React, { useState } from 'react';
import { X, Plus, Minus, ShoppingBag, Sparkles, CheckCircle2, Heart } from 'lucide-react';
import { CandyProduct, StoreSettings } from '../types/candy';
import { formatPrice, fireCandyConfetti } from '../utils/formatters';

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

  const totalPrice = candy.price * quantity;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
      />

      <div className="relative bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-pink-100 z-10">
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
          {!imageFailed && candy.imageUrl ? (
            <img
              src={candy.imageUrl}
              alt={candy.name}
              referrerPolicy="no-referrer"
              onError={() => setImageFailed(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className={`w-full h-full bg-gradient-to-tr ${candy.gradientBg} flex flex-col items-center justify-center`}
            >
              <span className="text-7xl mb-2 animate-float drop-shadow-md">
                {candy.emojiIcon || '🍬'}
              </span>
            </div>
          )}

          {/* Flavor Pill Overlay */}
          <div className="absolute bottom-3 left-4 flex gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold border shadow-xs tracking-tight ${candy.badgeColor}`}
            >
              {candy.flavorBadge}
            </span>
            {candy.weightGrams && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/90 text-slate-700 backdrop-blur-xs shadow-xs">
                {candy.weightGrams} grammes
              </span>
            )}
          </div>
        </div>

        {/* Body content */}
        <div className="p-6 space-y-4">
          <div>
            <h3 className="font-candy font-bold text-2xl text-slate-900 mb-1">
              {candy.name}
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              {candy.description}
            </p>
          </div>

          {/* Reassurances for parents and kids */}
          <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-pink-50/60 p-3 rounded-2xl border border-pink-100">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Arômes naturels de fruits</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>100% Fraîcheur garantie</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <span>Emballage hermétique</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span>Stock disponible ({candy.stock || 25})</span>
            </div>
          </div>

          {/* Quantity and Add to Cart Section */}
          <div className="pt-2 flex items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 block uppercase">
                Prix total
              </span>
              <span className="text-2xl font-candy font-bold text-pink-600 font-mono tabular-nums">
                {formatPrice(totalPrice, settings.currency, settings.eurToFcfaRate)}
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* Stepper */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-8 h-8 rounded-xl bg-white hover:bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-sm shadow-xs transition-colors cursor-pointer"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-8 text-center font-bold text-sm text-slate-800 font-mono tabular-nums">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-8 h-8 rounded-xl bg-pink-500 hover:bg-pink-600 text-white flex items-center justify-center font-bold text-sm shadow-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Action CTA */}
              <button
                type="button"
                onClick={handleAction}
                className="py-3 px-5 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold text-sm shadow-md shadow-pink-200 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{actionType === 'order' ? 'Commander' : 'Ajouter'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
