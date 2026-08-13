/**
 * AuthContext
 * 
 * Manages user authentication state and subscription status.
 * 
 * CRITICAL: Subscription state here is for UI convenience only.
 * All subscription access control happens server-side.
 */

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../services/supabase';
import api from '../api/client';
import useSessionTimeout from '../hooks/useSessionTimeout';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  // Sign out
  const signOut = useCallback(async (reason = null) => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      // Ignore signout errors
    }
    setUser(null);
    setProfile(null);
    setSession(null);
    setSubscription(null);
    if (reason && typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('atlas_logout_reason', reason);
      } catch (e) {}
    }
  }, []);

  const handleInactivityTimeout = useCallback(() => {
    signOut('inactivity');
  }, [signOut]);

  useSessionTimeout({
    isAuthenticated: Boolean(user),
    onTimeout: handleInactivityTimeout,
  });

  useEffect(() => {
    // Listen for HTTP 401 unauthorized events from API client
    const handleUnauthorized = () => {
      signOut('unauthorized');
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('auth:unauthorized', handleUnauthorized);
    }

    // supabase-js fires onAuthStateChange immediately with the current session
    // on subscribe (INITIAL_SESSION), so a separate getSession() call here would
    // just trigger a second, redundant GET /api/auth/me on every mount.
    const {
      data: { subscription: authSubscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session) {
        fetchUserProfile();
      } else {
        setProfile(null);
        setSubscription(null);
        setLoading(false);
      }
    });

    return () => {
      authSubscription.unsubscribe();
      if (typeof window !== 'undefined') {
        window.removeEventListener('auth:unauthorized', handleUnauthorized);
      }
    };
  }, [signOut]);

  // Fetch user profile and subscription from backend
  async function fetchUserProfile() {
    try {
      const response = await api.get('/auth/me');
      if (response.success && response.data) {
        setProfile(response.data.user);
        setSubscription(response.data.subscription);
        return response.data.user;
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
    } finally {
      setLoading(false);
    }
    return null;
  }

  // Sign up with email + password
  async function signUp(email, password, displayName, ageConfirmed) {
    try {
      const response = await api.post('/auth/signup', {
        email,
        password,
        display_name: displayName,
        age_confirmed: ageConfirmed,
      });

      return { data: response.data, error: null };
    } catch (error) {
      return { data: null, error: error.message || 'Signup failed' };
    }
  }

  // Sign in with email + password
  async function signIn(email, password) {
    try {
      // Clear any stale previous session before setting new session
      await supabase.auth.signOut().catch(() => {});

      const envelope = await api.post('/auth/login', {
        email,
        password,
      });

      if (envelope.success) {
        const { data: { session }, error } = await supabase.auth.setSession({
          access_token: envelope.data.access_token,
          refresh_token: envelope.data.refresh_token,
        });

        if (error) throw error;

        setSession(session);
        setUser(session.user);
        const userProfile = await fetchUserProfile();

        return { data: envelope, profile: userProfile, error: null };
      }

      return { data: null, error: 'Login failed' };
    } catch (error) {
      return { data: null, error: error.response?.data?.message || error.message || 'Login failed' };
    }
  }

  // Request password reset email
  async function forgotPassword(email) {
    try {
      const envelope = await api.post('/auth/forgot-password', { email });
      return { data: envelope, error: null };
    } catch (error) {
      return { data: null, error: error.response?.data?.message || 'Password reset request failed' };
    }
  }

  // Reset password using token/session
  async function resetPassword(password, token) {
    try {
      const envelope = await api.post('/auth/reset-password', {
        password,
        access_token: token,
      });
      return { data: envelope, error: null };
    } catch (error) {
      return { data: null, error: error.response?.data?.message || 'Password reset failed' };
    }
  }

  // Update profile info
  async function updateProfile({ displayName }) {
    try {
      const envelope = await api.put('/auth/profile', {
        display_name: displayName,
      });
      if (envelope.success) {
        await fetchUserProfile();
      }
      return { data: envelope, error: null };
    } catch (error) {
      return { data: null, error: error.response?.data?.message || 'Profile update failed' };
    }
  }

  // Update account security / password
  async function updateSecurity({ newPassword }) {
    try {
      const envelope = await api.put('/auth/update-password', {
        new_password: newPassword,
      });
      return { data: envelope, error: null };
    } catch (error) {
      return { data: null, error: error.response?.data?.message || 'Password update failed' };
    }
  }

  // Delete account
  async function deleteAccount() {
    try {
      await api.delete('/auth/delete-account');
      await signOut();
      return { error: null };
    } catch (error) {
      return { error: error.response?.data?.message || 'Account deletion failed' };
    }
  }

  // Refresh subscription status (call after subscription events)
  async function refreshSubscription() {
    if (user) {
      await fetchUserProfile();
    }
  }

  const isSubscribed = Boolean(
    user &&
      subscription &&
      (subscription.status === 'active' ||
        subscription.status === 'trialing' ||
        (subscription.current_period_end && new Date(subscription.current_period_end) > new Date()))
  );

  const value = {
    user,
    profile,
    session,
    subscription,
    loading,
    signUp,
    signIn,
    signOut,
    forgotPassword,
    resetPassword,
    updateProfile,
    updateSecurity,
    deleteAccount,
    refreshSubscription,
    isSubscriber: isSubscribed,
    isSubscribed,
    hasActiveSubscription: isSubscribed,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

