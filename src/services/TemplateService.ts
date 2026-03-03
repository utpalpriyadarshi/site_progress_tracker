/**
 * TemplateService.ts
 *
 * Manages activity templates for the Supervisor role.
 *
 * Responsibilities:
 * 1. seedPredefinedTemplates() — checks if predefined templates exist,
 *    seeds TSS Substation and OHE Zone templates if not.
 *    On upgrade: if existing templates are missing material data or have
 *    outdated activity lists, updates them in-place.
 * 2. applyTemplateToSite() — bulk-creates items (and their materials) from a
 *    template on a target site inside a single database.write() transaction.
 */

import { database } from '../../models/database';
import { Q } from '@nozbe/watermelondb';
import TemplateModuleModel, { TemplateItem, TemplateCategory } from '../../models/TemplateModuleModel';
import CategoryModel from '../../models/CategoryModel';
import { logger } from './LoggingService';

// ==================== Predefined Template Data ====================

const TSS_ITEMS: TemplateItem[] = [
  // site_prep
  { name: 'Site Marking & Clearing',         phase: 'site_prep',     duration: 3,  dependencies: [], wbsCode: '1.1', quantity: 1,    unit: 'nos',  weightage: 3,  categoryName: 'Civil Works' },
  { name: 'Foundation Excavation',            phase: 'site_prep',     duration: 5,  dependencies: [], wbsCode: '1.2', quantity: 50,   unit: 'm³',   weightage: 4,  categoryName: 'Civil Works' },
  {
    name: 'Foundation Casting',               phase: 'site_prep',     duration: 7,  dependencies: [], wbsCode: '1.3', quantity: 30,   unit: 'm³',   weightage: 5,  categoryName: 'Foundation Work',
    materials: [
      { name: 'Concrete M30', quantityRequired: 30, unit: 'm³' },
      { name: 'Rebar', quantityRequired: 3, unit: 'tons' },
      { name: 'Shuttering', quantityRequired: 50, unit: 'm²' },
    ],
  },
  // construction
  {
    name: 'Structural Steel Erection',        phase: 'construction',  duration: 10, dependencies: [], wbsCode: '2.1', quantity: 15,   unit: 'tons', weightage: 6,  categoryName: 'Installation',
    materials: [
      { name: 'Structural Steel', quantityRequired: 15, unit: 'tons' },
      { name: 'Anchor Bolts', quantityRequired: 200, unit: 'nos' },
    ],
  },
  {
    name: 'Transformer Installation',         phase: 'construction',  duration: 5,  dependencies: [], wbsCode: '2.2', quantity: 2,    unit: 'nos',  weightage: 8,  categoryName: 'Installation',
    materials: [
      { name: 'Power Transformer 100MVA', quantityRequired: 2, unit: 'nos', supplier: 'VND-PT-001' },
      { name: 'Transformer Oil', quantityRequired: 4000, unit: 'L', supplier: 'VND-PT-001' },
      { name: 'Bushings', quantityRequired: 12, unit: 'nos', supplier: 'VND-PT-001' },
    ],
  },
  {
    name: 'HV Switchgear Installation',       phase: 'construction',  duration: 7,  dependencies: [], wbsCode: '2.3', quantity: 4,    unit: 'nos',  weightage: 8,  categoryName: 'Installation',
    materials: [
      { name: 'HV Switchgear Panel', quantityRequired: 4, unit: 'nos', supplier: 'VND-SG-002' },
      { name: 'SF6 Gas', quantityRequired: 20, unit: 'kg', supplier: 'VND-SG-002' },
      { name: 'Control Cable', quantityRequired: 200, unit: 'm', supplier: 'VND-CC-003' },
    ],
  },
  { name: 'Lightening Arrester Installation', phase: 'construction',  duration: 7,  dependencies: [], wbsCode: '2.4', quantity: 4,    unit: 'nos',  weightage: 8,  categoryName: 'Installation' },
  { name: 'Isolator Installation',            phase: 'construction',  duration: 7,  dependencies: [], wbsCode: '2.5', quantity: 4,    unit: 'nos',  weightage: 8,  categoryName: 'Installation' },
  { name: 'CT Installation',                  phase: 'construction',  duration: 7,  dependencies: [], wbsCode: '2.6', quantity: 3,    unit: 'nos',  weightage: 8,  categoryName: 'Installation' },
  { name: 'PT Installation',                  phase: 'construction',  duration: 7,  dependencies: [], wbsCode: '2.7', quantity: 3,    unit: 'nos',  weightage: 8,  categoryName: 'Installation' },
  {
    name: 'Control Panels Installation',      phase: 'construction',  duration: 4,  dependencies: [], wbsCode: '2.8', quantity: 3,    unit: 'nos',  weightage: 6,  categoryName: 'Installation',
    materials: [
      { name: 'Control Panel', quantityRequired: 3, unit: 'nos', supplier: 'VND-SG-002' },
      { name: 'Control Cable', quantityRequired: 500, unit: 'm', supplier: 'VND-CC-003' },
      { name: 'Terminal Blocks', quantityRequired: 100, unit: 'nos' },
    ],
  },
  {
    name: 'Cable Tray Installation',          phase: 'construction',  duration: 6,  dependencies: [], wbsCode: '2.9',  quantity: 500,  unit: 'm',    weightage: 5,  categoryName: 'Installation',
    materials: [
      { name: 'Cable Tray 150mm', quantityRequired: 500, unit: 'm' },
      { name: 'Perforated Tray', quantityRequired: 200, unit: 'm' },
      { name: 'Tray Supports', quantityRequired: 100, unit: 'nos' },
    ],
  },
  {
    name: 'HT/LT Cable Laying',              phase: 'construction',  duration: 8,  dependencies: [], wbsCode: '2.10', quantity: 800,  unit: 'm',    weightage: 7,  categoryName: 'Installation',
    materials: [
      { name: 'HT Cable 11kV', quantityRequired: 800, unit: 'm', supplier: 'VND-CC-003' },
      { name: 'LT Cable 1.1kV', quantityRequired: 400, unit: 'm', supplier: 'VND-CC-003' },
      { name: 'Cable Glands', quantityRequired: 30, unit: 'nos' },
    ],
  },
  {
    name: 'Earthing Grid Installation',       phase: 'construction',  duration: 4,  dependencies: [], wbsCode: '2.11', quantity: 1,    unit: 'nos',  weightage: 5,  categoryName: 'Installation',
    materials: [
      { name: 'Earthing Electrode', quantityRequired: 10, unit: 'nos' },
      { name: 'Earthing Strip 40x6mm', quantityRequired: 200, unit: 'm' },
      { name: 'Earth Clamps', quantityRequired: 40, unit: 'nos' },
    ],
  },
  { name: 'Transformer Oil Filling',          phase: 'construction',  duration: 2,  dependencies: [], wbsCode: '2.12', quantity: 2,    unit: 'nos',  weightage: 3,  categoryName: 'Installation' },
  // testing
  { name: 'IR / Megger Tests',               phase: 'testing',       duration: 3,  dependencies: [], wbsCode: '3.1',  quantity: 1,    unit: 'nos',  weightage: 6,  categoryName: 'Testing' },
  { name: 'Protection Relay Testing',         phase: 'testing',       duration: 5,  dependencies: [], wbsCode: '3.2',  quantity: 1,    unit: 'nos',  weightage: 8,  categoryName: 'Testing' },
  { name: 'Pre-commissioning Tests',          phase: 'testing',       duration: 4,  dependencies: [], wbsCode: '3.3',  quantity: 1,    unit: 'nos',  weightage: 7,  categoryName: 'Testing' },
  // commissioning
  { name: 'Energization Trials',              phase: 'commissioning', duration: 3,  dependencies: [], wbsCode: '4.1',  quantity: 1,    unit: 'nos',  weightage: 8,  categoryName: 'Commissioning' },
  { name: 'Load Trials',                      phase: 'commissioning', duration: 4,  dependencies: [], wbsCode: '4.2',  quantity: 1,    unit: 'nos',  weightage: 6,  categoryName: 'Commissioning' },
  // sat
  { name: 'Site Acceptance Test',             phase: 'sat',           duration: 5,  dependencies: [], wbsCode: '5.1',  quantity: 1,    unit: 'nos',  weightage: 8,  categoryName: 'Handing Over',  isMilestone: true },
  // handover
  { name: 'Punch List & Handover',            phase: 'handover',      duration: 3,  dependencies: [], wbsCode: '6.1',  quantity: 1,    unit: 'nos',  weightage: 5,  categoryName: 'Punch List',    isMilestone: true },
];

