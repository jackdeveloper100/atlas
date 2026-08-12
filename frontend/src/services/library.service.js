/**
 * services/library.service.js
 *
 * Thin wrapper over api/client.js for the Library endpoints (Phase 4).
 * Every call resolves to the { success, data, error } envelope directly —
 * api/client.js's response interceptor already unwraps response.data.
 */

import api from '../api/client';

export async function listItems({ type, page, per_page } = {}) {
  const params = {};
  if (type) params.type = type;
  if (page) params.page = page;
  if (per_page) params.per_page = per_page;
  return api.get('/library/items', { params });
}

export async function getItem(id) {
  return api.get(`/library/items/${id}`);
}

export async function getStreamUrl(id) {
  return api.get(`/library/items/${id}/stream-url`);
}

export async function getPosition(id) {
  return api.get(`/library/items/${id}/position`);
}

export async function savePosition(id, positionSeconds) {
  return api.put(`/library/items/${id}/position`, { position_seconds: positionSeconds });
}
