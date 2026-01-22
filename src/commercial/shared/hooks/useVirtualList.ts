/**
 * useVirtualList - Virtual scrolling helper for FlatList optimization
 *
 * Provides optimized FlatList props for rendering large lists efficiently.
 * Implements windowing to only render visible items plus a buffer.
 *
 * Usage:
 * ```tsx
 * const { flatListProps, scrollToIndex, scrollToTop } = useVirtualList({
 *   data: items,
 *   itemHeight: 72,
 *   overscan: 5,
 * });
 *
 * return (
 *   <FlatList
 *     data={items}
 *     renderItem={renderItem}
 *     {...flatListProps}
 *   />
 * );
 * ```
 */

import { useRef, useMemo, useCallback } from 'react';
import { FlatList } from 'react-native';

export interface UseVirtualListOptions<T> {
  /** Array of items to render */
  data: T[];
  /** Fixed height of each item (required for getItemLayout) */
  itemHeight: number;
  /** Key extractor function */
  keyExtractor?: (item: T, index: number) => string;
  /** Number of items to render outside visible area (default: 5) */
  overscan?: number;
  /** Initial number of items to render (default: 10) */
  initialNumToRender?: number;
  /** Maximum number of items to render per batch (default: 10) */
  maxToRenderPerBatch?: number;
  /** Window size multiplier (default: 5) */
  windowSize?: number;
  /** Update cell batch size (default: 10) */
  updateCellsBatchingPeriod?: number;
  /** Remove clipped subviews (default: true on Android) */
  removeClippedSubviews?: boolean;
}

export interface FlatListOptimizedProps {
  /** Get item layout for fixed height items */
  getItemLayout: (
    data: any[] | null | undefined,
    index: number
  ) => { length: number; offset: number; index: number };
  /** Initial number of items to render */
  initialNumToRender: number;
  /** Maximum items to render per batch */
  maxToRenderPerBatch: number;
  /** Window size for rendering */
  windowSize: number;
  /** Batch update period */
  updateCellsBatchingPeriod: number;
  /** Remove clipped subviews */
  removeClippedSubviews: boolean;
  /** Maintain scroll position */
  maintainVisibleContentPosition?: { minIndexForVisible: number };
}

export interface UseVirtualListResult<T> {
  /** Optimized props to spread on FlatList */
  flatListProps: FlatListOptimizedProps;
  /** Reference to FlatList */
  listRef: React.RefObject<FlatList<T> | null>;
  /** Scroll to specific index */
  scrollToIndex: (index: number, animated?: boolean) => void;
  /** Scroll to top of list */
  scrollToTop: (animated?: boolean) => void;
  /** Scroll to end of list */
  scrollToEnd: (animated?: boolean) => void;
  /** Scroll to specific item */
  scrollToItem: (item: T, animated?: boolean) => void;
  /** Get visible item range (approximate) */
  getVisibleRange: () => { start: number; end: number } | null;
}

export function useVirtualList<T>({
  data,
  itemHeight,
  keyExtractor,
  overscan = 5,
  initialNumToRender = 10,
  maxToRenderPerBatch = 10,
  windowSize = 5,
  updateCellsBatchingPeriod = 50,
  removeClippedSubviews = true,
}: UseVirtualListOptions<T>): UseVirtualListResult<T> {
  const listRef = useRef<FlatList<T>>(null);
  const visibleRangeRef = useRef<{ start: number; end: number } | null>(null);

  // Memoized getItemLayout function for fixed height items
  const getItemLayout = useCallback(
    (_data: any[] | null | undefined, index: number) => ({
      length: itemHeight,
      offset: itemHeight * index,
      index,
    }),
    [itemHeight]
  );

  // Scroll to specific index
  const scrollToIndex = useCallback(
    (index: number, animated: boolean = true) => {
      if (listRef.current && index >= 0 && index < data.length) {
        listRef.current.scrollToIndex({
          index,
          animated,
          viewPosition: 0,
        });
      }
    },
    [data.length]
  );

  // Scroll to top
  const scrollToTop = useCallback((animated: boolean = true) => {
    if (listRef.current) {
      listRef.current.scrollToOffset({ offset: 0, animated });
    }
  }, []);

  // Scroll to end
  const scrollToEnd = useCallback((animated: boolean = true) => {
    if (listRef.current) {
      listRef.current.scrollToEnd({ animated });
    }
  }, []);

  // Scroll to specific item
  const scrollToItem = useCallback(
    (item: T, animated: boolean = true) => {
      if (listRef.current) {
        const index = data.indexOf(item);
        if (index >= 0) {
          scrollToIndex(index, animated);
        }
      }
    },
    [data, scrollToIndex]
  );

  // Get visible range
  const getVisibleRange = useCallback(() => {
    return visibleRangeRef.current;
  }, []);

  // Memoized FlatList props
  const flatListProps = useMemo<FlatListOptimizedProps>(
    () => ({
      getItemLayout,
      initialNumToRender,
      maxToRenderPerBatch,
      windowSize,
      updateCellsBatchingPeriod,
      removeClippedSubviews,
      maintainVisibleContentPosition: {
        minIndexForVisible: 0,
      },
    }),
    [
      getItemLayout,
      initialNumToRender,
      maxToRenderPerBatch,
      windowSize,
      updateCellsBatchingPeriod,
      removeClippedSubviews,
    ]
  );

  return {
    flatListProps,
    listRef,
    scrollToIndex,
    scrollToTop,
    scrollToEnd,
    scrollToItem,
    getVisibleRange,
  };
}

/**
 * Calculate optimal FlatList settings based on item count and screen size
 */
export const calculateOptimalSettings = (
  itemCount: number,
  screenHeight: number,
  itemHeight: number
): Partial<UseVirtualListOptions<any>> => {
  const visibleItems = Math.ceil(screenHeight / itemHeight);

  // For small lists, render all
  if (itemCount <= 20) {
    return {
      initialNumToRender: itemCount,
      maxToRenderPerBatch: itemCount,
      windowSize: 21,
      removeClippedSubviews: false,
    };
  }

  // For medium lists
  if (itemCount <= 100) {
    return {
      initialNumToRender: visibleItems + 5,
      maxToRenderPerBatch: 10,
      windowSize: 7,
      removeClippedSubviews: true,
    };
  }

  // For large lists
  return {
    initialNumToRender: visibleItems + 3,
    maxToRenderPerBatch: 5,
    windowSize: 5,
    removeClippedSubviews: true,
    updateCellsBatchingPeriod: 100,
  };
};

/**
 * Hook for handling scroll-to-index failures
 */
export const useScrollToIndexFailed = <T>(
  listRef: React.RefObject<FlatList<T>>,
  itemHeight: number
) => {
  return useCallback(
    (info: {
      index: number;
      highestMeasuredFrameIndex: number;
      averageItemLength: number;
    }) => {
      // Scroll to approximate position first, then retry
      const offset = info.index * itemHeight;
      listRef.current?.scrollToOffset({ offset, animated: false });

      // Retry scroll to index after a brief delay
      setTimeout(() => {
        listRef.current?.scrollToIndex({
          index: info.index,
          animated: true,
        });
      }, 100);
    },
    [listRef, itemHeight]
  );
};

export default useVirtualList;
