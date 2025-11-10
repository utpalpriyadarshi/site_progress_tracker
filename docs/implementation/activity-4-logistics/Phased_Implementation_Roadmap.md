# Metro Electrification Logistics - Phased Implementation Roadmap
**Date**: November 9, 2025
**Approved Approach**: Full metro features in small incremental steps
**Primary User Roles**: Logistics + Engineering
**Timeline**: Quality over speed - complete before production

---

## 📋 Implementation Strategy

### Principles:
1. ✅ **Small Steps** - One feature at a time, fully tested
2. ✅ **Full Features** - All metro electrification capabilities eventually
3. ✅ **Multi-Role** - Support both Logistics and Engineering users
4. ✅ **Monitoring First** - Start with DOORS status tracking (open/closed/critical)
5. ✅ **Import Later** - Manual entry initially, bulk import in future
6. ✅ **Quality Focus** - No production release until complete and tested

---

## 🎯 Priority Order (Based on Your Answers)

### **Priority 1**: DOORS Tracking ⭐⭐⭐⭐⭐
### **Priority 2**: RFQ Management ⭐⭐⭐⭐⭐
### **Priority 3**: FAT/PDI Workflow ⭐⭐⭐⭐
### **Priority 4**: Heavy Transport & Route Survey ⭐⭐⭐
### **Priority 5**: Multi-Tier Storage ⭐⭐⭐
### **Priority 6**: Enhanced KPIs & Coordination ⭐⭐

---

## 📅 Detailed Phased Roadmap

---

## **PHASE 1: Bug Fixes & Stabilization** 🔴
**Timeline**: 1-2 days
**Branch**: feature/v2.4-logistics (current)
**Goal**: Get existing features to 95%+ working state

### Tasks:
- [x] 1A: Fix BOM card expansion (CRITICAL)
- [x] 1B: Fix role switcher visibility (HIGH)
- [x] 1C: Fix mode indicator layout (HIGH)
- [x] 1D: Fix search functionality (MEDIUM)
- [ ] 1E: Re-test all 42 test cases
- [ ] 1F: Merge to main (v2.4 stable release)

**Deliverable**: v2.4 - Stable Logistics with BOM integration (no metro-specific features yet)

**Status**: ⏳ IN PROGRESS (testing complete, fixes pending)

---

## **PHASE 2: DOORS Tracking Foundation** ⭐⭐⭐⭐⭐
**Timeline**: 1 week (5-7 days)
**Branch**: feature/v2.5-doors
**Goal**: Basic DOORS tracking with status monitoring

### Step 2.1: Database Schema (Day 1)
**Schema v26 - Add DOORS tables**

```typescript
// models/DoorsModel.ts
@table('doors_register')
class DoorsModel extends Model {
  static table = 'doors_register';
  static associations = {
    bom_items: { type: 'has_many', foreignKey: 'doors_id' },
    rfqs: { type: 'has_many', foreignKey: 'doors_id' },
  };

  @field('doors_id') doorsId;           // e.g., "DOORS-OHE-001"
  @field('description') description;     // Item description
  @field('category') category;           // OHE/TSS/SCADA/Cables/Civil
  @field('specification_ref') specificationRef;  // Spec document reference
  @field('datasheet_ref') datasheetRef;          // Datasheet reference
  @field('quantity') quantity;
  @field('unit') unit;

  // Status tracking
  @field('status') status;               // Open/In-Progress/Closed/Critical
  @field('priority') priority;           // Low/Medium/High/Critical
  @field('target_closure_date') targetClosureDate;
  @field('actual_closure_date') actualClosureDate;

  // Lifecycle tracking
  @field('spec_received_date') specReceivedDate;
  @field('rfq_issued') rfqIssued;        // Boolean
  @field('rfq_no') rfqNo;                // Link to RFQ
  @field('technical_approved') technicalApproved;  // Boolean
  @field('po_issued') poIssued;          // Boolean
  @field('po_no') poNo;
  @field('fat_cleared') fatCleared;      // Boolean
  @field('delivered') delivered;         // Boolean
  @field('delivery_date') deliveryDate;

  // Engineering responsibility
  @field('engineer_assigned') engineerAssigned;  // User ID
  @field('remarks') remarks;

  // Timestamps
  @date('created_at') createdAt;
  @date('updated_at') updatedAt;
}
```

