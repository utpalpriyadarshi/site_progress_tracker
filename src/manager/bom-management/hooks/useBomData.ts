/**
 * useBomData Hook
 * Manages BOM CRUD operations and related state
 *
 * Refactored to use useReducer pattern (Phase 2, Task 2.1)
 */

import { useReducer, useCallback, useState } from 'react';
import { Platform } from 'react-native';
import Share from 'react-native-share';
import RNFS from 'react-native-fs';
import { database } from '../../../../models/database';
import BomModel from '../../../../models/BomModel';
import BomItemModel from '../../../../models/BomItemModel';
import ProjectModel from '../../../../models/ProjectModel';
import { useSnackbar } from '../../../components/Snackbar';
import { BomImportExportService } from '../../../services/BomImportExportService';
import { logger } from '../../../services/LoggingService';
import { SITE_CATEGORIES } from '../utils/bomConstants';
import { getBomItems } from '../utils/bomCalculations';
import {
  bomFormReducer,
  initialBomFormState,
  openAddBomDialog as openAddAction,
  openEditBomDialog as openEditAction,
  closeBomDialog as closeAction,
  setBomName as setBomNameAction,
  setProjectId as setProjectIdAction,
  setBomType as setBomTypeAction,
  setSiteCategory as setSiteCategoryAction,
  setQuantity as setQuantityAction,
  setUnit as setUnitAction,
  setDescription as setDescriptionAction,
  setProjectMenuVisible as setProjectMenuAction,
  setSiteMenuVisible as setSiteMenuAction,
  openDeleteBomDialog as openDeleteAction,
  closeDeleteBomDialog as closeDeleteAction,
} from '../state';

export const useBomData = (
  projects: ProjectModel[],
  allBomItems: BomItemModel[],
  _boms: BomModel[]
) => {
  const { showSnackbar } = useSnackbar();
  const [exportingBomId, setExportingBomId] = useState<string | null>(null);

  // Replace 13 useState hooks with single useReducer
  const [state, dispatch] = useReducer(bomFormReducer, initialBomFormState);

  // Wrap dispatch calls in useCallback
  const openAddBomDialog = useCallback((activeTab: 'estimating' | 'execution') => {
    if (projects.length === 0) {
      showSnackbar('Please create a project first', 'warning');
      return;
    }
    const defaultProjectId = projects[0]?.id || '';
    const defaultCategory = SITE_CATEGORIES[0];
    dispatch(openAddAction(activeTab, defaultProjectId, defaultCategory));
  }, [projects, showSnackbar]);

  const openEditBomDialog = useCallback((bom: BomModel) => {
    dispatch(openEditAction(bom));
  }, []);

  const closeBomDialog = useCallback(() => {
    dispatch(closeAction());
  }, []);

  const setBomName = useCallback((value: string) => {
    dispatch(setBomNameAction(value));
  }, []);

  const setSelectedProjectId = useCallback((value: string) => {
    dispatch(setProjectIdAction(value));
  }, []);

  const setBomType = useCallback((value: 'estimating' | 'execution') => {
    dispatch(setBomTypeAction(value));
  }, []);

  const setSiteCategory = useCallback((value: string) => {
    dispatch(setSiteCategoryAction(value));
  }, []);

  const setQuantity = useCallback((value: string) => {
    dispatch(setQuantityAction(value));
  }, []);

  const setUnit = useCallback((value: string) => {
    dispatch(setUnitAction(value));
  }, []);

  const setDescription = useCallback((value: string) => {
    dispatch(setDescriptionAction(value));
  }, []);

  const setProjectMenuVisible = useCallback((visible: boolean) => {
    dispatch(setProjectMenuAction(visible));
  }, []);

  const setSiteMenuVisible = useCallback((visible: boolean) => {
    dispatch(setSiteMenuAction(visible));
  }, []);

  const handleDeleteBom = useCallback((bom: BomModel) => {
    dispatch(openDeleteAction(bom));
  }, []);

  const setShowDeleteBomDialog = useCallback((visible: boolean) => {
    if (!visible) {
      dispatch(closeDeleteAction());
    }
  }, []);

  const setBomDialogVisible = useCallback((visible: boolean) => {
    if (!visible) {
      closeBomDialog();
    }
  }, [closeBomDialog]);

  const setBomToDelete = useCallback((bom: BomModel | null) => {
    if (bom) {
      dispatch(openDeleteAction(bom));
    } else {
      dispatch(closeDeleteAction());
    }
  }, []);

  // Create or Update BOM
  const handleSaveBom = async () => {
    const { bomName, selectedProjectId, siteCategory, quantity, unit, description, bomType } = state.form;
    const { editingBom } = state.dialog;

    if (!bomName.trim() || !selectedProjectId || !siteCategory || !quantity || !unit.trim()) {
      dispatch(closeAction());
      showSnackbar('Please fill in all required fields', 'warning');
      return;
    }

    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      dispatch(closeAction());
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

  const confirmDeleteBom = async () => {
    const { bomToDelete } = state.deleteConfirmation;
    if (!bomToDelete) return;

    dispatch(closeDeleteAction());
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
    setExportingBomId(bom.id);
    try {
      const items = getBomItems(bom.id, allBomItems);
      const project = projects.find(p => p.id === bom.projectId);

      const filePath = await BomImportExportService.exportBomToExcel({
        bom,
        items,
        projectName: project?.name,
      });

      const fileName = filePath.split('/').pop() ?? 'BOM.xlsx';
      showSnackbar(`Saved to Downloads: ${fileName}`, 'success');

      // Open native share sheet so the user can open or send the file
      const cachePath = `${RNFS.CachesDirectoryPath}/${fileName}`;
      await RNFS.copyFile(filePath, cachePath);
      await Share.open({
        url: Platform.OS === 'android' ? `file://${cachePath}` : cachePath,
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        title: `Share ${fileName}`,
        failOnCancel: false,
      });
    } catch (error) {
      logger.error('Error exporting BOM', error as Error);
      showSnackbar('Failed to export BOM: ' + (error as Error).message, 'error');
    } finally {
      setExportingBomId(null);
    }
  };

  // Import BOM from file (temporarily disabled - compatibility issue)
  const handleImportBom = async () => {
    showSnackbar('Import feature is currently being upgraded. Please use Export to Excel for now.', 'info');
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

  // Return interface - map from nested state to flat interface (no breaking changes!)
  return {
    // Dialog state (mapped from state.dialog)
    bomDialogVisible: state.dialog.visible,
    setBomDialogVisible,
    editingBom: state.dialog.editingBom,
    showDeleteBomDialog: state.deleteConfirmation.visible,
    setShowDeleteBomDialog,
    bomToDelete: state.deleteConfirmation.bomToDelete,
    setBomToDelete,

    // Form state (mapped from state.form)
    bomName: state.form.bomName,
    setBomName,
    selectedProjectId: state.form.selectedProjectId,
    setSelectedProjectId,
    bomType: state.form.bomType,
    setBomType,
    siteCategory: state.form.siteCategory,
    setSiteCategory,
    quantity: state.form.quantity,
    setQuantity,
    unit: state.form.unit,
    setUnit,
    description: state.form.description,
    setDescription,

    // Dropdown states (mapped from state.ui)
    projectMenuVisible: state.ui.projectMenuVisible,
    setProjectMenuVisible,
    siteMenuVisible: state.ui.siteMenuVisible,
    setSiteMenuVisible,

    // Export state
    exportingBomId,

    // Handlers (unchanged)
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
