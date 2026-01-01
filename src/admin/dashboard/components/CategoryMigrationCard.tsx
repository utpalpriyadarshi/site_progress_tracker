import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Title, Paragraph, Button, ActivityIndicator } from 'react-native-paper';

interface CategoryMigrationCardProps {
  isMigrating: boolean;
  onMigrate: () => void;
}

export const CategoryMigrationCard: React.FC<CategoryMigrationCardProps> = ({
  isMigrating,
  onMigrate,
}) => {
  return (
    <Card style={[styles.card, { backgroundColor: '#E3F2FD' }]}>
      <Card.Content>
        <Title>📋 Category Names Migration (v2.18)</Title>
        <Paragraph style={styles.cardDescription}>
          Update category names to reflect construction sequence
        </Paragraph>
        <View style={styles.migrationStats}>
          <Paragraph style={{ fontWeight: 'bold', marginBottom: 5 }}>Changes:</Paragraph>
          <Paragraph>• "Finishing" → "Handing Over"</Paragraph>
          <Paragraph>• "Framing" → "Punch List"</Paragraph>
          <Paragraph style={{ marginTop: 10, fontSize: 12, color: '#666' }}>
            ✓ Safe - only renames categories{'\n'}
            ✓ Non-destructive - items remain linked{'\n'}
            ✓ Reversible - can be rolled back
          </Paragraph>
        </View>
        <Button
          mode="contained"
          onPress={onMigrate}
          style={[styles.actionButton, { backgroundColor: '#2196F3' }]}
          disabled={isMigrating}
          loading={isMigrating}
        >
          {isMigrating ? 'Migrating...' : 'Migrate Category Names'}
        </Button>
        {isMigrating && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#2196F3" />
            <Paragraph style={{ marginLeft: 10 }}>Updating categories...</Paragraph>
          </View>
        )}
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    margin: 15,
    marginBottom: 10,
  },
  cardDescription: {
    marginTop: 5,
    marginBottom: 15,
    color: '#666',
  },
  migrationStats: {
    marginVertical: 10,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 5,
  },
  actionButton: {
    marginTop: 10,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 5,
  },
});
