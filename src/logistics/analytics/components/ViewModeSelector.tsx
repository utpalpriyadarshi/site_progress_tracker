/**
 * ViewModeSelector Component
 *
 * Horizontal tab selector for switching between analytics view modes
 * Phase 3: Small Components
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { ViewMode, VIEW_MODE_TABS } from '../utils/analyticsConstants';

interface ViewModeSelectorProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export const ViewModeSelector: React.FC<ViewModeSelectorProps> = ({
  viewMode,
  onViewModeChange,
}) => {
  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {VIEW_MODE_TABS.map(tab => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.button, viewMode === tab.id && styles.buttonActive]}
            onPress={() => onViewModeChange(tab.id)}
          >
            <Text style={[styles.text, viewMode === tab.id && styles.textActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  buttonActive: {
    backgroundColor: '#2196F3',
  },
  text: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  textActive: {
    color: '#FFF',
  },
});
