import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, IconButton, Chip } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { InspectionCardProps } from '../types';

/**
 * Get color for inspection type chip
 */
const getInspectionTypeColor = (type: string): string => {
  switch (type) {
    case 'daily':
      return '#2196F3';
    case 'weekly':
      return '#4CAF50';
    case 'safety':
      return '#FF9800';
    case 'quality':
      return '#9C27B0';
    default:
      return '#757575';
  }
};

/**
 * Get color for rating chip
 */
const getRatingColor = (rating: string): string => {
  switch (rating) {
    case 'excellent':
      return '#4CAF50';
    case 'good':
      return '#8BC34A';
    case 'fair':
      return '#FF9800';
    case 'poor':
      return '#F44336';
    default:
      return '#757575';
  }
};

/**
 * Format timestamp to date string
 */
const formatDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString();
};

/**
 * InspectionCard Component
 *
 * Displays a single inspection in a Material Design card with:
 * - Type, safety flag, and rating chips
 * - Site name and date
 * - Notes (if present)
 * - Checklist summary with expandable failed items
 * - Photo count preview
 * - Follow-up indicator (if required)
 * - Sync status indicator
 * - Edit and Delete actions
 */
export const InspectionCard: React.FC<InspectionCardProps> = React.memo(
  ({ inspection, site, onEdit, onDelete }) => {
    // Parse JSON fields
    const checklistData = JSON.parse(inspection.checklistData || '[]');
    const photos = JSON.parse(inspection.photos || '[]');

    // Calculate checklist summary
    const passCount = checklistData.filter((item: any) => item.status === 'pass').length;
    const failCount = checklistData.filter((item: any) => item.status === 'fail').length;
    const totalCount = checklistData.length;
    const failedItems = checklistData.filter((item: any) => item.status === 'fail');

    // Sync status
    const isLocal = inspection.id.includes('local_');
    const syncStatusText = isLocal ? 'Local Only' : 'Synced';
    const syncStatusColor = isLocal ? '#FF9800' : '#4CAF50';

    return (
      <Card style={styles.card}>
        <Card.Content>
          {/* Header: Type chips + Rating */}
          <View style={styles.cardHeader}>
            <View style={styles.headerLeft}>
              <View style={styles.typeRow}>
                <Chip
                  style={[
                    styles.typeChip,
                    { backgroundColor: getInspectionTypeColor(inspection.inspectionType) },
                  ]}
                  textStyle={styles.chipText}
                >
                  {inspection.inspectionType.toUpperCase()}
                </Chip>
                {inspection.safetyFlagged && (
                  <Chip style={styles.safetyChip} textStyle={styles.chipText}>
                    SAFETY ISSUE
                  </Chip>
                )}
              </View>
              <Text style={styles.siteName}>{site.name}</Text>
              <Text style={styles.dateText}>{formatDate(inspection.inspectionDate)}</Text>
            </View>
            <View style={styles.headerRight}>
              <Chip
                style={[
                  styles.ratingChip,
                  { backgroundColor: getRatingColor(inspection.overallRating) },
                ]}
                textStyle={styles.chipText}
              >
                {inspection.overallRating.toUpperCase()}
              </Chip>
            </View>
          </View>

          {/* Notes */}
          {inspection.notes && inspection.notes.trim() !== '' && (
            <>
              <Card.Title
                title="Notes"
                titleStyle={styles.notesSectionTitle}
                left={() => (
                  <MaterialCommunityIcons
                    name="note-text"
                    size={20}
                    color="#666"
                  />
                )}
                style={styles.notesSectionHeader}
              />
              <Text style={styles.notes}>{inspection.notes}</Text>
            </>
          )}

          {/* Checklist Summary */}
          {totalCount > 0 && (
            <View
              style={[
                styles.checklistSummary,
                failCount > 0 && styles.checklistSummaryWithFails,
              ]}
            >
              <MaterialCommunityIcons
                name="checkbox-marked-circle-outline"
                size={16}
                color={failCount > 0 ? '#F44336' : '#666'}
              />
              <Text
                style={[styles.checklistText, failCount > 0 && styles.checklistTextFailed]}
              >
                Checklist: {passCount} Pass / {failCount} Fail / {totalCount} Total
              </Text>
            </View>
          )}

          {/* Failed Items (if any) */}
          {failedItems.length > 0 && (
            <View style={styles.failedItemsContainer}>
              <Text style={styles.notesSectionTitle}>Failed Items:</Text>
              {failedItems.map((item: any, index: number) => (
                <View key={index} style={styles.failedItem}>
                  <Text style={styles.failedItemText}>
                    • {item.category}: {item.item}
                  </Text>
                  {item.notes && (
                    <Text style={styles.failedItemNotes}>  {item.notes}</Text>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Photos Preview */}
          {photos.length > 0 && (
            <View style={styles.photosPreview}>
              <MaterialCommunityIcons name="camera" size={16} color="#666" />
              <Text style={styles.photosText}>{photos.length} photo(s) attached</Text>
            </View>
          )}

          {/* Follow-up Indicator */}
          {inspection.followUpDate > 0 && (
            <View style={styles.followUpBanner}>
              <MaterialCommunityIcons name="flag" size={16} color="#FF9800" />
              <Text style={styles.followUpText}>
                Follow-up required by {formatDate(inspection.followUpDate)}
              </Text>
            </View>
          )}

          {/* Sync Status + Actions */}
          <View style={styles.statusRow}>
            <View style={[styles.syncStatusContainer, { backgroundColor: syncStatusColor + '20' }]}>
              <MaterialCommunityIcons
                name={isLocal ? 'cloud-upload-outline' : 'cloud-check'}
                size={14}
                color={syncStatusColor}
              />
              <Text style={[styles.syncStatusText, { color: syncStatusColor }]}>
                {syncStatusText}
              </Text>
            </View>
            <IconButton icon="pencil" size={20} onPress={onEdit} />
            <IconButton icon="delete" size={20} onPress={onDelete} />
          </View>
        </Card.Content>
      </Card>
    );
  },
  // Custom comparator to prevent unnecessary re-renders
  (prevProps, nextProps) => {
    return (
      prevProps.inspection.id === nextProps.inspection.id &&
      prevProps.inspection.inspectionDate === nextProps.inspection.inspectionDate &&
      prevProps.site.id === nextProps.site.id &&
      prevProps.onEdit === nextProps.onEdit &&
      prevProps.onDelete === nextProps.onDelete
    );
  }
);

InspectionCard.displayName = 'InspectionCard';

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
  typeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  typeChip: {
    alignSelf: 'flex-start',
  },
  safetyChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#F44336',
  },
  ratingChip: {
    alignSelf: 'flex-start',
  },
  chipText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 11,
  },
  siteName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 12,
    color: '#666',
  },
  notesSectionHeader: {
    marginTop: 12,
    marginBottom: 0,
    paddingVertical: 0,
  },
  notesSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  notes: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginTop: 4,
  },
  checklistSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    marginBottom: 4,
  },
  checklistSummaryWithFails: {
    backgroundColor: '#FFEBEE',
    padding: 8,
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#F44336',
  },
  checklistText: {
    fontSize: 12,
    color: '#666',
  },
  checklistTextFailed: {
    color: '#F44336',
    fontWeight: '600',
  },
  failedItemsContainer: {
    marginTop: 8,
    backgroundColor: '#FFF3E0',
    padding: 10,
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#FF9800',
  },
  failedItem: {
    marginBottom: 8,
  },
  failedItemText: {
    fontSize: 13,
    color: '#F44336',
    fontWeight: '600',
    marginBottom: 4,
  },
  failedItemNotes: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  photosPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    marginBottom: 4,
  },
  photosText: {
    fontSize: 12,
    color: '#666',
  },
  followUpBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFF3E0',
    padding: 8,
    borderRadius: 4,
    marginTop: 8,
    marginBottom: 4,
  },
  followUpText: {
    fontSize: 12,
    color: '#FF9800',
    fontWeight: 'bold',
  },
  statusRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    alignItems: 'center',
  },
  syncStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
    flex: 1,
  },
  syncStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
