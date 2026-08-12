/**
 * DeterministicRandom.js
 *
 * Seeded random number generator for deterministic simulation
 *
 * Purpose:
 * - Provide seeded randomness so simulations are reproducible
 * - Same seed + same operations = same results
 * - Replaces uncontrolled Math.random() usage
 *
 * Algorithm: Mulberry32 (simple, fast, good distribution)
 * Source: https://stackoverflow.com/questions/521295
 *
 * Usage:
 *   const rng = new DeterministicRandom('my-seed-123');
 *   const roll = rng.next(); // 0 <= roll < 1
 *   const d6 = rng.nextInt(1, 6); // 1-6 inclusive
 */

'use strict';

class DeterministicRandom {
  constructor(seed) {
    // Convert string seed to number
    this.seed = this._hashString(seed);
    this.state = this.seed;
  }
  
  /**
   * Hash a string to a number (for seed initialization)
   */
  _hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
  
  /**
   * Generate next random float in range [0, 1)
   * Mulberry32 algorithm
   */
  next() {
    let t = this.state += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
  
  /**
   * Generate random integer in range [min, max] (inclusive)
   */
  nextInt(min, max) {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
  
  /**
   * Generate random float in range [min, max)
   */
  nextFloat(min, max) {
    return this.next() * (max - min) + min;
  }
  
  /**
   * Random boolean (50/50 chance)
   */
  nextBool() {
    return this.next() < 0.5;
  }
  
  /**
   * Random boolean with custom probability
   * @param {number} probability - Chance of true (0.0 to 1.0)
   */
  nextChance(probability) {
    return this.next() < probability;
  }
  
  /**
   * Pick random element from array
   */
  choice(array) {
    if (array.length === 0) {
      throw new Error('Cannot pick from empty array');
    }
    return array[this.nextInt(0, array.length - 1)];
  }
  
  /**
   * Shuffle array (Fisher-Yates)
   */
  shuffle(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
  
  /**
   * Reset to initial seed
   */
  reset() {
    this.state = this.seed;
  }
}

module.exports = DeterministicRandom;
