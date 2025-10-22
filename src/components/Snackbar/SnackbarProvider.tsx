/**
 * SnackbarProvider - Global Snackbar Context Provider
 * Manages snackbar queue and state across the app
 */

import React, { createContext, useState, useCallback, useEffect } from 'react';
import { Snackbar } from 'react-native-paper';
import { StyleSheet } from 'react-native';
import {
  SnackbarContextValue,
  SnackbarMessage,
  SnackbarProviderProps,
  SnackbarType,
  SnackbarAction,
} from './types';

export const SnackbarContext = createContext<SnackbarContextValue | undefined>(
  undefined
);

export const SnackbarProvider: React.FC<SnackbarProviderProps> = ({
  children,
}) => {
  const [queue, setQueue] = useState<SnackbarMessage[]>([]);
  const [current, setCurrent] = useState<SnackbarMessage | null>(null);
  const [visible, setVisible] = useState(false);

  // Default durations by type (in milliseconds)
  const getDefaultDuration = (type: SnackbarType): number => {
    switch (type) {
      case 'success':
        return 4000; // 4 seconds
      case 'error':
        return 6000; // 6 seconds (longer to read error)
      case 'warning':
        return 5000; // 5 seconds
      case 'info':
        return 5000; // 5 seconds
      default:
        return 4000;
    }
  };

  // Get background color based on snackbar type
  const getBackgroundColor = (type: SnackbarType): string => {
    switch (type) {
      case 'success':
        return '#4CAF50'; // Green
      case 'error':
        return '#F44336'; // Red
      case 'warning':
        return '#FF9800'; // Orange
      case 'info':
        return '#2196F3'; // Blue
      default:
        return '#323232'; // Default dark gray
    }
  };

  // Show next message from queue
  const showNext = useCallback(() => {
    if (queue.length > 0) {
      const [next, ...rest] = queue;
      setCurrent(next);
      setQueue(rest);
      setVisible(true);
    } else {
      setCurrent(null);
      setVisible(false);
    }
  }, [queue]);

  // Auto-dismiss and show next after duration
  useEffect(() => {
    if (current && visible) {
      const duration = current.duration || getDefaultDuration(current.type);
      const timer = setTimeout(() => {
        setVisible(false);
        // After animation completes, show next
        setTimeout(showNext, 300);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [current, visible, showNext]);

  // Add message to queue
  const showSnackbar = useCallback(
    (
      message: string,
      type: SnackbarType = 'info',
      action?: SnackbarAction,
      duration?: number
    ) => {
      const newMessage: SnackbarMessage = {
        id: Date.now().toString(),
        message,
        type,
        action,
        duration,
      };

      if (!current) {
        // No message showing, show immediately
        setCurrent(newMessage);
        setVisible(true);
      } else {
        // Add to queue
        setQueue((prev) => [...prev, newMessage]);
      }
    },
    [current]
  );

  // Manually hide current snackbar
  const hideSnackbar = useCallback(() => {
    setVisible(false);
    setTimeout(showNext, 300);
  }, [showNext]);

  const contextValue: SnackbarContextValue = {
    showSnackbar,
    hideSnackbar,
  };

  return (
    <SnackbarContext.Provider value={contextValue}>
      {children}
      <Snackbar
        visible={visible}
        onDismiss={hideSnackbar}
        duration={current?.duration || getDefaultDuration(current?.type || 'info')}
        action={
          current?.action
            ? {
                label: current.action.label,
                onPress: () => {
                  current.action?.onPress();
                  hideSnackbar();
                },
              }
            : undefined
        }
        style={[
          styles.snackbar,
          current && { backgroundColor: getBackgroundColor(current.type) },
        ]}
        theme={{ colors: { surface: 'white', onSurface: 'white' } }}
      >
        {current?.message || ''}
      </Snackbar>
    </SnackbarContext.Provider>
  );
};

const styles = StyleSheet.create({
  snackbar: {
    marginBottom: 60, // Increased from 20 to avoid covering bottom navigation tabs
  },
});
