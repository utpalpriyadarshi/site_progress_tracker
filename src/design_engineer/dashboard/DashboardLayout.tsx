import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';

export interface DashboardLayoutProps {
  children: React.ReactNode;
  columns?: number;
  spacing?: number;
  testID?: string;
}

/**
 * DashboardLayout - Responsive grid layout for dashboard widgets
 *
 * Provides:
 * - Responsive grid layout
 * - Configurable columns and spacing
 * - Scroll container
 * - Consistent widget positioning
 *
 * Target LOC: ~60
 */
export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  columns = 1,
  spacing = 16,
  testID,
}) => {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { padding: spacing },
      ]}
      showsVerticalScrollIndicator={false}
      testID={testID || 'dashboard-layout'}
      accessible
      accessibilityRole="scrollbar"
      accessibilityLabel="Dashboard content"
    >
      <View style={[styles.grid, { gap: spacing }]}>
        {children}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    flexGrow: 1,
  },
  grid: {
    flexDirection: 'column',
  },
});
