# Planning Module - Phased Implementation Plan

## Overview

This document outlines the comprehensive phased implementation plan for the Planning Module in the Construction Site Progress Tracker application. The module implements advanced schedule control features including baseline planning, Gantt charts, critical path analysis, progress analytics, and schedule revision management.

**Target Version:** v1.4
**Current Schema Version:** 10
**Target Schema Version:** 11
**Estimated Total Duration:** 14-20 days

---

## Current State Assessment

### Existing Infrastructure

**Database (Schema v10):**
- `items` table with `planned_start_date` and `planned_end_date`
- Basic relationships: Projects → Sites → Items
- Progress tracking via `progress_logs` table
- Offline-first WatermelonDB architecture

**Navigation:**
- PlanningNavigator with 4 bottom tabs
- Existing screens: GanttChart, ScheduleManagement, ResourcePlanning, MilestoneTracking
- All screens currently have placeholder/basic implementations

**Current Gaps:**
- No baseline date fields for schedule control
- No dependency management for critical path
- No schedule revision tracking
- No planning service layer with calculation logic
- Static data in Gantt chart (not database-integrated)

---

## Architecture Overview

### Module Structure
```
/services/planning/
  ├── PlanningService.ts          # Core planning logic
  ├── CriticalPathCalculator.ts   # Kahn's algorithm implementation
  ├── MetricsCalculator.ts        # Progress metrics calculations
  └── ForecastService.ts          # Trend-based forecasting

/src/planning/
  ├── BaselineScreen.tsx          # Baseline planning (replaces ScheduleManagementScreen)
  ├── GanttChartScreen.tsx        # Enhanced timeline view (existing, upgrade)
  ├── ProgressAnalyticsScreen.tsx # Analytics dashboard (replaces ResourcePlanningScreen)
  ├── ScheduleUpdateScreen.tsx    # Schedule revisions (replaces MilestoneTrackingScreen)
  └── components/
      ├── ProjectSelector.tsx      # Project selection dropdown
      ├── DependencyModal.tsx      # Dependency management UI
      ├── ItemPlanningCard.tsx     # Editable planning card
      ├── GanttTimeline.tsx        # Gantt rendering component
      ├── MetricsCard.tsx          # KPI display card
      └── RevisionComparisonView.tsx # Baseline vs revised comparison

/models/
  ├── ItemModel.ts                # Updated with baseline & dependency fields
  └── ScheduleRevisionModel.ts    # New model for revision tracking
```

---

## Phase 1: Database Foundation (v1.4-alpha)

**Duration:** 1-2 days
**Branch:** `feature/v1.4-alpha-planning-db`

### Objectives
- Update database schema to support planning features
- Add baseline tracking and dependency management
- Create schedule revision history tracking

### Schema Updates (v10 → v11)

#### 1.1 Update `items` Table
Add the following columns:
```typescript
{
  name: 'baseline_start_date',
  type: 'number',
  isOptional: true  // null until baseline is locked
},
{
  name: 'baseline_end_date',
  type: 'number',
  isOptional: true  // null until baseline is locked
},
{
  name: 'dependencies',
  type: 'string',  // JSON array of item IDs: ["item-id-1", "item-id-2"]
  isOptional: true
},
{
  name: 'is_baseline_locked',
  type: 'boolean',
  isOptional: false  // default: false
},
{
  name: 'actual_start_date',
  type: 'number',
  isOptional: true  // set when work actually begins
},
{
  name: 'actual_end_date',
  type: 'number',
  isOptional: true  // set when work actually completes
},
{
  name: 'critical_path_flag',
  type: 'boolean',
  isOptional: true  // computed field, updated by service
}
```

#### 1.2 Create `schedule_revisions` Table
```typescript
tableSchema({
  name: 'schedule_revisions',
  columns: [
    { name: 'item_id', type: 'string', isIndexed: true },
    { name: 'old_start_date', type: 'number' },
    { name: 'old_end_date', type: 'number' },
    { name: 'new_start_date', type: 'number' },
    { name: 'new_end_date', type: 'number' },
    { name: 'reason', type: 'string' },  // reason for schedule change
    { name: 'revision_version', type: 'number' },  // v1, v2, v3...
    { name: 'revised_by', type: 'string', isIndexed: true },  // user ID
    { name: 'approved_by', type: 'string', isOptional: true },  // approver user ID
    { name: 'approval_status', type: 'string' },  // pending, approved, rejected
    { name: 'impact_summary', type: 'string', isOptional: true },  // JSON: affected items
    { name: 'sync_status', type: 'string' },  // pending, synced, failed
  ],
})
```

