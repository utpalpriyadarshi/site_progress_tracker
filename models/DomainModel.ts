import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';
import { Associations } from '@nozbe/watermelondb/Model';

export default class DomainModel extends Model {
  static table = 'domains';

  static associations: Associations = {
    project: { type: 'belongs_to', key: 'project_id' },
    sites: { type: 'has_many', foreignKey: 'domain_id' },
    doors_packages: { type: 'has_many', foreignKey: 'domain_id' },
  };

  @field('name') name!: string;
  @field('project_id') projectId!: string;
  @field('created_at') createdAt!: number;
  @field('sync_status') appSyncStatus!: string;
  @field('_version') version!: number;
}
