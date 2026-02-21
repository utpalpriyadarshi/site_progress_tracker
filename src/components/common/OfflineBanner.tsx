import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import NetworkMonitor from '../../../services/network/NetworkMonitor';

export const OfflineBanner: React.FC = () => {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    return NetworkMonitor.addListener((isConnected) => {
      setIsOffline(!isConnected);
    });
  }, []);

  if (!isOffline) return null;

  return (
    <View style={styles.banner} accessibilityRole="alert" accessibilityLiveRegion="polite">
      <Icon name="wifi-off" size={16} color="#FFF" style={styles.icon} />
      <Text style={styles.text}>You're offline — changes will sync when reconnected</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#B00020',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  icon: {
    marginRight: 10,
  },
  text: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
});