### Model Updates

#### 1.3 Update `ItemModel.ts`
```typescript
// Add to ItemModel class
@field('baseline_start_date') baselineStartDate?: number;
@field('baseline_end_date') baselineEndDate?: number;
@field('dependencies') dependencies?: string;  // JSON array
@field('is_baseline_locked') isBaselineLocked!: boolean;
@field('actual_start_date') actualStartDate?: number;
@field('actual_end_date') actualEndDate?: number;
@field('critical_path_flag') criticalPathFlag?: boolean;

// Add helper methods
getDependencies(): string[] {
  if (!this.dependencies) return [];
  try {
    return JSON.parse(this.dependencies);
  } catch {
    return [];
  }
}

setDependencies(deps: string[]): void {
  this.dependencies = JSON.stringify(deps);
}

getScheduleVariance(): number {
  if (!this.actualEndDate || !this.plannedEndDate) return 0;
  return Math.floor((this.actualEndDate - this.plannedEndDate) / (1000 * 60 * 60 * 24));
}
```

#### 1.4 Create `ScheduleRevisionModel.ts`
```typescript
import { Model } from '@nozbe/watermelondb';
import { field, relation } from '@nozbe/watermelondb/decorators';
import { Associations } from '@nozbe/watermelondb/Model';

export default class ScheduleRevisionModel extends Model {
  static table = 'schedule_revisions';

  static associations: Associations = {
    items: { type: 'belongs_to', key: 'item_id' },
  };

  @field('item_id') itemId!: string;
  @field('old_start_date') oldStartDate!: number;
  @field('old_end_date') oldEndDate!: number;
  @field('new_start_date') newStartDate!: number;
  @field('new_end_date') newEndDate!: number;
  @field('reason') reason!: string;
  @field('revision_version') revisionVersion!: number;
  @field('revised_by') revisedBy!: string;
  @field('approved_by') approvedBy?: string;
  @field('approval_status') approvalStatus!: string;
  @field('impact_summary') impactSummary?: string;
  @field('sync_status') syncStatus!: string;

  getImpactedItems(): string[] {
    if (!this.impactSummary) return [];
    try {
      const summary = JSON.parse(this.impactSummary);
      return summary.impactedItems || [];
    } catch {
      return [];
    }
  }
}
```

#### 1.5 Create Migration File
`models/migrations/10_to_11.ts`:
```typescript
import { schemaMigrations } from '@nozbe/watermelondb/Schema/migrations';

export default schemaMigrations({
  migrations: [
    {
      toVersion: 11,
      steps: [
        {
          type: 'add_columns',
          table: 'items',
          columns: [
            { name: 'baseline_start_date', type: 'number', isOptional: true },
            { name: 'baseline_end_date', type: 'number', isOptional: true },
            { name: 'dependencies', type: 'string', isOptional: true },
            { name: 'is_baseline_locked', type: 'boolean', isOptional: false },
            { name: 'actual_start_date', type: 'number', isOptional: true },
            { name: 'actual_end_date', type: 'number', isOptional: true },
            { name: 'critical_path_flag', type: 'boolean', isOptional: true },
          ],
        },
        {
          type: 'create_table',
          name: 'schedule_revisions',
          columns: [
            { name: 'item_id', type: 'string', isIndexed: true },
            { name: 'old_start_date', type: 'number' },
            { name: 'old_end_date', type: 'number' },
            { name: 'new_start_date', type: 'number' },
            { name: 'new_end_date', type: 'number' },
            { name: 'reason', type: 'string' },
            { name: 'revision_version', type: 'number' },
            { name: 'revised_by', type: 'string', isIndexed: true },
            { name: 'approved_by', type: 'string', isOptional: true },
            { name: 'approval_status', type: 'string' },
            { name: 'impact_summary', type: 'string', isOptional: true },
            { name: 'sync_status', type: 'string' },
          ],
        },
      ],
    },
  ],
});
```

#### 1.6 Register New Model
Update `models/database.ts`:
```typescript
import ScheduleRevisionModel from './ScheduleRevisionModel';

// Add to modelClasses array
modelClasses: [
  // ... existing models
  ScheduleRevisionModel,
]
```

