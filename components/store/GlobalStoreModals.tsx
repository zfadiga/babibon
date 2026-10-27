'use client';

import React from 'react';
import { useStore } from '@/context/StoreContext';
import { LoginModal } from './LoginModal';
import { SignupModal } from './SignupModal';
import { ProfileModal } from './ProfileModal';
import { CartDrawer } from './CartDrawer';
import { WhatsAppOrderModal } from './WhatsAppOrderModal';
import { CandyDetailsModal } from './CandyDetailsModal';
import { AuthRequiredModal } from './AuthRequiredModal';
import { X, ShieldAlert } from 'lucide-react';

export const GlobalStoreModals: React.FC = () => {
  const {
    selectedCandyForDetails,
    setSelectedCandyForDetails,
    addToCart,
    settings,
    successToast,
    setSuccessToast,
    concurrentSessionAlert,
    setConcurrentSessionAlert,
    setIsLoginOpen,
  } = useStore();

  return (
    <>
      <LoginModal />
      <SignupModal />
      <ProfileModal />
      <CartDrawer />
      <WhatsAppOrderModal />
      <AuthRequiredModal />
      <CandyDetailsModal
        candy={selectedCandyForDetails}
        onClose={() => setSelectedCandyForDetails(null)}
        onAddToCart={(candy, qty) => addToCart(candy, qty)}
        settings={settings}
      />

      {/* Concurrent Device Session Invalidation Modal */}
      {concurrentSessionAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fade-in">
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-rose-100 text-center animate-scale-up"
            role="dialog"
            aria-modal="true"
          >
            <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-500 mx-auto mb-4">
              <ShieldAlert className="w-7 h-7" />
            </div>

            <h3 className="text-lg sm:text-xl font-candy font-bold text-slate-900 mb-2">
              Connexion sur un autre appareil
            </h3>

            <p className="text-xs sm:text-sm text-slate-600 mb-6 leading-relaxed">
              {concurrentSessionAlert}
            </p>

            <button
              type="button"
              onClick={() => {
                setConcurrentSessionAlert(null);
                setIsLoginOpen(true);
              }}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-candy font-bold text-xs sm:text-sm shadow-md shadow-pink-200 transition-all cursor-pointer active:scale-95"
            >
              Compris / Me reconnecter 🍬
            </button>
          </div>
        </div>
      )}

      {/* Floating Success Toast */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm bg-slate-900/95 backdrop-blur-md text-white px-4 py-3 rounded-2xl shadow-2xl border border-pink-500/30 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <span className="text-xl shrink-0">🍬</span>
          <p className="text-xs font-semibold text-slate-100 flex-1 leading-snug">
            {successToast}
          </p>
          <button
            type="button"
            onClick={() => setSuccessToast(null)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer shrink-0"
            title="Fermer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </>
  );
};
