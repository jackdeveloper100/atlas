'use strict';

/**
 * archive.repository.js
 *
 * All direct Supabase/PostgreSQL database read access for the Archive domain.
 * Relational model (Migration 006).
 */

const { supabase } = require('../services/supabase.service');

/**
 * List all published years, ordered ascending by year.
 */
async function listPublishedYears() {
  const { data, error } = await supabase
    .from('archive_years')
    .select('year, title, subtitle, description, display_order, is_published, published_at, created_at')
    .or('is_published.eq.true,status.eq.published')
    .order('year', { ascending: true });

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

/**
 * Find a single archive_years row by year.
 */
async function findYear(year) {
  const { data, error } = await supabase
    .from('archive_years')
    .select('*')
    .eq('year', year)
    .maybeSingle();

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

/**
 * Find nations for a specific year.
 */
async function findNationsForYear(year) {
  const { data, error } = await supabase
    .from('archive_nations')
    .select('*')
    .eq('year', year)
    .eq('is_visible', true)
    .order('display_order', { ascending: true });

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

/**
 * Find regions for a specific year.
 */
async function findRegionsForYear(year) {
  const { data, error } = await supabase
    .from('archive_regions')
    .select('*')
    .eq('year', year)
    .eq('is_visible', true)
    .order('display_order', { ascending: true });

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

/**
 * Find leaders for a specific year.
 */
async function findLeadersForYear(year) {
  const { data, error } = await supabase
    .from('archive_leaders')
    .select('*')
    .eq('year', year)
    .eq('is_visible', true)
    .order('display_order', { ascending: true });

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

/**
 * Find events for a specific year, including linked nation and region IDs.
 */
async function findEventsForYear(year) {
  const { data: events, error: evErr } = await supabase
    .from('archive_events')
    .select('*')
    .eq('year', year)
    .eq('is_visible', true)
    .order('display_order', { ascending: true });

  if (evErr) return { data: null, error: evErr.message };

  if (!events || events.length === 0) {
    return { data: [], error: null };
  }

  const eventIds = events.map(e => e.id);

  const { data: eventNations } = await supabase
    .from('archive_event_nations')
    .select('event_id, nation_id')
    .in('event_id', eventIds);

  const { data: eventRegions } = await supabase
    .from('archive_event_regions')
    .select('event_id, region_id')
    .in('event_id', eventIds);

  const nationMap = {};
  if (eventNations) {
    for (const en of eventNations) {
      if (!nationMap[en.event_id]) nationMap[en.event_id] = [];
      nationMap[en.event_id].push(en.nation_id);
    }
  }

  const regionMap = {};
  if (eventRegions) {
    for (const er of eventRegions) {
      if (!regionMap[er.event_id]) regionMap[er.event_id] = [];
      regionMap[er.event_id].push(er.region_id);
    }
  }

  const composedEvents = events.map(e => ({
    ...e,
    nation_ids: nationMap[e.id] || [],
    region_ids: regionMap[e.id] || [],
  }));

  return { data: composedEvents, error: null };
}

/**
 * Find tabs for a specific year.
 */
async function findTabsForYear(year) {
  const { data, error } = await supabase
    .from('archive_tabs')
    .select('*')
    .eq('year', year)
    .eq('is_visible', true)
    .order('display_order', { ascending: true });

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

/**
 * Find entity details (badges, risk tags, culture breakdown) for a specific year.
 */
async function findEntityDetailsForYear(year) {
  const { data, error } = await supabase
    .from('archive_entity_details')
    .select('*')
    .eq('year', year);

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

/**
 * Find metrics with series for a specific year.
 */
async function findMetricsForYear(year) {
  const { data: metrics, error: mErr } = await supabase
    .from('archive_metrics')
    .select('*')
    .eq('year', year)
    .eq('is_visible', true)
    .order('display_order', { ascending: true });

  if (mErr) return { data: null, error: mErr.message };

  if (!metrics || metrics.length === 0) {
    return { data: [], error: null };
  }

  const metricIds = metrics.map(m => m.id);

  const { data: seriesPoints } = await supabase
    .from('archive_metric_series')
    .select('*')
    .in('metric_id', metricIds)
    .order('sequence', { ascending: true });

  const seriesMap = {};
  if (seriesPoints) {
    for (const sp of seriesPoints) {
      if (!seriesMap[sp.metric_id]) seriesMap[sp.metric_id] = [];
      seriesMap[sp.metric_id].push({
        id: sp.id,
        label: sp.label,
        value: Number(sp.value),
        sequence: sp.sequence,
      });
    }
  }

  const composedMetrics = metrics.map(m => ({
    ...m,
    series: seriesMap[m.id] || [],
  }));

  return { data: composedMetrics, error: null };
}

module.exports = {
  listPublishedYears,
  findYear,
  findNationsForYear,
  findRegionsForYear,
  findLeadersForYear,
  findEventsForYear,
  findTabsForYear,
  findEntityDetailsForYear,
  findMetricsForYear,
};