### Deliverables
- [ ] Schema updated to v11
- [ ] Migration file created and tested
- [ ] ItemModel updated with new fields and helper methods
- [ ] ScheduleRevisionModel created
- [ ] All models registered in database.ts
- [ ] Database initializes without errors

### Testing Checklist
- [ ] App starts successfully with new schema
- [ ] Existing data preserved after migration
- [ ] Can create items with dependencies
- [ ] Dependencies stored as valid JSON
- [ ] Schedule revisions can be created and queried

---

## Phase 2: Planning Service Layer (v1.4-beta1)

**Duration:** 2-3 days
**Branch:** `feature/v1.4-beta1-planning-service`

### Objectives
- Create reusable planning calculation logic
- Implement critical path algorithm
- Build metrics and forecasting services
- Ensure offline-first operation

### 2.1 Create `PlanningService.ts`

Location: `/services/planning/PlanningService.ts`

```typescript
import { database } from '../../models/database';
import ItemModel from '../../models/ItemModel';
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

    // Calculate critical path (longest path)
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
      .get('schedule_revisions')
      .query(Q.where('item_id', itemId))
      .fetch();

    const revisionVersion = existingRevisions.length + 1;

    await database.write(async () => {
      // Create revision record
      await database.collections.get('schedule_revisions').create(revision => {
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
        revision.syncStatus = 'pending';
      });

      // Update item with new dates
      await item.update(i => {
        i.plannedStartDate = newStartDate;
        i.plannedEndDate = newEndDate;
      });
    });
  }
}

export default new PlanningService();
```

### Deliverables
- [ ] PlanningService.ts created with all core functions
- [ ] Critical path calculation working correctly
- [ ] Progress metrics calculated accurately
- [ ] Forecast generation functional
- [ ] Dependency validation prevents circular refs
- [ ] Baseline locking transaction-safe
- [ ] Schedule revision creation working

### Testing Checklist
- [ ] Critical path identifies correct items
- [ ] Metrics calculate for projects with varying data
- [ ] Forecast provides reasonable estimates
- [ ] Circular dependencies detected and prevented
- [ ] Baseline lock persists across app restarts
- [ ] Revisions created with proper version numbers

---

## Phase 3: Baseline Planning Screen (v1.4-beta2)

**Duration:** 2-3 days
**Branch:** `feature/v1.4-beta2-baseline-screen`

### Objectives
- Create master planning interface
- Enable dependency management
- Implement critical path visualization
- Allow baseline locking

### 3.1 Create `BaselineScreen.tsx`

Location: `/src/planning/BaselineScreen.tsx`

Replace `ScheduleManagementScreen.tsx` with comprehensive baseline planning.

**Key Features:**
1. Project selector dropdown
2. Editable item list with date pickers
3. Dependency management modal
4. Critical path calculation button
5. Baseline locking functionality
6. Visual indicators for critical path items

