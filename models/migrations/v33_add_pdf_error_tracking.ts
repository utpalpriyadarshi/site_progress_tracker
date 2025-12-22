import { addColumns } from '@nozbe/watermelondb/Schema/migrations';

/**
 * v33: Add PDF error tracking columns to daily_reports table
 *
 * Changes:
 * - ADD: daily_reports.pdf_error_message (optional string)
 *   Stores error message when PDF generation fails
 * - ADD: daily_reports.pdf_error_timestamp (optional number)
 *   Timestamp when PDF error occurred
 * - ADD: daily_reports.pdf_photo_count (optional number)
 *   Number of photos in report (for debugging photo-related PDF failures)
 *
 * Purpose: Enable debugging of PDF sharing failures (Phase A of Share Button Photo Issue fix)
 */

export const v33Migration = {
  toVersion: 33,
  steps: [
    // Add PDF error tracking columns to daily_reports table
    addColumns({
      table: 'daily_reports',
      columns: [
        { name: 'pdf_error_message', type: 'string', isOptional: true },
        { name: 'pdf_error_timestamp', type: 'number', isOptional: true },
        { name: 'pdf_photo_count', type: 'number', isOptional: true },
      ],
    }),
  ],
};
