# Logistics System - Metro Railway/Infrastructure Project Requirements

**Project Type**: Metro Railway / Infrastructure Construction
**Reference**: KeyDatesCMRL.pdf (Chennai Metro Rail Limited)
**Date**: Based on User Feedback
**Status**: Requirements Analysis

---

## Table of Contents

1. [Project Context](#project-context)
2. [Material Categories for Metro Projects](#material-categories-for-metro-projects)
3. [User Feedback & Issues](#user-feedback--issues)
4. [Critical Fixes Required](#critical-fixes-required)
5. [Construction-Specific Workflows](#construction-specific-workflows)
6. [Data Entry Requirements](#data-entry-requirements)
7. [Testing Strategy](#testing-strategy)

---

## Project Context

### Metro Railway Project Scope

From KeyDatesCMRL.pdf analysis, the project involves:

1. **Civil Works**
   - Station buildings
   - Underground structures
   - Viaducts and elevated sections
   - Tunnels

2. **Track Works**
   - Rails and sleepers
   - Ballast and track bed
   - Track laying and welding
   - Points and crossings

3. **Electrical & Mechanical Systems**
   - Traction power substations
   - Transformers (various capacities)
   - Switchgears and control panels
   - UPS systems

4. **Overhead Catenary System (OCS)**
   - Contact wires (copper/copper alloy)
   - Catenary wires
   - Droppers and hangers
   - Steel masts and cantilevers
   - Insulators and fittings
   - Registration equipment

5. **Signaling & Telecommunications**
   - Signaling equipment
   - Interlocking systems
   - Communication cables
   - Control panels
   - CCTV and PA systems

6. **Station MEP (Mechanical, Electrical, Plumbing)**
   - HVAC systems
   - Fire fighting systems
   - Plumbing and drainage
   - Lifts and escalators
   - Platform screen doors

---

## Material Categories for Metro Projects

### Category 1: Civil Materials
**Usage**: Foundation, structures, stations, viaducts

| Material | Unit | Typical Usage | Lead Time |
|----------|------|---------------|-----------|
| Cement (OPC/PPC) | MT (Metric Tons) | Foundation, structures | 7-14 days |
| Sand (River/M-Sand) | m³ | Concrete, mortar | 3-7 days |
| Aggregate (20mm/40mm) | m³ | Concrete | 3-7 days |
| Steel (TMT Bars) | MT | Reinforcement | 14-21 days |
| Concrete (RMC) | m³ | Casting | 1-3 days |
| Bricks/Blocks | Nos | Masonry | 7-14 days |

### Category 2: Equipment (NOT Materials)
**Usage**: Construction equipment for installation/execution
**Note**: Equipment is rented/allocated, NOT procured like materials

| Equipment Type | Unit | Typical Usage | Rental Period |
|----------------|------|---------------|---------------|
| Cranes (Various capacity) | Nos | Lifting heavy equipment | Daily/Monthly |
| Concrete Mixers | Nos | Concrete preparation | Daily/Monthly |
| Welding Machines | Nos | OCS/structural welding | Daily/Monthly |
| Cable Laying Equipment | Nos | Cable installation | Daily/Monthly |
| Testing Equipment | Nos | Commissioning tests | Daily/Monthly |
| Generators | Nos | Power supply | Daily/Monthly |

**Logistics Role for Equipment**:
- Track allocation and availability
- Coordinate rentals if needed
- Monitor utilization
- NOT procurement (equipment is hired/rented)

### Category 3: OCS (Overhead Catenary System) Materials
**Usage**: Traction power distribution

| Material | Unit | Typical Usage | Lead Time |
|----------|------|---------------|-----------|
| Contact Wire (Cu 107mm²) | km | Power pickup | 60-90 days |
| Catenary Wire (Cu 95mm²) | km | Supporting wire | 60-90 days |
| Droppers (various sizes) | Nos | Wire suspension | 45-60 days |
| Steel Masts (OCS) | Nos | Support structures | 90-120 days |
| Cantilever Arms | Nos | Wire support | 60-90 days |
| Insulators (Porcelain/Polymer) | Nos | Electrical isolation | 45-60 days |
| Registration Equipment | Sets | Tension regulation | 90-120 days |

### Category 4: Electrical Materials - Traction Power
**Usage**: Power substations, distribution

| Material | Unit | Typical Usage | Lead Time |
|----------|------|---------------|-----------|
| Transformers (33kV/25kV) | Nos | Power conversion | 120-180 days |
| Switchgears (33kV/25kV) | Panels | Power control | 90-150 days |
| Circuit Breakers | Nos | Protection | 60-90 days |
| Power Cables (XLPE) | km | Power distribution | 60-90 days |
| Control Cables | km | Control circuits | 45-60 days |
| Cable Trays & Ladders | RM | Cable support | 30-45 days |

### Category 5: Signaling & Telecom Materials
**Usage**: Train control, communication

| Material | Unit | Typical Usage | Lead Time |
|----------|------|---------------|-----------|
| Signaling Equipment (ATP/ATO) | Sets | Train protection | 180-240 days |
| Interlocking Systems | Sets | Route control | 180-240 days |
| Axle Counters | Sets | Train detection | 90-120 days |
| Telecom Cables (Fiber/Copper) | km | Communication | 60-90 days |
| CCTV Cameras | Nos | Surveillance | 45-60 days |
| PA Systems | Sets | Public address | 60-90 days |

### Category 6: Station MEP Materials
**Usage**: Station facilities, passenger comfort

| Material | Unit | Typical Usage | Lead Time |
|----------|------|---------------|-----------|
| HVAC Chillers | Nos | Air conditioning | 120-180 days |
| AHUs (Air Handling Units) | Nos | Ventilation | 90-120 days |
| Fire Pumps & Panels | Sets | Fire safety | 90-120 days |
| Lifts | Nos | Vertical transport | 120-180 days |
| Escalators | Nos | Vertical transport | 120-180 days |
| Platform Screen Doors | Sets | Safety | 180-240 days |

---

## User Feedback & Issues

### From Manual Testing (Manual_Testing_Guide.md)

#### ❌ **Critical Issues:**

1. **Test 1.1 - Dashboard Data Source** (FAIL)
   - **Issue**: "From where these data are fetched, how user can insert his data"
   - **Screenshot**: logistics1.png
   - **Impact**: Users don't understand data flow

2. **Test 1.2 - Critical Alerts** (FAIL)
   - **Issue**: Alerts not sorted by priority, nothing happens on click
   - **Impact**: Critical alerts not actionable

3. **Test 2.1 - Material Requirements** (FAIL)
   - **Issue**: "BOM is not displaying even after creation"
   - **Screenshot**: logistics2.png
   - **Impact**: Cannot see material requirements
   - Materials list, filters, search not working

4. **Test 2.2 - Material Shortages** (FAIL)
   - **Issue**: Shortages view not functional
   - **Impact**: Cannot identify or act on shortages

5. **Test 2.3 - Supplier Comparison** (FAIL)
   - **Issue**: Supplier comparison not accessible
   - **Impact**: Cannot compare suppliers

6. **Test 2.4 - Consumption Analytics** (FAIL)
   - **Issue**: Analytics view not working
   - **Impact**: No consumption tracking

7. **Test 4.4 - Site Readiness** (FAIL)
   - **Issue**: "nothing to select"
   - **Impact**: Cannot validate site readiness

8. **Test 4.5 - Delivery Performance** (FAIL)
   - **Issue**: "could not locate performance view"
   - **Impact**: No performance metrics

9. **Test 5.6 - EOQ Calculation** (Could not verify)
   - **Issue**: EOQ data not visible
   - **Impact**: Cannot optimize order quantities

10. **Tests 6.2-6.6 - Analytics** (Could not verify)
    - **Issue**: Demand forecasting, lead time, cost analysis not accessible
    - **Impact**: No predictive insights

11. **Tests 7.1-7.10 - Automation** (Could not verify/test)
    - **Issue**: No way to test automation features
    - **Impact**: Automation not demonstrable

#### ✅ **Working Features:**

1. **Test 1.3 - Navigation** (PASS)
   - Tab navigation works

2. **Test 3.1 - Equipment Overview** (PASS)
   - Equipment list displays correctly
   - **Note**: "From where these data are fetched, how user puts his data"
   - **Screenshot**: logistics3.png
   - **Issue**: Cards on top are long, details in bottom not properly visible

3. **Test 3.2 - Maintenance** (OK)
   - **Note**: "In construction project maintenance is not required. Example should be from Metro Railway electrification projects, power plants etc."
   - **Context Issue**: Feature not aligned with construction projects

4. **Test 4.2 - Delivery Tracking** (PASS)
   - **Note**: "very good"
   - Real-time tracking works well

5. **Test 4.3 - Route Optimization** (OK)
   - Route optimization functional

6. **Test 5.1-5.5 - Inventory** (OK)
   - **Note**: "should meet the project construction scenario"
   - Context needs alignment

7. **Test 6.1 - Analytics Overview** (OK)
   - Dashboard displays

---

## Critical Fixes Required

### Priority 1: Materials Tracking (CRITICAL)

**Issue**: BOM not displaying, materials not showing, filters not working

**Root Cause Analysis Needed**:
1. Check BOM data structure and API
2. Verify MaterialTrackingScreen component rendering
3. Check data loading and state management
4. Verify filter/search logic

**Required Fixes**:
1. ✅ Fix BOM data loading and display
2. ✅ Fix material list rendering
3. ✅ Fix filters (category, status, site)
4. ✅ Fix search functionality
5. ✅ Add data entry workflow documentation
6. ✅ Connect to actual project BOMs

### Priority 2: Data Entry Workflows (CRITICAL)

**Issue**: Users don't know how to input data

**Required Solutions**:
1. ✅ Document data flow (where data comes from)
2. ✅ Create clear data entry screens/modals
3. ✅ Add "+" buttons for adding materials, equipment, deliveries
4. ✅ Add import functionality (Excel/CSV for bulk data)
5. ✅ Add BOM upload/creation workflow
6. ✅ Link to project work packages

### Priority 3: Missing Views (HIGH)

**Issue**: Performance views, analytics not accessible

**Required Fixes**:
1. ✅ Add Delivery Performance view (Test 4.5)
2. ✅ Add Site Readiness validation (Test 4.4)
3. ✅ Make analytics views accessible (Tests 6.2-6.6)
4. ✅ Add navigation to all view modes
5. ✅ Fix view mode switching

### Priority 4: Context Alignment (HIGH)

**Issue**: Features not aligned with construction/Metro projects

**Required Changes**:
1. ✅ Adapt equipment maintenance for construction equipment rentals
2. ✅ Add Metro-specific material categories (OCS, Signaling, Track)
3. ✅ Align terminology (e.g., "warehouse" → "site storage")
4. ✅ Use construction-relevant examples and scenarios

### Priority 5: Automation Testing (MEDIUM)

**Issue**: Cannot test automation features

**Required Solutions**:
1. ✅ Add manual trigger buttons for testing automation
2. ✅ Add test data generation for scenarios
3. ✅ Add automation logs/history view
4. ✅ Document how to simulate events

---

## Logistics Workflow - Core Process

### **IMPORTANT: Logistics Role Clarification**

**What Logistics DOES**:
1. ✅ **Receives BOM** from Project Manager/Engineer (Manager screen)
2. ✅ **Reviews BOM** for material requirements
3. ✅ **Places Purchase Orders** with suppliers
4. ✅ **Tracks Order Status** (ordered → in-transit → delivered)
5. ✅ **Coordinates Delivery** to sites
6. ✅ **Manages Inventory** at storage locations
7. ✅ **Issues Materials** to project teams as needed

**What Logistics DOES NOT DO**:
- ❌ Create BOMs (that's Project Manager/Engineer role)
- ❌ Track work execution (that's contractor/civil work)
- ❌ Procure equipment (equipment is rented/hired)

---

## Revised Logistics Screens

### **Screen 1: Dashboard**
**Purpose**: Overview of logistics operations

**Sections**:
- BOMs pending review (from Manager)
- Active purchase orders status
- Deliveries in-transit
- Material shortages/alerts
- Inventory levels

### **Screen 2: BOM Review & Ordering**
**Purpose**: Review BOMs and place orders

**Workflow**:
1. View BOMs submitted by Project team (from Manager screen)
2. Check material availability in inventory
3. Identify shortages
4. Compare suppliers for shortage items
5. Create purchase orders
6. Track PO status

### **Screen 3: Delivery Tracking**
**Purpose**: Monitor deliveries

**Features**:
- Active deliveries with ETA
- Delivery schedule by site
- Delays and alerts
- Delivery coordination

### **Screen 4: Inventory Management**
**Purpose**: Track materials at sites/warehouses

**Features**:
- Stock levels by location
- Material receipts
- Material issues to projects
- Stock transfers between sites

---

## Construction-Specific Workflows

### Workflow 1: BOM to Purchase Order (PRIMARY WORKFLOW)

**Actors**: Project Manager → Logistics Team → Supplier

**Steps**:
1. **Project Manager creates BOM** (in Manager screen):
   - Work package: "Station A - OCS Installation"
   - Materials list with quantities
   - Required dates
   - Submit to Logistics

2. **Logistics receives BOM**:
   - BOM appears in Logistics Dashboard
   - Status: "Pending Review"

3. **Logistics reviews BOM**:
   - Check each material against inventory
   - Mark: In Stock / Shortage / To Order

4. **For shortages - Compare suppliers**:
   - View 3+ supplier quotes
   - Compare: Price, Lead Time, Reliability
   - Select best supplier

5. **Create Purchase Order**:
   - PO Number auto-generated
   - Supplier selected
   - Delivery date specified
   - Submit to supplier

6. **Track PO status**:
   - Ordered → Confirmed → In Production → Dispatched → In Transit → Delivered

7. **Receive at site**:
   - Update inventory
   - Notify Project Manager
   - Material ready for use

**Current Gap**: BOM not flowing from Manager to Logistics

---

### Workflow 2: Material Receipt at Site

**Actor**: Site Engineer / Store Keeper

**Steps**:
1. Delivery arrives at site
2. Check delivery note against PO
3. **Physical verification**: Count quantity, check quality
4. **Record receipt** in app:
   - Delivery number
   - Material name and code
   - Quantity received
   - Supplier
   - Storage location
   - Quality status (accepted/rejected/on-hold)
   - Photos (if damage/issues)
5. Update inventory automatically
6. Send notification to procurement team
7. Create accounting entry (if integrated)

**Current Gap**: No clear receipt workflow in app

### Workflow 2: BOM-Linked Material Consumption

**Actor**: Site Engineer / Quantity Surveyor

**Steps**:
1. Select work package (e.g., "Station A - Foundation")
2. View BOM materials required
3. **Issue materials** from store:
   - Material name
   - Quantity issued
   - Work package code
   - Location/activity
   - Issued to (contractor/team)
4. Record consumption against BOM
5. Update remaining quantities
6. Trigger reorder if below threshold
7. Update project cost tracking

**Current Gap**: BOM not displaying, no consumption recording

### Workflow 3: Material Shortage Alert & Procurement

**Actor**: Procurement Team / Project Manager

**Steps**:
1. System detects shortage (required > available)
2. **Alert sent** with details:
   - Material name
   - Shortage quantity
   - Required date
   - Affected work packages
   - Urgency level
3. View shortage details
4. **Review suppliers**:
   - Compare 3+ suppliers
   - Check lead times
   - Check prices
5. **Create purchase order**:
   - Select supplier
   - Confirm quantity
   - Set delivery date
6. Submit for approval (if needed)
7. Track PO status

**Current Gap**: Shortages not displaying, supplier comparison not working

### Workflow 4: Delivery Scheduling for Site Constraints

**Actor**: Logistics Coordinator

**Steps**:
1. Review upcoming deliveries (7-day view)
2. Check **site constraints**:
   - Access road conditions
   - Storage availability
   - Crane/unloading equipment
   - Weather forecast
   - Site working hours
3. **Schedule delivery**:
   - Confirm date and time window
   - Notify supplier
   - Notify site team
   - Book equipment (if needed)
4. Coordinate with other deliveries (avoid congestion)
5. Track in real-time on delivery day
6. Record receipt

**Current Gap**: Site readiness not working, no constraint checking

---

## Data Entry Requirements

### 1. Material Master Data Entry

**Location**: Materials → Master Data (new screen needed)

**Fields**:
- Material Code (auto-generated or manual)
- Material Name
- Category (dropdown: Civil, Track, OCS, Electrical, Signaling, MEP)
- Sub-category
- Unit of Measurement (MT, m³, km, Nos, Sets, RM, etc.)
- Standard Cost (baseline)
- Lead Time (days)
- Preferred Supplier
- ABC Classification (auto or manual)
- Safety Stock Level
- Reorder Point
- Description
- Specifications (file upload)

**Entry Method**:
- Manual form
- Excel/CSV import (bulk upload)
- Copy from template

### 2. BOM (Bill of Materials) Entry

**Location**: Materials → BOM Management (new screen needed)

**Fields**:
- Work Package Code (e.g., "STA-A-FDN-001")
- Work Package Name
- Project
- Site/Location
- **Material Items**:
  - Material Code (search/select)
  - Material Name (auto-filled)
  - Quantity Required
  - Unit
  - Required Date
  - Priority (Critical/High/Medium/Low)

**Entry Method**:
- Line-by-line entry
- Excel import (BOM template)
- Copy from previous work package
- Link to project schedule

### 3. Material Receipt Entry

**Location**: Materials → Receipts (new screen needed)

**Fields**:
- Receipt Date
- Delivery Note Number
- Purchase Order Number (if applicable)
- Supplier
- **Material Items**:
  - Material Code
  - Quantity Received
  - Storage Location
  - Quality Status (Accepted/Rejected/On-Hold)
  - Remarks
  - Photos (optional)

**Entry Method**:
- Mobile entry from site (camera for photos)
- Link to PO (auto-fill)
- Barcode/QR code scanning (future)

### 4. Material Issue/Consumption Entry

**Location**: Materials → Issues (new screen needed)

**Fields**:
- Issue Date
- Work Package (select from list)
- Issued To (contractor/team)
- **Material Items**:
  - Material Code
  - Quantity Issued
  - Unit
  - From Location
  - Purpose/Activity

**Entry Method**:
- Select from BOM (pre-fill quantities)
- Manual entry
- Bulk issue

### 5. Supplier Data Entry

**Location**: Materials → Suppliers (new screen needed)

**Fields**:
- Supplier Code
- Supplier Name
- Material Categories Supplied
- Contact Person
- Phone/Email
- Address
- Lead Time (average days)
- Payment Terms
- Rating (1-5 stars)
- Active/Inactive status

**Entry Method**:
- Manual form
- Excel import

---

## Testing Strategy

### Three-Tier Testing Approach

#### Tier 1: Automated Unit Tests (Developer)

**For Every Service Method**:
```typescript
describe('MaterialTrackingService', () => {
  it('should load BOM materials for project', () => {
    const bom = MaterialTrackingService.getBOMForProject('project1');
    expect(bom).toBeDefined();
    expect(bom.materials.length).toBeGreaterThan(0);
  });

  it('should detect material shortages', () => {
    const shortages = MaterialTrackingService.detectShortages(bom, inventory);
    expect(shortages).toBeDefined();
    expect(shortages.length).toBeGreaterThan(0);
  });
});
```

**Coverage Target**: 80%+ for all service methods

#### Tier 2: Integration Tests (Developer)

**For Screen Components**:
```typescript
describe('MaterialTrackingScreen', () => {
  it('should render BOM materials list', () => {
    const { getByText } = render(<MaterialTrackingScreen />);
    expect(getByText('Cement')).toBeTruthy();
  });

  it('should filter materials by category', () => {
    const { getByText } = render(<MaterialTrackingScreen />);
    fireEvent.press(getByText('OCS'));
    expect(getByText('Contact Wire')).toBeTruthy();
  });
});
```

**Coverage Target**: All critical user paths

#### Tier 3: Manual Testing (QA/User)

**After Each Fix**:
1. Test the specific bug fix
2. Test related functionality (regression)
3. Document results in Manual_Testing_Guide.md
4. Take screenshots
5. Update pass/fail status

**Full Manual Test Cycle**:
- After major features complete
- Before each release
- Use updated test cases with Metro Railway context

### Testing Checklist for Each Feature

**Before Marking Complete**:
- [ ] Automated unit tests written and passing
- [ ] Integration tests written and passing
- [ ] Manual test case created/updated
- [ ] Manual testing performed and documented
- [ ] Screenshots captured (if UI change)
- [ ] Error handling tested
- [ ] Edge cases tested
- [ ] Performance acceptable (<2s load time)
- [ ] Code reviewed
- [ ] Documentation updated

---

## Next Steps

### Phase 1: Critical Fixes (Week 1)
1. ✅ Fix Materials Tracking BOM display
2. ✅ Fix filters and search
3. ✅ Add data entry workflows
4. ✅ Write automated tests
5. ✅ Perform manual testing
6. ✅ Document results

### Phase 2: Missing Views (Week 1-2)
1. ✅ Add Delivery Performance view
2. ✅ Add Site Readiness validation
3. ✅ Make analytics accessible
4. ✅ Write tests
5. ✅ Manual validation

### Phase 3: Context Alignment (Week 2)
1. ✅ Add Metro material categories
2. ✅ Update equipment for construction rentals
3. ✅ Align terminology
4. ✅ Update examples and scenarios

### Phase 4: Data Entry Screens (Week 2-3)
1. ✅ Material master data entry
2. ✅ BOM entry/import
3. ✅ Material receipt workflow
4. ✅ Material issue/consumption
5. ✅ Supplier management

---

## Success Criteria

**Fix is Complete When**:
1. All manual test cases PASS
2. Automated tests at 80%+ coverage
3. User can input data through clear workflows
4. BOM displays correctly
5. Materials list shows all items with working filters
6. Analytics views accessible and functional
7. Terminology aligned with Metro Railway projects
8. Screenshots show proper functionality

---

**Document Version**: 1.0
**Date**: User Feedback Session
**Next Review**: After Phase 1 Fixes
**Owner**: Development Team
