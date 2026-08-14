import { useState, useEffect, useCallback, useRef } from 'react';
import { getPublishedYears, getArchiveYear } from '../services/archive.service';

/**
 * Custom React Hook: useArchiveYear
 *
 * Manages year selection, published years list, and archive payload caching for the Archive UI.
 */
export function useArchiveYear(initialYear = 0) {
  const [publishedYears, setPublishedYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState(initialYear);
  const [currentArchiveData, setCurrentArchiveData] = useState(null);
  const [isLoadingYears, setIsLoadingYears] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [error, setError] = useState(null);

  const cacheRef = useRef({});

  useEffect(() => {
    let isMounted = true;
    async function loadYears() {
      setIsLoadingYears(true);
      try {
        const response = await getPublishedYears();
        const years = response.success && Array.isArray(response.data?.years) ? response.data.years : [];
        if (isMounted) {
          setPublishedYears(years);
          const availableYears = years.map((item) => (typeof item === 'object' ? item.year : item));
          if (availableYears.length > 0 && !availableYears.includes(initialYear)) {
            setSelectedYear(availableYears[0]);
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error('[useArchiveYear] Failed to load published years:', err);
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
  }, [initialYear]);

  const fetchArchiveForYear = useCallback(async (year) => {
    if (year === null || year === undefined) return;

    if (cacheRef.current[year]) {
      setCurrentArchiveData(cacheRef.current[year]);
      setError(null);
      return;
    }

    setIsLoadingData(true);
    setError(null);
    try {
      const response = await getArchiveYear(year);
      if (response.success && response.data) {
        cacheRef.current[year] = response.data;
        setCurrentArchiveData(response.data);
      } else {
        throw new Error(response.error || `No archive data for Year ${year}`);
      }
    } catch (err) {
      console.error(`[useArchiveYear] Error loading Year ${year}:`, err);
      setError(err.message || `Failed to fetch archive data for Year ${year}`);
      setCurrentArchiveData(null);
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  useEffect(() => {
    fetchArchiveForYear(selectedYear);
  }, [selectedYear, fetchArchiveForYear]);

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
    currentSnapshot: currentArchiveData, // alias for backwards compatibility with component props
    currentArchiveData,
    isLoading: isLoadingYears || isLoadingData,
    isLoadingYears,
    isLoadingSnapshot: isLoadingData,
    error,
    minYear,
    maxYear,
    nextYear,
    prevYear,
    refreshSnapshot: () => {
      delete cacheRef.current[selectedYear];
      return fetchArchiveForYear(selectedYear);
    },
  };
}

export default useArchiveYear;
