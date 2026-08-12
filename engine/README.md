# ATLAS Simulation Engine

> **Status:** Foundation created (Phase 0 architecture migration)
> **Language:** Node.js / JavaScript
> **Last updated:** 2026-08-10

---

## Overview

The ATLAS simulation engine is a **completely independent** Node.js application that generates the alternate-history world. It has zero runtime connection to the Express backend or React frontend.

## Architecture

```
Engine (standalone)
    ↓
Quarterly Simulation Steps
    ↓
Yearly Snapshots (JSON, written to local disk)
    ↓
Express Backend Ingestion Pipeline (reads local files, uploads to Supabase)
    ↓
Supabase Storage + PostgreSQL
    ↓
Express API (reads only)
    ↓
React Frontend
```

**Note (D-021):** The engine never talks to Supabase directly. It has no
Supabase credentials and no `@supabase/supabase-js` dependency. Snapshot
ingestion (upload + indexing) is a backend-only pipeline — see
`backend/src/services/ingestion.service.js` and
`backend/scripts/ingest-snapshot.js`.

## Key Principles

1. **Decoupled:** Never imported into Express request handlers
2. **Headless:** Runs on a schedule (manual trigger or cron)
3. **Deterministic:** Same input → same output (where possible)
4. **Immutable snapshots:** Once written, never mutated
5. **Independent package:** Own package.json, dependencies, runtime

---

## Directory Structure

```
engine/
├── src/
│   ├── index.js          — Entry point
│   ├── config/           — Configuration
│   ├── world/            — World state
│   ├── simulation/       — Core simulation logic
│   ├── nations/          — Nation entities and logic
│   ├── regions/          — Region entities
│   ├── demographics/     — Population/demographics
│   ├── leaders/          — Leader/character system
│   ├── politics/         — Laws, policies, political systems
│   ├── diplomacy/        — Diplomatic relations and deals
│   ├── wars/             — War mechanics
│   ├── events/           — Historical events
│   └── snapshots/        — Snapshot generation and upload
├── data/
│   ├── world.db          — SQLite simulation database
│   ├── seeds/            — Initial world data
│   └── snapshots/        — Generated snapshot JSON files
├── tests/
├── package.json
├── .env.example
└── README.md
```

---

## Running the Engine

### Installation

```bash
cd engine
npm install
cp .env.example .env
# Edit .env with your configuration
```

### Development

```bash
npm run dev    # Start with nodemon (auto-reload)
npm start      # Production start
npm test       # Run tests
```

---

## Configuration

All configuration is managed via environment variables. See `.env.example` for required variables.

---

## Simulation Flow

**Not yet implemented** — This is a placeholder for Phase 1+

1. Initialize world from seeds or database
2. Load current simulation state
3. Execute quarterly simulation step
4. Update world state
5. At year boundaries: export snapshot
6. Validate snapshot
7. Write snapshot JSON to `data/snapshots/year-YYYY.json`

Steps 8+ (upload to Supabase Storage, index into PostgreSQL) happen
**outside the engine**, in the backend ingestion pipeline (Phase 3, D-021).

---

## Snapshot Contract

Snapshots are the **only** output consumed by the web application.

- **Format:** JSON
- **Schema version:** Tracked in each file
- **Immutability:** Once ingested, never changed
- **Written by engine to:** `engine/data/snapshots/year-{YYYY}.json`
- **Ingested by backend to:** Supabase Storage `snapshots/year-{YYYY}.json` (private bucket, D-018)
- **Contract:** Defined in `src/snapshots/SNAPSHOT_SCHEMA.md` (Phase 1)

---

## Development Status

**Phase 0:** Directory structure created ✓
**Phase 1:** To be implemented (snapshot schema design)
**Phase 2+:** Core simulation mechanics

**Do not implement simulation logic yet.** The current task is architectural migration only.

---

## Important Rules

1. **Never import this into Express** — The engine is not a library
2. **Never run simulation during HTTP requests** — Pre-compute everything
3. **Never expose simulation internals to frontend** — Only snapshots
4. **Version all snapshots** — Schema changes must be backward-compatible or versioned

---

## Future Work

- World initialization
- Quarterly simulation orchestration
- Nation mechanics
- Region mechanics
- Population/demographics
- Leader succession
- Political systems (laws, policies)
- Diplomacy engine
- War engine
- Event system

**Snapshot generation and validation were implemented in Phase 1.**
**The upload/ingestion pipeline lives in the backend, not the engine — see
`backend/src/services/ingestion.service.js` (Phase 3, D-021).**
