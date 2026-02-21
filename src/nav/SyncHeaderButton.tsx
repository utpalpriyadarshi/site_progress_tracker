import React, { useState, useEffect } from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AutoSyncManager from '../../services/sync/AutoSyncManager';

interface SyncHeaderButtonProps {
  tintColor?: string;
}

/**
 * A header button that triggers a manual sync and reflects syncing state.
 * Subscribe to AutoSyncManager to keep isSyncing in sync.
 */
const SyncHeaderButton: React.FC<SyncHeaderButtonProps> = ({ tintColor = '#FFF' }) => {
  const [isSyncing, setIsSyncing] = useState(() => AutoSyncManager.getSyncState().isSyncing);

  useEffect(() => {
    return AutoSyncManager.addListener((state) => {
      setIsSyncing(state.isSyncing);
    });
  }, []);

  const handlePress = () => {
    if (!isSyncing) {
      AutoSyncManager.manualSync();
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={isSyncing}
      style={styles.button}
      accessibilityLabel={isSyncing ? 'Syncing…' : 'Sync now'}
      accessibilityRole="button"
    >
      <Icon
        name={isSyncing ? 'loading' : 'sync'}
        size={22}
        color={isSyncing ? `${tintColor}80` : tintColor}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SyncHeaderButton;
