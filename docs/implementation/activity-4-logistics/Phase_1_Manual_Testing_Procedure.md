# Phase 1 - Manual Testing Procedure
**Activity 4 - Logistics Implementation**
**Date**: November 2025
**Features**: Mock BOM Data, Empty State, Category Filters
**Status**: Ready for Testing

---

## 📋 **Pre-Testing Setup**

### **1. Verify Application State**

**Start the application:**
```bash
# Start the application
cd C:\Projects\site_progress_tracker
npm start
```

**Expected**: App should start without errors

### **2. Set Demo Mode**

**IMPORTANT**: The app now has two modes:
- **🧪 Demo Mode**: For testing with sample data (you want this!)
- **🏗️ Production Mode**: For real project data

**Steps**:
1. Open the app and navigate to Material Tracking
2. Look at the **top-right corner** of the screen
3. You should see a badge showing either **🧪 DEMO** or **🏗️ PROD**
4. **If you see 🏗️ PROD**, tap it to switch to **🧪 DEMO**
5. The badge should now show **🧪 DEMO** (orange background)

**Why this matters**:
- Demo Mode shows the "Load Sample BOMs" button for testing
- Production Mode expects real BOMs from Project Manager

📖 **See**: [Dual Mode System Guide](./Dual_Mode_System_Guide.md) for details

### **3. Access Logistics Module**

1. Open the app on your device/emulator
2. Navigate to **Logistics** tab/screen
3. Select a project from the dropdown
4. Navigate to **Material Tracking** screen
5. **Verify mode indicator shows 🧪 DEMO**

---

## 🧪 **Test Scenario 1: Empty State with Load Sample Data**

### **Objective**: Verify empty state shows helpful guidance and allows loading sample BOMs

### **Steps**:

1. **Open Material Tracking screen**
   - Navigate to: Logistics → Material Tracking

2. **Verify Empty State Display**
   - Should see: 📋 icon (large)
   - Title: "No Bills of Materials (BOMs)"
   - Description: "To track materials, you need Bills of Materials (BOMs) from the Project Manager."
   - Sub-text: "BOMs list all materials required for each work package..."
   - Button: "📊 Load Sample Metro Railway BOMs"
   - Hint text: "Sample data includes: Civil Works, OCS Installation..."

3. **Test Load Sample Data Button**
   - Click: **"📊 Load Sample Metro Railway BOMs"** button
   - **Expected**:
     - Button shows loading spinner
     - Wait 2-3 seconds
     - Screen refreshes with BOMs loaded

### **Expected Results** ✅:

| Check | Expected Behavior | Pass/Fail |
|-------|------------------|-----------|
| Empty state icon shows | Large 📋 icon visible | ☐ |No
| Title is clear | "No Bills of Materials (BOMs)" | ☐ |No
| Description explains workflow | Mentions Project Manager, ordering, delivery | ☐ |No
| Load button is visible | Blue button with "📊 Load Sample..." text | ☐ |No
| Button loads data | Spinner shows, then data appears | ☐ |no
| No errors in console | Check for JavaScript errors | ☐ |ok

### **Screenshot Required**:
- [ ] Empty state before loading- check screenshot @prompts\material2.ong
- [ ] Loading state (button with spinner)-no loading, only material status
- [ ] Screen after BOMs loaded-only material screen
 please note material tracking can be seen two time on on top left then just below of that with larger fornt. cards can be smaller so that bottom material items can come up for better visibility.
---

## 🧪 **Test Scenario 2: BOM Data Display**

### **Objective**: Verify BOMs load correctly with all Metro Railway materials

### **Steps**:

1. **After loading sample BOMs** (from Test 1)

2. **Verify Stats Cards Display**
   - Top of screen should show stats cards:
     - Total Requirements: Should show count (37+ items)
     - Shortages: Should show count
     - Critical Items: Should show count

