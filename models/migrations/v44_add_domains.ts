import { addColumns, createTable } from '@nozbe/watermelondb/Schema/migrations';

/**
 * v44 Migration: Add Domains entity
 *
 * Introduces the Domain concept: Project → Domains → Sites.
 * Domains replace hardcoded DOORS categories and provide a grouping mechanism for Sites.
 * Default domains: Simulation Studies, OHE, PSY, SCADA, Civil
 */
export const v44Migration = {
  toVersion: 44,
  steps: [
    createTable({
      name: 'domains',
      columns: [
        { name: 'name', type: 'string' as const },
        { name: 'project_id', type: 'string' as const, isIndexed: true },
        { name: 'created_at', type: 'number' as const },
        { name: 'sync_status', type: 'string' as const },
        { name: '_version', type: 'number' as const },
      ],
    }),
    addColumns({
      table: 'sites',
      columns: [
        { name: 'domain_id', type: 'string' as const, isOptional: true, isIndexed: true },
      ],
    }),
    addColumns({
      table: 'doors_packages',
      columns: [
        { name: 'domain_id', type: 'string' as const, isOptional: true, isIndexed: true },
      ],
    }),
  ],
};
