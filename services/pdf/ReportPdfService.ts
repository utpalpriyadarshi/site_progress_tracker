// @ts-nocheck
import { generatePDF } from 'react-native-html-to-pdf';
import RNFS from 'react-native-fs';
import SiteModel from '../../models/SiteModel';
import ItemModel from '../../models/ItemModel';
import ProgressLogModel from '../../models/ProgressLogModel';
import HindranceModel from '../../models/HindranceModel';
import SiteInspectionModel from '../../models/SiteInspectionModel';
import { logger } from '../../src/services/LoggingService';

interface ReportData {
  site: SiteModel;
  items: Array<{
    item: ItemModel;
    progressLog: ProgressLogModel | null;
  }>;
  supervisorName: string;
  projectName?: string;
  reportDate: Date;
}

interface ComprehensiveReportData {
  site: SiteModel;
  items: Array<{
    item: ItemModel;
    progressLog: ProgressLogModel | null;
  }>;
  hindrances: HindranceModel[];
  inspection: SiteInspectionModel | null;
  supervisorName: string;
  projectName?: string;
  reportDate: Date;
}

export class ReportPdfService {
  /**
   * Calculate total photo count across all items
   */
  private static calculatePhotoCount(items: Array<{ item: ItemModel; progressLog: ProgressLogModel | null }>): number {
    return items.reduce((total, { progressLog }) => {
      if (!progressLog || !progressLog.photos || progressLog.photos === '[]' || progressLog.photos === '') {
        return total;
      }
      try {
        const photos = JSON.parse(progressLog.photos);
        return total + (Array.isArray(photos) ? photos.length : 0);
      } catch {
        return total;
      }
    }, 0);
  }

  /**
   * Collects metadata about photos for diagnostics
   */
  private static async collectPhotoMetadata(items: Array<{ item: ItemModel; progressLog: ProgressLogModel | null }>): Promise<{
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
      photoDetails: [] as Array<{
        itemIndex: number;
        photoIndex: number;
        path: string;
        exists: boolean;
        size: number;
        extension: string;
      }>,
      errors: [] as string[],
    };

    for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
      const { progressLog } = items[itemIndex];

      if (!progressLog || !progressLog.photos || progressLog.photos === '[]' || progressLog.photos === '') {
        continue;
      }

      try {
        const photos = JSON.parse(progressLog.photos);

        if (!Array.isArray(photos)) {
          continue;
        }

        for (let photoIndex = 0; photoIndex < photos.length; photoIndex++) {
          const photo = photos[photoIndex];
          const photoPath = typeof photo === 'string' ? photo : photo?.uri;

          if (!photoPath) {
            continue;
          }

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
              path: photoPath.substring(Math.max(0, photoPath.length - 40)), // Last 40 chars
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
      } catch (parseError) {
        result.errors.push(`Item ${itemIndex}: JSON parsing failed - ${(parseError as Error).message}`);
      }
    }

