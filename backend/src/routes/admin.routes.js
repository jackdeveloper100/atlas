'use strict';

/**
 * routes/admin.routes.js
 *
 * Phase 7: REST API endpoints for ATLAS Admin System.
 *
 * Protected by `authenticate` + `requireAdmin` middleware.
 * Returns standard response envelope:
 *   { success: true, data: {...}, error: null }
 * or:
 *   { success: false, data: null, error: "message" }
 */

const express = require('express');
const { body, param, query } = require('express-validator');
const authenticate = require('../middleware/authenticate');
const requireAdmin = require('../middleware/requireAdmin');
const validate = require('../middleware/validate');
const { sendSuccess, sendError } = require('../utils/response');
const adminService = require('../services/admin.service');

const router = express.Router();

// Apply authenticate and requireAdmin to ALL admin routes
router.use(authenticate);
router.use(requireAdmin);

/**
 * GET /api/admin/stats
 * Get overall system metrics and dashboard activity summary.
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await adminService.getDashboardStats();
    return sendSuccess(res, stats);
  } catch (err) {
    console.error('Admin stats error:', err);
    return sendError(res, 'Failed to fetch admin stats', 500);
  }
});

/**
 * GET /api/admin/users
 * Query paginated list of user accounts.
 */
router.get(
  '/users',
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('search').optional().isString(),
  ],
  validate,
  async (req, res) => {
    try {
      const { page = 1, limit = 20, search = '' } = req.query;
      const result = await adminService.getUsers({ page, limit, search });
      return sendSuccess(res, result);
    } catch (err) {
      console.error('Admin getUsers error:', err);
      return sendError(res, 'Failed to fetch users', 500);
    }
  }
);

/**
 * GET /api/admin/users/:id
 * Get detailed profile, subscription history, and activity logs for a specific user.
 */
router.get(
  '/users/:id',
  [param('id').isUUID().withMessage('Valid user UUID required')],
  validate,
  async (req, res) => {
    try {
      const userDetail = await adminService.getUserById(req.params.id);
      if (!userDetail) {
        return sendError(res, 'User not found', 404);
      }
      return sendSuccess(res, userDetail);
    } catch (err) {
      console.error('Admin getUserById error:', err);
      return sendError(res, 'Failed to fetch user details', 500);
    }
  }
);

/**
 * POST /api/admin/users
 * Create a new user account directly from Admin system.
 */
router.post(
  '/users',
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('display_name').optional().isString().trim(),
    body('role').optional().isIn(['user', 'admin']).withMessage("Role must be 'user' or 'admin'"),
  ],
  validate,
  async (req, res) => {
    try {
      const adminUserId = req.user.id;
      const { email, password, display_name, role } = req.body;

      const newUser = await adminService.createUser(adminUserId, {
        email,
        password,
        displayName: display_name,
        role: role || 'user',
      });

      return sendSuccess(res, newUser, 201);
    } catch (err) {
      console.error('Admin createUser error:', err);
      return sendError(res, err.message || 'Failed to create user', 400);
    }
  }
);

/**
 * PUT /api/admin/users/:id
 * Update user profile details, role, or password.
 */
router.put(
  '/users/:id',
  [
    param('id').isUUID().withMessage('Valid user UUID required'),
    body('display_name').optional().isString().trim(),
    body('role').optional().isIn(['user', 'admin']).withMessage("Role must be 'user' or 'admin'"),
    body('password').optional().isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  ],
  validate,
  async (req, res) => {
    try {
      const adminUserId = req.user.id;
      const targetUserId = req.params.id;
      const { display_name, role, password } = req.body;

      const updatedUser = await adminService.updateUser(adminUserId, targetUserId, {
        displayName: display_name,
        role,
        password,
      });

      return sendSuccess(res, updatedUser);
    } catch (err) {
      console.error('Admin updateUser error:', err);
      return sendError(res, err.message || 'Failed to update user', 400);
    }
  }
);

/**
 * DELETE /api/admin/users/:id
 * Delete a user account and associated profile/subscriptions.
 */
