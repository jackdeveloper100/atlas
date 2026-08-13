'use strict';

/**
 * routes/auth.routes.js
 *
 * Authentication endpoints:
 * - POST /api/auth/signup - Create new user account with age gate
 * - POST /api/auth/login - Sign in existing user
 * - GET /api/auth/me - Get current user profile + subscription status
 * - DELETE /api/auth/delete-account - Delete user account (requires auth)
 */

const express = require('express');
const { body } = require('express-validator');
const authenticate = require('../middleware/authenticate');
const { sendSuccess, sendError } = require('../utils/response');
const { supabase, supabaseAuth } = require('../services/supabase.service');
const { stripe } = require('../services/stripe.service');
const { logAuditEvent } = require('../services/audit.service');
const emailService = require('../services/email.service');
const validate = require('../middleware/validate');

const router = express.Router();

/**
 * POST /api/auth/signup
 * 
 * Create new user account with age gate confirmation.
 * Creates auth.users and profiles record.
 */
router.post(
  '/signup',
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters'),
    body('display_name')
      .optional()
      .isLength({ min: 1, max: 100 })
      .withMessage('Display name must be 1-100 characters'),
    body('age_confirmed')
      .equals('true')
      .withMessage('Age confirmation required'),
  ],
  async (req, res) => {
    try {
      const { email, password, display_name, age_confirmed } = req.body;

      // Strict boolean check for age gate
      if (age_confirmed !== 'true' && age_confirmed !== true) {
        return sendError(res, 'Age confirmation required', 400, {
          code: 'AGE_GATE_REQUIRED',
        });
      }

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm: admin.createUser does not send verification emails
      });

      if (authError) {
        return sendError(res, authError.message, 400);
      }

      // Create profile
      const { error: profileError } = await supabase.from('profiles').insert({
        id: authData.user.id,
        display_name: display_name || null,
        age_confirmed_at: new Date().toISOString(),
      });

      if (profileError) {
        // Rollback: delete auth user if profile creation fails
        await supabase.auth.admin.deleteUser(authData.user.id);
        return sendError(res, 'Failed to create profile', 500);
      }

      // Log audit event
      await logAuditEvent(authData.user.id, 'signup', {
        email,
        display_name: display_name || null,
      });

      // Send welcome email notification (non-blocking)
      emailService.sendWelcomeEmail(email, display_name).catch((err) =>
        console.error('Welcome email dispatch error (non-fatal):', err.message)
      );

      return sendSuccess(res, {
        message: 'Account created successfully. You can now sign in.',
        user: {
          id: authData.user.id,
          email: authData.user.email,
        },
      }, 201);
    } catch (err) {
      console.error('Signup error:', err);
      return sendError(res, 'Signup failed', 500);
    }
  }
);

/**
 * POST /api/auth/login
 * 
 * Sign in with email + password.
 * Returns JWT token for subsequent requests.
 */
router.post(
  '/login',
  [
    body('email')
      .isEmail()
      .normalizeEmail({ gmail_remove_subaddress: false, gmail_remove_dots: false })
      .withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password required'),
  ],
  validate,
  async (req, res) => {
    try {
      const { email, password } = req.body;

      // IMPORTANT: Use supabaseAuth (anon key client), NOT supabase (service-role client).
      // signInWithPassword does not work on a service-role client with persistSession:false.
      const { data, error } = await supabaseAuth.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Supabase signInWithPassword error:', error.status, error.message);
        // In development, include the Supabase error detail for debugging.
        // In production, always return the generic message.
        const isDev = process.env.NODE_ENV !== 'production';
        const errorMessage = isDev
          ? `Invalid credentials: ${error.message}`
          : 'Invalid credentials';
        return sendError(res, errorMessage, 401);
      }

      if (!data.session) {
        console.error('Login succeeded but no session returned — unexpected Supabase state');
        return sendError(res, 'Login failed: no session returned', 500);
      }

      // Log audit event (non-blocking — failure must not break login)
      logAuditEvent(data.user.id, 'login', { email }).catch((err) =>
        console.error('Audit log failed (non-fatal):', err)
      );

      return sendSuccess(res, {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        user: {
          id: data.user.id,
          email: data.user.email,
        },
      });
    } catch (err) {
      console.error('Login error:', err);
      return sendError(res, 'Login failed', 500);
    }
  }
);

