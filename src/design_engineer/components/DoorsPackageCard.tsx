import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button, Chip, IconButton } from 'react-native-paper';
import { DoorsPackage } from '../types/DoorsPackageTypes';
import StatusTimeline, { DOORS_STATUS_STEPS } from './StatusTimeline';
import { COLORS } from '../../theme/colors';
import { STATUS_CONFIG } from '../../utils/statusConfig';
import { BaseCard, DetailRow } from '../../components/cards/BaseCard';

interface DoorsPackageCardProps {
  package: DoorsPackage;
  onMarkReceived: (packageId: string) => void;
  onMarkReviewed: (packageId: string) => void;
  onApprove?: (packageId: string) => void;
  onClose?: (packageId: string) => void;
  onEdit?: (pkg: DoorsPackage) => void;
  onDelete?: (packageId: string) => void;
  onDuplicate?: (pkg: DoorsPackage) => void;
  onViewHistory?: (pkg: DoorsPackage) => void;
  bulkSelectMode?: boolean;
  isSelected?: boolean;
  onSelect?: (packageId: string) => void;
  onLongPress?: (packageId: string) => void;
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high':   return COLORS.ERROR;
    case 'medium': return COLORS.WARNING;
    default:       return COLORS.DISABLED;
  }
};

const getComplianceColor = (percentage: number) => {
  if (percentage >= 80) return COLORS.SUCCESS;
  if (percentage >= 50) return COLORS.WARNING;
  return COLORS.ERROR;
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
  onViewHistory,
  bulkSelectMode = false,
  isSelected = false,
  onSelect,
  onLongPress,
}) => {
  const canEdit = pkg.status === 'pending' || pkg.status === 'received';
  const canDelete = pkg.status === 'pending';
  const hasCompliance = pkg.compliancePercentage !== undefined && pkg.compliancePercentage > 0;

  const statusConfig = STATUS_CONFIG[pkg.status] || STATUS_CONFIG.pending;

  const details: DetailRow[] = [
    { label: 'Site', value: pkg.siteName || 'N/A' },
    { label: 'Category', value: pkg.category },
    { label: 'Equipment', value: pkg.equipmentType },
    ...(pkg.materialType ? [{ label: 'Material', value: pkg.materialType }] : []),
    ...(pkg.quantity !== undefined && pkg.quantity > 0
      ? [{ label: 'Quantity', value: `${pkg.quantity} ${pkg.unit || ''}` }]
      : []),
    ...(pkg.specificationRef ? [{ label: 'Spec Ref', value: pkg.specificationRef }] : []),
    {
      label: 'Requirements',
      value: pkg.compliantRequirements !== undefined
        ? `${pkg.compliantRequirements} / ${pkg.totalRequirements} compliant`
        : String(pkg.totalRequirements),
    },
    ...(pkg.receivedDate ? [{ label: 'Received', value: new Date(pkg.receivedDate).toLocaleDateString() }] : []),
    ...(pkg.receivedRemarks ? [{ label: 'Recv Remarks', value: pkg.receivedRemarks }] : []),
    ...(pkg.reviewedDate ? [{ label: 'Reviewed', value: new Date(pkg.reviewedDate).toLocaleDateString() }] : []),
    ...(pkg.reviewObservations ? [{ label: 'Observations', value: pkg.reviewObservations }] : []),
    ...(pkg.approvedDate ? [{ label: 'Approved', value: new Date(pkg.approvedDate).toLocaleDateString() }] : []),
    ...(pkg.approvalRemarks ? [{ label: 'Appr Remarks', value: pkg.approvalRemarks }] : []),
    ...(pkg.closureDate ? [{ label: 'Closed', value: new Date(pkg.closureDate).toLocaleDateString() }] : []),
    ...(pkg.closureRemarks ? [{ label: 'Remarks', value: pkg.closureRemarks }] : []),
  ];

  const headerRight = (
    <View style={styles.headerRightColumn}>
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
        icon={statusConfig.icon}
        style={{ backgroundColor: statusConfig.color + '20' }}
        textStyle={[styles.statusChipText, { color: statusConfig.color }]}>
        {statusConfig.label}
      </Chip>
    </View>
  );

  return (
    <BaseCard
      title={pkg.doorsId}
      subtitle={pkg.equipmentName}
      headerRight={headerRight}
      details={details}
      isSelected={isSelected}
      bulkSelectMode={bulkSelectMode}
      onSelect={onSelect ? () => onSelect(pkg.id) : undefined}
      onLongPress={onLongPress ? () => onLongPress(pkg.id) : undefined}
    >
      <StatusTimeline steps={DOORS_STATUS_STEPS} currentStatus={pkg.status} />

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
            iconColor={COLORS.ERROR}
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
        {onViewHistory && (
          <IconButton
            icon="history"
            size={20}
            onPress={() => onViewHistory(pkg)}
            accessibilityLabel="View revision history"
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
            style={[styles.actionButton, styles.approveButton]}>
            Approve
          </Button>
        )}
        {pkg.status === 'approved' && onClose && (
          <Button
            mode="contained"
            onPress={() => onClose(pkg.id)}
            style={[styles.actionButton, styles.closeButton]}>
            Close
          </Button>
        )}
      </View>
    </BaseCard>
  );
};

const styles = StyleSheet.create({
  headerRightColumn: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 4,
  },
  statusChipText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  priorityChipText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
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
  approveButton: {
    backgroundColor: '#7B1FA2',
  },
  closeButton: {
    backgroundColor: '#616161',
  },
});

export default DoorsPackageCard;
