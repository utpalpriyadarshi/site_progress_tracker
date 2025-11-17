# Phase 2: DOORS Tracking Implementation Plan
**Date**: November 10, 2025
**Branch**: feature/v2.4-logistics
**Priority**: HIGH (Critical for Metro Electrification Projects)
**Estimated Duration**: 3-4 days

---

## 📋 Executive Summary

### What is DOORS?
**DOORS** (Dynamic Object Oriented Requirements System) is a comprehensive requirements tracking system used in metro electrification projects. Each equipment/material specification is broken down into multiple measurable technical requirements that manufacturers must comply with.

**Example - Auxiliary Transformer Specification**:
A single Auxiliary Transformer has ~100 individual requirements broken into:
- **Technical Requirements** (~30): Voltage ratings, power capacity, efficiency, cooling type, etc.
- **Data Sheet Compliance** (~20): Dimensional specs, weight, connections, accessories
- **Type Tests** (~25): Temperature rise test, impulse test, short circuit test, noise test, etc.
- **Routine Tests** (~15): Voltage ratio test, insulation resistance, no-load loss, etc.
- **Site Requirements** (~10): Installation specs, foundation requirements, clearances, etc.

**Goal**: Track 100% compliance across all requirements from multiple manufacturers during procurement.

### DOORS Hierarchy:
```
Equipment/Material (e.g., Auxiliary Transformer)
  └─ DOORS Package (e.g., DOORS-TSS-AUX-TRF-001)
      ├─ Technical Requirements (30 items) → 85% compliant
      ├─ Data Sheet Compliance (20 items) → 100% compliant
      ├─ Type Tests (25 items) → 92% compliant
      ├─ Routine Tests (15 items) → 100% compliant
      └─ Site Requirements (10 items) → 100% compliant

Overall Compliance: 94/100 requirements = 94% → ACCEPTABLE
```

### Lifecycle Flow:
```
Engineering Creates DOORS Package (100 requirements) →
Manufacturers Submit Compliance Data →
Engineering Reviews Each Requirement (Compliant/Non-Compliant/Partial) →
Logistics Issues RFQ to Compliant Vendors →
Technical Comparison (compliance %) →
Commercial Comparison (L1 selection) →
PO Placement → FAT/PDI (verify requirements) →
Delivery → Installation → DOORS Closure (100% verified)
```

### Phase 2 Objectives:
1. ✅ Create DOORS database model with parent-child relationship
2. ✅ Build DOORS Register screen (equipment-level view)
3. ✅ Build DOORS Detail screen (requirement-level tracking)
4. ✅ Implement compliance tracking (% completion per category)
5. ✅ Add vendor compliance comparison matrix
6. ✅ Add DOORS KPIs to Logistics Dashboard
7. ✅ Create demo data for realistic testing
8. ✅ Engineering role integration (create/review requirements)

---

## 🗂️ Database Schema Changes

### Schema Version: v26

### Two-Table Structure: Parent-Child Relationship

#### Table 1: `doors_packages` (Parent - Equipment/Material Level)

