'use strict';

/**
 * tests/admin.test.js
 *
 * Phase 7: Backend Admin Security & Route Integration Tests.
 */

const request = require('supertest');
const app = require('../src/app');
const requireAdmin = require('../src/middleware/requireAdmin');
const { supabase } = require('../src/services/supabase.service');

describe('Admin Security & API Suite', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('requireAdmin middleware unit tests', () => {
    it('1. should return 401 when req.user is missing', async () => {
      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      await requireAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, error: 'Unauthenticated' })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('2. should return 403 when user is a normal user (role: user)', async () => {
      jest.spyOn(supabase, 'from').mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: { id: 'user-123', display_name: 'Normal User', role: 'user' },
          error: null,
        }),
      });

      const req = { user: { id: 'user-123' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      await requireAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Admin authorization required',
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('3. should return 403 when user is a Pro subscriber without admin role', async () => {
      jest.spyOn(supabase, 'from').mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: { id: 'pro-user-123', display_name: 'Pro Subscriber', role: 'user' },
          error: null,
        }),
      });

      const req = {
        user: { id: 'pro-user-123' },
        subscription: { status: 'active', plan: 'Founding Member' },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      await requireAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    it('4. should call next() and attach userProfile when role is admin', async () => {
      jest.spyOn(supabase, 'from').mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: { id: 'admin-user-123', display_name: 'Admin User', role: 'admin' },
          error: null,
        }),
      });

      const req = { user: { id: 'admin-user-123' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      await requireAdmin(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.userProfile).toEqual({
        id: 'admin-user-123',
        display_name: 'Admin User',
        role: 'admin',
      });
    });
  });

  describe('HTTP Admin Endpoints Security', () => {
    it('should return 401 when requesting /api/admin/stats without authentication header', async () => {
      const res = await request(app).get('/api/admin/stats');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return 401 when requesting /api/admin/users with invalid token', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', 'Bearer invalid-token');
      expect(res.status).toBe(401);
    });

    it('should return 401 when requesting /api/admin/subscriptions with malformed header', async () => {
      const res = await request(app)
        .get('/api/admin/subscriptions')
        .set('Authorization', 'Basic 12345');
      expect(res.status).toBe(401);
    });
  });

  describe('Role Escalation Security Checks', () => {
    it('signup endpoint should ignore client attempts to pass role=admin', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'attacker@example.com',
          password: 'Password123!',
          display_name: 'Attacker',
          age_confirmed: true,
          role: 'admin',
          isAdmin: true,
        });

      // Even if signup fails or succeeds, check body error if validation fails
      // Signup shouldn't accept role field
      if (res.status === 201) {
        expect(res.body.data.user.role).toBeUndefined();
      }
    });
  });
});
