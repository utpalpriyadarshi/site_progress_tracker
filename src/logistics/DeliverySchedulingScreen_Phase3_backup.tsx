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
import BomLogisticsService, { DeliveryPriority } from '../services/BomLogisticsService';
import { database } from '../../models/database';
import ProjectModel from '../../models/ProjectModel';
import MaterialModel from '../../models/MaterialModel';

/**
 * DeliverySchedulingScreen
 *
 * Enhanced with BOM integration to show:
 * - BOM-driven delivery priorities
 * - Phase-based scheduling recommendations
 * - Critical material alerts
 * - Delivery timeline planning
 */

type PriorityFilter = 'all' | 'critical' | 'high' | 'medium' | 'low';

const DeliverySchedulingScreen = () => {
  const [projects, setProjects] = useState<ProjectModel[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [materials, setMaterials] = useState<MaterialModel[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // Use BOM data hook
  const {
    boms,
    bomItems,
    loading: bomLoading,
    getBomPhases,
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

  // Calculate delivery priorities
  const deliveryPriorities = React.useMemo(() => {
    if (!bomItems.length || !boms.length) return [];
    return BomLogisticsService.calculateDeliveryPriorities(bomItems, boms, materials);
  }, [bomItems, boms, materials]);

  // Get BOM phases
  const phases = React.useMemo(() => {
    return getBomPhases();
  }, [getBomPhases]);

  // Filter delivery priorities
  const filteredPriorities = React.useMemo(() => {
    let filtered = deliveryPriorities;

    // Filter by priority
    if (priorityFilter !== 'all') {
      filtered = filtered.filter((p) => p.priority === priorityFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.itemCode.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          p.phase.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [deliveryPriorities, priorityFilter, searchQuery]);

  // Group by phase
  const deliveriesByPhase = React.useMemo(() => {
    const grouped = new Map<string, DeliveryPriority[]>();

    filteredPriorities.forEach((priority) => {
      const phase = priority.phase || 'Unspecified';
      if (!grouped.has(phase)) {
        grouped.set(phase, []);
      }
      grouped.get(phase)!.push(priority);
    });

    return Array.from(grouped.entries()).sort((a, b) => {
      const phaseOrder = ['Foundation', 'Structure', 'Finishing', 'MEP', 'Landscaping', 'Unspecified'];
      return phaseOrder.indexOf(a[0]) - phaseOrder.indexOf(b[0]);
    });
  }, [filteredPriorities]);

  // Get statistics
  const stats = React.useMemo(() => {
    const total = deliveryPriorities.length;
    const critical = deliveryPriorities.filter((p) => p.priority === 'critical').length;
    const high = deliveryPriorities.filter((p) => p.priority === 'high').length;
    const upcoming7Days = deliveryPriorities.filter((p) => p.daysUntilNeeded && p.daysUntilNeeded <= 7).length;

    return { total, critical, high, upcoming7Days };
  }, [deliveryPriorities]);

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return 'TBD';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
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
          <Text style={styles.statLabel}>Total Deliveries</Text>
        </View>

        <View style={[styles.statCard, styles.statCardCritical]}>
          <Text style={styles.statValue}>{stats.critical}</Text>
          <Text style={styles.statLabel}>Critical</Text>
        </View>

        <View style={[styles.statCard, styles.statCardWarning]}>
          <Text style={styles.statValue}>{stats.high}</Text>
          <Text style={styles.statLabel}>High Priority</Text>
        </View>

        <View style={[styles.statCard, styles.statCardUrgent]}>
          <Text style={styles.statValue}>{stats.upcoming7Days}</Text>
          <Text style={styles.statLabel}>Due in 7 Days</Text>
        </View>
      </ScrollView>
    );
  };

  const renderPriorityFilters = () => {
    const filters: { value: PriorityFilter; label: string; color: string }[] = [
      { value: 'all', label: 'All', color: '#E0E0E0' },
      { value: 'critical', label: 'Critical', color: '#F44336' },
      { value: 'high', label: 'High', color: '#FF9800' },
      { value: 'medium', label: 'Medium', color: '#2196F3' },
      { value: 'low', label: 'Low', color: '#9E9E9E' },
    ];

    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter.value}
            style={[
              styles.filterChip,
              priorityFilter === filter.value && { backgroundColor: filter.color },
            ]}
            onPress={() => setPriorityFilter(filter.value)}
          >
            <Text
              style={[
                styles.filterChipText,
                priorityFilter === filter.value && styles.filterChipTextActive,
              ]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  const renderSearchBar = () => {
    return (
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search deliveries..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
    );
  };

  const renderDeliveryCard = (priority: DeliveryPriority) => {
    const priorityColor = BomLogisticsService.getPriorityColor(priority.priority);
    const urgentDays = priority.daysUntilNeeded && priority.daysUntilNeeded <= 7;

    return (
      <View key={`${priority.itemCode}-${priority.phase}`} style={[styles.deliveryCard, { borderLeftColor: priorityColor, borderLeftWidth: 4 }]}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Text style={styles.itemCode}>{priority.itemCode}</Text>
            <View style={[styles.priorityBadge, { backgroundColor: priorityColor }]}>
              <Text style={styles.priorityBadgeText}>{priority.priority.toUpperCase()}</Text>
            </View>
            {urgentDays && (
              <View style={styles.urgentBadge}>
                <Text style={styles.urgentBadgeText}>URGENT</Text>
              </View>
            )}
          </View>
        </View>

        {/* Description */}
        <Text style={styles.description}>{priority.description}</Text>

        {/* Quantity */}
        <View style={styles.quantityRow}>
          <Text style={styles.quantityLabel}>Shortage:</Text>
          <Text style={styles.quantityValue}>
            {priority.quantity} {priority.unit}
          </Text>
        </View>

        {/* Phase */}
        <View style={styles.phaseRow}>
          <Text style={styles.phaseLabel}>Phase:</Text>
          <View style={styles.phaseChip}>
            <Text style={styles.phaseChipText}>{priority.phase}</Text>
          </View>
        </View>

        {/* Timeline */}
        <View style={styles.timelineRow}>
          <View style={styles.timelineItem}>
            <Text style={styles.timelineLabel}>Recommended Delivery:</Text>
            <Text style={styles.timelineValue}>{formatDate(priority.recommendedDeliveryDate)}</Text>
          </View>
          {priority.daysUntilNeeded !== undefined && (
            <View style={styles.timelineItem}>
              <Text style={styles.timelineLabel}>Days Until Needed:</Text>
              <Text style={[styles.timelineValue, urgentDays && styles.timelineValueUrgent]}>
                {priority.daysUntilNeeded} days
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderDeliveriesByPhase = () => {
    if (bomLoading || loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Loading delivery priorities...</Text>
        </View>
      );
    }

    if (boms.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateTitle}>No Active BOMs</Text>
          <Text style={styles.emptyStateText}>
            No active BOMs found for this project. Create a BOM in the Manager tab to see delivery priorities.
          </Text>
        </View>
      );
    }

    if (filteredPriorities.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateTitle}>No Deliveries Required</Text>
          <Text style={styles.emptyStateText}>
            {searchQuery || priorityFilter !== 'all'
              ? 'No deliveries match your filters'
              : 'All materials are sufficiently stocked'}
          </Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.deliveriesList} showsVerticalScrollIndicator={false}>
        {deliveriesByPhase.map(([phase, priorities]) => (
          <View key={phase} style={styles.phaseSection}>
            <View style={styles.phaseSectionHeader}>
              <Text style={styles.phaseSectionTitle}>{phase}</Text>
              <View style={styles.phaseSectionBadge}>
                <Text style={styles.phaseSectionBadgeText}>{priorities.length}</Text>
              </View>
            </View>
            {priorities.map(renderDeliveryCard)}
          </View>
        ))}
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
        <Text style={styles.title}>Delivery Scheduling</Text>
        <Text style={styles.subtitle}>BOM-Driven Delivery Priorities</Text>
      </View>

      {/* Project Selector */}
      {renderProjectSelector()}

      {/* BOM Info */}
      {renderBomInfo()}

      {/* Stats Cards */}
      {stats.total > 0 && renderStatCards()}

      {/* Priority Filters */}
      {stats.total > 0 && renderPriorityFilters()}

      {/* Search Bar */}
      {stats.total > 0 && renderSearchBar()}

      {/* Deliveries List */}
      {renderDeliveriesByPhase()}
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
  statCardUrgent: {
    backgroundColor: '#E1F5FE',
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
    textAlign: 'center',
  },
  filtersScroll: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    marginRight: 8,
  },
  filterChipText: {
    fontSize: 14,
    color: '#666',
  },
  filterChipTextActive: {
    color: '#fff',
    fontWeight: '600',
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
  deliveriesList: {
    flex: 1,
    padding: 12,
  },
  phaseSection: {
    marginBottom: 20,
  },
  phaseSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  phaseSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  phaseSectionBadge: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  phaseSectionBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  deliveryCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  itemCode: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  priorityBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  urgentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: '#F44336',
  },
  urgentBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  quantityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  quantityLabel: {
    fontSize: 13,
    color: '#666',
  },
  quantityValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  phaseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  phaseLabel: {
    fontSize: 13,
    color: '#666',
  },
  phaseChip: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  phaseChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2196F3',
  },
  timelineRow: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  timelineItem: {
    marginBottom: 6,
  },
  timelineLabel: {
    fontSize: 12,
    color: '#999',
  },
  timelineValue: {
    fontSize: 13,
    fontWeight: '500',
    color: '#333',
    marginTop: 2,
  },
  timelineValueUrgent: {
    color: '#F44336',
    fontWeight: '600',
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

export default DeliverySchedulingScreen;
