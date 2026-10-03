'use client';

import React from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  Sparkles,
  MessageCircle,
  ArrowLeft,
  ShieldCheck,
} from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { formatPrice } from '@/utils/formatters';

export const CartView: React.FC = () => {
  const {
    cart,
    currentUser,
    settings,
    updateQuantity,
    removeFromCart,
    clearCart,
    setIsWhatsAppModalOpen,
    setIsLoginOpen,
    setIsSignupOpen,
    setSelectedCandyForDetails,
  } = useStore();

  const distinctCandyTypes = cart.length;
  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.candy.price * item.quantity, 0);
  const isFreeDelivery = subtotal >= settings.freeDeliveryThreshold;
  const deliveryFee = isFreeDelivery ? 0 : settings.deliveryFee;
  const grandTotal = subtotal + deliveryFee;

  const amountRemainingForFreeDelivery = Math.max(0, settings.freeDeliveryThreshold - subtotal);
  const freeDeliveryProgress = Math.min(
    100,
    Math.round((subtotal / settings.freeDeliveryThreshold) * 100)
  );

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Top action row */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-pink-600 hover:bg-pink-50 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Continuer mes achats</span>
        </Link>

        {cart.length > 0 && (
          <button
            onClick={clearCart}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
            title="Vider tous les articles du panier"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Vider le panier</span>
          </button>
        )}
      </div>

      {/* Page Title */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-pink-100 text-pink-700 text-xs font-bold mb-3 shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-pink-500 animate-spin" style={{ animationDuration: '6s' }} />
          <span>Sélection Gourmande</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-candy font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
          <span>Mon Panier de Bonbons</span>
          <span className="text-3xl sm:text-4xl">🛍️</span>
        </h1>
        <p className="text-slate-600 text-sm sm:text-base mt-1">
          Vérifie tes friandises magiques avant d'envoyer ta commande directement sur WhatsApp !
        </p>
      </div>

      {/* Empty State */}
      {cart.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 sm:p-14 text-center max-w-xl mx-auto shadow-xl shadow-pink-100/60 border border-pink-100 animate-fade-in">
          <div className="w-24 h-24 sm:w-28 sm:h-28 mx-auto mb-6 rounded-3xl bg-gradient-to-tr from-pink-100 via-rose-50 to-amber-100 flex items-center justify-center text-5xl sm:text-6xl shadow-inner">
            🍭
          </div>
          <h2 className="text-xl sm:text-2xl font-candy font-bold text-slate-900 mb-2">
            Ton panier est encore vide !
          </h2>
          <p className="text-slate-600 text-sm sm:text-base mb-8 max-w-md mx-auto">
            Découvre notre délicieuse collection de bonbons acidulés, chocolats fondants et sucettes féeriques.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-candy font-bold text-sm shadow-lg shadow-pink-200 transition-all cursor-pointer active:scale-95"
          >
            <Sparkles className="w-4 h-4" />
            <span>Découvrir la confiserie</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in">
          {/* Left Column: Items List */}
          <div className="lg:col-span-8 space-y-4">
            {/* Free Shipping Progress Card */}
            <div className="bg-white p-5 rounded-3xl border border-pink-100 shadow-sm">
              <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-slate-800 mb-2">
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-pink-500" />
                  {isFreeDelivery ? (
                    <span className="text-emerald-700">Félicitations ! Livraison offerte débloquée 🎉</span>
                  ) : (
                    <span>
                      Plus que{' '}
                      <strong className="text-pink-600 font-extrabold">
                        {formatPrice(amountRemainingForFreeDelivery, settings.currency, settings.eurToFcfaRate)}
                      </strong>{' '}
                      pour bénéficier de la livraison gratuite !
                    </span>
                  )}
                </span>
                <span className="text-pink-600 font-extrabold">{freeDeliveryProgress}%</span>
              </div>
              <div className="w-full bg-pink-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-pink-500 to-rose-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${freeDeliveryProgress}%` }}
                />
              </div>
            </div>

            {/* Cart Items Cards */}
            <div className="space-y-3">
              {cart.map((item) => {
                const itemImage = item.candy.imageUrl || item.candy.image_url;
                const itemTotal = item.candy.price * item.quantity;

                return (
                  <div
                    key={item.candy.id}
                    className="bg-white p-4 sm:p-5 rounded-3xl border border-pink-100 shadow-xs hover:shadow-md hover:border-pink-200 transition-all flex flex-col sm:flex-row items-center gap-4"
                  >
                    {/* Item Image */}
                    <div
                      onClick={() => setSelectedCandyForDetails(item.candy)}
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-tr from-pink-50 to-rose-50 overflow-hidden shrink-0 flex items-center justify-center p-2 border border-pink-100 cursor-pointer"
                    >
                      {itemImage ? (
                        <img
                          src={itemImage}
                          alt={item.candy.name}
                          className="w-full h-full object-cover rounded-xl"
                        />
                      ) : (
                        <span className="text-3xl">{item.candy.emojiIcon || '🍭'}</span>
                      )}
                    </div>

                    {/* Item Info */}
                    <div className="flex-1 text-center sm:text-left min-w-0">
                      <span className="text-[11px] font-bold text-pink-600 uppercase tracking-wider">
                        {item.candy.category}
                      </span>
                      <h3
                        onClick={() => setSelectedCandyForDetails(item.candy)}
                        className="font-candy font-bold text-base sm:text-lg text-slate-900 truncate cursor-pointer hover:text-pink-600 transition-colors"
                      >
                        {item.candy.name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                        {item.candy.description}
                      </p>
                      <div className="text-xs font-semibold text-slate-600 mt-2">
                        Prix unitaire :{' '}
                        <span className="text-pink-600 font-bold">
                          {formatPrice(item.candy.price, settings.currency, settings.eurToFcfaRate)}
                        </span>
                      </div>
                    </div>

                    {/* Quantity modifier and Line Total */}
                    <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end pt-3 sm:pt-0 border-t sm:border-t-0 border-pink-50">
                      {/* Quantity Controller */}
                      <div className="flex items-center gap-2 bg-pink-50/80 p-1 rounded-2xl border border-pink-200">
                        <button
                          onClick={() => updateQuantity(item.candy.id, -1)}
                          className="w-8 h-8 rounded-xl bg-white hover:bg-pink-100 text-pink-700 flex items-center justify-center font-bold text-sm shadow-2xs transition-colors cursor-pointer active:scale-95"
                          title="Diminuer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="min-w-7 text-center font-candy font-bold text-sm text-pink-900">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.candy.id, 1)}
                          className="w-8 h-8 rounded-xl bg-pink-500 hover:bg-pink-600 text-white flex items-center justify-center font-bold text-sm shadow-2xs transition-colors cursor-pointer active:scale-95"
                          title="Augmenter"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Total */}
                      <div className="text-right min-w-[90px]">
                        <span className="text-[11px] text-slate-400 block font-medium">Sous-total</span>
                        <span className="font-candy font-extrabold text-base text-pink-600">
                          {formatPrice(itemTotal, settings.currency, settings.eurToFcfaRate)}
                        </span>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => removeFromCart(item.candy.id)}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Retirer cet article"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Order Summary Card */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-pink-100 shadow-xl shadow-pink-100/50 sticky top-24 space-y-6">
              <h2 className="font-candy font-bold text-xl text-slate-900 flex items-center gap-2">
                <span>Récapitulatif</span>
                <span className="text-lg">🧾</span>
              </h2>

              <div className="space-y-3 text-sm text-slate-600 border-b border-pink-100 pb-5">
                <div className="flex justify-between items-center">
                  <span>
                    Total friandises ({totalItemsCount} article{totalItemsCount > 1 ? 's' : ''})
                  </span>
                  <span className="font-bold text-slate-800">
                    {formatPrice(subtotal, settings.currency, settings.eurToFcfaRate)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span>Frais de livraison</span>
                  <span className="font-bold">
                    {isFreeDelivery ? (
                      <span className="text-emerald-600 font-extrabold">Gratuite ✨</span>
                    ) : (
                      formatPrice(deliveryFee, settings.currency, settings.eurToFcfaRate)
                    )}
                  </span>
                </div>
              </div>

              {/* Grand Total */}
              <div className="flex justify-between items-baseline">
                <div>
                  <span className="font-candy font-bold text-base text-slate-900 block">
                    Total de la commande
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    TVA et préparation incluses
                  </span>
                </div>
                <span className="font-candy font-extrabold text-2xl text-pink-600">
                  {formatPrice(grandTotal, settings.currency, settings.eurToFcfaRate)}
                </span>
              </div>

              {/* Proceed to WhatsApp Button */}
              <button
                onClick={() => setIsWhatsAppModalOpen(true)}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-green-600 hover:from-emerald-600 hover:to-teal-700 text-white font-candy font-bold text-base shadow-xl shadow-emerald-200 transition-all flex items-center justify-center gap-2.5 cursor-pointer active:scale-98"
              >
                <MessageCircle className="w-5 h-5" />
                <span>Commander sur WhatsApp</span>
              </button>

              {/* Fast info notice */}
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 text-[11px] text-amber-900 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  <span>Paiement à la livraison possible</span>
                </p>
                <p className="text-amber-800 leading-relaxed">
                  Ta commande sera confirmée immédiatement avec le gérant sur WhatsApp et préparée avec amour !
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