**Migration Script:**
```typescript
// migrations/v26-add-doors.ts
schemaMigrations: [
  {
    toVersion: 26,
    steps: [
      createTable({
        name: 'doors_register',
        columns: [
          { name: 'doors_id', type: 'string', isIndexed: true },
          { name: 'description', type: 'string' },
          { name: 'category', type: 'string', isIndexed: true },
          { name: 'specification_ref', type: 'string', isOptional: true },
          { name: 'datasheet_ref', type: 'string', isOptional: true },
          { name: 'quantity', type: 'number' },
          { name: 'unit', type: 'string' },
          { name: 'status', type: 'string', isIndexed: true },
          { name: 'priority', type: 'string', isIndexed: true },
          { name: 'target_closure_date', type: 'number', isOptional: true },
          { name: 'actual_closure_date', type: 'number', isOptional: true },
          // ... (rest of fields)
        ],
      }),

      // Add doors_id to bom_items for linking
      addColumns({
        table: 'bom_items',
        columns: [
          { name: 'doors_id', type: 'string', isOptional: true, isIndexed: true },
        ],
      }),
    ],
  },
];
```

**Tasks:**
- [ ] Create DoorsModel.ts
- [ ] Create migration script v26
- [ ] Test migration on fresh database
- [ ] Test migration on existing database (with BOM data)

---

### Step 2.2: DOORS Service Layer (Day 2)
**Create service for DOORS operations**

```typescript
// services/DoorsService.ts
class DoorsService {
  // Create DOORS entry
  static async createDoors(doorsData: DoorsData): Promise<DoorsModel> {
    await database.write(async () => {
      return await database.collections
        .get<DoorsModel>('doors_register')
        .create(doors => {
          doors.doorsId = doorsData.doorsId;
          doors.description = doorsData.description;
          doors.category = doorsData.category;
          doors.status = 'Open'; // Default
          doors.priority = doorsData.priority || 'Medium';
          // ... set other fields
        });
    });
  }

  // Update DOORS status
  static async updateDoorsStatus(
    doorsId: string,
    status: DoorsStatus,
    remarks?: string
  ): Promise<void> {
    await database.write(async () => {
      const doors = await this.findByDoorsId(doorsId);
      await doors.update(d => {
        d.status = status;
        if (status === 'Closed') {
          d.actualClosureDate = Date.now();
        }
        if (remarks) {
          d.remarks = remarks;
        }
      });
    });
  }

  // Get DOORS statistics
  static async getDoorsStats(): Promise<DoorsStats> {
    const allDoors = await database.collections
      .get<DoorsModel>('doors_register')
      .query()
      .fetch();

    return {
      total: allDoors.length,
      open: allDoors.filter(d => d.status === 'Open').length,
      inProgress: allDoors.filter(d => d.status === 'In-Progress').length,
      closed: allDoors.filter(d => d.status === 'Closed').length,
      critical: allDoors.filter(d => d.priority === 'Critical').length,
      overdue: allDoors.filter(d =>
        d.targetClosureDate &&
        d.targetClosureDate < Date.now() &&
        d.status !== 'Closed'
      ).length,
    };
  }

  // Get DOORS by category
  static async getDoorsByCategory(category: string): Promise<DoorsModel[]> {
    return await database.collections
      .get<DoorsModel>('doors_register')
      .query(Q.where('category', category))
      .fetch();
  }

  // Link DOORS to BOM item
  static async linkDoorsToBomItem(
    doorsId: string,
    bomItemId: string
  ): Promise<void> {
    await database.write(async () => {
      const bomItem = await database.collections
        .get<BomItemModel>('bom_items')
        .find(bomItemId);

      await bomItem.update(item => {
        item.doorsId = doorsId;
      });
    });
  }
}
```

**Tasks:**
- [ ] Create DoorsService.ts
- [ ] Add CRUD operations
- [ ] Add status update methods
- [ ] Add statistics methods
- [ ] Add category filtering
- [ ] Add BOM linking

---

### Step 2.3: DOORS Register Screen (Day 3-4)
**New screen: Material Tracking → DOORS Register**

