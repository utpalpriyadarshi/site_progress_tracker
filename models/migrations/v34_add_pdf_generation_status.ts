import { addColumns } from '@nozbe/watermelondb/Schema/migrations';

/**
 * v34: Add PDF generation status tracking for async PDF queue
 * Phase B: Share Button Photo Issue fix - Async PDF Generation
 */
export const v34Migration = {
  toVersion: 34,
  steps: [
    addColumns({
      table: 'daily_reports',
      columns: [
        {
          name: 'pdf_generation_status',
          type: 'string',
          isOptional: false,
        },
        {
          name: 'pdf_generation_attempts',
          type: 'number',
          isOptional: false,
        },
        {
          name: 'pdf_last_attempt_timestamp',
          type: 'number',
          isOptional: true,
        },
      ],
    }),
  ],
};
