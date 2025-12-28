import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Button, Card, Text, FAB } from 'react-native-paper';
import { useSnackbar } from '../components/Snackbar';
import { ConfirmDialog } from '../components/Dialog';
import { withObservables } from '@nozbe/watermelondb/react';
import { Q } from '@nozbe/watermelondb';
import { database } from '../../models/database';
import ProjectModel from '../../models/ProjectModel';
import ItemModel from '../../models/ItemModel';
import PlanningService from '../../services/planning/PlanningService';
import ProjectSelector from './components/ProjectSelector';
import DependencyModal from './components/DependencyModal';
import ItemPlanningCard from './components/ItemPlanningCard';
import { logger } from '../services/LoggingService';

interface BaselineScreenProps {
  projects: ProjectModel[];
}

const BaselineScreenComponent: React.FC<BaselineScreenProps> = ({ projects }) => {
  const { showSnackbar } = useSnackbar();
  const [selectedProject, setSelectedProject] = useState<ProjectModel | null>(null);
  const [items, setItems] = useState<ItemModel[]>([]);
  const [criticalPathItems, setCriticalPathItems] = useState<string[]>([]);
  const [showDependencyModal, setShowDependencyModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ItemModel | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showLockBaselineDialog, setShowLockBaselineDialog] = useState(false);
  const [criticalPathResult, setCriticalPathResult] = useState<{itemCount: number, durationDays: number} | null>(null);

  // Load items when project changes
  useEffect(() => {
    if (selectedProject) {
      loadItems();
    } else {
      setItems([]);
      setCriticalPathItems([]);
    }
  }, [selectedProject]);

  const loadItems = async () => {
    if (!selectedProject) return;

    setLoading(true);
    try {
      const projectItems = await database.collections
        .get<ItemModel>('items')
        .query(Q.on('sites', 'project_id', selectedProject.id))
        .fetch();

      setItems(projectItems);

      // Load critical path flags
      const criticalItems = projectItems
        .filter(item => item.criticalPathFlag)
        .map(item => item.id);
      setCriticalPathItems(criticalItems);
    } catch (error) {
      logger.error('[Baseline] Error loading items', error as Error);
      showSnackbar('Failed to load items', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCalculateCriticalPath = async () => {
    if (!selectedProject) return;

    setIsCalculating(true);
    try {
      const result = await PlanningService.calculateCriticalPath(selectedProject.id);
      setCriticalPathItems(result.criticalPathItems.map(i => i.id));

      const durationDays = Math.floor(result.totalDuration / (1000 * 60 * 60 * 24));

      setCriticalPathResult({
        itemCount: result.criticalPathItems.length,
        durationDays
      });
      showSnackbar(
        `Critical Path: ${result.criticalPathItems.length} items, ${durationDays} days duration`,
        'success'
      );

      await loadItems(); // Reload to show updated flags
    } catch (error) {
      logger.error('[Baseline] Error calculating critical path', error as Error);
      showSnackbar('Failed to calculate critical path', 'error');
    } finally {
      setIsCalculating(false);
    }
  };

  const handleLockBaseline = () => {
    if (!selectedProject) return;
    setShowLockBaselineDialog(true);
  };

  const confirmLockBaseline = async () => {
    if (!selectedProject) return;

    setShowLockBaselineDialog(false);
    try {
      await PlanningService.lockBaseline(selectedProject.id);
      showSnackbar('Baseline locked successfully', 'success');
      await loadItems();
    } catch (error) {
      logger.error('[Baseline] Error locking baseline', error as Error);
      showSnackbar('Failed to lock baseline', 'error');
    }
  };

  const handleManageDependencies = (item: ItemModel) => {
    setSelectedItem(item);
    setShowDependencyModal(true);
  };

  const handleCloseDependencyModal = () => {
    setShowDependencyModal(false);
    setSelectedItem(null);
  };

  const isBaselineLocked = items.length > 0 && items.every(i => i.isBaselineLocked);
  const hasItems = items.length > 0;

  return (
    <View style={styles.container}>
      <ProjectSelector
        projects={projects}
        selectedProject={selectedProject}
        onProjectChange={setSelectedProject}
      />

      {selectedProject && (
        <>
          <View style={styles.actionBar}>
            <Button
              mode="contained"
              onPress={handleCalculateCriticalPath}
              loading={isCalculating}
              disabled={!hasItems || isCalculating}
              style={styles.actionButton}
              icon="chart-timeline-variant"
            >
              Calculate Critical Path
            </Button>
            <Button
              mode="contained"
              onPress={handleLockBaseline}
              disabled={isBaselineLocked || !hasItems}
              style={[styles.actionButton, styles.lockButton]}
              icon={isBaselineLocked ? 'lock' : 'lock-open'}
            >
              {isBaselineLocked ? 'Baseline Locked' : 'Lock Baseline'}
            </Button>
          </View>

          {criticalPathItems.length > 0 && (
            <Card style={styles.infoCard}>
              <Card.Content>
                <View style={styles.infoHeader}>
                  <Text variant="titleMedium" style={styles.infoTitle}>
                    🎯 Critical Path Analysis
                  </Text>
                </View>
                <Text variant="bodyMedium" style={styles.infoText}>
                  Found {criticalPathItems.length} critical {criticalPathItems.length === 1 ? 'item' : 'items'}
                </Text>
                <Text variant="bodySmall" style={styles.infoSubtext}>
                  Items with red borders are on the critical path. Any delays in these items will directly impact the project completion date.
                </Text>
              </Card.Content>
            </Card>
          )}

          {isBaselineLocked && (
            <Card style={styles.warningCard}>
              <Card.Content>
                <Text variant="bodyMedium" style={styles.warningText}>
                  ⚠️ Baseline is locked. Use Schedule Update screen to make changes.
                </Text>
              </Card.Content>
            </Card>
          )}

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#1976D2" />
              <Text style={styles.loadingText}>Loading items...</Text>
            </View>
          ) : items.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text variant="headlineSmall" style={styles.emptyTitle}>
                No Items Found
              </Text>
              <Text variant="bodyMedium" style={styles.emptyText}>
                Add items to this project to start planning
              </Text>
            </View>
          ) : (
            <ScrollView style={styles.itemsList} contentContainerStyle={styles.itemsListContent}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Project Items ({items.length})
              </Text>
              {items.map(item => (
                <ItemPlanningCard
                  key={item.id}
                  item={item}
                  isCriticalPath={criticalPathItems.includes(item.id)}
                  isLocked={isBaselineLocked}
                  onManageDependencies={() => handleManageDependencies(item)}
                  onUpdate={loadItems}
                />
              ))}
            </ScrollView>
          )}
        </>
      )}

      {!selectedProject && (
        <View style={styles.emptyContainer}>
          <Text variant="headlineSmall" style={styles.emptyTitle}>
            Select a Project
          </Text>
          <Text variant="bodyMedium" style={styles.emptyText}>
            Choose a project above to start baseline planning
          </Text>
        </View>
      )}

      {showDependencyModal && selectedItem && (
        <DependencyModal
          visible={showDependencyModal}
          item={selectedItem}
          allItems={items}
          onClose={handleCloseDependencyModal}
          onSave={loadItems}
        />
      )}

      <ConfirmDialog
        visible={showLockBaselineDialog}
        title="Lock Baseline"
        message="This will save current planned dates as the baseline. This action cannot be easily undone. Continue?"
        confirmText="Lock Baseline"
        cancelText="Cancel"
        onConfirm={confirmLockBaseline}
        onCancel={() => setShowLockBaselineDialog(false)}
        destructive={true}
      />
    </View>
  );
};

