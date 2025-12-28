export const CATEGORIES = ['labor', 'material', 'equipment', 'other'];

export const CATEGORY_LABELS: Record<string, string> = {
  labor: 'Labor',
  material: 'Materials',
  equipment: 'Equipment',
  other: 'Other',
};

export const CATEGORY_COLORS: Record<string, string> = {
  labor: '#2196F3',
  material: '#4CAF50',
  equipment: '#FF9800',
  other: '#9C27B0',
};

export const getCategoryLabel = (category: string): string => {
  return CATEGORY_LABELS[category] || category;
};

export const getCategoryColor = (category: string): string => {
  return CATEGORY_COLORS[category] || '#757575';
};
