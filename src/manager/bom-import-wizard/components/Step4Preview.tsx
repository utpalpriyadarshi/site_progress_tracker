/**
 * Step4Preview - Preview data before import
 */

import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Card, Title, Paragraph, Divider, DataTable } from 'react-native-paper';
import { ParsedBomRow } from '../../../utils/BomFileParser';

interface Step4PreviewProps {
  mappedData: ParsedBomRow[];
}

export const Step4Preview: React.FC<Step4PreviewProps> = ({ mappedData }) => {
  const totalCost = mappedData.reduce((sum, item) => sum + (Number(item.totalCost) || 0), 0);

  return (
    <Card style={styles.contentCard}>
      <Card.Content>
        <Title style={styles.contentTitle}>Step 4: Preview & Confirm</Title>
        <Paragraph style={styles.contentSubtitle}>Review the data before importing</Paragraph>

        <View style={styles.previewSummary}>
          <View style={styles.summaryItem}>
            <Paragraph style={styles.summaryLabel}>Total Items:</Paragraph>
            <Paragraph style={styles.summaryValue}>{mappedData.length}</Paragraph>
          </View>
          <View style={styles.summaryItem}>
            <Paragraph style={styles.summaryLabel}>Total Cost:</Paragraph>
            <Paragraph style={styles.summaryValue}>${totalCost.toLocaleString()}</Paragraph>
          </View>
        </View>

        <Divider style={styles.divider} />

        <Paragraph style={styles.previewTitle}>First 10 Items:</Paragraph>
        <ScrollView horizontal style={styles.previewTable}>
          <DataTable>
            <DataTable.Header>
              <DataTable.Title style={styles.tableCell}>Description</DataTable.Title>
              <DataTable.Title style={styles.tableCell}>Category</DataTable.Title>
              <DataTable.Title style={styles.tableCell}>Quantity</DataTable.Title>
              <DataTable.Title style={styles.tableCell}>Unit</DataTable.Title>
              <DataTable.Title style={styles.tableCell}>Unit Cost</DataTable.Title>
              <DataTable.Title style={styles.tableCell}>Total Cost</DataTable.Title>
            </DataTable.Header>

            {mappedData.slice(0, 10).map((item, index) => (
              <DataTable.Row key={index}>
                <DataTable.Cell style={styles.tableCell}>{item.description}</DataTable.Cell>
                <DataTable.Cell style={styles.tableCell}>{item.category}</DataTable.Cell>
                <DataTable.Cell style={styles.tableCell}>{item.quantity}</DataTable.Cell>
                <DataTable.Cell style={styles.tableCell}>{item.unit}</DataTable.Cell>
                <DataTable.Cell style={styles.tableCell}>${item.unitCost}</DataTable.Cell>
                <DataTable.Cell style={styles.tableCell}>${item.totalCost}</DataTable.Cell>
              </DataTable.Row>
            ))}
          </DataTable>
        </ScrollView>

        {mappedData.length > 10 && (
          <Paragraph style={styles.previewMore}>
            ...and {mappedData.length - 10} more items
          </Paragraph>
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
  previewSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 15,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  divider: {
    marginVertical: 15,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  previewTable: {
    marginBottom: 15,
  },
  tableCell: {
    minWidth: 120,
  },
  previewMore: {
    fontSize: 13,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 10,
  },
});
