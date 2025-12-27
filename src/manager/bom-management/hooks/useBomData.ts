/**
 * useBomData Hook
 * Manages BOM CRUD operations and related state
 */

import { useState } from 'react';
import { Alert } from 'react-native';
import { database } from '../../../models/database';
import BomModel from '../../../models/BomModel';
import BomItemModel from '../../../models/BomItemModel';
import ProjectModel from '../../../models/ProjectModel';
import { useSnackbar } from '../../components/Snackbar';
import { BomImportExportService } from '../../services/BomImportExportService';
import { logger } from '../../services/LoggingService';
import { SITE_CATEGORIES } from '../utils/bomConstants';
import { getBomItems } from '../utils/bomCalculations';

export const useBomData = (
  projects: ProjectModel[],
  allBomItems: BomItemModel[],
  boms: BomModel[]
) => {
  const { showSnackbar } = useSnackbar();

  // Dialog state
  const [bomDialogVisible, setBomDialogVisible] = useState(false);
  const [editingBom, setEditingBom] = useState<BomModel | null>(null);
  const [showDeleteBomDialog, setShowDeleteBomDialog] = useState(false);
  const [bomToDelete, setBomToDelete] = useState<BomModel | null>(null);

  // BOM Form state
  const [bomName, setBomName] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [bomType, setBomType] = useState<'estimating' | 'execution'>('estimating');
  const [siteCategory, setSiteCategory] = useState<string>('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('nos');
  const [description, setDescription] = useState('');

  // Dropdown menu states
  const [projectMenuVisible, setProjectMenuVisible] = useState(false);
  const [siteMenuVisible, setSiteMenuVisible] = useState(false);

  // Reset BOM form
  const resetBomForm = () => {
    setBomName('');
    setSelectedProjectId(projects[0]?.id || '');
    setBomType('estimating');
    setSiteCategory(SITE_CATEGORIES[0]);
    setQuantity('1');
    setUnit('nos');
    setDescription('');
    setEditingBom(null);
  };

  // Open BOM dialog for adding
  const openAddBomDialog = (activeTab: 'estimating' | 'execution') => {
    if (projects.length === 0) {
      showSnackbar('Please create a project first', 'warning');
      return;
    }
    resetBomForm();
    setBomType(activeTab);
    setSelectedProjectId(projects[0]?.id || '');
    setSiteCategory(SITE_CATEGORIES[0]);
    setBomDialogVisible(true);
  };

  // Open BOM dialog for editing
  const openEditBomDialog = (bom: BomModel) => {
    setEditingBom(bom);
    setBomName(bom.name);
    setSelectedProjectId(bom.projectId);
    setBomType(bom.type as 'estimating' | 'execution');
    setSiteCategory(bom.siteCategory || SITE_CATEGORIES[0]);
    setQuantity(bom.quantity.toString());
    setUnit(bom.unit);
    setDescription(bom.description || '');
    setBomDialogVisible(true);
  };

  // Close BOM dialog
  const closeBomDialog = () => {
    setBomDialogVisible(false);
    resetBomForm();
  };

  // Create or Update BOM
  const handleSaveBom = async () => {
    if (!bomName.trim() || !selectedProjectId || !siteCategory || !quantity || !unit.trim()) {
      setBomDialogVisible(false);
      showSnackbar('Please fill in all required fields', 'warning');
      return;
    }

    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      setBomDialogVisible(false);
      showSnackbar('Quantity must be a positive number', 'warning');
      return;
    }

    try {
      await database.write(async () => {
        if (editingBom) {
          // Update existing BOM
          await editingBom.update((bom: any) => {
            bom.name = bomName.trim();
            bom.siteCategory = siteCategory;
            bom.quantity = qty;
            bom.unit = unit.trim();
            bom.description = description.trim();
            bom.updatedDate = Date.now();
          });
          showSnackbar('BOM updated successfully', 'success');
        } else {
          // Create new BOM
          await database.collections.get<BomModel>('boms').create((bom: any) => {
            bom.projectId = selectedProjectId;
            bom.name = bomName.trim();
            bom.type = bomType;
            bom.status = bomType === 'estimating' ? 'draft' : 'baseline';
            bom.version = 'v1.0';
            bom.siteCategory = siteCategory;
            bom.quantity = qty;
            bom.unit = unit.trim();
            bom.description = description.trim();
            bom.contingency = 5;
            bom.profitMargin = 10;
            bom.totalEstimatedCost = 0;
            bom.totalActualCost = 0;
            bom.createdBy = 'current-user';
            bom.createdDate = Date.now();
            bom.updatedDate = Date.now();
            bom.appSyncStatus = 'pending';
            bom._version = 1;
          });
          showSnackbar('BOM created successfully', 'success');
        }
      });
      closeBomDialog();
    } catch (error) {
      logger.error('Error saving BOM', error as Error);
      showSnackbar('Failed to save BOM: ' + (error as Error).message, 'error');
    }
  };

  // Delete BOM
  const handleDeleteBom = (bom: BomModel) => {
    setBomToDelete(bom);
    setShowDeleteBomDialog(true);
  };

  const confirmDeleteBom = async () => {
    if (!bomToDelete) return;

    setShowDeleteBomDialog(false);
    try {
      await database.write(async () => {
        // Delete all BOM items first
        const items = getBomItems(bomToDelete.id, allBomItems);
        for (const item of items) {
          await item.markAsDeleted();
        }
        // Delete BOM
        await bomToDelete.markAsDeleted();
      });
      showSnackbar('BOM deleted successfully', 'success');
      setBomToDelete(null);
    } catch (error) {
      logger.error('Error deleting BOM', error as Error);
      showSnackbar('Failed to delete BOM: ' + (error as Error).message, 'error');
    }
  };

  // Copy BOM to Execution
  const handleCopyToExecution = async (
    sourceBom: BomModel,
    onSuccess: () => void
  ) => {
    try {
      const sourceItems = getBomItems(sourceBom.id, allBomItems);

      if (sourceItems.length === 0) {
        showSnackbar('Cannot copy BOM with no items', 'warning');
        return;
      }

      await database.write(async () => {
        // Create new execution BOM
        const executionBom = await database.collections.get<BomModel>('boms').create((bom: any) => {
          bom.projectId = sourceBom.projectId;
          bom.name = sourceBom.name + ' (Execution)';
          bom.type = 'execution';
          bom.status = 'baseline';
          bom.version = sourceBom.version;
          bom.siteCategory = sourceBom.siteCategory;
          bom.baselineBomId = sourceBom.id;
          bom.quantity = sourceBom.quantity;
          bom.unit = sourceBom.unit;
          bom.description = sourceBom.description || '';
          bom.contingency = sourceBom.contingency;
          bom.profitMargin = sourceBom.profitMargin;
          bom.totalEstimatedCost = sourceBom.totalEstimatedCost;
          bom.totalActualCost = 0;
          bom.createdBy = 'current-user';
          bom.createdDate = Date.now();
          bom.updatedDate = Date.now();
          bom.appSyncStatus = 'pending';
          bom._version = 1;
        });

        // Copy all items
        for (const sourceItem of sourceItems) {
          await database.collections.get<BomItemModel>('bom_items').create((item: any) => {
            item.bomId = executionBom.id;
            item.itemCode = sourceItem.itemCode;
            item.description = sourceItem.description;
            item.category = sourceItem.category;
            item.subCategory = sourceItem.subCategory;
            item.quantity = sourceItem.quantity;
            item.unit = sourceItem.unit;
            item.unitCost = sourceItem.unitCost;
            item.totalCost = sourceItem.totalCost;
            item.phase = sourceItem.phase;
            item.wbsCode = sourceItem.wbsCode || '';
            item.actualQuantity = sourceItem.quantity;
            item.actualCost = sourceItem.totalCost;
            item.createdDate = Date.now();
            item.updatedDate = Date.now();
            item.appSyncStatus = 'pending';
            item._version = 1;
          });
        }
      });

      showSnackbar('BOM copied to Execution successfully!', 'success');
      onSuccess();
    } catch (error) {
      logger.error('Error copying BOM', error as Error);
      showSnackbar('Failed to copy BOM: ' + (error as Error).message, 'error');
    }
  };

  // Export BOM to Excel
  const handleExportBom = async (bom: BomModel) => {
    try {
      const items = getBomItems(bom.id, allBomItems);
      const project = projects.find(p => p.id === bom.projectId);

      showSnackbar('Exporting BOM to Excel...', 'info');

      const filePath = await BomImportExportService.exportBomToExcel({
        bom,
        items,
        projectName: project?.name,
      });

      Alert.alert(
        'Export Successful',
        `BOM exported successfully!\n\nSaved to: ${filePath}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      logger.error('Error exporting BOM', error as Error);
      showSnackbar('Failed to export BOM: ' + (error as Error).message, 'error');
    }
  };

  // Import BOM from file (temporarily disabled - compatibility issue)
  const handleImportBom = async () => {
    Alert.alert(
      'Import Feature',
      'Import feature is currently being upgraded. Please use Export to Excel and manually create BOMs for now.',
      [{ text: 'OK' }]
    );
  };

  // Create BOM from imported data
  const createBomFromImport = async (importResult: any) => {
    try {
      if (projects.length === 0) {
        showSnackbar('Please create a project first', 'warning');
        return;
      }

      await database.write(async () => {
        // Create new BOM
        const newBom = await database.collections.get<BomModel>('boms').create((bom: any) => {
          bom.projectId = projects[0].id;
          bom.name = `Imported BOM ${new Date().toLocaleDateString('en-IN')}`;
          bom.type = 'estimating';
          bom.status = 'draft';
          bom.version = 'v1.0';
          bom.siteCategory = SITE_CATEGORIES[0];
          bom.quantity = 1;
          bom.unit = 'nos';
          bom.description = `Imported on ${new Date().toLocaleString('en-IN')}`;
          bom.contingency = 5;
          bom.profitMargin = 10;
          bom.totalEstimatedCost = 0;
          bom.totalActualCost = 0;
          bom.createdBy = 'current-user';
          bom.createdDate = Date.now();
          bom.updatedDate = Date.now();
          bom.appSyncStatus = 'pending';
          bom._version = 1;
        });

        // Create items
        let totalCost = 0;
        let itemNumber = 1;

        for (const importedItem of importResult.items) {
          const categoryPrefix = importedItem.category.substring(0, 3).toUpperCase();
          const itemCode = `${categoryPrefix}-${String(itemNumber).padStart(3, '0')}`;
          const cost = importedItem.quantity * importedItem.unitCost;

          await database.collections.get<BomItemModel>('bom_items').create((item: any) => {
            item.bomId = newBom.id;
            item.itemCode = itemCode;
            item.description = importedItem.description;
            item.category = importedItem.category;
            item.quantity = importedItem.quantity;
            item.unit = importedItem.unit;
            item.unitCost = importedItem.unitCost;
            item.totalCost = cost;
            item.phase = importedItem.phase || '';
            item.wbsCode = '';
            item.createdDate = Date.now();
            item.updatedDate = Date.now();
            item.appSyncStatus = 'pending';
            item._version = 1;
          });

          totalCost += cost;
          itemNumber++;
        }

        // Update BOM total cost
        await newBom.update((b: any) => {
          b.totalEstimatedCost = totalCost;
        });
      });

      showSnackbar(`BOM imported successfully with ${importResult.validRows} items!`, 'success');
    } catch (error) {
      logger.error('Error creating BOM from import', error as Error);
      showSnackbar('Failed to create BOM: ' + (error as Error).message, 'error');
    }
  };

  return {
    // Dialog state
    bomDialogVisible,
    setBomDialogVisible,
    editingBom,
    showDeleteBomDialog,
    setShowDeleteBomDialog,
    bomToDelete,
    setBomToDelete,

    // Form state
    bomName,
    setBomName,
    selectedProjectId,
    setSelectedProjectId,
    bomType,
    setBomType,
    siteCategory,
    setSiteCategory,
    quantity,
    setQuantity,
    unit,
    setUnit,
    description,
    setDescription,

    // Dropdown states
    projectMenuVisible,
    setProjectMenuVisible,
    siteMenuVisible,
    setSiteMenuVisible,

    // Handlers
    openAddBomDialog,
    openEditBomDialog,
    closeBomDialog,
    handleSaveBom,
    handleDeleteBom,
    confirmDeleteBom,
    handleCopyToExecution,
    handleExportBom,
    handleImportBom,
    createBomFromImport,
  };
};
