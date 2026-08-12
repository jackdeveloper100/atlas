/**
 * validator.js
 *
 * Snapshot validator
 *
 * Purpose:
 * - Validate snapshot JSON against schema v1.0.0
 * - Check required fields, data types, relationships
 * - Report validation errors
 *
 * Schema: See SNAPSHOT_SCHEMA.md
 */

'use strict';

/**
 * Validate a snapshot object
 * @param {object} snapshot - Snapshot to validate
 * @returns {object} { valid: boolean, errors: string[] }
 */
function validateSnapshot(snapshot) {
  const errors = [];
  
  // Check schema_version
  if (!snapshot.schema_version) {
    errors.push('Missing required field: schema_version');
  } else if (snapshot.schema_version !== '1.0.0') {
    errors.push(`Unsupported schema_version: ${snapshot.schema_version}`);
  }
  
  // Check simulation metadata
  if (!snapshot.simulation) {
    errors.push('Missing required field: simulation');
  } else {
    errors.push(...validateSimulationMetadata(snapshot.simulation));
  }
  
  // Check world state
  if (!snapshot.world) {
    errors.push('Missing required field: world');
  } else {
    errors.push(...validateWorldState(snapshot.world));
  }
  
  // Check entities
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
    errors.push(...validateEvents(snapshot.events, snapshot.nations || []));
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate simulation metadata
 */
function validateSimulationMetadata(sim) {
  const errors = [];
  
  if (typeof sim.year !== 'number') {
    errors.push('simulation.year must be a number');
  }
  if (typeof sim.quarter !== 'number' || sim.quarter < 1 || sim.quarter > 4) {
    errors.push('simulation.quarter must be 1-4');
  }
  if (typeof sim.seed !== 'string' || sim.seed.length === 0) {
    errors.push('simulation.seed must be a non-empty string');
  }
  if (typeof sim.engineVersion !== 'string') {
    errors.push('simulation.engineVersion must be a string');
  }
  if (typeof sim.generatedAt !== 'string') {
    errors.push('simulation.generatedAt must be an ISO 8601 string');
  }
  
  return errors;
}

/**
 * Validate world state
 */
function validateWorldState(world) {
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

/**
 * Validate nations
 */
function validateNations(nations) {
  const errors = [];
  const ids = new Set();
  
  for (const nation of nations) {
    if (!nation.id || typeof nation.id !== 'string') {
      errors.push('Nation missing valid id');
    } else {
      if (ids.has(nation.id)) {
        errors.push(`Duplicate nation id: ${nation.id}`);
      }
      ids.add(nation.id);
    }
    
    if (!nation.name || typeof nation.name !== 'string') {
      errors.push(`Nation ${nation.id || 'unknown'} missing valid name`);
    }
    if (typeof nation.population !== 'number' || nation.population < 0) {
      errors.push(`Nation ${nation.id || 'unknown'} has invalid population`);
    }
    if (!isValidHexColor(nation.color)) {
      errors.push(`Nation ${nation.id || 'unknown'} has invalid color`);
    }
  }
  
  return errors;
}

/**
 * Validate regions
 */
function validateRegions(regions, nations) {
  const errors = [];
  const ids = new Set();
  const nationIds = new Set(nations.map(n => n.id));
  
  for (const region of regions) {
    if (!region.id || typeof region.id !== 'string') {
      errors.push('Region missing valid id');
    } else {
      if (ids.has(region.id)) {
        errors.push(`Duplicate region id: ${region.id}`);
      }
      ids.add(region.id);
    }
    
    if (!region.name || typeof region.name !== 'string') {
      errors.push(`Region ${region.id || 'unknown'} missing valid name`);
    }
    if (!region.nationId || !nationIds.has(region.nationId)) {
      errors.push(`Region ${region.id || 'unknown'} has invalid nationId`);
    }
    if (typeof region.population !== 'number' || region.population < 0) {
      errors.push(`Region ${region.id || 'unknown'} has invalid population`);
    }
    if (typeof region.urbanization !== 'number' || region.urbanization < 0 || region.urbanization > 1) {
      errors.push(`Region ${region.id || 'unknown'} urbanization must be 0.0-1.0`);
    }
  }
  
  return errors;
}

/**
 * Validate leaders
 */
function validateLeaders(leaders, nations) {
  const errors = [];
  const ids = new Set();
  const nationIds = new Set(nations.map(n => n.id));
  
  for (const leader of leaders) {
    if (!leader.id || typeof leader.id !== 'string') {
      errors.push('Leader missing valid id');
    } else {
      if (ids.has(leader.id)) {
        errors.push(`Duplicate leader id: ${leader.id}`);
      }
      ids.add(leader.id);
    }
    
    if (!leader.name || typeof leader.name !== 'string') {
      errors.push(`Leader ${leader.id || 'unknown'} missing valid name`);
    }
    if (!leader.nationId || !nationIds.has(leader.nationId)) {
      errors.push(`Leader ${leader.id || 'unknown'} has invalid nationId`);
    }
    if (leader.deathYear !== null && leader.deathYear < leader.birthYear) {
      errors.push(`Leader ${leader.id || 'unknown'} deathYear before birthYear`);
    }
    if (typeof leader.legitimacy !== 'number' || leader.legitimacy < 0 || leader.legitimacy > 1) {
      errors.push(`Leader ${leader.id || 'unknown'} legitimacy must be 0.0-1.0`);
    }
    if (typeof leader.influence !== 'number' || leader.influence < 0 || leader.influence > 1) {
      errors.push(`Leader ${leader.id || 'unknown'} influence must be 0.0-1.0`);
    }
  }
  
  return errors;
}

/**
 * Validate political states
 */
function validatePoliticalStates(states, nations) {
  const errors = [];
  const nationIds = new Set(nations.map(n => n.id));
  const usedNationIds = new Set();
  
  for (const state of states) {
    if (!state.nationId || !nationIds.has(state.nationId)) {
      errors.push('PoliticalState has invalid nationId');
    } else {
      if (usedNationIds.has(state.nationId)) {
        errors.push(`Duplicate PoliticalState for nation: ${state.nationId}`);
      }
      usedNationIds.add(state.nationId);
    }
    
    if (typeof state.governmentType !== 'string') {
      errors.push(`PoliticalState ${state.nationId || 'unknown'} missing governmentType`);
    }
    if (typeof state.stability !== 'number' || state.stability < 0 || state.stability > 1) {
      errors.push(`PoliticalState ${state.nationId || 'unknown'} stability must be 0.0-1.0`);
    }
    if (typeof state.centralizedPower !== 'number' || state.centralizedPower < 0 || state.centralizedPower > 1) {
      errors.push(`PoliticalState ${state.nationId || 'unknown'} centralizedPower must be 0.0-1.0`);
    }
    if (!Array.isArray(state.activePolicies)) {
      errors.push(`PoliticalState ${state.nationId || 'unknown'} activePolicies must be array`);
    }
  }
  
  return errors;
}

/**
 * Validate events
 */
function validateEvents(events, nations) {
  const errors = [];
  const ids = new Set();
  const nationIds = new Set(nations.map(n => n.id));
  
  for (const event of events) {
    if (!event.id || typeof event.id !== 'string') {
      errors.push('Event missing valid id');
    } else {
      if (ids.has(event.id)) {
        errors.push(`Duplicate event id: ${event.id}`);
      }
      ids.add(event.id);
    }
    
    if (!event.type || typeof event.type !== 'string') {
      errors.push(`Event ${event.id || 'unknown'} missing type`);
    }
    if (typeof event.year !== 'number') {
      errors.push(`Event ${event.id || 'unknown'} missing year`);
    }
    if (typeof event.quarter !== 'number' || event.quarter < 1 || event.quarter > 4) {
      errors.push(`Event ${event.id || 'unknown'} quarter must be 1-4`);
    }
    if (!event.description || typeof event.description !== 'string') {
      errors.push(`Event ${event.id || 'unknown'} missing description`);
    }
    if (!Array.isArray(event.nationIds)) {
      errors.push(`Event ${event.id || 'unknown'} nationIds must be array`);
    } else {
      for (const nationId of event.nationIds) {
        if (!nationIds.has(nationId)) {
          errors.push(`Event ${event.id || 'unknown'} references invalid nation: ${nationId}`);
        }
      }
    }
  }
  
  return errors;
}

/**
 * Check if string is valid hex color
 */
function isValidHexColor(color) {
  return typeof color === 'string' && /^#[0-9A-Fa-f]{6}$/.test(color);
}

module.exports = {
  validateSnapshot
};
