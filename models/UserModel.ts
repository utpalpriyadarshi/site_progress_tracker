import { Model } from '@nozbe/watermelondb';
import { field, relation } from '@nozbe/watermelondb/decorators';
import { Associations } from '@nozbe/watermelondb/Model';
import RoleModel from './RoleModel';

export default class UserModel extends Model {
  static table = 'users';

  static associations: Associations = {
    roles: { type: 'belongs_to', key: 'role_id' },
    projects: { type: 'belongs_to', key: 'project_id' },
  };

  @field('username') username!: string;
  @field('password_hash') passwordHash!: string; // Bcrypt hashed password (v2.2)
  @field('full_name') fullName!: string;
  @field('email') email!: string;
  @field('phone') phone!: string;
  @field('is_active') isActive!: boolean;
  @field('role_id') roleId!: string;
  @field('project_id') projectId?: string; // Assigned project (for supervisor role) - v2.9

  @relation('roles', 'role_id') role!: RoleModel;
  @relation('projects', 'project_id') project: any;

  // Helper method to get role name
  async getRoleName(): Promise<string> {
    const role = await this.role.fetch();
    return role ? role.name : 'Unknown';
  }
}
