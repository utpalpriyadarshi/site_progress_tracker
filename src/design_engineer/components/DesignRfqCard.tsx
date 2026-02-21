import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Card, Button, Chip, IconButton, Checkbox } from 'react-native-paper';
import { DesignRfq } from '../types/DesignRfqTypes';
import StatusTimeline, { RFQ_STATUS_STEPS } from './StatusTimeline';
import { COLORS } from '../../theme/colors';
import { STATUS_CONFIG } from '../../utils/statusConfig';

interface DesignRfqCardProps {
  rfq: DesignRfq;
  onIssue: (rfqId: string) => void;
  onMarkQuotesReceived: (rfqId: string) => void;
  onEvaluate?: (rfqId: string) => void;
  onAward?: (rfqId: string) => void;
  onCancel?: (rfqId: string) => void;
  onEdit?: (rfq: DesignRfq) => void;
  onDelete?: (rfqId: string) => void;
  onDuplicate?: (rfq: DesignRfq) => void;
  onViewQuotes?: (rfqId: string) => void;
  bulkSelectMode?: boolean;
  isSelected?: boolean;
  onSelect?: (rfqId: string) => void;
  onLongPress?: (rfqId: string) => void;
}


const DesignRfqCard: React.FC<DesignRfqCardProps> = ({
  rfq,
  onIssue,
  onMarkQuotesReceived,
  onEvaluate,
  onAward,
  onCancel,
  onEdit,
  onDelete,
  onDuplicate,
  onViewQuotes,
  bulkSelectMode = false,
  isSelected = false,
  onSelect,
  onLongPress,
}) => {
  const canEdit = rfq.status === 'draft';
  const canDelete = rfq.status === 'draft';
  const canCancel = rfq.status !== 'awarded' && rfq.status !== 'cancelled';
  const canViewQuotes = ['quotes_received', 'evaluated', 'awarded'].includes(rfq.status);

  const handlePress = () => {
    if (bulkSelectMode && onSelect) {
      onSelect(rfq.id);
    }
  };

  const handleLongPress = () => {
    if (onLongPress) {
      onLongPress(rfq.id);
    }
  };

  return (
    <Pressable onPress={bulkSelectMode ? handlePress : undefined} onLongPress={handleLongPress}>
    <Card style={[styles.card, isSelected && styles.selectedCard]}>
      <Card.Content>
        {bulkSelectMode && (
          <View style={styles.checkboxRow}>
            <Checkbox
              status={isSelected ? 'checked' : 'unchecked'}
              onPress={() => onSelect?.(rfq.id)}
            />
          </View>
        )}
        <View style={styles.cardHeader}>
          <View style={styles.titleContainer}>
            <Text style={styles.rfqNumber}>{rfq.rfqNumber}</Text>
            <Text style={styles.rfqTitle} numberOfLines={2} ellipsizeMode="tail">{rfq.title}</Text>
          </View>
          <Chip
            mode="flat"
            icon={(STATUS_CONFIG[rfq.status] || STATUS_CONFIG.draft).icon}
            style={{
              backgroundColor: (STATUS_CONFIG[rfq.status] || STATUS_CONFIG.draft).color + '20',
            }}
            textStyle={[styles.statusChipText, { color: (STATUS_CONFIG[rfq.status] || STATUS_CONFIG.draft).color }]}>
            {(STATUS_CONFIG[rfq.status] || STATUS_CONFIG.draft).label}
          </Chip>
        </View>

        <StatusTimeline
          steps={RFQ_STATUS_STEPS}
          currentStatus={rfq.status}
          cancelledStatus="cancelled"
        />

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

        {rfq.evaluationDate && (
          <View style={styles.detailRow}>
            <Text style={styles.label}>Evaluated:</Text>
            <Text style={styles.value}>{new Date(rfq.evaluationDate).toLocaleDateString()}</Text>
          </View>
        )}

        {rfq.awardDate && (
          <View style={styles.detailRow}>
            <Text style={styles.label}>Award Date:</Text>
            <Text style={styles.value}>{new Date(rfq.awardDate).toLocaleDateString()}</Text>
          </View>
        )}

        {rfq.awardedValue && (
          <View style={styles.detailRow}>
            <Text style={styles.label}>Awarded Value:</Text>
            <Text style={styles.value}>${rfq.awardedValue.toLocaleString()}</Text>
          </View>
        )}

        <View style={styles.actionButtons}>
          {canEdit && onEdit && (
            <IconButton
              icon="pencil"
              size={20}
              onPress={() => onEdit(rfq)}
              accessibilityLabel="Edit RFQ"
            />
          )}
          {canDelete && onDelete && (
            <IconButton
              icon="delete"
              size={20}
              iconColor={COLORS.ERROR}
              onPress={() => onDelete(rfq.id)}
              accessibilityLabel="Delete RFQ"
            />
          )}
          {canCancel && onCancel && (
            <IconButton
              icon="cancel"
              size={20}
              iconColor={COLORS.ERROR}
              onPress={() => onCancel(rfq.id)}
              accessibilityLabel="Cancel RFQ"
            />
          )}
          {rfq.status !== 'cancelled' && onDuplicate && (
            <IconButton
              icon="content-copy"
              size={20}
              onPress={() => onDuplicate(rfq)}
              accessibilityLabel="Duplicate RFQ"
            />
          )}
          <View style={styles.actionSpacer} />
          {rfq.status === 'draft' && (
            <Button mode="contained" onPress={() => onIssue(rfq.id)} style={styles.actionButton}>
              Issue RFQ
            </Button>
          )}
          {rfq.status === 'issued' && (
            <Button mode="contained" onPress={() => onMarkQuotesReceived(rfq.id)} style={styles.actionButton}>
              Quotes Received
            </Button>
          )}
          {rfq.status === 'quotes_received' && onEvaluate && (
            <Button
              mode="contained"
              onPress={() => onEvaluate(rfq.id)}
              style={[styles.actionButton, { backgroundColor: COLORS.STATUS_EVALUATED }]}>
              Evaluate
            </Button>
          )}
          {rfq.status === 'evaluated' && onAward && (
            <Button
              mode="contained"
              onPress={() => onAward(rfq.id)}
              style={[styles.actionButton, { backgroundColor: COLORS.SUCCESS }]}>
              Award
            </Button>
          )}
          {canViewQuotes && onViewQuotes && (
            <Button
              mode="outlined"
              compact
              onPress={() => onViewQuotes(rfq.id)}
              style={styles.actionButton}
              icon="format-list-bulleted">
              Quotes ({rfq.totalQuotesReceived})
            </Button>
          )}
        </View>
      </Card.Content>
    </Card>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  titleContainer: {
    flex: 1,
    minWidth: 0,
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
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 4,
  },
  actionSpacer: {
    flex: 1,
  },
  actionButton: {
    marginLeft: 8,
  },
  selectedCard: {
    borderWidth: 2,
    borderColor: '#007AFF',
    backgroundColor: COLORS.INFO_BG,
  },
  checkboxRow: {
    position: 'absolute',
    top: -4,
    left: -4,
    zIndex: 1,
  },
});

export default DesignRfqCard;
