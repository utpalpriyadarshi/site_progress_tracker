/**
 * Phase Constants
 *
 * Shared constants for project phases used across planning module.
 * Defines standard phase order, labels, and related configurations.
 *
 * @version 1.0.0
 */

/**
 * Standard order of project phases
 * Used for sorting and displaying phases in correct sequence
 */
export const PHASE_ORDER = [
  'design',
  'approvals',
  'mobilization',
  'procurement',
  'interface',
  'site_prep',
  'construction',
  'testing',
  'commissioning',
  'sat',
  'handover',
] as const;

/**
 * Human-readable labels for each project phase
 * Used in UI displays, reports, and exports
 */
export const PHASE_LABELS: Record<string, string> = {
  design: 'Design & Engineering',
  approvals: 'Statutory Approvals',
  mobilization: 'Mobilization',
  procurement: 'Procurement',
  interface: 'Interface Coordination',
  site_prep: 'Site Preparation',
  construction: 'Construction',
  testing: 'Testing',
  commissioning: 'Commissioning',
  sat: 'Site Acceptance Test',
  handover: 'Handover',
  other: 'Other',
};

/**
 * Resource/Team labels for each project phase
 * Used in resource utilization and team management displays
 */
export const PHASE_RESOURCE_LABELS: Record<string, string> = {
  design: 'Design Team',
  approvals: 'Approvals',
  mobilization: 'Mobilization',
  procurement: 'Procurement',
  interface: 'Interface',
  site_prep: 'Site Prep Crew',
  construction: 'Construction Crew',
  testing: 'Testing Team',
  commissioning: 'Commissioning',
  sat: 'SAT Team',
  handover: 'Handover',
  other: 'Other',
};

/**
 * Type for valid phase keys
 */
export type PhaseKey = typeof PHASE_ORDER[number] | 'other';

/**
 * Get label for a phase
 * @param phase - Phase key
 * @param useResourceLabel - Whether to use resource-specific label
 * @returns Human-readable phase label
 */
export function getPhaseLabel(phase: string, useResourceLabel = false): string {
  const labels = useResourceLabel ? PHASE_RESOURCE_LABELS : PHASE_LABELS;
  return labels[phase] || phase;
}

/**
 * Get all phases in standard order
 * @param includeOther - Whether to include 'other' phase at the end
 * @returns Array of phase keys in order
 */
export function getAllPhases(includeOther = false): string[] {
  return includeOther ? [...PHASE_ORDER, 'other'] : [...PHASE_ORDER];
}
