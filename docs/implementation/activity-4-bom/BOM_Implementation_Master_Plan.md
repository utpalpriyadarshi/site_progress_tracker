# BOM Management System - Master Implementation Plan

**Project**: Site Progress Tracker - Activity 4: BOM Management
**Branch**: feature/v2.4-bom
**Start Date**: 2025-11-03
**Estimated Duration**: 3 weeks

---

## Table of Contents
1. [Current Status](#current-status)
2. [Implementation Phases](#implementation-phases)
3. [File Structure Reference](#file-structure-reference)
4. [Execution Tracking](#execution-tracking)
5. [Technical Specifications](#technical-specifications)

---

## Current Status

### Existing Codebase Analysis
- **Manager Navigator**: 4 tabs (Project Overview, Team, Financial, Resource Requests)
- **Database Models**: Located in `/models/` directory
  - ProjectModel.ts ✓
  - MaterialModel.ts ✓
  - TeamModel.ts ✓
  - SiteModel.ts ✓
- **Logistics Screens**: Placeholder screens ready for integration
  - MaterialTrackingScreen.tsx (basic)
  - DeliverySchedulingScreen.tsx (basic)
  - InventoryManagementScreen.tsx (basic)
- **Manager Context**: Basic context exists at `src/manager/context/ManagerContext.tsx`

### What We're Building
Complete BOM (Bill of Materials) Management system with:
- Pre-Contract BOM (Estimating/Tendering)
- Post-Contract BOM (Execution/Delivery)
- Cost tracking and analytics
- Version control and variation management
- Cross-role integration with Logistics
- Comprehensive reporting

---

## Implementation Phases

## PHASE 1: BOM Foundation Setup
**Document**: [Phase_1_Foundation.md](./Phase_1_Foundation.md)
**Status**: 🔴 NOT STARTED
**Duration**: 2 days
**Priority**: CRITICAL - Must complete first

### Deliverables
- [ ] Database models created
- [ ] Database schema updated
- [ ] BOM Management screen created
- [ ] BOM Context implemented
- [ ] 5th tab added to Manager Navigator
- [ ] Basic CRUD operations working

### Files to Create
```
models/
  ├── BomModel.ts                           [NEW - Priority 1]
  ├── BomItemModel.ts                       [NEW - Priority 1]

src/manager/
  ├── BomManagementScreen.tsx               [NEW - Priority 2]
  └── context/
      └── BomContext.tsx                    [NEW - Priority 3]
```

### Files to Modify
```
src/nav/
  └── ManagerNavigator.tsx                  [MODIFY - Add 5th tab]

models/
  ├── database.ts                           [MODIFY - Register models]
  └── schema.ts                             [MODIFY - Add tables]
```

---

## PHASE 2: Cost Tracking & Analytics
**Document**: [Phase_2_Cost_Tracking.md](./Phase_2_Cost_Tracking.md)
**Status**: 🔴 NOT STARTED
**Duration**: 2 days
**Dependencies**: Phase 1 must be complete

### Deliverables
- [ ] Cost calculation service implemented
- [ ] Cost dashboard created
- [ ] BOM item editor with auto-calculations
- [ ] Budget utilization tracking
- [ ] Cost variance analysis

### Files to Create
```
src/manager/components/
  ├── BomCostDashboard.tsx                  [NEW - Priority 1]
  ├── BomItemEditor.tsx                     [NEW - Priority 2]
  ├── BomCostBreakdown.tsx                  [NEW - Priority 3]

src/services/
  └── BomCalculatorService.ts               [NEW - Priority 1]
```

### Files to Modify
```
src/manager/
  └── BomManagementScreen.tsx               [MODIFY - Add cost dashboard]

models/
  └── BomModel.ts                           [MODIFY - Add calculated fields]
```

---

## PHASE 3: Logistics Integration
**Document**: [Phase_3_Logistics_Integration.md](./Phase_3_Logistics_Integration.md)
**Status**: 🔴 NOT STARTED
**Duration**: 2-3 days
**Dependencies**: Phase 1 & 2 must be complete

### Deliverables
- [ ] Shared BOM hook for cross-role access
- [ ] Material Tracking enhanced with BOM data
- [ ] Delivery Scheduling linked to BOM
- [ ] Inventory Management using BOM targets
- [ ] Real-time BOM updates across roles

### Files to Create
```
src/shared/hooks/
  └── useBomData.ts                         [NEW - Priority 1]

src/logistics/components/
  └── BomRequirementCard.tsx                [NEW - Priority 2]

src/services/
  └── BomLogisticsService.ts                [NEW - Priority 3]
```

### Files to Modify
```
src/logistics/
  ├── MaterialTrackingScreen.tsx            [ENHANCE - BOM requirements]
  ├── DeliverySchedulingScreen.tsx          [ENHANCE - BOM-driven planning]
  └── InventoryManagementScreen.tsx         [ENHANCE - BOM-based targets]

src/manager/context/
  └── BomContext.tsx                        [MODIFY - Cross-role access]
```

---

## PHASE 4: Version Control & Variations
**Document**: [Phase_4_Version_Control.md](./Phase_4_Version_Control.md)
**Status**: 🔴 NOT STARTED
**Duration**: 2-3 days
**Dependencies**: Phase 1, 2, 3 must be complete

### Deliverables
- [ ] BOM versioning system
- [ ] Variation order management
- [ ] Version comparison tool
- [ ] Change impact analysis
- [ ] Approval workflow

### Files to Create
```
models/
  ├── BomVersionModel.ts                    [NEW - Priority 1]
  └── VariationOrderModel.ts                [NEW - Priority 1]

src/manager/components/
  ├── BomVersionHistory.tsx                 [NEW - Priority 2]
  └── VariationManagement.tsx               [NEW - Priority 3]

src/services/
  └── BomVersionService.ts                  [NEW - Priority 2]
```

### Files to Modify
```
models/
  └── BomModel.ts                           [MODIFY - Add version fields]

src/manager/
  └── BomManagementScreen.tsx               [MODIFY - Add version tabs]

src/manager/context/
  └── BomContext.tsx                        [MODIFY - Version methods]
```

---

## PHASE 5: Reporting & Analytics
**Document**: [Phase_5_Reporting_Analytics.md](./Phase_5_Reporting_Analytics.md)
**Status**: 🔴 NOT STARTED
**Duration**: 3 days
**Dependencies**: All previous phases complete

### Deliverables
- [ ] Advanced analytics dashboard
- [ ] Standard reports library
- [ ] PDF export functionality
- [ ] Excel export functionality
- [ ] Predictive analytics
- [ ] Executive KPI dashboard

### Files to Create
```
src/manager/components/
  ├── BomReportsScreen.tsx                  [NEW - Priority 1]
  ├── BomAnalyticsDashboard.tsx             [NEW - Priority 2]
  └── BomCharts.tsx                         [NEW - Priority 3]

src/services/
  └── BomAnalyticsService.ts                [NEW - Priority 1]

src/utils/
  └── BomReportGenerator.ts                 [NEW - Priority 2]
```

### Files to Modify
```
src/manager/
  └── BomManagementScreen.tsx               [MODIFY - Add Reports tab]
```

---

## File Structure Reference

### Complete Directory Structure After Implementation
```
site_progress_tracker/
├── models/
│   ├── BomModel.ts                         ⭐ NEW
│   ├── BomItemModel.ts                     ⭐ NEW
│   ├── BomVersionModel.ts                  ⭐ NEW
│   ├── VariationOrderModel.ts              ⭐ NEW
│   ├── database.ts                         📝 MODIFIED
│   ├── schema.ts                           📝 MODIFIED
│   ├── MaterialModel.ts                    ✓ EXISTING
│   └── ProjectModel.ts                     ✓ EXISTING
│
├── src/
│   ├── manager/
│   │   ├── BomManagementScreen.tsx         ⭐ NEW (Main Screen)
│   │   ├── TeamManagementScreen.tsx        ✓ EXISTING
│   │   ├── ProjectOverviewScreen.tsx       ✓ EXISTING
│   │   ├── FinancialReportsScreen.tsx      ✓ EXISTING
│   │   ├── ResourceRequestsScreen.tsx      ✓ EXISTING
│   │   │
│   │   ├── components/
│   │   │   ├── BomCostDashboard.tsx        ⭐ NEW
│   │   │   ├── BomItemEditor.tsx           ⭐ NEW
│   │   │   ├── BomCostBreakdown.tsx        ⭐ NEW
│   │   │   ├── BomVersionHistory.tsx       ⭐ NEW
│   │   │   ├── VariationManagement.tsx     ⭐ NEW
│   │   │   ├── BomReportsScreen.tsx        ⭐ NEW
│   │   │   ├── BomAnalyticsDashboard.tsx   ⭐ NEW
│   │   │   └── BomCharts.tsx               ⭐ NEW
│   │   │
│   │   └── context/
│   │       ├── BomContext.tsx              ⭐ NEW
│   │       └── ManagerContext.tsx          📝 MODIFIED
│   │
│   ├── logistics/
│   │   ├── MaterialTrackingScreen.tsx      📝 ENHANCED
│   │   ├── DeliverySchedulingScreen.tsx    📝 ENHANCED
│   │   ├── InventoryManagementScreen.tsx   📝 ENHANCED
│   │   │
│   │   └── components/
│   │       └── BomRequirementCard.tsx      ⭐ NEW
│   │
│   ├── shared/
│   │   └── hooks/
│   │       └── useBomData.ts               ⭐ NEW
│   │
│   ├── services/
│   │   ├── BomCalculatorService.ts         ⭐ NEW
│   │   ├── BomLogisticsService.ts          ⭐ NEW
│   │   ├── BomVersionService.ts            ⭐ NEW
│   │   └── BomAnalyticsService.ts          ⭐ NEW
│   │
│   ├── utils/
│   │   └── BomReportGenerator.ts           ⭐ NEW
│   │
│   └── nav/
│       └── ManagerNavigator.tsx            📝 MODIFIED (Add 5th tab)
│
└── docs/
    └── implementation/
        └── activity-4-bom/
            ├── BOM_Implementation_Master_Plan.md       (This file)
            ├── Phase_1_Foundation.md
            ├── Phase_2_Cost_Tracking.md
            ├── Phase_3_Logistics_Integration.md
            ├── Phase_4_Version_Control.md
            └── Phase_5_Reporting_Analytics.md
```

---

## Execution Tracking

### Week 1: Foundation & Core Features
| Day | Phase | Tasks | Status | Completion |
|-----|-------|-------|--------|------------|
| Day 1 | Phase 1 | Database models, schema setup | 🔴 Not Started | 0% |
| Day 2 | Phase 1 | BOM screen, context, navigation | 🔴 Not Started | 0% |
| Day 3 | Phase 2 | Calculator service, cost dashboard | 🔴 Not Started | 0% |
| Day 4 | Phase 2 | Item editor, cost breakdown | 🔴 Not Started | 0% |
| Day 5 | Review | Testing, bug fixes | 🔴 Not Started | 0% |

### Week 2: Integration & Advanced Features
| Day | Phase | Tasks | Status | Completion |
|-----|-------|-------|--------|------------|
| Day 6 | Phase 3 | useBomData hook, BOM service | 🔴 Not Started | 0% |
| Day 7 | Phase 3 | Material Tracking integration | 🔴 Not Started | 0% |
| Day 8 | Phase 3 | Delivery & Inventory integration | 🔴 Not Started | 0% |
| Day 9 | Phase 4 | Version models, version service | 🔴 Not Started | 0% |
| Day 10 | Phase 4 | Version history, variation mgmt | 🔴 Not Started | 0% |

### Week 3: Analytics & Finalization
| Day | Phase | Tasks | Status | Completion |
|-----|-------|-------|--------|------------|
| Day 11 | Phase 5 | Analytics service, dashboard | 🔴 Not Started | 0% |
| Day 12 | Phase 5 | Reports screen, chart components | 🔴 Not Started | 0% |
| Day 13 | Phase 5 | Export functionality (PDF/Excel) | 🔴 Not Started | 0% |
| Day 14 | Testing | Integration testing | 🔴 Not Started | 0% |
| Day 15 | Polish | Bug fixes, documentation | 🔴 Not Started | 0% |

**Status Legend:**
- 🔴 Not Started
- 🟡 In Progress
- 🟢 Completed
- 🔵 Testing
- ⚪ Blocked

---

## Technical Specifications

### Database Schema Overview

#### BOM Table
```typescript
interface BOM {
  id: string;
  projectId: string;
  type: 'estimating' | 'execution';
  status: 'draft' | 'submitted' | 'won' | 'lost' | 'baseline' | 'active' | 'closed';
  version: string; // v1.0, v2.0, v3.0, v3.1
  tenderDate?: number;
  client?: string;
  contractValue?: number;
  totalEstimatedCost: number;
  totalActualCost: number;
  contingency: number;
  profitMargin: number;
  createdAt: number;
  updatedAt: number;
  syncStatus: string;
  _version: number;
}
```

#### BOM Item Table
```typescript
interface BOMItem {
  id: string;
  bomId: string;
  materialId: string;
  description: string;
  category: string; // material, labor, equipment
  quantity: number;
  unit: string;
  unitCost: number;
  totalCost: number; // quantity × unitCost
  wbsCode: string;
  phase: string;
  createdAt: number;
  updatedAt: number;
  syncStatus: string;
  _version: number;
}
```

### State Management Architecture

```typescript
// BomContext will provide:
interface BomContextType {
  // BOM Management
  boms: BomModel[];
  selectedBom: BomModel | null;
  setSelectedBom: (bom: BomModel | null) => void;

  // CRUD Operations
  createBom: (data: CreateBomData) => Promise<BomModel>;
  updateBom: (id: string, data: UpdateBomData) => Promise<void>;
  deleteBom: (id: string) => Promise<void>;

  // BOM Items
  bomItems: BomItemModel[];
  addBomItem: (bomId: string, item: CreateBomItemData) => Promise<void>;
  updateBomItem: (id: string, data: UpdateBomItemData) => Promise<void>;
  removeBomItem: (id: string) => Promise<void>;

  // Cost Calculations
  calculateTotalCost: (bomId: string) => number;
  calculateCostBreakdown: (bomId: string) => CostBreakdown;

  // Version Control
  createVersion: (bomId: string, reason: string) => Promise<BomModel>;
  compareVersions: (v1: string, v2: string) => VersionComparison;

  // Filters
  filterType: 'estimating' | 'execution' | null;
  setFilterType: (type: string | null) => void;

  // Refresh
  refreshTrigger: number;
  triggerRefresh: () => void;
}
```

### Integration Points

#### Material Tracking Integration
```typescript
// In MaterialTrackingScreen.tsx
const { getBomRequirements } = useBomData();

// Show requirements vs available
const requirements = getBomRequirements(projectId, materialId);
const shortage = requirements.quantity - material.quantityAvailable;
const status = shortage > 0 ? 'shortage' : 'sufficient';
```

#### Delivery Scheduling Integration
```typescript
// In DeliverySchedulingScreen.tsx
const { getBomPhases } = useBomData();

// Prioritize deliveries by BOM phase
const phases = getBomPhases(projectId);
const prioritizedDeliveries = sortByPhaseUrgency(phases);
```

### Cost Calculation Formulas

#### Pre-Contract (Estimating)
```typescript
totalEstimatedCost = Σ(bomItems.totalCost)
contingencyAmount = totalEstimatedCost × (contingency / 100)
profitAmount = totalEstimatedCost × (profitMargin / 100)
tenderPrice = totalEstimatedCost + contingencyAmount + profitAmount
```

#### Post-Contract (Execution)
```typescript
budgetUtilization = (totalActualCost / contractValue) × 100
costVariance = contractValue - totalActualCost
costPerformanceIndex = contractValue / totalActualCost
variancePercentage = (costVariance / contractValue) × 100
```

### Color-Coded Budget Alerts
```typescript
getBudgetStatus(utilization: number) {
  if (utilization < 80) return 'green';   // On track
  if (utilization < 95) return 'yellow';  // Caution
  return 'red';                           // Over budget
}
```

---

## Dependencies & Prerequisites

### NPM Packages to Install
```bash
# For charts and visualizations
npm install react-native-chart-kit
npm install react-native-svg

# For Excel export
npm install xlsx

# For PDF generation
npm install react-native-pdf
npm install react-native-html-to-pdf

# Date utilities
npm install date-fns
```

### Database Migration Strategy
1. Create new tables for BOM models
2. Add migration script in `models/migrations/`
3. Test migration on development database
4. Plan rollback strategy if needed

---

## Testing Strategy

### Unit Tests
- [ ] BomCalculatorService calculations
- [ ] BomVersionService comparison logic
- [ ] BomAnalyticsService metrics

### Integration Tests
- [ ] BOM creation flow
- [ ] BOM-Logistics data flow
- [ ] Version creation and comparison
- [ ] Cost calculations across components

### Manual Testing Checklist
- [ ] Create Pre-Contract BOM
- [ ] Add items and verify cost calculations
- [ ] Create Post-Contract BOM
- [ ] Test BOM visibility in Logistics screens
- [ ] Create variation order
- [ ] Generate reports
- [ ] Export to PDF/Excel

---

## Risk Assessment & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Database schema conflicts | High | Low | Thorough testing, migration rollback plan |
| Performance with large BOMs | Medium | Medium | Implement pagination, lazy loading |
| Offline sync conflicts | Medium | Medium | Proper conflict resolution strategy |
| Complex calculations causing bugs | High | Medium | Comprehensive unit tests, validation |
| Integration breaking existing features | High | Low | Incremental testing, feature flags |

---

## Success Criteria

### Phase 1 Complete When:
- ✓ Can create both Pre-Contract and Post-Contract BOMs
- ✓ Can add/edit/delete BOM items
- ✓ BOM tab visible in Manager Navigator
- ✓ Data persists offline

### Phase 2 Complete When:
- ✓ Cost calculations are accurate
- ✓ Dashboard shows real-time cost metrics
- ✓ Budget alerts display correctly
- ✓ Percentage breakdowns are accurate

### Phase 3 Complete When:
- ✓ Logistics can view (read-only) BOM data
- ✓ Material Tracking shows BOM requirements
- ✓ Delivery Scheduling uses BOM priorities
- ✓ Inventory shows BOM-based targets

### Phase 4 Complete When:
- ✓ Version history tracks all changes
- ✓ Can compare any two versions
- ✓ Variation orders create new versions
- ✓ Cost impact is calculated correctly

### Phase 5 Complete When:
- ✓ All standard reports generate correctly
- ✓ PDF export works
- ✓ Excel export works
- ✓ Analytics dashboard shows accurate KPIs

---

## Next Steps

### Before Starting Phase 1:
1. ✓ Review this master plan
2. ⏳ Create feature branch: `feature/v2.4-bom`
3. ⏳ Read detailed [Phase_1_Foundation.md](./Phase_1_Foundation.md)
4. ⏳ Confirm understanding of database schema
5. ⏳ Set up development environment

### To Begin Implementation:
```bash
# Create feature branch
git checkout -b feature/v2.4-bom

# Confirm current status
git status

# Start with Phase 1
# Follow Phase_1_Foundation.md step-by-step
```

---

## Questions & Clarifications

Before we start, please confirm:
- [ ] Is the 3-week timeline acceptable?
- [ ] Are there any specific BOM features you want prioritized?
- [ ] Should we include multi-currency support?
- [ ] Do you need approval workflows for BOMs?
- [ ] Any specific report formats required by clients?

---

**Document Version**: 1.0
**Last Updated**: 2025-11-03
**Author**: Claude (AI Assistant)
**Reviewed By**: _Pending_

---

## Command Reference

```bash
# View current plan status
cat docs/implementation/activity-4-bom/BOM_Implementation_Master_Plan.md

# Start Phase 1
cat docs/implementation/activity-4-bom/Phase_1_Foundation.md

# Check implementation progress
git log --oneline feature/v2.4-bom

# Run tests
npm test -- BomCalculatorService
```
