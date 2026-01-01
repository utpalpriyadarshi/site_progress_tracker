import React from 'react';
import { StyleSheet } from 'react-native';
import { Card, Title, Paragraph, Button } from 'react-native-paper';

interface DatabaseResetCardProps {
  onReset: () => void;
}

export const DatabaseResetCard: React.FC<DatabaseResetCardProps> = ({ onReset }) => {
  return (
    <Card style={[styles.card, { backgroundColor: '#FFE5E5' }]}>
      <Card.Content>
        <Title>🗄️ Database Reset (v2.11)</Title>
        <Paragraph style={styles.cardDescription}>
          Clear all data and re-initialize with default users (including new Design Engineer)
        </Paragraph>
        <Paragraph style={{ color: '#D32F2F', fontWeight: 'bold', marginVertical: 10 }}>
          ⚠️ WARNING: This will delete ALL local data!
        </Paragraph>
        <Button
          mode="contained"
          onPress={onReset}
          style={[styles.actionButton, { backgroundColor: '#D32F2F' }]}
        >
          Reset Database
        </Button>
        <Paragraph style={{ fontSize: 12, color: '#666', marginTop: 10 }}>
          After reset, restart app to re-initialize. New user: designer / Designer@2025
        </Paragraph>
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
  actionButton: {
    marginTop: 10,
  },
});
