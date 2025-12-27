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
} from 'react-native';
import { useLogistics } from './context/LogisticsContext';
import { useBomData } from '../shared/hooks/useBomData';
import BomLogisticsService, { MaterialRequirement } from '../services/BomLogisticsService';
import MaterialProcurementService, {
  PurchaseSuggestion,
  SupplierQuote,
  ConsumptionData,
} from '../services/MaterialProcurementService';
import BomRequirementCard from './components/BomRequirementCard';
import DoorsLinkingModal from './components/DoorsLinkingModal';
import mockSuppliers, { generateMockConsumptionHistory } from '../data/mockSuppliers';
import { database } from '../../models/database';
import { Q } from '@nozbe/watermelondb';
import ProjectModel from '../../models/ProjectModel';
import MaterialModel from '../../models/MaterialModel';
import DoorsPackageModel from '../../models/DoorsPackageModel';
import { BomDataService } from '../services/BomDataService';
import { AppMode, toggleAppMode } from '../config/AppMode';
import { clearAllBoms } from '../services/ClearBomsService';
import DoorsEditService from '../services/DoorsEditService';
import UnlinkBomItemsService from '../services/UnlinkBomItemsService';
import { useAuth } from '../auth/AuthContext';


/**
 * MaterialTrackingScreen (Week 2 Enhanced)
 *
 * Comprehensive materials tracking with:
 * - BOM-driven requirements (Phase 3)
 * - Intelligent procurement suggestions (Week 2)
 * - Supplier comparison and selection (Week 2)
 * - Multi-location stock monitoring (Week 2)
 * - Consumption rate analytics (Week 2)
 * - Reorder automation (Week 2)
 */

type ViewMode = 'requirements' | 'shortages' | 'procurement' | 'analytics';

// Metro Railway Material Categories (as per user requirements)
const METRO_MATERIAL_CATEGORIES = [
  { id: 'all', name: 'All', icon: '📦', color: '#2196F3' },
  { id: 'Civil', name: 'Civil', icon: '🏗️', color: '#795548' },
  { id: 'OCS', name: 'OCS', icon: '⚡', color: '#FF9800' },
  { id: 'Electrical', name: 'Electrical', icon: '🔌', color: '#4CAF50' },
  { id: 'Signaling', name: 'Signaling', icon: '🚦', color: '#F44336' },
  { id: 'MEP', name: 'MEP', icon: '🔧', color: '#9C27B0' },
];

interface MaterialTrackingScreenProps {
  navigation: any;
}

