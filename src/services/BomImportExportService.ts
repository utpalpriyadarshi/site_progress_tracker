/**
 * BomImportExportService
 *
 * Handles import/export of BOMs to/from Excel and CSV formats
 */

import XLSX from 'xlsx';
import RNFS from 'react-native-fs';
import { Platform } from 'react-native';
// @ts-ignore - no type definitions available
import base64 from 'react-native-base64';
import BomModel from '../../models/BomModel';
import BomItemModel from '../../models/BomItemModel';

export interface ExportBomData {
  bom: BomModel;
  items: BomItemModel[];
  projectName?: string;
}

export interface ImportResult {
  success: boolean;
  totalRows: number;
  validRows: number;
  skippedRows: number;
  errors: string[];
  bomData?: {
    name: string;
    siteCategory: string;
    type: 'estimating' | 'execution';
    quantity: number;
    unit: string;
    description?: string;
  };
  items?: Array<{
    description: string;
    category: 'material' | 'labor' | 'equipment' | 'subcontractor';
    quantity: number;
    unit: string;
    unitCost: number;
    phase?: string;
  }>;
}

class BomImportExportServiceClass {
  /**
   * Export BOM to Excel file
   */
  async exportBomToExcel(data: ExportBomData): Promise<string> {
    try {
      const { bom, items, projectName } = data;

      // Create workbook
      const wb = XLSX.utils.book_new();

      // BOM Summary Sheet
      const summaryData = [
        ['Bill of Materials'],
        [],
        ['BOM Name:', bom.name],
        ['Project:', projectName || ''],
        ['Site Category:', bom.siteCategory],
        ['Type:', bom.type === 'estimating' ? 'Pre-Contract (Estimating)' : 'Post-Contract (Execution)'],
        ['Status:', bom.status.toUpperCase()],
        ['Version:', bom.version],
        ['Quantity:', `${bom.quantity} ${bom.unit}`],
        ['Description:', bom.description || ''],
        [],
        ['Total Estimated Cost:', `₹${bom.totalEstimatedCost.toLocaleString('en-IN')}`],
        ['Created:', new Date(bom.createdDate).toLocaleDateString('en-IN')],
        [],
      ];

      const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, ws1, 'Summary');

      // Items Sheet
      const itemsHeader = ['Item Code', 'Description', 'Category', 'Quantity', 'Unit', 'Unit Cost (₹)', 'Total Cost (₹)', 'Phase'];
      const itemsData = items.map(item => [
        item.itemCode,
        item.description,
        item.category,
        item.quantity,
        item.unit,
        item.unitCost,
        item.totalCost,
        item.phase || '',
      ]);

      const ws2 = XLSX.utils.aoa_to_sheet([itemsHeader, ...itemsData]);

      // Set column widths
      ws2['!cols'] = [
        { wch: 12 },  // Item Code
        { wch: 40 },  // Description
        { wch: 15 },  // Category
        { wch: 10 },  // Quantity
        { wch: 8 },   // Unit
        { wch: 15 },  // Unit Cost
        { wch: 15 },  // Total Cost
        { wch: 15 },  // Phase
      ];

      XLSX.utils.book_append_sheet(wb, ws2, 'Items');

      // Generate Excel file
      const wbout = XLSX.write(wb, { type: 'binary', bookType: 'xlsx' });

      // Convert to base64 for React Native
      const base64 = this.s2ab(wbout);

      // Save file
      const fileName = `BOM_${bom.name.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.xlsx`;
      const path = `${RNFS.DownloadDirectoryPath}/${fileName}`;

      await RNFS.writeFile(path, base64, 'base64');

      return path;
    } catch (error) {
      console.error('[BomImportExportService] Export error:', error);
      throw error;
    }
  }

  /**
   * Import BOM from Excel/CSV file
   */
  async importBomFromFile(filePath: string): Promise<ImportResult> {
    try {
      // Read file
      const fileContent = await RNFS.readFile(filePath, 'base64');
      const data = XLSX.read(fileContent, { type: 'base64' });

      // Get first sheet
      const sheetName = data.SheetNames[0];
      const worksheet = data.Sheets[sheetName];

      // Convert to JSON
      const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      return this.parseImportData(jsonData);
    } catch (error) {
      console.error('[BomImportExportService] Import error:', error);
      throw error;
    }
  }

  /**
   * Parse imported data with flexible validation
   */
  private parseImportData(data: any[][]): ImportResult {
    const result: ImportResult = {
      success: false,
      totalRows: 0,
      validRows: 0,
      skippedRows: 0,
      errors: [],
      items: [],
    };

    if (data.length < 2) {
      result.errors.push('File is empty or has no data rows');
      return result;
    }

    // Find header row (look for key columns)
    let headerRowIndex = -1;
    for (let i = 0; i < Math.min(10, data.length); i++) {
      const row = data[i];
      if (this.isHeaderRow(row)) {
        headerRowIndex = i;
        break;
      }
    }

    if (headerRowIndex === -1) {
      result.errors.push('Could not find header row. Expected columns: Description, Category, Quantity, Unit, Unit Cost');
      return result;
    }

    const headers = data[headerRowIndex].map((h: any) => String(h).trim().toLowerCase());
    const dataRows = data.slice(headerRowIndex + 1);

    result.totalRows = dataRows.length;

    // Find column indices
    const descIndex = this.findColumnIndex(headers, ['description', 'item', 'item name']);
    const catIndex = this.findColumnIndex(headers, ['category', 'type']);
    const qtyIndex = this.findColumnIndex(headers, ['quantity', 'qty']);
    const unitIndex = this.findColumnIndex(headers, ['unit']);
    const costIndex = this.findColumnIndex(headers, ['unit cost', 'cost', 'rate', 'price']);
    const phaseIndex = this.findColumnIndex(headers, ['phase', 'stage']);

    // Validate required columns
    if (descIndex === -1 || qtyIndex === -1 || unitIndex === -1 || costIndex === -1) {
      result.errors.push('Missing required columns. Need: Description, Quantity, Unit, Unit Cost');
      return result;
    }

    // Parse each row
    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];

      // Skip empty rows
      if (!row || row.every((cell: any) => !cell)) {
        result.skippedRows++;
        continue;
      }

      try {
        const description = String(row[descIndex] || '').trim();
        const category = this.parseCategory(row[catIndex]);
        const quantity = parseFloat(String(row[qtyIndex] || '0'));
        const unit = String(row[unitIndex] || '').trim();
        const unitCost = parseFloat(String(row[costIndex] || '0').replace(/[₹,]/g, ''));
        const phase = phaseIndex !== -1 ? String(row[phaseIndex] || '').trim() : undefined;

        // Validate
        if (!description) {
          result.errors.push(`Row ${i + 2}: Missing description`);
          result.skippedRows++;
          continue;
        }

        if (quantity <= 0 || isNaN(quantity)) {
          result.errors.push(`Row ${i + 2}: Invalid quantity (${row[qtyIndex]})`);
          result.skippedRows++;
          continue;
        }

        if (!unit) {
          result.errors.push(`Row ${i + 2}: Missing unit`);
          result.skippedRows++;
          continue;
        }

        if (unitCost < 0 || isNaN(unitCost)) {
          result.errors.push(`Row ${i + 2}: Invalid unit cost (${row[costIndex]})`);
          result.skippedRows++;
          continue;
        }

        // Add valid item
        result.items!.push({
          description,
          category,
          quantity,
          unit,
          unitCost,
          phase,
        });

        result.validRows++;
      } catch (error) {
        result.errors.push(`Row ${i + 2}: ${(error as Error).message}`);
        result.skippedRows++;
      }
    }

    result.success = result.validRows > 0;
    return result;
  }

  /**
   * Check if row looks like a header row
   */
  private isHeaderRow(row: any[]): boolean {
    const rowStr = row.map(cell => String(cell || '').toLowerCase()).join(' ');
    return rowStr.includes('description') &&
           (rowStr.includes('quantity') || rowStr.includes('qty')) &&
           rowStr.includes('unit') &&
           (rowStr.includes('cost') || rowStr.includes('price') || rowStr.includes('rate'));
  }

  /**
   * Find column index by multiple possible names
   */
  private findColumnIndex(headers: string[], possibleNames: string[]): number {
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i];
      if (possibleNames.some(name => header.includes(name))) {
        return i;
      }
    }
    return -1;
  }

  /**
   * Parse category from string
   */
  private parseCategory(value: any): 'material' | 'labor' | 'equipment' | 'subcontractor' {
    const str = String(value || '').toLowerCase().trim();

    if (str.includes('mat') || str.includes('material')) return 'material';
    if (str.includes('lab') || str.includes('labor') || str.includes('labour')) return 'labor';
    if (str.includes('equ') || str.includes('equipment') || str.includes('machinery')) return 'equipment';
    if (str.includes('sub') || str.includes('subcontractor') || str.includes('contractor')) return 'subcontractor';

    return 'material'; // Default
  }

  /**
   * Convert string to base64 for React Native file writing
   */
  private s2ab(s: string): string {
    // Convert binary string to base64
    const bytes: number[] = [];
    for (let i = 0; i < s.length; i++) {
      bytes.push(s.charCodeAt(i) & 0xFF);
    }

    // Convert to base64 (React Native compatible)
    const binString = String.fromCharCode(...bytes);
    return base64.encode(binString);
  }
}

export const BomImportExportService = new BomImportExportServiceClass();
