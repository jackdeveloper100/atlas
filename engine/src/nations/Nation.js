/**
 * Nation.js
 *
 * Nation entity
 *
 * Purpose:
 * - Represents a sovereign political entity in the simulation
 * - Holds nation-level state (name, demographics, leader)
 *
 * Identifier: id (string, unique)
 *
 * Required properties:
 * - id (string) — Unique nation identifier (e.g., "kelkelia")
 * - name (string) — Display name (e.g., "Kelkelia")
 *
 * Optional properties:
 * - population (number) — Total population
 * - capitalRegionId (string) — ID of capital region
 * - currentLeaderId (string) — ID of current leader
 * - foundedYear (number) — Year nation was founded
 * - color (string) — Map color (hex code)
 *
 * Relationships:
 * - Has many Regions (via region.nationId)
 * - Has one current Leader (via currentLeaderId)
 * - Has one PoliticalState (via politicalState.nationId)
 *
 * Source: ATLAS domain requirements
 * Assumptions:
 * - Population is an aggregate of region populations
 * - Leader succession is handled by leader/succession.js
 */

'use strict';

class Nation {
  constructor({
    id,
    name,
    population = 0,
    capitalRegionId = null,
    currentLeaderId = null,
    foundedYear = 0,
    color = '#999999'
  }) {
    // Validation
    if (!id || typeof id !== 'string') {
      throw new Error('Nation must have a valid id');
    }
    if (!name || typeof name !== 'string') {
      throw new Error('Nation must have a valid name');
    }
    
    this.id = id;
    this.name = name;
    this.population = population;
    this.capitalRegionId = capitalRegionId;
    this.currentLeaderId = currentLeaderId;
    this.foundedYear = foundedYear;
    this.color = color;
    
    Object.freeze(this);
  }
  
  /**
   * Create updated copy with changes
   */
  update(changes) {
    return new Nation({
      id: this.id,
      name: changes.name !== undefined ? changes.name : this.name,
      population: changes.population !== undefined ? changes.population : this.population,
      capitalRegionId: changes.capitalRegionId !== undefined ? changes.capitalRegionId : this.capitalRegionId,
      currentLeaderId: changes.currentLeaderId !== undefined ? changes.currentLeaderId : this.currentLeaderId,
      foundedYear: this.foundedYear,
      color: changes.color !== undefined ? changes.color : this.color
    });
  }
  
  /**
   * Convert to plain object for serialization
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      population: this.population,
      capitalRegionId: this.capitalRegionId,
      currentLeaderId: this.currentLeaderId,
      foundedYear: this.foundedYear,
      color: this.color
    };
  }
  
  /**
   * Create from plain object
   */
  static fromJSON(data) {
    return new Nation(data);
  }
}

module.exports = Nation;
