import { Model } from '@nozbe/watermelondb';
import { field, relation } from '@nozbe/watermelondb/decorators';
import { Associations } from '@nozbe/watermelondb/Model';
import UserModel from './UserModel';

/**
 * PasswordHistoryModel
 *
 * Stores historical password hashes to prevent password reuse
 * v2.2 - Activity 1, Week 3, Day 14
 *
 * Security Note:
 * - Stores only password hashes (never plaintext)
 * - Used to enforce "cannot reuse last N passwords" policy
 * - Default policy: Cannot reuse last 5 passwords
 */

export default class PasswordHistoryModel extends Model {
  static table = 'password_history';

  static associations: Associations = {
    users: { type: 'belongs_to', key: 'user_id' },
  };

  @field('user_id') userId!: string;
  @field('password_hash') passwordHash!: string;

  @relation('users', 'user_id') user!: UserModel;

  // Helper method to check if this hash matches a given password
  // Note: Actual comparison should be done with bcrypt.compare()
  // This is just for reference, comparison happens in PasswordResetService
}
