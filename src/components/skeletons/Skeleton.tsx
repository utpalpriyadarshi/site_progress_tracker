import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';

/**
 * Skeleton Props
 */
export interface SkeletonProps {
  /**
   * Width of the skeleton element
   * Can be a number (pixels) or string (e.g., '100%', '50%')
   */
  width?: number | string;

  /**
   * Height of the skeleton element
   */
  height?: number;

  /**
   * Border radius for rounded corners
   */
  borderRadius?: number;

  /**
   * Whether to show shimmer animation
   * @default true
   */
  shimmer?: boolean;

  /**
   * Custom style for the skeleton container
   */
  style?: ViewStyle;

  /**
   * Shape of the skeleton
   * @default 'rect'
   */
  variant?: 'rect' | 'circle' | 'text';

  /**
   * Margin bottom for spacing
   */
  marginBottom?: number;
}

/**
 * Skeleton Component
 *
 * A loading placeholder component with shimmer animation.
 * Used to improve perceived performance during data loading.
 *
 * @example
 * ```tsx
 * // Rectangle skeleton
 * <Skeleton width="100%" height={100} />
 *
 * // Circle skeleton (for avatars)
 * <Skeleton variant="circle" width={50} height={50} />
 *
 * // Text skeleton
 * <Skeleton variant="text" width="80%" />
 * ```
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
  shimmer = true,
  style,
  variant = 'rect',
  marginBottom = 0,
}) => {
  const shimmerValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!shimmer) return;

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerValue, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerValue, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => animation.stop();
  }, [shimmer, shimmerValue]);

  const shimmerTranslate = shimmerValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-1, 1],
  });

  const shimmerOpacity = shimmerValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 0.5, 0.3],
  });

  // Calculate dimensions based on variant
  const getVariantStyle = (): ViewStyle => {
    switch (variant) {
      case 'circle':
        return {
          width: typeof width === 'number' ? width : 50,
          height: typeof height === 'number' ? height : 50,
          borderRadius: (typeof height === 'number' ? height : 50) / 2,
        };
      case 'text':
        return {
          width,
          height: height || 16,
          borderRadius: borderRadius || 4,
        };
      case 'rect':
      default:
        return {
          width,
          height,
          borderRadius,
        };
    }
  };

  return (
    <View
      style={[
        styles.container,
        getVariantStyle(),
        { marginBottom },
        style,
      ]}
    >
      {shimmer && (
        <Animated.View
          style={[
            styles.shimmer,
            {
              opacity: shimmerOpacity,
              transform: [{ translateX: shimmerTranslate }],
            },
          ]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#E1E9EE',
    overflow: 'hidden',
  },
  shimmer: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
});
