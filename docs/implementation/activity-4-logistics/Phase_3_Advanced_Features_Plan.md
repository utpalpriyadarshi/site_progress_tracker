# Activity 4 - Phase 3: DOORS Advanced Features Implementation Plan

**Date Created:** November 12, 2025
**Target Start:** November 13, 2025
**Estimated Duration:** 7-10 days
**Current Schema:** v26
**Branch:** feature/v2.4-logistics

---

## 📋 **Executive Summary**

Phase 3 builds upon the solid foundation of Phase 2's DOORS Requirements Management System by adding advanced features for editing, manual linking, RFQ management, and enhanced user experience. This phase transforms DOORS from a read-only tracking system into a fully interactive procurement and compliance management tool.

### **Phase 3 Goals**
1. Enable full CRUD operations on DOORS packages and requirements
2. Implement manual BOM-DOORS linking with override capabilities
3. Add RFQ (Request for Quotation) management for procurement workflow
4. Enhance UX with category filters and bidirectional navigation
5. Integrate procurement compliance checks
6. Add document management for technical specifications

---

## 🎯 **Phase 2 Completion Status**

### **What We Have (Phase 2 Complete)**
✅ DoorsRegisterScreen - Package listing with filters, search, KPIs
✅ DoorsDetailScreen - Requirement details with 3 tabs
✅ Dashboard Integration - DOORS KPIs in 2x2 grid
✅ Automated BOM-DOORS linking via keywords
✅ Navigation flows between Material Tracking ↔ DOORS
✅ Demo data system with 5 packages, 293 requirements
✅ Database schema v26 (doors_packages, doors_requirements tables)
✅ Statistics services (DoorsStatisticsService, BomDoorsLinkingService)
✅ Comprehensive testing (40 test cases, 95% pass rate)
✅ Production-ready UX with uniform styling

### **What's Missing (Phase 3 Scope)**
❌ Edit functionality for packages and requirements
❌ Manual BOM-DOORS linking UI
❌ RFQ creation and vendor management
❌ Category filter on Register screen
❌ Bidirectional navigation (DOORS → BOMs)
❌ Document attachments and version control
❌ Compliance alerts and procurement integration
❌ Enhanced demo data with varied scenarios

---

## 📊 **Phase 3 Feature Breakdown**

### **Priority Tier 1: Core Edit & Linking (Days 1-4)**

#### **Feature 3.1: DOORS Edit Functionality** 🔴 HIGH
**Estimated Effort:** 2 days
**Complexity:** Medium-High

**Components to Create:**
- `DoorsPackageEditScreen.tsx` - Edit package details
- `DoorsRequirementEditScreen.tsx` - Edit individual requirements
- `DoorsEditService.ts` - CRUD operations service

**Functionality:**
1. **Package Editing**
   - Edit package metadata (name, DOORS ID, category, status)
   - Update overall package information
   - Change review status (Draft → Under Review → Approved → Closed)
   - Add package-level notes and comments

2. **Requirement Editing**
   - Update requirement compliance status (Met/Not Met/Partial/Pending)
   - Edit acceptance criteria
   - Add vendor responses and technical notes
   - Update specification clause references

3. **Validation & Business Rules**
   - Prevent editing approved packages (or require supervisor override)
   - Validate compliance percentages after edits
   - Auto-update package statistics when requirements change
   - Maintain audit trail of changes

**Database Changes:**
- **Schema v27**: Add `last_modified_at`, `modified_by_id` columns to both tables
- Add `version` column for optimistic locking
- Consider `audit_log` table for change tracking

**Navigation Flow:**
```
DoorsRegisterScreen → Tap Edit Icon → DoorsPackageEditScreen
                                      ↓
DoorsDetailScreen → Tap Requirement → DoorsRequirementEditScreen
```

**UI Components:**
- Edit icon (pencil) on package cards and requirement cards
- Modal or full-screen edit forms
- Save/Cancel buttons with confirmation dialogs
- Form validation and error messages
- Success snackbar on save

**Testing Checklist:**
- [ ] Can edit package name, category, status
- [ ] Can edit requirement compliance status
- [ ] Changes persist after navigation away and back
- [ ] Statistics update correctly after edits
- [ ] Validation prevents invalid data entry
- [ ] Concurrent edit handling (optimistic locking)
- [ ] Role-based permissions (Supervisor vs. regular user)

