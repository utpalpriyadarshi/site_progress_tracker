import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { SkeletonCard } from './SkeletonCard';

/**
 * SkeletonList Props
 */
export interface SkeletonListProps {
  /**
   * Number of skeleton items to render
   * @default 3
   */
  count?: number;

  /**
   * Show avatar/icon in each item
   * @default false
   */
  showAvatar?: boolean;

  /**
   * Number of text lines per item
   * @default 2
   */
  lines?: number;

  /**
   * Show actions in each item
   * @default false
   */
  showActions?: boolean;

  /**
   * Show image in each item
   * @default false
   */
  showImage?: boolean;

  /**
   * Card variant
   * @default 'default'
   */
  variant?: 'default' | 'compact' | 'detailed';

  /**
   * Custom style for the list container
   */
  style?: ViewStyle;

  /**
   * Custom style for each card
   */
  cardStyle?: ViewStyle;
}

/**
 * SkeletonList Component
 *
 * A skeleton placeholder for list views.
 * Renders multiple SkeletonCard components.
 *
 * @example
 * ```tsx
 * // Basic list skeleton
 * <SkeletonList count={5} />
 *
 * // List with avatars and images
 * <SkeletonList
 *   count={3}
 *   showAvatar
 *   showImage
 *   variant="detailed"
 * />
 *
 * // Compact list with actions
 * <SkeletonList
 *   count={4}
 *   variant="compact"
 *   showActions
 *   lines={1}
 * />
 * ```
 */
export const SkeletonList: React.FC<SkeletonListProps> = ({
  count = 3,
  showAvatar = false,
  lines = 2,
  showActions = false,
  showImage = false,
  variant = 'default',
  style,
  cardStyle,
}) => {
  return (
    <View style={[styles.container, style]}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard
          key={index}
          showAvatar={showAvatar}
          lines={lines}
          showActions={showActions}
          showImage={showImage}
          variant={variant}
          style={cardStyle}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
