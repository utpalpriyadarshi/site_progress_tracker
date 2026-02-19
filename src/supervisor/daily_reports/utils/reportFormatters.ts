import { COLORS } from '../../../theme/colors';
/**
 * Format item status for display
 */
export const formatStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    completed: 'Completed',
    in_progress: 'In Progress',
    not_started: 'Not Started',
  };

  return statusMap[status] || status.replace('_', ' ');
};

/**
 * Get status color based on item status
 */
export const getStatusColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    completed: COLORS.SUCCESS,    // Green
    in_progress: COLORS.INFO,  // Blue
    not_started: COLORS.DISABLED,  // Gray
  };

  return colorMap[status] || COLORS.DISABLED;
};

/**
 * Calculate progress percentage
 */
export const calculateProgress = (
  completed: number,
  planned: number
): number => {
  if (planned === 0) return 0;
  return Math.min((completed / planned) * 100, 100);
};

/**
 * Format progress percentage for display
 */
export const formatProgressPercentage = (
  completed: number,
  planned: number
): string => {
  const progress = calculateProgress(completed, planned);
  return `${progress.toFixed(1)}%`;
};

/**
 * Format quantity display
 */
export const formatQuantity = (
  completed: number,
  planned: number,
  unit: string
): string => {
  return `${completed.toFixed(2)} / ${planned.toFixed(2)} ${unit}`;
};

/**
 * Format date for display
 */
export const formatDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleDateString();
};

/**
 * Format date and time for display
 */
export const formatDateTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
};

/**
 * Determine item status based on quantities
 */
export const determineItemStatus = (
  completed: number,
  planned: number
): 'not_started' | 'in_progress' | 'completed' => {
  if (completed === 0) {
    return 'not_started';
  } else if (completed >= planned) {
    return 'completed';
  } else {
    return 'in_progress';
  }
};
