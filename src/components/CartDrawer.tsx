import React from 'react';
import { X, Trash2, Plus, Minus, ShoppingBag, Sparkles, MessageCircle, ArrowRight } from 'lucide-react';
import { CartItem, StoreSettings } from '../types/candy';
import { formatPrice } from '../utils/formatters';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQuantity: (candyId: string, delta: number) => void;
  onRemoveItem: (candyId: string) => void;
  onClearCart: () => void;
  onProceedWhatsApp: () => void;
  settings: StoreSettings;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onProceedWhatsApp,
  settings,
}) => {
  if (!isOpen) return null;

  const subtotal = cart.reduce((sum, item) => sum + item.candy.price * item.quantity, 0);
  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const isFreeDelivery = subtotal >= settings.freeDeliveryThreshold;
  const deliveryCost = isFreeDelivery ? 0 : settings.deliveryFee;
  const grandTotal = subtotal + deliveryCost;

  const amountRemainingForFreeDelivery = Math.max(0, settings.freeDeliveryThreshold - subtotal);
  const freeDeliveryProgress = Math.min(
    100,
    Math.round((subtotal / settings.freeDeliveryThreshold) * 100)
  );

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity duration-300"
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col h-full border-l border-pink-100">
          {/* Header */}
          <div className="p-5 border-b border-pink-100 flex items-center justify-between bg-gradient-to-r from-pink-50 via-rose-50 to-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-pink-500 text-white flex items-center justify-center shadow-md shadow-pink-200">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-candy font-bold text-lg text-slate-900">
                  Mon Panier Magique
                </h2>
                <p className="text-xs text-pink-600 font-medium">
                  {totalItemsCount} {totalItemsCount > 1 ? 'bonbons choisis' : 'bonbon choisi'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Fermer le panier"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free delivery playful progress meter */}
          <div className="px-5 py-3 bg-amber-50/70 border-b border-amber-100">
            <div className="flex items-center justify-between text-xs font-bold text-amber-900 mb-1.5">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                {isFreeDelivery ? (
                  <span className="text-emerald-700">Youpi ! Livraison gratuite débloquée 🎉</span>
                ) : (
                  <span>
                    Plus que{' '}
                    <strong className="text-pink-600 font-mono">
                      {formatPrice(amountRemainingForFreeDelivery, settings.currency, settings.eurToFcfaRate)}
                    </strong>{' '}
                    pour la livraison offerte !
                  </span>
                )}
              </span>
              <span className="font-mono text-[11px] text-amber-700">{freeDeliveryProgress}%</span>
            </div>
            <div className="w-full h-2 bg-amber-200/60 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-pink-500 rounded-full transition-all duration-500"
                style={{ width: `${freeDeliveryProgress}%` }}
              />
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="w-24 h-24 rounded-full bg-pink-50 border-2 border-dashed border-pink-200 flex items-center justify-center text-5xl animate-bounce">
                  🍭
                </div>
                <div>
                  <h3 className="font-candy font-bold text-lg text-slate-800 mb-1">
                    Ton panier est encore vide !
                  </h3>
                  <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                    Choisis tes bonbons préférés dans notre confiserie enchantée pour remplir ton panier.
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-2xl bg-pink-500 hover:bg-pink-600 text-white font-bold text-xs shadow-md shadow-pink-200 active:scale-95 transition-all cursor-pointer"
                >
                  Découvrir les bonbons ✨
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Articles
                  </span>
                  <button
                    onClick={onClearCart}
                    className="text-xs text-slate-400 hover:text-rose-600 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Vider le panier</span>
                  </button>
                </div>

                {cart.map((item) => {
                  const itemTotal = item.candy.price * item.quantity;
                  return (
                    <div
                      key={item.candy.id}
                      className="flex items-center gap-3 p-3 rounded-2xl bg-pink-50/40 border border-pink-100/80 hover:border-pink-200 transition-all"
                    >
                      {/* Thumbnail with fallback */}
                      <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-white border border-pink-100 flex items-center justify-center">
                        {item.candy.imageUrl ? (
                          <img
                            src={item.candy.imageUrl}
                            alt={item.candy.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <span className="text-2xl">{item.candy.emojiIcon || '🍬'}</span>
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-candy font-bold text-sm text-slate-900 truncate">
                          {item.candy.name}
                        </h4>
                        <span className="text-xs text-slate-500 font-mono">
                          {formatPrice(item.candy.price, settings.currency, settings.eurToFcfaRate)} unitaire
                        </span>

                        <div className="flex items-center justify-between mt-2">
                          {/* Stepper */}
                          <div className="flex items-center gap-1 bg-white border border-pink-200 rounded-xl p-0.5 shadow-2xs">
                            <button
                              onClick={() => onUpdateQuantity(item.candy.id, -1)}
                              className="w-6 h-6 rounded-lg bg-pink-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-xs transition-colors cursor-pointer"
                              aria-label="Diminuer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-6 text-center font-bold text-xs text-slate-800 font-mono tabular-nums">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => onUpdateQuantity(item.candy.id, 1)}
                              className="w-6 h-6 rounded-lg bg-pink-500 hover:bg-pink-600 text-white flex items-center justify-center font-bold text-xs transition-colors cursor-pointer"
                              aria-label="Augmenter"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          {/* Line total */}
                          <span className="font-bold text-sm text-pink-600 font-mono tabular-nums">
                            {formatPrice(itemTotal, settings.currency, settings.eurToFcfaRate)}
                          </span>
                        </div>
                      </div>

                      {/* Remove item button */}
                      <button
                        onClick={() => onRemoveItem(item.candy.id)}
                        className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors cursor-pointer"
                        title="Retirer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </>
            )}
          </div>

          {/* Footer Checkout Summary */}
          {cart.length > 0 && (
            <div className="p-5 border-t border-pink-100 bg-white space-y-3">
              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Sous-total</span>
                  <span className="font-bold text-slate-800 font-mono tabular-nums">
                    {formatPrice(subtotal, settings.currency, settings.eurToFcfaRate)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Frais de livraison</span>
                  <span className="font-bold font-mono tabular-nums">
                    {isFreeDelivery ? (
                      <span className="text-emerald-600 font-bold uppercase">Gratuit ✨</span>
                    ) : (
                      formatPrice(deliveryCost, settings.currency, settings.eurToFcfaRate)
                    )}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-100 flex justify-between items-baseline text-base">
                  <span className="font-candy font-bold text-slate-900">Total à payer</span>
                  <span className="font-candy font-bold text-xl text-pink-600 font-mono tabular-nums">
                    {formatPrice(grandTotal, settings.currency, settings.eurToFcfaRate)}
                  </span>
                </div>
              </div>

              {/* Big WhatsApp CTA Button */}
              <button
                onClick={onProceedWhatsApp}
                className="w-full py-3.5 px-4 rounded-2xl bg-[#25D366] hover:bg-[#20BD5A] text-white font-bold text-sm shadow-lg shadow-emerald-200/70 hover:shadow-xl hover:shadow-emerald-300 active:scale-98 transition-all flex items-center justify-center gap-2.5 cursor-pointer group"
              >
                <MessageCircle className="w-5 h-5 fill-white text-[#25D366]" />
                <span>Commander sur WhatsApp</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <p className="text-[11px] text-center text-slate-400">
                🔒 Ta commande sera directement transmise au gérant sur WhatsApp pour être préparée avec amour !
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
