'use client';

import { useAdminAuth } from './AdminGuard';
import { Candy, ShoppingBag, Users, LogOut, ShieldCheck } from 'lucide-react';

interface AdminNavbarProps {
  activeTab: 'candies' | 'orders' | 'settings';
  setActiveTab: (tab: 'candies' | 'orders' | 'settings') => void;
}

export default function AdminNavbar({ activeTab, setActiveTab }: AdminNavbarProps) {
  const { user, profile, signOut } = useAdminAuth();

  return (
    <header className="bg-white border-b border-rose-100 shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 to-pink-500 flex items-center justify-center text-white shadow-md shadow-rose-200">
              <Candy className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">
                  Babibon Sweets
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-rose-100 text-rose-800">
                  <ShieldCheck className="w-3 h-3 mr-1" />
                  Admin
                </span>
              </div>
              <p className="text-xs text-gray-500 hidden sm:block">
                Tableau de bord de gestion
              </p>
            </div>
          </div>

          {/* Nav Tabs */}
          <nav className="flex space-x-1 sm:space-x-2">
            <button
              onClick={() => setActiveTab('candies')}
              className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-xl transition-colors cursor-pointer ${
                activeTab === 'candies'
                  ? 'bg-rose-50 text-rose-700 shadow-sm border border-rose-200'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Candy className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Inventaire Bonbons</span>
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-xl transition-colors cursor-pointer ${
                activeTab === 'orders'
                  ? 'bg-rose-50 text-rose-700 shadow-sm border border-rose-200'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <ShoppingBag className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Commandes Clients</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-xl transition-colors cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-rose-50 text-rose-700 shadow-sm border border-rose-200'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Users className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Paramètres & Équipe</span>
            </button>
          </nav>

          {/* Profile badge & logout */}
          <div className="flex items-center space-x-2 sm:space-x-3">

            <div className="text-right hidden md:block">
              <p className="text-xs font-semibold text-gray-800 truncate max-w-[180px]">
                {(user as any)?.username || user?.email || 'admin'}
              </p>
              <span className="text-[10px] text-emerald-600 font-medium uppercase tracking-wider">
                ● Rôle: {profile?.role || 'Admin'}
              </span>
            </div>

            <button
              onClick={() => signOut()}
              title="Déconnexion"
              className="p-2 rounded-xl text-gray-500 hover:text-rose-600 hover:bg-rose-50 transition-colors border border-gray-200 hover:border-rose-200 cursor-pointer"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
