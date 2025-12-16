import { useReducer, useCallback } from 'react';
import { InspectionType, OverallRating, InspectionFormData } from '../types';
import { ChecklistItem } from '../../../hooks/useChecklist';

/**
 * Default safety checklist template
 */
const DEFAULT_CHECKLIST: ChecklistItem[] = [
  // PPE & Safety Equipment
  { id: '1', category: 'PPE & Safety Equipment', item: 'Hard hats worn by all workers', status: 'na', notes: '' },
  { id: '2', category: 'PPE & Safety Equipment', item: 'Safety boots in good condition', status: 'na', notes: '' },
  { id: '3', category: 'PPE & Safety Equipment', item: 'High-visibility vests worn', status: 'na', notes: '' },
  { id: '4', category: 'PPE & Safety Equipment', item: 'Safety glasses/goggles available', status: 'na', notes: '' },
  { id: '5', category: 'PPE & Safety Equipment', item: 'Gloves appropriate for tasks', status: 'na', notes: '' },

  // Scaffolding & Work at Height
  { id: '6', category: 'Scaffolding & Work at Height', item: 'Scaffolding properly erected and tagged', status: 'na', notes: '' },
  { id: '7', category: 'Scaffolding & Work at Height', item: 'Fall protection systems in place', status: 'na', notes: '' },
  { id: '8', category: 'Scaffolding & Work at Height', item: 'Ladders in good condition', status: 'na', notes: '' },
  { id: '9', category: 'Scaffolding & Work at Height', item: 'Edge protection adequate', status: 'na', notes: '' },

  // Equipment & Tools
  { id: '10', category: 'Equipment & Tools', item: 'Power tools properly guarded', status: 'na', notes: '' },
  { id: '11', category: 'Equipment & Tools', item: 'Equipment inspected and tagged', status: 'na', notes: '' },
  { id: '12', category: 'Equipment & Tools', item: 'Electrical cords in good condition', status: 'na', notes: '' },
  { id: '13', category: 'Equipment & Tools', item: 'Machinery properly maintained', status: 'na', notes: '' },

  // Fire Safety & Emergency
  { id: '14', category: 'Fire Safety & Emergency', item: 'Fire extinguishers accessible', status: 'na', notes: '' },
  { id: '15', category: 'Fire Safety & Emergency', item: 'Emergency exits clearly marked', status: 'na', notes: '' },
  { id: '16', category: 'Fire Safety & Emergency', item: 'First aid kit available', status: 'na', notes: '' },
  { id: '17', category: 'Fire Safety & Emergency', item: 'Emergency contact numbers posted', status: 'na', notes: '' },

  // Housekeeping & Site Conditions
  { id: '18', category: 'Housekeeping & Site Conditions', item: 'Work area clean and organized', status: 'na', notes: '' },
  { id: '19', category: 'Housekeeping & Site Conditions', item: 'Materials properly stored', status: 'na', notes: '' },
  { id: '20', category: 'Housekeeping & Site Conditions', item: 'Waste disposal adequate', status: 'na', notes: '' },
  { id: '21', category: 'Housekeeping & Site Conditions', item: 'Walkways clear of obstructions', status: 'na', notes: '' },
];

/**
 * Form state interface
 */
interface InspectionFormState {
  inspectionType: InspectionType;
  overallRating: OverallRating;
  safetyFlagged: boolean;
  notes: string;
  followUpRequired: boolean;
  followUpDate: string;
  followUpNotes: string;
}

/**
 * Form action types
 */
type InspectionFormAction =
  | { type: 'SET_INSPECTION_TYPE'; payload: InspectionType }
  | { type: 'SET_RATING'; payload: OverallRating }
  | { type: 'SET_SAFETY_FLAGGED'; payload: boolean }
  | { type: 'SET_NOTES'; payload: string }
  | { type: 'SET_FOLLOW_UP_REQUIRED'; payload: boolean }
  | { type: 'SET_FOLLOW_UP_DATE'; payload: string }
  | { type: 'SET_FOLLOW_UP_NOTES'; payload: string }
  | { type: 'RESET_FORM' }
  | { type: 'POPULATE_FORM'; payload: InspectionFormState };

/**
 * Initial form state
 */
const initialState: InspectionFormState = {
  inspectionType: 'daily',
  overallRating: 'good',
  safetyFlagged: false,
  notes: '',
  followUpRequired: false,
  followUpDate: '',
  followUpNotes: '',
};

/**
 * Form reducer
 */
