import { Model } from '@nozbe/watermelondb';
import { field, relation } from '@nozbe/watermelondb/decorators';
import { Associations } from '@nozbe/watermelondb/Model';
import UserModel from './UserModel';

export default class SessionModel extends Model {
  static table = 'sessions';

  static associations: Associations = {
    users: { type: 'belongs_to', key: 'user_id' },
  };

  @field('user_id') userId!: string;
  @field('access_token') accessToken!: string;
  @field('refresh_token') refreshToken!: string;
  @field('device_info') deviceInfo!: string;
  @field('ip_address') ipAddress!: string;
  @field('expires_at') expiresAt!: number;
  @field('revoked_at') revokedAt!: number;
  @field('is_active') isActive!: boolean;

  @relation('users', 'user_id') user!: UserModel;

  // Helper method to check if session is valid
  isValid(): boolean {
    const now = Date.now();
    return (
      this.isActive &&
      !this.revokedAt &&
      this.expiresAt > now
    );
  }

  // Helper method to check if session is expired
  isExpired(): boolean {
    const now = Date.now();
    return this.expiresAt <= now;
  }
}
