import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useBomData } from '../shared/hooks/useBomData';
import BomLogisticsService, { InventoryTarget } from '../services/BomLogisticsService';
import { database } from '../../models/database';
import ProjectModel from '../../models/ProjectModel';
import MaterialModel from '../../models/MaterialModel';

/**
 * InventoryManagementScreen
 *
 * Enhanced with BOM integration to show:
 * - Target inventory levels from active BOMs
 * - Reorder points and recommendations
 * - Stock level indicators (sufficient/low/critical)
 * - Allocation across multiple BOMs
 */

type StockLevel = 'sufficient' | 'low' | 'critical';

const InventoryManagementScreen = () => {
  const [projects, setProjects] = useState<ProjectModel[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [materials, setMaterials] = useState<MaterialModel[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [stockFilter, setStockFilter] = useState<StockLevel | 'all'>('all');
  const [loading, setLoading] = useState(false);

  // Use BOM data hook
  const {
    boms,
    bomItems,
    loading: bomLoading,
    refresh,
  } = useBomData(selectedProjectId);

  // Load projects
  useEffect(() => {
    loadProjects();
  }, []);

  // Load materials when project selected
  useEffect(() => {
    if (selectedProjectId) {
      loadMaterials();
      refresh();
    }
  }, [selectedProjectId]);

  const loadProjects = async () => {
    try {
      const projectsList = await database.collections
        .get<ProjectModel>('projects')
        .query()
        .fetch();
      setProjects(projectsList);
      if (projectsList.length > 0 && !selectedProjectId) {
        setSelectedProjectId(projectsList[0].id);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const loadMaterials = async () => {
    try {
      setLoading(true);
      const materialsList = await database.collections
        .get<MaterialModel>('materials')
        .query()
        .fetch();
      setMaterials(materialsList);
    } catch (error) {
      console.error('Error loading materials:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate inventory targets
  const inventoryTargets = React.useMemo(() => {
    if (!bomItems.length || !boms.length) return [];
    return BomLogisticsService.calculateInventoryTargets(bomItems, boms, materials);
  }, [bomItems, boms, materials]);

  // Determine stock level for each target
  const getStockLevel = (target: InventoryTarget): StockLevel => {
    const stockPercentage = (target.currentStock / target.targetQuantity) * 100;

    if (stockPercentage < 30) return 'critical';
    if (stockPercentage < target.reorderPoint) return 'low';
    return 'sufficient';
  };

  // Filter targets by stock level and search
  const filteredTargets = React.useMemo(() => {
    let filtered = inventoryTargets;

    // Apply stock filter
    if (stockFilter !== 'all') {
      filtered = filtered.filter((target) => getStockLevel(target) === stockFilter);
    }

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (target) =>
          target.itemCode.toLowerCase().includes(query) ||
          target.description.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [inventoryTargets, stockFilter, searchQuery]);

  // Calculate statistics
  const stats = React.useMemo(() => {
    const total = inventoryTargets.length;
    const criticalCount = inventoryTargets.filter((t) => getStockLevel(t) === 'critical').length;
    const lowCount = inventoryTargets.filter((t) => getStockLevel(t) === 'low').length;
    const sufficientCount = inventoryTargets.filter((t) => getStockLevel(t) === 'sufficient').length;

    // Calculate total target value (if materials have cost data)
    const targetValue = inventoryTargets.reduce((sum, target) => {
      const material = materials.find((m) => m.id === target.materialId);
      const unitCost = material?.unitCost || 0;
      return sum + target.targetQuantity * unitCost;
    }, 0);

    return { total, criticalCount, lowCount, sufficientCount, targetValue };
  }, [inventoryTargets, materials]);

  const getStockLevelColor = (level: StockLevel): string => {
    switch (level) {
      case 'sufficient':
        return '#4CAF50';
      case 'low':
        return '#FF9800';
      case 'critical':
        return '#F44336';
    }
  };

  const getStockLevelBgColor = (level: StockLevel): string => {
    switch (level) {
      case 'sufficient':
        return '#E8F5E9';
      case 'low':
        return '#FFF3E0';
      case 'critical':
        return '#FFEBEE';
    }
  };

  const renderProjectSelector = () => {
    if (projects.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No projects available</Text>
        </View>
      );
    }

    return (
      <View style={styles.selectorContainer}>
        <Text style={styles.selectorLabel}>Project:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.projectScroll}>
          {projects.map((project) => (
            <TouchableOpacity
              key={project.id}
              style={[
                styles.projectChip,
                selectedProjectId === project.id && styles.projectChipActive,
              ]}
              onPress={() => setSelectedProjectId(project.id)}
            >
              <Text
                style={[
                  styles.projectChipText,
                  selectedProjectId === project.id && styles.projectChipTextActive,
                ]}
              >
                {project.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderStatCards = () => {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsScroll}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total Items</Text>
        </View>

        <View style={[styles.statCard, styles.statCardCritical]}>
          <Text style={styles.statValue}>{stats.criticalCount}</Text>
          <Text style={styles.statLabel}>Critical Stock</Text>
        </View>

        <View style={[styles.statCard, styles.statCardWarning]}>
          <Text style={styles.statValue}>{stats.lowCount}</Text>
          <Text style={styles.statLabel}>Low Stock</Text>
        </View>

        <View style={[styles.statCard, styles.statCardSuccess]}>
          <Text style={styles.statValue}>{stats.sufficientCount}</Text>
          <Text style={styles.statLabel}>Sufficient</Text>
        </View>

        {stats.targetValue > 0 && (
          <View style={styles.statCard}>
            <Text style={styles.statValue}>₹{(stats.targetValue / 100000).toFixed(1)}L</Text>
            <Text style={styles.statLabel}>Target Value</Text>
          </View>
        )}
      </ScrollView>
    );
  };

  const renderStockFilters = () => {
    return (
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.filterChip, stockFilter === 'all' && styles.filterChipActive]}
            onPress={() => setStockFilter('all')}
          >
            <Text
              style={[
                styles.filterChipText,
                stockFilter === 'all' && styles.filterChipTextActive,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterChip,
              stockFilter === 'critical' && styles.filterChipActive,
              stockFilter === 'critical' && { borderColor: '#F44336' },
            ]}
            onPress={() => setStockFilter('critical')}
          >
            <View style={[styles.filterDot, { backgroundColor: '#F44336' }]} />
            <Text
              style={[
                styles.filterChipText,
                stockFilter === 'critical' && styles.filterChipTextActive,
              ]}
            >
              Critical
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterChip,
              stockFilter === 'low' && styles.filterChipActive,
              stockFilter === 'low' && { borderColor: '#FF9800' },
            ]}
            onPress={() => setStockFilter('low')}
          >
            <View style={[styles.filterDot, { backgroundColor: '#FF9800' }]} />
            <Text
              style={[
                styles.filterChipText,
                stockFilter === 'low' && styles.filterChipTextActive,
              ]}
            >
              Low Stock
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterChip,
              stockFilter === 'sufficient' && styles.filterChipActive,
              stockFilter === 'sufficient' && { borderColor: '#4CAF50' },
            ]}
            onPress={() => setStockFilter('sufficient')}
          >
            <View style={[styles.filterDot, { backgroundColor: '#4CAF50' }]} />
            <Text
              style={[
                styles.filterChipText,
                stockFilter === 'sufficient' && styles.filterChipTextActive,
              ]}
            >
              Sufficient
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  };

  const renderSearchBar = () => {
    return (
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by item code or description..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
    );
  };

  const renderInventoryCard = (target: InventoryTarget) => {
    const stockLevel = getStockLevel(target);
    const stockColor = getStockLevelColor(stockLevel);
    const stockBgColor = getStockLevelBgColor(stockLevel);
    const stockPercentage = Math.min(
      100,
      (target.currentStock / target.targetQuantity) * 100
    );

    return (
      <View key={`${target.materialId}`} style={styles.inventoryCard}>
        {/* Left border indicator */}
        <View style={[styles.cardBorder, { backgroundColor: stockColor }]} />

        {/* Card content */}
        <View style={styles.cardContent}>
          {/* Header */}
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <Text style={styles.cardItemCode}>{target.itemCode}</Text>
              <View style={[styles.stockBadge, { backgroundColor: stockBgColor }]}>
                <Text style={[styles.stockBadgeText, { color: stockColor }]}>
                  {stockLevel.toUpperCase()}
                </Text>
              </View>
            </View>
            <Text style={styles.cardDescription} numberOfLines={2}>
              {target.description}
            </Text>
          </View>

          {/* Stock Progress Bar */}
          <View style={styles.progressSection}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${stockPercentage}%`,
                    backgroundColor: stockColor,
                  },
                ]}
              />
            </View>
            <Text style={styles.progressText}>{stockPercentage.toFixed(0)}%</Text>
          </View>

          {/* Quantities */}
          <View style={styles.quantitiesRow}>
            <View style={styles.quantityItem}>
              <Text style={styles.quantityLabel}>Current Stock</Text>
              <Text style={styles.quantityValue}>
                {target.currentStock.toFixed(2)} {target.unit}
              </Text>
            </View>
            <View style={styles.quantityItem}>
              <Text style={styles.quantityLabel}>Target</Text>
              <Text style={styles.quantityValue}>
                {target.targetQuantity.toFixed(2)} {target.unit}
              </Text>
            </View>
          </View>

          {/* Reorder Information */}
          {stockLevel !== 'sufficient' && (
            <View style={styles.reorderSection}>
              <View style={styles.reorderRow}>
                <Text style={styles.reorderLabel}>Reorder Point:</Text>
                <Text style={styles.reorderValue}>
                  {(target.targetQuantity * (target.reorderPoint / 100)).toFixed(2)} {target.unit}
                </Text>
              </View>
              <View style={styles.reorderRow}>
                <Text style={styles.reorderLabel}>Recommended Order:</Text>
                <Text style={[styles.reorderValue, { fontWeight: '700', color: '#2196F3' }]}>
                  {target.reorderQuantity.toFixed(2)} {target.unit}
                </Text>
              </View>
            </View>
          )}

          {/* BOM Allocation */}
          {target.allocatedBoms && target.allocatedBoms.length > 0 && (
            <View style={styles.allocationSection}>
              <Text style={styles.allocationTitle}>
                Allocated to {target.allocatedBoms.length} BOM(s):
              </Text>
              <View style={styles.bomChipsContainer}>
                {target.allocatedBoms.map((bomName, idx) => (
                  <View key={idx} style={styles.bomMiniChip}>
                    <Text style={styles.bomMiniChipText}>{bomName}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderInventoryList = () => {
    if (bomLoading || loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Loading inventory targets...</Text>
        </View>
      );
    }

    if (boms.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateTitle}>No Active BOMs</Text>
          <Text style={styles.emptyStateText}>
            No active BOMs found for this project. Create a BOM in the Manager tab to see
            inventory targets.
          </Text>
        </View>
      );
    }

    if (filteredTargets.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateTitle}>
            {searchQuery || stockFilter !== 'all' ? 'No Matches Found' : 'No Inventory Items'}
          </Text>
          <Text style={styles.emptyStateText}>
            {searchQuery
              ? 'Try a different search query'
              : stockFilter !== 'all'
              ? `No items with ${stockFilter} stock level`
              : 'No inventory targets in active BOMs'}
          </Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.inventoryList} showsVerticalScrollIndicator={false}>
        {filteredTargets.map((target) => renderInventoryCard(target))}
      </ScrollView>
    );
  };

  const renderBomInfo = () => {
    if (boms.length === 0) return null;

    return (
      <View style={styles.bomInfoContainer}>
        <Text style={styles.bomInfoTitle}>Active BOMs ({boms.length})</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {boms.map((bom) => (
            <View key={bom.id} style={styles.bomChip}>
              <Text style={styles.bomChipText}>{bom.name}</Text>
              <Text style={styles.bomChipSubtext}>
                {bom.type === 'estimating' ? 'Pre-Contract' : 'Post-Contract'}
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Inventory Management</Text>
        <Text style={styles.subtitle}>BOM-Based Inventory Targets & Reorder Points</Text>
      </View>

      {/* Project Selector */}
      {renderProjectSelector()}

      {/* BOM Info */}
      {renderBomInfo()}

      {/* Stats Cards */}
      {stats.total > 0 && renderStatCards()}

      {/* Stock Level Filters */}
      {stats.total > 0 && renderStockFilters()}

      {/* Search Bar */}
      {stats.total > 0 && renderSearchBar()}

      {/* Inventory List */}
      {renderInventoryList()}
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
  selectorContainer: {
    backgroundColor: '#fff',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  selectorLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  projectScroll: {
    flexDirection: 'row',
  },
  projectChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    marginRight: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  projectChipActive: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
  },
  projectChipText: {
    fontSize: 14,
    color: '#666',
  },
  projectChipTextActive: {
    color: '#2196F3',
    fontWeight: '600',
  },
  bomInfoContainer: {
    backgroundColor: '#fff',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  bomInfoTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  bomChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FFF3E0',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#FF9800',
  },
  bomChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF9800',
  },
  bomChipSubtext: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
  statsScroll: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  statCard: {
    minWidth: 100,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    marginRight: 12,
    alignItems: 'center',
  },
  statCardCritical: {
    backgroundColor: '#FFEBEE',
  },
  statCardWarning: {
    backgroundColor: '#FFF3E0',
  },
  statCardSuccess: {
    backgroundColor: '#E8F5E9',
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
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    marginRight: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    gap: 6,
  },
  filterChipActive: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
  },
  filterChipText: {
    fontSize: 14,
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
  inventoryList: {
    flex: 1,
    padding: 12,
  },
  inventoryCard: {
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
  cardItemCode: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    flex: 1,
  },
  stockBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  stockBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  progressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    width: 40,
    textAlign: 'right',
  },
  quantitiesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  quantityItem: {
    flex: 1,
  },
  quantityLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  quantityValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  reorderSection: {
    backgroundColor: '#FFF3E0',
    padding: 10,
    borderRadius: 6,
    marginBottom: 8,
  },
  reorderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  reorderLabel: {
    fontSize: 12,
    color: '#666',
  },
  reorderValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  allocationSection: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  allocationTitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
  },
  bomChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  bomMiniChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#E3F2FD',
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  bomMiniChipText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#2196F3',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});

export default InventoryManagementScreen;
