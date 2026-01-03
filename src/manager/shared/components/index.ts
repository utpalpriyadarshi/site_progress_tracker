/**
 * Manager Shared Components
 *
 * Barrel export for all reusable Manager components
 *
 * Components:
 * - ApprovalWorkflowCard: Reusable card for approval workflows
 * - BomItemEditor: Shared BOM item editing component
 * - CostBreakdownChart: Visual cost breakdown with charting
 * - TeamMemberSelector: Reusable team member selection component
 * - ResourceAllocationGrid: Grid display for resource allocation
 */

// Component Exports
export { default as ApprovalWorkflowCard } from './ApprovalWorkflowCard';
export { default as BomItemEditor } from './BomItemEditor';
export { default as CostBreakdownChart } from './CostBreakdownChart';
export { default as TeamMemberSelector } from './TeamMemberSelector';
export { default as ResourceAllocationGrid } from './ResourceAllocationGrid';

// Type Exports
export type { ApprovalWorkflowItem } from './ApprovalWorkflowCard';
export type { BomItemData } from './BomItemEditor';
export type { CostBreakdownData } from './CostBreakdownChart';
export type { TeamMember } from './TeamMemberSelector';
export type { ResourceAllocation } from './ResourceAllocationGrid';
