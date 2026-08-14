'use strict';

/**
 * archive.service.js
 *
 * Business logic layer for public Archive reads.
 * Relational model (Migration 006).
 */

const archiveRepository = require('../repositories/archive.repository');

/**
 * Get list of all published years with metadata.
 * Used by GET /api/archive/years
 */
async function getPublishedYears() {
  const { data, error } = await archiveRepository.listPublishedYears();

  if (error) {
    return { success: false, years: [], error };
  }

  const years = (data || []).map(y => ({
    year: y.year,
    title: y.title || `Year ${y.year}`,
    subtitle: y.subtitle || null,
    description: y.description || null,
    displayOrder: y.display_order || 0,
    isPublished: y.is_published,
    publishedAt: y.published_at,
    createdAt: y.created_at,
  }));

  return { success: true, years, error: null };
}

/**
 * Fetch the complete composed relational archive year.
 * Used by GET /api/archive/:year
 */
async function getYear(year, allowDraft = false) {
  const { data: yearRecord, error: findError } = await archiveRepository.findYear(year);

  if (findError) {
    return { success: false, data: null, error: findError, notFound: false };
  }

  if (!yearRecord) {
    return { success: false, data: null, error: null, notFound: true };
  }

  if (!allowDraft && !yearRecord.is_published && yearRecord.status !== 'published') {
    return { success: false, data: null, error: null, notFound: true };
  }

  // Parallel fetch of relational components
  const [
    nationsRes,
    regionsRes,
    leadersRes,
    eventsRes,
    tabsRes,
    detailsRes,
    metricsRes,
  ] = await Promise.all([
    archiveRepository.findNationsForYear(year),
    archiveRepository.findRegionsForYear(year),
    archiveRepository.findLeadersForYear(year),
    archiveRepository.findEventsForYear(year),
    archiveRepository.findTabsForYear(year),
    archiveRepository.findEntityDetailsForYear(year),
    archiveRepository.findMetricsForYear(year),
  ]);

  if (nationsRes.error) return { success: false, data: null, error: nationsRes.error, notFound: false };
  if (regionsRes.error) return { success: false, data: null, error: regionsRes.error, notFound: false };
  if (leadersRes.error) return { success: false, data: null, error: leadersRes.error, notFound: false };
  if (eventsRes.error) return { success: false, data: null, error: eventsRes.error, notFound: false };
  if (tabsRes.error) return { success: false, data: null, error: tabsRes.error, notFound: false };

  // Map nations
  const nations = (nationsRes.data || []).map(n => ({
    id: n.id,
    nationKey: n.nation_key,
    name: n.name,
    shortName: n.short_name,
    description: n.description,
    color: n.color,
    flagUrl: n.flag_url,
    population: n.population !== null ? Number(n.population) : 0,
    governmentType: n.government_type,
    capitalRegionId: n.capital_region_id,
    foundedYear: n.founded_year,
    headOfStateId: n.head_of_state_id,
    centralizedPower: n.centralized_power !== null ? Number(n.centralized_power) : null,
    stability: n.stability !== null ? Number(n.stability) : null,
  }));

  // Map regions
  const regions = (regionsRes.data || []).map(r => ({
    id: r.id,
    regionKey: r.region_key,
    name: r.name,
    shortName: r.short_name,
    description: r.description,
    nationId: r.nation_id,
    population: r.population !== null ? Number(r.population) : 0,
    area: r.area !== null ? Number(r.area) : 0,
    urbanization: r.urbanization !== null ? Number(r.urbanization) : 0,
    mapPath: r.map_path,
    mapLabelX: r.map_label_x !== null ? Number(r.map_label_x) : null,
    mapLabelY: r.map_label_y !== null ? Number(r.map_label_y) : null,
    mapColor: r.map_color,
    isClaimed: r.is_claimed,
  }));

  // Map leaders
  const leaders = (leadersRes.data || []).map(l => ({
    id: l.id,
    nationId: l.nation_id,
    name: l.name,
    title: l.title,
    birthYear: l.birth_year,
    deathYear: l.death_year,
    ageOverride: l.age_override,
    legitimacy: l.legitimacy !== null ? Number(l.legitimacy) : null,
    influence: l.influence !== null ? Number(l.influence) : null,
    portraitUrl: l.portrait_url,
    biography: l.biography,
  }));

  // Map events
  const events = (eventsRes.data || []).map(e => ({
    id: e.id,
    title: e.title,
    description: e.description,
    eventType: e.event_type,
    badgeLabel: e.badge_label,
    badgeColor: e.badge_color,
    quarter: e.quarter,
    importance: e.importance !== null ? Number(e.importance) : 1.0,
    nationIds: e.nation_ids || [],
    regionIds: e.region_ids || [],
  }));

  // Map tabs
  const tabs = (tabsRes.data || []).map(t => ({
    id: t.id,
    tabKey: t.tab_key,
    label: t.label,
    icon: t.icon,
    description: t.description,
    displayOrder: t.display_order,
  }));

  // Tab UUID -> tabKey lookup
  const tabKeyMap = {};
  for (const t of tabs) {
    tabKeyMap[t.id] = t.tabKey;
  }

  // Compose entities object
  // Key format: "region:<id>", "nation:<id>", "leader:<id>"
  const entities = {};

  const detailsList = detailsRes.data || [];
  for (const d of detailsList) {
    let key = null;
    if (d.region_id) key = `region:${d.region_id}`;
    else if (d.nation_id) key = `nation:${d.nation_id}`;
    else if (d.leader_id) key = `leader:${d.leader_id}`;

    if (key) {
      if (!entities[key]) entities[key] = { governanceBadges: [], riskTags: [], cultureBreakdown: [], metrics: {} };
      entities[key].governanceBadges = d.governance_badges || [];
      entities[key].riskTags = d.risk_tags || [];
      entities[key].cultureBreakdown = d.culture_breakdown || [];
    }
  }

  const metricsList = metricsRes.data || [];
  for (const m of metricsList) {
    let entityKey = null;
    if (m.region_id) entityKey = `region:${m.region_id}`;
    else if (m.nation_id) entityKey = `nation:${m.nation_id}`;
    else if (m.leader_id) entityKey = `leader:${m.leader_id}`;

    const tabKey = tabKeyMap[m.tab_id] || 'overview';

    if (entityKey) {
      if (!entities[entityKey]) entities[entityKey] = { governanceBadges: [], riskTags: [], cultureBreakdown: [], metrics: {} };
      if (!entities[entityKey].metrics[tabKey]) entities[entityKey].metrics[tabKey] = [];

      entities[entityKey].metrics[tabKey].push({
        id: m.id,
        metricKey: m.metric_key,
        label: m.label,
        value: m.value,
        numericValue: m.numeric_value !== null ? Number(m.numeric_value) : null,
        unit: m.unit,
        prefix: m.prefix,
        suffix: m.suffix,
        description: m.description,
        trendValue: m.trend_value !== null ? Number(m.trend_value) : null,
        trendType: m.trend_type,
        displayType: m.display_type,
        icon: m.icon,
        series: m.series || [],
      });
    }
  }

  const payload = {
    year: {
      year: yearRecord.year,
      title: yearRecord.title || `Year ${yearRecord.year}`,
      subtitle: yearRecord.subtitle || null,
      description: yearRecord.description || null,
      status: yearRecord.status || (yearRecord.is_published ? 'published' : 'draft'),
      isPublished: yearRecord.is_published,
      publishedAt: yearRecord.published_at,
    },
    nations,
    regions,
    leaders,
    events,
    tabs,
    entities,
  };

  return { success: true, data: payload, error: null, notFound: false };
}

module.exports = {
  getPublishedYears,
  getYear,
};
