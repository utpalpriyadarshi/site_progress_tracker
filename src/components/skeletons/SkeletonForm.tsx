import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Skeleton } from './Skeleton';

/**
 * SkeletonForm Props
 */
export interface SkeletonFormProps {
  /**
   * Number of form fields to render
   * @default 4
   */
  fields?: number;

  /**
   * Show form title/header
   * @default true
   */
  showTitle?: boolean;

  /**
   * Show action buttons at the bottom
   * @default true
   */
  showActions?: boolean;

  /**
   * Show labels above input fields
   * @default true
   */
  showLabels?: boolean;

  /**
   * Custom style for the form container
   */
  style?: ViewStyle;
}

/**
 * SkeletonForm Component
 *
 * A skeleton placeholder for form layouts.
 * Mimics the structure of typical form components.
 *
 * @example
 * ```tsx
 * // Basic form skeleton
 * <SkeletonForm />
 *
 * // Form without title
 * <SkeletonForm showTitle={false} fields={3} />
 *
 * // Minimal form (no labels, no actions)
 * <SkeletonForm
 *   showLabels={false}
 *   showActions={false}
 *   fields={2}
 * />
 * ```
 */
export const SkeletonForm: React.FC<SkeletonFormProps> = ({
  fields = 4,
  showTitle = true,
  showActions = true,
  showLabels = true,
  style,
}) => {
  const renderTitle = () => (
    <View style={styles.titleContainer}>
      <Skeleton width="50%" height={24} marginBottom={8} />
      <Skeleton width="70%" height={14} marginBottom={24} />
    </View>
  );

  const renderField = (index: number) => (
    <View key={index} style={styles.field}>
      {showLabels && (
        <Skeleton width="30%" height={14} marginBottom={8} />
      )}
      <Skeleton width="100%" height={48} borderRadius={8} marginBottom={16} />
    </View>
  );

  const renderActions = () => (
    <View style={styles.actions}>
      <Skeleton width={100} height={40} borderRadius={4} />
      <Skeleton width={100} height={40} borderRadius={4} />
    </View>
  );

  return (
    <View style={[styles.container, style]}>
      {showTitle && renderTitle()}

      <View style={styles.fieldsContainer}>
        {Array.from({ length: fields }).map((_, index) => renderField(index))}
      </View>

      {showActions && renderActions()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  titleContainer: {
    marginBottom: 16,
  },
  fieldsContainer: {
    marginBottom: 8,
  },
  field: {
    marginBottom: 8,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 16,
  },
});
