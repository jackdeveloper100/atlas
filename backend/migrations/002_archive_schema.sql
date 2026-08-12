-- Migration 002: Archive Schema
-- Phase 3 — Snapshot pipeline database tables
-- Apply this migration in Supabase SQL Editor AFTER migration 001

-- ============================================================================
-- 1. archive_years table
--    One row per simulated year that has been ingested/published.
--    The authoritative list of what years are available in the Archive.
-- ============================================================================

CREATE TABLE archive_years (
  year                INTEGER PRIMARY KEY
                        CHECK (year >= 0 AND year <= 9999),
  snapshot_key        TEXT    NOT NULL UNIQUE,     -- Storage path: "snapshots/year-0000.json"
  schema_version      TEXT    NOT NULL,            -- e.g. "1.0.0"
  snapshot_size_bytes BIGINT  NOT NULL CHECK (snapshot_size_bytes > 0),
  checksum_sha256     TEXT    NOT NULL
                        CHECK (LENGTH(checksum_sha256) = 64),  -- SHA-256 hex = 64 chars
  is_published        BOOLEAN NOT NULL DEFAULT FALSE,
  published_at        TIMESTAMPTZ NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for efficient published year queries (Archive year picker)
CREATE INDEX idx_archive_years_published
  ON archive_years(is_published, year ASC)
  WHERE is_published = TRUE;

-- No RLS: backend service-role writes; public read acceptable for year list
-- (subscription check happens in Express, not PostgreSQL)
COMMENT ON TABLE archive_years IS 'Index of ingested/published simulation years. Snapshot JSON blobs live in Supabase Storage.';
COMMENT ON COLUMN archive_years.snapshot_key IS 'Supabase Storage path: snapshots/year-YYYY.json';
COMMENT ON COLUMN archive_years.checksum_sha256 IS 'SHA-256 hex of the raw JSON file — used for immutability/idempotency checks';

-- ============================================================================
-- 2. nations_index table
--    Searchable nation metadata per year, extracted from snapshot JSON.
--    Used for Archive navigation and search — NOT the full simulation state.
-- ============================================================================

CREATE TABLE nations_index (
  id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  year        INTEGER NOT NULL REFERENCES archive_years(year) ON DELETE CASCADE,
  nation_id   TEXT    NOT NULL,      -- matches engine's nation ID (e.g. "kelkelia")
  name        TEXT    NOT NULL,
  population  BIGINT  NOT NULL CHECK (population >= 0),
  is_active   BOOLEAN NOT NULL DEFAULT TRUE
);

-- Prevent duplicate nation record for same year
CREATE UNIQUE INDEX idx_nations_index_year_nation
  ON nations_index(year, nation_id);

-- Performance indexes
CREATE INDEX idx_nations_index_year
  ON nations_index(year);

CREATE INDEX idx_nations_index_nation_id
  ON nations_index(nation_id);

-- Full-text search index on nation name (for future search feature)
CREATE INDEX idx_nations_index_name_fts
  ON nations_index USING GIN (to_tsvector('english', name));

COMMENT ON TABLE nations_index IS 'Searchable nation metadata per year. Complete stats live in snapshot JSON.';

-- ============================================================================
-- 3. historical_events table
--    Searchable event metadata per year, extracted from snapshot JSON.
--    Used for event feed and search — NOT duplicates of the full snapshot.
-- ============================================================================

CREATE TABLE historical_events (
  id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  year        INTEGER NOT NULL REFERENCES archive_years(year) ON DELETE CASCADE,
  event_id    TEXT    NOT NULL,      -- original event ID from snapshot
  event_type  TEXT    NOT NULL,      -- e.g. "LEADER_SUCCESSION", "WORLD_INITIALIZED"
  nation_id   TEXT    NULL,          -- primary nation involved (nullable for world events)
  description TEXT    NOT NULL,
  quarter     INTEGER NOT NULL CHECK (quarter >= 1 AND quarter <= 4),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Prevent duplicate event for same year
CREATE UNIQUE INDEX idx_historical_events_year_event
  ON historical_events(year, event_id);

-- Performance indexes
CREATE INDEX idx_historical_events_year
  ON historical_events(year);

CREATE INDEX idx_historical_events_event_type
  ON historical_events(event_type);

CREATE INDEX idx_historical_events_nation_id
  ON historical_events(nation_id)
  WHERE nation_id IS NOT NULL;

COMMENT ON TABLE historical_events IS 'Searchable event index per year. Full event data (nationIds array, data object) lives in snapshot JSON.';

-- ============================================================================
-- Migration Complete
-- ============================================================================

COMMENT ON TABLE archive_years IS 'Phase 3: Archive year index. Applied 2026-08-10.';
