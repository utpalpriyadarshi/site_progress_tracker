import { database } from '../../models/database';
import ItemModel from '../../models/ItemModel';
import ScheduleRevisionModel from '../../models/ScheduleRevisionModel';
import { Q } from '@nozbe/watermelondb';

export interface ProgressMetrics {
  overallProgress: number;
  averageScheduleVariance: number;
  onTrackCount: number;
  delayedCount: number;
  aheadCount: number;
  notStartedCount: number;
}

export interface VarianceData {
  itemId: string;
  itemName: string;
  plannedDuration: number;
  actualDuration: number;
  varianceDays: number;
  variancePercentage: number;
  status: 'on-track' | 'delayed' | 'ahead';
}

export interface ForecastData {
  estimatedCompletionDate: number;
  confidenceLevel: 'high' | 'medium' | 'low';
  daysRemaining: number;
  averageVelocity: number;
  assumptions: string[];
}

export interface CriticalPathResult {
  criticalPathItems: ItemModel[];
  totalDuration: number;
  sortedItems: ItemModel[];
}

class PlanningService {
  /**
   * Calculate critical path using Kahn's algorithm (topological sort)
   */
  async calculateCriticalPath(projectId: string): Promise<CriticalPathResult> {
    const items = await database.collections
      .get<ItemModel>('items')
      .query(
        Q.on('sites', 'project_id', projectId),
        Q.where('status', Q.notEq('completed'))
      )
      .fetch();

    if (items.length === 0) {
      return {
        criticalPathItems: [],
        totalDuration: 0,
        sortedItems: [],
      };
    }

    // Build dependency graph
    const graph = new Map<string, string[]>();
    const inDegree = new Map<string, number>();
    const itemMap = new Map<string, ItemModel>();

    items.forEach(item => {
      itemMap.set(item.id, item);
      graph.set(item.id, item.getDependencies());
      inDegree.set(item.id, 0);
    });

    // Calculate in-degrees
    items.forEach(item => {
      const deps = item.getDependencies();
      deps.forEach(depId => {
        inDegree.set(depId, (inDegree.get(depId) || 0) + 1);
      });
    });

    // Kahn's algorithm for topological sort
    const queue: string[] = [];
    const sortedItems: ItemModel[] = [];

    // Start with nodes with no dependencies
    inDegree.forEach((degree, itemId) => {
      if (degree === 0) queue.push(itemId);
    });

    while (queue.length > 0) {
      const itemId = queue.shift()!;
      const item = itemMap.get(itemId);
      if (item) sortedItems.push(item);

      const dependents = graph.get(itemId) || [];
      dependents.forEach(depId => {
        const newDegree = (inDegree.get(depId) || 0) - 1;
        inDegree.set(depId, newDegree);
        if (newDegree === 0) queue.push(depId);
      });
    }

    // Calculate critical path (longest path) - Forward pass
    const earliestStart = new Map<string, number>();
    const earliestFinish = new Map<string, number>();

    sortedItems.forEach(item => {
      const deps = item.getDependencies();
      let maxFinish = item.plannedStartDate;

      deps.forEach(depId => {
        const depFinish = earliestFinish.get(depId) || 0;
        maxFinish = Math.max(maxFinish, depFinish);
      });

      earliestStart.set(item.id, maxFinish);
      const duration = item.plannedEndDate - item.plannedStartDate;
      earliestFinish.set(item.id, maxFinish + duration);
    });

    // Backward pass to find critical path
    const latestFinish = new Map<string, number>();
    const latestStart = new Map<string, number>();
    const projectEnd = Math.max(...Array.from(earliestFinish.values()));

    // Initialize latest times
    sortedItems.reverse().forEach(item => {
      const hasSuccessors = items.some(i => i.getDependencies().includes(item.id));

      if (!hasSuccessors) {
        latestFinish.set(item.id, projectEnd);
      } else {
        let minSuccessorStart = Infinity;
        items.forEach(successor => {
          if (successor.getDependencies().includes(item.id)) {
            const successorLatestStart = latestStart.get(successor.id) || 0;
            minSuccessorStart = Math.min(minSuccessorStart, successorLatestStart);
          }
        });
        latestFinish.set(item.id, minSuccessorStart);
      }

      const duration = item.plannedEndDate - item.plannedStartDate;
      latestStart.set(item.id, (latestFinish.get(item.id) || 0) - duration);
    });

    // Items with zero slack are on critical path
    const criticalPathItems: ItemModel[] = [];
    sortedItems.forEach(item => {
      const slack = (latestStart.get(item.id) || 0) - (earliestStart.get(item.id) || 0);
      if (Math.abs(slack) < 1000) { // Less than 1 second slack
        criticalPathItems.push(item);
      }
    });

    // Update critical path flags in database
    await database.write(async () => {
      for (const item of items) {
        await item.update(i => {
          i.criticalPathFlag = criticalPathItems.some(cp => cp.id === item.id);
        });
      }
    });

    return {
      criticalPathItems,
      totalDuration: projectEnd - Math.min(...Array.from(earliestStart.values())),
      sortedItems: sortedItems.reverse(),
    };
  }