```typescript
// logistics/DoorsRegisterScreen.tsx
const DoorsRegisterScreen = () => {
  const [doorsItems, setDoorsItems] = useState<DoorsModel[]>([]);
  const [stats, setStats] = useState<DoorsStats | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | DoorsStatus>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  useEffect(() => {
    loadDoorsData();
  }, [filterStatus, filterCategory]);

  const loadDoorsData = async () => {
    const stats = await DoorsService.getDoorsStats();
    setStats(stats);

    let items = await DoorsService.getAllDoors();

    // Apply filters
    if (filterStatus !== 'all') {
      items = items.filter(d => d.status === filterStatus);
    }
    if (filterCategory !== 'all') {
      items = items.filter(d => d.category === filterCategory);
    }

    setDoorsItems(items);
  };

  return (
    <View style={styles.container}>
      {/* Header with Stats */}
      <View style={styles.statsContainer}>
        <StatCard label="Total" value={stats?.total || 0} color="#2196F3" />
        <StatCard label="Open" value={stats?.open || 0} color="#FF9800" />
        <StatCard label="In-Progress" value={stats?.inProgress || 0} color="#FFC107" />
        <StatCard label="Closed" value={stats?.closed || 0} color="#4CAF50" />
        <StatCard label="Critical" value={stats?.critical || 0} color="#F44336" />
        <StatCard label="Overdue" value={stats?.overdue || 0} color="#E91E63" />
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <FilterChips
          options={['All', 'Open', 'In-Progress', 'Closed', 'Critical']}
          selected={filterStatus}
          onSelect={setFilterStatus}
        />
        <FilterChips
          options={['All', 'OHE', 'TSS', 'SCADA', 'Cables', 'Civil']}
          selected={filterCategory}
          onSelect={setFilterCategory}
        />
      </View>

      {/* DOORS List */}
      <FlatList
        data={doorsItems}
        renderItem={({ item }) => <DoorsCard doors={item} />}
        keyExtractor={item => item.id}
      />
    </View>
  );
};
```

**Features:**
- DOORS statistics dashboard (Open/Closed/Critical counts)
- Filter by status (Open/In-Progress/Closed/Critical)
- Filter by category (OHE/TSS/SCADA/Cables/Civil)
- DOORS item cards with status badges
- Tap to see details modal
- Add new DOORS button
- Export DOORS list

**Tasks:**
- [ ] Create DoorsRegisterScreen.tsx
- [ ] Add to Material Tracking tab navigation
- [ ] Create DoorsCard component
- [ ] Add filter chips
- [ ] Add statistics cards
- [ ] Create "Add DOORS" form
- [ ] Create DOORS details modal

---

### Step 2.4: Engineering Role Integration (Day 5)
**Add DOORS management to Engineering role**

```typescript
// Create new tab in Engineering Navigator (if exists) OR
// Add DOORS section to existing Manager/Planning role

// engineering/DoorsManagementScreen.tsx
const DoorsManagementScreen = () => {
  // Similar to DoorsRegisterScreen but with:
  // - Engineering-specific views
  // - Ability to update technical status
  // - Mark items for ECP (Engineering Clearance for Procurement)
  // - Link to specifications/datasheets

  return (
    <View>
      {/* Engineering view of DOORS */}
      {/* Technical review controls */}
      {/* Spec/datasheet upload */}
    </View>
  );
};
```

**Engineering-Specific Features:**
- View DOORS assigned to them
- Update technical review status
- Mark DOORS as "Technically Approved" (ready for RFQ)
- Attach spec/datasheet documents
- Add technical remarks

**Tasks:**
- [ ] Decide: Separate Engineering role OR add to existing role?
- [ ] Create Engineering DOORS view
- [ ] Add technical approval workflow
- [ ] Add document attachment (if needed)

---

### Step 2.5: Dashboard Integration (Day 6)
**Add DOORS KPIs to Logistics Dashboard**

```typescript
// Update LogisticsDashboardScreen.tsx
const [doorsStats, setDoorsStats] = useState<DoorsStats | null>(null);

useEffect(() => {
  const loadDoorsStats = async () => {
    const stats = await DoorsService.getDoorsStats();
    setDoorsStats(stats);
  };
  loadDoorsStats();
}, []);

// Add DOORS KPI cards
<View style={styles.kpiCard}>
  <Text style={styles.kpiValue}>{doorsStats?.closureRate}%</Text>
  <Text style={styles.kpiLabel}>DOORS Closure Rate</Text>
  <Text style={styles.kpiSubtext}>
    {doorsStats?.closed}/{doorsStats?.total} closed
  </Text>
</View>

<View style={styles.kpiCard}>
  <Text style={styles.kpiValue}>{doorsStats?.critical}</Text>
  <Text style={styles.kpiLabel}>Critical DOORS</Text>
  <Text style={styles.kpiSubtext}>Require attention</Text>
</View>
```

**New KPIs:**
- DOORS Closure Rate (% closed vs total)
- Critical DOORS count
- Overdue DOORS count
- Avg time to closure

**Tasks:**
- [ ] Add DOORS KPI cards to Dashboard
- [ ] Add DOORS alerts section
- [ ] Link to DOORS Register screen

---

### Step 2.6: Testing & Documentation (Day 7)
**Comprehensive testing**