**Component Structure:**
```typescript
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Button, Card, Chip } from 'react-native-paper';
import { withObservables } from '@nozbe/watermelondb/react';
import { Q } from '@nozbe/watermelondb';
import { database } from '../../models/database';
import ProjectModel from '../../models/ProjectModel';
import ItemModel from '../../models/ItemModel';
import PlanningService from '../../services/planning/PlanningService';
import ProjectSelector from './components/ProjectSelector';
import DependencyModal from './components/DependencyModal';
import ItemPlanningCard from './components/ItemPlanningCard';

interface BaselineScreenProps {
  projects: ProjectModel[];
}

const BaselineScreenComponent: React.FC<BaselineScreenProps> = ({ projects }) => {
  const [selectedProject, setSelectedProject] = useState<ProjectModel | null>(null);
  const [items, setItems] = useState<ItemModel[]>([]);
  const [criticalPathItems, setCriticalPathItems] = useState<string[]>([]);
  const [showDependencyModal, setShowDependencyModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ItemModel | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Load items when project changes
  useEffect(() => {
    if (selectedProject) {
      loadItems();
    }
  }, [selectedProject]);

  const loadItems = async () => {
    if (!selectedProject) return;

    const projectItems = await database.collections
      .get<ItemModel>('items')
      .query(Q.on('sites', 'project_id', selectedProject.id))
      .fetch();

    setItems(projectItems);
  };

  const handleCalculateCriticalPath = async () => {
    if (!selectedProject) return;

    setIsCalculating(true);
    try {
      const result = await PlanningService.calculateCriticalPath(selectedProject.id);
      setCriticalPathItems(result.criticalPathItems.map(i => i.id));
      Alert.alert(
        'Critical Path Calculated',
        `Found ${result.criticalPathItems.length} critical items with total duration of ${Math.floor(result.totalDuration / (1000 * 60 * 60 * 24))} days`
      );
      await loadItems(); // Reload to show updated flags
    } catch (error) {
      Alert.alert('Error', 'Failed to calculate critical path');
    } finally {
      setIsCalculating(false);
    }
  };

  const handleLockBaseline = async () => {
    if (!selectedProject) return;

    Alert.alert(
      'Lock Baseline',
      'This will save current planned dates as baseline. This action cannot be easily undone. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Lock Baseline',
          style: 'destructive',
          onPress: async () => {
            try {
              await PlanningService.lockBaseline(selectedProject.id);
              Alert.alert('Success', 'Baseline locked successfully');
              await loadItems();
            } catch (error) {
              Alert.alert('Error', 'Failed to lock baseline');
            }
          },
        },
      ]
    );
  };

  const handleManageDependencies = (item: ItemModel) => {
    setSelectedItem(item);
    setShowDependencyModal(true);
  };

  const isBaselineLocked = items.length > 0 && items.every(i => i.isBaselineLocked);

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
              disabled={items.length === 0}
              style={styles.actionButton}
            >
              Calculate Critical Path
            </Button>
            <Button
              mode="contained"
              onPress={handleLockBaseline}
              disabled={isBaselineLocked || items.length === 0}
              style={[styles.actionButton, styles.lockButton]}
            >
              {isBaselineLocked ? 'Baseline Locked' : 'Lock Baseline'}
            </Button>
          </View>

          {criticalPathItems.length > 0 && (
            <Card style={styles.infoCard}>
              <Card.Content>
                <Text style={styles.infoText}>
                  Critical Path: {criticalPathItems.length} items
                </Text>
                <Text style={styles.infoSubtext}>
                  Items with red border are on the critical path
                </Text>
              </Card.Content>
            </Card>
          )}

          <ScrollView style={styles.itemsList}>
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
        </>
      )}

      {showDependencyModal && selectedItem && (
        <DependencyModal
          visible={showDependencyModal}
          item={selectedItem}
          allItems={items}
          onClose={() => setShowDependencyModal(false)}
          onSave={loadItems}
        />
      )}
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
  },
  actionButton: {
    flex: 1,
  },
  lockButton: {
    backgroundColor: '#FF9800',
  },
  infoCard: {
    margin: 16,
    marginTop: 0,
    backgroundColor: '#E3F2FD',
  },
  infoText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976D2',
  },
  infoSubtext: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  itemsList: {
    flex: 1,
    padding: 16,
  },
});

export default BaselineScreen;
```

### 3.2 Create Supporting Components

Create in `/src/planning/components/`:

**ProjectSelector.tsx** - Dropdown for project selection
**DependencyModal.tsx** - Modal for managing item dependencies
**ItemPlanningCard.tsx** - Card with editable dates and dependency display

### 3.3 Update Navigation

Update `PlanningNavigator.tsx`:
```typescript
import BaselineScreen from '../planning/BaselineScreen';

// Replace ScheduleManagement with Baseline
<Tab.Screen
  name="Baseline"
  component={BaselineScreen}
  options={{
    title: 'Baseline',
    headerShown: true,
    headerTitle: 'Baseline Planning',
  }}
/>
```

### Deliverables
- [ ] BaselineScreen.tsx fully functional
- [ ] ProjectSelector component working
- [ ] DependencyModal allows selecting predecessors
- [ ] ItemPlanningCard displays and edits dates
- [ ] Critical path calculation triggered from UI
- [ ] Baseline locking with confirmation
- [ ] Visual indicators for critical path
- [ ] Navigation updated

### Testing Checklist
- [ ] Can select different projects
- [ ] Items load for selected project
- [ ] Date pickers update item dates
- [ ] Dependency modal shows available items
- [ ] Critical path highlights correct items
- [ ] Baseline lock prevents further editing
- [ ] Changes persist after app restart

---

## Phase 4: Enhanced Gantt Chart (v1.4-beta3)

**Duration:** 3-4 days
**Branch:** `feature/v1.4-beta3-gantt-chart`