router.delete(
  '/users/:id',
  [param('id').isUUID().withMessage('Valid user UUID required')],
  validate,
  async (req, res) => {
    try {
      const adminUserId = req.user.id;
      const targetUserId = req.params.id;

      const result = await adminService.deleteUser(adminUserId, targetUserId);
      return sendSuccess(res, result);
    } catch (err) {
      console.error('Admin deleteUser error:', err);
      return sendError(res, err.message || 'Failed to delete user', 400);
    }
  }
);

/**
 * PUT /api/admin/users/:id/role
 * Update user role (strictly 'user' or 'admin').
 */
router.put(
  '/users/:id/role',
  [
    param('id').isUUID().withMessage('Valid user UUID required'),
    body('role')
      .isIn(['user', 'admin'])
      .withMessage("Role must be strictly 'user' or 'admin'"),
  ],
  validate,
  async (req, res) => {
    try {
      const targetUserId = req.params.id;
      const { role } = req.body;
      const adminUserId = req.user.id;

      const updatedProfile = await adminService.updateUserRole(
        adminUserId,
        targetUserId,
        role
      );

      return sendSuccess(res, {
        message: `User role successfully updated to '${role}'`,
        user: updatedProfile,
      });
    } catch (err) {
      console.error('Admin updateUserRole error:', err);
      const statusCode = err.message.includes('revoke') ? 400 : 500;
      return sendError(res, err.message || 'Failed to update user role', statusCode);
    }
  }
);

/**
 * GET /api/admin/subscriptions
 * Query paginated list of user subscriptions.
 */
router.get(
  '/subscriptions',
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('status').optional().isString(),
  ],
  validate,
  async (req, res) => {
    try {
      const { page = 1, limit = 20, status = '' } = req.query;
      const result = await adminService.getSubscriptions({ page, limit, status });
      return sendSuccess(res, result);
    } catch (err) {
      console.error('Admin getSubscriptions error:', err);
      return sendError(res, 'Failed to fetch subscriptions', 500);
    }
  }
);

/**
 * GET /api/admin/snapshots
 * Query all published and draft archive snapshot records.
 */
router.get('/snapshots', async (req, res) => {
  try {
    const snapshots = await adminService.getSnapshots();
    return sendSuccess(res, { snapshots });
  } catch (err) {
    console.error('Admin getSnapshots error:', err);
    return sendError(res, 'Failed to fetch snapshots', 500);
  }
});

/**
 * POST /api/admin/snapshots/:year/toggle-publish
 * Toggle snapshot publication state for a specific year.
 */
router.post(
  '/snapshots/:year/toggle-publish',
  [param('year').isInt({ min: 0 }).toInt()],
  validate,
  async (req, res) => {
    try {
      const { year } = req.params;
      const updated = await adminService.toggleSnapshotPublish(req.user.id, year);
      if (!updated) {
        return sendError(res, `Snapshot for year ${year} not found`, 404);
      }
      return sendSuccess(res, {
        message: `Snapshot year ${year} publication set to ${updated.is_published}`,
        snapshot: updated,
      });
    } catch (err) {
      console.error('Admin toggleSnapshotPublish error:', err);
      return sendError(res, 'Failed to update snapshot publication status', 500);
    }
  }
);

/**
 * GET /api/admin/snapshots/:year/data
 * Fetch snapshot regions and nations for admin editing (works for both draft and published years).
 */
router.get(
  '/snapshots/:year/data',
  [param('year').isInt({ min: 0 }).toInt()],
  validate,
  async (req, res) => {
    try {
      const { year } = req.params;
      const data = await adminService.getSnapshotDataForAdmin(year);
      return sendSuccess(res, data);
    } catch (err) {
      console.error('Admin getSnapshotData error:', err);
      return sendError(res, 'Failed to fetch snapshot admin data', 500);
    }
  }
);

/**
 * POST /api/admin/snapshots/ingest-defaults
 * Ingest all 11 default engine snapshot JSON files into the database.
 */
router.post('/snapshots/ingest-defaults', async (req, res) => {
  try {
    const result = await adminService.ingestDefaultSnapshots(req.user.id);
    return sendSuccess(res, {
      message: `Ingestion complete. ${result.published} snapshots published.`,
      result,
    });
  } catch (err) {
    console.error('Admin ingestDefaultSnapshots error:', err);
    return sendError(res, err.message || 'Failed to ingest default snapshots', 500);
  }
});

