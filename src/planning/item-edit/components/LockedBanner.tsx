/**
 * LockedBanner Component
 *
 * Displays warning banner when item is baseline-locked
 */

import React from 'react';
import { StyleSheet } from 'react-native';
import { Banner } from 'react-native-paper';

interface LockedBannerProps {
  visible: boolean;
}

export const LockedBanner: React.FC<LockedBannerProps> = ({ visible }) => {
  return (
    <Banner
      visible={visible}
      icon="lock"
      style={styles.banner}
    >
      This item is baseline-locked and cannot be edited. You can only view the details.
    </Banner>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#fff3e0',
  },
});
