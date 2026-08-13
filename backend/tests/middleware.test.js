/**
 * tests/middleware.test.js
 * 
 * Middleware tests
 */

const request = require('supertest');
const app = require('../src/app');

describe('Middleware', () => {
  describe('authenticate middleware', () => {
    it('should reject request without Authorization header', async () => {
      const res = await request(app)
        .get('/api/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/Missing or invalid Authorization header/i);
    });

    it('should reject request with malformed Authorization header', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'InvalidFormat');

      expect(res.status).toBe(401);
    });

    it('should reject request with expired/invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid');

      expect(res.status).toBe(401);
    });
  });

  describe('requireSubscription middleware logic', () => {
    const requireSubscription = require('../src/middleware/requireSubscription');
    const { supabase } = require('../src/services/supabase.service');

    it('should return 401 when req.user is missing', async () => {
      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      await requireSubscription(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 when subscription query returns no data', async () => {
      jest.spyOn(supabase, 'from').mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
      });

      const req = { user: { id: 'test-user-id' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      await requireSubscription(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Active subscription required' }));
      expect(next).not.toHaveBeenCalled();
      jest.restoreAllMocks();
    });

    it('should allow access (call next) for active status', async () => {
      jest.spyOn(supabase, 'from').mockImplementation((table) => {
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({ data: { role: 'user' }, error: null }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({
            data: { id: 'sub-1', status: 'active', current_period_end: new Date(Date.now() + 86400000).toISOString() },
            error: null,
          }),
        };
      });

      const req = { user: { id: 'test-user-id' } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      await requireSubscription(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.subscription).toBeDefined();
      jest.restoreAllMocks();
    });

    it('should allow access (call next) for cancelled-but-active period in future', async () => {
      const futureDate = new Date(Date.now() + 86400000).toISOString();
      jest.spyOn(supabase, 'from').mockImplementation((table) => {
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({ data: { role: 'user' }, error: null }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({
            data: { id: 'sub-2', status: 'canceled', cancel_at_period_end: true, current_period_end: futureDate },
            error: null,
          }),
        };
      });

      const req = { user: { id: 'test-user-id' } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      await requireSubscription(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.subscription).toBeDefined();
      jest.restoreAllMocks();
    });

    it('should reject access (403) for expired subscription', async () => {
      const pastDate = new Date(Date.now() - 86400000).toISOString();
      jest.spyOn(supabase, 'from').mockImplementation((table) => {
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({ data: { role: 'user' }, error: null }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({
            data: { id: 'sub-3', status: 'canceled', cancel_at_period_end: true, current_period_end: pastDate },
            error: null,
          }),
        };
      });

      const req = { user: { id: 'test-user-id' } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      await requireSubscription(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
      jest.restoreAllMocks();
    });

    it('should allow access (call next) for admin user without subscription', async () => {
      const req = { user: { id: 'admin-user-id', role: 'admin' } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      await requireSubscription(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.subscription).toBeDefined();
      expect(req.subscription.is_admin_bypass).toBe(true);
    });
  });
});
