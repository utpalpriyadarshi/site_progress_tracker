# Activity 4: Logistics Role Completion

**Phase:** Phase 1 - Critical Path
**Activity Duration:** 10 weeks (50 working days)
**Priority:** 🔴 CRITICAL - Production Blocker
**Prerequisites:** Activity 1 (Security) complete, Activity 2 (Sync) recommended
**Depends On:** Security implementation, Database infrastructure
**Blocks:** Logistics user adoption (25% of target users)

---

## 📋 Overview

### Current State (Gap Analysis Reference: Lines 99-111, 172-190)

**Critical Problem:**
- ❌ **All 4 screens are empty stubs** (0% functional)
- ❌ Missing database models: `equipment`, `deliveries`, `inventory`
- ❌ **Materials table exists but has NO screen integration** (orphaned!)
- ❌ MaterialTrackingScreen: 0% functional - Complete rewrite needed
- ❌ EquipmentManagementScreen: 0% functional - No equipment model
- ❌ DeliverySchedulingScreen: 0% functional - No delivery model
- ❌ InventoryManagementScreen: 0% functional - No inventory model
- ❌ Logistics Role Completion: **0%** (0 of 4 screens functional)

**Impact:** 25% of target users (logistics team) cannot use the app

### Target State

**After Activity 4 Completion:**
- ✅ MaterialTrackingScreen: 100% functional - Track materials per item, request workflow
- ✅ EquipmentManagementScreen: 100% functional - Equipment allocation, maintenance tracking
- ✅ DeliverySchedulingScreen: 100% functional - Vendor coordination, delivery tracking
- ✅ InventoryManagementScreen: 100% functional - Stock levels, alerts, procurement
- ✅ Materials table fully integrated (no longer orphaned)
- ✅ Logistics Role Completion: **100%** (4 of 4 screens functional)

---

## 🎯 Objectives

1. **Database Models Creation (1 week)**
   - Create `EquipmentModel` (equipment types, specs, availability)
   - Create `DeliveryModel` (scheduled deliveries, vendors, tracking)
   - Create `InventoryModel` (stock levels, locations, alerts)
   - Enhance existing `MaterialModel` (add request workflow)
   - Create supporting models (vendors, warehouses, transfers)

2. **MaterialTrackingScreen (2 weeks)**
   - Track materials per construction item
   - Material request workflow (request → approve → deliver)
   - Material consumption tracking (planned vs actual)
   - Integration with existing `materials` table
   - Material usage reports

3. **EquipmentManagementScreen (2 weeks)**
   - Equipment catalog (types, specs, availability)
   - Equipment allocation to sites/items
   - Maintenance scheduling and tracking
   - Equipment utilization metrics
   - Equipment location tracking

4. **DeliverySchedulingScreen (2 weeks)**
   - Schedule deliveries from vendors
   - Vendor management (contact info, performance)
   - Delivery tracking (scheduled → in-transit → delivered)
   - Delivery receipt and verification
   - Integration with materials and inventory

5. **InventoryManagementScreen (2 weeks)**
   - Multi-warehouse inventory tracking
   - Stock level monitoring (current, minimum, maximum)
   - Low stock alerts and notifications
   - Procurement requests (auto-generated based on thresholds)
   - Inventory transfers between warehouses
   - Inventory reports (stock value, turnover)

6. **Testing & Polish (1 week)**
   - Unit tests, integration tests, E2E tests
   - Documentation and user guide
   - Final UX polish

---

## 📊 Gap Analysis Alignment

**Reference:** `PROJECT_GAP_ANALYSIS_AND_ROADMAP.md` Section "3. Logistics Role Incomplete" (Lines 172-190)

**Gap Analysis Estimates:**
- Effort: 8-10 weeks ✅
- Tasks identified: 5 tasks ✅
- Priority: CRITICAL ✅

**This Activity Addresses:**
- Database models (1 week) → Week 1
- MaterialTrackingScreen (2 weeks) → Week 2-3
- EquipmentManagementScreen (2 weeks) → Week 4-5
- DeliverySchedulingScreen (2 weeks) → Week 6-7
- InventoryManagementScreen (2 weeks) → Week 8-9
- Testing & polish (1 week) → Week 10

---

## 🗓️ Week-by-Week Implementation Plan

### **Week 1: Database Models Creation**

#### Days 1-3: Core Logistics Models
**Tasks:**
- [ ] Create `EquipmentModel.ts`
- [ ] Create `DeliveryModel.ts`
- [ ] Create `InventoryModel.ts`
- [ ] Create `VendorModel.ts`
- [ ] Create `WarehouseModel.ts`
- [ ] Update schema to v23
- [ ] Create migrations

**Database Schema:**

**equipment table:**
```typescript
equipment {
  id: string (primary key)
  name: string
  type: string (Excavator, Crane, Mixer, Generator, etc.)
  model: string
  serial_number: string
  purchase_date: number
  purchase_cost: number
  daily_rental_rate: number
  status: string (available, in-use, maintenance, retired)
  location: string (warehouse or site name)
  last_maintenance_date: number (nullable)
  next_maintenance_date: number (nullable)
  created_at: number
  updated_at: number
}
```

**deliveries table:**
```typescript
deliveries {
  id: string (primary key)
  vendor_id: string (foreign key → vendors)
  site_id: string (foreign key → sites)
  delivery_date: number
  scheduled_time: string (e.g., "09:00-11:00")
  status: string (scheduled, in-transit, delivered, cancelled)
  tracking_number: string (nullable)
  notes: string (nullable)
  received_by: string (nullable, foreign key → users)
  received_at: number (nullable)
  created_at: number
  updated_at: number
}
```

