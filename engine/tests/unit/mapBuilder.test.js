'use strict';

const { buildDailyMapBundle } = require('../../src/batch/mapBuilder');

describe('mapBuilder server-side batch processor', () => {
  const sampleSubregions = [
    {
      id: 'reg-1',
      name: 'Amber Vale',
      nationId: 'ashen-run',
      svgPath: 'M 350,80 L 420,50 L 510,70 L 500,150 L 350,80 Z',
      labelX: 410,
      labelY: 120,
      isCapital: true
    },
    {
      id: 'reg-2',
      name: 'Ashen Hinterland',
      nationId: 'ashen-run',
      svgPath: 'M 180,160 L 240,140 L 280,170 L 180,160 Z',
      labelX: 210,
      labelY: 200
    },
    {
      id: 'reg-3',
      name: 'Vatoria Capital',
      nationId: 'vatoria',
      svgPath: 'M 150,250 L 240,240 L 250,300 L 150,250 Z',
      labelX: 195,
      labelY: 285,
      isCapital: true
    }
  ];

  const sampleNations = [
    { id: 'ashen-run', name: 'Ashen Run', color: '#B85C4E' },
    { id: 'vatoria', name: 'Vatoria', color: '#5F8078' }
  ];

  test('should group subregions by nation and dissolve border paths', () => {
    const bundle = buildDailyMapBundle(sampleSubregions, sampleNations, '2026-08-19');

    expect(bundle).toBeDefined();
    expect(bundle.date).toBe('2026-08-19');
    expect(bundle.nations).toHaveLength(2);

    const ashenNation = bundle.nations.find(n => n.nationId === 'ashen-run');
    expect(ashenNation).toBeDefined();
    expect(ashenNation.name).toBe('Ashen Run');
    expect(ashenNation.color).toBe('#B85C4E');
    expect(ashenNation.borderPath).toContain('M');
    expect(ashenNation.labelPoint).toHaveLength(2);
    expect(ashenNation.subregionIds).toEqual(['reg-1', 'reg-2']);
  });
});
