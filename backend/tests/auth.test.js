/**
 * tests/auth.test.js
 * 
 * Authentication endpoint tests
 */

const request = require('supertest');
const app = require('../src/app');

describe('Auth Endpoints', () => {
  describe('POST /api/auth/signup', () => {
    it('should reject signup without age confirmation', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'test@example.com',
          password: 'password123',
          age_confirmed: false,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject signup with invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'not-an-email',
          password: 'password123',
          age_confirmed: true,
        });

      expect(res.status).toBe(400);
    });

    it('should reject signup with short password', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'test@example.com',
          password: 'short',
          age_confirmed: true,
        });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should reject login with missing credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({});

      expect(res.status).toBe(400);
    });

    it('should reject login with invalid email format', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'not-an-email',
          password: 'password123',
        });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should reject unauthenticated request', async () => {
      const res = await request(app)
        .get('/api/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(res.status).toBe(401);
    });
  });

  describe('DELETE /api/auth/delete-account', () => {
    it('should reject unauthenticated request', async () => {
      const res = await request(app)
        .delete('/api/auth/delete-account');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    it('should reject forgot-password request without valid email', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'not-an-email' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should accept valid forgot-password request format', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'user@example.com' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('POST /api/auth/reset-password', () => {
    it('should reject reset-password without token', async () => {
      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({ password: 'newpassword123' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject short password in reset-password', async () => {
      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({ password: 'short', access_token: 'fake-token' });

      expect(res.status).toBe(400);
    });
  });

  describe('PUT /api/auth/profile', () => {
    it('should reject unauthenticated profile update request', async () => {
      const res = await request(app)
        .put('/api/auth/profile')
        .send({ display_name: 'New Name' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /api/auth/update-password', () => {
    it('should reject unauthenticated password update request', async () => {
      const res = await request(app)
        .put('/api/auth/update-password')
        .send({ new_password: 'newpassword123' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});
