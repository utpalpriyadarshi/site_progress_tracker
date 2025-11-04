import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { database } from '../../../models/database';
import BomModel from '../../../models/BomModel';
import BomItemModel from '../../../models/BomItemModel';
import { Q } from '@nozbe/watermelondb';

/**
 * BomContext
 *
 * Provides comprehensive BOM (Bill of Materials) management across Manager role screens.
 *
 * Features:
 * - BOM CRUD operations (Create, Read, Update, Delete)
 * - BOM Item management
 * - Cost calculations and analytics
 * - Filter and search capabilities
 * - Version tracking support
 * - Refresh triggers for real-time updates
 */

// Type definitions for BOM creation
export interface CreateBomData {
  projectId: string;
  name: string;
  type: 'estimating' | 'execution';
  status: 'draft' | 'submitted' | 'won' | 'lost' | 'baseline' | 'active' | 'closed';
  version?: string;
  quantity: number;
  unit: string;
  tenderDate?: number;
  client?: string;
  contractValue?: number;
  contingency?: number;
  profitMargin?: number;
  description?: string;
  createdBy: string;
}

export interface UpdateBomData {
  name?: string;
  status?: string;
  quantity?: number;
  unit?: string;
  tenderDate?: number;
  client?: string;
  contractValue?: number;
  contingency?: number;
  profitMargin?: number;
  description?: string;
}

export interface CreateBomItemData {
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
  materialId?: string;
}

export interface UpdateBomItemData {
  itemCode?: string;
  description?: string;
  category?: string;
  subCategory?: string;
  quantity?: number;
  unit?: string;
  unitCost?: number;
  wbsCode?: string;
  phase?: string;
  notes?: string;
  actualQuantity?: number;
  actualCost?: number;
}

export interface CostBreakdown {
  totalEstimated: number;
  totalActual: number;
  materialCost: number;
  laborCost: number;
  equipmentCost: number;
  subcontractorCost: number;
  contingencyAmount: number;
  profitAmount: number;
  grandTotal: number;
}

interface BomContextType {
  // Selected BOM state
  selectedBom: BomModel | null;
  setSelectedBom: (bom: BomModel | null) => void;

  // Filter states
  filterType: 'estimating' | 'execution' | null;
  setFilterType: (type: 'estimating' | 'execution' | null) => void;
  filterStatus: string | null;
  setFilterStatus: (status: string | null) => void;
  filterProject: string | null;
  setFilterProject: (projectId: string | null) => void;

  // BOM CRUD operations
  createBom: (data: CreateBomData) => Promise<BomModel>;
  updateBom: (bomId: string, data: UpdateBomData) => Promise<void>;
  deleteBom: (bomId: string) => Promise<void>;
  getBomById: (bomId: string) => Promise<BomModel | null>;
  getAllBoms: () => Promise<BomModel[]>;
  getBomsByProject: (projectId: string) => Promise<BomModel[]>;
  getBomsByType: (type: 'estimating' | 'execution') => Promise<BomModel[]>;

  // BOM Item operations
  addBomItem: (bomId: string, itemData: CreateBomItemData) => Promise<BomItemModel>;
  updateBomItem: (itemId: string, data: UpdateBomItemData) => Promise<void>;
  deleteBomItem: (itemId: string) => Promise<void>;
  getBomItems: (bomId: string) => Promise<BomItemModel[]>;

  // Cost calculations
  calculateTotalCost: (bomId: string) => Promise<number>;
  calculateCostBreakdown: (bomId: string) => Promise<CostBreakdown>;
  recalculateBomCosts: (bomId: string) => Promise<void>;

  // Refresh trigger
  refreshTrigger: number;
  triggerRefresh: () => void;

  // Loading state
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

const BomContext = createContext<BomContextType | undefined>(undefined);

export const BomProvider = ({ children }: { children: ReactNode }) => {
  // State management
  const [selectedBom, setSelectedBom] = useState<BomModel | null>(null);
  const [filterType, setFilterType] = useState<'estimating' | 'execution' | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterProject, setFilterProject] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [loading, setLoading] = useState(false);

  const triggerRefresh = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  // BOM CRUD Operations

  const createBom = useCallback(async (data: CreateBomData): Promise<BomModel> => {
    const now = Date.now();
    const version = data.version || 'v1.0';

    const newBom = await database.write(async () => {
      return await database.collections.get<BomModel>('boms').create((bom) => {
        bom.projectId = data.projectId;
        bom.name = data.name;
        bom.type = data.type;
        bom.status = data.status;
        bom.version = version;
        bom.quantity = data.quantity;
        bom.unit = data.unit;
        bom.tenderDate = data.tenderDate;
        bom.client = data.client;
        bom.contractValue = data.contractValue;
        bom.contingency = data.contingency || 5;
        bom.profitMargin = data.profitMargin || 10;
        bom.totalEstimatedCost = 0;
        bom.totalActualCost = 0;
        bom.description = data.description;
        bom.createdBy = data.createdBy;
        bom.createdDate = now;
        bom.updatedDate = now;
        bom.appSyncStatus = 'pending';
        bom._version = 1;
      });
    });

    triggerRefresh();
    return newBom;
  }, [triggerRefresh]);

