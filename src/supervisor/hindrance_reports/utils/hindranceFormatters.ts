export const getPriorityColor = (priority: string): string => {
  switch (priority) {
    case 'high':
      return '#F44336';
    case 'medium':
      return '#FF9800';
    case 'low':
      return '#4CAF50';
    default:
      return '#9E9E9E';
  }
};

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'open':
      return '#F44336';
    case 'in_progress':
      return '#2196F3';
    case 'resolved':
      return '#4CAF50';
    case 'closed':
      return '#9E9E9E';
    default:
      return '#9E9E9E';
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
