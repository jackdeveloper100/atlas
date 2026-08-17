/**
 * services/admin.service.js
 *
 * Frontend service wrapper for admin API endpoints.
 */

import api from '../api/client';

export const adminService = {
  async getDashboardStats() {
    return await api.get('/admin/stats');
  },

  async getUsers({ page = 1, limit = 20, search = '' } = {}) {
    const params = new URLSearchParams();
    if (page) params.append('page', page);
    if (limit) params.append('limit', limit);
    if (search) params.append('search', search);
    return await api.get(`/admin/users?${params.toString()}`);
  },

  async getUserById(id) {
    return await api.get(`/admin/users/${id}`);
  },

  async createUser({ email, password, displayName, role = 'user' }) {
    return await api.post('/admin/users', {
      email,
      password,
      display_name: displayName,
      role,
    });
  },

  async updateUser(id, { displayName, role, password }) {
    return await api.put(`/admin/users/${id}`, {
      display_name: displayName,
      role,
      password,
    });
  },

  async deleteUser(id) {
    return await api.delete(`/admin/users/${id}`);
  },

  async getSubscriptions({ page = 1, limit = 20, status = '' } = {}) {
    const params = new URLSearchParams();
    if (page) params.append('page', page);
    if (limit) params.append('limit', limit);
    if (status) params.append('status', status);
    return await api.get(`/admin/subscriptions?${params.toString()}`);
  },

  // ── ARCHIVE YEARS MANAGEMENT ─────────────────────────────────────────────

  async listArchiveYears() {
    return await api.get('/admin/archive/years');
  },

  async createArchiveYear(payload) {
    return await api.post('/admin/archive/years', payload);
  },

  async getArchiveYear(year) {
    return await api.get(`/admin/archive/years/${year}`);
  },

  async updateArchiveYear(year, payload) {
    return await api.put(`/admin/archive/years/${year}`, payload);
  },

  async deleteArchiveYear(year) {
    return await api.delete(`/admin/archive/years/${year}`);
  },

  async duplicateArchiveYear(year, targetYear) {
    return await api.post(`/admin/archive/years/${year}/duplicate`, { target_year: targetYear });
  },

  async publishArchiveYear(year) {
    return await api.post(`/admin/archive/years/${year}/publish`);
  },

  async unpublishArchiveYear(year) {
    return await api.post(`/admin/archive/years/${year}/unpublish`);
  },

  async archiveArchiveYear(year) {
    return await api.post(`/admin/archive/years/${year}/archive`);
  },

  // ── NATIONS / REGIONS / LEADERS / EVENTS ───────────────────────────

  async createNation(year, payload) {
    return await api.post(`/admin/archive/years/${year}/nations`, payload);
  },
  async updateNation(year, id, payload) {
    return await api.put(`/admin/archive/years/${year}/nations/${id}`, payload);
  },
  async deleteNation(year, id) {
    return await api.delete(`/admin/archive/years/${year}/nations/${id}`);
  },

  async createRegion(year, payload) {
    return await api.post(`/admin/archive/years/${year}/regions`, payload);
  },
  async updateRegion(year, id, payload) {
    return await api.put(`/admin/archive/years/${year}/regions/${id}`, payload);
  },
  async deleteRegion(year, id) {
    return await api.delete(`/admin/archive/years/${year}/regions/${id}`);
  },

  async createLeader(year, payload) {
    return await api.post(`/admin/archive/years/${year}/leaders`, payload);
  },
  async updateLeader(year, id, payload) {
    return await api.put(`/admin/archive/years/${year}/leaders/${id}`, payload);
  },
  async deleteLeader(year, id) {
    return await api.delete(`/admin/archive/years/${year}/leaders/${id}`);
  },

  async createEvent(year, payload) {
    return await api.post(`/admin/archive/years/${year}/events`, payload);
  },
  async updateEvent(year, id, payload) {
    return await api.put(`/admin/archive/years/${year}/events/${id}`, payload);
  },
  async deleteEvent(year, id) {
    return await api.delete(`/admin/archive/years/${year}/events/${id}`);
  },

  async updateTabs(year, tabs) {
    return await api.put(`/admin/archive/years/${year}/tabs`, { tabs });
  },

  async updateEntityDetails(year, type, id, payload) {
    return await api.put(`/admin/archive/years/${year}/entities/${type}/${id}/details`, payload);
  },

  async createMetric(year, type, id, payload) {
    return await api.post(`/admin/archive/years/${year}/entities/${type}/${id}/metrics`, payload);
  },
  async updateMetric(year, metricId, payload) {
    return await api.put(`/admin/archive/years/${year}/metrics/${metricId}`, payload);
  },
  async deleteMetric(year, metricId) {
    return await api.delete(`/admin/archive/years/${year}/metrics/${metricId}`);
  },
  async updateMetricSeries(year, metricId, series) {
    return await api.put(`/admin/archive/years/${year}/metrics/${metricId}/series`, { series });
  },

  async reorderEntities(year, type, orderedIds) {
    return await api.post(`/admin/archive/years/${year}/reorder/${type}`, { ordered_ids: orderedIds });
  },

  // ── LIBRARY & AUDIT LOGS ─────────────────────────────────────────────────

  async getLibraryItems() {
    return await api.get('/admin/library');
  },

  async uploadLibraryMedia(formData) {
    return await api.post('/admin/library/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 300000, // 5 minutes timeout for media uploads
    });
  },

  async createLibraryItem(payload) {
    return await api.post('/admin/library', payload);
  },

  async updateLibraryItem(id, payload) {
    return await api.put(`/admin/library/${id}`, payload);
  },

  async deleteLibraryItem(id) {
    return await api.delete(`/admin/library/${id}`);
  },

  async toggleLibraryPublish(id) {
    return await api.post(`/admin/library/${id}/toggle-publish`);
  },

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