  const updateBom = useCallback(async (bomId: string, data: UpdateBomData): Promise<void> => {
    await database.write(async () => {
      const bom = await database.collections.get<BomModel>('boms').find(bomId);
      await bom.update((b) => {
        if (data.name !== undefined) b.name = data.name;
        if (data.status !== undefined) b.status = data.status;
        if (data.quantity !== undefined) b.quantity = data.quantity;
        if (data.unit !== undefined) b.unit = data.unit;
        if (data.tenderDate !== undefined) b.tenderDate = data.tenderDate;
        if (data.client !== undefined) b.client = data.client;
        if (data.contractValue !== undefined) b.contractValue = data.contractValue;
        if (data.contingency !== undefined) b.contingency = data.contingency;
        if (data.profitMargin !== undefined) b.profitMargin = data.profitMargin;
        if (data.description !== undefined) b.description = data.description;
        b.updatedDate = Date.now();
        b.appSyncStatus = 'pending';
      });
    });

    triggerRefresh();
  }, [triggerRefresh]);

  const deleteBom = useCallback(async (bomId: string): Promise<void> => {
    await database.write(async () => {
      const bom = await database.collections.get<BomModel>('boms').find(bomId);

      // Delete all associated BOM items first
      const items = await database.collections
        .get<BomItemModel>('bom_items')
        .query(Q.where('bom_id', bomId))
        .fetch();

      for (const item of items) {
        await item.markAsDeleted();
      }

      // Delete the BOM
      await bom.markAsDeleted();
    });

    if (selectedBom?.id === bomId) {
      setSelectedBom(null);
    }

    triggerRefresh();
  }, [selectedBom, triggerRefresh]);

  const getBomById = useCallback(async (bomId: string): Promise<BomModel | null> => {
    try {
      const bom = await database.collections.get<BomModel>('boms').find(bomId);
      return bom;
    } catch (error) {
      console.error('Error fetching BOM by ID:', error);
      return null;
    }
  }, []);

  const getAllBoms = useCallback(async (): Promise<BomModel[]> => {
    const boms = await database.collections.get<BomModel>('boms').query().fetch();
    return boms;
  }, []);

  const getBomsByProject = useCallback(async (projectId: string): Promise<BomModel[]> => {
    const boms = await database.collections
      .get<BomModel>('boms')
      .query(Q.where('project_id', projectId))
      .fetch();
    return boms;
  }, []);

  const getBomsByType = useCallback(async (type: 'estimating' | 'execution'): Promise<BomModel[]> => {
    const boms = await database.collections
      .get<BomModel>('boms')
      .query(Q.where('type', type))
      .fetch();
    return boms;
  }, []);

  // BOM Item Operations

  const addBomItem = useCallback(async (bomId: string, itemData: CreateBomItemData): Promise<BomItemModel> => {
    const now = Date.now();
    const totalCost = itemData.quantity * itemData.unitCost;

    const newItem = await database.write(async () => {
      return await database.collections.get<BomItemModel>('bom_items').create((item) => {
        item.bomId = bomId;
        item.materialId = itemData.materialId;
        item.itemCode = itemData.itemCode;
        item.description = itemData.description;
        item.category = itemData.category;
        item.subCategory = itemData.subCategory;
        item.quantity = itemData.quantity;
        item.unit = itemData.unit;
        item.unitCost = itemData.unitCost;
        item.totalCost = totalCost;
        item.wbsCode = itemData.wbsCode;
        item.phase = itemData.phase;
        item.notes = itemData.notes;
        item.createdDate = now;
        item.updatedDate = now;
        item.appSyncStatus = 'pending';
        item._version = 1;
      });
    });

    // Recalculate BOM total costs
    await recalculateBomCosts(bomId);
    triggerRefresh();

    return newItem;
  }, [triggerRefresh]);

