/**
 * DeterministicRandom.test.js
 *
 * Tests for deterministic random number generator
 */

'use strict';

const DeterministicRandom = require('../../src/simulation/DeterministicRandom');

describe('DeterministicRandom', () => {
  test('same seed produces same sequence', () => {
    const rng1 = new DeterministicRandom('test-seed');
    const rng2 = new DeterministicRandom('test-seed');
    
    for (let i = 0; i < 100; i++) {
      expect(rng1.next()).toBe(rng2.next());
    }
  });
  
  test('different seeds produce different sequences', () => {
    const rng1 = new DeterministicRandom('seed-1');
    const rng2 = new DeterministicRandom('seed-2');
    
    let different = false;
    for (let i = 0; i < 10; i++) {
      if (rng1.next() !== rng2.next()) {
        different = true;
        break;
      }
    }
    
    expect(different).toBe(true);
  });
  
  test('next() returns values in range [0, 1)', () => {
    const rng = new DeterministicRandom('test');
    
    for (let i = 0; i < 100; i++) {
      const value = rng.next();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
  
  test('nextInt() returns integers in correct range', () => {
    const rng = new DeterministicRandom('test');
    
    for (let i = 0; i < 100; i++) {
      const value = rng.nextInt(1, 6); // Dice roll
      expect(value).toBeGreaterThanOrEqual(1);
      expect(value).toBeLessThanOrEqual(6);
      expect(Number.isInteger(value)).toBe(true);
    }
  });
  
  test('nextFloat() returns floats in correct range', () => {
    const rng = new DeterministicRandom('test');
    
    for (let i = 0; i < 100; i++) {
      const value = rng.nextFloat(10, 20);
      expect(value).toBeGreaterThanOrEqual(10);
      expect(value).toBeLessThan(20);
    }
  });
  
  test('nextBool() returns booleans', () => {
    const rng = new DeterministicRandom('test');
    
    let trueCount = 0;
    let falseCount = 0;
    
    for (let i = 0; i < 100; i++) {
      const value = rng.nextBool();
      expect(typeof value).toBe('boolean');
      if (value) trueCount++;
      else falseCount++;
    }
    
    // Should have some of both (not perfectly 50/50, but close)
    expect(trueCount).toBeGreaterThan(20);
    expect(falseCount).toBeGreaterThan(20);
  });
  
  test('nextChance() respects probability', () => {
    const rng = new DeterministicRandom('test');
    
    // 90% chance should return true most of the time
    let trueCount = 0;
    for (let i = 0; i < 100; i++) {
      if (rng.nextChance(0.9)) trueCount++;
    }
    
    expect(trueCount).toBeGreaterThan(70); // Should be around 90
  });
  
  test('choice() picks from array', () => {
    const rng = new DeterministicRandom('test');
    const array = ['a', 'b', 'c', 'd', 'e'];
    
    for (let i = 0; i < 20; i++) {
      const value = rng.choice(array);
      expect(array).toContain(value);
    }
  });
  
  test('choice() throws on empty array', () => {
    const rng = new DeterministicRandom('test');
    expect(() => rng.choice([])).toThrow('Cannot pick from empty array');
  });
  
  test('shuffle() returns all elements', () => {
    const rng = new DeterministicRandom('test');
    const array = [1, 2, 3, 4, 5];
    const shuffled = rng.shuffle(array);
    
    expect(shuffled).toHaveLength(5);
    expect(shuffled).toContain(1);
    expect(shuffled).toContain(2);
    expect(shuffled).toContain(3);
    expect(shuffled).toContain(4);
    expect(shuffled).toContain(5);
  });
  
  test('shuffle() is deterministic', () => {
    const rng1 = new DeterministicRandom('test');
    const rng2 = new DeterministicRandom('test');
    const array = [1, 2, 3, 4, 5];
    
    const shuffled1 = rng1.shuffle(array);
    const shuffled2 = rng2.shuffle(array);
    
    expect(shuffled1).toEqual(shuffled2);
  });
  
  test('reset() restarts sequence', () => {
    const rng = new DeterministicRandom('test');
    const first = rng.next();
    rng.next();
    rng.next();
    
    rng.reset();
    const afterReset = rng.next();
    
    expect(afterReset).toBe(first);
  });
});
