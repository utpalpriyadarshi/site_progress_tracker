import UserModel from '../../../../models/UserModel';

/**
 * User Form Data interface
 */
export interface UserFormData {
  username: string;
  password: string;
  fullName: string;
  email: string;
  phone: string;
  roleId: string;
  projectId: string;
  isActive: boolean;
}

/**
 * User Management State interface
 *
 * Consolidates all state for user/role management:
 * - UI state (dialogs, menus)
 * - Data state (editing user, user to delete)
 * - Form state (all form fields)
 */
export interface UserManagementState {
  ui: {
    modalVisible: boolean;
    roleMenuVisible: boolean;
    projectMenuVisible: boolean;
    showDeleteDialog: boolean;
  };
  data: {
    editingUser: UserModel | null;
    userToDelete: UserModel | null;
  };
  form: UserFormData;
}

/**
 * User Management Actions
 *
 * Discriminated union of all possible actions for user management
 */
export type UserManagementAction =
  | { type: 'OPEN_CREATE_MODAL'; payload: { defaultRoleId: string } }
  | { type: 'OPEN_EDIT_MODAL'; payload: { user: UserModel } }
  | { type: 'CLOSE_MODAL' }
  | { type: 'UPDATE_FORM_FIELD'; payload: { field: keyof UserFormData; value: any } }
  | { type: 'UPDATE_FORM_DATA'; payload: Partial<UserFormData> }
  | { type: 'TOGGLE_ROLE_MENU' }
  | { type: 'TOGGLE_PROJECT_MENU' }
  | { type: 'OPEN_DELETE_DIALOG'; payload: { user: UserModel } }
  | { type: 'CLOSE_DELETE_DIALOG' }
  | { type: 'RESET_FORM'; payload: { defaultRoleId: string } };

/**
 * Initial state factory
 * Creates the initial state with default values
 */
export const createInitialState = (defaultRoleId: string): UserManagementState => ({
  ui: {
    modalVisible: false,
    roleMenuVisible: false,
    projectMenuVisible: false,
    showDeleteDialog: false,
  },
  data: {
    editingUser: null,
    userToDelete: null,
  },
  form: {
    username: '',
    password: '',
    fullName: '',
    email: '',
    phone: '',
    roleId: defaultRoleId,
    projectId: '',
    isActive: true,
  },
});

/**
 * User Management Reducer
 *
 * Handles all state transitions for user/role management
 * Follows the pattern from Manager/Logistics/Commercial reducers
 */
export const userManagementReducer = (
  state: UserManagementState,
  action: UserManagementAction
): UserManagementState => {
  switch (action.type) {
    case 'OPEN_CREATE_MODAL':
      return {
        ...state,
        ui: {
          ...state.ui,
          modalVisible: true,
        },
        data: {
          ...state.data,
          editingUser: null,
        },
        form: {
          username: '',
          password: '',
          fullName: '',
          email: '',
          phone: '',
          roleId: action.payload.defaultRoleId,
          projectId: '',
          isActive: true,
        },
      };

    case 'OPEN_EDIT_MODAL':
      return {
        ...state,
        ui: {
          ...state.ui,
          modalVisible: true,
        },
        data: {
          ...state.data,
          editingUser: action.payload.user,
        },
        form: {
          username: action.payload.user.username,
          password: '',
          fullName: action.payload.user.fullName,
          email: action.payload.user.email || '',
          phone: action.payload.user.phone || '',
          roleId: action.payload.user.roleId,
          projectId: action.payload.user.projectId || '',
          isActive: action.payload.user.isActive,
        },
      };

    case 'CLOSE_MODAL':
      return {
        ...state,
        ui: {
          ...state.ui,
          modalVisible: false,
          roleMenuVisible: false,
          projectMenuVisible: false,
        },
      };

    case 'UPDATE_FORM_FIELD':
      return {
        ...state,
        form: {
          ...state.form,
          [action.payload.field]: action.payload.value,
        },
      };

    case 'UPDATE_FORM_DATA':
      return {
        ...state,
        form: {
          ...state.form,
          ...action.payload,
        },
      };

    case 'TOGGLE_ROLE_MENU':
      return {
        ...state,
        ui: {
          ...state.ui,
          roleMenuVisible: !state.ui.roleMenuVisible,
          projectMenuVisible: false, // Close project menu when opening role menu
        },
      };

    case 'TOGGLE_PROJECT_MENU':
      return {
        ...state,
        ui: {
          ...state.ui,
          projectMenuVisible: !state.ui.projectMenuVisible,
          roleMenuVisible: false, // Close role menu when opening project menu
        },
      };

    case 'OPEN_DELETE_DIALOG':
      return {
        ...state,
        ui: {
          ...state.ui,
          showDeleteDialog: true,
        },
        data: {
          ...state.data,
          userToDelete: action.payload.user,
        },
      };

    case 'CLOSE_DELETE_DIALOG':
      return {
        ...state,
        ui: {
          ...state.ui,
          showDeleteDialog: false,
        },
        data: {
          ...state.data,
          userToDelete: null,
        },
      };

    case 'RESET_FORM':
      return {
        ...state,
        form: {
          username: '',
          password: '',
          fullName: '',
          email: '',
          phone: '',
          roleId: action.payload.defaultRoleId,
          projectId: '',
          isActive: true,
        },
      };

    default:
      return state;
  }
};