    return result;
  }

  /**
   * Validates photo paths and logs suspicious entries
   */
  private static validatePhotoPaths(items: Array<{ item: ItemModel; progressLog: ProgressLogModel | null }>): {
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

    items.forEach(({ item, progressLog }, itemIndex) => {
      logger.debug('Validating photo paths for item', {
        component: 'ReportPdfService',
        action: 'validatePhotoPaths',
        itemIndex,
        itemName: item.name,
        hasProgressLog: !!progressLog,
        photosField: progressLog?.photos?.substring(0, 100),
        photosLength: progressLog?.photos?.length,
      });

      if (!progressLog || !progressLog.photos || progressLog.photos === '[]' || progressLog.photos === '') {
        return;
      }

      try {
        const photos = JSON.parse(progressLog.photos);

        logger.debug('Photos parsed successfully', {
          component: 'ReportPdfService',
          action: 'validatePhotoPaths',
          itemName: item.name,
          isArray: Array.isArray(photos),
          photoCount: Array.isArray(photos) ? photos.length : 0,
        });

        if (!Array.isArray(photos)) {
          result.invalidPhotos.push(`Item ${itemIndex} (${item.name}): Photos is not an array`);
          return;
        }

        photos.forEach((photo: any, photoIndex: number) => {
          result.totalPhotos++;
          logger.debug('Photo counted', {
            component: 'ReportPdfService',
            action: 'validatePhotoPaths',
            itemName: item.name,
            photoIndex,
            totalPhotosNow: result.totalPhotos,
          });

          // Check if path exists
          const photoPath = typeof photo === 'string' ? photo : photo?.uri;

          if (!photoPath || photoPath.trim() === '') {
            result.invalidPhotos.push(`Item ${itemIndex} (${item.name}), Photo ${photoIndex}: Empty path`);
            return;
          }

          // Check file extension
          const ext = photoPath.toLowerCase().split('.').pop();
          if (!['jpg', 'jpeg', 'png', 'heic', 'webp'].includes(ext || '')) {
            result.warnings.push(`Item ${itemIndex} (${item.name}), Photo ${photoIndex}: Unexpected extension .${ext}`);
          }

          // Check path format
          if (!photoPath.startsWith('file://') && !photoPath.startsWith('/')) {
            result.warnings.push(`Item ${itemIndex} (${item.name}), Photo ${photoIndex}: Unusual path format ${photoPath.substring(0, 20)}...`);
          }

          result.validPhotos++;
        });
      } catch (error) {
        result.invalidPhotos.push(`Item ${itemIndex} (${item.name}): JSON parsing failed - ${(error as Error).message}`);
      }
    });

    logger.debug('Photo validation completed', {
      component: 'ReportPdfService',
      action: 'validatePhotoPaths',
      totalPhotos: result.totalPhotos,
      validPhotos: result.validPhotos,
      invalidPhotosCount: result.invalidPhotos.length,
      warningsCount: result.warnings.length,
    });

    return result;
  }

  /**
   * Ensure the Documents directory exists
   */
  private static async ensureDocumentsDirectory(): Promise<void> {
    const documentsPath = `${RNFS.DocumentDirectoryPath}/Documents`;
    const exists = await RNFS.exists(documentsPath);

    if (!exists) {
      await RNFS.mkdir(documentsPath);
      logger.info('Created Documents directory', {
        component: 'ReportPdfService',
        action: 'ensureDocumentsDirectory',
        documentsPath,
      });
    }
  }

  /**
   * Generate a PDF report for a site's daily progress
   */
  static async generateDailyReport(reportData: ReportData): Promise<string> {
    const fileName = `DailyReport_${reportData.site.name.replace(/\s/g, '_')}_${this.formatDate(reportData.reportDate)}`;

    try {
      // Ensure Documents directory exists
      await this.ensureDocumentsDirectory();

      // Collect photo metadata
      const photoMetadata = await this.collectPhotoMetadata(reportData.items);

      // Generate HTML content (now async)
      const htmlContent = await this.generateHtmlContent(reportData);

      const options = {
        html: htmlContent,
        fileName: fileName,
        directory: 'Documents',  // Relative path from DocumentDirectoryPath
      };

      logger.info('Starting PDF generation', {
        component: 'ReportPdfService',
        action: 'generateDailyReport',
        fileName,
        siteName: reportData.site.name,
        itemCount: reportData.items.length,
        photoCount: this.calculatePhotoCount(reportData.items),
        totalPhotoSize: photoMetadata.totalSize,
        totalPhotoSizeMB: (photoMetadata.totalSize / 1024 / 1024).toFixed(2),
        photoDetails: photoMetadata.photoDetails.slice(0, 10),
        metadataErrors: photoMetadata.errors,
      });

      const file = await generatePDF(options);

      logger.info('PDF generated successfully', {
        component: 'ReportPdfService',
        action: 'generateDailyReport',
        fileName,
        filePath: file.filePath,
      });

      return file.filePath || '';
    } catch (error) {
      // Collect photo metadata for error diagnostics
      let photoMetadata;
      try {
        photoMetadata = await this.collectPhotoMetadata(reportData.items);
      } catch (metadataError) {
        // If metadata collection fails, use defaults
        photoMetadata = { totalSize: 0, photoDetails: [], errors: ['Metadata collection failed'] };
      }

      logger.error('PDF generation failed', error as Error, {
        component: 'ReportPdfService',
        action: 'generateDailyReport',
        fileName,
        siteName: reportData.site.name,
        itemCount: reportData.items.length,
        photoCount: this.calculatePhotoCount(reportData.items),
        totalPhotoSize: photoMetadata.totalSize,
        totalPhotoSizeMB: (photoMetadata.totalSize / 1024 / 1024).toFixed(2),
        photoDetails: photoMetadata.photoDetails.slice(0, 5),
        metadataErrors: photoMetadata.errors,
      });
      throw new Error('Failed to generate PDF report');
    }
  }

  /**
   * Generate a comprehensive PDF report (progress + hindrances + inspection)
   */
  static async generateComprehensiveReport(reportData: ComprehensiveReportData): Promise<string> {
    const fileName = `ComprehensiveReport_${reportData.site.name.replace(/\s/g, '_')}_${this.formatDate(reportData.reportDate)}`;

    try {
      // Ensure Documents directory exists
      await this.ensureDocumentsDirectory();

      // Validate photo paths
      const photoValidation = this.validatePhotoPaths(reportData.items);

      // Collect photo metadata
      const photoMetadata = await this.collectPhotoMetadata(reportData.items);

      logger.info('Starting comprehensive PDF generation', {
        component: 'ReportPdfService',
        action: 'generateComprehensiveReport',
        fileName,
        siteName: reportData.site.name,
        itemCount: reportData.items.length,

        // Validation results
        totalPhotos: photoValidation.totalPhotos,
        validPhotos: photoValidation.validPhotos,
        invalidPhotos: photoValidation.invalidPhotos.length,
        warnings: photoValidation.warnings.length,

        // Photo metadata
        totalPhotoSize: photoMetadata.totalSize,
        totalPhotoSizeMB: (photoMetadata.totalSize / 1024 / 1024).toFixed(2),
        photoDetails: photoMetadata.photoDetails.slice(0, 10), // First 10 photos
        metadataErrors: photoMetadata.errors,

        hindranceCount: reportData.hindrances.length,
        hasInspection: !!reportData.inspection,
      });

      // Log validation issues if any
      if (photoValidation.invalidPhotos.length > 0) {
        logger.warn('Invalid photo paths detected', {
          component: 'ReportPdfService',
          action: 'generateComprehensiveReport',
          fileName,
          invalidPaths: photoValidation.invalidPhotos,
        });
      }

      if (photoValidation.warnings.length > 0) {
        logger.warn('Photo path warnings', {
          component: 'ReportPdfService',
          action: 'generateComprehensiveReport',
          fileName,
          warnings: photoValidation.warnings,
        });
      }

      // Generate HTML content (now async)
      const htmlContent = await this.generateComprehensiveHtmlContent(reportData);

      const options = {
        html: htmlContent,
        fileName: fileName,
        directory: 'Documents',  // Relative path from DocumentDirectoryPath
      };

      const file = await generatePDF(options);

      logger.info('Comprehensive PDF generated successfully', {
        component: 'ReportPdfService',
        action: 'generateComprehensiveReport',
        fileName,
        filePath: file.filePath,
      });

      return file.filePath || '';
    } catch (error) {
      // Collect photo metadata for error diagnostics
      let photoMetadata;
      try {
        photoMetadata = await this.collectPhotoMetadata(reportData.items);
      } catch (metadataError) {
        // If metadata collection fails, use defaults
        photoMetadata = { totalSize: 0, photoDetails: [], errors: ['Metadata collection failed'] };
      }

      logger.error('Comprehensive PDF generation failed', error as Error, {
        component: 'ReportPdfService',
        action: 'generateComprehensiveReport',
        fileName,
        siteName: reportData.site.name,
        itemCount: reportData.items.length,
        photoCount: this.calculatePhotoCount(reportData.items),
        totalPhotoSize: photoMetadata.totalSize,
        totalPhotoSizeMB: (photoMetadata.totalSize / 1024 / 1024).toFixed(2),
        photoDetails: photoMetadata.photoDetails.slice(0, 5), // First 5 photos for error log
        metadataErrors: photoMetadata.errors,
        hindranceCount: reportData.hindrances.length,
        hasInspection: !!reportData.inspection,
      });
      throw new Error('Failed to generate comprehensive PDF report');
    }
  }

  /**
   * Generate HTML content for the report
   */
  private static async generateHtmlContent(data: ReportData): Promise<string> {
    const { site, items, supervisorName, projectName, reportDate } = data;

    // Calculate overall progress
    const totalProgress = items.length > 0
      ? items.reduce((sum, { item }) => {
          const progress = item.plannedQuantity > 0
            ? (item.completedQuantity / item.plannedQuantity) * 100
            : 0;
          return sum + progress;
        }, 0) / items.length
      : 0;

    // Generate HTML for each item (with async photo handling)
    const itemsHtmlPromises = items.map(async ({ item, progressLog }) => {
      const progress = item.plannedQuantity > 0
        ? ((item.completedQuantity / item.plannedQuantity) * 100).toFixed(1)
        : '0.0';

      // Generate photos HTML if progress log has photos (now async)
      const photosHtml = progressLog ? await this.generatePhotosHtml(progressLog) : '';

      return `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e0e0e0;">${item.name}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; text-align: center;">
            ${item.completedQuantity.toFixed(2)} / ${item.plannedQuantity.toFixed(2)} ${item.unitOfMeasurement}
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; text-align: center;">
            <span style="font-weight: bold; color: ${this.getProgressColor(parseFloat(progress))}">
              ${progress}%
            </span>
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; text-align: center;">
            <span style="
              padding: 4px 8px;
              border-radius: 12px;
              font-size: 12px;
              background-color: ${this.getStatusBackgroundColor(item.status)};
              color: white;
            ">
              ${item.status.replace('_', ' ').toUpperCase()}
            </span>
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; font-size: 12px;">
            ${progressLog?.notes || 'No notes'}
          </td>
        </tr>
        ${photosHtml ? `
        <tr>
          <td colspan="5" style="padding: 16px; background-color: #fafafa; border-bottom: 1px solid #e0e0e0;">
            ${photosHtml}
          </td>
        </tr>
        ` : ''}
      `;
    });

    const itemsHtmlArray = await Promise.all(itemsHtmlPromises);
    const itemsHtml = itemsHtmlArray.join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            padding: 40px;
            color: #333;
          }
          .header {
            background: linear-gradient(135deg, #007AFF 0%, #0051D5 100%);
            color: white;
            padding: 30px;
            border-radius: 8px;
            margin-bottom: 30px;
          }
          .header h1 {
            font-size: 28px;
            margin-bottom: 10px;
          }
          .header p {
            font-size: 14px;
            opacity: 0.9;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
          }
          .info-box {
            background: #f5f5f5;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #007AFF;
          }
          .info-box h3 {
            font-size: 12px;
            color: #666;
            text-transform: uppercase;
            margin-bottom: 8px;
          }
          .info-box p {
            font-size: 16px;
            font-weight: 600;
            color: #333;
          }
          .progress-summary {
            background: #E8F5E9;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
            text-align: center;
          }
          .progress-summary h2 {
            font-size: 18px;
            color: #2E7D32;
            margin-bottom: 10px;
          }
          .progress-value {
            font-size: 48px;
            font-weight: bold;
            color: #4CAF50;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          th {
            background: #f5f5f5;
            padding: 16px 12px;
            text-align: left;
            font-size: 12px;
            font-weight: 600;
            color: #666;
            text-transform: uppercase;
          }
          td {
            font-size: 14px;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e0e0e0;
            color: #666;
            font-size: 12px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          @page {
            margin: 20mm;
            @bottom-center {
              content: "Page " counter(page) " of " counter(pages);
              font-size: 11px;
              color: #999;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          ${projectName ? `<p style="font-size:13px;opacity:0.85;margin-bottom:6px;">Project: ${projectName}</p>` : ''}
          <h1>Daily Progress Report</h1>
          <p>Generated on ${this.formatDateTime(new Date())}</p>
        </div>

        <div class="info-grid">
          <div class="info-box">
            <h3>Site Name</h3>
            <p>${site.name}</p>
          </div>
          <div class="info-box">
            <h3>Location</h3>
            <p>${site.location}</p>
          </div>
          <div class="info-box">
            <h3>Report Date</h3>
            <p>${this.formatDate(reportDate)}</p>
          </div>
          <div class="info-box">
            <h3>Supervisor</h3>
            <p>${supervisorName}</p>
          </div>
        </div>

        <div class="progress-summary">
          <h2>Overall Progress</h2>
          <div class="progress-value">${totalProgress.toFixed(1)}%</div>
          <p style="color: #666; margin-top: 8px;">${items.length} work items tracked</p>
        </div>

        <table>
          <thead>
            <tr>
              <th>Work Item</th>
              <th style="text-align: center;">Quantity</th>
              <th style="text-align: center;">Progress</th>
              <th style="text-align: center;">Status</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="footer">
          <span><strong>MRE Site Tracker</strong> — System Generated Report</span>
          <span>Supervisor: ${supervisorName}</span>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Get color based on progress percentage
   */
  private static getProgressColor(progress: number): string {
    if (progress >= 75) return '#4CAF50'; // Green
    if (progress >= 50) return '#FF9800'; // Orange
    if (progress >= 25) return '#FFC107'; // Yellow
    return '#F44336'; // Red
  }

  /**
   * Get background color for status badge
   */
  private static getStatusBackgroundColor(status: string): string {
    switch (status) {
      case 'completed':
        return '#4CAF50';
      case 'in_progress':
        return '#2196F3';
      case 'not_started':
        return '#9E9E9E';
      default:
        return '#9E9E9E';
    }
  }

  /**
   * Read a photo from disk and return as base64 data URI.
   * Returns empty string if file not found or unreadable.
   */
  private static async photoToBase64(photoPath: string): Promise<string> {
    try {
      const cleanPath = photoPath.startsWith('file://') ? photoPath.slice(7) : photoPath;
      const exists = await RNFS.exists(cleanPath);
      if (!exists) return '';
      const base64 = await RNFS.readFile(cleanPath, 'base64');
      const ext = cleanPath.toLowerCase().split('.').pop() || 'jpeg';
      const mime = ext === 'png' ? 'image/png' : 'image/jpeg';
      return `data:${mime};base64,${base64}`;
    } catch {
      return '';
    }
  }

  /**
   * Generate HTML for photos section — embeds up to 3 photos as base64 thumbnails.
   */
  private static async generatePhotosHtml(progressLog: ProgressLogModel): Promise<string> {
    if (!progressLog.photos || progressLog.photos === '[]' || progressLog.photos === '') {
      return '';
    }

    try {
      const photos = JSON.parse(progressLog.photos);
      if (!Array.isArray(photos) || photos.length === 0) return '';

      // Limit to first 3 to keep PDF size manageable
      const subset = photos.slice(0, 3);
      const dataUris = await Promise.all(
        subset.map((photo: any) => {
          const path = typeof photo === 'string' ? photo : photo?.uri;
          return path ? this.photoToBase64(path) : Promise.resolve('');
        })
      );

      const imgTags = dataUris
        .filter(uri => uri.length > 0)
        .map(uri =>
          `<img src="${uri}" style="width:180px;height:135px;object-fit:cover;border-radius:4px;margin-right:8px;" />`
        )
        .join('');

      if (!imgTags) {
        return `<p style="font-size:12px;color:#666;font-style:italic;">&#128247; ${photos.length} photo(s) — could not load files</p>`;
      }

      return `
        <div style="margin-top:8px;">
          <p style="font-size:11px;color:#666;margin-bottom:6px;">&#128247; ${photos.length} photo(s)${photos.length > 3 ? ' (showing first 3)' : ''}</p>
          <div style="display:flex;flex-direction:row;">${imgTags}</div>
        </div>
      `;
    } catch (error) {
      logger.error('Error parsing photos JSON', error as Error, {
        component: 'ReportPdfService',
        action: 'generatePhotosHtml',
        photosData: progressLog.photos,
      });
      return '';
    }
  }

  /**
   * Format date as YYYY-MM-DD
   */
  private static formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Format date and time for display
   */
  private static formatDateTime(date: Date): string {
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * Generate comprehensive HTML content (progress + hindrances + inspection)
   */
  private static async generateComprehensiveHtmlContent(data: ComprehensiveReportData): Promise<string> {
    const { site, items, hindrances, inspection, supervisorName, projectName, reportDate } = data;

    // Calculate overall progress
    const totalProgress = items.length > 0
      ? items.reduce((sum, { item }) => {
          const progress = item.plannedQuantity > 0
            ? (item.completedQuantity / item.plannedQuantity) * 100
            : 0;
          return sum + progress;
        }, 0) / items.length
      : 0;

    // Generate sections (now async)
    const progressSection = await this.generateProgressSection(items);
    const hindranceSection = await this.generateHindranceSection(hindrances);
    const inspectionSection = await this.generateInspectionSection(inspection);

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            padding: 40px;
            color: #333;
          }
          .header {
            background: linear-gradient(135deg, #007AFF 0%, #0051D5 100%);
            color: white;
            padding: 30px;
            border-radius: 8px;
            margin-bottom: 30px;
          }
          .header h1 {
            font-size: 28px;
            margin-bottom: 10px;
          }
          .header p {
            font-size: 14px;
            opacity: 0.9;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
          }
          .info-box {
            background: #f5f5f5;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #007AFF;
          }
          .info-box h3 {
            font-size: 12px;
            color: #666;
            text-transform: uppercase;
            margin-bottom: 8px;
          }
          .info-box p {
            font-size: 16px;
            font-weight: 600;
            color: #333;
          }
          .progress-summary {
            background: #E8F5E9;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
            text-align: center;
          }
          .progress-summary h2 {
            font-size: 18px;
            color: #2E7D32;
            margin-bottom: 10px;
          }
          .progress-value {
            font-size: 48px;
            font-weight: bold;
            color: #4CAF50;
          }
          .section {
            margin-bottom: 40px;
          }
          .section-header {
            background: #f5f5f5;
            padding: 16px;
            border-radius: 8px;
            margin-bottom: 20px;
            border-left: 4px solid #007AFF;
          }
          .section-header h2 {
            font-size: 20px;
            color: #333;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            margin-bottom: 20px;
          }
          th {
            background: #f5f5f5;
            padding: 16px 12px;
            text-align: left;
            font-size: 12px;
            font-weight: 600;
            color: #666;
            text-transform: uppercase;
          }
          td {
            padding: 12px;
            border-bottom: 1px solid #e0e0e0;
            font-size: 14px;
          }
          .priority-high {
            background-color: #F44336;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 600;
          }
          .priority-medium {
            background-color: #FF9800;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 600;
          }
          .priority-low {
            background-color: #4CAF50;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 600;
          }
          .status-badge {
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
          }
          .rating-excellent { background: #4CAF50; color: white; }
          .rating-good { background: #8BC34A; color: white; }
          .rating-fair { background: #FF9800; color: white; }
          .rating-poor { background: #F44336; color: white; }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e0e0e0;
            color: #666;
            font-size: 12px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          @page {
            margin: 20mm;
            @bottom-center {
              content: "Page " counter(page) " of " counter(pages);
              font-size: 11px;
              color: #999;
            }
          }
          .empty-section {
            text-align: center;
            padding: 40px;
            color: #999;
            font-style: italic;
          }
        </style>
      </head>
      <body>
        <div class="header">
          ${projectName ? `<p style="font-size:13px;opacity:0.85;margin-bottom:6px;">Project: ${projectName}</p>` : ''}
          <h1>Comprehensive Daily Site Report</h1>
          <p>Generated on ${this.formatDateTime(new Date())}</p>
        </div>

        <div class="info-grid">
          <div class="info-box">
            <h3>Site Name</h3>
            <p>${site.name}</p>
          </div>
          <div class="info-box">
            <h3>Location</h3>
            <p>${site.location}</p>
          </div>
          <div class="info-box">
            <h3>Report Date</h3>
            <p>${this.formatDate(reportDate)}</p>
          </div>
          <div class="info-box">
            <h3>Supervisor</h3>
            <p>${supervisorName}</p>
          </div>
        </div>

        <div class="progress-summary">
          <h2>Overall Progress</h2>
          <div class="progress-value">${totalProgress.toFixed(1)}%</div>
          <p style="color: #666; margin-top: 8px;">
            ${items.length} work items | ${hindrances.length} hindrances | ${inspection ? '1 inspection' : 'No inspection'}
          </p>
        </div>

        ${progressSection}
        ${hindranceSection}
        ${inspectionSection}

        <div class="footer">
          <span><strong>MRE Site Tracker</strong> — System Generated Report</span>
          <span>Supervisor: ${supervisorName}</span>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate progress section HTML
   */
  private static async generateProgressSection(items: Array<{ item: ItemModel; progressLog: ProgressLogModel | null }>): Promise<string> {
    if (items.length === 0) {
      return `
        <div class="section">
          <div class="section-header">
            <h2>✅ Progress Updates</h2>
          </div>
          <div class="empty-section">No progress updates for today</div>
        </div>
      `;
    }

    const itemsHtmlPromises = items.map(async ({ item, progressLog }) => {
      const progress = item.plannedQuantity > 0
        ? ((item.completedQuantity / item.plannedQuantity) * 100).toFixed(1)
        : '0.0';

      const photosHtml = progressLog ? await this.generatePhotosHtml(progressLog) : '';

      return `
        <tr>
          <td>${item.name}</td>
          <td style="text-align: center;">
            ${item.completedQuantity.toFixed(2)} / ${item.plannedQuantity.toFixed(2)} ${item.unitOfMeasurement}
          </td>
          <td style="text-align: center;">
            <span style="font-weight: bold; color: ${this.getProgressColor(parseFloat(progress))}">
              ${progress}%
            </span>
          </td>
          <td style="text-align: center;">
            <span class="status-badge" style="background-color: ${this.getStatusBackgroundColor(item.status)}; color: white;">
              ${item.status.replace('_', ' ')}
            </span>
          </td>
          <td style="font-size: 12px;">
            ${progressLog?.notes || 'No notes'}
          </td>
        </tr>
        ${photosHtml ? `
        <tr>
          <td colspan="5" style="padding: 16px; background-color: #fafafa;">
            ${photosHtml}
          </td>
        </tr>
        ` : ''}
      `;
    });

    const itemsHtmlArray = await Promise.all(itemsHtmlPromises);
    const itemsHtml = itemsHtmlArray.join('');

    return `
      <div class="section">
        <div class="section-header">
          <h2>✅ Progress Updates</h2>
        </div>
        <table>
          <thead>
            <tr>
              <th>Work Item</th>
              <th style="text-align: center;">Quantity</th>
              <th style="text-align: center;">Progress</th>
              <th style="text-align: center;">Status</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
      </div>
    `;
  }

  /**
   * Generate hindrance section HTML
   */
  private static async generateHindranceSection(hindrances: HindranceModel[]): Promise<string> {
    if (hindrances.length === 0) {
      return `
        <div class="section">
          <div class="section-header">
            <h2>⚠️ Hindrances & Issues</h2>
          </div>
          <div class="empty-section">No hindrances reported for today</div>
        </div>
      `;
    }

    const hindrancesHtmlPromises = hindrances.map(async (hindrance, index) => {
      const priorityClass = `priority-${hindrance.priority}`;
      const photos = await this.generateHindrancePhotosHtml(hindrance);

      return `
        <tr>
          <td>${index + 1}</td>
          <td>
            <strong>${hindrance.title}</strong>
            <div style="font-size: 12px; color: #666; margin-top: 4px;">${hindrance.description}</div>
          </td>
          <td style="text-align: center;">
            <span class="${priorityClass}">${hindrance.priority.toUpperCase()}</span>
          </td>
          <td style="text-align: center;">
            <span class="status-badge" style="background-color: ${this.getHindranceStatusColor(hindrance.status)}; color: white;">
              ${hindrance.status.replace('_', ' ')}
            </span>
          </td>
        </tr>
        ${photos ? `
        <tr>
          <td colspan="4" style="padding: 16px; background-color: #fafafa;">
            ${photos}
          </td>
        </tr>
        ` : ''}
      `;
    });

    const hindrancesHtmlArray = await Promise.all(hindrancesHtmlPromises);
    const hindrancesHtml = hindrancesHtmlArray.join('');

    return `
      <div class="section">
        <div class="section-header">
          <h2>⚠️ Hindrances & Issues (${hindrances.length})</h2>
        </div>
        <table>
          <thead>
            <tr>
              <th style="width: 40px;">#</th>
              <th>Issue</th>
              <th style="text-align: center; width: 100px;">Priority</th>
              <th style="text-align: center; width: 120px;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${hindrancesHtml}
          </tbody>
        </table>
      </div>
    `;
  }

  /**
   * Generate inspection section HTML
   */
  private static async generateInspectionSection(inspection: SiteInspectionModel | null): Promise<string> {
    if (!inspection) {
      return `
        <div class="section">
          <div class="section-header">
            <h2>🔍 Site Inspection</h2>
          </div>
          <div class="empty-section">No site inspection performed today</div>
        </div>
      `;
    }

    const ratingClass = `rating-${inspection.overallRating}`;
    const checklistData = this.parseChecklistData(inspection.checklistData);
    const photos = await this.generateInspectionPhotosHtml(inspection);

    return `
      <div class="section">
        <div class="section-header">
          <h2>🔍 Site Inspection</h2>
        </div>
        <table>
          <tr>
            <td style="width: 200px;"><strong>Inspection Type</strong></td>
            <td>${inspection.inspectionType}</td>
          </tr>
          <tr>
            <td><strong>Overall Rating</strong></td>
            <td>
              <span class="status-badge ${ratingClass}">
                ${inspection.overallRating.toUpperCase()}
              </span>
            </td>
          </tr>
          <tr>
            <td><strong>Safety Flagged</strong></td>
            <td>${inspection.safetyFlagged ? '🚨 YES' : '✅ NO'}</td>
          </tr>
          ${inspection.notes ? `
          <tr>
            <td><strong>Notes</strong></td>
            <td>${inspection.notes}</td>
          </tr>
          ` : ''}
          ${inspection.followUpNotes ? `
          <tr>
            <td><strong>Follow-up Actions</strong></td>
            <td>${inspection.followUpNotes}</td>
          </tr>
          ` : ''}
        </table>
        ${checklistData.length > 0 ? `
        <h3 style="margin: 20px 0 10px 0; font-size: 16px;">Checklist Results</h3>
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th style="text-align: center; width: 100px;">Result</th>
            </tr>
          </thead>
          <tbody>
            ${checklistData.map(item => `
              <tr>
                <td>${item.name}</td>
                <td style="text-align: center;">
                  ${item.status === 'pass' ? '✅ PASS' : item.status === 'fail' ? '❌ FAIL' : '➖ N/A'}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        ` : ''}
        ${photos ? `
        <div style="margin-top: 20px; padding: 16px; background-color: #fafafa; border-radius: 8px;">
          ${photos}
        </div>
        ` : ''}
      </div>
    `;
  }

  /**
   * Generate hindrance photos HTML — embeds up to 3 photos as base64 thumbnails.
   */
  private static async generateHindrancePhotosHtml(hindrance: HindranceModel): Promise<string> {
    if (!hindrance.photos || hindrance.photos === '[]' || hindrance.photos === '') {
      return '';
    }
    try {
      const photos = JSON.parse(hindrance.photos);
      if (!Array.isArray(photos) || photos.length === 0) return '';
      const subset = photos.slice(0, 3);
      const dataUris = await Promise.all(
        subset.map((photo: any) => {
          const path = typeof photo === 'string' ? photo : photo?.uri;
          return path ? this.photoToBase64(path) : Promise.resolve('');
        })
      );
      const imgTags = dataUris
        .filter(uri => uri.length > 0)
        .map(uri =>
          `<img src="${uri}" style="width:180px;height:135px;object-fit:cover;border-radius:4px;margin-right:8px;" />`
        )
        .join('');
      if (!imgTags) return '';
      return `
        <div style="margin-top:8px;">
          <p style="font-size:11px;color:#666;margin-bottom:6px;">&#128247; ${photos.length} photo(s)${photos.length > 3 ? ' (showing first 3)' : ''}</p>
          <div style="display:flex;flex-direction:row;">${imgTags}</div>
        </div>
      `;
    } catch {
      return '';
    }
  }

  /**
   * Generate inspection photos HTML — embeds up to 3 photos as base64 thumbnails.
   */
  private static async generateInspectionPhotosHtml(inspection: SiteInspectionModel): Promise<string> {
    if (!inspection.photos || inspection.photos === '[]' || inspection.photos === '') {
      return '';
    }
    try {
      const photos = JSON.parse(inspection.photos);
      if (!Array.isArray(photos) || photos.length === 0) return '';
      const subset = photos.slice(0, 3);
      const dataUris = await Promise.all(
        subset.map((photo: any) => {
          const path = typeof photo === 'string' ? photo : photo?.uri;
          return path ? this.photoToBase64(path) : Promise.resolve('');
        })
      );
      const imgTags = dataUris
        .filter(uri => uri.length > 0)
        .map(uri =>
          `<img src="${uri}" style="width:180px;height:135px;object-fit:cover;border-radius:4px;margin-right:8px;" />`
        )
        .join('');
      if (!imgTags) return '';
      return `
        <div style="margin-top:8px;">
          <p style="font-size:11px;color:#666;margin-bottom:6px;">&#128247; ${photos.length} photo(s)${photos.length > 3 ? ' (showing first 3)' : ''}</p>
          <div style="display:flex;flex-direction:row;">${imgTags}</div>
        </div>
      `;
    } catch {
      return '';
    }
  }

  /**
   * Parse checklist data JSON
   */
  private static parseChecklistData(checklistJson: string): Array<{ name: string; status: string }> {
    try {
      const data = JSON.parse(checklistJson);
      if (Array.isArray(data)) {
        return data;
      }
      return [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Get hindrance status color
   */
  private static getHindranceStatusColor(status: string): string {
    switch (status) {
      case 'resolved':
      case 'closed':
        return '#4CAF50';
      case 'in_progress':
        return '#2196F3';
      case 'open':
        return '#FF9800';
      default:
        return '#9E9E9E';
    }
  }
}
