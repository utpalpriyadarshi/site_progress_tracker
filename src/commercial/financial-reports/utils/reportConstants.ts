import { COLORS } from '../../../theme/colors';
export const CATEGORIES = ['labor', 'material', 'equipment', 'other'];

export const CATEGORY_LABELS: Record<string, string> = {
  labor: 'Labor',
  material: 'Materials',
  equipment: 'Equipment',
  other: 'Other',
};

export const CATEGORY_COLORS: Record<string, string> = {
  labor: COLORS.INFO,
  material: COLORS.SUCCESS,
  equipment: COLORS.WARNING,
  other: COLORS.STATUS_EVALUATED,
};

export const getCategoryLabel = (category: string): string => {
  return CATEGORY_LABELS[category] || category;
};

export const getCategoryColor = (category: string): string => {
  return CATEGORY_COLORS[category] || '#757575';
};
