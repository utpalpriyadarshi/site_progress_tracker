/**
 * CostEmptyState Component
 *
 * Cost tracking-specific empty state with context-aware messaging
 * for different scenarios (no costs, no search results, filtered empty).
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAccessibility } from '../../../utils/accessibility';

export type CostEmptyStateType = 'no-data' | 'no-search-results' | 'no-filter-results' | 'no-category';

export interface CostEmptyStateProps {
  type?: CostEmptyStateType;
  searchQuery?: string;
  filterCategory?: string;
  filterDateRange?: string;
  onAddCost?: () => void;
  onClearSearch?: () => void;
  onClearFilters?: () => void;
  onViewBudget?: () => void;
}

export const CostEmptyState: React.FC<CostEmptyStateProps> = ({
  type = 'no-data',
  searchQuery,
  filterCategory,
  filterDateRange,
  onAddCost,
  onClearSearch,
  onClearFilters,
  onViewBudget,
}) => {
  const { announce } = useAccessibility();

  // Get content based on type
  const getContent = () => {
    switch (type) {
      case 'no-search-results':
        return {
          icon: '🔍',
          title: 'No costs found',
          description: searchQuery
            ? `No costs match "${searchQuery}"`
            : 'No costs match your search',
          suggestions: [
            'Check the description or PO number spelling',
            'Try searching with fewer keywords',
            'Search by cost category',
          ],
        };

      case 'no-filter-results':
        return {
          icon: '🔽',
          title: 'No matching costs',
          description: getFilterDescription(),
          suggestions: [
            'Try selecting a different category',
            'Expand your date range',
            'Clear filters to see all costs',
          ],
        };

      case 'no-category':
        return {
          icon: '📁',
          title: `No ${filterCategory || ''} costs`,
          description: `You haven't recorded any costs in the ${filterCategory || 'selected'} category yet`,
          suggestions: [
            'Add costs to this category when they occur',
            'Check if costs were recorded in a different category',
            'Review your budget allocation for this category',
          ],
        };

      case 'no-data':
      default:
        return {
          icon: '💵',
          title: 'No costs recorded yet',
          description: 'Start tracking your project expenses by adding your first cost entry',
          suggestions: [
            'Record material purchases',
            'Track labor costs',
            'Log equipment expenses',
            'Add subcontractor payments',
          ],
        };
    }
  };

  const getFilterDescription = () => {
    const parts: string[] = [];
    if (filterCategory) parts.push(`category "${filterCategory}"`);
    if (filterDateRange) parts.push(`date range "${filterDateRange}"`);

    if (parts.length > 0) {
      return `No costs found for ${parts.join(' and ')}`;
    }
    return 'No costs match your current filters';
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
          {type === 'no-data' ? 'Track costs such as:' : 'Suggestions:'}
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
        {type === 'no-data' && onAddCost && (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={onAddCost}
            accessibilityRole="button"
            accessibilityLabel="Add Cost"
            accessibilityHint="Record your first cost entry"
          >
            <Text style={styles.primaryButtonIcon}>+</Text>
            <Text style={styles.primaryButtonText}>Add Cost</Text>
          </TouchableOpacity>
        )}

        {type === 'no-data' && onViewBudget && (
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={onViewBudget}
            accessibilityRole="button"
            accessibilityLabel="View Budget"
            accessibilityHint="View your project budget"
          >
            <Text style={styles.secondaryButtonText}>View Budget</Text>
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

        {(type === 'no-filter-results' || type === 'no-category') && onClearFilters && (
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

        {(type === 'no-search-results' || type === 'no-filter-results' || type === 'no-category') &&
          onAddCost && (
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={onAddCost}
              accessibilityRole="button"
              accessibilityLabel="Add New Cost"
              accessibilityHint="Record a new cost entry"
            >
              <Text style={styles.secondaryButtonText}>Add New Cost</Text>
            </TouchableOpacity>
          )}
      </View>

      {/* Category Guide (for no-data state) */}
      {type === 'no-data' && (
        <View style={styles.categoriesContainer}>
          <Text style={styles.categoriesTitle}>Cost Categories:</Text>
          <View style={styles.categoryGrid}>
            <View style={styles.categoryItem}>
              <Text style={styles.categoryIcon}>👷</Text>
              <Text style={styles.categoryLabel}>Labor</Text>
            </View>
            <View style={styles.categoryItem}>
              <Text style={styles.categoryIcon}>🧱</Text>
              <Text style={styles.categoryLabel}>Materials</Text>
            </View>
            <View style={styles.categoryItem}>
              <Text style={styles.categoryIcon}>🔧</Text>
              <Text style={styles.categoryLabel}>Equipment</Text>
            </View>
            <View style={styles.categoryItem}>
              <Text style={styles.categoryIcon}>🏗️</Text>
              <Text style={styles.categoryLabel}>Subcontractors</Text>
            </View>
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
    backgroundColor: '#fff3e0',
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
    color: '#ff9800',
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
    backgroundColor: '#ff9800',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 140,
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
    color: '#ff9800',
    fontSize: 14,
    fontWeight: '500',
  },
  categoriesContainer: {
    width: '100%',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 16,
  },
  categoriesTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
    marginBottom: 12,
    textAlign: 'center',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  categoryItem: {
    alignItems: 'center',
    width: '25%',
    paddingVertical: 8,
  },
  categoryIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  categoryLabel: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
  },
});

export default CostEmptyState;
