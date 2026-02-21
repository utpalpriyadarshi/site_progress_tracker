import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Chip, Divider } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { HindranceWithDetails } from '../types';
import { getPriorityColor, getStatusColor, getStatusLabel, parsePhotos } from '../utils';
import { COLORS } from '../../../theme/colors';
import { BaseCard } from '../../../components/cards/BaseCard';

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
    <BaseCard
      title={hindrance.title}
      subtitle={item ? `${site.name} · ${item.name}` : site.name}
      headerRight={
        <Chip
          style={[styles.priorityChip, { backgroundColor: getPriorityColor(hindrance.priority) }]}
          textStyle={styles.chipText}
        >
          {hindrance.priority.toUpperCase()}
        </Chip>
      }
      actions={[
        { label: 'Edit', icon: 'pencil', onPress: () => onEdit(hindranceWithDetails) },
        { label: 'Delete', icon: 'delete', onPress: () => onDelete(hindrance.id), color: COLORS.ERROR },
      ]}
    >
      <Divider style={styles.divider} />

      <View style={styles.statusRow}>
        <Chip
          style={[styles.statusChip, { backgroundColor: getStatusColor(hindrance.status) }]}
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

      {hindrance.description ? (
        <>
          <Divider style={styles.divider} />
          <Text style={styles.description}>{hindrance.description}</Text>
        </>
      ) : null}
    </BaseCard>
  );
};

const styles = StyleSheet.create({
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
    backgroundColor: COLORS.INFO_BG,
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
