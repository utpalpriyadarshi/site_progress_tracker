/**
 * DoorsPackageCard Component
 *
 * Reusable card component for displaying DOORS package information.
 * Supports both default and compact variants for flexible layouts.
 *
 * @example
 * ```tsx
 * // Default variant with all features
 * <DoorsPackageCard
 *   package={pkg}
 *   onMarkReceived={handleMarkReceived}
 *   onMarkReviewed={handleMarkReviewed}
 *   onEdit={handleEdit}
 *   onDelete={handleDelete}
 *   showActions
 * />
 *
 * // Compact variant for lists
 * <DoorsPackageCard
 *   package={pkg}
 *   variant="compact"
 *   onPress={handlePress}
 * />
 * ```
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Chip, Button, IconButton } from 'react-native-paper';
import { DoorsPackageCardProps } from '../types';
import { COLORS } from '../../../theme/colors';
import { STATUS_CONFIG } from '../../../utils/statusConfig';

/**
 * Get category color badge
 */
const getCategoryColor = (category: string): string => {
  switch (category) {
    case 'equipment':
      return COLORS.INFO;
    case 'material':
      return COLORS.STATUS_EVALUATED;
    default:
      return COLORS.STATUS_CLOSED;
  }
};

/**
 * DoorsPackageCard Component
 */
const DoorsPackageCard: React.FC<DoorsPackageCardProps> = ({
  package: pkg,
  onPress,
  onMarkReceived,
  onMarkReviewed,
  onEdit,
  onDelete,
  showActions = true,
  variant = 'default',
  style,
}) => {
  const isCompact = variant === 'compact';

  const cardContent = (
    <>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.doorsId}>{pkg.doorsId}</Text>
          {pkg.siteName && (
            <Text style={[styles.siteName, isCompact && styles.siteNameCompact]} numberOfLines={1}>
              {pkg.siteName}
            </Text>
          )}
        </View>
        <View style={styles.badges}>
          <Chip
            mode="flat"
            style={[styles.categoryChip, { backgroundColor: getCategoryColor(pkg.category) }]}
            textStyle={styles.chipText}
          >
            {pkg.category.toUpperCase()}
          </Chip>
          <Chip
            mode="flat"
            icon={(STATUS_CONFIG[pkg.status] || STATUS_CONFIG.pending).icon}
            style={[styles.statusChip, { backgroundColor: (STATUS_CONFIG[pkg.status] || STATUS_CONFIG.pending).color + '20' }]}
            textStyle={[styles.chipText, { color: (STATUS_CONFIG[pkg.status] || STATUS_CONFIG.pending).color }]}
          >
            {(STATUS_CONFIG[pkg.status] || STATUS_CONFIG.pending).label}
          </Chip>
        </View>
      </View>

      {/* Details - Full in default, limited in compact */}
      {!isCompact && (
        <>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Equipment:</Text>
            <Text style={styles.value}>{pkg.equipmentType}</Text>
          </View>

          {pkg.materialType && (
            <View style={styles.detailRow}>
              <Text style={styles.label}>Material:</Text>
              <Text style={styles.value}>{pkg.materialType}</Text>
            </View>
          )}

          <View style={styles.detailRow}>
            <Text style={styles.label}>Requirements:</Text>
            <Text style={styles.value}>{pkg.totalRequirements}</Text>
          </View>

          {pkg.receivedDate && (
            <View style={styles.detailRow}>
              <Text style={styles.label}>Received:</Text>
              <Text style={styles.value}>{new Date(pkg.receivedDate).toLocaleDateString()}</Text>
            </View>
          )}

          {pkg.reviewedDate && (
            <View style={styles.detailRow}>
              <Text style={styles.label}>Reviewed:</Text>
              <Text style={styles.value}>{new Date(pkg.reviewedDate).toLocaleDateString()}</Text>
            </View>
          )}

          {pkg.createdAt && (
            <View style={styles.detailRow}>
              <Text style={styles.label}>Created:</Text>
              <Text style={styles.value}>{new Date(pkg.createdAt).toLocaleDateString()}</Text>
            </View>
          )}
        </>
      )}

      {/* Compact view details */}
      {isCompact && (
        <View style={styles.compactDetails}>
          <Text style={styles.compactText}>{pkg.equipmentType}</Text>
          <Text style={styles.compactText}>Req: {pkg.totalRequirements}</Text>
          {pkg.receivedDate && (
            <Text style={styles.compactText}>
              Received: {new Date(pkg.receivedDate).toLocaleDateString()}
            </Text>
          )}
        </View>
      )}

      {/* Action Buttons */}
      {showActions && !isCompact && (
        <View style={styles.actionButtons}>
          {onEdit && (
            <IconButton icon="pencil" size={20} onPress={() => onEdit(pkg)} style={styles.iconButton} />
          )}
          {onDelete && (
            <IconButton icon="delete" size={20} onPress={() => onDelete(pkg.id)} style={styles.iconButton} />
          )}
          {pkg.status === 'pending' && onMarkReceived && (
            <Button mode="contained" onPress={() => onMarkReceived(pkg.id)} style={styles.actionButton}>
              Mark Received
            </Button>
          )}
          {pkg.status === 'received' && onMarkReviewed && (
            <Button mode="contained" onPress={() => onMarkReviewed(pkg.id)} style={styles.actionButton}>
              Mark Reviewed
            </Button>
          )}
        </View>
      )}
    </>
  );

  // If onPress is provided, wrap in TouchableOpacity
  if (onPress) {
    return (
      <TouchableOpacity onPress={() => onPress(pkg)} activeOpacity={0.7}>
        <Card style={[styles.card, isCompact && styles.cardCompact, style]}>
          <Card.Content>{cardContent}</Card.Content>
        </Card>
      </TouchableOpacity>
    );
  }

  // Otherwise, render normal card
  return (
    <Card style={[styles.card, isCompact && styles.cardCompact, style]}>
      <Card.Content>{cardContent}</Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  cardCompact: {
    marginBottom: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  doorsId: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  siteName: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  siteNameCompact: {
    fontSize: 12,
  },
  badges: {
    flexDirection: 'column',
    gap: 4,
    alignItems: 'flex-end',
  },
  categoryChip: {
    height: 24,
  },
  statusChip: {
    height: 24,
  },
  chipText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: '#666',
    width: 100,
    fontWeight: '600',
  },
  value: {
    fontSize: 14,
    color: '#000',
    flex: 1,
  },
  compactDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  compactText: {
    fontSize: 12,
    color: '#666',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  iconButton: {
    margin: 0,
  },
  actionButton: {
    marginLeft: 8,
  },
});

export default DoorsPackageCard;