/**
 * POST /api/admin/snapshots
 * Create a new custom archive snapshot year.
 */
router.post(
  '/snapshots',
  [
    body('year').isInt({ min: 0, max: 9999 }).toInt(),
    body('is_published').optional().isBoolean(),
  ],
  validate,
  async (req, res) => {
    try {
      const { year, is_published = false } = req.body;
      const snapshot = await adminService.createArchiveSnapshot(req.user.id, {
        year,
        isPublished: is_published,
      });
      return sendSuccess(res, {
        message: `Archive snapshot for Year ${year} successfully created.`,
        snapshot,
      });
    } catch (err) {
      console.error('Admin createArchiveSnapshot error:', err);
      return sendError(res, err.message || 'Failed to create archive snapshot', 500);
    }
  }
);

/**
 * GET /api/admin/archive/years/:year/regions/:regionId
 * Fetch dynamic region details overlay for a year and region ID.
 */
router.get(
  '/archive/years/:year/regions/:regionId',
  [
    param('year').isInt({ min: 0 }).toInt(),
    param('regionId').isString().notEmpty(),
  ],
  validate,
  async (req, res) => {
    try {
      const { year, regionId } = req.params;
      const details = await adminService.getArchiveRegionDetails(year, regionId);
      return sendSuccess(res, { details });
    } catch (err) {
      console.error('Admin getArchiveRegionDetails error:', err);
      return sendError(res, 'Failed to fetch region details overlay', 500);
    }
  }
);

/**
 * PUT /api/admin/archive/years/:year/regions/:regionId
 * Upsert dynamic region details overlay for a year and region ID.
 */
router.put(
  '/archive/years/:year/regions/:regionId',
  [
    param('year').isInt({ min: 0 }).toInt(),
    param('regionId').isString().notEmpty(),
  ],
  validate,
  async (req, res) => {
    try {
      const { year, regionId } = req.params;
      const updated = await adminService.upsertArchiveRegionDetails(
        req.user.id,
        year,
        regionId,
        req.body
      );
      return sendSuccess(res, { details: updated });
    } catch (err) {
      console.error('Admin upsertArchiveRegionDetails error:', err);
      return sendError(res, 'Failed to update region details overlay', 500);
    }
  }
);

/**
 * GET /api/admin/library
 * Query all library audio/video items.
 */
router.get('/library', async (req, res) => {
  try {
    const items = await adminService.getLibraryItems();
    return sendSuccess(res, { items });
  } catch (err) {
    console.error('Admin getLibraryItems error:', err);
    return sendError(res, 'Failed to fetch library items', 500);
  }
});

/**
 * POST /api/admin/library/:id/toggle-publish
 * Toggle publication state for a library item.
 */
router.post(
  '/library/:id/toggle-publish',
  [param('id').isUUID().withMessage('Valid library item UUID required')],
  validate,
  async (req, res) => {
    try {
      const { id } = req.params;
      const updated = await adminService.toggleLibraryPublish(req.user.id, id);
      if (!updated) {
        return sendError(res, 'Library item not found', 404);
      }
      return sendSuccess(res, {
        message: `Library item publication set to ${updated.is_published}`,
        item: updated,
      });
    } catch (err) {
      console.error('Admin toggleLibraryPublish error:', err);
      return sendError(res, 'Failed to update library publication status', 500);
    }
  }
);

/**
 * GET /api/admin/audit-logs
 * Query paginated audit log entries.
 */
router.get(
  '/audit-logs',
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('eventType').optional().isString(),
    query('userId').optional().isString(),
  ],
  validate,
  async (req, res) => {
    try {
      const { page = 1, limit = 30, eventType = '', userId = '' } = req.query;
      const result = await adminService.getAuditLogs({ page, limit, eventType, userId });
      return sendSuccess(res, result);
    } catch (err) {
      console.error('Admin getAuditLogs error:', err);
      return sendError(res, 'Failed to fetch audit logs', 500);
    }
  }
);

module.exports = router;