---

#### **Feature 3.2: Manual BOM-DOORS Linking** 🔴 HIGH
**Estimated Effort:** 2 days
**Complexity:** Medium

**Components to Create:**
- `BomDoorsLinkingScreen.tsx` - UI for managing links
- `BomDoorsLinkingService.ts` (extend existing) - Add manual linking methods

**Functionality:**
1. **Manual Linking Interface**
   - From Material Tracking: "Link to DOORS" button
   - From DOORS Register: "Link BOMs" button
   - Search/filter interface to find matching items
   - Visual confirmation of current links

2. **Linking Operations**
   - Link BOM item to DOORS package (1:1 relationship)
   - Unlink existing connections
   - Override automated links
   - Bulk linking for multiple items

3. **Validation**
   - Prevent duplicate links (one BOM → one DOORS)
   - Allow manual override of automated suggestions
   - Show confidence level of automated links vs. manual

**Database Changes:**
- **Schema v27**: Add `link_type` column to `bom_items` table
  - Values: `'auto'`, `'manual'`, `'override'`
- Add `linked_by_id` (user who created link)
- Add `linked_at` timestamp

**UI Components:**
- "Link to DOORS" button on BOM cards
- Modal with searchable DOORS package list
- Current link indicator with confidence badge
- "Override" button for auto-linked items
- Unlink button with confirmation

**User Flow:**
```
Material Tracking → Select BOM Item → Tap "Link to DOORS"
                                      ↓
                    Search DOORS Packages → Select → Confirm
                                      ↓
                    BOM Card shows linked DOORS with "Manual" badge
```

**Testing Checklist:**
- [ ] Can manually link BOM to DOORS from Material Tracking
- [ ] Can manually link BOMs from DOORS Register
- [ ] Can override automated links
- [ ] Can unlink and re-link items
- [ ] Links persist across app restarts
- [ ] UI shows link type (auto vs. manual)
- [ ] Statistics update when links change

---

### **Priority Tier 2: RFQ & Procurement (Days 5-7)**

#### **Feature 3.3: RFQ Management System** 🟡 MEDIUM-HIGH
**Estimated Effort:** 2.5 days
**Complexity:** High

**Components to Create:**
- `RfqListScreen.tsx` - List of RFQs
- `RfqDetailScreen.tsx` - RFQ details and vendor quotes
- `RfqCreateScreen.tsx` - Create RFQ from DOORS package
- `RfqModel.ts` - RFQ database model
- `RfqVendorQuoteModel.ts` - Vendor quote model
- `RfqService.ts` - RFQ business logic

**Functionality:**
1. **RFQ Creation**
   - Create RFQ from DOORS package (pre-fill requirements)
   - Set RFQ details (issue date, closing date, terms)
   - Select vendors to send RFQ
   - Attach technical specifications from DOORS

2. **Vendor Quote Management**
   - Add vendor quotes to RFQ
   - Record quoted prices and lead times
   - Track technical compliance against DOORS requirements
   - Compare quotes side-by-side

3. **RFQ Lifecycle**
   - Status: Draft → Issued → Quotes Received → Evaluated → Awarded
   - Track RFQ progress
   - Link RFQ to purchase orders (future integration)

**Database Changes:**
- **Schema v28**: Create new tables
  ```typescript
  rfqs
    - id, rfq_number, doors_id, status, issue_date, closing_date
    - created_by_id, created_at, updated_at

  rfq_vendor_quotes
    - id, rfq_id, vendor_id, quoted_price, lead_time_days
    - technical_compliance_percentage, notes
    - submitted_at, evaluated_at, status
  ```

**Navigation:**
```
DoorsDetailScreen → "Create RFQ" button → RfqCreateScreen
                                          ↓
Material Tracking → View RFQs → RfqListScreen → RfqDetailScreen
```

**UI Components:**
- "Create RFQ" button on DOORS Detail screen
- RFQ form with vendor selection
- Quote comparison table
- Compliance checklist for each quote
- Award RFQ button

**Testing Checklist:**
- [ ] Can create RFQ from DOORS package
- [ ] Requirements auto-populate from DOORS
- [ ] Can add multiple vendor quotes
- [ ] Can compare quotes side-by-side
- [ ] Technical compliance calculated correctly
- [ ] RFQ status updates through lifecycle
- [ ] Can filter/search RFQs

