# Logistics Phase 3: Implementation Plan

**Project:** Site Progress Tracker
**Phase:** Phase 3 - Nice-to-Have Improvements
**Role:** Logistics
**Total Estimated Time:** 56-72 hours
**Created:** 2026-01-17
**Status:** Ready for Implementation
**Branch:** `logistics/phase3-implementation`

---

## Table of Contents

1. [Overview](#overview)
2. [Current State Analysis](#current-state-analysis)
3. [Task 3.1: Navigation Restructure & Dashboard Redesign](#task-31-navigation-restructure--dashboard-redesign)
4. [Task 3.2: Accessibility Features](#task-32-accessibility-features)
5. [Task 3.3: Enhanced Empty States](#task-33-enhanced-empty-states)
6. [Task 3.4: Search & Filter Performance](#task-34-search--filter-performance)
7. [Task 3.5: Offline Indicators](#task-35-offline-indicators)
8. [Implementation Timeline](#implementation-timeline)
9. [Testing Strategy](#testing-strategy)
10. [Quality Checklist](#quality-checklist)

---

## Overview

Logistics Phase 3 focuses on transforming the navigation structure into a hybrid drawer/tabs system, creating a widget-based dashboard, adding WCAG 2.1 AA accessibility compliance, implementing context-aware empty states, optimizing search/filter performance, and adding offline indicators for field operations.

### Why Logistics Phase 3 Now?

**Context:**
- ✅ Phase 1 Complete: Console logs removed (72), error boundaries added (14 screens), large files refactored
- ✅ Phase 2 Complete: useReducer state management, shared components, skeleton screens
- ✅ Manager Phase 3 Complete: Widget patterns and accessibility utilities established
- ✅ Planning Phase 3 & 4 Complete: Navigation restructure and context patterns proven
- ✅ Utilities available: `src/utils/accessibility/`, `src/utils/performance/`

**Phase 3 Goals:**
1. Add missing screens to navigation (Inventory, Delivery, Analytics, Equipment)
2. Transform navigation into hybrid tabs + drawer system
3. Create widget-based LogisticsDashboard with 7 widgets
4. Integrate with PlanningContext pattern for project selection
5. Achieve WCAG 2.1 AA accessibility compliance
6. Implement context-aware empty states
7. Optimize search and filter performance (debouncing, memoization)
8. Add offline indicators for field operations

---

## Current State Analysis

### Logistics Screens (14 total)

After Phase 1 & 2 completion:

| Screen | Current LOC | State Management | In Navigator | Status |
|--------|-------------|------------------|--------------|--------|
| LogisticsDashboardScreen | ~918 | ✅ useReducer | ✅ Tab | Phase 2 Complete |
| MaterialTrackingScreen | 456 | ✅ useReducer | ✅ Tab | Phase 2 Complete |
| InventoryManagementScreen | 228 | ✅ useReducer | ❌ Missing | Phase 1 Complete |
| DeliverySchedulingScreen | 209 | ✅ useReducer | ❌ Missing | Phase 1 Complete |
| LogisticsAnalyticsScreen | 524 | ✅ useReducer | ❌ Missing | Phase 1 Complete |
| EquipmentManagementScreen | ~1,070 | Local state | ❌ Missing | Phase 1 Complete |
| PurchaseOrderManagementScreen | ~626 | Local state | ✅ Tab | Phase 2 Complete |
| DoorsRegisterScreen | ~671 | Local state | ✅ Tab | Phase 2 Complete |
| DoorsDetailScreen | ~1,077 | Local state | ✅ Stack | Phase 2 Complete |
| DoorsPackageEditScreen | ~621 | Local state | ✅ Stack | Phase 2 Complete |
| DoorsRequirementEditScreen | ~472 | Local state | ✅ Stack | Phase 2 Complete |
| RfqListScreen | ~622 | Local state | ✅ Tab | Phase 2 Complete |
| RfqCreateScreen | ~747 | Local state | ✅ Stack | Phase 2 Complete |
| RfqDetailScreen | ~835 | Local state | ✅ Stack | Phase 2 Complete |

**Completed in Phase 1 & 2:**
- ✅ Console logs removed (72 → 0)
- ✅ Error boundaries added (14/14)
- ✅ Large files refactored (77.3% - 85.6% reduction)
- ✅ State management with useReducer (top 4 screens)
- ✅ Shared components created (MaterialCard, InventoryItemCard, etc.)
- ✅ Loading skeletons added (Analytics, Inventory, Delivery)
- ✅ LogisticsContext provider exists

**Phase 3 Focus:**
- 🎯 Add 4 missing screens to navigation (Inventory, Delivery, Analytics, Equipment)
- 🎯 Transform to hybrid tabs (5) + drawer (9) navigation
- 🎯 Create widget-based dashboard with 7 modular widgets
- 🎯 Integrate with PlanningContext pattern for project selection
- 🎯 Full accessibility compliance (WCAG 2.1 AA)
- 🎯 Enhanced empty states with context-aware messaging
- 🎯 Optimized search/filter performance (debouncing, memoization)
- 🎯 Offline indicators for field operations

**Current Navigation Structure:**
- 5 bottom tabs: Dashboard, Materials, PurchaseOrders, DoorsRegister, RfqList
- 5 stack screens: DoorsDetail, DoorsPackageEdit, DoorsRequirementEdit, RfqCreate, RfqDetail
- **Problem:** Missing screens (Inventory, Delivery, Analytics, Equipment), crowded tabs

**Target Navigation Structure:**
- 5 bottom tabs: Dashboard (new widget-based), Materials, Inventory, Deliveries, Analytics
- 9 drawer items: Equipment, Purchase Orders, DOORS Register, DOORS Detail, RFQ List, RFQ Create, RFQ Detail, Settings
- Stack screens for detail views

---

## Task 3.1: Navigation Restructure & Dashboard Redesign

**Estimated Time:** 22-28 hours
**Priority:** High
**Complexity:** High

### Objective

1. Transform the 5-tab navigation into a hybrid 5-tab + 9-drawer system
2. Add missing screens (Inventory, Delivery, Analytics, Equipment) to navigation
3. Create widget-based LogisticsDashboard following Manager/Planning patterns
4. Integrate LogisticsContext with PlanningContext pattern for project selection

### Implementation Plan

#### Phase 1: LogisticsContext Enhancement (3-4 hours)

**1.1 Update LogisticsContext to Follow PlanningContext Pattern**

**File:** `src/logistics/context/LogisticsContext.tsx` (modification)

```typescript
/**
 * LogisticsContext - Enhanced
 *
 * Global context for Logistics role screens.
 * Follows PlanningContext pattern for project/site selection.
 * Stores selected project, site, and logistics-specific data.
 */

import React, { createContext, useContext, useReducer, useEffect, ReactNode, useCallback } from 'react';
import { database } from '../../models/database';
import { Q } from '@nozbe/watermelondb';
import ProjectModel from '../../models/ProjectModel';
import SiteModel from '../../models/SiteModel';

// Types
interface LogisticsState {
  // Project/Site Selection (following PlanningContext pattern)
  selectedProjectId: string | null;
  selectedProject: ProjectModel | null;
  selectedSiteId: string | null;
  selectedSite: SiteModel | null;
  projects: ProjectModel[];
  sites: SiteModel[];

  // Logistics-specific data
  pendingDeliveries: number;
  lowStockItems: number;
  openPurchaseOrders: number;
  pendingRfqs: number;

  // UI State
  loading: boolean;
  error: string | null;
  isOffline: boolean;
}

type LogisticsAction =
  | { type: 'SET_PROJECT'; payload: string | null }
  | { type: 'SET_SITE'; payload: string | null }
  | { type: 'SET_PROJECTS'; payload: ProjectModel[] }
  | { type: 'SET_SITES'; payload: SiteModel[] }
  | { type: 'SET_LOGISTICS_STATS'; payload: Partial<LogisticsState> }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_OFFLINE'; payload: boolean }
  | { type: 'RESET' };

interface LogisticsContextValue extends LogisticsState {
  selectProject: (projectId: string | null) => void;
  selectSite: (siteId: string | null) => void;
  refreshProjects: () => Promise<void>;
  refreshSites: () => Promise<void>;
  refreshLogisticsStats: () => Promise<void>;
}

// Initial state
const initialState: LogisticsState = {
  selectedProjectId: null,
  selectedProject: null,
  selectedSiteId: null,
  selectedSite: null,
  projects: [],
  sites: [],
  pendingDeliveries: 0,
  lowStockItems: 0,
  openPurchaseOrders: 0,
  pendingRfqs: 0,
  loading: true,
  error: null,
  isOffline: false,
};

// Reducer
function logisticsReducer(state: LogisticsState, action: LogisticsAction): LogisticsState {
  switch (action.type) {
    case 'SET_PROJECT':
      return {
        ...state,
        selectedProjectId: action.payload,
        selectedProject: state.projects.find(p => p.id === action.payload) || null,
        selectedSiteId: null,
        selectedSite: null,
      };
    case 'SET_SITE':
      return {
        ...state,
        selectedSiteId: action.payload,
        selectedSite: state.sites.find(s => s.id === action.payload) || null,
      };
    case 'SET_PROJECTS':
      return { ...state, projects: action.payload };
    case 'SET_SITES':
      return { ...state, sites: action.payload };
    case 'SET_LOGISTICS_STATS':
      return { ...state, ...action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_OFFLINE':
      return { ...state, isOffline: action.payload };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

// Context and Provider implementation...
```

#### Phase 2: LogisticsDashboard Widget System (8-10 hours)

**2.1 Create Dashboard Structure**

**Files to Create:**
```
src/logistics/dashboard/
├── LogisticsDashboard.tsx              (~200 LOC) - Main dashboard with widget layout
├── dashboardReducer.ts                 (~80 LOC)  - State management
├── widgets/
│   ├── BaseWidget.tsx                  (~150 LOC) - Reuse pattern from Manager
│   ├── InventoryStatusWidget.tsx       (~180 LOC) - Stock levels, low stock alerts
│   ├── DeliveryStatusWidget.tsx        (~180 LOC) - Pending, in-transit, completed
│   ├── PurchaseOrderWidget.tsx         (~160 LOC) - Open POs, approval pending
│   ├── MaterialRequirementsWidget.tsx  (~180 LOC) - BOM requirements, shortages
│   ├── DoorsPackageWidget.tsx          (~160 LOC) - DOORS package status
│   ├── RfqStatusWidget.tsx             (~160 LOC) - RFQ counts by status
│   ├── RecentActivityWidget.tsx        (~150 LOC) - Last 10 logistics actions
│   └── index.ts                        (~20 LOC)  - Exports
├── hooks/
│   ├── useInventoryStatusData.ts       (~120 LOC) - Inventory metrics from DB
│   ├── useDeliveryStatusData.ts        (~120 LOC) - Delivery metrics
│   ├── usePurchaseOrderData.ts         (~100 LOC) - PO metrics
│   ├── useMaterialRequirementsData.ts  (~130 LOC) - Material requirements
│   ├── useDoorsPackageData.ts          (~100 LOC) - DOORS status
│   ├── useRfqStatusData.ts             (~100 LOC) - RFQ metrics
│   ├── useRecentActivityData.ts        (~100 LOC) - Activity log
│   └── index.ts                        (~20 LOC)  - Exports
└── index.ts                            (~10 LOC)  - Main export
```

**Total New Code:** ~2,160 LOC

**2.2 Widget Implementation Pattern**

Following Manager Phase 3 pattern:

```typescript
/**
 * InventoryStatusWidget
 *
 * Displays inventory status: total items, low stock alerts,
 * stock value, and category breakdown.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { BaseWidget } from './BaseWidget';
import { useInventoryStatusData } from '../hooks';
import { StatusBadge } from '../../shared/components';
import { useLogisticsContext } from '../../context';

export const InventoryStatusWidget: React.FC = () => {
  const theme = useTheme();
  const { selectedProjectId } = useLogisticsContext();
  const { data, loading, error, refresh } = useInventoryStatusData(selectedProjectId);

  return (
    <BaseWidget
      title="Inventory Status"
      icon="package-variant"
      loading={loading}
      error={error}
      onRefresh={refresh}
      accessibilityLabel={`Inventory status: ${data?.totalItems} items, ${data?.lowStockCount} low stock`}
    >
      <View style={styles.container}>
        {/* Total Items */}
        <View style={styles.metricRow}>
          <Text variant="labelMedium">Total Items</Text>
          <Text variant="headlineMedium" style={styles.value}>
            {data?.totalItems ?? 0}
          </Text>
        </View>

        {/* Stock Value */}
        <View style={styles.metricRow}>
          <Text variant="labelMedium">Total Stock Value</Text>
          <Text variant="titleMedium">${data?.totalValue?.toLocaleString() ?? 0}</Text>
        </View>

        {/* Status Badges - Using custom StatusBadge (NOT Chip) */}
        <View style={styles.statusRow}>
          <StatusBadge
            status="success"
            label={`${data?.inStockCount ?? 0} In Stock`}
          />
          <StatusBadge
            status="warning"
            label={`${data?.lowStockCount ?? 0} Low Stock`}
          />
          <StatusBadge
            status="error"
            label={`${data?.outOfStockCount ?? 0} Out of Stock`}
          />
        </View>
      </View>
    </BaseWidget>
  );
};
```

**2.3 Hook Implementation Pattern**

```typescript
/**
 * useInventoryStatusData Hook
 *
 * Fetches inventory metrics for the selected project.
 * Uses LogisticsContext for project filtering.
 */

import { useState, useEffect, useCallback } from 'react';
import { Q } from '@nozbe/watermelondb';
import { database } from '../../../../models/database';
import { useLogisticsContext } from '../../context';

interface InventoryStatusData {
  totalItems: number;
  totalValue: number;
  inStockCount: number;
  lowStockCount: number;
  outOfStockCount: number;
  categoryBreakdown: { category: string; count: number }[];
}

interface UseInventoryStatusResult {
  data: InventoryStatusData | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useInventoryStatusData(projectId: string | null): UseInventoryStatusResult {
  const [data, setData] = useState<InventoryStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!projectId) {
      setData(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Query materials for project
      const materialsCollection = database.collections.get('materials');
      const materials = await materialsCollection
        .query(Q.where('project_id', projectId))
        .fetch();

      // Calculate metrics
      const totalItems = materials.length;
      const totalValue = materials.reduce((sum, m) => sum + (m.quantity * m.unitCost), 0);
      const inStockCount = materials.filter(m => m.quantity > m.reorderLevel).length;
      const lowStockCount = materials.filter(m => m.quantity <= m.reorderLevel && m.quantity > 0).length;
      const outOfStockCount = materials.filter(m => m.quantity === 0).length;

      // Category breakdown
      const categoryMap = new Map<string, number>();
      materials.forEach(m => {
        const count = categoryMap.get(m.category) || 0;
        categoryMap.set(m.category, count + 1);
      });
      const categoryBreakdown = Array.from(categoryMap.entries())
        .map(([category, count]) => ({ category, count }));

      setData({
        totalItems,
        totalValue,
        inStockCount,
        lowStockCount,
        outOfStockCount,
        categoryBreakdown,
      });
    } catch (err) {
      setError('Failed to load inventory data');
      console.error('Error loading inventory data:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refresh: fetchData };
}
```

#### Phase 3: Navigation Restructure (6-8 hours)

**3.1 Create Hybrid Navigation**

**File:** `src/nav/LogisticsNavigator.tsx` (complete rewrite)

```typescript
import React, { memo, useCallback } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { InteractionManager, View, Text } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { LogisticsProvider, useLogisticsContext } from '../logistics/context';

// Screens
import { LogisticsDashboard } from '../logistics/dashboard';
import MaterialTrackingScreen from '../logistics/MaterialTrackingScreen';
import InventoryManagementScreen from '../logistics/InventoryManagementScreen';
import DeliverySchedulingScreen from '../logistics/DeliverySchedulingScreen';
import LogisticsAnalyticsScreen from '../logistics/LogisticsAnalyticsScreen';
import EquipmentManagementScreen from '../logistics/EquipmentManagementScreen';
import PurchaseOrderManagementScreen from '../logistics/PurchaseOrderManagementScreen';
import DoorsRegisterScreen from '../logistics/DoorsRegisterScreen';
import DoorsDetailScreen from '../logistics/DoorsDetailScreen';
import DoorsPackageEditScreen from '../logistics/DoorsPackageEditScreen';
import DoorsRequirementEditScreen from '../logistics/DoorsRequirementEditScreen';
import RfqListScreen from '../logistics/RfqListScreen';
import RfqCreateScreen from '../logistics/RfqCreateScreen';
import RfqDetailScreen from '../logistics/RfqDetailScreen';

const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();
const Stack = createNativeStackNavigator();

// Memoized Tab Navigator (5 main workflows)
const LogisticsTabs = memo(() => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        const icons: Record<string, string> = {
          Dashboard: 'view-dashboard',
          Materials: 'package-variant',
          Inventory: 'warehouse',
          Deliveries: 'truck-delivery',
          Analytics: 'chart-line',
        };
        return <Icon name={icons[route.name]} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#007AFF',
      tabBarInactiveTintColor: 'gray',
      headerShown: false,
      lazy: true, // Performance optimization
    })}
  >
    <Tab.Screen name="Dashboard" component={LogisticsDashboard} />
    <Tab.Screen name="Materials" component={MaterialTrackingScreen} />
    <Tab.Screen name="Inventory" component={InventoryManagementScreen} />
    <Tab.Screen name="Deliveries" component={DeliverySchedulingScreen} />
    <Tab.Screen name="Analytics" component={LogisticsAnalyticsScreen} />
  </Tab.Navigator>
));

// Custom Drawer Content (memoized)
const CustomDrawerContent = memo(({ navigation, state }) => {
  const { isOffline } = useLogisticsContext();

  const handleNavigation = useCallback((routeName: string) => {
    navigation.navigate(routeName);
    navigation.closeDrawer();
  }, [navigation]);

  return (
    <DrawerContentScrollView>
      {/* Offline Indicator */}
      {isOffline && (
        <View style={{ backgroundColor: '#FFC107', padding: 8 }}>
          <Text style={{ color: '#000', textAlign: 'center' }}>
            Offline Mode - Changes will sync when connected
          </Text>
        </View>
      )}

      <DrawerItem
        label="Equipment"
        icon={({ color, size }) => <Icon name="hammer-wrench" color={color} size={size} />}
        onPress={() => handleNavigation('Equipment')}
      />
      <DrawerItem
        label="Purchase Orders"
        icon={({ color, size }) => <Icon name="clipboard-list" color={color} size={size} />}
        onPress={() => handleNavigation('PurchaseOrders')}
      />
      <DrawerItem
        label="DOORS Register"
        icon={({ color, size }) => <Icon name="door" color={color} size={size} />}
        onPress={() => handleNavigation('DoorsRegister')}
      />
      <DrawerItem
        label="RFQ Management"
        icon={({ color, size }) => <Icon name="file-document-outline" color={color} size={size} />}
        onPress={() => handleNavigation('RfqList')}
      />
    </DrawerContentScrollView>
  );
});

// Drawer Navigator (wraps tabs + drawer items)
const LogisticsDrawer = memo(() => (
  <Drawer.Navigator
    screenOptions={{
      headerShown: true,
      headerStyle: { backgroundColor: '#007AFF' },
      headerTintColor: '#FFF',
      drawerType: 'front',
      swipeEdgeWidth: 50,
      lazy: true,
    }}
    drawerContent={(props) => <CustomDrawerContent {...props} />}
  >
    <Drawer.Screen
      name="MainTabs"
      component={LogisticsTabs}
      options={{ drawerLabel: 'Dashboard', title: 'Logistics' }}
    />
    <Drawer.Screen name="Equipment" component={EquipmentManagementScreen} />
    <Drawer.Screen name="PurchaseOrders" component={PurchaseOrderManagementScreen} />
    <Drawer.Screen name="DoorsRegister" component={DoorsRegisterScreen} />
    <Drawer.Screen name="RfqList" component={RfqListScreen} />
  </Drawer.Navigator>
));

// Main Stack Navigator (drawer + detail screens)
const LogisticsNavigator = ({ navigation: parentNavigation }) => {
  return (
    <LogisticsProvider>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={LogisticsDrawer} />
        <Stack.Screen name="DoorsDetail" component={DoorsDetailScreen} />
        <Stack.Screen name="DoorsPackageEdit" component={DoorsPackageEditScreen} />
        <Stack.Screen name="DoorsRequirementEdit" component={DoorsRequirementEditScreen} />
        <Stack.Screen name="RfqCreate" component={RfqCreateScreen} />
        <Stack.Screen name="RfqDetail" component={RfqDetailScreen} />
      </Stack.Navigator>
    </LogisticsProvider>
  );
};

export default LogisticsNavigator;
```

### Deliverables

**Files Created (~2,500 LOC):**
```
src/logistics/dashboard/
├── LogisticsDashboard.tsx
├── dashboardReducer.ts
├── widgets/
│   ├── BaseWidget.tsx
│   ├── InventoryStatusWidget.tsx
│   ├── DeliveryStatusWidget.tsx
│   ├── PurchaseOrderWidget.tsx
│   ├── MaterialRequirementsWidget.tsx
│   ├── DoorsPackageWidget.tsx
│   ├── RfqStatusWidget.tsx
│   ├── RecentActivityWidget.tsx
│   └── index.ts
├── hooks/
│   ├── useInventoryStatusData.ts
│   ├── useDeliveryStatusData.ts
│   ├── usePurchaseOrderData.ts
│   ├── useMaterialRequirementsData.ts
│   ├── useDoorsPackageData.ts
│   ├── useRfqStatusData.ts
│   ├── useRecentActivityData.ts
│   └── index.ts
└── index.ts
```

**Files Modified:**
- `src/logistics/context/LogisticsContext.tsx` - Enhanced with PlanningContext pattern
- `src/nav/LogisticsNavigator.tsx` - Complete rewrite with hybrid navigation

---

## Task 3.2: Accessibility Features

**Estimated Time:** 14-18 hours
**Priority:** High
**Complexity:** Medium

### Objective

Achieve WCAG 2.1 AA compliance across all 14 Logistics screens with focus on:
- Screen reader support for tables, charts, and data grids
- Keyboard navigation for all interactive elements
- Proper accessibility roles and labels
- Announcements for data changes

### Implementation Plan

#### Phase 1: Dashboard & Widget Accessibility (4-5 hours)

**1.1 Add Accessibility to All Widgets**

```typescript
import { useAccessibility } from '../../utils/accessibility';

const { announce } = useAccessibility();

// Announce data changes
useEffect(() => {
  if (!loading && data) {
    announce(`Inventory status loaded: ${data.totalItems} items, ${data.lowStockCount} low stock`);
  }
}, [loading, data]);

// Widget accessibility props
<BaseWidget
  accessible={true}
  accessibilityRole="button"
  accessibilityLabel={`Inventory Status Widget: ${data?.totalItems} total items, ${data?.lowStockCount} low stock alerts`}
  accessibilityHint="Double tap to view inventory details"
>
```

#### Phase 2: Complex Table Accessibility (5-6 hours)

**Screens with Data Tables:**
- InventoryManagementScreen - Inventory grid
- MaterialTrackingScreen - Material list
- DeliverySchedulingScreen - Delivery schedule table
- PurchaseOrderManagementScreen - PO list

**Table Accessibility Pattern:**

```typescript
<FlatList
  accessible={true}
  accessibilityRole="list"
  accessibilityLabel={`${items.length} inventory items`}
  data={items}
  renderItem={({ item, index }) => (
    <Pressable
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`Item ${index + 1}: ${item.name}, Quantity: ${item.quantity}, Status: ${item.status}`}
      accessibilityHint="Double tap to view details"
      onPress={() => handleItemPress(item)}
    >
      <InventoryItemCard item={item} />
    </Pressable>
  )}
/>
```

#### Phase 3: Chart & Analytics Accessibility (3-4 hours)

**LogisticsAnalyticsScreen Charts:**

```typescript
// Chart with accessibility
<View
  accessible={true}
  accessibilityRole="image"
  accessibilityLabel={`Bar chart showing delivery performance: ${onTimePercent}% on time, ${latePercent}% late`}
  accessibilityHint="Visual representation of delivery statistics"
>
  <BarChart data={deliveryData} />
</View>

// Provide text alternative for screen readers
<View accessibilityElementsHidden={true}>
  <BarChart data={deliveryData} />
</View>
<View style={styles.srOnly}>
  <Text>Delivery Performance: {onTimePercent}% on time, {latePercent}% late</Text>
</View>
```

#### Phase 4: Form & Filter Accessibility (2-3 hours)

**All filter bars and forms:**

```typescript
// Search field
<TextInput
  accessibilityLabel="Search inventory"
  accessibilityHint="Enter item name or code to filter results"
  value={searchQuery}
  onChangeText={setSearchQuery}
/>

// Filter dropdown
<Picker
  accessibilityLabel="Filter by category"
  accessibilityHint="Select a category to filter items"
  selectedValue={category}
  onValueChange={setCategory}
/>

// Announce filter results
useEffect(() => {
  if (debouncedSearch) {
    announce(`Found ${filteredItems.length} items matching "${debouncedSearch}"`);
  }
}, [filteredItems.length, debouncedSearch]);
```

### Deliverables

**Files Modified:**
- All 14 Logistics screens (accessibility props added)
- All widget components (accessibility support)
- All card components (accessibility labels)
- All table/list components (proper roles)

**Accessibility Checklist:**
- [ ] All interactive elements have accessibilityLabel
- [ ] All interactive elements have accessibilityRole
- [ ] Lists have proper list/listitem roles
- [ ] Charts have text alternatives
- [ ] Focus indicators visible
- [ ] Color contrast ≥4.5:1
- [ ] Touch targets ≥44x44 points
- [ ] Screen reader tested

---

## Task 3.3: Enhanced Empty States

**Estimated Time:** 8-10 hours
**Priority:** Medium
**Complexity:** Low-Medium

### Objective

Implement context-aware empty states with helpful messaging and action buttons for all list views and data screens.

### Empty State Scenarios

| Screen | Empty Condition | Message | Action |
|--------|-----------------|---------|--------|
| Dashboard | No project selected | "Select a project to view logistics" | Select Project |
| Dashboard | No data | "No logistics data yet" | - |
| Inventory | No items | "No inventory items yet" | Add Item |
| Inventory | No search results | "No items match your search" | Clear Search |
| Deliveries | No deliveries | "No deliveries scheduled" | Schedule Delivery |
| Deliveries | No pending | "All deliveries completed" | - |
| Materials | No materials | "No materials tracked" | Add Material |
| Materials | No BOM requirements | "No BOM requirements linked" | Link BOM |
| Analytics | No data | "Not enough data for analytics" | - |
| Equipment | No equipment | "No equipment registered" | Add Equipment |
| PurchaseOrders | No POs | "No purchase orders" | Create PO |
| DoorsRegister | No packages | "No DOORS packages" | Create Package |
| RfqList | No RFQs | "No RFQs created" | Create RFQ |

### Implementation Pattern

```typescript
import { EmptyState } from '../../components/common/EmptyState';

// In InventoryManagementScreen
const renderEmptyState = () => {
  const hasNoData = items.length === 0;
  const hasSearchQuery = state.filters.searchQuery.length > 0;
  const hasFilter = state.filters.category !== null;

  if (loading) return null;

  if (hasNoData && !hasSearchQuery && !hasFilter) {
    return (
      <EmptyState
        icon="package-variant"
        title="No Inventory Items"
        message="Start tracking inventory by adding your first item."
        helpText="Inventory items can be linked to BOM requirements and purchase orders."
        action={{
          label: "Add Item",
          onPress: () => dispatch({ type: 'OPEN_ADD_DIALOG' })
        }}
      />
    );
  }

  if (hasSearchQuery && filteredItems.length === 0) {
    return (
      <EmptyState
        icon="magnify"
        title="No Items Found"
        message={`No items match "${state.filters.searchQuery}"`}
        variant="search"
        action={{
          label: "Clear Search",
          onPress: () => dispatch({ type: 'SET_FILTER', payload: { searchQuery: '' } })
        }}
      />
    );
  }

  if (hasFilter && filteredItems.length === 0) {
    return (
      <EmptyState
        icon="filter-off"
        title={`No ${state.filters.category} Items`}
        message="Try selecting a different category or remove filters."
        action={{
          label: "Clear Filters",
          onPress: () => dispatch({ type: 'RESET_FILTERS' })
        }}
      />
    );
  }

  return null;
};
```

### Deliverables

**Files Modified:**
- LogisticsDashboard.tsx (7 widget empty states)
- InventoryManagementScreen.tsx (3 empty states: no data, no search, no filter)
- DeliverySchedulingScreen.tsx (3 empty states)
- MaterialTrackingScreen.tsx (3 empty states)
- LogisticsAnalyticsScreen.tsx (1 empty state)
- EquipmentManagementScreen.tsx (2 empty states)
- PurchaseOrderManagementScreen.tsx (2 empty states)
- DoorsRegisterScreen.tsx (2 empty states)
- RfqListScreen.tsx (2 empty states)

**Total Empty States:** ~25 contextual empty states

---

## Task 3.4: Search & Filter Performance

**Estimated Time:** 8-10 hours
**Priority:** Medium
**Complexity:** Low-Medium

### Objective

Optimize search and filter operations using debouncing, throttling, and memoization from existing performance utilities.

### Performance Targets

| Operation | Target | Technique |
|-----------|--------|-----------|
| Search keystroke lag | <20ms | Debouncing (300ms) |
| Filter switch | <10ms | Memoization |
| List render | <50ms | FlatList optimization |
| Inventory scroll | <16ms (60fps) | Virtualization |

### Implementation Plan

#### Phase 1: Debounced Search (3-4 hours)

**Screens to Update:**
- InventoryManagementScreen
- MaterialTrackingScreen
- DeliverySchedulingScreen
- PurchaseOrderManagementScreen
- RfqListScreen

```typescript
import { useDebounce } from '../../utils/performance';
import { useAccessibility } from '../../utils/accessibility';

const [searchQuery, setSearchQuery] = useState('');
const debouncedSearchQuery = useDebounce(searchQuery, 300);

// Filter only when debounced value changes
const filteredItems = useMemo(() => {
  if (!debouncedSearchQuery.trim()) return items;

  const query = debouncedSearchQuery.toLowerCase();
  return items.filter(item =>
    item.name.toLowerCase().includes(query) ||
    item.code?.toLowerCase().includes(query) ||
    item.category?.toLowerCase().includes(query)
  );
}, [items, debouncedSearchQuery]);

// Announce results
const { announce } = useAccessibility();
useEffect(() => {
  if (debouncedSearchQuery) {
    announce(`Found ${filteredItems.length} items matching "${debouncedSearchQuery}"`);
  }
}, [filteredItems.length, debouncedSearchQuery]);
```

#### Phase 2: Memoized Filters (2-3 hours)

```typescript
const [filters, setFilters] = useState({
  category: null,
  status: null,
  stockLevel: null,
});

const debouncedFilters = {
  ...filters,
  searchTerm: useDebounce(filters.searchTerm, 300)
};

// Memoized filter function
const filteredItems = useMemo(() => {
  let result = items;

  if (debouncedFilters.category) {
    result = result.filter(item => item.category === debouncedFilters.category);
  }

  if (debouncedFilters.status) {
    result = result.filter(item => item.status === debouncedFilters.status);
  }

  if (debouncedFilters.stockLevel) {
    result = result.filter(item => {
      if (debouncedFilters.stockLevel === 'low') return item.quantity <= item.reorderLevel;
      if (debouncedFilters.stockLevel === 'out') return item.quantity === 0;
      return item.quantity > item.reorderLevel;
    });
  }

  return result;
}, [items, debouncedFilters]);
```

#### Phase 3: FlatList Optimizations (3 hours)

```typescript
import { createKeyExtractor, createGetItemLayout, useStableCallback } from '../../utils/performance';

// Stable key extractor
const keyExtractor = useMemo(
  () => createKeyExtractor((item) => item.id),
  []
);

// Fixed height optimization (if items are uniform height)
const getItemLayout = useMemo(
  () => createGetItemLayout(88, 1), // item height, separator height
  []
);

// Stable render callback
const renderItem = useStableCallback(({ item }) => (
  <InventoryItemCard item={item} onPress={() => handlePress(item)} />
), [handlePress]);

// Optimized FlatList
<FlatList
  data={filteredItems}
  keyExtractor={keyExtractor}
  getItemLayout={getItemLayout}
  renderItem={renderItem}
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  windowSize={10}
  initialNumToRender={10}
  updateCellsBatchingPeriod={50}
/>
```

### Deliverables

**Files Modified:**
- InventoryManagementScreen.tsx (debounced search + memoized filters + FlatList)
- MaterialTrackingScreen.tsx (debounced search + FlatList)
- DeliverySchedulingScreen.tsx (debounced search + FlatList)
- PurchaseOrderManagementScreen.tsx (debounced search + FlatList)
- RfqListScreen.tsx (debounced search + FlatList)
- LogisticsAnalyticsScreen.tsx (memoized calculations)

---

## Task 3.5: Offline Indicators

**Estimated Time:** 4-6 hours
**Priority:** Medium
**Complexity:** Low

### Objective

Add clear offline indicators for field operations, showing sync status and pending changes.

### Implementation Plan

#### Phase 1: Network Status Hook (1-2 hours)

**File:** `src/logistics/hooks/useNetworkStatus.ts`

```typescript
import { useState, useEffect } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  connectionType: string;
}

export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>({
    isConnected: true,
    isInternetReachable: true,
    connectionType: 'unknown',
  });

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setStatus({
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable,
        connectionType: state.type,
      });
    });

    return () => unsubscribe();
  }, []);

  return status;
}
```

#### Phase 2: Offline Banner Component (1-2 hours)

**File:** `src/logistics/components/OfflineBanner.tsx`

```typescript
import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useLogisticsContext } from '../context';

interface OfflineBannerProps {
  pendingChanges?: number;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({ pendingChanges = 0 }) => {
  const { isOffline } = useLogisticsContext();

  if (!isOffline) return null;

  return (
    <View
      style={styles.banner}
      accessible={true}
      accessibilityRole="alert"
      accessibilityLabel={`You are offline. ${pendingChanges} changes pending sync.`}
    >
      <Icon name="cloud-off-outline" size={20} color="#000" />
      <Text style={styles.text}>
        Offline Mode - {pendingChanges > 0 ? `${pendingChanges} changes pending` : 'Changes will sync when connected'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#FFC107',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 8,
  },
  text: {
    color: '#000',
    fontSize: 14,
    fontWeight: '500',
  },
});
```

#### Phase 3: Sync Status Indicator (1-2 hours)

**File:** `src/logistics/components/SyncStatusIndicator.tsx`

```typescript
import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type SyncStatus = 'synced' | 'pending' | 'syncing' | 'error';

interface SyncStatusIndicatorProps {
  status: SyncStatus;
  lastSynced?: Date;
}

export const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({
  status,
  lastSynced,
}) => {
  const getIcon = () => {
    switch (status) {
      case 'synced': return 'cloud-check';
      case 'pending': return 'cloud-upload';
      case 'syncing': return null; // Use ActivityIndicator
      case 'error': return 'cloud-alert';
    }
  };

  const getColor = () => {
    switch (status) {
      case 'synced': return '#4CAF50';
      case 'pending': return '#FFC107';
      case 'syncing': return '#2196F3';
      case 'error': return '#F44336';
    }
  };

  return (
    <View
      style={styles.container}
      accessible={true}
      accessibilityLabel={`Sync status: ${status}${lastSynced ? `, last synced ${formatTime(lastSynced)}` : ''}`}
    >
      {status === 'syncing' ? (
        <ActivityIndicator size="small" color={getColor()} />
      ) : (
        <Icon name={getIcon()!} size={16} color={getColor()} />
      )}
      {lastSynced && status === 'synced' && (
        <Text style={styles.time}>{formatTime(lastSynced)}</Text>
      )}
    </View>
  );
};

const formatTime = (date: Date) => {
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
};
```

#### Phase 4: Integration (1 hour)

**Add to screens that support offline operations:**

```typescript
// In InventoryManagementScreen, DeliverySchedulingScreen, etc.
import { OfflineBanner } from '../components/OfflineBanner';
import { SyncStatusIndicator } from '../components/SyncStatusIndicator';

// At the top of the screen
<OfflineBanner pendingChanges={state.pendingChanges} />

// In the header
<View style={styles.header}>
  <Text style={styles.title}>Inventory</Text>
  <SyncStatusIndicator status={state.syncStatus} lastSynced={state.lastSynced} />
</View>
```

### Deliverables

**Files Created:**
- `src/logistics/hooks/useNetworkStatus.ts` (~40 LOC)
- `src/logistics/components/OfflineBanner.tsx` (~60 LOC)
- `src/logistics/components/SyncStatusIndicator.tsx` (~80 LOC)

**Files Modified:**
- `src/logistics/context/LogisticsContext.tsx` - Add isOffline state
- `src/nav/LogisticsNavigator.tsx` - Add OfflineBanner to drawer
- All major screens - Add SyncStatusIndicator

---

## Implementation Timeline

### 8-Week Breakdown (56-72 hours total)

**Week 1: Context & Dashboard Foundation (14-18h)**
```
Day 1-2 (6-8h): LogisticsContext Enhancement
- Update context with PlanningContext pattern
- Add project/site selection
- Add logistics stats

Day 3-5 (8-10h): Dashboard Structure + Base Widget
- Create LogisticsDashboard screen
- Create BaseWidget component
- Set up dashboard layout system
```

**Week 2: Dashboard Widgets (10-12h)**
```
Day 1-3 (6-8h): Create 7 Dashboard Widgets
- InventoryStatusWidget
- DeliveryStatusWidget
- PurchaseOrderWidget
- MaterialRequirementsWidget
- DoorsPackageWidget
- RfqStatusWidget
- RecentActivityWidget

Day 4-5 (4h): Widget Data Hooks
- Implement all useWidgetData hooks
- Connect to WatermelonDB
```

**Week 3: Navigation Restructure (6-8h)**
```
Day 1-2 (4-5h): Hybrid Navigation
- Restructure LogisticsNavigator
- Add tabs + drawer hybrid
- Add missing screens to navigation

Day 3 (2-3h): Navigation Testing
- Test all navigation paths
- Fix deep linking
- Verify drawer gestures
```

**Week 4: Accessibility (14-18h)**
```
Day 1-2 (6-8h): Dashboard & Widget Accessibility
- Add accessibility props to all widgets
- Add screen reader announcements
- Test with TalkBack/VoiceOver

Day 3-4 (4-5h): Table & List Accessibility
- Add roles to FlatLists
- Add labels to list items
- Test keyboard navigation

Day 5 (4-5h): Chart & Form Accessibility
- Add text alternatives for charts
- Add form field labels
- Test full screen reader flow
```

**Week 5: Empty States & Performance (8-10h)**
```
Day 1-2 (4-5h): Enhanced Empty States
- Add empty states to all screens
- Context-aware messaging
- Action buttons

Day 3-4 (4-5h): Performance Optimization
- Debounced search (5 screens)
- Memoized filters
- FlatList optimizations
```

**Week 6: Offline Indicators (4-6h)**
```
Day 1 (2h): Network Status Hook
- Create useNetworkStatus
- Integrate with context

Day 2 (2h): Offline Components
- Create OfflineBanner
- Create SyncStatusIndicator

Day 3 (2h): Integration
- Add to navigator
- Add to key screens
```

**Week 7: Testing & Bug Fixes (6-8h)**
```
Day 1-3: Manual Testing
- Test all Phase 3 features
- Regression testing (Phase 1 & 2)
- Accessibility audit

Day 4-5: Bug Fixes
- Fix issues found
- Performance tuning
```

**Week 8: Documentation & PR (4h)**
```
Day 1-2: Documentation
- Update PROGRESS_TRACKING.md
- Create test document
- Update README if needed

Day 3: PR Preparation
- Create comprehensive PR
- Add screenshots
- Final review
```

---

## Testing Strategy

### Manual Testing Checklist

#### Navigation Testing
- [ ] Dashboard tab loads with all 7 widgets
- [ ] Materials tab shows material tracking
- [ ] Inventory tab shows inventory management
- [ ] Deliveries tab shows delivery scheduling
- [ ] Analytics tab shows logistics analytics
- [ ] Drawer opens/closes smoothly
- [ ] Equipment screen accessible from drawer
- [ ] Purchase Orders screen accessible from drawer
- [ ] DOORS Register accessible from drawer
- [ ] RFQ List accessible from drawer
- [ ] Stack screens (details) navigate correctly
- [ ] Back button behavior correct

#### Dashboard Widget Testing
- [ ] All 7 widgets display correctly
- [ ] Widgets show loading states
- [ ] Widgets handle errors gracefully
- [ ] Refresh functionality works
- [ ] Data updates reflect changes
- [ ] Tap navigation works on widgets

#### Accessibility Testing
- [ ] Screen reader announces all widgets
- [ ] All interactive elements have labels
- [ ] Tables have proper roles
- [ ] Charts have text alternatives
- [ ] Focus order is logical
- [ ] Color contrast meets WCAG AA

#### Empty State Testing
- [ ] Empty states show on all screens with no data
- [ ] Action buttons navigate correctly
- [ ] Messages are contextually appropriate
- [ ] Search empty states work correctly

#### Performance Testing
- [ ] Search debounce works (no lag)
- [ ] Large lists render smoothly (60fps)
- [ ] No unnecessary re-renders
- [ ] Filter switching is instant

#### Offline Testing
- [ ] Offline banner shows when disconnected
- [ ] Pending changes count is accurate
- [ ] Sync status indicator updates correctly
- [ ] Data persists in offline mode

---

## Quality Checklist

### Code Quality
- [ ] TypeScript errors: 0
- [ ] ESLint warnings: 0
- [ ] All hooks have proper dependencies
- [ ] Memoization applied where needed
- [ ] Error handling in all async operations

### Architecture
- [ ] Context follows PlanningContext pattern
- [ ] Widgets follow BaseWidget pattern
- [ ] Database queries are efficient
- [ ] Navigation is properly structured

### User Experience
- [ ] Loading indicators shown during fetch
- [ ] Error messages are user-friendly
- [ ] Empty states shown when appropriate
- [ ] Offline mode clearly indicated
- [ ] Animations smooth (60fps)

### Accessibility
- [ ] All widgets have accessibilityLabel
- [ ] Interactive elements have accessibilityRole
- [ ] Screen reader announcements work
- [ ] Keyboard navigation functional
- [ ] Color contrast ≥4.5:1

### Documentation
- [ ] Implementation plan complete ✅
- [ ] Testing document created
- [ ] PROGRESS_TRACKING.md updated
- [ ] README updated if needed

---

## Dependencies & Risks

### External Dependencies

**Already Installed:**
- `@react-native-community/netinfo` - Network status monitoring
- `@react-navigation/drawer` - Drawer navigation
- `react-native-vector-icons` - Icons

**No New Dependencies Required**

### Technical Risks

1. **Dashboard Widget Performance**
   - **Risk:** 7 widgets loading simultaneously may cause lag
   - **Mitigation:** Stagger loads, use skeleton screens, React.memo

2. **Navigation Restructure**
   - **Risk:** Breaking existing navigation patterns
   - **Mitigation:** Thorough testing, gradual migration

3. **Context Integration**
   - **Risk:** Context re-renders causing performance issues
   - **Mitigation:** Split context if needed, use useMemo/useCallback

4. **Offline Data Sync**
   - **Risk:** Data conflicts when coming back online
   - **Mitigation:** Use existing sync_status field, conflict resolution

---

## References

- **Manager Phase 3:** `docs/implementation/MANAGER_PHASE3_IMPLEMENTATION_PLAN.md` (widget patterns)
- **Planning Phase 3:** `docs/implementation/PLANNING_PHASE3_IMPLEMENTATION_PLAN.md` (navigation patterns)
- **Planning Phase 4:** `docs/implementation/PLANNING_PHASE4_IMPLEMENTATION_PLAN.md` (context patterns)
- **Accessibility Utils:** `src/utils/accessibility/`
- **Performance Utils:** `src/utils/performance/`
- **Existing LogisticsContext:** `src/logistics/context/LogisticsContext.tsx`

---

**End of Logistics Phase 3 Implementation Plan**

*Ready for implementation. This plan follows established patterns from Manager and Planning Phase 3, with Logistics-specific enhancements for field operations and offline support.*