  /**
   * Calculate progress metrics for a project
   */
  async calculateProgressMetrics(projectId: string): Promise<ProgressMetrics> {
    const items = await database.collections
      .get<ItemModel>('items')
      .query(Q.on('sites', 'project_id', projectId))
      .fetch();

    if (items.length === 0) {
      return {
        overallProgress: 0,
        averageScheduleVariance: 0,
        onTrackCount: 0,
        delayedCount: 0,
        aheadCount: 0,
        notStartedCount: 0,
      };
    }

    let totalPlanned = 0;
    let totalCompleted = 0;
    let totalVariance = 0;
    let varianceCount = 0;
    let onTrack = 0;
    let delayed = 0;
    let ahead = 0;
    let notStarted = 0;

    items.forEach(item => {
      totalPlanned += item.plannedQuantity;
      totalCompleted += item.completedQuantity;

      const variance = item.getScheduleVariance();
      if (variance !== 0) {
        totalVariance += variance;
        varianceCount++;
      }

      // Status categorization
      if (item.status === 'not_started') {
        notStarted++;
      } else if (Math.abs(variance) <= 2) {
        onTrack++;
      } else if (variance > 0) {
        delayed++;
      } else {
        ahead++;
      }
    });

    return {
      overallProgress: totalPlanned > 0 ? (totalCompleted / totalPlanned) * 100 : 0,
      averageScheduleVariance: varianceCount > 0 ? totalVariance / varianceCount : 0,
      onTrackCount: onTrack,
      delayedCount: delayed,
      aheadCount: ahead,
      notStartedCount: notStarted,
    };
  }

  /**
   * Calculate schedule variance for a specific item
   */
  async calculateScheduleVariance(itemId: string): Promise<VarianceData | null> {
    const item = await database.collections
      .get<ItemModel>('items')
      .find(itemId);

    if (!item) return null;

    const plannedDuration = Math.floor(
      (item.plannedEndDate - item.plannedStartDate) / (1000 * 60 * 60 * 24)
    );

    const actualDuration = item.actualEndDate
      ? Math.floor((item.actualEndDate - (item.actualStartDate || item.plannedStartDate)) / (1000 * 60 * 60 * 24))
      : 0;

    const varianceDays = item.getScheduleVariance();
    const variancePercentage = plannedDuration > 0 ? (varianceDays / plannedDuration) * 100 : 0;

    let status: 'on-track' | 'delayed' | 'ahead' = 'on-track';
    if (varianceDays > 2) status = 'delayed';
    else if (varianceDays < -2) status = 'ahead';

    return {
      itemId: item.id,
      itemName: item.name,
      plannedDuration,
      actualDuration,
      varianceDays,
      variancePercentage,
      status,
    };
  }

  /**
   * Generate completion forecast using linear regression
   */
  async generateForecast(projectId: string): Promise<ForecastData> {
    const items = await database.collections
      .get<ItemModel>('items')
      .query(Q.on('sites', 'project_id', projectId))
      .fetch();

    // Get progress logs for trend analysis
    const now = Date.now();
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);

    const progressLogs = await database.collections
      .get('progress_logs')
      .query(
        Q.where('date', Q.gte(thirtyDaysAgo)),
        Q.sortBy('date', Q.asc)
      )
      .fetch();

    // Calculate velocity (work completed per day)
    let totalCompleted = 0;
    let totalPlanned = 0;
    items.forEach(item => {
      totalCompleted += item.completedQuantity;
      totalPlanned += item.plannedQuantity;
    });

    const currentProgress = totalPlanned > 0 ? (totalCompleted / totalPlanned) * 100 : 0;
    const remainingWork = 100 - currentProgress;

    // Calculate average daily velocity from recent progress
    const dailyProgress = progressLogs.length > 0 ? progressLogs.length / 30 : 1;
    const averageVelocity = dailyProgress * (currentProgress / (progressLogs.length || 1));

    // Estimate remaining days
    const daysRemaining = averageVelocity > 0 ? Math.ceil(remainingWork / averageVelocity) : 0;
    const estimatedCompletionDate = now + (daysRemaining * 24 * 60 * 60 * 1000);