---

### **Priority Tier 3: UX Enhancements (Days 8-9)**

#### **Feature 3.4: Category Filter on Register** 🟢 MEDIUM
**Estimated Effort:** 0.5 days
**Complexity:** Low

**Components to Modify:**
- `DoorsRegisterScreen.tsx` - Add category filter pills

**Functionality:**
- Add category pills below status filters
- Filter packages by category (TSS, OHE, SCADA, Cables, etc.)
- Multi-select or single-select (decide based on UX)
- Persist filter state across navigation

**Implementation:**
```typescript
const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

const categories = [
  { id: 'TSS', label: 'TSS', count: 2 },
  { id: 'OHE', label: 'OHE', count: 1 },
  { id: 'SCADA', label: 'SCADA', count: 1 },
  { id: 'Cables', label: 'Cables', count: 1 },
];

// Add to existing filter bar
<ScrollView horizontal style={styles.categoryFilterBar}>
  {categories.map(cat => (
    <TouchableOpacity
      key={cat.id}
      style={[
        styles.categoryPill,
        selectedCategory === cat.id && styles.categoryPillActive
      ]}
      onPress={() => setSelectedCategory(cat.id)}
    >
      <Text>{cat.label} ({cat.count})</Text>
    </TouchableOpacity>
  ))}
</ScrollView>
```

**Testing:**
- [ ] Category pills display correctly
- [ ] Filtering works with status filters
- [ ] Counts are accurate
- [ ] Clear all filters button works

---

#### **Feature 3.5: Bidirectional Navigation** 🟢 MEDIUM
**Estimated Effort:** 1 day
**Complexity:** Medium

**Components to Modify:**
- `DoorsDetailScreen.tsx` - Add "Used in BOMs" tab
- `BomDoorsLinkingService.ts` - Add reverse lookup methods

**Functionality:**
1. **DOORS → BOMs View**
   - New tab on DOORS Detail: "Used in X BOMs"
   - List all BOM items linked to this DOORS package
   - Show BOM item details (name, quantity, status)
   - Tap to navigate to Material Tracking (specific BOM)

2. **Quick Navigation**
   - From DOORS Detail → Navigate to specific BOM item
   - Maintain navigation stack for easy back navigation

**Implementation:**
```typescript
// In DoorsDetailScreen.tsx, add 4th tab
const tabs = [
  { id: 'requirements', label: 'Requirements' },
  { id: 'compliance', label: 'Compliance' },
  { id: 'documents', label: 'Documents' },
  { id: 'boms', label: 'Used in BOMs' },  // NEW
];

// Add BomUsageTab component
const BomUsageTab = ({ doorsId }: { doorsId: string }) => {
  const bomItems = useBomItemsByDoorsId(doorsId);

  return (
    <FlatList
      data={bomItems}
      renderItem={({ item }) => (
        <TouchableOpacity
          onPress={() => navigation.navigate('MaterialTracking', {
            highlightBomId: item.id
          })}
        >
          <BomItemCard item={item} />
        </TouchableOpacity>
      )}
    />
  );
};
```

**Testing:**
- [ ] "Used in BOMs" tab shows correct items
- [ ] Count is accurate
- [ ] Navigation to Material Tracking works
- [ ] Shows "No BOMs linked" when empty

---

#### **Feature 3.6: Enhanced Demo Data** 🟢 LOW
**Estimated Effort:** 0.5 days
**Complexity:** Low

**Components to Modify:**
- `src/utils/demoData/DoorsSeeder.ts`

**Enhancements:**
1. Add 6th package with <80% compliance (e.g., 65% compliance)
   - Package: "Protection Relay" (DOORS-TSS-PROT-001)
   - 50 requirements with varied compliance
   - Status: Under Review (to show it needs attention)

2. Add more varied compliance scenarios
   - Some requirements with 0% (not started)
   - Some with 50% (partially met)
   - Some with 100% (fully met)

3. Add different requirement types
   - More site-level requirements
   - Warranty requirements
   - Training requirements

**Testing:**
- [ ] New package appears in Register
- [ ] Compliance <80% shows warning color
- [ ] Varied compliance scenarios visible
- [ ] Statistics calculate correctly

---

### **Priority Tier 4: Advanced Features (Days 10+)**

#### **Feature 3.7: Compliance Alerts** 🔵 NICE-TO-HAVE
**Estimated Effort:** 1 day
**Complexity:** Medium

