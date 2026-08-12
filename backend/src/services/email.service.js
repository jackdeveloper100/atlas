'use strict';

/**
 * email.service.js
 * 
 * Centralized Email Service for ATLAS.
 * 
 * Uses Nodemailer to deliver emails via SMTP when configured in environment variables.
 * In development or when SMTP environment variables are absent, provides clean log/json fallback
 * so user signup and auth flows complete without failing.
 */

const nodemailer = require('nodemailer');

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587', 10);
const SMTP_SECURE = process.env.SMTP_SECURE === 'true';
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const EMAIL_FROM = process.env.EMAIL_FROM || '"ATLAS Alternate History" <noreply@atlas.com>';

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });
    console.log(`[email.service] Configured SMTP transporter (${SMTP_HOST}:${SMTP_PORT})`);
  } else {
    // Fallback JSON / log transport for development & testing
    transporter = nodemailer.createTransport({
      jsonTransport: true,
    });
    console.log('[email.service] Configured fallback JSON mail transporter (Development/Test)');
  }

  return transporter;
}

/**
 * Common function to send email.
 *
 * @param {object} options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject line
 * @param {string} [options.html] - HTML body
 * @param {string} [options.text] - Plain text body
 * @returns {Promise<{ success: boolean, messageId?: string, error?: string }>}
 */
async function sendEmail({ to, subject, html, text }) {
  if (!to || !subject) {
    throw new Error('Email recipient ("to") and "subject" are required.');
  }

  try {
    const activeTransporter = getTransporter();
    const mailOptions = {
      from: EMAIL_FROM,
      to,
      subject,
      text: text || (html ? html.replace(/<[^>]+>/g, '') : ''),
      html,
    };

    const info = await activeTransporter.sendMail(mailOptions);

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[email.service] Email sent to: ${to} | Subject: "${subject}" | MessageID: ${info.messageId || 'json-log'}`);
      if (info.message) {
        console.log('[email.service] Message content:', info.message);
      }
    }

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (err) {
    console.error(`[email.service] Failed to send email to ${to}:`, err.message);
    return {
      success: false,
      error: err.message,
    };
  }
}

/**
 * Send Welcome Email upon user signup.
 */
async function sendWelcomeEmail(email, displayName) {
  const name = displayName || email.split('@')[0];
  const frontendUrl = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',')[0] : 'http://localhost:5173';

  const html = `
    <div style="font-family: Arial, sans-serif; background-color: #F5F4F2; padding: 24px; color: #111111;">
      <div style="max-width: 600px; margin: 0 auto; background: #FFFFFF; padding: 32px; border-radius: 8px; border: 1px solid #E5E5E5;">
        <h1 style="color: #F0562D; font-size: 24px; margin-bottom: 16px;">Welcome to ATLAS, ${name}!</h1>
        <p style="font-size: 16px; line-height: 1.5; color: #333333;">
          Thank you for creating an account with ATLAS — the persistent simulated alternate-history universe.
        </p>
        <p style="font-size: 16px; line-height: 1.5; color: #333333;">
          You can now log in and explore our founding member features, time-scrubbing Archive, and subscriber Library.
        </p>
        <div style="margin: 32px 0;">
          <a href="${frontendUrl}/login" style="background-color: #F0562D; color: #FFFFFF; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">
            Sign In to ATLAS
          </a>
        </div>
        <hr style="border: none; border-top: 1px solid #EEEEEE; margin: 24px 0;" />
        <p style="font-size: 12px; color: #777777;">
          If you did not create this account, please ignore this email.
        </p>
      </div>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: 'Welcome to ATLAS Alternate History',
    html,
  });
}

/**
 * Send Password Reset link email.
 */
