import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { database } from '../../models/database';
import { withObservables } from '@nozbe/watermelondb/react';
import BomModel from '../../models/BomModel';
import BomItemModel from '../../models/BomItemModel';
import ProjectModel from '../../models/ProjectModel';
import { ConfirmDialog } from '../components/Dialog';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { useBomData } from './bom-management/hooks/useBomData';
import { useBomItemData } from './bom-management/hooks/useBomItemData';
import { useBomFilters } from './bom-management/hooks/useBomFilters';
import {
  BomCard,
  BomListHeader,
  BomFormDialog,
  BomItemFormDialog,
} from './bom-management/components';
import { SITE_CATEGORIES } from './bom-management/utils/bomConstants';
import { useAccessibility } from '../utils/accessibility';
import { EmptyState } from '../components/common/EmptyState';

/**
 * BomManagementScreen - Redesigned to match Supervisor pattern
 *
 * Simple card-based interface:
 * - Create BOM → Shows immediately in list
 * - Add items → Updates card immediately
 * - Edit/Delete → Instant feedback
 */
const BomManagementScreenComponent = ({
  boms,
  projects,
  allBomItems,
}: {
  boms: BomModel[];
  projects: ProjectModel[];
  allBomItems: BomItemModel[];
}) => {
  // Use custom hooks for data management
  const bomData = useBomData(projects, allBomItems, boms);
  const itemData = useBomItemData(allBomItems);
  const {
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    debouncedSearchQuery,
    filteredBoms,
    totalForTab,
    isSearching,
  } = useBomFilters(boms);
  const { announce } = useAccessibility();
  const previousBomsCountRef = useRef(boms.length);
  const previousSearchResultsRef = useRef<number | null>(null);

  // Announce BOM list changes for screen readers
  useEffect(() => {
    if (boms.length !== previousBomsCountRef.current) {
      const estimatingCount = boms.filter(b => b.type === 'estimating').length;
      const executionCount = boms.filter(b => b.type === 'execution').length;
      announce(`BOM list updated: ${boms.length} total, ${estimatingCount} estimating, ${executionCount} execution`);
      previousBomsCountRef.current = boms.length;
    }
  }, [boms.length, boms, announce]);

  // Announce search results for screen readers
  useEffect(() => {
    if (debouncedSearchQuery && previousSearchResultsRef.current !== filteredBoms.length) {
      if (filteredBoms.length === 0) {
        announce(`No BOMs found matching "${debouncedSearchQuery}"`);
      } else {
        announce(`Found ${filteredBoms.length} BOM${filteredBoms.length === 1 ? '' : 's'} matching "${debouncedSearchQuery}"`);
      }
      previousSearchResultsRef.current = filteredBoms.length;
    } else if (!debouncedSearchQuery) {
      previousSearchResultsRef.current = null;
    }
  }, [debouncedSearchQuery, filteredBoms.length, announce]);

  // Announce tab changes
  const handleTabChange = (tab: 'estimating' | 'execution') => {
    setActiveTab(tab);
    announce(`Switched to ${tab} BOMs tab, showing ${filteredBoms.length} items`);
  };

  return (
    <View
      style={styles.container}
      accessible
      accessibilityLabel="BOM Management Screen"
      accessibilityRole="none"
    >
      {/* Header with actions, search, and tabs */}
      <BomListHeader
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onImport={bomData.handleImportBom}
        onAddBom={() => bomData.openAddBomDialog(activeTab)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        resultCount={filteredBoms.length}
        totalCount={totalForTab}
        isSearching={isSearching}
      />

      {/* BOM List */}
      <ScrollView style={styles.scrollView}>
        {filteredBoms.length === 0 ? (
          isSearching ? (
            <EmptyState
              icon="file-search-outline"
              title="No Matching BOMs"
              message={`No ${activeTab === 'estimating' ? 'estimating' : 'execution'} BOMs found matching "${debouncedSearchQuery}".`}
              helpText="Try adjusting your search terms or clear the search to see all BOMs."
              tips={[
                'Search by BOM name, category, or status',
                'Use partial words for broader results',
                'Check the other tab for more BOMs',
              ]}
              actionText="Clear Search"
              onAction={() => setSearchQuery('')}
              variant="compact"
            />
          ) : (
            <EmptyState
              icon={activeTab === 'estimating' ? 'calculator-variant-outline' : 'clipboard-list-outline'}
              title={`No ${activeTab === 'estimating' ? 'Estimating' : 'Execution'} BOMs`}
              message={
                activeTab === 'estimating'
                  ? 'Create an estimating BOM to plan your project costs before execution.'
                  : 'Execution BOMs are created from approved estimating BOMs or can be added directly.'
              }
              helpText={
                activeTab === 'estimating'
                  ? 'Estimating BOMs help you plan material and labor costs before the project starts.'
                  : 'Execution BOMs track actual materials and costs during project implementation.'
              }
              tips={
                activeTab === 'estimating'
                  ? [
                      'Add items with quantities and unit costs',
                      'Export BOMs to Excel for review',
                      'Copy approved BOMs to execution when ready',
                    ]
                  : [
                      'Track actual quantities vs estimates',
                      'Link BOMs to purchase orders',
                      'Monitor cost variances in real-time',
                    ]
              }
              actionText="Add BOM"
              onAction={() => bomData.openAddBomDialog(activeTab)}
              secondaryActionText="Import from Excel"
              onSecondaryAction={bomData.handleImportBom}
              variant="default"
            />
          )
        ) : (
          filteredBoms.map(bom => (
            <BomCard
              key={bom.id}
              bom={bom}
              boms={boms}
              projects={projects}
              allBomItems={allBomItems}
              onEditBom={bomData.openEditBomDialog}
              onDeleteBom={bomData.handleDeleteBom}
              onAddItem={itemData.openAddItemDialog}
              onEditItem={itemData.openEditItemDialog}
              onDeleteItem={itemData.handleDeleteItem}
              onCopyToExecution={(bom) => bomData.handleCopyToExecution(bom, () => setActiveTab('execution'))}
              onExportBom={bomData.handleExportBom}
              exportingBomId={bomData.exportingBomId}
            />
          ))
        )}
      </ScrollView>

      {/* BOM Form Dialog */}
      <BomFormDialog
        visible={bomData.bomDialogVisible}
        editingBom={bomData.editingBom}
        projects={projects}
        bomName={bomData.bomName}
        setBomName={bomData.setBomName}
        selectedProjectId={bomData.selectedProjectId}
        setSelectedProjectId={bomData.setSelectedProjectId}
        bomType={bomData.bomType}
        setBomType={bomData.setBomType}
        siteCategory={bomData.siteCategory}
        setSiteCategory={bomData.setSiteCategory}
        quantity={bomData.quantity}
        setQuantity={bomData.setQuantity}
        unit={bomData.unit}
        setUnit={bomData.setUnit}
        description={bomData.description}
        setDescription={bomData.setDescription}
        projectMenuVisible={bomData.projectMenuVisible}
        setProjectMenuVisible={bomData.setProjectMenuVisible}
        siteMenuVisible={bomData.siteMenuVisible}
        setSiteMenuVisible={bomData.setSiteMenuVisible}
        onDismiss={bomData.closeBomDialog}
        onSave={bomData.handleSaveBom}
      />

      {/* Item Form Dialog */}
      <BomItemFormDialog
        visible={itemData.itemDialogVisible}
        editingItem={itemData.editingItem}
        itemDescription={itemData.itemDescription}
        setItemDescription={itemData.setItemDescription}
        itemCategory={itemData.itemCategory}
        setItemCategory={itemData.setItemCategory}
        itemQuantity={itemData.itemQuantity}
        setItemQuantity={itemData.setItemQuantity}
        itemUnit={itemData.itemUnit}
        setItemUnit={itemData.setItemUnit}
        itemUnitCost={itemData.itemUnitCost}
        setItemUnitCost={itemData.setItemUnitCost}
        itemPhase={itemData.itemPhase}
        setItemPhase={itemData.setItemPhase}
        onDismiss={itemData.closeItemDialog}
        onSave={itemData.handleSaveItem}
      />

      {/* Delete BOM Confirmation */}
      <ConfirmDialog
        visible={bomData.showDeleteBomDialog}
        title="Delete BOM"
        message={`Are you sure you want to delete "${bomData.bomToDelete?.name}"? All items will be deleted.`}
        onConfirm={bomData.confirmDeleteBom}
        onCancel={() => {
          bomData.setShowDeleteBomDialog(false);
          bomData.setBomToDelete(null);
        }}
      />

      {/* Delete Item Confirmation */}
      <ConfirmDialog
        visible={itemData.showDeleteItemDialog}
        title="Delete Item"
        message={`Are you sure you want to delete "${itemData.itemToDelete?.itemCode}"?`}
        onConfirm={itemData.confirmDeleteItem}
        onCancel={() => {
          itemData.setShowDeleteItemDialog(false);
          itemData.setItemToDelete(null);
        }}
      />
    </View>
  );
};

// Wire up WatermelonDB observables
const enhance = withObservables([], () => ({
  boms: database.collections.get<BomModel>('boms').query().observe(),
  projects: database.collections.get<ProjectModel>('projects').query().observe(),
  allBomItems: database.collections.get<BomItemModel>('bom_items').query().observe(),
}));

const BomManagementScreen = enhance(BomManagementScreenComponent);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
    padding: 12,
  },
  emptyCard: {
    marginTop: 40,
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '600',
  },
  emptyHint: {
    textAlign: 'center',
    color: '#666',
  },
});

// Wrap with ErrorBoundary for graceful error handling
const BomManagementScreenWithBoundary = () => (
  <ErrorBoundary name="BomManagementScreen">
    <BomManagementScreen />
  </ErrorBoundary>
);

export default BomManagementScreenWithBoundary;
