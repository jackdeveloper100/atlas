'use strict';

/**
 * routes/admin.routes.js
 *
 * REST API endpoints for ATLAS Admin System, including full Archive management.
 */

const express = require('express');
const { body, param, query } = require('express-validator');
const authenticate = require('../middleware/authenticate');
const requireAdmin = require('../middleware/requireAdmin');
const validate = require('../middleware/validate');
const multer = require('multer');
const adminService = require('../services/admin.service');
const storageService = require('../services/storage.service');
const { sendSuccess, sendError } = require('../utils/response');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB limit
});

const router = express.Router();

router.use(authenticate);
router.use(requireAdmin);

/**
 * GET /api/admin/stats
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
 * GET /api/admin/subscriptions
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
      const { page = 1, limit = 15, status = '' } = req.query;
      const result = await adminService.getSubscriptions({ page, limit, status });
      return sendSuccess(res, result);
    } catch (err) {
      console.error('Admin getSubscriptions error:', err);
      return sendError(res, 'Failed to fetch subscriptions', 500);
    }
  }
);

/**
 * GET /api/admin/users
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
 */
router.get(
  '/users/:id',
  [param('id').isUUID().withMessage('Valid user UUID required')],
  validate,
  async (req, res) => {
    try {
      const userDetail = await adminService.getUserById(req.params.id);
      if (!userDetail) return sendError(res, 'User not found', 404);
      return sendSuccess(res, userDetail);
    } catch (err) {
      console.error('Admin getUserById error:', err);
      return sendError(res, 'Failed to fetch user details', 500);
    }
  }
);

/**
 * POST /api/admin/users
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
      const { display_name, role } = req.body;
      const newUser = await adminService.createUser(adminUserId, {
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
 */
