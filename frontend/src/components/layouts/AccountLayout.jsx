import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { User, Shield, CreditCard } from 'lucide-react';
import Navbar from '../navigation/Navbar';

/**
 * AccountLayout Container
 * Specialized layout wrapper for account management with persistent sub-nav tabs.
 */
export function AccountLayout() {
  const location = useLocation();

  const accountTabs = [
    { label: 'Subscription & Overview', path: '/account', icon: CreditCard },
    { label: 'Profile Details', path: '/account/profile', icon: User },
    { label: 'Security & Password', path: '/account/security', icon: Shield },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-ground text-ink font-sans selection:bg-accent/20">
      <Navbar />
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink">Account Management</h1>
          <p className="text-sm text-ink-muted mt-1">Manage your ATLAS membership, personal profile details, and account security.</p>
        </div>

        {/* Account Sub-navigation Tabs */}
        <div className="border-b border-rule flex items-center gap-2 mb-8 pb-3 overflow-x-auto no-scrollbar">
          {accountTabs.map((tab) => {
            const isActive = location.pathname === tab.path;
            const Icon = tab.icon;
            return (
              <Link
                key={tab.path}
                to={tab.path}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-medium transition-all whitespace-nowrap no-underline ${isActive
                    ? 'bg-black text-white font-semibold shadow-xs'
                    : 'text-ink hover:text-ink hover:bg-neutral-100'
                  }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Tab Outlet Content */}
        <div>
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default AccountLayout;
