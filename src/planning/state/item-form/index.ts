/**
 * Item Form State Management
 * Barrel export for item creation and edit reducers
 */

export {
  itemCreationReducer,
  createInitialState as createItemCreationInitialState,
  validateItemForm,
  type ItemCreationState,
  type ItemCreationAction,
  type ItemFormData,
} from './itemCreationReducer';

export {
  itemEditReducer,
  createInitialState as createItemEditInitialState,
  validateItemEditForm,
  calculateProgress,
  type ItemEditState,
  type ItemEditAction,
  type ItemEditFormData,
} from './itemEditReducer';
