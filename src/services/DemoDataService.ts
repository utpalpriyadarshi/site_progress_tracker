/**
 * DemoDataService
 *
 * Generates realistic demo/seed data for different roles.
 * Currently supports Planner role — creates Key Dates, Sites,
 * Key Date–Site links, Categories, and WBS Items.
 *
 * @version 1.0.0
 * @since v2.13 - App Tutorial & Demo Data
 */

import { database } from '../../models/database';
import KeyDateModel, { KeyDateCategory } from '../../models/KeyDateModel';
import KeyDateSiteModel from '../../models/KeyDateSiteModel';
import SiteModel from '../../models/SiteModel';
import ItemModel, { ProjectPhase } from '../../models/ItemModel';
import CategoryModel from '../../models/CategoryModel';

// ─── Types ───────────────────────────────────────────────────────

export interface DemoDataResult {
  sitesCreated: number;
  keyDatesCreated: number;
  itemsCreated: number;
  categoriesCreated: number;
}

// ─── Key Date definitions ────────────────────────────────────────

interface KeyDateDef {
  code: string;
  category: KeyDateCategory;
  categoryName: string;
  description: string;
  targetDays: number;
  weightage: number;
  delayDamagesInitial: number;
  delayDamagesExtended: number;
  sequenceOrder: number;
}

const KEY_DATES: KeyDateDef[] = [
  {
    code: 'KD-G-01',
    category: 'G',
    categoryName: 'General',
    description: 'Site Possession & Access',
    targetDays: 30,
    weightage: 10,
    delayDamagesInitial: 1,
    delayDamagesExtended: 10,
    sequenceOrder: 1,
  },
  {
    code: 'KD-A-01',
    category: 'A',
    categoryName: 'Design',
    description: 'Design Approval',
    targetDays: 60,
    weightage: 15,
    delayDamagesInitial: 1,
    delayDamagesExtended: 10,
    sequenceOrder: 2,
  },
  {
    code: 'KD-B-01',
    category: 'B',
    categoryName: 'Works at Poonamallee Depot',
    description: 'Material Procurement Complete',
    targetDays: 120,
    weightage: 15,
    delayDamagesInitial: 1,
    delayDamagesExtended: 10,
    sequenceOrder: 3,
  },
  {
    code: 'KD-C-01',
    category: 'C',
    categoryName: 'Works at Corridor 4',
    description: 'Civil Works Complete',
    targetDays: 240,
    weightage: 25,
    delayDamagesInitial: 1,
    delayDamagesExtended: 10,
    sequenceOrder: 4,
  },
  {
    code: 'KD-D-01',
    category: 'D',
    categoryName: 'RSS at Thirumayilai',
    description: 'Erection & Commissioning',
    targetDays: 330,
    weightage: 20,
    delayDamagesInitial: 1,
    delayDamagesExtended: 10,
    sequenceOrder: 5,
  },
  {
    code: 'KD-F-01',
    category: 'F',
    categoryName: 'Works at Corridor 4: UG01',
    description: 'Final Completion & Handover',
    targetDays: 365,
    weightage: 15,
    delayDamagesInitial: 1,
    delayDamagesExtended: 10,
    sequenceOrder: 6,
  },
];

// ─── Site definitions ────────────────────────────────────────────

interface SiteDef {
  name: string;
  location: string;
  startDayOffset: number; // days from now
  endDayOffset: number;
}

const SITES: SiteDef[] = [
  { name: 'Substation A', location: 'Zone 1 — North Block, Plot 14', startDayOffset: 0, endDayOffset: 365 },
  { name: 'Substation B', location: 'Zone 2 — South Block, Plot 22', startDayOffset: 7, endDayOffset: 350 },
  { name: 'Control Building', location: 'Zone 1 — Central Area, Plot 8', startDayOffset: 14, endDayOffset: 330 },
];

// ─── KD ↔ Site contribution percentages ─────────────────────────

// Indexed by KD code, then site index (0, 1, 2)
const KD_SITE_CONTRIBUTIONS: Record<string, number[]> = {
  'KD-G-01': [40, 40, 20],
  'KD-A-01': [35, 35, 30],
  'KD-B-01': [40, 40, 20],
  'KD-C-01': [35, 35, 30],
  'KD-D-01': [40, 40, 20],
  'KD-F-01': [33, 34, 33],
};

// ─── Category definitions ────────────────────────────────────────

interface CategoryDef {
  name: string;
  description: string;
}

const CATEGORIES: CategoryDef[] = [
  { name: 'Civil Works', description: 'Foundation, structural, and civil construction tasks' },
  { name: 'Electrical Works', description: 'Electrical installation and wiring tasks' },
  { name: 'Erection & Commissioning', description: 'Equipment erection, testing, and commissioning' },
];

