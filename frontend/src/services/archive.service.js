/**
 * services/archive.service.js
 *
 * Frontend service calling backend Archive API endpoints (Phase 3).
 * Wraps api/client.js requests.
 */

import api from '../api/client';

export async function getPublishedYears() {
  return api.get('/archive/years');
}

export async function getYearSummary(year) {
  return api.get(`/archive/years/${year}`);
}

export async function getSnapshot(year) {
  return api.get(`/archive/snapshot/${year}`);
}

export async function getNations(year) {
  return api.get(`/archive/years/${year}/nations`);
}

export async function getEvents(year) {
  return api.get(`/archive/years/${year}/events`);
}

export default {
  getPublishedYears,
  getYearSummary,
  getSnapshot,
  getNations,
  getEvents,
};
