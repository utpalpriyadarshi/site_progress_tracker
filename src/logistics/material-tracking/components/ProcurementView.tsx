import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { PurchaseSuggestion } from '../../services/MaterialProcurementService';
import MaterialModel from '../../../models/MaterialModel';
import { ProcurementSuggestionCard } from './ProcurementSuggestionCard';

interface ProcurementViewProps {
  filteredSuggestions: PurchaseSuggestion[];
  materials: MaterialModel[];
  onViewQuotes: (material: MaterialModel) => void;
  onCreateOrder?: () => void;
}

/**
 * ProcurementView Component
 *
 * Displays procurement suggestions with:
 * - Empty state when no procurement needed
 * - Scrollable list of ProcurementSuggestionCards
 *
 * Extracted from MaterialTrackingScreen Phase 4.
 */
export const ProcurementView: React.FC<ProcurementViewProps> = ({
  filteredSuggestions,
  materials,
  onViewQuotes,
  onCreateOrder,
}) => {
  if (filteredSuggestions.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateTitle}>No Procurement Needed</Text>
        <Text style={styles.emptyStateText}>
          All materials are sufficiently stocked
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
      {filteredSuggestions.map(suggestion => (
        <ProcurementSuggestionCard
          key={suggestion.id}
          suggestion={suggestion}
          materials={materials}
          onViewQuotes={onViewQuotes}
          onCreateOrder={onCreateOrder}
        />
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#666',
  },
  list: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
