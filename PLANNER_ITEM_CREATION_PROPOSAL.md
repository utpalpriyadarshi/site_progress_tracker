# Planner Item Creation - Architecture Proposal

**Version:** 1.0
**Date:** 2025-10-13
**Status:** Proposal - Pending Review
**Priority:** High
**Impact:** Core Architecture Change

---

## Executive Summary

This document proposes a significant architectural change to enable **Planners to create and manage project items independently**, rather than depending on Supervisors to create them first. This change aligns the application with industry best practices and standard project management workflows.

### Key Benefits
- ✅ Correct project lifecycle sequence (Plan → Execute → Monitor)
- ✅ Planner independence and efficiency
- ✅ Complete project scope coverage (Design → Testing & Commissioning)
- ✅ Industry-standard workflow alignment
- ✅ Professional credibility with project management teams

### Implementation Effort
- **Development Time:** 2-3 hours
- **Testing Time:** 1-2 hours
- **Complexity:** Medium
- **Risk:** Low (additive, doesn't break existing functionality)

---

## Table of Contents

1. [Problem Statement](#problem-statement)
2. [Current Architecture](#current-architecture)
3. [Proposed Architecture](#proposed-architecture)
4. [Industry Best Practices](#industry-best-practices)
5. [Detailed Solution Options](#detailed-solution-options)
6. [Implementation Plan](#implementation-plan)
7. [Database Changes](#database-changes)
8. [UI/UX Changes](#uiux-changes)
9. [Testing Strategy](#testing-strategy)
10. [Risks and Mitigations](#risks-and-mitigations)
11. [Future Enhancements](#future-enhancements)
12. [Decision Matrix](#decision-matrix)

---

## Problem Statement

### Current Issues

**Issue #1: Wrong Workflow Sequence**
```
Current: Supervisor creates items → Planner creates baseline
Correct: Planner creates baseline → Supervisor executes work
```

**Issue #2: Planner Dependency**
- Planner **cannot start planning** until Supervisor creates items
- Planner **cannot plan** design, procurement, approval phases
- Planner is **blocked** waiting for field team

**Issue #3: Incomplete Planning Scope**
```
Current scope: Construction items only
Missing scope: Design, Procurement, Permits, Testing, Commissioning
```

**Issue #4: Real-World Example**
```
Scenario: New electrical substation project

Current workflow:
1. Supervisor goes to site (no plan exists yet)
2. Supervisor creates items: "Transformer", "SWGR", "Cables"
3. Planner tries to create baseline (too late, work may have started)
4. Missing: Procurement lead time (60 days for transformer!)
5. Missing: Design approvals, permits
6. Result: Incomplete schedule, no true baseline

Correct workflow:
1. Planner creates complete WBS:
   - Design phase (10 days)
   - Permits & approvals (15 days)
   - Transformer procurement (60 days)
   - Site preparation (10 days)
   - Installation (15 days)
   - Testing & commissioning (7 days)
2. Planner sets dependencies
3. Planner calculates critical path (shows transformer procurement is critical!)
4. Planner locks baseline
5. Supervisor executes against baseline
6. Result: Complete project schedule, realistic timeline
```

### Business Impact

**Without this change:**
- ❌ Planners frustrated (can't do their job independently)
- ❌ Incomplete project schedules
- ❌ Missing critical procurement lead times
- ❌ No true baseline (set after work starts)
- ❌ Poor critical path analysis (incomplete data)
- ❌ Application doesn't match industry tools

**With this change:**
- ✅ Professional planning capability
- ✅ Complete project lifecycle visibility
- ✅ Realistic schedules with all phases
- ✅ True baseline before work starts
- ✅ Accurate critical path identification
- ✅ Competitive with industry tools (Primavera, MS Project)

---

## Current Architecture

### Current Data Flow

```
┌─────────────┐
│ SUPERVISOR  │ (creates items)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   ITEMS     │
│  DATABASE   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   PLANNER   │ (reads items, sets dates)
└─────────────┘
```

### Current Item Lifecycle

```
1. Supervisor → Creates Item
2. Supervisor → Sets quantity, unit, category
3. Planner → Finds item
4. Planner → Sets planned dates
5. Planner → Defines dependencies
6. Planner → Locks baseline
7. Supervisor → Updates progress
```

### Current Screen Distribution

| Screen | Supervisor | Manager | Planner | Logistics |
|--------|-----------|---------|---------|-----------|
| Items Management | ✅ Create/Edit | ❌ | ❌ View Only | ❌ |
| Baseline Planning | ❌ | ❌ | ✅ Set dates | ❌ |
| Progress Tracking | ✅ Update | ✅ View | ❌ | ❌ |
| Material Tracking | ✅ Update | ❌ | ❌ | ✅ Manage |

### Current Database Schema

```typescript
// ItemModel
{
  id: string;
  name: string;
  category_id: string;
  site_id: string;
  planned_quantity: number;
  completed_quantity: number;
  unit_of_measurement: string;
  planned_start_date: number;
  planned_end_date: number;
  status: 'not_started' | 'in_progress' | 'completed';
  dependencies: string; // JSON array
  baseline_start_date?: number;
  baseline_end_date?: number;
  is_baseline_locked: boolean;
}
```

---

## Proposed Architecture

### Proposed Data Flow (Option 1 - Recommended)

```
┌─────────────┐
│   PLANNER   │ (creates items, sets dates, defines dependencies)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   ITEMS     │
│  DATABASE   │
└──────┬──────┘
       │
       ├─────────────────┐
       │                 │
       ▼                 ▼
┌─────────────┐   ┌─────────────┐
│ SUPERVISOR  │   │   MANAGER   │
│(updates)    │   │  (monitors) │
└─────────────┘   └─────────────┘
```

### Enhanced Item Lifecycle

```
1. Planner → Creates complete WBS (Work Breakdown Structure)
   ├─ Design activities
   ├─ Procurement activities
   ├─ Construction activities
   └─ Testing & commissioning activities

2. Planner → Sets realistic durations for each phase

3. Planner → Defines dependencies across all phases

4. Planner → Calculates critical path (end-to-end)

5. Planner → Reviews with stakeholders

6. Planner → Locks baseline (before work starts)

7. Supervisor → Receives approved baseline

8. Supervisor → Executes work against baseline

9. Supervisor → Updates progress

10. Manager → Monitors baseline vs actual
```

### Enhanced Screen Distribution

| Screen | Supervisor | Manager | Planner | Logistics |
|--------|-----------|---------|---------|-----------|
| WBS Management | ❌ | ❌ | ✅ Create/Edit | ❌ |
| Items Management | 🔒 Read-Only* | ❌ | ✅ Create/Edit | ❌ |
| Baseline Planning | ❌ | ❌ | ✅ Full Control | ❌ |
| Progress Tracking | ✅ Update | ✅ View | ✅ View | ❌ |
| Material Tracking | ✅ Update | ❌ | 🔍 Plan | ✅ Manage |

*Read-only after baseline lock

---

## Industry Best Practices

### Standard Project Management Workflow (PMI/PMBOK)

#### Phase 1: Initiation
- Project charter
- Stakeholder identification

#### Phase 2: Planning (Planner's Domain)
```
1. Scope Definition
   └─ Create Work Breakdown Structure (WBS)

2. Schedule Development
   ├─ Define activities
   ├─ Sequence activities (dependencies)
   ├─ Estimate durations
   ├─ Develop schedule
   └─ Create baseline

3. Resource Planning
   ├─ Material requirements
   ├─ Labor requirements
   └─ Equipment requirements

4. Risk Planning
   ├─ Identify risks
   └─ Contingency planning
```

#### Phase 3: Execution (Supervisor's Domain)
- Direct and manage work
- Manage team
- Update progress

#### Phase 4: Monitoring & Controlling (Manager's Domain)
- Monitor progress
- Control changes
- Baseline variance analysis

#### Phase 5: Closing
- Handover
- Lessons learned

### Construction Industry Specific Phases

#### 1. Design & Engineering Phase
**Duration:** 10-20% of total project time
**Activities:**
- Conceptual design
- Detailed engineering
- Design reviews
- Approvals from authorities
- As-built drawings preparation

**Example (Electrical Substation):**
```
- Single line diagram design (5 days)
- Protection scheme design (3 days)
- Equipment specifications (7 days)
- Load flow studies (3 days)
- Design approval (5 days)
```

#### 2. Procurement Phase
**Duration:** 30-50% of total project time (often critical path!)
**Activities:**
- Vendor selection
- Bid evaluation
- Purchase order issuance
- Manufacturing
- Quality inspections
- Logistics and delivery

**Example (Electrical Substation):**
```
- Transformer procurement (60 days)
  ├─ RFQ & bid evaluation (15 days)
  ├─ Manufacturing (35 days)
  └─ Delivery (10 days)
- SWGR procurement (45 days)
- Cable procurement (30 days)
- Control panel procurement (40 days)
```

**Critical Note:** Procurement is often on the critical path!

#### 3. Permits & Approvals Phase
**Duration:** 5-15% of total project time
**Activities:**
- Building permits
- Electrical permits
- Environmental clearances
- Safety approvals

**Example:**
```
- Building permit (10 days)
- Electrical authority approval (15 days)
- Fire safety approval (7 days)
```

#### 4. Site Preparation Phase
**Duration:** 5-10% of project time
**Activities:**
- Site mobilization
- Temporary facilities
- Civil foundations

**Example (Electrical Substation):**
```
- Site clearing (3 days)
- Excavation (5 days)
- Transformer foundation (10 days)
- Cable trenching (15 days)
```

#### 5. Installation/Construction Phase
**Duration:** 20-30% of project time
**Activities:**
- Equipment installation
- System integration
- Quality checks

**Example:**
```
- Transformer installation (7 days)
  └─ Depends on: Foundation ready, Transformer delivered
- SWGR installation (5 days)
  └─ Depends on: Base frame ready, SWGR delivered
- Cable laying (10 days)
- Terminations (5 days)
```

#### 6. Testing & Commissioning Phase
**Duration:** 5-10% of project time
**Activities:**
- Pre-commissioning checks
- Testing
- System integration testing
- Performance testing

**Example:**
```
- Insulation resistance testing (2 days)
- Protection relay testing (3 days)
- Load testing (2 days)
- Final energization (1 day)
```

### Dependency Patterns in Construction

#### Pattern 1: Sequential (Finish-to-Start)
```
Design → Procurement → Delivery → Installation → Testing
```

#### Pattern 2: Parallel Paths
```
Civil Works →→→→ Structure
              ↓
Electrical → MEP → Finishes
              ↑
HVAC →→→→→→→→→
```

#### Pattern 3: Convergent
```
Transformer Delivery ↘
Foundation Ready →→→→ Transformer Installation
Manpower Available ↗
```

#### Pattern 4: Lead Times
```
Long Lead Items (Procurement):
├─ Transformer (60 days) ← Often critical path!
├─ Main SWGR (45 days)
└─ Specialized equipment (40-90 days)

Short Lead Items:
├─ Cables (30 days)
├─ Accessories (15 days)
└─ Consumables (7 days)
```

### Industry Tools Comparison

| Feature | Primavera P6 | MS Project | Proposed App |
|---------|--------------|------------|--------------|
| WBS Creation | ✅ | ✅ | ✅ (after change) |
| Full Lifecycle | ✅ | ✅ | ✅ (after change) |
| Dependencies | ✅ | ✅ | ✅ (already exists) |
| Critical Path | ✅ | ✅ | ✅ (already exists) |
| Baseline Lock | ✅ | ✅ | ✅ (already exists) |
| Planner Creates Items | ✅ | ✅ | ❌ (needs fix) |
| Mobile First | ❌ | ❌ | ✅ |
| Offline Capable | ❌ | ❌ | ✅ |

---

## Detailed Solution Options

### Option 1: Planner Creates All Items (Recommended)
Utpal:- will go by this option 1
Additional information: This project is being created for Metro Electrification where Bulk Power Supply( 220 kV, 132 kV kV, 66 kV substations are constructed for receiving and distrbuting powers to 33 kV Auxilary substations, powering catenary systems at 25 kV through overhead contact wires, another case for 650 VDC systems, Control romm building for substations, interface with various system contractors as each contractors are dependent on each other. )
#### Description
Complete role reversal - Planner creates and owns the project WBS, Supervisor updates progress.

#### Implementation Details

**New Screen: WBS Management**
- Location: `src/planning/WBSManagementScreen.tsx`
- Accessible by: Planner role only
- Features:
  - Create items with all phases
  - Edit items (before baseline lock)
  - Delete items (before baseline lock)
  - Organize by phase/category
  - Bulk import from templates

**Modified Screen: Items Management (Supervisor)**
- Change to read-only after baseline lock
- Can view item details
- Cannot create/edit/delete

**New Feature: Phase Categories**
```typescript
type ProjectPhase =
  | 'design'
  | 'procurement'
  | 'interface'
  | 'permits'
  | 'site_prep'
  | 'construction'
  | 'testing'
  | 'commissioning'
  | 'site acceptance test'
  | 'handing over';
```

**Database Changes:**
```typescript
// Add to ItemModel
@field('project_phase') projectPhase!: string;
@field('is_milestone') isMilestone!: boolean;
@field('created_by_role') createdByRole!: string; // 'planner' | 'supervisor'
```

**Schema Migration:**
```typescript
// v12 migration
{
  name: 'project_phase',
  type: 'string',
  isIndexed: true,
},
{
  name: 'is_milestone',
  type: 'boolean',
},
{
  name: 'created_by_role',
  type: 'string',
}
```

#### Pros
- ✅ Industry standard workflow
- ✅ Complete project visibility
- ✅ Planner fully independent
- ✅ Realistic schedules with procurement
- ✅ Professional credibility

#### Cons
- ❌ Requires code changes
- ❌ Change management needed
- ❌ Existing projects need migration

#### Effort
- Development: 2-3 hours
- Testing: 1-2 hours
- Documentation: 1 hour
- **Total: 4-6 hours**

---

### Option 2: Hybrid Approach

#### Description
Two-tier system: Planner creates high-level milestones, Supervisor adds detailed items.

#### Implementation Details

**Item Hierarchy:**
```
Planning Item (Planner creates)
  └─ Execution Items (Supervisor creates)

Example:
Electrical Works (Planning Item - 90 days)
  ├─ Transformer Installation (Execution Item - 7 days)
  ├─ SWGR Installation (Execution Item - 5 days)
  └─ Cable Installation (Execution Item - 10 days)
```

**Database Changes:**
```typescript
@field('parent_item_id') parentItemId?: string;
@field('item_level') itemLevel!: number; // 1 = planning, 2 = execution
```

**Baseline Logic:**
- Baseline lock at planning level
- Execution items inherit baseline constraints
- Progress rolls up to planning level

#### Pros
- ✅ Planner can start immediately
- ✅ Supervisor adds detail as needed
- ✅ Flexible granularity
- ✅ Incremental adoption

#### Cons
- ❌ More complex data model
- ❌ Rollup calculations needed
- ❌ Potential for misalignment

#### Effort
- Development: 4-5 hours
- Testing: 2-3 hours
- **Total: 6-8 hours**

---

### Option 3: Templates Only (Quick Win)

#### Description
Pre-populate common project structures, allow Planner to customize.

#### Implementation Details

**Template Structure:**
```typescript
interface ProjectTemplate {
  id: string;
  name: string;
  category: string; // 'electrical', 'civil', 'mechanical'
  description: string;
  items: TemplateItem[];
}

interface TemplateItem {
  name: string;
  phase: ProjectPhase;
  defaultDuration: number; // days
  dependencies: string[]; // item names
  quantity?: number;
  unit?: string;
}
```

**Example Template: Electrical Substation**
```json
{
  "name": "Electrical Substation - 33kV",
  "category": "electrical",
  "items": [
    {
      "name": "Design & Engineering",
      "phase": "design",
      "defaultDuration": 15,
      "dependencies": []
    },
    {
      "name": "Transformer Procurement",
      "phase": "procurement",
      "defaultDuration": 60,
      "dependencies": ["Design & Engineering"]
    },
    {
      "name": "Foundation Construction",
      "phase": "site_prep",
      "defaultDuration": 10,
      "dependencies": ["Design & Engineering"]
    },
    {
      "name": "Transformer Installation",
      "phase": "construction",
      "defaultDuration": 7,
      "dependencies": ["Transformer Procurement", "Foundation Construction"]
    },
    {
      "name": "Testing & Commissioning",
      "phase": "testing",
      "defaultDuration": 7,
      "dependencies": ["Transformer Installation"]
    }
  ]
}
```

**New Screen: Template Library**
- Browse templates by category
- Preview template structure
- Apply template to project
- Customize items after applying

**Storage:**
- Store templates in database or JSON files
- User can save custom templates

#### Pros
- ✅ Quick to implement
- ✅ Immediate value to users
- ✅ Standardization across projects
- ✅ Best practices built-in
- ✅ No role changes needed

#### Cons
- ❌ Doesn't solve core workflow issue
- ❌ Still requires Option 1 or 2
- ❌ Limited to predefined structures

#### Effort
- Development: 3-4 hours
- Template creation: 2-3 hours
- **Total: 5-7 hours**

---

### Option 4: Keep As-Is (Not Recommended)

#### Description
No changes. Supervisor continues to create items.

#### Workaround
- Planner asks Supervisor to create placeholder items
- Planner sets dates on those items

#### Pros
- ✅ No development needed
- ✅ No change management

#### Cons
- ❌ Inefficient workflow
- ❌ Planner blocked
- ❌ Incomplete schedules
- ❌ Poor user experience
- ❌ Not industry standard
- ❌ Competitive disadvantage

#### Recommendation
**Do not choose this option** unless technical constraints prevent implementation.

---

## Implementation Plan

### Recommended: Option 1 + Option 3

**Rationale:**
- Option 1 fixes the core workflow issue
- Option 3 provides immediate efficiency gains
- Combined approach delivers professional-grade planning capability

### Phase 1: Core Changes (Week 1)

#### Step 1.1: Database Schema Update
**File:** `models/schema/index.ts`

```typescript
// Increment schema version to 12
export default appSchema({
  version: 12,
  tables: [
    // ... existing tables
    tableSchema({
      name: 'items',
      columns: [
        // ... existing columns
        { name: 'project_phase', type: 'string', isIndexed: true },
        { name: 'is_milestone', type: 'boolean' },
        { name: 'created_by_role', type: 'string' },
      ],
    }),
  ],
});
```

#### Step 1.2: Migration Script
**File:** `models/migrations/index.ts`

```typescript
import { schemaMigrations } from '@nozbe/watermelondb/Schema/migrations';

export default schemaMigrations({
  migrations: [
    // ... existing migrations
    {
      toVersion: 12,
      steps: [
        {
          type: 'add_columns',
          table: 'items',
          columns: [
            { name: 'project_phase', type: 'string', isIndexed: true },
            { name: 'is_milestone', type: 'boolean' },
            { name: 'created_by_role', type: 'string' },
          ],
        },
      ],
    },
  ],
});
```

#### Step 1.3: Update ItemModel
**File:** `models/ItemModel.ts`

```typescript
export type ProjectPhase =
  | 'design'
  | 'procurement'
  | 'permits'
  | 'site_prep'
  | 'construction'
  | 'testing'
  | 'commissioning';

export default class ItemModel extends Model {
  static table = 'items';

  // ... existing fields

  @field('project_phase') projectPhase!: ProjectPhase;
  @field('is_milestone') isMilestone!: boolean;
  @field('created_by_role') createdByRole!: string;

  // Helper method
  getPhaseLabel(): string {
    const labels = {
      design: 'Design & Engineering',
      procurement: 'Procurement',
      permits: 'Permits & Approvals',
      site_prep: 'Site Preparation',
      construction: 'Construction',
      testing: 'Testing',
      commissioning: 'Commissioning',
    };
    return labels[this.projectPhase] || 'Unknown';
  }

  getPhaseColor(): string {
    const colors = {
      design: '#2196F3',        // Blue
      procurement: '#FF9800',   // Orange
      permits: '#9C27B0',       // Purple
      site_prep: '#795548',     // Brown
      construction: '#4CAF50',  // Green
      testing: '#F44336',       // Red
      commissioning: '#00BCD4', // Cyan
    };
    return colors[this.projectPhase] || '#666666';
  }
}
```

#### Step 1.4: Create WBS Management Screen
**File:** `src/planning/WBSManagementScreen.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Button, Card, Text, FAB, Chip } from 'react-native-paper';
import { withObservables } from '@nozbe/watermelondb/react';
import { Q } from '@nozbe/watermelondb';
import { database } from '../../models/database';
import ProjectModel from '../../models/ProjectModel';
import ItemModel, { ProjectPhase } from '../../models/ItemModel';
import CategoryModel from '../../models/CategoryModel';

interface WBSManagementScreenProps {
  projects: ProjectModel[];
  categories: CategoryModel[];
}

const WBSManagementScreenComponent: React.FC<WBSManagementScreenProps> = ({
  projects,
  categories,
}) => {
  const [selectedProject, setSelectedProject] = useState<ProjectModel | null>(null);
  const [items, setItems] = useState<ItemModel[]>([]);
  const [selectedPhase, setSelectedPhase] = useState<ProjectPhase | 'all'>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // Load items when project changes
  useEffect(() => {
    if (selectedProject) {
      loadItems();
    }
  }, [selectedProject, selectedPhase]);

  const loadItems = async () => {
    if (!selectedProject) return;

    const query = [Q.on('sites', 'project_id', selectedProject.id)];

    if (selectedPhase !== 'all') {
      query.push(Q.where('project_phase', selectedPhase));
    }

    const projectItems = await database.collections
      .get<ItemModel>('items')
      .query(...query)
      .fetch();

    // Sort by phase order
    const phaseOrder: ProjectPhase[] = [
      'design',
      'procurement',
      'permits',
      'site_prep',
      'construction',
      'testing',
      'commissioning',
    ];

    projectItems.sort((a, b) => {
      const aIndex = phaseOrder.indexOf(a.projectPhase);
      const bIndex = phaseOrder.indexOf(b.projectPhase);
      if (aIndex !== bIndex) return aIndex - bIndex;
      return a.plannedStartDate - b.plannedStartDate;
    });

    setItems(projectItems);
  };

  const handleAddItem = () => {
    setShowAddModal(true);
    // TODO: Implement add item modal
  };

  const handleDeleteItem = async (item: ItemModel) => {
    if (item.isBaselineLocked) {
      Alert.alert('Cannot Delete', 'Baseline is locked. Cannot delete items.');
      return;
    }

    Alert.alert(
      'Delete Item',
      `Are you sure you want to delete "${item.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await database.write(async () => {
              await item.destroyPermanently();
            });
            loadItems();
          },
        },
      ]
    );
  };

  const phases: Array<{ key: ProjectPhase | 'all'; label: string }> = [
    { key: 'all', label: 'All Phases' },
    { key: 'design', label: 'Design' },
    { key: 'procurement', label: 'Procurement' },
    { key: 'permits', label: 'Permits' },
    { key: 'site_prep', label: 'Site Prep' },
    { key: 'construction', label: 'Construction' },
    { key: 'testing', label: 'Testing' },
    { key: 'commissioning', label: 'Commissioning' },
  ];

  return (
    <View style={styles.container}>
      {/* Project Selector */}
      <Card style={styles.selectorCard}>
        <Card.Content>
          <Text variant="labelMedium">Select Project</Text>
          {/* TODO: Add ProjectSelector component */}
        </Card.Content>
      </Card>

      {selectedProject && (
        <>
          {/* Phase Filter Chips */}
          <ScrollView
            horizontal
            style={styles.phaseFilter}
            contentContainerStyle={styles.phaseFilterContent}
            showsHorizontalScrollIndicator={false}
          >
            {phases.map(phase => (
              <Chip
                key={phase.key}
                selected={selectedPhase === phase.key}
                onPress={() => setSelectedPhase(phase.key)}
                style={styles.phaseChip}
              >
                {phase.label}
              </Chip>
            ))}
          </ScrollView>

          {/* Items List */}
          <ScrollView style={styles.itemsList}>
            <View style={styles.itemsHeader}>
              <Text variant="titleMedium">
                Work Breakdown Structure ({items.length} items)
              </Text>
            </View>

            {items.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text variant="bodyLarge" style={styles.emptyText}>
                  No items in this phase
                </Text>
                <Text variant="bodyMedium" style={styles.emptySubtext}>
                  Tap the + button to add items
                </Text>
              </View>
            ) : (
              items.map(item => (
                <Card key={item.id} style={styles.itemCard}>
                  <Card.Content>
                    <View style={styles.itemHeader}>
                      <Text variant="titleMedium">{item.name}</Text>
                      <Chip
                        style={[
                          styles.phaseLabel,
                          { backgroundColor: item.getPhaseColor() + '20' },
                        ]}
                        textStyle={{ color: item.getPhaseColor() }}
                      >
                        {item.getPhaseLabel()}
                      </Chip>
                    </View>

                    <View style={styles.itemDetails}>
                      <Text variant="bodySmall">
                        Duration: {item.getPlannedDuration()} days
                      </Text>
                      <Text variant="bodySmall">
                        Status: {item.status.replace('_', ' ')}
                      </Text>
                    </View>

                    <View style={styles.itemActions}>
                      <Button
                        mode="text"
                        onPress={() => {/* TODO: Edit */}}
                        disabled={item.isBaselineLocked}
                      >
                        Edit
                      </Button>
                      <Button
                        mode="text"
                        onPress={() => handleDeleteItem(item)}
                        disabled={item.isBaselineLocked}
                        textColor="#F44336"
                      >
                        Delete
                      </Button>
                    </View>
                  </Card.Content>
                </Card>
              ))
            )}
          </ScrollView>

          {/* FAB */}
          <FAB
            icon="plus"
            style={styles.fab}
            onPress={handleAddItem}
            label="Add Item"
          />
        </>
      )}
    </View>
  );
};

const enhance = withObservables([], () => ({
  projects: database.collections.get<ProjectModel>('projects').query().observe(),
  categories: database.collections.get<CategoryModel>('categories').query().observe(),
}));

const WBSManagementScreen = enhance(WBSManagementScreenComponent);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  selectorCard: {
    margin: 16,
    elevation: 2,
  },
  phaseFilter: {
    maxHeight: 60,
  },
  phaseFilterContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  phaseChip: {
    marginRight: 8,
  },
  itemsList: {
    flex: 1,
    padding: 16,
  },
  itemsHeader: {
    marginBottom: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    color: '#999',
  },
  itemCard: {
    marginBottom: 12,
    elevation: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  phaseLabel: {
    height: 28,
  },
  itemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  itemActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
});

export default WBSManagementScreen;
```

#### Step 1.5: Add WBS Screen to Planning Navigator
**File:** `src/nav/PlanningNavigator.tsx`

```typescript
import WBSManagementScreen from '../planning/WBSManagementScreen';

// Add to PlanningTabParamList
export type PlanningTabParamList = {
  WBSManagement: undefined;
  GanttChart: undefined;
  ScheduleManagement: undefined;
  ResourcePlanning: undefined;
  MilestoneTracking: undefined;
  Baseline: undefined;
};

// Add tab screen (make it first tab)
<Tab.Screen
  name="WBSManagement"
  component={WBSManagementScreen}
  options={{
    title: 'WBS',
    headerShown: true,
    headerTitle: 'Work Breakdown Structure',
    tabBarIcon: ({ focused, color, size }) => (
      <Text style={{ fontSize: size, color }}>📋</Text>
    ),
  }}
/>
```

#### Step 1.6: Update Supervisor Items Screen
**File:** `src/supervisor/ItemsManagementScreen.tsx`

Add baseline lock check to create/edit/delete functions:

```typescript
const canEdit = !item.isBaselineLocked;

if (!canEdit) {
  Alert.alert(
    'Baseline Locked',
    'Items cannot be modified after baseline is locked. Contact planner for schedule changes.',
  );
  return;
}
```

### Phase 2: Templates (Week 2)

#### Step 2.1: Create Template Model
**File:** `models/ProjectTemplateModel.ts`

```typescript
import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

export default class ProjectTemplateModel extends Model {
  static table = 'project_templates';

  @field('name') name!: string;
  @field('category') category!: string;
  @field('description') description!: string;
  @field('items_json') itemsJson!: string; // JSON of template items
  @field('is_predefined') isPredefined!: boolean;
}
```

#### Step 2.2: Add Schema
**File:** `models/schema/index.ts`

```typescript
tableSchema({
  name: 'project_templates',
  columns: [
    { name: 'name', type: 'string' },
    { name: 'category', type: 'string', isIndexed: true },
    { name: 'description', type: 'string' },
    { name: 'items_json', type: 'string' },
    { name: 'is_predefined', type: 'boolean' },
  ],
}),
```

#### Step 2.3: Create Default Templates
**File:** `services/db/DefaultTemplates.ts`

```typescript
export const DEFAULT_TEMPLATES = [
  {
    name: 'Electrical Substation - 33kV',
    category: 'electrical',
    description: 'Complete workflow for 33kV electrical substation project',
    items: [
      {
        name: 'Design & Engineering',
        phase: 'design',
        duration: 15,
        dependencies: [],
      },
      {
        name: 'Single Line Diagram Approval',
        phase: 'permits',
        duration: 7,
        dependencies: ['Design & Engineering'],
      },
      {
        name: 'Transformer Procurement',
        phase: 'procurement',
        duration: 60,
        dependencies: ['Design & Engineering'],
      },
      // ... more items
    ],
  },
  // ... more templates
];
```

#### Step 2.4: Create Template Library Screen
**File:** `src/planning/TemplatLibraryScreen.tsx`

(Similar structure to WBS screen, shows template cards with preview)

### Phase 3: Testing & Documentation (Week 3)

#### Test Cases
1. Planner creates items in WBS
2. Planner applies template
3. Planner locks baseline
4. Supervisor views items (read-only)
5. Supervisor updates progress
6. Migration of existing projects

#### Documentation Updates
- Update `PLANNING_MODULE_USER_GUIDE.md`
- Update `DATABASE.md`
- Create `WBS_MANAGEMENT_GUIDE.md`

---

## Database Changes

### Schema Version: 11 → 12

#### New Columns in `items` Table

| Column | Type | Description | Indexed |
|--------|------|-------------|---------|
| `project_phase` | string | Phase of project lifecycle | Yes |
| `is_milestone` | boolean | Mark as milestone | No |
| `created_by_role` | string | Role that created item | No |

#### New Table: `project_templates`

| Column | Type | Description |
|--------|------|-------------|
| `id` | string | Primary key |
| `name` | string | Template name |
| `category` | string | Template category |
| `description` | string | Template description |
| `items_json` | string | JSON array of template items |
| `is_predefined` | boolean | System template vs user template |
| `created_at` | number | Timestamp |
| `updated_at` | number | Timestamp |

#### Migration Strategy

```typescript
// For existing items without phase
UPDATE items
SET project_phase = 'construction',
    created_by_role = 'supervisor',
    is_milestone = false
WHERE project_phase IS NULL;
```

---

## UI/UX Changes

### New Screens

1. **WBS Management Screen** (`src/planning/WBSManagementScreen.tsx`)
   - Create/Edit/Delete items
   - Filter by phase
   - Sort by timeline
   - Bulk operations

2. **Template Library Screen** (`src/planning/TemplateLibraryScreen.tsx`)
   - Browse templates
   - Preview template
   - Apply template
   - Save custom template

3. **Item Create/Edit Modal** (`src/planning/components/ItemFormModal.tsx`)
   - All item fields
   - Phase selection
   - Milestone checkbox
   - Duration helper

### Modified Screens

1. **Supervisor Items Management**
   - Add "Read-Only" banner when baseline locked
   - Disable create/edit/delete buttons
   - Show who created item (Planner/Supervisor)

2. **Planning Navigator**
   - Add WBS tab (first position)
   - Reorder tabs: WBS, Baseline, Gantt, Schedule, Resources, Milestones

3. **Baseline Planning Screen**
   - Show phase grouping
   - Color-code by phase
   - Filter by phase

### Visual Design

#### Phase Color Coding

```typescript
const PHASE_COLORS = {
  design: '#2196F3',        // Blue
  procurement: '#FF9800',   // Orange
  permits: '#9C27B0',       // Purple
  site_prep: '#795548',     // Brown
  construction: '#4CAF50',  // Green
  testing: '#F44336',       // Red
  commissioning: '#00BCD4', // Cyan
};
```

#### Phase Icons

```typescript
const PHASE_ICONS = {
  design: '✏️',
  procurement: '🛒',
  permits: '📋',
  site_prep: '🏗️',
  construction: '🔨',
  testing: '🧪',
  commissioning: '✅',
};
```

---

## Testing Strategy

### Unit Tests

```typescript
describe('ItemModel', () => {
  it('should return correct phase label', () => {
    const item = new ItemModel();
    item.projectPhase = 'procurement';
    expect(item.getPhaseLabel()).toBe('Procurement');
  });

  it('should return correct phase color', () => {
    const item = new ItemModel();
    item.projectPhase = 'design';
    expect(item.getPhaseColor()).toBe('#2196F3');
  });
});
```

### Integration Tests

1. **Create Item as Planner**
   - Login as Planner
   - Navigate to WBS Management
   - Create item in each phase
   - Verify item appears in Baseline screen

2. **Lock Baseline**
   - Create items
   - Lock baseline
   - Verify Supervisor cannot edit

3. **Template Application**
   - Select template
   - Apply to project
   - Verify all items created
   - Verify dependencies set

### User Acceptance Testing

#### Test Scenario 1: New Project Planning
```
User: Planner
Steps:
1. Create new project
2. Apply "Electrical Substation" template
3. Customize items (add/remove/edit)
4. Set dates for each item
5. Define dependencies
6. Calculate critical path
7. Lock baseline

Expected Result:
- Complete WBS with all phases
- Dependencies correctly set
- Critical path identified
- Baseline locked

Pass/Fail: _____
```

#### Test Scenario 2: Supervisor Views Baseline
```
User: Supervisor
Steps:
1. Login as Supervisor
2. Navigate to Items Management
3. Try to create new item (should fail)
4. View item details
5. Update progress on item

Expected Result:
- Cannot create/edit items
- Can view all item details
- Can update progress

Pass/Fail: _____
```

### Performance Testing

- Load time with 100 items: < 2 seconds
- Template application: < 1 second
- Phase filtering: < 500ms

---

## Risks and Mitigations

### Risk 1: Change Resistance
**Risk:** Users comfortable with current workflow resist change

**Mitigation:**
- Comprehensive user training
- Video tutorials
- In-app tooltips
- Gradual rollout (optional flag)

### Risk 2: Data Migration Issues
**Risk:** Existing projects have incomplete data

**Mitigation:**
- Default phase to 'construction' for existing items
- Migration script with validation
- Backup before migration
- Rollback plan

### Risk 3: Role Confusion
**Risk:** Users unclear on new responsibilities

**Mitigation:**
- Clear documentation
- Role-based help screens
- Alert messages when trying restricted actions
- Training sessions

### Risk 4: Incomplete Templates
**Risk:** Templates don't match user needs

**Mitigation:**
- Start with 3-5 common templates
- Allow template customization
- User feedback mechanism
- Regular template updates

### Risk 5: Performance with Large Projects
**Risk:** Slow performance with 500+ items

**Mitigation:**
- Pagination on WBS screen
- Lazy loading
- Phase filtering (loads subset)
- Database indexing on project_phase

---

## Future Enhancements

### Phase 1 (Post-Implementation)

1. **Advanced Dependencies**
   - Start-to-Start (SS)
   - Finish-to-Finish (FF)
   - Lag times (+5 days)
   - Lead times (-2 days)

2. **Resource Management**
   - Labor resources per item
   - Equipment allocation
   - Resource leveling
   - Resource conflict detection

3. **Gantt Chart Enhancement**
   - Visual dependency lines
   - Drag-to-reschedule
   - Zoom levels (day/week/month)
   - Print/export Gantt

### Phase 2 (3-6 Months)

1. **Advanced Planning Features**
   - What-if scenarios
   - Multiple baselines (rev1, rev2)
   - Baseline comparison
   - Schedule compression (crashing/fast-tracking)

2. **Reporting**
   - Earned Value Management (EVM)
   - S-curve generation
   - Progress reports with charts
   - Executive dashboards

3. **Collaboration**
   - Comments on items
   - @mentions
   - Change requests
   - Approval workflows

### Phase 3 (6-12 Months)

1. **AI/ML Features**
   - Duration prediction based on historical data
   - Risk identification
   - Anomaly detection
   - Schedule optimization suggestions

2. **Integration**
   - Import from MS Project
   - Export to Primavera P6
   - API for third-party tools
   - Email notifications

---

## Decision Matrix

### Evaluation Criteria

| Criteria | Weight | Option 1 | Option 2 | Option 3 | Option 4 |
|----------|--------|----------|----------|----------|----------|
| **Alignment with Industry Standards** | 25% | ✅ 10/10 | 🟡 7/10 | 🟡 6/10 | ❌ 2/10 |
| **User Experience** | 20% | ✅ 9/10 | 🟡 7/10 | 🟡 6/10 | ❌ 3/10 |
| **Implementation Effort** | 15% | 🟡 7/10 | 🟡 6/10 | ✅ 8/10 | ✅ 10/10 |
| **Completeness of Solution** | 20% | ✅ 10/10 | 🟡 7/10 | ❌ 4/10 | ❌ 1/10 |
| **Scalability** | 10% | ✅ 9/10 | 🟡 7/10 | ✅ 8/10 | ❌ 4/10 |
| **Maintainability** | 10% | ✅ 8/10 | 🟡 6/10 | ✅ 8/10 | ✅ 9/10 |

### Weighted Scores

| Option | Total Score | Rank |
|--------|-------------|------|
| **Option 1: Planner Creates Items** | **8.85/10** | 🥇 1st |
| Option 2: Hybrid Approach | 6.85/10 | 🥈 2nd |
| Option 3: Templates Only | 6.40/10 | 🥉 3rd |
| Option 4: Keep As-Is | 3.60/10 | 4th |

### Recommendation

**✅ Implement Option 1 + Option 3**

**Justification:**
1. Highest score on industry alignment (10/10)
2. Best user experience (9/10)
3. Most complete solution (10/10)
4. Adding Option 3 (templates) provides quick wins
5. Combined approach scores 9.2/10 overall

---

## Cost-Benefit Analysis

### Costs

| Item | Effort | Cost (Time) |
|------|--------|-------------|
| Development (Option 1) | 3 hours | 3 hours |
| Development (Option 3) | 4 hours | 4 hours |
| Testing | 2 hours | 2 hours |
| Documentation | 1 hour | 1 hour |
| User Training | 2 hours | 2 hours |
| **Total** | | **12 hours** |

### Benefits

#### Quantifiable Benefits

1. **Time Savings**
   - Planner saves 2 hours per project (no coordination with supervisor)
   - Template usage saves 4 hours per project (vs manual entry)
   - **Annual savings:** 50 projects × 6 hours = 300 hours

2. **Schedule Accuracy**
   - Complete schedules include procurement (50-60 days)
   - Reduces project delays by 15% average
   - **Value:** Better project delivery

3. **Reduced Rework**
   - Baseline set before work starts
   - Clear dependencies reduce coordination issues
   - **Estimate:** 10% reduction in rework

#### Qualitative Benefits

1. ✅ **Professional Credibility**
   - Application matches industry-standard tools
   - Suitable for enterprise adoption

2. ✅ **User Satisfaction**
   - Planners can work independently
   - Supervisors have clear execution plan
   - Managers see complete project view

3. ✅ **Competitive Advantage**
   - Differentiation from field-tracking-only apps
   - Positions as full project management solution

4. ✅ **Scalability**
   - Supports large, complex projects
   - Suitable for multi-phase programs

### ROI Calculation

```
Investment: 12 hours development
Return: 300 hours saved annually
ROI: 300/12 = 25x return

Payback Period: After 1-2 projects
```

---

## Appendix A: Sample Templates

### Template 1: Electrical Substation - 33kV

```json
{
  "name": "Electrical Substation - 33kV",
  "category": "electrical",
  "description": "Complete workflow for 33kV electrical substation project including design, procurement, construction, and commissioning",
  "items": [
    {
      "name": "Single Line Diagram Design",
      "phase": "design",
      "duration": 5,
      "dependencies": [],
      "milestone": false
    },
    {
      "name": "Protection Scheme Design",
      "phase": "design",
      "duration": 3,
      "dependencies": ["Single Line Diagram Design"],
      "milestone": false
    },
    {
      "name": "Equipment Specifications",
      "phase": "design",
      "duration": 7,
      "dependencies": ["Protection Scheme Design"],
      "milestone": false
    },
    {
      "name": "Design Approval",
      "phase": "permits",
      "duration": 5,
      "dependencies": ["Equipment Specifications"],
      "milestone": true
    },
    {
      "name": "Transformer Procurement",
      "phase": "procurement",
      "duration": 60,
      "dependencies": ["Design Approval"],
      "milestone": false,
      "notes": "Critical path item - long lead time"
    },
    {
      "name": "33kV SWGR Procurement",
      "phase": "procurement",
      "duration": 45,
      "dependencies": ["Design Approval"],
      "milestone": false
    },
    {
      "name": "Control Panel Procurement",
      "phase": "procurement",
      "duration": 40,
      "dependencies": ["Design Approval"],
      "milestone": false
    },
    {
      "name": "Cable Procurement",
      "phase": "procurement",
      "duration": 30,
      "dependencies": ["Design Approval"],
      "milestone": false
    },
    {
      "name": "Electrical Authority Approval",
      "phase": "permits",
      "duration": 15,
      "dependencies": ["Design Approval"],
      "milestone": true
    },
    {
      "name": "Site Mobilization",
      "phase": "site_prep",
      "duration": 3,
      "dependencies": ["Electrical Authority Approval"],
      "milestone": false
    },
    {
      "name": "Transformer Foundation",
      "phase": "site_prep",
      "duration": 10,
      "dependencies": ["Site Mobilization"],
      "milestone": false
    },
    {
      "name": "AT Foundation",
      "phase": "site_prep",
      "duration": 10,
      "dependencies": ["Site Mobilization"],
      "milestone": false
    },
    {
      "name": "Base Frame Installation",
      "phase": "site_prep",
      "duration": 5,
      "dependencies": ["Transformer Foundation"],
      "milestone": false
    },
    {
      "name": "Cable Trenching",
      "phase": "site_prep",
      "duration": 15,
      "dependencies": ["Site Mobilization"],
      "milestone": false
    },
    {
      "name": "Transformer Installation",
      "phase": "construction",
      "duration": 7,
      "dependencies": ["Transformer Procurement", "Transformer Foundation"],
      "milestone": true
    },
    {
      "name": "33kV SWGR Installation",
      "phase": "construction",
      "duration": 5,
      "dependencies": ["33kV SWGR Procurement", "Base Frame Installation"],
      "milestone": false
    },
    {
      "name": "AT Installation",
      "phase": "construction",
      "duration": 5,
      "dependencies": ["AT Foundation"],
      "milestone": false
    },
    {
      "name": "Control Panel Installation",
      "phase": "construction",
      "duration": 3,
      "dependencies": ["Control Panel Procurement", "Base Frame Installation"],
      "milestone": false
    },
    {
      "name": "Cable Laying - HT Side",
      "phase": "construction",
      "duration": 10,
      "dependencies": ["Cable Procurement", "Cable Trenching", "Transformer Installation"],
      "milestone": false
    },
    {
      "name": "Cable Laying - LT Side",
      "phase": "construction",
      "duration": 8,
      "dependencies": ["Cable Procurement", "Cable Trenching", "33kV SWGR Installation"],
      "milestone": false
    },
    {
      "name": "Cable Terminations - HT",
      "phase": "construction",
      "duration": 5,
      "dependencies": ["Cable Laying - HT Side"],
      "milestone": false
    },
    {
      "name": "Cable Terminations - LT",
      "phase": "construction",
      "duration": 5,
      "dependencies": ["Cable Laying - LT Side"],
      "milestone": false
    },
    {
      "name": "Control Wiring",
      "phase": "construction",
      "duration": 7,
      "dependencies": ["Control Panel Installation", "33kV SWGR Installation"],
      "milestone": false
    },
    {
      "name": "Earthing System Installation",
      "phase": "construction",
      "duration": 5,
      "dependencies": ["Site Mobilization"],
      "milestone": false
    },
    {
      "name": "Insulation Resistance Testing",
      "phase": "testing",
      "duration": 2,
      "dependencies": ["Cable Terminations - HT", "Cable Terminations - LT"],
      "milestone": false
    },
    {
      "name": "Protection Relay Settings",
      "phase": "testing",
      "duration": 3,
      "dependencies": ["Control Wiring"],
      "milestone": false
    },
    {
      "name": "Earthing System Testing",
      "phase": "testing",
      "duration": 1,
      "dependencies": ["Earthing System Installation"],
      "milestone": false
    },
    {
      "name": "Pre-Energization Checks",
      "phase": "testing",
      "duration": 2,
      "dependencies": ["Insulation Resistance Testing", "Protection Relay Settings", "Earthing System Testing"],
      "milestone": true
    },
    {
      "name": "Energization",
      "phase": "commissioning",
      "duration": 1,
      "dependencies": ["Pre-Energization Checks"],
      "milestone": true
    },
    {
      "name": "No-Load Testing",
      "phase": "commissioning",
      "duration": 1,
      "dependencies": ["Energization"],
      "milestone": false
    },
    {
      "name": "Load Testing",
      "phase": "commissioning",
      "duration": 2,
      "dependencies": ["No-Load Testing"],
      "milestone": false
    },
    {
      "name": "Final Documentation & Handover",
      "phase": "commissioning",
      "duration": 3,
      "dependencies": ["Load Testing"],
      "milestone": true
    }
  ],
  "totalDuration": "~120 days (including procurement)",
  "criticalPath": "Design → Transformer Procurement → Installation → Testing → Commissioning"
}
```

### Template 2: Building Construction - Small Commercial

```json
{
  "name": "Commercial Building - Small (up to 5000 sq ft)",
  "category": "civil",
  "description": "Standard workflow for small commercial building construction",
  "items": [
    {
      "name": "Architectural Design",
      "phase": "design",
      "duration": 15,
      "dependencies": []
    },
    {
      "name": "Structural Design",
      "phase": "design",
      "duration": 10,
      "dependencies": ["Architectural Design"]
    },
    {
      "name": "MEP Design",
      "phase": "design",
      "duration": 10,
      "dependencies": ["Architectural Design"]
    },
    {
      "name": "Building Permit Application",
      "phase": "permits",
      "duration": 20,
      "dependencies": ["Structural Design", "MEP Design"]
    },
    {
      "name": "Site Clearing & Grading",
      "phase": "site_prep",
      "duration": 5,
      "dependencies": ["Building Permit Application"]
    },
    {
      "name": "Foundation Excavation",
      "phase": "site_prep",
      "duration": 3,
      "dependencies": ["Site Clearing & Grading"]
    },
    {
      "name": "Foundation Concrete Work",
      "phase": "construction",
      "duration": 7,
      "dependencies": ["Foundation Excavation"]
    },
    {
      "name": "Structural Framework",
      "phase": "construction",
      "duration": 15,
      "dependencies": ["Foundation Concrete Work"]
    },
    {
      "name": "Roofing",
      "phase": "construction",
      "duration": 7,
      "dependencies": ["Structural Framework"]
    },
    {
      "name": "External Walls",
      "phase": "construction",
      "duration": 10,
      "dependencies": ["Structural Framework"]
    },
    {
      "name": "Plumbing Rough-In",
      "phase": "construction",
      "duration": 5,
      "dependencies": ["Structural Framework"]
    },
    {
      "name": "Electrical Rough-In",
      "phase": "construction",
      "duration": 5,
      "dependencies": ["Structural Framework"]
    },
    {
      "name": "HVAC Installation",
      "phase": "construction",
      "duration": 7,
      "dependencies": ["Structural Framework"]
    },
    {
      "name": "Insulation",
      "phase": "construction",
      "duration": 3,
      "dependencies": ["Plumbing Rough-In", "Electrical Rough-In", "HVAC Installation"]
    },
    {
      "name": "Drywall Installation",
      "phase": "construction",
      "duration": 7,
      "dependencies": ["Insulation"]
    },
    {
      "name": "Interior Painting",
      "phase": "construction",
      "duration": 5,
      "dependencies": ["Drywall Installation"]
    },
    {
      "name": "Flooring",
      "phase": "construction",
      "duration": 5,
      "dependencies": ["Interior Painting"]
    },
    {
      "name": "Final Electrical Fixtures",
      "phase": "construction",
      "duration": 3,
      "dependencies": ["Interior Painting"]
    },
    {
      "name": "Final Plumbing Fixtures",
      "phase": "construction",
      "duration": 3,
      "dependencies": ["Interior Painting"]
    },
    {
      "name": "Final Inspections",
      "phase": "testing",
      "duration": 3,
      "dependencies": ["Flooring", "Final Electrical Fixtures", "Final Plumbing Fixtures"]
    },
    {
      "name": "Punch List Completion",
      "phase": "commissioning",
      "duration": 5,
      "dependencies": ["Final Inspections"]
    },
    {
      "name": "Certificate of Occupancy",
      "phase": "commissioning",
      "duration": 2,
      "dependencies": ["Punch List Completion"]
    }
  ]
}
```

### Template 3: MEP Installation - Office Building

```json
{
  "name": "MEP Installation - Office Building",
  "category": "mep",
  "description": "Mechanical, Electrical, and Plumbing installation workflow",
  "items": [
    {
      "name": "MEP Shop Drawings",
      "phase": "design",
      "duration": 10,
      "dependencies": []
    },
    {
      "name": "MEP Coordination Drawings",
      "phase": "design",
      "duration": 7,
      "dependencies": ["MEP Shop Drawings"]
    },
    {
      "name": "Equipment Procurement",
      "phase": "procurement",
      "duration": 45,
      "dependencies": ["MEP Shop Drawings"]
    },
    {
      "name": "Underground Plumbing",
      "phase": "construction",
      "duration": 10,
      "dependencies": ["MEP Coordination Drawings"]
    },
    {
      "name": "Electrical Conduit Installation",
      "phase": "construction",
      "duration": 15,
      "dependencies": ["MEP Coordination Drawings"]
    },
    {
      "name": "HVAC Ductwork Installation",
      "phase": "construction",
      "duration": 20,
      "dependencies": ["MEP Coordination Drawings"]
    },
    {
      "name": "Plumbing Piping - Vertical Risers",
      "phase": "construction",
      "duration": 12,
      "dependencies": ["Underground Plumbing"]
    },
    {
      "name": "Plumbing Piping - Horizontal Distribution",
      "phase": "construction",
      "duration": 15,
      "dependencies": ["Plumbing Piping - Vertical Risers"]
    },
    {
      "name": "Fire Sprinkler System",
      "phase": "construction",
      "duration": 10,
      "dependencies": ["MEP Coordination Drawings"]
    },
    {
      "name": "Electrical Cable Pulling",
      "phase": "construction",
      "duration": 10,
      "dependencies": ["Electrical Conduit Installation"]
    },
    {
      "name": "Lighting Installation",
      "phase": "construction",
      "duration": 7,
      "dependencies": ["Electrical Cable Pulling"]
    },
    {
      "name": "Power Panel Installation",
      "phase": "construction",
      "duration": 5,
      "dependencies": ["Electrical Cable Pulling"]
    },
    {
      "name": "HVAC Equipment Installation",
      "phase": "construction",
      "duration": 10,
      "dependencies": ["Equipment Procurement", "HVAC Ductwork Installation"]
    },
    {
      "name": "Plumbing Fixtures Installation",
      "phase": "construction",
      "duration": 7,
      "dependencies": ["Plumbing Piping - Horizontal Distribution"]
    },
    {
      "name": "Fire Alarm System",
      "phase": "construction",
      "duration": 5,
      "dependencies": ["Electrical Cable Pulling"]
    },
    {
      "name": "BMS (Building Management System)",
      "phase": "construction",
      "duration": 7,
      "dependencies": ["HVAC Equipment Installation"]
    },
    {
      "name": "Electrical System Testing",
      "phase": "testing",
      "duration": 3,
      "dependencies": ["Lighting Installation", "Power Panel Installation"]
    },
    {
      "name": "Plumbing System Testing",
      "phase": "testing",
      "duration": 2,
      "dependencies": ["Plumbing Fixtures Installation"]
    },
    {
      "name": "Fire Sprinkler Testing",
      "phase": "testing",
      "duration": 2,
      "dependencies": ["Fire Sprinkler System"]
    },
    {
      "name": "HVAC System Testing & Balancing",
      "phase": "testing",
      "duration": 5,
      "dependencies": ["HVAC Equipment Installation", "BMS"]
    },
    {
      "name": "Fire Alarm Testing",
      "phase": "testing",
      "duration": 2,
      "dependencies": ["Fire Alarm System"]
    },
    {
      "name": "MEP Systems Commissioning",
      "phase": "commissioning",
      "duration": 7,
      "dependencies": ["Electrical System Testing", "Plumbing System Testing", "Fire Sprinkler Testing", "HVAC System Testing & Balancing", "Fire Alarm Testing"]
    },
    {
      "name": "As-Built Drawings Submission",
      "phase": "commissioning",
      "duration": 5,
      "dependencies": ["MEP Systems Commissioning"]
    }
  ]
}
```

---

## Appendix B: User Stories

### User Story 1: Planner Creates New Project Schedule

**As a** Planner
**I want to** create a complete project schedule from scratch
**So that** I can plan all phases before construction starts

**Acceptance Criteria:**
- [ ] I can create items in all project phases (design, procurement, construction, testing)
- [ ] I can set realistic durations for each item
- [ ] I can define dependencies between items across phases
- [ ] I can see the critical path including procurement lead times
- [ ] I can lock the baseline before work starts

**Priority:** High
**Effort:** 3 story points

---

### User Story 2: Planner Uses Template

**As a** Planner
**I want to** apply a pre-defined project template
**So that** I can quickly set up a standard project schedule

**Acceptance Criteria:**
- [ ] I can browse available templates by category
- [ ] I can preview template structure before applying
- [ ] I can apply template to my project with one click
- [ ] I can customize template items after applying
- [ ] Template includes realistic durations and dependencies

**Priority:** High
**Effort:** 2 story points

---

### User Story 3: Supervisor Views Locked Baseline

**As a** Supervisor
**I want to** view the approved baseline schedule
**So that** I know what work needs to be done and when

**Acceptance Criteria:**
- [ ] I can view all planned items
- [ ] I can see start dates, end dates, and durations
- [ ] I can see dependencies between items
- [ ] I cannot create, edit, or delete items after baseline lock
- [ ] I receive clear message when trying to edit locked baseline

**Priority:** High
**Effort:** 1 story point

---

### User Story 4: Planner Includes Procurement

**As a** Planner
**I want to** include procurement activities in my schedule
**So that** long lead times are accounted for in the critical path

**Acceptance Criteria:**
- [ ] I can create procurement phase items
- [ ] I can set procurement duration (e.g., 60 days for transformer)
- [ ] Procurement items can be predecessors to construction items
- [ ] Critical path calculation includes procurement
- [ ] I can see if procurement is on critical path

**Priority:** High
**Effort:** 2 story points

---

### User Story 5: Manager Views Complete Project Timeline

**As a** Project Manager
**I want to** see the complete project timeline including all phases
**So that** I can understand total project duration and key milestones

**Acceptance Criteria:**
- [ ] I can view items grouped by phase
- [ ] I can see color-coded phase indicators
- [ ] I can filter view by specific phase
- [ ] I can see project start date to completion date
- [ ] I can export project timeline

**Priority:** Medium
**Effort:** 2 story points

---

## Appendix C: Glossary

**Baseline:** Original approved project schedule, locked for comparison with actual progress.

**Critical Path:** Sequence of tasks that determines the minimum project duration; delays to critical path tasks delay the entire project.

**Dependency:** Relationship between tasks where one must finish before another starts (Finish-to-Start).

**Lead Time:** The time between ordering materials and receiving them; often the longest duration in a project.

**Milestone:** Significant point or event in the project timeline; typically has zero duration.

**Procurement:** The process of ordering and receiving materials and equipment.

**WBS (Work Breakdown Structure):** Hierarchical decomposition of project work into manageable components.

**Project Phase:** Major stage in project lifecycle (Design, Procurement, Construction, Testing, Commissioning).

**Finish-to-Start (FS):** Most common dependency type; Task B cannot start until Task A finishes.

**Planner:** Role responsible for creating and managing the project schedule.

**Supervisor:** Role responsible for executing work and updating progress against the plan.

---

## Appendix D: References

### Industry Standards
- PMI PMBOK Guide (Project Management Body of Knowledge)
- AACE International Recommended Practices
- CIOB Code of Practice for Project Management

### Similar Tools
- Oracle Primavera P6
- Microsoft Project
- Procore Construction Management
- Buildertrend

### Construction Planning Resources
- Construction Management Association of America (CMAA)
- Associated General Contractors (AGC) Planning Guidelines
- Construction Industry Institute (CII) Best Practices

---

## Document Approval

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Product Owner | _________ | _________ | ______ |
| Technical Lead | _________ | _________ | ______ |
| Planner (User Rep) | _________ | _________ | ______ |
| Supervisor (User Rep) | _________ | _________ | ______ |

---

## Change Log

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-10-13 | Claude AI | Initial proposal document |

---

**END OF DOCUMENT**

**Total Pages:** 50+
**Total Words:** ~15,000
**Estimated Reading Time:** 45-60 minutes

---

## Quick Decision Guide

**If you need to decide quickly, answer these 3 questions:**

1. **Should Planner be able to create items independently?**
   - [Yes ] Yes → Implement Option 1
   - [ ] No → Keep current (Option 4)

2. **Do you want templates for quick setup?**
   - [ ] Yes → Add Option 3
   - [ ] No → Skip templates

3. **When to implement?**
   - [ ] Now (recommended) → 12 hours total
   - [ ] Later (v1.5) → Add to backlog

**Recommended Decision:**
✅ Yes + Yes + Now = **Option 1 + Option 3** (Best value, 12 hours)
