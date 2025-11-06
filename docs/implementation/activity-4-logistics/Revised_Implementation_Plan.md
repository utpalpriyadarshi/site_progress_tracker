# Logistics - Revised Implementation Plan

**Based on**: User feedback and correct understanding of logistics role
**Date**: User Feedback Session
**Status**: Action Plan

---

## ✅ **Correct Understanding of Logistics**

### Logistics Receives BOMs (NOT Creates Them)

**Data Flow**:
```
Manager Screen (Project Team)
    ↓
Creates BOM for work package
    ↓
Submits to Logistics
    ↓
Logistics Screen
    ↓
Reviews BOM → Places Orders → Tracks Delivery → Manages Inventory
```

---

## 🎯 **Required Logistics Screens**

### **Screen 1: Dashboard** ✅ (Partially Done - Needs Updates)
**Purpose**: Overview of logistics operations

**Current State**: Has metrics cards
**Required Changes**:
- Show "BOMs Pending Review" (from Manager)
- Show "Active Purchase Orders" count and status
- Show "Deliveries In-Transit" with ETAs
- Show "Material Shortages" alerts
- Show "Inventory Levels" summary

---

### **Screen 2: BOM Review & Ordering** ⚠️ (Currently "Materials Tracking" - Needs Refocus)
**Purpose**: Review BOMs from Project team and place orders

**Current State**: Tries to show BOM materials but BOMs aren't created
**Required Changes**:

#### Tab 1: BOMs Received (NEW)
- List of BOMs submitted by Project Manager
- BOM details:
  - Work Package name
  - Submitted by (Project Manager name)
  - Submitted date
  - Required date
  - Status: Pending Review / Under Review / Ordered / Completed
- Click BOM → View materials list

#### Tab 2: Material Requirements (EXISTING - Update)
- For selected BOM, show materials
- Check against inventory:
  - ✅ **In Stock**: Green - quantity available
  - ⚠️ **Partial Stock**: Yellow - some shortage
  - ❌ **Out of Stock**: Red - need to order
- Shortage quantity calculation

#### Tab 3: Purchase Orders (EXISTING "Procurement" - Update)
- Create PO for shortage materials
- **Supplier Comparison**:
  - Show 3+ suppliers
  - Compare: Price, Lead Time, Reliability
  - Select supplier
- **PO Creation**:
  - PO Number (auto-generated)
  - Supplier
  - Materials list
  - Delivery date
  - Delivery location (site)
  - Submit PO
- **PO Tracking**:
  - List of all POs
  - Status tracking
  - Filter by status

---

### **Screen 3: Delivery Tracking** ✅ (Mostly Done)
**Purpose**: Track deliveries in real-time

**Current State**: Has delivery tracking
**Required Changes**:
- Link deliveries to Purchase Orders
- Show which BOM/work package delivery is for
- Site delivery coordination

---

### **Screen 4: Inventory Management** ✅ (Done)
**Purpose**: Manage materials at sites/warehouses

**Current State**: Has multi-location inventory
**Keep As Is**: This is working well

---

### **Equipment Screen** ⚠️ (Needs Context Change)
**Current Issue**: Focused on maintenance (not relevant for construction)

**Revised Purpose**: Equipment allocation/rental tracking

**Changes Needed**:
- Remove: Maintenance scheduling (not needed)
- Keep: Equipment allocation to projects
- Add: Equipment rental coordination
- Add: Equipment availability calendar

---

## 🔧 **Priority Fixes**

### **Fix 1: BOM Flow from Manager to Logistics** (CRITICAL)

**Problem**: BOMs created in Manager screen don't appear in Logistics

**Solution**:
1. Verify BOM data model includes `submittedToLogistics` flag
2. Add "Submit to Logistics" button in Manager BOM screen
3. Logistics Dashboard shows submitted BOMs
4. Logistics can view BOM details

**Files to Check/Update**:
- `src/models/BomModel.ts` - Add logistics fields
- `src/manager/` - Add submit button
- `src/logistics/LogisticsDashboardScreen.tsx` - Show BOMs
- `src/logistics/MaterialTrackingScreen.tsx` - Rename to `BOMReviewScreen.tsx`

---

### **Fix 2: Differentiate Materials vs Equipment** (HIGH)

**Problem**: Materials and Equipment mixed together

**Solution**:
1. Add `type` field to items: "material" | "equipment"
2. **Materials**: Can be ordered (procurement flow)
3. **Equipment**: Can be allocated/rented (NOT ordered)
4. Separate screens or clear tabs

**Database Schema**:
```typescript
interface Material {
  id: string;
  code: string;
  name: string;
  type: 'material';  // ← Add this
  category: 'civil' | 'ocs' | 'electrical' | 'signaling' | 'mep';
  unit: string;
  // ... procurement fields
}

interface Equipment {
  id: string;
  code: string;
  name: string;
  type: 'equipment';  // ← Add this
  category: 'crane' | 'mixer' | 'welder' | 'generator' | 'testing';
  rentalBasis: 'daily' | 'monthly';
  // ... allocation fields
}
```

---

### **Fix 3: Material Categories for Metro Railway** (HIGH)

**Problem**: Generic categories, not Metro-specific

**Solution**: Update material categories

