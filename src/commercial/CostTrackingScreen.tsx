import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { FAB, Searchbar } from 'react-native-paper';
import { useCommercial } from './context/CommercialContext';
import { useAuth } from '../auth/AuthContext';
import ErrorBoundary from '../components/common/ErrorBoundary';
import { useCostData, useCostFilters, useCostForm } from './cost-tracking/hooks';
import {
  HeaderSection,
  CostCard,
  CostFormDialog,
  CategoryFilterMenu,
} from './cost-tracking/components';

/**
 * CostTrackingScreen (v2.20 - Refactored)
 *
 * Commercial Manager tracks actual costs incurred on the project.
 *
 * Features:
 * - View all cost entries for the project
 * - Filter by category (Labor, Materials, Equipment, Subcontractors)
 * - Create new cost entries with date
 * - Edit/Delete cost entries
 * - Show cost vs budget comparison
 * - Link to Purchase Orders (optional)
 * - Date-based filtering
 */

const CostTrackingScreen = () => {
  const { projectId, projectName, selectedCostCategory, setSelectedCostCategory, refreshTrigger } =
    useCommercial();
  const { user } = useAuth();

  // Data hooks
  const {
    costs,
    loading,
    loadCosts,
    getBudgetForCategory,
    getTotalSpentForCategory,
    totalBudgets,
    totalCosts,
    totalVariance,
  } = useCostData(projectId);

  const { searchQuery, setSearchQuery, filteredCosts } = useCostFilters(
    costs,
    selectedCostCategory
  );

  const {
    showCreateDialog,
    setShowCreateDialog,
    showEditDialog,
    showDatePicker,
    setShowDatePicker,
    formCategory,
    setFormCategory,
    formAmount,
    setFormAmount,
    formDescription,
    setFormDescription,
    formPoId,
    setFormPoId,
    formCostDate,
    resetForm,
    handleCreateCost,
    handleEditCost,
    handleDeleteCost,
    openEditDialog,
    handleDateChange,
  } = useCostForm(user?.userId, projectId, loadCosts);

  const [showFilterMenu, setShowFilterMenu] = React.useState(false);

  useEffect(() => {
    loadCosts();
  }, [loadCosts, refreshTrigger]);

  if (!projectId) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No project assigned</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <HeaderSection
        projectName={projectName}
        totalBudgets={totalBudgets}
        totalCosts={totalCosts}
        totalVariance={totalVariance}
      />

      {/* Search and filter */}
      <View style={styles.controls}>
        <Searchbar
          placeholder="Search costs..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
        <CategoryFilterMenu
          visible={showFilterMenu}
          onDismiss={() => setShowFilterMenu(false)}
          selectedCategory={selectedCostCategory}
          onSelectCategory={setSelectedCostCategory}
        />
      </View>

      {/* Cost list */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading costs...</Text>
        </View>
      ) : filteredCosts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {searchQuery || selectedCostCategory
              ? 'No costs match your filters'
              : 'No cost entries yet. Tap + to create one.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredCosts}
          renderItem={({ item }) => (
            <CostCard
              cost={item}
              budgetAmount={getBudgetForCategory(item.category)}
              totalSpent={getTotalSpentForCategory(item.category)}
              onEdit={openEditDialog}
              onDelete={handleDeleteCost}
            />
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Create FAB */}
      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => {
          resetForm();
          setShowCreateDialog(true);
        }}
        label="Add Cost"
      />

      {/* Create Dialog */}
      <CostFormDialog
        visible={showCreateDialog}
        onDismiss={() => setShowCreateDialog(false)}
        onSave={handleCreateCost}
        title="Create Cost Entry"
        formCategory={formCategory}
        setFormCategory={setFormCategory}
        formAmount={formAmount}
        setFormAmount={setFormAmount}
        formDescription={formDescription}
        setFormDescription={setFormDescription}
        formPoId={formPoId}
        setFormPoId={setFormPoId}
        formCostDate={formCostDate}
        showDatePicker={showDatePicker}
        setShowDatePicker={setShowDatePicker}
        handleDateChange={handleDateChange}
      />

      {/* Edit Dialog */}
      <CostFormDialog
        visible={showEditDialog}
        onDismiss={() => setShowCreateDialog(false)}
        onSave={handleEditCost}
        title="Edit Cost Entry"
        formCategory={formCategory}
        setFormCategory={setFormCategory}
        formAmount={formAmount}
        setFormAmount={setFormAmount}
        formDescription={formDescription}
        setFormDescription={setFormDescription}
        formPoId={formPoId}
        setFormPoId={setFormPoId}
        formCostDate={formCostDate}
        showDatePicker={showDatePicker}
        setShowDatePicker={setShowDatePicker}
        handleDateChange={handleDateChange}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  controls: {
    padding: 16,
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchbar: {
    flex: 1,
    elevation: 0,
  },
  listContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: '#007AFF',
  },
});

export default function CostTrackingScreenWithErrorBoundary(props: any) {
  return (
    <ErrorBoundary name="CostTrackingScreen">
      <CostTrackingScreen {...props} />
    </ErrorBoundary>
  );
}
