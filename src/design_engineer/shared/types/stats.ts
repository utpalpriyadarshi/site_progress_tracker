/**
 * Stats Card Shared Types
 *
 * Type definitions for statistics dashboard components
 */

/**
 * Trend direction for statistics
 */
export type TrendDirection = 'up' | 'down' | 'neutral';

/**
 * Trend information for a metric
 */
export interface Trend {
  /** The trend value (e.g., percentage change) */
  value: number;
  /** Direction of the trend */
  direction: TrendDirection;
}

/**
 * Props for StatsCard component
 */
export interface StatsCardProps {
  /** Card title */
  title: string;
  /** Main value to display */
  value: number | string;
  /** Optional subtitle */
  subtitle?: string;
  /** Optional icon name (Material Community Icons) */
  icon?: string;
  /** Optional trend information */
  trend?: Trend;
  /** Callback when card is pressed */
  onPress?: () => void;
  /** Card display variant */
  variant?: 'default' | 'compact';
  /** Custom color for the card */
  color?: string;
  /** Optional style overrides */
  style?: any;
}
