/**
 * TemplateService.ts
 *
 * Manages activity templates for the Supervisor role.
 *
 * Responsibilities:
 * 1. seedPredefinedTemplates() — checks if predefined templates exist,
 *    seeds TSS Substation and OHE Zone templates if not.
 * 2. applyTemplateToSite() — bulk-creates items from a template on a
 *    target site inside a single database.write() transaction.
 */

import { database } from '../../models/database';
import { Q } from '@nozbe/watermelondb';
import TemplateModuleModel, { TemplateItem, TemplateCategory } from '../../models/TemplateModuleModel';
import CategoryModel from '../../models/CategoryModel';
import { logger } from './LoggingService';

// ==================== Predefined Template Data ====================

const TSS_ITEMS: TemplateItem[] = [
  // site_prep
  { name: 'Site Marking & Clearing',       phase: 'site_prep',    duration: 3,  dependencies: [], wbsCode: '1.1', quantity: 1,  unit: 'nos',    weightage: 3,  categoryName: 'Civil' },
  { name: 'Foundation Excavation',          phase: 'site_prep',    duration: 5,  dependencies: [], wbsCode: '1.2', quantity: 50, unit: 'm³',     weightage: 4,  categoryName: 'Civil' },
  { name: 'Foundation Casting',             phase: 'site_prep',    duration: 7,  dependencies: [], wbsCode: '1.3', quantity: 30, unit: 'm³',     weightage: 5,  categoryName: 'Civil' },
  // construction
  { name: 'Structural Steel Erection',      phase: 'construction', duration: 10, dependencies: [], wbsCode: '2.1', quantity: 15, unit: 'tons',   weightage: 6,  categoryName: 'Civil' },
  { name: 'Transformer Installation',       phase: 'construction', duration: 5,  dependencies: [], wbsCode: '2.2', quantity: 2,  unit: 'nos',    weightage: 8,  categoryName: 'OHE' },
  { name: 'HV Switchgear Installation',     phase: 'construction', duration: 7,  dependencies: [], wbsCode: '2.3', quantity: 4,  unit: 'nos',    weightage: 8,  categoryName: 'OHE' },
  { name: 'Control Panels Installation',    phase: 'construction', duration: 4,  dependencies: [], wbsCode: '2.4', quantity: 3,  unit: 'nos',    weightage: 6,  categoryName: 'OHE' },
  { name: 'Cable Tray Installation',        phase: 'construction', duration: 6,  dependencies: [], wbsCode: '2.5', quantity: 500, unit: 'm',     weightage: 5,  categoryName: 'Civil' },
  { name: 'HT/LT Cable Laying',            phase: 'construction', duration: 8,  dependencies: [], wbsCode: '2.6', quantity: 800, unit: 'm',     weightage: 7,  categoryName: 'OHE' },
  { name: 'Earthing Grid Installation',     phase: 'construction', duration: 4,  dependencies: [], wbsCode: '2.7', quantity: 1,  unit: 'nos',    weightage: 5,  categoryName: 'Civil' },
  { name: 'Transformer Oil Filling',        phase: 'construction', duration: 2,  dependencies: [], wbsCode: '2.8', quantity: 2,  unit: 'nos',    weightage: 3,  categoryName: 'OHE' },
  // testing
  { name: 'IR / Megger Tests',             phase: 'testing',      duration: 3,  dependencies: [], wbsCode: '3.1', quantity: 1,  unit: 'nos',    weightage: 6,  categoryName: 'OHE' },
  { name: 'Protection Relay Testing',       phase: 'testing',      duration: 5,  dependencies: [], wbsCode: '3.2', quantity: 1,  unit: 'nos',    weightage: 8,  categoryName: 'OHE' },
  { name: 'Pre-commissioning Tests',        phase: 'testing',      duration: 4,  dependencies: [], wbsCode: '3.3', quantity: 1,  unit: 'nos',    weightage: 7,  categoryName: 'OHE' },
  // commissioning
  { name: 'Energization Trials',            phase: 'commissioning', duration: 3, dependencies: [], wbsCode: '4.1', quantity: 1,  unit: 'nos',    weightage: 8,  categoryName: 'OHE' },
  { name: 'Load Trials',                    phase: 'commissioning', duration: 4, dependencies: [], wbsCode: '4.2', quantity: 1,  unit: 'nos',    weightage: 6,  categoryName: 'OHE' },
  // sat
  { name: 'Site Acceptance Test',           phase: 'sat',          duration: 5,  dependencies: [], wbsCode: '5.1', quantity: 1,  unit: 'nos',    weightage: 8,  categoryName: 'OHE', isMilestone: true },
  // handover
  { name: 'Punch List & Handover',          phase: 'handover',     duration: 3,  dependencies: [], wbsCode: '6.1', quantity: 1,  unit: 'nos',    weightage: 5,  categoryName: 'Civil', isMilestone: true },
];

