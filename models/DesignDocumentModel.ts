import { Model } from '@nozbe/watermelondb';
import { field, relation } from '@nozbe/watermelondb/decorators';
import { Associations } from '@nozbe/watermelondb/Model';

/**
 * DesignDocumentModel - Design documents with approval workflow
 *
 * Document Types:
 * - simulation_study: Project-wide simulation/study documents
 * - installation: Site-specific installation documents
 * - product_equipment: Project-wide product/equipment application design
 * - as_built: Site-specific as-built design documents
 *
 * Status Workflow: draft → submitted → approved / approved_with_comment / rejected
 */
export default class DesignDocumentModel extends Model {
  static table = 'design_documents';

  static associations: Associations = {
    projects: { type: 'belongs_to', key: 'project_id' },
    design_document_categories: { type: 'belongs_to', key: 'category_id' },
    sites: { type: 'belongs_to', key: 'site_id' },
    key_dates: { type: 'belongs_to', key: 'key_date_id' },
  };

  @field('document_number') documentNumber!: string;
  @field('title') title!: string;
  @field('description') description?: string;
  @field('document_type') documentType!: string; // simulation_study | installation | product_equipment | as_built
  @field('category_id') categoryId!: string;
  @field('project_id') projectId!: string;
  @field('site_id') siteId?: string;
  @field('key_date_id') keyDateId?: string;
  @field('revision_number') revisionNumber!: string;
  @field('status') status!: string; // draft | submitted | approved | approved_with_comment | rejected
  @field('approval_comment') approvalComment?: string;
  @field('submitted_date') submittedDate?: number;
  @field('approved_date') approvedDate?: number;
  @field('weightage') weightage?: number; // Percentage weight for progress tracking (total per site = 100%)
  @field('created_by') createdBy!: string;
  @field('created_at') createdAt!: number;
  @field('updated_at') updatedAt!: number;
  @field('sync_status') appSyncStatus!: string;
  @field('_version') version!: number;

  @relation('projects', 'project_id') project: any;
  @relation('design_document_categories', 'category_id') category: any;
  @relation('sites', 'site_id') site: any;
  @relation('key_dates', 'key_date_id') keyDate: any;

  /**
   * Get status display color
   */
  getStatusColor(): string {
    const colors: Record<string, string> = {
      draft: '#9E9E9E',
      submitted: '#2196F3',
      approved: '#4CAF50',
      approved_with_comment: '#FF9800',
      rejected: '#F44336',
    };
    return colors[this.status] || '#9E9E9E';
  }

  /**
   * Check if document requires a site (installation or as_built)
   */
  requiresSite(): boolean {
    return this.documentType === 'installation' || this.documentType === 'as_built';
  }
}
