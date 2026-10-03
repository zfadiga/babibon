'use client';

import React from 'react';
import { useStore } from '@/context/StoreContext';
import { LoginModal } from './LoginModal';
import { SignupModal } from './SignupModal';
import { ProfileModal } from './ProfileModal';
import { CartDrawer } from './CartDrawer';
import { WhatsAppOrderModal } from './WhatsAppOrderModal';
import { CandyDetailsModal } from './CandyDetailsModal';

export const GlobalStoreModals: React.FC = () => {
  const {
    selectedCandyForDetails,
    setSelectedCandyForDetails,
    addToCart,
    settings,
    setIsWhatsAppModalOpen,
  } = useStore();

  return (
    <>
      <LoginModal />
      <SignupModal />
      <ProfileModal />
      <CartDrawer />
      <WhatsAppOrderModal />
      <CandyDetailsModal
        candy={selectedCandyForDetails}
        onClose={() => setSelectedCandyForDetails(null)}
        onAddToCart={(candy, qty) => addToCart(candy, qty)}
        settings={settings}
      />
    </>
  );
};
