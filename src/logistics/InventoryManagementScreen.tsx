import React, { useState, useEffect } from 'react';
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
  RefreshControl,
} from 'react-native';
import { useLogistics } from './context/LogisticsContext';
import InventoryOptimizationService, {
  InventoryItem,
  InventoryLocation,
  StockTransfer,
  ABCAnalysisResult,
  InventoryValuation,
  InventoryHealth,
  InventoryStatus,
  ABCCategory,
} from '../services/InventoryOptimizationService';
import mockInventoryItems, {
  mockInventoryLocations,
  mockStockMovements,
  mockStockTransfers,
} from '../data/mockInventory';
import { ErrorBoundary } from '../components/common/ErrorBoundary';

/**
 * InventoryManagementScreen (Week 5 - Enhanced)
 *
 * Multi-location inventory management with:
 * - ABC analysis for prioritization
 * - Multi-location tracking and valuation
 * - Stock transfers between locations
 * - Inventory health monitoring
 * - EOQ and safety stock recommendations
 */

type ViewMode = 'overview' | 'locations' | 'transfers' | 'analytics';
type StatusFilter = 'all' | InventoryStatus;
type LocationFilter = 'all' | string;

const InventoryManagementScreen = () => {
  const { selectedProjectId, projects } = useLogistics();

  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [locationFilter, setLocationFilter] = useState<LocationFilter>('all');
  const [abcFilter, setAbcFilter] = useState<ABCCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Data
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [locations, setLocations] = useState<InventoryLocation[]>([]);
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [abcAnalysis, setAbcAnalysis] = useState<ABCAnalysisResult[]>([]);
  const [inventoryHealth, setInventoryHealth] = useState<InventoryHealth | null>(null);

  // Modal state
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [showItemModal, setShowItemModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<InventoryLocation | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);

  // Load data
  useEffect(() => {
    loadInventoryData();
  }, []);

  const loadInventoryData = () => {
    setLoading(true);
    try {
      // Load mock data
      setItems(mockInventoryItems);
      setLocations(mockInventoryLocations);
      setTransfers(mockStockTransfers);

      // Perform ABC analysis
      const abcItems = mockInventoryItems
        .filter(item => item.annualDemand && item.annualDemand > 0)
        .map(item => ({
          materialId: item.materialId,
          materialName: item.materialName,
          annualDemand: item.annualDemand!,
          unitCost: item.unitCost,
        }));

      const abc = InventoryOptimizationService.performABCAnalysis(abcItems);
      setAbcAnalysis(abc);

      // Assess inventory health
      const totalValue = mockInventoryItems.reduce((sum, item) => sum + item.totalValue, 0);
      const health = InventoryOptimizationService.assessInventoryHealth(
        mockInventoryItems,
        mockStockMovements,
        totalValue
      );
      setInventoryHealth(health);
    } catch (error) {
      logger.error('Error loading inventory data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadInventoryData();
    setRefreshing(false);
  };

  // Filter items
  const filteredItems = React.useMemo(() => {
    let filtered = items;

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === statusFilter);
    }

    // Filter by location
    if (locationFilter !== 'all') {
      filtered = filtered.filter(item => item.locationId === locationFilter);
    }

    // Filter by ABC category
    if (abcFilter !== 'all') {
      filtered = filtered.filter(item => item.abcCategory === abcFilter);
    }

    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.materialName.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query) ||
        item.locationName.toLowerCase().includes(query)
      );
    }

    return filtered.sort((a, b) => b.totalValue - a.totalValue);
  }, [items, statusFilter, locationFilter, abcFilter, searchQuery]);

  // Calculate statistics
  const stats = React.useMemo(() => {
    const totalItems = items.length;
    const totalValue = items.reduce((sum, item) => sum + item.totalValue, 0);
    const lowStock = items.filter(item => item.status === 'low_stock').length;
    const outOfStock = items.filter(item => item.status === 'out_of_stock').length;
    const overstocked = items.filter(item => item.status === 'overstocked').length;
    const obsolete = items.filter(item => item.status === 'obsolete').length;
    const categoryA = items.filter(item => item.abcCategory === 'A').length;

    return { totalItems, totalValue, lowStock, outOfStock, overstocked, obsolete, categoryA };
  }, [items]);

  const getStatusColor = (status: InventoryStatus) => {
    switch (status) {
      case 'in_stock': return '#10b981';
      case 'low_stock': return '#f59e0b';
      case 'out_of_stock': return '#ef4444';
      case 'overstocked': return '#3b82f6';
      case 'obsolete': return '#6b7280';
      default: return '#9ca3af';
    }
  };

  const getABCColor = (category?: ABCCategory) => {
    switch (category) {
      case 'A': return '#dc2626';
      case 'B': return '#f59e0b';
      case 'C': return '#10b981';
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
          <Text style={styles.statValue}>{stats.totalItems}</Text>
          <Text style={styles.statLabel}>Total Items</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>₹{(stats.totalValue / 1000000).toFixed(1)}M</Text>
          <Text style={styles.statLabel}>Total Value</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#f59e0b' }]}>{stats.lowStock}</Text>
          <Text style={styles.statLabel}>Low Stock</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#ef4444' }]}>{stats.outOfStock}</Text>
          <Text style={styles.statLabel}>Out of Stock</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#3b82f6' }]}>{stats.overstocked}</Text>
          <Text style={styles.statLabel}>Overstocked</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#dc2626' }]}>{stats.categoryA}</Text>
          <Text style={styles.statLabel}>Category A</Text>
        </View>
      </ScrollView>
    );
  };

  // ============================================================================
  // RENDER: VIEW MODE TABS
  // ============================================================================

  const renderViewModeTabs = () => {
    const modes: Array<{ mode: ViewMode; label: string; badge?: number }> = [
      { mode: 'overview', label: 'Overview', badge: stats.lowStock + stats.outOfStock },
      { mode: 'locations', label: 'Locations', badge: locations.length },
      { mode: 'transfers', label: 'Transfers', badge: transfers.filter(t => t.status === 'requested').length },
      { mode: 'analytics', label: 'Analytics' },
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
  // RENDER: FILTERS
  // ============================================================================

  const renderFilters = () => {
    return (
      <View style={styles.filtersContainer}>
        {/* Search */}
        <TextInput
          style={styles.searchInput}
          placeholder="Search inventory..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        {/* Status Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          <TouchableOpacity
            style={[styles.filterChip, statusFilter === 'all' && styles.filterChipActive]}
            onPress={() => setStatusFilter('all')}
          >
            <Text style={[styles.filterChipText, statusFilter === 'all' && styles.filterChipTextActive]}>
              All Status
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, statusFilter === 'in_stock' && styles.filterChipActive]}
            onPress={() => setStatusFilter('in_stock')}
          >
            <Text style={[styles.filterChipText, statusFilter === 'in_stock' && styles.filterChipTextActive]}>
              In Stock
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, statusFilter === 'low_stock' && styles.filterChipActive]}
            onPress={() => setStatusFilter('low_stock')}
          >
            <Text style={[styles.filterChipText, statusFilter === 'low_stock' && styles.filterChipTextActive]}>
              Low Stock
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, statusFilter === 'overstocked' && styles.filterChipActive]}
            onPress={() => setStatusFilter('overstocked')}
          >
            <Text style={[styles.filterChipText, statusFilter === 'overstocked' && styles.filterChipTextActive]}>
              Overstocked
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* ABC Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          <TouchableOpacity
            style={[styles.filterChip, abcFilter === 'all' && styles.filterChipActive]}
            onPress={() => setAbcFilter('all')}
          >
            <Text style={[styles.filterChipText, abcFilter === 'all' && styles.filterChipTextActive]}>
              All ABC
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, abcFilter === 'A' && styles.filterChipActive]}
            onPress={() => setAbcFilter('A')}
          >
            <Text style={[styles.filterChipText, abcFilter === 'A' && styles.filterChipTextActive]}>
              Category A
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, abcFilter === 'B' && styles.filterChipActive]}
            onPress={() => setAbcFilter('B')}
          >
            <Text style={[styles.filterChipText, abcFilter === 'B' && styles.filterChipTextActive]}>
              Category B
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, abcFilter === 'C' && styles.filterChipActive]}
            onPress={() => setAbcFilter('C')}
          >
            <Text style={[styles.filterChipText, abcFilter === 'C' && styles.filterChipTextActive]}>
              Category C
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  };

  // ============================================================================
  // RENDER: OVERVIEW VIEW
  // ============================================================================

  const renderInventoryCard = (item: InventoryItem) => {
    return (
      <TouchableOpacity
        key={item.id}
        style={styles.inventoryCard}
        onPress={() => {
          setSelectedItem(item);
          setShowItemModal(true);
        }}
      >
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Text style={styles.cardTitle}>{item.materialName}</Text>
            <Text style={styles.cardSubtitle}>{item.category}</Text>
          </View>
          <View style={styles.cardHeaderRight}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
              <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
            </View>
            {item.abcCategory && (
              <View style={[styles.abcBadge, { backgroundColor: getABCColor(item.abcCategory) }]}>
                <Text style={styles.abcText}>{item.abcCategory}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Details */}
        <View style={styles.cardDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Location:</Text>
            <Text style={styles.detailValue}>{item.locationName}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Quantity:</Text>
            <Text style={styles.detailValue}>
              {item.quantity.toLocaleString()} {item.unit}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Available:</Text>
            <Text style={styles.detailValue}>
              {item.availableQuantity.toLocaleString()} {item.unit}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Value:</Text>
            <Text style={styles.detailValue}>₹{item.totalValue.toLocaleString()}</Text>
          </View>
        </View>

        {/* Stock Level Bar */}
        <View style={styles.stockLevelContainer}>
          <View style={styles.stockLevelBar}>
            <View
              style={[
                styles.stockLevelFill,
                {
                  width: `${Math.min((item.quantity / item.maxStock) * 100, 100)}%`,
                  backgroundColor: getStatusColor(item.status),
                }
              ]}
            />
            <View
              style={[
                styles.reorderMarker,
                { left: `${(item.reorderLevel / item.maxStock) * 100}%` }
              ]}
            />
          </View>
          <View style={styles.stockLevelLabels}>
            <Text style={styles.stockLevelLabel}>
              Reorder: {item.reorderLevel} {item.unit}
            </Text>
            <Text style={styles.stockLevelLabel}>
              Max: {item.maxStock} {item.unit}
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.cardFooter}>
          <Text style={styles.footerText}>
            Turnover: {item.turnoverRate}x/year • Age: {item.ageInDays} days
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderOverviewView = () => {
    if (filteredItems.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No inventory items found</Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.contentScroll}>
        {filteredItems.map(item => renderInventoryCard(item))}
      </ScrollView>
    );
  };

  // ============================================================================
  // RENDER: LOCATIONS VIEW
  // ============================================================================

  const renderLocationCard = (location: InventoryLocation) => {
    const locationItems = items.filter(item => item.locationId === location.id);
    const valuation = InventoryOptimizationService.calculateInventoryValuation(
      location.id,
      location.name,
      items
    );

    const capacityPercent = (location.usedCapacity / location.totalCapacity) * 100;

    return (
      <TouchableOpacity
        key={location.id}
        style={styles.locationCard}
        onPress={() => {
          setSelectedLocation(location);
          setShowLocationModal(true);
        }}
      >
        {/* Header */}
        <View style={styles.locationHeader}>
          <View>
            <Text style={styles.locationName}>{location.name}</Text>
            <Text style={styles.locationType}>{location.type.toUpperCase()}</Text>
          </View>
          <View style={[
            styles.locationBadge,
            { backgroundColor: location.isActive ? '#10b981' : '#6b7280' }
          ]}>
            <Text style={styles.locationBadgeText}>
              {location.isActive ? 'ACTIVE' : 'INACTIVE'}
            </Text>
          </View>
        </View>

        {/* Capacity */}
        <View style={styles.capacityContainer}>
          <Text style={styles.capacityLabel}>Capacity Usage</Text>
          <View style={styles.capacityBar}>
            <View
              style={[
                styles.capacityFill,
                {
                  width: `${capacityPercent}%`,
                  backgroundColor: capacityPercent > 90 ? '#ef4444' : capacityPercent > 70 ? '#f59e0b' : '#10b981',
                }
              ]}
            />
          </View>
          <Text style={styles.capacityText}>
            {location.usedCapacity}m³ / {location.totalCapacity}m³ ({capacityPercent.toFixed(0)}%)
          </Text>
        </View>

        {/* Stats */}
        <View style={styles.locationStats}>
          <View style={styles.locationStat}>
            <Text style={styles.locationStatValue}>{locationItems.length}</Text>
            <Text style={styles.locationStatLabel}>Items</Text>
          </View>
          <View style={styles.locationStat}>
            <Text style={styles.locationStatValue}>
              ₹{(valuation.totalValue / 1000).toFixed(0)}K
            </Text>
            <Text style={styles.locationStatLabel}>Value</Text>
          </View>
          <View style={styles.locationStat}>
            <Text style={styles.locationStatValue}>
              ₹{(location.operatingCost / 1000).toFixed(0)}K
            </Text>
            <Text style={styles.locationStatLabel}>Op Cost/mo</Text>
          </View>
        </View>

        {/* Features */}
        <View style={styles.locationFeatures}>
          {location.hasClimateControl && (
            <View style={styles.featureBadge}>
              <Text style={styles.featureText}>Climate</Text>
            </View>
          )}
          {location.hasSecurity && (
            <View style={styles.featureBadge}>
              <Text style={styles.featureText}>Security</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderLocationsView = () => {
    return (
      <ScrollView style={styles.contentScroll}>
        {locations.map(location => renderLocationCard(location))}
      </ScrollView>
    );
  };

  // ============================================================================
  // RENDER: TRANSFERS VIEW
  // ============================================================================

  const renderTransferCard = (transfer: StockTransfer) => {
    const getTransferStatusColor = (status: string) => {
      switch (status) {
        case 'received': return '#10b981';
        case 'in_transit': return '#3b82f6';
        case 'approved': return '#8b5cf6';
        case 'requested': return '#f59e0b';
        case 'rejected': return '#ef4444';
        default: return '#9ca3af';
      }
    };

    const getPriorityColor = (priority: string) => {
      switch (priority) {
        case 'urgent': return '#dc2626';
        case 'high': return '#f59e0b';
        case 'medium': return '#3b82f6';
        case 'low': return '#10b981';
        default: return '#9ca3af';
      }
    };

    return (
      <View key={transfer.id} style={styles.transferCard}>
        {/* Header */}
        <View style={styles.transferHeader}>
          <View>
            <Text style={styles.transferNumber}>{transfer.transferNumber}</Text>
            <Text style={styles.transferMaterial}>{transfer.materialName}</Text>
          </View>
          <View style={styles.transferBadges}>
            <View style={[styles.transferStatusBadge, { backgroundColor: getTransferStatusColor(transfer.status) }]}>
              <Text style={styles.transferStatusText}>{transfer.status.toUpperCase()}</Text>
            </View>
            <View style={[styles.transferPriorityBadge, { backgroundColor: getPriorityColor(transfer.priority) }]}>
              <Text style={styles.transferPriorityText}>{transfer.priority.toUpperCase()}</Text>
            </View>
          </View>
        </View>

        {/* Route */}
        <View style={styles.transferRoute}>
          <View style={styles.transferPoint}>
            <View style={styles.transferDot} />
            <View>
              <Text style={styles.transferLabel}>From</Text>
              <Text style={styles.transferLocation}>{transfer.fromLocationName}</Text>
            </View>
          </View>
          <View style={styles.transferArrow}>
            <Text style={styles.transferArrowText}>→</Text>
          </View>
          <View style={styles.transferPoint}>
            <View style={styles.transferDot} />
            <View>
              <Text style={styles.transferLabel}>To</Text>
              <Text style={styles.transferLocation}>{transfer.toLocationName}</Text>
            </View>
          </View>
        </View>

        {/* Details */}
        <View style={styles.transferDetails}>
          <Text style={styles.transferDetailText}>
            Quantity: {transfer.quantity} {transfer.unit}
          </Text>
          <Text style={styles.transferDetailText}>
            Transport Cost: ₹{transfer.transportCost.toLocaleString()}
          </Text>
          <Text style={styles.transferDetailText}>
            Reason: {transfer.reason}
          </Text>
        </View>

        {/* Timeline */}
        <View style={styles.transferTimeline}>
          <Text style={styles.transferTimelineText}>
            Requested: {new Date(transfer.requestedDate).toLocaleDateString()}
          </Text>
          {transfer.receivedDate && (
            <Text style={styles.transferTimelineText}>
              Received: {new Date(transfer.receivedDate).toLocaleDateString()}
            </Text>
          )}
        </View>
      </View>
    );
  };

  const renderTransfersView = () => {
    if (transfers.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No transfers found</Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.contentScroll}>
        {transfers.map(transfer => renderTransferCard(transfer))}
      </ScrollView>
    );
  };

  // ============================================================================
  // RENDER: ANALYTICS VIEW
  // ============================================================================

  const renderAnalyticsView = () => {
    if (!inventoryHealth) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>Loading analytics...</Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.contentScroll}>
        {/* Health Score */}
        <View style={styles.analyticsSection}>
          <Text style={styles.analyticsSectionTitle}>Inventory Health</Text>
          <View style={styles.healthScoreContainer}>
            <View style={styles.healthScoreCircle}>
              <Text style={styles.healthScoreValue}>{inventoryHealth.overallHealthScore.toFixed(0)}</Text>
              <Text style={styles.healthScoreLabel}>Score</Text>
            </View>
            <View style={styles.healthMetrics}>
              <View style={styles.healthMetric}>
                <Text style={styles.healthMetricLabel}>Turnover Rate:</Text>
                <Text style={styles.healthMetricValue}>
                  {inventoryHealth.overallTurnoverRate.toFixed(1)}x ({inventoryHealth.turnoverHealth})
                </Text>
              </View>
              <View style={styles.healthMetric}>
                <Text style={styles.healthMetricLabel}>Stockout Risk:</Text>
                <Text style={[styles.healthMetricValue, { color: inventoryHealth.stockoutRisk > 20 ? '#ef4444' : '#10b981' }]}>
                  {inventoryHealth.stockoutRisk.toFixed(0)}%
                </Text>
              </View>
              <View style={styles.healthMetric}>
                <Text style={styles.healthMetricLabel}>Overstock Risk:</Text>
                <Text style={[styles.healthMetricValue, { color: inventoryHealth.overstockRisk > 20 ? '#f59e0b' : '#10b981' }]}>
                  {inventoryHealth.overstockRisk.toFixed(0)}%
                </Text>
              </View>
              <View style={styles.healthMetric}>
                <Text style={styles.healthMetricLabel}>Obsolescence:</Text>
                <Text style={styles.healthMetricValue}>
                  {inventoryHealth.obsolescenceRate.toFixed(1)}%
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Carrying Costs */}
        <View style={styles.analyticsSection}>
          <Text style={styles.analyticsSectionTitle}>Carrying Costs</Text>
          <View style={styles.costGrid}>
            <View style={styles.costCard}>
              <Text style={styles.costValue}>₹{(inventoryHealth.carryingCost / 1000000).toFixed(2)}M</Text>
              <Text style={styles.costLabel}>Annual Cost</Text>
            </View>
            <View style={styles.costCard}>
              <Text style={styles.costValue}>{inventoryHealth.carryingCostPercentage}%</Text>
              <Text style={styles.costLabel}>% of Value</Text>
            </View>
          </View>
        </View>

        {/* ABC Analysis Summary */}
        <View style={styles.analyticsSection}>
          <Text style={styles.analyticsSectionTitle}>ABC Analysis Summary</Text>
          {['A', 'B', 'C'].map(category => {
            const categoryItems = items.filter(item => item.abcCategory === category);
            const categoryValue = categoryItems.reduce((sum, item) => sum + item.totalValue, 0);
            const percentOfTotal = (categoryValue / stats.totalValue) * 100;

            return (
              <View key={category} style={styles.abcSummaryRow}>
                <View style={[styles.abcCategoryBadge, { backgroundColor: getABCColor(category as ABCCategory) }]}>
                  <Text style={styles.abcCategoryText}>{category}</Text>
                </View>
                <View style={styles.abcSummaryDetails}>
                  <Text style={styles.abcSummaryText}>
                    {categoryItems.length} items • ₹{(categoryValue / 1000).toFixed(0)}K ({percentOfTotal.toFixed(0)}%)
                  </Text>
                  <View style={styles.abcBar}>
                    <View
                      style={[
                        styles.abcBarFill,
                        { width: `${percentOfTotal}%`, backgroundColor: getABCColor(category as ABCCategory) }
                      ]}
                    />
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        {/* Recommendations */}
        {inventoryHealth.recommendations.length > 0 && (
          <View style={styles.analyticsSection}>
            <Text style={styles.analyticsSectionTitle}>Recommendations</Text>
            {inventoryHealth.recommendations.slice(0, 5).map((rec, index) => (
              <View key={index} style={styles.recommendationCard}>
                <View style={[styles.recommendationType, {
                  backgroundColor: rec.type === 'reduce' ? '#ef4444' : rec.type === 'increase' ? '#10b981' : '#3b82f6'
                }]}>
                  <Text style={styles.recommendationTypeText}>{rec.type.toUpperCase()}</Text>
                </View>
                <View style={styles.recommendationContent}>
                  <Text style={styles.recommendationMaterial}>{rec.materialName}</Text>
                  <Text style={styles.recommendationReason}>{rec.reason}</Text>
                  <Text style={styles.recommendationImpact}>{rec.expectedImpact}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    );
  };

  // ============================================================================
  // RENDER: ITEM DETAILS MODAL
  // ============================================================================

  const renderItemModal = () => {
    if (!selectedItem) return null;

    return (
      <Modal visible={showItemModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedItem.materialName}</Text>
              <TouchableOpacity onPress={() => setShowItemModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              <Text style={styles.modalSectionTitle}>Quantity</Text>
              <Text style={styles.modalText}>Total: {selectedItem.quantity} {selectedItem.unit}</Text>
              <Text style={styles.modalText}>Available: {selectedItem.availableQuantity} {selectedItem.unit}</Text>
              <Text style={styles.modalText}>Reserved: {selectedItem.reservedQuantity} {selectedItem.unit}</Text>

              <Text style={styles.modalSectionTitle}>Location</Text>
              <Text style={styles.modalText}>{selectedItem.locationName}</Text>

              <Text style={styles.modalSectionTitle}>Valuation</Text>
              <Text style={styles.modalText}>Unit Cost: ₹{selectedItem.unitCost.toLocaleString()}</Text>
              <Text style={styles.modalText}>Total Value: ₹{selectedItem.totalValue.toLocaleString()}</Text>
              <Text style={styles.modalText}>Costing Method: {selectedItem.costingMethod}</Text>

              <Text style={styles.modalSectionTitle}>Stock Levels</Text>
              <Text style={styles.modalText}>Reorder Level: {selectedItem.reorderLevel} {selectedItem.unit}</Text>
              <Text style={styles.modalText}>Safety Stock: {selectedItem.safetyStock} {selectedItem.unit}</Text>
              <Text style={styles.modalText}>Max Stock: {selectedItem.maxStock} {selectedItem.unit}</Text>

              <Text style={styles.modalSectionTitle}>Performance</Text>
              <Text style={styles.modalText}>Turnover Rate: {selectedItem.turnoverRate}x per year</Text>
              <Text style={styles.modalText}>Age: {selectedItem.ageInDays} days</Text>
              {selectedItem.abcCategory && (
                <Text style={styles.modalText}>ABC Category: {selectedItem.abcCategory}</Text>
              )}

              {selectedItem.batchNumber && (
                <>
                  <Text style={styles.modalSectionTitle}>Batch Info</Text>
                  <Text style={styles.modalText}>Batch: {selectedItem.batchNumber}</Text>
                  <Text style={styles.modalText}>Received: {new Date(selectedItem.receivedDate).toLocaleDateString()}</Text>
                </>
              )}
            </ScrollView>

            <TouchableOpacity style={styles.modalButton} onPress={() => setShowItemModal(false)}>
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
        <Text style={styles.title}>Inventory Management</Text>
        <Text style={styles.subtitle}>Multi-location optimization & ABC analysis</Text>
      </View>

      {/* Stats */}
      {renderStatCards()}

      {/* View Mode Tabs */}
      {renderViewModeTabs()}

      {/* Filters */}
      {viewMode === 'overview' && renderFilters()}

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {viewMode === 'overview' && renderOverviewView()}
        {viewMode === 'locations' && renderLocationsView()}
        {viewMode === 'transfers' && renderTransfersView()}
        {viewMode === 'analytics' && renderAnalyticsView()}
      </ScrollView>

      {/* Modals */}
      {renderItemModal()}
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  statLabel: {
    fontSize: 11,
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
    fontSize: 12,
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

  // Filters
  filtersContainer: {
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
    marginBottom: 8,
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

  // Inventory Card
  inventoryCard: {
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  cardHeaderRight: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  abcBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  abcText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  cardDetails: {
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
  stockLevelContainer: {
    marginTop: 12,
  },
  stockLevelBar: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    position: 'relative',
  },
  stockLevelFill: {
    height: '100%',
    borderRadius: 4,
  },
  reorderMarker: {
    position: 'absolute',
    top: 0,
    width: 2,
    height: '100%',
    backgroundColor: '#ef4444',
  },
  stockLevelLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  stockLevelLabel: {
    fontSize: 11,
    color: '#666',
  },
  cardFooter: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  footerText: {
    fontSize: 12,
    color: '#666',
  },

  // Location Card
  locationCard: {
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
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  locationName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  locationType: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  locationBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  locationBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  capacityContainer: {
    marginBottom: 16,
  },
  capacityLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  capacityBar: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  capacityFill: {
    height: '100%',
  },
  capacityText: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
  },
  locationStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  locationStat: {
    alignItems: 'center',
  },
  locationStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  locationStatLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
  },
  locationFeatures: {
    flexDirection: 'row',
    marginTop: 8,
  },
  featureBadge: {
    backgroundColor: '#e0f2fe',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  featureText: {
    fontSize: 11,
    color: '#0369a1',
  },

  // Transfer Card
  transferCard: {
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
  transferHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  transferNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  transferMaterial: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  transferBadges: {
    alignItems: 'flex-end',
  },
  transferStatusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  transferStatusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  transferPriorityBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  transferPriorityText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  transferRoute: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  transferPoint: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transferDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
    marginRight: 8,
  },
  transferLabel: {
    fontSize: 11,
    color: '#666',
  },
  transferLocation: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  transferArrow: {
    paddingHorizontal: 8,
  },
  transferArrowText: {
    fontSize: 20,
    color: '#007AFF',
  },
  transferDetails: {
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  transferDetailText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  transferTimeline: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  transferTimelineText: {
    fontSize: 11,
    color: '#666',
    marginBottom: 2,
  },

  // Analytics
  analyticsSection: {
    backgroundColor: '#fff',
    margin: 16,
    marginBottom: 0,
    borderRadius: 12,
    padding: 16,
  },
  analyticsSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  healthScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  healthScoreCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#e0f2fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  healthScoreValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0369a1',
  },
  healthScoreLabel: {
    fontSize: 12,
    color: '#0369a1',
    marginTop: 4,
  },
  healthMetrics: {
    flex: 1,
  },
  healthMetric: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  healthMetricLabel: {
    fontSize: 13,
    color: '#666',
  },
  healthMetricValue: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  costGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  costCard: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    alignItems: 'center',
  },
  costValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  costLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  abcSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  abcCategoryBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  abcCategoryText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  abcSummaryDetails: {
    flex: 1,
  },
  abcSummaryText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  abcBar: {
    height: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  abcBarFill: {
    height: '100%',
  },
  recommendationCard: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 8,
  },
  recommendationType: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    height: 24,
  },
  recommendationTypeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  recommendationContent: {
    flex: 1,
    marginLeft: 12,
  },
  recommendationMaterial: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  recommendationReason: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  recommendationImpact: {
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

// Wrap with ErrorBoundary for graceful error handling
const InventoryManagementScreenWithBoundary = () => (
  <ErrorBoundary name="Logistics - InventoryManagementScreen">
    <InventoryManagementScreen />
  </ErrorBoundary>
);

export default InventoryManagementScreenWithBoundary;
