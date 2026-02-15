import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card, Button, Chip, IconButton } from 'react-native-paper';
import { DoorsPackage } from '../types/DoorsPackageTypes';
import StatusTimeline, { DOORS_STATUS_STEPS } from './StatusTimeline';

interface DoorsPackageCardProps {
  package: DoorsPackage;
  onMarkReceived: (packageId: string) => void;
  onMarkReviewed: (packageId: string) => void;
  onApprove?: (packageId: string) => void;
  onClose?: (packageId: string) => void;
  onEdit?: (pkg: DoorsPackage) => void;
  onDelete?: (packageId: string) => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending':
      return '#FFA500';
    case 'received':
      return '#2196F3';
    case 'reviewed':
      return '#4CAF50';
    case 'approved':
      return '#7B1FA2';
    case 'closed':
      return '#616161';
    default:
      return '#9E9E9E';
  }
};

const DoorsPackageCard: React.FC<DoorsPackageCardProps> = ({
  package: pkg,
  onMarkReceived,
  onMarkReviewed,
  onApprove,
  onClose,
  onEdit,
  onDelete,
}) => {
  const canEdit = pkg.status === 'pending' || pkg.status === 'received';
  const canDelete = pkg.status === 'pending';

  return (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <View style={styles.titleContainer}>
            <Text style={styles.doorsId}>{pkg.doorsId}</Text>
          </View>
          <Chip
            mode="flat"
            style={{
              backgroundColor: getStatusColor(pkg.status),
            }}
            textStyle={styles.statusChipText}>
            {pkg.status.toUpperCase()}
          </Chip>
        </View>

        <StatusTimeline steps={DOORS_STATUS_STEPS} currentStatus={pkg.status} />

        <View style={styles.detailRow}>
          <Text style={styles.label}>Site:</Text>
          <Text style={styles.value}>{pkg.siteName || 'N/A'}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.label}>Category:</Text>
          <Text style={styles.value}>{pkg.category}</Text>
        </View>

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

        {pkg.closureDate && (
          <View style={styles.detailRow}>
            <Text style={styles.label}>Closed:</Text>
            <Text style={styles.value}>{new Date(pkg.closureDate).toLocaleDateString()}</Text>
          </View>
        )}

        {pkg.closureRemarks && (
          <View style={styles.detailRow}>
            <Text style={styles.label}>Remarks:</Text>
            <Text style={styles.value}>{pkg.closureRemarks}</Text>
          </View>
        )}

        <View style={styles.actionButtons}>
          {canEdit && onEdit && (
            <IconButton
              icon="pencil"
              size={20}
              onPress={() => onEdit(pkg)}
              accessibilityLabel="Edit package"
            />
          )}
          {canDelete && onDelete && (
            <IconButton
              icon="delete"
              size={20}
              iconColor="#F44336"
              onPress={() => onDelete(pkg.id)}
              accessibilityLabel="Delete package"
            />
          )}
          <View style={styles.actionSpacer} />
          {pkg.status === 'pending' && (
            <Button mode="contained" onPress={() => onMarkReceived(pkg.id)} style={styles.actionButton}>
              Mark Received
            </Button>
          )}
          {pkg.status === 'received' && (
            <Button mode="contained" onPress={() => onMarkReviewed(pkg.id)} style={styles.actionButton}>
              Mark Reviewed
            </Button>
          )}
          {pkg.status === 'reviewed' && onApprove && (
            <Button
              mode="contained"
              onPress={() => onApprove(pkg.id)}
              style={[styles.actionButton, { backgroundColor: '#7B1FA2' }]}>
              Approve
            </Button>
          )}
          {pkg.status === 'approved' && onClose && (
            <Button
              mode="contained"
              onPress={() => onClose(pkg.id)}
              style={[styles.actionButton, { backgroundColor: '#616161' }]}>
              Close
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
  doorsId: {
    fontSize: 18,
    fontWeight: 'bold',
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
    width: 100,
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

export default DoorsPackageCard;
