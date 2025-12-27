import React, { useState, useEffect } from 'react';
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
import { useLogistics } from './context/LogisticsContext';
import EquipmentManagementService, {
  Equipment,
  MaintenanceRecord,
  EquipmentAllocation,
  OperatorCertification,
  UtilizationMetrics,
  MaintenanceSchedule,
  EquipmentPerformance,
  EquipmentStatus,
} from '../services/EquipmentManagementService';
import mockEquipment, {
  mockMaintenanceRecords,
  mockAllocations,
  mockOperatorCertifications,
} from '../data/mockEquipment';
import { ErrorBoundary } from '../components/common/ErrorBoundary';

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

type ViewMode = 'overview' | 'maintenance' | 'allocation' | 'performance';
type StatusFilter = 'all' | EquipmentStatus;

const EquipmentManagementScreen = () => {
  const { selectedProjectId, projects } = useLogistics();

  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // Equipment data
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([]);
  const [allocations, setAllocations] = useState<EquipmentAllocation[]>([]);
  const [certifications, setCertifications] = useState<OperatorCertification[]>([]);

  // Computed data
  const [maintenanceSchedule, setMaintenanceSchedule] = useState<MaintenanceSchedule[]>([]);
  const [certificationAlerts, setCertificationAlerts] = useState<Array<{ operatorId: string; operatorName: string; daysUntilExpiry: number; status: string }>>([]);

  // Modal state
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Load data
  useEffect(() => {
    loadEquipmentData();
  }, []);

  const loadEquipmentData = () => {
    setLoading(true);
    try {
      // Load mock data
      setEquipment(mockEquipment);
      setMaintenanceRecords(mockMaintenanceRecords);
      setAllocations(mockAllocations);
      setCertifications(mockOperatorCertifications);

      // Generate maintenance schedule
      const schedule = EquipmentManagementService.generateMaintenanceSchedule(
        mockEquipment,
        mockMaintenanceRecords
      );
      setMaintenanceSchedule(schedule);

      // Check certifications
      const alerts = EquipmentManagementService.checkOperatorCertifications(
        mockOperatorCertifications
      );
      setCertificationAlerts(alerts);
    } catch (error) {
      console.error('Error loading equipment data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter equipment
  const filteredEquipment = React.useMemo(() => {
    let filtered = equipment;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(eq => eq.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(eq =>
        eq.name.toLowerCase().includes(query) ||
        eq.model.toLowerCase().includes(query) ||
        eq.manufacturer.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [equipment, statusFilter, searchQuery]);

  // Calculate statistics
  const stats = React.useMemo(() => {
    const total = equipment.length;
    const available = equipment.filter(e => e.status === 'available').length;
    const inUse = equipment.filter(e => e.status === 'in_use').length;
    const maintenance = equipment.filter(e => e.status === 'maintenance' || e.status === 'repair').length;
    const overdueMaintenance = maintenanceSchedule.filter(m => m.isOverdue).length;
    const certExpiring = certificationAlerts.length;

    return { total, available, inUse, maintenance, overdueMaintenance, certExpiring };
  }, [equipment, maintenanceSchedule, certificationAlerts]);

  const getStatusColor = (status: EquipmentStatus): string => {
    switch (status) {
      case 'available': return '#4CAF50';
      case 'in_use': return '#2196F3';
      case 'maintenance': return '#FF9800';
      case 'repair': return '#F44336';
      case 'retired': return '#9E9E9E';
      default: return '#999';
    }
  };

  const getStatusBgColor = (status: EquipmentStatus): string => {
    switch (status) {
      case 'available': return '#E8F5E9';
      case 'in_use': return '#E3F2FD';
      case 'maintenance': return '#FFF3E0';
      case 'repair': return '#FFEBEE';
      case 'retired': return '#F5F5F5';
      default: return '#F5F5F5';
    }
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
          style={[styles.tab, viewMode === 'overview' && styles.tabActive]}
          onPress={() => setViewMode('overview')}
        >
          <Text style={[styles.tabText, viewMode === 'overview' && styles.tabTextActive]}>
            Overview
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, viewMode === 'maintenance' && styles.tabActive]}
          onPress={() => setViewMode('maintenance')}
        >
          <Text style={[styles.tabText, viewMode === 'maintenance' && styles.tabTextActive]}>
            Maintenance
          </Text>
          {stats.overdueMaintenance > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{stats.overdueMaintenance}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, viewMode === 'allocation' && styles.tabActive]}
          onPress={() => setViewMode('allocation')}
        >
          <Text style={[styles.tabText, viewMode === 'allocation' && styles.tabTextActive]}>
            Allocation
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, viewMode === 'performance' && styles.tabActive]}
          onPress={() => setViewMode('performance')}
        >
          <Text style={[styles.tabText, viewMode === 'performance' && styles.tabTextActive]}>
            Performance
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderStatusFilters = () => {
    if (viewMode !== 'overview') return null;

    const statuses: StatusFilter[] = ['all', 'available', 'in_use', 'maintenance', 'repair'];

    return (
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {statuses.map(status => (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterChip,
                statusFilter === status && styles.filterChipActive,
                status !== 'all' && { borderColor: getStatusColor(status as EquipmentStatus) },
              ]}
              onPress={() => setStatusFilter(status)}
            >
              {status !== 'all' && (
                <View style={[styles.filterDot, { backgroundColor: getStatusColor(status as EquipmentStatus) }]} />
              )}
              <Text
                style={[
                  styles.filterChipText,
                  statusFilter === status && styles.filterChipTextActive,
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
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
    );
  };

  const renderEquipmentCard = (eq: Equipment) => {
    const utilizationMetrics = EquipmentManagementService.calculateUtilizationMetrics(
      eq,
      allocations.filter(a => a.equipmentId === eq.id),
      maintenanceRecords.filter(m => m.equipmentId === eq.id),
      30
    );

    return (
      <TouchableOpacity
        key={eq.id}
        style={styles.equipmentCard}
        onPress={() => {
          setSelectedEquipment(eq);
          setShowDetailsModal(true);
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
                <View style={[styles.conditionFill, { width: `${eq.condition}%`, backgroundColor: eq.condition > 75 ? '#4CAF50' : eq.condition > 50 ? '#FF9800' : '#F44336' }]} />
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
        case 'critical': return '#F44336';
        case 'high': return '#FF9800';
        case 'medium': return '#FFC107';
        case 'low': return '#4CAF50';
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
        {equipment.slice(0, 5).map(eq => {
          const performance = EquipmentManagementService.calculatePerformanceMetrics(
            eq,
            maintenanceRecords.filter(m => m.equipmentId === eq.id),
            allocations.filter(a => a.equipmentId === eq.id)
          );

          return (
            <View key={eq.id} style={styles.performanceCard}>
              <Text style={styles.performanceName}>{eq.name}</Text>

              <View style={styles.performanceGrid}>
                <View style={styles.performanceItem}>
                  <Text style={styles.performanceLabel}>Health Score</Text>
                  <Text style={[styles.performanceValue, { color: performance.overallHealthScore > 75 ? '#4CAF50' : performance.overallHealthScore > 50 ? '#FF9800' : '#F44336' }]}>
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
    if (!selectedEquipment) return null;

    const performance = EquipmentManagementService.calculatePerformanceMetrics(
      selectedEquipment,
      maintenanceRecords.filter(m => m.equipmentId === selectedEquipment.id),
      allocations.filter(a => a.equipmentId === selectedEquipment.id)
    );

    return (
      <Modal
        visible={showDetailsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDetailsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedEquipment.name}</Text>
              <TouchableOpacity onPress={() => setShowDetailsModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>General Info</Text>
                <Text style={styles.modalInfo}>Manufacturer: {selectedEquipment.manufacturer}</Text>
                <Text style={styles.modalInfo}>Model: {selectedEquipment.model}</Text>
                <Text style={styles.modalInfo}>Serial: {selectedEquipment.serialNumber}</Text>
                <Text style={styles.modalInfo}>Purchase Date: {selectedEquipment.purchaseDate.toLocaleDateString()}</Text>
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
                <Text style={styles.modalInfo}>Last: {selectedEquipment.lastMaintenanceDate.toLocaleDateString()}</Text>
                <Text style={styles.modalInfo}>Next: {selectedEquipment.nextMaintenanceDate.toLocaleDateString()}</Text>
                <Text style={styles.modalInfo}>Total Cost: ₹{(selectedEquipment.totalMaintenanceCost / 1000).toFixed(1)}K</Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  const renderContent = () => {
    switch (viewMode) {
      case 'overview':
        return (
          <ScrollView style={styles.contentScroll}>
            {filteredEquipment.map(eq => renderEquipmentCard(eq))}
          </ScrollView>
        );
      case 'maintenance':
        return (
          <ScrollView style={styles.contentScroll}>
            {maintenanceSchedule.map(schedule => renderMaintenanceScheduleItem(schedule))}
          </ScrollView>
        );
      case 'allocation':
        return (
          <ScrollView style={styles.contentScroll}>
            {allocations.map(allocation => renderAllocationItem(allocation))}
          </ScrollView>
        );
      case 'performance':
        return renderPerformanceMetrics();
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
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
      {viewMode === 'overview' && renderSearchBar()}
      {renderContent()}
      {renderDetailsModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
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
  statsScroll: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  statCard: {
    minWidth: 100,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    marginRight: 12,
    alignItems: 'center',
  },
  statCardSuccess: {
    backgroundColor: '#E8F5E9',
  },
  statCardInfo: {
    backgroundColor: '#E3F2FD',
  },
  statCardWarning: {
    backgroundColor: '#FFF3E0',
  },
  statCardCritical: {
    backgroundColor: '#FFEBEE',
  },
  statCardAlert: {
    backgroundColor: '#FCE4EC',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
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
    borderBottomColor: '#2196F3',
  },
  tabText: {
    fontSize: 13,
    color: '#666',
  },
  tabTextActive: {
    color: '#2196F3',
    fontWeight: '600',
  },
  tabBadge: {
    backgroundColor: '#F44336',
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
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
    marginRight: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    gap: 4,
  },
  filterChipActive: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
  },
  filterChipText: {
    fontSize: 12,
    color: '#666',
  },
  filterChipTextActive: {
    color: '#2196F3',
    fontWeight: '600',
  },
  filterDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  searchContainer: {
    backgroundColor: '#fff',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333',
  },
  contentScroll: {
    flex: 1,
    padding: 12,
  },
  equipmentCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
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
    color: '#333',
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
    color: '#666',
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
    color: '#999',
    width: 80,
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  conditionBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  conditionFill: {
    height: '100%',
  },
  allocationInfo: {
    backgroundColor: '#E3F2FD',
    padding: 8,
    borderRadius: 4,
  },
  allocationText: {
    fontSize: 11,
    color: '#2196F3',
    fontWeight: '600',
  },
  maintenanceCard: {
    backgroundColor: '#fff',
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
    color: '#333',
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
    backgroundColor: '#FFEBEE',
    padding: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  overdueText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F44336',
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
    color: '#666',
  },
  maintenanceValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  overdueValue: {
    color: '#F44336',
  },
  scheduleButton: {
    backgroundColor: '#2196F3',
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
    backgroundColor: '#fff',
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
    color: '#333',
    flex: 1,
  },
  allocationStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#E0E0E0',
  },
  allocationStatusActive: {
    backgroundColor: '#E3F2FD',
  },
  allocationStatusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#666',
  },
  allocationProject: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  allocationSite: {
    fontSize: 12,
    color: '#999',
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
    color: '#999',
    marginBottom: 4,
  },
  allocationMetricValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  allocationOperator: {
    fontSize: 12,
    color: '#2196F3',
    fontStyle: 'italic',
  },
  performanceContainer: {
    flex: 1,
    padding: 12,
  },
  performanceCard: {
    backgroundColor: '#fff',
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
    color: '#333',
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
    color: '#999',
    marginBottom: 4,
  },
  performanceValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
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
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalClose: {
    fontSize: 24,
    color: '#666',
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
    color: '#333',
    marginBottom: 8,
  },
  modalInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
});

// Wrap with ErrorBoundary for graceful error handling
const EquipmentManagementScreenWithBoundary = () => (
  <ErrorBoundary name="Logistics - EquipmentManagementScreen">
    <EquipmentManagementScreen />
  </ErrorBoundary>
);

export default EquipmentManagementScreenWithBoundary;