  const updateBomItem = useCallback(async (itemId: string, data: UpdateBomItemData): Promise<void> => {
    await database.write(async () => {
      const item = await database.collections.get<BomItemModel>('bom_items').find(itemId);

      await item.update((i) => {
        if (data.itemCode !== undefined) i.itemCode = data.itemCode;
        if (data.description !== undefined) i.description = data.description;
        if (data.category !== undefined) i.category = data.category;
        if (data.subCategory !== undefined) i.subCategory = data.subCategory;
        if (data.quantity !== undefined) i.quantity = data.quantity;
        if (data.unit !== undefined) i.unit = data.unit;
        if (data.unitCost !== undefined) i.unitCost = data.unitCost;
        if (data.wbsCode !== undefined) i.wbsCode = data.wbsCode;
        if (data.phase !== undefined) i.phase = data.phase;
        if (data.notes !== undefined) i.notes = data.notes;
        if (data.actualQuantity !== undefined) i.actualQuantity = data.actualQuantity;
        if (data.actualCost !== undefined) i.actualCost = data.actualCost;

        // Recalculate total cost if quantity or unit cost changed
        if (data.quantity !== undefined || data.unitCost !== undefined) {
          i.totalCost = i.quantity * i.unitCost;
        }

        i.updatedDate = Date.now();
        i.appSyncStatus = 'pending';
      });

      // Recalculate BOM total costs
      await recalculateBomCosts(item.bomId);
    });

    triggerRefresh();
  }, [triggerRefresh]);

  const deleteBomItem = useCallback(async (itemId: string): Promise<void> => {
    await database.write(async () => {
      const item = await database.collections.get<BomItemModel>('bom_items').find(itemId);
      const bomId = item.bomId;

      await item.markAsDeleted();

      // Recalculate BOM total costs
      await recalculateBomCosts(bomId);
    });

    triggerRefresh();
  }, [triggerRefresh]);

  const getBomItems = useCallback(async (bomId: string): Promise<BomItemModel[]> => {
    const items = await database.collections
      .get<BomItemModel>('bom_items')
      .query(Q.where('bom_id', bomId))
      .fetch();
    return items;
  }, []);

  // Cost Calculation Operations

  const calculateTotalCost = useCallback(async (bomId: string): Promise<number> => {
    const items = await getBomItems(bomId);
    const total = items.reduce((sum, item) => sum + item.totalCost, 0);
    return total;
  }, [getBomItems]);

  const calculateCostBreakdown = useCallback(async (bomId: string): Promise<CostBreakdown> => {
    const items = await getBomItems(bomId);
    const bom = await getBomById(bomId);

    if (!bom) {
      throw new Error('BOM not found');
    }

    // Calculate costs by category
    const materialCost = items
      .filter((item) => item.category === 'material')
      .reduce((sum, item) => sum + item.totalCost, 0);

    const laborCost = items
      .filter((item) => item.category === 'labor')
      .reduce((sum, item) => sum + item.totalCost, 0);

    const equipmentCost = items
      .filter((item) => item.category === 'equipment')
      .reduce((sum, item) => sum + item.totalCost, 0);

    const subcontractorCost = items
      .filter((item) => item.category === 'subcontractor')
      .reduce((sum, item) => sum + item.totalCost, 0);

    const totalEstimated = materialCost + laborCost + equipmentCost + subcontractorCost;

    // Calculate contingency and profit
    const contingencyAmount = (totalEstimated * bom.contingency) / 100;
    const profitAmount = (totalEstimated * bom.profitMargin) / 100;
    const grandTotal = totalEstimated + contingencyAmount + profitAmount;

    // Calculate total actual cost
    const totalActual = items.reduce((sum, item) => sum + (item.actualCost || 0), 0);

    return {
      totalEstimated,
      totalActual,
      materialCost,
      laborCost,
      equipmentCost,
      subcontractorCost,
      contingencyAmount,
      profitAmount,
      grandTotal,
    };
  }, [getBomItems, getBomById]);

  const recalculateBomCosts = useCallback(async (bomId: string): Promise<void> => {
    const totalEstimated = await calculateTotalCost(bomId);
    const items = await getBomItems(bomId);
    const totalActual = items.reduce((sum, item) => sum + (item.actualCost || 0), 0);

    await database.write(async () => {
      const bom = await database.collections.get<BomModel>('boms').find(bomId);
      await bom.update((b) => {
        b.totalEstimatedCost = totalEstimated;
        b.totalActualCost = totalActual;
        b.updatedDate = Date.now();
        b.appSyncStatus = 'pending';
      });
    });
  }, [calculateTotalCost, getBomItems]);

  // Context value
  const value: BomContextType = {
    selectedBom,
    setSelectedBom,
    filterType,
    setFilterType,
    filterStatus,
    setFilterStatus,
    filterProject,
    setFilterProject,
    createBom,
    updateBom,
    deleteBom,
    getBomById,
    getAllBoms,
    getBomsByProject,
    getBomsByType,
    addBomItem,
    updateBomItem,
    deleteBomItem,
    getBomItems,
    calculateTotalCost,
    calculateCostBreakdown,
    recalculateBomCosts,
    refreshTrigger,
    triggerRefresh,
    loading,
    setLoading,
  };

  return <BomContext.Provider value={value}>{children}</BomContext.Provider>;
};

export const useBomContext = () => {
  const context = useContext(BomContext);
  if (!context) {
    throw new Error('useBomContext must be used within BomProvider');
  }
  return context;
};
