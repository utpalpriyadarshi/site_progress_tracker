/**
 * DOORS Package Shared Types
 *
 * Type definitions for DOORS package shared components
 */

import { DoorsPackage } from '../../types/DoorsPackageTypes';

/**
 * Props for DoorsPackageCard component
 */
export interface DoorsPackageCardProps {
  /** The package data to display */
  package: DoorsPackage;
  /** Callback when card is pressed */
  onPress?: (pkg: DoorsPackage) => void;
  /** Callback for Mark Received action */
  onMarkReceived?: (packageId: string) => void;
  /** Callback for Mark Reviewed action */
  onMarkReviewed?: (packageId: string) => void;
  /** Callback for Edit action */
  onEdit?: (pkg: DoorsPackage) => void;
  /** Callback for Delete action */
  onDelete?: (packageId: string) => void;
  /** Whether to show action buttons */
  showActions?: boolean;
  /** Card display variant */
  variant?: 'default' | 'compact';
  /** Optional style overrides */
  style?: any;
}

/**
 * Re-export DoorsPackage type for convenience
 */
export type { DoorsPackage } from '../../types/DoorsPackageTypes';
