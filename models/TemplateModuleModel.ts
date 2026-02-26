import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

export type TemplateCategory = 'substation' | 'ohe' | 'third_rail' | 'building' | 'interface';
export type VoltageLevel = '220kV' | '132kV' | '66kV' | '33kV' | '25kV' | '650VDC';

export interface TemplateItem {
  name: string;
  phase: string;
  duration: number;
  dependencies: string[];
  wbsCode: string;
  isMilestone?: boolean;
  quantity?: number;
  unit?: string;
  weightage?: number;    // % weightage for the activity
  categoryName?: string; // category name (resolved to ID on apply)
  dependencyRisk?: string;
  riskNotes?: string;
}

export default class TemplateModuleModel extends Model {
  static table = 'template_modules';

  @field('name') name!: string;
  @field('category') category!: TemplateCategory;
  @field('voltage_level') voltageLevel?: VoltageLevel;
  @field('items_json') itemsJson!: string; // JSON string of TemplateItem[]
  @field('compatible_modules') compatibleModules!: string; // JSON string of module IDs
  @field('is_predefined') isPredefined!: boolean;
  @field('description') description!: string;

  // Parse items JSON
  getItems(): TemplateItem[] {
    try {
      return JSON.parse(this.itemsJson);
    } catch {
      return [];
    }
  }

  // Parse compatible modules
  getCompatibleModuleIds(): string[] {
    try {
      return JSON.parse(this.compatibleModules);
    } catch {
      return [];
    }
  }

  // Get item count
  getItemCount(): number {
    return this.getItems().length;
  }

  // Get estimated duration
  getEstimatedDuration(): number {
    const items = this.getItems();
    if (items.length === 0) return 0;

    // Simple max duration (actual critical path would need dependency analysis)
    return Math.max(...items.map(item => item.duration));
  }
}