### Objectives
- Replace static data with real database integration
- Add interactive timeline controls
- Implement dependency visualization
- Show actual vs planned progress

### 4.1 Update `GanttChartScreen.tsx`

**Key Enhancements:**
1. Fetch real data from database
2. Horizontal scrollable timeline with zoom controls
3. Dependency arrows using SVG
4. Progress overlay (planned vs actual)
5. Critical path highlighting
6. Tap item for detail modal

**Libraries to Install:**
```bash
npm install react-native-svg dayjs --legacy-peer-deps
npm install --save-dev @types/react-native-svg --legacy-peer-deps
```

**Implementation Notes:**
- Use `react-native-svg` for dependency arrows
- Use `dayjs` for date calculations and formatting
- Implement three zoom levels: Day, Week, Month
- Color code based on schedule variance

### 4.2 Create Gantt Components

**GanttTimeline.tsx** - Main timeline rendering
**GanttTaskBar.tsx** - Individual task bar with progress
**GanttDependencyArrow.tsx** - SVG arrow between tasks
**GanttDetailModal.tsx** - Task detail popup

### Deliverables
- [ ] Real data from database displayed
- [ ] Horizontal scrolling timeline
- [ ] Zoom controls (Day/Week/Month)
- [ ] Dependency arrows drawn correctly
- [ ] Progress overlay shows actual vs planned
- [ ] Critical path items highlighted
- [ ] Detail modal shows variance and dates
- [ ] Responsive to data changes

### Testing Checklist
- [ ] Timeline displays all project items
- [ ] Zoom levels change bar widths appropriately
- [ ] Dependencies visually connect correct items
- [ ] Progress colors match variance thresholds
- [ ] Critical path items have red border
- [ ] Tap opens detail modal with correct data
- [ ] Performance acceptable with 50+ items

---

## Phase 5: Progress Analytics Screen (v1.4-rc1)

**Duration:** 2-3 days
**Branch:** `feature/v1.4-rc1-analytics`

### Objectives
- Replace ResourcePlanningScreen with analytics
- Display KPIs and charts
- Show alerts for delayed items
- Provide completion forecast

### 5.1 Create `ProgressAnalyticsScreen.tsx`

**Key Features:**
1. KPI cards at top
2. Progress trend line chart
3. Schedule variance bar chart
4. Status distribution donut chart
5. Alerts for delayed items
6. Forecast with assumptions

**Libraries to Install:**
```bash
npm install react-native-chart-kit --legacy-peer-deps
```

**KPIs to Display:**
- Overall Progress %
- Average Schedule Variance (days)
- Items On-Track / Delayed / Ahead
- Forecasted Completion Date

### 5.2 Create Analytics Components

**MetricsCard.tsx** - KPI display card
**ProgressTrendChart.tsx** - Line chart for trends
**VarianceBarChart.tsx** - Bar chart for variances
**StatusDonutChart.tsx** - Donut chart for distribution
**AlertsList.tsx** - List of delayed items
**ForecastCard.tsx** - Forecast display with confidence

### Deliverables
- [ ] ProgressAnalyticsScreen.tsx functional
- [ ] KPI cards show live data
- [ ] Line chart displays weekly progress
- [ ] Bar chart shows variance by item
- [ ] Donut chart shows status distribution
- [ ] Alerts list delayed items
- [ ] Forecast card displays estimate
- [ ] All metrics update with data changes

### Testing Checklist
- [ ] Metrics calculate correctly
- [ ] Charts render without errors
- [ ] Data updates when progress logged
- [ ] Alerts show only delayed items
- [ ] Forecast reasonable based on trends
- [ ] Performance acceptable with large datasets

---

## Phase 6: Schedule Update & Revision (v1.4-rc2)

**Duration:** 2-3 days
**Branch:** `feature/v1.4-rc2-revisions`

### Objectives
- Replace MilestoneTrackingScreen with revision interface
- Allow controlled schedule updates
- Track revision history
- Show impact analysis

### 6.1 Create `ScheduleUpdateScreen.tsx`

**Key Features:**
1. List items with current vs revised dates
2. Reason for change input
3. Impact analysis (dependent items affected)
4. Baseline vs current vs revised comparison
5. Revision history log
6. Export revision history

**Workflow:**
1. User selects items to revise
2. Edits planned dates
3. Enters reason for change
4. System calculates impacted items
5. User reviews impact
6. Submits revision (creates record)
7. Optionally request approval