async function sendPasswordResetEmail(email, resetUrl) {
  const html = `
    <div style="font-family: Arial, sans-serif; background-color: #F5F4F2; padding: 24px; color: #111111;">
      <div style="max-width: 600px; margin: 0 auto; background: #FFFFFF; padding: 32px; border-radius: 8px; border: 1px solid #E5E5E5;">
        <h1 style="color: #F0562D; font-size: 24px; margin-bottom: 16px;">ATLAS Password Reset</h1>
        <p style="font-size: 16px; line-height: 1.5; color: #333333;">
          We received a request to reset the password for your ATLAS account.
        </p>
        <p style="font-size: 16px; line-height: 1.5; color: #333333;">
          Click the button below to set a new password:
        </p>
        <div style="margin: 32px 0;">
          <a href="${resetUrl}" style="background-color: #F0562D; color: #FFFFFF; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">
            Reset My Password
          </a>
        </div>
        <p style="font-size: 14px; color: #555555;">Or copy and paste this link in your browser:</p>
        <p style="font-size: 12px; color: #888888; word-break: break-all;">${resetUrl}</p>
        <hr style="border: none; border-top: 1px solid #EEEEEE; margin: 24px 0;" />
        <p style="font-size: 12px; color: #777777;">
          If you did not request a password reset, you can safely ignore this email.
        </p>
      </div>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: 'Reset Your ATLAS Password',
    html,
  });
}

/**
 * Send Password Changed confirmation email.
 */
async function sendPasswordChangedEmail(email) {
  const html = `
    <div style="font-family: Arial, sans-serif; background-color: #F5F4F2; padding: 24px; color: #111111;">
      <div style="max-width: 600px; margin: 0 auto; background: #FFFFFF; padding: 32px; border-radius: 8px; border: 1px solid #E5E5E5;">
        <h1 style="color: #111111; font-size: 22px; margin-bottom: 16px;">Security Alert: Password Changed</h1>
        <p style="font-size: 16px; line-height: 1.5; color: #333333;">
          The password for your ATLAS account (<strong>${email}</strong>) was successfully changed.
        </p>
        <p style="font-size: 14px; color: #666666; margin-top: 16px;">
          If you performed this action, no further steps are needed.
        </p>
        <p style="font-size: 14px; color: #F0562D; font-weight: bold;">
          If you did NOT change your password, please contact support immediately.
        </p>
      </div>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: 'ATLAS Security Notification: Password Changed',
    html,
  });
}

/**
 * Send Subscription Confirmation email.
 */
async function sendSubscriptionConfirmationEmail(email, planName = 'Founding Member Access', amount = '£10.00/month') {
  const html = `
    <div style="font-family: Arial, sans-serif; background-color: #F5F4F2; padding: 24px; color: #111111;">
      <div style="max-width: 600px; margin: 0 auto; background: #FFFFFF; padding: 32px; border-radius: 8px; border: 1px solid #E5E5E5;">
        <h1 style="color: #F0562D; font-size: 24px; margin-bottom: 16px;">Subscription Confirmed!</h1>
        <p style="font-size: 16px; line-height: 1.5; color: #333333;">
          Thank you for subscribing to <strong>ATLAS — ${planName}</strong> (${amount}).
        </p>
        <p style="font-size: 16px; line-height: 1.5; color: #333333;">
          Your active subscription grants full access to the time-scrubbing Archive and subscriber audio Library.
        </p>
        <hr style="border: none; border-top: 1px solid #EEEEEE; margin: 24px 0;" />
        <p style="font-size: 12px; color: #777777;">
          You can manage your subscription anytime from your Account page.
        </p>
      </div>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: 'ATLAS Subscription Confirmed',
    html,
  });
}

/**
 * Send Account Deletion Confirmation email.
 */
async function sendAccountDeletionEmail(email) {
  const html = `
    <div style="font-family: Arial, sans-serif; background-color: #F5F4F2; padding: 24px; color: #111111;">
      <div style="max-width: 600px; margin: 0 auto; background: #FFFFFF; padding: 32px; border-radius: 8px; border: 1px solid #E5E5E5;">
        <h1 style="color: #111111; font-size: 22px; margin-bottom: 16px;">Account Deleted</h1>
        <p style="font-size: 16px; line-height: 1.5; color: #333333;">
          Your ATLAS account (<strong>${email}</strong>) and associated profile data have been permanently deleted per your request.
        </p>
        <p style="font-size: 14px; color: #666666;">
          All active subscriptions were canceled. We're sorry to see you go!
        </p>
      </div>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: 'ATLAS Account Deletion Confirmation',
    html,
  });
}

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
  sendSubscriptionConfirmationEmail,
  sendAccountDeletionEmail,
};
