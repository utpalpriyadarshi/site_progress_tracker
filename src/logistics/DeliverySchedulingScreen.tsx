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
  RefreshControl,
} from 'react-native';
import { useLogistics } from './context/LogisticsContext';
import DeliverySchedulingService, {
  DeliverySchedule,
  DeliveryStatus,
  DeliveryPriority,
  RouteOptimization,
  SiteReadiness,
  DeliveryPerformance,
  DeliveryException,
} from '../services/DeliverySchedulingService';
import mockDeliverySchedules, {
  mockRouteOptimizations,
  mockSiteReadiness,
  mockDeliveryExceptions,
  mockSuppliers,
} from '../data/mockDeliveries';

/**
 * DeliverySchedulingScreen (Week 4 - Enhanced)
 *
 * Smart delivery scheduling with:
 * - Just-in-time delivery optimization
 * - Real-time tracking and status
 * - Route optimization
 * - Site readiness validation
 * - Exception management
 * - Performance analytics
 */

type ViewMode = 'schedule' | 'tracking' | 'routes' | 'performance';
type StatusFilter = 'all' | DeliveryStatus;

const DeliverySchedulingScreen = () => {
  const { selectedProjectId, projects } = useLogistics();

  const [viewMode, setViewMode] = useState<ViewMode>('schedule');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Delivery data
  const [deliveries, setDeliveries] = useState<DeliverySchedule[]>([]);
  const [routes, setRoutes] = useState<RouteOptimization[]>([]);
  const [siteReadiness, setSiteReadiness] = useState<SiteReadiness[]>([]);
  const [exceptions, setExceptions] = useState<DeliveryException[]>([]);
  const [performance, setPerformance] = useState<DeliveryPerformance | null>(null);

  // Modal state
  const [selectedDelivery, setSelectedDelivery] = useState<DeliverySchedule | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<RouteOptimization | null>(null);
  const [showRouteModal, setShowRouteModal] = useState(false);

  // Load data
  useEffect(() => {
    loadDeliveryData();
  }, []);

  const loadDeliveryData = () => {
    setLoading(true);
    try {
      // Load mock data
      setDeliveries(mockDeliverySchedules);
      setRoutes(mockRouteOptimizations);
      setSiteReadiness(mockSiteReadiness);
      setExceptions(mockDeliveryExceptions);

      // Calculate performance
      const performanceMetrics = DeliverySchedulingService.calculatePerformanceMetrics(
        mockDeliverySchedules
      );
      setPerformance(performanceMetrics);
    } catch (error) {
      console.error('Error loading delivery data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadDeliveryData();
    setRefreshing(false);
  };

  // Filter deliveries
  const filteredDeliveries = React.useMemo(() => {
    let filtered = deliveries;

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(d => d.status === statusFilter);
    }

    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(d =>
        d.deliveryNumber.toLowerCase().includes(query) ||
        d.materialName.toLowerCase().includes(query) ||
        d.siteName.toLowerCase().includes(query) ||
        d.supplierName.toLowerCase().includes(query)
      );
    }

    // Filter by selected project
    if (selectedProjectId) {
      filtered = filtered.filter(d => d.projectId === selectedProjectId);
    }

    return filtered.sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime());
  }, [deliveries, statusFilter, searchQuery, selectedProjectId]);

  // Calculate statistics
  const stats = React.useMemo(() => {
    const total = deliveries.length;
    const scheduled = deliveries.filter(d => d.status === 'scheduled').length;
    const inTransit = deliveries.filter(d => d.status === 'in_transit').length;
    const delivered = deliveries.filter(d => d.status === 'delivered').length;
    const delayed = deliveries.filter(d => d.status === 'delayed').length;
    const critical = deliveries.filter(d => d.priority === 'critical').length;

    return { total, scheduled, inTransit, delivered, delayed, critical };
  }, [deliveries]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusColor = (status: DeliveryStatus) => {
    switch (status) {
      case 'delivered': return '#10b981';
      case 'in_transit': return '#3b82f6';
      case 'delayed': return '#ef4444';
      case 'scheduled': return '#f59e0b';
      case 'confirmed': return '#8b5cf6';
      case 'cancelled': return '#6b7280';
      default: return '#9ca3af';
    }
  };

  const getPriorityColor = (priority: DeliveryPriority) => {
    switch (priority) {
      case 'critical': return '#dc2626';
      case 'high': return '#f59e0b';
      case 'medium': return '#3b82f6';
      case 'low': return '#10b981';
      default: return '#9ca3af';
    }
  };

  // ============================================================================
  // RENDER: STAT CARDS
  // ============================================================================

  const renderStatCards = () => {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsScroll}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#f59e0b' }]}>{stats.scheduled}</Text>
          <Text style={styles.statLabel}>Scheduled</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#3b82f6' }]}>{stats.inTransit}</Text>
          <Text style={styles.statLabel}>In Transit</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#10b981' }]}>{stats.delivered}</Text>
          <Text style={styles.statLabel}>Delivered</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#ef4444' }]}>{stats.delayed}</Text>
          <Text style={styles.statLabel}>Delayed</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#dc2626' }]}>{stats.critical}</Text>
          <Text style={styles.statLabel}>Critical</Text>
        </View>
      </ScrollView>
    );
  };

  // ============================================================================
  // RENDER: VIEW MODE TABS
  // ============================================================================

  const renderViewModeTabs = () => {
    const modes: Array<{ mode: ViewMode; label: string; badge?: number }> = [
      { mode: 'schedule', label: 'Schedule', badge: stats.scheduled + stats.inTransit },
      { mode: 'tracking', label: 'Tracking', badge: stats.inTransit },
      { mode: 'routes', label: 'Routes', badge: routes.length },
      { mode: 'performance', label: 'Analytics' },
    ];

    return (
      <View style={styles.viewModeContainer}>
        {modes.map(({ mode, label, badge }) => (
          <TouchableOpacity
            key={mode}
            style={[styles.viewModeTab, viewMode === mode && styles.viewModeTabActive]}
            onPress={() => setViewMode(mode)}
          >
            <Text style={[styles.viewModeText, viewMode === mode && styles.viewModeTextActive]}>
              {label}
            </Text>
            {badge !== undefined && badge > 0 && (
              <View style={styles.viewModeBadge}>
                <Text style={styles.viewModeBadgeText}>{badge}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // ============================================================================
  // RENDER: STATUS FILTER
  // ============================================================================

  const renderStatusFilter = () => {
    const statuses: Array<{ status: StatusFilter; label: string }> = [
      { status: 'all', label: 'All' },
      { status: 'scheduled', label: 'Scheduled' },
      { status: 'in_transit', label: 'In Transit' },
      { status: 'delivered', label: 'Delivered' },
      { status: 'delayed', label: 'Delayed' },
    ];

    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        {statuses.map(({ status, label }) => (
          <TouchableOpacity
            key={status}
            style={[styles.filterChip, statusFilter === status && styles.filterChipActive]}
            onPress={() => setStatusFilter(status)}
          >
            <Text style={[styles.filterChipText, statusFilter === status && styles.filterChipTextActive]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  // ============================================================================
  // RENDER: DELIVERY SCHEDULE VIEW
  // ============================================================================

  const renderDeliveryCard = (delivery: DeliverySchedule) => {
    return (
      <TouchableOpacity
        key={delivery.id}
        style={styles.deliveryCard}
        onPress={() => {
          setSelectedDelivery(delivery);
          setShowDetailsModal(true);
        }}
      >
        {/* Header */}
        <View style={styles.deliveryCardHeader}>
          <View>
            <Text style={styles.deliveryNumber}>{delivery.deliveryNumber}</Text>
            <Text style={styles.deliveryMaterial}>{delivery.materialName}</Text>
          </View>
          <View style={styles.statusBadgeContainer}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(delivery.status) }]}>
              <Text style={styles.statusBadgeText}>{delivery.status.toUpperCase()}</Text>
            </View>
            <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(delivery.priority) }]}>
              <Text style={styles.priorityBadgeText}>{delivery.priority.toUpperCase()}</Text>
            </View>
          </View>
        </View>

        {/* Details */}
        <View style={styles.deliveryCardDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Quantity:</Text>
            <Text style={styles.detailValue}>{delivery.quantity} {delivery.unit}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Supplier:</Text>
            <Text style={styles.detailValue}>{delivery.supplierName}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Site:</Text>
            <Text style={styles.detailValue}>{delivery.siteName}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Scheduled:</Text>
            <Text style={styles.detailValue}>
              {formatDate(delivery.scheduledDate)} {formatTime(delivery.estimatedDeliveryTime)}
            </Text>
          </View>
          {delivery.status === 'in_transit' && delivery.progressPercentage !== undefined && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${delivery.progressPercentage}%` }]} />
              </View>
              <Text style={styles.progressText}>{delivery.progressPercentage}%</Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.deliveryCardFooter}>
          <Text style={styles.footerText}>
            {delivery.distanceKm.toFixed(0)} km • ₹{delivery.totalCost.toFixed(0)}
          </Text>
          {!delivery.siteReady && (
            <View style={styles.warningBadge}>
              <Text style={styles.warningText}>⚠️ Site Not Ready</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderScheduleView = () => {
    if (filteredDeliveries.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No deliveries found</Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.contentScroll}>
        {filteredDeliveries.map(delivery => renderDeliveryCard(delivery))}
      </ScrollView>
    );
  };

  // ============================================================================
  // RENDER: TRACKING VIEW
  // ============================================================================

  const renderTrackingView = () => {
    const inTransitDeliveries = deliveries.filter(d => d.status === 'in_transit');

    if (inTransitDeliveries.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No deliveries in transit</Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.contentScroll}>
        {inTransitDeliveries.map(delivery => (
          <View key={delivery.id} style={styles.trackingCard}>
            <View style={styles.trackingHeader}>
              <View>
                <Text style={styles.trackingNumber}>{delivery.deliveryNumber}</Text>
                <Text style={styles.trackingMaterial}>{delivery.materialName}</Text>
              </View>
              <View style={styles.progressCircle}>
                <Text style={styles.progressCircleText}>{delivery.progressPercentage}%</Text>
              </View>
            </View>

            <View style={styles.trackingRoute}>
              <View style={styles.trackingPoint}>
                <View style={[styles.trackingDot, styles.trackingDotComplete]} />
                <View style={styles.trackingInfo}>
                  <Text style={styles.trackingLabel}>From</Text>
                  <Text style={styles.trackingLocation}>{delivery.supplierLocation}</Text>
                </View>
              </View>

              <View style={styles.trackingLine} />

              {delivery.currentLocation && (
                <>
                  <View style={styles.trackingPoint}>
                    <View style={[styles.trackingDot, styles.trackingDotCurrent]} />
                    <View style={styles.trackingInfo}>
                      <Text style={styles.trackingLabel}>Current</Text>
                      <Text style={styles.trackingLocation}>{delivery.currentLocation}</Text>
                      <Text style={styles.trackingTime}>Updated: {formatTime(delivery.lastUpdated!)}</Text>
                    </View>
                  </View>
                  <View style={styles.trackingLine} />
                </>
              )}

              <View style={styles.trackingPoint}>
                <View style={[styles.trackingDot, styles.trackingDotPending]} />
                <View style={styles.trackingInfo}>
                  <Text style={styles.trackingLabel}>To</Text>
                  <Text style={styles.trackingLocation}>{delivery.siteAddress}</Text>
                  <Text style={styles.trackingTime}>ETA: {formatTime(delivery.estimatedDeliveryTime)}</Text>
                </View>
              </View>
            </View>

            <View style={styles.trackingFooter}>
              <Text style={styles.trackingDriver}>Driver: {delivery.driverName}</Text>
              <Text style={styles.trackingVehicle}>Vehicle: {delivery.vehicleType}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    );
  };

  // ============================================================================
  // RENDER: ROUTES VIEW
  // ============================================================================

  const renderRouteCard = (route: RouteOptimization) => {
    return (
      <TouchableOpacity
        key={route.routeId}
        style={styles.routeCard}
        onPress={() => {
          setSelectedRoute(route);
          setShowRouteModal(true);
        }}
      >
        <View style={styles.routeHeader}>
          <View>
            <Text style={styles.routeId}>Route #{route.routeId.split('_')[1]}</Text>
            <Text style={styles.routeDeliveries}>{route.deliveries.length} Deliveries</Text>
          </View>
          <View style={[styles.routeStatusBadge, { backgroundColor: getStatusColor(route.status as any) }]}>
            <Text style={styles.routeStatusText}>{route.status.toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.routeMetrics}>
          <View style={styles.routeMetric}>
            <Text style={styles.routeMetricValue}>{route.totalDistanceKm.toFixed(0)} km</Text>
            <Text style={styles.routeMetricLabel}>Distance</Text>
          </View>
          <View style={styles.routeMetric}>
            <Text style={styles.routeMetricValue}>{route.totalDurationHours.toFixed(1)} h</Text>
            <Text style={styles.routeMetricLabel}>Duration</Text>
          </View>
          <View style={styles.routeMetric}>
            <Text style={styles.routeMetricValue}>₹{route.totalCost.toFixed(0)}</Text>
            <Text style={styles.routeMetricLabel}>Cost</Text>
          </View>
          <View style={styles.routeMetric}>
            <Text style={styles.routeMetricValue}>{route.fuelEstimate.toFixed(0)} L</Text>
            <Text style={styles.routeMetricLabel}>Fuel</Text>
          </View>
        </View>

        <View style={styles.routeOptimization}>
          <View style={styles.optimizationBar}>
            <View style={[styles.optimizationFill, { width: `${route.optimizationScore}%` }]} />
          </View>
          <Text style={styles.optimizationText}>
            Score: {route.optimizationScore.toFixed(0)}/100 • Savings: {route.savingsPercentage.toFixed(0)}%
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderRoutesView = () => {
    if (routes.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No routes available</Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.contentScroll}>
        {routes.map(route => renderRouteCard(route))}
      </ScrollView>
    );
  };

  // ============================================================================
  // RENDER: PERFORMANCE VIEW
  // ============================================================================

  const renderPerformanceView = () => {
    if (!performance) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No performance data</Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.contentScroll}>
        {/* On-Time Performance */}
        <View style={styles.performanceSection}>
          <Text style={styles.performanceSectionTitle}>On-Time Performance</Text>
          <View style={styles.performanceGrid}>
            <View style={styles.performanceCard}>
              <Text style={styles.performanceValue}>{performance.onTimePercentage.toFixed(1)}%</Text>
              <Text style={styles.performanceLabel}>On-Time Rate</Text>
            </View>
            <View style={styles.performanceCard}>
              <Text style={[styles.performanceValue, { color: '#10b981' }]}>{performance.onTimeDeliveries}</Text>
              <Text style={styles.performanceLabel}>On-Time</Text>
            </View>
            <View style={styles.performanceCard}>
              <Text style={[styles.performanceValue, { color: '#ef4444' }]}>{performance.lateDeliveries}</Text>
              <Text style={styles.performanceLabel}>Late</Text>
            </View>
            <View style={styles.performanceCard}>
              <Text style={styles.performanceValue}>{performance.averageDelayHours.toFixed(1)} h</Text>
              <Text style={styles.performanceLabel}>Avg Delay</Text>
            </View>
          </View>
        </View>

        {/* Cost Analysis */}
        <View style={styles.performanceSection}>
          <Text style={styles.performanceSectionTitle}>Cost Analysis</Text>
          <View style={styles.performanceGrid}>
            <View style={styles.performanceCard}>
              <Text style={styles.performanceValue}>₹{performance.totalCost.toFixed(0)}</Text>
              <Text style={styles.performanceLabel}>Total Cost</Text>
            </View>
            <View style={styles.performanceCard}>
              <Text style={styles.performanceValue}>₹{performance.averageCostPerDelivery.toFixed(0)}</Text>
              <Text style={styles.performanceLabel}>Avg/Delivery</Text>
            </View>
            <View style={styles.performanceCard}>
              <Text style={styles.performanceValue}>₹{performance.costPerKm.toFixed(1)}</Text>
              <Text style={styles.performanceLabel}>Cost/km</Text>
            </View>
            <View style={styles.performanceCard}>
              <Text style={styles.performanceValue}>{performance.utilizationRate.toFixed(0)}%</Text>
              <Text style={styles.performanceLabel}>Utilization</Text>
            </View>
          </View>
        </View>

        {/* Efficiency Metrics */}
        <View style={styles.performanceSection}>
          <Text style={styles.performanceSectionTitle}>Efficiency Metrics</Text>
          <View style={styles.performanceGrid}>
            <View style={styles.performanceCard}>
              <Text style={styles.performanceValue}>{performance.averageDistanceKm.toFixed(0)} km</Text>
              <Text style={styles.performanceLabel}>Avg Distance</Text>
            </View>
            <View style={styles.performanceCard}>
              <Text style={styles.performanceValue}>{performance.averageDurationHours.toFixed(1)} h</Text>
              <Text style={styles.performanceLabel}>Avg Duration</Text>
            </View>
            <View style={styles.performanceCard}>
              <Text style={styles.performanceValue}>{performance.damageRate.toFixed(1)}%</Text>
              <Text style={styles.performanceLabel}>Damage Rate</Text>
            </View>
            <View style={styles.performanceCard}>
              <Text style={styles.performanceValue}>{performance.customerSatisfaction.toFixed(0)}</Text>
              <Text style={styles.performanceLabel}>Satisfaction</Text>
            </View>
          </View>
        </View>

        {/* Exceptions */}
        {exceptions.length > 0 && (
          <View style={styles.performanceSection}>
            <Text style={styles.performanceSectionTitle}>Recent Exceptions ({exceptions.length})</Text>
            {exceptions.slice(0, 5).map(exception => (
              <View key={exception.id} style={styles.exceptionCard}>
                <View style={[styles.exceptionBadge, { backgroundColor: getPriorityColor(exception.severity as any) }]}>
                  <Text style={styles.exceptionBadgeText}>{exception.severity.toUpperCase()}</Text>
                </View>
                <View style={styles.exceptionContent}>
                  <Text style={styles.exceptionType}>{exception.type.replace('_', ' ').toUpperCase()}</Text>
                  <Text style={styles.exceptionDescription}>{exception.description}</Text>
                  {exception.resolution && (
                    <Text style={styles.exceptionResolution}>✓ {exception.resolution}</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    );
  };

  // ============================================================================
  // RENDER: DELIVERY DETAILS MODAL
  // ============================================================================

  const renderDetailsModal = () => {
    if (!selectedDelivery) return null;

    return (
      <Modal visible={showDetailsModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedDelivery.deliveryNumber}</Text>
              <TouchableOpacity onPress={() => setShowDetailsModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              <Text style={styles.modalSectionTitle}>Material</Text>
              <Text style={styles.modalText}>{selectedDelivery.materialName}</Text>
              <Text style={styles.modalSubtext}>
                {selectedDelivery.quantity} {selectedDelivery.unit} • {selectedDelivery.category}
              </Text>

              <Text style={styles.modalSectionTitle}>Supplier</Text>
              <Text style={styles.modalText}>{selectedDelivery.supplierName}</Text>
              <Text style={styles.modalSubtext}>{selectedDelivery.supplierLocation}</Text>

              <Text style={styles.modalSectionTitle}>Destination</Text>
              <Text style={styles.modalText}>{selectedDelivery.siteName}</Text>
              <Text style={styles.modalSubtext}>{selectedDelivery.siteAddress}</Text>

              <Text style={styles.modalSectionTitle}>Schedule</Text>
              <Text style={styles.modalText}>
                Scheduled: {formatDate(selectedDelivery.scheduledDate)} {formatTime(selectedDelivery.estimatedDeliveryTime)}
              </Text>
              {selectedDelivery.actualDeliveryTime && (
                <Text style={styles.modalSubtext}>
                  Actual: {formatDate(selectedDelivery.actualDeliveryTime)} {formatTime(selectedDelivery.actualDeliveryTime)}
                </Text>
              )}
              <Text style={styles.modalSubtext}>Lead Time: {selectedDelivery.leadTimeDays} days</Text>

              <Text style={styles.modalSectionTitle}>Logistics</Text>
              <Text style={styles.modalText}>Distance: {selectedDelivery.distanceKm.toFixed(0)} km</Text>
              <Text style={styles.modalText}>Duration: {selectedDelivery.estimatedDurationHours.toFixed(1)} hours</Text>
              {selectedDelivery.driverName && (
                <Text style={styles.modalText}>Driver: {selectedDelivery.driverName}</Text>
              )}
              {selectedDelivery.vehicleType && (
                <Text style={styles.modalText}>Vehicle: {selectedDelivery.vehicleType}</Text>
              )}

              <Text style={styles.modalSectionTitle}>Cost</Text>
              <Text style={styles.modalText}>Transport: ₹{selectedDelivery.transportCost.toFixed(2)}</Text>
              <Text style={styles.modalText}>Handling: ₹{selectedDelivery.handlingCost.toFixed(2)}</Text>
              <Text style={styles.modalText}>Total: ₹{selectedDelivery.totalCost.toFixed(2)}</Text>

              <Text style={styles.modalSectionTitle}>Site Readiness</Text>
              <Text style={[styles.modalText, { color: selectedDelivery.siteReady ? '#10b981' : '#ef4444' }]}>
                {selectedDelivery.siteReady ? '✓ Site Ready' : '✗ Site Not Ready'}
              </Text>
              <Text style={[styles.modalText, { color: selectedDelivery.storageAvailable ? '#10b981' : '#ef4444' }]}>
                {selectedDelivery.storageAvailable ? '✓ Storage Available' : '✗ Storage Full'}
              </Text>
              {selectedDelivery.siteReadinessNotes && (
                <Text style={styles.modalSubtext}>{selectedDelivery.siteReadinessNotes}</Text>
              )}

              {selectedDelivery.notes && (
                <>
                  <Text style={styles.modalSectionTitle}>Notes</Text>
                  <Text style={styles.modalText}>{selectedDelivery.notes}</Text>
                </>
              )}
            </ScrollView>

            <TouchableOpacity style={styles.modalButton} onPress={() => setShowDetailsModal(false)}>
              <Text style={styles.modalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Delivery Scheduling</Text>
        <Text style={styles.subtitle}>Smart scheduling & real-time tracking</Text>
      </View>

      {/* Stats */}
      {renderStatCards()}

      {/* View Mode Tabs */}
      {renderViewModeTabs()}

      {/* Search and Filter */}
      {viewMode === 'schedule' && (
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search deliveries..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {renderStatusFilter()}
        </View>
      )}

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {viewMode === 'schedule' && renderScheduleView()}
        {viewMode === 'tracking' && renderTrackingView()}
        {viewMode === 'routes' && renderRoutesView()}
        {viewMode === 'performance' && renderPerformanceView()}
      </ScrollView>

      {/* Modals */}
      {renderDetailsModal()}
    </View>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },

  // Stats
  statsScroll: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  statCard: {
    marginLeft: 16,
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },

  // View Mode Tabs
  viewModeContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  viewModeTab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewModeTabActive: {
    backgroundColor: '#007AFF',
  },
  viewModeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  viewModeTextActive: {
    color: '#fff',
  },
  viewModeBadge: {
    marginLeft: 6,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  viewModeBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#007AFF',
  },

  // Search and Filter
  searchContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchInput: {
    height: 40,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  filterScroll: {
    flexDirection: 'row',
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
  },
  filterChipActive: {
    backgroundColor: '#007AFF',
  },
  filterChipText: {
    fontSize: 12,
    color: '#666',
  },
  filterChipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },

  // Content
  content: {
    flex: 1,
  },
  contentScroll: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#999',
  },

  // Delivery Card
  deliveryCard: {
    backgroundColor: '#fff',
    margin: 16,
    marginBottom: 0,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  deliveryCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  deliveryNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  deliveryMaterial: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  statusBadgeContainer: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  priorityBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  priorityBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  deliveryCardDetails: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 13,
    color: '#666',
  },
  detailValue: {
    fontSize: 13,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
  },
  progressText: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
    textAlign: 'right',
  },
  deliveryCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  footerText: {
    fontSize: 12,
    color: '#666',
  },
  warningBadge: {
    backgroundColor: '#fff3cd',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  warningText: {
    fontSize: 11,
    color: '#856404',
    fontWeight: '600',
  },

  // Tracking Card
  trackingCard: {
    backgroundColor: '#fff',
    margin: 16,
    marginBottom: 0,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  trackingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  trackingNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  trackingMaterial: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  progressCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressCircleText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  trackingRoute: {
    paddingVertical: 8,
  },
  trackingPoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  trackingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
  },
  trackingDotComplete: {
    backgroundColor: '#10b981',
  },
  trackingDotCurrent: {
    backgroundColor: '#3b82f6',
  },
  trackingDotPending: {
    backgroundColor: '#d1d5db',
  },
  trackingLine: {
    width: 2,
    height: 24,
    backgroundColor: '#d1d5db',
    marginLeft: 5,
  },
  trackingInfo: {
    flex: 1,
    marginLeft: 12,
  },
  trackingLabel: {
    fontSize: 11,
    color: '#999',
    textTransform: 'uppercase',
  },
  trackingLocation: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
    marginTop: 2,
  },
  trackingTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  trackingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  trackingDriver: {
    fontSize: 12,
    color: '#666',
  },
  trackingVehicle: {
    fontSize: 12,
    color: '#666',
  },

  // Route Card
  routeCard: {
    backgroundColor: '#fff',
    margin: 16,
    marginBottom: 0,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  routeId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  routeDeliveries: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  routeStatusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  routeStatusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  routeMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  routeMetric: {
    alignItems: 'center',
  },
  routeMetricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  routeMetricLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
  },
  routeOptimization: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  optimizationBar: {
    height: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  optimizationFill: {
    height: '100%',
    backgroundColor: '#10b981',
  },
  optimizationText: {
    fontSize: 12,
    color: '#666',
  },

  // Performance
  performanceSection: {
    backgroundColor: '#fff',
    margin: 16,
    marginBottom: 0,
    borderRadius: 12,
    padding: 16,
  },
  performanceSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  performanceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  performanceCard: {
    width: '48%',
    margin: '1%',
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    alignItems: 'center',
  },
  performanceValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  performanceLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  exceptionCard: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginTop: 8,
  },
  exceptionBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    height: 24,
  },
  exceptionBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  exceptionContent: {
    flex: 1,
    marginLeft: 12,
  },
  exceptionType: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  exceptionDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  exceptionResolution: {
    fontSize: 11,
    color: '#10b981',
    marginTop: 4,
  },

  // Modal
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
    color: '#1a1a1a',
  },
  modalClose: {
    fontSize: 24,
    color: '#666',
  },
  modalScroll: {
    padding: 16,
  },
  modalSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginTop: 16,
    marginBottom: 8,
  },
  modalText: {
    fontSize: 14,
    color: '#1a1a1a',
    marginBottom: 4,
  },
  modalSubtext: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  modalButton: {
    margin: 16,
    padding: 16,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default DeliverySchedulingScreen;
