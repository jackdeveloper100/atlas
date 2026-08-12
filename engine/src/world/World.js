/**
 * World.js
 *
 * World state container
 *
 * Purpose:
 * - Hold complete simulation state at a given point in time
 * - Immutable state pattern - each simulation step creates a new World
 * - Acts as the single source of truth for the simulation
 *
 * Source: ATLAS architecture specification
 */

'use strict';

class World {
  constructor({
    simulationTime,
    metadata,
    nations = [],
    regions = [],
    leaders = [],
    politicalStates = [],
    events = []
  }) {
    // Simulation time (year/quarter)
    this.simulationTime = simulationTime;
    
    // Metadata about this world state
    this.metadata = {
      seed: metadata?.seed || null,
      engineVersion: metadata?.engineVersion || '0.1.0',
      generatedAt: metadata?.generatedAt || new Date().toISOString(),
      ...metadata
    };
    
    // Core entities
    this.nations = nations;           // Array of Nation objects
    this.regions = regions;           // Array of Region objects
    this.leaders = leaders;           // Array of Leader objects
    this.politicalStates = politicalStates; // Array of PoliticalState objects
    this.events = events;             // Array of Event objects
    
    // Freeze to enforce immutability
    Object.freeze(this);
  }
  
  /**
   * Get current simulation year
   */
  getYear() {
    return this.simulationTime.year;
  }
  
  /**
   * Get current simulation quarter
   */
  getQuarter() {
    return this.simulationTime.quarter;
  }
  
  /**
   * Find nation by ID
   */
  getNation(nationId) {
    return this.nations.find(n => n.id === nationId);
  }
  
  /**
   * Find leader by ID
   */
  getLeader(leaderId) {
    return this.leaders.find(l => l.id === leaderId);
  }
  
  /**
   * Get regions for a nation
   */
  getRegionsByNation(nationId) {
    return this.regions.filter(r => r.nationId === nationId);
  }
  
  /**
   * Get events for current year
   */
  getEventsThisYear() {
    return this.events.filter(e => e.year === this.getYear());
  }
  
  /**
   * Create a new World with updated entities
   * (Immutable update pattern)
   */
  update(changes) {
    return new World({
      simulationTime: changes.simulationTime || this.simulationTime,
      metadata: changes.metadata || this.metadata,
      nations: changes.nations || this.nations,
      regions: changes.regions || this.regions,
      leaders: changes.leaders || this.leaders,
      politicalStates: changes.politicalStates || this.politicalStates,
      events: changes.events || this.events
    });
  }
}

module.exports = World;
