# Logistics Role Testing Procedure
**Activity 4.5: Logistics Role Development**
**Version**: 2.4
**Date**: November 9, 2025
**Branch**: feature/v2.4-logistics

---

## Overview

This document provides a comprehensive testing procedure for the Logistics role, covering all implemented features across 5 tabs. The goal is to ensure error-free, user-friendly functionality before merging to main.

**Testing Scope:**
- ✅ Phase 1: TypeScript Compliance & Core Functionality
- ✅ Phase 2: Dual-Mode System (Demo/Production)
- ✅ Phase 3: All 5 Logistics Tabs
- ✅ BOM Integration
- ✅ Context State Management
- ✅ User Experience & Error Handling

---

## Pre-Testing Setup

### 1. Build & Launch
```bash
# Ensure you're on the correct branch
git checkout feature/v2.4-logistics

# Clean build (recommended)
cd android
./gradlew clean
cd ..

# Start Metro bundler
npm start -- --reset-cache

# Build and run on Android
npx react-native run-android
```

### 2. Login Credentials
Use any existing user with **Logistics** role:
- Username: (any logistics user)
- Password: (their password)

If no logistics user exists, use Admin role to:
1. Navigate to Admin → User Management
2. Create a new user with role = "logistics"
3. Logout and login with the new logistics user

