import { generatePDF } from 'react-native-html-to-pdf';
import RNFS from 'react-native-fs';
import SiteModel from '../../models/SiteModel';
import ItemModel from '../../models/ItemModel';
import ProgressLogModel from '../../models/ProgressLogModel';
import HindranceModel from '../../models/HindranceModel';
import SiteInspectionModel from '../../models/SiteInspectionModel';

interface ReportData {
  site: SiteModel;
  items: Array<{
    item: ItemModel;
    progressLog: ProgressLogModel | null;
  }>;
  supervisorName: string;
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
  reportDate: Date;
}

export class ReportPdfService {
  /**
   * Ensure the Documents directory exists
   */
  private static async ensureDocumentsDirectory(): Promise<void> {
    const documentsPath = `${RNFS.DocumentDirectoryPath}/Documents`;
    const exists = await RNFS.exists(documentsPath);

    if (!exists) {
      await RNFS.mkdir(documentsPath);
      console.log('✅ Created Documents directory:', documentsPath);
    }
  }

  /**
   * Generate a PDF report for a site's daily progress
   */
  static async generateDailyReport(reportData: ReportData): Promise<string> {
    try {
      // Ensure Documents directory exists
      await this.ensureDocumentsDirectory();

      // Generate HTML content (now async)
      const htmlContent = await this.generateHtmlContent(reportData);

      const fileName = `DailyReport_${reportData.site.name.replace(/\s/g, '_')}_${this.formatDate(reportData.reportDate)}`;

      const options = {
        html: htmlContent,
        fileName: fileName,
        directory: 'Documents',  // Relative path from DocumentDirectoryPath
      };

      console.log('📄 Generating PDF:', fileName);
      const file = await generatePDF(options);
      console.log('✅ PDF generated successfully:', file.filePath);
      return file.filePath || '';
    } catch (error) {
      console.error('❌ Error generating PDF:', error);
      throw new Error('Failed to generate PDF report');
    }
  }

  /**
   * Generate a comprehensive PDF report (progress + hindrances + inspection)
   */
  static async generateComprehensiveReport(reportData: ComprehensiveReportData): Promise<string> {
    try {
      // Ensure Documents directory exists
      await this.ensureDocumentsDirectory();

      // Generate HTML content (now async)
      const htmlContent = await this.generateComprehensiveHtmlContent(reportData);

      const fileName = `ComprehensiveReport_${reportData.site.name.replace(/\s/g, '_')}_${this.formatDate(reportData.reportDate)}`;

      const options = {
        html: htmlContent,
        fileName: fileName,
        directory: 'Documents',  // Relative path from DocumentDirectoryPath
      };

      console.log('📄 Generating comprehensive PDF:', fileName);
      const file = await generatePDF(options);
      console.log('✅ Comprehensive PDF generated successfully:', file.filePath);
      return file.filePath || '';
    } catch (error) {
      console.error('❌ Error generating comprehensive PDF:', error);
      throw new Error('Failed to generate comprehensive PDF report');
    }
  }

  /**
   * Generate HTML content for the report
   */
  private static async generateHtmlContent(data: ReportData): Promise<string> {
    const { site, items, supervisorName, reportDate } = data;

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
            text-align: center;
            color: #666;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="header">
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
          <p><strong>Construction Site Progress Tracker</strong></p>
          <p>This is a system-generated report. For queries, contact the project supervisor.</p>
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
   * Generate HTML for photos section
   * Temporarily disabled - photos cause PDF generation to fail due to size
   */
  private static async generatePhotosHtml(progressLog: ProgressLogModel): Promise<string> {
    // Check if photos exist and are not empty
    if (!progressLog.photos || progressLog.photos === '[]' || progressLog.photos === '') {
      return '';
    }

    try {
      // Parse the photos JSON string
      const photos = JSON.parse(progressLog.photos);

      if (!Array.isArray(photos) || photos.length === 0) {
        return '';
      }

      // TEMPORARILY: Just show count, don't embed images to avoid PDF generation failure
      return `
        <div style="margin-top: 8px;">
          <p style="
            font-size: 12px;
            color: #666;
            font-style: italic;
          ">📸 ${photos.length} photo${photos.length > 1 ? 's' : ''} attached (not shown in PDF due to size limitations)</p>
        </div>
      `;
    } catch (error) {
      console.error('Error parsing photos JSON:', error);
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
    const { site, items, hindrances, inspection, supervisorName, reportDate } = data;

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
            text-align: center;
            color: #666;
            font-size: 12px;
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
          <h1>📋 Comprehensive Daily Site Report</h1>
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
          <p><strong>Construction Site Progress Tracker</strong></p>
          <p>This is a system-generated comprehensive report. For queries, contact the project supervisor.</p>
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
   * Generate hindrance photos HTML
   * Temporarily disabled - photos cause PDF generation to fail due to size
   */
  private static async generateHindrancePhotosHtml(hindrance: HindranceModel): Promise<string> {
    if (!hindrance.photos || hindrance.photos === '[]' || hindrance.photos === '') {
      return '';
    }

    try {
      const photos = JSON.parse(hindrance.photos);
      if (!Array.isArray(photos) || photos.length === 0) {
        return '';
      }

      // TEMPORARILY: Just show count
      return `
        <div style="margin-top: 8px;">
          <p style="font-size: 12px; color: #666; font-style: italic;">📸 ${photos.length} photo${photos.length > 1 ? 's' : ''} attached (not shown in PDF due to size limitations)</p>
        </div>
      `;
    } catch (error) {
      return '';
    }
  }

  /**
   * Generate inspection photos HTML
   * Temporarily disabled - photos cause PDF generation to fail due to size
   */
  private static async generateInspectionPhotosHtml(inspection: SiteInspectionModel): Promise<string> {
    if (!inspection.photos || inspection.photos === '[]' || inspection.photos === '') {
      return '';
    }

    try {
      const photos = JSON.parse(inspection.photos);
      if (!Array.isArray(photos) || photos.length === 0) {
        return '';
      }

      // TEMPORARILY: Just show count
      return `
        <div style="margin-top: 8px;">
          <p style="font-size: 12px; color: #666; font-style: italic;">📸 ${photos.length} photo${photos.length > 1 ? 's' : ''} attached (not shown in PDF due to size limitations)</p>
        </div>
      `;
    } catch (error) {
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
