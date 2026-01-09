/**
 * ItemFormSkeleton - Loading skeleton for ItemFormFields component
 *
 * Provides a loading placeholder that matches the exact layout of ItemFormFields,
 * improving perceived performance during data loading for ItemCreation and ItemEdit screens.
 *
 * @example
 * ```tsx
 * {loading ? (
 *   <ItemFormSkeleton variant="create" />
 * ) : (
 *   <ItemFormFields {...props} />
 * )}
 * ```
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Skeleton } from '../../../components/skeletons/Skeleton';

/**
 * ItemFormSkeleton Props
 */
export interface ItemFormSkeletonProps {
  /**
   * Form variant (create or edit mode)
   * @default 'create'
   */
  variant?: 'create' | 'edit';

  /**
   * Custom style for the container
   */
  style?: ViewStyle;
}

/**
 * ItemFormSkeleton Component
 */
export const ItemFormSkeleton: React.FC<ItemFormSkeletonProps> = ({
  variant = 'create',
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      {/* WBS Code Section */}
      <View style={styles.section}>
        <Skeleton width="40%" height={16} marginBottom={8} />
        <View style={styles.codePreview}>
          <Skeleton width="30%" height={24} />
        </View>
        <Skeleton width="50%" height={12} marginBottom={0} />
      </View>

      {/* Item Details Section */}
      <View style={styles.section}>
        <Skeleton width="30%" height={16} marginBottom={8} />
        <Skeleton width="100%" height={56} borderRadius={4} marginBottom={0} />
      </View>

      {/* Category Section */}
      <View style={styles.section}>
        <Skeleton width="25%" height={16} marginBottom={8} />
        <Skeleton width="100%" height={56} borderRadius={4} marginBottom={0} />
      </View>

      {/* Phase Section */}
      <View style={styles.section}>
        <Skeleton width="35%" height={16} marginBottom={8} />
        <Skeleton width="100%" height={56} borderRadius={4} marginBottom={0} />
      </View>

      {/* Schedule Section */}
      <View style={styles.section}>
        <Skeleton width="25%" height={16} marginBottom={8} />
        <Skeleton width="100%" height={56} borderRadius={4} marginBottom={8} />
        <Skeleton width="100%" height={56} borderRadius={4} marginBottom={8} />
        <Skeleton width="100%" height={56} borderRadius={4} marginBottom={4} />
        <Skeleton width="70%" height={12} marginBottom={0} />
      </View>

      {/* Quantity & Progress Section */}
      <View style={styles.section}>
        <Skeleton width="45%" height={16} marginBottom={8} />
        <View style={styles.row}>
          <View style={styles.halfWidth}>
            <Skeleton width="100%" height={56} borderRadius={4} marginBottom={0} />
          </View>
          <View style={styles.halfWidth}>
            <Skeleton width="100%" height={56} borderRadius={4} marginBottom={0} />
          </View>
        </View>
        <Skeleton width="100%" height={56} borderRadius={4} marginBottom={8} />
        <Skeleton width="100%" height={56} borderRadius={4} marginBottom={4} />
        <Skeleton width="30%" height={12} marginBottom={0} />
      </View>

      {/* Critical Path & Milestones Section */}
      <View style={styles.section}>
        <Skeleton width="50%" height={16} marginBottom={8} />
        <View style={styles.chipRow}>
          <Skeleton width={120} height={32} borderRadius={16} marginBottom={0} />
          <Skeleton width={130} height={32} borderRadius={16} marginBottom={0} />
        </View>
        <Skeleton width="100%" height={56} borderRadius={4} marginBottom={0} />
      </View>

      {/* Dependency Risk Section */}
      <View style={styles.section}>
        <Skeleton width="40%" height={16} marginBottom={8} />
        <View style={styles.chipRow}>
          <Skeleton width={80} height={32} borderRadius={16} marginBottom={0} />
          <Skeleton width={100} height={32} borderRadius={16} marginBottom={0} />
          <Skeleton width={80} height={32} borderRadius={16} marginBottom={0} />
        </View>
        <Skeleton width="100%" height={80} borderRadius={4} marginBottom={0} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  codePreview: {
    padding: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  halfWidth: {
    flex: 1,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
});
