import { Model } from '@nozbe/watermelondb';
import { field, relation } from '@nozbe/watermelondb/decorators';
import { Associations } from '@nozbe/watermelondb/Model';

export default class DailyReportModel extends Model {
  static table = 'daily_reports';

  static associations: Associations = {
    sites: { type: 'belongs_to', key: 'site_id' },
    supervisor: { type: 'belongs_to', key: 'supervisor_id' },
  };

  @field('site_id') siteId!: string; // belongs to site
  @field('supervisor_id') supervisorId!: string; // submitted by supervisor
  @field('report_date') reportDate!: number; // timestamp for the report date
  @field('submitted_at') submittedAt!: number; // timestamp when submitted
  @field('total_items') totalItems!: number; // count of items updated
  @field('total_progress') totalProgress!: number; // overall progress percentage
  @field('pdf_path') pdfPath!: string; // local path to generated PDF
  @field('notes') notes!: string; // overall report notes/summary

  // v33: PDF error tracking (Phase A: Share Button Photo Issue fix)
  @field('pdf_error_message') pdfErrorMessage?: string; // error message when PDF generation fails
  @field('pdf_error_timestamp') pdfErrorTimestamp?: number; // timestamp when PDF error occurred
  @field('pdf_photo_count') pdfPhotoCount?: number; // number of photos in report (for debugging)

  @field('sync_status') appSyncStatus!: string; // pending, synced, failed - maps to sync_status column
  @field('_version') version!: number; // conflict resolution version tracking
}
