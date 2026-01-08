/**
 * Dashboard Stats interface
 */
export interface DashboardStats {
  totalProjects: number;
  totalSites: number;
  totalUsers: number;
  totalItems: number;
}

/**
 * Migration Status interface
 */
export interface MigrationStatus {
  totalUsers: number;
  migratedUsers: number;
  pendingUsers: number;
  percentComplete: number;
}

/**
 * Admin Dashboard State interface
 *
 * Consolidates all state for admin dashboard:
 * - UI state (menu visibility)
 * - Stats state (dashboard statistics)
 * - Migrations state (password and category migrations)
 */
export interface AdminDashboardState {
  ui: {
    roleSwitcherMenuVisible: boolean;
  };
  stats: DashboardStats;
  migrations: {
    password: {
      status: MigrationStatus;
      inProgress: boolean;
    };
    category: {
      inProgress: boolean;
    };
  };
}

/**
 * Admin Dashboard Actions
 *
 * Discriminated union of all possible actions for admin dashboard
 */
export type AdminDashboardAction =
  // UI Actions
  | { type: 'TOGGLE_ROLE_SWITCHER_MENU' }
  | { type: 'CLOSE_ROLE_SWITCHER_MENU' }
  // Stats Actions
  | { type: 'SET_STATS'; payload: DashboardStats }
  | { type: 'RESET_STATS' }
  // Password Migration Actions
  | { type: 'SET_PASSWORD_MIGRATION_STATUS'; payload: MigrationStatus }
  | { type: 'START_PASSWORD_MIGRATION' }
  | { type: 'COMPLETE_PASSWORD_MIGRATION' }
  // Category Migration Actions
  | { type: 'START_CATEGORY_MIGRATION' }
  | { type: 'COMPLETE_CATEGORY_MIGRATION' };

/**
 * Initial state factory
 * Creates the initial state with default values
 */
export const createInitialState = (): AdminDashboardState => ({
  ui: {
    roleSwitcherMenuVisible: false,
  },
  stats: {
    totalProjects: 0,
    totalSites: 0,
    totalUsers: 0,
    totalItems: 0,
  },
  migrations: {
    password: {
      status: {
        totalUsers: 0,
        migratedUsers: 0,
        pendingUsers: 0,
        percentComplete: 0,
      },
      inProgress: false,
    },
    category: {
      inProgress: false,
    },
  },
});

/**
 * Admin Dashboard Reducer
 *
 * Handles all state transitions for admin dashboard
 * Follows the pattern from Manager/Logistics/Commercial reducers
 */
export const adminDashboardReducer = (
  state: AdminDashboardState,
  action: AdminDashboardAction
): AdminDashboardState => {
  switch (action.type) {
    // UI Actions
    case 'TOGGLE_ROLE_SWITCHER_MENU':
      return {
        ...state,
        ui: {
          ...state.ui,
          roleSwitcherMenuVisible: !state.ui.roleSwitcherMenuVisible,
        },
      };

    case 'CLOSE_ROLE_SWITCHER_MENU':
      return {
        ...state,
        ui: {
          ...state.ui,
          roleSwitcherMenuVisible: false,
        },
      };

    // Stats Actions
    case 'SET_STATS':
      return {
        ...state,
        stats: action.payload,
      };

    case 'RESET_STATS':
      return {
        ...state,
        stats: {
          totalProjects: 0,
          totalSites: 0,
          totalUsers: 0,
          totalItems: 0,
        },
      };

    // Password Migration Actions
    case 'SET_PASSWORD_MIGRATION_STATUS':
      return {
        ...state,
        migrations: {
          ...state.migrations,
          password: {
            ...state.migrations.password,
            status: action.payload,
          },
        },
      };

    case 'START_PASSWORD_MIGRATION':
      return {
        ...state,
        migrations: {
          ...state.migrations,
          password: {
            ...state.migrations.password,
            inProgress: true,
          },
        },
      };

    case 'COMPLETE_PASSWORD_MIGRATION':
      return {
        ...state,
        migrations: {
          ...state.migrations,
          password: {
            ...state.migrations.password,
            inProgress: false,
          },
        },
      };

    // Category Migration Actions
    case 'START_CATEGORY_MIGRATION':
      return {
        ...state,
        migrations: {
          ...state.migrations,
          category: {
            inProgress: true,
          },
        },
      };

    case 'COMPLETE_CATEGORY_MIGRATION':
      return {
        ...state,
        migrations: {
          ...state.migrations,
          category: {
            inProgress: false,
          },
        },
      };

    default:
      return state;
  }
};
