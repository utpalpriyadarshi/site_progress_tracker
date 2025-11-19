import { generatePDF } from 'react-native-html-to-pdf';
import SiteModel from '../../models/SiteModel';
import ItemModel from '../../models/ItemModel';
import ProgressLogModel from '../../models/ProgressLogModel';

interface ReportData {
  site: SiteModel;
  items: Array<{
    item: ItemModel;
    progressLog: ProgressLogModel | null;
  }>;
  supervisorName: string;
  reportDate: Date;
}

export class ReportPdfService {
  /**
   * Generate a PDF report for a site's daily progress
   */
  static async generateDailyReport(reportData: ReportData): Promise<string> {
    const htmlContent = this.generateHtmlContent(reportData);

    try {
      const options = {
        html: htmlContent,
        fileName: `DailyReport_${reportData.site.name.replace(/\s/g, '_')}_${this.formatDate(reportData.reportDate)}`,
        directory: 'Documents',
      };

      const file = await generatePDF(options);
      return file.filePath || '';
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw new Error('Failed to generate PDF report');
    }
  }

  /**
   * Generate HTML content for the report
   */
  private static generateHtmlContent(data: ReportData): string {
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

    const itemsHtml = items
      .map(({ item, progressLog }) => {
        const progress = item.plannedQuantity > 0
          ? ((item.completedQuantity / item.plannedQuantity) * 100).toFixed(1)
          : '0.0';

        // Generate photos HTML if progress log has photos
        const photosHtml = progressLog ? this.generatePhotosHtml(progressLog) : '';

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
      })
      .join('');

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
   */
  private static generatePhotosHtml(progressLog: ProgressLogModel): string {
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

      // Generate HTML for each photo with proper layout
      const photosHtml = photos
        .map((photoUri: string, index: number) => {
          // Remove 'file://' prefix if it exists to avoid doubling
          const cleanUri = photoUri.replace(/^file:\/\//, '');
          return `
          <div style="
            display: inline-block;
            margin: 8px;
            vertical-align: top;
            text-align: center;
          ">
            <img
              src="file://${cleanUri}"
              style="
                width: 200px;
                height: 150px;
                object-fit: cover;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                border: 1px solid #e0e0e0;
              "
            />
            <p style="
              margin-top: 6px;
              font-size: 10px;
              color: #666;
              font-weight: 500;
            ">Photo ${index + 1}</p>
          </div>
        `;
        })
        .join('');

      return `
        <div style="margin-top: 8px;">
          <h4 style="
            font-size: 12px;
            color: #666;
            margin-bottom: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          ">📸 Attached Photos (${photos.length})</h4>
          <div style="
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
          ">
            ${photosHtml}
          </div>
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
}
