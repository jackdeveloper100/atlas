/**
 * PoliticalState.js
 *
 * Political state entity
 *
 * Purpose:
 * - Represents the political system and governance of a nation
 * - Tracks government type, policies, stability
 *
 * Identifier: nationId (one political state per nation)
 *
 * Required properties:
 * - nationId (string) — Nation this state belongs to
 * - governmentType (string) — Type of government (e.g., "Monarchy", "Republic")
 *
 * Optional properties:
 * - stability (number) — 0.0 to 1.0 (0% to 100%)
 * - centralizedPower (number) — 0.0 to 1.0 (decentralized to centralized)
 * - activePolicies (array) — List of active policy IDs
 *
 * Relationships:
 * - Belongs to one Nation (via nationId)
 *
 * Source: ATLAS domain requirements
 * Assumptions:
 * - Political mechanics are placeholders in Phase 1
 * - No policy/law implementation yet (future)
 */

'use strict';

class PoliticalState {
  constructor({
    nationId,
    governmentType = 'Monarchy',
    stability = 0.5,
    centralizedPower = 0.5,
    activePolicies = []
  }) {
    // Validation
    if (!nationId || typeof nationId !== 'string') {
      throw new Error('PoliticalState must have a valid nationId');
    }
    
    this.nationId = nationId;
    this.governmentType = governmentType;
    this.stability = Math.max(0, Math.min(1, stability));
    this.centralizedPower = Math.max(0, Math.min(1, centralizedPower));
    this.activePolicies = [...activePolicies];
    
    Object.freeze(this);
  }
  
  /**
   * Create updated copy with changes
   */
  update(changes) {
    return new PoliticalState({
      nationId: this.nationId,
      governmentType: changes.governmentType !== undefined ? changes.governmentType : this.governmentType,
      stability: changes.stability !== undefined ? changes.stability : this.stability,
      centralizedPower: changes.centralizedPower !== undefined ? changes.centralizedPower : this.centralizedPower,
      activePolicies: changes.activePolicies !== undefined ? changes.activePolicies : this.activePolicies
    });
  }
  
  /**
   * Check if a policy is active
   */
  hasPolicy(policyId) {
    return this.activePolicies.includes(policyId);
  }
  
  /**
   * Convert to plain object for serialization
   */
  toJSON() {
    return {
      nationId: this.nationId,
      governmentType: this.governmentType,
      stability: this.stability,
      centralizedPower: this.centralizedPower,
      activePolicies: this.activePolicies
    };
  }
  
  /**
   * Create from plain object
   */
  static fromJSON(data) {
    return new PoliticalState(data);
  }
}

module.exports = PoliticalState;
