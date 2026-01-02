import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card, Chip, Button } from 'react-native-paper';
import { DoorsPackage } from '../types/DoorsPackageTypes';

interface DoorsPackageCardProps {
  package: DoorsPackage;
  onMarkReceived: (packageId: string) => void;
  onMarkReviewed: (packageId: string) => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending':
      return '#FFA500';
    case 'received':
      return '#2196F3';
    case 'reviewed':
      return '#4CAF50';
    default:
      return '#9E9E9E';
  }
};

const DoorsPackageCard: React.FC<DoorsPackageCardProps> = ({ package: pkg, onMarkReceived, onMarkReviewed }) => {
  return (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <Text style={styles.doorsId}>{pkg.doorsId}</Text>
          <Chip
            mode="flat"
            style={[styles.statusChip, { backgroundColor: getStatusColor(pkg.status) }]}
            textStyle={styles.statusChipText}
          >
            {pkg.status.toUpperCase()}
          </Chip>
        </View>

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

        <View style={styles.actionButtons}>
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
    alignItems: 'center',
    marginBottom: 12,
  },
  doorsId: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statusChip: {
    height: 28,
  },
  statusChipText: {
    color: '#FFF',
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
    justifyContent: 'flex-end',
    marginTop: 12,
    gap: 8,
  },
  actionButton: {
    marginLeft: 8,
  },
});

export default DoorsPackageCard;
