import { createTable } from '@nozbe/watermelondb/Schema/migrations';

/**
 * v36 Migration: Add Design Documents tables
 *
 * Design Document Management for Design Engineer role.
 *
 * Tables added:
 * - design_document_categories: User-defined sub-categories per document type
 * - design_documents: Main design documents with approval workflow
 *
 * Document Types: simulation_study, installation, product_equipment, as_built
 * Status Workflow: draft → submitted → approved / approved_with_comment / rejected
 */
export const v36Migration = {
  toVersion: 36,
  steps: [
    // Create design_document_categories lookup table
    createTable({
      name: 'design_document_categories',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'document_type', type: 'string', isIndexed: true }, // simulation_study | installation | product_equipment | as_built
        { name: 'project_id', type: 'string', isIndexed: true },
        { name: 'is_default', type: 'boolean' },
        { name: 'sequence_order', type: 'number' },
        { name: 'created_by', type: 'string', isIndexed: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'sync_status', type: 'string' },
        { name: '_version', type: 'number' },
      ],
    }),
    // Create design_documents table
    createTable({
      name: 'design_documents',
      columns: [
        { name: 'document_number', type: 'string', isIndexed: true },
        { name: 'title', type: 'string' },
        { name: 'description', type: 'string', isOptional: true },
        { name: 'document_type', type: 'string', isIndexed: true }, // simulation_study | installation | product_equipment | as_built
        { name: 'category_id', type: 'string', isIndexed: true }, // FK to design_document_categories
        { name: 'project_id', type: 'string', isIndexed: true },
        { name: 'site_id', type: 'string', isOptional: true, isIndexed: true }, // Required for installation & as_built
        { name: 'revision_number', type: 'string' },
        { name: 'status', type: 'string', isIndexed: true }, // draft | submitted | approved | approved_with_comment | rejected
        { name: 'approval_comment', type: 'string', isOptional: true },
        { name: 'submitted_date', type: 'number', isOptional: true },
        { name: 'approved_date', type: 'number', isOptional: true },
        { name: 'created_by', type: 'string', isIndexed: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'sync_status', type: 'string' },
        { name: '_version', type: 'number' },
      ],
    }),
  ],
};
