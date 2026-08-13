import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useSessionTimeout from './useSessionTimeout';

describe('useSessionTimeout Hook', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('should default to 120 minutes (7,200,000 ms) and not trigger timeout prematurely', () => {
    const onTimeout = vi.fn();
    renderHook(() =>
      useSessionTimeout({
        isAuthenticated: true,
        onTimeout,
      })
    );

    // Advance by 119 minutes (7,140,000 ms)
    act(() => {
      vi.advanceTimersByTime(119 * 60 * 1000);
    });

    expect(onTimeout).not.toHaveBeenCalled();
  });

  it('should trigger onTimeout callback after 120 minutes of inactivity', () => {
    const onTimeout = vi.fn();
    renderHook(() =>
      useSessionTimeout({
        isAuthenticated: true,
        onTimeout,
      })
    );

    // Advance by 120 minutes + 1 second
    act(() => {
      vi.advanceTimersByTime(120 * 60 * 1000 + 1000);
    });

    expect(onTimeout).toHaveBeenCalledTimes(1);
  });

  it('should reset inactivity timer when user activity occurs', () => {
    const onTimeout = vi.fn();
    renderHook(() =>
      useSessionTimeout({
        isAuthenticated: true,
        onTimeout,
        timeoutMs: 10000,
      })
    );

    // Advance 6 seconds
    act(() => {
      vi.advanceTimersByTime(6000);
    });

    // Simulate user activity (click)
    act(() => {
      window.dispatchEvent(new Event('mousemove'));
    });

    // Advance another 6 seconds (12s total, but 6s since last activity)
    act(() => {
      vi.advanceTimersByTime(6000);
    });

    expect(onTimeout).not.toHaveBeenCalled();

    // Advance past remaining threshold (4s more)
    act(() => {
      vi.advanceTimersByTime(4500);
    });

    expect(onTimeout).toHaveBeenCalledTimes(1);
  });
});