**inventory table:**
```typescript
inventory {
  id: string (primary key)
  material_id: string (foreign key → materials)
  warehouse_id: string (foreign key → warehouses)
  quantity: number
  unit: string (m³, kg, pieces, etc.)
  minimum_stock: number
  maximum_stock: number
  unit_cost: number
  last_updated: number
  created_at: number
  updated_at: number
}
```

**vendors table:**
```typescript
vendors {
  id: string (primary key)
  name: string
  contact_person: string
  phone: string
  email: string
  address: string
  rating: number (1-5 stars)
  payment_terms: string (NET30, COD, etc.)
  is_active: boolean
  created_at: number
  updated_at: number
}
```

**warehouses table:**
```typescript
warehouses {
  id: string (primary key)
  name: string
  address: string
  manager_id: string (foreign key → users)
  capacity: number (square meters or cubic meters)
  is_active: boolean
  created_at: number
  updated_at: number
}
```

**Deliverables:**
- Models: `models/EquipmentModel.ts`, `models/DeliveryModel.ts`, `models/InventoryModel.ts`, `models/VendorModel.ts`, `models/WarehouseModel.ts`
- Migration: `migrations/v23_add_logistics_core_tables.ts`

**Acceptance Criteria:**
- All 5 models created
- Migrations run without errors
- Foreign keys work correctly
- Models follow WatermelonDB conventions

---

#### Days 4-5: Supporting Models & Material Enhancements
**Tasks:**
- [ ] Create `EquipmentAllocationModel.ts` (equipment-site assignment)
- [ ] Create `MaintenanceRecordModel.ts` (equipment maintenance history)
- [ ] Create `DeliveryItemModel.ts` (line items in delivery)
- [ ] Create `InventoryTransferModel.ts` (warehouse transfers)
- [ ] Create `MaterialRequestModel.ts` (material request workflow)
- [ ] Enhance existing `MaterialModel` (add request status)
- [ ] Update schema to v24
- [ ] Create migrations
- [ ] Seed test data for all tables

**Additional Schema:**

**equipment_allocations table:**
```typescript
equipment_allocations {
  id: string (primary key)
  equipment_id: string (foreign key → equipment)
  site_id: string (foreign key → sites)
  wbs_item_id: string (nullable, foreign key → wbs_items)
  allocated_by: string (foreign key → users)
  start_date: number
  end_date: number
  status: string (active, completed, cancelled)
  created_at: number
  updated_at: number
}
```

**maintenance_records table:**
```typescript
maintenance_records {
  id: string (primary key)
  equipment_id: string (foreign key → equipment)
  maintenance_type: string (routine, repair, inspection)
  description: string
  cost: number
  performed_by: string
  performed_at: number
  next_maintenance_due: number (nullable)
  created_at: number
  updated_at: number
}
```

**delivery_items table:**
```typescript
delivery_items {
  id: string (primary key)
  delivery_id: string (foreign key → deliveries)
  material_id: string (foreign key → materials)
  quantity_ordered: number
  quantity_received: number (nullable)
  unit: string
  unit_price: number
  notes: string (nullable)
  created_at: number
  updated_at: number
}
```

**inventory_transfers table:**
```typescript
inventory_transfers {
  id: string (primary key)
  material_id: string (foreign key → materials)
  from_warehouse_id: string (foreign key → warehouses)
  to_warehouse_id: string (foreign key → warehouses)
  quantity: number
  unit: string
  requested_by: string (foreign key → users)
  approved_by: string (nullable, foreign key → users)
  status: string (pending, approved, in-transit, completed, rejected)
  transfer_date: number (nullable)
  created_at: number
  updated_at: number
}
```

**material_requests table:**
```typescript
material_requests {
  id: string (primary key)
  item_id: string (foreign key → items)
  material_id: string (foreign key → materials)
  requested_by: string (foreign key → users)
  quantity: number
  unit: string
  required_date: number
  status: string (pending, approved, ordered, delivered, rejected)
  approved_by: string (nullable, foreign key → users)
  notes: string (nullable)
  created_at: number
  updated_at: number
}
```

**materials table (enhanced):**
```sql
-- Add new columns to existing materials table
ALTER TABLE materials ADD COLUMN request_status string;
ALTER TABLE materials ADD COLUMN requested_by string;
ALTER TABLE materials ADD COLUMN approved_by string;
```

**Deliverables:**
- 5 additional models
- Enhanced MaterialModel
- Migration: `migrations/v24_add_logistics_supporting_tables.ts`
- Seed script: `services/db/SeedLogisticsData.ts`

**Acceptance Criteria:**
- All supporting models created
- MaterialModel enhanced with request workflow
- Migrations run without errors
- Test data seeded (10 equipment, 5 vendors, 3 warehouses, 20 inventory items)

---

### **Week 2-3: MaterialTrackingScreen**

#### Week 2, Days 6-8: Material Tracking UI (Part 1)
**Tasks:**
- [ ] Create screen: `src/logistics/MaterialTrackingScreen.tsx`
- [ ] Add site/item selector
- [ ] Display material list per item (from existing `materials` table)
- [ ] Add material creation dialog
- [ ] Add material editing dialog
- [ ] Show planned vs actual quantities
- [ ] Test material CRUD

**UI Components:**
```
MaterialTrackingScreen
├── Site Selector
├── Item Selector (filtered by site)
├── Material Summary Card
│   ├── Total Materials Count
│   ├── Total Planned Quantity
│   └── Total Actual Quantity
├── Material List (FlatList)
│   └── MaterialCard
│       ├── Material Name
│       ├── Type Badge
│       ├── Planned Quantity
│       ├── Actual Quantity
│       ├── Unit
│       ├── Progress Bar (actual/planned)
│       ├── Edit Button
│       └── Delete Button
└── Add Material FAB
```