// ─── WBS Item definitions ────────────────────────────────────────

interface WBSItemDef {
  wbsCode: string;
  wbsLevel: number;
  parentWbsCode: string | null;
  name: string;
  phase: ProjectPhase;
  quantity: number;
  unit: string;
  weightage: number;
  startDayOffset: number; // relative to site start
  durationDays: number;
  isMilestone: boolean;
  isCriticalPath: boolean;
  categoryIndex: number; // index into CATEGORIES array
}

// Items for Substation A
const SUBSTATION_A_ITEMS: WBSItemDef[] = [
  { wbsCode: '1.0', wbsLevel: 1, parentWbsCode: null, name: 'Site Preparation', phase: 'site_prep', quantity: 1, unit: 'lot', weightage: 5, startDayOffset: 0, durationDays: 15, isMilestone: false, isCriticalPath: false, categoryIndex: 0 },
  { wbsCode: '1.1', wbsLevel: 2, parentWbsCode: '1.0', name: 'Clearing & Grubbing', phase: 'site_prep', quantity: 2000, unit: 'sqm', weightage: 2, startDayOffset: 0, durationDays: 7, isMilestone: false, isCriticalPath: false, categoryIndex: 0 },
  { wbsCode: '1.2', wbsLevel: 2, parentWbsCode: '1.0', name: 'Temporary Fencing', phase: 'site_prep', quantity: 500, unit: 'm', weightage: 3, startDayOffset: 3, durationDays: 8, isMilestone: false, isCriticalPath: false, categoryIndex: 0 },
  { wbsCode: '2.0', wbsLevel: 1, parentWbsCode: null, name: 'Civil Works', phase: 'construction', quantity: 1, unit: 'lot', weightage: 20, startDayOffset: 15, durationDays: 90, isMilestone: false, isCriticalPath: true, categoryIndex: 0 },
  { wbsCode: '2.1', wbsLevel: 2, parentWbsCode: '2.0', name: 'Foundation Excavation', phase: 'construction', quantity: 800, unit: 'cum', weightage: 8, startDayOffset: 15, durationDays: 20, isMilestone: false, isCriticalPath: true, categoryIndex: 0 },
  { wbsCode: '2.2', wbsLevel: 2, parentWbsCode: '2.0', name: 'RCC Foundation', phase: 'construction', quantity: 400, unit: 'cum', weightage: 12, startDayOffset: 35, durationDays: 30, isMilestone: false, isCriticalPath: true, categoryIndex: 0 },
  { wbsCode: '3.0', wbsLevel: 1, parentWbsCode: null, name: 'Equipment Erection', phase: 'construction', quantity: 1, unit: 'lot', weightage: 15, startDayOffset: 120, durationDays: 60, isMilestone: false, isCriticalPath: true, categoryIndex: 2 },
  { wbsCode: '3.1', wbsLevel: 2, parentWbsCode: '3.0', name: 'Transformer Installation', phase: 'commissioning', quantity: 2, unit: 'nos', weightage: 10, startDayOffset: 120, durationDays: 25, isMilestone: false, isCriticalPath: true, categoryIndex: 2 },
  { wbsCode: '3.2', wbsLevel: 2, parentWbsCode: '3.0', name: 'Switchgear Erection', phase: 'commissioning', quantity: 6, unit: 'nos', weightage: 5, startDayOffset: 145, durationDays: 20, isMilestone: false, isCriticalPath: false, categoryIndex: 2 },
];

