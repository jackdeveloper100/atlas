/**
 * hooks/usePlaybackPosition.js
 *
 * Loads a saved playback position for a library item and persists updates
 * back to the backend. `schedulePersist` is throttled to at most once per
 * SAVE_INTERVAL_MS even under continuous timeupdate events, so periodic
 * saves during playback don't flood the API; `persistNow` bypasses the
 * throttle for pause/unmount, where an immediate save is wanted.
 */

import { useCallback, useRef } from 'react';
import { getPosition, savePosition } from '../services/library.service';

const SAVE_INTERVAL_MS = 8000;

export function usePlaybackPosition(itemId) {
  const lastSavedRef = useRef(0);
  const lastPersistAtRef = useRef(0);

  const loadPosition = useCallback(async () => {
    if (!itemId) return 0;
    try {
      const res = await getPosition(itemId);
      if (res.success && res.data) {
        lastSavedRef.current = res.data.position_seconds || 0;
        return lastSavedRef.current;
      }
    } catch {
      // No saved position yet, or the request failed — start from 0.
    }
    return 0;
  }, [itemId]);

  const persistNow = useCallback(
    (seconds) => {
      if (!itemId) return;
      const rounded = Math.max(0, Math.floor(seconds));
      if (rounded === lastSavedRef.current) return;
      lastSavedRef.current = rounded;
      lastPersistAtRef.current = Date.now();
      savePosition(itemId, rounded).catch(() => {
        // Best-effort — playback position is not critical enough to surface an error.
      });
    },
    [itemId]
  );

  const schedulePersist = useCallback(
    (seconds) => {
      if (Date.now() - lastPersistAtRef.current >= SAVE_INTERVAL_MS) {
        persistNow(seconds);
      }
    },
    [persistNow]
  );

  return { loadPosition, persistNow, schedulePersist };
}
