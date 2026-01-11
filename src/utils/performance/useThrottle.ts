import { useState, useEffect, useRef } from 'react';

/**
 * useThrottle - Throttles a value by limiting update frequency
 *
 * This hook limits how often a value can update. Unlike debounce which
 * waits for a pause in updates, throttle ensures updates happen at most
 * once per time interval.
 *
 * @param value - The value to throttle
 * @param interval - Minimum time between updates in milliseconds (default: 300ms)
 * @returns The throttled value
 *
 * @example
 * ```ts
 * const [scrollPosition, setScrollPosition] = useState(0);
 * const throttledScroll = useThrottle(scrollPosition, 100);
 *
 * // Scroll position updates at most once per 100ms
 * ```
 */
export const useThrottle = <T>(value: T, interval: number = 300): T => {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastUpdated = useRef<number>(Date.now());

  useEffect(() => {
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdated.current;

    if (timeSinceLastUpdate >= interval) {
      // Enough time has passed, update immediately
      lastUpdated.current = now;
      setThrottledValue(value);
    } else {
      // Schedule update for when interval elapses
      const timeoutId = setTimeout(() => {
        lastUpdated.current = Date.now();
        setThrottledValue(value);
      }, interval - timeSinceLastUpdate);

      return () => clearTimeout(timeoutId);
    }
  }, [value, interval]);

  return throttledValue;
};
