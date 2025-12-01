import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Alert,
  TouchableOpacity,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Chip,
  Divider,
  Dialog,
  Portal,
  TextInput,
  ProgressBar,
  ActivityIndicator,
  DataTable,
} from 'react-native-paper';
import { useManager } from './context/ManagerContext';
import { database } from '../../models/database';
import { Q } from '@nozbe/watermelondb';

interface Milestone {
  id: string;
  milestoneCode: string;
  milestoneName: string;
  description?: string;
  sequenceOrder: number;
  weightage: number;
  isActive: boolean;
  isCustom: boolean;
  createdBy: string;
}

interface SiteProgress {
  siteId: string;
  siteName: string;
  milestoneId: string;
  progressPercentage: number;
  status: string;
  plannedStartDate?: number;
  plannedEndDate?: number;
  actualStartDate?: number;
  actualEndDate?: number;
  notes?: string;
}

interface MilestoneWithProgress extends Milestone {
  overallProgress: number;
  sitesCompleted: number;
  sitesInProgress: number;
  sitesNotStarted: number;
  totalSites: number;
  siteProgress: SiteProgress[];
}

const MilestoneManagementScreen = () => {
  const { projectId, projectInfo } = useManager();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [milestones, setMilestones] = useState<MilestoneWithProgress[]>([]);

  // Add Milestone Dialog
  const [addDialogVisible, setAddDialogVisible] = useState(false);
  const [newMilestoneName, setNewMilestoneName] = useState('');
  const [newMilestoneDescription, setNewMilestoneDescription] = useState('');
  const [newMilestoneWeightage, setNewMilestoneWeightage] = useState('10');

  // Edit Milestone Dialog
  const [editDialogVisible, setEditDialogVisible] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const [editMilestoneName, setEditMilestoneName] = useState('');
  const [editMilestoneDescription, setEditMilestoneDescription] = useState('');
  const [editMilestoneWeightage, setEditMilestoneWeightage] = useState('');

  // Progress Dialog
  const [progressDialogVisible, setProgressDialogVisible] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<MilestoneWithProgress | null>(null);

  // Expanded milestone for timeline view
  const [expandedMilestoneId, setExpandedMilestoneId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const loadData = async () => {
    if (!projectId) return;

    try {
      setLoading(true);

      // Load milestones for the project
      const milestonesData = await database.collections
        .get('milestones')
        .query(Q.where('project_id', projectId), Q.sortBy('sequence_order', Q.asc))
        .fetch();

      // Load sites for the project
      const sitesData = await database.collections
        .get('sites')
        .query(Q.where('project_id', projectId))
        .fetch();

      // Load progress for each milestone
      const milestonesWithProgress: MilestoneWithProgress[] = [];

      for (const milestone of milestonesData) {
        const milestoneProgressData = await database.collections
          .get('milestone_progress')
          .query(Q.where('milestone_id', milestone.id))
          .fetch();

        // Calculate overall progress across all sites
        let totalProgress = 0;
        let sitesCompleted = 0;
        let sitesInProgress = 0;
        let sitesNotStarted = 0;

        const siteProgress: SiteProgress[] = [];

        for (const site of sitesData) {
          const siteProgressRecord = milestoneProgressData.find(
            (mp: any) => mp.siteId === site.id
          );

          if (siteProgressRecord) {
            const progress = (siteProgressRecord as any).progressPercentage || 0;
            totalProgress += progress;

            if (progress === 100) sitesCompleted++;
            else if (progress > 0) sitesInProgress++;
            else sitesNotStarted++;

            siteProgress.push({
              siteId: site.id,
              siteName: (site as any).name,
              milestoneId: milestone.id,
              progressPercentage: progress,
              status: (siteProgressRecord as any).status || 'not_started',
              plannedStartDate: (siteProgressRecord as any).plannedStartDate,
              plannedEndDate: (siteProgressRecord as any).plannedEndDate,
              actualStartDate: (siteProgressRecord as any).actualStartDate,
              actualEndDate: (siteProgressRecord as any).actualEndDate,
              notes: (siteProgressRecord as any).notes,
            });
          } else {
            sitesNotStarted++;
            siteProgress.push({
              siteId: site.id,
              siteName: (site as any).name,
              milestoneId: milestone.id,
              progressPercentage: 0,
              status: 'not_started',
            });
          }
        }

        const overallProgress =
          sitesData.length > 0 ? Math.round(totalProgress / sitesData.length) : 0;

        milestonesWithProgress.push({
          id: milestone.id,
          milestoneCode: (milestone as any).milestoneCode,
          milestoneName: (milestone as any).milestoneName,
          description: (milestone as any).description,
          sequenceOrder: (milestone as any).sequenceOrder,
          weightage: (milestone as any).weightage,
          isActive: (milestone as any).isActive,
          isCustom: (milestone as any).isCustom,
          createdBy: (milestone as any).createdBy,
          overallProgress,
          sitesCompleted,
          sitesInProgress,
          sitesNotStarted,
          totalSites: sitesData.length,
          siteProgress,
        });
      }

      setMilestones(milestonesWithProgress);
    } catch (error) {
      console.error('[MilestoneManagement] Error loading data:', error);
      Alert.alert('Error', 'Failed to load milestone data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleAddMilestone = async () => {
    if (!projectId || !projectInfo) return;

    if (!newMilestoneName.trim()) {
      Alert.alert('Validation Error', 'Please enter a milestone name');
      return;
    }

    const weightage = parseInt(newMilestoneWeightage, 10);
    if (isNaN(weightage) || weightage < 1 || weightage > 100) {
      Alert.alert('Validation Error', 'Weightage must be between 1 and 100');
      return;
    }

    try {
      // Generate milestone code
      const customCount = milestones.filter((m) => m.isCustom).length;
      const milestoneCode = `PM${800 + customCount}`;

      // Get next sequence order
      const maxSequence = Math.max(...milestones.map((m) => m.sequenceOrder), 7);

      await database.write(async () => {
        await database.collections.get('milestones').create((milestone: any) => {
          milestone.projectId = projectId;
          milestone.milestoneCode = milestoneCode;
          milestone.milestoneName = newMilestoneName.trim();
          milestone.description = newMilestoneDescription.trim();
          milestone.sequenceOrder = maxSequence + 1;
          milestone.weightage = weightage;
          milestone.isActive = true;
          milestone.isCustom = true;
          milestone.createdBy = 'manager'; // TODO: Get from auth context
          milestone.appSyncStatus = 'pending';
          milestone.version = 1;
        });
      });

      Alert.alert('Success', 'Custom milestone added successfully');
      setAddDialogVisible(false);
      setNewMilestoneName('');
      setNewMilestoneDescription('');
      setNewMilestoneWeightage('10');
      loadData();
    } catch (error) {
      console.error('[MilestoneManagement] Error adding milestone:', error);
      Alert.alert('Error', 'Failed to add custom milestone');
    }
  };

  const handleEditMilestone = (milestone: Milestone) => {
    if (!milestone.isCustom) {
      Alert.alert(
        'Cannot Edit',
        'Standard milestones (PM100-PM700) cannot be edited. Only custom milestones can be modified.'
      );
      return;
    }

    setEditingMilestone(milestone);
    setEditMilestoneName(milestone.milestoneName);
    setEditMilestoneDescription(milestone.description || '');
    setEditMilestoneWeightage(milestone.weightage.toString());
    setEditDialogVisible(true);
  };

  const handleUpdateMilestone = async () => {
    if (!editingMilestone) return;

    if (!editMilestoneName.trim()) {
      Alert.alert('Validation Error', 'Please enter a milestone name');
      return;
    }

    const weightage = parseInt(editMilestoneWeightage, 10);
    if (isNaN(weightage) || weightage < 1 || weightage < 100) {
      Alert.alert('Validation Error', 'Weightage must be between 1 and 100');
      return;
    }

    try {
      const milestoneRecord = await database.collections
        .get('milestones')
        .find(editingMilestone.id);

      await database.write(async () => {
        await milestoneRecord.update((milestone: any) => {
          milestone.milestoneName = editMilestoneName.trim();
          milestone.description = editMilestoneDescription.trim();
          milestone.weightage = weightage;
          milestone.appSyncStatus = 'pending';
          milestone.version = milestone.version + 1;
        });
      });

      Alert.alert('Success', 'Milestone updated successfully');
      setEditDialogVisible(false);
      setEditingMilestone(null);
      loadData();
    } catch (error) {
      console.error('[MilestoneManagement] Error updating milestone:', error);
      Alert.alert('Error', 'Failed to update milestone');
    }
  };

  const handleDeleteMilestone = (milestone: Milestone) => {
    if (!milestone.isCustom) {
      Alert.alert(
        'Cannot Delete',
        'Standard milestones (PM100-PM700) cannot be deleted. Only custom milestones can be removed.'
      );
      return;
    }

    Alert.alert(
      'Delete Milestone',
      `Are you sure you want to delete "${milestone.milestoneName}"? This will remove all progress data for this milestone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const milestoneRecord = await database.collections
                .get('milestones')
                .find(milestone.id);

              await database.write(async () => {
                await milestoneRecord.markAsDeleted();
              });

              Alert.alert('Success', 'Milestone deleted successfully');
              loadData();
            } catch (error) {
              console.error('[MilestoneManagement] Error deleting milestone:', error);
              Alert.alert('Error', 'Failed to delete milestone');
            }
          },
        },
      ]
    );
  };

  const handleViewProgress = (milestone: MilestoneWithProgress) => {
    setSelectedMilestone(milestone);
    setProgressDialogVisible(true);
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed':
        return '#4CAF50';
      case 'in_progress':
        return '#2196F3';
      case 'on_hold':
        return '#FFC107';
      default:
        return '#9E9E9E';
    }
  };

  const getProgressColor = (progress: number): string => {
    if (progress >= 75) return '#4CAF50';
    if (progress >= 50) return '#FFC107';
    if (progress > 0) return '#FF9800';
    return '#9E9E9E';
  };

  const formatDate = (timestamp?: number): string => {
    if (!timestamp) return '-';
    return new Date(timestamp).toLocaleDateString('en-IN');
  };

  const renderMilestoneCard = (milestone: MilestoneWithProgress) => {
    const isExpanded = expandedMilestoneId === milestone.id;

    return (
      <Card key={milestone.id} style={styles.milestoneCard}>
        <Card.Content>
          {/* Milestone Header */}
          <View style={styles.milestoneHeader}>
            <View style={styles.milestoneHeaderLeft}>
              <Chip
                style={[
                  styles.milestoneCodeChip,
                  { backgroundColor: milestone.isCustom ? '#9C27B0' : '#2196F3' },
                ]}
                textStyle={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }}
              >
                {milestone.milestoneCode}
              </Chip>
              <Title style={styles.milestoneName}>{milestone.milestoneName}</Title>
            </View>
            <Chip
              style={styles.weightageChip}
              textStyle={{ color: '#666', fontSize: 11 }}
            >
              {milestone.weightage}%
            </Chip>
          </View>

          {milestone.description && (
            <Paragraph style={styles.milestoneDescription}>{milestone.description}</Paragraph>
          )}

          <Divider style={styles.divider} />

          {/* Overall Progress */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Paragraph style={styles.progressLabel}>Overall Progress</Paragraph>
              <Title style={styles.progressValue}>{milestone.overallProgress}%</Title>
            </View>
            <ProgressBar
              progress={milestone.overallProgress / 100}
              color={getProgressColor(milestone.overallProgress)}
              style={styles.progressBar}
            />
          </View>

          <Divider style={styles.divider} />

          {/* Sites Summary */}
          <View style={styles.sitesSummary}>
            <View style={styles.sitesMetric}>
              <Paragraph style={styles.sitesMetricValue}>{milestone.sitesCompleted}</Paragraph>
              <Paragraph style={styles.sitesMetricLabel}>✅ Completed</Paragraph>
            </View>
            <View style={styles.sitesMetric}>
              <Paragraph style={styles.sitesMetricValue}>{milestone.sitesInProgress}</Paragraph>
              <Paragraph style={styles.sitesMetricLabel}>🔄 In Progress</Paragraph>
            </View>
            <View style={styles.sitesMetric}>
              <Paragraph style={styles.sitesMetricValue}>{milestone.sitesNotStarted}</Paragraph>
              <Paragraph style={styles.sitesMetricLabel}>⏸️ Not Started</Paragraph>
            </View>
            <View style={styles.sitesMetric}>
              <Paragraph style={styles.sitesMetricValue}>{milestone.totalSites}</Paragraph>
              <Paragraph style={styles.sitesMetricLabel}>Total Sites</Paragraph>
            </View>
          </View>

          <Divider style={styles.divider} />

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <Button
              mode="outlined"
              onPress={() => handleViewProgress(milestone)}
              style={styles.actionButton}
              icon="chart-timeline-variant"
            >
              View Progress
            </Button>
            {milestone.isCustom && (
              <>
                <Button
                  mode="outlined"
                  onPress={() => handleEditMilestone(milestone)}
                  style={styles.actionButton}
                  icon="pencil"
                >
                  Edit
                </Button>
                <Button
                  mode="outlined"
                  onPress={() => handleDeleteMilestone(milestone)}
                  style={[styles.actionButton, { borderColor: '#F44336' }]}
                  icon="delete"
                  textColor="#F44336"
                >
                  Delete
                </Button>
              </>
            )}
          </View>

          {/* Timeline View (Expandable) */}
          <TouchableOpacity
            onPress={() => setExpandedMilestoneId(isExpanded ? null : milestone.id)}
            style={styles.timelineToggle}
          >
            <Paragraph style={styles.timelineToggleText}>
              {isExpanded ? '▼ Hide Timeline' : '▶ Show Timeline'}
            </Paragraph>
          </TouchableOpacity>

          {isExpanded && (
            <View style={styles.timelineView}>
              <Title style={styles.timelineTitle}>Site-Level Timeline</Title>
              {milestone.siteProgress.map((sp) => (
                <View key={sp.siteId} style={styles.timelineItem}>
                  <View style={styles.timelineItemHeader}>
                    <Paragraph style={styles.timelineItemSite}>{sp.siteName}</Paragraph>
                    <Chip
                      style={[
                        styles.timelineItemStatus,
                        { backgroundColor: getStatusColor(sp.status) },
                      ]}
                      textStyle={{ color: '#fff', fontSize: 10 }}
                    >
                      {sp.status.replace('_', ' ').toUpperCase()}
                    </Chip>
                  </View>
                  <ProgressBar
                    progress={sp.progressPercentage / 100}
                    color={getProgressColor(sp.progressPercentage)}
                    style={styles.timelineProgressBar}
                  />
                  <View style={styles.timelineDates}>
                    <Paragraph style={styles.timelineDate}>
                      Planned: {formatDate(sp.plannedStartDate)} - {formatDate(sp.plannedEndDate)}
                    </Paragraph>
                    <Paragraph style={styles.timelineDate}>
                      Actual: {formatDate(sp.actualStartDate)} -{' '}
                      {sp.actualEndDate ? formatDate(sp.actualEndDate) : 'Ongoing'}
                    </Paragraph>
                  </View>
                  {sp.notes && (
                    <Paragraph style={styles.timelineNotes}>📝 {sp.notes}</Paragraph>
                  )}
                </View>
              ))}
            </View>
          )}
        </Card.Content>
      </Card>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Paragraph style={styles.loadingText}>Loading milestones...</Paragraph>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Title style={styles.screenTitle}>Milestone Management</Title>
          <Paragraph style={styles.screenSubtitle}>
            {projectInfo?.name || 'No Project Selected'}
          </Paragraph>
          <Button
            mode="contained"
            onPress={() => setAddDialogVisible(true)}
            icon="plus"
            style={styles.addButton}
          >
            Add Custom Milestone
          </Button>
        </View>

        {/* Milestones Summary */}
        <Card style={styles.summaryCard}>
          <Card.Content>
            <Title style={styles.summaryTitle}>Summary</Title>
            <View style={styles.summaryRow}>
              <View style={styles.summaryMetric}>
                <Title style={styles.summaryValue}>{milestones.length}</Title>
                <Paragraph style={styles.summaryLabel}>Total Milestones</Paragraph>
              </View>
              <Divider style={styles.verticalDivider} />
              <View style={styles.summaryMetric}>
                <Title style={styles.summaryValue}>
                  {milestones.filter((m) => !m.isCustom).length}
                </Title>
                <Paragraph style={styles.summaryLabel}>Standard (PM100-PM700)</Paragraph>
              </View>
              <Divider style={styles.verticalDivider} />
              <View style={styles.summaryMetric}>
                <Title style={styles.summaryValue}>
                  {milestones.filter((m) => m.isCustom).length}
                </Title>
                <Paragraph style={styles.summaryLabel}>Custom</Paragraph>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Milestone Cards */}
        {milestones.map(renderMilestoneCard)}

        {milestones.length === 0 && (
          <View style={styles.emptyState}>
            <Paragraph style={styles.emptyStateText}>
              No milestones found. Add a custom milestone to get started.
            </Paragraph>
          </View>
        )}
      </ScrollView>

      {/* Add Milestone Dialog */}
      <Portal>
        <Dialog visible={addDialogVisible} onDismiss={() => setAddDialogVisible(false)}>
          <Dialog.Title>Add Custom Milestone</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Milestone Name *"
              value={newMilestoneName}
              onChangeText={setNewMilestoneName}
              mode="outlined"
              style={styles.dialogInput}
            />
            <TextInput
              label="Description"
              value={newMilestoneDescription}
              onChangeText={setNewMilestoneDescription}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={styles.dialogInput}
            />
            <TextInput
              label="Weightage (%) *"
              value={newMilestoneWeightage}
              onChangeText={setNewMilestoneWeightage}
              mode="outlined"
              keyboardType="numeric"
              style={styles.dialogInput}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setAddDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleAddMilestone}>Add</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Edit Milestone Dialog */}
      <Portal>
        <Dialog visible={editDialogVisible} onDismiss={() => setEditDialogVisible(false)}>
          <Dialog.Title>Edit Milestone</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Milestone Name *"
              value={editMilestoneName}
              onChangeText={setEditMilestoneName}
              mode="outlined"
              style={styles.dialogInput}
            />
            <TextInput
              label="Description"
              value={editMilestoneDescription}
              onChangeText={setEditMilestoneDescription}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={styles.dialogInput}
            />
            <TextInput
              label="Weightage (%) *"
              value={editMilestoneWeightage}
              onChangeText={setEditMilestoneWeightage}
              mode="outlined"
              keyboardType="numeric"
              style={styles.dialogInput}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setEditDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleUpdateMilestone}>Update</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Progress Dialog */}
      <Portal>
        <Dialog
          visible={progressDialogVisible}
          onDismiss={() => setProgressDialogVisible(false)}
          style={styles.progressDialog}
        >
          <Dialog.Title>
            {selectedMilestone?.milestoneName} - Site Progress
          </Dialog.Title>
          <Dialog.ScrollArea>
            <ScrollView>
              <DataTable>
                <DataTable.Header>
                  <DataTable.Title>Site</DataTable.Title>
                  <DataTable.Title>Progress</DataTable.Title>
                  <DataTable.Title>Status</DataTable.Title>
                </DataTable.Header>

                {selectedMilestone?.siteProgress.map((sp) => (
                  <DataTable.Row key={sp.siteId}>
                    <DataTable.Cell>{sp.siteName}</DataTable.Cell>
                    <DataTable.Cell>{sp.progressPercentage}%</DataTable.Cell>
                    <DataTable.Cell>
                      <Chip
                        style={[
                          styles.statusChip,
                          { backgroundColor: getStatusColor(sp.status) },
                        ]}
                        textStyle={{ color: '#fff', fontSize: 10 }}
                      >
                        {sp.status.replace('_', ' ').toUpperCase()}
                      </Chip>
                    </DataTable.Cell>
                  </DataTable.Row>
                ))}
              </DataTable>
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setProgressDialogVisible(false)}>Close</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  screenSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  addButton: {
    alignSelf: 'flex-start',
  },
  summaryCard: {
    margin: 16,
    marginBottom: 8,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryMetric: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  summaryLabel: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
  },
  verticalDivider: {
    width: 1,
    height: '100%',
    backgroundColor: '#e0e0e0',
    marginHorizontal: 8,
  },
  milestoneCard: {
    margin: 16,
    marginBottom: 8,
    elevation: 2,
  },
  milestoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  milestoneHeaderLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  milestoneCodeChip: {
    height: 24,
    marginRight: 8,
  },
  milestoneName: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  weightageChip: {
    height: 24,
    backgroundColor: '#f0f0f0',
  },
  milestoneDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
  },
  divider: {
    marginVertical: 12,
    backgroundColor: '#e0e0e0',
  },
  progressSection: {
    marginBottom: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  progressValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  sitesSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  sitesMetric: {
    alignItems: 'center',
  },
  sitesMetricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  sitesMetricLabel: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    marginRight: 8,
    marginBottom: 8,
  },
  timelineToggle: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  timelineToggleText: {
    color: '#2196F3',
    fontWeight: '600',
    fontSize: 14,
  },
  timelineView: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  timelineItem: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  timelineItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  timelineItemSite: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  timelineItemStatus: {
    height: 20,
  },
  timelineProgressBar: {
    height: 6,
    borderRadius: 3,
    marginBottom: 8,
  },
  timelineDates: {
    marginTop: 4,
  },
  timelineDate: {
    fontSize: 11,
    color: '#666',
  },
  timelineNotes: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 4,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  dialogInput: {
    marginBottom: 12,
  },
  progressDialog: {
    maxHeight: '80%',
  },
  statusChip: {
    height: 20,
  },
});

export default MilestoneManagementScreen;
