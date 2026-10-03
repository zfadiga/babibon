'use client';

import React from 'react';
import Link from 'next/link';
import { X, Trash2, Plus, Minus, ShoppingBag, Sparkles, MessageCircle, ArrowRight } from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { formatPrice } from '@/utils/formatters';

export const CartDrawer: React.FC = () => {
  const {
    isCartDrawerOpen,
    setIsCartDrawerOpen,
    cart,
    updateQuantity,
    removeFromCart,
    clearCart,
    settings,
    setIsWhatsAppModalOpen,
  } = useStore();

  if (!isCartDrawerOpen) return null;

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
        onClick={() => setIsCartDrawerOpen(false)}
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity duration-300"
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col h-full border-l border-pink-100 animate-fade-in">
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
                <p className="text-xs text-slate-500">
                  {totalItemsCount} friandise{totalItemsCount > 1 ? 's' : ''} ({cart.length} variété{cart.length > 1 ? 's' : ''})
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsCartDrawerOpen(false)}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Delivery Bar */}
          <div className="px-5 py-3 bg-pink-50/60 border-b border-pink-100/70 text-xs">
            <div className="flex items-center justify-between font-bold text-slate-700 mb-1.5">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-pink-500" />
                {isFreeDelivery ? (
                  <span className="text-emerald-700">Livraison offerte débloquée ! 🎉</span>
                ) : (
                  <span>
                    Plus que{' '}
                    <strong className="text-pink-600 font-extrabold">
                      {formatPrice(amountRemainingForFreeDelivery, settings.currency, settings.eurToFcfaRate)}
                    </strong>{' '}
                    pour la livraison offerte !
                  </span>
                )}
              </span>
              <span className="text-pink-600 font-bold">{freeDeliveryProgress}%</span>
            </div>
            <div className="w-full bg-pink-200/80 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-pink-500 to-rose-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${freeDeliveryProgress}%` }}
              />
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {cart.length === 0 ? (
              <div className="text-center py-16 px-4 flex flex-col items-center justify-center">
                <div className="w-20 h-20 rounded-3xl bg-pink-50 text-pink-400 flex items-center justify-center text-4xl mb-4 border border-pink-100">
                  🍭
                </div>
                <h3 className="font-candy font-bold text-lg text-slate-800">
                  Ton panier est tout vide !
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  Ajoute tes friandises préférées depuis la boutique pour préparer ta commande gourmande.
                </p>
                <button
                  onClick={() => setIsCartDrawerOpen(false)}
                  className="mt-6 px-6 py-2.5 rounded-2xl bg-pink-500 text-white font-candy font-bold text-xs shadow-md shadow-pink-200 hover:bg-pink-600 transition-all cursor-pointer"
                >
                  Découvrir les bonbons ✨
                </button>
              </div>
            ) : (
              cart.map((item) => {
                const itemImage = item.candy.imageUrl || item.candy.image_url;
                return (
                  <div
                    key={item.candy.id}
                    className="p-3.5 rounded-2xl border border-pink-100 bg-white hover:border-pink-200 transition-all flex items-center gap-3.5 shadow-2xs"
                  >
                    <div className="w-16 h-16 rounded-xl bg-pink-50 overflow-hidden shrink-0 flex items-center justify-center border border-pink-100">
                      {itemImage ? (
                        <img
                          src={itemImage}
                          alt={item.candy.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-2xl">{item.candy.emojiIcon || '🍬'}</span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="font-candy font-bold text-sm text-slate-900 truncate">
                        {item.candy.name}
                      </h4>
                      <p className="text-xs text-pink-600 font-extrabold mt-0.5">
                        {formatPrice(item.candy.price, settings.currency, settings.eurToFcfaRate)}
                      </p>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex items-center border border-pink-200 rounded-xl bg-pink-50/50 p-0.5">
                          <button
                            onClick={() => updateQuantity(item.candy.id, -1)}
                            className="w-6 h-6 rounded-lg bg-white hover:bg-pink-100 text-pink-700 flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-7 text-center font-bold text-xs text-slate-800">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.candy.id, 1)}
                            className="w-6 h-6 rounded-lg bg-pink-500 hover:bg-pink-600 text-white flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <button
                          onClick={() => removeFromCart(item.candy.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors ml-auto cursor-pointer"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Checkout Summary */}
          {cart.length > 0 && (
            <div className="p-5 border-t border-pink-100 bg-pink-50/30 space-y-3">
              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Sous-total</span>
                  <span className="font-bold text-slate-800">
                    {formatPrice(subtotal, settings.currency, settings.eurToFcfaRate)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Livraison</span>
                  <span className="font-bold">
                    {isFreeDelivery ? (
                      <span className="text-emerald-600 font-extrabold">Gratuite</span>
                    ) : (
                      formatPrice(deliveryCost, settings.currency, settings.eurToFcfaRate)
                    )}
                  </span>
                </div>
                <div className="border-t border-pink-100 pt-2 flex justify-between text-sm sm:text-base font-bold text-slate-900">
                  <span className="font-candy">Total à payer</span>
                  <span className="font-candy text-pink-600 text-lg">
                    {formatPrice(grandTotal, settings.currency, settings.eurToFcfaRate)}
                  </span>
                </div>
              </div>

              {/* Order via WhatsApp */}
              <button
                onClick={() => {
                  setIsCartDrawerOpen(false);
                  setIsWhatsAppModalOpen(true);
                }}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-candy font-bold text-sm shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <MessageCircle className="w-5 h-5" />
                <span>Commander sur WhatsApp</span>
              </button>

              <Link
                href="/cart"
                onClick={() => setIsCartDrawerOpen(false)}
                className="w-full py-2 text-center text-xs font-bold text-pink-600 hover:text-pink-700 flex items-center justify-center gap-1 cursor-pointer"
              >
                <span>Voir la page complète du panier</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
