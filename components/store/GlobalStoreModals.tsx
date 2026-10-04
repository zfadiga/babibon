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
import { X } from 'lucide-react';

export const GlobalStoreModals: React.FC = () => {
  const {
    selectedCandyForDetails,
    setSelectedCandyForDetails,
    addToCart,
    settings,
    successToast,
    setSuccessToast,
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
