/**
 * Step2MapColumns - Column mapping interface
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Title, Paragraph, Divider, DataTable } from 'react-native-paper';
import { getRequiredFields } from '../../../utils/BomFileParser';

interface Step2MapColumnsProps {
  columnMapping: Record<string, string>;
}

export const Step2MapColumns: React.FC<Step2MapColumnsProps> = ({ columnMapping }) => {
  const requiredFields = getRequiredFields();

  return (
    <Card mode="elevated" style={styles.contentCard}>
      <Card.Content>
        <Title style={styles.contentTitle}>Step 2: Map Columns</Title>
        <Paragraph style={styles.contentSubtitle}>
          Auto-detected column mapping (modify if needed)
        </Paragraph>

        <View style={styles.mappingContainer}>
          <Paragraph style={styles.mappingNote}>
            ✓ {Object.keys(columnMapping).length} columns auto-mapped
          </Paragraph>
          <Paragraph style={styles.mappingNote}>
            Required fields: {requiredFields.join(', ')}
          </Paragraph>

          <Divider style={styles.divider} />

          <DataTable>
            <DataTable.Header>
              <DataTable.Title>BOM Field</DataTable.Title>
              <DataTable.Title>Excel Column</DataTable.Title>
              <DataTable.Title>Required</DataTable.Title>
            </DataTable.Header>

            {Object.keys(columnMapping).map(field => (
              <DataTable.Row key={field}>
                <DataTable.Cell>{field}</DataTable.Cell>
                <DataTable.Cell>{columnMapping[field]}</DataTable.Cell>
                <DataTable.Cell>{requiredFields.includes(field) ? '✓' : ''}</DataTable.Cell>
              </DataTable.Row>
            ))}
          </DataTable>
        </View>
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
  mappingContainer: {
    marginTop: 10,
  },
  mappingNote: {
    fontSize: 13,
    color: '#666',
    marginVertical: 3,
  },
  divider: {
    marginVertical: 15,
  },
});
