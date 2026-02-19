import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Surface, HelperText, ActivityIndicator } from 'react-native-paper';
import { WBSCodeGenerator } from '../../../../services/planning/WBSCodeGenerator';
import { COLORS } from '../../../theme/colors';

interface WBSCodeDisplayProps {
  generatedWbsCode: string;
  parentWbsCode: string | null;
  generatingCode: boolean;
}

export const WBSCodeDisplay: React.FC<WBSCodeDisplayProps> = ({
  generatedWbsCode,
  parentWbsCode,
  generatingCode,
}) => {
  return (
    <View style={styles.section}>
      <Text variant="labelLarge" style={styles.sectionTitle}>
        WBS Code (Auto-generated)
      </Text>
      <Surface style={styles.codePreview}>
        {generatingCode ? (
          <ActivityIndicator size="small" color="#1976D2" />
        ) : (
          <Text variant="titleMedium" style={styles.codeText}>
            {generatedWbsCode || 'Generating...'}
          </Text>
        )}
      </Surface>
      {parentWbsCode && (
        <HelperText type="info">
          Child of: {parentWbsCode}
        </HelperText>
      )}
      {generatedWbsCode && !parentWbsCode && (
        <HelperText type="info">
          This will be a root-level item (Level 1)
        </HelperText>
      )}
      {generatedWbsCode && parentWbsCode && (
        <HelperText type="info">
          This will be a child item (Level {WBSCodeGenerator.calculateLevel(generatedWbsCode)})
        </HelperText>
      )}
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
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.INFO,
    alignItems: 'center',
  },
  codeText: {
    fontFamily: 'monospace',
    color: '#1976D2',
    fontWeight: 'bold',
  },
});
