/**
 * Category Ordering Utility
 *
 * Defines the correct display order for construction categories
 * and provides a sorting function to ensure consistent ordering throughout the app.
 *
 * This follows the logical construction sequence from foundation to handover.
 */

import CategoryModel from '../../models/CategoryModel';

/**
 * Predefined category order (logical construction sequence)
 * Categories will be sorted according to this order.
 *
 * Order:
 * 1. Foundation Work - Foundation construction tasks
 * 2. Civil Works - Foundation, excavation, concrete works
 * 3. MEP (Mechanical, Electrical, Plumbing) - HVAC, electrical systems, plumbing
 * 4. Architectural Finishes - Flooring, wall finishes, ceiling, painting
 * 5. Installation - Installation and assembly tasks
 * 6. Testing - Testing and quality assurance
 * 7. Commissioning - Commissioning and handover tasks
 * 8. Punch List - Final inspection and defect rectification
 * 9. Handing Over - Final handover and closeout tasks
 */
export const CATEGORY_ORDER = [
  'Foundation Work',
  'Civil Works',
  'MEP (Mechanical, Electrical, Plumbing)',
  'Architectural Finishes',
  'Installation',
  'Testing',
  'Commissioning',
  'Punch List',
  'Handing Over',
] as const;

/**
 * Get the sort index for a category name
 * Returns the index in CATEGORY_ORDER, or 999 if not found (will be sorted last)
 */
function getCategorySortIndex(categoryName: string): number {
  const index = CATEGORY_ORDER.indexOf(categoryName as any);
  return index === -1 ? 999 : index;
}

/**
 * Sort an array of CategoryModel records by the predefined order
 *
 * @param categories - Array of CategoryModel records to sort
 * @returns Sorted array of CategoryModel records
 *
 * @example
 * ```typescript
 * const categories = await database.collections.get('categories').query().fetch();
 * const sortedCategories = sortCategoriesByOrder(categories);
 * ```
 */
export function sortCategoriesByOrder(categories: CategoryModel[]): CategoryModel[] {
  return [...categories].sort((a, b) => {
    const indexA = getCategorySortIndex(a.name);
    const indexB = getCategorySortIndex(b.name);
    return indexA - indexB;
  });
}

/**
 * Sort an array of category names by the predefined order
 *
 * @param categoryNames - Array of category name strings to sort
 * @returns Sorted array of category names
 *
 * @example
 * ```typescript
 * const names = ['Handing Over', 'Foundation Work', 'Punch List'];
 * const sorted = sortCategoryNamesByOrder(names);
 * // Result: ['Foundation Work', 'Punch List', 'Handing Over']
 * ```
 */
export function sortCategoryNamesByOrder(categoryNames: string[]): string[] {
  return [...categoryNames].sort((a, b) => {
    const indexA = getCategorySortIndex(a);
    const indexB = getCategorySortIndex(b);
    return indexA - indexB;
  });
}

/**
 * Check if a category name is in the predefined order list
 */
export function isKnownCategory(categoryName: string): boolean {
  return CATEGORY_ORDER.includes(categoryName as any);
}

/**
 * Get the display index for a category (1-based for UI display)
 */
export function getCategoryDisplayIndex(categoryName: string): number {
  const index = getCategorySortIndex(categoryName);
  return index === 999 ? 0 : index + 1; // Return 0 for unknown categories
}