// Items for Substation B
const SUBSTATION_B_ITEMS: WBSItemDef[] = [
  { wbsCode: '1.0', wbsLevel: 1, parentWbsCode: null, name: 'Site Preparation', phase: 'site_prep', quantity: 1, unit: 'lot', weightage: 4, startDayOffset: 0, durationDays: 12, isMilestone: false, isCriticalPath: false, categoryIndex: 0 },
  { wbsCode: '1.1', wbsLevel: 2, parentWbsCode: '1.0', name: 'Clearing & Leveling', phase: 'site_prep', quantity: 1800, unit: 'sqm', weightage: 2, startDayOffset: 0, durationDays: 6, isMilestone: false, isCriticalPath: false, categoryIndex: 0 },
  { wbsCode: '2.0', wbsLevel: 1, parentWbsCode: null, name: 'Civil & Structural', phase: 'construction', quantity: 1, unit: 'lot', weightage: 18, startDayOffset: 12, durationDays: 80, isMilestone: false, isCriticalPath: true, categoryIndex: 0 },
  { wbsCode: '2.1', wbsLevel: 2, parentWbsCode: '2.0', name: 'Pile Foundation', phase: 'construction', quantity: 24, unit: 'nos', weightage: 10, startDayOffset: 12, durationDays: 30, isMilestone: false, isCriticalPath: true, categoryIndex: 0 },
  { wbsCode: '2.2', wbsLevel: 2, parentWbsCode: '2.0', name: 'Superstructure', phase: 'construction', quantity: 350, unit: 'cum', weightage: 8, startDayOffset: 42, durationDays: 40, isMilestone: false, isCriticalPath: true, categoryIndex: 0 },
  { wbsCode: '3.0', wbsLevel: 1, parentWbsCode: null, name: 'Electrical Installation', phase: 'construction', quantity: 1, unit: 'lot', weightage: 13, startDayOffset: 100, durationDays: 50, isMilestone: false, isCriticalPath: false, categoryIndex: 1 },
  { wbsCode: '3.1', wbsLevel: 2, parentWbsCode: '3.0', name: 'Cable Laying', phase: 'construction', quantity: 5000, unit: 'm', weightage: 7, startDayOffset: 100, durationDays: 25, isMilestone: false, isCriticalPath: false, categoryIndex: 1 },
  { wbsCode: '3.2', wbsLevel: 2, parentWbsCode: '3.0', name: 'Panel Wiring', phase: 'commissioning', quantity: 12, unit: 'nos', weightage: 6, startDayOffset: 125, durationDays: 20, isMilestone: false, isCriticalPath: false, categoryIndex: 1 },
];

// Items for Control Building
const CONTROL_BUILDING_ITEMS: WBSItemDef[] = [
  { wbsCode: '1.0', wbsLevel: 1, parentWbsCode: null, name: 'Design & Approvals', phase: 'design', quantity: 1, unit: 'lot', weightage: 3, startDayOffset: 0, durationDays: 20, isMilestone: false, isCriticalPath: false, categoryIndex: 0 },
  { wbsCode: '2.0', wbsLevel: 1, parentWbsCode: null, name: 'Building Construction', phase: 'construction', quantity: 1, unit: 'lot', weightage: 15, startDayOffset: 20, durationDays: 100, isMilestone: false, isCriticalPath: true, categoryIndex: 0 },
  { wbsCode: '2.1', wbsLevel: 2, parentWbsCode: '2.0', name: 'Foundation Work', phase: 'construction', quantity: 200, unit: 'cum', weightage: 6, startDayOffset: 20, durationDays: 25, isMilestone: false, isCriticalPath: true, categoryIndex: 0 },
  { wbsCode: '2.2', wbsLevel: 2, parentWbsCode: '2.0', name: 'Structural Steel', phase: 'construction', quantity: 80, unit: 'MT', weightage: 5, startDayOffset: 45, durationDays: 35, isMilestone: false, isCriticalPath: true, categoryIndex: 0 },
  { wbsCode: '2.3', wbsLevel: 2, parentWbsCode: '2.0', name: 'Roofing & Cladding', phase: 'construction', quantity: 600, unit: 'sqm', weightage: 4, startDayOffset: 80, durationDays: 20, isMilestone: false, isCriticalPath: false, categoryIndex: 0 },
  { wbsCode: '3.0', wbsLevel: 1, parentWbsCode: null, name: 'SCADA & Control Systems', phase: 'commissioning', quantity: 1, unit: 'lot', weightage: 10, startDayOffset: 130, durationDays: 40, isMilestone: false, isCriticalPath: true, categoryIndex: 2 },
];

// Map site index → items
const SITE_ITEMS: WBSItemDef[][] = [
  SUBSTATION_A_ITEMS,
  SUBSTATION_B_ITEMS,
  CONTROL_BUILDING_ITEMS,
];

// ─── Helper ──────────────────────────────────────────────────────

