import { COLORS } from '../../../theme/colors';
export const COST_CATEGORIES = [
  { value: 'labor', label: 'Labor' },
  { value: 'material', label: 'Materials' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'other', label: 'Subcontractors & Other' },
];

export const CATEGORY_COLORS: Record<string, string> = {
  labor: COLORS.INFO,
  material: COLORS.SUCCESS,
  equipment: COLORS.WARNING,
  other: COLORS.STATUS_EVALUATED,
};

export const getCategoryLabel = (category: string): string => {
  const cat = COST_CATEGORIES.find((c) => c.value === category);
  return cat ? cat.label : category;
};

export const getCategoryColor = (category: string): string => {
  return CATEGORY_COLORS[category] || '#757575';
};
