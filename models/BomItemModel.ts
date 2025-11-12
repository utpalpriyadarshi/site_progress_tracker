import { Model } from '@nozbe/watermelondb';
import { field, relation } from '@nozbe/watermelondb/decorators';
import { Associations } from '@nozbe/watermelondb/Model';

/**
 * BomItemModel - Individual line items in a Bill of Materials
 *
 * Represents a single material, labor, or equipment entry in the BOM
 * Cost calculation: totalCost = quantity × unitCost
 */
export default class BomItemModel extends Model {
  static table = 'bom_items';

  static associations: Associations = {
    bom: { type: 'belongs_to', key: 'bom_id' },
    material: { type: 'belongs_to', key: 'material_id' }, // optional link to MaterialModel
  };

  // Relationships
  @field('bom_id') bomId!: string;
  @field('material_id') materialId?: string; // optional reference to materials table
  @field('doors_id') doorsId?: string; // optional reference to DOORS package

  // Item Details
  @field('item_code') itemCode!: string; // e.g., "MAT-001", "LAB-002"
  @field('description') description!: string;
  @field('category') category!: string; // material | labor | equipment | subcontractor
  @field('sub_category') subCategory?: string; // concrete, steel, electrical, plumbing, etc.

  // Quantity
  @field('quantity') quantity!: number;
  @field('unit') unit!: string; // m3, kg, hrs, nos, etc.

  // Cost
  @field('unit_cost') unitCost!: number; // cost per unit
  @field('total_cost') totalCost!: number; // quantity × unitCost (auto-calculated)

  // Work Breakdown Structure
  @field('wbs_code') wbsCode?: string; // Work Breakdown Structure code
  @field('phase') phase?: string; // foundation, structure, finishing, etc.

  // Actual Cost Tracking (for execution BOMs)
  @field('actual_quantity') actualQuantity?: number;
  @field('actual_cost') actualCost?: number;

  // Metadata
  @field('notes') notes?: string;
  @field('created_date') createdDate!: number; // timestamp
  @field('updated_date') updatedDate!: number; // timestamp

  // Sync fields
  @field('sync_status') appSyncStatus!: string; // pending, synced, failed
  @field('_version') _version!: number; // conflict resolution version tracking

  // Relationships
  @relation('boms', 'bom_id') bom: any;
}
