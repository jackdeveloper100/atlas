/**
 * SimulationClock.js
 *
 * Manages simulation time (year/quarter progression)
 *
 * Purpose:
 * - Track current simulation time
 * - Advance time by quarters
 * - Handle year boundaries (Q4 → next year Q1)
 *
 * Properties:
 * - year (integer) — Current simulation year (starts at 0)
 * - quarter (1-4) — Current quarter
 *
 * Source: ATLAS Phase 1 specification
 */

'use strict';

class SimulationClock {
  constructor(year = 0, quarter = 1) {
    if (quarter < 1 || quarter > 4) {
      throw new Error(`Invalid quarter: ${quarter}. Must be 1-4.`);
    }
    
    this.year = year;
    this.quarter = quarter;
    
    Object.freeze(this);
  }
  
  /**
   * Advance to the next quarter
   * Q1 → Q2, Q2 → Q3, Q3 → Q4, Q4 → Year+1 Q1
   */
  advanceQuarter() {
    if (this.quarter === 4) {
      return new SimulationClock(this.year + 1, 1);
    } else {
      return new SimulationClock(this.year, this.quarter + 1);
    }
  }
  
  /**
   * Check if this is the last quarter of the year
   */
  isLastQuarter() {
    return this.quarter === 4;
  }
  
  /**
   * Get display string
   */
  toString() {
    return `Year ${this.year} Quarter ${this.quarter}`;
  }
  
  /**
   * Convert to plain object
   */
  toJSON() {
    return {
      year: this.year,
      quarter: this.quarter
    };
  }
  
  /**
   * Create from plain object
   */
  static fromJSON(data) {
    return new SimulationClock(data.year, data.quarter);
  }
}

module.exports = SimulationClock;