**Functionality:**
- Badge on Material Tracking BOM cards showing low compliance
- Warning icon if linked DOORS package <80% compliance
- Dashboard alert section showing items needing attention
- Notification/alert when compliance drops below threshold

**Implementation:**
```typescript
// On BomRequirementCard.tsx
{doorsPackage && doorsPackage.overallCompliance < 80 && (
  <View style={styles.warningBadge}>
    <Icon name="warning" size={16} color="#ff9800" />
    <Text style={styles.warningText}>
      Low Compliance: {doorsPackage.overallCompliance}%
    </Text>
  </View>
)}
```

---

#### **Feature 3.8: Procurement Integration** 🔵 NICE-TO-HAVE
**Estimated Effort:** 1.5 days
**Complexity:** High

**Functionality:**
1. **Compliance Gating**
   - Block PO creation if linked DOORS not approved
   - Show warning before procurement if compliance <80%
   - Supervisor override capability

2. **Procurement Workflow**
   - From Material Tracking → Create PO → Check DOORS
   - If not approved → Show alert → Navigate to DOORS
   - If approved → Proceed with PO creation

**Implementation:**
```typescript
// In procurement flow
const checkDoorsCompliance = async (bomItemId: string) => {
  const bomItem = await bomItemsCollection.find(bomItemId);
  if (!bomItem.doors_id) {
    return { allowed: true, warning: null };
  }

  const doorsPackage = await doorsPackagesCollection.find(bomItem.doors_id);
  if (doorsPackage.reviewStatus !== 'approved') {
    return {
      allowed: false,
      warning: 'DOORS package must be approved before procurement',
      doorsId: doorsPackage.id,
    };
  }

  if (doorsPackage.overallCompliance < 80) {
    return {
      allowed: true,
      warning: `Low compliance: ${doorsPackage.overallCompliance}%`,
    };
  }

  return { allowed: true, warning: null };
};
```

---

#### **Feature 3.9: Document Management** 🔵 NICE-TO-HAVE
**Estimated Effort:** 2 days
**Complexity:** High

**Functionality:**
1. **Document Attachments**
   - Upload technical datasheets to DOORS packages
   - Upload test reports and certificates
   - Link documents to specific requirements

2. **Document Types**
   - Technical datasheet
   - Type test report
   - Routine test report
   - Manufacturer certificate
   - Compliance certificate

3. **Version Control**
   - Track document versions
   - Show latest version
   - View version history

**Database Changes:**
- **Schema v29**: Create `doors_documents` table
  ```typescript
  doors_documents
    - id, doors_id, doors_requirement_id (optional)
    - document_type, file_name, file_path, file_size
    - version, uploaded_by_id, uploaded_at
    - notes
  ```

**File Storage:**
- Use React Native FS for local storage
- Store in app documents directory
- Future: Add cloud sync capability

**UI:**
- "Documents" tab on DOORS Detail screen (already exists, currently empty)
- Upload button with file picker
- Document list with download/view capability
- Version history modal

---

## 📅 **Implementation Timeline**

### **Week 1: Core Features (Days 1-5)**
```
Day 1: Feature 3.1A - DOORS Package Edit Screen
       - Create DoorsPackageEditScreen.tsx
       - Implement basic form with validation
       - Add Save/Cancel functionality

Day 2: Feature 3.1B - DOORS Requirement Edit
       - Create DoorsRequirementEditScreen.tsx
       - Implement compliance status updates
       - Add statistics recalculation

Day 3: Feature 3.2A - Manual Linking UI
       - Create BomDoorsLinkingScreen.tsx
       - Add search and selection interface
       - Implement link/unlink operations

Day 4: Feature 3.2B - Linking Service & Testing
       - Extend BomDoorsLinkingService
       - Add link type tracking (auto/manual)
       - Comprehensive testing of edit + linking

Day 5: Feature 3.3A - RFQ Models & Schema
       - Create RfqModel, RfqVendorQuoteModel
       - Schema v28 migration
       - Create RfqService
```

