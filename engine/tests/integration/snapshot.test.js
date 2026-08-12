/**
 * snapshot.test.js
 *
 * Tests for snapshot generation and validation
 */

'use strict';

const { initializeWorld } = require('../../src/world/initialize');
const { runYear } = require('../../src/simulation/runYear');
const { worldToSnapshot } = require('../../src/snapshots/exporter');
const { validateSnapshot } = require('../../src/snapshots/validator');

describe('Snapshots', () => {
  test('worldToSnapshot generates valid structure', () => {
    const world = initializeWorld('test-seed');
    const snapshot = worldToSnapshot(world);
    
    expect(snapshot.schema_version).toBe('1.0.0');
    expect(snapshot.simulation).toBeDefined();
    expect(snapshot.world).toBeDefined();
    expect(Array.isArray(snapshot.nations)).toBe(true);
    expect(Array.isArray(snapshot.regions)).toBe(true);
    expect(Array.isArray(snapshot.leaders)).toBe(true);
    expect(Array.isArray(snapshot.politicalStates)).toBe(true);
    expect(Array.isArray(snapshot.events)).toBe(true);
  });
  
  test('snapshot includes correct simulation metadata', () => {
    const world = initializeWorld('test-seed');
    const snapshot = worldToSnapshot(world);
    
    expect(snapshot.simulation.year).toBe(0);
    expect(snapshot.simulation.quarter).toBe(1);
    expect(snapshot.simulation.seed).toBe('test-seed');
    expect(snapshot.simulation.engineVersion).toBeDefined();
    expect(snapshot.simulation.generatedAt).toBeDefined();
  });
  
  test('snapshot world state matches actual world', () => {
    const world = initializeWorld('test-seed');
    const snapshot = worldToSnapshot(world);
    
    expect(snapshot.world.nationCount).toBe(world.nations.length);
    expect(snapshot.world.regionCount).toBe(world.regions.length);
    expect(snapshot.world.leaderCount).toBe(world.leaders.length);
  });
  
  test('validateSnapshot accepts valid snapshot', () => {
    const world = initializeWorld('test-seed');
    const snapshot = worldToSnapshot(world);
    
    const result = validateSnapshot(snapshot);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
  
  test('validateSnapshot rejects missing schema_version', () => {
    const world = initializeWorld('test-seed');
    const snapshot = worldToSnapshot(world);
    delete snapshot.schema_version;
    
    const result = validateSnapshot(snapshot);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('schema_version'))).toBe(true);
  });
  
  test('validateSnapshot rejects invalid schema_version', () => {
    const world = initializeWorld('test-seed');
    const snapshot = worldToSnapshot(world);
    snapshot.schema_version = '99.0.0';
    
    const result = validateSnapshot(snapshot);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('schema_version'))).toBe(true);
  });
  
  test('validateSnapshot rejects missing simulation', () => {
    const world = initializeWorld('test-seed');
    const snapshot = worldToSnapshot(world);
    delete snapshot.simulation;
    
    const result = validateSnapshot(snapshot);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('simulation'))).toBe(true);
  });
  
  test('validateSnapshot rejects invalid nation', () => {
    const world = initializeWorld('test-seed');
    const snapshot = worldToSnapshot(world);
    snapshot.nations[0].population = -100; // Invalid
    
    const result = validateSnapshot(snapshot);
    expect(result.valid).toBe(false);
  });
  
  test('validateSnapshot checks for duplicate IDs', () => {
    const world = initializeWorld('test-seed');
    const snapshot = worldToSnapshot(world);
    snapshot.nations[1].id = snapshot.nations[0].id; // Duplicate
    
    const result = validateSnapshot(snapshot);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('Duplicate'))).toBe(true);
  });
  
  test('validateSnapshot checks region nationId references', () => {
    const world = initializeWorld('test-seed');
    const snapshot = worldToSnapshot(world);
    snapshot.regions[0].nationId = 'invalid-nation-id';
    
    const result = validateSnapshot(snapshot);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('invalid nationId'))).toBe(true);
  });
  
  test('snapshot is deterministic', () => {
    const world1 = initializeWorld('same-seed');
    const world2 = initializeWorld('same-seed');
    
    const snapshot1 = worldToSnapshot(world1);
    const snapshot2 = worldToSnapshot(world2);
    
    // Nations should match
    expect(snapshot1.nations).toEqual(snapshot2.nations);
    
    // Leaders should match
    expect(snapshot1.leaders).toEqual(snapshot2.leaders);
  });
  
  test('snapshot after simulation is valid', () => {
    const world = initializeWorld('test-seed');
    const endWorld = runYear(world);
    const snapshot = worldToSnapshot(endWorld);
    
    const result = validateSnapshot(snapshot);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});