**Material Card Visual:**
```
┌────────────────────────────────────┐
│ Concrete (Type: Structural)        │
│ Planned: 50 m³  Actual: 35 m³      │
│ ▓▓▓▓▓▓▓░░░ 70%                     │
│ [Edit] [Delete]                    │
└────────────────────────────────────┘
```

**Deliverables:**
- Screen: `src/logistics/MaterialTrackingScreen.tsx`
- Component: `src/logistics/components/MaterialCard.tsx`
- Dialog: `src/logistics/components/MaterialFormDialog.tsx`
- Service: `services/logistics/MaterialTrackingService.ts`

**Acceptance Criteria:**
- Material list displays for selected item
- Create material works
- Edit material works
- Delete material works
- Progress bar shows actual/planned ratio
- Empty state when no materials

---

#### Week 2, Days 9-10: Material Request Workflow
**Tasks:**
- [ ] Create material request dialog
- [ ] Implement request approval workflow
- [ ] Add request status tracking (pending, approved, ordered, delivered)
- [ ] Add request history per item
- [ ] Test request workflow

**UI Components:**
```
MaterialCard (Expanded)
├── Material Info
├── Request Status Badge
│   └── (Pending, Approved, Ordered, Delivered)
├── Request Button (if not requested)
└── Request History
    └── RequestChip
        ├── Requested By
        ├── Quantity
        ├── Status
        └── Date
```

**Request Dialog:**
```
MaterialRequestDialog
├── Material (read-only)
├── Quantity Input
├── Unit (read-only)
├── Required Date Picker
├── Notes Input (optional)
├── Submit Request Button
└── Cancel Button
```

**Request Workflow:**
```
1. Supervisor creates material request
2. Request status: pending
3. Logistics approves/rejects request
4. If approved: status → approved
5. Logistics orders from vendor: status → ordered
6. Delivery arrives: status → delivered
7. Update material.actual_quantity
```

**Deliverables:**
- Dialog: `src/logistics/components/MaterialRequestDialog.tsx`
- Service: `services/logistics/MaterialRequestService.ts`

**Acceptance Criteria:**
- Request creation works
- Request approval/rejection works
- Status updates correctly through workflow
- History displays all requests for material

---

#### Week 3, Days 11-13: Material Consumption Tracking
**Tasks:**
- [ ] Add consumption logging (update actual quantity)
- [ ] Create consumption history dialog
- [ ] Add consumption analytics (usage rate, variance)
- [ ] Add low stock alerts
- [ ] Test consumption tracking

**UI Components:**
```
MaterialCard (Add Consumption)
├── Current Stock: 35 m³
├── Log Consumption Button
└── ConsumptionHistoryDialog
    └── Consumption Log
        ├── Date
        ├── Quantity Used
        ├── Logged By
        └── Notes
```

**Consumption Dialog:**
```
LogConsumptionDialog
├── Material (read-only)
├── Current Stock (read-only)
├── Quantity Used Input
├── Unit (read-only)
├── Date Picker
├── Notes Input (optional)
├── Log Button
└── Cancel Button
```

**Consumption Analytics:**
```typescript
Total Consumed = SUM(consumption_logs.quantity)
Remaining = Planned - Total Consumed
Usage Rate = Total Consumed / Days Elapsed
Projected Total = Usage Rate * Total Project Days
Variance = Projected Total - Planned

Low Stock Alert:
  If Remaining < 10% of Planned: Show warning
```

**Deliverables:**
- Dialog: `src/logistics/components/LogConsumptionDialog.tsx`
- Dialog: `src/logistics/components/ConsumptionHistoryDialog.tsx`
- Service: `services/logistics/ConsumptionTrackingService.ts`

**Acceptance Criteria:**
- Consumption logging works
- Actual quantity updates correctly
- Consumption history displays
- Analytics calculated correctly
- Low stock alerts shown

---

#### Week 3, Days 14-15: Material Reports
**Tasks:**
- [ ] Create material usage report (by item, site, project)
- [ ] Add export to CSV (optional)
- [ ] Add variance report (planned vs actual)
- [ ] Add cost report (material costs)
- [ ] Test reporting

**Material Reports UI:**
```
MaterialTrackingScreen (Add Report Tab)
├── Report Type Selector
│   ├── Usage Report
│   ├── Variance Report
│   └── Cost Report
├── Filters
│   ├── Date Range
│   ├── Site
│   └── Material Type
└── Report Table
    └── Rows by material
        ├── Material Name
        ├── Planned
        ├── Actual
        ├── Variance
        └── Cost
```

**Deliverables:**
- Component: `src/logistics/components/MaterialReportTable.tsx`
- Service: `services/logistics/MaterialReportService.ts`

**Acceptance Criteria:**
- Usage report displays correctly
- Variance report shows planned vs actual
- Cost report calculates total costs
- Filters work correctly
- Export to CSV works (optional)

---

### **Week 4-5: EquipmentManagementScreen**

#### Week 4, Days 16-18: Equipment Catalog
**Tasks:**
- [ ] Create screen: `src/logistics/EquipmentManagementScreen.tsx`
- [ ] Display equipment list (all equipment)
- [ ] Add equipment creation dialog
- [ ] Add equipment editing dialog
- [ ] Add equipment filtering (by type, status)
- [ ] Add equipment deletion
- [ ] Test equipment CRUD

