/**
 * Item Creation Components - Barrel Export
 *
 * Components unique to item creation are exported directly.
 * Shared components (ScheduleSection, QuantitySection, etc.) are re-exported
 * from the shared ItemFormSections module.
 *
 * @since Phase 3 Code Improvements
 */

// Components unique to item creation
export { WBSCodeDisplay } from './WBSCodeDisplay';
export { ItemDetailsSection } from './ItemDetailsSection';
export { CategorySection } from './CategorySection';
export { PhaseSection } from './PhaseSection';

// Re-export shared components for backward compatibility
export {
  ScheduleSection,
  QuantitySection,
  CriticalPathSection,
  RiskSection,
  KeyDateSection,
} from '../../shared/components/ItemFormSections';