```typescript
// models/DoorsPackageModel.ts
table: 'doors_packages',
columns: [
  { name: 'doors_id', type: 'string', isIndexed: true },           // e.g., "DOORS-TSS-AUX-TRF-001"
  { name: 'equipment_name', type: 'string' },                      // e.g., "Auxiliary Transformer 1000kVA"
  { name: 'category', type: 'string' },                            // OHE, TSS, SCADA, Cables, etc.
  { name: 'equipment_type', type: 'string' },                      // Transformer, Switchgear, Cable, Mast, etc.
  { name: 'project_id', type: 'string', isIndexed: true },         // FK to projects
  { name: 'specification_ref', type: 'string', isOptional: true }, // Engineering spec doc reference
  { name: 'drawing_ref', type: 'string', isOptional: true },       // GA drawing reference
  { name: 'quantity', type: 'number' },                            // Required quantity
  { name: 'unit', type: 'string' },                                // Unit (nos, sets, etc.)

  // Compliance Summary (calculated from child requirements)
  { name: 'total_requirements', type: 'number' },                  // Total count (e.g., 100)
  { name: 'compliant_requirements', type: 'number' },              // Compliant count (e.g., 94)
  { name: 'compliance_percentage', type: 'number' },               // % (e.g., 94.0)
  { name: 'technical_req_compliance', type: 'number' },            // Technical requirements %
  { name: 'datasheet_compliance', type: 'number' },                // Data sheet %
  { name: 'type_test_compliance', type: 'number' },                // Type tests %
  { name: 'routine_test_compliance', type: 'number' },             // Routine tests %
  { name: 'site_req_compliance', type: 'number' },                 // Site requirements %

  // Status tracking
  { name: 'status', type: 'string' },                              // draft, under_review, approved, closed
  { name: 'priority', type: 'string' },                            // high, medium, low

  // RFQ stage (Phase 3)
  { name: 'rfq_no', type: 'string', isOptional: true },
  { name: 'rfq_issued_date', type: 'number', isOptional: true },
  { name: 'vendors_invited', type: 'number', isOptional: true },   // Count of vendors
  { name: 'vendors_responded', type: 'number', isOptional: true },

  // Procurement stage
  { name: 'po_no', type: 'string', isOptional: true },
  { name: 'po_date', type: 'number', isOptional: true },
  { name: 'selected_vendor', type: 'string', isOptional: true },
  { name: 'po_value', type: 'number', isOptional: true },

  // Delivery tracking
  { name: 'delivery_status', type: 'string', isOptional: true },   // pending, in_transit, delivered
  { name: 'expected_delivery', type: 'number', isOptional: true },
  { name: 'actual_delivery', type: 'number', isOptional: true },

  // Closure
  { name: 'closure_date', type: 'number', isOptional: true },
  { name: 'closure_remarks', type: 'string', isOptional: true },

  // Ownership
  { name: 'created_by', type: 'string' },                          // Engineer who created
  { name: 'assigned_to', type: 'string', isOptional: true },       // Logistics Manager
  { name: 'reviewed_by', type: 'string', isOptional: true },       // Senior Engineer
  { name: 'created_at', type: 'number' },
  { name: 'updated_at', type: 'number' },

  // AppSync
  { name: 'app_sync_status', type: 'string' },
  { name: 'version', type: 'number' },
]
```

#### Table 2: `doors_requirements` (Child - Individual Requirements)

```typescript
// models/DoorsRequirementModel.ts
table: 'doors_requirements',
columns: [
  { name: 'requirement_id', type: 'string', isIndexed: true },     // e.g., "DOORS-TSS-AUX-TRF-001-TR-001"
  { name: 'doors_package_id', type: 'string', isIndexed: true },   // FK to parent package

  // Requirement details
  { name: 'category', type: 'string' },                            // technical, datasheet, type_test, routine_test, site
  { name: 'requirement_code', type: 'string' },                    // TR-001, DS-005, TT-012, RT-003, SR-008
  { name: 'requirement_text', type: 'string' },                    // Full requirement description
  { name: 'specification_clause', type: 'string', isOptional: true }, // Reference to spec clause
  { name: 'acceptance_criteria', type: 'string' },                 // How to verify compliance
  { name: 'is_mandatory', type: 'boolean' },                       // true/false
  { name: 'sequence_no', type: 'number' },                         // Display order (1-100)

  // Compliance status
  { name: 'compliance_status', type: 'string' },                   // compliant, non_compliant, partial, not_verified
  { name: 'compliance_percentage', type: 'number', isOptional: true }, // For partial compliance (0-100)
  { name: 'vendor_response', type: 'string', isOptional: true },   // Vendor's compliance statement
  { name: 'verification_method', type: 'string', isOptional: true }, // test, inspection, calculation, certificate
  { name: 'verification_status', type: 'string', isOptional: true }, // pending, verified, failed

  // Engineering review
  { name: 'review_status', type: 'string' },                       // pending, approved, rejected, clarification_needed
  { name: 'review_comments', type: 'string', isOptional: true },
  { name: 'reviewed_by', type: 'string', isOptional: true },       // Engineer user ID
  { name: 'reviewed_at', type: 'number', isOptional: true },

  // Attachments/Evidence
  { name: 'attachment_count', type: 'number' },                    // Count of supporting docs
  { name: 'test_report_ref', type: 'string', isOptional: true },   // Test report reference
  { name: 'certificate_ref', type: 'string', isOptional: true },   // Certificate reference

  // Tracking
  { name: 'created_at', type: 'number' },
  { name: 'updated_at', type: 'number' },

  // AppSync
  { name: 'app_sync_status', type: 'string' },
  { name: 'version', type: 'number' },
]
```

