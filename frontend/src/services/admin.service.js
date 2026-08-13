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
   * Create a new user account (Admin operation)
   */
  async createUser({ email, password, displayName, role = 'user' }) {
    return await api.post('/admin/users', {
      email,
      password,
      display_name: displayName,
      role,
    });
  },

  /**
   * Update full user account details (Admin operation)
   */
  async updateUser(id, { displayName, role, password }) {
    return await api.put(`/admin/users/${id}`, {
      display_name: displayName,
      role,
      password,
    });
  },

  /**
   * Delete a user account (Admin operation)
   */
  async deleteUser(id) {
    return await api.delete(`/admin/users/${id}`);
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
   * Fetch snapshot regions and nations for admin editing (works for draft and published years)
   */
  async getSnapshotDataForAdmin(year) {
    return await api.get(`/admin/snapshots/${year}/data`);
  },

  /**
   * Ingest all 11 default engine snapshot JSON files into database
   */
  async ingestDefaultSnapshots() {
    return await api.post('/admin/snapshots/ingest-defaults');
  },

  /**
   * Create a new custom archive snapshot year
   */
  async createArchiveSnapshot({ year, is_published = false }) {
    return await api.post('/admin/snapshots', { year, is_published });
  },

  /**
   * Fetch dynamic region details for a given year and region ID
   */
  async getArchiveRegionDetails(year, regionId) {
    return await api.get(`/admin/archive/years/${year}/regions/${regionId}`);
  },

  /**
   * Update dynamic region details for a given year and region ID
   */
  async updateArchiveRegionDetails(year, regionId, payload) {
    return await api.put(`/admin/archive/years/${year}/regions/${regionId}`, payload);
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
