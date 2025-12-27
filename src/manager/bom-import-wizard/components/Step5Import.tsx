/**
 * Step5Import - Import execution screen
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Title, Paragraph, ProgressBar } from 'react-native-paper';

interface Step5ImportProps {
  importing: boolean;
  importProgress: number;
  itemCount: number;
}

export const Step5Import: React.FC<Step5ImportProps> = ({
  importing,
  importProgress,
  itemCount,
}) => {
  return (
    <Card style={styles.contentCard}>
      <Card.Content>
        <Title style={styles.contentTitle}>Step 5: Import</Title>
        <Paragraph style={styles.contentSubtitle}>
          {importing ? 'Importing data to database...' : 'Ready to import'}
        </Paragraph>

        {importing && (
          <View style={styles.importProgress}>
            <ProgressBar progress={importProgress / 100} color="#4CAF50" />
            <Paragraph style={styles.progressText}>{Math.round(importProgress)}%</Paragraph>
          </View>
        )}

        {!importing && (
          <View style={styles.importReady}>
            <Paragraph style={styles.readyText}>✓ {itemCount} items ready to import</Paragraph>
            <Paragraph style={styles.readyNote}>
              Click "Finish" to start the import process
            </Paragraph>
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
  importProgress: {
    marginVertical: 20,
  },
  progressText: {
    textAlign: 'center',
    marginTop: 10,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  importReady: {
    padding: 20,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    alignItems: 'center',
  },
  readyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 10,
  },
  readyNote: {
    fontSize: 14,
    color: '#666',
  },
});
