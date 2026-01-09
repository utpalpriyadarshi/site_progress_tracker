/**
 * Barrel export for all Design Engineer shared code
 */

// Components
export { DesignRfqCard, DoorsPackageCard, StatsCard } from './components';

// Skeletons
export { DesignRfqListSkeleton, DoorsPackageListSkeleton, DashboardSkeleton } from './skeletons';

// Types
export type {
  DesignRfq,
  DesignRfqCardProps,
  DoorsPackage,
  DoorsPackageCardProps,
  Trend,
  TrendDirection,
  StatsCardProps,
  DesignRfqListSkeletonProps,
  DoorsPackageListSkeletonProps,
  DashboardSkeletonProps,
} from './types';

// Skeleton types are re-exported from skeletons directory
export type { DesignRfqListSkeletonProps, DoorsPackageListSkeletonProps, DashboardSkeletonProps } from './skeletons';
