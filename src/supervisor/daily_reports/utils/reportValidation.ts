import ItemModel from '../../../../models/ItemModel';

/**
 * Validate quantity input
 */
export const validateQuantity = (quantity: string): string | null => {
  const num = parseFloat(quantity);

  if (isNaN(num)) {
    return 'Please enter a valid number';
  }

  if (num < 0) {
    return 'Quantity cannot be negative';
  }

  return null;
};

/**
 * Check if quantity exceeds planned quantity
 */
export const exceedsPlannedQuantity = (
  quantity: number,
  plannedQuantity: number
): boolean => {
  return quantity > plannedQuantity;
};

/**
 * Validate site selection for reporting
 */
export const canSubmitReports = (selectedSiteId: string): boolean => {
  return selectedSiteId !== '' && selectedSiteId !== 'all';
};

/**
 * Validate progress update form
 */
export const validateProgressUpdate = (data: {
  quantity: string;
  item: ItemModel | null;
}): string | null => {
  if (!data.item) {
    return 'No item selected';
  }

  const quantityError = validateQuantity(data.quantity);
  if (quantityError) {
    return quantityError;
  }

  return null;
};