**Categories** (Remove Track, Add proper ones):
1. **Civil Materials**: Cement, Steel, Sand, Aggregate, Concrete
2. **OCS Materials**: Contact Wire, Catenary Wire, Masts, Insulators
3. **Electrical Materials**: Transformers, Switchgears, Cables, Panels
4. **Signaling Materials**: ATP/ATO Equipment, Interlocking, Axle Counters
5. **MEP Materials**: HVAC, Fire Systems, Lifts, Escalators
6. **Equipment** (separate): Cranes, Mixers, Welders, Generators

**Implementation**:
- Update mock data
- Update dropdowns
- Update filters

---

### **Fix 4: Purchase Order Workflow** (HIGH)

**Problem**: PO creation not clear

**Solution**: Add complete PO workflow

**PO Creation Modal**:
```
Create Purchase Order
---------------------
PO Number: PO-2024-001 (auto)
BOM Reference: Station A - OCS Installation
Supplier: [Select from dropdown]
Delivery Date: [Date picker]
Delivery Location: [Select site]

Materials:
----------------------------------
| Material | Qty | Unit | Price | Total |
| Contact Wire | 10 | km | 50000 | 500000 |
| Catenary Wire | 10 | km | 40000 | 400000 |
----------------------------------
                   Grand Total: 900000

[Cancel] [Create PO]
```

**PO Status Tracking**:
- Created → Sent to Supplier → Confirmed → In Production → Dispatched → In Transit → Delivered

---

## 📋 **Implementation Steps**

### **Phase 1: Critical Fixes** (This Week)

**Day 1-2**:
- [ ] Fix BOM flow from Manager to Logistics
- [ ] Add "BOMs Received" section in Logistics Dashboard
- [ ] Update MaterialTrackingScreen to show received BOMs
- [ ] Test BOM submission workflow

**Day 3-4**:
- [ ] Add material vs equipment differentiation
- [ ] Update categories to Metro Railway specific
- [ ] Remove track materials
- [ ] Add proper OCS, Electrical, Signaling, MEP categories
- [ ] Update filters and dropdowns

**Day 5**:
- [ ] Add PO creation workflow
- [ ] Add supplier comparison modal
- [ ] Add PO status tracking
- [ ] Test end-to-end: BOM → Order → Delivery

---

### **Phase 2: Equipment Updates** (Next Week)

**Day 1-2**:
- [ ] Refactor Equipment screen for construction context
- [ ] Remove maintenance scheduling
- [ ] Add equipment allocation calendar
- [ ] Add equipment rental tracking

**Day 3**:
- [ ] Update mock data with Metro equipment types
- [ ] Add equipment categories (Crane, Mixer, etc.)
- [ ] Test equipment allocation workflow

---

### **Phase 3: Polish & Testing** (Following Week)

**Day 1-2**:
- [ ] Update all mock data to Metro Railway context
- [ ] Add sample BOMs for testing
- [ ] Update manual testing guide
- [ ] Perform manual testing

**Day 3-4**:
- [ ] Write automated tests
- [ ] Fix any bugs found
- [ ] Update documentation

**Day 5**:
- [ ] Final testing
- [ ] Deploy fixes
- [ ] User acceptance testing

---

## 🧪 **Testing Strategy**

### **Test Scenario 1: BOM to PO Flow**

**Steps**:
1. Manager creates BOM in Manager screen
2. Submits BOM to Logistics
3. Logistics sees BOM in Dashboard "Pending Review"
4. Logistics opens BOM, sees materials list
5. System checks inventory, shows shortages
6. Logistics compares suppliers for shortage items
7. Logistics creates PO for selected supplier
8. PO status tracked: Created → Sent → Confirmed...
9. Delivery scheduled based on PO
10. Material received, inventory updated

**Expected Result**: Complete flow works end-to-end

---

### **Test Scenario 2: Material Categories**

**Steps**:
1. Open Materials/BOM Review screen
2. See category filters: Civil, OCS, Electrical, Signaling, MEP
3. Click "OCS" filter
4. See only OCS materials: Contact Wire, Catenary Wire, Masts
5. Click "Electrical" filter
6. See only Electrical materials: Transformers, Switchgears, Cables

**Expected Result**: Filters work with Metro categories

---

### **Test Scenario 3: Material vs Equipment**

**Steps**:
1. View BOM with both materials and equipment
2. Materials show "Order" button
3. Equipment shows "Allocate" button (NOT order)
4. Create PO - only materials included
5. Equipment allocation - separate workflow

**Expected Result**: Clear differentiation

---

## ✅ **Success Criteria**

**Fix Complete When**:
1. ✅ BOMs flow from Manager to Logistics
2. ✅ Logistics Dashboard shows "BOMs Pending Review"
3. ✅ BOM Review screen shows received BOMs
4. ✅ Material vs Equipment clearly differentiated
5. ✅ Metro Railway categories (Civil, OCS, Electrical, Signaling, MEP)
6. ✅ Track materials removed
7. ✅ PO creation workflow functional
8. ✅ Supplier comparison working
9. ✅ PO status tracking working
10. ✅ End-to-end test passes
11. ✅ Manual testing guide updated
12. ✅ All manual tests PASS

---

## 📝 **Next Steps**

1. **Confirm this plan** with user
2. **Start Phase 1 Day 1** fixes
3. **Test after each fix**
4. **Document progress**
5. **User review** after Phase 1

---

**Document Version**: 1.0
**Date**: User Feedback Session
**Status**: Ready for Implementation
**Owner**: Development Team
