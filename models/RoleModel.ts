import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';
import { Associations } from '@nozbe/watermelondb/Model';

export default class RoleModel extends Model {
  static table = 'roles';

  static associations: Associations = {
    users: { type: 'has_many', foreignKey: 'role_id' },
  };

  @field('name') name!: string; // Admin, Supervisor, Manager, Planner, Logistics
  @field('description') description!: string;
  @field('permissions') permissions!: string; // JSON string array

  // Helper method to parse permissions
  getPermissions(): string[] {
    try {
      return JSON.parse(this.permissions);
    } catch {
      return [];
    }
  }

  // Helper method to set permissions
  setPermissions(perms: string[]): void {
    this.permissions = JSON.stringify(perms);
  }
}
