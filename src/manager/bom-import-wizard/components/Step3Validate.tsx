/**
 * Step3Validate - Data validation results display
 */

import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Card, Title, Paragraph, Chip } from 'react-native-paper';
import { ValidationError } from '../hooks/useImportData';
import { COLORS } from '../../../theme/colors';

interface Step3ValidateProps {
  validationErrors: ValidationError[];
  rowCount: number;
}

export const Step3Validate: React.FC<Step3ValidateProps> = ({
  validationErrors,
  rowCount,
}) => {
  const errorCount = validationErrors.filter(e => e.severity === 'error').length;
  const warningCount = validationErrors.filter(e => e.severity === 'warning').length;

  return (
    <Card mode="elevated" style={styles.contentCard}>
      <Card.Content>
        <Title style={styles.contentTitle}>Step 3: Validate Data</Title>
        <Paragraph style={styles.contentSubtitle}>
          Checking {rowCount} rows for errors
        </Paragraph>

        <View style={styles.validationSummary}>
          {errorCount === 0 ? (
            <Chip icon="check-circle" style={styles.validChip}>
              No Errors Found
            </Chip>
          ) : (
            <Chip icon="alert-circle" style={styles.errorChip}>
              {errorCount} Errors Found
            </Chip>
          )}

          {warningCount > 0 && (
            <Chip icon="alert" style={styles.warningChip}>
              {warningCount} Warnings
            </Chip>
          )}
        </View>

        {validationErrors.length > 0 && (
          <View style={styles.errorList}>
            <Paragraph style={styles.errorListTitle}>Validation Issues:</Paragraph>
            <ScrollView style={styles.errorScroll}>
              {validationErrors.slice(0, 20).map((error, index) => (
                <View key={index} style={styles.errorItem}>
                  <Paragraph style={styles.errorText}>
                    Row {error.row}: {error.column} - {error.message}
                  </Paragraph>
                </View>
              ))}
              {validationErrors.length > 20 && (
                <Paragraph style={styles.errorMore}>
                  ...and {validationErrors.length - 20} more
                </Paragraph>
              )}
            </ScrollView>
          </View>
        )}
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  contentCard: {
    margin: 15,
    marginTop: 10,
  },
  contentTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  contentSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  validationSummary: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 15,
  },
  validChip: {
    backgroundColor: COLORS.SUCCESS,
    marginRight: 10,
    marginBottom: 10,
  },
  errorChip: {
    backgroundColor: COLORS.ERROR,
    marginRight: 10,
    marginBottom: 10,
  },
  warningChip: {
    backgroundColor: '#FFC107',
    marginRight: 10,
    marginBottom: 10,
  },
  errorList: {
    marginTop: 10,
  },
  errorListTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  errorScroll: {
    maxHeight: 200,
  },
  errorItem: {
    padding: 10,
    backgroundColor: COLORS.ERROR_BG,
    borderRadius: 4,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 13,
    color: '#C62828',
  },
  errorMore: {
    fontSize: 13,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 10,
  },
});
