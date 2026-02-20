import { useCallback } from 'react';

/**
 * useFlatListProps — shared FlatList performance configuration.
 *
 * Provides stable keyExtractor, windowing / batching props, and optional
 * getItemLayout for fixed-height lists.  Spread the result onto any FlatList
 * and remove the local keyExtractor prop to avoid duplication.
 *
 * @param itemHeight Fixed item height in pixels.  Omit (or pass undefined) for
 *   variable-height lists — getItemLayout will not be set in that case.
 */
export function useFlatListProps<T extends { id: string }>(itemHeight?: number) {
  const keyExtractor = useCallback((item: T) => item.id, []);

  const getItemLayout = itemHeight
    ? (_: unknown, index: number) => ({
        length: itemHeight,
        offset: itemHeight * index,
        index,
      })
    : undefined;

  return {
    keyExtractor,
    getItemLayout,
    maxToRenderPerBatch: 10,
    updateCellsBatchingPeriod: 50,
    initialNumToRender: 8,
    windowSize: 5,
    removeClippedSubviews: true,
  };
}
