import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Clock,
  User,
  LogOut,
  Menu,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import MobileNav from './MobileNav';

/**
 * Navbar Navigation Bar
 * Global header navigation bar for ATLAS.
 */
export function Navbar() {
  const { user, isSubscriber, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  // Check if the current route is active
  const isActivePath = (path) => {
    return (
      location.pathname === path ||
      (path !== '/' && location.pathname.startsWith(`${path}/`))
    );
  };

  const allNavLinks = [
    {
      label: 'Projection',
      path: '/projection',
      icon: Clock,
      protected: true,
    },
    {
      label: 'Archive',
      path: '/archive',
      icon: Clock,
      protected: true,
    },
    {
      label: 'Library',
      path: '/library',
      icon: BookOpen,
      protected: true,
    },
  ];

  const navLinks = user ? allNavLinks : allNavLinks.filter((link) => !link.protected);

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-rule transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-12 flex items-center justify-between">

        {/* Left: Brand Logo */}
        <Link to="/" className="flex items-center gap-2">
          <span className="font-sans text-base font-bold tracking-tight text-ink">
            Atlas
          </span>
        </Link>

        {/* Right: Navigation Links + Auth */}
        <div className="hidden md:flex items-center gap-6">

          {/* Optional Navigation Links */}

          <nav className="flex items-center gap-2">
            {navLinks.map((link) => {
              const isActive = isActivePath(link.path);

              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-4 p-2 text-xs font-medium transition-all ${isActive
                    ? 'bg-black text-white font-semibold shadow-xs'
                    : 'text-ink hover:bg-neutral-100'
                    }`}
                >
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {user ? (
            /* =========================
                    Logged-in User
                    ========================= */
            <div className="relative flex items-center gap-4 border-l border-rule pl-4">

              {/* Notification Indicator */}
              <div className="flex items-center gap-1 font-mono text-xs font-bold text-ink">
                <span>12</span>
                <span className="w-2 h-2 rounded-full bg-black inline-block" />
              </div>

              {/* Avatar Button */}
              <button
                type="button"
                onClick={() => setIsUserMenuOpen((prev) => !prev)}
                className="flex items-center focus:outline-none shrink-0"
                aria-label="Open user menu"
                aria-expanded={isUserMenuOpen}
              >
                <div className="w-[25px] h-[25px] rounded-full bg-neutral-200 border border-neutral-400 text-ink font-sans text-xs font-bold flex items-center justify-center shadow-2xs shrink-0">
                  {(user.email || 'A').charAt(0).toUpperCase()}
                </div>
              </button>

              {/* User Dropdown Menu */}
              {isUserMenuOpen && (
                <>
                  {/* Backdrop */}
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setIsUserMenuOpen(false)}
                  />

                  {/* Dropdown */}
                  <div className="absolute right-0 top-full mt-2 w-44 bg-paper border border-rule rounded-lg shadow-md py-1.5 z-20 animate-in fade-in zoom-in-95 duration-150">

                    {/* User Info */}
                    <div className="px-3 py-2 border-b border-rule bg-neutral-50">
                      <p className="text-xs font-semibold text-ink truncate">
                        {user.email}
                      </p>

                      <p className="text-[10px] font-mono text-ink-muted uppercase tracking-wider mt-0.5">
                        {isSubscriber ? 'Pro Account' : 'Free Account'}
                      </p>
                    </div>

                    {/* Account Settings */}
                    <Link
                      to="/account"
                      onClick={() => setIsUserMenuOpen(false)}
                      className={`flex items-center gap-2 px-3 py-2 text-xs font-medium transition-colors no-underline ${isActivePath('/account')
                        ? 'bg-black text-white'
                        : 'text-ink hover:bg-neutral-100'
                        }`}
                    >
                      <User
                        className={`w-3.5 h-3.5 shrink-0 ${isActivePath('/account')
                          ? 'text-white'
                          : 'text-ink-muted'
                          }`}
                      />

                      <span>Account Settings</span>
                    </Link>

                    {/* Sign Out */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        handleSignOut();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-danger hover:bg-rose-50 transition-colors border-t border-rule mt-1"
                    >
                      <LogOut className="w-3.5 h-3.5 shrink-0" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            /* =========================
               Logged-out User
               ========================= */
            <div className="flex items-center gap-1">

              {/* Sign Up */}
              <Link
                to="/signup"
                className={`px-4 p-2 text-xs font-medium transition-all ${isActivePath('/signup')
                  ? 'bg-black text-white font-semibold shadow-xs'
                  : 'text-ink hover:bg-neutral-100'
                  }`}
              >
                Sign Up
              </Link>

              {/* Login */}
              <Link
                to="/login"
                className={`px-4 p-2 text-xs font-medium transition-all ${isActivePath('/login')
                  ? 'bg-black text-white font-semibold shadow-xs'
                  : 'text-ink hover:bg-neutral-100'
                  }`}
              >
                Login
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Toggle Button */}
        <div className="flex md:hidden items-center gap-2">
          <button
            type="button"
            onClick={() => setIsMobileOpen(true)}
            className="p-2 rounded-md text-ink-muted hover:text-ink hover:bg-ground transition-colors"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      <MobileNav
        isOpen={isMobileOpen}
        onClose={() => setIsMobileOpen(false)}
        navLinks={navLinks}
        user={user}
        isSubscriber={isSubscriber}
        onSignOut={handleSignOut}
      />
    </header>
  );
}

export default Navbar;
