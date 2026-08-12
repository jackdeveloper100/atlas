# ATLAS — Snapshot Schema v1.0.0

> **Status:** Defined (Phase 1)
> **Version:** 1.0.0
> **Last updated:** 2026-08-10
> **Approved:** Phase 1 implementation

This document defines the formal contract between the simulation engine and the web application (Archive).

---

## Overview

Snapshots are JSON files representing the complete world state at the end of each simulated year. They are:

- **Immutable** — Once written, never modified
- **Versioned** — Schema version tracked for compatibility
- **Self-contained** — All data needed to display the Archive for that year
- **Deterministic** — Same simulation input produces identical snapshots

**File naming:** `year-YYYY.json` (e.g., `year-0000.json`, `year-0001.json`, `year-1950.json`)

**Storage location:** `engine/data/snapshots/` (local), eventually Supabase Storage

---

## Schema Structure

```typescript
{
  // Schema and metadata
  schema_version: string,           // "1.0.0"
  simulation: SimulationMetadata,
  
  // World state
  world: WorldState,
  
  // Entities
  nations: Nation[],
  regions: Region[],
  leaders: Leader[],
  politicalStates: PoliticalState[],
  
  // Historical record
  events: Event[]
}
```

---

## Type Definitions

### SimulationMetadata

```typescript
{
  year: number,                 // Simulation year (0, 1, 2, ...)
  quarter: number,              // Quarter this snapshot represents (always 4 for yearly snapshots)
  seed: string,                 // Deterministic seed used
  engineVersion: string,        // Engine version that generated this (e.g., "0.1.0")
  generatedAt: string           // ISO 8601 timestamp when generated
}
```

### WorldState

```typescript
{
  totalPopulation: number,      // Sum of all nation populations
  nationCount: number,          // Number of nations
  regionCount: number,          // Number of regions
  leaderCount: number,          // Number of leaders (alive and historical)
  eventCount: number            // Number of events recorded this year
}
```

### Nation

```typescript
{
  id: string,                   // Unique identifier (e.g., "kelkelia")
  name: string,                 // Display name (e.g., "Kelkelia")
  population: number,           // Total population
  capitalRegionId: string,      // ID of capital region
  currentLeaderId: string | null, // ID of current leader
  foundedYear: number,          // Year nation was founded
  color: string                 // Hex color for maps (e.g., "#8B4513")
}
```

### Region

```typescript
{
  id: string,                   // Unique identifier (e.g., "kelkelia-capital")
  name: string,                 // Display name (e.g., "Kelkelia Capital")
  nationId: string,             // Parent nation ID
  population: number,           // Regional population
  area: number,                 // Area in arbitrary units
  urbanization: number          // 0.0 to 1.0 (0% to 100% urban)
}
```

### Leader

```typescript
{
  id: string,                   // Unique identifier (e.g., "leader-kelkelia-001")
  name: string,                 // Display name (e.g., "King of Kelkelia the Great")
  nationId: string,             // Nation this leader belongs to
  birthYear: number,            // Year of birth
  deathYear: number | null,     // Year of death (null if alive)
  startedRulingYear: number | null, // Year became leader (null if never ruled)
  endedRulingYear: number | null,   // Year stopped ruling (null if current)
  title: string,                // Official title (e.g., "Monarch", "Emperor")
  legitimacy: number,           // 0.0 to 1.0 (0% to 100%)
  influence: number             // 0.0 to 1.0 (0% to 100%)
}
```

### PoliticalState

```typescript
{
  nationId: string,             // Nation this state belongs to
  governmentType: string,       // Type of government (e.g., "Monarchy", "Republic")
  stability: number,            // 0.0 to 1.0 (0% to 100%)
  centralizedPower: number,     // 0.0 to 1.0 (decentralized to centralized)
  activePolicies: string[]      // Array of active policy IDs (empty in Phase 1)
}
```

### Event

```typescript
{
  id: string,                   // Unique identifier
  type: string,                 // Event type (e.g., "LEADER_SUCCESSION", "WAR_STARTED")
  year: number,                 // Year event occurred
  quarter: number,              // Quarter event occurred (1-4)
  description: string,          // Human-readable description
  nationIds: string[],          // Nations involved
  data: object                  // Additional structured data (type-specific)
}
```

---

## Validation Rules

### Required Fields

All top-level fields are required:
- `schema_version` (string, must be "1.0.0")
- `simulation` (object)
- `world` (object)
- `nations` (array)
- `regions` (array)
- `leaders` (array)
- `politicalStates` (array)
- `events` (array)

### Entity Validation

**Nations:**
- Must have unique `id` values
- `population` must be >= 0
- `color` must be valid hex color
- `currentLeaderId` must reference an existing leader (if not null)

