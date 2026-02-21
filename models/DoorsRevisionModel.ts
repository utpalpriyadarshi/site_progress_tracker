import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';
import { Associations } from '@nozbe/watermelondb/Model';

/**
 * DoorsRevisionModel - Audit snapshot of a DOORS package state at a point in time.
 *
 * A revision row is written before every edit (field update or status transition)
 * so the full history of changes can be replayed or browsed.
 */
export default class DoorsRevisionModel extends Model {
  static table = 'doors_revisions';

  static associations: Associations = {
    doors_packages: { type: 'belongs_to', key: 'doors_package_id' },
  };

  @field('doors_package_id') doorsPackageId!: string;
  @field('version_number') versionNumber!: number;
  /** JSON snapshot of the package fields at the time of this revision */
  @field('snapshot_json') snapshotJson!: string;
  @field('changed_by_id') changedById!: string;
  @field('changed_at') changedAt!: number;
  @field('change_summary') changeSummary!: string;
}
