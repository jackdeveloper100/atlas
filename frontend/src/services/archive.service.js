/**
 * services/archive.service.js
 *
 * Frontend service for public relational Archive API.
 */

import api from '../api/client';

export async function getPublishedYears() {
  return api.get('/archive/years');
}

export async function getArchiveYear(year) {
  return api.get(`/archive/${year}`);
}

export default {
  getPublishedYears,
  getArchiveYear,
};
