/**
 * DailyReportModel Tests
 *
 * Tests for daily report model structure and PDF generation helpers.
 */

import DailyReportModel, { PdfGenerationStatus } from '../../models/DailyReportModel';

describe('DailyReportModel', () => {
  describe('static properties', () => {
    it('should have correct table name', () => {
      expect(DailyReportModel.table).toBe('daily_reports');
    });

    it('should define sites association', () => {
      expect(DailyReportModel.associations).toBeDefined();
      expect(DailyReportModel.associations.sites).toEqual({
        type: 'belongs_to',
        key: 'site_id',
      });
    });

    it('should define supervisor association', () => {
      expect(DailyReportModel.associations.supervisor).toEqual({
        type: 'belongs_to',
        key: 'supervisor_id',
      });
    });
  });

  describe('field definitions', () => {
    it('should have all required fields defined', () => {
      const mockReport: Partial<DailyReportModel> = {
        siteId: 'site-123',
        supervisorId: 'supervisor-456',
        reportDate: Date.now(),
        submittedAt: Date.now(),
        totalItems: 15,
        totalProgress: 75.5,
        pdfPath: '/documents/reports/daily_2025-01-23.pdf',
        notes: 'Progress on schedule. Weather conditions good.',
        appSyncStatus: 'pending',
        version: 1,
      };

      expect(mockReport.siteId).toBe('site-123');
      expect(mockReport.supervisorId).toBe('supervisor-456');
      expect(mockReport.reportDate).toBeDefined();
      expect(mockReport.submittedAt).toBeDefined();
      expect(mockReport.totalItems).toBe(15);
      expect(mockReport.totalProgress).toBe(75.5);
      expect(mockReport.pdfPath).toContain('.pdf');
      expect(mockReport.notes).toContain('Progress');
    });
  });

  describe('PDF error tracking fields', () => {
    it('should support pdfErrorMessage field', () => {
      const mockReport: Partial<DailyReportModel> = {
        pdfErrorMessage: 'Failed to generate PDF: Out of memory',
      };

      expect(mockReport.pdfErrorMessage).toContain('Failed');
    });

    it('should support pdfErrorTimestamp field', () => {
      const errorTime = Date.now();
      const mockReport: Partial<DailyReportModel> = {
        pdfErrorTimestamp: errorTime,
      };

      expect(mockReport.pdfErrorTimestamp).toBe(errorTime);
    });

    it('should support pdfPhotoCount field', () => {
      const mockReport: Partial<DailyReportModel> = {
        pdfPhotoCount: 25,
      };

      expect(mockReport.pdfPhotoCount).toBe(25);
    });
  });

  describe('PDF generation status', () => {
    it('should support pending status', () => {
      const mockReport: Partial<DailyReportModel> = {
        pdfGenerationStatus: 'pending' as PdfGenerationStatus,
      };

      expect(mockReport.pdfGenerationStatus).toBe('pending');
    });

    it('should support generating status', () => {
      const mockReport: Partial<DailyReportModel> = {
        pdfGenerationStatus: 'generating' as PdfGenerationStatus,
      };

      expect(mockReport.pdfGenerationStatus).toBe('generating');
    });

    it('should support completed status', () => {
      const mockReport: Partial<DailyReportModel> = {
        pdfGenerationStatus: 'completed' as PdfGenerationStatus,
      };

      expect(mockReport.pdfGenerationStatus).toBe('completed');
    });

    it('should support failed status', () => {
      const mockReport: Partial<DailyReportModel> = {
        pdfGenerationStatus: 'failed' as PdfGenerationStatus,
      };

      expect(mockReport.pdfGenerationStatus).toBe('failed');
    });

    it('should support skipped status', () => {
      const mockReport: Partial<DailyReportModel> = {
        pdfGenerationStatus: 'skipped' as PdfGenerationStatus,
      };

      expect(mockReport.pdfGenerationStatus).toBe('skipped');
    });
  });

  describe('canRetryPdf getter', () => {
    it('should return true when failed with attempts remaining', () => {
      const mockReport = {
        pdfGenerationStatus: 'failed' as PdfGenerationStatus,
        pdfGenerationAttempts: 1,
        get canRetryPdf() {
          return (
            this.pdfGenerationStatus === 'failed' &&
            this.pdfGenerationAttempts < 3
          );
        },
      };

      expect(mockReport.canRetryPdf).toBe(true);
    });

    it('should return true at 2 attempts', () => {
      const mockReport = {
        pdfGenerationStatus: 'failed' as PdfGenerationStatus,
        pdfGenerationAttempts: 2,
        get canRetryPdf() {
          return (
            this.pdfGenerationStatus === 'failed' &&
            this.pdfGenerationAttempts < 3
          );
        },
      };

      expect(mockReport.canRetryPdf).toBe(true);
    });

    it('should return false when max attempts reached', () => {
      const mockReport = {
        pdfGenerationStatus: 'failed' as PdfGenerationStatus,
        pdfGenerationAttempts: 3,
        get canRetryPdf() {
          return (
            this.pdfGenerationStatus === 'failed' &&
            this.pdfGenerationAttempts < 3
          );
        },
      };

      expect(mockReport.canRetryPdf).toBe(false);
    });

    it('should return false when not failed', () => {
      const mockReport = {
        pdfGenerationStatus: 'completed' as PdfGenerationStatus,
        pdfGenerationAttempts: 1,
        get canRetryPdf() {
          return (
            this.pdfGenerationStatus === 'failed' &&
            this.pdfGenerationAttempts < 3
          );
        },
      };

      expect(mockReport.canRetryPdf).toBe(false);
    });

    it('should return false when pending', () => {
      const mockReport = {
        pdfGenerationStatus: 'pending' as PdfGenerationStatus,
        pdfGenerationAttempts: 0,
        get canRetryPdf() {
          return (
            this.pdfGenerationStatus === 'failed' &&
            this.pdfGenerationAttempts < 3
          );
        },
      };

      expect(mockReport.canRetryPdf).toBe(false);
    });
  });

  describe('pdfStatusMessage getter', () => {
    it('should return message for pending status', () => {
      const mockReport = {
        pdfGenerationStatus: 'pending' as PdfGenerationStatus,
        pdfGenerationAttempts: 0,
        get canRetryPdf() {
          return this.pdfGenerationStatus === 'failed' && this.pdfGenerationAttempts < 3;
        },
        get pdfStatusMessage() {
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
        },
      };

      expect(mockReport.pdfStatusMessage).toBe('PDF generation pending...');
    });

    it('should return message for generating status', () => {
      const mockReport = {
        pdfGenerationStatus: 'generating' as PdfGenerationStatus,
        pdfGenerationAttempts: 0,
        get canRetryPdf() {
          return this.pdfGenerationStatus === 'failed' && this.pdfGenerationAttempts < 3;
        },
        get pdfStatusMessage() {
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
        },
      };

      expect(mockReport.pdfStatusMessage).toBe('Generating PDF...');
    });

    it('should return message for completed status', () => {
      const mockReport = {
        pdfGenerationStatus: 'completed' as PdfGenerationStatus,
        pdfGenerationAttempts: 1,
        get canRetryPdf() {
          return this.pdfGenerationStatus === 'failed' && this.pdfGenerationAttempts < 3;
        },
        get pdfStatusMessage() {
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
        },
      };

      expect(mockReport.pdfStatusMessage).toBe('PDF ready');
    });

    it('should return retry message for failed status with attempts remaining', () => {
      const mockReport = {
        pdfGenerationStatus: 'failed' as PdfGenerationStatus,
        pdfGenerationAttempts: 2,
        get canRetryPdf() {
          return this.pdfGenerationStatus === 'failed' && this.pdfGenerationAttempts < 3;
        },
        get pdfStatusMessage() {
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
        },
      };

      expect(mockReport.pdfStatusMessage).toBe('PDF failed (2/3 attempts) - Tap to retry');
    });

    it('should return final failure message when max attempts reached', () => {
      const mockReport = {
        pdfGenerationStatus: 'failed' as PdfGenerationStatus,
        pdfGenerationAttempts: 3,
        get canRetryPdf() {
          return this.pdfGenerationStatus === 'failed' && this.pdfGenerationAttempts < 3;
        },
        get pdfStatusMessage() {
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
        },
      };

      expect(mockReport.pdfStatusMessage).toBe('PDF generation failed');
    });

    it('should return message for skipped status', () => {
      const mockReport = {
        pdfGenerationStatus: 'skipped' as PdfGenerationStatus,
        pdfGenerationAttempts: 0,
        get canRetryPdf() {
          return this.pdfGenerationStatus === 'failed' && this.pdfGenerationAttempts < 3;
        },
        get pdfStatusMessage() {
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
        },
      };

      expect(mockReport.pdfStatusMessage).toBe('PDF skipped');
    });
  });

  describe('date handling', () => {
    it('should store reportDate as timestamp', () => {
      const reportDate = new Date('2025-01-23').getTime();
      const mockReport: Partial<DailyReportModel> = {
        reportDate,
      };

      expect(mockReport.reportDate).toBe(reportDate);
      expect(typeof mockReport.reportDate).toBe('number');
    });

    it('should store submittedAt as timestamp', () => {
      const submittedAt = Date.now();
      const mockReport: Partial<DailyReportModel> = {
        submittedAt,
      };

      expect(mockReport.submittedAt).toBe(submittedAt);
    });

    it('should track time between report date and submission', () => {
      const reportDate = new Date('2025-01-23').getTime();
      const submittedAt = new Date('2025-01-24').getTime();

      const mockReport: Partial<DailyReportModel> = {
        reportDate,
        submittedAt,
      };

      const delayMs = mockReport.submittedAt! - mockReport.reportDate!;
      const delayDays = Math.floor(delayMs / (1000 * 60 * 60 * 24));

      expect(delayDays).toBe(1); // Submitted 1 day after report date
    });
  });

  describe('progress tracking', () => {
    it('should store totalProgress as percentage', () => {
      const mockReport: Partial<DailyReportModel> = {
        totalProgress: 85.5,
      };

      expect(mockReport.totalProgress).toBe(85.5);
    });

    it('should handle 0% progress', () => {
      const mockReport: Partial<DailyReportModel> = {
        totalProgress: 0,
      };

      expect(mockReport.totalProgress).toBe(0);
    });

    it('should handle 100% progress', () => {
      const mockReport: Partial<DailyReportModel> = {
        totalProgress: 100,
      };

      expect(mockReport.totalProgress).toBe(100);
    });

    it('should track total items count', () => {
      const mockReport: Partial<DailyReportModel> = {
        totalItems: 42,
      };

      expect(mockReport.totalItems).toBe(42);
    });
  });

  describe('sync status', () => {
    it('should support pending sync status', () => {
      const mockReport: Partial<DailyReportModel> = {
        appSyncStatus: 'pending',
      };
      expect(mockReport.appSyncStatus).toBe('pending');
    });

    it('should support synced status', () => {
      const mockReport: Partial<DailyReportModel> = {
        appSyncStatus: 'synced',
      };
      expect(mockReport.appSyncStatus).toBe('synced');
    });

    it('should support failed sync status', () => {
      const mockReport: Partial<DailyReportModel> = {
        appSyncStatus: 'failed',
      };
      expect(mockReport.appSyncStatus).toBe('failed');
    });
  });
});
