import { Model, Q } from '@nozbe/watermelondb';
import { field, relation } from '@nozbe/watermelondb/decorators';
import { Associations } from '@nozbe/watermelondb/Model';
import RoleModel from './RoleModel';

export default class UserModel extends Model {
  static table = 'users';

  static associations: Associations = {
    roles: { type: 'belongs_to', key: 'role_id' },
  };

  @field('username') username!: string;
  @field('password') password!: string; // For mock auth, store plaintext or hashed
  @field('full_name') fullName!: string;
  @field('email') email!: string;
  @field('phone') phone!: string;
  @field('is_active') isActive!: boolean;
  @field('role_id') roleId!: string;

  @relation('roles', 'role_id') role!: RoleModel;

  // Helper method to get role name
  async getRoleName(): Promise<string> {
    const role = await this.role.fetch();
    return role ? role.name : 'Unknown';
  }
}
