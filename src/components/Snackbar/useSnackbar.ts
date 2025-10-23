/**
 * useSnackbar Hook
 * Custom hook to access Snackbar context from any component
 */

import { useContext } from 'react';
import { SnackbarContext } from './SnackbarProvider';
import { SnackbarContextValue } from './types';

export const useSnackbar = (): SnackbarContextValue => {
  const context = useContext(SnackbarContext);

  if (context === undefined) {
    throw new Error('useSnackbar must be used within a SnackbarProvider');
  }

  return context;
};
