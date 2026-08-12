/**
 * runYear.js
 *
 * Yearly simulation resolution
 *
 * Purpose:
 * - Execute exactly 4 quarterly steps to complete one year
 * - Return world state at end of year (Q4)
 *
 * Usage:
 *   const endOfYearWorld = runYear(startOfYearWorld);
 */

'use strict';

const { stepQuarter } = require('./stepQuarter');

/**
 * Run one full year (4 quarters) of simulation
 * @param {World} world - World state at start of year (should be Q1)
 * @returns {World} World state at end of year (will be Q4 → next year Q1)
 */
function runYear(world) {
  let currentWorld = world;
  
  // Execute 4 quarterly steps
  for (let i = 0; i < 4; i++) {
    currentWorld = stepQuarter(currentWorld);
  }
  
  return currentWorld;
}

/**
 * Run multiple years of simulation
 * @param {World} world - Starting world state
 * @param {number} years - Number of years to simulate
 * @returns {Array<World>} Array of end-of-year world states
 */
function runYears(world, years) {
  let currentWorld = world;
  const yearlyStates = [];
  
  for (let i = 0; i < years; i++) {
    currentWorld = runYear(currentWorld);
    yearlyStates.push(currentWorld);
  }
  
  return yearlyStates;
}

module.exports = {
  runYear,
  runYears
};
