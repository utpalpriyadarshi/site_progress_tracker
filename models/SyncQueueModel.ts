import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

/**
 * SyncQueue Model
 *
 * Tracks local changes that need to be synced to the server.
 * Acts as a queue for offline changes.
 *
 * Schema v19 - Week 6, Day 1
 */
export default class SyncQueueModel extends Model {
  static table = 'sync_queue';

  @field('table_name') tableName!: string; // projects, sites, items, etc.
  @field('record_id') recordId!: string; // ID of the record
  @field('action') action!: 'create' | 'update' | 'delete';
  @field('data') data!: string; // JSON string of record data
  @field('synced_at') syncedAt?: number; // timestamp when synced (null if pending)
  @field('retry_count') retryCount!: number; // number of retry attempts
  @field('last_error') lastError?: string; // error message if sync failed

  /**
   * Check if this queue item is pending (not yet synced)
   */
  get isPending(): boolean {
    return !this.syncedAt;
  }

  /**
   * Check if this queue item needs retry
   */
  get needsRetry(): boolean {
    return !!this.lastError && this.retryCount < 3; // max 3 retries
  }

  /**
   * Get the parsed data as an object
   */
  getParsedData<T = any>(): T | null {
    try {
      return JSON.parse(this.data) as T;
    } catch (error) {
      console.error('Failed to parse sync queue data:', error);
      return null;
    }
  }

  /**
   * Mark as synced
   */
  async markAsSynced() {
    await this.update((record) => {
      record.syncedAt = Date.now();
      record.lastError = undefined;
    });
  }

  /**
   * Mark as failed with error
   */
  async markAsFailed(error: string) {
    await this.update((record) => {
      record.retryCount += 1;
      record.lastError = error;
    });
  }
}