const OHE_ITEMS: TemplateItem[] = [
  // site_prep
  { name: 'Survey & Marking',               phase: 'site_prep',    duration: 3,  dependencies: [], wbsCode: '1.1', quantity: 1,  unit: 'nos',    weightage: 4,  categoryName: 'OHE' },
  { name: 'Foundation Excavation',          phase: 'site_prep',    duration: 7,  dependencies: [], wbsCode: '1.2', quantity: 60, unit: 'm³',     weightage: 5,  categoryName: 'Civil' },
  { name: 'Foundation Casting',             phase: 'site_prep',    duration: 8,  dependencies: [], wbsCode: '1.3', quantity: 40, unit: 'm³',     weightage: 6,  categoryName: 'Civil' },
  // construction
  { name: 'Mast Erection',                  phase: 'construction', duration: 10, dependencies: [], wbsCode: '2.1', quantity: 80, unit: 'nos',    weightage: 10, categoryName: 'OHE' },
  { name: 'Bracket & Arm Installation',     phase: 'construction', duration: 7,  dependencies: [], wbsCode: '2.2', quantity: 80, unit: 'nos',    weightage: 8,  categoryName: 'OHE' },
  { name: 'Catenary Wire Stringing',        phase: 'construction', duration: 10, dependencies: [], wbsCode: '2.3', quantity: 15500, unit: 'm',   weightage: 12, categoryName: 'OHE' },
  { name: 'Contact Wire Stringing',         phase: 'construction', duration: 8,  dependencies: [], wbsCode: '2.4', quantity: 15500, unit: 'm',   weightage: 12, categoryName: 'OHE' },
  { name: 'Dropper & Clip Fixing',          phase: 'construction', duration: 5,  dependencies: [], wbsCode: '2.5', quantity: 500, unit: 'nos',   weightage: 6,  categoryName: 'OHE' },
  // testing
  { name: 'OCS Geometry Measurement',       phase: 'testing',      duration: 4,  dependencies: [], wbsCode: '3.1', quantity: 1,  unit: 'nos',    weightage: 8,  categoryName: 'OHE' },
  { name: 'Stagger & Height Verification',  phase: 'testing',      duration: 3,  dependencies: [], wbsCode: '3.2', quantity: 1,  unit: 'nos',    weightage: 7,  categoryName: 'OHE' },
  { name: 'Dynamic Test Run',               phase: 'testing',      duration: 3,  dependencies: [], wbsCode: '3.3', quantity: 1,  unit: 'nos',    weightage: 8,  categoryName: 'OHE' },
  // commissioning
  { name: 'Section Insulators Installation',phase: 'commissioning', duration: 3, dependencies: [], wbsCode: '4.1', quantity: 10, unit: 'nos',    weightage: 5,  categoryName: 'OHE' },
  { name: 'Section Energization',           phase: 'commissioning', duration: 2, dependencies: [], wbsCode: '4.2', quantity: 1,  unit: 'nos',    weightage: 5,  categoryName: 'OHE' },
  // sat
  { name: 'SAT & Clearance',               phase: 'sat',          duration: 4,  dependencies: [], wbsCode: '5.1', quantity: 1,  unit: 'nos',    weightage: 6,  categoryName: 'OHE', isMilestone: true },
  // handover
  { name: 'As-Built Survey & Handover',     phase: 'handover',     duration: 3,  dependencies: [], wbsCode: '6.1', quantity: 1,  unit: 'nos',    weightage: 4,  categoryName: 'OHE', isMilestone: true },
];

const PREDEFINED_TEMPLATES: Array<{
  name: string;
  category: TemplateCategory;
  description: string;
  items: TemplateItem[];
}> = [
  {
    name: 'TSS Substation — Standard',
    category: 'substation',
    description: 'Standard activity template for Traction Substation construction from site prep through handover.',
    items: TSS_ITEMS,
  },
  {
    name: 'OHE Zone — Standard',
    category: 'ohe',
    description: 'Standard activity template for Overhead Equipment zone from survey through as-built handover.',
    items: OHE_ITEMS,
  },
];

