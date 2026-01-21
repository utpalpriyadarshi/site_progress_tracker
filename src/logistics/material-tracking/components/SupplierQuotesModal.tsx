import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SupplierQuote } from '../../../services/MaterialProcurementService';
import MaterialModel from '../../../../models/MaterialModel';

interface SupplierQuotesModalProps {
  visible: boolean;
  quotes: SupplierQuote[];
  selectedMaterial: MaterialModel | null;
  onClose: () => void;
  onSelectQuote?: (quote: SupplierQuote) => void;
}

/**
 * SupplierQuotesModal Component
 *
 * Modal for comparing supplier quotes with:
 * - Modal header with material name
 * - List of supplier quotes with details
 * - Recommended badge for best quote
 * - Quote selection functionality
 *
 * Extracted from MaterialTrackingScreen Phase 4.
 */
export const SupplierQuotesModal: React.FC<SupplierQuotesModalProps> = ({
  visible,
  quotes,
  selectedMaterial,
  onClose,
  onSelectQuote,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Supplier Quotes</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          {selectedMaterial && (
            <Text style={styles.subtitle}>{selectedMaterial.name}</Text>
          )}

          <ScrollView style={styles.scroll}>
            {quotes.map(quote => (
              <View
                key={quote.id}
                style={[
                  styles.quoteCard,
                  quote.recommended && styles.quoteCardRecommended,
                ]}
              >
                {quote.recommended && (
                  <View style={styles.recommendedBadge}>
                    <Text style={styles.recommendedText}>RECOMMENDED</Text>
                  </View>
                )}

                <Text style={styles.supplierName}>{quote.supplierName}</Text>

                <View style={styles.details}>
                  <View style={styles.detailRow}>
                    <Text style={styles.label}>Unit Price:</Text>
                    <Text style={styles.value}>₹{quote.unitPrice.toFixed(2)}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.label}>Lead Time:</Text>
                    <Text style={styles.value}>{quote.leadTimeDays} days</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.label}>Shipping:</Text>
                    <Text style={styles.value}>₹{quote.shippingCost.toFixed(0)}</Text>
                  </View>
                  <View style={[styles.detailRow, styles.totalRow]}>
                    <Text style={styles.totalLabel}>Total Cost:</Text>
                    <Text style={styles.totalValue}>
                      ₹{(quote.totalCost / 1000).toFixed(1)}K
                    </Text>
                  </View>
                </View>

                <Text style={styles.notes}>{quote.notes}</Text>

                <TouchableOpacity
                  style={styles.selectButton}
                  onPress={() => onSelectQuote && onSelectQuote(quote)}
                >
                  <Text style={styles.selectButtonText}>Select This Quote</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    fontSize: 24,
    color: '#666',
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  scroll: {
    maxHeight: '100%',
  },
  quoteCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  quoteCardRecommended: {
    borderColor: '#4CAF50',
    borderWidth: 2,
    backgroundColor: '#E8F5E9',
  },
  recommendedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  recommendedText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  supplierName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
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
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    marginTop: 8,
    paddingTop: 8,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  notes: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  selectButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  selectButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});
