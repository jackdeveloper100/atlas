-- Migration 003: Library Schema
-- Phase 4 — Subscriber-only audio library
-- Apply this migration in Supabase SQL Editor AFTER migrations 001 and 002

-- ============================================================================
-- 1. library_items table
--    Metadata for Library media. Audio only in Phase 4; item_type allows
--    'video' for forward compatibility but no video logic is implemented.
-- ============================================================================

CREATE TABLE library_items (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title             TEXT NOT NULL,
  description       TEXT,
  item_type         TEXT NOT NULL CHECK (item_type IN ('audio', 'video')),
  storage_path      TEXT NOT NULL UNIQUE,   -- Storage path within the "library" bucket, e.g. "library/{uuid}.mp3"
  duration_seconds  INTEGER CHECK (duration_seconds IS NULL OR duration_seconds >= 0),
  metadata          JSONB NOT NULL DEFAULT '{}'::jsonb,  -- extensible: related_year, file_size_bytes, etc.
  is_published      BOOLEAN NOT NULL DEFAULT FALSE,
  published_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Reuses update_updated_at() defined in migration 001
CREATE TRIGGER library_items_updated_at
  BEFORE UPDATE ON library_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_library_items_type ON library_items(item_type);
CREATE INDEX idx_library_items_published ON library_items(is_published, published_at DESC);

-- No RLS: backend service-role controls reads; subscription check happens in
-- Express (authenticate + requireSubscription), same pattern as archive_years.
COMMENT ON TABLE library_items IS 'Phase 4: Library media metadata. Audio only implemented; item_type allows video for forward compatibility.';

-- ============================================================================
-- 2. playback_positions table
--    Per-user, per-item playback position. Users may only access their own
--    rows — enforced by RLS (defense-in-depth; backend also scopes by JWT user).
-- ============================================================================

CREATE TABLE playback_positions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  library_item_id   UUID NOT NULL REFERENCES library_items(id) ON DELETE CASCADE,
  position_seconds  INTEGER NOT NULL DEFAULT 0 CHECK (position_seconds >= 0),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, library_item_id)
);

CREATE TRIGGER playback_positions_updated_at
  BEFORE UPDATE ON playback_positions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_playback_positions_user ON playback_positions(user_id);
CREATE INDEX idx_playback_positions_item ON playback_positions(library_item_id);

ALTER TABLE playback_positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY playback_positions_own
  ON playback_positions
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE playback_positions IS 'Phase 4: Per-user playback position, one row per (user, item). RLS restricts to own rows.';

-- ============================================================================
-- Migration Complete
-- ============================================================================
