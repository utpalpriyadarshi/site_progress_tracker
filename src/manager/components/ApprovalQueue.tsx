import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  RefreshControl,
} from 'react-native';
import { Snackbar } from 'react-native-paper';
import { useSnackbar } from '../../hooks/useSnackbar';
import { database } from '../../../models/database';
import ResourceRequestModel from '../../../models/ResourceRequestModel';
import SiteModel from '../../../models/SiteModel';
import ResourceRequestService from '../../../services/resource/ResourceRequestService';
import { logger } from '../../services/LoggingService';
import { COLORS } from '../../theme/colors';

interface ApprovalQueueProps {
  currentUserId: string;
}

/**
 * ApprovalQueue
 *
 * Component for viewing and approving/rejecting resource requests.
 * Features:
 * - View pending requests
 * - Filter by priority and site
 * - Approve requests
 * - Reject requests with reason
 * - Sort by priority or date
 */
const ApprovalQueue: React.FC<ApprovalQueueProps> = ({ currentUserId }) => {
  const { show: showSnackbar, snackbarProps } = useSnackbar();
  const [requests, setRequests] = useState<ResourceRequestModel[]>([]);
  const [sites, setSites] = useState<SiteModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterPriority, setFilterPriority] = useState<string | null>(null);
  const [filterSite, setFilterSite] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'priority' | 'date'>('priority');

  // Rejection modal state
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    loadData();
  }, [filterPriority, filterSite]);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadRequests(), loadSites()]);
    } catch (error) {
      logger.error('Error loading data', error as Error);
      showSnackbar('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const loadRequests = async () => {
    try {
      let loadedRequests: ResourceRequestModel[];

      if (filterPriority && filterSite) {
        // Filter by both priority and site
        const allPending = await ResourceRequestService.getPendingRequests();
        loadedRequests = allPending.filter(
          (r) => r.priority === filterPriority && r.siteId === filterSite
        );
      } else if (filterPriority) {
        // Filter by priority
        loadedRequests = await ResourceRequestService.getRequestsByPriority(filterPriority);
        loadedRequests = loadedRequests.filter((r) => r.approvalStatus === 'pending');
      } else if (filterSite) {
        // Filter by site
        const siteRequests = await ResourceRequestService.getRequestsBySite(filterSite);
        loadedRequests = siteRequests.filter((r) => r.approvalStatus === 'pending');
      } else {
        // Load all pending
        loadedRequests = await ResourceRequestService.getPendingRequests();
      }

      // Sort
      if (sortBy === 'priority') {
        const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
        loadedRequests.sort((a, b) => {
          return (
            priorityOrder[a.priority as keyof typeof priorityOrder] -
            priorityOrder[b.priority as keyof typeof priorityOrder]
          );
        });
      } else {
        // Sort by date (most recent first)
        loadedRequests.sort((a, b) => b.requestedDate - a.requestedDate);
      }

      setRequests(loadedRequests);
    } catch (error) {
      logger.error('Error loading requests', error as Error);
      throw error;
    }
  };

  const loadSites = async () => {
    try {
      const loadedSites = await database.collections
        .get<SiteModel>('sites')
        .query()
        .fetch();
      setSites(loadedSites);
    } catch (error) {
      logger.error('Error loading sites', error as Error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleApprove = async (requestId: string) => {
    Alert.alert(
      'Confirm Approval',
      'Are you sure you want to approve this resource request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            try {
              await ResourceRequestService.approveRequest(requestId, currentUserId);
              showSnackbar('Request approved successfully');
              loadRequests();
            } catch (error) {
              logger.error('Error approving request', error as Error);
              showSnackbar('Failed to approve request');
            }
          },
        },
      ]
    );
  };

  const handleReject = (requestId: string) => {
    setSelectedRequestId(requestId);
    setRejectionReason('');
    setRejectModalVisible(true);
  };

  const confirmReject = async () => {
    if (!rejectionReason.trim()) {
      showSnackbar('Please provide a reason for rejection');
      return;
    }

    if (!selectedRequestId) return;

    try {
      await ResourceRequestService.rejectRequest(
        selectedRequestId,
        currentUserId,
        rejectionReason.trim()
      );

      showSnackbar('Request rejected successfully');
      setRejectModalVisible(false);
      setSelectedRequestId(null);
      setRejectionReason('');
      loadRequests();
    } catch (error) {
      logger.error('Error rejecting request', error as Error);
      showSnackbar('Failed to reject request');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return COLORS.ERROR;
      case 'high':
        return COLORS.WARNING;
      case 'medium':
        return '#FFC107';
      case 'low':
        return COLORS.SUCCESS;
      default:
        return COLORS.DISABLED;
    }
  };

  const getDaysUntilNeeded = (neededByDate: number): number => {
    const diff = neededByDate - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const renderRequestCard = (request: ResourceRequestModel) => {
    const daysUntilNeeded = getDaysUntilNeeded(request.neededByDate);
    const isUrgent = daysUntilNeeded <= 3;

    return (
      <View
        key={request.id}
        style={[styles.requestCard, isUrgent && styles.urgentRequestCard]}
      >
        {/* Header */}
        <View style={styles.requestHeader}>
          <View style={styles.requestTitleRow}>
            <Text style={styles.resourceName}>{request.resourceName}</Text>
            <View
              style={[
                styles.priorityBadge,
                { backgroundColor: getPriorityColor(request.priority) },
              ]}
            >
              <Text style={styles.priorityText}>{request.priority}</Text>
            </View>
          </View>
          <Text style={styles.resourceType}>{request.resourceType}</Text>
        </View>

        {/* Details */}
        <View style={styles.requestDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Quantity:</Text>
            <Text style={styles.detailValue}>{request.quantity}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Site:</Text>
            <Text style={styles.detailValue}>
              {sites.find((s) => s.id === request.siteId)?.name || 'Unknown'}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Requested by:</Text>
            <Text style={styles.detailValue}>{request.requestedBy}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Needed in:</Text>
            <Text style={[styles.detailValue, isUrgent && styles.urgentText]}>
              {daysUntilNeeded} days
              {isUrgent && ' ⚠️'}
            </Text>
          </View>
        </View>

        {/* Notes */}
        {request.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.notesLabel}>Notes:</Text>
            <Text style={styles.notesText}>{request.notes}</Text>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={() => handleReject(request.id)}
          >
            <Text style={styles.rejectButtonText}>Reject</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.approveButton]}
            onPress={() => handleApprove(request.id)}
          >
            <Text style={styles.approveButtonText}>Approve</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderRejectModal = () => (
    <Modal
      visible={rejectModalVisible}
      transparent
      animationType="fade"
      onRequestClose={() => setRejectModalVisible(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Reject Request</Text>
          <Text style={styles.modalDescription}>
            Please provide a reason for rejecting this request.
          </Text>

          <TextInput
            style={[styles.input, styles.reasonInput]}
            value={rejectionReason}
            onChangeText={setRejectionReason}
            placeholder="Enter rejection reason"
            placeholderTextColor="#999"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalCancelButton]}
              onPress={() => setRejectModalVisible(false)}
            >
              <Text style={styles.modalCancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalConfirmButton]}
              onPress={confirmReject}
            >
              <Text style={styles.modalConfirmButtonText}>Reject Request</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Approval Queue</Text>
        <Text style={styles.subtitle}>{requests.length} pending requests</Text>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <Text style={styles.filterLabel}>Sort by:</Text>
          <TouchableOpacity
            style={[
              styles.filterChip,
              sortBy === 'priority' && styles.activeFilterChip,
            ]}
            onPress={() => {
              setSortBy('priority');
              loadRequests();
            }}
          >
            <Text
              style={[
                styles.filterChipText,
                sortBy === 'priority' && styles.activeFilterChipText,
              ]}
            >
              Priority
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterChip,
              sortBy === 'date' && styles.activeFilterChip,
            ]}
            onPress={() => {
              setSortBy('date');
              loadRequests();
            }}
          >
            <Text
              style={[
                styles.filterChipText,
                sortBy === 'date' && styles.activeFilterChipText,
              ]}
            >
              Date
            </Text>
          </TouchableOpacity>

          <Text style={[styles.filterLabel, styles.filterLabelSpaced]}>Priority:</Text>
          {['urgent', 'high', 'medium', 'low'].map((priority) => (
            <TouchableOpacity
              key={priority}
              style={[
                styles.filterChip,
                filterPriority === priority && styles.activeFilterChip,
              ]}
              onPress={() =>
                setFilterPriority(filterPriority === priority ? null : priority)
              }
            >
              <Text
                style={[
                  styles.filterChipText,
                  filterPriority === priority && styles.activeFilterChipText,
                ]}
              >
                {priority}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Requests List */}
      <ScrollView
        style={styles.requestsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {loading ? (
          <Text style={styles.loadingText}>Loading requests...</Text>
        ) : requests.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No pending requests</Text>
            <Text style={styles.emptySubtext}>
              All caught up! No requests awaiting approval.
            </Text>
          </View>
        ) : (
          requests.map(renderRequestCard)
        )}
      </ScrollView>

      {renderRejectModal()}
      <Snackbar {...snackbarProps} duration={3000} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  filtersContainer: {
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
    alignSelf: 'center',
  },
  filterLabelSpaced: {
    marginLeft: 16,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    marginRight: 8,
  },
  activeFilterChip: {
    backgroundColor: COLORS.INFO,
  },
  filterChipText: {
    fontSize: 14,
    color: '#666',
    textTransform: 'capitalize',
  },
  activeFilterChipText: {
    color: '#fff',
    fontWeight: '600',
  },
  requestsList: {
    flex: 1,
    padding: 12,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 40,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  requestCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  urgentRequestCard: {
    borderColor: COLORS.ERROR,
    borderWidth: 2,
  },
  requestHeader: {
    marginBottom: 12,
  },
  requestTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  resourceName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  resourceType: {
    fontSize: 14,
    color: '#666',
    textTransform: 'capitalize',
  },
  requestDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  urgentText: {
    color: COLORS.ERROR,
    fontWeight: '600',
  },
  notesSection: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#333',
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  actionButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginLeft: 12,
  },
  rejectButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: COLORS.ERROR,
  },
  rejectButtonText: {
    color: COLORS.ERROR,
    fontSize: 14,
    fontWeight: '600',
  },
  approveButton: {
    backgroundColor: COLORS.SUCCESS,
  },
  approveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 500,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  reasonInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  modalButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginLeft: 12,
  },
  modalCancelButton: {
    backgroundColor: '#f5f5f5',
  },
  modalCancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  modalConfirmButton: {
    backgroundColor: COLORS.ERROR,
  },
  modalConfirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ApprovalQueue;
