'use strict';

/**
 * validators/snapshot.validator.js
 *
 * Backend snapshot validator — independent from the engine.
 *
 * DO NOT import engine code here. This validator is backend-only and must
 * work without any dependency on the /engine package.
 *
 * Validates snapshot JSON against schema v1.0.0 per SNAPSHOT_SCHEMA.md.
 *
 * Returns: { valid: boolean, errors: string[] }
 */

const SUPPORTED_VERSIONS = ['1.0.0'];

/**
 * Validate a snapshot object.
 *
 * @param {object} snapshot - Parsed snapshot JSON
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== 'object') {
    return { valid: false, errors: ['Snapshot must be a non-null object'] };
  }

  const errors = [];

  // ── Schema version ─────────────────────────────────────────────────────────
  if (!snapshot.schema_version) {
    errors.push('Missing required field: schema_version');
  } else if (typeof snapshot.schema_version !== 'string') {
    errors.push('schema_version must be a string');
  } else if (!SUPPORTED_VERSIONS.includes(snapshot.schema_version)) {
    errors.push(`Unsupported schema_version: "${snapshot.schema_version}". Supported: ${SUPPORTED_VERSIONS.join(', ')}`);
  }

  // ── Simulation metadata ───────────────────────────────────────────────────
  if (!snapshot.simulation) {
    errors.push('Missing required field: simulation');
  } else {
    errors.push(...validateSimulation(snapshot.simulation));
  }

  // ── World state ───────────────────────────────────────────────────────────
  if (!snapshot.world) {
    errors.push('Missing required field: world');
  } else {
    errors.push(...validateWorld(snapshot.world));
  }

  // ── Entity arrays ─────────────────────────────────────────────────────────
  if (!Array.isArray(snapshot.nations)) {
    errors.push('Missing or invalid field: nations (must be array)');
  } else {
    errors.push(...validateNations(snapshot.nations));
  }

  if (!Array.isArray(snapshot.regions)) {
    errors.push('Missing or invalid field: regions (must be array)');
  } else {
    errors.push(...validateRegions(snapshot.regions, snapshot.nations || []));
  }

  if (!Array.isArray(snapshot.leaders)) {
    errors.push('Missing or invalid field: leaders (must be array)');
  } else {
    errors.push(...validateLeaders(snapshot.leaders, snapshot.nations || []));
  }

  if (!Array.isArray(snapshot.politicalStates)) {
    errors.push('Missing or invalid field: politicalStates (must be array)');
  } else {
    errors.push(...validatePoliticalStates(snapshot.politicalStates, snapshot.nations || []));
  }

  if (!Array.isArray(snapshot.events)) {
    errors.push('Missing or invalid field: events (must be array)');
  } else {
    errors.push(...validateEvents(snapshot.events, snapshot.nations || [], snapshot.simulation));
  }

  // ── Cross-entity consistency ───────────────────────────────────────────────
  if (
    Array.isArray(snapshot.nations) &&
    Array.isArray(snapshot.leaders) &&
    snapshot.nations.length > 0 &&
    snapshot.leaders.length > 0
  ) {
    errors.push(...validateCurrentLeaderReferences(snapshot.nations, snapshot.leaders));
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ── Field validators ──────────────────────────────────────────────────────────

function validateSimulation(sim) {
  const errors = [];

  if (typeof sim.year !== 'number' || !Number.isInteger(sim.year) || sim.year < 0) {
    errors.push('simulation.year must be a non-negative integer');
  }
  if (typeof sim.quarter !== 'number' || !Number.isInteger(sim.quarter) || sim.quarter < 1 || sim.quarter > 4) {
    errors.push('simulation.quarter must be an integer 1–4');
  }
  if (!sim.seed || typeof sim.seed !== 'string' || sim.seed.trim().length === 0) {
    errors.push('simulation.seed must be a non-empty string');
  }
  if (!sim.engineVersion || typeof sim.engineVersion !== 'string') {
    errors.push('simulation.engineVersion must be a non-empty string');
  }
  if (!sim.generatedAt || typeof sim.generatedAt !== 'string') {
    errors.push('simulation.generatedAt must be an ISO 8601 string');
  } else {
    // Basic ISO 8601 check
    const d = new Date(sim.generatedAt);
    if (isNaN(d.getTime())) {
      errors.push('simulation.generatedAt is not a valid date string');
    }
  }

  return errors;
}

function validateWorld(world) {
  const errors = [];

  if (typeof world.totalPopulation !== 'number' || world.totalPopulation < 0) {
    errors.push('world.totalPopulation must be a non-negative number');
  }
  if (typeof world.nationCount !== 'number' || world.nationCount < 0) {
    errors.push('world.nationCount must be a non-negative number');
  }
  if (typeof world.regionCount !== 'number' || world.regionCount < 0) {
    errors.push('world.regionCount must be a non-negative number');
  }
  if (typeof world.leaderCount !== 'number' || world.leaderCount < 0) {
    errors.push('world.leaderCount must be a non-negative number');
  }
  if (typeof world.eventCount !== 'number' || world.eventCount < 0) {
    errors.push('world.eventCount must be a non-negative number');
  }

  return errors;
}

function validateNations(nations) {
  const errors = [];
  const ids = new Set();

  for (const n of nations) {
    // ID
    if (!n.id || typeof n.id !== 'string' || n.id.trim().length === 0) {
      errors.push('Nation missing valid id');
      continue;
    }
    if (ids.has(n.id)) {
      errors.push(`Duplicate nation id: "${n.id}"`);
    }
    ids.add(n.id);

    // Name
    if (!n.name || typeof n.name !== 'string') {
      errors.push(`Nation "${n.id}" missing valid name`);
    }

    // Population
    if (typeof n.population !== 'number' || n.population < 0) {
      errors.push(`Nation "${n.id}" population must be >= 0`);
    }

    // Color — must be valid hex color
    if (!isValidHexColor(n.color)) {
      errors.push(`Nation "${n.id}" has invalid color: "${n.color}" (must be #RRGGBB)`);
    }

    // capitalRegionId — required but we cannot validate the reference yet (regions validated later)
    if (!n.capitalRegionId || typeof n.capitalRegionId !== 'string') {
      errors.push(`Nation "${n.id}" missing valid capitalRegionId`);
    }

    // currentLeaderId — null is allowed
    if (n.currentLeaderId !== null && n.currentLeaderId !== undefined && typeof n.currentLeaderId !== 'string') {
      errors.push(`Nation "${n.id}" currentLeaderId must be a string or null`);
    }

    // foundedYear
    if (typeof n.foundedYear !== 'number') {
      errors.push(`Nation "${n.id}" foundedYear must be a number`);
    }
  }

  return errors;
}

function validateRegions(regions, nations) {
  const errors = [];
  const ids = new Set();
  const nationIds = new Set(nations.map(n => n.id));

  for (const r of regions) {
    // ID
    if (!r.id || typeof r.id !== 'string' || r.id.trim().length === 0) {
      errors.push('Region missing valid id');
      continue;
    }
    if (ids.has(r.id)) {
      errors.push(`Duplicate region id: "${r.id}"`);
    }
    ids.add(r.id);

    // Name
    if (!r.name || typeof r.name !== 'string') {
      errors.push(`Region "${r.id}" missing valid name`);
    }

    // nationId reference
    if (!r.nationId || typeof r.nationId !== 'string') {
      errors.push(`Region "${r.id}" missing nationId`);
    } else if (!nationIds.has(r.nationId)) {
      errors.push(`Region "${r.id}" references unknown nation: "${r.nationId}"`);
    }

    // Population
    if (typeof r.population !== 'number' || r.population < 0) {
      errors.push(`Region "${r.id}" population must be >= 0`);
    }

    // Area
    if (typeof r.area !== 'number' || r.area < 0) {
      errors.push(`Region "${r.id}" area must be >= 0`);
    }

    // Urbanization 0.0–1.0
    if (typeof r.urbanization !== 'number' || r.urbanization < 0 || r.urbanization > 1) {
      errors.push(`Region "${r.id}" urbanization must be 0.0–1.0`);
    }
  }

  return errors;
}

function validateLeaders(leaders, nations) {
  const errors = [];
  const ids = new Set();
  const nationIds = new Set(nations.map(n => n.id));

  for (const l of leaders) {
    // ID
    if (!l.id || typeof l.id !== 'string' || l.id.trim().length === 0) {
      errors.push('Leader missing valid id');
      continue;
    }
    if (ids.has(l.id)) {
      errors.push(`Duplicate leader id: "${l.id}"`);
    }
    ids.add(l.id);

    // Name
    if (!l.name || typeof l.name !== 'string') {
      errors.push(`Leader "${l.id}" missing valid name`);
    }

    // nationId reference
    if (!l.nationId || typeof l.nationId !== 'string') {
      errors.push(`Leader "${l.id}" missing nationId`);
    } else if (!nationIds.has(l.nationId)) {
      errors.push(`Leader "${l.id}" references unknown nation: "${l.nationId}"`);
    }

    // Birth year
    if (typeof l.birthYear !== 'number') {
      errors.push(`Leader "${l.id}" birthYear must be a number`);
    }

    // Death year — null allowed, must be >= birthYear if present
    if (l.deathYear !== null && l.deathYear !== undefined) {
      if (typeof l.deathYear !== 'number') {
        errors.push(`Leader "${l.id}" deathYear must be a number or null`);
      } else if (typeof l.birthYear === 'number' && l.deathYear < l.birthYear) {
        errors.push(`Leader "${l.id}" deathYear (${l.deathYear}) must be >= birthYear (${l.birthYear})`);
      }
    }

    // Legitimacy 0.0–1.0
    if (typeof l.legitimacy !== 'number' || l.legitimacy < 0 || l.legitimacy > 1) {
      errors.push(`Leader "${l.id}" legitimacy must be 0.0–1.0`);
    }

    // Influence 0.0–1.0
    if (typeof l.influence !== 'number' || l.influence < 0 || l.influence > 1) {
      errors.push(`Leader "${l.id}" influence must be 0.0–1.0`);
    }

    // Title
    if (!l.title || typeof l.title !== 'string') {
      errors.push(`Leader "${l.id}" missing valid title`);
    }
  }

  return errors;
}

function validatePoliticalStates(states, nations) {
  const errors = [];
  const nationIds = new Set(nations.map(n => n.id));
  const usedNationIds = new Set();

  for (const s of states) {
    // nationId reference
    if (!s.nationId || typeof s.nationId !== 'string') {
      errors.push('PoliticalState missing nationId');
      continue;
    }
    if (!nationIds.has(s.nationId)) {
      errors.push(`PoliticalState references unknown nation: "${s.nationId}"`);
    }
    if (usedNationIds.has(s.nationId)) {
      errors.push(`Duplicate PoliticalState for nation: "${s.nationId}"`);
    }
    usedNationIds.add(s.nationId);

    // governmentType
    if (!s.governmentType || typeof s.governmentType !== 'string') {
      errors.push(`PoliticalState "${s.nationId}" missing governmentType`);
    }

    // stability 0.0–1.0
    if (typeof s.stability !== 'number' || s.stability < 0 || s.stability > 1) {
      errors.push(`PoliticalState "${s.nationId}" stability must be 0.0–1.0`);
    }

    // centralizedPower 0.0–1.0
    if (typeof s.centralizedPower !== 'number' || s.centralizedPower < 0 || s.centralizedPower > 1) {
      errors.push(`PoliticalState "${s.nationId}" centralizedPower must be 0.0–1.0`);
    }

    // activePolicies must be array
    if (!Array.isArray(s.activePolicies)) {
      errors.push(`PoliticalState "${s.nationId}" activePolicies must be an array`);
    }
  }

  // Each nation must have exactly one political state
  for (const nation of nations) {
    if (!usedNationIds.has(nation.id)) {
      errors.push(`Nation "${nation.id}" has no PoliticalState`);
    }
  }

  return errors;
}

function validateEvents(events, nations, simulation) {
  const errors = [];
  const ids = new Set();
  const nationIds = new Set(nations.map(n => n.id));
  const simYear = simulation && typeof simulation.year === 'number' ? simulation.year : null;

  for (const e of events) {
    // ID
    if (!e.id || typeof e.id !== 'string' || e.id.trim().length === 0) {
      errors.push('Event missing valid id');
      continue;
    }
    if (ids.has(e.id)) {
      errors.push(`Duplicate event id: "${e.id}"`);
    }
    ids.add(e.id);

    // Type
    if (!e.type || typeof e.type !== 'string') {
      errors.push(`Event "${e.id}" missing type`);
    }

    // Year — must be <= simulation year if present
    if (typeof e.year !== 'number') {
      errors.push(`Event "${e.id}" year must be a number`);
    } else if (simYear !== null && e.year > simYear) {
      errors.push(`Event "${e.id}" year (${e.year}) is after simulation year (${simYear})`);
    }

    // Quarter 1–4
    if (typeof e.quarter !== 'number' || !Number.isInteger(e.quarter) || e.quarter < 1 || e.quarter > 4) {
      errors.push(`Event "${e.id}" quarter must be 1–4`);
    }

    // Description
    if (!e.description || typeof e.description !== 'string') {
      errors.push(`Event "${e.id}" missing description`);
    }

    // nationIds array — references must be valid
    if (!Array.isArray(e.nationIds)) {
      errors.push(`Event "${e.id}" nationIds must be an array`);
    } else {
      for (const nid of e.nationIds) {
        if (!nationIds.has(nid)) {
          errors.push(`Event "${e.id}" references unknown nation: "${nid}"`);
        }
      }
    }
  }

  return errors;
}

/**
 * Validate that currentLeaderId fields in nations point to real leaders.
 */
function validateCurrentLeaderReferences(nations, leaders) {
  const errors = [];
  const leaderIds = new Set(leaders.map(l => l.id));

  for (const n of nations) {
    if (n.currentLeaderId && !leaderIds.has(n.currentLeaderId)) {
      errors.push(`Nation "${n.id}" currentLeaderId "${n.currentLeaderId}" references unknown leader`);
    }
  }

  return errors;
}

// ── Utilities ─────────────────────────────────────────────────────────────────

function isValidHexColor(color) {
  return typeof color === 'string' && /^#[0-9A-Fa-f]{6}$/.test(color);
}

module.exports = { validateSnapshot };
