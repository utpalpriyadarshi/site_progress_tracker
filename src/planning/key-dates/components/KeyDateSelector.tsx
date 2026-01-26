/**
 * KeyDateSelector Component
 *
 * A picker component for selecting a Key Date to link to an item.
 * Shows key dates grouped by category with status indicators.
 *
 * @version 1.0.0
 * @since Phase 5c - Key Dates Integration
 */

import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import {
  Portal,
  Dialog,
  Button,
  Text,
  Searchbar,
  Chip,
  Divider,
  List,
  IconButton,
} from 'react-native-paper';
import { database } from '../../../../models/database';
import { withObservables } from '@nozbe/watermelondb/react';
import { Q } from '@nozbe/watermelondb';
import KeyDateModel, { KeyDateCategory } from '../../../../models/KeyDateModel';
import { KeyDateStatusBadge } from './KeyDateStatusBadge';
import {
  KEY_DATE_CATEGORY_COLORS,
  KEY_DATE_STATUS_COLORS,
} from '../utils/keyDateConstants';

// ==================== Types ====================

interface KeyDateSelectorInputProps {
  projectId: string;
  selectedKeyDateId?: string | null;
  onSelect: (keyDateId: string | null) => void;
  disabled?: boolean;
  label?: string;
}

interface KeyDateSelectorObservedProps {
  keyDates: KeyDateModel[];
}

type KeyDateSelectorProps = KeyDateSelectorInputProps & KeyDateSelectorObservedProps;

// ==================== Main Component ====================

const KeyDateSelectorComponent: React.FC<KeyDateSelectorProps> = ({
  keyDates,
  selectedKeyDateId,
  onSelect,
  disabled = false,
  label = 'Link to Key Date',
}) => {
  const [dialogVisible, setDialogVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<KeyDateCategory | 'all'>('all');

  // Find selected key date
  const selectedKeyDate = useMemo(
    () => keyDates.find((kd) => kd.id === selectedKeyDateId),
    [keyDates, selectedKeyDateId]
  );

  // Filter key dates
  const filteredKeyDates = useMemo(() => {
    let result = keyDates;

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (kd) =>
          kd.code.toLowerCase().includes(query) ||
          kd.description.toLowerCase().includes(query)
      );
    }

    // Filter by category
    if (categoryFilter !== 'all') {
      result = result.filter((kd) => kd.category === categoryFilter);
    }

    // Sort by sequence
    return result.sort((a, b) => a.sequenceOrder - b.sequenceOrder);
  }, [keyDates, searchQuery, categoryFilter]);

  // Group by category
  const groupedKeyDates = useMemo(() => {
    const groups: Record<string, KeyDateModel[]> = {};
    filteredKeyDates.forEach((kd) => {
      if (!groups[kd.category]) {
        groups[kd.category] = [];
      }
      groups[kd.category].push(kd);
    });
    return groups;
  }, [filteredKeyDates]);

  // Handlers
  const handleOpen = useCallback(() => {
    if (!disabled) {
      setDialogVisible(true);
    }
  }, [disabled]);

  const handleClose = useCallback(() => {
    setDialogVisible(false);
    setSearchQuery('');
    setCategoryFilter('all');
  }, []);

  const handleSelect = useCallback(
    (keyDateId: string) => {
      onSelect(keyDateId);
      handleClose();
    },
    [onSelect, handleClose]
  );

  const handleClear = useCallback(() => {
    onSelect(null);
  }, [onSelect]);

  // Unique categories
  const categories = useMemo(() => {
    const uniqueCats = new Set(keyDates.map((kd) => kd.category));
    return Array.from(uniqueCats).sort();
  }, [keyDates]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      {/* Selection Button */}
      <TouchableOpacity
        onPress={handleOpen}
        disabled={disabled}
        style={[styles.selectorButton, disabled && styles.disabledButton]}
        accessibilityRole="button"
        accessibilityLabel={selectedKeyDate ? `Selected: ${selectedKeyDate.code}` : 'Select key date'}
      >
        <View style={styles.selectorContent}>
          {selectedKeyDate ? (
            <>
              <View
                style={[
                  styles.categoryIndicator,
                  { backgroundColor: KEY_DATE_CATEGORY_COLORS[selectedKeyDate.category] },
                ]}
              />
              <View style={styles.selectedInfo}>
                <Text style={styles.selectedCode}>{selectedKeyDate.code}</Text>
                <Text style={styles.selectedDescription} numberOfLines={1}>
                  {selectedKeyDate.description}
                </Text>
              </View>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: KEY_DATE_STATUS_COLORS[selectedKeyDate.status] },
                ]}
              />
            </>
          ) : (
            <Text style={styles.placeholder}>No key date linked</Text>
          )}
        </View>

        {selectedKeyDate ? (
          <IconButton
            icon="close"
            size={18}
            onPress={handleClear}
            accessibilityLabel="Clear selection"
          />
        ) : (
          <IconButton icon="chevron-down" size={18} disabled />
        )}
      </TouchableOpacity>

      {/* Selection Dialog */}
      <Portal>
        <Dialog visible={dialogVisible} onDismiss={handleClose} style={styles.dialog}>
          <Dialog.Title>Select Key Date</Dialog.Title>

          <Dialog.Content style={styles.dialogContent}>
            {/* Search */}
            <Searchbar
              placeholder="Search key dates..."
              onChangeText={setSearchQuery}
              value={searchQuery}
              style={styles.searchbar}
            />

            {/* Category Filter */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoryFilter}
            >
              <Chip
                mode={categoryFilter === 'all' ? 'flat' : 'outlined'}
                selected={categoryFilter === 'all'}
                onPress={() => setCategoryFilter('all')}
                style={styles.filterChip}
                compact
              >
                All
              </Chip>
              {categories.map((cat) => (
                <Chip
                  key={cat}
                  mode={categoryFilter === cat ? 'flat' : 'outlined'}
                  selected={categoryFilter === cat}
                  onPress={() => setCategoryFilter(cat as KeyDateCategory)}
                  style={[
                    styles.filterChip,
                    categoryFilter === cat && {
                      backgroundColor: KEY_DATE_CATEGORY_COLORS[cat as KeyDateCategory],
                    },
                  ]}
                  textStyle={categoryFilter === cat ? { color: 'white' } : undefined}
                  compact
                >
                  {cat}
                </Chip>
              ))}
            </ScrollView>

            <Divider style={styles.divider} />

            {/* Key Dates List */}
            <ScrollView style={styles.listContainer}>
              {filteredKeyDates.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No key dates found</Text>
                </View>
              ) : (
                Object.entries(groupedKeyDates).map(([category, items]) => (
                  <View key={category}>
                    <View style={styles.categoryHeader}>
                      <View
                        style={[
                          styles.categoryDot,
                          { backgroundColor: KEY_DATE_CATEGORY_COLORS[category as KeyDateCategory] },
                        ]}
                      />
                      <Text style={styles.categoryTitle}>
                        {items[0].categoryName || category}
                      </Text>
                    </View>

                    {items.map((keyDate) => (
                      <TouchableOpacity
                        key={keyDate.id}
                        onPress={() => handleSelect(keyDate.id)}
                        style={[
                          styles.keyDateItem,
                          selectedKeyDateId === keyDate.id && styles.selectedItem,
                        ]}
                      >
                        <View style={styles.keyDateInfo}>
                          <Text style={styles.keyDateCode}>{keyDate.code}</Text>
                          <Text style={styles.keyDateDescription} numberOfLines={2}>
                            {keyDate.description}
                          </Text>
                          <Text style={styles.keyDateDays}>
                            Target: {keyDate.targetDays} days
                          </Text>
                        </View>
                        <KeyDateStatusBadge status={keyDate.status} compact />
                      </TouchableOpacity>
                    ))}
                  </View>
                ))
              )}
            </ScrollView>
          </Dialog.Content>

          <Dialog.Actions>
            <Button onPress={handleClose}>Cancel</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

