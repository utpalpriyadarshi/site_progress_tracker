/**
 * MaterialSuggestionsService.ts
 *
 * Shared lookup: given an item name (and optional category), returns
 * suggested TemplateMaterial[] to pre-fill or bulk-create materials.
 *
 * Used by:
 * - MaterialSuggestionsDialog (B1: "Suggest Materials" per item card)
 * - MaterialTrackingScreen (B3: suggestion chips in Add dialog)
 */

import { TemplateMaterial } from '../../models/TemplateModuleModel';

interface SuggestionEntry {
  patterns: string[];           // lowercase name fragments to match
  categoryPatterns?: string[];  // optional category filter (lowercase)
  materials: TemplateMaterial[];
}

const SUGGESTIONS: SuggestionEntry[] = [
  {
    patterns: ['foundation casting'],
    materials: [
      { name: 'Concrete M30', quantityRequired: 30, unit: 'm³' },
      { name: 'Rebar', quantityRequired: 3, unit: 'tons' },
      { name: 'Shuttering', quantityRequired: 50, unit: 'm²' },
    ],
  },
  {
    patterns: ['structural steel erection'],
    materials: [
      { name: 'Structural Steel', quantityRequired: 15, unit: 'tons' },
      { name: 'Anchor Bolts', quantityRequired: 200, unit: 'nos' },
    ],
  },
  {
    patterns: ['transformer installation', 'transformer oil filling'],
    materials: [
      { name: 'Power Transformer 100MVA', quantityRequired: 2, unit: 'nos', supplier: 'VND-PT-001' },
      { name: 'Transformer Oil', quantityRequired: 4000, unit: 'L', supplier: 'VND-PT-001' },
      { name: 'Bushings', quantityRequired: 12, unit: 'nos', supplier: 'VND-PT-001' },
    ],
  },
  {
    patterns: ['hv switchgear', 'switchgear installation'],
    materials: [
      { name: 'HV Switchgear Panel', quantityRequired: 4, unit: 'nos', supplier: 'VND-SG-002' },
      { name: 'SF6 Gas', quantityRequired: 20, unit: 'kg', supplier: 'VND-SG-002' },
      { name: 'Control Cable', quantityRequired: 200, unit: 'm', supplier: 'VND-CC-003' },
    ],
  },
  {
    patterns: ['control panel', 'control panels installation'],
    materials: [
      { name: 'Control Panel', quantityRequired: 3, unit: 'nos', supplier: 'VND-SG-002' },
      { name: 'Control Cable', quantityRequired: 500, unit: 'm', supplier: 'VND-CC-003' },
      { name: 'Terminal Blocks', quantityRequired: 100, unit: 'nos' },
    ],
  },
  {
    patterns: ['cable tray'],
    materials: [
      { name: 'Cable Tray 150mm', quantityRequired: 500, unit: 'm' },
      { name: 'Perforated Tray', quantityRequired: 200, unit: 'm' },
      { name: 'Tray Supports', quantityRequired: 100, unit: 'nos' },
    ],
  },
  {
    patterns: ['ht/lt cable', 'cable laying', 'ht cable', 'lt cable'],
    materials: [
      { name: 'HT Cable 11kV', quantityRequired: 800, unit: 'm', supplier: 'VND-CC-003' },
      { name: 'LT Cable 1.1kV', quantityRequired: 400, unit: 'm', supplier: 'VND-CC-003' },
      { name: 'Cable Glands', quantityRequired: 30, unit: 'nos' },
    ],
  },
  {
    patterns: ['earthing grid', 'earthing'],
    materials: [
      { name: 'Earthing Electrode', quantityRequired: 10, unit: 'nos' },
      { name: 'Earthing Strip 40x6mm', quantityRequired: 200, unit: 'm' },
      { name: 'Earth Clamps', quantityRequired: 40, unit: 'nos' },
    ],
  },
  {
    patterns: ['mast erection'],
    materials: [
      { name: 'OHE Mast 9.6m', quantityRequired: 80, unit: 'nos', supplier: 'VND-SS-004' },
      { name: 'Foundation Bolts M30', quantityRequired: 640, unit: 'nos', supplier: 'VND-SS-004' },
      { name: 'Base Plate', quantityRequired: 80, unit: 'nos', supplier: 'VND-SS-004' },
    ],
  },
  {
    patterns: ['bracket & arm', 'bracket and arm', 'cantilever'],
    materials: [
      { name: 'Cantilever Assembly', quantityRequired: 80, unit: 'nos', supplier: 'VND-SS-004' },
      { name: 'Steady Arm', quantityRequired: 80, unit: 'nos', supplier: 'VND-SS-004' },
      { name: 'Registration Arm', quantityRequired: 80, unit: 'nos', supplier: 'VND-SS-004' },
    ],
  },
  {
    patterns: ['catenary wire'],
    materials: [
      { name: 'Catenary Wire 107mm²', quantityRequired: 16000, unit: 'm', supplier: 'VND-CC-003' },
      { name: 'Tension Clamps', quantityRequired: 100, unit: 'nos' },
      { name: 'Mid-span Joints', quantityRequired: 20, unit: 'nos' },
    ],
  },
  {
    patterns: ['contact wire'],
    materials: [
      { name: 'Contact Wire 107mm²', quantityRequired: 16000, unit: 'm', supplier: 'VND-CC-003' },
      { name: 'Section Insulators', quantityRequired: 20, unit: 'nos' },
      { name: 'Anchor Clamps', quantityRequired: 40, unit: 'nos' },
    ],
  },
  {
    patterns: ['dropper & clip', 'dropper and clip', 'dropper'],
    materials: [
      { name: 'Dropper Assembly', quantityRequired: 500, unit: 'nos' },
      { name: 'Stitch Wire', quantityRequired: 600, unit: 'm', supplier: 'VND-CC-003' },
      { name: 'Dropper Clips', quantityRequired: 1000, unit: 'nos' },
    ],
  },
];

/**
 * Returns suggested materials for a given item name / category.
 * Matches by name pattern first, then by category pattern.
 * Returns [] if no match found.
 */
export function getSuggestionsForItem(
  itemName: string,
  categoryName?: string
): TemplateMaterial[] {
  const name = itemName.toLowerCase();

  // 1. Name-based match (most specific)
  const byName = SUGGESTIONS.find(s => s.patterns.some(p => name.includes(p)));
  if (byName) return byName.materials;

  // 2. Category-based fallback
  if (categoryName) {
    const cat = categoryName.toLowerCase();
    const byCat = SUGGESTIONS.find(s =>
      s.categoryPatterns?.some(c => cat.includes(c))
    );
    if (byCat) return byCat.materials;
  }

  return [];
}
