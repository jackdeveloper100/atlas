/**
 * stepQuarter.js
 *
 * Quarterly simulation step
 *
 * Purpose:
 * - Execute one quarter of simulation time
 * - Apply simulation rules and update world state
 * - Return immutable next world state
 *
 * IMPORTANT: Phase 1 implementation is minimal
 * Most simulation systems are placeholders for future phases
 *
 * Current implementations:
 * - Time advancement
 * - Simple population growth
 * - Event recording
 *
 * Future implementations (placeholders):
 * - Political simulation
 * - Diplomacy
 * - Wars
 * - Economic simulation
 * - Leader succession
 * - Natural disasters
 */

'use strict';

const Event = require('../events/Event');
const DeterministicRandom = require('./DeterministicRandom');

/**
 * Execute one quarterly simulation step
 * @param {World} world - Current world state
 * @returns {World} Updated world state
 */
function stepQuarter(world) {
  // Create RNG from world seed for deterministic behavior
  const rng = new DeterministicRandom(
    `${world.metadata.seed}-${world.getYear()}-${world.getQuarter()}`
  );
  
  // Advance simulation clock
  const simulationTime = world.simulationTime.advanceQuarter();
  
  // Update nations (simple population growth)
  const nations = world.nations.map(nation => {
    return updateNationQuarterly(nation, world, rng);
  });
  
  // Update regions (distribute population changes)
  const regions = world.regions.map(region => {
    return updateRegionQuarterly(region, world, rng);
  });
  
  // Update leaders (age, check for death - placeholder)
  const leaders = world.leaders.map(leader => {
    return updateLeaderQuarterly(leader, world, rng);
  });
  
  // Update political states (stability drift - placeholder)
  const politicalStates = world.politicalStates.map(state => {
    return updatePoliticalStateQuarterly(state, world, rng);
  });
  
  // Generate events for this quarter (if any)
  const newEvents = generateQuarterlyEvents(world, rng);
  const events = [...world.events, ...newEvents];
  
  // Return updated world
  return world.update({
    simulationTime,
    nations,
    regions,
    leaders,
    politicalStates,
    events
  });
}

/**
 * Update nation for one quarter
 * PLACEHOLDER: Simple population growth only
 */
function updateNationQuarterly(nation, world, rng) {
  // Simple quarterly population growth: ~0.5% per year = ~0.125% per quarter
  const growthRate = 0.00125 + rng.nextFloat(-0.0005, 0.0005);
  const newPopulation = Math.floor(nation.population * (1 + growthRate));
  
  return nation.update({
    population: newPopulation
  });
}

/**
 * Update region for one quarter
 * PLACEHOLDER: Simple population growth only
 */
function updateRegionQuarterly(region, world, rng) {
  // Simple quarterly population growth
  const growthRate = 0.00125 + rng.nextFloat(-0.0005, 0.0005);
  const newPopulation = Math.floor(region.population * (1 + growthRate));
  
  // Slight urbanization drift
  const urbanizationChange = rng.nextFloat(-0.001, 0.002);
  const newUrbanization = Math.max(0, Math.min(1, region.urbanization + urbanizationChange));
  
  return region.update({
    population: newPopulation,
    urbanization: newUrbanization
  });
}

/**
 * Update leader for one quarter
 * PLACEHOLDER: No real mechanics yet
 */
function updateLeaderQuarterly(leader, world, rng) {
  // PLACEHOLDER: No succession or death mechanics in Phase 1
  // Future: Check age, calculate death probability, trigger succession
  return leader;
}

/**
 * Update political state for one quarter
 * PLACEHOLDER: Slight stability drift only
 */
function updatePoliticalStateQuarterly(state, world, rng) {
  // Slight stability drift
  const stabilityChange = rng.nextFloat(-0.01, 0.01);
  const newStability = Math.max(0, Math.min(1, state.stability + stabilityChange));
  
  return state.update({
    stability: newStability
  });
}

/**
 * Generate events for this quarter
 * PLACEHOLDER: Very minimal event generation
 */
function generateQuarterlyEvents(world, rng) {
  const events = [];
  
  // Example: Record population milestones
  for (const nation of world.nations) {
    if (nation.population >= 600000 && nation.population < 601000) {
      events.push(new Event({
        id: `event-pop-${nation.id}-${world.getYear()}-${world.getQuarter()}`,
        type: Event.Types.POPULATION_MILESTONE,
        year: world.getYear(),
        quarter: world.getQuarter(),
        description: `${nation.name} population reached 600,000`,
        nationIds: [nation.id],
        data: { population: nation.population }
      }));
    }
  }
  
  return events;
}

/**
 * PLACEHOLDER FUNCTIONS FOR FUTURE PHASES
 * 
 * These systems are NOT implemented in Phase 1
 * They are documented here as extension points
 */

// function stepDiplomacy(world, rng) {
//   // Future: Update diplomatic relations, process treaties, form alliances
//   return world;
// }

// function stepWars(world, rng) {
//   // Future: Process ongoing wars, calculate battles, check for war end
//   return world;
// }

// function stepEconomy(world, rng) {
//   // Future: Update GDP, trade, resources, economic growth
//   return world;
// }

// function stepLeaderSuccession(world, rng) {
//   // Future: Check for leader death, trigger succession events
//   return world;
// }

// function stepNaturalEvents(world, rng) {
//   // Future: Generate natural disasters, climate events, plagues
//   return world;
// }

module.exports = {
  stepQuarter
};
