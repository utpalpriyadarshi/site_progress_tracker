import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Searchbar, Text } from 'react-native-paper';

interface BomListHeaderProps {
  activeTab: 'estimating' | 'execution';
  onTabChange: (tab: 'estimating' | 'execution') => void;
  onImport: () => void;
  onAddBom: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  resultCount?: number;
  totalCount?: number;
  isSearching?: boolean;
}

/**
 * BomListHeader - Header with actions, tabs, and search for BOM management
 */
export const BomListHeader: React.FC<BomListHeaderProps> = ({
  activeTab,
  onTabChange,
  onImport,
  onAddBom,
  searchQuery = '',
  onSearchChange,
  resultCount,
  totalCount,
  isSearching = false,
}) => {
  return (
    <>
      {/* Header Actions */}
      <View style={styles.header}>
        <View style={styles.headerButtons}>
          <Button
            mode="outlined"
            icon="upload"
            onPress={onImport}
            style={styles.importButton}
            compact
          >
            Import
          </Button>
          <Button
            mode="contained"
            icon="plus"
            onPress={onAddBom}
            style={styles.addButton}
          >
            Add BOM
          </Button>
        </View>
      </View>

      {/* Search Bar */}
      {onSearchChange && (
        <View style={styles.searchContainer}>
          <Searchbar
            placeholder="Search BOMs by name, category, status..."
            value={searchQuery}
            onChangeText={onSearchChange}
            style={styles.searchBar}
            inputStyle={styles.searchInput}
            accessibilityLabel="Search BOMs"
            accessibilityHint="Type to filter BOMs by name, category, or status"
          />
          {isSearching && resultCount !== undefined && totalCount !== undefined && (
            <Text style={styles.resultCount}>
              Showing {resultCount} of {totalCount}
            </Text>
          )}
        </View>
      )}

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <Button
          mode={activeTab === 'estimating' ? 'contained' : 'outlined'}
          onPress={() => onTabChange('estimating')}
          style={styles.tabButton}
        >
          Pre-Contract (Estimating)
        </Button>
        <Button
          mode={activeTab === 'execution' ? 'contained' : 'outlined'}
          onPress={() => onTabChange('execution')}
          style={styles.tabButton}
        >
          Post-Contract (Execution)
        </Button>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  importButton: {
    marginRight: 8,
  },
  addButton: {
    marginLeft: 0,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchBar: {
    elevation: 0,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  searchInput: {
    fontSize: 14,
  },
  resultCount: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'right',
  },
  tabsContainer: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tabButton: {
    flex: 1,
  },
});
