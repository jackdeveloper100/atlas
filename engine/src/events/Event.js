/**
 * Event.js
 *
 * Historical event entity
 *
 * Purpose:
 * - Records notable events that occur during simulation
 * - Events are immutable historical records
 *
 * Identifier: id (string, unique)
 *
 * Required properties:
 * - id (string) — Unique event identifier
 * - type (string) — Event type (e.g., "LEADER_SUCCESSION", "WAR_STARTED")
 * - year (number) — Year event occurred
 * - quarter (number) — Quarter event occurred (1-4)
 * - description (string) — Human-readable description
 *
 * Optional properties:
 * - nationIds (array) — Nations involved in this event
 * - data (object) — Additional structured data about the event
 *
 * Relationships:
 * - May reference Nations (via nationIds)
 * - May reference Leaders, Wars, etc. (via data object)
 *
 * Source: ATLAS domain requirements
 * Assumptions:
 * - Events are append-only (never modified)
 * - Events are used for generating historical narrative
 */

'use strict';

class Event {
  constructor({
    id,
    type,
    year,
    quarter,
    description,
    nationIds = [],
    data = {}
  }) {
    // Validation
    if (!id || typeof id !== 'string') {
      throw new Error('Event must have a valid id');
    }
    if (!type || typeof type !== 'string') {
      throw new Error('Event must have a valid type');
    }
    if (typeof year !== 'number') {
      throw new Error('Event must have a valid year');
    }
    if (quarter < 1 || quarter > 4) {
      throw new Error('Event must have a valid quarter (1-4)');
    }
    if (!description || typeof description !== 'string') {
      throw new Error('Event must have a valid description');
    }
    
    this.id = id;
    this.type = type;
    this.year = year;
    this.quarter = quarter;
    this.description = description;
    this.nationIds = [...nationIds];
    this.data = { ...data };
    
    Object.freeze(this);
  }
  
  /**
   * Check if event involves a specific nation
   */
  involvesNation(nationId) {
    return this.nationIds.includes(nationId);
  }
  
  /**
   * Convert to plain object for serialization
   */
  toJSON() {
    return {
      id: this.id,
      type: this.type,
      year: this.year,
      quarter: this.quarter,
      description: this.description,
      nationIds: this.nationIds,
      data: this.data
    };
  }
  
  /**
   * Create from plain object
   */
  static fromJSON(data) {
    return new Event(data);
  }
}

// Event types (for reference - not exhaustive)
Event.Types = {
  LEADER_SUCCESSION: 'LEADER_SUCCESSION',
  LEADER_DEATH: 'LEADER_DEATH',
  POPULATION_MILESTONE: 'POPULATION_MILESTONE',
  POLICY_ENACTED: 'POLICY_ENACTED',
  WAR_STARTED: 'WAR_STARTED',
  WAR_ENDED: 'WAR_ENDED',
  TREATY_SIGNED: 'TREATY_SIGNED',
  NATURAL_DISASTER: 'NATURAL_DISASTER',
  TECHNOLOGICAL_ADVANCE: 'TECHNOLOGICAL_ADVANCE'
};

module.exports = Event;
