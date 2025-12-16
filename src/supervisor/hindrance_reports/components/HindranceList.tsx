import React from 'react';
import { ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { HindranceWithDetails } from '../types';
import { HindranceCard } from './HindranceCard';
import HindranceModel from '../../../../models/HindranceModel';
import { EmptyState } from '../../../components/common/EmptyState';
import { SkeletonList } from '../../../components/skeletons';

interface HindranceListProps {
  hindrances: HindranceWithDetails[];
  selectedSiteId: string | null;
  refreshing: boolean;
  loading?: boolean;
  onRefresh: () => void;
  onEdit: (hindranceWithDetails: HindranceWithDetails) => void;
  onDelete: (hindrance: HindranceModel) => void;
}

export const HindranceList: React.FC<HindranceListProps> = ({
  hindrances,
  selectedSiteId,
  refreshing,
  loading = false,
  onRefresh,
  onEdit,
  onDelete,
}) => {
  return (
    <ScrollView
      style={styles.scrollView}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {loading ? (
        <SkeletonList
          count={3}
          showAvatar
          lines={3}
          showActions
          variant="default"
        />
      ) : hindrances.length === 0 ? (
        <EmptyState
          icon="alert-circle-outline"
          title="No Hindrances"
          message={selectedSiteId === 'all'
            ? 'Select a site to view hindrances'
            : 'No hindrances reported for this site'}
        />
      ) : (
        hindrances.map((hindranceWithDetails) => (
          <HindranceCard
            key={hindranceWithDetails.hindrance.id}
            hindranceWithDetails={hindranceWithDetails}
            onEdit={onEdit}
            onDelete={() => onDelete(hindranceWithDetails.hindrance)}
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