**Test Cases:**
1. Create DOORS entry manually
2. Update DOORS status (Open → In-Progress → Closed)
3. Mark DOORS as Critical
4. Filter by status and category
5. View statistics
6. Link DOORS to BOM item
7. Engineering role: Review and approve
8. Check Dashboard KPIs

**Documentation:**
- [ ] DOORS User Guide (how to create, update, monitor)
- [ ] Engineering workflow guide
- [ ] Test results document
- [ ] Update README.md

**Deliverable**: v2.5 - DOORS Tracking System ✅

---

## **PHASE 3: RFQ Management** ⭐⭐⭐⭐⭐
**Timeline**: 1.5-2 weeks
**Branch**: feature/v2.6-rfq
**Goal**: Complete RFQ workflow (RFQ → Vendor Quotes → Tech Comparison → Financial Comparison → PO)

### Step 3.1: Database Schema (Day 1)
**Schema v27 - Add RFQ tables**

```typescript
// models/RfqModel.ts
@table('rfq_register')
class RfqModel extends Model {
  @field('rfq_no') rfqNo;                    // RFQ-2025-001
  @field('doors_id') doorsId;                 // Link to DOORS
  @field('description') description;
  @field('quantity') quantity;
  @field('unit') unit;
  @field('date_issued') dateIssued;
  @field('due_date') dueDate;
  @field('vendors_sent') vendorsSent;         // JSON array of vendor IDs
  @field('offers_received') offersReceived;   // Count
  @field('technical_status') technicalStatus; // Pending/Under Review/Approved/Rejected
  @field('ecp_date') ecpDate;                 // Engineering Clearance for Procurement
  @field('financial_status') financialStatus; // Pending/Evaluated/PO Issued
  @field('l1_vendor_id') l1VendorId;          // Lowest bidder
  @field('po_no') poNo;                       // Generated PO number
  @field('status') status;                    // Draft/Issued/Evaluated/Closed
}

// models/VendorModel.ts
@table('vendors')
class VendorModel extends Model {
  @field('vendor_name') vendorName;
  @field('vendor_code') vendorCode;
  @field('contact_person') contactPerson;
  @field('email') email;
  @field('phone') phone;
  @field('address') address;
  @field('category') category;                // OHE/TSS/SCADA specialist
  @field('rating') rating;                    // 1-5 stars
  @field('approved') approved;                // AVL status
}

// models/VendorQuoteModel.ts
@table('vendor_quotes')
class VendorQuoteModel extends Model {
  @field('rfq_id') rfqId;
  @field('vendor_id') vendorId;
  @field('quote_amount') quoteAmount;
  @field('quoted_quantity') quotedQuantity;
  @field('unit_price') unitPrice;
  @field('delivery_period') deliveryPeriod;   // Days
  @field('warranty_period') warrantyPeriod;   // Months
  @field('payment_terms') paymentTerms;
  @field('technical_compliance') technicalCompliance;  // Yes/No/Partial
  @field('technical_remarks') technicalRemarks;        // Engineering notes
  @field('commercial_ranking') commercialRanking;      // L1/L2/L3
  @field('quote_date') quoteDate;
  @field('quote_validity') quoteValidity;
}
```

---

### Step 3.2: RFQ Service (Day 2)
```typescript
// services/RfqService.ts
class RfqService {
  static async createRfqFromDoors(doorsId: string, vendors: string[]): Promise<RfqModel>;
  static async recordVendorQuote(rfqId: string, quoteData: QuoteData): Promise<void>;
  static async performTechnicalComparison(rfqId: string): Promise<TechnicalComparisonSheet>;
  static async performFinancialComparison(rfqId: string): Promise<FinancialComparisonSheet>;
  static async selectL1Vendor(rfqId: string, vendorId: string): Promise<void>;
  static async generatePO(rfqId: string): Promise<string>;
}
```

---

### Step 3.3: RFQ Management Screen (Day 3-5)
**Features:**
- RFQ Register (list of all RFQs)
- Create RFQ from DOORS item
- Send to multiple vendors
- Record vendor quotes
- Technical Comparison Sheet (Engineering review)
- Financial Comparison Sheet (L1/L2/L3 ranking)
- Generate PO

---

### Step 3.4: Vendor Management (Day 6-7)
- Vendor master list
- Add/edit vendors
- Vendor categories (OHE/TSS specialists)
- Approved Vendor List (AVL)
- Vendor performance rating

---

### Step 3.5: Technical & Financial Comparison (Day 8-9)
**Engineering Role:**
- Review vendor quotes for technical compliance
- Mark compliance: Yes/No/Partial
- Add technical remarks
- Approve/reject vendors

