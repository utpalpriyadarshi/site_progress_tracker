import { Model } from '@nozbe/watermelondb';
import { field, relation } from '@nozbe/watermelondb/decorators';
import { Associations } from '@nozbe/watermelondb/Model';

export type InterfaceType = 'handover' | 'approval' | 'information';
export type InterfaceStatus = 'pending' | 'in_progress' | 'resolved' | 'blocked';

export default class InterfacePointModel extends Model {
  static table = 'interface_points';

  static associations: Associations = {
    items: { type: 'belongs_to', key: 'item_id' },
  };

  @field('item_id') itemId!: string;
  @field('from_contractor') fromContractor!: string;
  @field('to_contractor') toContractor!: string;
  @field('interface_type') interfaceType!: InterfaceType;
  @field('status') status!: InterfaceStatus;
  @field('target_date') targetDate?: number;
  @field('actual_date') actualDate?: number;
  @field('notes') notes?: string;

  // Check if interface is overdue
  isOverdue(): boolean {
    if (!this.targetDate || this.status === 'resolved') return false;
    return Date.now() > this.targetDate;
  }

  // Get days overdue
  getDaysOverdue(): number {
    if (!this.isOverdue() || !this.targetDate) return 0;
    const diffMs = Date.now() - this.targetDate;
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  // Get status color for UI
  getStatusColor(): string {
    const colors: Record<InterfaceStatus, string> = {
      pending: '#FFC107',     // Amber
      in_progress: '#2196F3', // Blue
      resolved: '#4CAF50',    // Green
      blocked: '#F44336',     // Red
    };
    return colors[this.status] || '#666666';
  }

  // Get type label
  getTypeLabel(): string {
    const labels: Record<InterfaceType, string> = {
      handover: '🔄 Handover',
      approval: '✅ Approval',
      information: 'ℹ️ Information',
    };
    return labels[this.interfaceType] || 'Unknown';
  }
}
