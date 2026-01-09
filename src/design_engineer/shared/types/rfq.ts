/**
 * Design RFQ Shared Types
 *
 * Type definitions for Design RFQ shared components
 */

import { DesignRfq } from '../../types/DesignRfqTypes';

/**
 * Props for DesignRfqCard component
 */
export interface DesignRfqCardProps {
  /** The RFQ data to display */
  rfq: DesignRfq;
  /** Callback when card is pressed */
  onPress?: (rfq: DesignRfq) => void;
  /** Callback for Issue RFQ action */
  onIssue?: (rfqId: string) => void;
  /** Callback for Mark Quotes Received action */
  onMarkQuotesReceived?: (rfqId: string) => void;
  /** Callback for Edit action */
  onEdit?: (rfq: DesignRfq) => void;
  /** Callback for Delete action */
  onDelete?: (rfqId: string) => void;
  /** Whether to show action buttons */
  showActions?: boolean;
  /** Card display variant */
  variant?: 'default' | 'compact';
  /** Optional style overrides */
  style?: any;
}

/**
 * Re-export DesignRfq type for convenience
 */
export type { DesignRfq } from '../../types/DesignRfqTypes';