### Relationships:

```typescript
// DoorsPackageModel associations
@relation('project', 'project_id') project;
@children('doors_requirements') requirements;       // 1-to-many: Package has many requirements
@relation('bom_items', 'doors_id') bomItems;        // Link DOORS to BOM items

// DoorsRequirementModel associations
@relation('doors_package', 'doors_package_id') package; // Many-to-1: Requirement belongs to package
@immutableRelation('created_by_user', 'created_by') createdBy;
@immutableRelation('reviewed_by_user', 'reviewed_by') reviewer;
```

### Data Flow Example:

```
DOORS Package: "DOORS-TSS-AUX-TRF-001" (Auxiliary Transformer 1000kVA)
├─ Total Requirements: 100
├─ Compliant: 94
├─ Compliance: 94%
│
├─ Technical Requirements (30 items) → 85% compliant
│   ├─ TR-001: Rated Power 1000kVA ✓ Compliant
│   ├─ TR-002: Primary Voltage 33kV ✓ Compliant
│   ├─ TR-003: Secondary Voltage 415V ✓ Compliant
│   ├─ TR-004: Frequency 50Hz ✓ Compliant
│   ├─ TR-005: Cooling Type ONAN ⚠️ Partial (ONAF offered)
│   └─ ... (25 more)
│
├─ Data Sheet Compliance (20 items) → 100% compliant
│   ├─ DS-001: Overall Dimensions ✓ Compliant
│   ├─ DS-002: Total Weight ✓ Compliant
│   └─ ... (18 more)
│
├─ Type Tests (25 items) → 92% compliant
│   ├─ TT-001: Temperature Rise Test ✓ Compliant
│   ├─ TT-002: Impulse Test ✓ Compliant
│   ├─ TT-003: Short Circuit Test ✗ Non-Compliant
│   └─ ... (22 more)
│
├─ Routine Tests (15 items) → 100% compliant
│   └─ RT-001 to RT-015 all ✓
│
└─ Site Requirements (10 items) → 100% compliant
    └─ SR-001 to SR-010 all ✓
```

### Modified Tables:

#### `bom_items` - Add DOORS reference
```typescript
// Add column to existing bom_items table
{ name: 'doors_id', type: 'string', isOptional: true, isIndexed: true }
```

This allows linking BOM items to DOORS tracking.

---

## 🎨 UI Components

### 1. DOORS Register Screen (`DoorsRegisterScreen.tsx`)

**Location**: `src/logistics/DoorsRegisterScreen.tsx`

**Features**:
- List view of all DOORS packages (equipment-level)
- Compliance % displayed for each package
- Search by DOORS ID, equipment name, category
- Filter by: Status, Priority, Category, Project, Compliance Range
- Sort by: Creation date, Priority, Compliance %, Delivery date
- Status badges with color coding
- Compliance progress bars (by category)
- Quick actions: View Requirements, Update Status, Assign

