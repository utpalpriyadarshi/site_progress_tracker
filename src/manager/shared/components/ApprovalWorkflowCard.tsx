import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS } from '../../../theme/colors';

/**
 * ApprovalWorkflowCard
 *
 * Reusable card component for displaying approval workflows
 * Used across Manager screens for consistent approval UI
 *
 * Features:
 * - Displays approval status with color coding
 * - Shows requester, priority, and date information
 * - Action buttons for approve/reject
 * - Configurable appearance
 * - Accessible and touchable
 *
 * @example
 * ```tsx
 * <ApprovalWorkflowCard
 *   item={{
 *     id: '1',
 *     title: 'Material Request - Steel Beams',
 *     description: 'Request for 20 tons of steel beams',
 *     requester: 'John Doe',
 *     requestDate: Date.now(),
 *     priority: 'high',
 *     status: 'pending',
 *     category: 'Material',
 *     site: 'Site A',
 *   }}
 *   onApprove={(id) => console.log('Approved:', id)}
 *   onReject={(id) => console.log('Rejected:', id)}
 *   showActions={true}
 * />
 * ```
 */

export interface ApprovalWorkflowItem {
  id: string;
  title: string;
  description: string;
  requester: string;
  requestDate: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'approved' | 'rejected';
  category?: string;
  site?: string;
}

interface ApprovalWorkflowCardProps {
  item: ApprovalWorkflowItem;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onPress?: (id: string) => void;
  showActions?: boolean;
  compact?: boolean;
}

const ApprovalWorkflowCard: React.FC<ApprovalWorkflowCardProps> = ({
  item,
  onApprove,
  onReject,
  onPress,
  showActions = true,
  compact = false,
}) => {
  const getPriorityColor = (priority: ApprovalWorkflowItem['priority']) => {
    switch (priority) {
      case 'urgent':
        return COLORS.ERROR;
      case 'high':
        return COLORS.WARNING;
      case 'medium':
        return '#FFC107';
      case 'low':
        return COLORS.DISABLED;
      default:
        return COLORS.DISABLED;
    }
  };

  const getStatusColor = (status: ApprovalWorkflowItem['status']) => {
    switch (status) {
      case 'approved':
        return COLORS.SUCCESS;
      case 'rejected':
        return COLORS.ERROR;
      case 'pending':
        return '#FFC107';
      default:
        return COLORS.DISABLED;
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const handlePress = () => {
    if (onPress) {
      onPress(item.id);
    }
  };

  const handleApprove = () => {
    if (onApprove) {
      onApprove(item.id);
    }
  };

  const handleReject = () => {
    if (onReject) {
      onReject(item.id);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.card, compact && styles.cardCompact]}
      onPress={handlePress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      {/* Priority Indicator */}
      <View
        style={[
          styles.priorityIndicator,
          { backgroundColor: getPriorityColor(item.priority) },
        ]}
      />

      {/* Content */}
      <View style={styles.content}>
        {/* Header Row */}
        <View style={styles.headerRow}>
          <View style={styles.titleContainer}>
            <Text style={styles.title} numberOfLines={1}>
              {item.title}
            </Text>
            {item.category && (
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{item.category}</Text>
              </View>
            )}
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(item.status) },
            ]}
          >
            <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
          </View>
        </View>

        {/* Description */}
        {!compact && (
          <Text style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>
        )}

        {/* Metadata Row */}
        <View style={styles.metadataRow}>
          <View style={styles.metadata}>
            <Text style={styles.metadataLabel}>Requester:</Text>
            <Text style={styles.metadataValue}>{item.requester}</Text>
          </View>
          {item.site && (
            <View style={styles.metadata}>
              <Text style={styles.metadataLabel}>Site:</Text>
              <Text style={styles.metadataValue}>{item.site}</Text>
            </View>
          )}
          <View style={styles.metadata}>
            <Text style={styles.metadataLabel}>Date:</Text>
            <Text style={styles.metadataValue}>{formatDate(item.requestDate)}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        {showActions && item.status === 'pending' && (
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionButton, styles.approveButton]}
              onPress={handleApprove}
            >
              <Text style={styles.actionButtonText}>Approve</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={handleReject}
            >
              <Text style={styles.actionButtonText}>Reject</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginVertical: 6,
    marginHorizontal: 12,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardCompact: {
    marginVertical: 4,
  },
  priorityIndicator: {
    width: 4,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
  },
  content: {
    flex: 1,
    padding: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
  },
  categoryBadge: {
    backgroundColor: COLORS.INFO_BG,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  categoryText: {
    fontSize: 12,
    color: '#1976D2',
    fontWeight: '500',
  },
  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
    lineHeight: 20,
  },
  metadataRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  metadata: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  metadataLabel: {
    fontSize: 12,
    color: '#999',
    marginRight: 4,
  },
  metadataValue: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  actionsRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    borderRadius: 6,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  approveButton: {
    backgroundColor: COLORS.SUCCESS,
  },
  rejectButton: {
    backgroundColor: COLORS.ERROR,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ApprovalWorkflowCard;
