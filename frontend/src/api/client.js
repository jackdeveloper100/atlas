/**
 * api/client.js
 *
 * Centralized Axios client for all API requests.
 * Automatically includes credentials and handles the API response envelope
 * format defined in DECISIONS.md.
 *
 * All backend routes return:
 *   { success: true, data: {...}, error: null }
 * or:
 *   { success: false, data: null, error: "message" }
 *
 * Usage in components:
 *   import api from '@/api/client';
 *   const response = await api.get('/health');
 *   if (response.success) { ... }
 */

import axios from 'axios';
import { supabase } from '../services/supabase';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

const client = axios.create({
  baseURL,
  timeout: 15000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Request interceptor ──────────────────────────────────────────────────
// Add Authorization header if a token exists in active Supabase session
client.interceptors.request.use(
  async (config) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
      }
    } catch (err) {
      // Ignore session retrieval error if unauthenticated
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

    // Return a rejected promise with structured error
    return Promise.reject({
      message,
      statusCode,
      originalError: error,
    });
  }
);

export default client;
