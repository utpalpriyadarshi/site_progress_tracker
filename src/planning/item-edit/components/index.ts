/**
 * Item Edit Components - Barrel Export
 *
 * Components unique to item edit are exported directly.
 * Shared components (ScheduleSection, QuantitySection, etc.) are re-exported
 * from the shared ItemFormSections module.
 *
 * @since Phase 3 Code Improvements
 */

// Components unique to item edit
export { LockedBanner } from './LockedBanner';
export { WBSCodeDisplay } from './WBSCodeDisplay';
export { ItemDetailsSection } from './ItemDetailsSection';
export { ItemInfoCard } from './ItemInfoCard';

// Re-export shared components for backward compatibility
export {
  ScheduleSection,
  QuantitySection,
  CriticalPathSection,
  RiskSection,
  KeyDateSection,
} from '../../shared/components/ItemFormSections';
