import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Searchbar, Menu, Button } from 'react-native-paper';
import { PAYMENT_STATUSES, getStatusLabel } from '../utils';

interface FiltersBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedStatus: string | null;
  onStatusChange: (status: string | null) => void;
}

export const FiltersBar: React.FC<FiltersBarProps> = ({
  searchQuery,
  onSearchChange,
  selectedStatus,
  onStatusChange,
}) => {
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  return (
    <View style={styles.controls}>
      <Searchbar
        placeholder="Search invoices..."
        onChangeText={onSearchChange}
        value={searchQuery}
        style={styles.searchbar}
      />
      <Menu
        visible={showFilterMenu}
        onDismiss={() => setShowFilterMenu(false)}
        anchor={
          <Button
            mode="outlined"
            onPress={() => setShowFilterMenu(true)}
            style={styles.filterButton}
          >
            {selectedStatus ? getStatusLabel(selectedStatus) : 'All Status'}
          </Button>
        }
      >
        <Menu.Item
          onPress={() => {
            onStatusChange(null);
            setShowFilterMenu(false);
          }}
          title="All Status"
        />
        {PAYMENT_STATUSES.map((status) => (
          <Menu.Item
            key={status.value}
            onPress={() => {
              onStatusChange(status.value);
              setShowFilterMenu(false);
            }}
            title={status.label}
          />
        ))}
      </Menu>
    </View>
  );
};

const styles = StyleSheet.create({
  controls: {
    padding: 16,
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchbar: {
    flex: 1,
    elevation: 0,
  },
  filterButton: {
    borderColor: '#007AFF',
  },
});
