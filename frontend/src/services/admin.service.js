/**
 * services/admin.service.js
 *
 * Frontend service wrapper for admin API endpoints.
 */

import api from '../api/client';

export const adminService = {
  /**
   * Fetch system overview metrics and dashboard stats
   */
  async getDashboardStats() {
    return await api.get('/admin/stats');
  },

  /**
   * Fetch paginated list of user accounts
   */
  async getUsers({ page = 1, limit = 20, search = '' } = {}) {
    const params = new URLSearchParams();
    if (page) params.append('page', page);
    if (limit) params.append('limit', limit);
    if (search) params.append('search', search);

    return await api.get(`/admin/users?${params.toString()}`);
  },

  /**
   * Fetch details for a specific user
   */
  async getUserById(id) {
    return await api.get(`/admin/users/${id}`);
  },

  /**
   * Update user role ('user' or 'admin')
   */
  async updateUserRole(id, role) {
    return await api.put(`/admin/users/${id}/role`, { role });
  },

  /**
   * Fetch paginated user subscriptions
   */
  async getSubscriptions({ page = 1, limit = 20, status = '' } = {}) {
    const params = new URLSearchParams();
    if (page) params.append('page', page);
    if (limit) params.append('limit', limit);
    if (status) params.append('status', status);

    return await api.get(`/admin/subscriptions?${params.toString()}`);
  },

  /**
   * Fetch all published and draft archive snapshots
   */
  async getSnapshots() {
    return await api.get('/admin/snapshots');
  },

  /**
   * Toggle snapshot publication status
   */
  async toggleSnapshotPublish(year) {
    return await api.post(`/admin/snapshots/${year}/toggle-publish`);
  },

  /**
   * Fetch all library audio/video items
   */
  async getLibraryItems() {
    return await api.get('/admin/library');
  },

  /**
   * Toggle library item publication status
   */
  async toggleLibraryPublish(id) {
    return await api.post(`/admin/library/${id}/toggle-publish`);
  },

  /**
   * Fetch paginated audit log entries
   */
  async getAuditLogs({ page = 1, limit = 30, eventType = '', userId = '' } = {}) {
    const params = new URLSearchParams();
    if (page) params.append('page', page);
    if (limit) params.append('limit', limit);
    if (eventType) params.append('eventType', eventType);
    if (userId) params.append('userId', userId);

    return await api.get(`/admin/audit-logs?${params.toString()}`);
  },
};

export default adminService;
