import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Skeleton } from './Skeleton';

/**
 * SkeletonCard Props
 */
export interface SkeletonCardProps {
  /**
   * Show avatar/icon on the left
   * @default false
   */
  showAvatar?: boolean;

  /**
   * Number of text lines to show
   * @default 3
   */
  lines?: number;

  /**
   * Show action buttons at the bottom
   * @default false
   */
  showActions?: boolean;

  /**
   * Show image/photo section
   * @default false
   */
  showImage?: boolean;

  /**
   * Custom style for the card container
   */
  style?: ViewStyle;

  /**
   * Card variant for different layouts
   * @default 'default'
   */
  variant?: 'default' | 'compact' | 'detailed';
}

/**
 * SkeletonCard Component
 *
 * A skeleton placeholder for card-based layouts.
 * Mimics the structure of typical card components.
 *
 * @example
 * ```tsx
 * // Basic card skeleton
 * <SkeletonCard />
 *
 * // Card with avatar and image
 * <SkeletonCard showAvatar showImage lines={2} />
 *
 * // Compact card with actions
 * <SkeletonCard variant="compact" showActions />
 * ```
 */
export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  showAvatar = false,
  lines = 3,
  showActions = false,
  showImage = false,
  style,
  variant = 'default',
}) => {
  const renderHeader = () => (
    <View style={styles.header}>
      {showAvatar && (
        <Skeleton
          variant="circle"
          width={40}
          height={40}
          style={styles.avatar}
        />
      )}
      <View style={styles.headerText}>
        <Skeleton width="60%" height={16} marginBottom={8} />
        <Skeleton width="40%" height={12} />
      </View>
    </View>
  );

  const renderContent = () => (
    <View style={styles.content}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          width={index === lines - 1 ? '80%' : '100%'}
          height={variant === 'compact' ? 12 : 14}
          marginBottom={8}
        />
      ))}
    </View>
  );

  const renderImage = () => (
    <Skeleton
      width="100%"
      height={variant === 'compact' ? 150 : 200}
      borderRadius={8}
      style={styles.image}
    />
  );

  const renderActions = () => (
    <View style={styles.actions}>
      <Skeleton width={80} height={36} borderRadius={4} />
      <Skeleton width={80} height={36} borderRadius={4} />
    </View>
  );

  return (
    <View style={[styles.card, style]}>
      {renderHeader()}
      {showImage && renderImage()}
      {renderContent()}
      {showActions && renderActions()}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  content: {
    marginBottom: 8,
  },
  image: {
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 12,
  },
});
