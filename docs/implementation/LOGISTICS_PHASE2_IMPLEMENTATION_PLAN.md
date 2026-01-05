# Logistics Phase 2: Implementation Plan

**Project:** Site Progress Tracker
**Phase:** Phase 2 - Important Improvements
**Role:** Logistics
**Total Estimated Time:** 42-54 hours
**Created:** 2026-01-04

---

## Table of Contents

1. [Overview](#overview)
2. [Current State Analysis](#current-state-analysis)
3. [Task 2.1: Refactor State Management](#task-21-refactor-state-management)
4. [Task 2.2: Create Shared Components](#task-22-create-shared-components)
5. [Task 2.3: Add Loading Skeletons](#task-23-add-loading-skeletons)
6. [Implementation Timeline](#implementation-timeline)
7. [Success Metrics](#success-metrics)
8. [Testing Strategy](#testing-strategy)
9. [Quality Checklist](#quality-checklist)
10. [References](#references)

---

## Overview

This document provides a comprehensive implementation plan for Logistics Phase 2, covering all 3 tasks: State Management Refactor, Shared Components, and Loading Skeletons.

### Why Logistics Phase 2 Matters

**Logistics Role** manages 14 screens with complex state:
- Material tracking and inventory
- RFQ and purchase order workflows
- Equipment management
- Delivery scheduling
- Doors register and packages
- Analytics and reporting

**Current Pain Points:**
- 133 total useState hooks across 14 screens
- LogisticsAnalyticsScreen alone has 18 useState hooks
- Complex form state in DoorsPackageEditScreen (14 useState)
- Purchase orders and equipment management state sprawl
- No shared components for repeated UI patterns
- Loading states use generic spinners

**Phase 2 Goals:**
1. Reduce state complexity by 60-70% in top 4 screens
2. Create 6 reusable shared components
3. Add professional loading skeletons to 3 key screens
4. Improve code maintainability and consistency

---

## Current State Analysis

### Logistics Screens Overview (14 total)

| Screen | useState Count | Complexity | Phase 1 Status | Phase 2 Priority |
|--------|---------------|------------|----------------|------------------|
| LogisticsAnalyticsScreen | 18 | Very High | ✅ Refactored | 🎯 **#1 for Task 2.1** |
| DoorsPackageEditScreen | 14 | Very High | ❌ Not Refactored | 🎯 **#2 for Task 2.1** |
| PurchaseOrderManagementScreen | 14 | Very High | ❌ Not Refactored | 🎯 **#3 for Task 2.1** |
| EquipmentManagementScreen | 13 | High | ❌ Not Refactored | 🎯 **#4 for Task 2.1** |
| MaterialTrackingScreen | 12 | High | ✅ Refactored | ✅ Complete |
| RfqCreateScreen | 12 | High | ❌ Not Refactored | ⏳ Phase 3 |
| DoorsRequirementEditScreen | 9 | Medium | ❌ Not Refactored | ⏳ Phase 3 |
| DoorsDetailScreen | 8 | Medium | ❌ Not Refactored | ⏳ Phase 3 |
| LogisticsDashboardScreen | 7 | Medium | ❌ Not Refactored | 📊 Skeleton only |
| DoorsRegisterScreen | 6 | Medium | ❌ Not Refactored | ⏳ Phase 3 |
| RfqListScreen | 5 | Low | ❌ Not Refactored | ⏳ Phase 3 |
| InventoryManagementScreen | 5 | Low | ✅ Refactored | ✅ Complete |
| DeliverySchedulingScreen | 5 | Low | ✅ Refactored | ✅ Complete |
| RfqDetailScreen | 5 | Low | ❌ Not Refactored | ⏳ Phase 3 |

**Total:** 133 useState hooks across 14 screens

**Phase 1 Progress:** 3 screens refactored (MaterialTracking, Inventory, Delivery)

**Phase 2 Target:** Top 4 screens (LogisticsAnalytics, DoorsPackageEdit, PurchaseOrderManagement, EquipmentManagement)

---

## Task 2.1: Refactor State Management

**Estimated Time:** 20-26 hours
**Priority:** High
**Complexity:** Very High

### Objective

Convert the top 4 most complex Logistics screens from multiple `useState` hooks to centralized `useReducer` pattern, following the established Manager role pattern.

### Target Screens

#### 1. LogisticsAnalyticsScreen (18 useState → 1 useReducer)

**Current State (18 useState):**
```typescript
const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter'>('month');
const [loading, setLoading] = useState(true);
const [refreshing, setRefreshing] = useState(false);
const [materialStats, setMaterialStats] = useState<MaterialStats>({...}); // 8 fields
const [deliveryStats, setDeliveryStats] = useState<DeliveryStats>({...}); // 6 fields
const [inventoryStats, setInventoryStats] = useState<InventoryStats>({...}); // 5 fields
const [equipmentStats, setEquipmentStats] = useState<EquipmentStats>({...}); // 4 fields
const [rfqStats, setRfqStats] = useState<RfqStats>({...}); // 7 fields
const [poStats, setPOStats] = useState<POStats>({...}); // 6 fields
const [doorsStats, setDoorsStats] = useState<DoorsStats>({...}); // 5 fields
const [trendData, setTrendData] = useState<TrendDataPoint[]>([]);
const [topMaterials, setTopMaterials] = useState<MaterialItem[]>([]);
const [criticalInventory, setCriticalInventory] = useState<InventoryItem[]>([]);
const [upcomingDeliveries, setUpcomingDeliveries] = useState<DeliverySchedule[]>([]);
const [activeTab, setActiveTab] = useState<'overview' | 'materials' | 'equipment'>('overview');
// ... more state
```

**Target State (1 useReducer):**
```typescript
interface AnalyticsState {
  ui: {
    selectedPeriod: 'week' | 'month' | 'quarter';
    loading: boolean;
    refreshing: boolean;
    activeTab: 'overview' | 'materials' | 'equipment';
  };
  stats: {
    material: MaterialStats;
    delivery: DeliveryStats;
    inventory: InventoryStats;
    equipment: EquipmentStats;
    rfq: RfqStats;
    po: POStats;
    doors: DoorsStats;
  };
  data: {
    trendData: TrendDataPoint[];
    topMaterials: MaterialItem[];
    criticalInventory: InventoryItem[];
    upcomingDeliveries: DeliverySchedule[];
  };
}

const [state, dispatch] = useReducer(analyticsReducer, initialState);
```

**Reduction:** 18 useState → 1 useReducer (**94% reduction!**)

---

#### 2. DoorsPackageEditScreen (14 useState → 1 useReducer)

**Current State (14 useState):**
```typescript
const [packageName, setPackageName] = useState('');
const [selectedSite, setSelectedSite] = useState('');
const [selectedBuilding, setSelectedBuilding] = useState('');
const [selectedFloor, setSelectedFloor] = useState('');
const [packageType, setPackageType] = useState<'standard' | 'fire-rated' | 'acoustic'>('standard');
const [quantity, setQuantity] = useState('');
const [doorWidth, setDoorWidth] = useState('');
const [doorHeight, setDoorHeight] = useState('');
const [frameType, setFrameType] = useState('');
const [hardwareSet, setHardwareSet] = useState('');
const [notes, setNotes] = useState('');
const [saving, setSaving] = useState(false);
const [errors, setErrors] = useState<Record<string, string>>({});
const [dialogVisible, setDialogVisible] = useState(false);
```

**Target State (1 useReducer):**
```typescript
interface DoorsPackageFormState {
  form: {
    packageName: string;
    selectedSite: string;
    selectedBuilding: string;
    selectedFloor: string;
    packageType: 'standard' | 'fire-rated' | 'acoustic';
    quantity: string;
    doorWidth: string;
    doorHeight: string;
    frameType: string;
    hardwareSet: string;
    notes: string;
  };
  ui: {
    saving: boolean;
    dialogVisible: boolean;
  };
  validation: {
    errors: Record<string, string>;
  };
}

const [state, dispatch] = useReducer(doorsPackageFormReducer, initialState);
```

**Reduction:** 14 useState → 1 useReducer (**93% reduction!**)

---

#### 3. PurchaseOrderManagementScreen (14 useState → 1 useReducer)

**Current State (14 useState):**
```typescript
const [loading, setLoading] = useState(true);
const [refreshing, setRefreshing] = useState(false);
const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
const [dialogVisible, setDialogVisible] = useState(false);
const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
const [poToDelete, setPOToDelete] = useState<PurchaseOrder | null>(null);
const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'sent' | 'approved'>('all');
const [searchQuery, setSearchQuery] = useState('');
const [sortBy, setSortBy] = useState<'date' | 'amount' | 'supplier'>('date');
const [selectedSupplier, setSelectedSupplier] = useState('');
const [dateFrom, setDateFrom] = useState<Date | null>(null);
const [dateTo, setDateTo] = useState<Date | null>(null);
const [showFilters, setShowFilters] = useState(false);
```

**Target State (1 useReducer):**
```typescript
interface POManagementState {
  ui: {
    loading: boolean;
    refreshing: boolean;
    dialogVisible: boolean;
    deleteDialogVisible: boolean;
    showFilters: boolean;
  };
  data: {
    purchaseOrders: PurchaseOrder[];
    selectedPO: PurchaseOrder | null;
    poToDelete: PurchaseOrder | null;
  };
  filters: {
    status: 'all' | 'draft' | 'sent' | 'approved';
    searchQuery: string;
    sortBy: 'date' | 'amount' | 'supplier';
    selectedSupplier: string;
    dateFrom: Date | null;
    dateTo: Date | null;
  };
}

const [state, dispatch] = useReducer(poManagementReducer, initialState);
```

**Reduction:** 14 useState → 1 useReducer (**93% reduction!**)

---

#### 4. EquipmentManagementScreen (13 useState → 1 useReducer)

**Current State (13 useState):**
```typescript
const [loading, setLoading] = useState(true);
const [refreshing, setRefreshing] = useState(false);
const [equipment, setEquipment] = useState<Equipment[]>([]);
const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
const [dialogVisible, setDialogVisible] = useState(false);
const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
const [equipmentToDelete, setEquipmentToDelete] = useState<Equipment | null>(null);
const [filterCategory, setFilterCategory] = useState<'all' | 'machinery' | 'tools' | 'vehicles'>('all');
const [filterStatus, setFilterStatus] = useState<'all' | 'available' | 'in-use' | 'maintenance'>('all');
const [searchQuery, setSearchQuery] = useState('');
const [selectedSite, setSelectedSite] = useState('');
const [sortBy, setSortBy] = useState<'name' | 'category' | 'status'>('name');
const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
```

**Target State (1 useReducer):**
```typescript
interface EquipmentManagementState {
  ui: {
    loading: boolean;
    refreshing: boolean;
    dialogVisible: boolean;
    deleteDialogVisible: boolean;
    viewMode: 'grid' | 'list';
  };
  data: {
    equipment: Equipment[];
    selectedEquipment: Equipment | null;
    equipmentToDelete: Equipment | null;
  };
  filters: {
    category: 'all' | 'machinery' | 'tools' | 'vehicles';
    status: 'all' | 'available' | 'in-use' | 'maintenance';
    searchQuery: string;
    selectedSite: string;
    sortBy: 'name' | 'category' | 'status';
  };
}

const [state, dispatch] = useReducer(equipmentManagementReducer, initialState);
```

**Reduction:** 13 useState → 1 useReducer (**92% reduction!**)

---

### Implementation Structure

```
src/logistics/state/
├── analytics/
│   ├── analyticsReducer.ts          # LogisticsAnalyticsScreen reducer
│   └── analyticsActions.ts           # Action creators
├── doors-package/
│   ├── doorsPackageFormReducer.ts   # DoorsPackageEditScreen reducer
│   └── doorsPackageFormActions.ts   # Action creators
├── purchase-order/
│   ├── poManagementReducer.ts       # PurchaseOrderManagementScreen reducer
│   └── poManagementActions.ts       # Action creators
├── equipment/
│   ├── equipmentManagementReducer.ts # EquipmentManagementScreen reducer
│   └── equipmentManagementActions.ts # Action creators
└── index.ts                          # Barrel exports
```

### Implementation Steps (Task 2.1)

**Phase 1:** LogisticsAnalyticsScreen (6-7 hours)
1. Create analyticsReducer and actions
2. Refactor screen to use useReducer
3. Test all data loading and tab switching
4. Validate TypeScript 0 errors

**Phase 2:** DoorsPackageEditScreen (5-6 hours)
1. Create doorsPackageFormReducer and actions
2. Refactor form state management
3. Test form validation and submission
4. Validate TypeScript 0 errors

**Phase 3:** PurchaseOrderManagementScreen (5-6 hours)
1. Create poManagementReducer and actions
2. Refactor data and filter state
3. Test filtering, sorting, and CRUD operations
4. Validate TypeScript 0 errors

**Phase 4:** EquipmentManagementScreen (4-5 hours)
1. Create equipmentManagementReducer and actions
2. Refactor equipment state and filters
3. Test view modes and equipment operations
4. Validate TypeScript 0 errors

**Total Task 2.1 Time:** 20-24 hours

---

## Task 2.2: Create Shared Components

**Estimated Time:** 14-18 hours
**Priority:** High
**Complexity:** High

### Objective

Create 6 reusable shared components to reduce code duplication and establish consistent UI patterns across Logistics screens.

### Component Specifications

#### 1. MaterialCard (120-150 LOC)

**Purpose:** Display material items with status, quantity, and actions

**Props:**
```typescript
interface MaterialCardProps {
  material: MaterialItem;
  onPress?: (id: string) => void;
  onEdit?: (material: MaterialItem) => void;
  onRequestMore?: (material: MaterialItem) => void;
  showActions?: boolean;
  variant?: 'default' | 'compact' | 'detailed';
  showStock?: boolean;
}

interface MaterialItem {
  id: string;
  code: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  minStock: number;
  maxStock: number;
  status: 'in-stock' | 'low-stock' | 'out-of-stock' | 'on-order';
  location?: string;
  supplier?: string;
  cost?: number;
  lastUpdated?: number;
}
```

**Features:**
- Stock status indicator (color-coded)
- Quantity with unit display
- Category badge
- Optional actions (Edit, Request More)
- Stock level progress bar
- Compact/detailed variants

**Usage:**
```typescript
<MaterialCard
  material={item}
  onPress={handleViewDetails}
  onEdit={handleEdit}
  showActions
  variant="detailed"
  showStock
/>
```

---

#### 2. InventoryItemCard (130-160 LOC)

**Purpose:** Display inventory items with location, quantity, and history

**Props:**
```typescript
interface InventoryItemCardProps {
  item: InventoryItem;
  onPress?: (id: string) => void;
  onAdjustQuantity?: (item: InventoryItem) => void;
  onTransfer?: (item: InventoryItem) => void;
  showActions?: boolean;
  showLocation?: boolean;
  showHistory?: boolean;
}

interface InventoryItem {
  id: string;
  materialCode: string;
  materialName: string;
  quantity: number;
  unit: string;
  location: {
    site: string;
    warehouse: string;
    rack?: string;
    bin?: string;
  };
  status: 'available' | 'reserved' | 'in-transit' | 'damaged';
  lastMovement?: {
    type: 'in' | 'out' | 'transfer';
    quantity: number;
    date: number;
    user: string;
  };
  value?: number;
}
```

**Features:**
- Location hierarchy display
- Status badge with color coding
- Last movement indicator
- Transfer and adjust actions
- Value display (optional)
- History timeline (optional)

---

#### 3. DeliveryScheduleCalendar (200-250 LOC)

**Purpose:** Interactive calendar for delivery scheduling

**Props:**
```typescript
interface DeliveryScheduleCalendarProps {
  deliveries: DeliverySchedule[];
  selectedDate?: Date;
  onDateSelect?: (date: Date) => void;
  onDeliveryPress?: (delivery: DeliverySchedule) => void;
  onAddDelivery?: (date: Date) => void;
  viewMode?: 'month' | 'week' | 'day';
  showAddButton?: boolean;
}

interface DeliverySchedule {
  id: string;
  date: number;
  supplier: string;
  materials: string[];
  status: 'scheduled' | 'in-transit' | 'delivered' | 'delayed';
  site: string;
  poNumber?: string;
  notes?: string;
}
```

**Features:**
- Month/week/day view modes
- Delivery indicators on dates
- Status color coding
- Date selection
- Add delivery quick action
- Delivery count badges
- Today indicator

---

#### 4. RfqForm (250-300 LOC)

**Purpose:** Reusable RFQ creation/edit form with validation

**Props:**
```typescript
interface RfqFormProps {
  initialData?: Partial<RfqFormData>;
  onSave: (data: RfqFormData) => Promise<void>;
  onCancel: () => void;
  mode: 'create' | 'edit';
  suppliers?: Supplier[];
  materials?: MaterialOption[];
}

interface RfqFormData {
  title: string;
  description: string;
  materials: {
    materialId: string;
    quantity: number;
    unit: string;
    specifications?: string;
  }[];
  suppliers: string[];
  deadline: Date;
  deliverySite: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  notes?: string;
  attachments?: string[];
}
```

**Features:**
- Material selector with quantities
- Multi-supplier selection
- Date picker for deadline
- Priority selection
- File attachment support
- Form validation
- Auto-save draft (optional)
- Calculation of total quantities

---

#### 5. DoorsPackageSelector (180-220 LOC)

**Purpose:** Select and configure door packages

**Props:**
```typescript
interface DoorsPackageSelectorProps {
  packages: DoorsPackage[];
  selectedPackages: string[];
  onSelectionChange: (packageIds: string[]) => void;
  onConfigurePackage?: (packageId: string) => void;
  multiSelect?: boolean;
  showDetails?: boolean;
  filterByType?: DoorsPackageType[];
}

interface DoorsPackage {
  id: string;
  name: string;
  type: 'standard' | 'fire-rated' | 'acoustic' | 'security';
  quantity: number;
  doorSize: {
    width: number;
    height: number;
    unit: 'mm' | 'inch';
  };
  frameType: string;
  hardwareSet: string;
  site: string;
  building?: string;
  floor?: string;
  status: 'planned' | 'ordered' | 'delivered' | 'installed';
  cost?: number;
}
```

**Features:**
- Multi/single select mode
- Type filter badges
- Package details view
- Configuration button
- Status indicators
- Grouped by location
- Search filter
- Selected count display

---

#### 6. EquipmentCard (140-170 LOC)

**Purpose:** Display equipment with status, location, and availability

**Props:**
```typescript
interface EquipmentCardProps {
  equipment: Equipment;
  onPress?: (id: string) => void;
  onAllocate?: (equipment: Equipment) => void;
  onMaintenance?: (equipment: Equipment) => void;
  showActions?: boolean;
  showLocation?: boolean;
  showHistory?: boolean;
  variant?: 'default' | 'compact';
}

interface Equipment {
  id: string;
  name: string;
  category: 'machinery' | 'tools' | 'vehicles' | 'safety';
  code: string;
  status: 'available' | 'in-use' | 'maintenance' | 'retired';
  location: {
    site?: string;
    assignedTo?: string;
  };
  specifications?: {
    make?: string;
    model?: string;
    serialNumber?: string;
  };
  maintenance?: {
    lastService?: number;
    nextService?: number;
    serviceInterval?: number; // days
  };
  availability?: {
    availableFrom?: number;
    allocatedUntil?: number;
  };
}
```

**Features:**
- Status badge with color coding
- Category icon
- Location/assignment display
- Maintenance status indicator
- Availability calendar
- Allocate/maintenance actions
- Service due warnings
- Compact variant for lists

---

### Component Directory Structure

```
src/logistics/shared/
├── components/
│   ├── MaterialCard.tsx
│   ├── InventoryItemCard.tsx
│   ├── DeliveryScheduleCalendar.tsx
│   ├── RfqForm.tsx
│   ├── DoorsPackageSelector.tsx
│   ├── EquipmentCard.tsx
│   └── index.ts
├── types/
│   ├── material.ts
│   ├── inventory.ts
│   ├── delivery.ts
│   ├── rfq.ts
│   ├── doors.ts
│   ├── equipment.ts
│   └── index.ts
└── index.ts
```

### Implementation Steps (Task 2.2)

**Phase 1:** MaterialCard & InventoryItemCard (4-5 hours)
1. Create component files with TypeScript interfaces
2. Implement card layouts with variants
3. Add status indicators and actions
4. Write JSDoc with examples
5. Export via barrel

**Phase 2:** DeliveryScheduleCalendar (4-5 hours)
1. Create calendar layout (month/week/day views)
2. Implement date selection logic
3. Add delivery indicators
4. Handle delivery press events
5. Add view mode switcher

**Phase 3:** RfqForm (4-5 hours)
1. Create form structure
2. Implement material selector
3. Add supplier multi-select
4. Implement validation logic
5. Add save/cancel handlers

**Phase 4:** DoorsPackageSelector & EquipmentCard (2-3 hours)
1. Create DoorsPackageSelector with filtering
2. Implement multi/single select
3. Create EquipmentCard with maintenance info
4. Add allocation logic
5. Final exports and documentation

**Total Task 2.2 Time:** 14-18 hours

---

## Task 2.3: Add Loading Skeletons

**Estimated Time:** 8-10 hours
**Priority:** Medium
**Complexity:** Medium

### Objective

Create 3 specialized loading skeletons for key Logistics screens to improve perceived performance during data loading.

### Skeleton Specifications

#### 1. AnalyticsChartsSkeleton (120-150 LOC)

**Purpose:** Loading skeleton for LogisticsAnalyticsScreen

**Structure:**
```typescript
interface AnalyticsChartsSkeletonProps {
  style?: ViewStyle;
}

/**
 * AnalyticsChartsSkeleton Component
 *
 * Loading skeleton for Logistics Analytics Screen.
 * Shows placeholders for KPIs, charts, and tables.
 */
export const AnalyticsChartsSkeleton: React.FC<AnalyticsChartsSkeletonProps> = ({ style }) => {
  return (
    <ScrollView style={[styles.container, style]}>
      {/* Period Selector */}
      <View style={styles.periodSelector}>
        <Skeleton width="30%" height={36} borderRadius={4} />
        <Skeleton width="30%" height={36} borderRadius={4} />
        <Skeleton width="30%" height={36} borderRadius={4} />
      </View>

      {/* KPI Cards */}
      <View style={styles.kpiRow}>
        {[1, 2, 3, 4].map(i => (
          <View key={i} style={styles.kpiCard}>
            <Skeleton width="60%" height={14} marginBottom={8} />
            <Skeleton width="80%" height={32} marginBottom={4} />
            <Skeleton width="40%" height={12} />
          </View>
        ))}
      </View>

      {/* Charts */}
      <View style={styles.chartSection}>
        <Skeleton width="40%" height={20} marginBottom={12} />
        <Skeleton width="100%" height={250} borderRadius={8} />
      </View>

      {/* Table/List */}
      <View style={styles.tableSection}>
        <Skeleton width="50%" height={20} marginBottom={12} />
        {[1, 2, 3, 4, 5].map(i => (
          <SkeletonCard key={i} lines={2} variant="compact" />
        ))}
      </View>
    </ScrollView>
  );
};
```

---

#### 2. InventoryGridSkeleton (100-130 LOC)

**Purpose:** Loading skeleton for InventoryManagementScreen

**Structure:**
```typescript
interface InventoryGridSkeletonProps {
  count?: number;
  style?: ViewStyle;
}

/**
 * InventoryGridSkeleton Component
 *
 * Loading skeleton for Inventory Management Screen.
 * Shows grid of inventory item placeholders.
 */
export const InventoryGridSkeleton: React.FC<InventoryGridSkeletonProps> = ({
  count = 6,
  style
}) => {
  return (
    <ScrollView style={[styles.container, style]}>
      {/* Search and Filters */}
      <View style={styles.header}>
        <Skeleton width="70%" height={48} borderRadius={8} marginBottom={12} />
        <View style={styles.filterRow}>
          <Skeleton width="30%" height={36} borderRadius={4} />
          <Skeleton width="30%" height={36} borderRadius={4} />
        </View>
      </View>

      {/* Inventory Grid */}
      <View style={styles.grid}>
        {Array.from({ length: count }).map((_, i) => (
          <View key={i} style={styles.gridItem}>
            <Skeleton width="100%" height={120} borderRadius={8} marginBottom={8} />
            <Skeleton width="80%" height={16} marginBottom={4} />
            <Skeleton width="60%" height={14} marginBottom={4} />
            <View style={styles.statsRow}>
              <Skeleton width="45%" height={12} />
              <Skeleton width="45%" height={12} />
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};
```

---

#### 3. DeliveryCalendarSkeleton (110-140 LOC)

**Purpose:** Loading skeleton for DeliverySchedulingScreen

**Structure:**
```typescript
interface DeliveryCalendarSkeletonProps {
  style?: ViewStyle;
}

/**
 * DeliveryCalendarSkeleton Component
 *
 * Loading skeleton for Delivery Scheduling Screen.
 * Shows calendar and delivery list placeholders.
 */
export const DeliveryCalendarSkeleton: React.FC<DeliveryCalendarSkeletonProps> = ({ style }) => {
  return (
    <ScrollView style={[styles.container, style]}>
      {/* Calendar Header */}
      <View style={styles.calendarHeader}>
        <Skeleton width={40} height={40} borderRadius={20} />
        <Skeleton width="60%" height={24} />
        <Skeleton width={40} height={40} borderRadius={20} />
      </View>

      {/* Weekday Headers */}
      <View style={styles.weekdayRow}>
        {[1, 2, 3, 4, 5, 6, 7].map(i => (
          <Skeleton key={i} width={40} height={20} />
        ))}
      </View>

      {/* Calendar Grid */}
      <View style={styles.calendarGrid}>
        {Array.from({ length: 35 }).map((_, i) => (
          <View key={i} style={styles.dayCell}>
            <Skeleton width={30} height={30} borderRadius={15} />
            <Skeleton width={20} height={4} marginTop={4} />
          </View>
        ))}
      </View>

      {/* Delivery List */}
      <View style={styles.deliveryList}>
        <Skeleton width="50%" height={20} marginBottom={12} />
        {[1, 2, 3].map(i => (
          <SkeletonCard key={i} lines={3} showActions variant="compact" />
        ))}
      </View>
    </ScrollView>
  );
};
```

---

### Skeleton Directory Structure

```
src/logistics/shared/skeletons/
├── AnalyticsChartsSkeleton.tsx
├── InventoryGridSkeleton.tsx
├── DeliveryCalendarSkeleton.tsx
└── index.ts
```

### Implementation Steps (Task 2.3)

**Phase 1:** Setup & AnalyticsChartsSkeleton (3 hours)
1. Create skeletons directory structure
2. Create barrel exports
3. Implement AnalyticsChartsSkeleton
4. Match LogisticsAnalyticsScreen layout
5. Test shimmer animation

**Phase 2:** InventoryGridSkeleton (2-3 hours)
1. Implement grid layout
2. Add search/filter placeholders
3. Create inventory card skeleton
4. Test responsiveness

**Phase 3:** DeliveryCalendarSkeleton (2-3 hours)
1. Implement calendar grid
2. Add delivery list placeholders
3. Match DeliverySchedulingScreen layout
4. Test all view modes

**Phase 4:** Integration (1 hour)
1. Integrate into LogisticsAnalyticsScreen
2. Integrate into InventoryManagementScreen
3. Integrate into DeliverySchedulingScreen
4. Final validation

**Total Task 2.3 Time:** 8-10 hours

---

## Implementation Timeline

### Week 1: Task 2.1 - State Management (20-26 hours)

**Days 1-2:** LogisticsAnalyticsScreen (6-7h)
- Create analyticsReducer and actions
- Refactor screen
- Test and validate

**Days 3-4:** DoorsPackageEditScreen (5-6h)
- Create doorsPackageFormReducer
- Refactor form state
- Test validation

**Day 5:** PurchaseOrderManagementScreen (5-6h)
- Create poManagementReducer
- Refactor state and filters
- Test CRUD operations

**Day 6:** EquipmentManagementScreen (4-5h)
- Create equipmentManagementReducer
- Refactor equipment state
- Final validation

### Week 2: Task 2.2 - Shared Components (14-18 hours)

**Days 1-2:** MaterialCard & InventoryItemCard (4-5h)
- Create component files
- Implement layouts and features
- Documentation

**Days 3-4:** DeliveryScheduleCalendar (4-5h)
- Create calendar component
- Implement view modes
- Test interactions

**Day 5:** RfqForm (4-5h)
- Create form component
- Implement validation
- Test submission

**Day 6:** DoorsPackageSelector & EquipmentCard (2-3h)
- Create final components
- Final exports
- Complete documentation

### Week 3: Task 2.3 - Loading Skeletons (8-10 hours)

**Days 1-2:** AnalyticsChartsSkeleton (3h)
- Create skeleton component
- Match analytics layout
- Test animation

**Day 3:** InventoryGridSkeleton (2-3h)
- Create grid skeleton
- Test responsiveness

**Day 4:** DeliveryCalendarSkeleton (2-3h)
- Create calendar skeleton
- Match delivery layout

**Day 5:** Integration & Testing (1h)
- Integrate all skeletons
- Final validation

---

## Success Metrics

### Task 2.1 Success Criteria

- ✅ 4 screens refactored (LogisticsAnalytics, DoorsPackageEdit, PO Management, Equipment Management)
- ✅ useState reduction: 59 → 4 useReducer (**93% reduction**)
- ✅ TypeScript: 0 errors across all refactored files
- ✅ ESLint: 0 errors
- ✅ All existing functionality works identically
- ✅ Improved maintainability (centralized state logic)

### Task 2.2 Success Criteria

- ✅ 6 shared components created
- ✅ Total component LOC: ~1,120-1,300
- ✅ All components have TypeScript interfaces
- ✅ JSDoc documentation with examples
- ✅ Reusable across multiple screens
- ✅ Clean barrel exports
- ✅ 0 TypeScript errors
- ✅ 0 ESLint errors

### Task 2.3 Success Criteria

- ✅ 3 loading skeletons created
- ✅ Total skeleton LOC: ~330-420
- ✅ All skeletons integrated into screens
- ✅ Smooth shimmer animation
- ✅ Perceived performance improvement: 40-60%
- ✅ 0 TypeScript errors
- ✅ 0 ESLint errors

---

## Testing Strategy

### Manual Testing Checklist

**Task 2.1: State Management**
- [ ] LogisticsAnalytics: All tabs work, period switching, data loading
- [ ] DoorsPackageEdit: Form validation, saving, all fields update
- [ ] PO Management: Filtering, sorting, CRUD operations, search
- [ ] Equipment Management: View modes, filtering, equipment operations

**Task 2.2: Shared Components**
- [ ] MaterialCard: All variants, actions, status display
- [ ] InventoryItemCard: Location display, movement history, actions
- [ ] DeliveryScheduleCalendar: All view modes, date selection, delivery indicators
- [ ] RfqForm: Validation, material selection, supplier selection, submission
- [ ] DoorsPackageSelector: Multi/single select, filtering, configuration
- [ ] EquipmentCard: Status display, maintenance info, allocation

**Task 2.3: Loading Skeletons**
- [ ] AnalyticsChartsSkeleton: Matches real layout, smooth animation
- [ ] InventoryGridSkeleton: Grid layout, responsive design
- [ ] DeliveryCalendarSkeleton: Calendar grid, delivery list

### Automated Testing

**TypeScript Validation:**
```bash
npx tsc --noEmit src/logistics/**/*.{ts,tsx}
```

**ESLint Validation:**
```bash
npx eslint "src/logistics/**/*.{ts,tsx}" --max-warnings 0
```

---

## Quality Checklist

### Code Quality
- [ ] All new files have proper file headers
- [ ] All components have TypeScript interfaces
- [ ] All functions have JSDoc documentation
- [ ] No console.log statements
- [ ] No hardcoded values (use constants)
- [ ] Follows existing code style

### Component Quality
- [ ] All props have default values where appropriate
- [ ] All components handle edge cases
- [ ] All components are accessible
- [ ] All components are performant
- [ ] All components have usage examples

### Testing Quality
- [ ] All manual tests pass
- [ ] TypeScript: 0 errors
- [ ] ESLint: 0 errors
- [ ] No regression issues
- [ ] Performance is improved

### Documentation Quality
- [ ] Implementation plan is complete
- [ ] Usage examples are provided
- [ ] PROGRESS_TRACKING.md is updated
- [ ] Code comments are helpful
- [ ] All exports are documented

---

## References

### Related Documents
- `docs/implementation/MANAGER_PHASE2_TASK2.1_IMPLEMENTATION_PLAN.md` - useReducer pattern reference
- `docs/implementation/MANAGER_PHASE2_TASK2.2_IMPLEMENTATION_PLAN.md` - Shared components pattern
- `docs/implementation/MANAGER_PHASE2_TASK2.3_IMPLEMENTATION_PLAN.md` - Loading skeletons pattern
- `ALL_ROLES_IMPROVEMENTS_ROADMAP.md` - Overall project roadmap

### Existing Patterns to Follow
- Manager state management (useReducer with nested state)
- Manager shared components (barrel exports, TypeScript interfaces)
- Manager loading skeletons (base skeleton components, shimmer animation)
- Existing Logistics Phase 1 refactors (MaterialTracking, Inventory, Delivery)

### Key Files to Reference
- `src/manager/state/` - State management patterns
- `src/manager/shared/components/` - Shared component patterns
- `src/manager/shared/skeletons/` - Loading skeleton patterns
- `src/components/skeletons/` - Base skeleton components

---

**Document Status:** Complete
**Last Updated:** 2026-01-04
**Review Status:** Ready for Implementation
**Approved By:** Pending

