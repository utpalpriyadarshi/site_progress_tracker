import { useState, useCallback } from 'react';

/**
 * Keyboard Navigation Utilities
 *
 * Provides utilities for handling keyboard navigation in accessible components.
 */

/**
 * Handles key press events for activation (Enter or Space)
 * @param event - Keyboard event
 * @param onActivate - Callback to execute on activation
 */
export const handleKeyPress = (event: any, onActivate: () => void) => {
  if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
    event.preventDefault();
    onActivate();
  }
};

/**
 * Custom hook for keyboard navigation in lists
 * @param items - Array of items to navigate through
 * @returns Navigation state and handlers
 */
export const useKeyboardNavigation = <T>(items: T[]) => {
  const [focusedIndex, setFocusedIndex] = useState(0);

  /**
   * Handles arrow key navigation
   * @param event - Keyboard event
   */
  const handleArrowKeys = useCallback(
    (event: any) => {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setFocusedIndex((prev) => Math.min(prev + 1, items.length - 1));
          break;
        case 'ArrowUp':
          event.preventDefault();
          setFocusedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case 'Home':
          event.preventDefault();
          setFocusedIndex(0);
          break;
        case 'End':
          event.preventDefault();
          setFocusedIndex(items.length - 1);
          break;
        default:
          break;
      }
    },
    [items.length]
  );

  /**
   * Resets focus to first item
   */
  const resetFocus = useCallback(() => {
    setFocusedIndex(0);
  }, []);

  /**
   * Sets focus to specific index
   */
  const setFocus = useCallback(
    (index: number) => {
      if (index >= 0 && index < items.length) {
        setFocusedIndex(index);
      }
    },
    [items.length]
  );

  return {
    focusedIndex,
    handleArrowKeys,
    resetFocus,
    setFocus,
  };
};

/**
 * Custom hook for tab navigation management
 * @param elementRefs - Array of refs to focusable elements
 * @returns Tab navigation handlers
 */
export const useTabNavigation = (elementRefs: React.RefObject<any>[]) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  /**
   * Handles tab key press
   * @param event - Keyboard event
   */
  const handleTab = useCallback(
    (event: any) => {
      if (event.key === 'Tab') {
        event.preventDefault();

        const nextIndex = event.shiftKey
          ? currentIndex === 0
            ? elementRefs.length - 1
            : currentIndex - 1
          : currentIndex === elementRefs.length - 1
          ? 0
          : currentIndex + 1;

        setCurrentIndex(nextIndex);

        // Set focus to next element
        const nextRef = elementRefs[nextIndex];
        if (nextRef?.current) {
          nextRef.current.focus();
        }
      }
    },
    [currentIndex, elementRefs]
  );

  return {
    currentIndex,
    handleTab,
  };
};

/**
 * Keyboard navigation key codes for reference
 */
export const KeyCodes = {
  ENTER: 'Enter',
  SPACE: ' ',
  SPACEBAR: 'Spacebar', // Legacy
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  TAB: 'Tab',
  ESCAPE: 'Escape',
  HOME: 'Home',
  END: 'End',
  PAGE_UP: 'PageUp',
  PAGE_DOWN: 'PageDown',
} as const;
