/**
 * DesignRfqCard Component
 *
 * Reusable card component for displaying Design RFQ information.
 * Supports both default and compact variants for flexible layouts.
 *
 * @example
 * ```tsx
 * // Default variant with all features
 * <DesignRfqCard
 *   rfq={rfq}
 *   onIssue={handleIssue}
 *   onMarkQuotesReceived={handleMarkQuotesReceived}
 *   onEdit={handleEdit}
 *   onDelete={handleDelete}
 *   showActions
 * />
 *
 * // Compact variant for lists
 * <DesignRfqCard
 *   rfq={rfq}
 *   variant="compact"
 *   onPress={handlePress}
 * />
 * ```
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Chip, Button, IconButton } from 'react-native-paper';
import { DesignRfqCardProps } from '../types';
import { COLORS } from '../../../theme/colors';
import { STATUS_CONFIG } from '../../../utils/statusConfig';

/**
 * DesignRfqCard Component
 */
const DesignRfqCard: React.FC<DesignRfqCardProps> = ({
  rfq,
  onPress,
  onIssue,
  onMarkQuotesReceived,
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
          <Text style={styles.rfqNumber}>{rfq.rfqNumber}</Text>
          <Text style={[styles.rfqTitle, isCompact && styles.rfqTitleCompact]} numberOfLines={isCompact ? 1 : undefined}>
            {rfq.title}
          </Text>
        </View>
        <Chip
          mode="flat"
          icon={(STATUS_CONFIG[rfq.status] || STATUS_CONFIG.draft).icon}
          style={[styles.statusChip, { backgroundColor: (STATUS_CONFIG[rfq.status] || STATUS_CONFIG.draft).color + '20' }]}
          textStyle={[styles.statusChipText, { color: (STATUS_CONFIG[rfq.status] || STATUS_CONFIG.draft).color }]}
        >
          {(STATUS_CONFIG[rfq.status] || STATUS_CONFIG.draft).label}
        </Chip>
      </View>

      {/* Details - Full in default, limited in compact */}
      {!isCompact && (
        <>
          <View style={styles.detailRow}>
            <Text style={styles.label}>DOORS ID:</Text>
            <Text style={styles.value}>{rfq.doorsId}</Text>
          </View>

          {rfq.description && (
            <View style={styles.detailRow}>
              <Text style={styles.label}>Description:</Text>
              <Text style={styles.value}>{rfq.description}</Text>
            </View>
          )}

          <View style={styles.detailRow}>
            <Text style={styles.label}>Type:</Text>
            <Text style={styles.value}>Design RFQ</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.label}>Expected Delivery:</Text>
            <Text style={styles.value}>{rfq.expectedDeliveryDays} days</Text>
          </View>

          {rfq.issueDate && (
            <View style={styles.detailRow}>
              <Text style={styles.label}>Issue Date:</Text>
              <Text style={styles.value}>{new Date(rfq.issueDate).toLocaleDateString()}</Text>
            </View>
          )}

          {rfq.closingDate && (
            <View style={styles.detailRow}>
              <Text style={styles.label}>Closing Date:</Text>
              <Text style={styles.value}>{new Date(rfq.closingDate).toLocaleDateString()}</Text>
            </View>
          )}

          <View style={styles.detailRow}>
            <Text style={styles.label}>Vendors Invited:</Text>
            <Text style={styles.value}>{rfq.totalVendorsInvited}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.label}>Quotes Received:</Text>
            <Text style={styles.value}>{rfq.totalQuotesReceived}</Text>
          </View>

          {rfq.awardedValue && (
            <View style={styles.detailRow}>
              <Text style={styles.label}>Awarded Value:</Text>
              <Text style={styles.value}>${rfq.awardedValue.toLocaleString()}</Text>
            </View>
          )}
        </>
      )}

      {/* Compact view details */}
      {isCompact && (
        <View style={styles.compactDetails}>
          <Text style={styles.compactText}>DOORS: {rfq.doorsId}</Text>
          <Text style={styles.compactText}>
            Delivery: {rfq.expectedDeliveryDays} days
          </Text>
          {rfq.issueDate && (
            <Text style={styles.compactText}>
              Issued: {new Date(rfq.issueDate).toLocaleDateString()}
            </Text>
          )}
        </View>
      )}

      {/* Action Buttons */}
      {showActions && !isCompact && (
        <View style={styles.actionButtons}>
          {onEdit && (
            <IconButton icon="pencil" size={20} onPress={() => onEdit(rfq)} style={styles.iconButton} />
          )}
          {onDelete && (
            <IconButton icon="delete" size={20} onPress={() => onDelete(rfq.id)} style={styles.iconButton} />
          )}
          {rfq.status === 'draft' && onIssue && (
            <Button mode="contained" onPress={() => onIssue(rfq.id)} style={styles.actionButton}>
              Issue RFQ
            </Button>
          )}
          {rfq.status === 'issued' && onMarkQuotesReceived && (
            <Button mode="contained" onPress={() => onMarkQuotesReceived(rfq.id)} style={styles.actionButton}>
              Quotes Received
            </Button>
          )}
        </View>
      )}
    </>
  );

  // If onPress is provided, wrap in TouchableOpacity
  if (onPress) {
    return (
      <TouchableOpacity onPress={() => onPress(rfq)} activeOpacity={0.7}>
        <Card mode="elevated" style={[styles.card, isCompact && styles.cardCompact, style]}>
          <Card.Content>{cardContent}</Card.Content>
        </Card>
      </TouchableOpacity>
    );
  }

  // Otherwise, render normal card
  return (
    <Card mode="elevated" style={[styles.card, isCompact && styles.cardCompact, style]}>
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
  rfqNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  rfqTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 4,
  },
  rfqTitleCompact: {
    fontSize: 16,
  },
  statusChip: {
    height: 28,
  },
  statusChipText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: '#666',
    width: 140,
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

export default DesignRfqCard;