### 6.2 Create Revision Components

**RevisionItemCard.tsx** - Item with old/new date comparison
**ReasonInputModal.tsx** - Reason entry modal
**ImpactAnalysisView.tsx** - Shows affected items
**RevisionHistoryList.tsx** - History log with versions
**ComparisonGanttView.tsx** - Overlay of baseline/current/revised

### Deliverables
- [ ] ScheduleUpdateScreen.tsx functional
- [ ] Can edit dates for multiple items
- [ ] Reason input captured
- [ ] Impact analysis shows dependent items
- [ ] Revision records created in database
- [ ] History displays all revisions
- [ ] Comparison view shows overlays

### Testing Checklist
- [ ] Date edits captured correctly
- [ ] Reason required before submission
- [ ] Impact analysis identifies all dependents
- [ ] Revisions versioned incrementally
- [ ] History shows chronological revisions
- [ ] Comparison view renders all three states

---

## Phase 7: Polish & Integration (v1.4-stable)

**Duration:** 2 days
**Branch:** `feature/v1.4-stable-planning`

### Objectives
- Finalize all screens and navigation
- Comprehensive testing
- Performance optimization
- Documentation

### 7.1 Navigation Updates

Update `PlanningNavigator.tsx` with final tab configuration:

```typescript
<Tab.Screen name="Baseline" component={BaselineScreen}
  options={{ tabBarIcon: '📋', title: 'Baseline Planning' }} />
<Tab.Screen name="GanttChart" component={GanttChartScreen}
  options={{ tabBarIcon: '📊', title: 'Timeline View' }} />
<Tab.Screen name="ProgressAnalytics" component={ProgressAnalyticsScreen}
  options={{ tabBarIcon: '📈', title: 'Analytics' }} />
<Tab.Screen name="ScheduleUpdate" component={ScheduleUpdateScreen}
  options={{ tabBarIcon: '🔄', title: 'Revisions' }} />
```

### 7.2 Cross-Screen Navigation

Implement deep linking between screens:
- Gantt chart item tap → Baseline editing
- Analytics alert tap → Schedule update
- Revision history tap → Gantt comparison

### 7.3 Performance Optimization

**Strategies:**
- Limit Gantt chart to 50 items per view (pagination)
- Cache critical path calculations (5 min expiry)
- Optimize WatermelonDB queries with indexes
- Use React.memo for chart components
- Debounce date picker updates

### 7.4 Error Handling

**Validation:**
- Prevent end date before start date
- Validate dependencies before saving
- Check for circular dependencies
- Ensure baseline locked before revisions

**User Feedback:**
- Loading states for calculations
- Error messages for validation failures
- Success confirmations for operations
- Progress indicators for long operations

### 7.5 Offline Sync

**Sync Strategy:**
- All operations work offline
- Queue revisions for sync when online
- Conflict resolution: last-write-wins for planning data
- Sync status indicators in each screen

### 7.6 Documentation

**Create/Update:**
- Update `PLANNING_MODULE.md` with final architecture
- Create `PLANNING_USER_GUIDE.md` for end users
- Update `ARCHITECTURE.md` with planning service
- Document API for PlanningService functions

### Deliverables
- [ ] All 4 screens integrated in navigation
- [ ] Cross-screen navigation working
- [ ] Performance <2s for all operations
- [ ] All validations in place
- [ ] Error handling comprehensive
- [ ] Offline sync tested and working
- [ ] Documentation complete

### Testing Checklist
- [ ] Can navigate between all planning screens
- [ ] Data persists across navigation
- [ ] Critical path recalculated when needed
- [ ] Metrics update in real-time
- [ ] Revisions sync when online
- [ ] No crashes or errors in normal usage
- [ ] Performance acceptable on low-end devices

---

## Technical Specifications

### Data Flow

```
User Input (Baseline Screen)
  ↓
ItemModel updates (WatermelonDB)
  ↓
PlanningService calculations
  ↓
Critical Path / Metrics / Forecast
  ↓
UI Updates (Gantt / Analytics)
  ↓
Sync Service (when online)
  ↓
Backend API
```

### State Management

**Local State (React):**
- UI-specific state (modals, selections)
- Temporary form inputs
- Chart zoom levels

**Database State (WatermelonDB):**
- Items with planning fields
- Schedule revisions
- Persisted across app restarts

**Computed State:**
- Critical path (cached 5 min)
- Metrics (calculated on-demand)
- Forecast (cached 10 min)

