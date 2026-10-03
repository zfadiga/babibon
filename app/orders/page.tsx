'use client';

import React from 'react';
import Link from 'next/link';
import { StoreNavbar } from '@/components/store/Navbar';
import { OrdersView } from '@/components/store/OrdersView';
import { useStore } from '@/context/StoreContext';

export default function OrdersPage() {
  const { settings } = useStore();

  return (
    <div className="min-h-screen flex flex-col bg-[#FFF9FB]">
      <StoreNavbar />

      <main className="flex-1">
        <OrdersView />
      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t border-pink-100 mt-16 py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-candy font-bold text-slate-700">BonbonMagique</span>
            <span>&bull;</span>
            <span>Suivi et historique de vos commandes</span>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-pink-600 transition-colors">
              Retour boutique
            </Link>
            <Link href="/cart" className="hover:text-pink-600 transition-colors">
              Mon Panier
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