**Regions:**
- Must have unique `id` values
- `nationId` must reference an existing nation
- `population` must be >= 0
- `urbanization` must be 0.0 to 1.0

**Leaders:**
- Must have unique `id` values
- `nationId` must reference an existing nation
- `deathYear` must be >= `birthYear` (if not null)
- `legitimacy` and `influence` must be 0.0 to 1.0

**PoliticalStates:**
- Must have unique `nationId` values
- `nationId` must reference an existing nation
- `stability` and `centralizedPower` must be 0.0 to 1.0

**Events:**
- Must have unique `id` values
- All `nationIds` must reference existing nations
- `quarter` must be 1-4
- `year` must match or be <= simulation year

### Consistency Rules

- Sum of region populations per nation should approximately equal nation population
- Each nation should have exactly one political state
- Current leader (if specified) must have `endedRulingYear` as null
- Events should be chronologically ordered

---

## Size Constraints

**Target:** < 2 MB per yearly snapshot

**Estimated sizes (Phase 1 minimal implementation):**
- 4 nations × ~200 bytes = 0.8 KB
- 8 regions × ~150 bytes = 1.2 KB
- 4 leaders × ~250 bytes = 1 KB
- 4 political states × ~100 bytes = 0.4 KB
- Events (variable, ~10-50 per year) × ~200 bytes = 2-10 KB
- Metadata + world state = 1 KB

**Phase 1 estimated snapshot size:** ~5-15 KB per year

This is **well under** the 2 MB target. Future phases may add:
- More nations/regions
- Economic data
- Diplomatic treaties
- War states
- Technology trees

If snapshots approach 1 MB, compression or delta encoding may be required.

---

## Backward Compatibility

Schema versioning allows the Archive to handle multiple snapshot formats:

```javascript
if (snapshot.schema_version === "1.0.0") {
  // Handle v1.0.0 format
} else if (snapshot.schema_version === "2.0.0") {
  // Handle v2.0.0 format (future)
} else {
  throw new Error(`Unsupported schema version: ${snapshot.schema_version}`);
}
```

Breaking changes require a new schema version. Non-breaking additions (new optional fields) can use the same version.

---

## Example Snapshot

```json
{
  "schema_version": "1.0.0",
  "simulation": {
    "year": 0,
    "quarter": 4,
    "seed": "atlas-dev-001",
    "engineVersion": "0.1.0",
    "generatedAt": "2026-08-10T12:34:56.789Z"
  },
  "world": {
    "totalPopulation": 1650000,
    "nationCount": 4,
    "regionCount": 8,
    "leaderCount": 4,
    "eventCount": 5
  },
  "nations": [
    {
      "id": "kelkelia",
      "name": "Kelkelia",
      "population": 500000,
      "capitalRegionId": "kelkelia-capital",
      "currentLeaderId": "leader-kelkelia-001",
      "foundedYear": -100,
      "color": "#8B4513"
    }
  ],
  "regions": [
    {
      "id": "kelkelia-capital",
      "name": "Kelkelia Capital",
      "nationId": "kelkelia",
      "population": 300000,
      "area": 100,
      "urbanization": 0.7
    }
  ],
  "leaders": [
    {
      "id": "leader-kelkelia-001",
      "name": "King of Kelkelia the Great",
      "nationId": "kelkelia",
      "birthYear": -40,
      "deathYear": null,
      "startedRulingYear": -20,
      "endedRulingYear": null,
      "title": "Monarch",
      "legitimacy": 0.75,
      "influence": 0.68
    }
  ],
  "politicalStates": [
    {
      "nationId": "kelkelia",
      "governmentType": "Monarchy",
      "stability": 0.52,
      "centralizedPower": 0.68,
      "activePolicies": []
    }
  ],
  "events": [
    {
      "id": "event-world-init",
      "type": "WORLD_INITIALIZED",
      "year": 0,
      "quarter": 1,
      "description": "World initialized with seed: atlas-dev-001",
      "nationIds": ["kelkelia", "corondel", "ashen-run", "vantoria"],
      "data": { "seed": "atlas-dev-001", "nationCount": 4 }
    }
  ]
}
```

---

## Archive UI Requirements

The Archive must be able to display from this snapshot:

1. **Year scrubber** — Navigate between years (simulation.year)
2. **Nation list** — Display all nations with populations
3. **Nation detail page** — Show regions, leader, political state
4. **Region list** — Display regions with populations, urbanization
5. **Leader list** — Show current and historical leaders
6. **Events timeline** — Display events chronologically

**What the Archive does NOT need:**
- Quarterly data (only yearly snapshots provided)
- Raw simulation state (physics, formulas, etc.)
- Intermediate calculation results

---

## Approval Status

✅ **APPROVED** for Phase 1 implementation

This schema provides sufficient data for the Archive to function while remaining under size constraints. Future phases may extend the schema with additional fields or entity types.