### **Week 2: RFQ & UX Enhancements (Days 6-10)**
```
Day 6: Feature 3.3B - RFQ Creation Screen
       - Create RfqCreateScreen.tsx
       - Implement vendor selection
       - Link to DOORS requirements

Day 7: Feature 3.3C - RFQ Detail & Quotes
       - Create RfqDetailScreen.tsx
       - Implement quote comparison
       - Add compliance tracking

Day 8: Features 3.4, 3.5, 3.6 - UX Polish
       - Add category filter on Register
       - Implement bidirectional navigation
       - Enhance demo data

Day 9: Testing & Bug Fixes
       - Comprehensive testing of all Phase 3 features
       - Fix issues found during testing
       - Update documentation

Day 10: Optional Advanced Features (3.7, 3.8)
       - Compliance alerts
       - Procurement integration
       - Final polish and optimization
```

---

## 🗂️ **Database Schema Evolution**

### **Schema v27: Edit & Linking Support**
```sql
-- Add audit columns to doors_packages
ALTER TABLE doors_packages ADD COLUMN last_modified_at INTEGER;
ALTER TABLE doors_packages ADD COLUMN modified_by_id TEXT REFERENCES users(id);
ALTER TABLE doors_packages ADD COLUMN version INTEGER DEFAULT 1;

-- Add audit columns to doors_requirements
ALTER TABLE doors_requirements ADD COLUMN last_modified_at INTEGER;
ALTER TABLE doors_requirements ADD COLUMN modified_by_id TEXT REFERENCES users(id);
ALTER TABLE doors_requirements ADD COLUMN version INTEGER DEFAULT 1;

-- Add linking metadata to bom_items
ALTER TABLE bom_items ADD COLUMN link_type TEXT; -- 'auto', 'manual', 'override'
ALTER TABLE bom_items ADD COLUMN linked_by_id TEXT REFERENCES users(id);
ALTER TABLE bom_items ADD COLUMN linked_at INTEGER;
```

### **Schema v28: RFQ Management**
```sql
-- Create RFQ table
CREATE TABLE rfqs (
  id TEXT PRIMARY KEY,
  rfq_number TEXT UNIQUE NOT NULL,
  doors_id TEXT REFERENCES doors_packages(id),
  status TEXT NOT NULL, -- 'draft', 'issued', 'quotes_received', 'evaluated', 'awarded'
  issue_date INTEGER,
  closing_date INTEGER,
  terms TEXT,
  notes TEXT,
  created_by_id TEXT REFERENCES users(id),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  is_deleted INTEGER DEFAULT 0
);

-- Create RFQ Vendor Quotes table
CREATE TABLE rfq_vendor_quotes (
  id TEXT PRIMARY KEY,
  rfq_id TEXT REFERENCES rfqs(id),
  vendor_id TEXT REFERENCES vendors(id), -- Assuming vendors table exists
  vendor_name TEXT NOT NULL,
  quoted_price REAL,
  currency TEXT DEFAULT 'USD',
  lead_time_days INTEGER,
  technical_compliance_percentage REAL,
  compliance_notes TEXT,
  quoted_at INTEGER,
  evaluated_at INTEGER,
  status TEXT, -- 'pending', 'under_review', 'accepted', 'rejected'
  notes TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX idx_rfqs_doors_id ON rfqs(doors_id);
CREATE INDEX idx_rfq_vendor_quotes_rfq_id ON rfq_vendor_quotes(rfq_id);
```

### **Schema v29: Document Management (Optional)**
```sql
-- Create Documents table
CREATE TABLE doors_documents (
  id TEXT PRIMARY KEY,
  doors_id TEXT REFERENCES doors_packages(id),
  doors_requirement_id TEXT REFERENCES doors_requirements(id), -- Optional
  document_type TEXT NOT NULL, -- 'datasheet', 'type_test', 'routine_test', 'certificate'
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  version INTEGER DEFAULT 1,
  uploaded_by_id TEXT REFERENCES users(id),
  uploaded_at INTEGER NOT NULL,
  notes TEXT,
  is_latest INTEGER DEFAULT 1,
  is_deleted INTEGER DEFAULT 0
);

CREATE INDEX idx_doors_documents_doors_id ON doors_documents(doors_id);
CREATE INDEX idx_doors_documents_requirement_id ON doors_documents(doors_requirement_id);
```

---

## 🏗️ **Architecture & Design Patterns**

### **Service Layer Pattern**
Continue using service layer for business logic:
- `DoorsEditService.ts` - Edit operations
- `BomDoorsLinkingService.ts` - Linking logic (extend existing)
- `RfqService.ts` - RFQ management
- `DoorsDocumentService.ts` - Document operations

