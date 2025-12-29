/**
 * Milestone Tracking Formatters
 */

/**
 * Format date to locale date string
 */
export const formatDate = (timestamp: number | null | undefined): string => {
  if (!timestamp) return 'Not Set';
  return new Date(timestamp).toLocaleDateString();
};

/**
 * Format date range
 */
export const formatDateRange = (
  startDate: number | null | undefined,
  endDate: number | null | undefined,
  inProgressLabel: string = 'In Progress'
): string => {
  const start = startDate ? formatDate(startDate) : 'Not Set';
  const end = endDate ? formatDate(endDate) : inProgressLabel;
  return `${start} - ${end}`;
};

/**
 * Format status label
 */
export const formatStatusLabel = (status: string): string => {
  return status.toUpperCase().replace('_', ' ');
};

/**
 * Calculate progress percentage display value
 */
export const formatProgressPercentage = (progressValue: number): number => {
  return Math.round(progressValue * 100);
};
