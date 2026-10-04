'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  MessageCircle,
  MapPin,
  Phone,
  Sparkles,
  Send,
  Copy,
  Check,
  AlertCircle,
  Camera,
  Image as ImageIcon,
  Trash2,
  Loader2,
} from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { generateWhatsAppOrderUrl, fireOrderCelebration, formatPhoneNumber, formatPrice } from '@/utils/formatters';
import { uploadOrderImage } from '@/lib/api';
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
  const [attachedImageFile, setAttachedImageFile] = useState<File | null>(null);
  const [attachedImagePreview, setAttachedImagePreview] = useState<string | null>(null);
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isWhatsAppModalOpen) {
      setErrorMessage('');
      setHasAttemptedSubmit(false);
      setAttachedImageFile(null);
      setAttachedImagePreview(null);
      setIsProcessingOrder(false);
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
    imageUrl: attachedImagePreview || undefined,
  });

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(formattedMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAttachedImageFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setAttachedImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setAttachedImageFile(null);
    setAttachedImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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

    setIsProcessingOrder(true);
    let uploadedImageUrl: string | undefined = undefined;

    // 1. Upload attached photo to Supabase storage if provided
    if (attachedImageFile) {
      try {
        uploadedImageUrl = await uploadOrderImage(attachedImageFile);
      } catch (uploadErr) {
        console.warn('Attached image upload notice:', uploadErr);
      }
    }

    const generatedOrderId = `CMD-${Math.floor(100000 + Math.random() * 900000)}`;

    // 2. Generate final WhatsApp URL with media link
    const { url: finalWhatsAppUrl } = generateWhatsAppOrderUrl({
      cart,
      user: effectiveUser,
      settings,
      deliveryAddress: deliveryAddress.trim(),
      customerPhone: customerPhone.trim(),
      deliveryFee,
      imageUrl: uploadedImageUrl || attachedImagePreview || undefined,
      orderId: generatedOrderId,
    });

    const orderRecord: OrderRecord = {
      id: generatedOrderId,
      createdAt: new Date().toISOString(),
      childName: currentUser ? currentUser.firstName : guestName.trim(),
      childId: currentUser?.id,
      items: cart.map((i) => ({
        name: i.candy.name,
        candy_name: i.candy.name,
        quantity: i.quantity,
        price: i.candy.price,
        image_url: i.candy.image_url || i.candy.imageUrl,
        imageUrl: i.candy.imageUrl || i.candy.image_url,
      })),
      totalAmount: subtotal + deliveryFee,
      currency: settings.currency,
      customerPhone: customerPhone.trim(),
      deliveryAddress: deliveryAddress.trim(),
      status: 'pending',
      imageUrl: uploadedImageUrl,
      image_url: uploadedImageUrl,
    };

    // 3. Trigger celebration & persist order
    await fireOrderCelebration();
    await placeOrder(orderRecord);

    setIsProcessingOrder(false);

    // 4. Open WhatsApp
    window.open(finalWhatsAppUrl, '_blank');
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

          {/* Photo attachment (Optional: location, receipt, note) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-pink-500" />
                <span>Photo jointe à la commande (Optionnel)</span>
              </label>
              <span className="text-[10px] text-slate-400">Repère, lieu, reçu</span>
            </div>

            {attachedImagePreview ? (
              <div className="p-3 bg-pink-50/60 rounded-2xl border border-pink-200 flex items-center justify-between">
                <div className="flex items-center space-x-3 truncate">
                  <img
                    src={attachedImagePreview}
                    alt="Aperçu photo commande"
                    className="w-14 h-14 object-cover rounded-xl border border-pink-200 shadow-2xs shrink-0"
                  />
                  <div className="truncate text-xs">
                    <p className="font-semibold text-slate-800 truncate">
                      {attachedImageFile?.name || 'Photo attachée'}
                    </p>
                    <p className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      <span>Sera envoyée sur WhatsApp</span>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-100 rounded-xl transition-colors cursor-pointer"
                  title="Supprimer la photo"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                  id="order-image-input"
                />
                <label
                  htmlFor="order-image-input"
                  className="w-full py-3 px-4 rounded-xl border-2 border-dashed border-pink-200 hover:border-pink-400 bg-pink-50/30 hover:bg-pink-50/70 transition-all flex items-center justify-center gap-2.5 text-xs text-pink-600 font-semibold cursor-pointer"
                >
                  <ImageIcon className="w-4 h-4 text-pink-500" />
                  <span>Joindre une photo (lieu de livraison, reçu ou note visuelle)</span>
                </label>
              </div>
            )}
          </div>

          {/* Order Summary Recap with Candies Visuals */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3 text-xs">
            <div className="font-bold text-slate-700 flex items-center justify-between pb-1 border-b border-slate-200">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Friandises dans la commande ({cart.length})</span>
              </span>
              <span className="text-[11px] text-emerald-600 font-semibold">
                📸 Visuels inclus dans WhatsApp
              </span>
            </div>

            {/* Candies mini list with thumbnails */}
            <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
              {cart.map((item, idx) => {
                const img = item.candy.imageUrl || item.candy.image_url;
                return (
                  <div key={idx} className="flex items-center justify-between bg-white p-2 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2.5 truncate mr-2">
                      {img ? (
                        <img
                          src={img}
                          alt={item.candy.name}
                          className="w-8 h-8 rounded-lg object-cover border border-pink-100 shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-pink-100 flex items-center justify-center text-sm shrink-0">
                          {item.candy.emojiIcon || '🍬'}
                        </div>
                      )}
                      <span className="font-medium text-slate-800 truncate text-xs">
                        {item.candy.name}
                      </span>
                    </div>
                    <span className="font-bold text-pink-600 shrink-0 text-xs">
                      x{item.quantity} ({formatPrice(item.candy.price * item.quantity, settings.currency, settings.eurToFcfaRate)})
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between text-slate-600 pt-1 border-t border-slate-200">
              <span>Sous-total articles</span>
              <span className="font-semibold">
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
              disabled={isProcessingOrder}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-candy font-bold text-sm sm:text-base shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-60"
            >
              {isProcessingOrder ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Préparation des photos et de la commande...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Ouvrir WhatsApp et envoyer la commande</span>
                </>
              )}
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
