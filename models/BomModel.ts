import { Model } from '@nozbe/watermelondb';
import { field, children } from '@nozbe/watermelondb/decorators';
import { Associations } from '@nozbe/watermelondb/Model';

/**
 * BomModel - Bill of Materials
 *
 * Supports both Pre-Contract (Estimating) and Post-Contract (Execution) BOMs
 *
 * Pre-Contract BOM Types:
 * - Used for tendering and estimating
 * - Status flow: draft → submitted → won/lost
 *
 * Post-Contract BOM Types:
 * - Used for project execution and delivery
 * - Status flow: baseline → active → closed
 */
export default class BomModel extends Model {
  static table = 'boms';

  static associations: Associations = {
    project: { type: 'belongs_to', key: 'project_id' },
    items: { type: 'has_many', foreignKey: 'bom_id' },
  };

  // Basic Information
  @field('project_id') projectId!: string;
  @field('name') name!: string; // e.g., "Main Tower BOM v1.0"
  @field('type') type!: string; // estimating | execution
  @field('status') status!: string; // draft, submitted, won, lost, baseline, active, closed
  @field('version') version!: string; // v1.0, v2.0, v3.0, v3.1
  @field('quantity') quantity!: number; // e.g., 2 apartments, 5 floors
  @field('unit') unit!: string; // e.g., nos, floors, apartments, units

  // Pre-Contract Fields (for estimating BOMs)
  @field('tender_date') tenderDate?: number; // timestamp
  @field('client') client?: string;
  @field('contract_value') contractValue?: number;
  @field('contingency') contingency!: number; // percentage (e.g., 5 = 5%)
  @field('profit_margin') profitMargin!: number; // percentage (e.g., 10 = 10%)

  // Cost Fields
  @field('total_estimated_cost') totalEstimatedCost!: number;
  @field('total_actual_cost') totalActualCost!: number;

  // Metadata
  @field('description') description?: string;
  @field('created_by') createdBy!: string; // user_id
  @field('created_date') createdDate!: number; // timestamp
  @field('updated_date') updatedDate!: number; // timestamp

  // Sync fields
  @field('sync_status') appSyncStatus!: string; // pending, synced, failed
  @field('_version') _version!: number; // conflict resolution version tracking

  // Relationships
  @children('bom_items') bomItems: any;
}
