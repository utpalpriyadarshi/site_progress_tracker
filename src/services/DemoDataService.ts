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
import { Q } from '@nozbe/watermelondb';
import KeyDateModel, { KeyDateCategory } from '../../models/KeyDateModel';
import KeyDateSiteModel from '../../models/KeyDateSiteModel';
import SiteModel from '../../models/SiteModel';
import ItemModel, { ProjectPhase } from '../../models/ItemModel';
import CategoryModel from '../../models/CategoryModel';
import MilestoneModel from '../../models/MilestoneModel';
import MilestoneProgressModel from '../../models/MilestoneProgressModel';
import DoorsPackageModel from '../../models/DoorsPackageModel';
import RfqModel from '../../models/RfqModel';
import DesignDocumentModel from '../../models/DesignDocumentModel';
import DesignDocumentCategoryModel from '../../models/DesignDocumentCategoryModel';
import HindranceModel from '../../models/HindranceModel';
import SiteInspectionModel from '../../models/SiteInspectionModel';
import MaterialModel from '../../models/MaterialModel';
import ProgressLogModel from '../../models/ProgressLogModel';
import DailyReportModel from '../../models/DailyReportModel';
import PurchaseOrderModel from '../../models/PurchaseOrderModel';
import BomModel from '../../models/BomModel';
import BomItemModel from '../../models/BomItemModel';
import VendorModel from '../../models/VendorModel';
import BudgetModel from '../../models/BudgetModel';
import CostModel from '../../models/CostModel';
import InvoiceModel from '../../models/InvoiceModel';
import DomainModel from '../../models/DomainModel';

// ─── Types ───────────────────────────────────────────────────────

export interface DemoDataResult {
  sitesCreated: number;
  keyDatesCreated: number;
  itemsCreated: number;
  categoriesCreated: number;
  milestonesCreated: number;
  milestoneProgressCreated: number;
}

export interface DesignerDemoDataResult {
  domainsCreated: number;
  doorsPackagesCreated: number;
  designRfqsCreated: number;
  designDocumentsCreated: number;
  designDocCategoriesCreated: number;
}

export interface SupervisorDemoDataResult {
  sitesCreated: number;
  itemsCreated: number;
  progressLogsCreated: number;
  dailyReportsCreated: number;
  hindrancesCreated: number;
  materialsCreated: number;
  inspectionsCreated: number;
}

export interface ManagerDemoDataResult {
  purchaseOrdersCreated: number;
  vendorsCreated: number;
  bomsCreated: number;
  bomItemsCreated: number;
}

export interface LogisticsDemoDataResult {
  materialsCreated: number;
  inventoryItemsCreated: number;
  deliveriesCreated: number;
  equipmentCreated: number;
}

export interface CommercialManagerDemoDataResult {
  budgetsCreated: number;
  costsCreated: number;
  invoicesCreated: number;
}

// ─── Key Date definitions ────────────────────────────────────────

interface KeyDateDef {
  code: string;
  category: KeyDateCategory;
  categoryName: string;
  description: string;
  targetDays: number;
  weightage: number;
  designWeightage?: number;
  progressMode?: 'auto' | 'manual' | 'binary';
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
    progressMode: 'binary',
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
    designWeightage: 20,
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
    progressMode: 'manual',
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
  // index 0: project-level analytical site — design & engineering activities
  { name: 'Simulation Studies', location: 'Project-Level — All Systems', startDayOffset: 0, endDayOffset: 365 },
  // index 1: physical TSS site — civil, equipment erection
  { name: 'Traction Substation (TSS-01)', location: 'Zone 1 — North Block, Plot 14', startDayOffset: 7, endDayOffset: 365 },
  // index 2: physical OCS/OHE site — mast erection, stringing
  { name: 'OHE Zone 1 — North Corridor', location: 'Zone 2 — North Corridor, Ch. 0+000 to 15+500', startDayOffset: 14, endDayOffset: 350 },
];

// ─── KD ↔ Site contribution percentages ─────────────────────────

// Indexed by KD code, then site index (0=Simulation Studies, 1=TSS-01, 2=OHE Zone 1)
const KD_SITE_CONTRIBUTIONS: Record<string, number[]> = {
  'KD-A-01': [50, 30, 20], // Design Approval — led by Simulation Studies
  'KD-B-01': [10, 50, 40], // Procurement — physical-site driven
  'KD-C-01': [10, 55, 35], // Civil Works — physical sites; Sim Studies has design supervision share
  'KD-D-01': [5, 55, 40],  // Erection & Commissioning — physical sites; Sim Studies has documentation share
};

// ─── Milestone definitions ───────────────────────────────────────

interface MilestoneDef {
  code: string;
  name: string;
  description: string;
  weightage: number;
  order: number;
}

const MILESTONES: MilestoneDef[] = [
  { code: 'PM100', name: 'Requirements Management (DOORS)', description: 'Requirements capture, traceability, and management', weightage: 10, order: 1 },
  { code: 'PM200', name: 'Engineering & Design', description: 'Detailed engineering and design documentation', weightage: 15, order: 2 },
  { code: 'PM300', name: 'Procurement', description: 'Material procurement and vendor management', weightage: 15, order: 3 },
  { code: 'PM400', name: 'Manufacturing', description: 'Factory manufacturing and FAT', weightage: 10, order: 4 },
  { code: 'PM500', name: 'Testing & Pre-commissioning', description: 'Site testing and pre-commissioning activities', weightage: 15, order: 5 },
  { code: 'PM600', name: 'Commissioning', description: 'System commissioning and integration', weightage: 20, order: 6 },
  { code: 'PM700', name: 'Handover', description: 'Final handover and documentation', weightage: 15, order: 7 },
];

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
  dependsOnWbsCodes?: string[]; // WBS codes this item depends on (Finish-to-Start)
}

// Items for Simulation Studies site — engineering, studies, approvals
// Dependency chain: 1.1 → 1.2 → 2.1 → 2.2
const SIMULATION_STUDIES_ITEMS: WBSItemDef[] = [
  { wbsCode: '1.0', wbsLevel: 1, parentWbsCode: null, name: 'System Studies & Engineering', phase: 'design', quantity: 1, unit: 'lot', weightage: 8, startDayOffset: 0, durationDays: 30, isMilestone: false, isCriticalPath: true, categoryIndex: 1 },
  { wbsCode: '1.1', wbsLevel: 2, parentWbsCode: '1.0', name: 'Load Flow & Short Circuit Studies', phase: 'design', quantity: 1, unit: 'lot', weightage: 4, startDayOffset: 0, durationDays: 15, isMilestone: false, isCriticalPath: true, categoryIndex: 1 },
  { wbsCode: '1.2', wbsLevel: 2, parentWbsCode: '1.0', name: 'OCS Engineering Analysis', phase: 'design', quantity: 1, unit: 'lot', weightage: 4, startDayOffset: 10, durationDays: 15, isMilestone: false, isCriticalPath: true, categoryIndex: 1, dependsOnWbsCodes: ['1.1'] },
  { wbsCode: '2.0', wbsLevel: 1, parentWbsCode: null, name: 'Design Approval', phase: 'design', quantity: 1, unit: 'lot', weightage: 10, startDayOffset: 30, durationDays: 20, isMilestone: false, isCriticalPath: true, categoryIndex: 1 },
  { wbsCode: '2.1', wbsLevel: 2, parentWbsCode: '2.0', name: 'Preliminary Design Submission', phase: 'design', quantity: 1, unit: 'lot', weightage: 4, startDayOffset: 30, durationDays: 10, isMilestone: false, isCriticalPath: true, categoryIndex: 1, dependsOnWbsCodes: ['1.2'] },
  { wbsCode: '2.2', wbsLevel: 2, parentWbsCode: '2.0', name: 'Detail Design Review & Approval', phase: 'design', quantity: 1, unit: 'lot', weightage: 6, startDayOffset: 40, durationDays: 10, isMilestone: false, isCriticalPath: true, categoryIndex: 1, dependsOnWbsCodes: ['2.1'] },
];

// Items for Traction Substation (TSS-01) — civil works, equipment erection
// Dependency chain: 1.1 → 1.2 → 2.1 → 2.2 → 3.1 → 3.2
const TSS_ITEMS: WBSItemDef[] = [
  { wbsCode: '1.0', wbsLevel: 1, parentWbsCode: null, name: 'Site Preparation', phase: 'site_prep', quantity: 1, unit: 'lot', weightage: 5, startDayOffset: 0, durationDays: 15, isMilestone: false, isCriticalPath: false, categoryIndex: 0 },
  { wbsCode: '1.1', wbsLevel: 2, parentWbsCode: '1.0', name: 'Clearing & Grubbing', phase: 'site_prep', quantity: 2000, unit: 'sqm', weightage: 2, startDayOffset: 0, durationDays: 7, isMilestone: false, isCriticalPath: true, categoryIndex: 0 },
  { wbsCode: '1.2', wbsLevel: 2, parentWbsCode: '1.0', name: 'Temporary Fencing', phase: 'site_prep', quantity: 500, unit: 'm', weightage: 3, startDayOffset: 3, durationDays: 8, isMilestone: false, isCriticalPath: true, categoryIndex: 0, dependsOnWbsCodes: ['1.1'] },
  { wbsCode: '2.0', wbsLevel: 1, parentWbsCode: null, name: 'Civil & Structural Works', phase: 'construction', quantity: 1, unit: 'lot', weightage: 20, startDayOffset: 15, durationDays: 90, isMilestone: false, isCriticalPath: true, categoryIndex: 0 },
  { wbsCode: '2.1', wbsLevel: 2, parentWbsCode: '2.0', name: 'Foundation Excavation', phase: 'construction', quantity: 800, unit: 'cum', weightage: 8, startDayOffset: 15, durationDays: 20, isMilestone: false, isCriticalPath: true, categoryIndex: 0, dependsOnWbsCodes: ['1.2'] },
  { wbsCode: '2.2', wbsLevel: 2, parentWbsCode: '2.0', name: 'RCC Foundation & Cable Trench', phase: 'construction', quantity: 400, unit: 'cum', weightage: 12, startDayOffset: 35, durationDays: 30, isMilestone: false, isCriticalPath: true, categoryIndex: 0, dependsOnWbsCodes: ['2.1'] },
  { wbsCode: '3.0', wbsLevel: 1, parentWbsCode: null, name: 'Equipment Erection', phase: 'construction', quantity: 1, unit: 'lot', weightage: 15, startDayOffset: 120, durationDays: 60, isMilestone: false, isCriticalPath: true, categoryIndex: 2 },
  { wbsCode: '3.1', wbsLevel: 2, parentWbsCode: '3.0', name: 'Transformer & Switchgear Erection', phase: 'commissioning', quantity: 3, unit: 'nos', weightage: 10, startDayOffset: 120, durationDays: 25, isMilestone: false, isCriticalPath: true, categoryIndex: 2, dependsOnWbsCodes: ['2.2'] },
  { wbsCode: '3.2', wbsLevel: 2, parentWbsCode: '3.0', name: 'Control Cable Laying & Panel Wiring', phase: 'commissioning', quantity: 2000, unit: 'm', weightage: 5, startDayOffset: 145, durationDays: 20, isMilestone: false, isCriticalPath: true, categoryIndex: 1, dependsOnWbsCodes: ['3.1'] },
];