// ==================== seedPredefinedTemplates ====================

/**
 * Seeds predefined templates if none exist yet.
 * Safe to call multiple times — checks for existing predefined templates first.
 */
export async function seedPredefinedTemplates(): Promise<void> {
  try {
    const existing = await database.collections
      .get<TemplateModuleModel>('template_modules')
      .query(Q.where('is_predefined', true))
      .fetch();

    if (existing.length > 0) {
      logger.debug('Predefined templates already seeded', {
        service: 'TemplateService',
        count: existing.length,
      });
      return;
    }

    await database.write(async () => {
      for (const tpl of PREDEFINED_TEMPLATES) {
        await database.collections.get('template_modules').create((rec: any) => {
          rec.name = tpl.name;
          rec.category = tpl.category;
          rec.description = tpl.description;
          rec.itemsJson = JSON.stringify(tpl.items);
          rec.compatibleModules = JSON.stringify([]);
          rec.isPredefined = true;
        });
      }
    });

    logger.info('Predefined templates seeded', {
      service: 'TemplateService',
      count: PREDEFINED_TEMPLATES.length,
    });
  } catch (error) {
    logger.error('Failed to seed predefined templates', error as Error, {
      service: 'TemplateService',
    });
  }
}

// ==================== applyTemplateToSite ====================

export interface ApplyTemplateResult {
  created: number;
  skipped: number;
  skippedNames: string[];
}

/**
 * Applies a template to a site by bulk-creating items.
 * Duplicate names (same site) are skipped.
 */
export async function applyTemplateToSite(
  templateId: string,
  siteId: string,
  projectId: string
): Promise<ApplyTemplateResult> {
  // 1. Load template
  const template = await database.collections
    .get<TemplateModuleModel>('template_modules')
    .find(templateId);

  const templateItems = template.getItems();

  // 2. Load categories for this project's sites
  const allCategories = await database.collections
    .get<CategoryModel>('categories')
    .query()
    .fetch();

  const categoryByName = new Map<string, string>();
  for (const cat of allCategories) {
    categoryByName.set(cat.name.toLowerCase(), cat.id);
  }
  const fallbackCategoryId = allCategories[0]?.id ?? '';

  // 3. Load existing item names on the target site to detect duplicates
  const existingItems = await database.collections
    .get('items')
    .query(Q.where('site_id', siteId))
    .fetch();

  const existingNames = new Set(
    (existingItems as any[]).map((i: any) => (i.name as string).toLowerCase())
  );

  // 4. Partition items
  const toCreate: TemplateItem[] = [];
  const skippedNames: string[] = [];

  for (const item of templateItems) {
    if (existingNames.has(item.name.toLowerCase())) {
      skippedNames.push(item.name);
    } else {
      toCreate.push(item);
    }
  }

  // 5. Batch create
  if (toCreate.length > 0) {
    await database.write(async () => {
      for (const item of toCreate) {
        const resolvedCategoryId =
          (item.categoryName
            ? categoryByName.get(item.categoryName.toLowerCase())
            : undefined) ?? fallbackCategoryId;

        await database.collections.get('items').create((rec: any) => {
          rec.name = item.name;
          rec.siteId = siteId;
          rec.categoryId = resolvedCategoryId;
          rec.plannedQuantity = item.quantity ?? 1;
          rec.completedQuantity = 0;
          rec.unitOfMeasurement = item.unit ?? 'nos';
          rec.weightage = item.weightage ?? 0;
          rec.status = 'not_started';
          rec.projectPhase = item.phase;
          rec.isMilestone = item.isMilestone ?? false;
          rec.wbsCode = item.wbsCode ?? '';
          rec.wbsLevel = 1;
          rec.isCriticalPath = false;
          rec.isBaselineLocked = false;
          rec.createdByRole = 'supervisor';
          rec.appSyncStatus = 'pending';
          rec.version = 1;
        });
      }
    });
  }

  logger.info('Template applied to site', {
    service: 'TemplateService',
    templateId,
    siteId,
    created: toCreate.length,
    skipped: skippedNames.length,
  });

  return {
    created: toCreate.length,
    skipped: skippedNames.length,
    skippedNames,
  };
}
