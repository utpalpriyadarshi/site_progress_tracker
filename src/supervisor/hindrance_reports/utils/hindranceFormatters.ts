import { COLORS } from '../../../theme/colors';
export const getPriorityColor = (priority: string): string => {
  switch (priority) {
    case 'high':
      return COLORS.ERROR;
    case 'medium':
      return COLORS.WARNING;
    case 'low':
      return COLORS.SUCCESS;
    default:
      return COLORS.DISABLED;
  }
};

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'open':
      return COLORS.ERROR;
    case 'in_progress':
      return COLORS.INFO;
    case 'resolved':
      return COLORS.SUCCESS;
    case 'closed':
      return COLORS.DISABLED;
    default:
      return COLORS.DISABLED;
  }
};

export const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'open':
      return 'Open';
    case 'in_progress':
      return 'In Progress';
    case 'resolved':
      return 'Resolved';
    case 'closed':
      return 'Closed';
    default:
      return status;
  }
};

export const parsePhotos = (photosJson: string | null): string[] => {
  if (!photosJson) return [];
  try {
    const photosArray = JSON.parse(photosJson);
    return Array.isArray(photosArray) ? photosArray : [];
  } catch (e) {
    return [];
  }
};
