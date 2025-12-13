import React from 'react';
import { ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { HindranceWithDetails } from '../types';
import { HindranceCard } from './HindranceCard';
import HindranceModel from '../../../../models/HindranceModel';
import { EmptyState } from '../../../components/common/EmptyState';

interface HindranceListProps {
  hindrances: HindranceWithDetails[];
  selectedSiteId: string | null;
  refreshing: boolean;
  onRefresh: () => void;
  onEdit: (hindranceWithDetails: HindranceWithDetails) => void;
  onDelete: (hindrance: HindranceModel) => void;
}

export const HindranceList: React.FC<HindranceListProps> = ({
  hindrances,
  selectedSiteId,
  refreshing,
  onRefresh,
  onEdit,
  onDelete,
}) => {
  if (hindrances.length === 0) {
    return (
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <EmptyState
          icon="alert-circle-outline"
          title="No Hindrances"
          message={selectedSiteId === 'all'
            ? 'Select a site to view hindrances'
            : 'No hindrances reported for this site'}
        />
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.scrollView}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {hindrances.map((hindranceWithDetails) => (
        <HindranceCard
          key={hindranceWithDetails.hindrance.id}
          hindranceWithDetails={hindranceWithDetails}
          onEdit={onEdit}
          onDelete={() => onDelete(hindranceWithDetails.hindrance)}
        />
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
});