    // Determine confidence level
    let confidenceLevel: 'high' | 'medium' | 'low' = 'medium';
    if (progressLogs.length > 20 && currentProgress > 30) {
      confidenceLevel = 'high';
    } else if (progressLogs.length < 10 || currentProgress < 10) {
      confidenceLevel = 'low';
    }

    return {
      estimatedCompletionDate,
      confidenceLevel,
      daysRemaining,
      averageVelocity,
      assumptions: [
        'Based on last 30 days of progress data',
        'Assumes consistent work velocity',
        'Does not account for holidays or weather delays',
        `Confidence level: ${confidenceLevel}`,
      ],
    };
  }

  /**
   * Validate dependencies to prevent circular references
   */
  validateDependencies(items: ItemModel[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (itemId: string, itemMap: Map<string, ItemModel>): boolean => {
      visited.add(itemId);
      recursionStack.add(itemId);

      const item = itemMap.get(itemId);
      if (!item) return false;

      const deps = item.getDependencies();
      for (const depId of deps) {
        if (!visited.has(depId)) {
          if (hasCycle(depId, itemMap)) return true;
        } else if (recursionStack.has(depId)) {
          return true;
        }
      }

      recursionStack.delete(itemId);
      return false;
    };

    const itemMap = new Map<string, ItemModel>();
    items.forEach(item => itemMap.set(item.id, item));

    items.forEach(item => {
      if (!visited.has(item.id)) {
        if (hasCycle(item.id, itemMap)) {
          errors.push(`Circular dependency detected involving item: ${item.name}`);
        }
      }
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Lock baseline dates for schedule control
   */
  async lockBaseline(projectId: string): Promise<void> {
    const items = await database.collections
      .get<ItemModel>('items')
      .query(Q.on('sites', 'project_id', projectId))
      .fetch();

    await database.write(async () => {
      for (const item of items) {
        await item.update(i => {
          i.baselineStartDate = i.plannedStartDate;
          i.baselineEndDate = i.plannedEndDate;
          i.isBaselineLocked = true;
        });
      }
    });
  }

  /**
   * Create schedule revision record
   */
  async createRevision(
    itemId: string,
    newStartDate: number,
    newEndDate: number,
    reason: string,
    userId: string,
    impactedItemIds: string[]
  ): Promise<void> {
    const item = await database.collections.get<ItemModel>('items').find(itemId);

    // Get current revision version
    const existingRevisions = await database.collections
      .get<ScheduleRevisionModel>('schedule_revisions')
      .query(Q.where('item_id', itemId))
      .fetch();

    const revisionVersion = existingRevisions.length + 1;

    await database.write(async () => {
      // Create revision record
      await database.collections.get<ScheduleRevisionModel>('schedule_revisions').create(revision => {
        revision.itemId = itemId;
        revision.oldStartDate = item.plannedStartDate;
        revision.oldEndDate = item.plannedEndDate;
        revision.newStartDate = newStartDate;
        revision.newEndDate = newEndDate;
        revision.reason = reason;
        revision.revisionVersion = revisionVersion;
        revision.revisedBy = userId;
        revision.approvalStatus = 'pending';
        revision.impactSummary = JSON.stringify({ impactedItems: impactedItemIds });
        revision.syncStatusField = 'pending';
      });

      // Update item with new dates
      await item.update(i => {
        i.plannedStartDate = newStartDate;
        i.plannedEndDate = newEndDate;
      });
    });
  }

  /**
   * Get all items that depend on a specific item (successors)
   */
  async getItemSuccessors(itemId: string): Promise<ItemModel[]> {
    const allItems = await database.collections
      .get<ItemModel>('items')
      .query()
      .fetch();

    return allItems.filter(item => item.getDependencies().includes(itemId));
  }

  /**
   * Calculate impact of schedule change on dependent items
   */
  async calculateScheduleImpact(
    itemId: string,
    newStartDate: number,
    newEndDate: number
  ): Promise<string[]> {
    const impactedIds: string[] = [];
    const item = await database.collections.get<ItemModel>('items').find(itemId);
    const dateShift = newEndDate - item.plannedEndDate;

    // Find all items that depend on this item
    const successors = await this.getItemSuccessors(itemId);

    for (const successor of successors) {
      // If this item's end date changes, dependent items need to shift
      if (successor.plannedStartDate < newEndDate) {
        impactedIds.push(successor.id);
        // Recursively check successors
        const nestedImpact = await this.calculateScheduleImpact(
          successor.id,
          successor.plannedStartDate + dateShift,
          successor.plannedEndDate + dateShift
        );
        impactedIds.push(...nestedImpact);
      }
    }

    return Array.from(new Set(impactedIds)); // Remove duplicates
  }
}

export default new PlanningService();
