/**
 * Snackbar Types and Interfaces
 * Used for non-blocking notification system
 */

export type SnackbarType = 'success' | 'error' | 'warning' | 'info';

export interface SnackbarAction {
  label: string;
  onPress: () => void;
}

export interface SnackbarMessage {
  id: string;
  message: string;
  type: SnackbarType;
  duration?: number;
  action?: SnackbarAction;
}

export interface SnackbarContextValue {
  showSnackbar: (
    message: string,
    type?: SnackbarType,
    action?: SnackbarAction,
    duration?: number
  ) => void;
  hideSnackbar: () => void;
}

export interface SnackbarProviderProps {
  children: React.ReactNode;
}