### 3. Test Data Prerequisites
- **Projects**: At least 1 project should exist in the database
- **BOMs**: Can start with empty state (we'll test BOM loading)
- **Materials**: Will be auto-generated from BOMs

---

## Test Suite

## 📱 TEST 1: App Launch & Initial State

### 1.1 Login as Logistics User
**Steps:**
1. Launch the app
2. Login with logistics user credentials
3. Observe navigation

**Expected Results:**
- ✅ App successfully navigates to Logistics Navigator
- ✅ Bottom tab bar shows 5 tabs: Dashboard, Materials, Equipment, Delivery, Inventory
- ✅ Tab icons visible: 📊 📦 🔧 📦 📦
- ✅ Header shows "Logout" button on the right
- ✅ Role switcher visible in header
- ✅ Default tab is "Dashboard"

**Pass/Fail:** ______

---

## 📊 TEST 2: Dashboard Tab - Overview

### 2.1 Dashboard Initial Load
**Steps:**
1. Ensure you're on the Dashboard tab
2. Observe the screen content

**Expected Results:**
- ✅ Header shows "Logistics Dashboard" with subtitle "Executive Overview & Performance"
- ✅ Project selector visible (if projects exist)
- ✅ KPI cards displayed in horizontal scroll:
  - Materials Tracked
  - Procurement Cycle
  - Total Equipment
  - On-Time Delivery
  - Inventory Value
  - Stock Accuracy
- ✅ Sections visible:
  - Critical Alerts (may show "No critical alerts")
  - Pending Actions (may show "No pending actions")
- ✅ No crashes or errors

**Pass/Fail:** ______

### 2.2 Project Selection
**Steps:**
1. If multiple projects exist, tap a different project chip
2. Observe data refresh

**Expected Results:**
- ✅ Selected project chip highlights with blue border
- ✅ KPIs update for selected project
- ✅ Smooth transition, no lag

**Pass/Fail:** ______

### 2.3 Pull to Refresh
**Steps:**
1. Pull down on the Dashboard screen
2. Release to trigger refresh

**Expected Results:**
- ✅ Refresh indicator appears
- ✅ Data reloads
- ✅ Refresh indicator disappears
- ✅ No errors

**Pass/Fail:** ______

---

## 🚚 TEST 3: Material Tracking Tab - BOM Integration

### 3.1 Navigate to Material Tracking
**Steps:**
1. Tap "Materials" tab (2nd tab)
2. Observe the screen

**Expected Results:**
- ✅ Header shows "Material Tracking" with subtitle "BOM Requirements & Intelligent Procurement"
- ✅ Project selector visible
- ✅ Screen loads without errors

**Pass/Fail:** ______

### 3.2 Empty State - Demo Mode (Development Build Only)
**Steps:**
1. If no BOMs exist yet, observe empty state
2. Check for mode indicator in top-right (dev builds only)

**Expected Results:**
- ✅ Empty state shows appropriate icon (📦 or 🏗️)
- ✅ Empty state title: "No BOMs Found"
- ✅ Empty state description visible
- ✅ **IF __DEV__ = true**: Mode indicator badge visible (🧪 DEMO or 🏗️ PROD)
- ✅ **IF Demo Mode**: "Load Sample Metro Railway BOMs" button visible
- ✅ **IF Production Mode**: Message "Contact your Project Manager to create BOMs"

**Pass/Fail:** ______

### 3.3 Load Sample BOMs (Demo Mode Only)
**Prerequisites:** App in Demo Mode (dev builds only)

**Steps:**
1. Select a project from dropdown
2. Tap "📊 Load Sample Metro Railway BOMs" button
3. Wait for loading to complete (spinner should appear)
4. Observe the loaded data

**Expected Results:**
- ✅ Loading spinner appears on button
- ✅ Console logs show BOM loading progress (check Metro logs)
- ✅ After 1-2 seconds, BOMs appear
- ✅ Sample BOMs loaded:
  - Civil Works BOM
  - OCS Installation BOM
  - Traction Substation BOM
  - Signaling System BOM
  - MEP Systems BOM
- ✅ BOM cards show:
  - BOM name
  - Item count (e.g., "8 items")
  - Total cost (₹ format)
  - Status badge
- ✅ No errors or crashes

**Pass/Fail:** ______

### 3.4 BOM Card Interaction
**Prerequisites:** BOMs loaded from previous test

**Steps:**
1. Tap on a BOM card to expand/collapse
2. Observe BOM items list
3. Check item details

**Expected Results:**
- ✅ Tapping BOM card toggles expansion
- ✅ Expanded view shows all BOM items
- ✅ Each item shows:
  - Item code (e.g., MAT-001)
  - Description
  - Quantity with unit
  - Unit cost and total cost
  - Status indicator (🟢 Sufficient, 🟡 Shortage, 🔴 Critical, 🔵 Surplus)
- ✅ Smooth animation
- ✅ Multiple BOMs can be expanded simultaneously

**Pass/Fail:** ______

### 3.5 Material Requirements Calculation
**Steps:**
1. Scroll to "Material Requirements" section
2. Observe requirement cards
3. Check calculations

**Expected Results:**
- ✅ Requirements aggregated across all BOMs
- ✅ Each requirement shows:
  - Material code and description
  - Required quantity
  - Available quantity
  - Shortage/surplus amount
  - Availability percentage
  - Status badge with color coding
- ✅ Sorted by shortage (critical items first)
- ✅ Calculations are accurate

**Pass/Fail:** ______

### 3.6 Procurement Recommendations
**Steps:**
1. Scroll to "Procurement Recommendations" section
2. Check for intelligent suggestions

**Expected Results:**
- ✅ Recommendations shown for materials with shortages
- ✅ Each recommendation shows:
  - Material code and description
  - Recommended quantity (with 10% buffer)
  - Urgency level (critical/high)
  - Reason for procurement
  - Estimated cost
  - Affected BOMs list
- ✅ Sorted by urgency (critical first)
- ✅ "View Details" buttons visible

**Pass/Fail:** ______

### 3.7 Category Filter (If Implemented)
**Steps:**
1. Look for category filter chips
2. Tap a category (e.g., "Material", "Labor")
3. Observe filtering

**Expected Results:**
- ✅ Filter chips visible
- ✅ Tapping filter updates displayed items
- ✅ Clear filter option available
- ✅ Item count updates

**Pass/Fail:** ______ (or N/A if not implemented)

### 3.8 Search Functionality (If Implemented)
**Steps:**
1. Locate search bar
2. Type a material code or description
3. Observe real-time filtering

**Expected Results:**
- ✅ Search bar visible
- ✅ Results filter as you type
- ✅ Clear button (×) appears
- ✅ "No results" message if no matches

**Pass/Fail:** ______ (or N/A if not implemented)

---

## 🧪 TEST 4: Dual-Mode System (Dev Builds Only)

**Note:** This test only applies to development builds where `__DEV__` = true

### 4.1 Mode Indicator Visibility
**Steps:**
1. Go to Material Tracking tab
2. Look at top-right corner of header
3. Check for mode indicator and Clear button

**Expected Results:**
- ✅ Mode indicator badge visible (🧪 DEMO or 🏗️ PROD)
- ✅ Clear button visible (🗑️ Clear)
- ✅ Badges are styled with appropriate colors:
  - Demo: Orange border/background
  - Production: Green border/background

**Pass/Fail:** ______ (or N/A if production build)

### 4.2 Mode Toggle
**Steps:**
1. Tap the mode indicator badge
2. Observe mode change
3. Check console logs

**Expected Results:**
- ✅ Mode toggles (DEMO ↔ PROD)
- ✅ Badge updates immediately
- ✅ Console log shows: "[MaterialTracking] Switched to demo/production mode"
- ✅ Screen refreshes to apply new mode
- ✅ Empty state message changes based on mode

**Pass/Fail:** ______ (or N/A if production build)

### 4.3 Clear BOMs Function
**Prerequisites:** BOMs loaded

**Steps:**
1. Tap "🗑️ Clear" button
2. Wait for operation to complete
3. Observe screen state

**Expected Results:**
- ✅ Loading state appears briefly
- ✅ Console logs show:
  - "[MaterialTracking] Clearing all BOMs..."
  - "[ClearBoms] Deleted X BOMs"
  - "[ClearBoms] ✅ All BOMs cleared successfully!"
- ✅ BOMs disappear from screen
- ✅ Empty state reappears
- ✅ No errors or crashes

**Pass/Fail:** ______ (or N/A if production build)

### 4.4 Reload After Clear
**Steps:**
1. After clearing, tap "Load Sample BOMs" again
2. Verify BOMs reload correctly

**Expected Results:**
- ✅ BOMs load successfully
- ✅ Same 5 sample BOMs appear
- ✅ All data intact

**Pass/Fail:** ______ (or N/A if production build)

---

## 🔧 TEST 5: Equipment Management Tab

### 5.1 Navigate to Equipment Tab
**Steps:**
1. Tap "Equipment" tab (3rd tab)
2. Observe screen load

**Expected Results:**
- ✅ Header shows "Equipment Management"
- ✅ Screen loads without errors
- ✅ View mode tabs visible (Overview, Maintenance, Allocation, Performance)
- ✅ Status filter chips visible
- ✅ Search bar visible

**Pass/Fail:** ______

### 5.2 Equipment Overview
**Steps:**
1. Stay on "Overview" view
2. Scroll through equipment list
3. Observe equipment cards

**Expected Results:**
- ✅ Equipment items displayed (mock data)
- ✅ Each card shows:
  - Equipment name
  - Equipment type
  - Status badge (Active, Maintenance, Idle, Out of Service)
  - Location
  - Utilization metrics
- ✅ Status color coding:
  - 🟢 Active (green)
  - 🟡 Maintenance (orange)
  - ⚫ Idle (gray)
  - 🔴 Out of Service (red)

**Pass/Fail:** ______

### 5.3 Equipment Details Modal
**Steps:**
1. Tap on an equipment card
2. Observe details modal
3. Tap outside or close button

**Expected Results:**
- ✅ Modal appears with equipment details
- ✅ Shows complete information (specs, maintenance history, etc.)
- ✅ Modal closes smoothly
- ✅ No UI glitches

**Pass/Fail:** ______

### 5.4 Status Filter
**Steps:**
1. Tap "Active" status filter
2. Observe filtered results
3. Tap "All" to reset

**Expected Results:**
- ✅ Only active equipment shown
- ✅ Filter chip highlights
- ✅ Reset works correctly
- ✅ Smooth filtering

**Pass/Fail:** ______

### 5.5 Maintenance View
**Steps:**
1. Tap "Maintenance" view mode tab
2. Observe maintenance schedule

**Expected Results:**
- ✅ View switches to maintenance schedule
- ✅ Upcoming maintenance items shown
- ✅ Preventive maintenance alerts visible
- ✅ Date-based organization

**Pass/Fail:** ______

---

## 📦 TEST 6: Delivery Scheduling Tab

### 6.1 Navigate to Delivery Tab
**Steps:**
1. Tap "Delivery" tab (4th tab)
2. Observe screen load

**Expected Results:**
- ✅ Header shows "Delivery Scheduling"
- ✅ View mode tabs visible (Schedule, Tracking, Routes, Performance)
- ✅ Status filters visible
- ✅ Screen loads without errors

**Pass/Fail:** ______

### 6.2 Delivery Schedule View
**Steps:**
1. Stay on "Schedule" view
2. Scroll through deliveries
3. Check delivery cards

**Expected Results:**
- ✅ Delivery schedule items displayed (mock data)
- ✅ Each card shows:
  - Delivery ID
  - Material/item description
  - Scheduled date
  - Status badge
  - Priority indicator
- ✅ Status color coding (Scheduled, In Transit, Delivered, Delayed)

**Pass/Fail:** ______

### 6.3 Delivery Details
**Steps:**
1. Tap on a delivery card
2. Check details modal
3. Close modal

**Expected Results:**
- ✅ Modal shows full delivery details
- ✅ Information includes: supplier, route, timeline, site readiness
- ✅ Modal closes properly

**Pass/Fail:** ______

### 6.4 Route Optimization View
**Steps:**
1. Switch to "Routes" view
2. Observe route data

**Expected Results:**
- ✅ Route optimization data displayed
- ✅ Route efficiency metrics shown
- ✅ Map or route visualization (if implemented)

**Pass/Fail:** ______

### 6.5 Performance Analytics
**Steps:**
1. Switch to "Performance" view
2. Check analytics

**Expected Results:**
- ✅ Performance metrics displayed
- ✅ On-time delivery rate shown
- ✅ Charts/graphs visible (if implemented)

**Pass/Fail:** ______

---

## 📊 TEST 7: Inventory Management Tab

### 7.1 Navigate to Inventory Tab
**Steps:**
1. Tap "Inventory" tab (5th tab - rightmost)
2. Observe screen load

**Expected Results:**
- ✅ Header shows "Inventory Management"
- ✅ View mode tabs visible (Overview, Locations, Transfers, Analytics)
- ✅ Filters visible (Status, Location, ABC Category)
- ✅ Screen loads without errors

**Pass/Fail:** ______

### 7.2 Inventory Overview
**Steps:**
1. Stay on "Overview" view
2. Scroll through inventory items
3. Check item cards

**Expected Results:**
- ✅ Inventory items displayed (mock data)
- ✅ Each card shows:
  - Material ID and name
  - Current stock quantity
  - Location
  - Stock status
  - Reorder point indicator
- ✅ Status badges (In Stock, Low Stock, Out of Stock, Overstocked)

**Pass/Fail:** ______

### 7.3 ABC Analysis Filter
**Steps:**
1. Tap ABC filter dropdown
2. Select "Category A" (high-value items)
3. Observe filtering

**Expected Results:**
- ✅ Only Category A items shown
- ✅ Filter updates immediately
- ✅ Can reset to "All"

**Pass/Fail:** ______

### 7.4 Multi-Location View
**Steps:**
1. Switch to "Locations" view
2. Observe location-based inventory

**Expected Results:**
- ✅ Inventory grouped by location
- ✅ Location cards/sections visible
- ✅ Stock levels per location shown

**Pass/Fail:** ______

### 7.5 Stock Transfers
**Steps:**
1. Switch to "Transfers" view
2. Check transfer records

**Expected Results:**
- ✅ Transfer history displayed
- ✅ Shows: from-location, to-location, quantity, date, status
- ✅ Pending transfers highlighted

**Pass/Fail:** ______

### 7.6 Analytics View
**Steps:**
1. Switch to "Analytics" view
2. Check inventory health metrics

**Expected Results:**
- ✅ Analytics dashboard displayed
- ✅ Metrics shown: inventory turnover, stock accuracy, etc.
- ✅ Visualizations (if implemented)

**Pass/Fail:** ______

---

## 🔄 TEST 8: Context & State Management

### 8.1 Cross-Tab State Persistence
**Steps:**
1. Select a project on Dashboard tab
2. Switch to Material Tracking tab
3. Verify project selection persists
4. Switch to Equipment tab
5. Verify same project still selected

**Expected Results:**
- ✅ Selected project persists across all tabs
- ✅ No need to reselect project on each tab
- ✅ Context state working correctly

**Pass/Fail:** ______

### 8.2 Data Refresh Synchronization
**Steps:**
1. On Dashboard, note the KPI values
2. Go to Material Tracking and load BOMs
3. Return to Dashboard
4. Check if KPIs updated

**Expected Results:**
- ✅ KPIs reflect the newly loaded BOMs
- ✅ "Materials Tracked" count increased
- ✅ Data synchronization working

**Pass/Fail:** ______

---

## 🎨 TEST 9: User Experience & UI/UX

### 9.1 Navigation Smoothness
**Steps:**
1. Rapidly switch between all 5 tabs
2. Scroll through each screen
3. Observe performance

**Expected Results:**
- ✅ Tab switches are instant (<100ms)
- ✅ No lag or stuttering
- ✅ Smooth scroll performance
- ✅ No flickering or visual glitches

**Pass/Fail:** ______

### 9.2 Touch Targets & Accessibility
**Steps:**
1. Try tapping all interactive elements
2. Check button sizes
3. Verify text readability

**Expected Results:**
- ✅ All buttons/chips easily tappable (min 44x44 pts)
- ✅ Text is readable (font sizes appropriate)
- ✅ Good contrast ratios
- ✅ No overlapping touch targets

**Pass/Fail:** ______

### 9.3 Error Handling
**Steps:**
1. Try loading BOMs with no project selected
2. Observe error handling

**Expected Results:**
- ✅ Graceful error handling (no crashes)
- ✅ User-friendly error messages
- ✅ Console warnings logged appropriately

**Pass/Fail:** ______

### 9.4 Loading States
**Steps:**
1. Observe loading indicators during data operations
2. Check spinner visibility during BOM load

**Expected Results:**
- ✅ Loading spinners appear during async operations
- ✅ Spinners disappear when complete
- ✅ No infinite spinners
- ✅ Clear visual feedback

**Pass/Fail:** ______

### 9.5 Empty States
**Steps:**
1. Check empty states on all tabs (if applicable)
2. Verify messages are helpful

**Expected Results:**
- ✅ Empty states have appropriate icons
- ✅ Messages are clear and actionable
- ✅ Guidance provided for next steps

**Pass/Fail:** ______

---

## 🔒 TEST 10: Role & Navigation Security

### 10.1 Role Switcher
**Steps:**
1. Tap role switcher in header
2. Switch to different role (e.g., Manager)
3. Verify navigation change
4. Switch back to Logistics

**Expected Results:**
- ✅ Role switcher modal appears
- ✅ Can switch to other roles
- ✅ Screen resets to appropriate role navigator
- ✅ No data corruption

**Pass/Fail:** ______

### 10.2 Logout Functionality
**Steps:**
1. Tap "Logout" button in header
2. Confirm logout
3. Verify return to login screen

**Expected Results:**
- ✅ Logout confirmation appears (if implemented)
- ✅ Successfully logs out
- ✅ Returns to login screen
- ✅ Session cleared

**Pass/Fail:** ______

---

## 📝 TEST 11: TypeScript & Code Quality

### 11.1 TypeScript Compilation
**Steps:**
1. Run TypeScript check in terminal:
   ```bash
   npx tsc --noEmit 2>&1 | grep "src/logistics" | head -30
   ```

**Expected Results:**
- ✅ No TypeScript errors in main Logistics files:
  - LogisticsDashboardScreen.tsx
  - MaterialTrackingScreen.tsx
  - EquipmentManagementScreen.tsx
  - DeliverySchedulingScreen.tsx
  - InventoryManagementScreen.tsx
  - LogisticsContext.tsx
- ⚠️ Backup files may have errors (acceptable)

**Pass/Fail:** ______

### 11.2 Console Logs - No Errors
**Steps:**
1. Open Metro bundler terminal
2. Navigate through all Logistics tabs
3. Check for errors in console

**Expected Results:**
- ✅ No red error messages
- ✅ Only informational logs (blue/gray)
- ⚠️ Yellow warnings acceptable (React Native system warnings)
- ✅ No undefined/null reference errors

**Pass/Fail:** ______

---

## 🧪 TEST 12: Integration with Manager Role

### 12.1 BOM Creation in Manager Role
**Steps:**
1. Switch to Manager role
2. Go to BOM Management tab
3. Create a new BOM (Post-Contract type)
4. Add some items to the BOM
5. Set status to "Active"
6. Switch back to Logistics role

**Expected Results:**
- ✅ BOM creation successful in Manager role
- ✅ Items added successfully
- ✅ BOM saved to database

**Pass/Fail:** ______

### 12.2 BOM Visibility in Logistics
**Steps:**
1. In Logistics role, go to Material Tracking tab
2. Select the same project
3. Check if the newly created BOM appears

**Expected Results:**
- ✅ BOM created by Manager appears in Logistics
- ✅ All items visible
- ✅ Material requirements calculated correctly
- ✅ Cross-role integration working

**Pass/Fail:** ______

---

## 📊 TEST RESULTS SUMMARY

### Overall Statistics
- **Total Tests**: ___ / ___
- **Passed**: ___
- **Failed**: ___
- **N/A**: ___
- **Success Rate**: ___%

### Critical Issues Found
List any critical bugs that block functionality:
1.
2.
3.

### Minor Issues Found
List any minor UX issues or improvements:
1.
2.
3.

### Recommendations
- [ ] Ready to merge to main
- [ ] Needs fixes before merge
- [ ] Requires additional testing

---

## 🚀 Sign-Off

**Tested By**: ________________
**Date**: ________________
**Build Version**: v2.4
**Branch**: feature/v2.4-logistics
**Device/Emulator**: ________________
**Android Version**: ________________

**Notes**:
_____________________________________________
_____________________________________________
_____________________________________________

---

## Appendix: Common Issues & Solutions

### Issue 1: App Crashes on Logistics Tab
**Solution**: Check Metro logs for stack trace. Likely a TypeScript error or missing import.

### Issue 2: BOMs Not Loading
**Solution**:
1. Check project selection (must select a project first)
2. Verify in Demo mode (production mode doesn't show load button)
3. Check Metro logs for BOM loading errors

### Issue 3: Mode Toggle Not Visible
**Solution**: Mode toggle only appears in development builds (`__DEV__ = true`). Production builds won't show it.

### Issue 4: Context State Not Persisting
**Solution**: Check LogisticsProvider wraps all tabs in LogisticsNavigator.tsx

### Issue 5: Mock Data Not Appearing (Equipment/Delivery/Inventory)
**Solution**: Mock data loads automatically. Check service files are importing correctly.

---

**End of Testing Procedure**
