/**
 * SimulationClock.test.js
 *
 * Tests for simulation clock
 */

'use strict';

const SimulationClock = require('../../src/simulation/SimulationClock');

describe('SimulationClock', () => {
  test('creates clock with default values', () => {
    const clock = new SimulationClock();
    expect(clock.year).toBe(0);
    expect(clock.quarter).toBe(1);
  });
  
  test('creates clock with custom values', () => {
    const clock = new SimulationClock(5, 3);
    expect(clock.year).toBe(5);
    expect(clock.quarter).toBe(3);
  });
  
  test('throws error for invalid quarter', () => {
    expect(() => new SimulationClock(0, 0)).toThrow('Invalid quarter');
    expect(() => new SimulationClock(0, 5)).toThrow('Invalid quarter');
  });
  
  test('advances Q1 to Q2', () => {
    const clock = new SimulationClock(0, 1);
    const next = clock.advanceQuarter();
    expect(next.year).toBe(0);
    expect(next.quarter).toBe(2);
  });
  
  test('advances Q2 to Q3', () => {
    const clock = new SimulationClock(0, 2);
    const next = clock.advanceQuarter();
    expect(next.year).toBe(0);
    expect(next.quarter).toBe(3);
  });
  
  test('advances Q3 to Q4', () => {
    const clock = new SimulationClock(0, 3);
    const next = clock.advanceQuarter();
    expect(next.year).toBe(0);
    expect(next.quarter).toBe(4);
  });
  
  test('advances Q4 to next year Q1', () => {
    const clock = new SimulationClock(0, 4);
    const next = clock.advanceQuarter();
    expect(next.year).toBe(1);
    expect(next.quarter).toBe(1);
  });
  
  test('identifies last quarter', () => {
    expect(new SimulationClock(0, 1).isLastQuarter()).toBe(false);
    expect(new SimulationClock(0, 2).isLastQuarter()).toBe(false);
    expect(new SimulationClock(0, 3).isLastQuarter()).toBe(false);
    expect(new SimulationClock(0, 4).isLastQuarter()).toBe(true);
  });
  
  test('converts to string', () => {
    const clock = new SimulationClock(5, 3);
    expect(clock.toString()).toBe('Year 5 Quarter 3');
  });
  
  test('converts to JSON', () => {
    const clock = new SimulationClock(5, 3);
    const json = clock.toJSON();
    expect(json).toEqual({ year: 5, quarter: 3 });
  });
  
  test('creates from JSON', () => {
    const clock = SimulationClock.fromJSON({ year: 5, quarter: 3 });
    expect(clock.year).toBe(5);
    expect(clock.quarter).toBe(3);
  });
  
  test('is immutable', () => {
    const clock = new SimulationClock(0, 1);
    expect(() => { clock.year = 5; }).toThrow();
    expect(() => { clock.quarter = 3; }).toThrow();
  });
});
