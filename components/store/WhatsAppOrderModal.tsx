'use client';

import React, { useState, useEffect } from 'react';
import { X, MessageCircle, MapPin, Phone, Sparkles, Send, Copy, Check, AlertCircle } from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { generateWhatsAppOrderUrl, fireOrderCelebration, formatPhoneNumber, formatPrice } from '@/utils/formatters';
import { OrderRecord } from '@/types/candy';

export const WhatsAppOrderModal: React.FC = () => {
  const {
    isWhatsAppModalOpen,
    setIsWhatsAppModalOpen,
    cart,
    currentUser,
    settings,
    placeOrder,
    setIsLoginOpen,
  } = useStore();

  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [guestName, setGuestName] = useState('');
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  useEffect(() => {
    if (isWhatsAppModalOpen) {
      setErrorMessage('');
      setHasAttemptedSubmit(false);
      if (currentUser) {
        setCustomerPhone(currentUser.phone || '');
        setDeliveryAddress(currentUser.deliveryAddress || '');
        setGuestName(currentUser.firstName || '');
      } else {
        setCustomerPhone('');
        setDeliveryAddress('');
        setGuestName('');
      }
    }
  }, [isWhatsAppModalOpen, currentUser]);

  if (!isWhatsAppModalOpen) return null;

  const subtotal = cart.reduce((sum, item) => sum + item.candy.price * item.quantity, 0);
  const isFreeDelivery = subtotal >= settings.freeDeliveryThreshold;
  const deliveryFee = isFreeDelivery ? 0 : settings.deliveryFee;

  const effectiveUser = currentUser || (guestName.trim() ? {
    id: 'guest',
    username: guestName.trim(),
    firstName: guestName.trim(),
    avatar: '🍬',
    avatarBg: 'bg-pink-100 text-pink-700 border-pink-300',
    joinedAt: new Date().toISOString(),
    phone: customerPhone.trim(),
    deliveryAddress: deliveryAddress.trim(),
  } : null);

  const { url: whatsAppUrl, formattedMessage } = generateWhatsAppOrderUrl({
    cart,
    user: effectiveUser,
    settings,
    deliveryAddress,
    customerPhone,
    deliveryFee,
  });

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(formattedMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendOrder = async () => {
    setHasAttemptedSubmit(true);

    if (!deliveryAddress.trim()) {
      setErrorMessage('Veuillez indiquer une adresse ou un quartier de livraison.');
      return;
    }

    if (!customerPhone.trim() || customerPhone.replace(/[^0-9]/g, '').length < 8) {
      setErrorMessage('Veuillez indiquer un numéro de téléphone valide pour joindre la livraison.');
      return;
    }

    if (!currentUser && !guestName.trim()) {
      setErrorMessage('Veuillez entrer votre prénom pour la commande.');
      return;
    }

    const orderRecord: OrderRecord = {
      id: `CMD-${Math.floor(100000 + Math.random() * 900000)}`,
      createdAt: new Date().toISOString(),
      childName: currentUser ? currentUser.firstName : guestName.trim(),
      childId: currentUser?.id,
      items: cart.map((i) => ({
        name: i.candy.name,
        candy_name: i.candy.name,
        quantity: i.quantity,
        price: i.candy.price,
      })),
      totalAmount: subtotal + deliveryFee,
      currency: settings.currency,
      customerPhone: customerPhone.trim(),
      deliveryAddress: deliveryAddress.trim(),
      status: 'pending',
    };

    // Trigger celebration & persist order
    await fireOrderCelebration();
    await placeOrder(orderRecord);

    // Open WhatsApp
    window.open(whatsAppUrl, '_blank');
    setIsWhatsAppModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={() => setIsWhatsAppModalOpen(false)}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
      />

      <div className="relative bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-pink-100 z-10 animate-fade-in">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-emerald-500 via-teal-500 to-green-500 text-white relative">
          <button
            onClick={() => setIsWhatsAppModalOpen(false)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
              <MessageCircle className="w-7 h-7" />
            </div>
            <div>
              <span className="text-emerald-100 text-xs font-bold uppercase tracking-wider">
                Commande Express WhatsApp
              </span>
              <h2 className="text-xl sm:text-2xl font-candy font-bold">
                Finaliser ma commande 🍭
              </h2>
            </div>
          </div>
          <p className="text-emerald-100 text-xs sm:text-sm">
            Numéro de la boutique :{' '}
            <strong className="text-white font-mono">
              {formatPhoneNumber(settings.whatsappNumber)}
            </strong>
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Guest Name if not logged in */}
          {!currentUser && (
            <div className="space-y-1.5 bg-amber-50/70 p-3.5 rounded-2xl border border-amber-200">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-amber-900">
                  Ton prénom / pseudo *
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setIsWhatsAppModalOpen(false);
                    setIsLoginOpen(true);
                  }}
                  className="text-xs font-bold text-pink-600 hover:underline"
                >
                  Déjà un compte ? Se connecter
                </button>
              </div>
              <input
                type="text"
                placeholder="Ex: Lucas, Amina, Moussa..."
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-amber-300 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          )}

          {/* Delivery Phone */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-pink-500" />
              <span>Numéro WhatsApp pour te joindre *</span>
            </label>
            <input
              type="tel"
              placeholder="Ex: 07 79 32 37 16 ou +225..."
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-pink-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
            />
          </div>

          {/* Delivery Address */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-pink-500" />
              <span>Lieu / Adresse de livraison *</span>
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Cocody Angré 8e Tranche, en face de la pharmacie..."
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-pink-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
            />
          </div>

          {/* Order Summary Recap */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
            <div className="font-bold text-slate-700 flex items-center justify-between pb-1 border-b border-slate-200">
              <span>Articles ({cart.length})</span>
              <span>
                {formatPrice(subtotal, settings.currency, settings.eurToFcfaRate)}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span>Frais de livraison</span>
              <span className="font-bold">
                {deliveryFee === 0 ? (
                  <span className="text-emerald-600 font-extrabold">OFFERTE ✨</span>
                ) : (
                  formatPrice(deliveryFee, settings.currency, settings.eurToFcfaRate)
                )}
              </span>
            </div>
            <div className="flex items-center justify-between font-candy font-extrabold text-sm text-slate-900 pt-1 border-t border-slate-200">
              <span>Total TTC</span>
              <span className="text-pink-600 text-base">
                {formatPrice(subtotal + deliveryFee, settings.currency, settings.eurToFcfaRate)}
              </span>
            </div>
          </div>

          {/* Error notice if validation fails */}
          {errorMessage && hasAttemptedSubmit && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            <button
              onClick={handleSendOrder}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-candy font-bold text-sm sm:text-base shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <Send className="w-4 h-4" />
              <span>Ouvrir WhatsApp et envoyer la commande</span>
            </button>

            <button
              onClick={handleCopyMessage}
              className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-200 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Message copié dans le presse-papier !</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copier le texte de la commande</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
