/**
 * Gantt Chart State Management
 *
 * Consolidates state from:
 * - GanttChartScreen (selectedSite, zoomLevel, activeSubTab)
 * - useGanttData hook (items, loading)
 *
 * Reduction: 4 useState → 1 useReducer (75% reduction)
 */

import SiteModel from '../../../../models/SiteModel';
import ItemModel from '../../../../models/ItemModel';

export type ZoomLevel = 'day' | 'week' | 'month';
export type GanttSubTab = 'tasks' | 'key_dates';

export interface GanttChartState {
  ui: {
    loading: boolean;
  };
  selection: {
    selectedSite: SiteModel | null;
    zoomLevel: ZoomLevel;
    activeSubTab: GanttSubTab;
  };
  data: {
    items: ItemModel[];
  };
}

export type GanttChartAction =
  // Selection actions
  | { type: 'SET_SELECTED_SITE'; payload: { site: SiteModel | null } }
  | { type: 'SET_ZOOM_LEVEL'; payload: { zoomLevel: ZoomLevel } }
  | { type: 'SET_SUB_TAB'; payload: { tab: GanttSubTab } }

  // Data loading actions
  | { type: 'START_LOADING' }
  | { type: 'SET_ITEMS'; payload: { items: ItemModel[] } }
  | { type: 'LOADING_ERROR' };

/**
 * Create initial state for Gantt chart
 */
export const createInitialState = (): GanttChartState => ({
  ui: {
    loading: false,
  },
  selection: {
    selectedSite: null,
    zoomLevel: 'week',
    activeSubTab: 'tasks',
  },
  data: {
    items: [],
  },
});

/**
 * Gantt Chart Reducer
 */
export const ganttChartReducer = (
  state: GanttChartState,
  action: GanttChartAction
): GanttChartState => {
  switch (action.type) {
    // Selection actions
    case 'SET_SELECTED_SITE':
      return {
        ...state,
        selection: {
          ...state.selection,
          selectedSite: action.payload.site,
        },
        // Clear items when site changes
        data: {
          items: [],
        },
      };

    case 'SET_ZOOM_LEVEL':
      return {
        ...state,
        selection: {
          ...state.selection,
          zoomLevel: action.payload.zoomLevel,
        },
      };

    case 'SET_SUB_TAB':
      return {
        ...state,
        selection: {
          ...state.selection,
          activeSubTab: action.payload.tab,
        },
      };

    // Data loading actions
    case 'START_LOADING':
      return {
        ...state,
        ui: {
          ...state.ui,
          loading: true,
        },
      };

    case 'SET_ITEMS':
      return {
        ...state,
        ui: {
          ...state.ui,
          loading: false,
        },
        data: {
          items: action.payload.items,
        },
      };

    case 'LOADING_ERROR':
      return {
        ...state,
        ui: {
          ...state.ui,
          loading: false,
        },
        data: {
          items: [],
        },
      };

    default:
      return state;
  }
};
