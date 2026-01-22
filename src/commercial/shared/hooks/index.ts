/**
 * Barrel export for shared Commercial hooks
 * Enables clean imports: import { useTableAccessibility } from '@/commercial/shared/hooks'
 */

export { useTableAccessibility } from './useTableAccessibility';
export type {
  UseTableAccessibilityOptions,
  RowAccessibilityProps,
  CellAccessibilityProps,
  SortState,
} from './useTableAccessibility';

export { useChartDescription } from './useChartDescription';
export type {
  ChartType,
  ValueFormat,
  ChartDataPoint as ChartDescriptionDataPoint,
  UseChartDescriptionOptions,
  ChartStatistics,
  ChartDescriptionResult,
} from './useChartDescription';

export { useDebounceSearch } from './useDebounceSearch';
export type {
  UseDebounceSearchOptions,
  UseDebounceSearchResult,
} from './useDebounceSearch';

export { useMemoizedFilters, FilterPredicates } from './useMemoizedFilters';
export type {
  FilterPredicate,
  FilterDefinition,
  UseMemoizedFiltersOptions,
  UseMemoizedFiltersResult,
} from './useMemoizedFilters';

export { useVirtualList, calculateOptimalSettings, useScrollToIndexFailed } from './useVirtualList';
export type {
  UseVirtualListOptions,
  FlatListOptimizedProps,
  UseVirtualListResult,
} from './useVirtualList';
