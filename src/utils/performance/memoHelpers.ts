import { useMemo, useCallback } from 'react';

/**
 * Performance Memoization Helpers
 *
 * Utilities for optimizing React component performance through memoization.
 */

/**
 * Creates a memoized object that only updates when dependencies change
 *
 * Useful for preventing unnecessary re-renders when passing objects as props
 *
 * @example
 * ```ts
 * const style = useMemoObject({ color: 'red', fontSize: 16 }, []);
 * // Object reference stays the same across renders
 * ```
 */
export const useMemoObject = <T extends object>(obj: T, deps: any[]): T => {
  return useMemo(() => obj, deps);
};

/**
 * Creates a memoized array that only updates when dependencies change
 *
 * Useful for preventing unnecessary re-renders when passing arrays as props
 *
 * @example
 * ```ts
 * const items = useMemoArray([1, 2, 3], []);
 * // Array reference stays the same across renders
 * ```
 */
export const useMemoArray = <T>(arr: T[], deps: any[]): T[] => {
  return useMemo(() => arr, deps);
};

/**
 * Creates a stable callback that doesn't change between renders
 *
 * Wrapper around useCallback with better type inference
 *
 * @example
 * ```ts
 * const handlePress = useStableCallback(() => {
 *   console.log('Pressed');
 * }, []);
 * ```
 */
export const useStableCallback = <T extends (...args: any[]) => any>(
  callback: T,
  deps: any[]
): T => {
  return useCallback(callback, deps) as T;
};

/**
 * FlatList optimization: KeyExtractor factory
 *
 * Creates a stable key extractor function for FlatList to prevent unnecessary re-renders
 *
 * @param getKey - Function to extract key from item
 * @returns Stable key extractor function
 *
 * @example
 * ```tsx
 * const keyExtractor = createKeyExtractor((item: User) => item.id);
 *
 * <FlatList
 *   data={users}
 *   keyExtractor={keyExtractor}
 *   renderItem={renderUserItem}
 * />
 * ```
 */
export const createKeyExtractor = <T>(
  getKey: (item: T) => string
): ((item: T, index: number) => string) => {
  return (item: T, index: number) => {
    try {
      return getKey(item);
    } catch (error) {
      // Fallback to index if key extraction fails
      return `item-${index}`;
    }
  };
};

/**
 * FlatList optimization: getItemLayout factory
 *
 * Creates a getItemLayout function for fixed-height list items to improve performance
 *
 * @param itemHeight - Fixed height of each item
 * @param separatorHeight - Height of separator between items (default: 0)
 * @returns getItemLayout function for FlatList
 *
 * @example
 * ```tsx
 * const getItemLayout = createGetItemLayout(80, 1);
 *
 * <FlatList
 *   data={items}
 *   getItemLayout={getItemLayout}
 *   renderItem={renderItem}
 * />
 * ```
 */
export const createGetItemLayout = (
  itemHeight: number,
  separatorHeight: number = 0
) => {
  return (data: any, index: number) => ({
    length: itemHeight,
    offset: (itemHeight + separatorHeight) * index,
    index,
  });
};

/**
 * Shallow comparison helper for props
 *
 * Compares two objects shallowly to determine if they're equal
 * Useful for custom memo comparisons
 *
 * @param objA - First object
 * @param objB - Second object
 * @returns true if objects are shallowly equal
 */
export const shallowEqual = (objA: any, objB: any): boolean => {
  if (objA === objB) {
    return true;
  }

  if (typeof objA !== 'object' || objA === null || typeof objB !== 'object' || objB === null) {
    return false;
  }

  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);

  if (keysA.length !== keysB.length) {
    return false;
  }

  for (let i = 0; i < keysA.length; i++) {
    if (!Object.prototype.hasOwnProperty.call(objB, keysA[i]) || objA[keysA[i]] !== objB[keysA[i]]) {
      return false;
    }
  }

  return true;
};
