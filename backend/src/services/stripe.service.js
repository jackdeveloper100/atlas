/**
 * Stripe Service
 * 
 * CRITICAL: Uses STRIPE_SECRET_KEY which must NEVER be exposed to frontend.
 */

const Stripe = require('stripe');

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required environment variable: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

module.exports = { stripe };
