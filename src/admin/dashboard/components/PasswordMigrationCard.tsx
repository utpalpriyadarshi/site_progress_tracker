import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Title, Paragraph, Button, ActivityIndicator } from 'react-native-paper';

interface MigrationStatus {
  totalUsers: number;
  migratedUsers: number;
  pendingUsers: number;
  percentComplete: number;
}

interface PasswordMigrationCardProps {
  migrationStatus: MigrationStatus;
  isMigrating: boolean;
  onMigrate: () => void;
}

export const PasswordMigrationCard: React.FC<PasswordMigrationCardProps> = ({
  migrationStatus,
  isMigrating,
  onMigrate,
}) => {
  const isComplete = migrationStatus.percentComplete === 100;

  return (
    <Card style={[styles.card, { backgroundColor: '#FFF3CD' }]}>
      <Card.Content>
        <Title>🔐 Password Migration (v2.2)</Title>
        <Paragraph style={styles.cardDescription}>
          Migrate plaintext passwords to bcrypt hashed passwords
        </Paragraph>
        <View style={styles.migrationStats}>
          <Paragraph>Total Users: {migrationStatus.totalUsers}</Paragraph>
          <Paragraph>Migrated: {migrationStatus.migratedUsers}</Paragraph>
          <Paragraph>Pending: {migrationStatus.pendingUsers}</Paragraph>
          <Paragraph
            style={{
              fontWeight: 'bold',
              color: isComplete ? 'green' : 'orange',
            }}
          >
            Progress: {migrationStatus.percentComplete}%
          </Paragraph>
        </View>
        <Button
          mode="contained"
          onPress={onMigrate}
          style={[styles.actionButton, { backgroundColor: '#FFC107' }]}
          disabled={isMigrating || isComplete}
          loading={isMigrating}
        >
          {isComplete ? 'Migration Complete ✓' : 'Run Migration'}
        </Button>
        {isMigrating && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#FFC107" />
            <Paragraph style={{ marginLeft: 10 }}>Migrating passwords...</Paragraph>
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
