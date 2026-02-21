import { Model } from '@nozbe/watermelondb';
import { field, relation } from '@nozbe/watermelondb/decorators';
import { Associations } from '@nozbe/watermelondb/Model';

/**
 * PDF Generation Status for async queue (Phase B)
 */
export type PdfGenerationStatus =
  | 'pending'       // Not yet attempted
  | 'generating'    // In progress
  | 'completed'     // Successfully generated
  | 'failed'        // Failed after retries
  | 'skipped';      // User chose to skip PDF

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

  // v34: PDF generation status (Phase B: Share Button Photo Issue fix - Async PDF)
  @field('pdf_generation_status') pdfGenerationStatus!: PdfGenerationStatus; // current status of PDF generation
  @field('pdf_generation_attempts') pdfGenerationAttempts!: number; // number of attempts made
  @field('pdf_last_attempt_timestamp') pdfLastAttemptTimestamp?: number; // last attempt timestamp

  // v47: Site overview photos
  @field('images') images?: string; // JSON array of local file paths

  @field('sync_status') appSyncStatus!: string; // pending, synced, failed - maps to sync_status column
  @field('_version') version!: number; // conflict resolution version tracking

  /**
   * Checks if PDF can be retried (failed with attempts remaining)
   */
  get canRetryPdf(): boolean {
    return (
      this.pdfGenerationStatus === 'failed' &&
      this.pdfGenerationAttempts < 3 // Max 3 attempts
    );
  }

  /**
   * Gets user-friendly status message for PDF generation
   */
  get pdfStatusMessage(): string {
    switch (this.pdfGenerationStatus) {
      case 'pending':
        return 'PDF generation pending...';
      case 'generating':
        return 'Generating PDF...';
      case 'completed':
        return 'PDF ready';
      case 'failed':
        return this.canRetryPdf
          ? `PDF failed (${this.pdfGenerationAttempts}/3 attempts) - Tap to retry`
          : 'PDF generation failed';
      case 'skipped':
        return 'PDF skipped';
      default:
        return 'Unknown status';
    }
  }
}