/**
 * GET /api/auth/me
 * 
 * Get current user profile + subscription status.
 * Requires authentication.
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (profileError || !profile) {
      return sendError(res, 'Profile not found', 404);
    }

    // Get user subscription (latest record, if any exists)
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*, subscription_plans(*)')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    return sendSuccess(res, {
      user: {
        id: req.user.id,
        email: req.user.email,
        display_name: profile.display_name,
        role: profile.role || 'user',
        created_at: profile.created_at,
      },
      subscription: subscription || null,
    });
  } catch (err) {
    console.error('Get user error:', err);
    return sendError(res, 'Failed to fetch user', 500);
  }
});

/**
 * DELETE /api/auth/delete-account
 * 
 * Delete user account with proper cascade:
 * 1. Cancel Stripe subscriptions
 * 2. Delete database records (cascade)
 * 3. Delete auth user
 * 
 * Requires authentication.
 */
router.delete('/delete-account', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    // Step 1: Get all active Stripe subscriptions
    const { data: subscriptions } = await supabase
      .from('subscriptions')
      .select('stripe_subscription_id, status')
      .eq('user_id', userId)
      .in('status', ['active', 'trialing', 'past_due']);

    // Step 2: Cancel all Stripe subscriptions
    if (subscriptions && subscriptions.length > 0) {
      for (const sub of subscriptions) {
        try {
          await stripe.subscriptions.cancel(sub.stripe_subscription_id);
        } catch (stripeError) {
          console.error('Failed to cancel Stripe subscription:', stripeError);
          return sendError(res, 'Failed to cancel subscription', 500);
        }
      }

      // Update local subscription records
      await supabase
        .from('subscriptions')
        .update({
          status: 'canceled',
          canceled_at: new Date().toISOString(),
        })
        .eq('user_id', userId);
    }

    // Step 3: Log deletion intent
    await logAuditEvent(userId, 'delete_account', {
      email: req.user.email,
    });

    const userEmail = req.user.email;

    // Step 4: Delete auth user (cascades to profiles and subscriptions)
    const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error('Failed to delete user:', deleteError);
      return sendError(res, 'Account deletion failed', 500);
    }

    // Send account deletion confirmation email (non-blocking)
    if (userEmail) {
      emailService.sendAccountDeletionEmail(userEmail).catch((err) =>
        console.error('Account deletion email dispatch error (non-fatal):', err.message)
      );
    }

    return sendSuccess(res, {
      message: 'Account deleted successfully',
    });
  } catch (err) {
    console.error('Delete account error:', err);
    return sendError(res, 'Account deletion failed', 500);
  }
});

/**
 * POST /api/auth/forgot-password
 * 
 * Request a password reset link via email.
 */
router.post(
  '/forgot-password',
  [
    body('email')
      .isEmail()
      .normalizeEmail({ gmail_remove_subaddress: false, gmail_remove_dots: false })
      .withMessage('Valid email required'),
  ],
  validate,
  async (req, res) => {
    try {
      const { email } = req.body;
      const baseUrl = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',')[0] : 'http://localhost:5173';
      const resetUrl = `${baseUrl}/reset-password`;

      const { error } = await supabaseAuth.auth.resetPasswordForEmail(email, {
        redirectTo: resetUrl,
      });

      if (error) {
        console.error('Forgot password Supabase error:', error.message);
      }

      // Always dispatch custom password reset email using common email service
      emailService.sendPasswordResetEmail(email, resetUrl).catch((err) =>
        console.error('Password reset email dispatch error (non-fatal):', err.message)
      );

      // Always return a positive response to prevent email enumeration
      return sendSuccess(res, {
        message: 'If an account exists with that email, a password reset link has been sent.',
      });
    } catch (err) {
      console.error('Forgot password exception:', err);
      return sendError(res, 'Failed to process password reset request', 500);
    }
  }
);

