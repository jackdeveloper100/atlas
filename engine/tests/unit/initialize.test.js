/**
 * initialize.test.js
 *
 * Tests for world initialization
 */

'use strict';

const { initializeWorld } = require('../../src/world/initialize');

describe('initializeWorld', () => {
  test('creates world at Year 0 Quarter 1', () => {
    const world = initializeWorld('test-seed');
    expect(world.getYear()).toBe(0);
    expect(world.getQuarter()).toBe(1);
  });
  
  test('creates 4 confirmed nations', () => {
    const world = initializeWorld('test-seed');
    expect(world.nations).toHaveLength(4);
    
    const nationIds = world.nations.map(n => n.id);
    expect(nationIds).toContain('kelkelia');
    expect(nationIds).toContain('corondel');
    expect(nationIds).toContain('ashen-run');
    expect(nationIds).toContain('vantoria');
  });
  
  test('creates regions for each nation', () => {
    const world = initializeWorld('test-seed');
    expect(world.regions).toHaveLength(8); // 2 per nation
    
    // Each nation should have 2 regions
    for (const nation of world.nations) {
      const nationRegions = world.getRegionsByNation(nation.id);
      expect(nationRegions).toHaveLength(2);
    }
  });
  
  test('creates one leader per nation', () => {
    const world = initializeWorld('test-seed');
    expect(world.leaders).toHaveLength(4);
    
    // Each nation should have a current leader
    for (const nation of world.nations) {
      expect(nation.currentLeaderId).toBeTruthy();
      const leader = world.getLeader(nation.currentLeaderId);
      expect(leader).toBeTruthy();
      expect(leader.nationId).toBe(nation.id);
    }
  });
  
  test('creates one political state per nation', () => {
    const world = initializeWorld('test-seed');
    expect(world.politicalStates).toHaveLength(4);
    
    const stateNationIds = world.politicalStates.map(s => s.nationId);
    for (const nation of world.nations) {
      expect(stateNationIds).toContain(nation.id);
    }
  });
  
  test('creates initialization event', () => {
    const world = initializeWorld('test-seed');
    expect(world.events).toHaveLength(1);
    expect(world.events[0].type).toBe('WORLD_INITIALIZED');
  });
  
  test('same seed produces same world', () => {
    const world1 = initializeWorld('same-seed');
    const world2 = initializeWorld('same-seed');
    
    // Nations should be identical
    expect(world1.nations).toHaveLength(world2.nations.length);
    for (let i = 0; i < world1.nations.length; i++) {
      expect(world1.nations[i].id).toBe(world2.nations[i].id);
      expect(world1.nations[i].population).toBe(world2.nations[i].population);
    }
    
    // Leaders should be identical
    for (let i = 0; i < world1.leaders.length; i++) {
      expect(world1.leaders[i].name).toBe(world2.leaders[i].name);
    }
  });
  
  test('different seed produces different leader names', () => {
    const world1 = initializeWorld('seed-1');
    const world2 = initializeWorld('seed-2');
    
    // Leader names should differ (due to random generation)
    let different = false;
    for (let i = 0; i < world1.leaders.length; i++) {
      if (world1.leaders[i].name !== world2.leaders[i].name) {
        different = true;
        break;
      }
    }
    
    expect(different).toBe(true);
  });
  
  test('world metadata includes seed', () => {
    const world = initializeWorld('my-seed');
    expect(world.metadata.seed).toBe('my-seed');
  });
  
  test('world is immutable', () => {
    const world = initializeWorld('test-seed');
    expect(() => { world.nations = []; }).toThrow();
  });
});
