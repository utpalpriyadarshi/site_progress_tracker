import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
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
  DataTable,
  Checkbox,
  Text,
  Snackbar,
} from 'react-native-paper';
import { useManager } from './context/ManagerContext';
import { database } from '../../models/database';
import { Q } from '@nozbe/watermelondb';
import { logger } from '../services/LoggingService';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { useAccessibility } from '../utils/accessibility';
import { EmptyState } from '../components/common/EmptyState';
import { SkeletonList } from '../components/common/LoadingState';
import { ErrorDisplay } from '../components/common/ErrorDisplay';
import { COLORS } from '../theme/colors';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { commonStyles } from '../styles/common';
import { useSnackbar } from '../hooks/useSnackbar';
import { ConfirmDialog } from '../components/dialogs/ConfirmDialog';

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
  const { projectId } = useManager();
  const { announce } = useAccessibility();
  const previousMilestoneCountRef = useRef<number>(0);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [projectInfo, setProjectInfo] = useState<any>(null);

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
  // Per-site inline editing inside the progress dialog
  const [editingSiteId, setEditingSiteId] = useState<string | null>(null);
  const [editingProgress, setEditingProgress] = useState('');
  const [editingStatus, setEditingStatus] = useState('not_started');
  const [savingProgress, setSavingProgress] = useState(false);

  // Expanded milestone for timeline view
  const [expandedMilestoneId, setExpandedMilestoneId] = useState<string | null>(null);

  // Batch Approval State
  const [_batchApprovalMode, _setBatchApprovalMode] = useState(false);
  const [batchApprovalDialogVisible, setBatchApprovalDialogVisible] = useState(false);
  const [batchSelectedMilestone, setBatchSelectedMilestone] = useState<MilestoneWithProgress | null>(null);
  const [selectedSitesForApproval, setSelectedSitesForApproval] = useState<Set<string>>(new Set());
  const [batchApproving, setBatchApproving] = useState(false);
  const [pendingDeleteMilestone, setPendingDeleteMilestone] = useState<MilestoneWithProgress | null>(null);
  const { show: showSnackbar, snackbarProps } = useSnackbar();

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  // Reactivity: re-fetch silently when milestone data changes (e.g. Planning user updates progress)
  useEffect(() => {
    if (!projectId) return;
    const subscription = database
      .withChangesForTables(['milestones', 'milestone_progress'])
      .subscribe(() => {
        loadData();
      });
    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const loadData = async () => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setLoadError(null);

      // Fetch project info from database
      const project = await database.collections.get('projects').find(projectId);
      setProjectInfo(project);

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

      // Bulk-fetch all milestone_progress for this project in one query (avoids N+1)
      const milestoneIds = milestonesData.map((m: any) => m.id);
      const allProgressRecords = milestoneIds.length > 0
        ? await database.collections
            .get('milestone_progress')
            .query(Q.where('milestone_id', Q.oneOf(milestoneIds)))
            .fetch()
        : [];

      // Group progress records by milestoneId for O(1) lookup
      const progressByMilestone = new Map<string, Map<string, any>>();
      for (const record of allProgressRecords as any[]) {
        if (!progressByMilestone.has(record.milestoneId)) {
          progressByMilestone.set(record.milestoneId, new Map());
        }
        progressByMilestone.get(record.milestoneId)!.set(record.siteId, record);
      }

      const milestonesWithProgress: MilestoneWithProgress[] = [];

      for (const milestone of milestonesData) {
        const milestoneProgressMap = progressByMilestone.get(milestone.id) || new Map();

        // Calculate overall progress across all sites
        let totalProgress = 0;
        let sitesWithRecords = 0;
        let sitesCompleted = 0;
        let sitesInProgress = 0;
        let sitesNotStarted = 0;

        const siteProgress: SiteProgress[] = [];

        for (const site of sitesData) {
          const siteProgressRecord = milestoneProgressMap.get(site.id);

          if (siteProgressRecord) {
            const progress = siteProgressRecord.progressPercentage || 0;
            totalProgress += progress;
            sitesWithRecords++;

            if (progress === 100) sitesCompleted++;
            else if (progress > 0) sitesInProgress++;
            else sitesNotStarted++;

            siteProgress.push({
              siteId: site.id,
              siteName: (site as any).name,
              milestoneId: milestone.id,
              progressPercentage: progress,
              status: siteProgressRecord.status || 'not_started',
              plannedStartDate: siteProgressRecord.plannedStartDate,
              plannedEndDate: siteProgressRecord.plannedEndDate,
              actualStartDate: siteProgressRecord.actualStartDate,
              actualEndDate: siteProgressRecord.actualEndDate,
              notes: siteProgressRecord.notes,
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

        // Weighted average: only divide by sites that have progress records
        // so uninitialized sites don't drag the average down
        const overallProgress =
          sitesWithRecords > 0 ? Math.round(totalProgress / sitesWithRecords) : 0;

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

      // Announce milestone data for screen readers
      if (milestonesWithProgress.length !== previousMilestoneCountRef.current) {
        const avgProgress = milestonesWithProgress.length > 0
          ? Math.round(milestonesWithProgress.reduce((sum, m) => sum + m.overallProgress, 0) / milestonesWithProgress.length)
          : 0;
        announce(`Milestone data loaded: ${milestonesWithProgress.length} milestones, average progress ${avgProgress}%`);
        previousMilestoneCountRef.current = milestonesWithProgress.length;
      }
    } catch (error) {
      logger.error('[MilestoneManagement] Error loading data', error as Error);
      setLoadError('Failed to load milestone data. Check your connection and try again.');
      announce('Failed to load milestone data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    announce('Refreshing milestone data');
    loadData();
  };

  const handleAddMilestone = async () => {
    if (!projectId || !projectInfo) return;

    if (!newMilestoneName.trim()) {
      showSnackbar('Please enter a milestone name');
      return;
    }

    const weightage = parseInt(newMilestoneWeightage, 10);
    if (isNaN(weightage) || weightage < 1 || weightage > 100) {
      showSnackbar('Weightage must be between 1 and 100');
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

      showSnackbar('Custom milestone added');
      setAddDialogVisible(false);
      setNewMilestoneName('');
      setNewMilestoneDescription('');
      setNewMilestoneWeightage('10');
      loadData();
    } catch (error) {
      logger.error('[MilestoneManagement] Error adding milestone', error as Error);
      showSnackbar('Failed to add custom milestone');
    }
  };

  const handleEditMilestone = (milestone: Milestone) => {
    if (!milestone.isCustom) {
      showSnackbar('Standard milestones cannot be edited. Only custom milestones can be modified.');
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
      showSnackbar('Please enter a milestone name');
      return;
    }

    const weightage = parseInt(editMilestoneWeightage, 10);
    if (isNaN(weightage) || weightage < 1 || weightage > 100) {
      showSnackbar('Weightage must be between 1 and 100');
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

      showSnackbar('Milestone updated');
      setEditDialogVisible(false);
      setEditingMilestone(null);
      loadData();
    } catch (error) {
      logger.error('[MilestoneManagement] Error updating milestone', error as Error);
      showSnackbar('Failed to update milestone');
    }
  };

  const handleDeleteMilestone = (milestone: MilestoneWithProgress) => {
    if (!milestone.isCustom) {
      showSnackbar('Standard milestones (PM100-PM700) cannot be deleted.');
      return;
    }
    setPendingDeleteMilestone(milestone);
  };

  const handleConfirmDeleteMilestone = async () => {
    if (!pendingDeleteMilestone) return;
    const milestone = pendingDeleteMilestone;
    setPendingDeleteMilestone(null);
    try {
      const milestoneRecord = await database.collections
        .get('milestones')
        .find(milestone.id);
      await database.write(async () => {
        await milestoneRecord.markAsDeleted();
      });
      showSnackbar('Milestone deleted');
      loadData();
    } catch (error) {
      logger.error('[MilestoneManagement] Error deleting milestone', error as Error);
      showSnackbar('Failed to delete milestone');
    }
  };

  const handleViewProgress = (milestone: MilestoneWithProgress) => {
    setSelectedMilestone(milestone);
    setEditingSiteId(null);
    setProgressDialogVisible(true);
  };

  const startEditSite = (sp: SiteProgress) => {
    setEditingSiteId(sp.siteId);
    setEditingProgress(String(sp.progressPercentage));
    setEditingStatus(sp.status || 'not_started');
  };

  const cancelEditSite = () => setEditingSiteId(null);

  const handleSaveSiteProgress = async () => {
    if (!selectedMilestone || !editingSiteId || !projectId) return;

    const pct = parseInt(editingProgress, 10);
    if (isNaN(pct) || pct < 0 || pct > 100) {
      showSnackbar('Progress must be between 0 and 100');
      return;
    }

    setSavingProgress(true);
    try {
      const existing = await database.collections
        .get('milestone_progress')
        .query(
          Q.where('milestone_id', selectedMilestone.id),
          Q.where('site_id', editingSiteId)
        )
        .fetch();

      await database.write(async () => {
        if (existing.length > 0) {
          await existing[0].update((r: any) => {
            r.progressPercentage = pct;
            r.status = editingStatus;
            if (pct === 100 && !r.actualEndDate) r.actualEndDate = Date.now();
            if (pct > 0 && !r.actualStartDate) r.actualStartDate = Date.now();
            r.appSyncStatus = 'pending';
            r.version = (r.version || 0) + 1;
          });
        } else {
          await database.collections.get('milestone_progress').create((r: any) => {
            r.milestoneId = selectedMilestone.id;
            r.siteId = editingSiteId;
            r.projectId = projectId;
            r.progressPercentage = pct;
            r.status = editingStatus;
            if (pct > 0) r.actualStartDate = Date.now();
            if (pct === 100) r.actualEndDate = Date.now();
            r.appSyncStatus = 'pending';
            r.version = 1;
          });
        }
      });

      showSnackbar('Progress saved');
      setEditingSiteId(null);
      // Refresh the selected milestone's data in the dialog
      const updatedSiteProgress = selectedMilestone.siteProgress.map(sp =>
        sp.siteId === editingSiteId
          ? { ...sp, progressPercentage: pct, status: editingStatus }
          : sp
      );
      setSelectedMilestone({ ...selectedMilestone, siteProgress: updatedSiteProgress });
    } catch (error) {
      logger.error('[MilestoneManagement] Error saving site progress', error as Error);
      showSnackbar('Failed to save progress');
    } finally {
      setSavingProgress(false);
    }
  };

  // Batch Approval Functions
  const openBatchApprovalDialog = useCallback((milestone: MilestoneWithProgress) => {
    setBatchSelectedMilestone(milestone);
    // Pre-select all sites that are in progress or not started (not already completed)
    const eligibleSites = milestone.siteProgress
      .filter(sp => sp.status !== 'completed' && sp.progressPercentage < 100)
      .map(sp => sp.siteId);
    setSelectedSitesForApproval(new Set(eligibleSites));
    setBatchApprovalDialogVisible(true);
  }, []);

  const closeBatchApprovalDialog = useCallback(() => {
    setBatchApprovalDialogVisible(false);
    setBatchSelectedMilestone(null);
    setSelectedSitesForApproval(new Set());
  }, []);

  const toggleSiteSelection = useCallback((siteId: string) => {
    setSelectedSitesForApproval(prev => {
      const newSet = new Set(prev);
      if (newSet.has(siteId)) {
        newSet.delete(siteId);
      } else {
        newSet.add(siteId);
      }
      return newSet;
    });
  }, []);

  const selectAllEligibleSites = useCallback(() => {
    if (!batchSelectedMilestone) return;
    const eligibleSites = batchSelectedMilestone.siteProgress
      .filter(sp => sp.status !== 'completed' && sp.progressPercentage < 100)
      .map(sp => sp.siteId);
    setSelectedSitesForApproval(new Set(eligibleSites));
  }, [batchSelectedMilestone]);

  const deselectAllSites = useCallback(() => {
    setSelectedSitesForApproval(new Set());
  }, []);

  const handleBatchApproval = async () => {
    if (!batchSelectedMilestone || selectedSitesForApproval.size === 0) {
      showSnackbar('Please select at least one site to approve.');
      return;
    }

    setBatchApproving(true);

    try {
      await database.write(async () => {
        for (const siteId of selectedSitesForApproval) {
          // Find existing progress record or create new one
          const existingProgress = await database.collections
            .get('milestone_progress')
            .query(
              Q.where('milestone_id', batchSelectedMilestone.id),
              Q.where('site_id', siteId)
            )
            .fetch();

          if (existingProgress.length > 0) {
            // Update existing record
            await existingProgress[0].update((record: any) => {
              record.progressPercentage = 100;
              record.status = 'completed';
              record.actualEndDate = Date.now();
              record.appSyncStatus = 'pending';
              record.version = (record.version || 0) + 1;
            });
          } else {
            // Create new progress record
            await database.collections.get('milestone_progress').create((record: any) => {
              record.milestoneId = batchSelectedMilestone.id;
              record.siteId = siteId;
              record.projectId = projectId;
              record.progressPercentage = 100;
              record.status = 'completed';
              record.actualStartDate = Date.now();
              record.actualEndDate = Date.now();
              record.appSyncStatus = 'pending';
              record.version = 1;
            });
          }
        }
      });

      const count = selectedSitesForApproval.size;
      announce(`Batch approval completed: ${count} site${count === 1 ? '' : 's'} marked as completed for ${batchSelectedMilestone.milestoneName}`);
      showSnackbar(`${count} site${count === 1 ? '' : 's'} marked as completed for "${batchSelectedMilestone.milestoneName}".`);

      closeBatchApprovalDialog();
      loadData(); // Refresh data
    } catch (error) {
      logger.error('[MilestoneManagement] Error in batch approval', error as Error);
      showSnackbar('Failed to process batch approval. Please try again.');
      announce('Batch approval failed');
    } finally {
      setBatchApproving(false);
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed':
        return COLORS.SUCCESS;
      case 'in_progress':
        return COLORS.INFO;
      case 'on_hold':
        return '#FFC107';
      default:
        return COLORS.DISABLED;
    }
  };

  const getProgressColor = (progress: number): string => {
    if (progress >= 75) return COLORS.SUCCESS;
    if (progress >= 50) return '#FFC107';
    if (progress > 0) return COLORS.WARNING;
    return COLORS.DISABLED;
  };

  const formatDate = (timestamp?: number): string => {
    if (!timestamp) return '-';
    return new Date(timestamp).toLocaleDateString('en-IN');
  };

  const renderMilestoneCard = (milestone: MilestoneWithProgress) => {
    const isExpanded = expandedMilestoneId === milestone.id;

    return (
      <Card key={milestone.id} mode="elevated" style={styles.milestoneCard}>
        <Card.Content>
          {/* Milestone Header */}
          <View style={styles.milestoneHeaderChipRow}>
            <Chip
              style={[
                styles.milestoneCodeChip,
                { backgroundColor: milestone.isCustom ? COLORS.STATUS_EVALUATED : COLORS.INFO },
              ]}
              textStyle={styles.chipCodeText}
              accessibilityLabel={`Milestone code: ${milestone.milestoneCode}`}
            >
              {milestone.milestoneCode}
            </Chip>
            <Chip
              style={styles.weightageChip}
              textStyle={styles.chipWeightText}
              accessibilityLabel={`Milestone weightage: ${milestone.weightage}%`}
            >
              {milestone.weightage}%
            </Chip>
          </View>
          <Title style={styles.milestoneName}>{milestone.milestoneName}</Title>

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
              icon="table-edit"
            >
              Per-Site Progress
            </Button>
            {/* Batch Approve button - only show if there are sites not yet completed */}
            {milestone.sitesNotStarted + milestone.sitesInProgress > 0 && (
              <Button
                mode="contained"
                onPress={() => openBatchApprovalDialog(milestone)}
                style={[styles.actionButton, styles.batchApproveButton]}
                icon="check-all"
              >
                Batch Approve
              </Button>
            )}
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
                  style={[styles.actionButton, { borderColor: COLORS.ERROR }]}
                  icon="delete"
                  textColor={COLORS.ERROR}
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
              <Text style={styles.timelineTitle}>Site-Level Timeline</Text>
              {milestone.siteProgress.map((sp) => (
                <View key={sp.siteId} style={styles.timelineItem}>
                  <View style={styles.timelineItemHeader}>
                    <Text style={styles.timelineItemSite}>{sp.siteName}</Text>
                    <View style={[styles.timelineStatusBadge, { backgroundColor: getStatusColor(sp.status) }]}>
                      <Text style={styles.timelineStatusText}>
                        {sp.status.replace(/_/g, ' ').toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.timelineProgressRow}>
                    <ProgressBar
                      progress={sp.progressPercentage / 100}
                      color={getProgressColor(sp.progressPercentage)}
                      style={styles.timelineProgressBar}
                    />
                    <Text style={styles.timelineProgressPct}>{sp.progressPercentage}%</Text>
                  </View>
                  <View style={styles.timelineDates}>
                    <Text style={styles.timelineDate}>
                      Planned: {formatDate(sp.plannedStartDate)} — {formatDate(sp.plannedEndDate)}
                    </Text>
                    <Text style={styles.timelineDate}>
                      Actual: {formatDate(sp.actualStartDate)} —{' '}
                      {sp.actualEndDate ? formatDate(sp.actualEndDate) : 'Ongoing'}
                    </Text>
                  </View>
                  {sp.notes ? (
                    <Text style={styles.timelineNotes}>📝 {sp.notes}</Text>
                  ) : null}
                </View>
              ))}
            </View>
          )}
        </Card.Content>
      </Card>
    );
  };

  if (loading) {
    return <SkeletonList count={4} style={styles.skeletonContainer} />;
  }

  if (loadError) {
    return <ErrorDisplay message={loadError} onRetry={loadData} />;
  }

  return (
    <View style={commonStyles.screen}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Workflow Info Banner */}
        <Card mode="outlined" style={styles.workflowCard}>
          <Card.Content>
            <View style={styles.workflowHeader}>
              <Icon name="information-outline" size={18} color={COLORS.INFO} style={styles.workflowIcon} />
              <Text style={styles.workflowTitle}>How Milestones Work</Text>
            </View>
            <Text style={styles.workflowStep}>
              <Text style={styles.workflowBold}>Planning</Text> updates per-site progress (0–100%) for each milestone.
            </Text>
            <Text style={styles.workflowStep}>
              <Text style={styles.workflowBold}>You (Manager)</Text> can edit progress per site via{' '}
              <Text style={styles.workflowBold}>Per-Site Progress</Text>, or mark entire sites as complete
              via <Text style={styles.workflowBold}>Batch Approve</Text>.
            </Text>
            <Text style={styles.workflowStep}>
              Standard milestones (PM100–PM700) are predefined — only custom milestones can be renamed or deleted.
            </Text>
          </Card.Content>
        </Card>

        {/* Header Actions */}
        <View style={styles.header}>
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
        <Card mode="elevated" style={styles.summaryCard}>
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
          <EmptyState
            icon="flag-checkered"
            title="No Milestones Defined"
            message="Milestones help track project phases and progress. Add milestones to monitor your project timeline."
            helpText="Standard milestones (PM100-PM700) can be configured by your administrator, or you can add custom milestones here."
            tips={[
              'Milestones are weighted to calculate overall progress',
              'Track progress per site for each milestone',
              'Set planned and actual dates for schedule tracking',
            ]}
            actionText="Add Milestone"
            onAction={() => setAddDialogVisible(true)}
            variant="default"
          />
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
            <Button onPress={handleAddMilestone}>Create Milestone</Button>
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
            <Button onPress={handleUpdateMilestone}>Save</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Per-Site Progress Dialog */}
      <Portal>
        <Dialog
          visible={progressDialogVisible}
          onDismiss={() => { setProgressDialogVisible(false); setEditingSiteId(null); }}
          style={styles.progressDialog}
        >
          <Dialog.Title>{selectedMilestone?.milestoneName}</Dialog.Title>
          <Dialog.ScrollArea>
            <ScrollView>
              {selectedMilestone?.siteProgress.map((sp) => {
                const isEditing = editingSiteId === sp.siteId;
                return (
                  <View key={sp.siteId} style={styles.progressSiteRow}>
                    <View style={styles.progressSiteHeader}>
                      <Text style={styles.progressSiteName}>{sp.siteName}</Text>
                      {!isEditing && (
                        <Button
                          mode="text"
                          compact
                          icon="pencil"
                          onPress={() => startEditSite(sp)}
                          style={styles.editSiteButton}
                        >
                          Edit
                        </Button>
                      )}
                    </View>

                    {isEditing ? (
                      <View style={styles.progressEditRow}>
                        <TextInput
                          label="Progress %"
                          value={editingProgress}
                          onChangeText={setEditingProgress}
                          mode="outlined"
                          keyboardType="numeric"
                          style={styles.progressEditInput}
                          dense
                        />
                        <View style={styles.statusPickerRow}>
                          {(['not_started', 'in_progress', 'on_hold', 'completed'] as const).map(s => (
                            <Button
                              key={s}
                              mode={editingStatus === s ? 'contained' : 'outlined'}
                              compact
                              onPress={() => setEditingStatus(s)}
                              style={styles.statusPickerBtn}
                              buttonColor={editingStatus === s ? getStatusColor(s) : undefined}
                              textColor={editingStatus === s ? '#fff' : undefined}
                            >
                              {s.replace(/_/g, ' ')}
                            </Button>
                          ))}
                        </View>
                        <View style={styles.progressEditActions}>
                          <Button mode="text" onPress={cancelEditSite} disabled={savingProgress}>
                            Cancel
                          </Button>
                          <Button
                            mode="contained"
                            onPress={handleSaveSiteProgress}
                            loading={savingProgress}
                            disabled={savingProgress}
                          >
                            Save
                          </Button>
                        </View>
                      </View>
                    ) : (
                      <View style={styles.progressDisplayRow}>
                        <ProgressBar
                          progress={sp.progressPercentage / 100}
                          color={getProgressColor(sp.progressPercentage)}
                          style={styles.progressDialogBar}
                        />
                        <View style={styles.progressDialogMeta}>
                          <Text style={styles.progressDialogPct}>{sp.progressPercentage}%</Text>
                          <View style={[styles.timelineStatusBadge, { backgroundColor: getStatusColor(sp.status) }]}>
                            <Text style={styles.timelineStatusText}>
                              {sp.status.replace(/_/g, ' ').toUpperCase()}
                            </Text>
                          </View>
                        </View>
                      </View>
                    )}
                    <Divider style={styles.progressSiteDivider} />
                  </View>
                );
              })}
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => { setProgressDialogVisible(false); setEditingSiteId(null); }}>
              Close
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Batch Approval Dialog */}
      <Portal>
        <Dialog
          visible={batchApprovalDialogVisible}
          onDismiss={closeBatchApprovalDialog}
          style={styles.batchApprovalDialog}
        >
          <Dialog.Title>Batch Approve Sites</Dialog.Title>
          <Dialog.Content>
            <Text style={styles.batchApprovalSubtitle}>
              Milestone: {batchSelectedMilestone?.milestoneName}
            </Text>
            <Text style={styles.batchApprovalHelp}>
              Select sites to mark as 100% complete for this milestone.
            </Text>
            <View style={styles.batchSelectionButtons}>
              <Button
                mode="text"
                onPress={selectAllEligibleSites}
                compact
                icon="checkbox-multiple-marked"
              >
                Select All
              </Button>
              <Button
                mode="text"
                onPress={deselectAllSites}
                compact
                icon="checkbox-multiple-blank-outline"
              >
                Deselect All
              </Button>
            </View>
            <Divider style={styles.batchDivider} />
          </Dialog.Content>
          <Dialog.ScrollArea style={styles.batchScrollArea}>
            <ScrollView>
              {batchSelectedMilestone?.siteProgress.map((sp) => {
                const isCompleted = sp.status === 'completed' || sp.progressPercentage === 100;
                const isSelected = selectedSitesForApproval.has(sp.siteId);

                return (
                  <TouchableOpacity
                    key={sp.siteId}
                    style={[
                      styles.batchSiteItem,
                      isCompleted && styles.batchSiteItemCompleted,
                    ]}
                    onPress={() => !isCompleted && toggleSiteSelection(sp.siteId)}
                    disabled={isCompleted}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: isSelected, disabled: isCompleted }}
                    accessibilityLabel={`${sp.siteName}, ${sp.progressPercentage}% complete`}
                  >
                    <Checkbox
                      status={isCompleted ? 'checked' : isSelected ? 'checked' : 'unchecked'}
                      onPress={() => !isCompleted && toggleSiteSelection(sp.siteId)}
                      disabled={isCompleted}
                    />
                    <View style={styles.batchSiteInfo}>
                      <Text style={[
                        styles.batchSiteName,
                        isCompleted && styles.batchSiteNameCompleted,
                      ]}>
                        {sp.siteName}
                      </Text>
                      <Text style={styles.batchSiteProgress}>
                        {isCompleted ? '✅ Already completed' : `${sp.progressPercentage}% complete`}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Content>
            <Text style={styles.batchSelectionCount}>
              {selectedSitesForApproval.size} site{selectedSitesForApproval.size !== 1 ? 's' : ''} selected for approval
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={closeBatchApprovalDialog} disabled={batchApproving}>
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleBatchApproval}
              disabled={selectedSitesForApproval.size === 0 || batchApproving}
              loading={batchApproving}
            >
              {batchApproving ? 'Approving...' : `Approve ${selectedSitesForApproval.size} Site${selectedSitesForApproval.size !== 1 ? 's' : ''}`}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <ConfirmDialog
        visible={!!pendingDeleteMilestone}
        title="Delete Milestone"
        message={`Are you sure you want to delete "${pendingDeleteMilestone?.milestoneName}"? This will remove all progress data for this milestone.`}
        confirmText="Delete"
        destructive
        onConfirm={handleConfirmDeleteMilestone}
        onCancel={() => setPendingDeleteMilestone(null)}
      />

      <Snackbar
        {...snackbarProps}
        duration={3000}
        action={{ label: 'Dismiss', onPress: snackbarProps.onDismiss }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  skeletonContainer: {
    padding: 16,
    backgroundColor: COLORS.BACKGROUND,
  },
  chipCodeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  chipWeightText: {
    color: '#666',
    fontSize: 11,
  },
  chipSmallText: {
    color: '#fff',
    fontSize: 10,
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
    color: COLORS.INFO,
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
  milestoneHeaderChipRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  milestoneCodeChip: {},
  milestoneName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  weightageChip: {
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
    color: COLORS.INFO,
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
    color: COLORS.INFO,
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
    borderLeftColor: COLORS.INFO,
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
    flex: 1,
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
    maxHeight: '85%',
  },
  // Per-site progress dialog rows
  progressSiteRow: {
    paddingHorizontal: 4,
    paddingTop: 12,
  },
  progressSiteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressSiteName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  editSiteButton: {
    marginLeft: 8,
  },
  progressDisplayRow: {
    marginBottom: 4,
  },
  progressDialogBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 6,
  },
  progressDialogMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressDialogPct: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  progressEditRow: {
    marginBottom: 8,
  },
  progressEditInput: {
    marginBottom: 8,
  },
  statusPickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 8,
  },
  statusPickerBtn: {
    marginBottom: 4,
  },
  progressEditActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  progressSiteDivider: {
    marginTop: 12,
  },
  // Timeline fixes
  timelineStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  timelineStatusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  timelineProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  timelineProgressPct: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    minWidth: 36,
    textAlign: 'right',
  },
  // Workflow banner
  workflowCard: {
    margin: 16,
    marginBottom: 0,
    borderColor: COLORS.INFO,
    backgroundColor: '#EBF5FB',
  },
  workflowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  workflowIcon: {
    marginRight: 6,
  },
  workflowTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.INFO,
  },
  workflowStep: {
    fontSize: 12,
    color: '#444',
    marginBottom: 4,
    lineHeight: 18,
  },
  workflowBold: {
    fontWeight: '700',
    color: '#222',
  },
  // Batch Approval Styles
  batchApproveButton: {
    backgroundColor: COLORS.SUCCESS,
  },
  batchApprovalDialog: {
    maxHeight: '80%',
  },
  batchApprovalSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  batchApprovalHelp: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
  },
  batchSelectionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 8,
  },
  batchDivider: {
    marginTop: 8,
  },
  batchScrollArea: {
    maxHeight: 300,
    paddingHorizontal: 0,
  },
  batchSiteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  batchSiteItemCompleted: {
    backgroundColor: '#f5f5f5',
    opacity: 0.7,
  },
  batchSiteInfo: {
    flex: 1,
    marginLeft: 8,
  },
  batchSiteName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  batchSiteNameCompleted: {
    color: '#999',
  },
  batchSiteProgress: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  batchSelectionCount: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.INFO,
    textAlign: 'center',
    marginTop: 8,
  },
});

// Wrap with ErrorBoundary for graceful error handling
const MilestoneManagementScreenWithBoundary = () => (
  <ErrorBoundary name="MilestoneManagementScreen">
    <MilestoneManagementScreen />
  </ErrorBoundary>
);

export default MilestoneManagementScreenWithBoundary;
