import React from 'react';
import { ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { Card, Title, Paragraph } from 'react-native-paper';
import { HindranceWithDetails } from '../types';
import { HindranceCard } from './HindranceCard';
import HindranceModel from '../../../../models/HindranceModel';

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
        <Card style={styles.emptyCard}>
          <Card.Content>
            <Title>No Hindrances</Title>
            <Paragraph>
              {selectedSiteId === 'all'
                ? 'Select a site to view hindrances'
                : 'No hindrances reported for this site'}
            </Paragraph>
          </Card.Content>
        </Card>
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
          onDelete={(id) => onDelete(hindranceWithDetails.hindrance)}
        />
      ))}
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
});
