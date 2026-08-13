/**
 * AdminLayout.jsx
 *
 * Layout shell for all ATLAS Admin pages (/admin/*).
 * Includes Admin sidebar, topbar status, and content area.
 */

import React from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import {
  ShieldCheck,
  LayoutDashboard,
  Users,
  CreditCard,
  FileClock,
  Radio,
  History,
  ArrowLeft,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function AdminLayout() {
  const { profile, user } = useAuth();

  const navItems = [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/admin/users', label: 'Users', icon: Users },
    { to: '/admin/subscriptions', label: 'Subscriptions', icon: CreditCard },
    { to: '/admin/archive', label: 'Archive Snapshots', icon: FileClock },
    { to: '/admin/library', label: 'Audio Library', icon: Radio },
    { to: '/admin/audit-logs', label: 'Audit Logs', icon: History },
  ];

  return (
    <div className="min-h-screen bg-ground flex flex-col md:flex-row text-ink">
      {/* Admin Sidebar */}
      <aside className="w-full md:w-64 bg-paper border-b md:border-b-0 md:border-r border-rule shrink-0 flex flex-col">
        {/* Brand Header */}
        <div className="p-6 border-b border-rule flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-black text-white rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="font-display font-bold text-lg tracking-tight">
                ATLAS
              </div>
              <div className="text-xs uppercase tracking-wider font-semibold text-ink/50">
                Admin System
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Navigation Links */}
        <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-black text-white'
                      : 'text-ink/70 hover:text-ink hover:bg-black/5'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-rule bg-ground/50">
          <Link
            to="/archive"
            className="flex items-center justify-center space-x-2 w-full px-4 py-2.5 rounded-lg border border-rule text-sm font-medium text-ink hover:bg-black/5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to App</span>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-paper border-b border-rule px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2 text-sm text-ink/60">
            <span>System Status:</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
              Operational
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-700 border border-amber-500/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>ADMIN</span>
            </span>
            <span className="text-sm font-medium text-ink hidden sm:inline">
              {profile?.display_name || user?.email}
            </span>
          </div>
        </header>

        {/* Page View Container */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
