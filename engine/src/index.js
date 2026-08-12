/**
 * index.js
 *
 * ATLAS Simulation Engine — Entry Point
 *
 * This is a standalone Node.js application that generates the simulated world.
 * It has zero runtime connection to the Express backend.
 *
 * Usage:
 *   npm start                           # Run default simulation (Year 0 → Year 1)
 *   npm run simulate                    # Same as npm start
 *   node src/index.js --years=10        # Run 10 years
 *   node src/index.js --seed=custom-123 # Use custom seed
 */

'use strict';

require('dotenv').config();

const config = require('./config');
const { initializeWorld } = require('./world/initialize');
const { runYear, runYears } = require('./simulation/runYear');
const { exportSnapshot, exportSnapshots } = require('./snapshots/exporter');

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    years: 1,
    seed: 'atlas-dev-001',
    export: true
  };
  
  for (const arg of args) {
    if (arg.startsWith('--years=')) {
      options.years = parseInt(arg.split('=')[1], 10);
    } else if (arg.startsWith('--seed=')) {
      options.seed = arg.split('=')[1];
    } else if (arg === '--no-export') {
      options.export = false;
    }
  }
  
  return options;
}

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Main simulation execution
 */
function main() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║   ATLAS Simulation Engine — Phase 1   ║');
  console.log('╚════════════════════════════════════════╝');
  console.log('');
  
  const options = parseArgs();
  
  console.log('Configuration:');
  console.log(`  Seed:          ${options.seed}`);
  console.log(`  Years:         ${options.years}`);
  console.log(`  Engine:        v${config.NODE_ENV === 'development' ? '0.1.0-dev' : '0.1.0'}`);
  console.log(`  Snapshot dir:  ${config.SNAPSHOT_OUTPUT_DIR}`);
  console.log(`  Export:        ${options.export ? 'enabled' : 'disabled'}`);
  console.log('');
  
  // Initialize world
  console.log('Initializing world...');
  const startTime = Date.now();
  let world = initializeWorld(options.seed);
  console.log(`✓ World initialized at ${world.simulationTime.toString()}`);
  console.log(`  Nations: ${world.nations.length}`);
  console.log(`  Regions: ${world.regions.length}`);
  console.log(`  Leaders: ${world.leaders.length}`);
  console.log(`  Population: ${world.nations.reduce((sum, n) => sum + n.population, 0).toLocaleString()}`);
  console.log('');
  
  // Export initial state (Year 0)
  const yearlyStates = [];
  if (options.export) {
    console.log('Exporting initial state (Year 0)...');
    const result = exportSnapshot(world);
    if (result.success) {
      console.log(`✓ Exported: ${result.filePath} (${formatBytes(result.size)})`);
      yearlyStates.push({ year: 0, size: result.size });
    } else {
      console.error(`✗ Failed: ${result.error}`);
    }
    console.log('');
  }
  
  // Run simulation
  if (options.years > 0) {
    console.log(`Running simulation: ${options.years} year(s)...`);
    console.log('');
    
    for (let i = 0; i < options.years; i++) {
      const yearStart = Date.now();
      world = runYear(world);
      const yearEnd = Date.now();
      const yearTime = yearEnd - yearStart;
      
      const currentYear = world.getYear();
      const population = world.nations.reduce((sum, n) => sum + n.population, 0);
      const eventCount = world.events.filter(e => e.year === currentYear).length;
      
      console.log(`  Year ${currentYear}: ${population.toLocaleString()} population, ${eventCount} events (${yearTime}ms)`);
      
      // Export yearly snapshot
      if (options.export) {
        const result = exportSnapshot(world);
        if (result.success) {
          yearlyStates.push({ year: currentYear, size: result.size });
        }
      }
    }
    
    console.log('');
  }
  
  const endTime = Date.now();
  const totalTime = endTime - startTime;
  
  // Summary
  console.log('═══════════════════════════════════════');
  console.log('Simulation Complete');
  console.log('═══════════════════════════════════════');
  console.log(`Total time:        ${totalTime}ms`);
  console.log(`Final year:        ${world.getYear()}`);
  console.log(`Final population:  ${world.nations.reduce((sum, n) => sum + n.population, 0).toLocaleString()}`);
  console.log(`Total events:      ${world.events.length}`);
  console.log('');
  
  if (options.export && yearlyStates.length > 0) {
    const totalSize = yearlyStates.reduce((sum, s) => sum + s.size, 0);
    const avgSize = totalSize / yearlyStates.length;
    const minSize = Math.min(...yearlyStates.map(s => s.size));
    const maxSize = Math.max(...yearlyStates.map(s => s.size));
    
    console.log('Snapshot Statistics:');
    console.log(`  Snapshots exported: ${yearlyStates.length}`);
    console.log(`  Total size:         ${formatBytes(totalSize)}`);
    console.log(`  Average size:       ${formatBytes(avgSize)}`);
    console.log(`  Min size:           ${formatBytes(minSize)}`);
    console.log(`  Max size:           ${formatBytes(maxSize)}`);
    console.log('');
    
    // Projection for full 1951-year simulation
    const projectedTotal1951 = avgSize * 1951;
    console.log(`Projection for 1951 years:`);
    console.log(`  Estimated total:    ${formatBytes(projectedTotal1951)}`);
    console.log(`  Target:             < 2 GB`);
    console.log(`  Status:             ${projectedTotal1951 < 2 * 1024 * 1024 * 1024 ? '✓ Within target' : '✗ Exceeds target'}`);
    console.log('');
  }
  
  console.log('Done.');
}

// Run main if executed directly
if (require.main === module) {
  main();
}

module.exports = {
  initializeWorld,
  runYear,
  runYears,
  exportSnapshot,
  exportSnapshots
};
