import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Skeleton } from './Skeleton';

/**
 * SkeletonHeader Props
 */
export interface SkeletonHeaderProps {
  /**
   * Show avatar/icon on the left
   * @default false
   */
  showAvatar?: boolean;

  /**
   * Show action button on the right
   * @default false
   */
  showAction?: boolean;

  /**
   * Show subtitle below the title
   * @default false
   */
  showSubtitle?: boolean;

  /**
   * Header variant
   * @default 'default'
   */
  variant?: 'default' | 'large' | 'compact';

  /**
   * Custom style for the header container
   */
  style?: ViewStyle;
}

/**
 * SkeletonHeader Component
 *
 * A skeleton placeholder for header sections.
 * Used for page headers, section headers, etc.
 *
 * @example
 * ```tsx
 * // Basic header skeleton
 * <SkeletonHeader />
 *
 * // Large header with avatar and action
 * <SkeletonHeader
 *   variant="large"
 *   showAvatar
 *   showAction
 *   showSubtitle
 * />
 *
 * // Compact header
 * <SkeletonHeader variant="compact" />
 * ```
 */
export const SkeletonHeader: React.FC<SkeletonHeaderProps> = ({
  showAvatar = false,
  showAction = false,
  showSubtitle = false,
  variant = 'default',
  style,
}) => {
  const getHeightForVariant = () => {
    switch (variant) {
      case 'large':
        return 32;
      case 'compact':
        return 20;
      default:
        return 24;
    }
  };

  const getSubtitleHeightForVariant = () => {
    switch (variant) {
      case 'large':
        return 16;
      case 'compact':
        return 12;
      default:
        return 14;
    }
  };

  const getAvatarSizeForVariant = () => {
    switch (variant) {
      case 'large':
        return 60;
      case 'compact':
        return 32;
      default:
        return 40;
    }
  };

  const titleHeight = getHeightForVariant();
  const subtitleHeight = getSubtitleHeightForVariant();
  const avatarSize = getAvatarSizeForVariant();

  return (
    <View style={[styles.container, style]}>
      <View style={styles.leftSection}>
        {showAvatar && (
          <Skeleton
            variant="circle"
            width={avatarSize}
            height={avatarSize}
            style={styles.avatar}
          />
        )}

        <View style={styles.textSection}>
          <Skeleton
            width={variant === 'large' ? '80%' : '60%'}
            height={titleHeight}
            marginBottom={showSubtitle ? 8 : 0}
          />

          {showSubtitle && (
            <Skeleton width="40%" height={subtitleHeight} />
          )}
        </View>
      </View>

      {showAction && (
        <Skeleton
          width={variant === 'compact' ? 32 : 40}
          height={variant === 'compact' ? 32 : 40}
          borderRadius={variant === 'compact' ? 16 : 20}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  leftSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    marginRight: 12,
  },
  textSection: {
    flex: 1,
  },
});
