/**
 * InvoiceEmptyState Component
 *
 * Invoice-specific empty state with context-aware messaging
 * for different scenarios (no invoices, no search results, filtered empty).
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAccessibility } from '../../../utils/accessibility';

export type InvoiceEmptyStateType = 'no-data' | 'no-search-results' | 'no-filter-results';

export interface InvoiceEmptyStateProps {
  type?: InvoiceEmptyStateType;
  searchQuery?: string;
  filterStatus?: string;
  onCreateInvoice?: () => void;
  onClearSearch?: () => void;
  onClearFilters?: () => void;
  onImportInvoices?: () => void;
}

export const InvoiceEmptyState: React.FC<InvoiceEmptyStateProps> = ({
  type = 'no-data',
  searchQuery,
  filterStatus,
  onCreateInvoice,
  onClearSearch,
  onClearFilters,
  onImportInvoices,
}) => {
  const { announce } = useAccessibility();

  // Get content based on type
  const getContent = () => {
    switch (type) {
      case 'no-search-results':
        return {
          icon: '🔍',
          title: 'No invoices found',
          description: searchQuery
            ? `No invoices match "${searchQuery}"`
            : 'No invoices match your search',
          suggestions: [
            'Check your spelling',
            'Try searching by invoice number or vendor name',
            'Use fewer keywords',
          ],
        };

      case 'no-filter-results':
        return {
          icon: '🔽',
          title: 'No matching invoices',
          description: filterStatus
            ? `No invoices with status "${filterStatus}"`
            : 'No invoices match your current filters',
          suggestions: [
            'Try selecting a different status',
            'Expand your date range',
            'Clear filters to see all invoices',
          ],
        };

      case 'no-data':
      default:
        return {
          icon: '🧾',
          title: 'No invoices yet',
          description: 'Start tracking your vendor invoices by creating your first invoice',
          suggestions: [
            'Create invoices for vendor payments',
            'Link invoices to purchase orders',
            'Track payment status and due dates',
          ],
        };
    }
  };

  const content = getContent();

  // Announce empty state
  React.useEffect(() => {
    announce(`${content.title}. ${content.description}`);
  }, [content.title, content.description, announce]);

  return (
    <View
      style={styles.container}
      accessibilityRole="text"
      accessibilityLabel={`${content.title}. ${content.description}`}
    >
      {/* Icon */}
      <View style={styles.iconContainer} accessibilityElementsHidden>
        <Text style={styles.icon}>{content.icon}</Text>
      </View>

      {/* Title */}
      <Text style={styles.title} accessibilityRole="header">
        {content.title}
      </Text>

      {/* Description */}
      <Text style={styles.description}>{content.description}</Text>

      {/* Suggestions */}
      <View style={styles.suggestionsContainer}>
        <Text style={styles.suggestionsTitle}>
          {type === 'no-data' ? 'Get started:' : 'Suggestions:'}
        </Text>
        {content.suggestions.map((suggestion, index) => (
          <View key={index} style={styles.suggestionItem}>
            <Text style={styles.suggestionBullet}>•</Text>
            <Text style={styles.suggestionText}>{suggestion}</Text>
          </View>
        ))}
      </View>

      {/* Actions */}
      <View style={styles.actionsContainer}>
        {type === 'no-data' && onCreateInvoice && (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={onCreateInvoice}
            accessibilityRole="button"
            accessibilityLabel="Create Invoice"
            accessibilityHint="Create your first invoice"
          >
            <Text style={styles.primaryButtonIcon}>+</Text>
            <Text style={styles.primaryButtonText}>Create Invoice</Text>
          </TouchableOpacity>
        )}

        {type === 'no-data' && onImportInvoices && (
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={onImportInvoices}
            accessibilityRole="button"
            accessibilityLabel="Import Invoices"
            accessibilityHint="Import invoices from a file"
          >
            <Text style={styles.secondaryButtonText}>Import Invoices</Text>
          </TouchableOpacity>
        )}

        {type === 'no-search-results' && onClearSearch && (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={onClearSearch}
            accessibilityRole="button"
            accessibilityLabel="Clear Search"
            accessibilityHint="Clear the current search query"
          >
            <Text style={styles.primaryButtonText}>Clear Search</Text>
          </TouchableOpacity>
        )}

        {type === 'no-filter-results' && onClearFilters && (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={onClearFilters}
            accessibilityRole="button"
            accessibilityLabel="Clear Filters"
            accessibilityHint="Remove all filters"
          >
            <Text style={styles.primaryButtonText}>Clear Filters</Text>
          </TouchableOpacity>
        )}

        {(type === 'no-search-results' || type === 'no-filter-results') && onCreateInvoice && (
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={onCreateInvoice}
            accessibilityRole="button"
            accessibilityLabel="Create New Invoice"
            accessibilityHint="Create a new invoice"
          >
            <Text style={styles.secondaryButtonText}>Create New Invoice</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Quick Stats (for no-data state) */}
      {type === 'no-data' && (
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>With Invoice Management, you can:</Text>
          <View style={styles.infoItem}>
            <Text style={styles.infoIcon}>✓</Text>
            <Text style={styles.infoText}>Track payment status (pending, paid, overdue)</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoIcon}>✓</Text>
            <Text style={styles.infoText}>Link invoices to purchase orders</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoIcon}>✓</Text>
            <Text style={styles.infoText}>Get alerts for overdue payments</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fafafa',
    borderRadius: 12,
    margin: 16,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#e3f2fd',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  icon: {
    fontSize: 32,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    maxWidth: 280,
  },
  suggestionsContainer: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  suggestionsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
    marginBottom: 8,
  },
  suggestionItem: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  suggestionBullet: {
    fontSize: 13,
    color: '#1976D2',
    marginRight: 8,
    width: 12,
  },
  suggestionText: {
    flex: 1,
    fontSize: 13,
    color: '#666',
  },
  actionsContainer: {
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1976D2',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 160,
    justifyContent: 'center',
  },
  primaryButtonIcon: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginRight: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  secondaryButtonText: {
    color: '#1976D2',
    fontSize: 14,
    fontWeight: '500',
  },
  infoContainer: {
    width: '100%',
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#4caf50',
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2e7d32',
    marginBottom: 10,
  },
  infoItem: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  infoIcon: {
    fontSize: 13,
    color: '#4caf50',
    marginRight: 8,
    width: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#555',
  },
});

export default InvoiceEmptyState;