**UI Components:**
```
EquipmentManagementScreen
├── Filter Bar
│   ├── Type Filter (Excavator, Crane, etc.)
│   └── Status Filter (Available, In-Use, Maintenance)
├── Equipment List (FlatList)
│   └── EquipmentCard
│       ├── Equipment Name
│       ├── Type Badge
│       ├── Model & Serial Number
│       ├── Status Badge
│       ├── Location
│       ├── Daily Rental Rate
│       ├── Edit Button
│       └── Allocate Button
└── Add Equipment FAB
```

**Equipment Form:**
```
EquipmentFormDialog
├── Name Input
├── Type Selector
├── Model Input
├── Serial Number Input
├── Purchase Date Picker
├── Purchase Cost Input
├── Daily Rental Rate Input
├── Status Selector
├── Save Button
└── Cancel Button
```

**Deliverables:**
- Screen: `src/logistics/EquipmentManagementScreen.tsx`
- Component: `src/logistics/components/EquipmentCard.tsx`
- Dialog: `src/logistics/components/EquipmentFormDialog.tsx`
- Service: `services/logistics/EquipmentService.ts`

**Acceptance Criteria:**
- Equipment list displays correctly
- Create equipment works
- Edit equipment works
- Delete equipment works
- Filters work (type, status)
- Empty state when no equipment

---

#### Week 4, Days 19-20: Equipment Allocation
**Tasks:**
- [ ] Create allocation dialog
- [ ] Add site/item selector for allocation
- [ ] Add date range picker (start/end)
- [ ] Implement allocation tracking
- [ ] Add de-allocation action
- [ ] Test allocation workflow

**UI Components:**
```
EquipmentCard (Expanded)
├── Equipment Info
├── Current Allocation
│   └── (Site, Dates, Status)
├── Allocate Button
└── AllocationDialog
    ├── Equipment (read-only)
    ├── Site Selector
    ├── WBS Item Selector (optional)
    ├── Start Date Picker
    ├── End Date Picker
    ├── Notes Input
    ├── Allocate Button
    └── Cancel Button
```

**Allocation Workflow:**
```
1. User clicks "Allocate" on available equipment
2. Selects site and date range
3. System creates equipment_allocation record
4. Equipment status → in-use
5. Equipment location → site name
6. On end date or manual de-allocation:
   - Equipment status → available
   - Equipment location → warehouse
```

**Deliverables:**
- Dialog: `src/logistics/components/EquipmentAllocationDialog.tsx`
- Service: `services/logistics/EquipmentAllocationService.ts`

**Acceptance Criteria:**
- Allocation creation works
- Equipment status updates on allocation
- Equipment location updates on allocation
- De-allocation works
- Allocation history displayed

---

#### Week 5, Days 21-23: Maintenance Scheduling
**Tasks:**
- [ ] Add maintenance scheduling dialog
- [ ] Track maintenance history
- [ ] Add maintenance reminders (next maintenance due)
- [ ] Calculate equipment downtime
- [ ] Test maintenance tracking

**UI Components:**
```
EquipmentCard (Add Maintenance Tab)
├── Maintenance Status
│   ├── Last Maintenance Date
│   ├── Next Maintenance Due
│   └── Status Badge (Due Soon, Overdue)
├── Schedule Maintenance Button
└── MaintenanceHistoryDialog
    └── Maintenance Records
        ├── Date
        ├── Type (Routine, Repair)
        ├── Description
        ├── Cost
        └── Performed By
```

**Maintenance Scheduling Dialog:**
```
ScheduleMaintenanceDialog
├── Equipment (read-only)
├── Maintenance Type Selector
├── Description Input
├── Cost Input
├── Performed By Input
├── Date Picker
├── Next Maintenance Due Date Picker
├── Schedule Button
└── Cancel Button
```

**Maintenance Reminders:**
```typescript
// Show badge on EquipmentCard if:
if (next_maintenance_due - today < 7 days) {
  badge = "Due Soon" (yellow)
}
if (next_maintenance_due < today) {
  badge = "Overdue" (red)
}
```

**Deliverables:**
- Dialog: `src/logistics/components/ScheduleMaintenanceDialog.tsx`
- Dialog: `src/logistics/components/MaintenanceHistoryDialog.tsx`
- Service: `services/logistics/MaintenanceService.ts`

**Acceptance Criteria:**
- Maintenance scheduling works
- Maintenance history displays
- Next maintenance due calculated correctly
- Reminders shown for due/overdue maintenance
- Equipment status updated during maintenance

---

#### Week 5, Days 24-25: Equipment Utilization
**Tasks:**
- [ ] Calculate utilization metrics
- [ ] Add utilization dashboard
- [ ] Add cost tracking (total rental cost)
- [ ] Add availability calendar (optional)
- [ ] Test utilization calculations

**Utilization Metrics:**
```typescript
Total Days = today - purchase_date (days)
In-Use Days = SUM(allocation duration) for all allocations
Utilization % = (In-Use Days / Total Days) * 100

Total Rental Revenue = SUM(daily_rental_rate * allocation_days)
Maintenance Downtime = SUM(maintenance_duration)
```

**Utilization Dashboard:**
```
EquipmentManagementScreen (Add Dashboard Tab)
├── Summary Cards
│   ├── Total Equipment
│   ├── Available Equipment
│   ├── In-Use Equipment
│   └── Maintenance Equipment
├── Utilization Chart
│   └── Bar chart by equipment type
└── Top Equipment List
    └── Sorted by utilization %
```

