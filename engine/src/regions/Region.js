/**
 * Region.js
 *
 * Region entity
 *
 * Purpose:
 * - Represents a geographic/administrative subdivision within a nation
 * - Holds regional demographics and local state
 *
 * Identifier: id (string, unique)
 *
 * Required properties:
 * - id (string) — Unique region identifier (e.g., "kelkelia-north")
 * - name (string) — Display name (e.g., "Northern Kelkelia")
 * - nationId (string) — Nation this region belongs to
 *
 * Optional properties:
 * - population (number) — Regional population
 * - area (number) — Area in arbitrary units
 * - urbanization (number) — 0.0 to 1.0 (0% to 100% urban)
 *
 * Relationships:
 * - Belongs to one Nation (via nationId)
 *
 * Source: ATLAS domain requirements
 * Assumptions:
 * - Regions are static (no territorial changes in Phase 1)
 * - Population demographics are aggregated at region level
 */

'use strict';

class Region {
  constructor({
    id,
    name,
    nationId,
    population = 0,
    area = 1,
    urbanization = 0.1
  }) {
    // Validation
    if (!id || typeof id !== 'string') {
      throw new Error('Region must have a valid id');
    }
    if (!name || typeof name !== 'string') {
      throw new Error('Region must have a valid name');
    }
    if (!nationId || typeof nationId !== 'string') {
      throw new Error('Region must have a valid nationId');
    }
    
    this.id = id;
    this.name = name;
    this.nationId = nationId;
    this.population = population;
    this.area = area;
    this.urbanization = Math.max(0, Math.min(1, urbanization));
    
    Object.freeze(this);
  }
  
  /**
   * Create updated copy with changes
   */
  update(changes) {
    return new Region({
      id: this.id,
      name: changes.name !== undefined ? changes.name : this.name,
      nationId: this.nationId,
      population: changes.population !== undefined ? changes.population : this.population,
      area: changes.area !== undefined ? changes.area : this.area,
      urbanization: changes.urbanization !== undefined ? changes.urbanization : this.urbanization
    });
  }
  
  /**
   * Get population density
   */
  getPopulationDensity() {
    return this.area > 0 ? this.population / this.area : 0;
  }
  
  /**
   * Get urban population
   */
  getUrbanPopulation() {
    return Math.floor(this.population * this.urbanization);
  }
  
  /**
   * Get rural population
   */
  getRuralPopulation() {
    return this.population - this.getUrbanPopulation();
  }
  
  /**
   * Convert to plain object for serialization
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      nationId: this.nationId,
      population: this.population,
      area: this.area,
      urbanization: this.urbanization
    };
  }
  
  /**
   * Create from plain object
   */
  static fromJSON(data) {
    return new Region(data);
  }
}

module.exports = Region;
