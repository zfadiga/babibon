import React, { useState, useEffect } from 'react';
import { X, MessageCircle, MapPin, Phone, Sparkles, Send, Copy, Check, AlertCircle } from 'lucide-react';
import { CartItem, ChildUser, StoreSettings, OrderRecord } from '../types/candy';
import { generateWhatsAppOrderUrl, fireOrderCelebration, formatPhoneNumber, formatPrice } from '../utils/formatters';

interface WhatsAppOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  user: ChildUser | null;
  settings: StoreSettings;
  onOrderSuccess: (order: OrderRecord) => void;
  onOpenAuth: () => void;
}

export const WhatsAppOrderModal: React.FC<WhatsAppOrderModalProps> = ({
  isOpen,
  onClose,
  cart,
  user,
  settings,
  onOrderSuccess,
  onOpenAuth,
}) => {
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [guestName, setGuestName] = useState('');
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  // Sync with user's saved profile phone & address when opening
  useEffect(() => {
    if (isOpen) {
      setErrorMessage('');
      setHasAttemptedSubmit(false);
      if (user?.phone && !customerPhone) {
        setCustomerPhone(user.phone);
      }
      if (user?.deliveryAddress && !deliveryAddress) {
        setDeliveryAddress(user.deliveryAddress);
      }
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const subtotal = cart.reduce((sum, item) => sum + item.candy.price * item.quantity, 0);
  const isFreeDelivery = subtotal >= settings.freeDeliveryThreshold;
  const deliveryFee = isFreeDelivery ? 0 : settings.deliveryFee;

  const effectiveUser: ChildUser | null = user || (guestName.trim() ? {
    id: 'guest',
    username: guestName.trim(),
    firstName: guestName.trim(),
    avatar: '🍬',
    avatarBg: 'bg-pink-100 text-pink-700 border-pink-300',
    joinedAt: new Date().toISOString(),
    phone: customerPhone.trim(),
    deliveryAddress: deliveryAddress.trim(),
  } : null);

  const { url, formattedMessage } = generateWhatsAppOrderUrl({
    cart,
    user: effectiveUser,
    settings,
    deliveryAddress,
    customerPhone,
    deliveryFee,
  });

  const handleLaunchWhatsApp = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setHasAttemptedSubmit(true);

    if (!customerPhone.trim() || !deliveryAddress.trim()) {
      setErrorMessage('Le numéro de téléphone et l\'adresse de livraison sont obligatoires pour finaliser la commande !');
      return;
    }

    if (!user && !guestName.trim()) {
      setErrorMessage('Merci d\'indiquer ton prénom pour la commande !');
      return;
    }

    setErrorMessage('');

    // 1. Trigger celebration
    fireOrderCelebration();

    // 2. Build local order record
    const grandTotal = subtotal + deliveryFee;
    const orderRecord: OrderRecord = {
      id: `CMD-${Date.now().toString().slice(-6)}`,
      createdAt: new Date().toISOString(),
      childName: effectiveUser ? effectiveUser.firstName : 'Petit Gourmand',
      childId: user?.id,
      items: cart.map(item => ({
        name: item.candy.name,
        quantity: item.quantity,
        price: item.candy.price,
      })),
      totalAmount: grandTotal,
      currency: settings.currency,
      customerPhone: customerPhone.trim(),
      deliveryAddress: deliveryAddress.trim(),
      status: 'preparing',
    };

    onOrderSuccess(orderRecord);

    // 3. Open WhatsApp link safely
    window.open(url, '_blank');
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(formattedMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const isPhoneMissing = hasAttemptedSubmit && !customerPhone.trim();
  const isAddressMissing = hasAttemptedSubmit && !deliveryAddress.trim();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
      />

      {/* Modal Dialog */}
      <div className="relative bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-emerald-100 z-10 overflow-hidden">
        {/* Top Decorative accent */}
        <div className="absolute top-0 left-0 right-0 h-2.5 bg-gradient-to-r from-emerald-400 via-[#25D366] to-teal-400" />

        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#25D366]/15 text-[#25D366] flex items-center justify-center border border-[#25D366]/30">
              <MessageCircle className="w-6 h-6 fill-[#25D366]" />
            </div>
            <div>
              <h3 className="font-candy font-bold text-xl text-slate-900">
                Finaliser sur WhatsApp
              </h3>
              <p className="text-xs text-slate-500">
                Commande envoyée directement à {settings.storeName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Identity & Candies Preview Card ("Commande de...") */}
        <div className="mb-4 p-3.5 rounded-2xl bg-gradient-to-r from-pink-50/90 to-rose-50/80 border border-pink-100 shadow-2xs">
          <div className="flex items-center justify-between pb-2.5 border-b border-pink-100">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">{user ? user.avatar : '🍭'}</span>
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  {user ? `Commande de ${user.firstName}` : 'Tu n\'es pas connecté'}
                </span>
                <span className="text-[11px] text-slate-500">
                  {user ? `Avatar : ${user.username}` : 'Crée ton profil pour enregistrer tes préférences'}
                </span>
              </div>
            </div>
            {!user && (
              <button
                type="button"
                onClick={onOpenAuth}
                className="text-xs font-bold text-pink-600 hover:text-pink-700 underline cursor-pointer"
              >
                Créer profil
              </button>
            )}
          </div>

          {/* Candy Image(s) preview */}
          {cart.length > 0 && (
            <div className="pt-2.5">
              {cart.length === 1 ? (
                /* Single candy display with clear image */
                <div className="flex items-center gap-3 p-2 bg-white rounded-xl border border-pink-100 shadow-2xs">
                  <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-gradient-to-tr from-pink-100 to-amber-100 flex items-center justify-center shrink-0 border border-pink-200">
                    <img
                      src={cart[0].candy.imageUrl}
                      alt={cart[0].candy.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    <span className="absolute text-xl drop-shadow-xs">
                      {cart[0].candy.emojiIcon}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border mb-0.5 ${cart[0].candy.badgeColor}`}>
                      {cart[0].candy.flavorBadge}
                    </span>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-800 truncate">
                      {cart[0].candy.name}
                    </h4>
                    <p className="text-xs text-pink-600 font-bold">
                      {cart[0].quantity}x • {formatPrice(cart[0].candy.price * cart[0].quantity, settings.currency, settings.eurToFcfaRate)}
                    </p>
                  </div>
                </div>
              ) : (
                /* Multiple candies gallery with image */
                <div className="space-y-1.5">
                  <p className="text-[11px] font-bold text-pink-700 uppercase tracking-wider">
                    Friandises choisies ({cart.reduce((sum, item) => sum + item.quantity, 0)}) :
                  </p>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                    {cart.map((item) => (
                      <div
                        key={item.candy.id}
                        className="flex items-center gap-2 p-1.5 pr-2.5 bg-white rounded-xl border border-pink-100 shadow-2xs shrink-0"
                      >
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gradient-to-tr from-pink-100 to-amber-100 flex items-center justify-center shrink-0 border border-pink-200">
                          <img
                            src={item.candy.imageUrl}
                            alt={item.candy.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                          <span className="absolute text-lg drop-shadow-xs">
                            {item.candy.emojiIcon}
                          </span>
                        </div>
                        <div className="max-w-[120px]">
                          <p className="text-xs font-bold text-slate-800 truncate">
                            {item.candy.name}
                          </p>
                          <p className="text-[11px] text-pink-600 font-bold">
                            {item.quantity}x • {formatPrice(item.candy.price * item.quantity, settings.currency, settings.eurToFcfaRate)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Error message alert */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form Inputs (Phone & Address Mandatory) */}
        <form onSubmit={handleLaunchWhatsApp} className="space-y-3.5 mb-5">
          {!user && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Ton prénom <span className="text-rose-500">*</span> :
              </label>
              <input
                type="text"
                required
                value={guestName}
                onChange={(e) => {
                  setGuestName(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                placeholder="Ex : Maxime, Fatou, Sarah..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400"
              />
            </div>
          )}

          {/* Numéro de téléphone (OBLIGATOIRE) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                <span>Numéro de téléphone <span className="text-rose-500 font-extrabold">*</span> :</span>
              </span>
              <span className="text-[10px] text-rose-500 font-semibold uppercase tracking-wider">
                Obligatoire
              </span>
            </label>
            <input
              type="tel"
              required
              value={customerPhone}
              onChange={(e) => {
                setCustomerPhone(e.target.value);
                if (errorMessage) setErrorMessage('');
              }}
              placeholder="Ex : 07 01 02 03 04 ou +225 05..."
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 ${
                isPhoneMissing
                  ? 'border-rose-400 bg-rose-50/30 focus:ring-rose-400'
                  : 'border-slate-200 focus:ring-emerald-400 focus:border-emerald-400'
              }`}
            />
            {isPhoneMissing && (
              <p className="text-[11px] text-rose-600 mt-1 font-medium">
                Veuillez renseigner un numéro de téléphone pour la confirmation et la livraison.
              </p>
            )}
          </div>

          {/* Adresse de livraison (OBLIGATOIRE) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                <span>Adresse ou Quartier de livraison <span className="text-rose-500 font-extrabold">*</span> :</span>
              </span>
              <span className="text-[10px] text-rose-500 font-semibold uppercase tracking-wider">
                Obligatoire
              </span>
            </label>
            <input
              type="text"
              required
              value={deliveryAddress}
              onChange={(e) => {
                setDeliveryAddress(e.target.value);
                if (errorMessage) setErrorMessage('');
              }}
              placeholder="Ex : Cocody Angré 8ème tranche, villa 45..."
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 ${
                isAddressMissing
                  ? 'border-rose-400 bg-rose-50/30 focus:ring-rose-400'
                  : 'border-slate-200 focus:ring-emerald-400 focus:border-emerald-400'
              }`}
            />
            {isAddressMissing && (
              <p className="text-[11px] text-rose-600 mt-1 font-medium">
                Veuillez préciser le lieu où nous devons vous livrer vos bonbons.
              </p>
            )}
          </div>

          {/* WhatsApp Message Preview Box */}
          <div className="pt-1">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Aperçu du message WhatsApp
              </span>
              <button
                type="button"
                onClick={handleCopyMessage}
                className="text-xs text-emerald-700 hover:text-emerald-800 font-medium flex items-center gap-1 cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Copié !</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copier le texte</span>
                  </>
                )}
              </button>
            </div>
            <div className="bg-[#EFEAE2] p-3 rounded-2xl border border-[#D1D7DB] text-xs font-sans text-slate-800 whitespace-pre-wrap max-h-36 overflow-y-auto leading-relaxed shadow-inner">
              {formattedMessage}
            </div>
          </div>

          {/* Submit Action */}
          <div className="space-y-2 pt-2">
            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-2xl bg-[#25D366] hover:bg-[#20BD5A] text-white font-candy font-bold text-sm shadow-lg shadow-emerald-200 hover:shadow-xl active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Ouvrir WhatsApp et envoyer la commande</span>
              <Sparkles className="w-4 h-4 text-yellow-200" />
            </button>

            <p className="text-[11px] text-center text-slate-400">
              Numéro vendeur WhatsApp : {formatPhoneNumber(settings.whatsappNumber)}
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};
