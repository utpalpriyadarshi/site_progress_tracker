import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';
import { Associations } from '@nozbe/watermelondb/Model';

export default class SiteModel extends Model {
  static table = 'sites';

  static associations: Associations = {
    projects: { type: 'has_many', foreignKey: 'site_id' },
  };

  @field('name') name!: string;
  @field('address') address!: string;
  @field('city') city!: string;
  @field('state') state!: string;
  @field('country') country!: string;
  @field('postal_code') postalCode!: string;
  @field('status') status!: string; // active, completed, on_hold, cancelled
  @date('start_date') startDate!: Date;
  @date('end_date') endDate!: Date;
  @field('manager_id') managerId!: string;
  @field('supervisor_id') supervisorId!: string;
  @field('description') description!: string;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}