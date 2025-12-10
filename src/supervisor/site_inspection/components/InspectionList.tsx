import React from 'react';
import { ScrollView, RefreshControl, StyleSheet } from 'react-native';
import { Card, Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { InspectionListProps } from '../types';
import { InspectionCard } from './InspectionCard';

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
        <Card style={styles.emptyCard}>
          <Card.Content>
            <MaterialCommunityIcons
              name="clipboard-text-outline"
              size={64}
              color="#ccc"
              style={styles.emptyIcon}
            />
            <Text style={styles.emptyText}>{emptyMessage}</Text>
          </Card.Content>
        </Card>
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
  emptyCard: {
    margin: 16,
    alignItems: 'center',
    padding: 20,
  },
  emptyIcon: {
    alignSelf: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});
