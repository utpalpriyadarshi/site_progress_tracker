import React from 'react';
import { ScrollView, RefreshControl, StyleSheet } from 'react-native';
import { InspectionListProps } from '../types';
import { InspectionCard } from './InspectionCard';
import { EmptyState } from '../../../components/common/EmptyState';

/**
 * InspectionList Component
 *
 * Displays a scrollable list of inspections with:
 * - Pull-to-refresh functionality
 * - Empty state message
 * - Individual InspectionCard components
 */
export const InspectionList: React.FC<InspectionListProps> = ({
  inspections,
  refreshing,
  onRefresh,
  onEdit,
  onDelete,
  emptyMessage = 'No inspections found. Tap + to create your first inspection.',
}) => {
  return (
    <ScrollView
      style={styles.scrollView}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {inspections.length === 0 ? (
        <EmptyState
          icon="clipboard-text-outline"
          title="No Inspections"
          message={emptyMessage}
        />
      ) : (
        inspections.map(({ inspection, site }) => (
          <InspectionCard
            key={inspection.id}
            inspection={inspection}
            site={site}
            onEdit={() => onEdit({ inspection, site })}
            onDelete={() => onDelete(inspection)}
          />
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
});
