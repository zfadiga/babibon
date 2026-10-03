'use client';

import React, { useState, useEffect } from 'react';
import AdminGuard from '@/components/admin/AdminGuard';
import AdminNavbar from '@/components/admin/AdminNavbar';
import CandyForm from '@/components/admin/CandyForm';
import CandyTable from '@/components/admin/CandyTable';
import OrdersTable from '@/components/admin/OrdersTable';
import AccountSettings from '@/components/admin/AccountSettings';
import UserManagement from '@/components/admin/UserManagement';
import { fetchCandies } from '@/lib/api';
import { Candy } from '@/types';
import { Server, Database } from 'lucide-react';

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<'candies' | 'orders' | 'settings'>('candies');
  const [candies, setCandies] = useState<Candy[]>([]);
  const [loadingCandies, setLoadingCandies] = useState(true);

  const loadCandies = async () => {
    setLoadingCandies(true);
    try {
      const data = await fetchCandies();
      setCandies(data);
    } catch (err: any) {
      console.warn('Could not load candies from backend:', err.message);
    } finally {
      setLoadingCandies(false);
    }
  };

  useEffect(() => {
    loadCandies();
  }, []);

  return (
    <AdminGuard>
      <div className="min-h-screen flex flex-col bg-[#fbf9f8]">
        {/* Top Admin Navbar */}
        <AdminNavbar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* TAB 1: CANDIES MANAGEMENT */}
          {activeTab === 'candies' && (
            <div className="space-y-8 animate-fade-in">
              {/* Form to add candy */}
              <CandyForm onCandyAdded={loadCandies} />

              {/* Table of candies with delete action */}
              <CandyTable
                candies={candies}
                loading={loadingCandies}
                onRefresh={loadCandies}
              />
            </div>
          )}

          {/* TAB 2: ORDERS & SALES */}
          {activeTab === 'orders' && (
            <div className="animate-fade-in">
              <OrdersTable />
            </div>
          )}

          {/* TAB 3: ACCOUNT CREDENTIALS & USER MANAGEMENT */}
          {activeTab === 'settings' && (
            <div className="space-y-8 animate-fade-in">
              {/* Admin login credentials update (email & password) */}
              <AccountSettings />

              {/* Add / create new user with role */}
              <UserManagement />
            </div>
          )}
        </main>

        {/* Footer with connection status indicators */}
        <footer className="bg-white border-t border-gray-100 py-6 text-xs text-gray-500">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-gray-700">Babibon Candy Admin</span>
              <span>&bull;</span>
              <span>Protected with Supabase Auth & Role-Based Access</span>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1.5 text-gray-600">
                <Database className="w-3.5 h-3.5 text-emerald-500" />
                <span>Supabase Ready</span>
              </div>
              <div className="flex items-center space-x-1.5 text-gray-600">
                <Server className="w-3.5 h-3.5 text-rose-500" />
                <span>
                  Backend: {process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}
                </span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </AdminGuard>
  );
}
