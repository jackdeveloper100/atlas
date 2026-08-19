/**
 * exporter.js
 *
 * Snapshot exporter
 *
 * Purpose:
 * - Convert World state to snapshot JSON
 * - Apply schema version
 * - Write to local filesystem
 * - Validate before writing
 *
 * Output: year-YYYY.json files in data/snapshots/
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { validateSnapshot } = require('./validator');

const { buildDailyMapBundle } = require('../batch/mapBuilder');

/**
 * Export world state as snapshot JSON
 * @param {World} world - World state to export
 * @param {string} outputDir - Output directory (default: data/snapshots)
 * @returns {object} { success: boolean, filePath: string, mapPath: string | null, error: string | null, size: number }
 */
function exportSnapshot(world, outputDir = null) {
  try {
    // Use config output dir if not specified
    if (!outputDir) {
      const config = require('../config');
      outputDir = config.SNAPSHOT_OUTPUT_DIR;
    }
    
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Generate snapshot object
    const snapshot = worldToSnapshot(world);
    
    // Validate snapshot
    const validation = validateSnapshot(snapshot);
    if (!validation.valid) {
      return {
        success: false,
        filePath: null,
        mapPath: null,
        error: `Validation failed: ${validation.errors.join(', ')}`,
        size: 0
      };
    }
    
    // Generate filename
    const year = world.getYear();
    const filename = `year-${String(year).padStart(4, '0')}.json`;
    const filePath = path.join(outputDir, filename);
    
    // Convert to JSON string (pretty-printed for readability)
    const json = JSON.stringify(snapshot, null, 2);
    
    // Write to file
    fs.writeFileSync(filePath, json, 'utf8');
    
    // Generate Daily Map Bundle (nations.json) under data/snapshots/map/YYYY-MM-DD/
    const dateStr = `2026-08-${String(year).padStart(2, '0')}`;
    const mapDir = path.join(outputDir, 'map', dateStr);
    if (!fs.existsSync(mapDir)) {
      fs.mkdirSync(mapDir, { recursive: true });
    }

    const mapBundle = buildDailyMapBundle(
      snapshot.regions || [],
      snapshot.nations || [],
      dateStr
    );
    const mapFilePath = path.join(mapDir, 'nations.json');
    fs.writeFileSync(mapFilePath, JSON.stringify(mapBundle, null, 2), 'utf8');

    // Get file size
    const stats = fs.statSync(filePath);
    
    return {
      success: true,
      filePath,
      mapPath: mapFilePath,
      error: null,
      size: stats.size
    };
  } catch (error) {
    return {
      success: false,
      filePath: null,
      mapPath: null,
      error: error.message,
      size: 0
    };
  }
}

/**
 * Convert World object to snapshot JSON structure
 * @param {World} world - World state
 * @returns {object} Snapshot object matching schema v1.0.0
 */
function worldToSnapshot(world) {
  // Calculate world aggregates
  const totalPopulation = world.nations.reduce((sum, n) => sum + n.population, 0);
  
  return {
    schema_version: '1.0.0',
    
    simulation: {
      year: world.getYear(),
      quarter: world.getQuarter(),
      seed: world.metadata.seed,
      engineVersion: world.metadata.engineVersion,
      generatedAt: world.metadata.generatedAt
    },
    
    world: {
      totalPopulation,
      nationCount: world.nations.length,
      regionCount: world.regions.length,
      leaderCount: world.leaders.length,
      eventCount: world.events.filter(e => e.year === world.getYear()).length
    },
    
    nations: world.nations.map(n => n.toJSON()),
    regions: world.regions.map(r => r.toJSON()),
    leaders: world.leaders.map(l => l.toJSON()),
    politicalStates: world.politicalStates.map(p => p.toJSON()),
    events: world.events.map(e => e.toJSON())
  };
}

/**
 * Export multiple snapshots from an array of world states
 * @param {World[]} worlds - Array of world states (one per year)
 * @param {string} outputDir - Output directory
 * @returns {object} { totalExported: number, failed: number, totalSize: number }
 */
function exportSnapshots(worlds, outputDir = null) {
  let totalExported = 0;
  let failed = 0;
  let totalSize = 0;
  
  for (const world of worlds) {
    const result = exportSnapshot(world, outputDir);
    if (result.success) {
      totalExported++;
      totalSize += result.size;
    } else {
      failed++;
      console.error(`Failed to export Year ${world.getYear()}: ${result.error}`);
    }
  }
  
  return {
    totalExported,
    failed,
    totalSize
  };
}

module.exports = {
  exportSnapshot,
  exportSnapshots,
  worldToSnapshot
};
