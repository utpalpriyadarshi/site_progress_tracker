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
import BomLogisticsService, { MaterialRequirement } from '../services/BomLogisticsService';
import BomRequirementCard from './components/BomRequirementCard';
import { database } from '../../models/database';
import ProjectModel from '../../models/ProjectModel';
import MaterialModel from '../../models/MaterialModel';

/**
 * MaterialTrackingScreen
 *
 * Enhanced with BOM integration to show:
 * - Material requirements from active BOMs
 * - Shortage alerts and priorities
 * - Availability vs requirements
 * - Phase-based filtering
 */

type ViewMode = 'requirements' | 'shortages' | 'all';

const MaterialTrackingScreen = () => {
  const [projects, setProjects] = useState<ProjectModel[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [materials, setMaterials] = useState<MaterialModel[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('requirements');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // Use BOM data hook
  const {
    boms,
    bomItems,
    loading: bomLoading,
    getAllRequirements,
    getMaterialShortages,
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

  // Calculate material requirements
  const materialRequirements = React.useMemo(() => {
    if (!bomItems.length) return [];
    return BomLogisticsService.calculateMaterialRequirements(bomItems, materials);
  }, [bomItems, materials]);

  // Get shortages
  const shortages = React.useMemo(() => {
    return materialRequirements.filter(
      (req) => req.status === 'shortage' || req.status === 'critical'
    );
  }, [materialRequirements]);

  // Filter by search
  const filteredRequirements = React.useMemo(() => {
    let filtered = materialRequirements;

    if (viewMode === 'shortages') {
      filtered = shortages;
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (req) =>
          req.itemCode.toLowerCase().includes(query) ||
          req.description.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [materialRequirements, shortages, viewMode, searchQuery]);

  // Get statistics
  const stats = React.useMemo(() => {
    const total = materialRequirements.length;
    const critical = materialRequirements.filter((r) => r.status === 'critical').length;
    const shortageCount = shortages.length;
    const sufficient = materialRequirements.filter((r) => r.status === 'sufficient').length;

    return { total, critical, shortageCount, sufficient };
  }, [materialRequirements, shortages]);

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

  const renderViewModeTabs = () => {
    return (
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, viewMode === 'requirements' && styles.tabActive]}
          onPress={() => setViewMode('requirements')}
        >
          <Text style={[styles.tabText, viewMode === 'requirements' && styles.tabTextActive]}>
            All Requirements
          </Text>
          <View style={styles.tabBadge}>
            <Text style={styles.tabBadgeText}>{stats.total}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, viewMode === 'shortages' && styles.tabActive]}
          onPress={() => setViewMode('shortages')}
        >
          <Text style={[styles.tabText, viewMode === 'shortages' && styles.tabTextActive]}>
            Shortages
          </Text>
          {stats.shortageCount > 0 && (
            <View style={[styles.tabBadge, styles.tabBadgeAlert]}>
              <Text style={styles.tabBadgeText}>{stats.shortageCount}</Text>
            </View>
          )}
        </TouchableOpacity>
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
          <Text style={styles.statValue}>{stats.critical}</Text>
          <Text style={styles.statLabel}>Critical</Text>
        </View>

        <View style={[styles.statCard, styles.statCardWarning]}>
          <Text style={styles.statValue}>{stats.shortageCount}</Text>
          <Text style={styles.statLabel}>Shortages</Text>
        </View>

        <View style={[styles.statCard, styles.statCardSuccess]}>
          <Text style={styles.statValue}>{stats.sufficient}</Text>
          <Text style={styles.statLabel}>Sufficient</Text>
        </View>
      </ScrollView>
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

  const renderRequirementsList = () => {
    if (bomLoading || loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Loading BOM requirements...</Text>
        </View>
      );
    }

    if (boms.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateTitle}>No Active BOMs</Text>
          <Text style={styles.emptyStateText}>
            No active BOMs found for this project. Create a BOM in the Manager tab to see material
            requirements.
          </Text>
        </View>
      );
    }

    if (filteredRequirements.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateTitle}>
            {searchQuery ? 'No Matches Found' : 'No Requirements'}
          </Text>
          <Text style={styles.emptyStateText}>
            {searchQuery
              ? 'Try a different search query'
              : 'No material requirements in active BOMs'}
          </Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.requirementsList} showsVerticalScrollIndicator={false}>
        {filteredRequirements.map((requirement) => (
          <BomRequirementCard
            key={`${requirement.bomId}-${requirement.itemCode}`}
            requirement={{
              bomId: requirement.bomId,
              bomName: requirement.bomName || 'Unknown BOM',
              bomType: 'execution',
              projectId: selectedProjectId,
              materialId: requirement.materialId,
              itemCode: requirement.itemCode,
              description: requirement.description,
              requiredQuantity: requirement.requiredQuantity,
              unit: requirement.unit,
              phase: '',
              wbsCode: '',
              priority: 'medium',
              status: 'active',
            }}
            availableQuantity={requirement.availableQuantity}
          />
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
        <Text style={styles.title}>Material Tracking</Text>
        <Text style={styles.subtitle}>BOM Requirements & Availability</Text>
      </View>

      {/* Project Selector */}
      {renderProjectSelector()}

      {/* BOM Info */}
      {renderBomInfo()}

      {/* Stats Cards */}
      {stats.total > 0 && renderStatCards()}

      {/* View Mode Tabs */}
      {stats.total > 0 && renderViewModeTabs()}

      {/* Search Bar */}
      {stats.total > 0 && renderSearchBar()}

      {/* Requirements List */}
      {renderRequirementsList()}
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
    gap: 8,
  },
  tabActive: {
    borderBottomColor: '#2196F3',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  tabTextActive: {
    color: '#2196F3',
    fontWeight: '600',
  },
  tabBadge: {
    backgroundColor: '#E0E0E0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  tabBadgeAlert: {
    backgroundColor: '#FF9800',
  },
  tabBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
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
  requirementsList: {
    flex: 1,
    padding: 12,
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

export default MaterialTrackingScreen;