**Deliverables:**
- Component: `src/logistics/components/EquipmentUtilizationDashboard.tsx`
- Service: `services/logistics/EquipmentUtilizationService.ts`

**Acceptance Criteria:**
- Utilization metrics calculated correctly
- Dashboard displays summary cards
- Chart displays utilization by type
- Top equipment list sorted correctly

---

### **Week 6-7: DeliverySchedulingScreen**

#### Week 6, Days 26-28: Vendor Management
**Tasks:**
- [ ] Create screen: `src/logistics/DeliverySchedulingScreen.tsx`
- [ ] Add vendor management tab
- [ ] Display vendor list
- [ ] Add vendor creation dialog
- [ ] Add vendor editing dialog
- [ ] Add vendor rating system
- [ ] Test vendor CRUD

**UI Components:**
```
DeliverySchedulingScreen
├── Tab Navigation
│   ├── Deliveries Tab
│   └── Vendors Tab
└── Vendors Tab Content
    ├── Vendor List (FlatList)
    │   └── VendorCard
    │       ├── Vendor Name
    │       ├── Contact Person
    │       ├── Phone & Email
    │       ├── Rating (stars)
    │       ├── Payment Terms
    │       ├── Edit Button
    │       └── Schedule Delivery Button
    └── Add Vendor FAB
```

**Vendor Form:**
```
VendorFormDialog
├── Name Input
├── Contact Person Input
├── Phone Input
├── Email Input
├── Address Input
├── Rating Selector (1-5 stars)
├── Payment Terms Input
├── Save Button
└── Cancel Button
```

**Deliverables:**
- Screen: `src/logistics/DeliverySchedulingScreen.tsx`
- Component: `src/logistics/components/VendorCard.tsx`
- Dialog: `src/logistics/components/VendorFormDialog.tsx`
- Service: `services/logistics/VendorService.ts`

**Acceptance Criteria:**
- Vendor list displays correctly
- Create vendor works
- Edit vendor works
- Delete vendor works
- Rating system works
- Empty state when no vendors

---

#### Week 6, Days 29-30: Delivery Scheduling
**tasks:**
- [ ] Add delivery list (Deliveries tab)
- [ ] Create delivery scheduling dialog
- [ ] Add delivery status tracking (scheduled, in-transit, delivered)
- [ ] Add delivery editing
- [ ] Test delivery scheduling

**UI Components:**
```
Deliveries Tab Content
├── Status Filter
│   └── (All, Scheduled, In-Transit, Delivered)
├── Delivery List (FlatList)
│   └── DeliveryCard
│       ├── Vendor Name
│       ├── Site Name
│       ├── Delivery Date & Time
│       ├── Status Badge
│       ├── Tracking Number
│       ├── Edit Button
│       └── Mark Delivered Button
└── Schedule Delivery FAB
```

**Delivery Scheduling Dialog:**
```
ScheduleDeliveryDialog
├── Vendor Selector
├── Site Selector
├── Delivery Date Picker
├── Scheduled Time Input (e.g., "09:00-11:00")
├── Tracking Number Input (optional)
├── Notes Input
├── Schedule Button
└── Cancel Button
```

**Delivery Status Workflow:**
```
1. Created: status = scheduled
2. Vendor dispatches: status = in-transit (manual update)
3. Arrives at site: status = delivered (manual update)
4. Receive delivery → create delivery items → update inventory
```

**Deliverables:**
- Component: `src/logistics/components/DeliveryCard.tsx`
- Dialog: `src/logistics/components/ScheduleDeliveryDialog.tsx`
- Service: `services/logistics/DeliveryService.ts`

**Acceptance Criteria:**
- Delivery list displays correctly
- Schedule delivery works
- Edit delivery works
- Status updates work (scheduled → in-transit → delivered)
- Filters work correctly

---

#### Week 7, Days 31-33: Delivery Receipt & Integration
**Tasks:**
- [ ] Create delivery receipt dialog
- [ ] Add delivery item management (line items)
- [ ] Integrate with inventory (auto-update stock on receipt)
- [ ] Integrate with material requests (link delivery to request)
- [ ] Test delivery receipt workflow

**UI Components:**
```
DeliveryCard (Expanded)
├── Delivery Info
├── Delivery Items
│   └── DeliveryItemChip
│       ├── Material Name
│       ├── Quantity Ordered
│       ├── Quantity Received
│       └── Unit Price
├── Receive Delivery Button
└── ReceiveDeliveryDialog
    ├── Delivery Info (read-only)
    ├── Item List (editable quantities received)
    │   └── For each item:
    │       ├── Material
    │       ├── Ordered Quantity
    │       └── Received Quantity Input
    ├── Received By (auto-filled: current user)
    ├── Notes Input
    ├── Confirm Receipt Button
    └── Cancel Button
```

**Delivery Receipt Workflow:**
```
1. Delivery arrives at site
2. User opens delivery and clicks "Receive Delivery"
3. User verifies quantities received vs ordered
4. User confirms receipt
5. System:
   a. Updates delivery.status → delivered
   b. Updates delivery.received_by → current user
   c. Updates delivery.received_at → now
   d. For each delivery item:
      - Update inventory.quantity += quantity_received
   e. If linked to material request:
      - Update material_request.status → delivered
      - Update materials.actual_quantity += quantity_received
```

**Deliverables:**
- Dialog: `src/logistics/components/ReceiveDeliveryDialog.tsx`
- Service: `services/logistics/DeliveryReceiptService.ts`

**Acceptance Criteria:**
- Delivery receipt dialog displays correctly
- Quantity verification works
- Inventory updates on receipt
- Material requests updated on receipt
- Receipt cannot be confirmed twice

