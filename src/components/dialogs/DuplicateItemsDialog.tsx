/**
 * DuplicateItemsDialog.tsx
 *
 * Dialog for handling duplicate item names during copy operation
 * Part of Phase 4: Copy Items Between Sites Feature
 *
 * Features:
 * - Checkbox list of duplicate item names
 * - Select All / Select None shortcuts
 * - Count badge showing selected items
 * - Three action options: Skip Selected, Create All, Cancel
 *
 * @version 1.0 - Phase 4
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Dialog, Portal, Button, Checkbox, Text, Divider, Chip } from 'react-native-paper';
import { COLORS } from '../../theme/colors';

// ==================== Types ====================

export interface DuplicateItemsDialogProps {
  /** Dialog visibility */
  visible: boolean;

  /** Array of duplicate item names to display */
  duplicateNames: string[];

  /** Callback when user chooses to skip selected duplicates */
  onSkip: (namesToSkip: string[]) => void;

  /** Callback when user chooses to create all duplicates anyway */
  onCreateAll: () => void;

  /** Callback when user cancels the operation */
  onCancel: () => void;
}

// ==================== Component ====================

/**
 * DuplicateItemsDialog Component
 */
export const DuplicateItemsDialog: React.FC<DuplicateItemsDialogProps> = ({
  visible,
  duplicateNames,
  onSkip,
  onCreateAll,
  onCancel,
}) => {
  // ==================== State ====================

  // Selected items to skip (all selected by default)
  const [selectedToSkip, setSelectedToSkip] = useState<Set<string>>(
    new Set(duplicateNames)
  );

  // ==================== Effects ====================

  /**
   * Reset selection when dialog opens
   * Default: all items selected (will be skipped)
   */
  useEffect(() => {
    if (visible) {
      setSelectedToSkip(new Set(duplicateNames));
    }
  }, [visible, duplicateNames]);

  // ==================== Handlers ====================

  /**
   * Toggle individual item selection
   */
  const toggleItem = (name: string) => {
    setSelectedToSkip(prev => {
      const newSet = new Set(prev);
      if (newSet.has(name)) {
        newSet.delete(name);
      } else {
        newSet.add(name);
      }
      return newSet;
    });
  };

  /**
   * Select all items
   */
  const selectAll = () => {
    setSelectedToSkip(new Set(duplicateNames));
  };

  /**
   * Deselect all items
   */
  const selectNone = () => {
    setSelectedToSkip(new Set());
  };

  /**
   * Handle skip selected button
   * Passes array of selected item names to parent
   */
  const handleSkipSelected = () => {
    const namesToSkip = Array.from(selectedToSkip);
    onSkip(namesToSkip);
  };

  /**
   * Handle create all button
   * Tells parent to create all items including duplicates
   */
  const handleCreateAll = () => {
    onCreateAll();
  };

  // ==================== Computed Values ====================

  const selectedCount = selectedToSkip.size;
  const totalCount = duplicateNames.length;

  // ==================== Render Helpers ====================

  /**
   * Render info banner explaining the situation
   */
  const renderInfoBanner = () => (
    <View style={styles.infoBanner}>
      <Text variant="bodyMedium" style={styles.infoText}>
        Found <Text style={styles.bold}>{totalCount} items</Text> with matching names in the destination site.
      </Text>
      <Text variant="bodySmall" style={styles.infoSubtext}>
        Select items to skip or create duplicates anyway.
      </Text>
    </View>
  );

  /**
   * Render selection controls (Select All / None)
   */
  const renderControls = () => (
    <View style={styles.controls}>
      <Chip
        icon="check-all"
        onPress={selectAll}
        style={styles.chip}
        mode={selectedCount === totalCount ? 'flat' : 'outlined'}
      >
        Select All
      </Chip>
      <Chip
        icon="close"
        onPress={selectNone}
        style={styles.chip}
        mode={selectedCount === 0 ? 'flat' : 'outlined'}
      >
        Select None
      </Chip>
      <Text variant="bodySmall" style={styles.countBadge}>
        {selectedCount} selected
      </Text>
    </View>
  );

  /**
   * Render scrollable list of duplicate items with checkboxes
   */
  const renderItemList = () => (
    <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={true}>
      {duplicateNames.map((name, index) => (
        <View key={index} style={styles.listItem}>
          <Checkbox.Android
            status={selectedToSkip.has(name) ? 'checked' : 'unchecked'}
            onPress={() => toggleItem(name)}
          />
          <Text
            variant="bodyMedium"
            style={styles.itemName}
            numberOfLines={2}
            onPress={() => toggleItem(name)}
          >
            {name}
          </Text>
        </View>
      ))}
    </ScrollView>
  );

  /**
   * Render action buttons
   */
  const renderActions = () => (
    <Dialog.Actions style={styles.actions}>
      <Button onPress={onCancel}>
        Cancel
      </Button>
      <Button
        mode="contained"
        onPress={handleCreateAll}
        buttonColor="#FFA726"
        style={styles.actionButton}
      >
        Create All Anyway
      </Button>
      <Button
        mode="contained"
        onPress={handleSkipSelected}
        disabled={selectedCount === 0}
        style={styles.actionButton}
      >
        Skip Selected ({selectedCount})
      </Button>
    </Dialog.Actions>
  );

  // ==================== Main Render ====================

  return (
    <Portal>
      <Dialog
        visible={visible}
        onDismiss={onCancel}
        style={styles.dialog}
      >
        <Dialog.Title style={styles.title}>
          Duplicate Items Found
        </Dialog.Title>

        <Dialog.Content>
          {renderInfoBanner()}
          {renderControls()}
          <Divider style={styles.divider} />
          {renderItemList()}
        </Dialog.Content>

        {renderActions()}
      </Dialog>
    </Portal>
  );
};

// ==================== Styles ====================

const styles = StyleSheet.create({
  dialog: {
    maxWidth: 500,
    alignSelf: 'center',
    width: '90%',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  infoBanner: {
    backgroundColor: COLORS.WARNING_BG,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FFA726',
  },
  infoText: {
    color: '#E65100',
    marginBottom: 4,
  },
  infoSubtext: {
    color: '#BF360C',
  },
  bold: {
    fontWeight: 'bold',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  chip: {
    marginRight: 8,
    marginBottom: 4,
  },
  countBadge: {
    marginLeft: 'auto',
    color: '#666',
    fontWeight: '600',
  },
  divider: {
    marginBottom: 12,
  },
  listContainer: {
    maxHeight: 300,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingRight: 8,
  },
  itemName: {
    flex: 1,
    marginLeft: 8,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: 'flex-end',
  },
  actionButton: {
    marginLeft: 8,
    marginTop: 4,
  },
});

// Export as default for backward compatibility
export default DuplicateItemsDialog;
