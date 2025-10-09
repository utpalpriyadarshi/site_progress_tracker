import { Model } from '@nozbe/watermelondb';
import { field, readonly, relation } from '@nozbe/watermelondb/decorators';
import { Associations } from '@nozbe/watermelondb/Model';

export default class SiteInspectionModel extends Model {
  static table = 'site_inspections';

  static associations: Associations = {
    site: { type: 'belongs_to', key: 'site_id' },
  };

  @field('site_id') siteId!: string; // belongs to site
  @field('inspector_id') inspectorId!: string; // supervisor/inspector user ID
  @field('inspection_date') inspectionDate!: number; // timestamp of inspection
  @field('inspection_type') inspectionType!: string; // daily, weekly, safety, quality
  @field('overall_rating') overallRating!: string; // excellent, good, fair, poor
  @field('checklist_data') checklistData!: string; // JSON string of checklist items with pass/fail/na status
  @field('photos') photos!: string; // JSON string array of photo URIs
  @field('safety_flagged') safetyFlagged!: boolean; // true if safety issues found
  @field('follow_up_date') followUpDate!: number; // timestamp for follow-up inspection (0 if none)
  @field('follow_up_notes') followUpNotes!: string; // notes for follow-up actions
  @field('notes') notes!: string; // overall inspection notes
  @field('sync_status') syncStatus!: string; // pending, synced, failed
}
