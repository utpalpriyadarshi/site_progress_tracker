# Phase 3: Logistics Integration

**Status**: 🟡 IN PROGRESS
**Duration**: 2-3 days
**Dependencies**: Phase 1 & 2 must be complete

---

## Overview

Integrate BOM data with Logistics screens to provide real-time material requirements, delivery priorities, and inventory targets based on active BOMs.

## Objectives

1. Create shared data access hook for cross-role BOM visibility
2. Enhance Material Tracking to show BOM requirements vs actual
3. Link Delivery Scheduling to BOM priorities and phases
4. Update Inventory Management with BOM-based targets
5. Enable real-time updates across Manager and Logistics roles

---

## Implementation Steps

### Step 1: Create Shared BOM Hook
**File**: `src/shared/hooks/useBomData.ts`

Features:
- Read-only BOM access for Logistics role
- Get BOM requirements by material
- Get BOM phases and priorities
- Get material shortage alerts
- Subscribe to BOM updates

### Step 2: Create BOM Logistics Service
**File**: `src/services/BomLogisticsService.ts`

Features:
- Calculate material requirements from BOM
- Determine delivery priorities based on phases
- Calculate inventory targets
- Identify material shortages
- Generate procurement recommendations

### Step 3: Create BOM Requirement Card Component
**File**: `src/logistics/components/BomRequirementCard.tsx`

Features:
- Display BOM name and project
- Show required vs available quantities
- Color-coded status (sufficient/shortage/critical)
- Link to BOM details (read-only)
- Phase information

### Step 4: Enhance Material Tracking Screen
**File**: `src/logistics/MaterialTrackingScreen.tsx`

Enhancements:
- Show BOM requirements for each material
- Display shortage/surplus indicators
- Link materials to BOMs
- Show phase priorities
- Alert on critical shortages

### Step 5: Enhance Delivery Scheduling Screen
**File**: `src/logistics/DeliverySchedulingScreen.tsx`

Enhancements:
- BOM-driven delivery priorities
- Phase-based scheduling
- Critical material alerts
- Recommended delivery dates
- BOM completion percentage

### Step 6: Enhance Inventory Management Screen
**File**: `src/logistics/InventoryManagementScreen.tsx`

Enhancements:
- BOM-based reorder points
- Target quantities from BOM
- Multi-BOM allocation
- Utilization tracking
- Procurement planning

---

## Data Flow Architecture

```
BomContext (Manager Role)
    ↓
useBomData Hook (Shared)
    ↓
BomLogisticsService (Calculations)
    ↓
Logistics Screens (Material/Delivery/Inventory)
```

## Key Interfaces

```typescript
interface BomRequirement {
  bomId: string;
  bomName: string;
  materialId: string;
  requiredQuantity: number;
  availableQuantity: number;
  shortageQuantity: number;
  unit: string;
  phase: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  dueDate?: number;
}

interface MaterialShortage {
  materialId: string;
  materialName: string;
  totalRequired: number;
  totalAvailable: number;
  shortage: number;
  affectedBoms: string[];
  recommendedAction: string;
}
```

## Integration Points

### Material Tracking
- Show "Required by BOMs" section
- Display shortage alerts
- Link to related BOMs

### Delivery Scheduling
- Sort deliveries by BOM priority
- Show BOM phase deadlines
- Highlight critical materials

### Inventory Management
- Display BOM-based targets
- Show allocation across BOMs
- Calculate reorder quantities

---

## Success Criteria

- [ ] useBomData hook provides read-only BOM access
- [ ] Material Tracking shows BOM requirements
- [ ] Delivery Scheduling prioritizes by BOM phases
- [ ] Inventory Management shows BOM targets
- [ ] Real-time updates work across roles
- [ ] No performance degradation
- [ ] TypeScript errors: 0

---

## Testing Checklist

- [ ] Logistics can view BOM data (read-only)
- [ ] Material requirements calculate correctly
- [ ] Shortage alerts display properly
- [ ] Delivery priorities sort correctly
- [ ] Inventory targets match BOM
- [ ] Updates propagate in real-time
- [ ] Works offline with sync

---

## Files to Create

1. `src/shared/hooks/useBomData.ts` - Shared BOM data hook
2. `src/services/BomLogisticsService.ts` - Logistics calculations
3. `src/logistics/components/BomRequirementCard.tsx` - Requirement display

## Files to Modify

1. `src/logistics/MaterialTrackingScreen.tsx` - Add BOM requirements
2. `src/logistics/DeliverySchedulingScreen.tsx` - Add BOM priorities
3. `src/logistics/InventoryManagementScreen.tsx` - Add BOM targets
4. `src/manager/context/BomContext.tsx` - Enable cross-role access

---

**Started**: 2025-11-04
**Expected Completion**: 2025-11-06
