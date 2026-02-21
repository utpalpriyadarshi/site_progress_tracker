import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, IconButton } from 'react-native-paper';
import { DesignRfq } from '../types/DesignRfqTypes';
import StatusTimeline, { RFQ_STATUS_STEPS } from './StatusTimeline';
import { COLORS } from '../../theme/colors';
import { STATUS_CONFIG } from '../../utils/statusConfig';
import { BaseCard, DetailRow } from '../../components/cards/BaseCard';

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

  const statusConfig = STATUS_CONFIG[rfq.status] || STATUS_CONFIG.draft;

  const details: DetailRow[] = [
    { label: 'DOORS ID', value: rfq.doorsId },
    ...(rfq.description ? [{ label: 'Description', value: rfq.description }] : []),
    { label: 'Type', value: 'Design RFQ' },
    { label: 'Expected Delivery', value: `${rfq.expectedDeliveryDays} days` },
    ...(rfq.issueDate ? [{ label: 'Issue Date', value: new Date(rfq.issueDate).toLocaleDateString() }] : []),
    ...(rfq.closingDate ? [{ label: 'Closing Date', value: new Date(rfq.closingDate).toLocaleDateString() }] : []),
    { label: 'Vendors Invited', value: String(rfq.totalVendorsInvited) },
    { label: 'Quotes Received', value: String(rfq.totalQuotesReceived) },
    ...(rfq.evaluationDate ? [{ label: 'Evaluated', value: new Date(rfq.evaluationDate).toLocaleDateString() }] : []),
    ...(rfq.awardDate ? [{ label: 'Award Date', value: new Date(rfq.awardDate).toLocaleDateString() }] : []),
    ...(rfq.awardedValue ? [{ label: 'Awarded Value', value: `$${rfq.awardedValue.toLocaleString()}` }] : []),
  ];

  return (
    <BaseCard
      title={rfq.rfqNumber}
      subtitle={rfq.title}
      status={{ label: statusConfig.label, color: statusConfig.color, icon: statusConfig.icon }}
      details={details}
      isSelected={isSelected}
      bulkSelectMode={bulkSelectMode}
      onSelect={onSelect ? () => onSelect(rfq.id) : undefined}
      onLongPress={onLongPress ? () => onLongPress(rfq.id) : undefined}
    >
      <StatusTimeline
        steps={RFQ_STATUS_STEPS}
        currentStatus={rfq.status}
        cancelledStatus="cancelled"
      />

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
    </BaseCard>
  );
};

const styles = StyleSheet.create({
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
});

export default DesignRfqCard;