3. **Verify View Mode Tabs**
   - Should see 4 tabs:
     - **Requirements** (active by default)
     - **Shortages**
     - **Procurement**
     - **Analytics**

4. **Verify Material List Displays**
   - Scroll through the list
   - Should see material cards with:
     - Item code (e.g., "CIV-CEM-001")
     - Description (e.g., "Cement OPC 53 Grade")
     - Quantity and unit
     - BOM name (e.g., "Station A - Civil Works")

### **Expected BOMs Loaded** (5 total):

| BOM Name | Category | Items | Total Cost |
|----------|----------|-------|------------|
| Station A - Civil Works | Civil | 7 items | ₹4.5 Cr |
| OCS - Section 1 (5km) | OCS | 7 items | ₹8.5 Cr |
| Traction Substation - TSS-01 | Electrical | 7 items | ₹12.5 Cr |
| Signaling & Telecom - Station A | Signaling | 6 items | ₹3.5 Cr |
| MEP - Station A | MEP | 7 items | ₹6.5 Cr |

### **Expected Results** ✅:

| Check | Expected Behavior | Pass/Fail |
|-------|------------------|-----------|
| Stats cards show | Total, shortages, critical counts visible | ☐ |
| View tabs visible | 4 tabs: Requirements, Shortages, Procurement, Analytics | ☐ |
| Material cards display | Each material shows code, description, quantity | ☐ |
| All 5 BOMs represented | Materials from all 5 BOMs visible | ☐ |
| Total items ~37 | Stats show approximately 37 items | ☐ |

### **Screenshot Required**:
- [ ] Stats cards section
- [ ] Material list showing different BOMs
- [ ] At least 3 material cards clearly visible
observation: since test 1 failed, nothing can be seen.
---

## 🧪 **Test Scenario 3: Metro Railway Category Filters**

### **Objective**: Verify category filters show correct Metro Railway categories and filter materials properly

### **Steps**:

1. **Verify Category Filter Bar Displays**
   - Below search bar, should see horizontal scrollable filter bar
   - Should see 6 category chips:
     - 📦 **All** (selected by default - blue background)
     - 🏗️ **Civil** (grey background)
     - ⚡ **OCS** (grey background)
     - 🔌 **Electrical** (grey background)
     - 🚦 **Signaling** (grey background)
     - 🔧 **MEP** (grey background)

2. **Test "All" Category (Default)**
   - Should be selected (colored background)
   - Should show all 37 materials from all categories
   - Count materials visible

