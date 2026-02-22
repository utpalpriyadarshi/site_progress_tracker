/**
 * KeyDateProgressScreen
 *
 * Standalone screen for the Key Date Progress tab.
 * Wraps KeyDateProgressWidget in a scrollable container.
 *
 * @version 1.0.0
 */

import React from 'react';
import { ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { useTheme } from 'react-native-paper';
import { KeyDateProgressWidget } from './dashboard/widgets';

const KeyDateProgressScreen: React.FC = () => {
  const theme = useTheme();
  const [refreshing, setRefreshing] = React.useState(false);
  const [refreshKey, setRefreshKey] = React.useState(0);

  const handleRefresh = React.useCallback(async () => {
    setRefreshing(true);
    setRefreshKey(prev => prev + 1);
    await new Promise<void>(resolve => setTimeout(() => resolve(), 400));
    setRefreshing(false);
  }, []);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={[theme.colors.primary]}
          tintColor={theme.colors.primary}
        />
      }
    >
      <KeyDateProgressWidget key={refreshKey} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    paddingBottom: 24,
  },
});

export default KeyDateProgressScreen;
