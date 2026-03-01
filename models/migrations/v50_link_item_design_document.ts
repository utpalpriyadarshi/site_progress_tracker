import { addColumns } from '@nozbe/watermelondb/Schema/migrations';

export const v50Migration = {
  toVersion: 50,
  steps: [
    addColumns({
      table: 'items',
      columns: [
        // Optional link to a design document that this WBS task produces as its deliverable.
        // Allows the Planning role to see the approval status of a task's design deliverable
        // directly from the WBS screen, without switching to the Design Engineer role.
        { name: 'design_document_id', type: 'string', isOptional: true, isIndexed: true },
      ],
    }),
  ],
};
