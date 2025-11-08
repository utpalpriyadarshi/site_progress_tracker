/**
 * Loading State Components
 *
 * Provides consistent loading indicators across the application
 * with accessibility support and animations.
 *
 * Week 9 - Performance & Polish
 */

import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Animated } from 'react-native';

// ============================================================================
// Types
// ============================================================================

export type LoadingSize = 'small' | 'medium' | 'large';
export type LoadingVariant = 'spinner' | 'skeleton' | 'overlay' | 'inline';

interface LoadingStateProps {
  /**
   * Loading message to display
   */
  message?: string;

  /**
   * Size of the loading indicator
   */
  size?: LoadingSize;

  /**
   * Variant of loading state
   */
  variant?: LoadingVariant;

  /**
   * Color of the loading indicator
   */
  color?: string;

  /**
   * Show loading state
   */
  visible?: boolean;

  /**
   * Custom style
   */
  style?: any;

  /**
   * Accessibility label
   */
  accessibilityLabel?: string;
}

interface SkeletonProps {
  /**
   * Width of skeleton
   */
  width?: number | string;

  /**
   * Height of skeleton
   */
  height?: number | string;

  /**
   * Border radius
   */
  borderRadius?: number;

  /**
   * Custom style
   */
  style?: any;
}

// ============================================================================
// Spinner Loading State
// ============================================================================

export const SpinnerLoading: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
  size = 'medium',
  color = '#007AFF',
  visible = true,
  style,
  accessibilityLabel = 'Loading content',
}) => {
  if (!visible) {
    return null;
  }

  const spinnerSize = size === 'small' ? 'small' : 'large';

  return (
    <View
      style={[styles.spinnerContainer, style]}
      accessible={true}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="progressbar"
    >
      <ActivityIndicator size={spinnerSize} color={color} />
      {message && (
        <Text style={styles.loadingMessage} accessibilityLiveRegion="polite">
          {message}
        </Text>
      )}
    </View>
  );
};

// ============================================================================
// Skeleton Loading State
// ============================================================================

export const SkeletonLoader: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
}) => {
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => animation.stop();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
      accessible={true}
      accessibilityLabel="Loading placeholder"
    />
  );
};

// ============================================================================
// Skeleton Card (Common Pattern)
// ============================================================================

export const SkeletonCard: React.FC<{ style?: any }> = ({ style }) => {
  return (
    <View style={[styles.skeletonCard, style]} accessible={true} accessibilityLabel="Loading card">
      <SkeletonLoader width="60%" height={24} style={{ marginBottom: 12 }} />
      <SkeletonLoader width="100%" height={16} style={{ marginBottom: 8 }} />
      <SkeletonLoader width="100%" height={16} style={{ marginBottom: 8 }} />
      <SkeletonLoader width="80%" height={16} />
    </View>
  );
};

// ============================================================================
// Skeleton List
// ============================================================================

export const SkeletonList: React.FC<{ count?: number; style?: any }> = ({ count = 3, style }) => {
  return (
    <View style={style} accessible={true} accessibilityLabel={`Loading ${count} items`}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} style={{ marginBottom: 16 }} />
      ))}
    </View>
  );
};

// ============================================================================
// Overlay Loading State
// ============================================================================

export const OverlayLoading: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
  size = 'large',
  color = '#007AFF',
  visible = true,
  accessibilityLabel = 'Loading overlay',
}) => {
  if (!visible) {
    return null;
  }

  return (
    <View
      style={styles.overlay}
      accessible={true}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="progressbar"
      accessibilityLiveRegion="polite"
    >
      <View style={styles.overlayContent}>
        <ActivityIndicator size="large" color={color} />
        {message && <Text style={styles.overlayMessage}>{message}</Text>}
      </View>
    </View>
  );
};

// ============================================================================
// Inline Loading State
// ============================================================================

export const InlineLoading: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
  size = 'small',
  color = '#007AFF',
  visible = true,
  style,
  accessibilityLabel = 'Loading',
}) => {
  if (!visible) {
    return null;
  }

  return (
    <View
      style={[styles.inlineContainer, style]}
      accessible={true}
      accessibilityLabel={accessibilityLabel}
    >
      <ActivityIndicator size="small" color={color} />
      {message && <Text style={styles.inlineMessage}>{message}</Text>}
    </View>
  );
};

// ============================================================================
// Main LoadingState Component
// ============================================================================

export const LoadingState: React.FC<LoadingStateProps> = ({
  variant = 'spinner',
  ...props
}) => {
  switch (variant) {
    case 'overlay':
      return <OverlayLoading {...props} />;
    case 'inline':
      return <InlineLoading {...props} />;
    case 'skeleton':
      return <SkeletonList count={3} />;
    case 'spinner':
    default:
      return <SpinnerLoading {...props} />;
  }
};

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  spinnerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingMessage: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  skeleton: {
    backgroundColor: '#E0E0E0',
  },
  skeletonCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  overlayContent: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 24,
    alignItems: 'center',
    minWidth: 200,
  },
  overlayMessage: {
    marginTop: 16,
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  inlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  inlineMessage: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
});

// ============================================================================
// Export
// ============================================================================

export default LoadingState;