function daysFromNow(days: number): number {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

// ─── Main generator ──────────────────────────────────────────────

/**
 * Generates realistic Planner demo data for a given project.
 *
 * Creates:
 * - 6 Key Dates (KD-G-01 through KD-F-01)
 * - 3 Sites (Substation A, Substation B, Control Building)
 * - Key Date ↔ Site links with contribution percentages
 * - 3 Categories (Civil, Electrical, Erection & Commissioning)
 * - ~24 WBS Items across all sites
 *
 * All records are created in a single atomic database.write() transaction.
 */
export async function generatePlannerDemoData(projectId: string): Promise<DemoDataResult> {
  const createdKeyDates: KeyDateModel[] = [];
  const createdSites: SiteModel[] = [];
  const createdCategories: CategoryModel[] = [];
  let itemCount = 0;

  await database.write(async () => {
    const keyDatesCollection = database.collections.get<KeyDateModel>('key_dates');
    const sitesCollection = database.collections.get<SiteModel>('sites');
    const kdSitesCollection = database.collections.get<KeyDateSiteModel>('key_date_sites');
    const itemsCollection = database.collections.get<ItemModel>('items');
    const categoriesCollection = database.collections.get<CategoryModel>('categories');

    // 1. Create Categories
    for (const catDef of CATEGORIES) {
      const cat = await categoriesCollection.create((record: any) => {
        record.name = catDef.name;
        record.description = catDef.description;
        record.appSyncStatus = 'pending';
        record.version = 1;
      });
      createdCategories.push(cat);
    }

    // 2. Create Key Dates
    for (const kdDef of KEY_DATES) {
      const kd = await keyDatesCollection.create((record: any) => {
        record.code = kdDef.code;
        record.category = kdDef.category;
        record.categoryName = kdDef.categoryName;
        record.description = kdDef.description;
        record.targetDays = kdDef.targetDays;
        record.targetDate = daysFromNow(kdDef.targetDays);
        record.status = 'not_started';
        record.progressPercentage = 0;
        record.delayDamagesInitial = kdDef.delayDamagesInitial;
        record.delayDamagesExtended = kdDef.delayDamagesExtended;
        record.projectId = projectId;
        record.sequenceOrder = kdDef.sequenceOrder;
        record.weightage = kdDef.weightage;
        record.createdBy = 'planner';
        record.updatedAt = Date.now();
        record.appSyncStatus = 'pending';
        record.version = 1;
      });
      createdKeyDates.push(kd);
    }

    // 3. Create Sites
    for (const siteDef of SITES) {
      const site = await sitesCollection.create((record: any) => {
        record.name = siteDef.name;
        record.location = siteDef.location;
        record.projectId = projectId;
        record.plannedStartDate = daysFromNow(siteDef.startDayOffset);
        record.plannedEndDate = daysFromNow(siteDef.endDayOffset);
        record.appSyncStatus = 'pending';
        record.version = 1;
      });
      createdSites.push(site);
    }

    // 4. Create Key Date ↔ Site links
    for (const kd of createdKeyDates) {
      const contributions = KD_SITE_CONTRIBUTIONS[kd.code];
      if (!contributions) continue;

      for (let siteIdx = 0; siteIdx < createdSites.length; siteIdx++) {
        await kdSitesCollection.create((record: any) => {
          record.keyDateId = kd.id;
          record.siteId = createdSites[siteIdx].id;
          record.contributionPercentage = contributions[siteIdx];
          record.progressPercentage = 0;
          record.status = 'not_started';
          record.updatedAt = Date.now();
          record.appSyncStatus = 'pending';
          record.version = 1;
        });
      }
    }

    // 5. Create WBS Items per site
    for (let siteIdx = 0; siteIdx < createdSites.length; siteIdx++) {
      const site = createdSites[siteIdx];
      const siteDef = SITES[siteIdx];
      const itemDefs = SITE_ITEMS[siteIdx];

      for (const itemDef of itemDefs) {
        await itemsCollection.create((record: any) => {
          record.name = itemDef.name;
          record.categoryId = createdCategories[itemDef.categoryIndex].id;
          record.siteId = site.id;
          record.wbsCode = itemDef.wbsCode;
          record.wbsLevel = itemDef.wbsLevel;
          record.parentWbsCode = itemDef.parentWbsCode || '';
          record.projectPhase = itemDef.phase;
          record.plannedQuantity = itemDef.quantity;
          record.completedQuantity = 0;
          record.unitOfMeasurement = itemDef.unit;
          record.weightage = itemDef.weightage;
          record.plannedStartDate = daysFromNow(siteDef.startDayOffset + itemDef.startDayOffset);
          record.plannedEndDate = daysFromNow(siteDef.startDayOffset + itemDef.startDayOffset + itemDef.durationDays);
          record.status = 'not_started';
          record.isMilestone = itemDef.isMilestone;
          record.isCriticalPath = itemDef.isCriticalPath;
          record.isBaselineLocked = false;
          record.createdByRole = 'planner';
          record.appSyncStatus = 'pending';
          record.version = 1;
        });
        itemCount++;
      }
    }
  });

  return {
    sitesCreated: createdSites.length,
    keyDatesCreated: createdKeyDates.length,
    itemsCreated: itemCount,
    categoriesCreated: createdCategories.length,
  };
}

export default { generatePlannerDemoData };
