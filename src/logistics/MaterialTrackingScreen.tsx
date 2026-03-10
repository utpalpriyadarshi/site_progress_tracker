import React, { useState, useEffect } from 'react';
import { logger } from '../services/LoggingService';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
} from 'react-native';
import { useLogistics } from './context/LogisticsContext';
import MaterialModel from '../../models/MaterialModel';
import { useBomData } from '../shared/hooks/useBomData';
import BomLogisticsService, { MaterialRequirement } from '../services/BomLogisticsService';
import MaterialProcurementService, {
  PurchaseSuggestion,
  SupplierQuote,
  ConsumptionData,
} from '../services/MaterialProcurementService';
import mockSuppliers from '../data/mockSuppliers';
import { BomDataService } from '../services/BomDataService';
import { AppMode } from '../config/AppMode';
import { useAuth } from '../auth/AuthContext';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { EmptyState } from '../components/common/EmptyState';
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
  } = useLogistics();

  const { user } = useAuth();
  const { announce } = useAccessibility();

  const [viewMode, setViewMode] = useState<ViewMode>('requirements');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDiscipline, setSelectedDiscipline] = useState<'all' | 'tss' | 'ohe' | 'general'>('all');
  const [loading, setLoading] = useState(false);
  const [appMode] = useState(AppMode.getMode());

  // Debounce search for performance (300ms delay)
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // BOM expansion state - track which BOMs are expanded
  const [expandedBoms, setExpandedBoms] = useState<Set<string>>(new Set());

  // Procurement state
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialModel | null>(null);
  const [supplierQuotes, setSupplierQuotes] = useState<SupplierQuote[]>([]);
  const [showQuotesModal, setShowQuotesModal] = useState(false);

  // Use BOM data hook
  const {
    boms,
    bomItems,
    loading: bomLoading,
    refresh: refreshBoms,
  } = useBomData(selectedProjectId || '');

  // Use custom hooks
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

  // Calculate material requirements, enriched with BOM name/id for grouping
  const materialRequirements = React.useMemo(() => {
    if (!bomItems.length) return [];
    const reqs = BomLogisticsService.calculateMaterialRequirements(bomItems, materials);
    return reqs.map(req => {
      const srcItem = bomItems.find(
        i => (req.materialId && i.materialId === req.materialId) || i.itemCode === req.itemCode
      );
      const bom = boms.find(b => b.id === srcItem?.bomId);
      return { ...req, bomId: bom?.id, bomName: bom?.name };
    });
  }, [bomItems, materials, boms]);

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
            searchQuery={searchQuery}
            selectedProjectId={selectedProjectId}
            appMode={appMode}
            onToggleBom={toggleBomExpansion}
            onLoadSampleData={handleLoadSampleData}
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