---

#### Week 7, Days 34-35: Delivery Reports & Analytics
**Tasks:**
- [ ] Create delivery performance report (on-time %, vendor rating)
- [ ] Add delivery calendar view (optional)
- [ ] Add vendor performance analytics
- [ ] Test reporting

**Delivery Analytics:**
```typescript
Total Deliveries = COUNT(deliveries)
On-Time Deliveries = COUNT(deliveries WHERE delivered_at <= delivery_date)
On-Time % = (On-Time Deliveries / Total Deliveries) * 100

Per Vendor:
  Total Deliveries
  On-Time Deliveries
  On-Time %
  Average Rating
```

**Vendor Performance Dashboard:**
```
DeliverySchedulingScreen (Add Analytics Tab)
├── Summary Cards
│   ├── Total Deliveries
│   ├── On-Time %
│   └── In-Transit Count
├── Vendor Performance Table
│   └── For each vendor:
│       ├── Vendor Name
│       ├── Total Deliveries
│       ├── On-Time %
│       └── Rating
└── Delivery Calendar (optional)
    └── Calendar view with delivery markers
```

**Deliverables:**
- Component: `src/logistics/components/VendorPerformanceDashboard.tsx`
- Service: `services/logistics/DeliveryAnalyticsService.ts`

**Acceptance Criteria:**
- Performance metrics calculated correctly
- Vendor performance table displays
- On-time % accurate
- Calendar view displays (if implemented)

---

### **Week 8-9: InventoryManagementScreen**

#### Week 8, Days 36-38: Multi-Warehouse Inventory
**Tasks:**
- [ ] Create screen: `src/logistics/InventoryManagementScreen.tsx`
- [ ] Add warehouse management
- [ ] Display inventory by warehouse
- [ ] Add warehouse creation/editing
- [ ] Add inventory item creation
- [ ] Test warehouse and inventory CRUD

**UI Components:**
```
InventoryManagementScreen
├── Warehouse Selector (dropdown)
├── Warehouse Summary Card
│   ├── Total Items
│   ├── Total Stock Value
│   └── Low Stock Count
├── Inventory List (FlatList)
│   └── InventoryItemCard
│       ├── Material Name
│       ├── Current Stock
│       ├── Min/Max Stock
│       ├── Stock Level Indicator
│       ├── Unit Cost
│       ├── Total Value
│       ├── Edit Button
│       └── Transfer Button
└── Add Inventory Item FAB
```

**Stock Level Indicator:**
```typescript
if (current_stock < minimum_stock) {
  color = red (critical)
  badge = "Low Stock"
} else if (current_stock > maximum_stock) {
  color = orange (overstocked)
  badge = "Overstocked"
} else {
  color = green (optimal)
  badge = "Optimal"
}
```

**Deliverables:**
- Screen: `src/logistics/InventoryManagementScreen.tsx`
- Component: `src/logistics/components/InventoryItemCard.tsx`
- Dialog: `src/logistics/components/InventoryItemFormDialog.tsx`
- Component: `src/logistics/components/WarehouseFormDialog.tsx`
- Service: `services/logistics/InventoryService.ts`
- Service: `services/logistics/WarehouseService.ts`

**Acceptance Criteria:**
- Warehouse list displays
- Create/edit warehouse works
- Inventory list displays by warehouse
- Create/edit inventory item works
- Stock level indicator shows correct status
- Total stock value calculated correctly

---

#### Week 8, Days 39-40: Low Stock Alerts & Procurement
**Tasks:**
- [ ] Add low stock alerts dashboard
- [ ] Create procurement request workflow
- [ ] Auto-generate procurement requests based on thresholds
- [ ] Add procurement approval workflow
- [ ] Test alerts and procurement

**UI Components:**
```
InventoryManagementScreen (Add Alerts Tab)
├── Low Stock Alert List
│   └── AlertCard
│       ├── Material Name
│       ├── Warehouse
│       ├── Current Stock (red)
│       ├── Minimum Stock
│       ├── Shortage Quantity
│       ├── Reorder Button
│       └── Dismiss Button
└── ProcurementRequestDialog
    ├── Material (auto-filled from alert)
    ├── Warehouse (auto-filled)
    ├── Quantity Input (suggested: max - current)
    ├── Vendor Selector
    ├── Required Date Picker
    ├── Justification Input
    ├── Submit Request Button
    └── Cancel Button
```

**Auto-Procurement Logic:**
```typescript
// Daily job:
FOR each inventory_item:
  IF current_stock < minimum_stock:
    IF no pending procurement request exists:
      suggested_quantity = maximum_stock - current_stock
      CREATE procurement_request (status: pending)
      CREATE alert
```

**Deliverables:**
- Component: `src/logistics/components/LowStockAlertCard.tsx`
- Dialog: `src/logistics/components/ProcurementRequestDialog.tsx`
- Service: `services/logistics/ProcurementService.ts`

**Acceptance Criteria:**
- Low stock alerts generated correctly
- Auto-procurement creates requests when needed
- Manual procurement request works
- Procurement approval workflow functional
- Dismissed alerts don't reappear

---

#### Week 9, Days 41-43: Inventory Transfers
**Tasks:**
- [ ] Create inventory transfer dialog
- [ ] Add transfer approval workflow
- [ ] Track transfer status (pending, approved, in-transit, completed)
- [ ] Update inventory on transfer completion
- [ ] Test transfer workflow