router.put(
  '/users/:id',
  [
    param('id').isUUID().withMessage('Valid user UUID required'),
    body('display_name').optional().isString().trim(),
    body('role').optional().isIn(['user', 'admin']).withMessage("Role must be 'user' or 'admin'"),
  ],
  validate,
  async (req, res) => {
    try {
      const adminUserId = req.user.id;
      const targetUserId = req.params.id;
      const { display_name, role } = req.body;
      const updatedUser = await adminService.updateUser(adminUserId, targetUserId, {
        displayName: display_name,
        role,
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
 */
router.delete(
  '/users/:id',
  [param('id').isUUID().withMessage('Valid user UUID required')],
  validate,
  async (req, res) => {
    try {
      const adminUserId = req.user.id;
      const targetUserId = req.params.id;
      const deletedUser = await adminService.deleteUser(adminUserId, targetUserId);
      return sendSuccess(res, deletedUser);
    } catch (err) {
      console.error('Admin deleteUser error:', err);
      return sendError(res, err.message || 'Failed to delete user', 400);
    }
  }
);

// ── ARCHIVE YEARS MANAGEMENT ─────────────────────────────────────────────

router.get('/archive/years', async (req, res) => {
  try {
    const years = await adminService.listArchiveYears();
    return sendSuccess(res, { years });
  } catch (err) {
    console.error('Admin listArchiveYears error:', err);
    return sendError(res, 'Failed to fetch archive years', 500);
  }
});

router.post(
  '/archive/years',
  [
    body('year').isInt({ min: 0, max: 9999 }).toInt(),
    body('title').optional().isString().trim(),
    body('subtitle').optional().isString().trim(),
    body('description').optional().isString().trim(),
    body('is_published').optional().isBoolean(),
  ],
  validate,
  async (req, res) => {
    try {
      const { year, title, subtitle, description, is_published = false } = req.body;
      const record = await adminService.createArchiveYear(req.user.id, {
        year,
        title,
        subtitle,
        description,
        isPublished: is_published,
      });
      return sendSuccess(res, record, 201);
    } catch (err) {
      console.error('Admin createArchiveYear error:', err);
      return sendError(res, err.message || 'Failed to create archive year', 400);
    }
  }
);

router.get(
  '/archive/years/:year',
  [param('year').isInt({ min: 0 }).toInt()],
  validate,
  async (req, res) => {
    try {
      const yearData = await adminService.getArchiveYear(req.params.year);
      if (!yearData.success || yearData.notFound) return sendError(res, 'Archive year not found', 404);
      return sendSuccess(res, yearData.data);
    } catch (err) {
      console.error('Admin getArchiveYear error:', err);
      return sendError(res, 'Failed to fetch archive year', 500);
    }
  }
);

router.put(
  '/archive/years/:year',
  [
    param('year').isInt({ min: 0 }).toInt(),
    body('title').optional().isString().trim(),
    body('subtitle').optional().isString().trim(),
    body('description').optional().isString().trim(),
    body('status').optional().isIn(['draft', 'published', 'archived']),
    body('is_published').optional().isBoolean(),
  ],
  validate,
  async (req, res) => {
    try {
      const updated = await adminService.updateArchiveYear(req.user.id, req.params.year, req.body);
      return sendSuccess(res, updated);
    } catch (err) {
      console.error('Admin updateArchiveYear error:', err);
      return sendError(res, err.message || 'Failed to update archive year', 400);
    }
  }
);

router.delete(
  '/archive/years/:year',
  [param('year').isInt({ min: 0 }).toInt()],
  validate,
  async (req, res) => {
    try {
      const deleted = await adminService.deleteArchiveYear(req.user.id, req.params.year);
      return sendSuccess(res, deleted);
    } catch (err) {
      console.error('Admin deleteArchiveYear error:', err);
      return sendError(res, err.message || 'Failed to delete archive year', 400);
    }
  }
);

router.post(
  '/archive/years/:year/duplicate',
  [
    param('year').isInt({ min: 0 }).toInt(),
    body('target_year').isInt({ min: 0, max: 9999 }).toInt(),
  ],
  validate,
  async (req, res) => {
    try {
      const duplicated = await adminService.duplicateArchiveYear(req.user.id, req.params.year, req.body.target_year);
      return sendSuccess(res, duplicated, 201);
    } catch (err) {
      console.error('Admin duplicateArchiveYear error:', err);
      return sendError(res, err.message || 'Failed to duplicate archive year', 400);
    }
  }
);

router.post('/archive/years/:year/publish', [param('year').isInt({ min: 0 }).toInt()], validate, async (req, res) => {
  try {
    const updated = await adminService.publishArchiveYear(req.user.id, req.params.year);
    return sendSuccess(res, updated);
  } catch (err) {
    return sendError(res, err.message || 'Failed to publish archive year', 400);
  }
});

router.post('/archive/years/:year/unpublish', [param('year').isInt({ min: 0 }).toInt()], validate, async (req, res) => {
  try {
    const updated = await adminService.unpublishArchiveYear(req.user.id, req.params.year);
    return sendSuccess(res, updated);
  } catch (err) {
    return sendError(res, err.message || 'Failed to unpublish archive year', 400);
  }
});

router.post('/archive/years/:year/archive', [param('year').isInt({ min: 0 }).toInt()], validate, async (req, res) => {
  try {
    const updated = await adminService.archiveArchiveYear(req.user.id, req.params.year);
    return sendSuccess(res, updated);
  } catch (err) {
    return sendError(res, err.message || 'Failed to archive year', 400);
  }
});

// ── NATIONS / REGIONS / LEADERS / EVENTS CRUD ───────────────────────────

// Nations
router.post('/archive/years/:year/nations', [param('year').isInt({ min: 0 }).toInt()], validate, async (req, res) => {
  try {
    const data = await adminService.createNation(req.user.id, req.params.year, req.body);
    return sendSuccess(res, data, 201);
  } catch (err) {
    return sendError(res, err.message || 'Failed to create nation', 400);
  }
});

router.put('/archive/years/:year/nations/:id', [param('year').isInt({ min: 0 }).toInt(), param('id').isUUID()], validate, async (req, res) => {
  try {
    const data = await adminService.updateNation(req.user.id, req.params.year, req.params.id, req.body);
    return sendSuccess(res, data);
  } catch (err) {
    return sendError(res, err.message || 'Failed to update nation', 400);
  }
});

router.delete('/archive/years/:year/nations/:id', [param('year').isInt({ min: 0 }).toInt(), param('id').isUUID()], validate, async (req, res) => {
  try {
    const data = await adminService.deleteNation(req.user.id, req.params.year, req.params.id);
    return sendSuccess(res, data);
  } catch (err) {
    return sendError(res, err.message || 'Failed to delete nation', 400);
  }
});

// Regions
router.post('/archive/years/:year/regions', [param('year').isInt({ min: 0 }).toInt()], validate, async (req, res) => {
  try {
    const data = await adminService.createRegion(req.user.id, req.params.year, req.body);
    return sendSuccess(res, data, 201);
  } catch (err) {
    return sendError(res, err.message || 'Failed to create region', 400);
  }
});

router.put('/archive/years/:year/regions/:id', [param('year').isInt({ min: 0 }).toInt(), param('id').isUUID()], validate, async (req, res) => {
  try {
    const data = await adminService.updateRegion(req.user.id, req.params.year, req.params.id, req.body);
    return sendSuccess(res, data);
  } catch (err) {
    return sendError(res, err.message || 'Failed to update region', 400);
  }
});

router.delete('/archive/years/:year/regions/:id', [param('year').isInt({ min: 0 }).toInt(), param('id').isUUID()], validate, async (req, res) => {
  try {
    const data = await adminService.deleteRegion(req.user.id, req.params.year, req.params.id);
    return sendSuccess(res, data);
  } catch (err) {
    return sendError(res, err.message || 'Failed to delete region', 400);
  }
});

// Leaders
router.post('/archive/years/:year/leaders', [param('year').isInt({ min: 0 }).toInt()], validate, async (req, res) => {
  try {
    const data = await adminService.createLeader(req.user.id, req.params.year, req.body);
    return sendSuccess(res, data, 201);
  } catch (err) {
    return sendError(res, err.message || 'Failed to create leader', 400);
  }
});

router.put('/archive/years/:year/leaders/:id', [param('year').isInt({ min: 0 }).toInt(), param('id').isUUID()], validate, async (req, res) => {
  try {
    const data = await adminService.updateLeader(req.user.id, req.params.year, req.params.id, req.body);
    return sendSuccess(res, data);
  } catch (err) {
    return sendError(res, err.message || 'Failed to update leader', 400);
  }
});

router.delete('/archive/years/:year/leaders/:id', [param('year').isInt({ min: 0 }).toInt(), param('id').isUUID()], validate, async (req, res) => {
  try {
    const data = await adminService.deleteLeader(req.user.id, req.params.year, req.params.id);
    return sendSuccess(res, data);
  } catch (err) {
    return sendError(res, err.message || 'Failed to delete leader', 400);
  }
});

// Events
router.post('/archive/years/:year/events', [param('year').isInt({ min: 0 }).toInt()], validate, async (req, res) => {
  try {
    const data = await adminService.createEvent(req.user.id, req.params.year, req.body);
    return sendSuccess(res, data, 201);
  } catch (err) {
    return sendError(res, err.message || 'Failed to create event', 400);
  }
});

router.put('/archive/years/:year/events/:id', [param('year').isInt({ min: 0 }).toInt(), param('id').isUUID()], validate, async (req, res) => {
  try {
    const data = await adminService.updateEvent(req.user.id, req.params.year, req.params.id, req.body);
    return sendSuccess(res, data);
  } catch (err) {
    return sendError(res, err.message || 'Failed to update event', 400);
  }
});

router.delete('/archive/years/:year/events/:id', [param('year').isInt({ min: 0 }).toInt(), param('id').isUUID()], validate, async (req, res) => {
  try {
    const data = await adminService.deleteEvent(req.user.id, req.params.year, req.params.id);
    return sendSuccess(res, data);
  } catch (err) {
    return sendError(res, err.message || 'Failed to delete event', 400);
  }
});

// Tabs
router.put('/archive/years/:year/tabs', [param('year').isInt({ min: 0 }).toInt(), body('tabs').isArray()], validate, async (req, res) => {
  try {
    const data = await adminService.upsertTabs(req.user.id, req.params.year, req.body.tabs);
    return sendSuccess(res, data);
  } catch (err) {
    return sendError(res, err.message || 'Failed to update tabs', 400);
  }
});

// Entity Details
router.put('/archive/years/:year/entities/:type/:id/details', [param('year').isInt({ min: 0 }).toInt(), param('type').isIn(['region', 'nation', 'leader']), param('id').isUUID()], validate, async (req, res) => {
  try {
    const data = await adminService.upsertEntityDetails(req.user.id, req.params.year, req.params.type, req.params.id, req.body);
    return sendSuccess(res, data);
  } catch (err) {
    return sendError(res, err.message || 'Failed to update entity details', 400);
  }
});

// Metrics
router.post('/archive/years/:year/entities/:type/:id/metrics', [param('year').isInt({ min: 0 }).toInt(), param('type').isIn(['region', 'nation', 'leader']), param('id').isUUID()], validate, async (req, res) => {
  try {
    const data = await adminService.createMetric(req.user.id, req.params.year, req.params.type, req.params.id, req.body);
    return sendSuccess(res, data, 201);
  } catch (err) {
    return sendError(res, err.message || 'Failed to create metric', 400);
  }
});

router.put('/archive/years/:year/metrics/:metricId', [param('year').isInt({ min: 0 }).toInt(), param('metricId').isUUID()], validate, async (req, res) => {
  try {
    const data = await adminService.updateMetric(req.user.id, req.params.year, req.params.metricId, req.body);
    return sendSuccess(res, data);
  } catch (err) {
    return sendError(res, err.message || 'Failed to update metric', 400);
  }
});

router.delete('/archive/years/:year/metrics/:metricId', [param('year').isInt({ min: 0 }).toInt(), param('metricId').isUUID()], validate, async (req, res) => {
  try {
    const data = await adminService.deleteMetric(req.user.id, req.params.year, req.params.metricId);
    return sendSuccess(res, data);
  } catch (err) {
    return sendError(res, err.message || 'Failed to delete metric', 400);
  }
});

router.put('/archive/years/:year/metrics/:metricId/series', [param('year').isInt({ min: 0 }).toInt(), param('metricId').isUUID(), body('series').isArray()], validate, async (req, res) => {
  try {
    const data = await adminService.upsertMetricSeries(req.user.id, req.params.metricId, req.body.series);
    return sendSuccess(res, data);
  } catch (err) {
    return sendError(res, err.message || 'Failed to update metric series', 400);
  }
});

// Reorder
router.post('/archive/years/:year/reorder/:type', [param('year').isInt({ min: 0 }).toInt(), param('type').isIn(['nations', 'regions', 'leaders', 'events', 'metrics']), body('ordered_ids').isArray()], validate, async (req, res) => {
  try {
    const data = await adminService.reorderEntities(req.user.id, req.params.type, req.params.year, req.body.ordered_ids);
    return sendSuccess(res, data);
  } catch (err) {
    return sendError(res, err.message || 'Failed to reorder entities', 400);
  }
});

// ── LIBRARY & AUDIT LOGS ─────────────────────────────────────────────────

router.get('/library', async (req, res) => {
  try {
    const items = await adminService.getLibraryItems();
    return sendSuccess(res, { items });
  } catch (err) {
    console.error('Admin getLibraryItems error:', err);
    return sendError(res, 'Failed to fetch library items', 500);
  }
});

router.post(
  '/library/upload',
  (req, res, next) => {
    upload.single('file')(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          return sendError(res, `File upload error: ${err.message}`, 400);
        }
        return sendError(res, err.message || 'File upload failed', 400);
      }
      next();
    });
  },
  async (req, res) => {
    try {
      if (!req.file) {
        return sendError(res, 'No media file provided', 400);
      }

      const itemType = req.body.item_type || 'audio';
      const extMatch = req.file.originalname ? req.file.originalname.match(/\.([a-zA-Z0-9]+)$/) : null;
      const ext = extMatch ? extMatch[1].toLowerCase() : (itemType === 'video' ? 'mp4' : 'mp3');
      const uniquePath = `library/media-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;

      const uploadRes = await storageService.uploadLibraryBuffer(
        uniquePath,
        req.file.buffer,
        req.file.mimetype
      );

      if (!uploadRes.success) {
        return sendError(res, uploadRes.error || 'Failed to save file to media storage', 500);
      }

      // The `library` bucket is private, so uploadRes.publicUrl never actually
      // resolves for playback. storage_path is the permanent reference the
      // frontend must persist; stream-url signs it fresh on every request.
      // This preview_url is short-lived and only for the admin's immediate
      // "did the upload work" feedback — it is never saved.
      const previewRes = await storageService.generateSignedUrl(uploadRes.storagePath, 3600);

      return sendSuccess(res, {
        storage_path: uploadRes.storagePath,
        preview_url: previewRes.success ? previewRes.signedUrl : null,
        filename: req.file.originalname,
      }, 201);
    } catch (err) {
      console.error('Admin uploadLibraryMedia error:', err);
      return sendError(res, err.message || 'Failed to upload media file', 500);
    }
  }
);

router.post(
  '/library',
  [
    body('title').isString().notEmpty().withMessage('Title is required'),
    body('description').optional({ nullable: true }).isString(),
    body('item_type').optional().isIn(['audio', 'video']),
    body('storage_path').optional({ nullable: true }).isString(),
    body('duration_seconds').optional({ nullable: true, checkFalsy: true }).toInt(),
    body('metadata').optional().isObject(),
    body('is_published').optional().isBoolean(),
  ],
  validate,
  async (req, res) => {
    try {
      const item = await adminService.createLibraryItem(req.user.id, req.body);
      return sendSuccess(res, { item }, 201);
    } catch (err) {
      console.error('Admin createLibraryItem error:', err);
      return sendError(res, err.message || 'Failed to create library item', 500);
    }
  }
);

router.put(
  '/library/:id',
  [
    param('id').isUUID().withMessage('Valid library item UUID required'),
    body('title').optional().isString(),
    body('description').optional({ nullable: true }).isString(),
    body('item_type').optional().isIn(['audio', 'video']),
    body('storage_path').optional({ nullable: true }).isString(),
    body('duration_seconds').optional({ nullable: true, checkFalsy: true }).toInt(),
    body('metadata').optional().isObject(),
    body('is_published').optional().isBoolean(),
  ],
  validate,
  async (req, res) => {
    try {
      const { id } = req.params;
      const updated = await adminService.updateLibraryItem(req.user.id, id, req.body);
      if (!updated) return sendError(res, 'Library item not found', 404);
      return sendSuccess(res, { item: updated });
    } catch (err) {
      console.error('Admin updateLibraryItem error:', err);
      return sendError(res, err.message || 'Failed to update library item', 500);
    }
  }
);

router.delete(
  '/library/:id',
  [param('id').isUUID().withMessage('Valid library item UUID required')],
  validate,
  async (req, res) => {
    try {
      const { id } = req.params;
      const success = await adminService.deleteLibraryItem(req.user.id, id);
      if (!success) return sendError(res, 'Library item not found', 404);
      return sendSuccess(res, { deleted: true });
    } catch (err) {
      console.error('Admin deleteLibraryItem error:', err);
      return sendError(res, err.message || 'Failed to delete library item', 500);
    }
  }
);

router.post(
  '/library/:id/toggle-publish',
  [param('id').isUUID().withMessage('Valid library item UUID required')],
  validate,
  async (req, res) => {
    try {
      const { id } = req.params;
      const updated = await adminService.toggleLibraryPublish(req.user.id, id);
      if (!updated) return sendError(res, 'Library item not found', 404);
      return sendSuccess(res, { item: updated });
    } catch (err) {
      console.error('Admin toggleLibraryPublish error:', err);
      return sendError(res, 'Failed to update library publication status', 500);
    }
  }
);

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