### **Form Validation Pattern**
Implement consistent validation across edit screens:
```typescript
interface ValidationResult {
  isValid: boolean;
  errors: { [field: string]: string };
}

const validatePackageEdit = (data: PackageEditData): ValidationResult => {
  const errors: { [field: string]: string } = {};

  if (!data.name || data.name.trim().length === 0) {
    errors.name = 'Package name is required';
  }

  if (!data.doorsId || !/^DOORS-[A-Z]+-[A-Z0-9-]+$/.test(data.doorsId)) {
    errors.doorsId = 'Invalid DOORS ID format';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
```

### **Optimistic Locking Pattern**
Prevent concurrent edit conflicts:
```typescript
const updatePackage = async (packageId: string, updates: Partial<DoorsPackage>) => {
  await database.write(async () => {
    const pkg = await doorsPackagesCollection.find(packageId);

    // Check version for optimistic locking
    if (updates.version && pkg.version !== updates.version) {
      throw new Error('Package was modified by another user. Please refresh and try again.');
    }

    await pkg.update(p => {
      Object.assign(p, updates);
      p.version = (p.version || 0) + 1;
      p.lastModifiedAt = Date.now();
      p.modifiedById = currentUserId;
    });
  });
};
```

### **Permission Checking Pattern**
Role-based access control:
```typescript
const canEditDoors = (user: User, pkg: DoorsPackage): boolean => {
  // Supervisors can edit anything
  if (user.role === 'Supervisor') return true;

  // Regular users can only edit draft packages
  if (pkg.reviewStatus === 'draft') return true;

  // Can't edit approved or closed packages
  return false;
};
```

---

## 🧪 **Testing Strategy**

### **Test Coverage Goals**
- **Unit Tests**: Service layer methods (90%+ coverage)
- **Integration Tests**: Database operations and linking logic
- **Manual Tests**: UI flows and user interactions (50+ test cases)

### **Phase 3 Test Categories**
1. **Edit Functionality Tests** (15 tests)
   - Package editing
   - Requirement editing
   - Validation and error handling
   - Concurrent edit prevention
   - Permission checks

2. **Manual Linking Tests** (10 tests)
   - Link BOM to DOORS
   - Unlink operations
   - Override automated links
   - Bulk linking
   - Link type tracking

3. **RFQ Management Tests** (15 tests)
   - RFQ creation from DOORS
   - Vendor quote management
   - Quote comparison
   - Technical compliance tracking
   - RFQ lifecycle (draft → awarded)

4. **UX Enhancement Tests** (10 tests)
   - Category filtering
   - Bidirectional navigation
   - Enhanced demo data
   - Compliance alerts
   - Procurement integration

**Total Phase 3 Test Cases: ~50**

### **Testing Checklist Template**
```markdown
## Feature 3.X Testing Checklist

### Functional Tests
- [ ] Test case 1: Description
- [ ] Test case 2: Description
...

### Edge Cases
- [ ] Test empty states
- [ ] Test with maximum data
- [ ] Test concurrent operations

### Error Handling
- [ ] Test validation errors
- [ ] Test network errors (future)
- [ ] Test permission errors

### Performance
- [ ] Test with large datasets
- [ ] Test smooth scrolling
- [ ] Test memory usage

### UI/UX
- [ ] Test responsive design
- [ ] Test accessibility
- [ ] Test visual consistency
```

---

## 📝 **Documentation Requirements**

### **Documents to Create**
1. **Phase_3_Implementation_Log.md** - Daily progress log
2. **DOORS_Edit_Feature_Guide.md** - User guide for editing
3. **BOM_DOORS_Linking_Manual.md** - User guide for manual linking
4. **RFQ_Management_Guide.md** - RFQ workflow documentation
5. **Phase_3_Testing_Checklist.md** - Comprehensive test cases
6. **Phase_3_Test_Summary.md** - Test execution results
7. **PROJECT_STATUS_REPORT_2025_11_XX.md** - Final status report

### **Documents to Update**
- **README.md** - Add Activity 4.7 section
- **Logistics_Role_Testing_Procedure.md** - Add Phase 3 features
- **ARCHITECTURE_UNIFIED.md** - Update with new services and models

---

## ⚠️ **Risks & Mitigation**

### **Technical Risks**

