/**
 * Key Dates State Management
 *
 * @version 1.0.0
 * @since Phase 5b - Key Dates UI
 */

export {
  keyDateReducer,
  createKeyDateInitialState,
  selectIsEditing,
  selectHasActiveFilters,
  validateKeyDateForm,
  validateProgressForm,
} from './keyDateReducer';

export type {
  KeyDateManagementState,
  KeyDateManagementAction,
} from './keyDateReducer';
