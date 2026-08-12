/**
 * Leader.js
 *
 * Leader/Character entity
 *
 * Purpose:
 * - Represents a leader or notable character in the simulation
 * - Leaders govern nations and make political decisions
 *
 * Identifier: id (string, unique)
 *
 * Required properties:
 * - id (string) — Unique leader identifier (e.g., "leader-001")
 * - name (string) — Display name
 * - nationId (string) — Nation this leader belongs to
 *
 * Optional properties:
 * - birthYear (number) — Year of birth
 * - deathYear (number) — Year of death (null if alive)
 * - startedRulingYear (number) — Year they became leader
 * - endedRulingYear (number) — Year they stopped ruling (null if current)
 * - title (string) — Official title (e.g., "Emperor", "President")
 * - legitimacy (number) — 0.0 to 1.0 (0% to 100%)
 * - influence (number) — 0.0 to 1.0 (0% to 100%)
 *
 * Relationships:
 * - Belongs to one Nation (via nationId)
 * - May be current leader of Nation (via nation.currentLeaderId)
 *
 * Source: ATLAS domain requirements
 * Assumptions:
 * - Succession mechanics are handled by leaders/succession.js
 * - In Phase 1, leaders are simplified (no complex traits)
 */

'use strict';

class Leader {
  constructor({
    id,
    name,
    nationId,
    birthYear = 0,
    deathYear = null,
    startedRulingYear = null,
    endedRulingYear = null,
    title = 'Leader',
    legitimacy = 0.5,
    influence = 0.5
  }) {
    // Validation
    if (!id || typeof id !== 'string') {
      throw new Error('Leader must have a valid id');
    }
    if (!name || typeof name !== 'string') {
      throw new Error('Leader must have a valid name');
    }
    if (!nationId || typeof nationId !== 'string') {
      throw new Error('Leader must have a valid nationId');
    }
    
    this.id = id;
    this.name = name;
    this.nationId = nationId;
    this.birthYear = birthYear;
    this.deathYear = deathYear;
    this.startedRulingYear = startedRulingYear;
    this.endedRulingYear = endedRulingYear;
    this.title = title;
    this.legitimacy = Math.max(0, Math.min(1, legitimacy));
    this.influence = Math.max(0, Math.min(1, influence));
    
    Object.freeze(this);
  }
  
  /**
   * Check if leader is currently ruling
   */
  isCurrentLeader(currentYear) {
    return this.startedRulingYear !== null 
      && this.startedRulingYear <= currentYear
      && (this.endedRulingYear === null || this.endedRulingYear > currentYear);
  }
  
  /**
   * Check if leader is alive
   */
  isAlive(currentYear) {
    return this.deathYear === null || this.deathYear > currentYear;
  }
  
  /**
   * Get age at given year
   */
  getAge(currentYear) {
    if (currentYear < this.birthYear) return 0;
    if (this.deathYear !== null && currentYear >= this.deathYear) {
      return this.deathYear - this.birthYear;
    }
    return currentYear - this.birthYear;
  }
  
  /**
   * Create updated copy with changes
   */
  update(changes) {
    return new Leader({
      id: this.id,
      name: changes.name !== undefined ? changes.name : this.name,
      nationId: this.nationId,
      birthYear: this.birthYear,
      deathYear: changes.deathYear !== undefined ? changes.deathYear : this.deathYear,
      startedRulingYear: changes.startedRulingYear !== undefined ? changes.startedRulingYear : this.startedRulingYear,
      endedRulingYear: changes.endedRulingYear !== undefined ? changes.endedRulingYear : this.endedRulingYear,
      title: changes.title !== undefined ? changes.title : this.title,
      legitimacy: changes.legitimacy !== undefined ? changes.legitimacy : this.legitimacy,
      influence: changes.influence !== undefined ? changes.influence : this.influence
    });
  }
  
  /**
   * Convert to plain object for serialization
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      nationId: this.nationId,
      birthYear: this.birthYear,
      deathYear: this.deathYear,
      startedRulingYear: this.startedRulingYear,
      endedRulingYear: this.endedRulingYear,
      title: this.title,
      legitimacy: this.legitimacy,
      influence: this.influence
    };
  }
  
  /**
   * Create from plain object
   */
  static fromJSON(data) {
    return new Leader(data);
  }
}

module.exports = Leader;
