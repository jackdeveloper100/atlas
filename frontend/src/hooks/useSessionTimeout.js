/**
 * useSessionTimeout.js
 *
 * Custom hook to handle user inactivity detection, session timeout,
 * cross-tab synchronization via localStorage, and session warning state.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

const DEFAULT_TIMEOUT_MS = 120 * 60 * 1000; // 120 minutes (2 hours)
const DEFAULT_WARNING_MS = 0; // Disabled popup warning modal
const STORAGE_KEY = 'atlas_last_activity';
const THROTTLE_MS = 1000; // Throttle activity updates to once per second

export function useSessionTimeout({
  isAuthenticated = false,
  onTimeout,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  warningWindowMs = DEFAULT_WARNING_MS,
} = {}) {
  const [showWarning, setShowWarning] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(
    Math.floor(warningWindowMs / 1000)
  );

  const lastActivityRef = useRef(Date.now());
  const lastThrottleRef = useRef(0);
  const onTimeoutRef = useRef(onTimeout);
  const hasTimedOutRef = useRef(false);

  useEffect(() => {
    onTimeoutRef.current = onTimeout;
  }, [onTimeout]);

  // Helper to record activity and sync cross-tab
  const recordActivity = useCallback(() => {
    const now = Date.now();
    lastActivityRef.current = now;
    hasTimedOutRef.current = false;
    try {
      localStorage.setItem(STORAGE_KEY, now.toString());
    } catch (e) {
      // Ignore localStorage errors (e.g. incognito memory limits)
    }
  }, []);

  // Public method for user to manually extend session (e.g. from Warning Modal)
  const extendSession = useCallback(() => {
    recordActivity();
    setShowWarning(false);
    setRemainingSeconds(Math.floor(warningWindowMs / 1000));
  }, [recordActivity, warningWindowMs]);

  useEffect(() => {
    if (!isAuthenticated) {
      setShowWarning(false);
      return;
    }

    // Initialize last activity timestamp
    recordActivity();

    // Event listener for user interaction with throttling
    const handleUserActivity = () => {
      const now = Date.now();
      if (now - lastThrottleRef.current > THROTTLE_MS) {
        lastThrottleRef.current = now;
        recordActivity();
        if (showWarning) {
          setShowWarning(false);
        }
      }
    };

    const activityEvents = [
      'mousemove',
      'mousedown',
      'keydown',
      'touchstart',
      'scroll',
      'click',
    ];

    activityEvents.forEach((event) => {
      window.addEventListener(event, handleUserActivity, { passive: true });
    });

    // Check inactivity periodically
    const intervalId = setInterval(() => {
      const now = Date.now();
      
      // Check cross-tab timestamp in localStorage
      let storedTimestamp = lastActivityRef.current;
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = parseInt(stored, 10);
          if (!isNaN(parsed) && parsed > storedTimestamp) {
            storedTimestamp = parsed;
            lastActivityRef.current = parsed;
          }
        }
      } catch (e) {
        // Fallback to local ref
      }

      const elapsed = now - storedTimestamp;

      if (elapsed >= timeoutMs) {
        setShowWarning(false);
        if (!hasTimedOutRef.current && typeof onTimeoutRef.current === 'function') {
          hasTimedOutRef.current = true;
          onTimeoutRef.current();
        }
      } else if (warningWindowMs > 0 && timeoutMs - elapsed <= warningWindowMs) {
        const remaining = Math.max(0, Math.ceil((timeoutMs - elapsed) / 1000));
        setRemainingSeconds(remaining);
        setShowWarning(true);
      } else {
        if (showWarning) {
          setShowWarning(false);
        }
      }
    }, 1000);

    // Handle tab visibility change (e.g. device waking up or returning to tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const now = Date.now();
        let storedTimestamp = lastActivityRef.current;
        try {
          const stored = localStorage.getItem(STORAGE_KEY);
          if (stored) {
            const parsed = parseInt(stored, 10);
            if (!isNaN(parsed) && parsed > storedTimestamp) {
              storedTimestamp = parsed;
              lastActivityRef.current = parsed;
            }
          }
        } catch (e) {}

        const elapsed = now - storedTimestamp;
        if (elapsed >= timeoutMs) {
          setShowWarning(false);
          if (!hasTimedOutRef.current && typeof onTimeoutRef.current === 'function') {
            hasTimedOutRef.current = true;
            onTimeoutRef.current();
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      activityEvents.forEach((event) => {
        window.removeEventListener(event, handleUserActivity);
      });
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAuthenticated, recordActivity, timeoutMs, warningWindowMs, showWarning]);

  return {
    showWarning,
    remainingSeconds,
    extendSession,
  };
}

export default useSessionTimeout;
