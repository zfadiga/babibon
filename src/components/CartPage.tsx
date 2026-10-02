import React from 'react';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  Sparkles,
  MessageCircle,
} from 'lucide-react';
import { CartItem, ChildUser, StoreSettings, CandyProduct } from '../types/candy';
import { formatPrice } from '../utils/formatters';

interface CartPageProps {
  cart: CartItem[];
  user: ChildUser | null;
  settings: StoreSettings;
  onUpdateQuantity: (candyId: string, delta: number) => void;
  onRemoveItem: (candyId: string) => void;
  onClearCart: () => void;
  onNavigateHome: () => void;
  onProceedWhatsApp: () => void;
  onOpenSignup: () => void;
  onOpenLogin: () => void;
  onOpenDetails: (candy: CandyProduct) => void;
}

export const CartPage: React.FC<CartPageProps> = ({
  cart,
  user,
  settings,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onNavigateHome,
  onProceedWhatsApp,
  onOpenSignup,
  onOpenLogin,
  onOpenDetails,
}) => {
  const distinctCandyTypes = cart.length;
  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.candy.price * item.quantity, 0);
  const isFreeDelivery = subtotal >= settings.freeDeliveryThreshold;
  const deliveryFee = isFreeDelivery ? 0 : settings.deliveryFee;
  const grandTotal = subtotal + deliveryFee;

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Top action row */}
      {user && cart.length > 0 && (
        <div className="flex justify-end mb-4">
          <button
            onClick={onClearCart}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
            title="Vider tous les articles du panier"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Vider le panier</span>
          </button>
        </div>
      )}

      {/* Page Title */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-pink-100 text-pink-700 text-xs font-bold mb-3 shadow-xs">
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

      {/* Main Content: Private Session Required, Empty Cart, or Cart Items List */}
      {!user ? (
        <div className="bg-white rounded-3xl p-8 sm:p-14 text-center max-w-xl mx-auto shadow-xl shadow-pink-100/60 border border-pink-100">
          <div className="w-24 h-24 sm:w-28 sm:h-28 mx-auto mb-6 rounded-3xl bg-gradient-to-tr from-pink-100 via-rose-50 to-amber-100 flex items-center justify-center text-5xl sm:text-6xl shadow-inner">
            🔒
          </div>
          <h2 className="text-xl sm:text-2xl font-candy font-bold text-slate-900 mb-2">
            Session privée requise
          </h2>
          <p className="text-slate-600 text-sm sm:text-base mb-8 max-w-md mx-auto">
            Ton panier de bonbons est personnel et privé. Connecte-toi à ton profil enfant pour retrouver tes friandises sélectionnées.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onOpenLogin}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 font-bold text-sm shadow-xs transition-all cursor-pointer active:scale-95"
            >
              J'ai déjà un compte 🔑
            </button>
            <button
              onClick={onOpenSignup}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-candy font-bold text-sm shadow-lg shadow-pink-200 transition-all cursor-pointer active:scale-95"
            >
              Créer mon profil enfant 🐻
            </button>
          </div>
        </div>
      ) : cart.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 sm:p-14 text-center max-w-xl mx-auto shadow-xl shadow-pink-100/60 border border-pink-100">
          <div className="w-24 h-24 sm:w-28 sm:h-28 mx-auto mb-6 rounded-3xl bg-gradient-to-tr from-pink-100 via-rose-50 to-amber-100 flex items-center justify-center text-5xl sm:text-6xl shadow-inner animate-bounce">
            🍬
          </div>
          <h2 className="text-xl sm:text-2xl font-candy font-bold text-slate-900 mb-2">
            Ton panier est tout vide !
          </h2>
          <p className="text-slate-600 text-sm sm:text-base mb-8 max-w-md mx-auto">
            Oursons gélifiés, rubans ultra-acides, sucettes multicolores... Découvre toutes nos gourmandises et remplis ton panier de bonheur !
          </p>
          <button
            onClick={onNavigateHome}
            className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-candy font-bold text-sm sm:text-base shadow-lg shadow-pink-200 transition-all cursor-pointer active:scale-95"
          >
            <Sparkles className="w-4 h-4" />
            <span>Explorer la confiserie</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Cart Items List */}
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-sm border border-pink-100">
              <div className="flex items-center justify-between pb-4 border-b border-pink-50 mb-4">
                <span className="text-xs sm:text-sm font-bold text-slate-700">
                  {distinctCandyTypes} type{distinctCandyTypes > 1 ? 's' : ''} de bonbon{distinctCandyTypes > 1 ? 's' : ''} ({totalItemsCount} friandise{totalItemsCount > 1 ? 's' : ''})
                </span>
                <span className="text-xs text-pink-600 font-semibold">
                  Confiserie fraîche garantie 🍬
                </span>
              </div>

              <div className="divide-y divide-pink-50">
                {cart.map((item) => {
                  const itemTotal = item.candy.price * item.quantity;
                  return (
                    <div
                      key={item.candy.id}
                      className="py-4 sm:py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
                    >
                      {/* Product Thumbnail & Info */}
                      <div className="flex items-center gap-3.5 sm:gap-4 flex-1 min-w-0">
                        <button
                          type="button"
                          onClick={() => onOpenDetails(item.candy)}
                          className="relative w-18 h-18 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-gradient-to-tr from-pink-100 to-amber-100 flex items-center justify-center shrink-0 border border-pink-100 cursor-pointer group-hover:scale-105 transition-transform"
                        >
                          <img
                            src={item.candy.imageUrl}
                            alt={item.candy.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                          <span className="absolute text-2xl drop-shadow-xs">
                            {item.candy.emojiIcon}
                          </span>
                        </button>

                        <div className="min-w-0 flex-1">
                          <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border mb-1 ${item.candy.badgeColor}`}>
                            {item.candy.flavorBadge}
                          </span>
                          <h3
                            onClick={() => onOpenDetails(item.candy)}
                            className="text-sm sm:text-base font-bold text-slate-800 hover:text-pink-600 transition-colors truncate cursor-pointer"
                          >
                            {item.candy.name}
                          </h3>
                          <p className="text-xs text-slate-500 font-medium mt-0.5">
                            Prix unitaire : {formatPrice(item.candy.price, settings.currency, settings.eurToFcfaRate)}
                          </p>
                        </div>
                      </div>

                      {/* Quantity Controls & Item Total */}
                      <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto pt-2 sm:pt-0">
                        {/* Minus / Quantity / Plus */}
                        <div className="flex items-center bg-pink-50/70 border border-pink-200 rounded-2xl p-1 shadow-inner">
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(item.candy.id, -1)}
                            className="w-8 h-8 rounded-xl bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-600 flex items-center justify-center transition-colors cursor-pointer shadow-xs active:scale-90"
                            title="Diminuer la quantité"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-9 text-center text-sm font-candy font-bold text-pink-700">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(item.candy.id, 1)}
                            className="w-8 h-8 rounded-xl bg-white hover:bg-pink-100 text-slate-700 hover:text-pink-600 flex items-center justify-center transition-colors cursor-pointer shadow-xs active:scale-90"
                            title="Augmenter la quantité"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Price Subtotal for this Item */}
                        <div className="text-right min-w-[90px]">
                          <span className="block text-sm sm:text-base font-bold font-candy text-slate-900">
                            {formatPrice(itemTotal, settings.currency, settings.eurToFcfaRate)}
                          </span>
                        </div>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => onRemoveItem(item.candy.id)}
                          className="w-8 h-8 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-500 flex items-center justify-center transition-colors cursor-pointer"
                          title="Supprimer cet article"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary Card */}
          <div className="lg:col-span-4 sticky top-24">
            <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-xl shadow-pink-100/70 border border-pink-100 space-y-5">
              <h2 className="text-lg font-candy font-bold text-slate-900 pb-3 border-b border-pink-50 flex items-center justify-between">
                <span>Résumé de la commande</span>
                <span className="text-xl">🧾</span>
              </h2>

              {/* Price Details */}
              <div className="space-y-2.5 text-xs sm:text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Sous-total ({totalItemsCount} bonbons)</span>
                  <span className="font-semibold text-slate-800">
                    {formatPrice(subtotal, settings.currency, settings.eurToFcfaRate)}
                  </span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <span>Frais de livraison</span>
                  </span>
                  <span className={`font-semibold ${isFreeDelivery ? 'text-emerald-600' : 'text-slate-800'}`}>
                    {deliveryFee > 0
                      ? formatPrice(deliveryFee, settings.currency, settings.eurToFcfaRate)
                      : 'OFFERTE ✨'}
                  </span>
                </div>

                {!isFreeDelivery && settings.freeDeliveryThreshold > 0 && (
                  <p className="text-[11px] text-pink-600 bg-pink-50 p-2 rounded-xl">
                    💡 Ajoute encore {formatPrice(settings.freeDeliveryThreshold - subtotal, settings.currency, settings.eurToFcfaRate)} de bonbons pour la livraison gratuite !
                  </p>
                )}
              </div>

              {/* Grand Total */}
              <div className="pt-3 border-t border-pink-100 flex items-baseline justify-between">
                <span className="text-base font-bold text-slate-900">Total à payer</span>
                <span className="text-2xl font-candy font-black bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
                  {formatPrice(grandTotal, settings.currency, settings.eurToFcfaRate)}
                </span>
              </div>

              {/* User Delivery Info preview */}
              {user ? (
                <div className="p-3 bg-pink-50/60 rounded-2xl border border-pink-100 text-xs">
                  <div className="flex items-center gap-2 mb-1 text-pink-900 font-bold">
                    <span>{user.avatar}</span>
                    <span>Client : {user.firstName}</span>
                  </div>
                  {user.deliveryAddress && (
                    <p className="text-[11px] text-slate-600 truncate">
                      📍 {user.deliveryAddress}
                    </p>
                  )}
                  {user.phone && (
                    <p className="text-[11px] text-slate-600">
                      📞 {user.phone}
                    </p>
                  )}
                </div>
              ) : (
                <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs">
                  <p className="text-amber-800 font-medium mb-1">
                    Tu commandes en invité ?
                  </p>
                  <button
                    onClick={onOpenSignup}
                    className="text-pink-600 font-bold hover:underline cursor-pointer"
                  >
                    Créer mon profil enfant pour mémoriser mes infos 🐻
                  </button>
                </div>
              )}

              {/* Big WhatsApp CTA Button */}
              <button
                type="button"
                onClick={onProceedWhatsApp}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-[#25D366] hover:from-emerald-600 hover:to-[#22bf5b] text-white font-candy font-bold text-base shadow-lg shadow-emerald-200 flex items-center justify-center gap-2.5 transition-all cursor-pointer active:scale-95 group"
              >
                <MessageCircle className="w-5 h-5 fill-white group-hover:scale-110 transition-transform" />
                <span>Commander sur WhatsApp 📲</span>
              </button>

              <p className="text-center text-[11px] text-slate-500">
                Paiement sécurisé à la livraison en espèces ou Mobile Money
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