// ==================== WatermelonDB Enhancement ====================

const enhance = withObservables(
  ['projectId'],
  ({ projectId }: KeyDateSelectorInputProps) => ({
    keyDates: database.collections
      .get<KeyDateModel>('key_dates')
      .query(Q.where('project_id', projectId))
      .observe(),
  })
);

export const KeyDateSelector = enhance(
  KeyDateSelectorComponent as React.ComponentType<KeyDateSelectorInputProps>
);

// ==================== Styles ====================

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  selectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: 'white',
    minHeight: 48,
    paddingLeft: 12,
  },
  disabledButton: {
    backgroundColor: '#F5F5F5',
    opacity: 0.7,
  },
  selectorContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIndicator: {
    width: 4,
    height: 32,
    borderRadius: 2,
    marginRight: 12,
  },
  selectedInfo: {
    flex: 1,
  },
  selectedCode: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  selectedDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  placeholder: {
    fontSize: 14,
    color: '#999',
  },
  dialog: {
    maxHeight: '80%',
  },
  dialogContent: {
    paddingHorizontal: 0,
  },
  searchbar: {
    marginHorizontal: 16,
    marginBottom: 12,
    elevation: 0,
    backgroundColor: '#F5F5F5',
  },
  categoryFilter: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  filterChip: {
    marginRight: 8,
  },
  divider: {
    marginBottom: 8,
  },
  listContainer: {
    maxHeight: 350,
    paddingHorizontal: 16,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    color: '#999',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    marginTop: 8,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  keyDateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginVertical: 4,
    backgroundColor: '#FAFAFA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedItem: {
    borderColor: '#2196F3',
    backgroundColor: '#E3F2FD',
  },
  keyDateInfo: {
    flex: 1,
    marginRight: 8,
  },
  keyDateCode: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  keyDateDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  keyDateDays: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
});

export default KeyDateSelector;
