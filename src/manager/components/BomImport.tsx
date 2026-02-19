import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { logger } from '../../services/LoggingService';
import { COLORS } from '../../theme/colors';
// Note: You'll need to install these packages:
// npm install react-native-document-picker
// npm install xlsx

/**
 * BomImport
 *
 * Component for importing BOM items from CSV or Excel files
 *
 * Features:
 * - CSV file import
 * - Excel (XLS/XLSX) file import
 * - Data validation
 * - Preview before import
 * - Bulk item creation
 *
 * CSV Format Expected:
 * itemCode,description,category,subCategory,quantity,unit,unitCost,wbsCode,phase,notes
 * MAT-001,Concrete M25,material,concrete,100,m3,5000,1.2.1,Foundation,
 */

interface BomImportProps {
  bomId: string;
  onImportComplete: (itemCount: number) => void;
  onCancel: () => void;
  addBomItem: (bomId: string, itemData: any) => Promise<any>;
}

interface ImportedItem {
  itemCode: string;
  description: string;
  category: 'material' | 'labor' | 'equipment' | 'subcontractor';
  subCategory?: string;
  quantity: number;
  unit: string;
  unitCost: number;
  wbsCode?: string;
  phase?: string;
  notes?: string;
  isValid: boolean;
  error?: string;
}

