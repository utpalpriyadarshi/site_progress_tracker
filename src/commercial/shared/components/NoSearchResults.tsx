/**
 * NoSearchResults Component
 *
 * Shows when search/filter returns no results:
 * - Search query display
 * - Suggestions to modify search
 * - Clear filters button
 * - Recent searches (if available)
 *
 * Usage:
 * ```tsx
 * <NoSearchResults
 *   searchQuery="invoice 123"
 *   appliedFilters={['Status: Paid', 'Date: Last 30 days']}
 *   onClearFilters={() => clearFilters()}
 *   suggestions={['Try a broader search', 'Check your spelling']}
 * />
 * ```
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAccessibility } from '../../../utils/accessibility';

export interface NoSearchResultsProps {
  searchQuery?: string;
  appliedFilters?: string[];
  onClearFilters?: () => void;
  onClearSearch?: () => void;
  suggestions?: string[];
  recentSearches?: string[];
  onRecentSearchPress?: (search: string) => void;
  entityName?: string;
  testID?: string;
}

export const NoSearchResults: React.FC<NoSearchResultsProps> = ({
  searchQuery,
  appliedFilters,
  onClearFilters,
  onClearSearch,
  suggestions,
  recentSearches,
  onRecentSearchPress,
  entityName = 'results',
  testID,
}) => {
  const { announce } = useAccessibility();
  const hasFilters = appliedFilters && appliedFilters.length > 0;
  const hasSearch = searchQuery && searchQuery.trim().length > 0;

  // Announce no results
  React.useEffect(() => {
    let message = `No ${entityName} found`;
    if (hasSearch) {
      message += ` for "${searchQuery}"`;
    }
    if (hasFilters) {
      message += ` with ${appliedFilters.length} ${appliedFilters.length === 1 ? 'filter' : 'filters'} applied`;
    }
    announce(message);
  }, [searchQuery, appliedFilters, entityName, announce, hasSearch, hasFilters]);

  // Generate default suggestions
  const defaultSuggestions = React.useMemo(() => {
    const suggestionsList: string[] = [];

    if (hasSearch) {
      suggestionsList.push('Check your spelling');
      suggestionsList.push('Try using fewer keywords');
    }

    if (hasFilters) {
      suggestionsList.push('Try removing some filters');
      suggestionsList.push('Expand your date range');
    }

    if (!hasSearch && !hasFilters) {
      suggestionsList.push('Try a different search term');
    }

    return suggestionsList;
  }, [hasSearch, hasFilters]);

  const displaySuggestions = suggestions || defaultSuggestions;

  return (
    <View
      style={styles.container}
      accessibilityRole="text"
      accessibilityLabel={`No ${entityName} found${hasSearch ? ` for ${searchQuery}` : ''}`}
      testID={testID}
    >
      {/* Icon */}
      <View style={styles.iconContainer} accessibilityElementsHidden>
        <Text style={styles.icon}>🔍</Text>
      </View>

      {/* Title */}
      <Text style={styles.title} accessibilityRole="header">
        No {entityName} found
      </Text>

      {/* Search Query Display */}
      {hasSearch && (
        <View style={styles.searchQueryContainer}>
          <Text style={styles.searchQueryLabel}>Search:</Text>
          <Text style={styles.searchQueryText}>"{searchQuery}"</Text>
        </View>
      )}

      {/* Applied Filters */}
      {hasFilters && (
        <View style={styles.filtersContainer}>
          <Text style={styles.filtersLabel}>Active filters:</Text>
          <View style={styles.filterChips}>
            {appliedFilters.map((filter, index) => (
              <View key={index} style={styles.filterChip}>
                <Text style={styles.filterChipText}>{filter}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Suggestions */}
      {displaySuggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <Text style={styles.suggestionsTitle}>Suggestions:</Text>
          {displaySuggestions.map((suggestion, index) => (
            <View key={index} style={styles.suggestionItem}>
              <Text style={styles.suggestionBullet}>•</Text>
              <Text style={styles.suggestionText}>{suggestion}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Actions */}
      <View style={styles.actionsContainer}>
        {hasSearch && onClearSearch && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={onClearSearch}
            accessibilityRole="button"
            accessibilityLabel="Clear search"
            accessibilityHint="Clears the current search query"
          >
            <Text style={styles.clearButtonText}>Clear Search</Text>
          </TouchableOpacity>
        )}

        {hasFilters && onClearFilters && (
          <TouchableOpacity
            style={[styles.clearButton, styles.clearFiltersButton]}
            onPress={onClearFilters}
            accessibilityRole="button"
            accessibilityLabel="Clear all filters"
            accessibilityHint="Removes all applied filters"
          >
            <Text style={styles.clearButtonText}>Clear Filters</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Recent Searches */}
      {recentSearches && recentSearches.length > 0 && onRecentSearchPress && (
        <View style={styles.recentSearchesContainer}>
          <Text style={styles.recentSearchesTitle}>Recent searches:</Text>
          <View style={styles.recentSearchesList}>
            {recentSearches.slice(0, 3).map((search, index) => (
              <TouchableOpacity
                key={index}
                style={styles.recentSearchItem}
                onPress={() => onRecentSearchPress(search)}
                accessibilityRole="button"
                accessibilityLabel={`Search for ${search}`}
              >
                <Text style={styles.recentSearchIcon}>🕐</Text>
                <Text style={styles.recentSearchText}>{search}</Text>
              </TouchableOpacity>
            ))}
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
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fff3e0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  icon: {
    fontSize: 28,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  searchQueryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchQueryLabel: {
    fontSize: 13,
    color: '#666',
    marginRight: 8,
  },
  searchQueryText: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
    fontStyle: 'italic',
  },
  filtersContainer: {
    width: '100%',
    marginBottom: 16,
  },
  filtersLabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  filterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  filterChipText: {
    fontSize: 12,
    color: '#1976D2',
  },
  suggestionsContainer: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
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
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  clearButton: {
    backgroundColor: '#1976D2',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
  },
  clearFiltersButton: {
    backgroundColor: '#ff9800',
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  recentSearchesContainer: {
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 16,
  },
  recentSearchesTitle: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  recentSearchesList: {
    gap: 8,
  },
  recentSearchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  recentSearchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  recentSearchText: {
    fontSize: 14,
    color: '#1976D2',
  },
});

export default NoSearchResults;