function formReducer(
  state: InspectionFormState,
  action: InspectionFormAction
): InspectionFormState {
  switch (action.type) {
    case 'SET_INSPECTION_TYPE':
      return { ...state, inspectionType: action.payload };
    case 'SET_RATING':
      return { ...state, overallRating: action.payload };
    case 'SET_SAFETY_FLAGGED':
      return { ...state, safetyFlagged: action.payload };
    case 'SET_NOTES':
      return { ...state, notes: action.payload };
    case 'SET_FOLLOW_UP_REQUIRED':
      // Clear follow-up data when disabled
      return {
        ...state,
        followUpRequired: action.payload,
        followUpDate: action.payload ? state.followUpDate : '',
        followUpNotes: action.payload ? state.followUpNotes : '',
      };
    case 'SET_FOLLOW_UP_DATE':
      return { ...state, followUpDate: action.payload };
    case 'SET_FOLLOW_UP_NOTES':
      return { ...state, followUpNotes: action.payload };
    case 'RESET_FORM':
      return initialState;
    case 'POPULATE_FORM':
      return action.payload;
    default:
      return state;
  }
}

/**
 * Hook return type
 */
export interface UseInspectionFormReturn {
  // State
  inspectionType: InspectionType;
  overallRating: OverallRating;
  safetyFlagged: boolean;
  notes: string;
  followUpRequired: boolean;
  followUpDate: string;
  followUpNotes: string;

  // Actions
  setInspectionType: (type: InspectionType) => void;
  setOverallRating: (rating: OverallRating) => void;
  setSafetyFlagged: (flagged: boolean) => void;
  setNotes: (notes: string) => void;
  setFollowUpRequired: (required: boolean) => void;
  setFollowUpDate: (date: string) => void;
  setFollowUpNotes: (notes: string) => void;
  resetForm: () => void;
  populateForm: (data: InspectionFormState) => void;

  // Utilities
  getFormData: () => InspectionFormData;
  defaultChecklist: ChecklistItem[];
}

/**
 * Custom hook for managing inspection form state
 *
 * Uses useReducer for efficient state management of 7+ form fields.
 * Automatically clears follow-up data when follow-up is disabled.
 *
 * @returns Form state and actions
 *
 * @example
 * ```tsx
 * const {
 *   inspectionType,
 *   setInspectionType,
 *   resetForm,
 *   getFormData,
 * } = useInspectionForm();
 * ```
 */
export function useInspectionForm(): UseInspectionFormReturn {
  const [state, dispatch] = useReducer(formReducer, initialState);

  const setInspectionType = useCallback((type: InspectionType) => {
    dispatch({ type: 'SET_INSPECTION_TYPE', payload: type });
  }, []);

  const setOverallRating = useCallback((rating: OverallRating) => {
    dispatch({ type: 'SET_RATING', payload: rating });
  }, []);

  const setSafetyFlagged = useCallback((flagged: boolean) => {
    dispatch({ type: 'SET_SAFETY_FLAGGED', payload: flagged });
  }, []);

  const setNotes = useCallback((notes: string) => {
    dispatch({ type: 'SET_NOTES', payload: notes });
  }, []);

  const setFollowUpRequired = useCallback((required: boolean) => {
    dispatch({ type: 'SET_FOLLOW_UP_REQUIRED', payload: required });
  }, []);

  const setFollowUpDate = useCallback((date: string) => {
    dispatch({ type: 'SET_FOLLOW_UP_DATE', payload: date });
  }, []);

  const setFollowUpNotes = useCallback((notes: string) => {
    dispatch({ type: 'SET_FOLLOW_UP_NOTES', payload: notes });
  }, []);

  const resetForm = useCallback(() => {
    dispatch({ type: 'RESET_FORM' });
  }, []);

  const populateForm = useCallback((data: InspectionFormState) => {
    dispatch({ type: 'POPULATE_FORM', payload: data });
  }, []);

  const getFormData = useCallback((): InspectionFormData => {
    return {
      inspectionType: state.inspectionType,
      overallRating: state.overallRating,
      safetyFlagged: state.safetyFlagged,
      notes: state.notes,
      checklistData: [], // Managed separately
      photos: [], // Managed separately
      followUpRequired: state.followUpRequired,
      followUpDate: state.followUpDate,
      followUpNotes: state.followUpNotes,
    };
  }, [state]);

  return {
    // State
    inspectionType: state.inspectionType,
    overallRating: state.overallRating,
    safetyFlagged: state.safetyFlagged,
    notes: state.notes,
    followUpRequired: state.followUpRequired,
    followUpDate: state.followUpDate,
    followUpNotes: state.followUpNotes,

    // Actions
    setInspectionType,
    setOverallRating,
    setSafetyFlagged,
    setNotes,
    setFollowUpRequired,
    setFollowUpDate,
    setFollowUpNotes,
    resetForm,
    populateForm,

    // Utilities
    getFormData,
    defaultChecklist: DEFAULT_CHECKLIST,
  };
}
