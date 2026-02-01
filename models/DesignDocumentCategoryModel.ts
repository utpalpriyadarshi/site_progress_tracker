import { Model } from '@nozbe/watermelondb';
import { field, children } from '@nozbe/watermelondb/decorators';
import { Associations } from '@nozbe/watermelondb/Model';

/**
 * DesignDocumentCategoryModel - User-defined sub-categories for design documents
 *
 * Each category belongs to a specific document type (simulation_study, installation,
 * product_equipment, as_built) and project.
 *
 * Default Installation categories are seeded on first load:
 * - Layout Plan & Section
 * - Cable Tray Layout
 * - Cable Schedule
 */
export default class DesignDocumentCategoryModel extends Model {
  static table = 'design_document_categories';

  static associations: Associations = {
    projects: { type: 'belongs_to', key: 'project_id' },
    design_documents: { type: 'has_many', foreignKey: 'category_id' },
  };

  @field('name') name!: string;
  @field('document_type') documentType!: string; // simulation_study | installation | product_equipment | as_built
  @field('project_id') projectId!: string;
  @field('is_default') isDefault!: boolean;
  @field('sequence_order') sequenceOrder!: number;
  @field('created_by') createdBy!: string;
  @field('created_at') createdAt!: number;
  @field('updated_at') updatedAt!: number;
  @field('sync_status') appSyncStatus!: string;
  @field('_version') version!: number;

  @children('design_documents') documents: any;
}
