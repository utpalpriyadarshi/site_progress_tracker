import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { PurchaseSuggestion } from '../../../services/MaterialProcurementService';
import MaterialModel from '../../../models/MaterialModel';

interface ProcurementSuggestionCardProps {
  suggestion: PurchaseSuggestion;
  materials: MaterialModel[];
  onViewQuotes: (material: MaterialModel) => void;
  onCreateOrder?: () => void;
}

/**
 * ProcurementSuggestionCard Component
 *
 * Displays a procurement suggestion card with:
 * - Material details and urgency badge
 * - Shortage and suggested order quantities
 * - Preferred supplier information
 * - Required by date
 * - Actions: Compare Suppliers and Create Order
 *
 * Extracted from MaterialTrackingScreen Phase 4.
 */
export const ProcurementSuggestionCard: React.FC<ProcurementSuggestionCardProps> = ({
  suggestion,
  materials,
  onViewQuotes,
  onCreateOrder,
}) => {
  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return '#F44336';
      case 'high': return '#FF9800';
      case 'medium': return '#FFC107';
      case 'low': return '#4CAF50';
      default: return '#999';
    }
  };

  const getUrgencyBg = (urgency: string) => {
    switch (urgency) {
      case 'critical': return '#FFEBEE';
      case 'high': return '#FFF3E0';
      case 'medium': return '#FFF8E1';
      case 'low': return '#E8F5E9';
      default: return '#F5F5F5';
    }
  };

  const handleCompareSuppliers = () => {
    const material = materials.find(m => m.id === suggestion.materialId);
    if (material) {
      onViewQuotes(material);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.materialName}>{suggestion.materialName}</Text>
          <View style={[styles.urgencyBadge, { backgroundColor: getUrgencyBg(suggestion.urgency) }]}>
            <Text style={[styles.urgencyText, { color: getUrgencyColor(suggestion.urgency) }]}>
              {suggestion.urgency.toUpperCase()}
            </Text>
          </View>
        </View>
        <Text style={styles.itemCode}>{suggestion.itemCode}</Text>
      </View>

      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Shortage:</Text>
          <Text style={styles.value}>
            {suggestion.shortageQuantity.toFixed(2)} {suggestion.unit}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Suggested Order:</Text>
          <Text style={[styles.value, styles.highlight]}>
            {suggestion.suggestedOrderQuantity.toFixed(2)} {suggestion.unit}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Est. Cost:</Text>
          <Text style={styles.value}>
            ₹{(suggestion.estimatedCost / 1000).toFixed(1)}K
          </Text>
        </View>
      </View>

      {suggestion.preferredSupplier && (
        <View style={styles.supplierSection}>
          <Text style={styles.supplierLabel}>Preferred Supplier:</Text>
          <Text style={styles.supplierName}>{suggestion.preferredSupplier.name}</Text>
          <Text style={styles.supplierRating}>
            Rating: {suggestion.preferredSupplier.rating}/5 |
            Reliability: {suggestion.preferredSupplier.reliability}%
          </Text>
        </View>
      )}

      <View style={styles.timingSection}>
        <Text style={styles.timingLabel}>Required by:</Text>
        <Text style={styles.timingValue}>
          {suggestion.requiredByDate.toLocaleDateString()}
        </Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.button}
          onPress={handleCompareSuppliers}
        >
          <Text style={styles.buttonText}>Compare Suppliers</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.buttonPrimary]}
          onPress={onCreateOrder}
        >
          <Text style={styles.buttonTextPrimary}>Create Order</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  materialName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  urgencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  urgencyText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  itemCode: {
    fontSize: 12,
    color: '#666',
  },
  details: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  label: {
    fontSize: 14,
    color: '#666',
  },
  value: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  highlight: {
    color: '#2196F3',
    fontWeight: 'bold',
  },
  supplierSection: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 4,
    marginBottom: 12,
  },
  supplierLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  supplierName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  supplierRating: {
    fontSize: 12,
    color: '#666',
  },
  timingSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    marginBottom: 12,
  },
  timingLabel: {
    fontSize: 12,
    color: '#666',
  },
  timingValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2196F3',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  buttonPrimary: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2196F3',
  },
  buttonTextPrimary: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});