const OHE_ITEMS: TemplateItem[] = [
  // site_prep
  { name: 'Survey & Marking',                 phase: 'site_prep',     duration: 3,  dependencies: [], wbsCode: '1.1', quantity: 1,     unit: 'nos',  weightage: 4,  categoryName: 'Civil' },
  { name: 'Foundation Excavation',            phase: 'site_prep',     duration: 7,  dependencies: [], wbsCode: '1.2', quantity: 60,    unit: 'm³',   weightage: 5,  categoryName: 'Civil' },
  {
    name: 'Foundation Casting',               phase: 'site_prep',     duration: 8,  dependencies: [], wbsCode: '1.3', quantity: 40,    unit: 'm³',   weightage: 6,  categoryName: 'Foundation Work',
    materials: [
      { name: 'Concrete M30', quantityRequired: 40, unit: 'm³' },
      { name: 'Rebar', quantityRequired: 4, unit: 'tons' },
      { name: 'Shuttering', quantityRequired: 60, unit: 'm²' },
    ],
  },
  // construction
  {
    name: 'Mast Erection',                    phase: 'construction',  duration: 10, dependencies: [], wbsCode: '2.1', quantity: 80,    unit: 'nos',  weightage: 10, categoryName: 'Installation',
    materials: [
      { name: 'OHE Mast 9.6m', quantityRequired: 80, unit: 'nos', supplier: 'VND-SS-004' },
      { name: 'Foundation Bolts M30', quantityRequired: 640, unit: 'nos', supplier: 'VND-SS-004' },
      { name: 'Base Plate', quantityRequired: 80, unit: 'nos', supplier: 'VND-SS-004' },
    ],
  },
  {
    name: 'Bracket & Arm Installation',       phase: 'construction',  duration: 7,  dependencies: [], wbsCode: '2.2', quantity: 80,    unit: 'nos',  weightage: 8,  categoryName: 'Installation',
    materials: [
      { name: 'Cantilever Assembly', quantityRequired: 80, unit: 'nos', supplier: 'VND-SS-004' },
      { name: 'Steady Arm', quantityRequired: 80, unit: 'nos', supplier: 'VND-SS-004' },
      { name: 'Registration Arm', quantityRequired: 80, unit: 'nos', supplier: 'VND-SS-004' },
    ],
  },
  {
    name: 'Catenary Wire Stringing',          phase: 'construction',  duration: 10, dependencies: [], wbsCode: '2.3', quantity: 15500, unit: 'm',    weightage: 12, categoryName: 'Installation',
    materials: [
      { name: 'Catenary Wire 107mm²', quantityRequired: 16000, unit: 'm', supplier: 'VND-CC-003' },
      { name: 'Tension Clamps', quantityRequired: 100, unit: 'nos' },
      { name: 'Mid-span Joints', quantityRequired: 20, unit: 'nos' },
    ],
  },
  {
    name: 'Contact Wire Stringing',           phase: 'construction',  duration: 8,  dependencies: [], wbsCode: '2.4', quantity: 15500, unit: 'm',    weightage: 12, categoryName: 'Installation',
    materials: [
      { name: 'Contact Wire 107mm²', quantityRequired: 16000, unit: 'm', supplier: 'VND-CC-003' },
      { name: 'Section Insulators', quantityRequired: 20, unit: 'nos' },
      { name: 'Anchor Clamps', quantityRequired: 40, unit: 'nos' },
    ],
  },
  {
    name: 'Dropper & Clip Fixing',            phase: 'construction',  duration: 5,  dependencies: [], wbsCode: '2.5', quantity: 500,   unit: 'nos',  weightage: 6,  categoryName: 'Installation',
    materials: [
      { name: 'Dropper Assembly', quantityRequired: 500, unit: 'nos' },
      { name: 'Stitch Wire', quantityRequired: 600, unit: 'm', supplier: 'VND-CC-003' },
      { name: 'Dropper Clips', quantityRequired: 1000, unit: 'nos' },
    ],
  },
  // testing
  { name: 'OCS Geometry Measurement',         phase: 'testing',       duration: 4,  dependencies: [], wbsCode: '3.1', quantity: 1,     unit: 'nos',  weightage: 8,  categoryName: 'Testing' },
  { name: 'Stagger & Height Verification',    phase: 'testing',       duration: 3,  dependencies: [], wbsCode: '3.2', quantity: 1,     unit: 'nos',  weightage: 7,  categoryName: 'Testing' },
  { name: 'Dynamic Test Run',                 phase: 'testing',       duration: 3,  dependencies: [], wbsCode: '3.3', quantity: 1,     unit: 'nos',  weightage: 8,  categoryName: 'Testing' },
  // commissioning
  { name: 'Section Insulators Installation',  phase: 'commissioning', duration: 3,  dependencies: [], wbsCode: '4.1', quantity: 10,    unit: 'nos',  weightage: 5,  categoryName: 'Testing' },
  { name: 'Section Energization',             phase: 'commissioning', duration: 2,  dependencies: [], wbsCode: '4.2', quantity: 1,     unit: 'nos',  weightage: 5,  categoryName: 'Testing' },
  // sat
  { name: 'SAT & Clearance',                 phase: 'sat',           duration: 4,  dependencies: [], wbsCode: '5.1', quantity: 1,     unit: 'nos',  weightage: 6,  categoryName: 'Commissioning', isMilestone: true },
  // handover
  { name: 'Punch List & Handover',            phase: 'handover',      duration: 3,  dependencies: [], wbsCode: '6.1', quantity: 1,     unit: 'nos',  weightage: 5,  categoryName: 'Punch List',    isMilestone: true },
  { name: 'As-Built Survey & Handover',       phase: 'handover',      duration: 3,  dependencies: [], wbsCode: '6.2', quantity: 1,     unit: 'nos',  weightage: 4,  categoryName: 'Handover',      isMilestone: true },
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
 * On upgrade: if existing predefined templates have outdated items (detected by
 * item count mismatch or missing materials), updates them in-place.
 * Safe to call multiple times.
 */
export async function seedPredefinedTemplates(): Promise<void> {
  try {
    const existing = await database.collections
      .get<TemplateModuleModel>('template_modules')
      .query(Q.where('is_predefined', true))
      .fetch();

    if (existing.length > 0) {
      // Detect stale templates: item count changed OR materials missing
      const needsUpdate = existing.some(tpl => {
        const def = PREDEFINED_TEMPLATES.find(p => p.name === tpl.name);
        if (!def) return false;
        const currentItems = tpl.getItems();
        if (currentItems.length !== def.items.length) return true;
        return currentItems.every(i => !i.materials || i.materials.length === 0);
      });

      if (!needsUpdate) {
        logger.debug('Predefined templates already up to date', {
          service: 'TemplateService',
          count: existing.length,
        });
        return;
      }

      await database.write(async () => {
        for (const tpl of existing) {
          const def = PREDEFINED_TEMPLATES.find(p => p.name === tpl.name);
          if (def) {
            await tpl.update((r: any) => { r.itemsJson = JSON.stringify(def.items); });
          }
        }
      });

      logger.info('Predefined templates upgraded', {
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
  materialsCreated: number;
}

/**
 * Applies a template to a site by bulk-creating items and their bundled materials.
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

  // 2. Load categories
  const allCategories = await database.collections
    .get<CategoryModel>('categories')
    .query()
    .fetch();

  const categoryByName = new Map<string, string>();
  for (const cat of allCategories) {
    categoryByName.set(cat.name.toLowerCase(), cat.id);
  }
  const fallbackCategoryId = allCategories[0]?.id ?? '';

  // 3. Load existing item names on target site (duplicate detection)
  const existingItems = await database.collections
    .get('items')
    .query(Q.where('site_id', siteId))
    .fetch();

  const existingNames = new Set(
    (existingItems as any[]).map((i: any) => (i.name as string).toLowerCase())
  );

  // 4. Partition
  const toCreate: TemplateItem[] = [];
  const skippedNames: string[] = [];

  for (const item of templateItems) {
    if (existingNames.has(item.name.toLowerCase())) {
      skippedNames.push(item.name);
    } else {
      toCreate.push(item);
    }
  }

  // 5. Batch create items + materials
  let materialsCreated = 0;

  if (toCreate.length > 0) {
    await database.write(async () => {
      for (const item of toCreate) {
        const resolvedCategoryId =
          (item.categoryName
            ? categoryByName.get(item.categoryName.toLowerCase())
            : undefined) ?? fallbackCategoryId;

        const createdItem = await database.collections.get('items').create((rec: any) => {
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

        if (item.materials && item.materials.length > 0) {
          for (const mat of item.materials) {
            await database.collections.get('materials').create((rec: any) => {
              rec.name = mat.name;
              rec.itemId = (createdItem as any).id;
              rec.quantityRequired = mat.quantityRequired;
              rec.quantityAvailable = 0;
              rec.quantityUsed = 0;
              rec.unit = mat.unit;
              rec.status = 'ordered';
              rec.supplier = mat.supplier ?? '';
              rec.procurementManagerId = '';
              rec.appSyncStatus = 'pending';
              rec._version = 1;
            });
            materialsCreated++;
          }
        }
      }
    });
  }

  logger.info('Template applied to site', {
    service: 'TemplateService',
    templateId,
    siteId,
    created: toCreate.length,
    skipped: skippedNames.length,
    materialsCreated,
  });

  return {
    created: toCreate.length,
    skipped: skippedNames.length,
    skippedNames,
    materialsCreated,
  };
}
