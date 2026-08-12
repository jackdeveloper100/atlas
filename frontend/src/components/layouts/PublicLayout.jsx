import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import Navbar from '../navigation/Navbar';

/**
 * PublicLayout Container
 * Layout for marketing/public pages (Landing, Pricing, Login, Signup, Terms, Privacy).
 */
export function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-ground text-ink font-sans selection:bg-accent/20">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="bg-paper border-t border-rule py-12 mt-16 text-xs text-ink-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center md:items-start gap-1">
            <span className="font-serif text-base font-bold text-ink">ATLAS</span>
            <p className="text-ink-muted">Persistent Simulated Alternate History Universe.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-6 font-medium">
            <Link to="/pricing" className="hover:text-ink transition-colors">Pricing</Link>
            <Link to="/terms" className="hover:text-ink transition-colors">Terms of Service</Link>
            <Link to="/privacy" className="hover:text-ink transition-colors">Privacy Policy</Link>
          </div>
          <p className="text-[11px] font-mono text-ink-muted/80">
            © {new Date().getFullYear()} ATLAS. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default PublicLayout;
