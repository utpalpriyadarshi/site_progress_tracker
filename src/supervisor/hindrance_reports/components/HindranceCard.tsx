import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Title, Text, Chip, Divider, Button } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { HindranceWithDetails } from '../types';
import { getPriorityColor, getStatusColor, getStatusLabel, parsePhotos } from '../utils';

interface HindranceCardProps {
  hindranceWithDetails: HindranceWithDetails;
  onEdit: (hindranceWithDetails: HindranceWithDetails) => void;
  onDelete: (hindranceId: string) => void;
}

export const HindranceCard: React.FC<HindranceCardProps> = ({
  hindranceWithDetails,
  onEdit,
  onDelete,
}) => {
  const { hindrance, site, item } = hindranceWithDetails;
  const photos = parsePhotos(hindrance.photos);

  return (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <Title style={styles.title}>{hindrance.title}</Title>
            <Text style={styles.siteName}>{site.name}</Text>
            {item && (
              <Text style={styles.itemName}>Item: {item.name}</Text>
            )}
          </View>
          <View style={styles.headerRight}>
            <Chip
              style={[
                styles.priorityChip,
                { backgroundColor: getPriorityColor(hindrance.priority) },
              ]}
              textStyle={styles.chipText}
            >
              {hindrance.priority.toUpperCase()}
            </Chip>
          </View>
        </View>

        <Divider style={styles.divider} />

        <View style={styles.statusRow}>
          <Chip
            style={[
              styles.statusChip,
              { backgroundColor: getStatusColor(hindrance.status) },
            ]}
            textStyle={styles.chipText}
          >
            {getStatusLabel(hindrance.status)}
          </Chip>
          {hindrance.appSyncStatus && (
            <View style={styles.syncChipContainer}>
              <MaterialCommunityIcons
                name={hindrance.appSyncStatus === 'synced' ? 'cloud-check' : 'cloud-upload'}
                size={16}
                color="#1976D2"
              />
              <Text style={styles.syncChipText}>{hindrance.appSyncStatus}</Text>
            </View>
          )}
          {photos.length > 0 && (
            <Chip icon="camera" style={styles.photoChip}>
              {photos.length}
            </Chip>
          )}
        </View>

        {hindrance.description && (
          <>
            <Divider style={styles.divider} />
            <Text style={styles.description}>{hindrance.description}</Text>
          </>
        )}
      </Card.Content>

      <Card.Actions>
        <Button icon="pencil" onPress={() => onEdit(hindranceWithDetails)}>
          Edit
        </Button>
        <Button
          icon="delete"
          textColor="#F44336"
          onPress={() => onDelete(hindrance.id)}
        >
          Delete
        </Button>
      </Card.Actions>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    margin: 16,
    marginBottom: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    marginLeft: 12,
  },
  title: {
    fontSize: 18,
    marginBottom: 4,
  },
  siteName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  itemName: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  divider: {
    marginVertical: 12,
  },
  statusRow: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityChip: {
    alignSelf: 'flex-start',
  },
  statusChip: {
    alignSelf: 'flex-start',
  },
  syncChipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
    borderWidth: 1,
    borderColor: '#1976D2',
  },
  syncChipText: {
    color: '#1976D2',
    fontWeight: '600',
    fontSize: 12,
  },
  photoChip: {
    alignSelf: 'flex-start',
  },
  chipText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 11,
  },
  description: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
});