// Items for OHE Zone 1 — survey, mast foundation, OHE erection, stringing
// Dependency chain: 1.1 → 1.2 → 2.1 → 2.2 → 3.1 → 3.2
const OHE_ITEMS: WBSItemDef[] = [
  { wbsCode: '1.0', wbsLevel: 1, parentWbsCode: null, name: 'Survey & Preparation', phase: 'site_prep', quantity: 1, unit: 'lot', weightage: 4, startDayOffset: 0, durationDays: 15, isMilestone: false, isCriticalPath: false, categoryIndex: 0 },
  { wbsCode: '1.1', wbsLevel: 2, parentWbsCode: '1.0', name: 'Route Survey & Chainage Marking', phase: 'site_prep', quantity: 15.5, unit: 'km', weightage: 2, startDayOffset: 0, durationDays: 7, isMilestone: false, isCriticalPath: true, categoryIndex: 0 },
  { wbsCode: '1.2', wbsLevel: 2, parentWbsCode: '1.0', name: 'Mast Position Staking', phase: 'site_prep', quantity: 310, unit: 'nos', weightage: 2, startDayOffset: 5, durationDays: 8, isMilestone: false, isCriticalPath: true, categoryIndex: 0, dependsOnWbsCodes: ['1.1'] },
  { wbsCode: '2.0', wbsLevel: 1, parentWbsCode: null, name: 'OHE Civil Works', phase: 'construction', quantity: 1, unit: 'lot', weightage: 18, startDayOffset: 15, durationDays: 80, isMilestone: false, isCriticalPath: true, categoryIndex: 0 },
  { wbsCode: '2.1', wbsLevel: 2, parentWbsCode: '2.0', name: 'Mast Foundation Excavation', phase: 'construction', quantity: 310, unit: 'nos', weightage: 10, startDayOffset: 15, durationDays: 35, isMilestone: false, isCriticalPath: true, categoryIndex: 0, dependsOnWbsCodes: ['1.2'] },
  { wbsCode: '2.2', wbsLevel: 2, parentWbsCode: '2.0', name: 'Mast Foundation Concreting', phase: 'construction', quantity: 310, unit: 'nos', weightage: 8, startDayOffset: 50, durationDays: 35, isMilestone: false, isCriticalPath: true, categoryIndex: 0, dependsOnWbsCodes: ['2.1'] },
  { wbsCode: '3.0', wbsLevel: 1, parentWbsCode: null, name: 'OHE Erection & Stringing', phase: 'construction', quantity: 1, unit: 'lot', weightage: 13, startDayOffset: 100, durationDays: 50, isMilestone: false, isCriticalPath: true, categoryIndex: 2 },
  { wbsCode: '3.1', wbsLevel: 2, parentWbsCode: '3.0', name: 'Mast Erection', phase: 'construction', quantity: 310, unit: 'nos', weightage: 7, startDayOffset: 100, durationDays: 25, isMilestone: false, isCriticalPath: true, categoryIndex: 2, dependsOnWbsCodes: ['2.2'] },
  { wbsCode: '3.2', wbsLevel: 2, parentWbsCode: '3.0', name: 'Catenary & Contact Wire Stringing', phase: 'commissioning', quantity: 15.5, unit: 'km', weightage: 6, startDayOffset: 125, durationDays: 20, isMilestone: false, isCriticalPath: true, categoryIndex: 2, dependsOnWbsCodes: ['3.1'] },
];

