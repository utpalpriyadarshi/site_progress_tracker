export const validateHindranceForm = (
  title: string,
  siteId: string | null
): { isValid: boolean; errorMessage: string } => {
  if (!title.trim()) {
    return {
      isValid: false,
      errorMessage: 'Please enter a title',
    };
  }

  if (!siteId || siteId === 'all') {
    return {
      isValid: false,
      errorMessage: 'Please select a site',
    };
  }

  return {
    isValid: true,
    errorMessage: '',
  };
};

export const canAddHindrance = (selectedSiteId: string | null): boolean => {
  return selectedSiteId !== null && selectedSiteId !== 'all';
};
