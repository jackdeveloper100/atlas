'use strict';

/**
 * routes/subscription.routes.js
 *
 * Subscription management endpoints:
 * - POST /api/subscriptions/checkout - Create Stripe checkout session
 * - POST /api/subscriptions/webhook - Handle Stripe webhooks (raw body)
 * - POST /api/subscriptions/portal - Create Stripe customer portal session
 */

const express = require('express');
const authenticate = require('../middleware/authenticate');
const { sendSuccess, sendError } = require('../utils/response');
const { supabase } = require('../services/supabase.service');
const { stripe } = require('../services/stripe.service');
const { logAuditEvent } = require('../services/audit.service');
const emailService = require('../services/email.service');

const router = express.Router();

/**
 * POST /api/subscriptions/checkout
 * 
 * Create Stripe Checkout session for subscription purchase.
 * Requires authentication.
 */
router.post('/checkout', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const userEmail = req.user.email;
    const baseUrl = (process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',')[0] : 'http://localhost:5173').trim();

    // Check if user already has an active subscription
    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (existingSub) {
      return sendError(res, 'User already has an active subscription', 400, {
        code: 'ALREADY_SUBSCRIBED',
      });
    }

    // Get the founding member plan from database or environment
    const { data: plan } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .single();

    const priceId = plan?.stripe_price_id || process.env.STRIPE_FOUNDING_PRICE_ID;

    if (!priceId) {
      return sendError(res, 'No active subscription plan found', 500);
    }

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      customer_email: userEmail,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${baseUrl}/account?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pricing`,
      metadata: {
        user_id: userId,
        plan_id: plan?.id || 'founding_member',
      },
    });

    return sendSuccess(res, {
      checkout_url: session.url,
      session_id: session.id,
    });
  } catch (err) {
    console.error('Checkout creation error:', err);
    return sendError(res, err.message || 'Failed to create checkout session', 500);
  }
});

/**
 * POST /api/subscriptions/verify-session
 * 
 * Verify Stripe Checkout Session or sync user's active Stripe subscription directly to DB.
 * Guarantees that users who complete Stripe Checkout have their subscription active in ATLAS DB
 * even if webhooks are delayed or not forwarded in local dev environments.
 * Requires authentication.
 */
router.post('/verify-session', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const userEmail = req.user.email;
    const { session_id } = req.body;

    let stripeSubscription = null;
    let customerId = null;
    let planId = null;

    if (session_id) {
      const checkoutSession = await stripe.checkout.sessions.retrieve(session_id);
      if (checkoutSession && checkoutSession.subscription) {
        stripeSubscription = await stripe.subscriptions.retrieve(checkoutSession.subscription);
        customerId = checkoutSession.customer;
        planId = checkoutSession.metadata?.plan_id;
      }
    }

    // Fallback: If no session_id or session retrieval didn't yield active sub, query Stripe customers by email
    if (!stripeSubscription && userEmail) {
      const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
        const subs = await stripe.subscriptions.list({ customer: customerId, status: 'active', limit: 1 });
        if (subs.data.length > 0) {
          stripeSubscription = subs.data[0];
        }
      }
    }

    if (!stripeSubscription) {
      return sendError(res, 'No active Stripe subscription found to sync', 404);
    }

    // Get active founding plan ID if not specified
    if (!planId) {
      const { data: dbPlan } = await supabase
        .from('subscription_plans')
        .select('id')
        .eq('is_active', true)
        .single();
      planId = dbPlan?.id;
    }

    // Check if subscription record already exists for this user or subscription ID
    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('id')
      .or(`user_id.eq.${userId},stripe_subscription_id.eq.${stripeSubscription.id}`)
      .limit(1);

    let savedSub = null;
    let saveError = null;

    if (existingSub && existingSub.length > 0) {
      const result = await supabase
        .from('subscriptions')
        .update({
          user_id: userId,
          plan_id: planId,
          stripe_customer_id: customerId,
          stripe_subscription_id: stripeSubscription.id,
          status: stripeSubscription.status,
          current_period_start: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
          cancel_at_period_end: stripeSubscription.cancel_at_period_end,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingSub[0].id)
        .select('*, subscription_plans(*)')
        .single();
      
      savedSub = result.data;
      saveError = result.error;
    } else {
      const result = await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          plan_id: planId,
          stripe_customer_id: customerId,
          stripe_subscription_id: stripeSubscription.id,
          status: stripeSubscription.status,
          current_period_start: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
          cancel_at_period_end: stripeSubscription.cancel_at_period_end,
        })
        .select('*, subscription_plans(*)')
        .single();
      
      savedSub = result.data;
      saveError = result.error;
    }

    if (saveError) {
      console.error('Failed to save subscription:', saveError);
      return sendError(res, 'Failed to save subscription status', 500);
    }

    // Log audit event
    await logAuditEvent(userId, 'subscribe_synced', {
      stripe_subscription_id: stripeSubscription.id,
      session_id,
    });

    return sendSuccess(res, {
      message: 'Subscription verified and activated successfully',
      subscription: savedSub,
    });
  } catch (err) {
    console.error('Verify session error:', err);
    return sendError(res, err.message || 'Failed to verify checkout session', 500);
  }
});

/**
 * POST /api/subscriptions/webhook
 * 
 * Handle Stripe webhook events.
 * 
 * CRITICAL REQUIREMENTS:
 * - Uses raw body for signature verification
 * - Implements idempotency via stripe_webhook_events table
 * - Always returns 200 OK (even on processing errors)
 */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    // Step 1: Verify webhook signature (raw body required)
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    // Step 2: Check idempotency (already processed?)
    const { data: existing } = await supabase
      .from('stripe_webhook_events')
      .select('id')
      .eq('stripe_event_id', event.id)
      .single();

    if (existing) {
      console.log(`Event ${event.id} already processed, skipping`);
      return res.status(200).json({ received: true });
    }

    // Step 3: Process event based on type
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Step 4: Record as processed (idempotency)
    await supabase.from('stripe_webhook_events').insert({
      stripe_event_id: event.id,
      event_type: event.type,
      payload: event,
    });
  } catch (error) {
    console.error('Error processing webhook:', error);
    // Still return 200 (Stripe requires this)
  }

  // Always return 200 OK
  res.status(200).json({ received: true });
});

/**
 * POST /api/subscriptions/portal
 * 
 * Create Stripe Customer Portal session for subscription management.
 * Requires authentication + active subscription.
 */
router.post('/portal', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's subscription
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single();

    if (error || !subscription) {
      return sendError(res, 'No subscription found', 404);
    }

    const baseUrl = (process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',')[0] : 'http://localhost:5173').trim();

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${baseUrl}/account`,
    });

    return sendSuccess(res, {
      portal_url: session.url,
    });
  } catch (err) {
    console.error('Portal creation error:', err);
    return sendError(res, 'Failed to create portal session', 500);
  }
});