3. **Test "Civil" Category Filter**
   - Click: 🏗️ **Civil** chip
   - **Expected**:
     - Civil chip turns brown (#795548)
     - Text turns white
     - List filters to show ONLY Civil materials
     - Should see 7 items from "Station A - Civil Works"

   **Materials Expected**:
   - CIV-CEM-001: Cement OPC 53 Grade
   - CIV-STL-001: TMT Steel Bars 12mm
   - CIV-STL-002: TMT Steel Bars 16mm
   - CIV-AGG-001: Coarse Aggregate 20mm
   - CIV-SND-001: River Sand (M-Sand)
   - CIV-RMC-001: Ready Mix Concrete M40
   - CIV-BLK-001: AAC Blocks

4. **Test "OCS" Category Filter**
   - Click: ⚡ **OCS** chip
   - **Expected**:
     - OCS chip turns orange (#FF9800)
     - Text turns white
     - List filters to show ONLY OCS materials
     - Should see 7 items from "OCS - Section 1"

   **Materials Expected**:
   - OCS-CW-107: Contact Wire Copper 107mm²
   - OCS-CAT-95: Catenary Wire Copper 95mm²
   - OCS-MAST-001: Steel Mast for OCS
   - OCS-CANT-001: Cantilever Assembly
   - OCS-INS-001: Insulator Porcelain 25kV
   - OCS-DROP-001: Dropper Copper Wire
   - OCS-REG-001: Registration Assembly

5. **Test "Electrical" Category Filter**
   - Click: 🔌 **Electrical** chip
   - **Expected**:
     - Electrical chip turns green (#4CAF50)
     - Text turns white
     - List filters to show ONLY Electrical materials
     - Should see 7 items from "Traction Substation"

   **Materials Expected**:
   - ELEC-TRF-001: Traction Transformer 33kV/25kV
   - ELEC-SWG-001: 33kV Gas Insulated Switchgear
   - ELEC-SWG-002: 25kV Vacuum Circuit Breaker
   - ELEC-CBL-001: Power Cable 33kV XLPE
   - ELEC-CBL-002: Power Cable 25kV XLPE
   - ELEC-CTL-001: Control Cable Multicore
   - ELEC-TRY-001: Cable Tray Galvanized Steel

6. **Test "Signaling" Category Filter**
   - Click: 🚦 **Signaling** chip
   - **Expected**:
     - Signaling chip turns red (#F44336)
     - Text turns white
     - List filters to show ONLY Signaling materials
     - Should see 6 items from "Signaling & Telecom"

   **Materials Expected**:
   - SIG-AXL-001: Axle Counter System
   - SIG-CBTC-001: CBTC Wayside Equipment
   - TEL-FO-001: Fiber Optic Cable 12 Core
   - TEL-CCTV-001: IP CCTV Camera 4MP PTZ
   - TEL-PA-001: Public Address System
   - TEL-NET-001: Network Switch 48 Port

7. **Test "MEP" Category Filter**
   - Click: 🔧 **MEP** chip
   - **Expected**:
     - MEP chip turns purple (#9C27B0)
     - Text turns white
     - List filters to show ONLY MEP materials
     - Should see 7 items from "MEP - Station A"

   **Materials Expected**:
   - MEP-HVAC-001: Water Cooled Chiller 500 TR
   - MEP-HVAC-002: Air Handling Unit 25000 CFM
   - MEP-LIFT-001: Passenger Lift 13 Person
   - MEP-ESC-001: Escalator 1000mm Width
   - MEP-FIRE-001: Fire Pump Set Electric+Diesel
   - MEP-FIRE-002: Fire Alarm Control Panel
   - MEP-PSD-001: Platform Screen Doors

8. **Test Switching Between Categories**
   - Click Civil → Should filter to Civil only
   - Click OCS → Should filter to OCS only (Civil deselects)
   - Click All → Should show all materials again
   - Verify only ONE category is selected at a time

### **Expected Results** ✅:

| Check | Expected Behavior | Pass/Fail |
|-------|------------------|-----------|
| Category bar visible | Horizontal scrollable bar with 6 chips | ☐ |
| All categories present | All, Civil, OCS, Electrical, Signaling, MEP | ☐ |
| Icons visible | Each category has correct emoji icon | ☐ |
| All selected by default | "All" chip has blue background initially | ☐ |
| Civil filter works | Shows 7 Civil materials only | ☐ |
| OCS filter works | Shows 7 OCS materials only | ☐ |
| Electrical filter works | Shows 7 Electrical materials only | ☐ |
| Signaling filter works | Shows 6 Signaling materials only | ☐ |
| MEP filter works | Shows 7 MEP materials only | ☐ |
| Color coding works | Each category chip shows correct color when selected | ☐ |
| Single selection | Only one category selected at a time | ☐ |
| Switching works | Can switch between categories smoothly | ☐ |

### **Screenshot Required**:
- [ ] Category filter bar (all chips visible)
- [ ] Civil category selected (brown chip)
- [ ] OCS category selected (orange chip)
- [ ] Electrical category selected (green chip)
- [ ] Signaling category selected (red chip)
- [ ] MEP category selected (purple chip)
observation: since test 1 failed, nothing can be seen.
---

## 🧪 **Test Scenario 4: Search Functionality with Categories**

### **Objective**: Verify search works in combination with category filters

### **Steps**:

1. **Test Search Without Category Filter**
   - Ensure "All" is selected
   - Type in search box: "cement"
   - **Expected**: Shows only Cement OPC 53 Grade (CIV-CEM-001)

2. **Test Search With Civil Category**
   - Select 🏗️ Civil category
   - Type in search box: "steel"
   - **Expected**: Shows 2 items:
     - CIV-STL-001: TMT Steel Bars 12mm
     - CIV-STL-002: TMT Steel Bars 16mm
   - Should NOT show Steel Mast (that's OCS category)

3. **Test Search With OCS Category**
   - Select ⚡ OCS category
   - Type in search box: "wire"
   - **Expected**: Shows 3 items:
     - OCS-CW-107: Contact Wire
     - OCS-CAT-95: Catenary Wire
     - OCS-DROP-001: Dropper Wire

4. **Test Search With No Results**
   - Select 🏗️ Civil category
   - Type in search box: "transformer"
   - **Expected**: Shows empty state "No Matches Found"
   - Click "All" category → Should show transformer (from Electrical)

5. **Test Clear Search**
   - Search for "cable"
   - Clear search box
   - **Expected**: Shows all materials for selected category

### **Expected Results** ✅:

| Check | Expected Behavior | Pass/Fail |
|-------|------------------|-----------|
| Search without filter works | Shows matching items from all categories | ☐ |
| Search with Civil filter works | Shows only matching Civil items | ☐ |
| Search with OCS filter works | Shows only matching OCS items | ☐ |
| No results message shows | "No Matches Found" when search has no results | ☐ |
| Clear search works | Clearing search shows all items again | ☐ |

### **Screenshot Required**:
- [ ] Search "cement" results
- [ ] Search "steel" with Civil filter
- [ ] No matches found state
observation: since test 1 failed, nothing can be seen.
---

## 🧪 **Test Scenario 5: Data Persistence & Refresh**

### **Objective**: Verify loaded BOMs persist across navigation

### **Steps**:

1. **Load Sample BOMs**
   - Load sample Metro Railway BOMs

2. **Navigate Away and Back**
   - Navigate to: Logistics → Dashboard
   - Navigate back to: Material Tracking
   - **Expected**: BOMs still loaded, don't need to reload

3. **Refresh Screen**
   - Pull down to refresh (if supported)
   - OR: Select different project, then select original project
   - **Expected**: BOMs remain loaded

4. **Check Console for Logs**
   - Open browser/React Native debugger console
   - Look for: `[BomDataService] Created X mock BOMs in database`
   - Should see this message ONLY on first load

### **Expected Results** ✅:

| Check | Expected Behavior | Pass/Fail |
|-------|------------------|-----------|
| BOMs persist after navigation | Don't need to reload when returning to screen | ☐ |
| Console shows creation log | First load shows "Created X mock BOMs" | ☐ |
| No duplicate creation | Subsequent loads don't create duplicates | ☐ |
observation: since test 1 failed, nothing can be seen.
---

## 🧪 **Test Scenario 6: View Mode Tabs**

### **Objective**: Verify all view mode tabs work correctly

### **Steps**:

1. **Test Requirements Tab** (Default)
   - Should be active on load
   - Shows all material requirements
   - Category filters work

2. **Test Shortages Tab**
   - Click: **Shortages** tab
   - **Expected**: Shows materials with shortages
   - Category filters should still work
   - Badge shows shortage count

3. **Test Procurement Tab**
   - Click: **Procurement** tab
   - **Expected**: Shows purchase suggestions
   - Should see cards with "Compare Suppliers" buttons

4. **Test Analytics Tab**
   - Click: **Analytics** tab
   - **Expected**: Shows consumption analytics
   - May show "Coming Soon" or analytics data

### **Expected Results** ✅:

| Check | Expected Behavior | Pass/Fail |
|-------|------------------|-----------|
| Requirements tab works | Shows all materials, categories filter | ☐ |
| Shortages tab works | Shows shortage materials | ☐ |
| Procurement tab works | Shows purchase suggestions | ☐ |
| Analytics tab accessible | Tab can be clicked | ☐ |
| Tab badges show counts | Each tab shows relevant counts | ☐ |
observation: since test 1 failed, nothing can be seen.
---

## 🧪 **Test Scenario 7: Error Handling**

### **Objective**: Verify graceful error handling

### **Steps**:

1. **Test Load Sample Data Multiple Times**
   - Load sample BOMs
   - Click "Load Sample BOMs" button again (if visible)
   - **Expected**:
     - Should not create duplicates
     - OR: Button should be hidden after first load

2. **Test with No Project Selected**
   - Clear project selection (if possible)
   - **Expected**: Shows appropriate message

3. **Check for Console Errors**
   - Monitor console throughout testing
   - **Expected**: No JavaScript errors or warnings

### **Expected Results** ✅:

| Check | Expected Behavior | Pass/Fail |
|-------|------------------|-----------|
| No duplicate BOMs created | Loading twice doesn't duplicate data | ☐ |
| Handles no project | Appropriate message when no project | ☐ |
| No console errors | Clean console, no red errors | ☐ |
observation: since test 1 failed, nothing can be seen.
---

## 📊 **Test Summary Report**

### **Overall Results**

| Test Scenario | Total Checks | Passed | Failed | Notes |
|---------------|--------------|--------|--------|-------|
| 1. Empty State & Load Data | 6 | ☐ | ☐ | |
| 2. BOM Data Display | 5 | ☐ | ☐ | |
| 3. Category Filters | 12 | ☐ | ☐ | |
| 4. Search with Categories | 5 | ☐ | ☐ | |
| 5. Data Persistence | 3 | ☐ | ☐ | |
| 6. View Mode Tabs | 5 | ☐ | ☐ | |
| 7. Error Handling | 3 | ☐ | ☐ | |
| **TOTAL** | **39** | **☐** | **☐** | |

### **Pass Criteria**:
- ✅ **All tests pass**: Ready for Phase 2 implementation
- ⚠️ **Minor issues** (1-3 fails): Document issues, continue with fixes
- ❌ **Major issues** (4+ fails): Need debugging before Phase 2

---

## 🐛 **Issue Tracking**

If any test fails, document here:

| Test # | Issue Description | Severity | Screenshot | Fix Required |
|--------|------------------|----------|------------|--------------|
| 1 | Load Sample BOMs button not working - no data loads | High | ☐ | **FIXED** |

### **Issue #1: Load Sample BOMs Not Working + Empty State Not Showing**

**Problem Identified (6th Nov 2025)**:

**First Issue Report**:
- The "Load Sample Metro Railway BOMs" button showed only a flicker without loading spinner
- Screen didn't refresh with BOMs loaded after clicking
- All subsequent test scenarios failed because no data was available

**Second Issue Report (After First Fix)**:
- Empty state never appears - can't see the "Load Sample BOMs" button at all
- Screen shows "Material Tracking" twice (header issue)
- Mock data appears to auto-load without button click

**Root Causes**:

1. **ProjectId Mismatch** (Issue #1):
   - Mock BOMs hardcoded with `projectId: 'project_1'`
   - Actual projects have different UUIDs
   - Filtering logic resulted in zero BOMs created

2. **Auto-Loading in Development** (Issue #2):
   - `BomDataService.getBoms()` had condition: `|| __DEV__`
   - This ALWAYS auto-loaded mock data in development mode
   - Users never saw empty state because data loaded automatically
   - Button became useless since data already appeared

**Complete Fix Applied**:

1. **Fixed ProjectId Mismatch** (src/services/BomDataService.ts:82-190):
   - Removed projectId filtering that prevented BOMs from loading
   - Now uses ALL mock BOMs regardless of hardcoded projectId
   - Overrides mock projectId with actual `selectedProjectId` during creation
   - Generates unique IDs using timestamp + indices to avoid conflicts

2. **Implemented Dual-Mode System** (NEW):
   - Created `src/config/AppMode.ts` for mode management
   - **Demo Mode**: For testing - shows "Load Sample BOMs" button, no auto-loading
   - **Production Mode**: For real projects - loads BOMs created by PM automatically
   - Mode indicator badge in UI (🧪 DEMO / 🏗️ PROD)

3. **Updated BomDataService** (src/services/BomDataService.ts:28-70):
   - Removed `|| __DEV__` auto-loading logic
   - Respects app mode for behavior
   - Demo Mode: Returns empty array to show empty state
   - Production Mode: Loads real BOMs from database

4. **Enhanced MaterialTrackingScreen** (src/logistics/MaterialTrackingScreen.tsx):
   - Added mode state tracking
   - Mode indicator badge in header (development only)
   - Different empty states for each mode:
     - **Demo Mode**: Shows "Load Sample BOMs" button
     - **Production Mode**: Shows "Contact PM" message
   - Mode toggle functionality
   - Improved timing with explicit Promise typing

**Key Changes**:

```typescript
// BEFORE: Auto-loaded in dev mode (problematic)
if ((bomsList.length === 0 && useMockData) || __DEV__) {
  return await this.loadMockBoms(projectId);
}

// AFTER: Mode-based behavior
const mode = AppMode.getMode();
if (bomsList.length === 0) {
  if (mode === 'demo') {
    // Show empty state, wait for button click
    return [];
  }
  // Production mode: return empty (PM should create BOMs)
  return [];
}
```

**Expected After Complete Fix**:

✅ **Demo Mode** (Testing):
- App starts in Demo Mode by default (development)
- Mode indicator shows **🧪 DEMO** badge (orange)
- Empty state shows properly with all elements
- "Load Sample BOMs" button is visible and functional
- Button click loads 5 BOMs with 37 materials
- Loading spinner shows for ~1 second
- Stats cards and filters become active

✅ **Production Mode** (Real Usage):
- Mode indicator shows **🏗️ PROD** badge (green)
- Empty state shows "Contact PM" message
- No "Load Sample BOMs" button
- Real BOMs created by PM auto-load
- Seamless data flow PM → Logistics

**Files Created/Modified**:
- ✅ **NEW**: `src/config/AppMode.ts` (Mode management)
- ✅ **MODIFIED**: `src/services/BomDataService.ts` (Mode-based loading)
- ✅ **MODIFIED**: `src/logistics/MaterialTrackingScreen.tsx` (Dual-mode UI)
- ✅ **NEW**: `docs/.../Dual_Mode_System_Guide.md` (Complete guide)

**Documentation**:
📖 See [Dual Mode System Guide](./Dual_Mode_System_Guide.md) for complete details

**Status**: ✅ **FULLY FIXED** - Ready for re-testing with Demo Mode enabled

all tests of scenario passed except of loading the BOM, as a result no other could be performed.

---

## ✅ **Sign-Off**

**Tester**: Utpal________________
**Date**: 6th Nov 25________________
**Overall Status**: PASS / FAIL / CONDITIONAL PASS
Fail
**Notes**:
```
[Add any additional observations, performance notes, or recommendations]
```

---

## 📝 **Next Steps After Testing**

### **If Tests Pass**:
1. ✅ Mark Phase 1 Tasks 1-4 as complete
2. 🚀 Proceed to Task 5: Update Logistics Dashboard
3. 📋 Continue with remaining Phase 1 tasks

### **If Tests Fail**:
1. 🐛 Document all failures in Issue Tracking section
2. 🔧 Fix critical issues first
3. 🔄 Re-test failed scenarios
4. ✅ Sign-off when all tests pass

---

**Document Version**: 1.0
**Created**: November 2025
**Status**: Ready for Testing
**Features Under Test**: Mock BOMs, Empty State, Category Filters
