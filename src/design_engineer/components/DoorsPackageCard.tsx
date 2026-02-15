import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Card, Button, Chip, IconButton, Checkbox } from 'react-native-paper';
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
  onDuplicate?: (pkg: DoorsPackage) => void;
  bulkSelectMode?: boolean;
  isSelected?: boolean;
  onSelect?: (packageId: string) => void;
  onLongPress?: (packageId: string) => void;
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

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high':
      return '#F44336';
    case 'medium':
      return '#FF9800';
    case 'low':
      return '#9E9E9E';
    default:
      return '#9E9E9E';
  }
};

const getComplianceColor = (percentage: number) => {
  if (percentage >= 80) return '#4CAF50';
  if (percentage >= 50) return '#FF9800';
  return '#F44336';
};

const ComplianceMiniBar: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <View style={styles.miniBarRow}>
    <Text style={styles.miniBarLabel}>{label}</Text>
    <View style={styles.miniBarBg}>
      <View
        style={[
          styles.miniBarFill,
          { width: `${Math.min(value, 100)}%`, backgroundColor: getComplianceColor(value) },
        ]}
      />
    </View>
    <Text style={styles.miniBarValue}>{value}%</Text>
  </View>
);

const DoorsPackageCard: React.FC<DoorsPackageCardProps> = ({
  package: pkg,
  onMarkReceived,
  onMarkReviewed,
  onApprove,
  onClose,
  onEdit,
  onDelete,
  onDuplicate,
  bulkSelectMode = false,
  isSelected = false,
  onSelect,
  onLongPress,
}) => {
  const canEdit = pkg.status === 'pending' || pkg.status === 'received';
  const canDelete = pkg.status === 'pending';
  const hasCompliance = pkg.compliancePercentage !== undefined && pkg.compliancePercentage > 0;

  const handlePress = () => {
    if (bulkSelectMode && onSelect) {
      onSelect(pkg.id);
    }
  };

  const handleLongPress = () => {
    if (onLongPress) {
      onLongPress(pkg.id);
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
              onPress={() => onSelect?.(pkg.id)}
            />
          </View>
        )}
        <View style={styles.cardHeader}>
          <View style={styles.titleContainer}>
            <Text style={styles.doorsId}>{pkg.doorsId}</Text>
            {pkg.equipmentName ? (
              <Text style={styles.equipmentName} numberOfLines={1} ellipsizeMode="tail">
                {pkg.equipmentName}
              </Text>
            ) : null}
          </View>
          <View style={styles.headerRight}>
            {pkg.priority ? (
              <Chip
                mode="flat"
                compact
                style={{ backgroundColor: getPriorityColor(pkg.priority) }}
                textStyle={styles.priorityChipText}>
                {pkg.priority.toUpperCase()}
              </Chip>
            ) : null}
            <Chip
              mode="flat"
              style={{
                backgroundColor: getStatusColor(pkg.status),
              }}
              textStyle={styles.statusChipText}>
              {pkg.status.toUpperCase()}
            </Chip>
          </View>
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

        {(pkg.quantity !== undefined && pkg.quantity > 0) && (
          <View style={styles.detailRow}>
            <Text style={styles.label}>Quantity:</Text>
            <Text style={styles.value}>{pkg.quantity} {pkg.unit || ''}</Text>
          </View>
        )}

        {pkg.specificationRef ? (
          <View style={styles.detailRow}>
            <Text style={styles.label}>Spec Ref:</Text>
            <Text style={styles.value}>{pkg.specificationRef}</Text>
          </View>
        ) : null}

        <View style={styles.detailRow}>
          <Text style={styles.label}>Requirements:</Text>
          <Text style={styles.value}>
            {pkg.compliantRequirements !== undefined
              ? `${pkg.compliantRequirements} / ${pkg.totalRequirements} compliant`
              : pkg.totalRequirements}
          </Text>
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

        {hasCompliance && (
          <View style={styles.complianceSection}>
            <View style={styles.overallComplianceRow}>
              <Text style={styles.complianceLabel}>Compliance</Text>
              <Text style={[styles.compliancePercent, { color: getComplianceColor(pkg.compliancePercentage!) }]}>
                {pkg.compliancePercentage}%
              </Text>
            </View>
            <View style={styles.complianceBarBg}>
              <View
                style={[
                  styles.complianceBarFill,
                  {
                    width: `${Math.min(pkg.compliancePercentage!, 100)}%`,
                    backgroundColor: getComplianceColor(pkg.compliancePercentage!),
                  },
                ]}
              />
            </View>

            <View style={styles.categoryBreakdown}>
              {pkg.technicalReqCompliance !== undefined && (
                <ComplianceMiniBar label="Tech" value={pkg.technicalReqCompliance} />
              )}
              {pkg.datasheetCompliance !== undefined && (
                <ComplianceMiniBar label="Data" value={pkg.datasheetCompliance} />
              )}
              {pkg.typeTestCompliance !== undefined && (
                <ComplianceMiniBar label="Type" value={pkg.typeTestCompliance} />
              )}
              {pkg.routineTestCompliance !== undefined && (
                <ComplianceMiniBar label="Routine" value={pkg.routineTestCompliance} />
              )}
              {pkg.siteReqCompliance !== undefined && (
                <ComplianceMiniBar label="Site" value={pkg.siteReqCompliance} />
              )}
            </View>
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
          {onDuplicate && (
            <IconButton
              icon="content-copy"
              size={20}
              onPress={() => onDuplicate(pkg)}
              accessibilityLabel="Duplicate package"
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
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  selectedCard: {
    borderWidth: 2,
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FD',
  },
  checkboxRow: {
    position: 'absolute',
    top: -4,
    left: -4,
    zIndex: 1,
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
  headerRight: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 4,
  },
  doorsId: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  equipmentName: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  statusChipText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  priorityChipText: {
    color: 'white',
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
    width: 115,
    fontWeight: '600',
  },
  value: {
    fontSize: 14,
    color: '#000',
    flex: 1,
  },
  complianceSection: {
    marginTop: 8,
    marginBottom: 4,
    padding: 10,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
  },
  overallComplianceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  complianceLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  compliancePercent: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  complianceBarBg: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  complianceBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  categoryBreakdown: {
    gap: 3,
  },
  miniBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  miniBarLabel: {
    fontSize: 11,
    color: '#666',
    width: 42,
  },
  miniBarBg: {
    flex: 1,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  miniBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  miniBarValue: {
    fontSize: 10,
    color: '#666',
    width: 30,
    textAlign: 'right',
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
