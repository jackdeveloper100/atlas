import { useState, useEffect, useCallback, useRef } from 'react';
import { getPublishedYears, getSnapshot } from '../services/archive.service';

/**
 * Custom React Hook: useSnapshot
 *
 * Manages year selection, published years list, and snapshot caching for the Archive UI.
 */
export function useSnapshot(initialYear = 0) {
  const [publishedYears, setPublishedYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState(initialYear);
  const [currentSnapshot, setCurrentSnapshot] = useState(null);
  const [isLoadingYears, setIsLoadingYears] = useState(true);
  const [isLoadingSnapshot, setIsLoadingSnapshot] = useState(false);
  const [error, setError] = useState(null);

  // In-memory cache for fetched snapshot JSON objects
  const cacheRef = useRef({});

  // 1. Fetch available published years on mount
  useEffect(() => {
    let isMounted = true;
    async function loadYears() {
      setIsLoadingYears(true);
      try {
        const response = await getPublishedYears();
        // Backend envelope is { success, data: { years, total } } — years is the array.
        const years = response.success && Array.isArray(response.data?.years) ? response.data.years : null;
        if (years && isMounted) {
          setPublishedYears(years);
          // Default to earliest year if initialYear not in range
          const availableYears = years.map((item) => item.year ?? item);
          if (availableYears.length > 0 && !availableYears.includes(initialYear)) {
            setSelectedYear(availableYears[0]);
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error('[useSnapshot] Failed to load published years:', err);
          setError(err.message || 'Failed to load archive timeline');
        }
      } finally {
        if (isMounted) setIsLoadingYears(false);
      }
    }
    loadYears();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Fetch or retrieve snapshot for selectedYear
  const fetchSnapshotForYear = useCallback(async (year) => {
    if (year === null || year === undefined) return;

    // Check in-memory cache first
    if (cacheRef.current[year]) {
      setCurrentSnapshot(cacheRef.current[year]);
      setError(null);
      return;
    }

    setIsLoadingSnapshot(true);
    setError(null);
    try {
      const response = await getSnapshot(year);
      if (response.success && response.data) {
        cacheRef.current[year] = response.data;
        setCurrentSnapshot(response.data);
      } else {
        throw new Error(response.error || `No snapshot data for Year ${year}`);
      }
    } catch (err) {
      console.error(`[useSnapshot] Error loading Year ${year}:`, err);
      setError(err.message || `Failed to fetch snapshot for Year ${year}`);
      setCurrentSnapshot(null);
    } finally {
      setIsLoadingSnapshot(false);
    }
  }, []);

  useEffect(() => {
    fetchSnapshotForYear(selectedYear);
  }, [selectedYear, fetchSnapshotForYear]);

  // Year navigation helpers
  const yearsList = publishedYears.map((item) => (typeof item === 'object' ? item.year : item)).sort((a, b) => a - b);
  const minYear = yearsList.length > 0 ? yearsList[0] : 0;
  const maxYear = yearsList.length > 0 ? yearsList[yearsList.length - 1] : 0;

  const nextYear = useCallback(() => {
    setSelectedYear((prev) => {
      const idx = yearsList.indexOf(prev);
      if (idx !== -1 && idx < yearsList.length - 1) {
        return yearsList[idx + 1];
      }
      return prev;
    });
  }, [yearsList]);

  const prevYear = useCallback(() => {
    setSelectedYear((prev) => {
      const idx = yearsList.indexOf(prev);
      if (idx > 0) {
        return yearsList[idx - 1];
      }
      return prev;
    });
  }, [yearsList]);

  return {
    selectedYear,
    setSelectedYear,
    publishedYears: yearsList,
    currentSnapshot,
    isLoading: isLoadingYears || isLoadingSnapshot,
    isLoadingYears,
    isLoadingSnapshot,
    error,
    minYear,
    maxYear,
    nextYear,
    prevYear,
    refreshSnapshot: () => fetchSnapshotForYear(selectedYear),
  };
}

export default useSnapshot;
