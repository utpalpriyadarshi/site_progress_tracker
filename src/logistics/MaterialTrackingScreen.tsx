import React, { useState, useEffect } from 'react';
import { logger } from '../services/LoggingService';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Text,
} from 'react-native';
import { useLogistics } from './context/LogisticsContext';
import { useBomData } from '../shared/hooks/useBomData';
import BomLogisticsService, { MaterialRequirement } from '../services/BomLogisticsService';
import MaterialProcurementService, {
  PurchaseSuggestion,
  SupplierQuote,
  ConsumptionData,
} from '../services/MaterialProcurementService';
import DoorsLinkingModal from './components/DoorsLinkingModal';
import mockSuppliers, { generateMockConsumptionHistory } from '../data/mockSuppliers';
import { database } from '../../models/database';
import { Q } from '@nozbe/watermelondb';
import MaterialModel from '../../models/MaterialModel';
import DoorsPackageModel from '../../models/DoorsPackageModel';
import { BomDataService } from '../services/BomDataService';
import { AppMode, toggleAppMode } from '../config/AppMode';
import { clearAllBoms } from '../services/ClearBomsService';
import DoorsEditService from '../services/DoorsEditService';
import UnlinkBomItemsService from '../services/UnlinkBomItemsService';
import { useAuth } from '../auth/AuthContext';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { EmptyState } from '../components/common/EmptyState';
import { OfflineIndicator } from '../components/common/OfflineIndicator';
import { useDebounce } from '../utils/performance';
import { useAccessibility } from '../utils/accessibility';

// Import Material Tracking components
import {
  SearchAndFilters,
  ViewModeTabs,
  StatCards,
  ProcurementSuggestionCard,
  SupplierQuotesModal,
  ConsumptionAnalytics,
  RequirementsList,
  ProcurementView,
} from './material-tracking/components';

// Import hooks
import {
  useMaterialTrackingData,
  useProcurementData,
  useAnalyticsData,
} from './material-tracking/hooks';

// Import utilities
import {
  METRO_MATERIAL_CATEGORIES,
  ViewMode,
} from './material-tracking/utils';

/**
 * MaterialTrackingScreen (Refactored - Phase 5)
 *
 * Comprehensive materials tracking with:
 * - BOM-driven requirements (Phase 3)
 * - Intelligent procurement suggestions
 * - Supplier comparison and selection
 * - Multi-location stock monitoring
 * - Consumption rate analytics
 * - Reorder automation
 *
 * Refactored to use modular components (Phases 1-5)
 */

interface MaterialTrackingScreenProps {
  navigation: any;
}

