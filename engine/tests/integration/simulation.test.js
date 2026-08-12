/**
 * simulation.test.js
 *
 * Integration tests for simulation execution
 */

'use strict';

const { initializeWorld } = require('../../src/world/initialize');
const { stepQuarter } = require('../../src/simulation/stepQuarter');
const { runYear } = require('../../src/simulation/runYear');

describe('Simulation', () => {
  test('stepQuarter advances time by one quarter', () => {
    const world = initializeWorld('test-seed');
    const nextWorld = stepQuarter(world);
    
    expect(world.getYear()).toBe(0);
    expect(world.getQuarter()).toBe(1);
    expect(nextWorld.getYear()).toBe(0);
    expect(nextWorld.getQuarter()).toBe(2);
  });
  
  test('stepQuarter transitions year at Q4', () => {
    const world = initializeWorld('test-seed');
    
    // Advance to Q4
    let currentWorld = world;
    for (let i = 0; i < 3; i++) {
      currentWorld = stepQuarter(currentWorld);
    }
    expect(currentWorld.getQuarter()).toBe(4);
    
    // Next step should be Year 1 Q1
    const nextWorld = stepQuarter(currentWorld);
    expect(nextWorld.getYear()).toBe(1);
    expect(nextWorld.getQuarter()).toBe(1);
  });
  
  test('runYear executes exactly 4 quarters', () => {
    const world = initializeWorld('test-seed');
    const endWorld = runYear(world);
    
    // Should be at Year 1 Q1 (after completing Year 0 Q1-Q4)
    expect(endWorld.getYear()).toBe(1);
    expect(endWorld.getQuarter()).toBe(1);
  });
  
  test('population grows over time', () => {
    const world = initializeWorld('test-seed');
    const startPop = world.nations.reduce((sum, n) => sum + n.population, 0);
    
    const endWorld = runYear(world);
    const endPop = endWorld.nations.reduce((sum, n) => sum + n.population, 0);
    
    expect(endPop).toBeGreaterThan(startPop);
  });
  
  test('simulation is deterministic with same seed', () => {
    const world1 = initializeWorld('same-seed');
    const world2 = initializeWorld('same-seed');
    
    const end1 = runYear(world1);
    const end2 = runYear(world2);
    
    // Populations should match
    for (let i = 0; i < end1.nations.length; i++) {
      expect(end1.nations[i].population).toBe(end2.nations[i].population);
    }
    
    // Event counts should match
    expect(end1.events.length).toBe(end2.events.length);
  });
  
  test('simulation is different with different seeds', () => {
    const world1 = initializeWorld('seed-1');
    const world2 = initializeWorld('seed-2');
    
    const end1 = runYear(world1);
    const end2 = runYear(world2);
    
    // Populations should differ
    let different = false;
    for (let i = 0; i < end1.nations.length; i++) {
      if (end1.nations[i].population !== end2.nations[i].population) {
        different = true;
        break;
      }
    }
    
    expect(different).toBe(true);
  });
  
  test('events are recorded', () => {
    const world = initializeWorld('test-seed');
    const endWorld = runYear(world);
    
    // Should have at least the initialization event
    expect(endWorld.events.length).toBeGreaterThanOrEqual(1);
  });
  
  test('world state remains immutable', () => {
    const world = initializeWorld('test-seed');
    const nextWorld = stepQuarter(world);
    
    // Original world should be unchanged
    expect(world.getQuarter()).toBe(1);
    expect(nextWorld.getQuarter()).toBe(2);
  });
});
