import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import useSnapshot from './useSnapshot';
import * as archiveService from '../services/archive.service';

vi.mock('../services/archive.service');

describe('useSnapshot', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('unwraps the { years, total } envelope from GET /archive/years into a flat year list', async () => {
    // Real backend response shape: { success, data: { years: [...], total } }
    archiveService.getPublishedYears.mockResolvedValue({
      success: true,
      data: { years: [{ year: 0 }, { year: 5 }, { year: 10 }], total: 3 },
      error: null,
    });
    archiveService.getSnapshot.mockResolvedValue({
      success: true,
      data: { schema_version: '1.0.0', nations: [], regions: [], leaders: [], politicalStates: [], events: [] },
      error: null,
    });

    const { result } = renderHook(() => useSnapshot(0));

    await waitFor(() => expect(result.current.isLoadingYears).toBe(false));

    expect(result.current.publishedYears).toEqual([0, 5, 10]);
    expect(result.current.minYear).toBe(0);
    expect(result.current.maxYear).toBe(10);
  });

  it('does not crash and leaves publishedYears empty when the years response is malformed', async () => {
    archiveService.getPublishedYears.mockResolvedValue({ success: true, data: null, error: null });
    archiveService.getSnapshot.mockResolvedValue({ success: true, data: {}, error: null });

    const { result } = renderHook(() => useSnapshot(0));

    await waitFor(() => expect(result.current.isLoadingYears).toBe(false));

    expect(result.current.publishedYears).toEqual([]);
  });
});
