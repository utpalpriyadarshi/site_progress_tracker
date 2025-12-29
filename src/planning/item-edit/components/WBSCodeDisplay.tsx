/**
 * WBSCodeDisplay Component
 *
 * Displays read-only WBS code with level information
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Surface, HelperText } from 'react-native-paper';

interface WBSCodeDisplayProps {
  wbsCode: string;
  wbsLevel: number;
}

export const WBSCodeDisplay: React.FC<WBSCodeDisplayProps> = ({
  wbsCode,
  wbsLevel,
}) => {
  return (
    <View style={styles.section}>
      <Text variant="labelLarge" style={styles.sectionTitle}>
        WBS Code (Read-Only)
      </Text>
      <Surface style={styles.codePreview}>
        <Text variant="titleMedium" style={styles.codeText}>
          {wbsCode}
        </Text>
      </Surface>
      <HelperText type="info">
        WBS codes cannot be changed after creation (Level {wbsLevel})
      </HelperText>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 8,
    fontWeight: 'bold',
  },
  codePreview: {
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#9e9e9e',
    alignItems: 'center',
  },
  codeText: {
    fontFamily: 'monospace',
    color: '#424242',
    fontWeight: 'bold',
  },
});