### Performance Targets

| Operation | Target Time | Notes |
|-----------|-------------|-------|
| Critical Path Calculation | <1s | For up to 100 items |
| Metrics Calculation | <500ms | All KPIs |
| Gantt Chart Render | <1s | Initial render |
| Dependency Validation | <200ms | Per item |
| Baseline Lock | <2s | Transaction-based |
| Revision Creation | <300ms | Single item |

### Offline Capabilities

**Fully Offline:**
- Baseline planning
- Dependency management
- Critical path calculation
- Metrics display
- Forecast generation
- Schedule revisions

**Requires Sync:**
- Revision approval workflows
- Multi-user conflict resolution
- Backend export/reports

---

## Success Criteria

### Phase 1 Success
- [ ] Schema v11 deployed without data loss
- [ ] All new fields accessible in models
- [ ] Migration runs successfully on existing installations

### Phase 2 Success
- [ ] PlanningService passes all unit tests
- [ ] Critical path algorithm verified against test cases
- [ ] Metrics match manual calculations

### Phase 3 Success
- [ ] Baseline screen allows full planning workflow
- [ ] Dependencies managed without circular refs
- [ ] Baseline locked and persisted

### Phase 4 Success
- [ ] Gantt chart displays real project data
- [ ] Dependencies visible and correct
- [ ] Performance acceptable with 50+ items

### Phase 5 Success
- [ ] Analytics show accurate real-time data
- [ ] Charts render correctly
- [ ] Forecast provides reasonable estimates

### Phase 6 Success
- [ ] Revisions tracked with full audit trail
- [ ] Impact analysis identifies dependents
- [ ] History accessible and exportable

### Phase 7 Success
- [ ] All screens integrated smoothly
- [ ] Performance meets targets
- [ ] Offline functionality verified
- [ ] Documentation complete

### Overall Module Success
- [ ] Planning module fully functional
- [ ] All 4 screens operational
- [ ] Database schema v11 stable
- [ ] Offline-first maintained
- [ ] User can plan, track, and revise schedules
- [ ] Critical path identifies bottlenecks
- [ ] Analytics provide actionable insights
- [ ] Revision history maintains accountability

---

## Risk Mitigation

### Technical Risks

**Risk:** Circular dependency validation performance
**Mitigation:** Limit dependencies to 5 per item, implement caching

**Risk:** Gantt chart performance with large datasets
**Mitigation:** Pagination, virtualization, limit to 50 visible items

**Risk:** Critical path calculation complexity
**Mitigation:** Optimize algorithm, cache results, run in background

**Risk:** Migration failure on schema update
**Mitigation:** Test on copy of production data, implement rollback

### User Experience Risks

**Risk:** Complex UI overwhelming users
**Mitigation:** Progressive disclosure, tooltips, onboarding tutorial

**Risk:** Accidental baseline unlocking
**Mitigation:** Strong confirmation dialogs, audit trail

**Risk:** Dependency management confusion
**Mitigation:** Visual indicators, validation messages, help text

---

## Future Enhancements (Post v1.4)

**v1.5 Candidates:**
1. Resource allocation per task
2. Cost tracking integration
3. Weather delay tracking
4. Automated baseline suggestions
5. Machine learning forecasting
6. Multi-project portfolio view
7. Earned Value Management (EVM)
8. What-if scenario modeling
9. Calendar integration
10. Push notifications for delays

---

## Appendix

### Glossary

**Baseline:** Original planned schedule locked for comparison
**Critical Path:** Longest sequence of dependent tasks determining project duration
**Schedule Variance:** Difference between planned and actual dates
**Float/Slack:** Time a task can be delayed without affecting project end
**Revision:** Controlled update to planned schedule with audit trail
**Topological Sort:** Algorithm for ordering dependent items
**Kahn's Algorithm:** Specific topological sort implementation

### References

- WatermelonDB Documentation: https://nozbe.github.io/WatermelonDB/
- React Native Paper: https://callstack.github.io/react-native-paper/
- React Native SVG: https://github.com/software-mansion/react-native-svg
- Critical Path Method: https://en.wikipedia.org/wiki/Critical_path_method

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-10-12 | Initial planning document created | Planning Team |

---

**Document Status:** APPROVED FOR IMPLEMENTATION
**Next Review Date:** After Phase 3 completion
**Maintained By:** Development Team