const MaterialTrackingScreen: React.FC<MaterialTrackingScreenProps> = ({ navigation }) => {
  const {
    selectedProjectId,
    materials,
    loading: contextLoading,
    refresh: refreshContext,
    isOffline,
    pendingSyncCount,
    triggerSync,
  } = useLogistics();

  const { user } = useAuth();
  const { announce } = useAccessibility();

  const [viewMode, setViewMode] = useState<ViewMode>('requirements');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDiscipline, setSelectedDiscipline] = useState<'all' | 'tss' | 'ohe' | 'general'>('all');
  const [loading, setLoading] = useState(false);
  const [appMode, setAppModeState] = useState(AppMode.getMode());

  // Debounce search for performance (300ms delay)
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // BOM expansion state - track which BOMs are expanded
  const [expandedBoms, setExpandedBoms] = useState<Set<string>>(new Set());

  // Procurement state
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialModel | null>(null);
  const [supplierQuotes, setSupplierQuotes] = useState<SupplierQuote[]>([]);
  const [showQuotesModal, setShowQuotesModal] = useState(false);

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

  // Use custom hooks
  const { doorsPackages } = useMaterialTrackingData(selectedProjectId);
  const { purchaseSuggestions, refresh: refreshProcurement } = useProcurementData(
    materials,
    bomItems
  );
  const { consumptionData } = useAnalyticsData(materials);

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
      logger.info('[MaterialTracking] Loading sample BOMs for project', { selectedProjectId });

      // Load mock BOMs into database
      const loadedBoms = await BomDataService.loadMockBoms(selectedProjectId);
      logger.info('[MaterialTracking] Loaded BOMs', { count: loadedBoms.length });

      // Wait a moment for database to settle
      await new Promise<void>(resolve => setTimeout(resolve, 500));

      // Refresh BOMs to reload from database
      await refreshBoms();
      logger.info('[MaterialTracking] Refreshed BOMs');

      // Wait a moment before reloading procurement data
      await new Promise<void>(resolve => setTimeout(resolve, 300));

      // Reload procurement data
      refreshProcurement();
      logger.info('[MaterialTracking] Reloaded procurement data');
    } catch (error) {
      logger.error('[MaterialTracking] Error loading sample BOMs:', error as Error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMode = () => {
    const newMode = toggleAppMode();
    setAppModeState(newMode);
    logger.info('[MaterialTracking] Switched to mode', { newMode });
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
      logger.error('[MaterialTracking] Error clearing BOMs:', error as Error);
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
      logger.error('[MaterialTracking] Error unlinking BOM items:', error as Error);
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
      logger.error(`[MaterialTracking] BOM item not found for itemCode: ${itemCode}`);
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
      logger.error('[MaterialTracking] Error linking BOM item:', error as Error);
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

  // Derive discipline from BOM name OR item code
  // calculateMaterialRequirements doesn't populate bomName, but itemCode always has TSS/OHE
  const getDiscipline = (bomName?: string, itemCode?: string): 'tss' | 'ohe' | 'general' => {
    const src = `${bomName || ''} ${itemCode || ''}`.toLowerCase();
    if (src.includes('tss')) return 'tss';
    if (src.includes('ohe')) return 'ohe';
    return 'general';
  };

  // Filter by discipline and search
  const filteredRequirements = React.useMemo(() => {
    let filtered = materialRequirements;

    if (viewMode === 'shortages') {
      filtered = shortages;
    }

    // Discipline filter — check both bomName and itemCode
    if (selectedDiscipline !== 'all') {
      filtered = filtered.filter(
        (req) => getDiscipline(req.bomName, req.itemCode) === selectedDiscipline
      );
    }

    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase();
      filtered = filtered.filter(
        (req) =>
          req.itemCode.toLowerCase().includes(query) ||
          req.description.toLowerCase().includes(query) ||
          (req.bomName && req.bomName.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [materialRequirements, shortages, viewMode, debouncedSearchQuery, selectedDiscipline]);

  // Filter procurement suggestions
  const filteredSuggestions = React.useMemo(() => {
    if (!debouncedSearchQuery.trim()) return purchaseSuggestions;

    const query = debouncedSearchQuery.toLowerCase();
    return purchaseSuggestions.filter(
      (sug) =>
        sug.materialName.toLowerCase().includes(query) ||
        sug.itemCode.toLowerCase().includes(query)
    );
  }, [purchaseSuggestions, debouncedSearchQuery]);

  // Announce search results for accessibility
  useEffect(() => {
    if (debouncedSearchQuery && !loading) {
      announce(`Found ${filteredRequirements.length} materials matching "${debouncedSearchQuery}"`);
    }
  }, [filteredRequirements.length, debouncedSearchQuery, loading, announce]);

  // Get statistics
  const stats = React.useMemo(() => {
    const total = materialRequirements.length;
    const critical = materialRequirements.filter((r) => r.status === 'critical').length;
    const shortageCount = shortages.length;
    const sufficient = materialRequirements.filter((r) => r.status === 'sufficient').length;
    const procurementPending = purchaseSuggestions.filter(s => s.status === 'pending').length;

    return { total, critical, shortageCount, sufficient, procurementPending };
  }, [materialRequirements, shortages, purchaseSuggestions]);

  // Empty state rendering for requirements view
  const renderRequirementsEmptyState = () => {
    const hasNoData = materialRequirements.length === 0;
    const hasSearchQuery = debouncedSearchQuery.trim().length > 0;
    const hasDisciplineFilter = selectedDiscipline !== 'all';
    const noFilteredResults = filteredRequirements.length === 0;

    // No BOM requirements linked at all
    if (hasNoData && !bomLoading && !loading) {
      return (
        <EmptyState
          icon="clipboard-text-outline"
          title="No BOM Requirements"
          message="Link materials to a Bill of Materials to track requirements."
          helpText="BOM requirements help track material needs across your project."
          actionText="Link BOM"
          onAction={() => {
            logger.info('[MaterialTracking] Link BOM action pressed');
          }}
        />
      );
    }

    // No search results
    if (hasSearchQuery && noFilteredResults && materialRequirements.length > 0) {
      return (
        <EmptyState
          icon="magnify"
          title="No Materials Found"
          message={`No materials match "${debouncedSearchQuery}"`}
          variant="search"
          actionText="Clear Search"
          onAction={() => setSearchQuery('')}
        />
      );
    }

    // No discipline filter results
    if (hasDisciplineFilter && noFilteredResults && materialRequirements.length > 0) {
      return (
        <EmptyState
          icon="filter-off"
          title={`No ${selectedDiscipline.toUpperCase()} Materials`}
          message="Try selecting a different discipline filter."
          actionText="Show All"
          onAction={() => setSelectedDiscipline('all')}
        />
      );
    }

    return null;
  };

  const renderContent = () => {
    switch (viewMode) {
      case 'requirements':
      case 'shortages':
        // Show empty state if applicable, otherwise show RequirementsList
        return renderRequirementsEmptyState() || (
          <RequirementsList
            boms={boms}
            filteredRequirements={filteredRequirements}
            loading={loading}
            bomLoading={bomLoading}
            expandedBoms={expandedBoms}
            doorsLinkMap={doorsLinkMap}
            doorsDataMap={doorsDataMap}
            searchQuery={searchQuery}
            selectedProjectId={selectedProjectId}
            appMode={appMode}
            onToggleBom={toggleBomExpansion}
            onLoadSampleData={handleLoadSampleData}
            onNavigateToDoorsDetail={(packageId) => navigation.navigate('DoorsDetail', { packageId })}
            onLinkPress={handleLinkPress}
          />
        );
      case 'procurement':
        return (
          <ProcurementView
            filteredSuggestions={filteredSuggestions}
            materials={materials}
            onViewQuotes={handleViewSupplierQuotes}
          />
        );
      case 'analytics':
        return <ConsumptionAnalytics consumptionData={consumptionData} />;
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Offline Indicator — only show when truly offline; header SyncHeaderButton handles pending */}
      <OfflineIndicator
        isOnline={!isOffline}
        pendingCount={pendingSyncCount}
        onSync={triggerSync}
        showWhenPending={false}
      />

      {/* View Mode Tabs */}
      <ViewModeTabs
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        stats={stats}
      />

      {/* Compact stat summary */}
      <StatCards stats={stats} />

      {/* Discipline filter + search — always shown for requirements/shortages */}
      {(viewMode === 'requirements' || viewMode === 'shortages') && (
        <SearchAndFilters
          searchQuery={searchQuery}
          selectedDiscipline={selectedDiscipline}
          onSearchChange={setSearchQuery}
          onDisciplineChange={setSelectedDiscipline}
        />
      )}

      {/* Content */}
      {renderContent()}

      {/* Supplier Quotes Modal */}
      <SupplierQuotesModal
        visible={showQuotesModal}
        quotes={supplierQuotes}
        selectedMaterial={selectedMaterial}
        onClose={() => setShowQuotesModal(false)}
      />

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});

const MaterialTrackingScreenWithBoundary = () => (
  <ErrorBoundary name="Logistics - Material Tracking">
    <MaterialTrackingScreen navigation={undefined} />
  </ErrorBoundary>
);

export default MaterialTrackingScreenWithBoundary;
