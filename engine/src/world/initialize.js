/**
 * initialize.js
 *
 * World initialization
 *
 * Purpose:
 * - Create initial world state for simulation
 * - Initialize 4 confirmed nations: Kelkelia, Corondel, Ashen Run, Vantoria
 * - Create basic regions, leaders, and political states
 *
 * Source: ATLAS Phase 1 specification
 * Confirmed nations from PROJECT_PLAN.md
 *
 * IMPORTANT: This is a minimal development initialization
 * Do NOT create thousands of records or complex starting state
 */

'use strict';

const World = require('./World');
const SimulationClock = require('../simulation/SimulationClock');
const Nation = require('../nations/Nation');
const Region = require('../regions/Region');
const Leader = require('../leaders/Leader');
const PoliticalState = require('../politics/PoliticalState');
const Event = require('../events/Event');
const DeterministicRandom = require('../simulation/DeterministicRandom');

/**
 * Initialize a new world at Year 0, Quarter 1
 * @param {string} seed - Deterministic seed for randomization
 * @returns {World} Initial world state
 */
function initializeWorld(seed = 'atlas-dev-001') {
  const rng = new DeterministicRandom(seed);
  
  // Simulation clock starts at Year 0, Quarter 1
  const simulationTime = new SimulationClock(0, 1);
  
  // Metadata
  const metadata = {
    seed,
    engineVersion: '0.1.0',
    generatedAt: new Date().toISOString(),
    initialized: true
  };
  
  // Create the 4 confirmed nations
  const nations = [
    new Nation({
      id: 'kelkelia',
      name: 'Kelkelia',
      population: 500000,
      capitalRegionId: 'kelkelia-capital',
      currentLeaderId: 'leader-kelkelia-001',
      foundedYear: -100,
      color: '#8B4513'
    }),
    new Nation({
      id: 'corondel',
      name: 'Corondel',
      population: 450000,
      capitalRegionId: 'corondel-capital',
      currentLeaderId: 'leader-corondel-001',
      foundedYear: -80,
      color: '#4169E1'
    }),
    new Nation({
      id: 'ashen-run',
      name: 'Ashen Run',
      population: 300000,
      capitalRegionId: 'ashen-run-capital',
      currentLeaderId: 'leader-ashen-run-001',
      foundedYear: -50,
      color: '#696969'
    }),
    new Nation({
      id: 'vantoria',
      name: 'Vantoria',
      population: 400000,
      capitalRegionId: 'vantoria-capital',
      currentLeaderId: 'leader-vantoria-001',
      foundedYear: -60,
      color: '#2E8B57'
    })
  ];
  
  // Create basic regions (2 per nation - capital + hinterland)
  const regions = [];
  for (const nation of nations) {
    // Capital region (60% of population, urbanized)
    regions.push(new Region({
      id: `${nation.id}-capital`,
      name: `${nation.name} Capital`,
      nationId: nation.id,
      population: Math.floor(nation.population * 0.6),
      area: 100,
      urbanization: 0.7
    }));
    
    // Hinterland region (40% of population, rural)
    regions.push(new Region({
      id: `${nation.id}-hinterland`,
      name: `${nation.name} Hinterland`,
      nationId: nation.id,
      population: Math.floor(nation.population * 0.4),
      area: 300,
      urbanization: 0.1
    }));
  }
  
  // Create initial leaders (one per nation)
  const leaders = nations.map((nation, index) => {
    return new Leader({
      id: `leader-${nation.id}-001`,
      name: generateLeaderName(rng, nation.name),
      nationId: nation.id,
      birthYear: -40 + (index * 5), // Varying ages
      deathYear: null,
      startedRulingYear: -20 + (index * 3),
      endedRulingYear: null,
      title: 'Monarch',
      legitimacy: 0.6 + rng.nextFloat(0, 0.2),
      influence: 0.5 + rng.nextFloat(0, 0.3)
    });
  });
  
  // Create initial political states
  const politicalStates = nations.map(nation => {
    return new PoliticalState({
      nationId: nation.id,
      governmentType: 'Monarchy',
      stability: 0.5 + rng.nextFloat(-0.1, 0.1),
      centralizedPower: 0.6 + rng.nextFloat(-0.2, 0.2),
      activePolicies: []
    });
  });
  
  // Create initialization event
  const events = [
    new Event({
      id: 'event-world-init',
      type: 'WORLD_INITIALIZED',
      year: 0,
      quarter: 1,
      description: `World initialized with seed: ${seed}`,
      nationIds: nations.map(n => n.id),
      data: { seed, nationCount: nations.length }
    })
  ];
  
  // Assemble world
  return new World({
    simulationTime,
    metadata,
    nations,
    regions,
    leaders,
    politicalStates,
    events
  });
}

/**
 * Generate a leader name based on nation name
 * (Simple placeholder - could be more sophisticated)
 */
function generateLeaderName(rng, nationName) {
  const prefixes = ['King', 'Queen', 'Emperor', 'Empress', 'Prince', 'Princess'];
  const suffixes = ['the First', 'the Great', 'the Wise', 'the Bold', 'the Just'];
  
  const prefix = rng.choice(prefixes);
  const suffix = rng.choice(suffixes);
  
  return `${prefix} of ${nationName} ${suffix}`;
}

module.exports = {
  initializeWorld,
  generateLeaderName
};