**UI Components:**
```
InventoryItemCard (Add Transfer Button)
└── TransferInventoryDialog
    ├── Material (read-only)
    ├── From Warehouse (current)
    ├── To Warehouse Selector
    ├── Quantity Input
    ├── Unit (read-only)
    ├── Justification Input
    ├── Request Transfer Button
    └── Cancel Button
```

**Transfer Workflow:**
```
1. User requests transfer from Warehouse A to Warehouse B
2. Transfer status: pending
3. Logistics approves: status → approved
4. During transport: status → in-transit
5. On arrival: status → completed
6. System updates:
   - Warehouse A inventory -= quantity
   - Warehouse B inventory += quantity
```

**Deliverables:**
- Dialog: `src/logistics/components/TransferInventoryDialog.tsx`
- Service: `services/logistics/InventoryTransferService.ts`

**Acceptance Criteria:**
- Transfer request creation works
- Transfer approval works
- Status updates correctly
- Inventory updated on completion (both warehouses)
- Transfer cannot be completed twice

---

#### Week 9, Days 44-45: Inventory Reports
**Tasks:**
- [ ] Create inventory value report
- [ ] Add turnover report (items moving fast vs slow)
- [ ] Add stock level report
- [ ] Add export to CSV (optional)
- [ ] Test reporting

**Inventory Reports:**

**1. Stock Value Report:**
```
Total Stock Value = SUM(quantity * unit_cost) for all inventory items

By Warehouse:
  Warehouse A: $X
  Warehouse B: $Y
```

**2. Turnover Report:**
```typescript
// For each material:
Total Consumed (last 30 days) = SUM(consumption_logs.quantity)
Turnover Rate = Total Consumed / Average Stock
Status:
  - Fast Moving: Turnover Rate > 2
  - Normal: Turnover Rate 0.5-2
  - Slow Moving: Turnover Rate < 0.5
```

**3. Stock Level Report:**
```
By Status:
  - Critical (current < min): X items
  - Low (current < min * 1.5): Y items
  - Optimal: Z items
  - Overstocked (current > max): W items
```

**Deliverables:**
- Component: `src/logistics/components/InventoryReportTable.tsx`
- Service: `services/logistics/InventoryReportService.ts`

**Acceptance Criteria:**
- Stock value report calculates correctly
- Turnover report identifies fast/slow movers
- Stock level report groups by status
- Export to CSV works (optional)

---

### **Week 10: Testing & Polish**

#### Days 46-48: Comprehensive Testing
**Tasks:**
- [ ] Write unit tests for all Logistics services
- [ ] Write integration tests for all 4 screens
- [ ] Write E2E tests for critical flows
- [ ] Test with large datasets
- [ ] Performance testing
- [ ] Test sync integration (if Activity 2 complete)

**Test Suites:**

**1. MaterialTrackingScreen Tests**
```typescript
✓ Display material list per item
✓ Create material
✓ Edit material
✓ Delete material
✓ Create material request
✓ Approve material request
✓ Log consumption
✓ Calculate variance correctly
✓ Show low stock alerts
```

**2. EquipmentManagementScreen Tests**
```typescript
✓ Display equipment list
✓ Create equipment
✓ Edit equipment
✓ Allocate equipment to site
✓ De-allocate equipment
✓ Schedule maintenance
✓ Track maintenance history
✓ Calculate utilization correctly
```

**3. DeliverySchedulingScreen Tests**
```typescript
✓ Display vendor list
✓ Create vendor
✓ Schedule delivery
✓ Update delivery status
✓ Receive delivery
✓ Update inventory on receipt
✓ Calculate on-time percentage
✓ Vendor performance metrics
```

**4. InventoryManagementScreen Tests**
```typescript
✓ Display inventory by warehouse
✓ Create inventory item
✓ Edit inventory item
✓ Generate low stock alerts
✓ Create procurement request
✓ Request inventory transfer
✓ Approve transfer
✓ Update inventory on transfer
✓ Calculate stock value correctly
✓ Calculate turnover rate correctly
```

**Deliverables:**
- Test suites in `__tests__/logistics/`
- Integration tests
- E2E tests

**Acceptance Criteria:**
- All unit tests passing (coverage > 80%)
- All integration tests passing
- All E2E tests passing
- Performance acceptable (load 1000 items < 3s)

---

#### Days 49-50: Documentation & Final Polish
**Tasks:**
- [ ] Write Logistics role user guide
- [ ] Document all new database models
- [ ] Update ARCHITECTURE_UNIFIED.md
- [ ] Create Logistics screen demo video/screenshots
- [ ] Final UX polish (animations, loading states)
- [ ] Final bug fixes

**Deliverables:**
- User guide: `docs/user-guides/LOGISTICS_ROLE_GUIDE.md`
- Model docs: `docs/database/LOGISTICS_ROLE_MODELS.md`
- Updated: `ARCHITECTURE_UNIFIED.md`
- Demo assets: `docs/screenshots/logistics/`

**Acceptance Criteria:**
- User guide complete
- All models documented
- Architecture docs updated
- Demo video/screenshots created
- All animations smooth
- All loading states implemented
- No critical bugs

---

## 🧪 Testing Strategy

### Unit Tests
**Target Coverage: 80%+**

**Files to Test:**
- `services/logistics/MaterialTrackingService.ts`
- `services/logistics/MaterialRequestService.ts`
- `services/logistics/ConsumptionTrackingService.ts`
- `services/logistics/EquipmentService.ts`
- `services/logistics/EquipmentAllocationService.ts`
- `services/logistics/MaintenanceService.ts`
- `services/logistics/VendorService.ts`
- `services/logistics/DeliveryService.ts`
- `services/logistics/InventoryService.ts`
- `services/logistics/InventoryTransferService.ts`
- `services/logistics/ProcurementService.ts`

