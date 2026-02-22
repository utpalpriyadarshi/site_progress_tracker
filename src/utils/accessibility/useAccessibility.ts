import { useCallback, RefObject } from 'react';
import { AccessibilityInfo } from 'react-native';
import { logger } from '../../services/LoggingService';

/**
 * useAccessibility - Custom hook for accessibility features
 *
 * Provides utilities for:
 * - Screen reader announcements
 * - Focus management
 * - Accessibility state updates
 *
 * Usage:
 * ```ts
 * const { announce, setFocus, reduceMotion } = useAccessibility();
 *
 * // Announce to screen reader
 * announce('Data loaded successfully');
 *
 * // Set focus to element
 * setFocus(inputRef);
 * ```
 */
export const useAccessibility = () => {
  /**
   * Announces a message to screen readers
   * @param message - The message to announce
   */
  const announce = useCallback((message: string) => {
    try {
      AccessibilityInfo.announceForAccessibility(message);
      logger.debug('[Accessibility] Announced:', { message });
    } catch (error) {
      logger.error('[Accessibility] Failed to announce:', error as Error);
    }
  }, []);

  /**
   * Sets focus to a specific element
   * @param ref - React ref to the element
   */
  const setFocus = useCallback(
    (ref: RefObject<any>) => {
      try {
        if (ref.current) {
          ref.current.focus();

          // Announce focus change if element has an accessibility label
          const label = ref.current.props?.accessibilityLabel;
          if (label) {
            announce(`Focused on ${label}`);
          }

          logger.debug('[Accessibility] Focus set to:', label || 'element');
        }
      } catch (error) {
        logger.error('[Accessibility] Failed to set focus:', error as Error);
      }
    },
    [announce]
  );

  /**
   * Checks if reduce motion is enabled
   * @returns Promise<boolean>
   */
  const isReduceMotionEnabled = useCallback(async (): Promise<boolean> => {
    try {
      const reduceMotion = await AccessibilityInfo.isReduceMotionEnabled();
      logger.debug('[Accessibility] Reduce motion enabled:', { reduceMotion });
      return reduceMotion;
    } catch (error) {
      logger.error('[Accessibility] Failed to check reduce motion:', error as Error);
      return false;
    }
  }, []);

  /**
   * Checks if screen reader is enabled
   * @returns Promise<boolean>
   */
  const isScreenReaderEnabled = useCallback(async (): Promise<boolean> => {
    try {
      const screenReader = await AccessibilityInfo.isScreenReaderEnabled();
      logger.debug('[Accessibility] Screen reader enabled:', { screenReader });
      return screenReader;
    } catch (error) {
      logger.error('[Accessibility] Failed to check screen reader:', error as Error);
      return false;
    }
  }, []);

  return {
    announce,
    setFocus,
    isReduceMotionEnabled,
    isScreenReaderEnabled,
  };
};