/**
 * POST /api/auth/reset-password
 * 
 * Reset user password with an active session/token or user credentials.
 */
router.post(
  '/reset-password',
  [
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters'),
  ],
  validate,
  async (req, res) => {
    try {
      const { password, access_token } = req.body;
      const authHeader = req.headers.authorization;
      const token = (authHeader && authHeader.startsWith('Bearer '))
        ? authHeader.substring(7)
        : access_token;

      if (!token) {
        return sendError(res, 'Authentication token required for password reset', 401);
      }

      const { data: userData, error: userError } = await supabase.auth.getUser(token);
      if (userError || !userData.user) {
        return sendError(res, 'Invalid or expired password reset session', 401);
      }

      const { error: updateError } = await supabase.auth.admin.updateUserById(userData.user.id, {
        password,
      });

      if (updateError) {
        console.error('Password reset update error:', updateError.message);
        return sendError(res, 'Failed to update password', 400);
      }

      await logAuditEvent(userData.user.id, 'reset_password', { email: userData.user.email });

      // Send password changed notification email (non-blocking)
      if (userData.user.email) {
        emailService.sendPasswordChangedEmail(userData.user.email).catch((err) =>
          console.error('Password changed email dispatch error (non-fatal):', err.message)
        );
      }

      return sendSuccess(res, {
        message: 'Password reset successfully. You can now log in with your new password.',
      });
    } catch (err) {
      console.error('Reset password exception:', err);
      return sendError(res, 'Password reset failed', 500);
    }
  }
);

/**
 * PUT /api/auth/profile
 * 
 * Update profile information (display_name, etc.).
 * Requires authentication.
 */
router.put(
  '/profile',
  authenticate,
  [
    body('display_name')
      .optional()
      .isLength({ min: 1, max: 100 })
      .withMessage('Display name must be 1-100 characters'),
  ],
  validate,
  async (req, res) => {
    try {
      const { display_name } = req.body;

      const updateData = {};
      if (display_name !== undefined) {
        updateData.display_name = display_name;
      }

      const { data: updatedProfile, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', req.user.id)
        .select()
        .single();

      if (error) {
        console.error('Update profile error:', error.message);
        return sendError(res, 'Failed to update profile', 500);
      }

      await logAuditEvent(req.user.id, 'update_profile', { display_name });

      return sendSuccess(res, {
        message: 'Profile updated successfully',
        profile: updatedProfile,
      });
    } catch (err) {
      console.error('Update profile exception:', err);
      return sendError(res, 'Failed to update profile', 500);
    }
  }
);

/**
 * PUT /api/auth/update-password
 * 
 * Update user password for authenticated session.
 * Requires authentication.
 */
router.put(
  '/update-password',
  authenticate,
  [
    body('new_password')
      .isLength({ min: 8 })
      .withMessage('New password must be at least 8 characters'),
  ],
  validate,
  async (req, res) => {
    try {
      const { new_password } = req.body;

      const { error } = await supabase.auth.admin.updateUserById(req.user.id, {
        password: new_password,
      });

      if (error) {
        console.error('Update password error:', error.message);
        return sendError(res, 'Failed to update password', 400);
      }

      await logAuditEvent(req.user.id, 'update_password', { email: req.user.email });

      // Send password changed notification email (non-blocking)
      if (req.user.email) {
        emailService.sendPasswordChangedEmail(req.user.email).catch((err) =>
          console.error('Password updated email dispatch error (non-fatal):', err.message)
        );
      }

      return sendSuccess(res, {
        message: 'Password updated successfully',
      });
    } catch (err) {
      console.error('Update password exception:', err);
      return sendError(res, 'Failed to update password', 500);
    }
  }
);

module.exports = router;
