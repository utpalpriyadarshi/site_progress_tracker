import React, { useReducer, useEffect, useCallback } from 'react';
import { logger } from '../services/LoggingService';

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Modal,
} from 'react-native';
import EquipmentManagementService, {
  Equipment,
  EquipmentStatus,
  MaintenanceSchedule,
  EquipmentAllocation,
} from '../services/EquipmentManagementService';
import mockEquipment, {
  mockMaintenanceRecords,
  mockAllocations,
  mockOperatorCertifications,
} from '../data/mockEquipment';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { EmptyState } from '../components/common/EmptyState';
import {
  equipmentManagementReducer,
  initialEquipmentManagementState,
  StatusFilter,
} from './equipment/state';
import { COLORS } from '../theme/colors';

/**
 * EquipmentManagementScreen (Week 3)
 *
 * Comprehensive equipment management with:
 * - Equipment tracking with status monitoring
 * - Preventive maintenance scheduling
 * - Allocation and utilization tracking
 * - Operator certification management
 * - Performance analytics
 * - Downtime analysis
 */

const EquipmentManagementScreen = () => {
  // Centralized state management with useReducer
  const [state, dispatch] = useReducer(
    equipmentManagementReducer,
    initialEquipmentManagementState
  );

  // Load equipment data
  const loadEquipmentData = useCallback(() => {
    dispatch({ type: 'START_LOADING' });
    try {
      // Generate maintenance schedule
      const schedule = EquipmentManagementService.generateMaintenanceSchedule(
        mockEquipment,
        mockMaintenanceRecords
      );

      // Check certifications
      const alerts = EquipmentManagementService.checkOperatorCertifications(
        mockOperatorCertifications
      );

      // Load all data in a single dispatch
      dispatch({
        type: 'LOAD_ALL_EQUIPMENT_DATA',
        payload: {
          equipment: mockEquipment,
          maintenanceRecords: mockMaintenanceRecords,
          allocations: mockAllocations,
          certifications: mockOperatorCertifications,
          maintenanceSchedule: schedule,
          certificationAlerts: alerts,
        },
      });
    } catch (error) {
      logger.error('Error loading equipment data:', error as Error);
    } finally {
      dispatch({ type: 'STOP_LOADING' });
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    loadEquipmentData();
  }, [loadEquipmentData]);

  // Filter equipment
  const filteredEquipment = React.useMemo(() => {
    let filtered = state.data.equipment;

    if (state.ui.statusFilter !== 'all') {
      filtered = filtered.filter(eq => eq.status === state.ui.statusFilter);
    }

    if (state.ui.searchQuery.trim()) {
      const query = state.ui.searchQuery.toLowerCase();
      filtered = filtered.filter(eq =>
        eq.name.toLowerCase().includes(query) ||
        eq.model.toLowerCase().includes(query) ||
        eq.manufacturer.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [state.data.equipment, state.ui.statusFilter, state.ui.searchQuery]);

  // Calculate statistics
  const stats = React.useMemo(() => {
    const total = state.data.equipment.length;
    const available = state.data.equipment.filter(e => e.status === 'available').length;
    const inUse = state.data.equipment.filter(e => e.status === 'in_use').length;
    const maintenance = state.data.equipment.filter(e => e.status === 'maintenance' || e.status === 'repair').length;
    const overdueMaintenance = state.data.maintenanceSchedule.filter(m => m.isOverdue).length;
    const certExpiring = state.data.certificationAlerts.length;

    return { total, available, inUse, maintenance, overdueMaintenance, certExpiring };
  }, [state.data.equipment, state.data.maintenanceSchedule, state.data.certificationAlerts]);

  const getStatusColor = (status: EquipmentStatus): string => {
    switch (status) {
      case 'available': return COLORS.SUCCESS;
      case 'in_use': return COLORS.INFO;
      case 'maintenance': return COLORS.WARNING;
      case 'repair': return COLORS.ERROR;
      case 'retired': return COLORS.DISABLED;
      default: return '#999';
    }
  };

  const getStatusBgColor = (status: EquipmentStatus): string => {
    switch (status) {
      case 'available': return COLORS.SUCCESS_BG;
      case 'in_use': return COLORS.INFO_BG;
      case 'maintenance': return COLORS.WARNING_BG;
      case 'repair': return COLORS.ERROR_BG;
      case 'retired': return '#F5F5F5';
      default: return '#F5F5F5';
    }
  };

  const getConditionColor = (condition: number): string => {
    if (condition > 75) return COLORS.SUCCESS;
    if (condition > 50) return COLORS.WARNING;
    return COLORS.ERROR;
  };

  const getHealthScoreColor = (score: number): string => {
    if (score > 75) return COLORS.SUCCESS;
    if (score > 50) return COLORS.WARNING;
    return COLORS.ERROR;
  };

  const renderStatCards = () => {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsScroll}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total Equipment</Text>
        </View>

        <View style={[styles.statCard, styles.statCardSuccess]}>
          <Text style={styles.statValue}>{stats.available}</Text>
          <Text style={styles.statLabel}>Available</Text>
        </View>

        <View style={[styles.statCard, styles.statCardInfo]}>
          <Text style={styles.statValue}>{stats.inUse}</Text>
          <Text style={styles.statLabel}>In Use</Text>
        </View>

        <View style={[styles.statCard, styles.statCardWarning]}>
          <Text style={styles.statValue}>{stats.maintenance}</Text>
          <Text style={styles.statLabel}>Maintenance</Text>
        </View>

        {stats.overdueMaintenance > 0 && (
          <View style={[styles.statCard, styles.statCardCritical]}>
            <Text style={styles.statValue}>{stats.overdueMaintenance}</Text>
            <Text style={styles.statLabel}>Overdue</Text>
          </View>
        )}

        {stats.certExpiring > 0 && (
          <View style={[styles.statCard, styles.statCardAlert]}>
            <Text style={styles.statValue}>{stats.certExpiring}</Text>
            <Text style={styles.statLabel}>Cert Issues</Text>
          </View>
        )}
      </ScrollView>
    );
  };

  const renderViewModeTabs = () => {
    return (
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, state.ui.viewMode === 'overview' && styles.tabActive]}
          onPress={() => dispatch({ type: 'SET_VIEW_MODE', payload: 'overview' })}
        >
          <Text style={[styles.tabText, state.ui.viewMode === 'overview' && styles.tabTextActive]}>
            Overview
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, state.ui.viewMode === 'maintenance' && styles.tabActive]}
          onPress={() => dispatch({ type: 'SET_VIEW_MODE', payload: 'maintenance' })}
        >
          <Text style={[styles.tabText, state.ui.viewMode === 'maintenance' && styles.tabTextActive]}>
            Maintenance
          </Text>
          {stats.overdueMaintenance > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{stats.overdueMaintenance}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, state.ui.viewMode === 'allocation' && styles.tabActive]}
          onPress={() => dispatch({ type: 'SET_VIEW_MODE', payload: 'allocation' })}
        >
          <Text style={[styles.tabText, state.ui.viewMode === 'allocation' && styles.tabTextActive]}>
            Allocation
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, state.ui.viewMode === 'performance' && styles.tabActive]}
          onPress={() => dispatch({ type: 'SET_VIEW_MODE', payload: 'performance' })}
        >
          <Text style={[styles.tabText, state.ui.viewMode === 'performance' && styles.tabTextActive]}>
            Performance
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderStatusFilters = () => {
    if (state.ui.viewMode !== 'overview') return null;

    const statuses: StatusFilter[] = ['all', 'available', 'in_use', 'maintenance', 'repair'];

    return (
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {statuses.map(status => (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterChip,
                state.ui.statusFilter === status && styles.filterChipActive,
                status !== 'all' && { borderColor: getStatusColor(status as EquipmentStatus) },
              ]}
              onPress={() => dispatch({ type: 'SET_STATUS_FILTER', payload: status })}
            >
              {status !== 'all' && (
                <View style={[styles.filterDot, { backgroundColor: getStatusColor(status as EquipmentStatus) }]} />
              )}
              <Text
                style={[
                  styles.filterChipText,
                  state.ui.statusFilter === status && styles.filterChipTextActive,
                ]}
              >
                {status === 'all' ? 'All' : status.replace('_', ' ').toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderSearchBar = () => {
    return (
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search equipment..."
          placeholderTextColor={COLORS.TEXT_TERTIARY}
          value={state.ui.searchQuery}
          onChangeText={(text) => dispatch({ type: 'SET_SEARCH_QUERY', payload: text })}
        />
      </View>
    );
  };

  const renderEquipmentCard = (eq: Equipment) => {
    const utilizationMetrics = EquipmentManagementService.calculateUtilizationMetrics(
      eq,
      state.data.allocations.filter(a => a.equipmentId === eq.id),
      state.data.maintenanceRecords.filter(m => m.equipmentId === eq.id),
      30
    );

    return (
      <TouchableOpacity
        key={eq.id}
        style={styles.equipmentCard}
        onPress={() => {
          dispatch({ type: 'SELECT_EQUIPMENT', payload: eq });
          dispatch({ type: 'SHOW_DETAILS_MODAL' });
        }}
      >
        <View style={[styles.cardBorder, { backgroundColor: getStatusColor(eq.status) }]} />

        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <Text style={styles.cardTitle}>{eq.name}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusBgColor(eq.status) }]}>
                <Text style={[styles.statusText, { color: getStatusColor(eq.status) }]}>
                  {eq.status.toUpperCase()}
                </Text>
              </View>
            </View>
            <Text style={styles.cardSubtitle}>{eq.manufacturer} - {eq.model}</Text>
          </View>

          <View style={styles.cardDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Location:</Text>
              <Text style={styles.detailValue}>{eq.locationName}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Condition:</Text>
              <View style={styles.conditionBar}>
                <View style={[styles.conditionFill, { width: `${eq.condition}%`, backgroundColor: getConditionColor(eq.condition) }]} />
              </View>
              <Text style={styles.detailValue}>{eq.condition}%</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Utilization:</Text>
              <Text style={styles.detailValue}>{utilizationMetrics.utilizationRate.toFixed(0)}%</Text>
            </View>
          </View>

          {eq.currentProjectId && (
            <View style={styles.allocationInfo}>
              <Text style={styles.allocationText}>
                Allocated to Project {eq.currentProjectId}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderMaintenanceScheduleItem = (schedule: MaintenanceSchedule) => {
    const getPriorityColor = (priority: string) => {
      switch (priority) {
        case 'critical': return COLORS.ERROR;
        case 'high': return COLORS.WARNING;
        case 'medium': return '#FFC107';
        case 'low': return COLORS.SUCCESS;
        default: return '#999';
      }
    };

    return (
      <View key={schedule.equipmentId} style={styles.maintenanceCard}>
        <View style={styles.maintenanceHeader}>
          <Text style={styles.maintenanceName}>{schedule.equipmentName}</Text>
          <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(schedule.priority) }]}>
            <Text style={styles.priorityText}>{schedule.priority.toUpperCase()}</Text>
          </View>
        </View>

        {schedule.isOverdue && (
          <View style={styles.overdueAlert}>
            <Text style={styles.overdueText}>
              OVERDUE by {Math.abs(schedule.daysUntilDue)} days
            </Text>
          </View>
        )}

        <View style={styles.maintenanceDetails}>
          <View style={styles.maintenanceRow}>
            <Text style={styles.maintenanceLabel}>Due Date:</Text>
            <Text style={[styles.maintenanceValue, schedule.isOverdue && styles.overdueValue]}>
              {schedule.nextMaintenanceDate.toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.maintenanceRow}>
            <Text style={styles.maintenanceLabel}>Duration:</Text>
            <Text style={styles.maintenanceValue}>{schedule.estimatedDurationHours}h</Text>
          </View>
          <View style={styles.maintenanceRow}>
            <Text style={styles.maintenanceLabel}>Est. Cost:</Text>
            <Text style={styles.maintenanceValue}>₹{(schedule.estimatedCost / 1000).toFixed(1)}K</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.scheduleButton}>
          <Text style={styles.scheduleButtonText}>Schedule Maintenance</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderAllocationItem = (allocation: EquipmentAllocation) => {
    return (
      <View key={allocation.id} style={styles.allocationCard}>
        <View style={styles.allocationHeader}>
          <Text style={styles.allocationEquipment}>{allocation.equipmentName}</Text>
          <View style={[styles.allocationStatusBadge, allocation.status === 'active' && styles.allocationStatusActive]}>
            <Text style={styles.allocationStatusText}>{allocation.status.toUpperCase()}</Text>
          </View>
        </View>

        <Text style={styles.allocationProject}>Project: {allocation.projectName}</Text>
        <Text style={styles.allocationSite}>Site: {allocation.siteName}</Text>

        <View style={styles.allocationMetrics}>
          <View style={styles.allocationMetric}>
            <Text style={styles.allocationMetricLabel}>Duration</Text>
            <Text style={styles.allocationMetricValue}>{allocation.allocatedDays}d</Text>
          </View>
          <View style={styles.allocationMetric}>
            <Text style={styles.allocationMetricLabel}>Hours Used</Text>
            <Text style={styles.allocationMetricValue}>{allocation.actualHoursUsed}h</Text>
          </View>
          <View style={styles.allocationMetric}>
            <Text style={styles.allocationMetricLabel}>Utilization</Text>
            <Text style={styles.allocationMetricValue}>{allocation.utilizationRate}%</Text>
          </View>
        </View>

        {allocation.operatorName && (
          <Text style={styles.allocationOperator}>Operator: {allocation.operatorName}</Text>
        )}
      </View>
    );
  };

  const renderPerformanceMetrics = () => {
    return (
      <ScrollView style={styles.performanceContainer}>
        {state.data.equipment.slice(0, 5).map(eq => {
          const performance = EquipmentManagementService.calculatePerformanceMetrics(
            eq,
            state.data.maintenanceRecords.filter(m => m.equipmentId === eq.id),
            state.data.allocations.filter(a => a.equipmentId === eq.id)
          );

          return (
            <View key={eq.id} style={styles.performanceCard}>
              <Text style={styles.performanceName}>{eq.name}</Text>

              <View style={styles.performanceGrid}>
                <View style={styles.performanceItem}>
                  <Text style={styles.performanceLabel}>Health Score</Text>
                  <Text style={[styles.performanceValue, { color: getHealthScoreColor(performance.overallHealthScore) }]}>
                    {performance.overallHealthScore.toFixed(0)}%
                  </Text>
                </View>
                <View style={styles.performanceItem}>
                  <Text style={styles.performanceLabel}>Availability</Text>
                  <Text style={styles.performanceValue}>{performance.availability.toFixed(0)}%</Text>
                </View>
                <View style={styles.performanceItem}>
                  <Text style={styles.performanceLabel}>MTBF</Text>
                  <Text style={styles.performanceValue}>{performance.meanTimeBetweenFailures.toFixed(0)}h</Text>
                </View>
                <View style={styles.performanceItem}>
                  <Text style={styles.performanceLabel}>Cost/Hour</Text>
                  <Text style={styles.performanceValue}>₹{performance.costPerHour.toFixed(0)}</Text>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>
    );
  };

  const renderDetailsModal = () => {
    if (!state.modal.selectedEquipment) return null;

    const performance = EquipmentManagementService.calculatePerformanceMetrics(
      state.modal.selectedEquipment,
      state.data.maintenanceRecords.filter(m => m.equipmentId === state.modal.selectedEquipment!.id),
      state.data.allocations.filter(a => a.equipmentId === state.modal.selectedEquipment!.id)
    );

    return (
      <Modal
        visible={state.ui.showDetailsModal}
        transparent
        animationType="slide"
        onRequestClose={() => dispatch({ type: 'HIDE_DETAILS_MODAL' })}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{state.modal.selectedEquipment.name}</Text>
              <TouchableOpacity onPress={() => dispatch({ type: 'HIDE_DETAILS_MODAL' })}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>General Info</Text>
                <Text style={styles.modalInfo}>Manufacturer: {state.modal.selectedEquipment.manufacturer}</Text>
                <Text style={styles.modalInfo}>Model: {state.modal.selectedEquipment.model}</Text>
                <Text style={styles.modalInfo}>Serial: {state.modal.selectedEquipment.serialNumber}</Text>
                <Text style={styles.modalInfo}>Purchase Date: {state.modal.selectedEquipment.purchaseDate.toLocaleDateString()}</Text>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Performance</Text>
                <Text style={styles.modalInfo}>Health Score: {performance.overallHealthScore.toFixed(0)}%</Text>
                <Text style={styles.modalInfo}>Availability: {performance.availability.toFixed(0)}%</Text>
                <Text style={styles.modalInfo}>MTBF: {performance.meanTimeBetweenFailures.toFixed(0)} hours</Text>
                <Text style={styles.modalInfo}>MTTR: {performance.meanTimeToRepair.toFixed(1)} hours</Text>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Maintenance</Text>
                <Text style={styles.modalInfo}>Last: {state.modal.selectedEquipment.lastMaintenanceDate.toLocaleDateString()}</Text>
                <Text style={styles.modalInfo}>Next: {state.modal.selectedEquipment.nextMaintenanceDate.toLocaleDateString()}</Text>
                <Text style={styles.modalInfo}>Total Cost: ₹{(state.modal.selectedEquipment.totalMaintenanceCost / 1000).toFixed(1)}K</Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  // Empty state rendering for overview mode
  const renderOverviewEmptyState = () => {
    const hasNoData = state.data.equipment.length === 0;
    const hasSearchQuery = state.ui.searchQuery.trim().length > 0;
    const hasFilter = state.ui.statusFilter !== 'all';
    const noFilteredResults = filteredEquipment.length === 0;

    // No equipment at all
    if (hasNoData) {
      return (
        <EmptyState
          icon="excavator"
          title="No Equipment Registered"
          message="Add your first equipment to start tracking usage and maintenance."
          helpText="Track equipment status, schedule maintenance, and monitor performance."
          actionText="Add Equipment"
          onAction={() => {
            logger.info('[Equipment] Add equipment action pressed');
          }}
        />
      );
    }

    // No search results
    if (hasSearchQuery && noFilteredResults) {
      return (
        <EmptyState
          icon="magnify"
          title="No Equipment Found"
          message={`No equipment matches "${state.ui.searchQuery}"`}
          variant="search"
          actionText="Clear Search"
          onAction={() => dispatch({ type: 'SET_SEARCH_QUERY', payload: '' })}
        />
      );
    }

    // No filter results
    if (hasFilter && noFilteredResults) {
      return (
        <EmptyState
          icon="filter-off"
          title={`No ${state.ui.statusFilter.charAt(0).toUpperCase() + state.ui.statusFilter.slice(1).replace('_', ' ')} Equipment`}
          message="Try selecting a different status filter."
          actionText="Clear Filter"
          onAction={() => dispatch({ type: 'SET_STATUS_FILTER', payload: 'all' })}
        />
      );
    }

    return null;
  };

  const renderContent = () => {
    switch (state.ui.viewMode) {
      case 'overview':
        return (
          renderOverviewEmptyState() || (
            <ScrollView style={styles.contentScroll}>
              {filteredEquipment.map(eq => renderEquipmentCard(eq))}
            </ScrollView>
          )
        );
      case 'maintenance':
        return (
          state.data.maintenanceSchedule.length === 0 ? (
            <EmptyState
              icon="wrench-outline"
              title="No Maintenance Scheduled"
              message="No maintenance tasks are scheduled for your equipment."
            />
          ) : (
            <ScrollView style={styles.contentScroll}>
              {state.data.maintenanceSchedule.map(schedule => renderMaintenanceScheduleItem(schedule))}
            </ScrollView>
          )
        );
      case 'allocation':
        return (
          state.data.allocations.length === 0 ? (
            <EmptyState
              icon="account-multiple-outline"
              title="No Allocations"
              message="No equipment has been allocated to projects yet."
            />
          ) : (
            <ScrollView style={styles.contentScroll}>
              {state.data.allocations.map(allocation => renderAllocationItem(allocation))}
            </ScrollView>
          )
        );
      case 'performance':
        return renderPerformanceMetrics();
      default:
        return null;
    }
  };

  if (state.ui.loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.INFO} />
        <Text style={styles.loadingText}>Loading equipment data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Equipment Management</Text>
        <Text style={styles.subtitle}>Track, Maintain & Optimize Equipment</Text>
      </View>

      {renderStatCards()}
      {renderViewModeTabs()}
      {renderStatusFilters()}
      {state.ui.viewMode === 'overview' && renderSearchBar()}
      {renderContent()}
      {renderDetailsModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  header: {
    backgroundColor: COLORS.SURFACE,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    marginTop: 4,
  },
  statsScroll: {
    backgroundColor: COLORS.SURFACE,
    paddingHorizontal: 12,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  statCard: {
    minWidth: 100,
    padding: 16,
    borderRadius: 8,
    backgroundColor: COLORS.BACKGROUND,
    marginRight: 12,
    alignItems: 'center',
  },
  statCardSuccess: {
    backgroundColor: COLORS.SUCCESS_BG,
  },
  statCardInfo: {
    backgroundColor: COLORS.INFO_BG,
  },
  statCardWarning: {
    backgroundColor: COLORS.WARNING_BG,
  },
  statCardCritical: {
    backgroundColor: COLORS.ERROR_BG,
  },
  statCardAlert: {
    backgroundColor: '#FCE4EC',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    marginTop: 4,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.SURFACE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    gap: 6,
  },
  tabActive: {
    borderBottomColor: COLORS.INFO,
  },
  tabText: {
    fontSize: 13,
    color: COLORS.TEXT_SECONDARY,
  },
  tabTextActive: {
    color: COLORS.INFO,
    fontWeight: '600',
  },
  tabBadge: {
    backgroundColor: COLORS.ERROR,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  filtersContainer: {
    backgroundColor: COLORS.SURFACE,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: COLORS.BACKGROUND,
    marginRight: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    gap: 4,
  },
  filterChipActive: {
    backgroundColor: COLORS.INFO_BG,
    borderColor: COLORS.INFO,
  },
  filterChipText: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
  },
  filterChipTextActive: {
    color: COLORS.INFO,
    fontWeight: '600',
  },
  filterDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  searchContainer: {
    backgroundColor: COLORS.SURFACE,
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  searchInput: {
    backgroundColor: COLORS.BACKGROUND,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
  },
  contentScroll: {
    flex: 1,
    padding: 12,
  },
  equipmentCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.SURFACE,
    borderRadius: 8,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardBorder: {
    width: 4,
  },
  cardContent: {
    flex: 1,
    padding: 12,
  },
  cardHeader: {
    marginBottom: 12,
  },
  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.TEXT_PRIMARY,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  cardSubtitle: {
    fontSize: 13,
    color: COLORS.TEXT_SECONDARY,
  },
  cardDetails: {
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
    gap: 8,
  },
  detailLabel: {
    fontSize: 12,
    color: COLORS.TEXT_TERTIARY,
    width: 80,
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  conditionBar: {
    flex: 1,
    height: 6,
    backgroundColor: COLORS.BORDER,
    borderRadius: 3,
    overflow: 'hidden',
  },
  conditionFill: {
    height: '100%',
  },
  allocationInfo: {
    backgroundColor: COLORS.INFO_BG,
    padding: 8,
    borderRadius: 4,
  },
  allocationText: {
    fontSize: 11,
    color: COLORS.INFO,
    fontWeight: '600',
  },
  maintenanceCard: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  maintenanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  maintenanceName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  overdueAlert: {
    backgroundColor: COLORS.ERROR_BG,
    padding: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  overdueText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.ERROR,
  },
  maintenanceDetails: {
    marginBottom: 12,
  },
  maintenanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  maintenanceLabel: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
  },
  maintenanceValue: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  overdueValue: {
    color: COLORS.ERROR,
  },
  scheduleButton: {
    backgroundColor: COLORS.INFO,
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  scheduleButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  allocationCard: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  allocationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  allocationEquipment: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    flex: 1,
  },
  allocationStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: COLORS.BORDER,
  },
  allocationStatusActive: {
    backgroundColor: COLORS.INFO_BG,
  },
  allocationStatusText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.TEXT_SECONDARY,
  },
  allocationProject: {
    fontSize: 13,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 2,
  },
  allocationSite: {
    fontSize: 12,
    color: COLORS.TEXT_TERTIARY,
    marginBottom: 12,
  },
  allocationMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  allocationMetric: {
    flex: 1,
    alignItems: 'center',
  },
  allocationMetricLabel: {
    fontSize: 11,
    color: COLORS.TEXT_TERTIARY,
    marginBottom: 4,
  },
  allocationMetricValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.TEXT_PRIMARY,
  },
  allocationOperator: {
    fontSize: 12,
    color: COLORS.INFO,
    fontStyle: 'italic',
  },
  performanceContainer: {
    flex: 1,
    padding: 12,
  },
  performanceCard: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  performanceName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 12,
  },
  performanceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  performanceItem: {
    width: '50%',
    padding: 8,
    alignItems: 'center',
  },
  performanceLabel: {
    fontSize: 11,
    color: COLORS.TEXT_TERTIARY,
    marginBottom: 4,
  },
  performanceValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.TEXT_PRIMARY,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.SURFACE,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
  },
  modalClose: {
    fontSize: 24,
    color: COLORS.TEXT_SECONDARY,
  },
  modalScroll: {
    padding: 16,
  },
  modalSection: {
    marginBottom: 20,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 8,
  },
  modalInfo: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.BACKGROUND,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
  },
});

// Wrap with ErrorBoundary for graceful error handling
const EquipmentManagementScreenWithBoundary = () => (
  <ErrorBoundary name="Logistics - EquipmentManagementScreen">
    <EquipmentManagementScreen />
  </ErrorBoundary>
);

export default EquipmentManagementScreenWithBoundary;
