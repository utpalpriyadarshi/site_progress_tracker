/**
 * Error Boundary Component
 *
 * Catches React errors and provides graceful error handling
 * with recovery options and error reporting.
 *
 * Week 9 - Performance & Polish
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { logger } from '../../services/LoggingService';

// ============================================================================
// Types
// ============================================================================

interface ErrorBoundaryProps {
  /**
   * Children components to render
   */
  children: ReactNode;

  /**
   * Fallback UI to render on error
   */
  fallback?: (error: Error, retry: () => void) => ReactNode;

  /**
   * Callback when error is caught
   */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;

  /**
   * Error boundary name for logging
   */
  name?: string;

  /**
   * Show detailed error in development
   */
  showDetails?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

// ============================================================================
// Error Boundary Component
// ============================================================================

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const { onError, name } = this.props;

    // Log error to LoggingService
    logger.error(`Error caught by ${name || 'ErrorBoundary'}`, error, {
      component: name || 'ErrorBoundary',
      action: 'componentDidCatch',
      componentStack: errorInfo.componentStack,
    });

    // Update state with error info
    this.setState({
      errorInfo,
    });

    // Call error callback if provided
    if (onError) {
      onError(error, errorInfo);
    }
  }

  handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    const { hasError, error, errorInfo } = this.state;
    const { children, fallback, showDetails = __DEV__ } = this.props;

    if (hasError && error) {
      // Render custom fallback if provided
      if (fallback) {
        return fallback(error, this.handleRetry);
      }

      // Render default error UI
      return (
        <View style={styles.errorContainer} accessible={true} accessibilityRole="alert">
          <View style={styles.errorContent}>
            <Text style={styles.errorIcon} accessibilityLabel="Error icon">
              ⚠️
            </Text>

            <Text style={styles.errorTitle}>Something went wrong</Text>

            <Text style={styles.errorMessage}>
              We encountered an unexpected error. Please try again or contact support if the problem
              persists.
            </Text>

            {showDetails && (
              <ScrollView style={styles.errorDetailsContainer}>
                <Text style={styles.errorDetailsTitle}>Error Details:</Text>
                <Text style={styles.errorDetailsText}>{error.toString()}</Text>

                {errorInfo && (
                  <>
                    <Text style={styles.errorDetailsTitle}>Component Stack:</Text>
                    <Text style={styles.errorDetailsText}>{errorInfo.componentStack}</Text>
                  </>
                )}
              </ScrollView>
            )}

            <TouchableOpacity
              style={styles.retryButton}
              onPress={this.handleRetry}
              accessible={true}
              accessibilityLabel="Retry"
              accessibilityRole="button"
            >
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return children;
  }
}

// ============================================================================
// Error Display Component
// ============================================================================

interface ErrorDisplayProps {
  /**
   * Error to display
   */
  error?: Error | string | null;

  /**
   * Error title
   */
  title?: string;

  /**
   * Retry callback
   */
  onRetry?: () => void;

  /**
   * Custom style
   */
  style?: any;

  /**
   * Show detailed error
   */
  showDetails?: boolean;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  title = 'Error',
  onRetry,
  style,
  showDetails = false,
}) => {
  if (!error) {
    return null;
  }

  const errorMessage = typeof error === 'string' ? error : error.message;

  return (
    <View style={[styles.errorDisplay, style]} accessible={true} accessibilityRole="alert">
      <Text style={styles.errorDisplayIcon}>⚠️</Text>
      <Text style={styles.errorDisplayTitle}>{title}</Text>
      <Text style={styles.errorDisplayMessage}>{errorMessage}</Text>

      {showDetails && typeof error !== 'string' && (
        <Text style={styles.errorDisplayDetails}>{error.stack}</Text>
      )}

      {onRetry && (
        <TouchableOpacity
          style={styles.errorRetryButton}
          onPress={onRetry}
          accessible={true}
          accessibilityLabel="Retry"
          accessibilityRole="button"
        >
          <Text style={styles.errorRetryButtonText}>Retry</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// ============================================================================
// Empty State Component
// ============================================================================

interface EmptyStateProps {
  /**
   * Icon or emoji to display
   */
  icon?: string;

  /**
   * Title text
   */
  title: string;

  /**
   * Description text
   */
  description?: string;

  /**
   * Action button text
   */
  actionText?: string;

  /**
   * Action callback
   */
  onAction?: () => void;

  /**
   * Custom style
   */
  style?: any;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = '📭',
  title,
  description,
  actionText,
  onAction,
  style,
}) => {
  return (
    <View style={[styles.emptyStateContainer, style]} accessible={true}>
      <Text style={styles.emptyStateIcon} accessibilityLabel={`${icon} icon`}>
        {icon}
      </Text>
      <Text style={styles.emptyStateTitle}>{title}</Text>
      {description && <Text style={styles.emptyStateDescription}>{description}</Text>}

      {actionText && onAction && (
        <TouchableOpacity
          style={styles.emptyStateButton}
          onPress={onAction}
          accessible={true}
          accessibilityLabel={actionText}
          accessibilityRole="button"
        >
          <Text style={styles.emptyStateButtonText}>{actionText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorContent: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 24,
    maxWidth: 500,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  errorDetailsContainer: {
    width: '100%',
    maxHeight: 200,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
    padding: 12,
    marginBottom: 20,
  },
  errorDetailsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 8,
  },
  errorDetailsText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  errorDisplay: {
    backgroundColor: '#FFF3CD',
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
    borderRadius: 8,
    padding: 16,
    marginVertical: 8,
  },
  errorDisplayIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  errorDisplayTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#856404',
    marginBottom: 8,
  },
  errorDisplayMessage: {
    fontSize: 14,
    color: '#856404',
    marginBottom: 8,
  },
  errorDisplayDetails: {
    fontSize: 12,
    color: '#856404',
    fontFamily: 'monospace',
    marginTop: 8,
  },
  errorRetryButton: {
    backgroundColor: '#FFC107',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  errorRetryButtonText: {
    color: '#856404',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  emptyStateButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

// ============================================================================
// Export
// ============================================================================

export default ErrorBoundary;
