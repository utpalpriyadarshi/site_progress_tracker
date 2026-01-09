/**
 * Shared Milestone-related types for Planning components
 */

/**
 * Milestone status type
 */
export type MilestoneStatus = 'pending' | 'in-progress' | 'completed' | 'delayed';

/**
 * Simplified Milestone data structure for shared components
 */
export interface MilestoneData {
  id: string;
  name: string;
  code: string;
  description?: string;
  targetDate: number;
  actualDate: number | null;
  progress: number; // 0-100
  status: MilestoneStatus;
  dependentItems: string[];
  notes?: string;
  plannedStartDate?: number;
  plannedEndDate?: number;
  actualStartDate?: number;
  actualEndDate?: number;
}

/**
 * Props for MilestoneCard component
 */
export interface MilestoneCardProps {
  milestone: MilestoneData;
  onPress?: (milestone: MilestoneData) => void;
  onEdit?: (milestone: MilestoneData) => void;
  onDelete?: (milestone: MilestoneData) => void;
  showActions?: boolean;
  variant?: 'default' | 'compact';
}
