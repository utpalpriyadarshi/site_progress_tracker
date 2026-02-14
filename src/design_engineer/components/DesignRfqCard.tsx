import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card, Button, Chip, IconButton } from 'react-native-paper';
import { DesignRfq } from '../types/DesignRfqTypes';

interface DesignRfqCardProps {
  rfq: DesignRfq;
  onIssue: (rfqId: string) => void;
  onMarkQuotesReceived: (rfqId: string) => void;
  onEdit?: (rfq: DesignRfq) => void;
  onDelete?: (rfqId: string) => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'draft':
      return '#9E9E9E';
    case 'issued':
      return '#2196F3';
    case 'quotes_received':
      return '#FF9800';
    case 'evaluated':
      return '#9C27B0';
    case 'awarded':
      return '#4CAF50';
    case 'cancelled':
      return '#F44336';
    default:
      return '#9E9E9E';
  }
};

const DesignRfqCard: React.FC<DesignRfqCardProps> = ({
  rfq,
  onIssue,
  onMarkQuotesReceived,
  onEdit,
  onDelete,
}) => {
  const canEdit = rfq.status === 'draft';
  const canDelete = rfq.status === 'draft';

  return (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <View style={styles.titleContainer}>
            <Text style={styles.rfqNumber}>{rfq.rfqNumber}</Text>
            <Text style={styles.rfqTitle} numberOfLines={2} ellipsizeMode="tail">{rfq.title}</Text>
          </View>
          <Chip
            mode="flat"
            style={{
              backgroundColor: getStatusColor(rfq.status),
            }}
            textStyle={styles.statusChipText}>
            {rfq.status.replace(/_/g, ' ').toUpperCase()}
          </Chip>
        </View>

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
              iconColor="#F44336"
              onPress={() => onDelete(rfq.id)}
              accessibilityLabel="Delete RFQ"
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
        </View>
      </Card.Content>
    </Card>
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
    color: 'white',
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
});

export default DesignRfqCard;
