/**
 * BOM File Parser Utility - v2.10 Phase 6A
 *
 * Handles parsing of Excel (.xlsx, .xls) and CSV files for BOM import
 */

export interface ParsedBomRow {
  sn: string;
  description: string;
  category: string;
  subCategory?: string;
  quantity: number;
  unit: string;
  unitCost: number;
  totalCost: number;
  phase?: string;
  doorsId?: string;
  notes?: string;
}

export interface ParseResult {
  success: boolean;
  data: ParsedBomRow[];
  headers: string[];
  rowCount: number;
  errors: string[];
}

/**
 * Parse CSV file content
 */
export const parseCSV = (content: string): ParseResult => {
  try {
    const lines = content.split('\n').filter((line) => line.trim());
    if (lines.length === 0) {
      return {
        success: false,
        data: [],
        headers: [],
        rowCount: 0,
        errors: ['File is empty'],
      };
    }

    // Parse headers
    const headers = lines[0].split(',').map((h) => h.trim().replace(/"/g, ''));

    // Parse data rows
    const data: ParsedBomRow[] = [];
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      try {
        const values = lines[i].split(',').map((v) => v.trim().replace(/"/g, ''));

        // Basic row parsing (will be enhanced in Phase 6B)
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });

        data.push(row as ParsedBomRow);
      } catch (err) {
        errors.push(`Error parsing row ${i + 1}: ${err}`);
      }
    }

    return {
      success: errors.length === 0,
      data,
      headers,
      rowCount: data.length,
      errors,
    };
  } catch (error) {
    return {
      success: false,
      data: [],
      headers: [],
      rowCount: 0,
      errors: [`Failed to parse CSV: ${error}`],
    };
  }
};

/**
 * Parse Excel file (placeholder for Phase 6B)
 * Will require xlsx library: npm install xlsx
 */
export const parseExcel = async (_fileUri: string): Promise<ParseResult> => {
  // TODO: Implement Excel parsing in Phase 6B
  // Will use 'xlsx' library to read .xlsx/.xls files
  return {
    success: false,
    data: [],
    headers: [],
    rowCount: 0,
    errors: ['Excel parsing not yet implemented - will be added in Phase 6B'],
  };
};

/**
 * Validate file type
 */
export const validateFileType = (fileName: string): boolean => {
  const ext = fileName.toLowerCase().split('.').pop();
  return ext === 'csv' || ext === 'xlsx' || ext === 'xls';
};

/**
 * Validate file size (max 10MB)
 */
export const validateFileSize = (sizeInBytes: number): boolean => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  return sizeInBytes <= maxSize;
};

/**
 * Format file size for display
 */
export const formatFileSize = (sizeInBytes: number): string => {
  if (sizeInBytes < 1024) {
    return `${sizeInBytes} B`;
  } else if (sizeInBytes < 1024 * 1024) {
    return `${(sizeInBytes / 1024).toFixed(2)} KB`;
  } else {
    return `${(sizeInBytes / (1024 * 1024)).toFixed(2)} MB`;
  }
};

/**
 * Auto-detect column mapping based on common header names
 */
export const autoDetectColumns = (headers: string[]): Record<string, string> => {
  const mapping: Record<string, string> = {};

  headers.forEach((header) => {
    const lowerHeader = header.toLowerCase().trim();

    // S.N / Serial Number
    if (lowerHeader.includes('s.n') || lowerHeader.includes('serial') || lowerHeader.includes('sn')) {
      mapping.sn = header;
    }
    // Description
    else if (lowerHeader.includes('description') || lowerHeader.includes('item')) {
      mapping.description = header;
    }
    // Category
    else if (lowerHeader === 'category' || lowerHeader.includes('main category')) {
      mapping.category = header;
    }
    // Sub-Category
    else if (lowerHeader.includes('sub') && lowerHeader.includes('category')) {
      mapping.subCategory = header;
    }
    // Quantity
    else if (lowerHeader === 'quantity' || lowerHeader === 'qty') {
      mapping.quantity = header;
    }
    // Unit
    else if (lowerHeader === 'unit' || lowerHeader.includes('uom')) {
      mapping.unit = header;
    }
    // Unit Cost
    else if (lowerHeader.includes('unit') && lowerHeader.includes('cost')) {
      mapping.unitCost = header;
    }
    // Total Cost
    else if (lowerHeader.includes('total') && lowerHeader.includes('cost')) {
      mapping.totalCost = header;
    }
    // Phase
    else if (lowerHeader === 'phase') {
      mapping.phase = header;
    }
    // DOORS ID
    else if (lowerHeader.includes('doors') || lowerHeader.includes('package id')) {
      mapping.doorsId = header;
    }
    // Notes
    else if (lowerHeader.includes('note') || lowerHeader.includes('remark')) {
      mapping.notes = header;
    }
  });

  return mapping;
};

/**
 * Get required column fields
 */
export const getRequiredFields = (): string[] => {
  return ['description', 'category', 'quantity', 'unit', 'unitCost'];
};

/**
 * Validate that all required columns are mapped
 */
export const validateColumnMapping = (mapping: Record<string, string>): string[] => {
  const required = getRequiredFields();
  const missing: string[] = [];

  required.forEach((field) => {
    if (!mapping[field]) {
      missing.push(field);
    }
  });

  return missing;
};
