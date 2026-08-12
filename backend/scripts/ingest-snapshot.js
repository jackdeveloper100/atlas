#!/usr/bin/env node
'use strict';

/**
 * scripts/ingest-snapshot.js
 *
 * CLI for ingesting engine snapshot JSON files into the Archive pipeline
 * (Supabase Storage + archive_years / nations_index / historical_events).
 *
 * Usage:
 *   node scripts/ingest-snapshot.js --dir ../engine/data/snapshots
 *   node scripts/ingest-snapshot.js --file ../engine/data/snapshots/year-0000.json
 *   node scripts/ingest-snapshot.js --dir ../engine/data/snapshots --verbose
 *
 * Loads backend/.env for Supabase credentials (never printed to stdout).
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const path = require('path');
const { ingestSnapshot, ingestDirectory } = require('../src/services/ingestion.service');

function parseArgs(argv) {
  const args = { dir: null, file: null, verbose: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--dir') {
      args.dir = argv[++i];
    } else if (arg === '--file') {
      args.file = argv[++i];
    } else if (arg === '--verbose' || arg === '-v') {
      args.verbose = true;
    } else if (arg === '--help' || arg === '-h') {
      args.help = true;
    }
  }
  return args;
}

function printUsage() {
  console.log(`
ATLAS Snapshot Ingestion CLI

Usage:
  node scripts/ingest-snapshot.js --dir <path>    Ingest all year-YYYY.json files in a directory
  node scripts/ingest-snapshot.js --file <path>   Ingest a single snapshot file
  node scripts/ingest-snapshot.js --dir <path> --verbose

Options:
  --dir <path>     Directory containing year-YYYY.json snapshot files
  --file <path>    Path to a single snapshot JSON file
  --verbose, -v    Print detailed progress
  --help, -h       Show this help message
`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help || (!args.dir && !args.file)) {
    printUsage();
    process.exit(args.help ? 0 : 1);
  }

  if (args.dir && args.file) {
    console.error('Error: specify either --dir or --file, not both.');
    process.exit(1);
  }

  if (args.file) {
    const filePath = path.resolve(args.file);
    console.log(`Ingesting single file: ${filePath}`);
    const result = await ingestSnapshot(filePath, { verbose: true });

    console.log(`\nStatus: ${result.status}`);
    console.log(`Message: ${result.message}`);
    if (result.errors.length > 0) {
      console.log('Errors:');
      result.errors.forEach(e => console.log(`  - ${e}`));
    }

    process.exit(result.success ? 0 : 1);
  }

  const dirPath = path.resolve(args.dir);
  console.log(`Ingesting all snapshots in: ${dirPath}\n`);

  const batch = await ingestDirectory(dirPath, { verbose: true });

  console.log('\n── Ingestion Summary ──────────────────────────────');
  console.log(`Total files:      ${batch.total}`);
  console.log(`Published:        ${batch.published}`);
  console.log(`Already ingested: ${batch.alreadyIngested}`);
  console.log(`Conflicts:        ${batch.conflicts}`);
  console.log(`Failed:           ${batch.failed}`);
  console.log('─────────────────────────────────────────────────');

  if (batch.conflicts > 0 || batch.failed > 0) {
    console.log('\nFailures/conflicts:');
    batch.results
      .filter(r => r.status === 'conflict' || r.status === 'error' || r.status === 'validation_failed')
      .forEach(r => {
        console.log(`  Year ${r.year ?? '?'}: ${r.message}`);
        r.errors.forEach(e => console.log(`    - ${e}`));
      });
  }

  process.exit(batch.conflicts > 0 || batch.failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Fatal error during ingestion:', err.message);
  process.exit(1);
});
