/**
 * EmptyState Component (Enhanced)
 *
 * Displays empty state with icon, title, message, and optional actions
 * Used when lists or screens have no data to display
 *
 * Features:
 * - Large icon display with subtle background circle
 * - Fade-in animation for smooth appearance
 * - Title and message text with better typography
 * - Optional primary and secondary actions
 * - Multiple variants (default, search, error, large, compact)
 * - Contextual help text and tips
 * - Customizable styling
 *
 * @example
 * ```tsx
 * <EmptyState
 *   icon="inbox"
 *   title="No Reports Yet"
 *   message="Create your first daily report to get started"
 *   helpText="Daily reports track your work progress and help generate site documentation."
 *   actionText="Create Report"
 *   onAction={() => openCreateDialog()}
 *   variant="large"
 * />
 * ```
 *
 * @version 2.0 - Phase 3, Task 3.3 (Enhanced)
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Text, Button, useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// ==================== Types ====================

export type EmptyStateVariant = 'default' | 'search' | 'error' | 'large' | 'compact';

export interface EmptyStateProps {
  /** Icon name (MaterialCommunityIcons) */
  icon: string;

  /** Main title text */
  title: string;

  /** Descriptive message */
  message: string;

  /** Optional contextual help text (appears below message) */
  helpText?: string;

  /** Optional tips array (bullet points) */
  tips?: string[];

  /** Optional primary action button text */
  actionText?: string;

  /** Optional primary action button callback */
  onAction?: () => void;

  /** Optional secondary action text (link style) */
  secondaryActionText?: string;

  /** Optional secondary action callback */
  onSecondaryAction?: () => void;

  /** Variant style (default: 'default') */
  variant?: EmptyStateVariant;

  /** Icon size (auto-calculated based on variant if not provided) */
  iconSize?: number;

  /** Icon color (auto-calculated based on variant if not provided) */
  iconColor?: string;

  /** Custom container style */
  containerStyle?: any;

  /** Disable fade-in animation */
  disableAnimation?: boolean;
}

// ==================== Component ====================

/**
 * EmptyState Component (Enhanced)
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  message,
  helpText,
  tips,
  actionText,
  onAction,
  secondaryActionText,
  onSecondaryAction,
  variant = 'default',
  iconSize,
  iconColor,
  containerStyle,
  disableAnimation = false,
}) => {
  const theme = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  // Calculate sizes and colors based on variant
  const calculatedIconSize = iconSize || getIconSize(variant);
  const calculatedIconColor = iconColor || getIconColor(variant, theme);
  const iconBackgroundColor = getIconBackgroundColor(variant, theme);

  // Fade-in animation on mount
  useEffect(() => {
    if (!disableAnimation) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(1);
      scaleAnim.setValue(1);
    }
  }, [disableAnimation, fadeAnim, scaleAnim]);

  return (
    <Animated.View
      style={[
        styles.container,
        getContainerStyle(variant),
        containerStyle,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      {/* Icon with background circle */}
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: iconBackgroundColor,
            width: calculatedIconSize * 1.8,
            height: calculatedIconSize * 1.8,
            borderRadius: calculatedIconSize * 0.9,
          },
        ]}
      >
        <Icon name={icon} size={calculatedIconSize} color={calculatedIconColor} />
      </View>

      {/* Title */}
      <Text
        variant={variant === 'large' ? 'headlineMedium' : 'headlineSmall'}
        style={styles.title}
      >
        {title}
      </Text>

      {/* Message */}
      <Text
        variant={variant === 'compact' ? 'bodyMedium' : 'bodyLarge'}
        style={[styles.message, variant === 'compact' && styles.compactMessage]}
      >
        {message}
      </Text>

      {/* Help Text */}
      {helpText && (
        <Text variant="bodySmall" style={styles.helpText}>
          {helpText}
        </Text>
      )}

      {/* Tips (bullet points) */}
      {tips && tips.length > 0 && (
        <View style={styles.tipsContainer}>
          {tips.map((tip, index) => (
            <View key={index} style={styles.tipItem}>
              <Icon
                name="information-outline"
                size={16}
                color={theme.colors.primary}
                style={styles.tipIcon}
              />
              <Text variant="bodySmall" style={styles.tipText}>
                {tip}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Actions */}
      <View style={styles.actionsContainer}>
        {/* Primary Action Button */}
        {actionText && onAction && (
          <Button
            mode="contained"
            onPress={onAction}
            style={styles.primaryButton}
            contentStyle={styles.buttonContent}
          >
            {actionText}
          </Button>
        )}

        {/* Secondary Action Link */}
        {secondaryActionText && onSecondaryAction && (
          <Button
            mode="text"
            onPress={onSecondaryAction}
            style={styles.secondaryButton}
            compact
          >
            {secondaryActionText}
          </Button>
        )}
      </View>
    </Animated.View>
  );
};

// ==================== Helper Functions ====================

/**
 * Get icon size based on variant
 */
function getIconSize(variant: EmptyStateVariant): number {
  switch (variant) {
    case 'large':
      return 80;
    case 'compact':
      return 48;
    default:
      return 64;
  }
}

/**
 * Get icon color based on variant
 */
function getIconColor(variant: EmptyStateVariant, theme: any): string {
  switch (variant) {
    case 'error':
      return theme.colors.error;
    case 'search':
      return theme.colors.primary;
    default:
      return theme.colors.onSurfaceDisabled;
  }
}

/**
 * Get icon background color based on variant
 */
function getIconBackgroundColor(variant: EmptyStateVariant, theme: any): string {
  switch (variant) {
    case 'error':
      return theme.colors.errorContainer || '#FFEBEE';
    case 'search':
      return theme.colors.primaryContainer || '#E3F2FD';
    default:
      return theme.colors.surfaceVariant || '#F5F5F5';
  }
}

/**
 * Get container padding based on variant
 */
function getContainerStyle(variant: EmptyStateVariant) {
  switch (variant) {
    case 'large':
      return { paddingVertical: 64 };
    case 'compact':
      return { paddingVertical: 24 };
    default:
      return {};
  }
}

// ==================== Styles ====================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '600',
  },
  message: {
    textAlign: 'center',
    marginBottom: 8,
    opacity: 0.8,
    lineHeight: 24,
    maxWidth: 320,
  },
  compactMessage: {
    lineHeight: 20,
    maxWidth: 280,
  },
  helpText: {
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
    opacity: 0.75, // Increased from 0.6 for better outdoor readability
    lineHeight: 20,
    maxWidth: 320,
    fontStyle: 'italic',
  },
  tipsContainer: {
    marginTop: 16,
    marginBottom: 8,
    maxWidth: 320,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  tipIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  tipText: {
    flex: 1,
    lineHeight: 20,
    opacity: 0.7,
  },
  actionsContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  primaryButton: {
    marginBottom: 8,
    minWidth: 160,
  },
  buttonContent: {
    paddingHorizontal: 16,
  },
  secondaryButton: {
    marginTop: 4,
  },
});
