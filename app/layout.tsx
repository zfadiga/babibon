import type { Metadata } from 'next';
import './globals.css';
import { StoreProvider } from '@/context/StoreContext';
import { GlobalStoreModals } from '@/components/store/GlobalStoreModals';

export const metadata: Metadata = {
  title: 'BonbonMagique - Confiserie Enchanteresse & Espace Admin',
  description: 'Boutique en ligne féerique de bonbons pour enfants avec commande WhatsApp et tableau de bord admin unifié.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#FFF9FB] text-slate-800 antialiased" suppressHydrationWarning>
        <StoreProvider>
          {children}
          <GlobalStoreModals />
        </StoreProvider>
      </body>
    </html>
  );
}
