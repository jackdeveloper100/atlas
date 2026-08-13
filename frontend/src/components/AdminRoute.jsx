/**
 * AdminRoute.jsx
 *
 * Route wrapper that requires valid authentication AND server-verified admin role.
 * Frontend checks provide clean UX redirect; server-side middleware (requireAdmin)
 * strictly enforces authorization on every API request.
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function AdminRoute({ children }) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-ground flex items-center justify-center">
        <div className="text-ink text-sm font-medium animate-pulse">
          Verifying Admin Credentials...
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (profile?.role !== 'admin') {
    return <Navigate to="/archive" replace />;
  }

  return children;
}
