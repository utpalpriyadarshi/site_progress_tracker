import { addColumns } from '@nozbe/watermelondb/Schema/migrations';

/**
 * v39 Migration: Add weightage to design_documents
 *
 * Adds a weightage field so design progress can be computed as
 * a weighted average of document completion per site.
 * Total weightage per site should equal 100%.
 */
export const v39Migration = {
  toVersion: 39,
  steps: [
    addColumns({
      table: 'design_documents',
      columns: [
        { name: 'weightage', type: 'number', isOptional: true },
      ],
    }),
  ],
};
