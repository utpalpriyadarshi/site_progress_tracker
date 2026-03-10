import React from 'react';
import { StyleSheet } from 'react-native';
import { Card, Title, Paragraph, Button } from 'react-native-paper';

interface ManagementCardProps {
  title: string;
  description: string;
  buttonLabel: string;
  onPress: () => void;
}

export const ManagementCard: React.FC<ManagementCardProps> = ({
  title,
  description,
  buttonLabel,
  onPress,
}) => {
  return (
    <Card mode="elevated" style={styles.card}>
      <Card.Content>
        <Title>{title}</Title>
        <Paragraph style={styles.cardDescription}>{description}</Paragraph>
        <Button mode="contained" onPress={onPress} style={styles.actionButton}>
          {buttonLabel}
        </Button>
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