---

### Integration Tests
**Complete User Flows**

**Test Scenarios:**
1. **Material Request → Delivery → Consumption Flow**
   - Create material request → Approve → Schedule delivery → Receive delivery → Log consumption
2. **Equipment Lifecycle Flow**
   - Create equipment → Allocate to site → Schedule maintenance → De-allocate → Reallocate
3. **Inventory Management Flow**
   - Create inventory → Low stock alert → Procurement request → Delivery → Stock updated
4. **Delivery Integration Flow**
   - Schedule delivery → Receive delivery → Inventory updated → Material request fulfilled

---

## 📦 Deliverables Checklist

### Code Deliverables
- [ ] `src/logistics/MaterialTrackingScreen.tsx`
- [ ] `src/logistics/EquipmentManagementScreen.tsx`
- [ ] `src/logistics/DeliverySchedulingScreen.tsx`
- [ ] `src/logistics/InventoryManagementScreen.tsx`
- [ ] 30+ new components in `src/logistics/components/`
- [ ] 15+ new services in `services/logistics/`

### Database Deliverables
- [ ] 14 new models (Equipment, Delivery, Inventory, Vendor, Warehouse, etc.)
- [ ] Enhanced MaterialModel
- [ ] Migrations: v23, v24
- [ ] Seed scripts for all new tables

### Documentation Deliverables
- [ ] User guide: `docs/user-guides/LOGISTICS_ROLE_GUIDE.md`
- [ ] Model docs: `docs/database/LOGISTICS_ROLE_MODELS.md`
- [ ] Updated: `ARCHITECTURE_UNIFIED.md`
- [ ] Demo assets

### Testing Deliverables
- [ ] Unit tests (80%+ coverage)
- [ ] Integration tests
- [ ] E2E tests

---

## 🚨 Risk Management

### Risk 1: Complexity of Inventory System
**Probability:** High
**Impact:** Medium
**Mitigation:**
- Start with simple single-warehouse inventory
- Add multi-warehouse later in week
- Extensive testing with various scenarios

**Contingency:**
- Simplify to single warehouse only for MVP
- Add multi-warehouse in Phase 2

---

### Risk 2: Delivery-Inventory Integration
**Probability:** Medium
**Impact:** Medium
**Mitigation:**
- Clear integration points defined
- Transaction-based updates (all-or-nothing)
- Extensive testing of receipt workflow

**Contingency:**
- Manual inventory update if auto-update fails
- Add reconciliation tool for discrepancies

---

### Risk 3: Performance with Large Inventory
**Probability:** Medium
**Impact:** Medium
**Mitigation:**
- Use FlatList virtualization
- Pagination for large lists
- Lazy loading for reports

**Contingency:**
- Add pagination
- Implement caching for frequently accessed data

---

## 🎯 Acceptance Criteria

### Activity 4 is complete when:

#### MaterialTrackingScreen
- [ ] Material CRUD operations functional
- [ ] Material request workflow functional
- [ ] Consumption tracking works
- [ ] Reports generated correctly

#### EquipmentManagementScreen
- [ ] Equipment CRUD operations functional
- [ ] Equipment allocation works
- [ ] Maintenance scheduling works
- [ ] Utilization metrics calculated correctly

#### DeliverySchedulingScreen
- [ ] Vendor management functional
- [ ] Delivery scheduling works
- [ ] Delivery receipt workflow functional
- [ ] Inventory integration works

#### InventoryManagementScreen
- [ ] Multi-warehouse inventory works
- [ ] Low stock alerts generated
- [ ] Procurement workflow functional
- [ ] Inventory transfers work
- [ ] Reports generated correctly

#### Testing
- [ ] Unit test coverage > 80%
- [ ] All integration tests passing
- [ ] All E2E tests passing
- [ ] Performance acceptable

#### Documentation
- [ ] User guide complete
- [ ] Models documented
- [ ] Architecture docs updated

---

## 📞 Stakeholder Sign-Off

**Activity Owner:** [Name]
**Reviewer:** [Name]
**Approved By:** [Name]
**Approval Date:** [Date]

---

## 🎉 Phase 1 Completion

**With Activity 4 complete, Phase 1 is DONE!**

All 4 critical gaps resolved:
- ✅ Security Implementation (Activity 1)
- ✅ SyncService Implementation (Activity 2)
- ✅ Manager Role Completion (Activity 3)
- ✅ Logistics Role Completion (Activity 4)

**Next:** Create `PHASE_1_COMPLETION_REPORT.md` and proceed to Phase 2 (Feature Completion) or Phase 3 (Polish & Scale).

---

## 📚 Reference Documents

- `PROJECT_GAP_ANALYSIS_AND_ROADMAP.md` - Gap Analysis (Lines 172-190)
- `PHASE_1_MASTER_PLAN.md` - Overall Phase 1 plan
- `ACTIVITY_1_SECURITY_IMPLEMENTATION.md` - Security
- `ACTIVITY_2_SYNC_SERVICE_IMPLEMENTATION.md` - Sync
- `ACTIVITY_3_MANAGER_ROLE_COMPLETION.md` - Manager Role
- `ARCHITECTURE_UNIFIED.md` - Current architecture
- `DATABASE.md` - Database schema reference

---

**Document Status:** ✅ READY FOR IMPLEMENTATION
**Created:** October 26, 2025
**Estimated Start:** [Date]
**Estimated Completion:** [Date + 10 weeks]
**Owner:** Development Team

---

**END OF ACTIVITY 4: LOGISTICS ROLE COMPLETION**