const MaterialTrackingScreen: React.FC<MaterialTrackingScreenProps> = ({ navigation }) => {
  const {
    selectedProjectId,
    setSelectedProjectId,
    projects,
    materials,
    loading: contextLoading,
    refresh: refreshContext,
  } = useLogistics();

  const { user } = useAuth();

  const [viewMode, setViewMode] = useState<ViewMode>('requirements');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [appMode, setAppModeState] = useState(AppMode.getMode());

  // BOM expansion state - track which BOMs are expanded
  const [expandedBoms, setExpandedBoms] = useState<Set<string>>(new Set());

  // Procurement state
  const [purchaseSuggestions, setPurchaseSuggestions] = useState<PurchaseSuggestion[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialModel | null>(null);
  const [supplierQuotes, setSupplierQuotes] = useState<SupplierQuote[]>([]);
  const [showQuotesModal, setShowQuotesModal] = useState(false);

  // Analytics state
  const [consumptionData, setConsumptionData] = useState<Map<string, ConsumptionData>>(new Map());

  // DOORS integration state
  const [doorsPackages, setDoorsPackages] = useState<DoorsPackageModel[]>([]);

  // DOORS linking modal state
  const [showLinkingModal, setShowLinkingModal] = useState(false);
  const [selectedBomItem, setSelectedBomItem] = useState<{id: string; name: string} | null>(null);

  // Use BOM data hook
  const {
    boms,
    bomItems,
    loading: bomLoading,
    refresh: refreshBoms,
  } = useBomData(selectedProjectId || '');

  // Load data
  useEffect(() => {
    if (selectedProjectId) {
      loadProcurementData();
      loadConsumptionData();
      loadDoorsPackages();
    }
  }, [selectedProjectId, materials, bomItems]);

  // Load DOORS packages for integration
  const loadDoorsPackages = async () => {
    if (!selectedProjectId) return;

    try {
      const doorsCollection = database.collections.get<DoorsPackageModel>('doors_packages');
      const packages = await doorsCollection.query(Q.where('project_id', selectedProjectId)).fetch();
      setDoorsPackages(packages);
    } catch (error) {
      logger.error('[MaterialTracking] Error loading DOORS packages:', error);
    }
  };

  const loadProcurementData = () => {
    if (materials.length > 0 && bomItems.length > 0) {
      // Generate purchase suggestions
      const suggestions = MaterialProcurementService.generatePurchaseSuggestions(
        materials,
        bomItems,
        mockSuppliers
      );
      setPurchaseSuggestions(suggestions);
    }
  };

  const loadConsumptionData = () => {
    // Generate consumption data for each material
    const consumptionMap = new Map<string, ConsumptionData>();

    materials.forEach(material => {
      // Generate mock historical data
      const history = generateMockConsumptionHistory(30);
      const consumption = MaterialProcurementService.calculateConsumptionRate(
        material,
        history
      );
      consumptionMap.set(material.id, consumption);
    });

    setConsumptionData(consumptionMap);
  };

  const handleViewSupplierQuotes = (material: MaterialModel) => {
    setSelectedMaterial(material);

    // Generate quotes
    const shortage = Math.max(0, material.quantityRequired - material.quantityAvailable);
    const quantity = shortage > 0 ? shortage * 1.2 : 100; // Default order qty

    const quotes = MaterialProcurementService.generateSupplierQuotes(
      material,
      quantity,
      mockSuppliers
    );

    setSupplierQuotes(quotes);
    setShowQuotesModal(true);
  };

  const handleLoadSampleData = async () => {
    if (!selectedProjectId) {
      logger.warn('[MaterialTracking] Cannot load sample data: No project selected');
      return;
    }

    try {
      setLoading(true);
      logger.info('[MaterialTracking] Loading sample BOMs for project:', selectedProjectId);

      // Load mock BOMs into database
      const loadedBoms = await BomDataService.loadMockBoms(selectedProjectId);
      logger.info('[MaterialTracking] Loaded BOMs:', loadedBoms.length);

      // Wait a moment for database to settle
      await new Promise<void>(resolve => setTimeout(resolve, 500));

      // Refresh BOMs to reload from database
      await refreshBoms();
      logger.info('[MaterialTracking] Refreshed BOMs');

      // Wait a moment before reloading procurement data
      await new Promise<void>(resolve => setTimeout(resolve, 300));

      // Reload procurement data
      loadProcurementData();
      logger.info('[MaterialTracking] Reloaded procurement data');
    } catch (error) {
      logger.error('[MaterialTracking] Error loading sample BOMs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMode = () => {
    const newMode = toggleAppMode();
    setAppModeState(newMode);
    logger.info('[MaterialTracking] Switched to', newMode, 'mode');
    // Refresh to apply new mode behavior
    refreshBoms();
  };

  const handleClearBoms = async () => {
    try {
      setLoading(true);
      logger.info('[MaterialTracking] Clearing all BOMs...');
      await clearAllBoms();
      await refreshBoms();
      logger.info('[MaterialTracking] BOMs cleared, screen refreshed');
    } catch (error) {
      logger.error('[MaterialTracking] Error clearing BOMs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnlinkBomItems = async () => {
    try {
      setLoading(true);
      logger.info('[MaterialTracking] Unlinking first 5 BOM items...');
      await UnlinkBomItemsService.unlinkFirstNItems(5);
      await refreshBoms();
      logger.info('[MaterialTracking] BOM items unlinked, screen refreshed');
    } catch (error) {
      logger.error('[MaterialTracking] Error unlinking BOM items:', error);
    } finally {
      setLoading(false);
    }
  };

  // Toggle BOM expansion
  const toggleBomExpansion = (bomId: string) => {
    setExpandedBoms(prev => {
      const newSet = new Set(prev);
      if (newSet.has(bomId)) {
        newSet.delete(bomId);
      } else {
        newSet.add(bomId);
      }
      return newSet;
    });
  };

  // Handle DOORS linking
  const handleLinkPress = async (itemCode: string, bomItemName: string) => {
    // Find the BOM item by itemCode
    const bomItem = bomItems.find(item => item.itemCode === itemCode);

    if (!bomItem) {
      logger.error('[MaterialTracking] BOM item not found for itemCode:', itemCode);
      return;
    }

    setSelectedBomItem({ id: bomItem.id, name: bomItemName });
    setShowLinkingModal(true);
  };

  const handleLinkConfirm = async (doorsPackageId: string, doorsPackageName: string) => {
    if (!selectedBomItem || !user) return;

    try {
      await DoorsEditService.createManualLink(
        selectedBomItem.id,
        doorsPackageId,
        user.userId
      );

      logger.info('[MaterialTracking] Linked BOM item to DOORS package:', {
        bomItemId: selectedBomItem.id,
        doorsPackageId,
        doorsPackageName,
      });

      // Refresh to show the link
      await refreshBoms();
    } catch (error) {
      logger.error('[MaterialTracking] Error linking BOM item:', error);
      throw error;
    }
  };

  // Calculate material requirements
  const materialRequirements = React.useMemo(() => {
    if (!bomItems.length) return [];
    return BomLogisticsService.calculateMaterialRequirements(bomItems, materials);
  }, [bomItems, materials]);

  // Create a map of itemCode → doorsId for DOORS integration
  const doorsLinkMap = React.useMemo(() => {
    const map = new Map<string, string>();
    bomItems.forEach(item => {
      if (item.doorsId) {
        map.set(item.itemCode, item.doorsId);
      }
    });
    return map;
  }, [bomItems]);

  // Create a map of doorsId → DOORS package data
  const doorsDataMap = React.useMemo(() => {
    const map = new Map<string, { packageId: string; doorsId: string; compliancePercentage: number }>();
    doorsPackages.forEach(pkg => {
      map.set(pkg.doorsId, {
        packageId: pkg.id, // Database record ID for navigation
        doorsId: pkg.doorsId,
        compliancePercentage: pkg.compliancePercentage,
      });
    });
    return map;
  }, [doorsPackages]);

  // Get shortages
  const shortages = React.useMemo(() => {
    return materialRequirements.filter(
      (req) => req.status === 'shortage' || req.status === 'critical'
    );
  }, [materialRequirements]);

  // Filter by category and search
  const filteredRequirements = React.useMemo(() => {
    let filtered = materialRequirements;

    if (viewMode === 'shortages') {
      filtered = shortages;
    }

    // Category filter (Metro Railway categories)
    if (selectedCategory && selectedCategory !== 'all') {
      filtered = filtered.filter((req) => {
        // Check if the requirement's category matches
        // Category is stored in the BOM item's subCategory field
        return req.category?.toLowerCase() === selectedCategory.toLowerCase() ||
               req.subCategory?.toLowerCase() === selectedCategory.toLowerCase();
      });
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (req) =>
          req.itemCode.toLowerCase().includes(query) ||
          req.description.toLowerCase().includes(query) ||
          (req.bomName && req.bomName.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [materialRequirements, shortages, viewMode, searchQuery, selectedCategory]);

  // Filter procurement suggestions
  const filteredSuggestions = React.useMemo(() => {
    if (!searchQuery.trim()) return purchaseSuggestions;

    const query = searchQuery.toLowerCase();
    return purchaseSuggestions.filter(
      (sug) =>
        sug.materialName.toLowerCase().includes(query) ||
        sug.itemCode.toLowerCase().includes(query)
    );
  }, [purchaseSuggestions, searchQuery]);

  // Get statistics
  const stats = React.useMemo(() => {
    const total = materialRequirements.length;
    const critical = materialRequirements.filter((r) => r.status === 'critical').length;
    const shortageCount = shortages.length;
    const sufficient = materialRequirements.filter((r) => r.status === 'sufficient').length;
    const procurementPending = purchaseSuggestions.filter(s => s.status === 'pending').length;

    return { total, critical, shortageCount, sufficient, procurementPending };
  }, [materialRequirements, shortages, purchaseSuggestions]);

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

  // Compact Project Row - combines project selector with dev tools
  const renderCompactProjectRow = () => {
    if (projects.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No projects available</Text>
        </View>
      );
    }

    return (
      <View style={styles.compactProjectRow}>
        {/* Project selector - compact */}
        <View style={styles.compactProjectSelector}>
          <Text style={styles.compactLabel}>Project:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.compactProjectScroll}>
            {projects.map((project) => (
              <TouchableOpacity
                key={project.id}
                style={[
                  styles.compactProjectChip,
                  selectedProjectId === project.id && styles.compactProjectChipActive,
                ]}
                onPress={() => setSelectedProjectId(project.id)}
              >
                <Text
                  style={[
                    styles.compactProjectText,
                    selectedProjectId === project.id && styles.compactProjectTextActive,
                  ]}
                >
                  {project.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Dev Tools - moved here from header */}
        {__DEV__ && (
          <View style={styles.compactDevTools}>
            <TouchableOpacity
              style={styles.compactClearButton}
              onPress={handleClearBoms}
            >
              <Text style={styles.compactClearText}>🗑️</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.compactClearButton}
              onPress={handleUnlinkBomItems}
            >
              <Text style={styles.compactClearText}>🔓</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.compactModeIndicator, appMode === 'demo' ? styles.modeDemo : styles.modeProduction]}
              onPress={handleToggleMode}
            >
              <Text style={styles.compactModeText}>
                {appMode === 'demo' ? '🧪' : '🏗️'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  // Combined Search and Filters Row
  const renderSearchAndFilters = () => {
    return (
      <View style={styles.searchFiltersRow}>
        {/* Search bar - compact with clear button */}
        <View style={styles.compactSearchContainer}>
          <TextInput
            style={styles.compactSearchInput}
            placeholder="Search materials..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              style={styles.searchClearButton}
              onPress={() => setSearchQuery('')}
            >
              <Text style={styles.searchClearText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Category filters - horizontal chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.compactFiltersScroll}>
          {METRO_MATERIAL_CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.compactFilterChip,
                selectedCategory === category.id && styles.compactFilterChipActive,
              ]}
              onPress={() => setSelectedCategory(selectedCategory === category.id ? null : category.id)}
            >
              <Text style={styles.compactFilterIcon}>{category.icon}</Text>
              <Text
                style={[
                  styles.compactFilterText,
                  selectedCategory === category.id && styles.compactFilterTextActive,
                ]}
              >
                {category.name}
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
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScrollContent}
        >
          <TouchableOpacity
            style={[styles.tab, viewMode === 'requirements' && styles.tabActive]}
            onPress={() => setViewMode('requirements')}
          >
            <Text style={[styles.tabText, viewMode === 'requirements' && styles.tabTextActive]}>
              Requirements
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

          <TouchableOpacity
            style={[styles.tab, viewMode === 'procurement' && styles.tabActive]}
            onPress={() => setViewMode('procurement')}
          >
            <Text style={[styles.tabText, viewMode === 'procurement' && styles.tabTextActive]}>
              Procurement
            </Text>
            {stats.procurementPending > 0 && (
              <View style={[styles.tabBadge, styles.tabBadgeWarning]}>
                <Text style={styles.tabBadgeText}>{stats.procurementPending}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, viewMode === 'analytics' && styles.tabActive]}
            onPress={() => setViewMode('analytics')}
          >
            <Text style={[styles.tabText, viewMode === 'analytics' && styles.tabTextActive]}>
              Analytics
            </Text>
          </TouchableOpacity>
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

        <View style={[styles.statCard, styles.statCardInfo]}>
          <Text style={styles.statValue}>{stats.procurementPending}</Text>
          <Text style={styles.statLabel}>To Procure</Text>
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

  const renderCategoryFilters = () => {
    return (
      <View style={styles.categoryFiltersContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryFiltersScroll}
          contentContainerStyle={styles.categoryFiltersContent}
        >
          {METRO_MATERIAL_CATEGORIES.map((category) => {
            const isSelected = selectedCategory === category.id || (!selectedCategory && category.id === 'all');
            return (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryChip,
                  isSelected && styles.categoryChipActive,
                  isSelected && { backgroundColor: category.color },
                ]}
                onPress={() => setSelectedCategory(category.id === 'all' ? null : category.id)}
              >
                <Text style={styles.categoryIcon}>{category.icon}</Text>
                <Text
                  style={[
                    styles.categoryName,
                    isSelected && styles.categoryNameActive,
                  ]}
                >
                  {category.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  const renderProcurementSuggestionCard = (suggestion: PurchaseSuggestion) => {
    const getUrgencyColor = (urgency: string) => {
      switch (urgency) {
        case 'critical': return '#F44336';
        case 'high': return '#FF9800';
        case 'medium': return '#FFC107';
        case 'low': return '#4CAF50';
        default: return '#999';
      }
    };

    const getUrgencyBg = (urgency: string) => {
      switch (urgency) {
        case 'critical': return '#FFEBEE';
        case 'high': return '#FFF3E0';
        case 'medium': return '#FFF8E1';
        case 'low': return '#E8F5E9';
        default: return '#F5F5F5';
      }
    };

    return (
      <View key={suggestion.id} style={styles.procurementCard}>
        <View style={styles.procurementHeader}>
          <View style={styles.procurementTitleRow}>
            <Text style={styles.procurementMaterialName}>{suggestion.materialName}</Text>
            <View style={[styles.urgencyBadge, { backgroundColor: getUrgencyBg(suggestion.urgency) }]}>
              <Text style={[styles.urgencyText, { color: getUrgencyColor(suggestion.urgency) }]}>
                {suggestion.urgency.toUpperCase()}
              </Text>
            </View>
          </View>
          <Text style={styles.procurementItemCode}>{suggestion.itemCode}</Text>
        </View>

        <View style={styles.procurementDetails}>
          <View style={styles.procurementDetailRow}>
            <Text style={styles.procurementLabel}>Shortage:</Text>
            <Text style={styles.procurementValue}>
              {suggestion.shortageQuantity.toFixed(2)} {suggestion.unit}
            </Text>
          </View>
          <View style={styles.procurementDetailRow}>
            <Text style={styles.procurementLabel}>Suggested Order:</Text>
            <Text style={[styles.procurementValue, styles.procurementHighlight]}>
              {suggestion.suggestedOrderQuantity.toFixed(2)} {suggestion.unit}
            </Text>
          </View>
          <View style={styles.procurementDetailRow}>
            <Text style={styles.procurementLabel}>Est. Cost:</Text>
            <Text style={styles.procurementValue}>
              ₹{(suggestion.estimatedCost / 1000).toFixed(1)}K
            </Text>
          </View>
        </View>

        {suggestion.preferredSupplier && (
          <View style={styles.supplierSection}>
            <Text style={styles.supplierLabel}>Preferred Supplier:</Text>
            <Text style={styles.supplierName}>{suggestion.preferredSupplier.name}</Text>
            <Text style={styles.supplierRating}>
              Rating: {suggestion.preferredSupplier.rating}/5 |
              Reliability: {suggestion.preferredSupplier.reliability}%
            </Text>
          </View>
        )}

        <View style={styles.timingSection}>
          <Text style={styles.timingLabel}>Required by:</Text>
          <Text style={styles.timingValue}>
            {suggestion.requiredByDate.toLocaleDateString()}
          </Text>
        </View>

        <View style={styles.procurementActions}>
          <TouchableOpacity
            style={styles.procurementButton}
            onPress={() => {
              const material = materials.find(m => m.id === suggestion.materialId);
              if (material) handleViewSupplierQuotes(material);
            }}
          >
            <Text style={styles.procurementButtonText}>Compare Suppliers</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.procurementButton, styles.procurementButtonPrimary]}
          >
            <Text style={styles.procurementButtonTextPrimary}>Create Order</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderSupplierQuotesModal = () => {
    return (
      <Modal
        visible={showQuotesModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowQuotesModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Supplier Quotes</Text>
              <TouchableOpacity onPress={() => setShowQuotesModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            {selectedMaterial && (
              <Text style={styles.modalSubtitle}>{selectedMaterial.name}</Text>
            )}

            <ScrollView style={styles.quotesScroll}>
              {supplierQuotes.map(quote => (
                <View
                  key={quote.id}
                  style={[
                    styles.quoteCard,
                    quote.recommended && styles.quoteCardRecommended,
                  ]}
                >
                  {quote.recommended && (
                    <View style={styles.recommendedBadge}>
                      <Text style={styles.recommendedText}>RECOMMENDED</Text>
                    </View>
                  )}

                  <Text style={styles.quoteSupplierName}>{quote.supplierName}</Text>

                  <View style={styles.quoteDetails}>
                    <View style={styles.quoteRow}>
                      <Text style={styles.quoteLabel}>Unit Price:</Text>
                      <Text style={styles.quoteValue}>₹{quote.unitPrice.toFixed(2)}</Text>
                    </View>
                    <View style={styles.quoteRow}>
                      <Text style={styles.quoteLabel}>Lead Time:</Text>
                      <Text style={styles.quoteValue}>{quote.leadTimeDays} days</Text>
                    </View>
                    <View style={styles.quoteRow}>
                      <Text style={styles.quoteLabel}>Shipping:</Text>
                      <Text style={styles.quoteValue}>₹{quote.shippingCost.toFixed(0)}</Text>
                    </View>
                    <View style={[styles.quoteRow, styles.quoteTotalRow]}>
                      <Text style={styles.quoteTotalLabel}>Total Cost:</Text>
                      <Text style={styles.quoteTotalValue}>
                        ₹{(quote.totalCost / 1000).toFixed(1)}K
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.quoteNotes}>{quote.notes}</Text>

                  <TouchableOpacity style={styles.selectQuoteButton}>
                    <Text style={styles.selectQuoteButtonText}>Select This Quote</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  const renderConsumptionAnalytics = () => {
    return (
      <ScrollView style={styles.analyticsContainer}>
        <Text style={styles.sectionTitle}>Consumption Analytics</Text>

        {Array.from(consumptionData.entries()).slice(0, 10).map(([materialId, data]) => {
          const getTrendColor = (trend: string) => {
            switch (trend) {
              case 'increasing': return '#FF9800';
              case 'decreasing': return '#4CAF50';
              default: return '#2196F3';
            }
          };

          const getTrendIcon = (trend: string) => {
            switch (trend) {
              case 'increasing': return '↑';
              case 'decreasing': return '↓';
              default: return '→';
            }
          };

          return (
            <View key={materialId} style={styles.analyticsCard}>
              <Text style={styles.analyticsMaterialName}>{data.materialName}</Text>

              <View style={styles.analyticsRow}>
                <View style={styles.analyticsItem}>
                  <Text style={styles.analyticsLabel}>Daily Rate</Text>
                  <Text style={styles.analyticsValue}>
                    {data.dailyConsumptionRate.toFixed(1)}
                  </Text>
                </View>
                <View style={styles.analyticsItem}>
                  <Text style={styles.analyticsLabel}>Weekly Rate</Text>
                  <Text style={styles.analyticsValue}>
                    {data.weeklyConsumptionRate.toFixed(1)}
                  </Text>
                </View>
                <View style={styles.analyticsItem}>
                  <Text style={styles.analyticsLabel}>Monthly Rate</Text>
                  <Text style={styles.analyticsValue}>
                    {data.monthlyConsumptionRate.toFixed(1)}
                  </Text>
                </View>
              </View>

              <View style={styles.trendSection}>
                <Text style={styles.trendLabel}>Trend:</Text>
                <View style={[styles.trendBadge, { backgroundColor: getTrendColor(data.trend) + '20' }]}>
                  <Text style={[styles.trendText, { color: getTrendColor(data.trend) }]}>
                    {getTrendIcon(data.trend)} {data.trend.toUpperCase()}
                    ({data.trendPercentage > 0 ? '+' : ''}{data.trendPercentage.toFixed(1)}%)
                  </Text>
                </View>
              </View>

              <View style={styles.forecastSection}>
                <Text style={styles.forecastLabel}>Forecasted Demand:</Text>
                <Text style={styles.forecastValue}>
                  7 days: {data.forecastedDemand7Days.toFixed(1)} |
                  30 days: {data.forecastedDemand30Days.toFixed(1)}
                </Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
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
          <Text style={styles.emptyStateIcon}>📋</Text>
          <Text style={styles.emptyStateTitle}>No Bills of Materials (BOMs)</Text>
          <Text style={styles.emptyStateText}>
            To track materials, you need Bills of Materials (BOMs) from the Project Manager.
          </Text>
          <Text style={styles.emptyStateSubtext}>
            BOMs list all materials required for each work package. Logistics uses BOMs to place
            orders, track deliveries, and manage inventory.
          </Text>

          {/* Show Load Sample button only in Demo Mode */}
          {appMode === 'demo' && (
            <View style={styles.emptyStateActions}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleLoadSampleData}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.primaryButtonText}>📊 Load Sample Metro Railway BOMs</Text>
                )}
              </TouchableOpacity>

              <Text style={styles.emptyStateHint}>
                Sample data includes: Civil Works, OCS Installation, Traction Substation, Signaling,
                and MEP systems for Metro Railway projects.
              </Text>
            </View>
          )}

          {/* In Production Mode, show instruction to contact PM */}
          {appMode === 'production' && (
            <View style={styles.emptyStateActions}>
              <Text style={styles.productionModeText}>
                💼 Contact your Project Manager to create BOMs for this project.
              </Text>
              <Text style={styles.emptyStateHint}>
                BOMs are created by the Project Manager and will automatically appear here once added.
              </Text>
            </View>
          )}
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

    // Group requirements by BOM
    const groupedByBom = filteredRequirements.reduce((acc, req) => {
      const bomId = req.bomId || 'unknown';
      if (!acc[bomId]) {
        acc[bomId] = {
          bomId,
          bomName: req.bomName || 'Unknown BOM',
          items: [],
        };
      }
      acc[bomId].items.push(req);
      return acc;
    }, {} as Record<string, { bomId: string; bomName: string; items: typeof filteredRequirements }>);

    return (
      <ScrollView style={styles.requirementsList} showsVerticalScrollIndicator={false}>
        {Object.values(groupedByBom).map((bomGroup) => {
          const isExpanded = expandedBoms.has(bomGroup.bomId);
          const totalItems = bomGroup.items.length;
          const criticalItems = bomGroup.items.filter(i => i.status === 'critical').length;
          const shortageItems = bomGroup.items.filter(i => i.status === 'shortage').length;

          return (
            <View key={bomGroup.bomId} style={styles.bomGroupCard}>
              {/* BOM Header - Clickable to expand/collapse */}
              <TouchableOpacity
                style={styles.bomHeader}
                onPress={() => toggleBomExpansion(bomGroup.bomId)}
                activeOpacity={0.7}
              >
                <View style={styles.bomHeaderLeft}>
                  <Text style={styles.bomHeaderIcon}>{isExpanded ? '▼' : '▶'}</Text>
                  <View style={styles.bomHeaderInfo}>
                    <Text style={styles.bomName}>{bomGroup.bomName}</Text>
                    <Text style={styles.bomItemCount}>
                      {totalItems} item{totalItems !== 1 ? 's' : ''}
                      {criticalItems > 0 && ` • ${criticalItems} critical`}
                      {shortageItems > 0 && ` • ${shortageItems} shortage`}
                    </Text>
                  </View>
                </View>
                {criticalItems > 0 && (
                  <View style={styles.criticalBadge}>
                    <Text style={styles.criticalBadgeText}>CRITICAL</Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* BOM Items - Show only when expanded */}
              {isExpanded && (
                <View style={styles.bomItemsContainer}>
                  {bomGroup.items.map((requirement) => {
                    // Get DOORS link for this item
                    const doorsId = doorsLinkMap.get(requirement.itemCode);
                    const doorsData = doorsId ? doorsDataMap.get(doorsId) : undefined;

                    return (
                      <BomRequirementCard
                        key={`${requirement.bomId || 'unknown'}-${requirement.itemCode}`}
                        requirement={{
                          bomId: requirement.bomId || '',
                          bomName: requirement.bomName || 'Unknown BOM',
                          bomType: 'execution',
                          projectId: selectedProjectId || '',
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
                        doorsId={doorsData?.doorsId}
                        doorsCompliance={doorsData?.compliancePercentage}
                        onDoorsPress={() => {
                          if (doorsData?.packageId) {
                            navigation.navigate('DoorsDetail', { packageId: doorsData.packageId });
                          }
                        }}
                        onLinkPress={() => handleLinkPress(requirement.itemCode, requirement.description)}
                      />
                    );
                  })}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    );
  };

  const renderProcurementView = () => {
    if (filteredSuggestions.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateTitle}>No Procurement Needed</Text>
          <Text style={styles.emptyStateText}>
            All materials are sufficiently stocked
          </Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.procurementList} showsVerticalScrollIndicator={false}>
        {filteredSuggestions.map(suggestion => renderProcurementSuggestionCard(suggestion))}
      </ScrollView>
    );
  };

  const renderContent = () => {
    switch (viewMode) {
      case 'requirements':
      case 'shortages':
        return renderRequirementsList();
      case 'procurement':
        return renderProcurementView();
      case 'analytics':
        return renderConsumptionAnalytics();
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Project Selector + Dev Tools Row - Compact */}
      {renderCompactProjectRow()}

      {/* View Mode Tabs */}
      {stats.total > 0 && renderViewModeTabs()}

      {/* Search Bar + Category Filters - Combined Row */}
      {(viewMode === 'requirements' || viewMode === 'shortages') && stats.total > 0 && renderSearchAndFilters()}

      {/* Content */}
      {renderContent()}

      {/* Supplier Quotes Modal */}
      {renderSupplierQuotesModal()}

      {/* DOORS Linking Modal */}
      <DoorsLinkingModal
        visible={showLinkingModal}
        bomItemName={selectedBomItem?.name || ''}
        bomItemId={selectedBomItem?.id || ''}
        onClose={() => setShowLinkingModal(false)}
        onLink={handleLinkConfirm}
        doorsPackages={doorsPackages}
      />
    </View>
  );
};

// Styles continue in next part...
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
  headerMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  devTools: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  clearButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#FFEBEE',
    borderWidth: 2,
    borderColor: '#F44336',
  },
  clearButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F44336',
  },
  modeIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 2,
  },
  modeDemo: {
    backgroundColor: '#FFF3E0',
    borderColor: '#FF9800',
  },
  modeProduction: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF50',
  },
  modeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#333',
  },
  productionModeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976D2',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 24,
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
  statCardInfo: {
    backgroundColor: '#E3F2FD',
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
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tabsScrollContent: {
    flexDirection: 'row',
    paddingHorizontal: 4,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    gap: 6,
  },
  tabActive: {
    borderBottomColor: '#2196F3',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#2196F3',
    fontWeight: '700',
  },
  tabBadge: {
    backgroundColor: '#666',
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBadgeAlert: {
    backgroundColor: '#FF5722',
  },
  tabBadgeWarning: {
    backgroundColor: '#FF9800',
  },
  tabBadgeText: {
    fontSize: 12,
    fontWeight: '700',
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
  procurementList: {
    flex: 1,
    padding: 12,
  },
  procurementCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  procurementHeader: {
    marginBottom: 12,
  },
  procurementTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  procurementMaterialName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    flex: 1,
  },
  urgencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  urgencyText: {
    fontSize: 10,
    fontWeight: '700',
  },
  procurementItemCode: {
    fontSize: 13,
    color: '#666',
  },
  procurementDetails: {
    marginBottom: 12,
  },
  procurementDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  procurementLabel: {
    fontSize: 13,
    color: '#666',
  },
  procurementValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  procurementHighlight: {
    color: '#2196F3',
    fontWeight: '700',
  },
  supplierSection: {
    backgroundColor: '#F3E5F5',
    padding: 10,
    borderRadius: 6,
    marginBottom: 10,
  },
  supplierLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 4,
  },
  supplierName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7B1FA2',
    marginBottom: 2,
  },
  supplierRating: {
    fontSize: 11,
    color: '#666',
  },
  timingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  timingLabel: {
    fontSize: 12,
    color: '#666',
    marginRight: 8,
  },
  timingValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF9800',
  },
  procurementActions: {
    flexDirection: 'row',
    gap: 8,
  },
  procurementButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#2196F3',
    alignItems: 'center',
  },
  procurementButtonPrimary: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  procurementButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2196F3',
  },
  procurementButtonTextPrimary: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
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
    paddingBottom: 20,
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  modalClose: {
    fontSize: 24,
    color: '#666',
  },
  quotesScroll: {
    padding: 16,
  },
  quoteCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  quoteCardRecommended: {
    borderColor: '#4CAF50',
  },
  recommendedBadge: {
    position: 'absolute',
    top: -8,
    right: 16,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
  },
  recommendedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  quoteSupplierName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  quoteDetails: {
    marginBottom: 12,
  },
  quoteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  quoteTotalRow: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 8,
    marginTop: 4,
  },
  quoteLabel: {
    fontSize: 13,
    color: '#666',
  },
  quoteValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  quoteTotalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
  quoteTotalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2196F3',
  },
  quoteNotes: {
    fontSize: 11,
    color: '#999',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  selectQuoteButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  selectQuoteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  analyticsContainer: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  analyticsCard: {
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
  analyticsMaterialName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  analyticsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  analyticsItem: {
    flex: 1,
    alignItems: 'center',
  },
  analyticsLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 4,
  },
  analyticsValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  trendSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  trendLabel: {
    fontSize: 12,
    color: '#666',
    marginRight: 8,
  },
  trendBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
  },
  forecastSection: {
    backgroundColor: '#F3E5F5',
    padding: 10,
    borderRadius: 6,
  },
  forecastLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 4,
  },
  forecastValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7B1FA2',
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
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 24,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
    maxWidth: '80%',
  },
  emptyStateActions: {
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
  },
  primaryButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 250,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyStateHint: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
    maxWidth: '85%',
    lineHeight: 18,
  },
  categoryFiltersContainer: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  categoryFiltersScroll: {
    flexGrow: 0,
  },
  categoryFiltersContent: {
    paddingHorizontal: 16,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  categoryChipActive: {
    borderColor: 'transparent',
  },
  categoryIcon: {
    fontSize: 18,
    marginRight: 6,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  categoryNameActive: {
    color: '#fff',
    fontWeight: '600',
  },
  // BOM Group Card styles
  bomGroupCard: {
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  bomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  bomHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  bomHeaderIcon: {
    fontSize: 14,
    color: '#666',
    marginRight: 12,
    width: 20,
  },
  bomHeaderInfo: {
    flex: 1,
  },
  bomName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  bomItemCount: {
    fontSize: 13,
    color: '#666',
  },
  criticalBadge: {
    backgroundColor: '#F44336',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  criticalBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  bomItemsContainer: {
    padding: 12,
    paddingTop: 8,
  },
  // Compact Layout Styles (Option B)
  compactProjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  compactProjectSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  compactLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginRight: 8,
  },
  compactProjectScroll: {
    flexGrow: 0,
  },
  compactProjectChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  compactProjectChipActive: {
    backgroundColor: '#2196F3',
  },
  compactProjectText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  compactProjectTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  compactDevTools: {
    flexDirection: 'row',
    gap: 6,
    marginLeft: 8,
  },
  compactClearButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFEBEE',
    borderWidth: 1.5,
    borderColor: '#F44336',
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactClearText: {
    fontSize: 14,
  },
  compactModeIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactModeText: {
    fontSize: 14,
  },
  searchFiltersRow: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  compactSearchContainer: {
    marginBottom: 8,
    position: 'relative',
  },
  compactSearchInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingRight: 40,
    paddingVertical: 8,
    fontSize: 14,
    color: '#333',
  },
  searchClearButton: {
    position: 'absolute',
    right: 8,
    top: 0,
    bottom: 0,
    width: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchClearText: {
    fontSize: 18,
    color: '#999',
    fontWeight: '600',
  },
  compactFiltersScroll: {
    flexGrow: 0,
  },
  compactFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  compactFilterChipActive: {
    backgroundColor: '#2196F3',
  },
  compactFilterIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  compactFilterText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  compactFilterTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default MaterialTrackingScreen;