const enhance = withObservables([], () => ({
  projects: database.collections.get<ProjectModel>('projects').query().observe(),
}));

const BaselineScreen = enhance(BaselineScreenComponent);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  actionBar: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  actionButton: {
    flex: 1,
  },
  lockButton: {
    backgroundColor: '#FF9800',
  },
  infoCard: {
    margin: 16,
    marginBottom: 0,
    backgroundColor: '#E3F2FD',
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#1976D2',
  },
  infoHeader: {
    marginBottom: 8,
  },
  infoTitle: {
    fontWeight: 'bold',
    color: '#1976D2',
    fontSize: 16,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976D2',
    marginBottom: 4,
  },
  infoSubtext: {
    fontSize: 12,
    color: '#666',
  },
  warningCard: {
    margin: 16,
    marginTop: 8,
    marginBottom: 0,
    backgroundColor: '#FFF3E0',
    elevation: 2,
  },
  warningText: {
    color: '#F57C00',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    marginBottom: 8,
    color: '#666',
  },
  emptyText: {
    color: '#999',
    textAlign: 'center',
  },
  itemsList: {
    flex: 1,
  },
  itemsListContent: {
    padding: 16,
    paddingTop: 8,
  },
  sectionTitle: {
    marginBottom: 12,
    fontWeight: 'bold',
    color: '#333',
  },
});

export default BaselineScreen;
