import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { X, User, LogOut, Globe, ShieldCheck } from 'lucide-react';
import Button from '../ui/Button';
import Badge from '../ui/Badge';

/**
 * MobileNav Navigation Drawer
 * Slide-over drawer for mobile screen sizes (375px+).
 */
export function MobileNav({ isOpen, onClose, navLinks, user, isSubscriber, onSignOut }) {
  const location = useLocation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-ink/40 backdrop-blur-xs transition-opacity" onClick={onClose} />

      {/* Drawer Container */}
      <div className="fixed inset-y-0 right-0 w-4/5 max-w-xs bg-paper border-l border-rule shadow-2xl p-6 flex flex-col justify-between z-10 animate-in slide-in-from-right duration-200">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-6 border-b border-rule">
            <div className="flex items-center gap-2">
              <span className="font-sans text-base font-bold tracking-tight text-ink">Atlas</span>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-full text-ink-muted hover:text-ink hover:bg-ground"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User info if logged in */}
          {user && (
            <div className="py-4 border-b border-rule">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-neutral-200 text-ink font-mono text-sm font-bold flex items-center justify-center">
                  {(user.email || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-ink truncate max-w-[160px]">{user.email}</span>
                  <div className="mt-0.5">
                    {isSubscriber ? (
                      <Badge variant="accent" size="sm">PRO ACCOUNT</Badge>
                    ) : (
                      <Badge variant="default" size="sm">FREE ACCOUNT</Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Links */}
          <nav className="flex flex-col gap-1 py-6">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path || location.pathname.startsWith(`${link.path}/`);
              const Icon = link.icon;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-black text-white font-semibold'
                      : 'text-ink-muted hover:text-ink hover:bg-ground/50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
            {user && (
              <Link
                to="/account"
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-ink-muted hover:text-ink hover:bg-ground/50"
              >
                <User className="w-5 h-5" />
                <span>Account Settings</span>
              </Link>
            )}
          </nav>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-rule">
          {user ? (
            <Button
              variant="danger"
              size="md"
              leftIcon={LogOut}
              onClick={() => {
                onClose();
                onSignOut();
              }}
              className="w-full"
            >
              Sign Out
            </Button>
          ) : (
            <div className="flex flex-col gap-2">
              <Link to="/login" onClick={onClose} className="w-full">
                <Button variant="secondary" size="md" className="w-full">Log In</Button>
              </Link>
              <Link to="/register" onClick={onClose} className="w-full">
                <Button variant="primary" size="md" className="w-full">Get Started</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MobileNav;
