# Planner Item Creation - Implementation Plan v2.0

**Version:** 2.0
**Date:** 2025-10-14
**Status:** Ready for Implementation
**Approved Option:** Option 1 - Planner Creates All Items
**Project Type:** Metro Electrification (220kV, 132kV, 66kV, 33kV substations, 25kV OHE, 650VDC)

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture Enhancements](#architecture-enhancements)
3. [5-Sprint Implementation Plan](#5-sprint-implementation-plan)
4. [Database Schema Changes](#database-schema-changes)
5. [Modular Template System](#modular-template-system)
6. [Future Enhancements (v1.4)](#future-enhancements-v14)
7. [Success Metrics](#success-metrics)
8. [Appendix: Template Modules](#appendix-template-modules)

---

## Executive Summary

### Business Context

**Project Type:** Metro Electrification Infrastructure
- Bulk Power Supply (220kV, 132kV, 66kV substations)
- 33kV Auxiliary substations
- Catenary systems (25kV overhead contact wires)
- Third rail systems (650VDC)
- Control room buildings
- Multi-contractor interface management

### Key Decisions

| Decision Point | Selected Option |
|----------------|-----------------|
| **Core Approach** | Option 1: Planner Creates All Items |
| **Implementation Strategy** | 5 Sprints (5 weeks, 44-62 hours total) |
| **WBS Structure** | Hierarchical with auto-generated codes (1.2.3.4) |
| **Template System** | Modular & Combinable (8 Metro-specific modules) |
| **Phase Structure** | 11 phases (added mobilization, interface, SAT, handover) |
| **Critical Path** | Visual highlighting with float calculation |
| **Interface Management** | Deferred to v1.4 (schema prepared) |
| **Sub-roles** | Not required at this stage |

### Benefits

✅ **Industry Standard Workflow** - Matches Primavera P6 / MS Project
✅ **Complete Project Lifecycle** - All phases from design to handover
✅ **Hierarchical WBS** - Professional work breakdown structure
✅ **Modular Templates** - Flexible, combinable Metro project templates
✅ **Critical Path Management** - Identify and track critical activities
✅ **Risk Management** - Track dependency risks at item level
✅ **Planner Independence** - No dependency on field teams for planning

---

## Architecture Enhancements

### 1. Enhanced Phase Structure (11 Phases)

```typescript
export type ProjectPhase =
  | 'design'           // Design & Engineering
  | 'approvals'        // Statutory/Utility approvals (renamed from 'permits')
  | 'mobilization'     // Resource mobilization to site ✅ NEW
  | 'procurement'      // Equipment procurement
  | 'interface'        // Interface coordination ✅ NEW (deferred to v1.4)
  | 'site_prep'        // Site preparation & civil works
  | 'construction'     // Installation/Construction
  | 'testing'          // Testing & Pre-commissioning
  | 'commissioning'    // Commissioning
  | 'sat'              // Site Acceptance Test ✅ NEW
  | 'handover';        // Handover & Documentation ✅ NEW
```

**Rationale:**
- **mobilization**: Large infrastructure projects require separate tracking for resource mobilization
- **approvals**: More accurate term for utility/statutory approvals than "permits"
- **interface**: Critical for multi-contractor coordination (Metro projects)
- **sat**: Standard milestone in Metro projects before client handover
- **handover**: Final documentation and knowledge transfer phase

### 2. Hierarchical WBS Code System

**Format:** `X.Y.Z.W` (up to 4 levels)

**Example Structure:**
```
1.0.0.0 - 220kV Substation Project (Level 1)
├─ 1.1.0.0 - Design & Engineering (Level 2)
│  ├─ 1.1.1.0 - Single Line Diagram (Level 3)
│  ├─ 1.1.2.0 - Protection Scheme (Level 3)
│  └─ 1.1.3.0 - Equipment Specifications (Level 3)
├─ 1.2.0.0 - Procurement (Level 2)
│  ├─ 1.2.1.0 - Power Transformer 220/132kV (Level 3)
│  │  ├─ 1.2.1.1 - RFQ & Bid Evaluation (Level 4)
│  │  ├─ 1.2.1.2 - Manufacturing (Level 4)
│  │  └─ 1.2.1.3 - FAT & Dispatch (Level 4)
│  └─ 1.2.2.0 - 132kV SWGR Procurement (Level 3)
└─ 1.3.0.0 - Construction (Level 2)
   ├─ 1.3.1.0 - Transformer Installation (Level 3)
   └─ 1.3.2.0 - SWGR Installation (Level 3)
```

**Auto-Generation Logic:**
```typescript
// When creating child item under parent "1.2.0.0":
// 1. Find all children: 1.2.1.0, 1.2.2.0, 1.2.3.0
// 2. Next available code: 1.2.4.0
// 3. Increment level: wbsLevel = parent.wbsLevel + 1

// When creating sibling to "1.2.0.0":
// 1. Find siblings at same level: 1.1.0.0, 1.2.0.0
// 2. Next available code: 1.3.0.0
```

### 3. Critical Path & Risk Management

**Critical Path Identification:**
- Automatic calculation based on dependencies and durations
- Visual highlighting in Gantt chart (bold + red color)
- Float calculation (Total Float = Late Start - Early Start)
- Badge display in WBS view

**Risk Management:**
```typescript
type DependencyRisk = 'low' | 'medium' | 'high';

// Risk Criteria:
// HIGH: Dependency on long-lead procurement (>60 days) or external contractor
// MEDIUM: Dependency on approval processes or 2+ parallel dependencies
// LOW: Standard sequential dependencies
```

**Risk Indicators:**
- 🟢 Low Risk (no special indicator)
- 🟡 Medium Risk (yellow badge)
- 🔴 High Risk (red badge + warning icon)

### 4. Enhanced ItemModel

**New Fields:**

```typescript
// WBS Structure
@field('wbs_code') wbsCode!: string;                    // e.g., "1.2.3.4"
@field('wbs_level') wbsLevel!: number;                  // 1-4 (depth level)
@field('parent_wbs_code') parentWbsCode?: string;       // e.g., "1.2.3.0"

// Critical Path
@field('is_critical_path') isCriticalPath!: boolean;
@field('float_days') floatDays?: number;                // Total float

// Risk Management
@field('dependency_risk') dependencyRisk?: string;      // 'low' | 'medium' | 'high'
@field('risk_notes') riskNotes?: string;

// Phase & Milestone
@field('project_phase') projectPhase!: ProjectPhase;
@field('is_milestone') isMilestone!: boolean;
@field('created_by_role') createdByRole!: string;       // 'planner' | 'supervisor'
```

**Helper Methods:**

```typescript
export default class ItemModel extends Model {
  static table = 'items';

  // ... field declarations

  // Get formatted WBS code for display
  getFormattedWbsCode(): string {
    return this.wbsCode || 'N/A';
  }

  // Get indentation level for hierarchical display
  getIndentLevel(): number {
    return this.wbsLevel - 1; // 0-based for UI
  }

  // Get phase label with icon
  getPhaseLabel(): string {
    const labels = {
      design: '✏️ Design & Engineering',
      approvals: '📋 Statutory Approvals',
      mobilization: '🚛 Mobilization',
      procurement: '🛒 Procurement',
      interface: '🔗 Interface Coordination',
      site_prep: '🏗️ Site Preparation',
      construction: '🔨 Construction',
      testing: '🧪 Testing',
      commissioning: '⚡ Commissioning',
      sat: '✅ Site Acceptance Test',
      handover: '📦 Handover',
    };
    return labels[this.projectPhase] || 'Unknown';
  }

  // Get phase color for UI
  getPhaseColor(): string {
    const colors = {
      design: '#2196F3',        // Blue
      approvals: '#9C27B0',     // Purple
      mobilization: '#FF5722',  // Deep Orange
      procurement: '#FF9800',   // Orange
      interface: '#00BCD4',     // Cyan
      site_prep: '#795548',     // Brown
      construction: '#4CAF50',  // Green
      testing: '#F44336',       // Red
      commissioning: '#3F51B5', // Indigo
      sat: '#009688',           // Teal
      handover: '#607D8B',      // Blue Grey
    };
    return colors[this.projectPhase] || '#666666';
  }

  // Check if item is on critical path
  isOnCriticalPath(): boolean {
    return this.isCriticalPath || (this.floatDays !== undefined && this.floatDays <= 0);
  }

  // Get risk badge color
  getRiskBadgeColor(): string | null {
    if (!this.dependencyRisk) return null;
    const colors = {
      low: null,          // No badge
      medium: '#FFC107',  // Amber
      high: '#F44336',    // Red
    };
    return colors[this.dependencyRisk];
  }
}
```

---

## 5-Sprint Implementation Plan

### Sprint Overview

| Sprint | Duration | Effort | Focus Area |
|--------|----------|--------|------------|
| **Sprint 1** | Week 1 | 8-12 hours | Database schema update & models |
| **Sprint 2** | Week 2 | 8-12 hours | WBS screen (view only) |
| **Sprint 3** | Week 3 | 10-15 hours | Item creation & editing |
| **Sprint 4** | Week 4 | 6-8 hours | Baseline lock & supervisor integration |
| **Sprint 5** | Week 5 | 12-15 hours | Modular template system |
| **Total** | 5 weeks | 44-62 hours | Complete implementation |

---

### Sprint 1: Database Foundation (Week 1)

**Goal:** Update database schema with all new fields for WBS, critical path, and risk management.

**Duration:** 8-12 hours

#### Tasks

**1.1 Schema Update** (2 hours)

**File:** `models/schema/index.ts`

```typescript
// Increment version: 11 → 12
export default appSchema({
  version: 12,
  tables: [
    // ... existing tables
    tableSchema({
      name: 'items',
      columns: [
        // ... existing columns

        // Phase & Milestone (from v1.3)
        { name: 'project_phase', type: 'string', isIndexed: true },
        { name: 'is_milestone', type: 'boolean' },
        { name: 'created_by_role', type: 'string' },

        // WBS Structure ✅ NEW
        { name: 'wbs_code', type: 'string', isIndexed: true },
        { name: 'wbs_level', type: 'number' },
        { name: 'parent_wbs_code', type: 'string', isOptional: true },

        // Critical Path Management ✅ NEW
        { name: 'is_critical_path', type: 'boolean' },
        { name: 'float_days', type: 'number', isOptional: true },

        // Risk Management ✅ NEW
        { name: 'dependency_risk', type: 'string', isOptional: true },
        { name: 'risk_notes', type: 'string', isOptional: true },
      ],
    }),

    // New table: template_modules ✅ NEW
    tableSchema({
      name: 'template_modules',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'category', type: 'string', isIndexed: true },
        { name: 'voltage_level', type: 'string', isOptional: true },
        { name: 'items_json', type: 'string' }, // JSON array
        { name: 'compatible_modules', type: 'string' }, // JSON array
        { name: 'is_predefined', type: 'boolean' },
        { name: 'description', type: 'string' },
      ],
    }),

    // New table: interface_points (v1.4 - prepared for future) ✅ NEW
    tableSchema({
      name: 'interface_points',
      columns: [
        { name: 'item_id', type: 'string', isIndexed: true },
        { name: 'from_contractor', type: 'string' },
        { name: 'to_contractor', type: 'string' },
        { name: 'interface_type', type: 'string' }, // 'handover' | 'approval' | 'information'
        { name: 'status', type: 'string' }, // 'pending' | 'in_progress' | 'resolved' | 'blocked'
        { name: 'target_date', type: 'number', isOptional: true },
        { name: 'actual_date', type: 'number', isOptional: true },
        { name: 'notes', type: 'string', isOptional: true },
      ],
    }),
  ],
});
```

**1.2 Migration Script** (2 hours)

**File:** `models/migrations/index.ts`

```typescript
import { schemaMigrations } from '@nozbe/watermelondb/Schema/migrations';

export default schemaMigrations({
  migrations: [
    // ... existing migrations (v1 to v11)

    // v12 Migration ✅ NEW
    {
      toVersion: 12,
      steps: [
        // Add new columns to items table
        {
          type: 'add_columns',
          table: 'items',
          columns: [
            { name: 'wbs_code', type: 'string', isIndexed: true },
            { name: 'wbs_level', type: 'number' },
            { name: 'parent_wbs_code', type: 'string', isOptional: true },
            { name: 'is_critical_path', type: 'boolean' },
            { name: 'float_days', type: 'number', isOptional: true },
            { name: 'dependency_risk', type: 'string', isOptional: true },
            { name: 'risk_notes', type: 'string', isOptional: true },
          ],
        },

        // Create template_modules table
        {
          type: 'create_table',
          schema: {
            name: 'template_modules',
            columns: [
              { name: 'id', type: 'string' },
              { name: 'name', type: 'string' },
              { name: 'category', type: 'string', isIndexed: true },
              { name: 'voltage_level', type: 'string', isOptional: true },
              { name: 'items_json', type: 'string' },
              { name: 'compatible_modules', type: 'string' },
              { name: 'is_predefined', type: 'boolean' },
              { name: 'description', type: 'string' },
              { name: 'created_at', type: 'number' },
              { name: 'updated_at', type: 'number' },
            ],
          },
        },

        // Create interface_points table (for v1.4)
        {
          type: 'create_table',
          schema: {
            name: 'interface_points',
            columns: [
              { name: 'id', type: 'string' },
              { name: 'item_id', type: 'string', isIndexed: true },
              { name: 'from_contractor', type: 'string' },
              { name: 'to_contractor', type: 'string' },
              { name: 'interface_type', type: 'string' },
              { name: 'status', type: 'string' },
              { name: 'target_date', type: 'number', isOptional: true },
              { name: 'actual_date', type: 'number', isOptional: true },
              { name: 'notes', type: 'string', isOptional: true },
              { name: 'created_at', type: 'number' },
              { name: 'updated_at', type: 'number' },
            ],
          },
        },

        // Set default values for existing items
        {
          type: 'sql',
          sql: `
            UPDATE items
            SET
              wbs_code = '1.0.0.0',
              wbs_level = 1,
              is_critical_path = 0,
              dependency_risk = 'low'
            WHERE wbs_code IS NULL OR wbs_code = '';
          `,
        },
      ],
    },
  ],
});
```

**1.3 Update ItemModel** (2 hours)

**File:** `models/ItemModel.ts`

```typescript
import { Model } from '@nozbe/watermelondb';
import { field, relation } from '@nozbe/watermelondb/decorators';

export type ProjectPhase =
  | 'design'
  | 'approvals'
  | 'mobilization'
  | 'procurement'
  | 'interface'
  | 'site_prep'
  | 'construction'
  | 'testing'
  | 'commissioning'
  | 'sat'
  | 'handover';

export type DependencyRisk = 'low' | 'medium' | 'high';

export default class ItemModel extends Model {
  static table = 'items';

  // Existing fields
  @field('name') name!: string;
  @field('site_id') siteId!: string;
  @field('category_id') categoryId!: string;
  @field('planned_quantity') plannedQuantity!: number;
  @field('completed_quantity') completedQuantity!: number;
  @field('unit_of_measurement') unitOfMeasurement!: string;
  @field('planned_start_date') plannedStartDate!: number;
  @field('planned_end_date') plannedEndDate!: number;
  @field('status') status!: string;
  @field('dependencies') dependencies!: string; // JSON array
  @field('baseline_start_date') baselineStartDate?: number;
  @field('baseline_end_date') baselineEndDate?: number;
  @field('is_baseline_locked') isBaselineLocked!: boolean;

  // Phase & Milestone fields
  @field('project_phase') projectPhase!: ProjectPhase;
  @field('is_milestone') isMilestone!: boolean;
  @field('created_by_role') createdByRole!: string;

  // WBS Structure fields ✅ NEW
  @field('wbs_code') wbsCode!: string;
  @field('wbs_level') wbsLevel!: number;
  @field('parent_wbs_code') parentWbsCode?: string;

  // Critical Path fields ✅ NEW
  @field('is_critical_path') isCriticalPath!: boolean;
  @field('float_days') floatDays?: number;

  // Risk Management fields ✅ NEW
  @field('dependency_risk') dependencyRisk?: DependencyRisk;
  @field('risk_notes') riskNotes?: string;

  // Relations
  @relation('sites', 'site_id') site: any;
  @relation('categories', 'category_id') category: any;

  // Helper methods
  getFormattedWbsCode(): string {
    return this.wbsCode || 'N/A';
  }

  getIndentLevel(): number {
    return Math.max(0, this.wbsLevel - 1);
  }

  getPhaseLabel(): string {
    const labels = {
      design: '✏️ Design & Engineering',
      approvals: '📋 Statutory Approvals',
      mobilization: '🚛 Mobilization',
      procurement: '🛒 Procurement',
      interface: '🔗 Interface Coordination',
      site_prep: '🏗️ Site Preparation',
      construction: '🔨 Construction',
      testing: '🧪 Testing',
      commissioning: '⚡ Commissioning',
      sat: '✅ Site Acceptance Test',
      handover: '📦 Handover',
    };
    return labels[this.projectPhase] || 'Unknown';
  }

  getPhaseColor(): string {
    const colors = {
      design: '#2196F3',
      approvals: '#9C27B0',
      mobilization: '#FF5722',
      procurement: '#FF9800',
      interface: '#00BCD4',
      site_prep: '#795548',
      construction: '#4CAF50',
      testing: '#F44336',
      commissioning: '#3F51B5',
      sat: '#009688',
      handover: '#607D8B',
    };
    return colors[this.projectPhase] || '#666666';
  }

  isOnCriticalPath(): boolean {
    return this.isCriticalPath || (this.floatDays !== undefined && this.floatDays <= 0);
  }

  getRiskBadgeColor(): string | null {
    if (!this.dependencyRisk) return null;
    const colors: Record<DependencyRisk, string | null> = {
      low: null,
      medium: '#FFC107',
      high: '#F44336',
    };
    return colors[this.dependencyRisk];
  }

  getPlannedDuration(): number {
    const durationMs = this.plannedEndDate - this.plannedStartDate;
    return Math.ceil(durationMs / (1000 * 60 * 60 * 24));
  }
}
```

**1.4 Create TemplateModuleModel** (1 hour)

**File:** `models/TemplateModuleModel.ts`

```typescript
import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

export type TemplateCategory = 'substation' | 'ohe' | 'third_rail' | 'building' | 'interface';
export type VoltageLevel = '220kV' | '132kV' | '66kV' | '33kV' | '25kV' | '650VDC';

export interface TemplateItem {
  name: string;
  phase: string;
  duration: number;
  dependencies: string[];
  wbsCode: string;
  isMilestone?: boolean;
  quantity?: number;
  unit?: string;
  dependencyRisk?: string;
  riskNotes?: string;
}

export default class TemplateModuleModel extends Model {
  static table = 'template_modules';

  @field('name') name!: string;
  @field('category') category!: TemplateCategory;
  @field('voltage_level') voltageLevel?: VoltageLevel;
  @field('items_json') itemsJson!: string; // JSON string of TemplateItem[]
  @field('compatible_modules') compatibleModules!: string; // JSON string of module IDs
  @field('is_predefined') isPredefined!: boolean;
  @field('description') description!: string;

  // Parse items JSON
  getItems(): TemplateItem[] {
    try {
      return JSON.parse(this.itemsJson);
    } catch {
      return [];
    }
  }

  // Parse compatible modules
  getCompatibleModuleIds(): string[] {
    try {
      return JSON.parse(this.compatibleModules);
    } catch {
      return [];
    }
  }

  // Get item count
  getItemCount(): number {
    return this.getItems().length;
  }

  // Get estimated duration
  getEstimatedDuration(): number {
    const items = this.getItems();
    if (items.length === 0) return 0;

    // Simple max duration (actual critical path would need dependency analysis)
    return Math.max(...items.map(item => item.duration));
  }
}
```

**1.5 Create InterfacePointModel (Stub for v1.4)** (1 hour)

**File:** `models/InterfacePointModel.ts`

```typescript
import { Model } from '@nozbe/watermelondb';
import { field, relation } from '@nozbe/watermelondb/decorators';

export type InterfaceType = 'handover' | 'approval' | 'information';
export type InterfaceStatus = 'pending' | 'in_progress' | 'resolved' | 'blocked';

export default class InterfacePointModel extends Model {
  static table = 'interface_points';

  @field('item_id') itemId!: string;
  @field('from_contractor') fromContractor!: string;
  @field('to_contractor') toContractor!: string;
  @field('interface_type') interfaceType!: InterfaceType;
  @field('status') status!: InterfaceStatus;
  @field('target_date') targetDate?: number;
  @field('actual_date') actualDate?: number;
  @field('notes') notes?: string;

  @relation('items', 'item_id') item: any;

  isOverdue(): boolean {
    if (!this.targetDate || this.status === 'resolved') return false;
    return Date.now() > this.targetDate;
  }

  getDaysOverdue(): number {
    if (!this.isOverdue() || !this.targetDate) return 0;
    const diffMs = Date.now() - this.targetDate;
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }
}
```

**1.6 Register Models in Database** (1 hour)

**File:** `models/database.ts`

```typescript
import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import schema from './schema';
import migrations from './migrations';

// Import all models
import ProjectModel from './ProjectModel';
import SiteModel from './SiteModel';
import CategoryModel from './CategoryModel';
import ItemModel from './ItemModel';
import ProgressLogModel from './ProgressLogModel';
import HindranceModel from './HindranceModel';
import MaterialModel from './MaterialModel';
import DailyReportModel from './DailyReportModel';
import TemplateModuleModel from './TemplateModuleModel'; // ✅ NEW
import InterfacePointModel from './InterfacePointModel'; // ✅ NEW

const adapter = new SQLiteAdapter({
  schema,
  migrations,
  jsi: true,
  onSetUpError: error => {
    console.error('Database setup error:', error);
  },
});

export const database = new Database({
  adapter,
  modelClasses: [
    ProjectModel,
    SiteModel,
    CategoryModel,
    ItemModel,
    ProgressLogModel,
    HindranceModel,
    MaterialModel,
    DailyReportModel,
    TemplateModuleModel,  // ✅ NEW
    InterfacePointModel,   // ✅ NEW
  ],
});
```

**1.7 Unit Tests** (2 hours)

**File:** `__tests__/models/ItemModel.test.ts`

```typescript
import { database } from '../../models/database';
import ItemModel from '../../models/ItemModel';

describe('ItemModel - WBS & Critical Path', () => {
  beforeEach(async () => {
    await database.write(async () => {
      await database.unsafeResetDatabase();
    });
  });

  it('should create item with WBS code', async () => {
    const item = await database.write(async () => {
      return await database.collections.get<ItemModel>('items').create(item => {
        item.name = 'Test Item';
        item.wbsCode = '1.2.3.0';
        item.wbsLevel = 3;
        item.parentWbsCode = '1.2.0.0';
        item.projectPhase = 'construction';
        item.isCriticalPath = true;
        item.floatDays = 0;
      });
    });

    expect(item.wbsCode).toBe('1.2.3.0');
    expect(item.getIndentLevel()).toBe(2);
    expect(item.isOnCriticalPath()).toBe(true);
  });

  it('should return correct phase label', () => {
    const item = new ItemModel();
    item.projectPhase = 'procurement';
    expect(item.getPhaseLabel()).toBe('🛒 Procurement');
  });

  it('should identify critical path items', () => {
    const item1 = new ItemModel();
    item1.isCriticalPath = true;
    expect(item1.isOnCriticalPath()).toBe(true);

    const item2 = new ItemModel();
    item2.floatDays = 0;
    expect(item2.isOnCriticalPath()).toBe(true);

    const item3 = new ItemModel();
    item3.floatDays = 5;
    expect(item3.isOnCriticalPath()).toBe(false);
  });
});
```

#### Deliverables

- ✅ Schema updated to v12 with 10 new columns
- ✅ Migration script with default value handling
- ✅ ItemModel with WBS, critical path, and risk fields
- ✅ TemplateModuleModel created
- ✅ InterfacePointModel created (stub)
- ✅ All models registered in database
- ✅ Unit tests passing

#### Acceptance Criteria

- [ ] App starts without errors after migration
- [ ] Existing items have default WBS code "1.0.0.0"
- [ ] New ItemModel fields accessible in code
- [ ] Helper methods return correct values
- [ ] All unit tests pass

---

### Sprint 2: WBS Management Screen - View Only (Week 2)

**Goal:** Create WBS Management screen with hierarchical view, phase filtering, and visual indicators.

**Duration:** 8-12 hours

#### Tasks

**2.1 Create WBS Management Screen** (4 hours)

**File:** `src/planning/WBSManagementScreen.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, FlatList } from 'react-native';
import { Card, Text, FAB, Chip, Divider } from 'react-native-paper';
import { withObservables } from '@nozbe/watermelondb/react';
import { Q } from '@nozbe/watermelondb';
import { database } from '../../models/database';
import ProjectModel from '../../models/ProjectModel';
import ItemModel, { ProjectPhase } from '../../models/ItemModel';
import CategoryModel from '../../models/CategoryModel';
import SiteSelector from '../supervisor/components/SiteSelector';
import SiteModel from '../../models/SiteModel';

interface WBSManagementScreenProps {
  projects: ProjectModel[];
  categories: CategoryModel[];
}

const WBSManagementScreenComponent: React.FC<WBSManagementScreenProps> = ({
  projects,
  categories,
}) => {
  const [selectedSite, setSelectedSite] = useState<SiteModel | null>(null);
  const [items, setItems] = useState<ItemModel[]>([]);
  const [selectedPhase, setSelectedPhase] = useState<ProjectPhase | 'all'>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // Load items when site changes
  useEffect(() => {
    if (selectedSite) {
      loadItems();
    }
  }, [selectedSite, selectedPhase]);

  const loadItems = async () => {
    if (!selectedSite) return;

    const query = [Q.where('site_id', selectedSite.id)];

    if (selectedPhase !== 'all') {
      query.push(Q.where('project_phase', selectedPhase));
    }

    const siteItems = await database.collections
      .get<ItemModel>('items')
      .query(...query)
      .fetch();

    // Sort by WBS code
    siteItems.sort((a, b) => {
      return a.wbsCode.localeCompare(b.wbsCode, undefined, { numeric: true });
    });

    setItems(siteItems);
  };

  const handleAddItem = () => {
    setShowAddModal(true);
    // TODO: Implement add item modal in Sprint 3
  };

  const phases: Array<{ key: ProjectPhase | 'all'; label: string }> = [
    { key: 'all', label: 'All Phases' },
    { key: 'design', label: 'Design' },
    { key: 'approvals', label: 'Approvals' },
    { key: 'mobilization', label: 'Mobilization' },
    { key: 'procurement', label: 'Procurement' },
    { key: 'interface', label: 'Interface' },
    { key: 'site_prep', label: 'Site Prep' },
    { key: 'construction', label: 'Construction' },
    { key: 'testing', label: 'Testing' },
    { key: 'commissioning', label: 'Commissioning' },
    { key: 'sat', label: 'SAT' },
    { key: 'handover', label: 'Handover' },
  ];

  return (
    <View style={styles.container}>
      {/* Site Selector */}
      <Card style={styles.selectorCard}>
        <Card.Content>
          <SiteSelector
            selectedSite={selectedSite}
            onSiteChange={setSelectedSite}
          />
        </Card.Content>
      </Card>

      {selectedSite && (
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

          {/* Items List Header */}
          <View style={styles.itemsHeader}>
            <Text variant="titleMedium">
              Work Breakdown Structure ({items.length} items)
            </Text>
          </View>

          {/* Items List */}
          <FlatList
            data={items}
            keyExtractor={item => item.id}
            renderItem={({ item }) => <WBSItemCard item={item} />}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text variant="bodyLarge" style={styles.emptyText}>
                  No items in this phase
                </Text>
                <Text variant="bodyMedium" style={styles.emptySubtext}>
                  Tap the + button to add items
                </Text>
              </View>
            }
            style={styles.itemsList}
          />

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
  itemsHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  itemsList: {
    flex: 1,
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
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
});

export default WBSManagementScreen;
```

**2.2 Create WBS Item Card Component** (3 hours)

**File:** `src/planning/components/WBSItemCard.tsx`

```typescript
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Chip, IconButton } from 'react-native-paper';
import ItemModel from '../../../models/ItemModel';

interface WBSItemCardProps {
  item: ItemModel;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

const WBSItemCard: React.FC<WBSItemCardProps> = ({
  item,
  onPress,
  onEdit,
  onDelete,
}) => {
  const indentLevel = item.getIndentLevel();
  const phaseColor = item.getPhaseColor();
  const riskBadgeColor = item.getRiskBadgeColor();
  const isOnCriticalPath = item.isOnCriticalPath();

  return (
    <Card
      style={[
        styles.card,
        { marginLeft: 16 + indentLevel * 20 }, // Indent based on WBS level
      ]}
      onPress={onPress}
    >
      <Card.Content>
        {/* Header Row */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text variant="labelSmall" style={styles.wbsCode}>
              {item.getFormattedWbsCode()}
            </Text>
            {isOnCriticalPath && (
              <Chip
                compact
                style={[styles.badge, styles.criticalBadge]}
                textStyle={styles.criticalBadgeText}
              >
                🔴 Critical
              </Chip>
            )}
            {riskBadgeColor && (
              <Chip
                compact
                style={[
                  styles.badge,
                  { backgroundColor: riskBadgeColor + '20' },
                ]}
                textStyle={{ color: riskBadgeColor }}
              >
                {item.dependencyRisk === 'high' ? '⚠️ High Risk' : '⚡ Med Risk'}
              </Chip>
            )}
          </View>
          {onEdit && onDelete && (
            <View style={styles.actions}>
              <IconButton
                icon="pencil"
                size={20}
                onPress={onEdit}
                disabled={item.isBaselineLocked}
              />
              <IconButton
                icon="delete"
                size={20}
                onPress={onDelete}
                disabled={item.isBaselineLocked}
              />
            </View>
          )}
        </View>

        {/* Item Name */}
        <Text
          variant="titleMedium"
          style={[styles.itemName, isOnCriticalPath && styles.criticalItemName]}
        >
          {item.name}
          {item.isMilestone && ' ⭐'}
        </Text>

        {/* Phase Chip */}
        <Chip
          compact
          style={[
            styles.phaseChip,
            { backgroundColor: phaseColor + '20' },
          ]}
          textStyle={{ color: phaseColor }}
        >
          {item.getPhaseLabel()}
        </Chip>

        {/* Details Row */}
        <View style={styles.detailsRow}>
          <Text variant="bodySmall" style={styles.detailText}>
            Duration: {item.getPlannedDuration()} days
          </Text>
          {item.floatDays !== undefined && (
            <Text variant="bodySmall" style={styles.detailText}>
              Float: {item.floatDays} days
            </Text>
          )}
          <Text variant="bodySmall" style={styles.detailText}>
            Status: {item.status.replace('_', ' ')}
          </Text>
        </View>

        {/* Risk Notes */}
        {item.riskNotes && (
          <Text variant="bodySmall" style={styles.riskNotes}>
            ⚠️ {item.riskNotes}
          </Text>
        )}
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 6,
    marginRight: 16,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    flex: 1,
  },
  wbsCode: {
    fontFamily: 'monospace',
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
  },
  badge: {
    height: 24,
    marginRight: 8,
    marginVertical: 2,
  },
  criticalBadge: {
    backgroundColor: '#ffebee',
  },
  criticalBadgeText: {
    color: '#d32f2f',
    fontWeight: 'bold',
  },
  actions: {
    flexDirection: 'row',
  },
  itemName: {
    marginBottom: 8,
  },
  criticalItemName: {
    fontWeight: 'bold',
    color: '#d32f2f',
  },
  phaseChip: {
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  detailText: {
    color: '#666',
  },
  riskNotes: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#fff3e0',
    borderLeftWidth: 3,
    borderLeftColor: '#ff9800',
    color: '#e65100',
  },
});

export default WBSItemCard;
```

**2.3 Add to Planning Navigator** (1 hour)

**File:** `src/nav/PlanningNavigator.tsx`

```typescript
import React from 'react';
import { createMaterialBottomTabNavigator } from '@react-navigation/material-bottom-tabs';
import WBSManagementScreen from '../planning/WBSManagementScreen'; // ✅ NEW
import GanttChartScreen from '../planning/GanttChartScreen';
import ScheduleManagementScreen from '../planning/ScheduleManagementScreen';
import ResourcePlanningScreen from '../planning/ResourcePlanningScreen';
import MilestoneTrackingScreen from '../planning/MilestoneTrackingScreen';
import BaselineScreen from '../planning/BaselineScreen';

const Tab = createMaterialBottomTabNavigator();

export type PlanningTabParamList = {
  WBSManagement: undefined; // ✅ NEW - First tab
  Baseline: undefined;
  GanttChart: undefined;
  ScheduleManagement: undefined;
  ResourcePlanning: undefined;
  MilestoneTracking: undefined;
};

const PlanningNavigator = () => {
  return (
    <Tab.Navigator
      initialRouteName="WBSManagement"
      barStyle={{ backgroundColor: '#6200ee' }}
    >
      {/* ✅ NEW - WBS Management as first tab */}
      <Tab.Screen
        name="WBSManagement"
        component={WBSManagementScreen}
        options={{
          title: 'WBS',
          tabBarIcon: 'file-tree',
        }}
      />

      <Tab.Screen
        name="Baseline"
        component={BaselineScreen}
        options={{
          title: 'Baseline',
          tabBarIcon: 'flag-checkered',
        }}
      />

      <Tab.Screen
        name="GanttChart"
        component={GanttChartScreen}
        options={{
          title: 'Gantt',
          tabBarIcon: 'chart-gantt',
        }}
      />

      <Tab.Screen
        name="ScheduleManagement"
        component={ScheduleManagementScreen}
        options={{
          title: 'Schedule',
          tabBarIcon: 'calendar-clock',
        }}
      />

      <Tab.Screen
        name="ResourcePlanning"
        component={ResourcePlanningScreen}
        options={{
          title: 'Resources',
          tabBarIcon: 'account-group',
        }}
      />

      <Tab.Screen
        name="MilestoneTracking"
        component={MilestoneTrackingScreen}
        options={{
          title: 'Milestones',
          tabBarIcon: 'star',
        }}
      />
    </Tab.Navigator>
  );
};

export default PlanningNavigator;
```

#### Deliverables

- ✅ WBS Management screen with hierarchical view
- ✅ WBS Item Card component with visual indicators
- ✅ Phase filter chips (11 phases)
- ✅ Critical path highlighting
- ✅ Risk badges (medium/high)
- ✅ WBS code display with indentation
- ✅ Added as first tab in Planning Navigator

#### Acceptance Criteria

- [ ] Items display in hierarchical order by WBS code
- [ ] Indentation shows WBS level correctly
- [ ] Phase filters work (show/hide items)
- [ ] Critical path items highlighted in red/bold
- [ ] Risk badges show for medium/high risk items
- [ ] Site selector works correctly
- [ ] Empty state message shows when no items

---

### Sprint 3: WBS Item Creation & Editing (Week 3)

**Goal:** Enable planners to create and edit items with full WBS support, automatic code generation, and validation.

**Duration:** 10-15 hours

#### Tasks

**3.1 Create WBS Code Generator Service** (2 hours)

**File:** `services/planning/WBSCodeGenerator.ts`

```typescript
import { database } from '../../models/database';
import ItemModel from '../../models/ItemModel';
import { Q } from '@nozbe/watermelondb';

export class WBSCodeGenerator {
  /**
   * Generate next available WBS code at the same level as parent
   * @param siteId Site ID
   * @param parentWbsCode Parent WBS code (e.g., "1.2.0.0")
   * @returns Next available WBS code (e.g., "1.2.1.0")
   */
  static async generateChildCode(
    siteId: string,
    parentWbsCode: string
  ): Promise<string> {
    // Parse parent code
    const parentParts = parentWbsCode.split('.').map(Number);
    const parentLevel = parentParts.filter(p => p > 0).length;

    // Find all children of this parent
    const children = await database.collections
      .get<ItemModel>('items')
      .query(
        Q.where('site_id', siteId),
        Q.where('parent_wbs_code', parentWbsCode)
      )
      .fetch();

    // Find max child number
    let maxChildNumber = 0;
    children.forEach(child => {
      const childParts = child.wbsCode.split('.').map(Number);
      const childNumber = childParts[parentLevel]; // Get number at child level
      if (childNumber > maxChildNumber) {
        maxChildNumber = childNumber;
      }
    });

    // Generate next code
    const newParts = [...parentParts];
    newParts[parentLevel] = maxChildNumber + 1;

    return newParts.join('.');
  }

  /**
   * Generate next available sibling code
   * @param siteId Site ID
   * @param siblingWbsCode Sibling WBS code (e.g., "1.2.0.0")
   * @returns Next available sibling code (e.g., "1.3.0.0")
   */
  static async generateSiblingCode(
    siteId: string,
    siblingWbsCode: string
  ): Promise<string> {
    const siblingParts = siblingWbsCode.split('.').map(Number);
    const level = siblingParts.filter(p => p > 0).length;

    // Get parent code
    const parentParts = [...siblingParts];
    parentParts[level - 1] = 0;
    const parentWbsCode = parentParts.join('.');

    // Use generateChildCode logic
    return this.generateChildCode(siteId, parentWbsCode);
  }

  /**
   * Generate first code at root level
   * @param siteId Site ID
   * @returns First root-level code (e.g., "1.0.0.0")
   */
  static async generateRootCode(siteId: string): Promise<string> {
    // Find all root-level items (level 1)
    const rootItems = await database.collections
      .get<ItemModel>('items')
      .query(Q.where('site_id', siteId), Q.where('wbs_level', 1))
      .fetch();

    // Find max first number
    let maxRootNumber = 0;
    rootItems.forEach(item => {
      const parts = item.wbsCode.split('.').map(Number);
      if (parts[0] > maxRootNumber) {
        maxRootNumber = parts[0];
      }
    });

    return `${maxRootNumber + 1}.0.0.0`;
  }

  /**
   * Validate WBS code uniqueness
   * @param siteId Site ID
   * @param wbsCode WBS code to validate
   * @param excludeItemId Exclude this item ID (for editing)
   * @returns true if code is unique
   */
  static async isCodeUnique(
    siteId: string,
    wbsCode: string,
    excludeItemId?: string
  ): Promise<boolean> {
    const query = [
      Q.where('site_id', siteId),
      Q.where('wbs_code', wbsCode),
    ];

    if (excludeItemId) {
      query.push(Q.where('id', Q.notEq(excludeItemId)));
    }

    const existing = await database.collections
      .get<ItemModel>('items')
      .query(...query)
      .fetch();

    return existing.length === 0;
  }

  /**
   * Calculate WBS level from code
   * @param wbsCode WBS code (e.g., "1.2.3.0")
   * @returns Level (1-4)
   */
  static calculateLevel(wbsCode: string): number {
    const parts = wbsCode.split('.').map(Number);
    return parts.filter(p => p > 0).length;
  }

  /**
   * Get parent code from child code
   * @param wbsCode Child WBS code (e.g., "1.2.3.4")
   * @returns Parent WBS code (e.g., "1.2.3.0")
   */
  static getParentCode(wbsCode: string): string | null {
    const parts = wbsCode.split('.').map(Number);
    const level = parts.filter(p => p > 0).length;

    if (level <= 1) return null; // Root has no parent

    const parentParts = [...parts];
    parentParts[level - 1] = 0;

    return parentParts.join('.');
  }
}
```

**3.2 Create Item Form Modal** (5 hours)

**File:** `src/planning/components/ItemFormModal.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Modal,
  Portal,
  Text,
  TextInput,
  Button,
  Chip,
  Switch,
  RadioButton,
  HelperText,
} from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import { database } from '../../../models/database';
import ItemModel, { ProjectPhase, DependencyRisk } from '../../../models/ItemModel';
import CategoryModel from '../../../models/CategoryModel';
import SiteModel from '../../../models/SiteModel';
import { WBSCodeGenerator } from '../../../services/planning/WBSCodeGenerator';

interface ItemFormModalProps {
  visible: boolean;
  onDismiss: () => void;
  onSave: () => void;
  site: SiteModel;
  categories: CategoryModel[];
  editItem?: ItemModel; // If provided, edit mode
  parentItem?: ItemModel; // If provided, create as child
}

const ItemFormModal: React.FC<ItemFormModalProps> = ({
  visible,
  onDismiss,
  onSave,
  site,
  categories,
  editItem,
  parentItem,
}) => {
  // Form state
  const [name, setName] = useState('');
  const [wbsCode, setWbsCode] = useState('');
  const [wbsCodeManual, setWbsCodeManual] = useState(false);
  const [phase, setPhase] = useState<ProjectPhase>('construction');
  const [duration, setDuration] = useState('30');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('Set');
  const [categoryId, setCategoryId] = useState('');
  const [isMilestone, setIsMilestone] = useState(false);
  const [isCriticalPath, setIsCriticalPath] = useState(false);
  const [dependencyRisk, setDependencyRisk] = useState<DependencyRisk>('low');
  const [riskNotes, setRiskNotes] = useState('');

  // Validation errors
  const [nameError, setNameError] = useState('');
  const [wbsCodeError, setWbsCodeError] = useState('');

  // Initialize form
  useEffect(() => {
    if (visible) {
      if (editItem) {
        // Edit mode
        setName(editItem.name);
        setWbsCode(editItem.wbsCode);
        setPhase(editItem.projectPhase);
        setDuration(editItem.getPlannedDuration().toString());
        setQuantity(editItem.plannedQuantity.toString());
        setUnit(editItem.unitOfMeasurement);
        setCategoryId(editItem.categoryId);
        setIsMilestone(editItem.isMilestone);
        setIsCriticalPath(editItem.isCriticalPath);
        setDependencyRisk(editItem.dependencyRisk || 'low');
        setRiskNotes(editItem.riskNotes || '');
      } else {
        // Create mode - generate WBS code
        generateWbsCode();
      }
    }
  }, [visible, editItem, parentItem]);

  const generateWbsCode = async () => {
    try {
      let code: string;

      if (parentItem) {
        // Create as child of parent
        code = await WBSCodeGenerator.generateChildCode(site.id, parentItem.wbsCode);
      } else {
        // Create at root level
        code = await WBSCodeGenerator.generateRootCode(site.id);
      }

      setWbsCode(code);
    } catch (error) {
      console.error('Error generating WBS code:', error);
      Alert.alert('Error', 'Failed to generate WBS code');
    }
  };

  const validateForm = async (): Promise<boolean> {
    let isValid = true;

    // Validate name
    if (!name.trim()) {
      setNameError('Item name is required');
      isValid = false;
    } else {
      setNameError('');
    }

    // Validate WBS code
    if (!wbsCode.trim()) {
      setWbsCodeError('WBS code is required');
      isValid = false;
    } else {
      // Check uniqueness
      const isUnique = await WBSCodeGenerator.isCodeUnique(
        site.id,
        wbsCode,
        editItem?.id
      );
      if (!isUnique) {
        setWbsCodeError('WBS code already exists');
        isValid = false;
      } else {
        setWbsCodeError('');
      }
    }

    return isValid;
  };

  const handleSave = async () => {
    const isValid = await validateForm();
    if (!isValid) return;

    try {
      await database.write(async () => {
        if (editItem) {
          // Update existing item
          await editItem.update(item => {
            item.name = name;
            item.wbsCode = wbsCode;
            item.wbsLevel = WBSCodeGenerator.calculateLevel(wbsCode);
            item.parentWbsCode = WBSCodeGenerator.getParentCode(wbsCode) || undefined;
            item.projectPhase = phase;
            item.plannedQuantity = parseFloat(quantity);
            item.unitOfMeasurement = unit;
            item.categoryId = categoryId;
            item.isMilestone = isMilestone;
            item.isCriticalPath = isCriticalPath;
            item.dependencyRisk = dependencyRisk;
            item.riskNotes = riskNotes;

            // Update duration
            const durationDays = parseInt(duration);
            const startDate = item.plannedStartDate || Date.now();
            item.plannedStartDate = startDate;
            item.plannedEndDate = startDate + durationDays * 24 * 60 * 60 * 1000;
          });
        } else {
          // Create new item
          await database.collections.get<ItemModel>('items').create(item => {
            item.name = name;
            item.siteId = site.id;
            item.wbsCode = wbsCode;
            item.wbsLevel = WBSCodeGenerator.calculateLevel(wbsCode);
            item.parentWbsCode = WBSCodeGenerator.getParentCode(wbsCode) || undefined;
            item.projectPhase = phase;
            item.plannedQuantity = parseFloat(quantity);
            item.completedQuantity = 0;
            item.unitOfMeasurement = unit;
            item.categoryId = categoryId || categories[0]?.id || '';
            item.status = 'not_started';
            item.dependencies = '[]';
            item.isBaselineLocked = false;
            item.isMilestone = isMilestone;
            item.isCriticalPath = isCriticalPath;
            item.dependencyRisk = dependencyRisk;
            item.riskNotes = riskNotes;
            item.createdByRole = 'planner';

            // Set dates
            const startDate = Date.now();
            const durationDays = parseInt(duration);
            item.plannedStartDate = startDate;
            item.plannedEndDate = startDate + durationDays * 24 * 60 * 60 * 1000;
          });
        }
      });

      onSave();
      onDismiss();
    } catch (error) {
      console.error('Error saving item:', error);
      Alert.alert('Error', 'Failed to save item');
    }
  };

  const phases: Array<{ value: ProjectPhase; label: string }> = [
    { value: 'design', label: '✏️ Design & Engineering' },
    { value: 'approvals', label: '📋 Statutory Approvals' },
    { value: 'mobilization', label: '🚛 Mobilization' },
    { value: 'procurement', label: '🛒 Procurement' },
    { value: 'interface', label: '🔗 Interface Coordination' },
    { value: 'site_prep', label: '🏗️ Site Preparation' },
    { value: 'construction', label: '🔨 Construction' },
    { value: 'testing', label: '🧪 Testing' },
    { value: 'commissioning', label: '⚡ Commissioning' },
    { value: 'sat', label: '✅ Site Acceptance Test' },
    { value: 'handover', label: '📦 Handover' },
  ];

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.container}
        >
          <ScrollView>
            {/* Header */}
            <Text variant="titleLarge" style={styles.title}>
              {editItem ? 'Edit Item' : 'Create New Item'}
            </Text>

            {/* WBS Code */}
            <View style={styles.wbsCodeRow}>
              <TextInput
                label="WBS Code"
                value={wbsCode}
                onChangeText={setWbsCode}
                mode="outlined"
                style={styles.wbsCodeInput}
                editable={wbsCodeManual || !!editItem}
                error={!!wbsCodeError}
              />
              {!editItem && (
                <Button
                  mode="text"
                  onPress={() => {
                    if (wbsCodeManual) {
                      generateWbsCode();
                    }
                    setWbsCodeManual(!wbsCodeManual);
                  }}
                >
                  {wbsCodeManual ? 'Auto' : 'Manual'}
                </Button>
              )}
            </View>
            <HelperText type="error" visible={!!wbsCodeError}>
              {wbsCodeError}
            </HelperText>

            {/* Item Name */}
            <TextInput
              label="Item Name *"
              value={name}
              onChangeText={setName}
              mode="outlined"
              style={styles.input}
              error={!!nameError}
            />
            <HelperText type="error" visible={!!nameError}>
              {nameError}
            </HelperText>

            {/* Phase Picker */}
            <Text variant="labelMedium" style={styles.label}>
              Project Phase *
            </Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={phase}
                onValueChange={value => setPhase(value as ProjectPhase)}
                style={styles.picker}
              >
                {phases.map(p => (
                  <Picker.Item key={p.value} label={p.label} value={p.value} />
                ))}
              </Picker>
            </View>

            {/* Duration & Quantity Row */}
            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <TextInput
                  label="Duration (days)"
                  value={duration}
                  onChangeText={setDuration}
                  mode="outlined"
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.halfWidth}>
                <TextInput
                  label="Quantity"
                  value={quantity}
                  onChangeText={setQuantity}
                  mode="outlined"
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Unit & Category Row */}
            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <TextInput
                  label="Unit"
                  value={unit}
                  onChangeText={setUnit}
                  mode="outlined"
                />
              </View>
              <View style={styles.halfWidth}>
                <Text variant="labelMedium" style={styles.label}>
                  Category
                </Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={categoryId}
                    onValueChange={value => setCategoryId(value)}
                    style={styles.picker}
                  >
                    {categories.map(cat => (
                      <Picker.Item key={cat.id} label={cat.name} value={cat.id} />
                    ))}
                  </Picker>
                </View>
              </View>
            </View>

            {/* Milestone & Critical Path Toggles */}
            <View style={styles.switchRow}>
              <Text variant="bodyMedium">Mark as Milestone</Text>
              <Switch value={isMilestone} onValueChange={setIsMilestone} />
            </View>
            <View style={styles.switchRow}>
              <Text variant="bodyMedium">Critical Path Item</Text>
              <Switch value={isCriticalPath} onValueChange={setIsCriticalPath} />
            </View>

            {/* Dependency Risk */}
            <Text variant="labelMedium" style={styles.label}>
              Dependency Risk Level
            </Text>
            <RadioButton.Group
              onValueChange={value => setDependencyRisk(value as DependencyRisk)}
              value={dependencyRisk}
            >
              <View style={styles.radioRow}>
                <View style={styles.radioItem}>
                  <RadioButton value="low" />
                  <Text>🟢 Low</Text>
                </View>
                <View style={styles.radioItem}>
                  <RadioButton value="medium" />
                  <Text>🟡 Medium</Text>
                </View>
                <View style={styles.radioItem}>
                  <RadioButton value="high" />
                  <Text>🔴 High</Text>
                </View>
              </View>
            </RadioButton.Group>

            {/* Risk Notes */}
            {(dependencyRisk === 'medium' || dependencyRisk === 'high') && (
              <TextInput
                label="Risk Notes"
                value={riskNotes}
                onChangeText={setRiskNotes}
                mode="outlined"
                multiline
                numberOfLines={3}
                style={styles.input}
              />
            )}

            {/* Action Buttons */}
            <View style={styles.actions}>
              <Button mode="outlined" onPress={onDismiss} style={styles.button}>
                Cancel
              </Button>
              <Button mode="contained" onPress={handleSave} style={styles.button}>
                {editItem ? 'Update' : 'Create'}
              </Button>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modal: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 8,
    maxHeight: '90%',
  },
  container: {
    padding: 20,
  },
  title: {
    marginBottom: 20,
  },
  input: {
    marginBottom: 8,
  },
  wbsCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  wbsCodeInput: {
    flex: 1,
  },
  label: {
    marginTop: 12,
    marginBottom: 4,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#666',
    borderRadius: 4,
    marginBottom: 12,
  },
  picker: {
    height: 50,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  halfWidth: {
    width: '48%',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  radioRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
    gap: 12,
  },
  button: {
    minWidth: 100,
  },
});

export default ItemFormModal;
```

**3.3 Integrate Form Modal into WBS Screen** (1 hour)

Update `WBSManagementScreen.tsx`:

```typescript
// Add imports
import ItemFormModal from './components/ItemFormModal';

// Add state
const [showFormModal, setShowFormModal] = useState(false);
const [editingItem, setEditingItem] = useState<ItemModel | null>(null);

// Update handlers
const handleAddItem = () => {
  setEditingItem(null);
  setShowFormModal(true);
};

const handleEditItem = (item: ItemModel) => {
  if (item.isBaselineLocked) {
    Alert.alert('Baseline Locked', 'Cannot edit items after baseline is locked.');
    return;
  }
  setEditingItem(item);
  setShowFormModal(true);
};

const handleDeleteItem = async (item: ItemModel) => {
  if (item.isBaselineLocked) {
    Alert.alert('Baseline Locked', 'Cannot delete items after baseline is locked.');
    return;
  }

  Alert.alert('Delete Item', `Are you sure you want to delete "${item.name}"?`, [
    { text: 'Cancel', style: 'cancel' },
    {
      text: 'Delete',
      style: 'destructive',
      onPress: async () => {
        try {
          await database.write(async () => {
            await item.destroyPermanently();
          });
          loadItems();
        } catch (error) {
          console.error('Error deleting item:', error);
          Alert.alert('Error', 'Failed to delete item');
        }
      },
    },
  ]);
};

const handleFormSave = () => {
  loadItems();
};

// Add modal to render
<ItemFormModal
  visible={showFormModal}
  onDismiss={() => setShowFormModal(false)}
  onSave={handleFormSave}
  site={selectedSite}
  categories={categories}
  editItem={editingItem || undefined}
/>

// Update WBSItemCard
<WBSItemCard
  item={item}
  onEdit={() => handleEditItem(item)}
  onDelete={() => handleDeleteItem(item)}
/>
```

**3.4 Testing** (2 hours)

Create test cases for WBS code generation and item CRUD operations.

#### Deliverables

- ✅ WBS Code Generator service with auto-generation logic
- ✅ Item Form Modal with all fields
- ✅ Create, Edit, Delete functionality
- ✅ WBS code validation (uniqueness)
- ✅ Manual WBS code override option
- ✅ Baseline lock enforcement
- ✅ Form validation

#### Acceptance Criteria

- [ ] WBS codes auto-generate correctly (sequential)
- [ ] Can manually override WBS codes
- [ ] Duplicate WBS codes rejected
- [ ] All item fields save correctly
- [ ] Cannot edit/delete when baseline locked
- [ ] Form validation works (required fields)
- [ ] Risk notes show only for medium/high risk

---

### Sprint 4: Baseline Lock & Supervisor Integration (Week 4)

**Goal:** Enforce baseline lock across all roles and enhance existing planning screens.

**Duration:** 6-8 hours

#### Tasks

**4.1 Update Supervisor Items Management Screen** (2 hours)

**File:** `src/supervisor/ItemsManagementScreen.tsx`

Add baseline lock check and read-only banner:

```typescript
// Add state
const [baselineLocked, setBaselineLocked] = useState(false);

// Check baseline status
useEffect(() => {
  if (items.length > 0) {
    const locked = items.some(item => item.isBaselineLocked);
    setBaselineLocked(locked);
  }
}, [items]);

// Add banner component
{baselineLocked && (
  <Card style={styles.lockedBanner}>
    <Card.Content>
      <View style={styles.bannerContent}>
        <Text variant="titleMedium">⚠️ BASELINE LOCKED</Text>
        <Text variant="bodySmall">
          Items cannot be modified. Contact Planner for schedule changes.
        </Text>
      </View>
    </Card.Content>
  </Card>
)}

// Disable create button
<FAB
  icon="plus"
  style={styles.fab}
  onPress={handleAddItem}
  label="Add Item"
  disabled={baselineLocked}
/>

// Update handleAddItem
const handleAddItem = () => {
  if (baselineLocked) {
    Alert.alert(
      'Baseline Locked',
      'Items cannot be created after baseline is locked. Contact the Planner to make schedule changes.'
    );
    return;
  }
  setShowAddModal(true);
};

// Add styles
lockedBanner: {
  margin: 16,
  backgroundColor: '#fff3e0',
  borderLeftWidth: 4,
  borderLeftColor: '#ff9800',
},
bannerContent: {
  gap: 4,
},
```

**4.2 Enhance Baseline Planning Screen** (2 hours)

**File:** `src/planning/BaselineScreen.tsx`

Add WBS codes, phase grouping, and critical path indicators:

```typescript
// Group items by phase
const groupItemsByPhase = (items: ItemModel[]) => {
  const grouped: Record<string, ItemModel[]> = {};

  items.forEach(item => {
    const phase = item.projectPhase;
    if (!grouped[phase]) {
      grouped[phase] = [];
    }
    grouped[phase].push(item);
  });

  return grouped;
};

// Render grouped items
const renderPhaseGroup = (phase: string, phaseItems: ItemModel[]) => {
  const phaseLabel = phaseItems[0]?.getPhaseLabel() || phase;
  const phaseColor = phaseItems[0]?.getPhaseColor() || '#666';

  return (
    <View key={phase} style={styles.phaseGroup}>
      <View style={[styles.phaseHeader, { borderLeftColor: phaseColor }]}>
        <Text variant="titleMedium">{phaseLabel}</Text>
        <Text variant="bodySmall">({phaseItems.length} items)</Text>
      </View>
      {phaseItems.map(item => (
        <Card key={item.id} style={styles.itemCard}>
          <Card.Content>
            <View style={styles.itemHeader}>
              <Text variant="labelSmall" style={styles.wbsCode}>
                {item.getFormattedWbsCode()}
              </Text>
              {item.isOnCriticalPath() && (
                <Chip compact style={styles.criticalChip}>
                  🔴 Critical
                </Chip>
              )}
            </View>
            <Text variant="titleMedium">{item.name}</Text>
            <Text variant="bodySmall">
              Duration: {item.getPlannedDuration()} days
            </Text>
          </Card.Content>
        </Card>
      ))}
    </View>
  );
};

// In render
const groupedItems = groupItemsByPhase(items);
Object.entries(groupedItems).map(([phase, phaseItems]) =>
  renderPhaseGroup(phase, phaseItems)
);
```

**4.3 Enhance Gantt Chart Screen** (2 hours)

**File:** `src/planning/GanttChartScreen.tsx`

Add WBS codes to labels and bold critical path items:

```typescript
// Update Gantt bar rendering
const renderGanttBar = (item: ItemModel) => {
  const isOnCriticalPath = item.isOnCriticalPath();
  const phaseColor = item.getPhaseColor();

  return (
    <View style={styles.ganttRow} key={item.id}>
      <View style={styles.labelContainer}>
        <Text
          variant="bodySmall"
          style={[
            styles.wbsCodeLabel,
            isOnCriticalPath && styles.criticalText,
          ]}
        >
          {item.getFormattedWbsCode()}
        </Text>
        <Text
          variant="bodyMedium"
          style={[
            styles.itemLabel,
            isOnCriticalPath && styles.criticalText,
          ]}
          numberOfLines={1}
        >
          {item.name}
        </Text>
      </View>
      <View
        style={[
          styles.ganttBar,
          {
            backgroundColor: phaseColor,
            borderWidth: isOnCriticalPath ? 3 : 1,
            borderColor: isOnCriticalPath ? '#d32f2f' : phaseColor,
          },
        ]}
      />
    </View>
  );
};

// Add styles
wbsCodeLabel: {
  fontFamily: 'monospace',
  fontSize: 10,
  color: '#666',
},
criticalText: {
  fontWeight: 'bold',
  color: '#d32f2f',
},
```

**4.4 Integration Testing** (1 hour)

Test baseline lock enforcement across all roles and screens.

#### Deliverables

- ✅ Supervisor screen with baseline lock enforcement
- ✅ Read-only banner when baseline locked
- ✅ Baseline screen with phase grouping
- ✅ Gantt chart with WBS codes and critical path highlighting
- ✅ Clear error messages for locked operations

#### Acceptance Criteria

- [ ] Supervisor cannot create items when baseline locked
- [ ] Banner displays correctly when baseline locked
- [ ] Baseline screen groups items by phase
- [ ] Gantt chart shows WBS codes
- [ ] Critical path items bold and highlighted
- [ ] Clear error messages shown

---

### Sprint 5: Modular Template System (Week 5)

**Goal:** Create modular template library with Metro-specific templates.

**Duration:** 12-15 hours

See next section for details...

---

## Database Schema Changes

### Schema Version: 11 → 12

#### Modified Tables

**`items` table - Added 10 columns:**

| Column Name | Type | Indexed | Optional | Description |
|-------------|------|---------|----------|-------------|
| `project_phase` | string | Yes | No | Project lifecycle phase |
| `is_milestone` | boolean | No | No | Milestone flag |
| `created_by_role` | string | No | No | Creator role (planner/supervisor) |
| `wbs_code` | string | Yes | No | WBS code (e.g., "1.2.3.4") |
| `wbs_level` | number | No | No | WBS hierarchy level (1-4) |
| `parent_wbs_code` | string | No | Yes | Parent WBS code |
| `is_critical_path` | boolean | No | No | Critical path indicator |
| `float_days` | number | No | Yes | Total float in days |
| `dependency_risk` | string | No | Yes | Risk level (low/medium/high) |
| `risk_notes` | string | No | Yes | Risk description |

#### New Tables

**`template_modules` table:**

| Column Name | Type | Description |
|-------------|------|-------------|
| `id` | string | Primary key |
| `name` | string | Template module name |
| `category` | string | Category (substation/ohe/third_rail/building) |
| `voltage_level` | string | Voltage level (220kV/132kV/etc.) |
| `items_json` | string | JSON array of template items |
| `compatible_modules` | string | JSON array of compatible module IDs |
| `is_predefined` | boolean | System template flag |
| `description` | string | Module description |
| `created_at` | number | Creation timestamp |
| `updated_at` | number | Update timestamp |

**`interface_points` table (v1.4 - prepared for future):**

| Column Name | Type | Description |
|-------------|------|-------------|
| `id` | string | Primary key |
| `item_id` | string | Related item ID |
| `from_contractor` | string | Source contractor |
| `to_contractor` | string | Target contractor |
| `interface_type` | string | Type (handover/approval/information) |
| `status` | string | Status (pending/in_progress/resolved/blocked) |
| `target_date` | number | Target completion date |
| `actual_date` | number | Actual completion date |
| `notes` | string | Interface notes |
| `created_at` | number | Creation timestamp |
| `updated_at` | number | Update timestamp |

---

## Modular Template System

### Template Module Structure

Each module is self-contained and can be combined with compatible modules.

#### Module Definition

```typescript
interface TemplateModule {
  id: string;
  name: string;
  category: 'substation' | 'ohe' | 'third_rail' | 'building' | 'interface';
  voltage_level?: '220kV' | '132kV' | '66kV' | '33kV' | '25kV' | '650VDC';
  description: string;
  items: TemplateItem[];
  compatible_modules: string[]; // IDs of modules that can be combined
  estimated_duration: number; // Days (includes critical path)
}

interface TemplateItem {
  name: string;
  phase: ProjectPhase;
  duration: number; // Days
  dependencies: string[]; // Item names (within or across modules)
  wbsCode: string; // Relative code (e.g., "1.1.0", "1.2.0")
  isMilestone?: boolean;
  quantity?: number;
  unit?: string;
  dependencyRisk?: 'low' | 'medium' | 'high';
  riskNotes?: string;
}
```

### Predefined Template Modules

#### 1. **220kV Incoming System Module**

**Category:** `substation`
**Voltage Level:** `220kV`
**Items:** 18
**Duration:** ~90 days
**Compatible With:** 132kV Transformer, 66kV Distribution, Control & Protection

**Items:**
- Design: SLD, Protection scheme, Equipment specs (15 days)
- Approvals: Utility clearance (10 days)
- Procurement: 220kV breakers, isolators, CT/PT (60 days)
- Site Prep: Gantry foundations, cable trenches (20 days)
- Construction: Equipment installation, cabling (25 days)
- Testing: FAT, SAT, Energization (10 days)

#### 2. **132kV Transformer & SWGR Module**

**Category:** `substation`
**Voltage Level:** `132kV`
**Items:** 22
**Duration:** ~110 days
**Compatible With:** 220kV Incoming, 33kV Auxiliary, Control & Protection

**Items:**
- Design: Transformer specs, SWGR layout (10 days)
- Procurement: 220/132kV transformer (60 days) - CRITICAL PATH
- Procurement: 132kV SWGR (45 days)
- Site Prep: Transformer foundation, oil pit (15 days)
- Construction: Transformer installation, SWGR (20 days)
- Testing: Transformer tests, relay testing (12 days)
- Commissioning: Load testing, energization (7 days)

#### 3. **33kV Auxiliary Supply Module**

**Category:** `substation`
**Voltage Level:** `33kV`
**Items:** 12
**Duration:** ~60 days
**Compatible With:** All substation modules

**Items:**
- Design: 33kV bay design (5 days)
- Procurement: 33kV breakers, auxiliaries (40 days)
- Construction: 33kV bay installation (15 days)
- Testing: 33kV system testing (7 days)

#### 4. **Control & Protection System Module**

**Category:** `substation`
**Items:** 8
**Duration:** ~45 days
**Compatible With:** All substation modules

**Items:**
- Design: Protection scheme, SCADA (7 days)
- Procurement: Control panels, relays (35 days)
- Construction: Panel installation, wiring (15 days)
- Testing: Relay testing, SCADA commissioning (10 days)

#### 5. **25kV OHE Section Module (per km)**

**Category:** `ohe`
**Voltage Level:** `25kV`
**Items:** 20
**Duration:** ~30 days per km
**Repeatable:** Yes (multiple sections)

**Items:**
- Design: OHE design, sag-tension (5 days)
- Mobilization: OHE equipment, crew (3 days)
- Procurement: Masts, catenary wire (40 days)
- Site Prep: Foundation excavation (10 days per km)
- Construction: Mast erection, catenary stringing (20 days per km)
- Testing: Tension testing, energization (5 days per km)

#### 6. **650VDC Third Rail Module (per km)**

**Category:** `third_rail`
**Voltage Level:** `650VDC`
**Items:** 15
**Duration:** ~25 days per km
**Repeatable:** Yes

**Items:**
- Design: Third rail layout (3 days)
- Procurement: Conductor rail, insulators (30 days)
- Construction: Support installation, rail laying (18 days per km)
- Testing: Insulation testing, energization (4 days per km)

#### 7. **Control Room Building Module**

**Category:** `building`
**Items:** 16
**Duration:** ~45 days
**Compatible With:** All modules

**Items:**
- Design: Building design, MEP (8 days)
- Approvals: Building permit (12 days)
- Construction: Civil works (25 days)
- Construction: MEP installation (15 days)
- Testing: Building inspections (5 days)

#### 8. **Earthing & Lightning Protection Module**

**Category:** `substation`
**Items:** 6
**Duration:** ~15 days
**Compatible With:** All substation modules

**Items:**
- Design: Earthing grid design (3 days)
- Site Prep: Grid excavation (5 days)
- Construction: Grid installation (7 days)
- Testing: Earth resistance testing (3 days)

---

## Future Enhancements (v1.4)

### Reporting Features (2-3 weeks)

#### 1. S-Curve Report

**Description:** Cumulative progress curve showing planned vs actual progress

**Features:**
- Planned value (PV) curve
- Earned value (EV) curve
- Actual cost (AC) curve (if cost tracking enabled)
- Schedule Performance Index (SPI)
- Cost Performance Index (CPI)
- Export as PNG/PDF

**Implementation:**
- Use `react-native-svg` for chart rendering
- Calculate cumulative progress from baseline dates
- Update daily based on progress logs

#### 2. Look-Ahead Schedule

**Description:** Near-term schedule for field execution (3-week or 6-week window)

**Features:**
- Configurable window (3/6/12 weeks)
- Filter by phase, critical path, or resource
- Shows upcoming milestones
- Highlights interface dependencies
- Export to PDF

**Implementation:**
- Query items with planned_start_date in window
- Sort by start date
- Group by week
- Highlight critical path items

#### 3. Resource Histogram

**Description:** Resource loading chart showing labor/equipment utilization

**Features:**
- Weekly resource aggregation
- Multiple resource types (labor categories, equipment)
- Identify over-allocation (red bars)
- Resource leveling suggestions
- Export to PDF

**Implementation:**
- Add `resource_allocations` table
- Link resources to items
- Aggregate by week
- Identify peaks and valleys

### Interface Management Screen (v1.4)

**Description:** Track contractor-to-contractor handoffs and dependencies

**Features:**
- Interface point CRUD operations
- Status tracking (pending/in_progress/resolved/blocked)
- Overdue interface alerts
- Interface dashboard (status summary)
- Email notifications (future)

**Implementation:**
- Use prepared `interface_points` table
- Link to items
- Visual status board (Kanban-style)
- Filter by contractor, status, date

---

## Success Metrics

### After 5 Sprints, You Will Have:

✅ **Complete WBS Management**
- 11-phase project lifecycle (design → handover)
- Hierarchical WBS codes (1.2.3.4)
- Auto-generation and manual override

✅ **Critical Path Management**
- Automatic critical path identification
- Float calculation
- Visual highlighting in all views

✅ **Risk Management**
- 3-level dependency risk (low/medium/high)
- Risk notes and warnings
- Visual risk indicators

✅ **Modular Template System**
- 8 Metro-specific template modules
- Combinable modules for custom projects
- Quick project setup (5 minutes vs 2 hours)

✅ **Baseline Lock Enforcement**
- Role-based permissions (Planner creates, Supervisor reads)
- Clear messaging for locked state
- Audit trail (created_by_role)

✅ **Professional UI/UX**
- Hierarchical item display with indentation
- Phase color-coding
- Critical path highlighting
- Risk badges
- Mobile-optimized forms

### Quantifiable Improvements

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| **Project Setup Time** | 2-3 hours | 5-10 minutes | **95% faster** |
| **Schedule Completeness** | Construction only | All 11 phases | **Complete** |
| **Critical Path Visibility** | Manual calculation | Automatic | **100% accurate** |
| **WBS Structure** | Flat list | 4-level hierarchy | **Professional** |
| **Planner Independence** | Dependent on Supervisor | Fully independent | **100% autonomous** |

---

## Appendix: Template Modules

### Module 1: 220kV Incoming System

```json
{
  "id": "tmpl_220kv_incoming",
  "name": "220kV Incoming System",
  "category": "substation",
  "voltage_level": "220kV",
  "description": "Complete 220kV incoming bay with breakers, isolators, and protection",
  "estimated_duration": 90,
  "compatible_modules": ["tmpl_132kv_transformer", "tmpl_66kv_distribution", "tmpl_control_protection"],
  "items": [
    {
      "name": "220kV SLD Design",
      "phase": "design",
      "duration": 5,
      "dependencies": [],
      "wbsCode": "1.1.1",
      "isMilestone": false
    },
    {
      "name": "220kV Protection Scheme Design",
      "phase": "design",
      "duration": 5,
      "dependencies": ["220kV SLD Design"],
      "wbsCode": "1.1.2",
      "isMilestone": false
    },
    {
      "name": "220kV Equipment Specifications",
      "phase": "design",
      "duration": 5,
      "dependencies": ["220kV Protection Scheme Design"],
      "wbsCode": "1.1.3",
      "isMilestone": true
    },
    {
      "name": "220kV Utility Clearance",
      "phase": "approvals",
      "duration": 10,
      "dependencies": ["220kV Equipment Specifications"],
      "wbsCode": "1.2.1",
      "isMilestone": true,
      "dependencyRisk": "medium",
      "riskNotes": "Utility approval may be delayed"
    },
    {
      "name": "220kV Circuit Breaker Procurement",
      "phase": "procurement",
      "duration": 60,
      "dependencies": ["220kV Utility Clearance"],
      "wbsCode": "1.3.1",
      "isMilestone": false,
      "dependencyRisk": "high",
      "riskNotes": "Long lead item - potential critical path"
    },
    {
      "name": "220kV Isolators Procurement",
      "phase": "procurement",
      "duration": 50,
      "dependencies": ["220kV Utility Clearance"],
      "wbsCode": "1.3.2",
      "isMilestone": false
    },
    {
      "name": "220kV CT/PT Procurement",
      "phase": "procurement",
      "duration": 45,
      "dependencies": ["220kV Utility Clearance"],
      "wbsCode": "1.3.3",
      "isMilestone": false
    },
    {
      "name": "220kV Gantry Foundation",
      "phase": "site_prep",
      "duration": 15,
      "dependencies": ["220kV Utility Clearance"],
      "wbsCode": "1.4.1",
      "isMilestone": false
    },
    {
      "name": "220kV Cable Trench",
      "phase": "site_prep",
      "duration": 10,
      "dependencies": ["220kV Utility Clearance"],
      "wbsCode": "1.4.2",
      "isMilestone": false
    },
    {
      "name": "220kV Breaker Installation",
      "phase": "construction",
      "duration": 7,
      "dependencies": ["220kV Circuit Breaker Procurement", "220kV Gantry Foundation"],
      "wbsCode": "1.5.1",
      "isMilestone": true
    },
    {
      "name": "220kV Isolator Installation",
      "phase": "construction",
      "duration": 5,
      "dependencies": ["220kV Isolators Procurement", "220kV Gantry Foundation"],
      "wbsCode": "1.5.2",
      "isMilestone": false
    },
    {
      "name": "220kV CT/PT Installation",
      "phase": "construction",
      "duration": 5,
      "dependencies": ["220kV CT/PT Procurement", "220kV Gantry Foundation"],
      "wbsCode": "1.5.3",
      "isMilestone": false
    },
    {
      "name": "220kV Bus Bar Installation",
      "phase": "construction",
      "duration": 10,
      "dependencies": ["220kV Breaker Installation", "220kV Isolator Installation"],
      "wbsCode": "1.5.4",
      "isMilestone": false
    },
    {
      "name": "220kV Control Cabling",
      "phase": "construction",
      "duration": 12,
      "dependencies": ["220kV Bus Bar Installation"],
      "wbsCode": "1.5.5",
      "isMilestone": false
    },
    {
      "name": "220kV Insulation Testing",
      "phase": "testing",
      "duration": 3,
      "dependencies": ["220kV Control Cabling"],
      "wbsCode": "1.6.1",
      "isMilestone": false
    },
    {
      "name": "220kV Protection Relay Testing",
      "phase": "testing",
      "duration": 5,
      "dependencies": ["220kV Control Cabling"],
      "wbsCode": "1.6.2",
      "isMilestone": false
    },
    {
      "name": "220kV Pre-Energization Checks",
      "phase": "testing",
      "duration": 2,
      "dependencies": ["220kV Insulation Testing", "220kV Protection Relay Testing"],
      "wbsCode": "1.6.3",
      "isMilestone": true
    },
    {
      "name": "220kV Energization",
      "phase": "commissioning",
      "duration": 1,
      "dependencies": ["220kV Pre-Energization Checks"],
      "wbsCode": "1.7.1",
      "isMilestone": true
    }
  ]
}
```

### Module 2: 132kV Transformer & SWGR

*Similar detailed structure for remaining 7 modules...*

---

## Next Steps

1. **Review this implementation plan** - Confirm approach and timeline
2. **Sprint 1 kickoff** - Ready to start database schema updates?
3. **Provide sample durations** - For Metro projects (needed for templates in Sprint 5)

**Shall we proceed with Sprint 1 implementation?**

---

**Document End**

**Total Pages:** ~75
**Total Words:** ~18,000
**Estimated Reading Time:** 60-75 minutes
