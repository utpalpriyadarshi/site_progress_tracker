/**
 * Dashboard hooks for fetching widget data
 */

// New consolidated hook (preferred)
export { useDashboardData } from './useDashboardData';

// Legacy widget hooks (deprecated - kept for backwards compatibility)
export {
  useDoorsStatusData,
  useRfqStatusData,
  useDesignDocStatusData,
  useComplianceData,
  useProcessingTimeData,
  useRecentActivityData,
} from './useWidgetData';
