/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { HomePage } from './pages/HomePage';
import { UserAuthPage } from './pages/UserAuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { WalletPage } from './pages/WalletPage';
import { DepositPage } from './pages/DepositPage';
import { WithdrawalPage } from './pages/WithdrawalPage';
import { SpinPage } from './pages/SpinPage';
import { TasksPage } from './pages/TasksPage';
import { ReferralPage } from './pages/ReferralPage';
import { ProfilePage } from './pages/ProfilePage';
import { CustomerServicePage } from './pages/CustomerServicePage';
import { AdminPanelPage } from './pages/AdminPanelPage';

function AppContent() {
  const { currentPage, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050C08] flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center animate-pulse shadow-lg shadow-emerald-500/25">
          <span className="font-extrabold text-black text-2xl">N</span>
        </div>
        <span className="text-xs text-emerald-400 font-semibold mt-3 tracking-wider uppercase">
          Loading Nexa Earn...
        </span>
      </div>
    );
  }

  switch (currentPage) {
    case 'home':
      return <HomePage />;
    case 'user_auth':
      return <UserAuthPage />;
    case 'dashboard':
      return <DashboardPage />;
    case 'wallet':
      return <WalletPage />;
    case 'deposit':
      return <DepositPage />;
    case 'withdrawal':
      return <WithdrawalPage />;
    case 'spin':
      return <SpinPage />;
    case 'tasks':
    case 'task_details':
      return <TasksPage />;
    case 'referrals':
      return <ReferralPage />;
    case 'profile':
      return <ProfilePage />;
    case 'customer_service':
      return <CustomerServicePage />;
    case 'admin':
      return <AdminPanelPage />;
    default:
      return <HomePage />;
  }
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