**Risk 1: Complex RFQ Data Model**
- **Impact:** High - RFQ system is core to procurement workflow
- **Probability:** Medium
- **Mitigation:** Start with MVP RFQ (basic quote comparison), iterate based on feedback

**Risk 2: Concurrent Edit Conflicts**
- **Impact:** Medium - Users editing same DOORS package
- **Probability:** Low (single-user app currently)
- **Mitigation:** Implement optimistic locking with clear error messages

**Risk 3: Manual Linking Complexity**
- **Impact:** Medium - Users might create incorrect links
- **Probability:** Medium
- **Mitigation:** Add confirmation dialogs, show link confidence, allow undo

### **Schedule Risks**

**Risk 4: RFQ Feature Scope Creep**
- **Impact:** High - Could delay entire Phase 3
- **Probability:** Medium
- **Mitigation:** Define clear MVP scope, defer advanced features to Phase 4

**Risk 5: Testing Time Underestimated**
- **Impact:** Medium - Could miss bugs
- **Probability:** Medium
- **Mitigation:** Allocate 2 full days for testing, start testing early

### **User Acceptance Risks**

**Risk 6: Edit UI Too Complex**
- **Impact:** Medium - Users might not understand how to edit
- **Probability:** Low
- **Mitigation:** Follow existing UI patterns, add helpful tooltips, user guide

---

## 🎯 **Success Criteria**

### **Phase 3 Complete When:**
✅ All Tier 1 features implemented and tested (Edit + Linking)
✅ RFQ system MVP functional (Create RFQ, Add Quotes, Compare)
✅ UX enhancements complete (Category filter, bidirectional nav)
✅ Comprehensive testing with >90% pass rate (50+ test cases)
✅ Documentation complete (user guides + technical docs)
✅ Zero critical bugs, <5 known minor issues
✅ Production-ready code quality (TypeScript, no lint errors)
✅ Git commit with clean history

### **Optional Goals:**
⭐ Document management system (if time permits)
⭐ Compliance alerts and procurement integration
⭐ Advanced demo data scenarios

---

## 📋 **Pre-Implementation Checklist**

Before starting Phase 3 implementation:

**Planning:**
- [x] Review Phase 2 completion status
- [x] Define Phase 3 scope and priorities
- [x] Create detailed implementation plan
- [x] Estimate effort and timeline
- [x] Identify risks and mitigation strategies

**Technical Preparation:**
- [ ] Review Phase 2 architecture and code
- [ ] Design Phase 3 database schema changes
- [ ] Sketch UI mockups for new screens
- [ ] Plan service layer architecture
- [ ] Prepare test case templates

**Environment:**
- [ ] Ensure development environment is stable
- [ ] Verify all Phase 2 code is committed
- [ ] Create Phase 3 feature branch (optional)
- [ ] Set up testing database

**Communication:**
- [ ] Review plan with stakeholders
- [ ] Get approval on scope and timeline
- [ ] Clarify any ambiguous requirements
- [ ] Set up progress check-in schedule

---

## 🚀 **Getting Started (Day 1)**

### **First Tasks Tomorrow:**

1. **Review & Refresh** (30 min)
   - Re-read this implementation plan
   - Review Phase 2 code structure
   - Check git status and ensure clean state

2. **Database Schema Design** (1 hour)
   - Finalize schema v27 changes
   - Write migration scripts
   - Test migration locally

3. **Create DoorsPackageEditScreen** (2 hours)
   - Set up basic screen structure
   - Create form with validation
   - Add Save/Cancel buttons

4. **Implement Package Edit Service** (1.5 hours)
   - Create DoorsEditService.ts
   - Implement update methods
   - Add optimistic locking

5. **Test & Document** (1 hour)
   - Manual testing of edit functionality
   - Document any issues found
   - Update progress log

**Day 1 Goal:** Have basic package editing working end-to-end

---

## 📞 **Questions for Clarification**

Before starting implementation, consider:

1. **RFQ Scope:** Should RFQ system support multiple vendors initially, or start with single vendor?
2. **Linking UI:** Should manual linking be a separate screen or modal overlay?
3. **Edit Permissions:** Should regular Logistics users be able to edit, or only Supervisors?
4. **Document Storage:** Local storage only, or plan for cloud sync in Phase 3?
5. **Demo Data:** How many packages should have <80% compliance for testing?

