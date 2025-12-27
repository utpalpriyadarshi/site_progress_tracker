import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';

interface BomListHeaderProps {
  activeTab: 'estimating' | 'execution';
  onTabChange: (tab: 'estimating' | 'execution') => void;
  onImport: () => void;
  onAddBom: () => void;
}

/**
 * BomListHeader - Header with actions and tabs for BOM management
 */
export const BomListHeader: React.FC<BomListHeaderProps> = ({
  activeTab,
  onTabChange,
  onImport,
  onAddBom,
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
