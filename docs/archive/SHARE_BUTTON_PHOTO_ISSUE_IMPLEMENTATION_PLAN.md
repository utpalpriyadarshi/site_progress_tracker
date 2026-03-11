# Share Button Photo Issue - Implementation Plan

**Document Version**: 1.0
**Created**: December 20, 2025
**Status**: Ready for Implementation
**Related Documents**:
- SHARE_BUTTON_PHOTO_ISSUE_ANALYSIS_V1.1.md (Root Cause Analysis)
- SUPERVISOR_IMPROVEMENTS_ROADMAP.md (Completed Refactoring)

---

## Executive Summary

This document provides a phase-by-phase implementation guide for resolving PDF sharing failures when reports contain photos. The plan leverages the completed Phase 1-3 refactoring work and follows a progressive enhancement approach.

**Implementation Approach**: Three sequential phases
- **Phase A** (CRITICAL): Logging & Diagnostics (1-2 days)
- **Phase B** (HIGH): Async PDF Generation (4-5 days)
- **Phase C** (OPTIONAL): Photo Compression (7-12 days)

**Minimum Viable Fix**: Phase A + Phase B (5-7 days total)

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Phase A: Logging & Diagnostics (1-2 Days)](#phase-a-logging--diagnostics-1-2-days)
3. [Phase B: Async PDF Generation (4-5 Days)](#phase-b-async-pdf-generation-4-5-days)
4. [Phase C: Photo Compression (7-12 Days)](#phase-c-photo-compression-7-12-days)
5. [Testing Strategy](#testing-strategy)
6. [Rollback Procedures](#rollback-procedures)
7. [Monitoring & Validation](#monitoring--validation)

---

## Prerequisites

### Required Knowledge
- WatermelonDB schema migrations
- React Native async operations
- LoggingService usage patterns (from Phase 1)
- Shared components (FormDialog, LoadingOverlay, etc. from Phase 2)
- useReducer state management patterns (from Phase 2)

### Development Environment
- Android/iOS device or emulator
- Test reports with varying photo counts (0, 1, 5, 10+ photos)
- Network throttling tools for offline testing

### Code Review
Before starting, read these files:
- `src/services/ReportPdfService.ts` (PDF generation logic)
- `src/hooks/useReportSync.ts` (report submission flow)
- `src/screens/supervisor/ReportsHistoryScreen.tsx` (reports list UI)
- `src/database/models/DailyReportModel.ts` (report schema)
- `src/services/LoggingService.ts` (logging patterns)

---

## Phase A: Logging & Diagnostics (1-2 Days)

**Goal**: Enable debugging of PDF failures with structured logging and enhanced error metadata.

**Estimated Effort**: 8-10 hours
**Priority**: CRITICAL (blocks Phase B debugging)

### A.1: Migrate ReportPdfService to LoggingService

**Time**: 30 min - 1 hour
**File**: `src/services/ReportPdfService.ts`

#### Current State (Lines to Replace)

```typescript
// ❌ OLD - Lines 42, 65, 95, 145, 185, 220, 275
console.log('✅ Created Documents directory:', documentsPath);
console.log('📄 Generating PDF:', fileName);
console.error('❌ Error generating PDF:', error);
console.log('Generated HTML length:', html.length);
```

#### Implementation Steps

**Step 1**: Import LoggingService at top of file

```typescript
import { LoggingService } from './LoggingService';

class ReportPdfService {
  private logger: LoggingService;

  constructor() {
    this.logger = LoggingService.getInstance();
  }

  // ... rest of class
}
```

**Step 2**: Replace console.log statements (8 locations)

```typescript
// ✅ NEW - Info level
this.logger.info('Created Documents directory', {
  component: 'ReportPdfService',
  action: 'ensureDirectoryExists',
  documentsPath,
});

this.logger.info('Starting PDF generation', {
  component: 'ReportPdfService',
  action: 'generateComprehensiveReport',
  fileName,
  reportDate: reportData.date,
  itemCount: reportData.items.length,
});

this.logger.info('Generated HTML for PDF', {
  component: 'ReportPdfService',
  action: 'generateHtml',
  htmlLength: html.length,
  hasPhotos: reportData.items.some(i => i.progressLog?.photos?.length > 0),
});
```

**Step 3**: Replace console.error statements (3 locations)

```typescript
// ✅ NEW - Error level with structured metadata
this.logger.error('PDF generation failed', error as Error, {
  component: 'ReportPdfService',
  action: 'generateComprehensiveReport',
  fileName,
  reportDate: reportData.date,
  itemCount: reportData.items.length,
  photoCount: this.calculatePhotoCount(reportData.items),
  errorType: error.name,
  errorMessage: error.message,
});

this.logger.error('HTML to PDF conversion failed', error as Error, {
  component: 'ReportPdfService',
  action: 'convertHtmlToPdf',
  fileName,
  htmlLength: html.length,
  hasPhotos: reportData.items.some(i => i.progressLog?.photos?.length > 0),
});
```

**Step 4**: Add helper method for photo counting

```typescript
private calculatePhotoCount(items: any[]): number {
  return items.reduce((total, item) => {
    const photos = item.progressLog?.photos || [];
    return total + photos.length;
  }, 0);
}
```

**Checklist**:
- [ ] Import LoggingService
- [ ] Add logger instance to class
- [ ] Replace all 8 console.log statements
- [ ] Replace all 3 console.error statements
- [ ] Add calculatePhotoCount helper
- [ ] Remove all console.* statements
- [ ] Test: Verify logs appear in LogViewer screen

---

### A.2: Add Enhanced Error Metadata

**Time**: 2-3 hours
**Files**:
- `src/services/ReportPdfService.ts`
- `src/hooks/useReportSync.ts`

#### A.2.1: Add Photo Path Validation

**File**: `src/services/ReportPdfService.ts`

Add new method before `generateComprehensiveReport`:

```typescript
/**
 * Validates photo paths and logs suspicious entries
 */
private validatePhotoPaths(items: any[]): {
  totalPhotos: number;
  validPhotos: number;
  invalidPhotos: string[];
  warnings: string[];
} {
  const result = {
    totalPhotos: 0,
    validPhotos: 0,
    invalidPhotos: [] as string[],
    warnings: [] as string[],
  };

  items.forEach((item, itemIndex) => {
    const photos = item.progressLog?.photos || [];
    photos.forEach((photo: string, photoIndex: number) => {
      result.totalPhotos++;

      // Check if path exists
      if (!photo || photo.trim() === '') {
        result.invalidPhotos.push(`Item ${itemIndex}, Photo ${photoIndex}: Empty path`);
        return;
      }

      // Check file extension
      const ext = photo.toLowerCase().split('.').pop();
      if (!['jpg', 'jpeg', 'png', 'heic'].includes(ext || '')) {
        result.warnings.push(`Item ${itemIndex}, Photo ${photoIndex}: Unexpected extension .${ext}`);
      }

      // Check path format
      if (!photo.startsWith('file://') && !photo.startsWith('/')) {
        result.warnings.push(`Item ${itemIndex}, Photo ${photoIndex}: Unusual path format ${photo.substring(0, 20)}...`);
      }

      result.validPhotos++;
    });
  });

  return result;
}
```

#### A.2.2: Use Photo Validation in PDF Generation

Update `generateComprehensiveReport` method:

```typescript
async generateComprehensiveReport(reportData: any): Promise<string> {
  const fileName = `report_${reportData.date.replace(/\//g, '-')}_${Date.now()}.pdf`;

  // Add photo validation
  const photoValidation = this.validatePhotoPaths(reportData.items);

  this.logger.info('Starting PDF generation', {
    component: 'ReportPdfService',
    action: 'generateComprehensiveReport',
    fileName,
    reportDate: reportData.date,
    itemCount: reportData.items.length,
    totalPhotos: photoValidation.totalPhotos,
    validPhotos: photoValidation.validPhotos,
    invalidPhotos: photoValidation.invalidPhotos.length,
    warnings: photoValidation.warnings.length,
  });

  // Log validation issues if any
  if (photoValidation.invalidPhotos.length > 0) {
    this.logger.warn('Invalid photo paths detected', {
      component: 'ReportPdfService',
      action: 'generateComprehensiveReport',
      fileName,
      invalidPaths: photoValidation.invalidPhotos,
    });
  }

  if (photoValidation.warnings.length > 0) {
    this.logger.warn('Photo path warnings', {
      component: 'ReportPdfService',
      action: 'generateComprehensiveReport',
      fileName,
      warnings: photoValidation.warnings,
    });
  }

  // ... rest of method
}
```

**Checklist**:
- [ ] Add validatePhotoPaths method
- [ ] Call validation before PDF generation
- [ ] Log validation results
- [ ] Log warnings for suspicious paths
- [ ] Test: Create report with mix of valid/invalid photos
- [ ] Verify validation metadata in logs

---

#### A.2.3: Enhance useReportSync Error Handling

**File**: `src/hooks/useReportSync.ts`

Find the PDF generation catch block (around line 169-177):

```typescript
// ❌ OLD
catch (pdfError) {
  logger.error('PDF generation failed', pdfError as Error, {
    component: 'useReportSync',
    action: 'submitReports',
    siteId,
  });
  onWarning('Report saved but PDF generation failed');
  // pdfPath remains '' - continues execution
}
```

Replace with enhanced error metadata:

```typescript
// ✅ NEW
catch (pdfError) {
  // Count photos for diagnostics
  const photoCount = reportData.items.reduce((total, item) => {
    const photos = item.progressLog?.photos || [];
    return total + photos.length;
  }, 0);

  logger.error('PDF generation failed', pdfError as Error, {
    component: 'useReportSync',
    action: 'submitReports',
    siteId,
    reportDate: reportData.date,
    itemCount: reportData.items.length,
    photoCount,
    hasPhotos: photoCount > 0,
    errorType: (pdfError as Error).name,
    errorMessage: (pdfError as Error).message,
    stack: (pdfError as Error).stack?.split('\n').slice(0, 3).join('\n'), // First 3 lines
  });

  onWarning(
    photoCount > 0
      ? `Report saved but PDF generation failed (${photoCount} photos may be causing issues)`
      : 'Report saved but PDF generation failed'
  );

  // pdfPath remains '' - continues execution
}
```

**Checklist**:
- [ ] Add photo counting to error handler
- [ ] Add error metadata (type, message, stack)
- [ ] Update user warning message with photo count
- [ ] Test: Trigger PDF failure with 0 photos
- [ ] Test: Trigger PDF failure with 10 photos
- [ ] Verify enhanced metadata in logs

---

### A.3: Add Photo Metadata Logging

**Time**: 1-2 hours
**File**: `src/services/ReportPdfService.ts`

Add detailed photo metadata to diagnose size/path issues.

#### A.3.1: Create Photo Metadata Collector

Add new method to ReportPdfService:

```typescript
import RNFS from 'react-native-fs';

/**
 * Collects metadata about photos for diagnostics
 */
private async collectPhotoMetadata(items: any[]): Promise<{
  totalSize: number;
  photoDetails: Array<{
    itemIndex: number;
    photoIndex: number;
    path: string;
    exists: boolean;
    size: number;
    extension: string;
  }>;
  errors: string[];
}> {
  const result = {
    totalSize: 0,
    photoDetails: [] as any[],
    errors: [] as string[],
  };

  for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
    const photos = items[itemIndex].progressLog?.photos || [];

    for (let photoIndex = 0; photoIndex < photos.length; photoIndex++) {
      const photoPath = photos[photoIndex];

      try {
        // Check if file exists and get size
        const exists = await RNFS.exists(photoPath);
        let size = 0;

        if (exists) {
          const stat = await RNFS.stat(photoPath);
          size = parseInt(stat.size, 10);
          result.totalSize += size;
        }

        const extension = photoPath.toLowerCase().split('.').pop() || 'unknown';

        result.photoDetails.push({
          itemIndex,
          photoIndex,
          path: photoPath.substring(photoPath.length - 40), // Last 40 chars
          exists,
          size,
          extension,
        });

      } catch (error) {
        result.errors.push(
          `Item ${itemIndex}, Photo ${photoIndex}: ${(error as Error).message}`
        );
      }
    }
  }

  return result;
}
```

#### A.3.2: Log Photo Metadata During Generation

Update `generateComprehensiveReport`:

```typescript
async generateComprehensiveReport(reportData: any): Promise<string> {
  const fileName = `report_${reportData.date.replace(/\//g, '-')}_${Date.now()}.pdf`;

  // Existing validation
  const photoValidation = this.validatePhotoPaths(reportData.items);

  // NEW: Collect photo metadata
  const photoMetadata = await this.collectPhotoMetadata(reportData.items);

  this.logger.info('Starting PDF generation with photo metadata', {
    component: 'ReportPdfService',
    action: 'generateComprehensiveReport',
    fileName,
    reportDate: reportData.date,
    itemCount: reportData.items.length,

    // Validation results
    totalPhotos: photoValidation.totalPhotos,
    validPhotos: photoValidation.validPhotos,
    invalidPhotos: photoValidation.invalidPhotos.length,

    // Photo metadata
    totalPhotoSize: photoMetadata.totalSize,
    totalPhotoSizeMB: (photoMetadata.totalSize / 1024 / 1024).toFixed(2),
    photoDetails: photoMetadata.photoDetails.slice(0, 10), // First 10 photos
    metadataErrors: photoMetadata.errors,
  });

  // ... rest of method
}
```

**Checklist**:
- [ ] Add RNFS import if not already present
- [ ] Add collectPhotoMetadata method
- [ ] Call metadata collection in generateComprehensiveReport
- [ ] Log metadata with size and existence checks
- [ ] Test: Generate PDF with 5 photos
- [ ] Verify photo metadata in logs (sizes, paths, existence)
- [ ] Test: Generate PDF with missing photo file
- [ ] Verify error is logged in metadataErrors

---

### A.4: Database Migration for Error Tracking

**Time**: 1 hour
**Files**:
- `src/database/migrations/v33_add_pdf_error_tracking.ts` (new)
- `src/database/schema.ts`
- `src/database/models/DailyReportModel.ts`

#### A.4.1: Create Migration v33

Create new file `src/database/migrations/v33_add_pdf_error_tracking.ts`:

```typescript
import { schemaMigrations } from '@nozbe/watermelondb/Schema/migrations';

export const v33Migration = schemaMigrations({
  migrations: [
    {
      toVersion: 33,
      steps: [
        {
          type: 'add_columns',
          table: 'daily_reports',
          columns: [
            { name: 'pdf_error_message', type: 'string', isOptional: true },
            { name: 'pdf_error_timestamp', type: 'number', isOptional: true },
            { name: 'pdf_photo_count', type: 'number', isOptional: true },
          ],
        },
      ],
    },
  ],
});
```

#### A.4.2: Update Schema

**File**: `src/database/schema.ts`

Find the `daily_reports` table definition and update version:

```typescript
// ❌ OLD
export const appSchema = appSchema({
  version: 32, // Current version
  tables: [
    // ...
  ]
});

// ✅ NEW
export const appSchema = appSchema({
  version: 33, // Updated version
  tables: [
    // ...
    tableSchema({
      name: 'daily_reports',
      columns: [
        // ... existing columns ...
        { name: 'pdf_path', type: 'string', isOptional: true },

        // NEW: Error tracking columns
        { name: 'pdf_error_message', type: 'string', isOptional: true },
        { name: 'pdf_error_timestamp', type: 'number', isOptional: true },
        { name: 'pdf_photo_count', type: 'number', isOptional: true },
      ],
    }),
  ],
});
```

#### A.4.3: Update DailyReportModel

**File**: `src/database/models/DailyReportModel.ts`

Add new fields to model:

```typescript
export class DailyReport extends Model {
  static table = 'daily_reports';

  // ... existing fields ...

  @field('pdf_path') pdfPath?: string;

  // NEW: Error tracking fields
  @field('pdf_error_message') pdfErrorMessage?: string;
  @field('pdf_error_timestamp') pdfErrorTimestamp?: number;
  @field('pdf_photo_count') pdfPhotoCount?: number;

  // ... rest of model ...
}
```

#### A.4.4: Update useReportSync to Store Error Info

**File**: `src/hooks/useReportSync.ts`

Update the PDF error catch block:

```typescript
catch (pdfError) {
  const photoCount = reportData.items.reduce((total, item) => {
    const photos = item.progressLog?.photos || [];
    return total + photos.length;
  }, 0);

  logger.error('PDF generation failed', pdfError as Error, {
    component: 'useReportSync',
    action: 'submitReports',
    siteId,
    reportDate: reportData.date,
    photoCount,
  });

  // NEW: Store error info in database
  const errorInfo = {
    pdfErrorMessage: (pdfError as Error).message || 'Unknown PDF error',
    pdfErrorTimestamp: Date.now(),
    pdfPhotoCount: photoCount,
  };

  // Update report creation to include error info
  pdfPath = ''; // PDF generation failed

  // Store errorInfo alongside pdfPath
  // (Implementation depends on how you create the report record)

  onWarning(
    photoCount > 0
      ? `Report saved but PDF generation failed (${photoCount} photos)`
      : 'Report saved but PDF generation failed'
  );
}
```

Then in the report creation section:

```typescript
await database.write(async () => {
  const report = await reportsCollection.create((r: any) => {
    r.date = reportData.date;
    r.siteName = reportData.siteName;
    r.pdfPath = pdfPath;

    // NEW: Add error tracking fields
    if (pdfPath === '' && errorInfo) {
      r.pdfErrorMessage = errorInfo.pdfErrorMessage;
      r.pdfErrorTimestamp = errorInfo.pdfErrorTimestamp;
      r.pdfPhotoCount = errorInfo.pdfPhotoCount;
    }

    // ... rest of fields ...
  });
});
```

**Checklist**:
- [ ] Create v33 migration file
- [ ] Update schema version to 33
- [ ] Add three new columns to schema
- [ ] Update DailyReportModel with new fields
- [ ] Update useReportSync to capture error info
- [ ] Store error data when PDF generation fails
- [ ] Test: Trigger PDF failure
- [ ] Verify error info is stored in database
- [ ] Check migration runs successfully on app restart

---

### A.5: Phase A Testing & Validation

**Time**: 2-3 hours

#### Test Cases

**TC-A1: Basic Logging Migration**
```
Test: Generate PDF without photos
Expected: All logs use LoggingService (check LogViewer screen)
Verify: No console.* statements remain in ReportPdfService
```

**TC-A2: Photo Validation**
```
Test: Generate PDF with 5 valid photos
Expected: Logs show totalPhotos=5, validPhotos=5, invalidPhotos=0
Verify: Photo paths validated correctly

Test: Generate PDF with empty photo path
Expected: Logs show invalidPhotos=1 with details
Verify: Warning logged for invalid path
```

**TC-A3: Photo Metadata Collection**
```
Test: Generate PDF with 3 photos (known sizes)
Expected: Logs show total size, individual file sizes, all exist=true
Verify: Photo metadata accurate

Test: Generate PDF with deleted photo file
Expected: Logs show exists=false for that photo
Verify: Error captured in metadataErrors
```

**TC-A4: Error Tracking Database**
```
Test: Force PDF failure (e.g., invalid report data)
Expected: Report created with pdf_error_message, pdf_error_timestamp, pdf_photo_count
Verify: Database fields populated
Query: SELECT pdf_error_message FROM daily_reports WHERE pdf_path = ''
```

**TC-A5: End-to-End Logging**
```
Test: Submit report with 10 photos
Expected: Complete log trail from useReportSync through ReportPdfService
Verify: All logs have consistent metadata (reportDate, itemCount, photoCount)
Check: Log sequence shows validation → metadata → generation → success/failure
```

#### Testing Procedure

1. **Environment Setup**
   ```bash
   # Clear existing logs
   # Clear app data or reinstall
   npm run android  # or ios
   ```

2. **Create Test Reports**
   - Report A: 0 photos (baseline)
   - Report B: 1 photo (5 MB)
   - Report C: 5 photos (25 MB total)
   - Report D: 10 photos (50 MB total)
   - Report E: 1 deleted photo (file doesn't exist)

3. **Execute Tests**
   - Submit each report
   - Navigate to Settings → View Logs
   - Export logs for analysis
   - Check database with SQLite viewer

4. **Validation Checklist**
   - [ ] All console.* replaced with LoggingService
   - [ ] Photo validation logs appear
   - [ ] Photo metadata includes sizes and paths
   - [ ] Error tracking fields populate on failure
   - [ ] Migration v33 runs successfully
   - [ ] No app crashes during testing

#### Success Criteria

- ✅ 100% of console.* statements migrated
- ✅ Photo validation catches at least 1 test case with invalid paths
- ✅ Photo metadata shows file sizes within 10% accuracy
- ✅ Database migration succeeds on 3 test devices
- ✅ Error tracking captures failure message and photo count
- ✅ Log sequence is complete for all test reports
- ✅ No performance degradation (PDF generation time < 5% slower)

---

## Phase B: Async PDF Generation (4-5 Days)

**Goal**: Move PDF generation to background queue with retry mechanism, eliminating blocking UI and improving reliability.

**Estimated Effort**: 22-28 hours
**Priority**: HIGH (enables production reliability)

### B.1: Database Schema Updates

**Time**: 1-2 hours
**Files**:
- `src/database/migrations/v34_add_pdf_generation_status.ts` (new)
- `src/database/schema.ts`
- `src/database/models/DailyReportModel.ts`

#### B.1.1: Create Migration v34

Create new file `src/database/migrations/v34_add_pdf_generation_status.ts`:

```typescript
import { schemaMigrations } from '@nozbe/watermelondb/Schema/migrations';

export const v34Migration = schemaMigrations({
  migrations: [
    {
      toVersion: 34,
      steps: [
        {
          type: 'add_columns',
          table: 'daily_reports',
          columns: [
            {
              name: 'pdf_generation_status',
              type: 'string',
              isOptional: false,
              default: 'pending'
            },
            {
              name: 'pdf_generation_attempts',
              type: 'number',
              isOptional: false,
              default: 0
            },
            {
              name: 'pdf_last_attempt_timestamp',
              type: 'number',
              isOptional: true
            },
          ],
        },
      ],
    },
  ],
});
```

#### B.1.2: Update Schema to v34

**File**: `src/database/schema.ts`

```typescript
export const appSchema = appSchema({
  version: 34, // Increment from 33
  tables: [
    tableSchema({
      name: 'daily_reports',
      columns: [
        // ... existing columns from v33 ...
        { name: 'pdf_error_message', type: 'string', isOptional: true },
        { name: 'pdf_error_timestamp', type: 'number', isOptional: true },
        { name: 'pdf_photo_count', type: 'number', isOptional: true },

        // NEW v34 columns
        { name: 'pdf_generation_status', type: 'string', isOptional: false },
        { name: 'pdf_generation_attempts', type: 'number', isOptional: false },
        { name: 'pdf_last_attempt_timestamp', type: 'number', isOptional: true },
      ],
    }),
  ],
});
```

#### B.1.3: Update DailyReportModel

**File**: `src/database/models/DailyReportModel.ts`

```typescript
// Add type definition at top of file
export type PdfGenerationStatus =
  | 'pending'       // Not yet attempted
  | 'generating'    // In progress
  | 'completed'     // Successfully generated
  | 'failed'        // Failed after retries
  | 'skipped';      // User chose to skip PDF

export class DailyReport extends Model {
  static table = 'daily_reports';

  // ... existing fields ...

  // Phase A fields
  @field('pdf_error_message') pdfErrorMessage?: string;
  @field('pdf_error_timestamp') pdfErrorTimestamp?: number;
  @field('pdf_photo_count') pdfPhotoCount?: number;

  // NEW Phase B fields
  @field('pdf_generation_status') pdfGenerationStatus!: PdfGenerationStatus;
  @field('pdf_generation_attempts') pdfGenerationAttempts!: number;
  @field('pdf_last_attempt_timestamp') pdfLastAttemptTimestamp?: number;

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
   * Gets user-friendly status message
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

  // ... rest of model ...
}
```

**Checklist**:
- [ ] Create v34 migration file
- [ ] Update schema version to 34
- [ ] Add pdf_generation_status column (string, default 'pending')
- [ ] Add pdf_generation_attempts column (number, default 0)
- [ ] Add pdf_last_attempt_timestamp column (optional number)
- [ ] Add PdfGenerationStatus type definition
- [ ] Update DailyReportModel with new fields
- [ ] Add canRetryPdf computed property
- [ ] Add pdfStatusMessage computed property
- [ ] Test migration on clean install
- [ ] Test migration on upgrade from v33

---

### B.2: Create Background PDF Queue Service

**Time**: 3-4 hours
**File**: `src/services/BackgroundPdfQueue.ts` (new)

#### B.2.1: Create Queue Service

Create new file `src/services/BackgroundPdfQueue.ts`:

```typescript
import { Database, Q } from '@nozbe/watermelondb';
import { DailyReport, PdfGenerationStatus } from '../database/models/DailyReportModel';
import { ReportPdfService } from './ReportPdfService';
import { LoggingService } from './LoggingService';

/**
 * Background queue for async PDF generation with retry logic
 */
class BackgroundPdfQueue {
  private static instance: BackgroundPdfQueue;
  private database: Database | null = null;
  private pdfService: ReportPdfService;
  private logger: LoggingService;
  private isProcessing = false;
  private processingInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.pdfService = new ReportPdfService();
    this.logger = LoggingService.getInstance();
  }

  static getInstance(): BackgroundPdfQueue {
    if (!BackgroundPdfQueue.instance) {
      BackgroundPdfQueue.instance = new BackgroundPdfQueue();
    }
    return BackgroundPdfQueue.instance;
  }

  /**
   * Initialize queue with database instance
   */
  initialize(database: Database): void {
    this.database = database;
    this.logger.info('BackgroundPdfQueue initialized', {
      component: 'BackgroundPdfQueue',
      action: 'initialize',
    });
  }

  /**
   * Start processing queue at regular intervals
   */
  startProcessing(intervalMs = 10000): void {
    if (this.processingInterval) {
      this.logger.warn('Queue processing already started', {
        component: 'BackgroundPdfQueue',
        action: 'startProcessing',
      });
      return;
    }

    this.processingInterval = setInterval(() => {
      this.processQueue();
    }, intervalMs);

    this.logger.info('Queue processing started', {
      component: 'BackgroundPdfQueue',
      action: 'startProcessing',
      intervalMs,
    });

    // Process immediately on start
    this.processQueue();
  }

  /**
   * Stop processing queue
   */
  stopProcessing(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;

      this.logger.info('Queue processing stopped', {
        component: 'BackgroundPdfQueue',
        action: 'stopProcessing',
      });
    }
  }

  /**
   * Add report to PDF generation queue
   */
  async enqueueReport(reportId: string): Promise<void> {
    if (!this.database) {
      throw new Error('BackgroundPdfQueue not initialized');
    }

    const reportsCollection = this.database.get<DailyReport>('daily_reports');
    const report = await reportsCollection.find(reportId);

    await this.database.write(async () => {
      await report.update((r: any) => {
        r.pdfGenerationStatus = 'pending';
        r.pdfGenerationAttempts = 0;
      });
    });

    this.logger.info('Report enqueued for PDF generation', {
      component: 'BackgroundPdfQueue',
      action: 'enqueueReport',
      reportId,
      reportDate: report.date,
    });

    // Trigger immediate processing
    setTimeout(() => this.processQueue(), 100);
  }

  /**
   * Process pending PDF generation tasks
   */
  private async processQueue(): Promise<void> {
    if (!this.database || this.isProcessing) {
      return;
    }

    this.isProcessing = true;

    try {
      const reportsCollection = this.database.get<DailyReport>('daily_reports');

      // Find reports needing PDF generation
      const pendingReports = await reportsCollection
        .query(
          Q.where('pdf_generation_status', 'pending'),
          Q.sortBy('created_at', Q.asc),
          Q.take(5) // Process 5 at a time
        )
        .fetch();

      if (pendingReports.length === 0) {
        return; // Nothing to process
      }

      this.logger.info('Processing PDF queue', {
        component: 'BackgroundPdfQueue',
        action: 'processQueue',
        pendingCount: pendingReports.length,
      });

      // Process each report
      for (const report of pendingReports) {
        await this.generatePdfForReport(report);
      }

    } catch (error) {
      this.logger.error('Queue processing error', error as Error, {
        component: 'BackgroundPdfQueue',
        action: 'processQueue',
      });
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Generate PDF for a single report with retry logic
   */
  private async generatePdfForReport(report: DailyReport): Promise<void> {
    if (!this.database) return;

    const maxAttempts = 3;
    const attemptNumber = report.pdfGenerationAttempts + 1;

    try {
      // Update status to generating
      await this.database.write(async () => {
        await report.update((r: any) => {
          r.pdfGenerationStatus = 'generating';
          r.pdfGenerationAttempts = attemptNumber;
          r.pdfLastAttemptTimestamp = Date.now();
        });
      });

      this.logger.info('Starting PDF generation', {
        component: 'BackgroundPdfQueue',
        action: 'generatePdfForReport',
        reportId: report.id,
        reportDate: report.date,
        attemptNumber,
        maxAttempts,
      });

      // Fetch full report data with items
      const reportData = await this.fetchReportData(report);

      // Generate PDF
      const pdfPath = await this.pdfService.generateComprehensiveReport(reportData);

      // Success - update report
      await this.database.write(async () => {
        await report.update((r: any) => {
          r.pdfPath = pdfPath;
          r.pdfGenerationStatus = 'completed';
          r.pdfErrorMessage = null;
          r.pdfErrorTimestamp = null;
        });
      });

      this.logger.info('PDF generation completed', {
        component: 'BackgroundPdfQueue',
        action: 'generatePdfForReport',
        reportId: report.id,
        reportDate: report.date,
        attemptNumber,
        pdfPath,
      });

    } catch (error) {
      // Failure - determine if should retry
      const shouldRetry = attemptNumber < maxAttempts;
      const newStatus: PdfGenerationStatus = shouldRetry ? 'pending' : 'failed';

      await this.database.write(async () => {
        await report.update((r: any) => {
          r.pdfGenerationStatus = newStatus;
          r.pdfErrorMessage = (error as Error).message;
          r.pdfErrorTimestamp = Date.now();
        });
      });

      this.logger.error('PDF generation failed', error as Error, {
        component: 'BackgroundPdfQueue',
        action: 'generatePdfForReport',
        reportId: report.id,
        reportDate: report.date,
        attemptNumber,
        maxAttempts,
        willRetry: shouldRetry,
        nextStatus: newStatus,
      });

      // If will retry, schedule with exponential backoff
      if (shouldRetry) {
        const backoffMs = Math.pow(2, attemptNumber) * 1000; // 2s, 4s, 8s
        setTimeout(() => this.processQueue(), backoffMs);
      }
    }
  }

  /**
   * Fetch complete report data for PDF generation
   */
  private async fetchReportData(report: DailyReport): Promise<any> {
    // This method should fetch all related data (items, progress logs, photos, etc.)
    // Implementation depends on your report data structure

    const items = await report.items.fetch(); // Assuming relation exists

    return {
      id: report.id,
      date: report.date,
      siteName: report.siteName,
      items: await Promise.all(
        items.map(async (item: any) => ({
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          progressLog: item.progressLog ? {
            notes: item.progressLog.notes,
            photos: item.progressLog.photos || [],
          } : null,
        }))
      ),
    };
  }

  /**
   * Manually retry failed PDF generation
   */
  async retryPdfGeneration(reportId: string): Promise<void> {
    if (!this.database) {
      throw new Error('BackgroundPdfQueue not initialized');
    }

    const reportsCollection = this.database.get<DailyReport>('daily_reports');
    const report = await reportsCollection.find(reportId);

    if (!report.canRetryPdf) {
      throw new Error('Report cannot be retried (max attempts reached or not in failed state)');
    }

    await this.database.write(async () => {
      await report.update((r: any) => {
        r.pdfGenerationStatus = 'pending';
        // Keep existing attempt count for retry
      });
    });

    this.logger.info('PDF generation manually retried', {
      component: 'BackgroundPdfQueue',
      action: 'retryPdfGeneration',
      reportId,
      currentAttempts: report.pdfGenerationAttempts,
    });

    // Trigger immediate processing
    setTimeout(() => this.processQueue(), 100);
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<{
    pending: number;
    generating: number;
    completed: number;
    failed: number;
  }> {
    if (!this.database) {
      return { pending: 0, generating: 0, completed: 0, failed: 0 };
    }

    const reportsCollection = this.database.get<DailyReport>('daily_reports');

    const [pending, generating, completed, failed] = await Promise.all([
      reportsCollection.query(Q.where('pdf_generation_status', 'pending')).fetchCount(),
      reportsCollection.query(Q.where('pdf_generation_status', 'generating')).fetchCount(),
      reportsCollection.query(Q.where('pdf_generation_status', 'completed')).fetchCount(),
      reportsCollection.query(Q.where('pdf_generation_status', 'failed')).fetchCount(),
    ]);

    return { pending, generating, completed, failed };
  }
}

export default BackgroundPdfQueue.getInstance();
```

**Checklist**:
- [ ] Create BackgroundPdfQueue.ts file
- [ ] Implement singleton pattern
- [ ] Add initialize() method
- [ ] Add startProcessing() / stopProcessing() methods
- [ ] Add enqueueReport() method
- [ ] Implement processQueue() with batch processing
- [ ] Implement generatePdfForReport() with retry logic
- [ ] Add exponential backoff for retries (2s, 4s, 8s)
- [ ] Add fetchReportData() helper
- [ ] Add retryPdfGeneration() for manual retry
- [ ] Add getQueueStats() for monitoring
- [ ] Add comprehensive logging throughout
- [ ] Test: Enqueue single report
- [ ] Test: Process queue with 5 reports
- [ ] Test: Verify retry on failure
- [ ] Test: Verify max attempts (3) enforced

---

### B.3: Integrate Queue into App Lifecycle

**Time**: 1-2 hours
**Files**:
- `App.tsx` (or main app entry point)
- `src/hooks/useReportSync.ts`

#### B.3.1: Initialize Queue on App Start

**File**: `App.tsx`

```typescript
import React, { useEffect } from 'react';
import { database } from './src/database';
import BackgroundPdfQueue from './src/services/BackgroundPdfQueue';
import { LoggingService } from './src/services/LoggingService';

function App() {
  const logger = LoggingService.getInstance();

  useEffect(() => {
    // Initialize queue with database
    BackgroundPdfQueue.initialize(database);

    // Start processing queue every 10 seconds
    BackgroundPdfQueue.startProcessing(10000);

    logger.info('BackgroundPdfQueue started', {
      component: 'App',
      action: 'useEffect',
    });

    // Cleanup on unmount
    return () => {
      BackgroundPdfQueue.stopProcessing();
      logger.info('BackgroundPdfQueue stopped', {
        component: 'App',
        action: 'useEffect:cleanup',
      });
    };
  }, []);

  return (
    // ... your app components
  );
}

export default App;
```

#### B.3.2: Update useReportSync for Async PDF

**File**: `src/hooks/useReportSync.ts`

Find the report submission section and update:

```typescript
// ❌ OLD - Synchronous PDF generation
try {
  const reportData = { /* ... */ };
  const pdfPath = await reportPdfService.generateComprehensiveReport(reportData);

  // Create report with pdfPath
  await database.write(async () => {
    const report = await reportsCollection.create((r: any) => {
      r.pdfPath = pdfPath;
      // ...
    });
  });
} catch (pdfError) {
  // Handle error
  logger.error('PDF generation failed', pdfError);
  onWarning('Report saved but PDF generation failed');
}

// ✅ NEW - Async PDF generation
import BackgroundPdfQueue from '../services/BackgroundPdfQueue';

try {
  const reportData = { /* ... */ };

  // Create report WITHOUT PDF first
  let reportId: string = '';

  await database.write(async () => {
    const report = await reportsCollection.create((r: any) => {
      r.date = reportData.date;
      r.siteName = reportData.siteName;
      r.pdfPath = ''; // Will be filled by queue
      r.pdfGenerationStatus = 'pending';
      r.pdfGenerationAttempts = 0;
      // ... other fields
    });

    reportId = report.id;
  });

  logger.info('Report created, queueing PDF generation', {
    component: 'useReportSync',
    action: 'submitReports',
    reportId,
    reportDate: reportData.date,
  });

  // Enqueue for async PDF generation
  await BackgroundPdfQueue.enqueueReport(reportId);

  onSuccess('Report submitted successfully. PDF generating in background...');

} catch (error) {
  logger.error('Report submission failed', error as Error, {
    component: 'useReportSync',
    action: 'submitReports',
  });
  onError('Failed to submit report');
}
```

**Checklist**:
- [ ] Import BackgroundPdfQueue in App.tsx
- [ ] Initialize queue on app mount
- [ ] Start processing with 10-second interval
- [ ] Stop processing on app unmount
- [ ] Import BackgroundPdfQueue in useReportSync
- [ ] Update report creation to set status='pending'
- [ ] Remove synchronous PDF generation call
- [ ] Call enqueueReport() after report creation
- [ ] Update success message to mention background generation
- [ ] Test: Submit report and verify it's queued
- [ ] Test: Verify queue starts processing automatically
- [ ] Test: Verify PDF completes in background

---

### B.4: Update UI to Show PDF Status

**Time**: 4-5 hours
**Files**:
- `src/screens/supervisor/ReportsHistoryScreen.tsx`
- `src/components/PdfStatusChip.tsx` (new)

#### B.4.1: Create PDF Status Chip Component

Create new file `src/components/PdfStatusChip.tsx`:

```typescript
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Chip, Text, useTheme } from 'react-native-paper';
import { PdfGenerationStatus } from '../database/models/DailyReportModel';

interface PdfStatusChipProps {
  status: PdfGenerationStatus;
  attempts?: number;
  onRetry?: () => void;
  size?: 'small' | 'medium';
}

export const PdfStatusChip: React.FC<PdfStatusChipProps> = ({
  status,
  attempts = 0,
  onRetry,
  size = 'small',
}) => {
  const theme = useTheme();

  const getChipProps = () => {
    switch (status) {
      case 'pending':
        return {
          icon: 'clock-outline',
          color: theme.colors.tertiary,
          label: 'PDF Pending',
          textColor: theme.colors.onTertiary,
        };
      case 'generating':
        return {
          icon: 'file-cog-outline',
          color: theme.colors.primary,
          label: 'Generating...',
          textColor: theme.colors.onPrimary,
        };
      case 'completed':
        return {
          icon: 'check-circle-outline',
          color: theme.colors.primaryContainer,
          label: 'PDF Ready',
          textColor: theme.colors.onPrimaryContainer,
        };
      case 'failed':
        return {
          icon: 'alert-circle-outline',
          color: theme.colors.errorContainer,
          label: attempts >= 3 ? 'PDF Failed' : `Failed (${attempts}/3)`,
          textColor: theme.colors.onErrorContainer,
          onPress: attempts < 3 && onRetry ? onRetry : undefined,
        };
      case 'skipped':
        return {
          icon: 'cancel',
          color: theme.colors.surfaceVariant,
          label: 'PDF Skipped',
          textColor: theme.colors.onSurfaceVariant,
        };
      default:
        return {
          icon: 'help-circle-outline',
          color: theme.colors.surfaceVariant,
          label: 'Unknown',
          textColor: theme.colors.onSurfaceVariant,
        };
    }
  };

  const chipProps = getChipProps();

  return (
    <Chip
      icon={chipProps.icon}
      mode="flat"
      style={[
        styles.chip,
        { backgroundColor: chipProps.color },
        size === 'small' && styles.chipSmall,
      ]}
      textStyle={[
        styles.chipText,
        { color: chipProps.textColor },
        size === 'small' && styles.chipTextSmall,
      ]}
      onPress={chipProps.onPress}
    >
      {chipProps.label}
    </Chip>
  );
};

const styles = StyleSheet.create({
  chip: {
    height: 32,
  },
  chipSmall: {
    height: 24,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  chipTextSmall: {
    fontSize: 10,
  },
});
```

#### B.4.2: Update ReportsHistoryScreen

**File**: `src/screens/supervisor/ReportsHistoryScreen.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { FlatList, View, StyleSheet } from 'react-native';
import { Card, Text, IconButton, Portal, Snackbar } from 'react-native-paper';
import { DailyReport } from '../../database/models/DailyReportModel';
import { PdfStatusChip } from '../../components/PdfStatusChip';
import BackgroundPdfQueue from '../../services/BackgroundPdfQueue';
import { LoggingService } from '../../services/LoggingService';

export const ReportsHistoryScreen: React.FC = () => {
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const logger = LoggingService.getInstance();

  // Fetch reports (existing logic)
  useEffect(() => {
    // ... your existing fetch logic
  }, []);

  // Subscribe to report updates to refresh UI when PDF status changes
  useEffect(() => {
    const subscription = database.get<DailyReport>('daily_reports')
      .query()
      .observe()
      .subscribe((updatedReports) => {
        setReports(updatedReports);
      });

    return () => subscription.unsubscribe();
  }, []);

  const handleRetryPdf = async (reportId: string) => {
    try {
      await BackgroundPdfQueue.retryPdfGeneration(reportId);

      setSnackbarMessage('PDF generation retrying...');
      setSnackbarVisible(true);

      logger.info('PDF retry initiated from UI', {
        component: 'ReportsHistoryScreen',
        action: 'handleRetryPdf',
        reportId,
      });
    } catch (error) {
      setSnackbarMessage('Failed to retry PDF generation');
      setSnackbarVisible(true);

      logger.error('PDF retry failed', error as Error, {
        component: 'ReportsHistoryScreen',
        action: 'handleRetryPdf',
        reportId,
      });
    }
  };

  const renderReportItem = ({ item: report }: { item: DailyReport }) => (
    <Card style={styles.reportCard}>
      <Card.Title
        title={report.siteName}
        subtitle={report.date}
        right={(props) => (
          <View style={styles.cardActions}>
            <PdfStatusChip
              status={report.pdfGenerationStatus}
              attempts={report.pdfGenerationAttempts}
              onRetry={() => handleRetryPdf(report.id)}
              size="small"
            />

            {report.pdfGenerationStatus === 'completed' && report.pdfPath && (
              <IconButton
                {...props}
                icon="share-variant"
                onPress={() => handleSharePdf(report.pdfPath)}
              />
            )}
          </View>
        )}
      />
      <Card.Content>
        <Text variant="bodySmall">{report.pdfStatusMessage}</Text>

        {report.pdfErrorMessage && (
          <Text variant="bodySmall" style={styles.errorText}>
            Error: {report.pdfErrorMessage}
          </Text>
        )}
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={reports}
        renderItem={renderReportItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
      />

      <Portal>
        <Snackbar
          visible={snackbarVisible}
          onDismiss={() => setSnackbarVisible(false)}
          duration={3000}
        >
          {snackbarMessage}
        </Snackbar>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  reportCard: {
    marginBottom: 12,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    color: 'red',
    marginTop: 8,
  },
});
```

**Checklist**:
- [ ] Create PdfStatusChip.tsx component
- [ ] Implement status-to-color mapping
- [ ] Add retry functionality to failed chip
- [ ] Add icon indicators for each status
- [ ] Import PdfStatusChip in ReportsHistoryScreen
- [ ] Add PDF status chip to each report card
- [ ] Subscribe to report updates for real-time status
- [ ] Add handleRetryPdf function
- [ ] Show snackbar on retry
- [ ] Test: View report with 'pending' status
- [ ] Test: Watch status change to 'generating' → 'completed'
- [ ] Test: Tap retry on failed report
- [ ] Test: Verify real-time UI updates

---

### B.5: Add Loading Overlay During Generation

**Time**: 1-2 hours
**File**: `src/components/LoadingOverlay.tsx` (already exists from Phase 2)

#### B.5.1: Use LoadingOverlay in Report Submission

**File**: `src/screens/supervisor/DailyReportFormScreen.tsx` (or wherever report submission happens)

```typescript
import { LoadingOverlay } from '../../components/LoadingOverlay';

export const DailyReportFormScreen: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { submitReport } = useReportSync();

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      await submitReport(reportData);
      // Success - navigate away or show confirmation
    } catch (error) {
      // Error handling
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* ... existing form UI ... */}

      <LoadingOverlay
        visible={isSubmitting}
        message="Submitting report..."
        subMessage="PDF will generate in background"
      />
    </View>
  );
};
```

**Checklist**:
- [ ] Import LoadingOverlay component
- [ ] Add isSubmitting state
- [ ] Show overlay during report submission
- [ ] Add message indicating background PDF generation
- [ ] Hide overlay after submission completes
- [ ] Test: Submit report and verify overlay appears
- [ ] Test: Verify overlay message is clear

---

### B.6: Phase B Testing & Validation

**Time**: 6-8 hours

#### Test Cases

**TC-B1: Basic Async PDF Generation**
```
Test: Submit report with 0 photos
Expected:
  - Report created immediately
  - Status = 'pending'
  - Within 10 seconds, status changes to 'generating' → 'completed'
  - PDF file created
Verify: Database fields updated correctly
```

**TC-B2: Queue Processing**
```
Test: Submit 5 reports in rapid succession
Expected:
  - All 5 reports created with status='pending'
  - Queue processes them in order (FIFO)
  - All complete within 60 seconds
Verify: No race conditions, all PDFs generated
```

**TC-B3: Retry Logic - Automatic**
```
Test: Force PDF failure (e.g., corrupt data)
Expected:
  - Attempt 1 fails, status='pending', attempts=1
  - After 2 seconds, attempt 2 starts
  - After 4 seconds (if still failing), attempt 3 starts
  - After 3 failures, status='failed', attempts=3
Verify: Exponential backoff working, max attempts enforced
```

**TC-B4: Retry Logic - Manual**
```
Test: Tap retry on failed report (attempts < 3)
Expected:
  - Status changes to 'pending'
  - Queue picks it up within 10 seconds
  - PDF generation reattempts
Verify: Manual retry works from UI
```

**TC-B5: UI Real-Time Updates**
```
Test: Keep ReportsHistoryScreen open while report is processing
Expected:
  - Status chip updates in real-time (pending → generating → completed)
  - No manual refresh needed
Verify: Database observation working
```

**TC-B6: Share Button Enablement**
```
Test: Wait for PDF to complete, then tap share
Expected:
  - Share button only enabled when status='completed'
  - PDF opens correctly
Verify: Share functionality works with async PDF
```

**TC-B7: Queue Statistics**
```
Test: Call BackgroundPdfQueue.getQueueStats()
Expected: Returns accurate counts (pending, generating, completed, failed)
Verify: Stats match database query results
```

**TC-B8: App Restart Persistence**
```
Test: Submit report, close app before PDF completes, reopen app
Expected:
  - Queue resumes processing on app restart
  - PDF completes after restart
Verify: Queue state persists across app sessions
```

**TC-B9: Offline → Online**
```
Test: Submit report while offline, then go online
Expected:
  - Report created with status='pending'
  - PDF generation happens when online
Verify: Queue works with offline-first approach
```

**TC-B10: Large Photo Handling**
```
Test: Submit report with 10 photos (50 MB total)
Expected:
  - Report submits immediately (not blocked)
  - PDF generation happens in background
  - May retry if memory issues, eventually succeeds or fails gracefully
Verify: No UI blocking, error handling robust
```

#### Testing Procedure

1. **Setup Test Environment**
   ```bash
   # Clean install
   npm run android -- --reset-cache
   # Or
   npm run ios

   # Enable logging
   # Navigate to Settings → Enable Logging
   ```

2. **Prepare Test Data**
   - Create 10 test reports with varying photo counts (0, 1, 3, 5, 10)
   - Prepare scenarios to force failures (e.g., invalid paths)

3. **Execute Test Suite**
   - Run each test case TC-B1 through TC-B10
   - Document results in spreadsheet
   - Capture screenshots of status chips
   - Export logs for analysis

4. **Performance Testing**
   - Measure PDF generation time per photo count
   - Monitor memory usage during queue processing
   - Test with 20 pending reports in queue

5. **Edge Case Testing**
   - App in background (iOS/Android lifecycle)
   - Low memory scenarios
   - Network transitions (online ↔ offline)
   - Database migration from v33 → v34

#### Success Criteria

- ✅ Reports submit in < 1 second (not blocked by PDF)
- ✅ Queue processes 5 reports in < 60 seconds total
- ✅ Retry logic executes with correct backoff (2s, 4s, 8s)
- ✅ Max 3 attempts enforced for all failures
- ✅ UI updates in real-time without manual refresh
- ✅ Share button only enabled when PDF ready
- ✅ Queue resumes on app restart
- ✅ No memory leaks after processing 20 reports
- ✅ 100% of test cases pass on both iOS and Android
- ✅ No UI freezes or blocking operations

#### Known Issues & Mitigations

**Issue**: Queue may stop processing if app is in background too long (iOS kills timers)
**Mitigation**: Add foreground listener to restart queue on app resume

**Issue**: Large photo reports may still fail after 3 attempts
**Mitigation**: Phase C (photo compression) addresses root cause

**Issue**: Users may tap share before PDF completes
**Mitigation**: Disable share button until status='completed', show loading chip

---

## Phase C: Photo Compression (7-12 Days)

**Goal**: Enable photos in PDFs by compressing them to manageable sizes, addressing the root cause of PDF failures.

**Estimated Effort**: 40-60 hours
**Priority**: OPTIONAL (solves root cause but Phase B provides acceptable UX)

### C.1: Research & Choose Compression Library

**Time**: 4-6 hours
**Deliverable**: Document with library comparison

#### Libraries to Evaluate

1. **react-native-image-resizer**
   - Pros: Lightweight, simple API, good performance
   - Cons: Limited format support
   - License: MIT

2. **react-native-compressor**
   - Pros: Supports video too, modern API
   - Cons: Larger bundle size
   - License: MIT

3. **expo-image-manipulator**
   - Pros: Expo ecosystem, well-maintained
   - Cons: Requires Expo (if not using)
   - License: MIT

4. **react-native-image-crop-picker** (has compression)
   - Pros: Already used for picking, includes compression
   - Cons: Overkill if only need compression
   - License: MIT

#### Evaluation Criteria

Create a comparison table:

| Library | Bundle Size | Compression Quality | Speed | Platform Support | Maintenance |
|---------|-------------|---------------------|-------|------------------|-------------|
| react-native-image-resizer | Small (50kb) | Good | Fast | iOS, Android | Active |
| react-native-compressor | Medium (200kb) | Excellent | Medium | iOS, Android | Active |
| expo-image-manipulator | Medium (150kb) | Good | Fast | iOS, Android, Web | Very Active |
| react-native-image-crop-picker | Large (500kb) | Good | Fast | iOS, Android | Active |

#### Test Compression Quality

For top 2 candidates, run compression tests:

```typescript
// Test script
const testImage = 'path/to/5MB_photo.jpg';

// Test different quality settings
const qualities = [30, 50, 70, 90];

for (const quality of qualities) {
  const compressed = await compressImage(testImage, quality);
  console.log(`Quality ${quality}: ${compressed.size / 1024}KB, ratio: ${(compressed.size / originalSize * 100).toFixed(1)}%`);
}

// Target: 5 MB → ~200 KB at quality 50-70
```

#### Recommendation (Placeholder)

**Recommended Library**: react-native-compressor
- Best compression quality
- Modern async/await API
- Active maintenance
- Supports both image and video (future-proof)

**Checklist**:
- [ ] Install all 4 libraries in test project
- [ ] Create comparison table
- [ ] Test compression with 5 sample photos
- [ ] Measure bundle size impact
- [ ] Document recommendation
- [ ] Get approval from team/client

---

### C.2: Install & Configure Compression Library

**Time**: 2-3 hours
**Files**:
- `package.json`
- `android/app/build.gradle` (if needed)
- `ios/Podfile` (if needed)

#### C.2.1: Install Library

```bash
npm install react-native-compressor
# or
yarn add react-native-compressor

# iOS only
cd ios && pod install && cd ..
```

#### C.2.2: Configure Android (if needed)

**File**: `android/app/build.gradle`

```gradle
android {
  // ... existing config

  // If needed for compression library
  packagingOptions {
    pickFirst 'lib/x86/libc++_shared.so'
    pickFirst 'lib/x86_64/libc++_shared.so'
    pickFirst 'lib/armeabi-v7a/libc++_shared.so'
    pickFirst 'lib/arm64-v8a/libc++_shared.so'
  }
}
```

#### C.2.3: Test Installation

Create test file `src/utils/imageCompressionTest.ts`:

```typescript
import { Image } from 'react-native-compressor';

export const testImageCompression = async (filePath: string): Promise<void> => {
  try {
    const result = await Image.compress(filePath, {
      compressionMethod: 'auto',
      maxWidth: 1920,
      maxHeight: 1920,
      quality: 0.7,
    });

    console.log('Original:', filePath);
    console.log('Compressed:', result);

    // Check file sizes
    const RNFS = require('react-native-fs');
    const originalSize = (await RNFS.stat(filePath)).size;
    const compressedSize = (await RNFS.stat(result)).size;

    console.log(`Size reduction: ${originalSize} → ${compressedSize} (${((compressedSize / originalSize) * 100).toFixed(1)}%)`);
  } catch (error) {
    console.error('Compression test failed:', error);
  }
};
```

Run test:
```typescript
// In any screen or test file
import { testImageCompression } from './utils/imageCompressionTest';

// Test with a photo from your device
testImageCompression('file:///path/to/test/photo.jpg');
```

**Checklist**:
- [ ] Install react-native-compressor
- [ ] Run pod install (iOS)
- [ ] Configure build.gradle if needed (Android)
- [ ] Create compression test function
- [ ] Test with sample 5 MB photo
- [ ] Verify compression works on iOS
- [ ] Verify compression works on Android
- [ ] Document compression settings chosen

---

### C.3: Create Photo Compression Service

**Time**: 4-6 hours
**File**: `src/services/PhotoCompressionService.ts` (new)

#### C.3.1: Create Service Class

Create new file `src/services/PhotoCompressionService.ts`:

```typescript
import { Image } from 'react-native-compressor';
import RNFS from 'react-native-fs';
import { LoggingService } from './LoggingService';

interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.0 - 1.0
}

interface CompressionResult {
  originalPath: string;
  compressedPath: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  durationMs: number;
}

/**
 * Service for compressing photos before PDF generation
 */
class PhotoCompressionService {
  private static instance: PhotoCompressionService;
  private logger: LoggingService;

  // Default settings optimized for PDF inclusion
  private defaultOptions: CompressionOptions = {
    maxWidth: 1920,
    maxHeight: 1920,
    quality: 0.7, // 70% quality
  };

  private constructor() {
    this.logger = LoggingService.getInstance();
  }

  static getInstance(): PhotoCompressionService {
    if (!PhotoCompressionService.instance) {
      PhotoCompressionService.instance = new PhotoCompressionService();
    }
    return PhotoCompressionService.instance;
  }

  /**
   * Compress a single photo
   */
  async compressPhoto(
    photoPath: string,
    options?: CompressionOptions
  ): Promise<CompressionResult> {
    const startTime = Date.now();
    const compressionOptions = { ...this.defaultOptions, ...options };

    try {
      // Validate input file exists
      const exists = await RNFS.exists(photoPath);
      if (!exists) {
        throw new Error(`Photo file does not exist: ${photoPath}`);
      }

      // Get original file size
      const originalStat = await RNFS.stat(photoPath);
      const originalSize = parseInt(originalStat.size, 10);

      this.logger.info('Starting photo compression', {
        component: 'PhotoCompressionService',
        action: 'compressPhoto',
        photoPath: photoPath.substring(photoPath.length - 40),
        originalSize,
        originalSizeMB: (originalSize / 1024 / 1024).toFixed(2),
        options: compressionOptions,
      });

      // Compress photo
      const compressedPath = await Image.compress(photoPath, {
        compressionMethod: 'auto',
        maxWidth: compressionOptions.maxWidth,
        maxHeight: compressionOptions.maxHeight,
        quality: compressionOptions.quality,
      });

      // Get compressed file size
      const compressedStat = await RNFS.stat(compressedPath);
      const compressedSize = parseInt(compressedStat.size, 10);
      const compressionRatio = compressedSize / originalSize;
      const durationMs = Date.now() - startTime;

      this.logger.info('Photo compression completed', {
        component: 'PhotoCompressionService',
        action: 'compressPhoto',
        originalSize,
        compressedSize,
        compressionRatio: (compressionRatio * 100).toFixed(1) + '%',
        savedBytes: originalSize - compressedSize,
        savedMB: ((originalSize - compressedSize) / 1024 / 1024).toFixed(2),
        durationMs,
      });

      return {
        originalPath: photoPath,
        compressedPath,
        originalSize,
        compressedSize,
        compressionRatio,
        durationMs,
      };

    } catch (error) {
      const durationMs = Date.now() - startTime;

      this.logger.error('Photo compression failed', error as Error, {
        component: 'PhotoCompressionService',
        action: 'compressPhoto',
        photoPath: photoPath.substring(photoPath.length - 40),
        durationMs,
      });

      throw error;
    }
  }

  /**
   * Compress multiple photos in parallel
   */
  async compressPhotos(
    photoPaths: string[],
    options?: CompressionOptions
  ): Promise<CompressionResult[]> {
    const startTime = Date.now();

    this.logger.info('Starting batch photo compression', {
      component: 'PhotoCompressionService',
      action: 'compressPhotos',
      photoCount: photoPaths.length,
    });

    try {
      // Compress all photos in parallel
      const results = await Promise.all(
        photoPaths.map((path) => this.compressPhoto(path, options))
      );

      const durationMs = Date.now() - startTime;
      const totalOriginalSize = results.reduce((sum, r) => sum + r.originalSize, 0);
      const totalCompressedSize = results.reduce((sum, r) => sum + r.compressedSize, 0);
      const overallRatio = totalCompressedSize / totalOriginalSize;

      this.logger.info('Batch photo compression completed', {
        component: 'PhotoCompressionService',
        action: 'compressPhotos',
        photoCount: results.length,
        totalOriginalSizeMB: (totalOriginalSize / 1024 / 1024).toFixed(2),
        totalCompressedSizeMB: (totalCompressedSize / 1024 / 1024).toFixed(2),
        overallRatio: (overallRatio * 100).toFixed(1) + '%',
        savedMB: ((totalOriginalSize - totalCompressedSize) / 1024 / 1024).toFixed(2),
        durationMs,
        avgTimePerPhoto: (durationMs / results.length).toFixed(0),
      });

      return results;

    } catch (error) {
      const durationMs = Date.now() - startTime;

      this.logger.error('Batch photo compression failed', error as Error, {
        component: 'PhotoCompressionService',
        action: 'compressPhotos',
        photoCount: photoPaths.length,
        durationMs,
      });

      throw error;
    }
  }

  /**
   * Compress photos and return Map of original → compressed paths
   */
  async compressPhotosMap(
    photoPaths: string[],
    options?: CompressionOptions
  ): Promise<Map<string, string>> {
    const results = await this.compressPhotos(photoPaths, options);

    const photoMap = new Map<string, string>();
    results.forEach((result) => {
      photoMap.set(result.originalPath, result.compressedPath);
    });

    return photoMap;
  }

  /**
   * Estimate compressed size without actually compressing
   * (Useful for UI previews)
   */
  async estimateCompressedSize(photoPath: string): Promise<number> {
    try {
      const stat = await RNFS.stat(photoPath);
      const originalSize = parseInt(stat.size, 10);

      // Rough estimate: 70% quality usually gives 15-30% of original size
      // Use 25% as middle estimate
      return Math.round(originalSize * 0.25);
    } catch (error) {
      this.logger.warn('Failed to estimate compressed size', {
        component: 'PhotoCompressionService',
        action: 'estimateCompressedSize',
        error: (error as Error).message,
      });
      return 0;
    }
  }

  /**
   * Get recommended compression settings based on photo count and sizes
   */
  getRecommendedSettings(
    photoCount: number,
    totalSizeMB: number
  ): CompressionOptions {
    // If total size is already small, use lighter compression
    if (totalSizeMB < 10) {
      return {
        maxWidth: 2560,
        maxHeight: 2560,
        quality: 0.85,
      };
    }

    // If many photos or large size, use aggressive compression
    if (photoCount > 10 || totalSizeMB > 50) {
      return {
        maxWidth: 1280,
        maxHeight: 1280,
        quality: 0.6,
      };
    }

    // Default balanced settings
    return this.defaultOptions;
  }
}

export default PhotoCompressionService.getInstance();
```

**Checklist**:
- [ ] Create PhotoCompressionService.ts file
- [ ] Implement singleton pattern
- [ ] Add compressPhoto() method
- [ ] Add compressPhotos() batch method
- [ ] Add compressPhotosMap() for path mapping
- [ ] Add estimateCompressedSize() helper
- [ ] Add getRecommendedSettings() logic
- [ ] Add comprehensive logging
- [ ] Test: Compress single 5 MB photo
- [ ] Test: Compress batch of 10 photos
- [ ] Verify compression ratio (target: 15-30%)
- [ ] Verify performance (< 500ms per photo)

---

### C.4: Integrate Compression into ReportPdfService

**Time**: 3-4 hours
**File**: `src/services/ReportPdfService.ts`

#### C.4.1: Import and Use Compression

Update `generateComprehensiveReport` method:

```typescript
import PhotoCompressionService from './PhotoCompressionService';
import RNFS from 'react-native-fs';

class ReportPdfService {
  // ... existing code

  async generateComprehensiveReport(reportData: any): Promise<string> {
    const fileName = `report_${reportData.date.replace(/\//g, '-')}_${Date.now()}.pdf`;

    try {
      // Existing validation and metadata collection
      const photoValidation = this.validatePhotoPaths(reportData.items);
      const photoMetadata = await this.collectPhotoMetadata(reportData.items);

      // NEW: Compress photos before PDF generation
      const photoMap = await this.compressPhotosForReport(reportData.items);

      this.logger.info('Starting PDF generation with compressed photos', {
        component: 'ReportPdfService',
        action: 'generateComprehensiveReport',
        fileName,
        reportDate: reportData.date,
        itemCount: reportData.items.length,
        totalPhotos: photoValidation.totalPhotos,
        totalPhotoSizeMB: (photoMetadata.totalSize / 1024 / 1024).toFixed(2),
        compressedPhotoCount: photoMap.size,
      });

      // Generate HTML with compressed photo paths
      const html = await this.generateHtmlWithPhotos(reportData, photoMap);

      // Generate PDF
      const pdfPath = await this.convertHtmlToPdf(html, fileName);

      // Clean up compressed photos
      await this.cleanupCompressedPhotos(photoMap);

      this.logger.info('PDF generation completed', {
        component: 'ReportPdfService',
        action: 'generateComprehensiveReport',
        fileName,
        pdfPath,
      });

      return pdfPath;

    } catch (error) {
      this.logger.error('PDF generation failed', error as Error, {
        component: 'ReportPdfService',
        action: 'generateComprehensiveReport',
        fileName,
      });
      throw error;
    }
  }

  /**
   * Compress all photos in report items
   */
  private async compressPhotosForReport(
    items: any[]
  ): Promise<Map<string, string>> {
    const allPhotoPaths: string[] = [];

    // Collect all photo paths
    items.forEach((item) => {
      const photos = item.progressLog?.photos || [];
      allPhotoPaths.push(...photos);
    });

    if (allPhotoPaths.length === 0) {
      return new Map();
    }

    // Calculate total size to get recommended settings
    const totalSize = await Promise.all(
      allPhotoPaths.map(async (path) => {
        try {
          const stat = await RNFS.stat(path);
          return parseInt(stat.size, 10);
        } catch {
          return 0;
        }
      })
    ).then((sizes) => sizes.reduce((sum, size) => sum + size, 0));

    const totalSizeMB = totalSize / 1024 / 1024;

    // Get recommended compression settings
    const compressionOptions = PhotoCompressionService.getRecommendedSettings(
      allPhotoPaths.length,
      totalSizeMB
    );

    this.logger.info('Compressing photos for PDF', {
      component: 'ReportPdfService',
      action: 'compressPhotosForReport',
      photoCount: allPhotoPaths.length,
      totalSizeMB: totalSizeMB.toFixed(2),
      compressionOptions,
    });

    // Compress all photos
    const photoMap = await PhotoCompressionService.compressPhotosMap(
      allPhotoPaths,
      compressionOptions
    );

    return photoMap;
  }

  /**
   * Generate HTML with compressed photo paths (NOT base64)
   */
  private async generateHtmlWithPhotos(
    reportData: any,
    photoMap: Map<string, string>
  ): Promise<string> {
    // Build HTML with photo file paths (not base64 embedding)
    // react-native-html-to-pdf can handle file:// paths

    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #333; }
          .item { margin-bottom: 30px; page-break-inside: avoid; }
          .photo { max-width: 100%; height: auto; margin: 10px 0; }
          .photo-container { text-align: center; }
        </style>
      </head>
      <body>
        <h1>Daily Report - ${reportData.siteName}</h1>
        <p><strong>Date:</strong> ${reportData.date}</p>
    `;

    for (const item of reportData.items) {
      html += `
        <div class="item">
          <h2>${item.description}</h2>
          <p><strong>Quantity:</strong> ${item.quantity} ${item.unit}</p>
      `;

      if (item.progressLog?.notes) {
        html += `<p><strong>Notes:</strong> ${item.progressLog.notes}</p>`;
      }

      if (item.progressLog?.photos && item.progressLog.photos.length > 0) {
        html += `<div class="photo-container">`;

        for (const originalPhotoPath of item.progressLog.photos) {
          // Use compressed photo path if available
          const photoPath = photoMap.get(originalPhotoPath) || originalPhotoPath;

          html += `<img src="${photoPath}" class="photo" alt="Progress photo" />`;
        }

        html += `</div>`;
      }

      html += `</div>`;
    }

    html += `
      </body>
      </html>
    `;

    return html;
  }

  /**
   * Clean up temporary compressed photos
   */
  private async cleanupCompressedPhotos(
    photoMap: Map<string, string>
  ): Promise<void> {
    const compressedPaths = Array.from(photoMap.values());

    for (const path of compressedPaths) {
      try {
        const exists = await RNFS.exists(path);
        if (exists) {
          await RNFS.unlink(path);
        }
      } catch (error) {
        this.logger.warn('Failed to delete compressed photo', {
          component: 'ReportPdfService',
          action: 'cleanupCompressedPhotos',
          path: path.substring(path.length - 40),
          error: (error as Error).message,
        });
      }
    }

    this.logger.info('Cleaned up compressed photos', {
      component: 'ReportPdfService',
      action: 'cleanupCompressedPhotos',
      count: compressedPaths.length,
    });
  }
}
```

**Checklist**:
- [ ] Import PhotoCompressionService
- [ ] Add compressPhotosForReport() method
- [ ] Call compression before HTML generation
- [ ] Update generateHtmlWithPhotos() to use compressed paths
- [ ] Add cleanupCompressedPhotos() method
- [ ] Call cleanup after PDF generated
- [ ] Test: Generate PDF with 5 compressed photos
- [ ] Verify PDF includes photos
- [ ] Verify compressed photos deleted after PDF creation
- [ ] Verify PDF file size reasonable (< 10 MB)

---

### C.5: Update Database Schema for Compression Stats

**Time**: 1-2 hours
**Files**:
- `src/database/migrations/v35_add_photo_compression_stats.ts` (new)
- `src/database/schema.ts`
- `src/database/models/DailyReportModel.ts`

#### C.5.1: Create Migration v35

```typescript
export const v35Migration = schemaMigrations({
  migrations: [
    {
      toVersion: 35,
      steps: [
        {
          type: 'add_columns',
          table: 'daily_reports',
          columns: [
            { name: 'photo_compression_enabled', type: 'boolean', isOptional: false },
            { name: 'original_photo_size_mb', type: 'number', isOptional: true },
            { name: 'compressed_photo_size_mb', type: 'number', isOptional: true },
            { name: 'compression_ratio', type: 'number', isOptional: true },
          ],
        },
      ],
    },
  ],
});
```

#### C.5.2: Update Model

```typescript
export class DailyReport extends Model {
  // ... existing fields

  @field('photo_compression_enabled') photoCompressionEnabled!: boolean;
  @field('original_photo_size_mb') originalPhotoSizeMB?: number;
  @field('compressed_photo_size_mb') compressedPhotoSizeMB?: number;
  @field('compression_ratio') compressionRatio?: number;
}
```

#### C.5.3: Store Stats During PDF Generation

Update `compressPhotosForReport` in ReportPdfService:

```typescript
private async compressPhotosForReport(
  items: any[],
  reportId: string // NEW: Pass report ID
): Promise<Map<string, string>> {
  // ... existing compression logic

  const results = await PhotoCompressionService.compressPhotos(allPhotoPaths, compressionOptions);

  // Calculate totals
  const totalOriginal = results.reduce((sum, r) => sum + r.originalSize, 0);
  const totalCompressed = results.reduce((sum, r) => sum + r.compressedSize, 0);
  const ratio = totalCompressed / totalOriginal;

  // Store stats in database
  await this.storeCompressionStats(reportId, totalOriginal, totalCompressed, ratio);

  // Return map
  const photoMap = new Map<string, string>();
  results.forEach((r) => photoMap.set(r.originalPath, r.compressedPath));
  return photoMap;
}

private async storeCompressionStats(
  reportId: string,
  originalSize: number,
  compressedSize: number,
  ratio: number
): Promise<void> {
  const report = await database.get<DailyReport>('daily_reports').find(reportId);

  await database.write(async () => {
    await report.update((r: any) => {
      r.photoCompressionEnabled = true;
      r.originalPhotoSizeMB = originalSize / 1024 / 1024;
      r.compressedPhotoSizeMB = compressedSize / 1024 / 1024;
      r.compressionRatio = ratio;
    });
  });
}
```

**Checklist**:
- [ ] Create v35 migration
- [ ] Update schema to v35
- [ ] Add compression stat fields to model
- [ ] Store stats after compression
- [ ] Test: Verify stats saved correctly
- [ ] Display stats in UI (optional)

---

### C.6: Phase C Testing & Validation

**Time**: 10-15 hours

#### Test Cases

**TC-C1: Basic Photo Compression**
```
Test: Generate PDF with 1 photo (5 MB original)
Expected:
  - Photo compressed to ~1-1.5 MB
  - PDF includes compressed photo
  - PDF file size < 3 MB
  - Photo quality acceptable (70%)
Verify: Visual inspection, file sizes
```

**TC-C2: Multiple Photos**
```
Test: Generate PDF with 10 photos (50 MB total original)
Expected:
  - All 10 photos compressed in parallel
  - Total compressed size ~10-15 MB
  - PDF generated successfully
  - PDF file size < 20 MB
Verify: All photos visible in PDF
```

**TC-C3: Compression Settings - Light**
```
Test: Submit report with 2 photos (8 MB total)
Expected:
  - Recommended settings: maxWidth=2560, quality=0.85
  - Compression ratio ~40-50%
  - High photo quality preserved
Verify: getRecommendedSettings() logic
```

**TC-C4: Compression Settings - Aggressive**
```
Test: Submit report with 15 photos (75 MB total)
Expected:
  - Recommended settings: maxWidth=1280, quality=0.6
  - Compression ratio ~15-25%
  - Photos smaller but still legible
Verify: getRecommendedSettings() logic
```

**TC-C5: Compression Performance**
```
Test: Compress 20 photos in parallel
Expected:
  - Avg time per photo < 500ms
  - Total time < 10 seconds
  - No memory issues
Verify: Log timing metadata
```

**TC-C6: Compressed Photo Cleanup**
```
Test: Generate PDF with 5 photos
Expected:
  - 5 temporary compressed files created
  - All 5 deleted after PDF generation
  - Original photos untouched
Verify: File system check before/after
```

**TC-C7: Compression Stats Persistence**
```
Test: Generate PDF with 3 photos
Expected:
  - Database fields populated:
    - photo_compression_enabled = true
    - original_photo_size_mb = X
    - compressed_photo_size_mb = Y
    - compression_ratio = Y/X
Verify: Database query
```

**TC-C8: PDF Quality Comparison**
```
Test: Generate 2 PDFs (same report) - one without photos (Phase B), one with compressed photos (Phase C)
Expected:
  - Phase B PDF: 0.5 MB, no photos
  - Phase C PDF: 5-10 MB, photos included
  - Photo quality acceptable for review purposes
Verify: Visual comparison, client feedback
```

**TC-C9: Large Report (Edge Case)**
```
Test: Generate PDF with 30 photos (150 MB total original)
Expected:
  - Compression completes (may take 15-20 seconds)
  - PDF generated successfully
  - PDF file size < 30 MB
  - No out-of-memory errors
Verify: Memory profiling, stress test
```

**TC-C10: Photo Formats**
```
Test: Generate PDF with mixed photo formats (JPG, PNG, HEIC)
Expected:
  - All formats compressed successfully
  - PNG/HEIC converted to JPG if needed
  - PDF displays all photos correctly
Verify: Format handling
```

#### Testing Procedure

1. **Baseline Testing (No Compression)**
   - Generate 5 PDFs without photos (Phase B)
   - Record sizes, generation times

2. **Compression Testing**
   - Generate same 5 PDFs with compressed photos (Phase C)
   - Compare sizes, times, quality

3. **Quality Assessment**
   - Visual inspection of compressed photos in PDF
   - Zoom in to check legibility
   - Get stakeholder feedback on acceptable quality

4. **Performance Profiling**
   - Use React DevTools Profiler
   - Monitor memory usage during compression
   - Identify any bottlenecks

5. **Edge Case Testing**
   - Very large photos (> 10 MB each)
   - Very many photos (> 20)
   - Mixed orientations (portrait/landscape)
   - Corrupted photo files

#### Success Criteria

- ✅ 95%+ compression ratio (5 MB → ~1 MB typical)
- ✅ Photo quality rated "acceptable" by 3+ stakeholders
- ✅ PDF generation time < 20 seconds for 10 photos
- ✅ PDF file sizes < 10 MB for reports with 5 photos
- ✅ No memory issues on mid-range devices
- ✅ 100% photo cleanup success (no temp files left)
- ✅ Compression stats accurately recorded
- ✅ All test cases pass on iOS and Android

#### Rollback Plan

If Phase C doesn't meet success criteria:
1. Disable photo compression (revert to Phase B async without photos)
2. Keep compression code for future improvement
3. Document issues for next iteration
4. Phase B (async PDF without photos) remains acceptable UX

---

## Testing Strategy

### Overall Testing Approach

**Phase A**: Focus on logging accuracy and error metadata
**Phase B**: Focus on async queue reliability and UI responsiveness
**Phase C**: Focus on compression quality and performance

### Test Environments

1. **Development**
   - Use emulators/simulators for rapid iteration
   - Enable all logging
   - Test migrations on clean installs

2. **Staging**
   - Test on physical devices (iOS and Android)
   - Test with real photo data
   - Performance profiling

3. **Production**
   - Gradual rollout (10% → 50% → 100%)
   - Monitor crash reports
   - Collect user feedback

### Test Data Preparation

Create standardized test reports:

| Report ID | Photos | Total Size | Purpose |
|-----------|--------|------------|---------|
| TEST-01 | 0 | 0 MB | Baseline (no photos) |
| TEST-02 | 1 | 5 MB | Single large photo |
| TEST-03 | 5 | 25 MB | Typical report |
| TEST-04 | 10 | 50 MB | Heavy report |
| TEST-05 | 20 | 100 MB | Edge case (stress test) |
| TEST-06 | 3 | 15 MB | Mixed formats (JPG, PNG, HEIC) |
| TEST-07 | 1 | 0 MB | Missing photo file (error case) |

### Regression Testing

After each phase, verify previous phases still work:

**After Phase A**:
- ✅ LoggingService logs appear in LogViewer
- ✅ Error metadata captured
- ✅ Photo validation logs accurate

**After Phase B**:
- ✅ Phase A logs still working
- ✅ Queue processes reports
- ✅ UI updates in real-time
- ✅ Retry logic works

**After Phase C**:
- ✅ Phase A logs include compression stats
- ✅ Phase B queue handles compressed photos
- ✅ Photos appear in PDF
- ✅ Compression cleanup successful

---

## Rollback Procedures

### Phase A Rollback

If Phase A causes critical issues:

**Revert Steps**:
1. Revert ReportPdfService.ts to use console.log
2. Rollback database to v32 (before error tracking columns)
3. Remove LoggingService dependency

**Risk**: Low (logging changes are non-invasive)

**Migration Rollback**:
```sql
-- Not recommended, but if needed:
ALTER TABLE daily_reports DROP COLUMN pdf_error_message;
ALTER TABLE daily_reports DROP COLUMN pdf_error_timestamp;
ALTER TABLE daily_reports DROP COLUMN pdf_photo_count;
-- Update schema version back to 32
```

---

### Phase B Rollback

If Phase B causes critical issues:

**Revert Steps**:
1. Stop BackgroundPdfQueue processing
2. Revert useReportSync to synchronous PDF generation
3. Rollback database to v33 (before status columns)
4. Remove PdfStatusChip from UI

**Risk**: Medium (async changes affect core submission flow)

**Feature Flag Approach** (Recommended):

```typescript
// In config file or environment
export const FEATURES = {
  ASYNC_PDF_GENERATION: false, // Toggle to disable
};

// In useReportSync
if (FEATURES.ASYNC_PDF_GENERATION) {
  // Phase B async logic
  await BackgroundPdfQueue.enqueueReport(reportId);
} else {
  // Phase A synchronous logic (fallback)
  const pdfPath = await reportPdfService.generateComprehensiveReport(reportData);
}
```

**Migration Rollback**:
```sql
ALTER TABLE daily_reports DROP COLUMN pdf_generation_status;
ALTER TABLE daily_reports DROP COLUMN pdf_generation_attempts;
ALTER TABLE daily_reports DROP COLUMN pdf_last_attempt_timestamp;
```

---

### Phase C Rollback

If Phase C causes critical issues:

**Revert Steps**:
1. Disable photo compression in ReportPdfService
2. Revert to Phase B (async PDF without photos)
3. Remove PhotoCompressionService dependency
4. Rollback database to v34

**Risk**: Low (compression is isolated in PhotoCompressionService)

**Feature Flag Approach**:

```typescript
export const FEATURES = {
  PHOTO_COMPRESSION: false, // Toggle to disable
};

// In ReportPdfService
if (FEATURES.PHOTO_COMPRESSION && photoMap.size > 0) {
  const html = await this.generateHtmlWithPhotos(reportData, photoMap);
} else {
  // Phase B logic: Generate PDF without photos
  const html = await this.generateHtmlWithoutPhotos(reportData);
}
```

---

## Monitoring & Validation

### Key Metrics to Track

**Phase A Metrics**:
- Log entries per report submission
- Error rate (PDF failures)
- Photo validation accuracy (invalid path detection rate)

**Phase B Metrics**:
- Queue processing time (median, p95, p99)
- Retry rate (% of reports requiring retries)
- Final success rate (% completed after retries)
- Reports stuck in 'pending' for > 5 minutes

**Phase C Metrics**:
- Compression ratio (median, min, max)
- Compression time per photo (median, p95)
- PDF file size distribution
- Photo quality complaints (user feedback)

### Monitoring Dashboard

Create a simple admin screen showing:

```
PDF Generation Statistics (Last 7 Days)

Phase B Queue:
- Pending: 12
- Generating: 2
- Completed: 1,234 (95.2%)
- Failed: 45 (3.5%)
- Avg time: 8.2 seconds

Phase C Compression:
- Avg compression ratio: 23.4%
- Avg time per photo: 320ms
- Total MB saved: 1,250 MB
```

Implementation:

```typescript
// In a new screen: PDFDashboardScreen.tsx
export const PDFDashboardScreen: React.FC = () => {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const fetchStats = async () => {
      const queueStats = await BackgroundPdfQueue.getQueueStats();

      const reports = await database.get<DailyReport>('daily_reports')
        .query(Q.where('created_at', Q.gte(Date.now() - 7 * 24 * 60 * 60 * 1000)))
        .fetch();

      const compressionStats = reports
        .filter((r) => r.photoCompressionEnabled)
        .reduce((acc, r) => ({
          totalOriginalMB: acc.totalOriginalMB + (r.originalPhotoSizeMB || 0),
          totalCompressedMB: acc.totalCompressedMB + (r.compressedPhotoSizeMB || 0),
          count: acc.count + 1,
        }), { totalOriginalMB: 0, totalCompressedMB: 0, count: 0 });

      setStats({
        queueStats,
        compressionStats,
        totalReports: reports.length,
      });
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Refresh every 30s

    return () => clearInterval(interval);
  }, []);

  return (
    <View>
      {/* Render stats in cards */}
    </View>
  );
};
```

---

## Appendix: Code Snippets Reference

### A. Database Migration Commands

```bash
# Check current schema version
# In app, add a debug screen or console log:
console.log('Database version:', database.schema.version);

# Test migration
# Uninstall app, reinstall - migrations run automatically on first launch
```

### B. Manual PDF Generation Test

```typescript
// For testing in isolation
import ReportPdfService from './src/services/ReportPdfService';

const testReportData = {
  id: 'test-123',
  date: '2025-12-20',
  siteName: 'Test Site',
  items: [
    {
      description: 'Test Item 1',
      quantity: 100,
      unit: 'sqft',
      progressLog: {
        notes: 'This is a test note',
        photos: [
          'file:///path/to/photo1.jpg',
          'file:///path/to/photo2.jpg',
        ],
      },
    },
  ],
};

const pdfService = new ReportPdfService();
const pdfPath = await pdfService.generateComprehensiveReport(testReportData);
console.log('PDF generated:', pdfPath);
```

### C. Queue Status Query

```sql
-- Check queue status in database
SELECT
  pdf_generation_status,
  COUNT(*) as count
FROM daily_reports
GROUP BY pdf_generation_status;

-- Find stuck reports (pending > 10 minutes)
SELECT
  id,
  date,
  pdf_generation_status,
  pdf_generation_attempts,
  (strftime('%s', 'now') - pdf_last_attempt_timestamp / 1000) as seconds_since_attempt
FROM daily_reports
WHERE
  pdf_generation_status = 'pending'
  AND pdf_last_attempt_timestamp IS NOT NULL
  AND (strftime('%s', 'now') - pdf_last_attempt_timestamp / 1000) > 600;
```

---

## Next Steps After Implementation

1. **User Acceptance Testing**
   - Deploy to internal testers
   - Collect feedback on PDF quality (Phase C)
   - Validate async UX (Phase B)

2. **Documentation Updates**
   - Update user guide with new PDF behavior
   - Document retry mechanism
   - Explain "PDF generating..." status

3. **Performance Optimization** (if needed)
   - Profile compression library alternatives
   - Optimize queue batch size
   - Add caching for repeat reports

4. **Future Enhancements**
   - PDF templates (custom branding)
   - Photo annotations in PDF
   - Bulk export (multiple reports → single PDF)

---

## Summary

This implementation plan provides a complete roadmap for resolving PDF sharing failures:

**Phase A** (1-2 days): Essential diagnostics infrastructure
**Phase B** (4-5 days): Production-ready async PDF generation
**Phase C** (7-12 days): Optional photo inclusion via compression

**Recommended Approach**: Implement Phase A + B first (total 5-7 days), then evaluate if Phase C is necessary based on user feedback. Phase B alone provides excellent UX by eliminating blocking operations and adding retry reliability.

**Total Estimated Effort**:
- Minimum (A + B): 5-7 days
- Full (A + B + C): 12-17 days

**Risk Assessment**:
- Phase A: Low risk, high value (enables debugging)
- Phase B: Medium risk, high value (solves blocking UX)
- Phase C: Medium risk, medium value (nice-to-have)

Proceed with Phase A as the critical foundation, then Phase B for production reliability.