// Map site index → items (0=Simulation Studies, 1=TSS-01, 2=OHE Zone 1)
const SITE_ITEMS: WBSItemDef[][] = [
  SIMULATION_STUDIES_ITEMS,
  TSS_ITEMS,
  OHE_ITEMS,
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
 * - 7 Milestones (PM100-PM700)
 * - 21 Milestone Progress records (7 milestones × 3 sites)
 * - ~24 WBS Items across all sites with Finish-to-Start dependencies
 *
 * All records are created in a single atomic database.write() transaction.
 */
export async function generatePlannerDemoData(projectId: string): Promise<DemoDataResult> {
  // Guard: prevent duplicate generation
  const existingKeyDates = await database.collections
    .get<KeyDateModel>('key_dates')
    .query(Q.where('project_id', projectId))
    .fetch();
  if (existingKeyDates.length > 0) {
    throw new Error(
      'Planner demo data already exists for this project. Use Admin → Reset Database to start fresh.'
    );
  }

  const createdKeyDates: KeyDateModel[] = [];
  const createdSites: SiteModel[] = [];
  const createdCategories: CategoryModel[] = [];
  const createdMilestones: MilestoneModel[] = [];
  let itemCount = 0;
  let milestoneProgressCount = 0;

  // Track created items by wbsCode per site for dependency wiring
  type ItemIdMap = Map<string, string>; // wbsCode → item.id
  const siteItemMaps: ItemIdMap[] = [];

  await database.write(async () => {
    const keyDatesCollection = database.collections.get<KeyDateModel>('key_dates');
    const sitesCollection = database.collections.get<SiteModel>('sites');
    const kdSitesCollection = database.collections.get<KeyDateSiteModel>('key_date_sites');
    const itemsCollection = database.collections.get<ItemModel>('items');
    const categoriesCollection = database.collections.get<CategoryModel>('categories');
    const milestonesCollection = database.collections.get<MilestoneModel>('milestones');
    const milestoneProgressCollection = database.collections.get<MilestoneProgressModel>('milestone_progress');

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
        record.designWeightage = kdDef.designWeightage || 0;
        record.progressMode = kdDef.progressMode || null;
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

    // 5. Create Milestones
    for (const msDef of MILESTONES) {
      const milestone = await milestonesCollection.create((record: any) => {
        record.projectId = projectId;
        record.milestoneCode = msDef.code;
        record.milestoneName = msDef.name;
        record.description = msDef.description;
        record.sequenceOrder = msDef.order;
        record.weightage = msDef.weightage;
        record.isActive = true;
        record.isCustom = false;
        record.createdBy = 'planner';
        record.updatedAt = Date.now();
        record.appSyncStatus = 'pending';
        record.version = 1;
      });
      createdMilestones.push(milestone);
    }

    // 6. Create Milestone Progress (7 milestones × 3 sites = 21 records)
    for (const milestone of createdMilestones) {
      for (let siteIdx = 0; siteIdx < createdSites.length; siteIdx++) {
        const site = createdSites[siteIdx];
        const siteDef = SITES[siteIdx];

        await milestoneProgressCollection.create((record: any) => {
          record.milestoneId = milestone.id;
          record.siteId = site.id;
          record.projectId = projectId;
          record.progressPercentage = 0;
          record.status = 'not_started';
          record.plannedStartDate = daysFromNow(siteDef.startDayOffset + (milestone.sequenceOrder - 1) * 45);
          record.plannedEndDate = daysFromNow(siteDef.startDayOffset + milestone.sequenceOrder * 45);
          record.updatedBy = 'planner';
          record.updatedAt = Date.now();
          record.appSyncStatus = 'pending';
          record.version = 1;
        });
        milestoneProgressCount++;
      }
    }

    // 7. Create WBS Items per site (with ID tracking for dependencies)
    for (let siteIdx = 0; siteIdx < createdSites.length; siteIdx++) {
      const site = createdSites[siteIdx];
      const siteDef = SITES[siteIdx];
      const itemDefs = SITE_ITEMS[siteIdx];
      const itemIdMap: ItemIdMap = new Map();

      for (const itemDef of itemDefs) {
        const item = await itemsCollection.create((record: any) => {
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
        itemIdMap.set(itemDef.wbsCode, item.id);
        itemCount++;
      }

      siteItemMaps.push(itemIdMap);
    }

    // 8. Wire up Item Dependencies (second pass)
    for (let siteIdx = 0; siteIdx < createdSites.length; siteIdx++) {
      const itemDefs = SITE_ITEMS[siteIdx];
      const itemIdMap = siteItemMaps[siteIdx];

      for (const itemDef of itemDefs) {
        if (itemDef.dependsOnWbsCodes && itemDef.dependsOnWbsCodes.length > 0) {
          const itemId = itemIdMap.get(itemDef.wbsCode);
          if (!itemId) continue;

          const dependencyIds = itemDef.dependsOnWbsCodes
            .map(wbs => itemIdMap.get(wbs))
            .filter((id): id is string => id !== undefined);

          if (dependencyIds.length > 0) {
            const item = await itemsCollection.find(itemId);
            await item.update((record: any) => {
              record.dependencies = JSON.stringify(dependencyIds);
            });
          }
        }
      }
    }
  });

  return {
    sitesCreated: createdSites.length,
    keyDatesCreated: createdKeyDates.length,
    itemsCreated: itemCount,
    categoriesCreated: createdCategories.length,
    milestonesCreated: createdMilestones.length,
    milestoneProgressCreated: milestoneProgressCount,
  };
}

// ─── Designer Demo Data Definitions ──────────────────────────────

interface DoorsPackageDef {
  doorsId: string;
  equipmentName: string;
  category: string;
  equipmentType: string;
  materialType?: string;
  specificationRef: string;
  quantity: number;
  unit: string;
  totalRequirements: number;
  compliantRequirements: number;
  status: string;
  priority: string;
}

const DOORS_PACKAGES: DoorsPackageDef[] = [
  {
    doorsId: 'DOORS-TSS-AUX-TRF-001',
    equipmentName: 'Auxiliary Transformer 1000kVA',
    category: 'TSS',
    equipmentType: 'Transformer',
    materialType: 'Copper Wound',
    specificationRef: 'SPEC-TSS-TRF-001',
    quantity: 4,
    unit: 'nos',
    totalRequirements: 100,
    compliantRequirements: 85,
    status: 'reviewed',
    priority: 'high',
  },
  {
    doorsId: 'DOORS-TSS-SWG-002',
    equipmentName: '33kV GIS Switchgear',
    category: 'TSS',
    equipmentType: 'Switchgear',
    materialType: 'SF6 Gas Insulated',
    specificationRef: 'SPEC-TSS-SWG-001',
    quantity: 6,
    unit: 'sets',
    totalRequirements: 80,
    compliantRequirements: 72,
    status: 'approved',
    priority: 'high',
  },
  {
    doorsId: 'DOORS-OHE-CBL-003',
    equipmentName: 'Contact Wire Cu-Mg 107mm²',
    category: 'OHE',
    equipmentType: 'Cable',
    materialType: 'Copper-Magnesium Alloy',
    specificationRef: 'SPEC-OHE-CBL-001',
    quantity: 25000,
    unit: 'meters',
    totalRequirements: 60,
    compliantRequirements: 48,
    status: 'received',
    priority: 'medium',
  },
  {
    doorsId: 'DOORS-OHE-MST-004',
    equipmentName: 'OHE Mast 9m',
    category: 'OHE',
    equipmentType: 'Mast',
    materialType: 'Galvanized Steel',
    specificationRef: 'SPEC-OHE-MST-001',
    quantity: 120,
    unit: 'nos',
    totalRequirements: 50,
    compliantRequirements: 50,
    status: 'closed',
    priority: 'medium',
  },
  {
    doorsId: 'DOORS-SCADA-RTU-005',
    equipmentName: 'Remote Terminal Unit',
    category: 'SCADA',
    equipmentType: 'Panel',
    materialType: 'Industrial Grade',
    specificationRef: 'SPEC-SCADA-RTU-001',
    quantity: 8,
    unit: 'nos',
    totalRequirements: 75,
    compliantRequirements: 60,
    status: 'pending',
    priority: 'low',
  },
];

interface DesignRfqDef {
  rfqNumber: string;
  title: string;
  description: string;
  status: string;
  totalVendorsInvited: number;
  totalQuotesReceived: number;
  doorsPackageIndex: number; // index into DOORS_PACKAGES
}

const DESIGN_RFQS: DesignRfqDef[] = [
  {
    rfqNumber: 'RFQ-DE-2026-001',
    title: 'Auxiliary Transformer Supply',
    description: 'Supply of 1000kVA auxiliary transformers as per DOORS specifications',
    status: 'issued',
    totalVendorsInvited: 5,
    totalQuotesReceived: 3,
    doorsPackageIndex: 0,
  },
  {
    rfqNumber: 'RFQ-DE-2026-002',
    title: '33kV GIS Switchgear Supply',
    description: 'Supply and installation of 33kV Gas Insulated Switchgear',
    status: 'evaluated',
    totalVendorsInvited: 4,
    totalQuotesReceived: 4,
    doorsPackageIndex: 1,
  },
  {
    rfqNumber: 'RFQ-DE-2026-003',
    title: 'Contact Wire Supply',
    description: 'Supply of Cu-Mg contact wire for OHE system',
    status: 'awarded',
    totalVendorsInvited: 6,
    totalQuotesReceived: 5,
    doorsPackageIndex: 2,
  },
  {
    rfqNumber: 'RFQ-DE-2026-004',
    title: 'OHE Mast Supply',
    description: 'Supply of 9m OHE masts with foundation bolts',
    status: 'draft',
    totalVendorsInvited: 0,
    totalQuotesReceived: 0,
    doorsPackageIndex: 3,
  },
  {
    rfqNumber: 'RFQ-DE-2026-005',
    title: 'SCADA RTU Panel Supply',
    description: 'Supply of Remote Terminal Units for SCADA system',
    status: 'cancelled',
    totalVendorsInvited: 3,
    totalQuotesReceived: 0,
    doorsPackageIndex: 4,
  },
];

interface DesignDocCategoryDef {
  name: string;
  documentType: string;
  sequenceOrder: number;
}

const DESIGN_DOC_CATEGORIES: DesignDocCategoryDef[] = [
  // index 0 — TSS Studies
  { name: 'TSS Studies', documentType: 'simulation_study', sequenceOrder: 1 },
  // index 1 — OCS Studies
  { name: 'OCS Studies', documentType: 'simulation_study', sequenceOrder: 2 },
  // index 2 — TSS Installation Design
  { name: 'TSS Installation Design', documentType: 'installation', sequenceOrder: 1 },
  // index 3 — TSS Product Design
  { name: 'TSS Product Design', documentType: 'product_equipment', sequenceOrder: 1 },
  // index 4 — OCS Installation Design
  { name: 'OCS Installation Design', documentType: 'installation', sequenceOrder: 2 },
  // index 5 — OCS Product Design
  { name: 'OCS Product Design', documentType: 'product_equipment', sequenceOrder: 2 },
];

interface DesignDocumentDef {
  documentNumber: string;
  title: string;
  description: string;
  documentType: string;
  categoryIndex: number; // index into DESIGN_DOC_CATEGORIES
  siteIndex: number;     // 0 = Simulation Studies, 1 = TSS-01, 2 = OHE Zone 1
  revisionNumber: string;
  status: string;
  linkToKD?: string; // KD code to link this doc to (e.g., 'KD-A-01')
  weightage?: number; // weightage for design progress calculation
}

const DESIGN_DOCUMENTS: DesignDocumentDef[] = [
  // ── TSS Studies (site: Simulation Studies) ──
  {
    documentNumber: 'DD-SIM-001',
    title: 'Load Flow Study (Normal & Degraded Mode)',
    description: 'Load flow analysis for 25kV traction power system under normal and degraded operating conditions',
    documentType: 'simulation_study',
    categoryIndex: 0,
    siteIndex: 0,
    revisionNumber: 'R2',
    status: 'approved',
    linkToKD: 'KD-A-01',
    weightage: 15,
  },
  {
    documentNumber: 'DD-SIM-002',
    title: 'Short Circuit Study (Max/Min Fault Level)',
    description: 'Fault current analysis for protection coordination and relay settings',
    documentType: 'simulation_study',
    categoryIndex: 0,
    siteIndex: 0,
    revisionNumber: 'R1',
    status: 'submitted',
    linkToKD: 'KD-A-01',
    weightage: 15,
  },
  // ── OCS Studies (site: Simulation Studies) ──
  {
    documentNumber: 'DD-SIM-003',
    title: 'OCS Span & Tension Calculation',
    description: 'Catenary wire span-tension analysis accounting for temperature variation and dynamic loading',
    documentType: 'simulation_study',
    categoryIndex: 1,
    siteIndex: 0,
    revisionNumber: 'R1',
    status: 'approved',
    linkToKD: 'KD-A-01',
    weightage: 10,
  },
  {
    documentNumber: 'DD-SIM-004',
    title: 'Pantograph-Catenary Dynamic Interaction Study',
    description: 'Dynamic interaction analysis between pantograph and catenary at operational speeds',
    documentType: 'simulation_study',
    categoryIndex: 1,
    siteIndex: 0,
    revisionNumber: 'R0',
    status: 'submitted',
    linkToKD: 'KD-A-01',
    weightage: 10,
  },
  // ── TSS Installation Design (site: TSS-01) ──
  {
    documentNumber: 'DD-INS-001',
    title: 'TSS General Arrangement (GA) Drawing',
    description: 'General arrangement drawing for Traction Substation showing equipment placement and clearances',
    documentType: 'installation',
    categoryIndex: 2,
    siteIndex: 1,
    revisionNumber: 'R3',
    status: 'approved',
    linkToKD: 'KD-A-01',
    weightage: 10,
  },
  {
    documentNumber: 'DD-INS-002',
    title: 'Single Line Diagram (SLD)',
    description: 'Single line diagram for 25kV AC traction substation showing all switching and protection elements',
    documentType: 'installation',
    categoryIndex: 2,
    siteIndex: 1,
    revisionNumber: 'R2',
    status: 'submitted',
    linkToKD: 'KD-A-01',
    weightage: 10,
  },
  // ── TSS Product Design (site: TSS-01) ──
  {
    documentNumber: 'DD-PRD-001',
    title: 'Transformer Detail Design Report',
    description: 'Detailed design report for 25kV traction transformer including rating calculations and GA drawing',
    documentType: 'product_equipment',
    categoryIndex: 3,
    siteIndex: 1,
    revisionNumber: 'R2',
    status: 'approved_with_comment',
    linkToKD: 'KD-A-01',
    weightage: 8,
  },
  {
    documentNumber: 'DD-PRD-002',
    title: 'SCADA System Architecture',
    description: 'SCADA architecture diagram and network topology for traction power monitoring and control',
    documentType: 'product_equipment',
    categoryIndex: 3,
    siteIndex: 1,
    revisionNumber: 'R0',
    status: 'draft',
    weightage: 7,
  },
  // ── OCS Installation Design (site: OHE Zone 1) ──
  {
    documentNumber: 'DD-INS-003',
    title: 'OCS Layout Plan (Chainage-wise)',
    description: 'Chainage-wise OCS layout plan showing mast positions, registration arms, and section insulators',
    documentType: 'installation',
    categoryIndex: 4,
    siteIndex: 2,
    revisionNumber: 'R2',
    status: 'approved',
    linkToKD: 'KD-A-01',
    weightage: 8,
  },
  {
    documentNumber: 'DD-INS-004',
    title: 'Foundation Drawing (Mast/Portal)',
    description: 'Structural foundation drawings for OHE mast and portal structures',
    documentType: 'installation',
    categoryIndex: 4,
    siteIndex: 2,
    revisionNumber: 'R1',
    status: 'draft',
    weightage: 7,
  },
  // ── OCS Product Design (site: OHE Zone 1) ──
  {
    documentNumber: 'DD-PRD-003',
    title: 'Cantilever Assembly Drawing',
    description: 'Detailed fabrication drawing for cantilever bracket assembly used in OHE registration',
    documentType: 'product_equipment',
    categoryIndex: 5,
    siteIndex: 2,
    revisionNumber: 'R1',
    status: 'submitted',
    linkToKD: 'KD-A-01',
    weightage: 8,
  },
  {
    documentNumber: 'DD-PRD-004',
    title: 'Mast Fabrication Drawing',
    description: 'Fabrication drawing for 9m galvanized steel OHE mast with foundation bolt arrangement',
    documentType: 'product_equipment',
    categoryIndex: 5,
    siteIndex: 2,
    revisionNumber: 'R0',
    status: 'draft',
    weightage: 7,
  },
];

// ─── Designer Demo Data Generator ─────────────────────────────────

/**
 * Generates realistic Design Engineer demo data for a given project.
 *
 * Creates:
 * - 5 DOORS Packages (TSS, OHE, SCADA equipment)
 * - 4 Design RFQs (various statuses)
 * - 8 Design Document Categories
 * - 6 Design Documents (simulation studies, installation, product/equipment)
 *
 * All records are created in a single atomic database.write() transaction.
 */
/** Default domains for a project */
const DEFAULT_DOMAINS = ['Simulation Studies', 'OHE', 'PSY', 'SCADA', 'Civil'];

/** Map DOORS package categories to domain names */
const CATEGORY_TO_DOMAIN: Record<string, string> = {
  'OHE': 'OHE',
  'TSS': 'PSY', // TSS maps to PSY domain
  'SCADA': 'SCADA',
  'Cables': 'OHE',
  'Hardware': 'Civil',
  'Consumables': 'Civil',
};

export async function generateDesignerDemoData(projectId: string): Promise<DesignerDemoDataResult> {
  const createdDoorsPackages: DoorsPackageModel[] = [];
  const createdCategories: DesignDocumentCategoryModel[] = [];
  let rfqCount = 0;
  let docCount = 0;
  let domainCount = 0;

  // Get designer user ID
  const rolesCollection = database.collections.get('roles');
  const roles = await rolesCollection.query().fetch();
  const designerRole = roles.find((r: any) => r.name === 'DesignEngineer');

  let designerId = 'design_engineer'; // fallback
  if (designerRole) {
    const usersCollection = database.collections.get('users');
    const designers = await usersCollection
      .query(Q.where('role_id', designerRole.id), Q.where('project_id', projectId))
      .fetch();
    if (designers.length > 0) {
      designerId = designers[0].id;
    }
  }

  // Get or create sites for this project
  const sitesCollection = database.collections.get('sites');
  let projectSites = await sitesCollection
    .query(Q.where('project_id', projectId))
    .fetch();

  await database.write(async () => {
    // If no sites exist, create default sites for designer
    if (projectSites.length === 0) {
      const defaultSites = [
        // index 0: project-level analytical site for all studies
        { name: 'Simulation Studies', location: 'Project-Level — All Systems' },
        // index 1: physical TSS site for installation and product docs
        { name: 'Traction Substation (TSS-01)', location: 'Zone 1 — North Block, Plot 14' },
        // index 2: physical OCS/OHE site for installation and product docs
        { name: 'OHE Zone 1 — North Corridor', location: 'Zone 2 — North Corridor, Ch. 0+000 to 15+500' },
      ];

      for (const siteDef of defaultSites) {
        const site = await sitesCollection.create((record: any) => {
          record.name = siteDef.name;
          record.location = siteDef.location;
          record.projectId = projectId;
          record.designEngineerId = designerId;
          record.plannedStartDate = Date.now();
          record.plannedEndDate = Date.now() + 365 * 24 * 60 * 60 * 1000; // 1 year
          record.appSyncStatus = 'pending';
          record.version = 1;
        });
        projectSites.push(site);
      }
    } else {
      // Assign designer to first 3 existing sites
      const assignedSites = projectSites.slice(0, 3);
      for (const site of assignedSites) {
        await site.update((s: any) => {
          s.designEngineerId = designerId;
        });
      }
    }

  const assignedSites = projectSites.slice(0, 3);
  const siteIds = assignedSites.map((s: any) => s.id);

    // 0. Create default domains for the project
    const domainsCollection = database.collections.get<DomainModel>('domains');
    const existingDomains = await domainsCollection.query(Q.where('project_id', projectId)).fetch();
    const domainsByName: Record<string, string> = {};

    if (existingDomains.length === 0) {
      for (const domainName of DEFAULT_DOMAINS) {
        const domain = await domainsCollection.create((record: any) => {
          record.name = domainName;
          record.projectId = projectId;
          record.createdAt = Date.now();
          record.appSyncStatus = 'pending';
          record.version = 1;
        });
        domainsByName[domainName] = domain.id;
        domainCount++;
      }

      // Assign domains to sites explicitly by discipline
      // index 0 = Simulation Studies site → 'Simulation Studies' domain
      // index 1 = TSS-01 site             → 'PSY' domain (TSS maps to PSY)
      // index 2 = OHE Zone 1 site         → 'OHE' domain
      const siteDomainNames = ['Simulation Studies', 'PSY', 'OHE'];
      for (let i = 0; i < Math.min(assignedSites.length, siteDomainNames.length); i++) {
        const domainId = domainsByName[siteDomainNames[i]] || null;
        if (domainId) {
          await assignedSites[i].update((s: any) => {
            s.domainId = domainId;
          });
        }
      }
    } else {
      for (const d of existingDomains) {
        domainsByName[d.name] = d.id;
      }
    }

    const doorsPackagesCollection = database.collections.get<DoorsPackageModel>('doors_packages');
    const rfqsCollection = database.collections.get<RfqModel>('rfqs');
    const docCategoriesCollection = database.collections.get<DesignDocumentCategoryModel>('design_document_categories');
    const documentsCollection = database.collections.get<DesignDocumentModel>('design_documents');

    // 1. Create DOORS Packages
    // DOORS packages are physical equipment — assign to physical sites only (skip Simulation Studies at index 0)
    const physicalSiteIds = siteIds.slice(1);
    let pkgIndex = 0;
    for (const pkgDef of DOORS_PACKAGES) {
      const compliancePercentage = Math.round((pkgDef.compliantRequirements / pkgDef.totalRequirements) * 100);
      const siteId = physicalSiteIds.length > 0 ? physicalSiteIds[pkgIndex % physicalSiteIds.length] : null;
      // Map category to domain
      const domainName = CATEGORY_TO_DOMAIN[pkgDef.category] || 'Civil';
      const domainId = domainsByName[domainName] || null;

      const pkg = await doorsPackagesCollection.create((record: any) => {
        record.doorsId = pkgDef.doorsId;
        record.equipmentName = pkgDef.equipmentName;
        record.category = pkgDef.category;
        record.equipmentType = pkgDef.equipmentType;
        record.materialType = pkgDef.materialType || null;
        record.projectId = projectId;
        record.siteId = siteId;
        record.domainId = domainId;
        record.engineerId = designerId;
        record.specificationRef = pkgDef.specificationRef;
        record.quantity = pkgDef.quantity;
        record.unit = pkgDef.unit;
        record.totalRequirements = pkgDef.totalRequirements;
        record.compliantRequirements = pkgDef.compliantRequirements;
        record.compliancePercentage = compliancePercentage;
        record.technicalReqCompliance = compliancePercentage + Math.floor(Math.random() * 5);
        record.datasheetCompliance = compliancePercentage - Math.floor(Math.random() * 5);
        record.typeTestCompliance = compliancePercentage + Math.floor(Math.random() * 3);
        record.routineTestCompliance = compliancePercentage;
        record.siteReqCompliance = compliancePercentage - Math.floor(Math.random() * 3);
        record.status = pkgDef.status;
        record.priority = pkgDef.priority;
        // v45: Status transition audit fields
        if (['received', 'reviewed', 'approved', 'closed'].includes(pkgDef.status)) {
          record.receivedDate = daysFromNow(-30);
          record.receivedBy = designerId;
          record.receivedRemarks = 'Package received and initial check completed.';
        }
        if (['reviewed', 'approved', 'closed'].includes(pkgDef.status)) {
          record.reviewedDate = daysFromNow(-20);
          record.reviewedBy = designerId;
          record.reviewObservations = 'Technical specifications reviewed. Compliance verified against project requirements.';
        }
        if (['approved', 'closed'].includes(pkgDef.status)) {
          record.approvedBy = designerId;
          record.approvedDate = daysFromNow(-10);
          record.approvalRemarks = 'Approved for procurement. All requirements meet project specifications.';
        }
        if (pkgDef.status === 'closed') {
          record.closureDate = daysFromNow(-3);
          record.closureRemarks = 'All requirements verified and procurement complete.';
        }
        record.createdBy = designerId;
        record.createdAt = Date.now();
        record.updatedAt = Date.now();
        record.appSyncStatus = 'pending';
        record.version = 1;
      });
      createdDoorsPackages.push(pkg);
      pkgIndex++;
    }

    // 2. Create Design RFQs
    for (const rfqDef of DESIGN_RFQS) {
      const doorsPackage = createdDoorsPackages[rfqDef.doorsPackageIndex];
      // Get domain from DOORS package
      const pkgDef = DOORS_PACKAGES[rfqDef.doorsPackageIndex];
      const rfqDomainName = CATEGORY_TO_DOMAIN[pkgDef.category] || 'Civil';
      const rfqDomainId = domainsByName[rfqDomainName] || null;

      await rfqsCollection.create((record: any) => {
        record.rfqNumber = rfqDef.rfqNumber;
        record.doorsId = doorsPackage.doorsId;
        record.doorsPackageId = doorsPackage.id;
        record.projectId = projectId;
        record.domainId = rfqDomainId;
        record.title = rfqDef.title;
        record.description = rfqDef.description;
        record.status = rfqDef.status;
        record.rfqType = 'design';
        record.totalVendorsInvited = rfqDef.totalVendorsInvited;
        record.totalQuotesReceived = rfqDef.totalQuotesReceived;
        record.createdById = designerId;
        if (rfqDef.status !== 'draft') {
          record.issueDate = daysFromNow(-30);
        }
        if (rfqDef.status === 'evaluated' || rfqDef.status === 'awarded') {
          record.evaluationDate = daysFromNow(-14);
          record.evaluatedById = designerId;
        }
        if (rfqDef.status === 'awarded') {
          record.awardDate = daysFromNow(-7);
          record.awardedValue = 1500000 + Math.floor(Math.random() * 500000);
        }
        if (rfqDef.status === 'cancelled') {
          record.description = `${rfqDef.description}\n\nCancellation Reason: Vendor requirements changed`;
        }
        record.appSyncStatus = 'pending';
        record.version = 1;
      });
      rfqCount++;
    }

    // 3. Create Design Document Categories
    for (const catDef of DESIGN_DOC_CATEGORIES) {
      const cat = await docCategoriesCollection.create((record: any) => {
        record.name = catDef.name;
        record.documentType = catDef.documentType;
        record.projectId = projectId;
        record.isDefault = false;
        record.sequenceOrder = catDef.sequenceOrder;
        record.createdBy = 'design_engineer';
        record.createdAt = Date.now();
        record.updatedAt = Date.now();
        record.appSyncStatus = 'pending';
        record.version = 1;
      });
      createdCategories.push(cat);
    }

    // 4. Look up existing Key Dates by code for linking design docs
    const keyDatesCollection = database.collections.get<KeyDateModel>('key_dates');
    const existingKDs = await keyDatesCollection
      .query(Q.where('project_id', projectId))
      .fetch();
    const kdByCode: Record<string, string> = {};
    for (const kd of existingKDs) {
      kdByCode[kd.code] = kd.id;
    }

    // 5. Create Design Documents
    for (const docDef of DESIGN_DOCUMENTS) {
      const category = createdCategories[docDef.categoryIndex];
      const siteId = siteIds[docDef.siteIndex] ?? null;
      await documentsCollection.create((record: any) => {
        record.documentNumber = docDef.documentNumber;
        record.title = docDef.title;
        record.description = docDef.description;
        record.documentType = docDef.documentType;
        record.categoryId = category.id;
        record.projectId = projectId;
        record.siteId = siteId;
        // Link to Key Date if specified
        if (docDef.linkToKD && kdByCode[docDef.linkToKD]) {
          record.keyDateId = kdByCode[docDef.linkToKD];
        }
        record.weightage = docDef.weightage || 0;
        record.revisionNumber = docDef.revisionNumber;
        record.status = docDef.status;
        if (docDef.status !== 'draft') {
          record.submittedDate = daysFromNow(-14);
        }
        if (docDef.status === 'approved' || docDef.status === 'approved_with_comment') {
          record.approvedDate = daysFromNow(-7);
        }
        if (docDef.status === 'approved_with_comment') {
          record.approvalComment = 'Approved with minor corrections to be incorporated in next revision.';
        }
        record.createdBy = designerId;
        record.createdAt = Date.now();
        record.updatedAt = Date.now();
        record.appSyncStatus = 'pending';
        record.version = 1;
      });
      docCount++;
    }
  });

  // Link WBS items (created by planner) to their design document deliverables (v50).
  // Mappings for the Simulation Studies site only.
  const simSiteId = projectSites[0]?.id;
  if (simSiteId) {
    const WBS_DOC_LINKS: Record<string, string> = {
      '1.1': 'DD-SIM-001', // Load Flow & Short Circuit Studies
      '1.2': 'DD-SIM-003', // OCS Engineering Analysis
      '2.1': 'DD-SIM-002', // Preliminary Design Submission
      '2.2': 'DD-SIM-004', // Detail Design Review & Approval
    };

    const simItems = await database.collections
      .get<ItemModel>('items')
      .query(Q.where('site_id', simSiteId))
      .fetch();

    const simDocs = await database.collections
      .get<DesignDocumentModel>('design_documents')
      .query(Q.where('site_id', simSiteId), Q.where('project_id', projectId))
      .fetch();

    const docByNumber: Record<string, string> = {};
    simDocs.forEach((doc: DesignDocumentModel) => { docByNumber[doc.documentNumber] = doc.id; });

    const itemsToUpdate = simItems.filter(
      (item: ItemModel) => WBS_DOC_LINKS[item.wbsCode] && !item.designDocumentId
    );

    if (itemsToUpdate.length > 0) {
      await database.write(async () => {
        for (const item of itemsToUpdate) {
          const docId = docByNumber[WBS_DOC_LINKS[item.wbsCode]];
          if (docId) {
            await item.update((i: any) => { i.designDocumentId = docId; });
          }
        }
      });
    }
  }

  return {
    domainsCreated: domainCount,
    doorsPackagesCreated: createdDoorsPackages.length,
    designRfqsCreated: rfqCount,
    designDocumentsCreated: docCount,
    designDocCategoriesCreated: createdCategories.length,
  };
}

// ─── Supervisor Demo Data Definitions ─────────────────────────────

interface SupervisorSiteDef {
  name: string;
  location: string;
}

const SUPERVISOR_SITES: SupervisorSiteDef[] = [
  // index 0: physical TSS site — matches Planner + Design Engineer site name
  { name: 'Traction Substation (TSS-01)', location: 'Zone 1 — North Block, Plot 14' },
  // index 1: physical OCS/OHE site — matches Planner + Design Engineer site name
  { name: 'OHE Zone 1 — North Corridor', location: 'Zone 2 — North Corridor, Ch. 0+000 to 15+500' },
];

interface SupervisorItemDef {
  name: string;
  phase: ProjectPhase;
  quantity: number;
  completedQuantity: number;
  unit: string;
  weightage: number;
  status: string;
  categoryIndex: number;
}

// Items per site (2 physical sites — no Simulation Studies for supervisor)
const SUPERVISOR_ITEMS: SupervisorItemDef[][] = [
  // TSS-01 items — civil foundation, equipment erection
  [
    { name: 'Earthwork & Foundation Excavation', phase: 'site_prep', quantity: 500, completedQuantity: 500, unit: 'cum', weightage: 10, status: 'completed', categoryIndex: 0 },
    { name: 'RCC Foundation', phase: 'construction', quantity: 300, completedQuantity: 150, unit: 'cum', weightage: 20, status: 'in_progress', categoryIndex: 0 },
    { name: 'Transformer & Switchgear Erection', phase: 'construction', quantity: 3, completedQuantity: 0, unit: 'nos', weightage: 25, status: 'not_started', categoryIndex: 2 },
    { name: 'Control Cable Laying', phase: 'construction', quantity: 2000, completedQuantity: 0, unit: 'm', weightage: 10, status: 'not_started', categoryIndex: 1 },
  ],
  // OHE Zone 1 items — mast foundation, erection, stringing
  [
    { name: 'Mast Foundation Excavation & Concreting', phase: 'construction', quantity: 120, completedQuantity: 80, unit: 'nos', weightage: 15, status: 'in_progress', categoryIndex: 0 },
    { name: 'Mast Erection', phase: 'construction', quantity: 120, completedQuantity: 20, unit: 'nos', weightage: 20, status: 'in_progress', categoryIndex: 2 },
    { name: 'Catenary & Contact Wire Stringing', phase: 'construction', quantity: 15.5, completedQuantity: 0, unit: 'km', weightage: 20, status: 'not_started', categoryIndex: 2 },
    { name: 'OCS Registration & Tensioning', phase: 'commissioning', quantity: 1, completedQuantity: 0, unit: 'lot', weightage: 10, status: 'not_started', categoryIndex: 2 },
  ],
];

interface HindranceDef {
  title: string;
  description: string;
  priority: string;
  status: string;
  siteIndex: number;
  itemIndex: number | null;
}

const HINDRANCES: HindranceDef[] = [
  // TSS-01 hindrances (siteIndex: 0)
  { title: 'Cement Supply Delay', description: 'Cement supply delayed by 5 days due to transportation issues, affecting RCC foundation progress', priority: 'high', status: 'open', siteIndex: 0, itemIndex: 1 },
  { title: 'Weather Disruption', description: 'Heavy rain causing waterlogging at foundation excavation area', priority: 'medium', status: 'in_progress', siteIndex: 0, itemIndex: 0 },
  { title: 'Switchgear Drawing Approval Pending', description: 'TSS switchgear foundation drawings awaiting client approval before erection can begin', priority: 'medium', status: 'resolved', siteIndex: 0, itemIndex: 2 },
  // OHE Zone 1 hindrances (siteIndex: 1)
  { title: 'Crane Breakdown', description: 'Crane maintenance required, affecting mast lifting and erection operations', priority: 'high', status: 'in_progress', siteIndex: 1, itemIndex: 1 },
  { title: 'Contact Wire Procurement Delay', description: 'Cu-Mg contact wire 107mm² delivery delayed by 2 weeks from supplier', priority: 'high', status: 'open', siteIndex: 1, itemIndex: 2 },
];

interface MaterialDef {
  name: string;
  quantityRequired: number;
  quantityAvailable: number;
  quantityUsed: number;
  unit: string;
  status: string;
  supplier: string;
  siteIndex: number;
  itemIndex: number;
}

const MATERIALS: MaterialDef[] = [
  // TSS-01 materials (siteIndex: 0)
  { name: 'OPC Cement 53 Grade', quantityRequired: 500, quantityAvailable: 300, quantityUsed: 150, unit: 'bags', status: 'in_use', supplier: 'UltraTech Cement', siteIndex: 0, itemIndex: 1 },
  { name: 'TMT Steel Bars 16mm', quantityRequired: 20, quantityAvailable: 20, quantityUsed: 8, unit: 'MT', status: 'delivered', supplier: 'SAIL', siteIndex: 0, itemIndex: 1 },
  { name: 'River Sand', quantityRequired: 100, quantityAvailable: 50, quantityUsed: 30, unit: 'cum', status: 'shortage', supplier: 'Local Supplier', siteIndex: 0, itemIndex: 0 },
  // OHE Zone 1 materials (siteIndex: 1)
  { name: 'Galvanized Steel Masts 9m', quantityRequired: 120, quantityAvailable: 40, quantityUsed: 20, unit: 'nos', status: 'in_use', supplier: 'SAIL Structures', siteIndex: 1, itemIndex: 1 },
  { name: 'Foundation Concrete M30', quantityRequired: 200, quantityAvailable: 120, quantityUsed: 80, unit: 'cum', status: 'in_use', supplier: 'RMC Plant', siteIndex: 1, itemIndex: 0 },
  { name: 'Cu-Mg Contact Wire 107mm²', quantityRequired: 16000, quantityAvailable: 0, quantityUsed: 0, unit: 'm', status: 'ordered', supplier: 'Elcowire Group', siteIndex: 1, itemIndex: 2 },
];

interface InspectionDef {
  inspectionType: string;
  overallRating: string;
  safetyFlagged: boolean;
  notes: string;
  siteIndex: number;
  daysAgo: number;
}

const INSPECTIONS: InspectionDef[] = [
  // TSS-01 inspections (siteIndex: 0)
  { inspectionType: 'daily', overallRating: 'good', safetyFlagged: false, notes: 'Foundation work progressing as per schedule. Concrete cube tests satisfactory. Housekeeping maintained.', siteIndex: 0, daysAgo: 1 },
  { inspectionType: 'safety', overallRating: 'fair', safetyFlagged: true, notes: 'PPE compliance needs improvement near excavation area. Some workers observed without helmets. Warning issued.', siteIndex: 0, daysAgo: 3 },
  // OHE Zone 1 inspections (siteIndex: 1)
  { inspectionType: 'weekly', overallRating: 'good', safetyFlagged: false, notes: 'Mast foundation quality verified. Plumb and alignment within tolerance. Cube test results satisfactory.', siteIndex: 1, daysAgo: 2 },
  { inspectionType: 'quality', overallRating: 'excellent', safetyFlagged: false, notes: 'Mast erection quality meets specifications. Bracket assembly and cantilever alignment verified. Good workmanship.', siteIndex: 1, daysAgo: 4 },
];

// Sample checklist data for inspections
const SAMPLE_CHECKLIST = JSON.stringify({
  'Safety': [
    { item: 'PPE Compliance', status: 'pass' },
    { item: 'Barricading', status: 'pass' },
    { item: 'First Aid Kit', status: 'pass' },
    { item: 'Fire Extinguisher', status: 'na' },
  ],
  'Quality': [
    { item: 'Material Storage', status: 'pass' },
    { item: 'Concrete Mixing', status: 'pass' },
    { item: 'Reinforcement Placement', status: 'fail' },
  ],
  'Housekeeping': [
    { item: 'Site Cleanliness', status: 'pass' },
    { item: 'Waste Disposal', status: 'pass' },
  ],
});

// ─── Supervisor Demo Data Generator ───────────────────────────────

/**
 * Generates realistic Supervisor demo data for a given project.
 *
 * Creates:
 * - 2 Sites — physical sites only (TSS-01, OHE Zone 1); no Simulation Studies
 * - 8 Items across sites (with progress)
 * - 6 Progress Logs
 * - 2 Daily Reports
 * - 5 Hindrances
 * - 6 Materials
 * - 4 Site Inspections
 *
 * All records are created in a single atomic database.write() transaction.
 *
 * @param projectId - The project to create demo data for
 * @param supervisorId - The supervisor user ID to assign sites to (required for sites to be visible)
 */
export async function generateSupervisorDemoData(projectId: string, supervisorId: string): Promise<SupervisorDemoDataResult> {
  const createdSites: SiteModel[] = [];
  const createdItems: ItemModel[][] = [[], []]; // Items per site (TSS-01, OHE Zone 1)
  const createdCategories: CategoryModel[] = [];
  let progressLogCount = 0;
  let dailyReportCount = 0;
  let hindranceCount = 0;
  let materialCount = 0;
  let inspectionCount = 0;

  await database.write(async () => {
    const sitesCollection = database.collections.get<SiteModel>('sites');
    const itemsCollection = database.collections.get<ItemModel>('items');
    const categoriesCollection = database.collections.get<CategoryModel>('categories');
    const progressLogsCollection = database.collections.get<ProgressLogModel>('progress_logs');
    const dailyReportsCollection = database.collections.get<DailyReportModel>('daily_reports');
    const hindrancesCollection = database.collections.get<HindranceModel>('hindrances');
    const materialsCollection = database.collections.get<MaterialModel>('materials');
    const inspectionsCollection = database.collections.get<SiteInspectionModel>('site_inspections');

    // 1. Create/Find Categories
    const existingCategories = await categoriesCollection.query().fetch();
    if (existingCategories.length >= 3) {
      createdCategories.push(...existingCategories.slice(0, 3) as CategoryModel[]);
    } else {
      // Create categories if they don't exist
      for (const catDef of CATEGORIES) {
        const cat = await categoriesCollection.create((record: any) => {
          record.name = catDef.name;
          record.description = catDef.description;
          record.appSyncStatus = 'pending';
          record.version = 1;
        });
        createdCategories.push(cat);
      }
    }

    // 2. Create Sites (assigned to the supervisor)
    for (const siteDef of SUPERVISOR_SITES) {
      const site = await sitesCollection.create((record: any) => {
        record.name = siteDef.name;
        record.location = siteDef.location;
        record.projectId = projectId;
        record.supervisorId = supervisorId; // Assign to the supervisor so they can see it
        record.plannedStartDate = daysFromNow(-30);
        record.plannedEndDate = daysFromNow(180);
        record.appSyncStatus = 'pending';
        record.version = 1;
      });
      createdSites.push(site);
    }

    // 3. Create Items per site
    for (let siteIdx = 0; siteIdx < createdSites.length; siteIdx++) {
      const site = createdSites[siteIdx];
      const itemDefs = SUPERVISOR_ITEMS[siteIdx];

      for (let itemIdx = 0; itemIdx < itemDefs.length; itemIdx++) {
        const itemDef = itemDefs[itemIdx];
        const item = await itemsCollection.create((record: any) => {
          record.name = itemDef.name;
          record.categoryId = createdCategories[itemDef.categoryIndex]?.id || '';
          record.siteId = site.id;
          record.projectPhase = itemDef.phase;
          record.plannedQuantity = itemDef.quantity;
          record.completedQuantity = itemDef.completedQuantity;
          record.unitOfMeasurement = itemDef.unit;
          record.weightage = itemDef.weightage;
          record.status = itemDef.status;
          record.plannedStartDate = daysFromNow(-15);
          record.plannedEndDate = daysFromNow(60);
          record.createdByRole = 'supervisor';
          // Required WBS fields
          record.wbsCode = `${siteIdx + 1}.${itemIdx + 1}`;
          record.wbsLevel = 2;
          record.isBaselineLocked = false;
          record.isMilestone = false;
          record.isCriticalPath = false;
          record.appSyncStatus = 'pending';
          record.version = 1;
        });
        createdItems[siteIdx].push(item);
      }
    }

    // 4. Create Progress Logs for items with progress
    for (let siteIdx = 0; siteIdx < createdSites.length; siteIdx++) {
      const items = createdItems[siteIdx];
      const itemDefs = SUPERVISOR_ITEMS[siteIdx];
      for (let itemIdx = 0; itemIdx < items.length; itemIdx++) {
        const item = items[itemIdx];
        const itemDef = itemDefs[itemIdx];
        if (itemDef.completedQuantity > 0) {
          // Create a progress log entry
          await progressLogsCollection.create((record: any) => {
            record.itemId = item.id;
            record.date = daysFromNow(-Math.floor(Math.random() * 7));
            record.completedQuantity = itemDef.completedQuantity;
            record.reportedBy = 'supervisor';
            record.photos = '[]';
            record.notes = `Progress update for ${itemDef.name}. Work proceeding as planned.`;
            record.appSyncStatus = 'pending';
            record.version = 1;
          });
          progressLogCount++;
        }
      }
    }

    // 5. Create Daily Reports
    for (let i = 0; i < 2; i++) {
      const siteIdx = i % createdSites.length;
      const site = createdSites[siteIdx];
      const itemsUpdated = SUPERVISOR_ITEMS[siteIdx].filter(itemDef => itemDef.completedQuantity > 0).length;

      await dailyReportsCollection.create((record: any) => {
        record.siteId = site.id;
        record.supervisorId = 'supervisor';
        record.reportDate = daysFromNow(-i - 1);
        record.submittedAt = daysFromNow(-i - 1);
        record.totalItems = itemsUpdated;
        record.totalProgress = Math.floor(Math.random() * 30) + 40;
        record.pdfPath = '';
        record.notes = `Daily progress report for ${site.name}. ${itemsUpdated} items updated.`;
        record.pdfGenerationStatus = 'pending';
        record.pdfGenerationAttempts = 0;
        record.appSyncStatus = 'pending';
        record.version = 1;
      });
      dailyReportCount++;
    }

    // 6. Create Hindrances
    for (const hindranceDef of HINDRANCES) {
      const site = createdSites[hindranceDef.siteIndex];
      const item = hindranceDef.itemIndex !== null ? createdItems[hindranceDef.siteIndex][hindranceDef.itemIndex] : null;

      await hindrancesCollection.create((record: any) => {
        record.title = hindranceDef.title;
        record.description = hindranceDef.description;
        record.siteId = site.id;
        record.itemId = item?.id || '';
        record.priority = hindranceDef.priority;
        record.status = hindranceDef.status;
        record.assignedTo = '';
        record.reportedBy = 'supervisor';
        record.reportedAt = daysFromNow(-Math.floor(Math.random() * 5));
        record.photos = '[]';
        record.appSyncStatus = 'pending';
        record.version = 1;
      });
      hindranceCount++;
    }

    // 7. Create Materials
    for (const materialDef of MATERIALS) {
      const item = createdItems[materialDef.siteIndex][materialDef.itemIndex];

      await materialsCollection.create((record: any) => {
        record.name = materialDef.name;
        record.itemId = item.id;
        record.quantityRequired = materialDef.quantityRequired;
        record.quantityAvailable = materialDef.quantityAvailable;
        record.quantityUsed = materialDef.quantityUsed;
        record.unit = materialDef.unit;
        record.status = materialDef.status;
        record.supplier = materialDef.supplier;
        record.procurementManagerId = '';
        record.appSyncStatus = 'pending';
        record.version = 1;
      });
      materialCount++;
    }

    // 8. Create Site Inspections
    for (const inspectionDef of INSPECTIONS) {
      const site = createdSites[inspectionDef.siteIndex];

      await inspectionsCollection.create((record: any) => {
        record.siteId = site.id;
        record.inspectorId = 'supervisor';
        record.inspectionDate = daysFromNow(-inspectionDef.daysAgo);
        record.inspectionType = inspectionDef.inspectionType;
        record.overallRating = inspectionDef.overallRating;
        record.checklistData = SAMPLE_CHECKLIST;
        record.photos = '[]';
        record.safetyFlagged = inspectionDef.safetyFlagged;
        record.followUpDate = inspectionDef.safetyFlagged ? daysFromNow(7) : 0;
        record.followUpNotes = inspectionDef.safetyFlagged ? 'Follow up required for safety compliance' : '';
        record.notes = inspectionDef.notes;
        record.appSyncStatus = 'pending';
        record.version = 1;
      });
      inspectionCount++;
    }
  });

  return {
    sitesCreated: createdSites.length,
    itemsCreated: createdItems.flat().length,
    progressLogsCreated: progressLogCount,
    dailyReportsCreated: dailyReportCount,
    hindrancesCreated: hindranceCount,
    materialsCreated: materialCount,
    inspectionsCreated: inspectionCount,
  };
}

// ─── Manager Demo Data Definitions ──────────────────────────────

interface VendorDef {
  vendorCode: string;
  vendorName: string;
  category: string;
  contactPerson: string;
  email: string;
  phone: string;
  isApproved: boolean;
  performanceScore: number;
  totalOrders: number;
}

const MANAGER_VENDORS: VendorDef[] = [
  {
    vendorCode: 'VND-PT-001',
    vendorName: 'PowerTech Industries',
    category: 'Electrical Equipment',
    contactPerson: 'Rajesh Kumar',
    email: 'rajesh@powertech.com',
    phone: '+91-9876543210',
    isApproved: true,
    performanceScore: 88,
    totalOrders: 12,
  },
  {
    vendorCode: 'VND-SG-002',
    vendorName: 'SwitchGear Solutions',
    category: 'Switchgear & Panels',
    contactPerson: 'Priya Sharma',
    email: 'priya@switchgear.com',
    phone: '+91-9876543211',
    isApproved: true,
    performanceScore: 92,
    totalOrders: 8,
  },
  {
    vendorCode: 'VND-CC-003',
    vendorName: 'CableCo International',
    category: 'Cables & Wiring',
    contactPerson: 'Amit Patel',
    email: 'amit@cableco.com',
    phone: '+91-9876543212',
    isApproved: true,
    performanceScore: 75,
    totalOrders: 15,
  },
  {
    vendorCode: 'VND-SS-004',
    vendorName: 'Structural Systems India',
    category: 'OHE Structural Components',
    contactPerson: 'Suresh Nair',
    email: 'suresh@structuralsystems.in',
    phone: '+91-9876543213',
    isApproved: true,
    performanceScore: 83,
    totalOrders: 9,
  },
];

interface PurchaseOrderDef {
  poNumber: string;
  vendorIndex: number;
  poValue: number;
  currency: string;
  status: string;
  expectedDeliveryDayOffset: number;
  actualDeliveryDayOffset: number | null;
  itemsDetails: string;
  notes: string;
}

const MANAGER_POS: PurchaseOrderDef[] = [
  {
    poNumber: 'PO-MGR-2026-001',
    vendorIndex: 0,
    poValue: 2500000,
    currency: 'INR',
    status: 'delivered',
    expectedDeliveryDayOffset: -10,
    actualDeliveryDayOffset: -8,
    itemsDetails: JSON.stringify([
      { description: 'Auxiliary Transformer 1000kVA', quantity: 2, unitPrice: 1250000 },
    ]),
    notes: 'Delivered on schedule. Quality inspection passed.',
  },
  {
    poNumber: 'PO-MGR-2026-002',
    vendorIndex: 1,
    poValue: 1800000,
    currency: 'INR',
    status: 'in_progress',
    expectedDeliveryDayOffset: 30,
    actualDeliveryDayOffset: null,
    itemsDetails: JSON.stringify([
      { description: '33kV GIS Switchgear Panel', quantity: 3, unitPrice: 600000 },
    ]),
    notes: 'Manufacturing in progress. FAT scheduled.',
  },
  {
    poNumber: 'PO-MGR-2026-003',
    vendorIndex: 2,
    poValue: 950000,
    currency: 'INR',
    status: 'issued',
    expectedDeliveryDayOffset: 60,
    actualDeliveryDayOffset: null,
    itemsDetails: JSON.stringify([
      { description: 'Cu-Mg Contact Wire 107mm²', quantity: 5000, unitPrice: 190 },
    ]),
    notes: 'PO issued. Vendor confirmed receipt.',
  },
  {
    poNumber: 'PO-MGR-2026-004',
    vendorIndex: 3,  // Structural Systems India
    poValue: 2400000,
    currency: 'INR',
    status: 'issued',
    expectedDeliveryDayOffset: 45,
    actualDeliveryDayOffset: null,
    itemsDetails: JSON.stringify([
      { description: 'OHE Mast 9m Galvanized Steel', quantity: 120, unitPrice: 18000 },
      { description: 'Foundation Bolt Sets', quantity: 120, unitPrice: 2000 },
    ]),
    notes: 'PO issued for OHE Zone 1 mast supply. Staggered delivery in 3 lots.',
  },
  {
    poNumber: 'PO-MGR-2026-005',
    vendorIndex: 1,  // SwitchGear Solutions
    poValue: 1350000,
    currency: 'INR',
    status: 'in_progress',
    expectedDeliveryDayOffset: -5,
    actualDeliveryDayOffset: null,
    itemsDetails: JSON.stringify([
      { description: 'SCADA RTU Panel', quantity: 8, unitPrice: 150000 },
      { description: 'Communication Gateway Unit', quantity: 3, unitPrice: 50000 },
    ]),
    notes: 'OVERDUE — Vendor notified. FAT completion pending. Expediting delivery.',
  },
];

interface BomDef {
  name: string;
  type: string;
  status: string;
  version: string;
  siteCategory: string;
  totalEstimatedCost: number;
  totalActualCost: number;
  quantity: number;
  unit: string;
  contingency: number;
  profitMargin: number;
}

const MANAGER_BOMS: BomDef[] = [
  {
    name: 'TSS Main Equipment BOM v2.0',
    type: 'execution',
    status: 'active',
    version: 'v2.0',
    siteCategory: 'TSS',
    totalEstimatedCost: 4500000,
    totalActualCost: 2800000,
    quantity: 1,
    unit: 'lot',
    contingency: 5,
    profitMargin: 12,
  },
  {
    name: 'OHE Cable & Mast BOM v1.0',
    type: 'execution',
    status: 'active',
    version: 'v1.0',
    siteCategory: 'OHE',
    totalEstimatedCost: 3200000,
    totalActualCost: 1500000,
    quantity: 1,
    unit: 'lot',
    contingency: 8,
    profitMargin: 10,
  },
  {
    name: 'SCADA System Estimate v1.0',
    type: 'estimating',
    status: 'draft',
    version: 'v1.0',
    siteCategory: 'SCADA',
    totalEstimatedCost: 2000000,
    totalActualCost: 0,
    quantity: 1,
    unit: 'lot',
    contingency: 10,
    profitMargin: 15,
  },
];

interface BomItemDef {
  bomIndex: number;
  itemCode: string;
  description: string;
  category: string;
  subCategory: string;
  quantity: number;
  unit: string;
  unitCost: number;
  actualQuantity: number;
  actualCost: number;
}

const MANAGER_BOM_ITEMS: BomItemDef[] = [
  // TSS BOM items
  { bomIndex: 0, itemCode: 'MAT-TSS-001', description: 'Auxiliary Transformer 1000kVA', category: 'material', subCategory: 'electrical', quantity: 4, unit: 'nos', unitCost: 1250000, actualQuantity: 2, actualCost: 2500000 },
  { bomIndex: 0, itemCode: 'LAB-TSS-001', description: 'Transformer Installation Labour', category: 'labor', subCategory: 'electrical', quantity: 200, unit: 'hrs', unitCost: 850, actualQuantity: 100, actualCost: 85000 },
  { bomIndex: 0, itemCode: 'EQP-TSS-001', description: 'Crane Hire for Erection', category: 'equipment', subCategory: 'heavy', quantity: 10, unit: 'days', unitCost: 25000, actualQuantity: 5, actualCost: 125000 },
  { bomIndex: 0, itemCode: 'SUB-TSS-001', description: 'Civil Foundation Subcontract', category: 'subcontractor', subCategory: 'civil', quantity: 1, unit: 'lot', unitCost: 450000, actualQuantity: 1, actualCost: 450000 },
  // OHE BOM items
  { bomIndex: 1, itemCode: 'MAT-OHE-001', description: 'Contact Wire Cu-Mg 107mm²', category: 'material', subCategory: 'cables', quantity: 25000, unit: 'meters', unitCost: 190, actualQuantity: 12000, actualCost: 2280000 },
  { bomIndex: 1, itemCode: 'MAT-OHE-002', description: 'OHE Mast 9m Galvanized Steel', category: 'material', subCategory: 'structural', quantity: 120, unit: 'nos', unitCost: 18000, actualQuantity: 50, actualCost: 900000 },
  { bomIndex: 1, itemCode: 'MAT-OHE-003', description: 'Cantilever Assembly (Bracket + Arm)', category: 'material', subCategory: 'structural', quantity: 240, unit: 'nos', unitCost: 12500, actualQuantity: 0, actualCost: 0 },
  { bomIndex: 1, itemCode: 'MAT-OHE-004', description: 'Portal Boom Fabricated Steel', category: 'material', subCategory: 'structural', quantity: 18, unit: 'nos', unitCost: 85000, actualQuantity: 0, actualCost: 0 },
  { bomIndex: 1, itemCode: 'LAB-OHE-001', description: 'Mast Erection & OHE Stringing Labour', category: 'labor', subCategory: 'structural', quantity: 600, unit: 'hrs', unitCost: 750, actualQuantity: 250, actualCost: 187500 },
  // SCADA BOM items
  { bomIndex: 2, itemCode: 'MAT-SCADA-001', description: 'Remote Terminal Unit', category: 'material', subCategory: 'electronics', quantity: 8, unit: 'nos', unitCost: 150000, actualQuantity: 0, actualCost: 0 },
  { bomIndex: 2, itemCode: 'MAT-SCADA-002', description: 'SCADA Server & Software', category: 'material', subCategory: 'IT', quantity: 2, unit: 'nos', unitCost: 350000, actualQuantity: 0, actualCost: 0 },
  { bomIndex: 2, itemCode: 'SUB-SCADA-001', description: 'SCADA Integration & Commissioning', category: 'subcontractor', subCategory: 'IT', quantity: 1, unit: 'lot', unitCost: 500000, actualQuantity: 0, actualCost: 0 },
];

// ─── Manager Demo Data Generator ──────────────────────────────

/**
 * Generates realistic Manager demo data for a given project.
 *
 * Creates:
 * - 4 Vendors (PowerTech Industries, SwitchGear Solutions, CableCo International, Structural Systems India)
 * - 5 Purchase Orders covering TSS, OHE, and SCADA disciplines (draft, issued, in_progress, delivered) + 1 overdue
 * - 3 BOMs (2 execution/active, 1 estimating/draft) aligned to TSS / OHE / SCADA disciplines
 * - 12 BOM Items across the 3 BOMs (materials, labor, equipment, subcontractor categories)
 *
 * Links POs to existing RFQs if Designer demo data was run first (graceful fallback).
 *
 * All records are created in a single atomic database.write() transaction.
 */
export async function generateManagerDemoData(projectId: string): Promise<ManagerDemoDataResult> {
  const createdVendors: VendorModel[] = [];
  const createdBoms: BomModel[] = [];
  let poCount = 0;
  let bomItemCount = 0;

  await database.write(async () => {
    const vendorsCollection = database.collections.get<VendorModel>('vendors');
    const posCollection = database.collections.get<PurchaseOrderModel>('purchase_orders');
    const bomsCollection = database.collections.get<BomModel>('boms');
    const bomItemsCollection = database.collections.get<BomItemModel>('bom_items');

    // 1. Create Vendors
    for (const vendorDef of MANAGER_VENDORS) {
      const vendor = await vendorsCollection.create((record: any) => {
        record.vendorCode = vendorDef.vendorCode;
        record.vendorName = vendorDef.vendorName;
        record.category = vendorDef.category;
        record.contactPerson = vendorDef.contactPerson;
        record.email = vendorDef.email;
        record.phone = vendorDef.phone;
        record.isApproved = vendorDef.isApproved;
        record.performanceScore = vendorDef.performanceScore;
        record.totalOrders = vendorDef.totalOrders;
        record.appSyncStatus = 'pending';
        record.version = 1;
      });
      createdVendors.push(vendor);
    }

    // 2. Try to find existing RFQs from Designer demo data (graceful fallback)
    let existingRfqIds: string[] = [];
    try {
      const rfqs = await database.collections.get('rfqs').query().fetch();
      existingRfqIds = rfqs.map(r => r.id);
    } catch {
      // No RFQs available - that's fine
    }

    // 3. Create Purchase Orders
    for (let i = 0; i < MANAGER_POS.length; i++) {
      const poDef = MANAGER_POS[i];
      const vendor = createdVendors[poDef.vendorIndex];

      await posCollection.create((record: any) => {
        record.poNumber = poDef.poNumber;
        record.rfqId = existingRfqIds.length > i ? existingRfqIds[i] : '';
        record.vendorId = vendor.id;
        record.projectId = projectId;
        record.poDate = daysFromNow(-30);
        record.poValue = poDef.poValue;
        record.currency = poDef.currency;
        record.paymentTerms = '30 days net';
        record.deliveryTerms = 'Ex-works';
        record.expectedDeliveryDate = daysFromNow(poDef.expectedDeliveryDayOffset);
        if (poDef.actualDeliveryDayOffset !== null) {
          record.actualDeliveryDate = daysFromNow(poDef.actualDeliveryDayOffset);
        }
        record.status = poDef.status;
        record.itemsDetails = poDef.itemsDetails;
        record.notes = poDef.notes;
        record.createdById = 'manager';
        record.updatedAt = Date.now();
        record.appSyncStatus = 'pending';
        record.version = 1;
      });
      poCount++;
    }

    // 4. Create BOMs
    for (const bomDef of MANAGER_BOMS) {
      const bom = await bomsCollection.create((record: any) => {
        record.projectId = projectId;
        record.name = bomDef.name;
        record.type = bomDef.type;
        record.status = bomDef.status;
        record.version = bomDef.version;
        record.siteCategory = bomDef.siteCategory;
        record.quantity = bomDef.quantity;
        record.unit = bomDef.unit;
        record.contingency = bomDef.contingency;
        record.profitMargin = bomDef.profitMargin;
        record.totalEstimatedCost = bomDef.totalEstimatedCost;
        record.totalActualCost = bomDef.totalActualCost;
        record.createdBy = 'manager';
        record.createdDate = Date.now();
        record.updatedDate = Date.now();
        record.appSyncStatus = 'pending';
        record._version = 1;
      });
      createdBoms.push(bom);
    }

    // 5. Create BOM Items
    for (const itemDef of MANAGER_BOM_ITEMS) {
      const bom = createdBoms[itemDef.bomIndex];
      const totalCost = itemDef.quantity * itemDef.unitCost;

      await bomItemsCollection.create((record: any) => {
        record.bomId = bom.id;
        record.itemCode = itemDef.itemCode;
        record.description = itemDef.description;
        record.category = itemDef.category;
        record.subCategory = itemDef.subCategory;
        record.quantity = itemDef.quantity;
        record.unit = itemDef.unit;
        record.unitCost = itemDef.unitCost;
        record.totalCost = totalCost;
        record.actualQuantity = itemDef.actualQuantity;
        record.actualCost = itemDef.actualCost;
        record.createdDate = Date.now();
        record.updatedDate = Date.now();
        record.appSyncStatus = 'pending';
        record._version = 1;
      });
      bomItemCount++;
    }
  });

  return {
    purchaseOrdersCreated: poCount,
    vendorsCreated: createdVendors.length,
    bomsCreated: createdBoms.length,
    bomItemsCreated: bomItemCount,
  };
}

// ─── Logistics Demo Data Definitions ────────────────────────────────

interface LogisticsMaterialDef {
  name: string;
  supplier: string;
  unit: string;
  quantityRequired: number;
  quantityAvailable: number;
  quantityUsed: number;
  status: string;
  discipline: 'tss' | 'ohe' | 'general';
}

// 20 discipline-specific materials — suppliers aligned to Manager vendor list
const LOGISTICS_MATERIALS: LogisticsMaterialDef[] = [
  // ── TSS materials (8) — linked to Traction Substation (TSS-01) items ──
  { name: 'Transformer Oil (Conservator)', supplier: 'PowerTech Industries', unit: 'litres', quantityRequired: 1200, quantityAvailable: 800, quantityUsed: 500, status: 'in_use', discipline: 'tss' },
  { name: 'Silica Gel Breather Unit', supplier: 'PowerTech Industries', unit: 'nos', quantityRequired: 8, quantityAvailable: 8, quantityUsed: 0, status: 'delivered', discipline: 'tss' },
  { name: 'HV Bushing Assembly 33kV', supplier: 'PowerTech Industries', unit: 'nos', quantityRequired: 12, quantityAvailable: 0, quantityUsed: 0, status: 'ordered', discipline: 'tss' },
  { name: 'SF6 Gas Cylinder (50L)', supplier: 'SwitchGear Solutions', unit: 'nos', quantityRequired: 6, quantityAvailable: 4, quantityUsed: 4, status: 'in_use', discipline: 'tss' },
  { name: 'Control Cable 4-core 2.5mm²', supplier: 'CableCo International', unit: 'm', quantityRequired: 5000, quantityAvailable: 3000, quantityUsed: 1200, status: 'in_use', discipline: 'tss' },
  { name: 'Earthing Copper Strip 50×6mm', supplier: 'PowerTech Industries', unit: 'm', quantityRequired: 800, quantityAvailable: 800, quantityUsed: 0, status: 'delivered', discipline: 'tss' },
  { name: 'Cable Lug Copper 240mm²', supplier: 'CableCo International', unit: 'nos', quantityRequired: 200, quantityAvailable: 200, quantityUsed: 80, status: 'delivered', discipline: 'tss' },
  { name: 'RCC Ready Mix M30', supplier: 'Local Aggregate Supplier', unit: 'cum', quantityRequired: 400, quantityAvailable: 200, quantityUsed: 180, status: 'in_use', discipline: 'tss' },

  // ── OHE materials (8) — linked to OHE Zone 1 items ──
  { name: 'Cu-Mg Contact Wire 107mm²', supplier: 'CableCo International', unit: 'm', quantityRequired: 16000, quantityAvailable: 5000, quantityUsed: 0, status: 'in_use', discipline: 'ohe' },
  { name: 'Catenary Wire Cu 70mm²', supplier: 'CableCo International', unit: 'm', quantityRequired: 16000, quantityAvailable: 0, quantityUsed: 0, status: 'ordered', discipline: 'ohe' },
  { name: 'OHE Mast 9m Galvanized Steel', supplier: 'Structural Systems India', unit: 'nos', quantityRequired: 120, quantityAvailable: 40, quantityUsed: 20, status: 'in_use', discipline: 'ohe' },
  { name: 'Cantilever Assembly (Bracket + Arm)', supplier: 'Structural Systems India', unit: 'nos', quantityRequired: 240, quantityAvailable: 0, quantityUsed: 0, status: 'ordered', discipline: 'ohe' },
  { name: 'Section Insulator OHE', supplier: 'Structural Systems India', unit: 'nos', quantityRequired: 30, quantityAvailable: 8, quantityUsed: 0, status: 'shortage', discipline: 'ohe' },
  { name: 'Dropper Wire Copper 10mm²', supplier: 'CableCo International', unit: 'm', quantityRequired: 3000, quantityAvailable: 3000, quantityUsed: 0, status: 'delivered', discipline: 'ohe' },
  { name: 'Foundation Concrete M30', supplier: 'Local Aggregate Supplier', unit: 'cum', quantityRequired: 200, quantityAvailable: 120, quantityUsed: 80, status: 'in_use', discipline: 'ohe' },
  { name: 'Anchor Bolt Set M24 (4-bolt set)', supplier: 'Structural Systems India', unit: 'sets', quantityRequired: 120, quantityAvailable: 40, quantityUsed: 20, status: 'shortage', discipline: 'ohe' },

  // ── General / SCADA / project-level materials (4) — linked to remaining items ──
  { name: 'RTU Communication Module', supplier: 'SwitchGear Solutions', unit: 'nos', quantityRequired: 8, quantityAvailable: 0, quantityUsed: 0, status: 'ordered', discipline: 'general' },
  { name: 'Fibre Optic Cable 12-core', supplier: 'CableCo International', unit: 'm', quantityRequired: 5000, quantityAvailable: 5000, quantityUsed: 0, status: 'delivered', discipline: 'general' },
  { name: 'SCADA HMI Workstation', supplier: 'SwitchGear Solutions', unit: 'nos', quantityRequired: 3, quantityAvailable: 0, quantityUsed: 0, status: 'ordered', discipline: 'general' },
  { name: 'Instrumentation Cable 2×1.5mm²', supplier: 'CableCo International', unit: 'm', quantityRequired: 2000, quantityAvailable: 2000, quantityUsed: 500, status: 'in_use', discipline: 'general' },
];

// ─── Logistics Demo Data Function ───────────────────────────────────

export async function generateLogisticsDemoData(projectId: string): Promise<LogisticsDemoDataResult> {
  let materialsCount = 0;

  await database.write(async () => {
    const materialsCollection = database.collections.get<MaterialModel>('materials');

    // Get existing items for this project (via sites)
    const sites = await database.collections
      .get('sites')
      .query()
      .fetch();

    if (sites.length === 0) {
      throw new Error('Please generate Planner or Supervisor demo data first to create sites and items.');
    }

    // Get items for these sites
    const items = await database.collections
      .get('items')
      .query()
      .fetch();

    if (items.length === 0) {
      throw new Error('Please generate Planner or Supervisor demo data first to create items.');
    }

    // Identify sites by discipline from site name (matches aligned site taxonomy)
    const tssSiteIds = new Set(
      sites.filter((s: any) => s.name.includes('TSS')).map((s: any) => s.id)
    );
    const oheSiteIds = new Set(
      sites.filter((s: any) => s.name.includes('OHE')).map((s: any) => s.id)
    );

    // Group items by discipline for targeted material assignment
    const tssItems = items.filter((item: any) => tssSiteIds.has(item.siteId));
    const oheItems = items.filter((item: any) => oheSiteIds.has(item.siteId));
    const otherItems = items.filter(
      (item: any) => !tssSiteIds.has(item.siteId) && !oheSiteIds.has(item.siteId)
    );

    // Create 20 discipline-specific materials linked to matching site items
    for (const matDef of LOGISTICS_MATERIALS) {
      // Route material to an item of the same discipline; fall back to any item
      let pool: any[];
      if (matDef.discipline === 'tss') {
        pool = tssItems.length > 0 ? tssItems : items;
      } else if (matDef.discipline === 'ohe') {
        pool = oheItems.length > 0 ? oheItems : items;
      } else {
        pool = otherItems.length > 0 ? otherItems : items;
      }

      const item = pool[materialsCount % pool.length];

      await materialsCollection.create((record: any) => {
        record.name = matDef.name;
        record.itemId = item.id;
        record.quantityRequired = matDef.quantityRequired;
        record.quantityAvailable = matDef.quantityAvailable;
        record.quantityUsed = matDef.quantityUsed;
        record.unit = matDef.unit;
        record.status = matDef.status;
        record.supplier = matDef.supplier;
        record.procurementManagerId = '';
        record.appSyncStatus = 'pending';
        record._version = 1;
      });
      materialsCount++;
    }
  });

  return {
    materialsCreated: materialsCount,
    inventoryItemsCreated: 0, // Not supported yet - no inventory_items table
    deliveriesCreated: 0, // Not supported yet - no deliveries table
    equipmentCreated: 0, // Not supported yet - no equipment table
  };
}

// ─── Commercial Manager Demo Data Function ─────────────────────────

const COMMERCIAL_BUDGET_CATEGORIES = [
  { category: 'material', allocatedAmount: 12000000, description: 'Traction & OHE equipment — transformers, switchgear, contact wire, masts, cantilever assemblies, SCADA panels' },
  { category: 'labor', allocatedAmount: 8000000, description: 'Site erection & installation labour — TSS equipment erection, OHE mast erection, stringing & tensioning' },
  { category: 'equipment', allocatedAmount: 5000000, description: 'Construction plant & equipment — cranes, hydraulic platforms, drilling rigs, test equipment' },
  { category: 'subcontractor', allocatedAmount: 10000000, description: 'Specialist subcontracts — TSS civil foundation, SCADA integration & commissioning, third-party testing' },
  { category: 'other', allocatedAmount: 3000000, description: 'Miscellaneous — safety equipment, PPE, site establishment, insurance, testing & commissioning consumables' },
];

interface CommercialCostDef {
  category: string;
  amount: number;
  description: string;
  daysAgo: number;
}

const COMMERCIAL_COSTS: CommercialCostDef[] = [
  // TSS equipment & civil (maps to PO-001: Transformer, PO-002: Switchgear)
  { category: 'material', amount: 1250000, description: 'Auxiliary Transformer 1000kVA — supply payment Part 1 (TSS-01)', daysAgo: 30 },
  { category: 'material', amount: 540000, description: '33kV GIS Switchgear — advance payment against PO (TSS-01)', daysAgo: 25 },
  // OHE supply (maps to PO-003: Contact Wire, PO-004: Mast)
  { category: 'material', amount: 950000, description: 'Cu-Mg Contact Wire 107mm² — Lot 1, 5000m (OHE Zone 1)', daysAgo: 20 },
  { category: 'material', amount: 720000, description: 'OHE Mast 9m Galvanized Steel — Batch 1, 40 nos (OHE Zone 1)', daysAgo: 15 },
  // SCADA (maps to PO-005: SCADA RTU)
  { category: 'material', amount: 405000, description: 'SCADA RTU Panel — advance 30% against PO (project-level)', daysAgo: 14 },
  // Labour costs (maps back to PO-001, PO-002)
  { category: 'labor', amount: 220000, description: 'TSS Equipment Erection Labour — Month 1 (TSS-01)', daysAgo: 10 },
  { category: 'labor', amount: 180000, description: 'OHE Mast Erection Labour — Week 1–2 (OHE Zone 1)', daysAgo: 7 },
  // OHE stringing & contact wire (maps to PO-003)
  { category: 'labor', amount: 150000, description: 'OHE Stringing & Registration Labour — Ch.0+000 to 5+500', daysAgo: 5 },
  // Equipment hire (maps to PO-004, PO-005)
  { category: 'equipment', amount: 125000, description: 'Crane Hire for Transformer & Mast Erection — 10 days (TSS-01)', daysAgo: 8 },
  { category: 'equipment', amount: 80000, description: 'Hydraulic Platform for OHE Stringing Works — 2 weeks', daysAgo: 6 },
  // Subcontractor (maps to PO-001)
  { category: 'subcontractor', amount: 450000, description: 'TSS Civil Foundation Subcontract — Phase 1 completion (TSS-01)', daysAgo: 12 },
  // Other (maps to PO-002)
  { category: 'other', amount: 85000, description: 'Safety Equipment & PPE — TSS-01 and OHE Zone 1 sites', daysAgo: 9 },
];

interface CommercialInvoiceDef {
  invoiceNumber: string;
  amount: number;
  paymentStatus: string;
  daysAgo: number;
  vendorName: string;
  paymentDaysAfter?: number;
}

// Vendor order matches Manager demo cycling (4 vendors × 2 invoices each):
// i=0 → PowerTech, i=1 → SwitchGear Solutions, i=2 → CableCo, i=3 → Structural Systems India
const COMMERCIAL_INVOICES: CommercialInvoiceDef[] = [
  { invoiceNumber: 'INV-2026-001', amount: 1250000, paymentStatus: 'paid', daysAgo: 25, vendorName: 'PowerTech Industries', paymentDaysAfter: 15 },
  { invoiceNumber: 'INV-2026-002', amount: 540000, paymentStatus: 'paid', daysAgo: 20, vendorName: 'SwitchGear Solutions', paymentDaysAfter: 10 },
  { invoiceNumber: 'INV-2026-003', amount: 950000, paymentStatus: 'pending', daysAgo: 12, vendorName: 'CableCo International' },
  { invoiceNumber: 'INV-2026-004', amount: 720000, paymentStatus: 'pending', daysAgo: 10, vendorName: 'Structural Systems India' },
  { invoiceNumber: 'INV-2026-005', amount: 320000, paymentStatus: 'paid', daysAgo: 8, vendorName: 'PowerTech Industries', paymentDaysAfter: 7 },
  { invoiceNumber: 'INV-2026-006', amount: 850000, paymentStatus: 'overdue', daysAgo: 45, vendorName: 'SwitchGear Solutions' },
  { invoiceNumber: 'INV-2026-007', amount: 360000, paymentStatus: 'pending', daysAgo: 5, vendorName: 'CableCo International' },
  { invoiceNumber: 'INV-2026-008', amount: 480000, paymentStatus: 'overdue', daysAgo: 35, vendorName: 'Structural Systems India' },
];

export async function generateCommercialManagerDemoData(projectId: string): Promise<CommercialManagerDemoDataResult> {
  let budgetsCount = 0;
  let costsCount = 0;
  let invoicesCount = 0;

  await database.write(async () => {
    // 0. Set commercial contract config on the project (v52 fields)
    const projectsCollection = database.collections.get('projects');
    const projectArr = await projectsCollection.query().fetch();
    const project = (projectArr as any[]).find((p: any) => p.id === projectId);
    if (project) {
      await project.update((p: any) => {
        p.contractValue = 150_00_00_000;     // ₹150 Crore
        p.commencementDate = new Date('2024-04-01').getTime();
        p.advanceMobilization = 15_00_00_000; // ₹15 Crore (10%)
        p.advanceRecoveryPct = 10;            // 10% recovery per IPC
        p.retentionPct = 5;                   // 5% retention
        p.dlpMonths = 24;                     // 2-year DLP
      });
    }

    const budgetsCollection = database.collections.get<BudgetModel>('budgets');
    const costsCollection = database.collections.get<CostModel>('costs');
    const invoicesCollection = database.collections.get<InvoiceModel>('invoices');

    // Get existing vendors (from Manager demo data if available)
    const vendors = await database.collections.get('vendors').query().fetch();

    // Get existing POs (for linking invoices)
    const pos = await database.collections
      .get('purchase_orders')
      .query()
      .fetch();

    // 1. Create Budgets
    for (const budgetDef of COMMERCIAL_BUDGET_CATEGORIES) {
      await budgetsCollection.create((record: any) => {
        record.projectId = projectId;
        record.category = budgetDef.category;
        record.allocatedAmount = budgetDef.allocatedAmount;
        record.description = budgetDef.description;
        record.createdBy = 'commercial_manager';
        record.updatedAt = Date.now();
        record.appSyncStatus = 'pending';
        record._version = 1;
      });
      budgetsCount++;
    }

    // 2. Create Costs
    for (const costDef of COMMERCIAL_COSTS) {
      const costDate = Date.now() - (costDef.daysAgo * 24 * 60 * 60 * 1000);

      await costsCollection.create((record: any) => {
        record.projectId = projectId;
        record.poId = pos.length > 0 ? pos[costsCount % pos.length].id : '';
        record.category = costDef.category;
        record.amount = costDef.amount;
        record.description = costDef.description;
        record.costDate = costDate;
        record.createdBy = 'commercial_manager';
        record.updatedAt = Date.now();
        record.appSyncStatus = 'pending';
        record._version = 1;
      });
      costsCount++;
    }

    // 3. Create Invoices
    for (let i = 0; i < COMMERCIAL_INVOICES.length; i++) {
      const invDef = COMMERCIAL_INVOICES[i];
      const invoiceDate = Date.now() - (invDef.daysAgo * 24 * 60 * 60 * 1000);

      let paymentDate: number | undefined;
      if (invDef.paymentStatus === 'paid' && invDef.paymentDaysAfter !== undefined) {
        paymentDate = invoiceDate + (invDef.paymentDaysAfter * 24 * 60 * 60 * 1000);
      }

      await invoicesCollection.create((record: any) => {
        record.projectId = projectId;
        record.poId = pos.length > 0 ? pos[i % pos.length].id : 'manual';
        record.invoiceNumber = invDef.invoiceNumber;
        record.invoiceDate = invoiceDate;
        record.amount = invDef.amount;
        record.paymentStatus = invDef.paymentStatus;
        record.paymentDate = paymentDate || null;
        record.vendorId = vendors.length > 0 ? vendors[i % vendors.length].id : '';
        record.vendorName = invDef.vendorName;
        record.createdBy = 'commercial_manager';
        record.updatedAt = Date.now();
        record.appSyncStatus = 'pending';
        record._version = 1;
      });
      invoicesCount++;
    }

    // 4. Create demo Advances (mobilization + performance)
    const advancesCollection = database.collections.get('advances');
    const demoAdvances = [
      {
        advanceType: 'mobilization',
        advanceAmount: 15_00_00_000, // ₹15 Crore
        recoveryPct: 10,
        totalRecovered: 3_00_00_000, // ₹3 Crore recovered so far
        issuedDate: new Date('2025-01-15').getTime(),
        notes: 'Mobilization advance on contract signing',
      },
      {
        advanceType: 'performance',
        advanceAmount: 5_00_00_000,  // ₹5 Crore
        recoveryPct: 5,
        totalRecovered: 0,
        issuedDate: new Date('2025-03-01').getTime(),
        notes: 'Performance advance for OHE Zone works',
      },
    ];
    for (const adv of demoAdvances) {
      await advancesCollection.create((record: any) => {
        record.projectId = projectId;
        record.advanceType = adv.advanceType;
        record.advanceAmount = adv.advanceAmount;
        record.recoveryPct = adv.recoveryPct;
        record.totalRecovered = adv.totalRecovered;
        record.issuedDate = adv.issuedDate;
        record.notes = adv.notes;
        record.createdBy = 'commercial_manager';
        record.updatedAt = Date.now();
        record.appSyncStatus = 'pending';
        record._version = 1;
      });
    }

    // 5. Create demo Variation Orders (3 VOs: approved, pending, under_review)
    const vosCollection = database.collections.get('variation_orders');
    const demoVOs = [
      {
        voNumber: 'VO-001',
        description: 'Additional OHE mast foundations — rocky terrain discovered during earthwork at Ch 5+200',
        value: 2_50_00_000, // ₹2.5 Cr
        approvalStatus: 'approved',
        executionPct: 75,
        marginImpact: 20_00_000, // ₹20 L
        notes: 'Approved by client vide letter CM/VO/001 dt 2025-06-10',
        raisedDate: new Date('2025-05-20').getTime(),
        approvedDate: new Date('2025-06-10').getTime(),
      },
      {
        voNumber: 'VO-002',
        description: 'SCADA integration scope enhancement — additional I/O points at TSS-01 control room',
        value: 1_75_00_000, // ₹1.75 Cr
        approvalStatus: 'under_review',
        executionPct: 0,
        marginImpact: -10_00_000,
        notes: 'Submitted to client; awaiting technical evaluation',
        raisedDate: new Date('2025-09-01').getTime(),
        approvedDate: undefined,
      },
      {
        voNumber: 'VO-003',
        description: 'Supply of additional surge arresters for OHE protection — spec upgrade per revised client standard',
        value: 80_00_000, // ₹80 L
        approvalStatus: 'pending',
        executionPct: 0,
        marginImpact: 5_00_000,
        notes: 'DRB meeting scheduled for Q4 2025',
        raisedDate: new Date('2025-11-15').getTime(),
        approvedDate: undefined,
      },
    ];
    for (const vo of demoVOs) {
      const billable = (vo.value * vo.executionPct) / 100;
      const atRisk = vo.approvalStatus !== 'approved' ? vo.value : 0;
      await vosCollection.create((record: any) => {
        record.projectId = projectId;
        record.voNumber = vo.voNumber;
        record.description = vo.description;
        record.value = vo.value;
        record.approvalStatus = vo.approvalStatus;
        record.executionPct = vo.executionPct;
        record.billableAmount = billable;
        record.revenueAtRisk = atRisk;
        record.marginImpact = vo.marginImpact;
        record.includeInNextIpc = vo.approvalStatus === 'approved';
        record.raisedDate = vo.raisedDate;
        record.approvedDate = vo.approvedDate || null;
        record.notes = vo.notes;
        record.createdBy = 'commercial_manager';
        record.updatedAt = Date.now();
        record.appSyncStatus = 'pending';
        record._version = 1;
      });
    }

    // 6. Create demo Retention records (linked to first 3 demo invoices)
    const retentionsCollection = database.collections.get('retentions');
    const createdInvoices = await invoicesCollection
      .query(Q.where('project_id', projectId))
      .fetch();
    const dlpEnd = Date.now() + 24 * 30 * 24 * 60 * 60 * 1000; // 24 months from now
    for (const inv of (createdInvoices as any[]).slice(0, 3)) {
      const gross = inv.amount;
      const retAmt = gross * 0.05;
      await retentionsCollection.create((record: any) => {
        record.projectId = projectId;
        record.invoiceId = inv.id;
        record.partyType = 'client';
        record.grossInvoiceAmount = gross;
        record.retentionPct = 5;
        record.retentionAmount = retAmt;
        record.dlpEndDate = dlpEnd;
        record.bgInLieu = false;
        record.createdBy = 'commercial_manager';
        record.updatedAt = Date.now();
        record.appSyncStatus = 'pending';
        record._version = 1;
      });
    }
  });

  return {
    budgetsCreated: budgetsCount,
    costsCreated: costsCount,
    invoicesCreated: invoicesCount,
  };
}

export default { generatePlannerDemoData, generateDesignerDemoData, generateSupervisorDemoData, generateManagerDemoData, generateLogisticsDemoData, generateCommercialManagerDemoData };
