/**
 * tests/subscription.test.js
 * 
 * Subscription endpoint tests
 */

const request = require('supertest');
const app = require('../src/app');

describe('Subscription Endpoints', () => {
  describe('POST /api/subscriptions/checkout', () => {
    it('should reject unauthenticated request', async () => {
      const res = await request(app)
        .post('/api/subscriptions/checkout');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/subscriptions/webhook', () => {
    it('should reject request without signature', async () => {
      const res = await request(app)
        .post('/api/subscriptions/webhook')
        .send({
          type: 'checkout.session.completed',
          data: {},
        });

      expect(res.status).toBe(400);
    });

    it('should reject request with invalid signature', async () => {
      const res = await request(app)
        .post('/api/subscriptions/webhook')
        .set('stripe-signature', 'invalid-signature')
        .send({
          type: 'checkout.session.completed',
          data: {},
        });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/subscriptions/portal', () => {
    it('should reject unauthenticated request', async () => {
      const res = await request(app)
        .post('/api/subscriptions/portal');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/subscriptions/verify-session', () => {
    it('should reject unauthenticated request', async () => {
      const res = await request(app)
        .post('/api/subscriptions/verify-session');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});
