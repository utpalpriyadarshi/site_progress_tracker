import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, relation } from '@nozbe/watermelondb/decorators';
import { Associations } from '@nozbe/watermelondb/Model';

export type ProjectPhase =
  | 'design'           // Design & Engineering
  | 'approvals'        // Statutory/Utility approvals
  | 'mobilization'     // Resource mobilization to site
  | 'procurement'      // Equipment procurement
  | 'interface'        // Interface coordination
  | 'site_prep'        // Site preparation & civil works
  | 'construction'     // Installation/Construction
  | 'testing'          // Testing & Pre-commissioning
  | 'commissioning'    // Commissioning
  | 'sat'              // Site Acceptance Test
  | 'handover';        // Handover & Documentation

export type DependencyRisk = 'low' | 'medium' | 'high';

export default class ItemModel extends Model {
  static table = 'items';

  static associations: Associations = {
    categories: { type: 'belongs_to', key: 'category_id' },
    sites: { type: 'belongs_to', key: 'site_id' },
    progress_logs: { type: 'has_many', foreignKey: 'item_id' },
    materials: { type: 'has_many', foreignKey: 'item_id' },
    hindrances: { type: 'has_many', foreignKey: 'item_id' },
    schedule_revisions: { type: 'has_many', foreignKey: 'item_id' },
    interface_points: { type: 'has_many', foreignKey: 'item_id' },
  };

  @field('name') name!: string;
  @field('category_id') categoryId!: string; // belongs to category
  @field('site_id') siteId!: string; // belongs to site
  @field('planned_quantity') plannedQuantity!: number;
  @field('completed_quantity') completedQuantity!: number;
  @field('unit_of_measurement') unitOfMeasurement!: string;
  @field('planned_start_date') plannedStartDate!: number; // timestamp
  @field('planned_end_date') plannedEndDate!: number; // timestamp
  @field('status') status!: string; // not_started, in_progress, completed
  @field('weightage') weightage!: number; // percentage of total project

  // Planning module fields (v11)
  @field('baseline_start_date') baselineStartDate?: number;
  @field('baseline_end_date') baselineEndDate?: number;
  @field('dependencies') dependencies?: string; // JSON array of item IDs
  @field('is_baseline_locked') isBaselineLocked!: boolean;
  @field('actual_start_date') actualStartDate?: number;
  @field('actual_end_date') actualEndDate?: number;
  @field('critical_path_flag') criticalPathFlag?: boolean;

  // WBS & Phase Management (v12)
  @field('project_phase') projectPhase!: ProjectPhase;
  @field('is_milestone') isMilestone!: boolean;
  @field('created_by_role') createdByRole!: string; // 'planner' | 'supervisor'

  // WBS Structure (v12)
  @field('wbs_code') wbsCode!: string;
  @field('wbs_level') wbsLevel!: number;
  @field('parent_wbs_code') parentWbsCode?: string;

  // Critical Path & Risk Management (v12)
  @field('is_critical_path') isCriticalPath!: boolean;
  @field('float_days') floatDays?: number;
  @field('dependency_risk') dependencyRisk?: DependencyRisk;
  @field('risk_notes') riskNotes?: string;

  // Sync Management (v18 - Activity 2 prep)
  @field('sync_status') syncStatus!: string; // pending, synced, failed
  @field('_version') version!: number; // conflict resolution version tracking

  // Helper methods for dependencies
  getDependencies(): string[] {
    if (!this.dependencies) return [];
    try {
      return JSON.parse(this.dependencies);
    } catch {
      return [];
    }
  }

  setDependencies(deps: string[]): string {
    return JSON.stringify(deps);
  }

  // Calculate schedule variance (in days)
  getScheduleVariance(): number {
    if (!this.actualEndDate || !this.plannedEndDate) return 0;
    return Math.floor((this.actualEndDate - this.plannedEndDate) / (1000 * 60 * 60 * 24));
  }

  // Calculate planned duration (in days)
  getPlannedDuration(): number {
    return Math.floor((this.plannedEndDate - this.plannedStartDate) / (1000 * 60 * 60 * 24));
  }

  // Calculate actual duration (in days)
  getActualDuration(): number {
    if (!this.actualEndDate || !this.actualStartDate) return 0;
    return Math.floor((this.actualEndDate - this.actualStartDate) / (1000 * 60 * 60 * 24));
  }

  // Calculate baseline variance (in days)
  getBaselineVariance(): number {
    if (!this.baselineEndDate || !this.plannedEndDate) return 0;
    return Math.floor((this.plannedEndDate - this.baselineEndDate) / (1000 * 60 * 60 * 24));
  }

  // Get progress percentage
  getProgressPercentage(): number {
    if (this.plannedQuantity === 0) return 0;
    return Math.min(100, (this.completedQuantity / this.plannedQuantity) * 100);
  }

  // WBS Helper Methods (v12)
  getFormattedWbsCode(): string {
    return this.wbsCode || 'N/A';
  }

  getIndentLevel(): number {
    return Math.max(0, this.wbsLevel - 1);
  }

  getPhaseLabel(): string {
    const labels: Record<ProjectPhase, string> = {
      design: '✏️ Design & Engineering',
      approvals: '📋 Statutory Approvals',
      mobilization: '🚛 Mobilization',
      procurement: '🛒 Procurement',
      interface: '🔗 Interface Coordination',
      site_prep: '🏗️ Site Preparation',
      construction: '🔨 Construction',
      testing: '🧪 Testing',
      commissioning: '⚡ Commissioning',
      sat: '✅ Site Acceptance Test',
      handover: '📦 Handover',
    };
    return labels[this.projectPhase] || 'Unknown';
  }

  getPhaseColor(): string {
    const colors: Record<ProjectPhase, string> = {
      design: '#2196F3',        // Blue
      approvals: '#9C27B0',     // Purple
      mobilization: '#FF5722',  // Deep Orange
      procurement: '#FF9800',   // Orange
      interface: '#00BCD4',     // Cyan
      site_prep: '#795548',     // Brown
      construction: '#4CAF50',  // Green
      testing: '#F44336',       // Red
      commissioning: '#3F51B5', // Indigo
      sat: '#009688',           // Teal
      handover: '#607D8B',      // Blue Grey
    };
    return colors[this.projectPhase] || '#666666';
  }

  isOnCriticalPath(): boolean {
    return this.isCriticalPath || (this.floatDays !== undefined && this.floatDays <= 0);
  }

  getRiskBadgeColor(): string | null {
    if (!this.dependencyRisk) return null;
    const colors: Record<DependencyRisk, string | null> = {
      low: null,          // No badge
      medium: '#FFC107',  // Amber
      high: '#F44336',    // Red
    };
    return colors[this.dependencyRisk];
  }
}