---

## 📊 **Phase 3 Deliverables Summary**

### **Code Deliverables**
- 8-10 new screens (Edit, Linking, RFQ)
- 3-4 new models (RFQ, RfqVendorQuote, DoorsDocument)
- 2-3 new services (DoorsEditService, RfqService, DoorsDocumentService)
- Database schema v27-v29 migrations
- Enhanced demo data

### **Documentation Deliverables**
- Implementation plan (this document)
- User guides (3-4 documents)
- Testing checklist (50+ test cases)
- Test execution report
- Final status report

### **Quality Deliverables**
- 50+ test cases with >90% pass rate
- Zero critical bugs
- Production-ready code quality
- Comprehensive documentation

---

## 🎓 **Lessons from Phase 2 Applied to Phase 3**

### **What Worked Well (Repeat):**
✅ Create comprehensive test cases BEFORE implementation
✅ Test early and often, fix bugs immediately
✅ Maintain high documentation standards throughout
✅ Use consistent styling patterns (fixed height, uniform fonts)
✅ Iterative approach with frequent user feedback

### **What to Improve:**
📝 Start schema design earlier (before implementation)
📝 Plan for edge cases upfront (empty states, errors)
📝 Allocate more time for testing complex features
📝 Create UI mockups before coding screens
📝 Set up automated tests for critical paths

### **Phase 3 Best Practices:**
1. **Schema First:** Design and test migrations before feature work
2. **Test Cases First:** Write test checklist before implementation
3. **MVP Mindset:** Start with core functionality, iterate
4. **Daily Progress:** Update implementation log daily
5. **User Feedback:** Test with real users mid-phase

---

## 📅 **Milestones & Check-ins**

### **Week 1 Milestones**
- **Day 2:** Edit functionality complete
- **Day 4:** Manual linking complete
- **Day 5:** RFQ models and schema ready

### **Week 2 Milestones**
- **Day 7:** RFQ screens complete
- **Day 9:** Testing complete, all bugs fixed
- **Day 10:** Documentation complete, ready for commit

### **Check-in Schedule**
- **Daily:** 5-minute progress update
- **Mid-Phase (Day 5):** Comprehensive review and course correction
- **End-Phase (Day 10):** Final review and sign-off

---

## ✅ **Phase 3 Definition of Done**

**Code:**
- [x] All planned features implemented
- [ ] TypeScript compilation with zero errors
- [ ] No lint warnings
- [ ] All database migrations tested
- [ ] Observable queries working correctly
- [ ] No memory leaks or performance issues

**Testing:**
- [ ] 50+ test cases created
- [ ] >90% test pass rate achieved
- [ ] All critical bugs fixed
- [ ] All medium bugs fixed or documented
- [ ] Minor bugs triaged (fix now vs. Phase 4)

**Documentation:**
- [ ] Implementation plan complete (this document)
- [ ] User guides written for all new features
- [ ] Testing documentation complete
- [ ] README.md updated
- [ ] Status report created

**Quality:**
- [ ] Code review completed
- [ ] Consistent with Phase 2 patterns
- [ ] Follows React Native best practices
- [ ] Proper error handling throughout
- [ ] Clean git history with meaningful commits

**User Acceptance:**
- [ ] Features tested by end user
- [ ] User feedback incorporated
- [ ] UI is intuitive and consistent
- [ ] No major usability issues

---

## 🏁 **Conclusion**

Phase 3 represents a significant evolution of the DOORS system from a read-only tracking tool to a fully interactive procurement and compliance management system. By building on the solid foundation of Phase 2, we can deliver advanced features while maintaining the high quality and professional UX standards established.

**Key Success Factors:**
- Focus on Tier 1 features first (Edit + Linking)
- Maintain Phase 2's quality standards
- Test thoroughly throughout implementation
- Document everything for future maintenance
- Stay flexible and adjust based on user feedback

**Expected Outcome:**
By the end of Phase 3, the Logistics role will have a complete end-to-end workflow from requirements tracking → compliance management → RFQ creation → vendor management → procurement decisions, all seamlessly integrated with the BOM system.

---

**Document Status:** ✅ Complete
**Ready for Implementation:** Yes
**Estimated Start Date:** November 13, 2025
**Author:** Claude Code Assistant
**Version:** 1.0

---

**End of Phase 3 Implementation Plan**