// ============================================================================
// Webhook Event Handlers
// ============================================================================

/**
 * Handle checkout.session.completed
 * Creates subscription record in database
 */
async function handleCheckoutCompleted(session) {
  try {
    const userId = session.metadata.user_id;
    const planId = session.metadata.plan_id;

    // Get subscription details from Stripe
    const subscription = await stripe.subscriptions.retrieve(session.subscription);

    // Create subscription record
    await supabase.from('subscriptions').insert({
      user_id: userId,
      plan_id: planId,
      stripe_customer_id: session.customer,
      stripe_subscription_id: subscription.id,
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
    });

    // Log audit event
    await logAuditEvent(userId, 'subscribe', {
      plan_id: planId,
      stripe_subscription_id: subscription.id,
    });

    // Send confirmation email (non-blocking)
    if (session.customer_details && session.customer_details.email) {
      emailService.sendSubscriptionConfirmationEmail(session.customer_details.email).catch((err) =>
        console.error('Subscription confirmation email dispatch error (non-fatal):', err.message)
      );
    }

    console.log(`Subscription created for user ${userId}`);
  } catch (err) {
    console.error('Error handling checkout.session.completed:', err);
    throw err;
  }
}

/**
 * Handle customer.subscription.updated
 * Updates subscription status and period
 */
async function handleSubscriptionUpdated(subscription) {
  try {
    await supabase
      .from('subscriptions')
      .update({
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
      })
      .eq('stripe_subscription_id', subscription.id);

    console.log(`Subscription updated: ${subscription.id}`);
  } catch (err) {
    console.error('Error handling customer.subscription.updated:', err);
    throw err;
  }
}

/**
 * Handle customer.subscription.deleted
 * Marks subscription as canceled
 */
async function handleSubscriptionDeleted(subscription) {
  try {
    const { data } = await supabase
      .from('subscriptions')
      .select('user_id')
      .eq('stripe_subscription_id', subscription.id)
      .single();

    await supabase
      .from('subscriptions')
      .update({
        status: 'canceled',
        canceled_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', subscription.id);

    // Log audit event
    if (data) {
      await logAuditEvent(data.user_id, 'cancel', {
        stripe_subscription_id: subscription.id,
      });
    }

    console.log(`Subscription canceled: ${subscription.id}`);
  } catch (err) {
    console.error('Error handling customer.subscription.deleted:', err);
    throw err;
  }
}

/**
 * Handle invoice.payment_failed
 * Marks subscription as past_due
 */
async function handlePaymentFailed(invoice) {
  try {
    if (invoice.subscription) {
      await supabase
        .from('subscriptions')
        .update({
          status: 'past_due',
        })
        .eq('stripe_subscription_id', invoice.subscription);

      console.log(`Subscription marked past_due: ${invoice.subscription}`);
    }
  } catch (err) {
    console.error('Error handling invoice.payment_failed:', err);
    throw err;
  }
}

module.exports = router;
