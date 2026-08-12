/**
 * tests/email.test.js
 * 
 * Unit tests for Centralized Email Service (email.service.js)
 */

const emailService = require('../src/services/email.service');

describe('Email Service', () => {
  describe('sendEmail common function', () => {
    it('should throw an error if recipient or subject is missing', async () => {
      await expect(emailService.sendEmail({})).rejects.toThrow();
      await expect(emailService.sendEmail({ to: 'test@example.com' })).rejects.toThrow();
    });

    it('should successfully dispatch email via fallback JSON transporter', async () => {
      const res = await emailService.sendEmail({
        to: 'user@example.com',
        subject: 'Test Subject',
        html: '<p>Test email body</p>',
      });

      expect(res.success).toBe(true);
    });
  });

  describe('Templated email helpers', () => {
    it('should send welcome email', async () => {
      const res = await emailService.sendWelcomeEmail('newuser@example.com', 'New User');
      expect(res.success).toBe(true);
    });

    it('should send password reset email', async () => {
      const res = await emailService.sendPasswordResetEmail('user@example.com', 'http://localhost:5173/reset-password?token=abc');
      expect(res.success).toBe(true);
    });

    it('should send password changed notification email', async () => {
      const res = await emailService.sendPasswordChangedEmail('user@example.com');
      expect(res.success).toBe(true);
    });

    it('should send subscription confirmation email', async () => {
      const res = await emailService.sendSubscriptionConfirmationEmail('subscriber@example.com');
      expect(res.success).toBe(true);
    });

    it('should send account deletion email', async () => {
      const res = await emailService.sendAccountDeletionEmail('deleted@example.com');
      expect(res.success).toBe(true);
    });
  });
});