const BomImport: React.FC<BomImportProps> = ({ bomId, onImportComplete, onCancel, addBomItem }) => {
  const [importing, setImporting] = useState(false);
  const [previewData, setPreviewData] = useState<ImportedItem[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  /**
   * Parse CSV content
   */
  const parseCSV = (content: string): ImportedItem[] => {
    const lines = content.trim().split('\n');
    if (lines.length < 2) {
      Alert.alert('Error', 'CSV file is empty or invalid');
      return [];
    }

    const header = lines[0].split(',').map((h) => h.trim());
    const items: ImportedItem[] = [];

    // Validate header
    const requiredColumns = ['itemCode', 'description', 'category', 'quantity', 'unit', 'unitCost'];
    const missingColumns = requiredColumns.filter((col) => !header.includes(col));
    if (missingColumns.length > 0) {
      Alert.alert('Error', `Missing required columns: ${missingColumns.join(', ')}`);
      return [];
    }

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map((v) => v.trim());
      if (values.length < header.length) continue; // Skip incomplete rows

      const item: any = {};
      header.forEach((col, index) => {
        item[col] = values[index];
      });

      // Validate and convert
      const parsedItem = validateAndParseItem(item);
      items.push(parsedItem);
    }

    return items;
  };

  /**
   * Validate and parse item data
   */
  const validateAndParseItem = (data: any): ImportedItem => {
    let isValid = true;
    let error = '';

    // Validate required fields
    if (!data.itemCode || !data.description) {
      isValid = false;
      error = 'Missing item code or description';
    }

    // Validate category
    const validCategories = ['material', 'labor', 'equipment', 'subcontractor'];
    if (!validCategories.includes(data.category?.toLowerCase())) {
      isValid = false;
      error = 'Invalid category. Must be: material, labor, equipment, or subcontractor';
    }

    // Parse quantity and unitCost
    const quantity = parseFloat(data.quantity);
    const unitCost = parseFloat(data.unitCost);

    if (isNaN(quantity) || quantity < 0) {
      isValid = false;
      error = 'Invalid quantity';
    }

    if (isNaN(unitCost) || unitCost < 0) {
      isValid = false;
      error = 'Invalid unit cost';
    }

    if (!data.unit) {
      isValid = false;
      error = 'Missing unit';
    }

    return {
      itemCode: data.itemCode || '',
      description: data.description || '',
      category: (data.category?.toLowerCase() || 'material') as any,
      subCategory: data.subCategory || undefined,
      quantity: quantity || 0,
      unit: data.unit || '',
      unitCost: unitCost || 0,
      wbsCode: data.wbsCode || undefined,
      phase: data.phase || undefined,
      notes: data.notes || undefined,
      isValid,
      error,
    };
  };

  /**
   * Handle file selection
   * Note: This is a placeholder. You'll need react-native-document-picker for actual file selection
   */
  const handleSelectFile = async () => {
    Alert.alert(
      'Import BOM Items',
      'To implement file import:\n\n1. Install: npm install react-native-document-picker\n2. Install: npm install xlsx\n3. Update this component with actual file picker\n\nFor now, you can:\n- Use the template below\n- Copy to Excel/CSV\n- Import via file picker (after packages installed)',
      [{ text: 'OK' }]
    );

    // Placeholder: Show example data
    showExampleImport();
  };

  /**
   * Show example import for demo
   */
  const showExampleImport = () => {
    const exampleCSV = `itemCode,description,category,subCategory,quantity,unit,unitCost,wbsCode,phase,notes
MAT-001,Concrete M25,material,concrete,100,m3,5000,1.2.1,Foundation,For foundation work
MAT-002,Steel TMT 16mm,material,steel,5000,kg,65,1.2.2,Structure,High grade steel
LAB-001,Mason Work,labor,masonry,200,hrs,500,1.2.1,Foundation,Skilled labor
EQP-001,Concrete Mixer,equipment,machinery,50,hrs,1000,1.2.1,Foundation,Rental basis`;

    const items = parseCSV(exampleCSV);
    setPreviewData(items);
    setShowPreview(true);
  };

  /**
   * Import validated items
   */
  const handleImport = async () => {
    const validItems = previewData.filter((item) => item.isValid);

    if (validItems.length === 0) {
      Alert.alert('Error', 'No valid items to import');
      return;
    }

    setImporting(true);

    try {
      // Import all valid items
      let successCount = 0;
      let failCount = 0;

      for (const item of validItems) {
        try {
          await addBomItem(bomId, {
            itemCode: item.itemCode,
            description: item.description,
            category: item.category,
            subCategory: item.subCategory,
            quantity: item.quantity,
            unit: item.unit,
            unitCost: item.unitCost,
            wbsCode: item.wbsCode,
            phase: item.phase,
            notes: item.notes,
          });
          successCount++;
        } catch (error) {
          logger.error(`Failed to import item ${item.itemCode}`, error as Error);
          failCount++;
        }
      }

      if (failCount > 0) {
        Alert.alert('Partial Success', `Imported ${successCount} items. Failed: ${failCount}`);
      } else {
        Alert.alert('Success', `Successfully imported ${successCount} items`);
      }

      onImportComplete(successCount);
    } catch (error) {
      Alert.alert('Error', 'Failed to import items');
      logger.error('Import error', error as Error);
    } finally {
      setImporting(false);
    }
  };

  if (showPreview) {
    const validCount = previewData.filter((i) => i.isValid).length;
    const invalidCount = previewData.length - validCount;

    return (
      <View style={styles.container}>
        <Text style={styles.title}>Preview Import ({previewData.length} items)</Text>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryText}>✓ Valid: {validCount}</Text>
          <Text style={[styles.summaryText, { color: invalidCount > 0 ? COLORS.ERROR : '#666' }]}>
            ✗ Invalid: {invalidCount}
          </Text>
        </View>

        <ScrollView style={styles.previewList}>
          {previewData.map((item, index) => (
            <View
              key={index}
              style={[styles.previewItem, !item.isValid && styles.previewItemInvalid]}
            >
              <View style={styles.previewHeader}>
                <Text style={styles.previewCode}>{item.itemCode}</Text>
                {!item.isValid && <Text style={styles.errorBadge}>Invalid</Text>}
              </View>
              <Text style={styles.previewDescription}>{item.description}</Text>
              <Text style={styles.previewDetails}>
                {item.quantity} {item.unit} × ₹{item.unitCost} = ₹{item.quantity * item.unitCost}
              </Text>
              <Text style={styles.previewCategory}>Category: {item.category}</Text>
              {item.error && <Text style={styles.errorText}>Error: {item.error}</Text>}
            </View>
          ))}
        </ScrollView>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => {
              setShowPreview(false);
              setPreviewData([]);
            }}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.importButton, importing && styles.importButtonDisabled]}
            onPress={handleImport}
            disabled={importing || validCount === 0}
          >
            {importing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.importButtonText}>Import {validCount} Items</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Import BOM Items</Text>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Supported Formats:</Text>
        <Text style={styles.infoText}>• CSV (.csv)</Text>
        <Text style={styles.infoText}>• Excel (.xls, .xlsx)</Text>
      </View>

      <View style={styles.templateCard}>
        <Text style={styles.templateTitle}>Required Columns:</Text>
        <Text style={styles.templateText}>
          itemCode, description, category, quantity, unit, unitCost
        </Text>
        <Text style={[styles.templateTitle, { marginTop: 12 }]}>
          Optional Columns:
        </Text>
        <Text style={styles.templateText}>subCategory, wbsCode, phase, notes</Text>
      </View>

      <View style={styles.exampleCard}>
        <Text style={styles.exampleTitle}>Category Values:</Text>
        <Text style={styles.exampleText}>material, labor, equipment, subcontractor</Text>
      </View>

      <TouchableOpacity style={styles.selectButton} onPress={handleSelectFile}>
        <Text style={styles.selectButtonText}>📁 Select File to Import</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.exampleButton} onPress={showExampleImport}>
        <Text style={styles.exampleButtonText}>View Example Import</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  infoCard: {
    backgroundColor: COLORS.INFO_BG,
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  templateCard: {
    backgroundColor: COLORS.WARNING_BG,
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  templateTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  templateText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
  },
  exampleCard: {
    backgroundColor: '#F3E5F5',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  exampleTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  exampleText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
  },
  selectButton: {
    backgroundColor: COLORS.INFO,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  selectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  exampleButton: {
    backgroundColor: COLORS.SUCCESS,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  exampleButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  summaryCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  summaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.SUCCESS,
  },
  previewList: {
    maxHeight: 400,
    marginBottom: 16,
  },
  previewItem: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  previewItemInvalid: {
    borderColor: COLORS.ERROR,
    backgroundColor: COLORS.ERROR_BG,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  previewCode: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  errorBadge: {
    fontSize: 12,
    color: COLORS.ERROR,
    fontWeight: '600',
  },
  previewDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  previewDetails: {
    fontSize: 12,
    color: '#333',
    marginBottom: 2,
  },
  previewCategory: {
    fontSize: 12,
    color: '#666',
    textTransform: 'capitalize',
  },
  errorText: {
    fontSize: 11,
    color: COLORS.ERROR,
    marginTop: 4,
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  importButton: {
    flex: 1,
    backgroundColor: COLORS.SUCCESS,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  importButtonDisabled: {
    backgroundColor: '#ccc',
  },
  importButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default BomImport;
