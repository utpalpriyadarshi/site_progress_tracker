import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useCommercial } from './context/CommercialContext';

/**
 * InvoiceManagementScreen (v2.11 Phase 5 - Sprint 3 Placeholder)
 *
 * Will display:
 * - Project invoices
 * - Invoice status (Pending, Paid, Overdue)
 * - Payment tracking
 * - Add/Edit/Delete invoices
 * - Invoice aging report
 *
 * Full implementation in Sprint 6
 */

const InvoiceManagementScreen = () => {
  const { projectName } = useCommercial();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Invoice Management</Text>
        {projectName ? (
          <Text style={styles.subtitle}>Project: {projectName}</Text>
        ) : (
          <Text style={styles.warning}>No project assigned</Text>
        )}
      </View>

      <View style={styles.content}>
        <Text style={styles.placeholder}>
          Invoice Management will display:
          {'\n\n'}
          • Project invoices list
          {'\n'}
          • Invoice status filter (Pending/Paid/Overdue)
          {'\n'}
          • Payment tracking
          {'\n'}
          • Add/Edit/Delete invoices
          {'\n'}
          • Invoice aging report
          {'\n\n'}
          (Full implementation in Sprint 6)
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  warning: {
    fontSize: 16,
    color: '#ff6b6b',
    marginTop: 5,
  },
  content: {
    padding: 20,
  },
  placeholder: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
});

export default InvoiceManagementScreen;