**Logistics Role:**
- View only technically approved vendors
- Enter freight, taxes, other costs
- Auto-calculate landed cost
- System auto-ranks L1, L2, L3
- Select L1 vendor for PO

---

### Step 3.6: PO Generation (Day 10)
- Auto-generate PO number
- PO includes: DOORS ref, specs, delivery terms, QA requirements
- Link PO to DOORS (update status)
- Update DOORS: po_issued = true

**Deliverable**: v2.6 - RFQ Management System ✅

---

## **PHASE 4: FAT/PDI Workflow** ⭐⭐⭐⭐
**Timeline**: 1 week
**Branch**: feature/v2.7-fat
**Goal**: Factory testing and inspection workflow

### Features:
- FAT scheduling (after PO placed)
- FAT location tracking (vendor factory)
- Inspector assignment (QA/QC team)
- FAT report upload
- PDI (Pre-Dispatch Inspection)
- Dispatch authorization
- Link to Delivery module

**Deliverable**: v2.7 - FAT/PDI System ✅

---

## **PHASE 5: Heavy Transport & Route Survey** ⭐⭐⭐
**Timeline**: 1 week
**Branch**: feature/v2.8-transport
**Goal**: Oversized cargo logistics

### Features:
- Flag deliveries needing route survey (weight/dimensions)
- Route survey checklist
- Permit tracking
- Load plan (crane specs, sling requirements)
- GPS tracking integration (future)

**Deliverable**: v2.8 - Heavy Transport System ✅

---

## **PHASE 6: Multi-Tier Storage** ⭐⭐⭐
**Timeline**: 1 week
**Branch**: feature/v2.9-storage
**Goal**: 3-tier storage hierarchy

### Features:
- Central Store → Field Stores → Sites
- Material categories (OHE/TSS/Cables/Hardware)
- Storage types (Covered/Open/Drum/Shelving)
- Fire & safety compliance
- Storage utilization tracking

**Deliverable**: v2.9 - Multi-Tier Storage System ✅

---

## **PHASE 7: Coordination & Reporting** ⭐⭐
**Timeline**: 3-4 days
**Branch**: feature/v2.10-coordination
**Goal**: Weekly meetings and reports

### Features:
- Weekly coordination meeting scheduler
- Agenda generation (pending RFQs, FAT, deliveries)
- Action item tracking
- Daily/Weekly/Monthly reports

**Deliverable**: v2.10 - Coordination Module ✅

---

## 📊 Complete Timeline

| Phase | Feature | Duration | Cumulative | Branch |
|-------|---------|----------|------------|---------|
| 1 | Bug Fixes | 1-2 days | 2 days | v2.4-logistics |
| 2 | DOORS Tracking | 1 week | 9 days | v2.5-doors |
| 3 | RFQ Management | 2 weeks | 23 days | v2.6-rfq |
| 4 | FAT/PDI | 1 week | 30 days | v2.7-fat |
| 5 | Heavy Transport | 1 week | 37 days | v2.8-transport |
| 6 | Multi-Tier Storage | 1 week | 44 days | v2.9-storage |
| 7 | Coordination | 3-4 days | 48 days | v2.10-coord |

**Total Timeline**: ~7-8 weeks (2 months) for complete implementation

---

## 🎯 Immediate Next Steps

### This Week (Week 1):
1. ✅ **Day 1-2**: Fix all critical bugs (Phase 1)
   - BOM card expansion
   - Role switcher
   - Mode indicator
   - Search functionality

2. ✅ **Day 3**: Merge Phase 1 to main (v2.4 stable)

3. 🚀 **Day 4-7**: Start Phase 2 (DOORS Tracking)
   - Create database schema
   - Build DOORS service
   - Create DOORS Register screen
   - Initial testing

### Next Week (Week 2):
- Complete Phase 2 (DOORS Tracking)
- Testing and documentation
- Merge to main (v2.5)

### Weeks 3-4:
- Phase 3 (RFQ Management)

### Weeks 5-8:
- Phases 4-7 (FAT, Transport, Storage, Coordination)

---

## ✅ Success Criteria

**Phase 1 (Bug Fixes)**: 95%+ test pass rate
**Phase 2 (DOORS)**: Can create, track, and monitor DOORS items
**Phase 3 (RFQ)**: Complete procurement workflow working
**Phase 4-7**: All metro features functional

**Final Goal**: Production-ready Metro Electrification Logistics System

---

## 🚀 Let's Start!

**Shall we begin with Phase 1 (fixing the critical bugs)?**

After Phase 1 is complete and merged, we'll start Phase 2 (DOORS Tracking) on a new branch.