**Layout**:
```
┌─────────────────────────────────────────────────────┐
│ DOORS Register                          [+ New]     │
├─────────────────────────────────────────────────────┤
│ 📊 KPIs                                             │
│ Total: 25  |  Avg Compliance: 92%  |  Closed: 15   │
├─────────────────────────────────────────────────────┤
│ 🔍 Search...                      [Compliance: All▼]│
│ [All] [Draft] [Review] [Approved] [Closed]          │
├─────────────────────────────────────────────────────┤
│ ┌───────────────────────────────────────────────┐   │
│ │ ⚡ DOORS-TSS-AUX-TRF-001   [UNDER REVIEW] [HIGH]│  │
│ │ Auxiliary Transformer 1000kVA                 │   │
│ │ Qty: 2 nos  •  TSS Equipment                  │   │
│ │                                               │   │
│ │ Overall Compliance: 94% (94/100 requirements) │   │
│ │ [████████████████████░░] 94%                  │   │
│ │                                               │   │
│ │ Technical: 85% • Datasheet: 100% • Type: 92%  │   │
│ │ Routine: 100% • Site: 100%                    │   │
│ │                                               │   │
│ │ RFQ: Pending • PO: - • Delivery: -            │   │
│ │ Created by: A. Kumar • Assigned: J. Doe       │   │
│ └───────────────────────────────────────────────┘   │
│                                                     │
│ ┌───────────────────────────────────────────────┐   │
│ │ 🔌 DOORS-TSS-CB-001       [APPROVED] [MEDIUM] │   │
│ │ 33kV Circuit Breaker                          │   │
│ │ Qty: 6 nos  •  TSS Equipment                  │   │
│ │                                               │   │
│ │ Overall Compliance: 100% (85/85 requirements) │   │
│ │ [████████████████████████] 100%               │   │
│ │                                               │   │
│ │ Technical: 100% • Datasheet: 100% • Type: 100%│   │
│ │ Routine: 100% • Site: 100%                    │   │
│ │                                               │   │
│ │ RFQ: ✓ • PO: PO-2025-034 • Delivery: 15 Dec   │   │
│ └───────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

**KPIs at Top**:
- Total DOORS Packages
- Average Compliance %
- Packages by Status (Draft, Under Review, Approved, Closed)
- Critical Items (< 80% compliance)

### 2. DOORS Detail Screen - Requirements View (`DoorsDetailScreen.tsx`)

**Features**:
- Package summary (equipment info, overall compliance)
- Tabbed view: Requirements | Timeline | Documents | Vendors | Activity
- **Requirements Tab**: List all 100 requirements grouped by category
- Expandable categories (Technical, Datasheet, Type Tests, Routine Tests, Site)
- Individual requirement compliance status
- Engineering review status for each requirement
- Bulk actions: Mark as Compliant, Request Clarification
- Search/filter within requirements

**Layout - Requirements Tab**:
```
┌─────────────────────────────────────────────────────┐
│ ← Back    DOORS-TSS-AUX-TRF-001             [Edit]  │
├─────────────────────────────────────────────────────┤
│ Auxiliary Transformer 1000kVA                       │
│ TSS Equipment  •  Qty: 2 nos  •  [UNDER REVIEW]    │
│                                                     │
│ Overall: 94% (94/100) [████████████████████░░]     │
│ Spec: OHE-SPEC-2025-A  •  Drawing: GA-TSS-001      │
├─────────────────────────────────────────────────────┤
│ [Requirements] [Timeline] [Documents] [Vendors]     │
├─────────────────────────────────────────────────────┤
│ 🔍 Search requirements...        [Filter ▼] [Sort ▼]│
│                                                     │
│ ▼ Technical Requirements (30 items) - 85% ─────────│
│   ┌───────────────────────────────────────────┐    │
│   │ ✅ TR-001: Rated Power 1000kVA             │    │
│   │ Spec: IEC 60076-1 Clause 4.2              │    │
│   │ Status: Compliant • Verified              │    │
│   └───────────────────────────────────────────┘    │
│   ┌───────────────────────────────────────────┐    │
│   │ ✅ TR-002: Primary Voltage 33kV ± 10%      │    │
│   │ Spec: IEC 60076-1 Clause 4.3              │    │
│   │ Status: Compliant • Verified              │    │
│   └───────────────────────────────────────────┘    │
│   ┌───────────────────────────────────────────┐    │
│   │ ⚠️ TR-005: Cooling Type ONAN               │    │
│   │ Spec: IEC 60076-2 Clause 6.1              │    │
│   │ Status: Partial (75%) • Pending Review    │    │
│   │ Vendor: Offered ONAF instead              │    │
│   │ [Review] [Accept] [Reject]                │    │
│   └───────────────────────────────────────────┘    │
│   ... (27 more items)                              │
│                                                     │
│ ▼ Data Sheet Compliance (20 items) - 100% ─────────│
│   ┌───────────────────────────────────────────┐    │
│   │ ✅ DS-001: Overall Dimensions (mm)         │    │
│   │ L: 2400, W: 1800, H: 2200                 │    │
│   │ Status: Compliant • Verified              │    │
│   └───────────────────────────────────────────┘    │
│   ... (19 more items)                              │
│                                                     │
│ ▶ Type Tests (25 items) - 92% ─────────────────────│
│                                                     │
│ ▶ Routine Tests (15 items) - 100% ─────────────────│
│                                                     │
│ ▶ Site Requirements (10 items) - 100% ─────────────│
└─────────────────────────────────────────────────────┘
```

### 3. DOORS Requirement Detail Modal

**Features**:
- View/edit single requirement details
- Compliance status with history
- Vendor response/documentation
- Engineering review form
- Test report/certificate attachment
- Comments and clarifications

**Layout**:
```
┌─────────────────────────────────────────────┐
│ TR-005: Cooling Type                  [✕]   │
├─────────────────────────────────────────────┤
│ Category: Technical Requirement             │
│ Spec Clause: IEC 60076-2 Clause 6.1         │
│ Mandatory: Yes                              │
│                                             │
│ ━━━━━ Requirement ━━━━━                    │
│ Transformer shall have ONAN (Oil Natural    │
│ Air Natural) cooling system suitable for    │
│ continuous operation at rated capacity.     │
│                                             │
│ ━━━━━ Acceptance Criteria ━━━━━            │
│ - Nameplate shows ONAN cooling              │
│ - Temperature rise test confirms rating     │
│ - No forced cooling required                │
│                                             │
│ ━━━━━ Vendor Response ━━━━━                │
│ Vendor: ABC Transformers Ltd.               │
│ Response: Offered ONAF (Oil Natural Air     │
│ Forced) cooling system with dual fans.      │
│ Justification: Better thermal performance   │
│ and lower operating temperature.            │
│                                             │
│ ━━━━━ Compliance Status ━━━━━              │
│ Status: [Partial ▼] 75%                     │
│ Verification: [Test Required ▼]             │
│                                             │
│ ━━━━━ Engineering Review ━━━━━             │
│ Review Status: [Pending ▼]                  │
│ Comments: _____________________________     │
│           _____________________________     │
│                                             │
│ Attachments: [📎 Datasheet.pdf]             │
│                                             │
│            [Cancel]  [Save & Next]          │
└─────────────────────────────────────────────┘
```

### 3. Material Tracking Integration

**Enhance `MaterialTrackingScreen.tsx`**:
- Add "DOORS" column to requirements list
- Show DOORS ID for each BOM item
- Add filter: "Show only items with DOORS"
- Add indicator: Items without DOORS (needs assignment)
- Link to DOORS detail from material card

**BomRequirementCard Enhancement**:
```typescript
{requirement.doorsId && (
  <View style={styles.doorsInfo}>
    <Icon name="file-document-outline" size={14} color="#2196F3" />
    <Text style={styles.doorsId}>{requirement.doorsId}</Text>
    <Text style={styles.doorsStatus}>{requirement.doorsStatus}</Text>
  </View>
)}
```

### 4. Dashboard Integration

**Enhance `LogisticsDashboard.tsx`**:

Add new KPI card:
```typescript
{
  title: 'DOORS Closure',
  value: `${stats.doorsClosed}/${stats.doorsTotal}`,
  subtitle: `${stats.doorsClosureRate}% Complete`,
  icon: 'file-document-check',
  color: '#9C27B0',
  trend: stats.doorsClosureTrend
}
```

Add DOORS summary section:
```
━━━━━ DOORS Tracking ━━━━━
[====60%=====>          ] 15/25 Closed
Open: 5 • In Progress: 5 • Critical: 2
```

---

## 🔧 Implementation Tasks

### Task 1: Database Setup
**File**: `models/schema.ts`
**Estimated Time**: 2 hours

- [ ] 1.1. Create `DoorsModel.ts` with all fields and relationships
- [ ] 1.2. Update schema.ts to include doors_register table (v26)
- [ ] 1.3. Add `doors_id` column to `bom_items` table
- [ ] 1.4. Create migration script (v25 → v26)
- [ ] 1.5. Test schema migration on dev database
- [ ] 1.6. Add TypeScript types (`DoorsStatus`, `DoorsPriority`, etc.)

### Task 2: Demo Data & Seeding
**File**: `utils/demoData/DoorsSeeder.ts`
**Estimated Time**: 1 hour

- [ ] 2.1. Create 20-30 realistic DOORS points for metro project
- [ ] 2.2. Cover all categories (OHE, TSS, SCADA, Cables, Hardware)
- [ ] 2.3. Mix of statuses (50% open, 30% in_progress, 20% closed)
- [ ] 2.4. Add realistic spec refs and datasheets
- [ ] 2.5. Link some DOORS to existing BOM items
- [ ] 2.6. Add to demo mode initialization

### Task 3: DOORS Register Screen
**File**: `src/logistics/DoorsRegisterScreen.tsx`
**Estimated Time**: 4 hours

- [ ] 3.1. Create screen layout with header and search
- [ ] 3.2. Implement WatermelonDB query with observables
- [ ] 3.3. Add filters (status, priority, category, project)
- [ ] 3.4. Add search functionality (doors_id, description)
- [ ] 3.5. Create DOORS card component with status badges
- [ ] 3.6. Implement sorting (date, priority, status)
- [ ] 3.7. Add KPI summary at top
- [ ] 3.8. Add empty state and loading indicators
- [ ] 3.9. Add pull-to-refresh
- [ ] 3.10. Navigation to detail screen

### Task 4: DOORS Detail Screen
**File**: `src/logistics/DoorsDetailScreen.tsx`
**Estimated Time**: 3 hours

- [ ] 4.1. Create detail view layout
- [ ] 4.2. Display all DOORS information
- [ ] 4.3. Implement timeline/progress view
- [ ] 4.4. Add status update form (modal)
- [ ] 4.5. Show related BOM items
- [ ] 4.6. Add activity log (audit trail)
- [ ] 4.7. Add edit functionality
- [ ] 4.8. Handle field validations

### Task 5: Material Tracking Integration
**File**: `src/logistics/MaterialTrackingScreen.tsx`
**Estimated Time**: 2 hours

- [ ] 5.1. Add DOORS ID display to BomRequirementCard
- [ ] 5.2. Add DOORS status indicator
- [ ] 5.3. Add filter: "Items with DOORS" vs "Items without DOORS"
- [ ] 5.4. Add navigation to DOORS detail from material card
- [ ] 5.5. Update BOM item type to include doorsId field
- [ ] 5.6. Show warning for items missing DOORS assignment

### Task 6: Dashboard Integration
**File**: `src/logistics/LogisticsDashboard.tsx`
**Estimated Time**: 1.5 hours

- [ ] 6.1. Add DOORS closure KPI card
- [ ] 6.2. Calculate DOORS statistics (total, open, closed, critical)
- [ ] 6.3. Add DOORS summary section
- [ ] 6.4. Add navigation to DOORS Register from dashboard
- [ ] 6.5. Add chart: DOORS closure trend (optional)

### Task 7: Navigation Setup
**File**: `src/nav/LogisticsNavigator.tsx`
**Estimated Time**: 0.5 hours

- [ ] 7.1. Add "DOORS" tab to bottom tab navigator
- [ ] 7.2. Add DoorsRegisterScreen to stack
- [ ] 7.3. Add DoorsDetailScreen to stack
- [ ] 7.4. Configure navigation params and types
- [ ] 7.5. Add DOORS icon to tab (file-document-multiple)

### Task 8: Engineering Role Integration
**File**: `src/engineering/*` (new module)
**Estimated Time**: 2 hours

- [ ] 8.1. Create EngineeringNavigator (basic)
- [ ] 8.2. Engineering can view DOORS Register (read-only for now)
- [ ] 8.3. Engineering can update technical status
- [ ] 8.4. Engineering can add specifications and datasheets
- [ ] 8.5. Add to main navigation (for engineering role users)

### Task 9: Testing
**Estimated Time**: 2 hours

- [ ] 9.1. Test DOORS creation flow
- [ ] 9.2. Test status updates (open → in_progress → closed)
- [ ] 9.3. Test search and filters
- [ ] 9.4. Test BOM-DOORS linking
- [ ] 9.5. Test dashboard KPIs
- [ ] 9.6. Test navigation between screens
- [ ] 9.7. Test with multiple projects
- [ ] 9.8. Test role switcher with Engineering role

### Task 10: Documentation
**Estimated Time**: 1 hour

- [ ] 10.1. Update Logistics_Role_Testing_Procedure.md
- [ ] 10.2. Add DOORS test cases
- [ ] 10.3. Update user guide (if exists)
- [ ] 10.4. Add inline code documentation

---

## 📊 Phase 2 Status Definitions

### DOORS Package Status Values:
```typescript
export type DoorsPackageStatus =
  | 'draft'          // Being created, requirements being added
  | 'under_review'   // Engineering reviewing requirements
  | 'approved'       // All requirements verified, ready for procurement
  | 'closed';        // Equipment delivered and accepted

export type DoorsPriority = 'high' | 'medium' | 'low';
```

### Requirement-Level Status Values:
```typescript
export type RequirementCategory =
  | 'technical'       // Technical specifications (voltage, power, etc.)
  | 'datasheet'       // Physical dimensions, weight, etc.
  | 'type_test'       // Factory type tests (temperature, impulse, etc.)
  | 'routine_test'    // Routine production tests
  | 'site';           // Site installation requirements

export type ComplianceStatus =
  | 'compliant'       // 100% meets requirement
  | 'non_compliant'   // Does not meet requirement
  | 'partial'         // Partially meets (50-99%)
  | 'not_verified';   // Not yet checked

export type ReviewStatus =
  | 'pending'         // Awaiting engineering review
  | 'approved'        // Engineering approved
  | 'rejected'        // Engineering rejected
  | 'clarification_needed'; // Needs vendor clarification

export type VerificationMethod =
  | 'test'            // Physical testing required
  | 'inspection'      // Visual inspection
  | 'calculation'     // Mathematical verification
  | 'certificate';    // Third-party certificate
```

### Requirement Category Breakdown (Example):
```
Technical Requirements (technical):
- Electrical ratings (voltage, current, power)
- Performance parameters (efficiency, losses)
- Operating conditions (temperature, humidity)
- Protection features (overload, short circuit)
- Control and monitoring systems

Data Sheet Compliance (datasheet):
- Physical dimensions (length, width, height)
- Weight and shipping requirements
- Terminal arrangements and connections
- Accessories and spare parts
- Documentation requirements

Type Tests (type_test):
- Temperature rise test
- Impulse voltage test
- Short circuit withstand test
- Dielectric test
- Noise level test
- Vibration test

Routine Tests (routine_test):
- Voltage ratio test
- Insulation resistance test
- Winding resistance test
- No-load loss and current test
- Load loss test
- Pressure test

Site Requirements (site):
- Foundation specifications
- Clearance requirements
- Access and handling
- Installation instructions
- Commissioning requirements
```

---

## 🎯 Success Criteria

Phase 2 is complete when:

### Database & Models
- ✅ Two-table structure created: `doors_packages` + `doors_requirements`
- ✅ Schema v26 migration successful
- ✅ Relationships working (Package ← Requirements, Package → BOM Items)
- ✅ Demo data seeded: 5-10 packages with 50-100 requirements each

### DOORS Register Screen
- ✅ Lists all DOORS packages with compliance %
- ✅ Shows category-wise compliance breakdown
- ✅ Search by DOORS ID, equipment name, category works
- ✅ Filter by status, priority, compliance range works
- ✅ Sort by compliance %, date, priority works
- ✅ Compliance progress bars displayed correctly

### DOORS Detail Screen
- ✅ Package summary with overall compliance displayed
- ✅ Requirements tab lists all 100+ requirements by category
- ✅ Expandable categories (Technical, Datasheet, Type Tests, etc.)
- ✅ Individual requirement cards with compliance status
- ✅ Requirement detail modal for editing single requirement
- ✅ Search/filter within requirements works
- ✅ Engineering can update compliance status

### Integration
- ✅ Material Tracking shows DOORS IDs for BOM items
- ✅ Dashboard displays DOORS KPIs (total, avg compliance, critical)
- ✅ Navigation between screens working smoothly

### Engineering Role
- ✅ Engineering can view all DOORS packages
- ✅ Engineering can drill down to requirements
- ✅ Engineering can update compliance status
- ✅ Engineering can add review comments

### Quality
- ✅ Zero TypeScript errors
- ✅ No console errors during navigation
- ✅ Compliance % calculated correctly from child requirements
- ✅ Demo mode works with realistic data
- ✅ Basic test cases passing

---

## 🚫 Out of Scope for Phase 2

The following features are planned for **Phase 3** (RFQ Management):
- RFQ creation and vendor management
- Technical Comparison Sheet (TCS)
- Financial Comparison Sheet (FCS)
- Vendor quotation tracking
- Engineering Clearance for Procurement (ECP) workflow

The following features are planned for **Phase 4** (FAT/PDI):
- Factory Acceptance Test scheduling
- Pre-Dispatch Inspection tracking
- Test report uploads
- FAT/PDI checklists

---

## 📅 Estimated Timeline

| Task | Duration | Dependencies |
|------|----------|--------------|
| Database Setup | 2 hours | None |
| Demo Data | 1 hour | Task 1 |
| DOORS Register Screen | 4 hours | Task 1, 2 |
| DOORS Detail Screen | 3 hours | Task 1, 2 |
| Material Tracking Integration | 2 hours | Task 1, 3 |
| Dashboard Integration | 1.5 hours | Task 1, 3 |
| Navigation Setup | 0.5 hours | Task 3, 4 |
| Engineering Role | 2 hours | Task 1, 3, 4 |
| Testing | 2 hours | All above |
| Documentation | 1 hour | All above |

**Total Estimated Time**: ~19 hours (2.5 days)
**Buffer for Issues**: +0.5 days
**Total Duration**: **3-4 days**

---

## 🔄 Implementation Sequence

### Day 1: Foundation
1. Database schema and migration (Task 1)
2. Demo data seeding (Task 2)
3. Start DOORS Register screen (Task 3)

### Day 2: Core Screens
1. Complete DOORS Register screen (Task 3)
2. DOORS Detail screen (Task 4)
3. Navigation setup (Task 7)

### Day 3: Integration
1. Material Tracking integration (Task 5)
2. Dashboard integration (Task 6)
3. Engineering role setup (Task 8)

### Day 4: Polish & Testing
1. Complete all remaining tasks
2. Comprehensive testing (Task 9)
3. Documentation (Task 10)
4. Bug fixes and refinements

---

## 📝 Notes

1. **Incremental Approach**: Each task builds on previous ones
2. **Testing**: Test each component before moving to next
3. **Demo Mode**: All features must work in demo mode first
4. **Real Data**: Backend integration can come later (Phase 6)
5. **User Feedback**: Get user feedback after Day 2 to adjust
6. **Flexibility**: Timeline may adjust based on discoveries

---

## 🎓 Key Learnings from User Clarification

### DOORS = Dynamic Object Oriented Requirements System

**Critical Understanding**:
- DOORS is NOT just a tracking number
- It's a **comprehensive requirements management system**
- Each equipment specification is broken into 50-100 **measurable requirements**
- Goal: Track 100% compliance from manufacturers

### Example Structure:
```
Auxiliary Transformer (Equipment)
  └─ DOORS Package: DOORS-TSS-AUX-TRF-001
      ├─ 30 Technical Requirements → Each individually tracked
      ├─ 20 Data Sheet Requirements → Each individually tracked
      ├─ 25 Type Test Requirements → Each individually tracked
      ├─ 15 Routine Test Requirements → Each individually tracked
      └─ 10 Site Requirements → Each individually tracked

Total: 100 requirements = 100 compliance checkpoints
```

### Why This Matters:
1. **Granular Tracking**: Not "transformer compliance 94%", but "TR-005 cooling type: partial 75%"
2. **Engineering Precision**: Each requirement has acceptance criteria and verification method
3. **Vendor Comparison**: Compare vendors requirement-by-requirement
4. **Quality Assurance**: No ambiguity - every spec point is measurable
5. **Risk Management**: Identify exact non-compliant items before procurement

### Implementation Impact:
- **Two-table structure required**: Packages (equipment) + Requirements (individual specs)
- **Detailed UI needed**: List all 100 requirements, not just summary
- **Compliance calculation**: Auto-calc package compliance from child requirements
- **Engineering workflow**: Review and approve each requirement individually
- **Reporting**: Compliance reports at requirement-level granularity

---

**Prepared by**: Claude Code
**Reviewed by**: User
**Status**: Updated with DOORS definition - Ready for Implementation
**Next Step**: User approval to begin Task 1 (Database Setup)
