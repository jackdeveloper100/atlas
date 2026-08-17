/**
 * api/client.js
 *
 * Centralized Axios client for all API requests.
 * Automatically includes credentials and handles the API response envelope
 * format defined in DECISIONS.md.
 */

import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

const client = axios.create({
  baseURL,
  timeout: 60000, // 60 seconds default API timeout
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Fast synchronous check from localStorage to retrieve the active Supabase JWT access token.
 * Completely avoids Supabase navigator lock deadlocks (navigator.locks.request) in browser tabs.
 */
function getStoredAccessToken() {
  try {
    if (typeof localStorage === 'undefined') return null;

    // Direct lookup for project auth token
    const specificKey = 'sb-qcygciofjsmkdqsvillj-auth-token';
    const specificItem = localStorage.getItem(specificKey);
    if (specificItem) {
      const parsed = JSON.parse(specificItem);
      const token = parsed?.access_token || parsed?.currentSession?.access_token;
      const expiresAt = parsed?.expires_at || parsed?.currentSession?.expires_at;
      if (token && (!expiresAt || expiresAt * 1000 > Date.now())) {
        return token;
      }
    }

    // Fallback iteration across storage keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('auth-token') || key.includes('supabase.auth.token'))) {
        const item = localStorage.getItem(key);
        if (item) {
          const parsed = JSON.parse(item);
          const token = parsed?.access_token || parsed?.currentSession?.access_token;
          const expiresAt = parsed?.expires_at || parsed?.currentSession?.expires_at;
          if (token && (!expiresAt || expiresAt * 1000 > Date.now())) {
            return token;
          }
        }
      }
    }
  } catch (err) {
    // Ignore storage parsing error
  }
  return null;
}

// ── Request interceptor ──────────────────────────────────────────────────
// Add Authorization header if a token exists in active session
client.interceptors.request.use(
  (config) => {
    if (!config.headers.Authorization) {
      const fastToken = getStoredAccessToken();
      if (fastToken) {
        config.headers.Authorization = `Bearer ${fastToken}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor ─────────────────────────────────────────────────
// Unwrap the envelope and handle errors consistently
client.interceptors.response.use(
  (response) => {
    // All successful responses return the envelope directly
    return response.data;
  },
  (error) => {
    // Extract error message from the envelope or fallback
    const message =
      error.response?.data?.error ||
      error.message ||
      'An unexpected error occurred.';

    const statusCode = error.response?.status || 500;

    // Trigger auto-logout event on HTTP 401 Unauthorized
    if (statusCode === 401 && typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('auth:unauthorized', {
          detail: { message, statusCode },
        })
      );
    }

    // Return a rejected promise with structured error
    return Promise.reject({
      message,
      statusCode,
      originalError: error,
    });
  }
);

export default client;
