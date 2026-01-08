/**
 * Project-related type definitions for Admin shared components
 */

import type ProjectModel from '../../../../models/ProjectModel';

/**
 * Project metrics
 */
export interface ProjectMetrics {
  /** Total users assigned to project */
  totalUsers: number;
  /** Total items in project */
  totalItems: number;
  /** Project completion percentage (0-100) */
  completionPercentage: number;
  /** Days remaining until end date */
  daysRemaining: number;
}

/**
 * ProjectCard component props
 */
export interface ProjectCardProps {
  /** Project to display */
  project: ProjectModel;
  /** Project metrics (optional) */
  metrics?: ProjectMetrics;
  /** Callback when card is pressed */
  onPress?: (project: ProjectModel) => void;
  /** Callback when edit button is pressed */
  onEdit?: (project: ProjectModel) => void;
  /** Callback when delete button is pressed */
  onDelete?: (project: ProjectModel) => void;
  /** Whether to show metrics */
  showMetrics?: boolean;
  /** Whether to show action buttons */
  showActions?: boolean;
  /** Card display variant */
  variant?: 'default' | 'compact';
}
