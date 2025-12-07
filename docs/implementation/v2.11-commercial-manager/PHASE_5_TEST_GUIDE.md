# Phase 5 (v2.11) - Commercial Manager Role - Testing Guide

**Version**: v2.11
**Date**: December 5, 2025
**Purpose**: Comprehensive testing guide for Commercial Manager role implementation
**Estimated Time**: 30-45 minutes

---

## Table of Contents

1. [Pre-Testing Setup](#pre-testing-setup)
2. [Test 1: Authentication & Navigation](#test-1-authentication--navigation)
3. [Test 2: Budget Management](#test-2-budget-management)
4. [Test 3: Cost Tracking](#test-3-cost-tracking)
5. [Test 4: Invoice Management](#test-4-invoice-management)
6. [Test 5: Financial Reports](#test-5-financial-reports)
7. [Test 6: Commercial Dashboard](#test-6-commercial-dashboard)
8. [Test 7: Data Integrity & Calculations](#test-7-data-integrity--calculations)
9. [Test 8: Context & Navigation](#test-8-context--navigation)
10. [Final Checklist](#final-checklist)

---

## Pre-Testing Setup

### Required Test Credentials
```
Username: commercial
Password: Password@2025
```

### Test Data Requirements
- At least 1 active project with budget data
- At least 1 vendor in the system
- Access to the app on Android or iOS device/emulator

### Expected Outcomes
- ✅ All CRUD operations work correctly
- ✅ Calculations are accurate
- ✅ Data aggregation from multiple tables works
- ✅ No TypeScript or runtime errors
- ✅ Smooth navigation between all screens
- ✅ Project context isolation works correctly

---

## Test 1: Authentication & Navigation

### Objective
Verify that Commercial Manager role authentication and navigation work correctly.

### Steps

1. **Login as Commercial Manager**
   ```
   1. Open the app
   2. Enter username: commercial
   3. Enter password: Password@2025
   4. Tap "Login"
   ```

   **Expected Result**: ✅
   - Login successful
   - Navigates to Commercial Dashboard
   - Bottom navigation shows 5 tabs:
     * 📊 Dashboard
     * 💰 Budget
     * 💵 Costs
     * 📄 Invoices
     * 📈 Reports

2. **Verify Tab Navigation**
   ```
   1. Tap each bottom tab (Dashboard, Budget, Costs, Invoices, Reports)
   2. Navigate back to Dashboard
   3. Use device back button to verify navigation stack
   ```

   **Expected Result**: ✅
   - All tabs are accessible
   - Each screen loads without errors
   - Project name displayed in header (if project assigned)
   - Back button navigates correctly

3. **Verify Role Isolation**
   ```
   1. Check that you CANNOT access:
      - Supervisor screens
      - Manager screens
      - Planning screens
      - Logistics screens
   ```

   **Expected Result**: ✅
   - Only Commercial Manager screens are accessible
   - No unauthorized navigation options visible

**Test 1 Result**: ⬜ PASS / ⬜ FAIL
**Notes**: All passed, Project isolation is not there, commercial manager not assigned this project able to see the details of sample project.___________________________________

---

## Test 2: Budget Management

### Objective
Test Budget Management screen with full CRUD operations and variance tracking.

### 2.1 View Budget List

**Steps:**
```
1. From Dashboard, tap "Budget" tab
2. Observe the budget list
```

**Expected Result**: ✅
- Screen displays "Budget Management" title
- Project name shown in header
- Budget cards displayed with:
  * Category label (Labor/Materials/Equipment/Other)
  * Allocated amount
  * Actual spent amount
  * Variance (positive in green, negative in red)
  * Variance percentage
- FAB (Floating Action Button) "+" visible at bottom right
- Search bar at top
- Category filter chips below search

**Result**: ⬜ PASS / ⬜ FAIL
Observeation:- Ok

### 2.2 Create New Budget

**Steps:**
```
1. Tap FAB "+" button
2. Fill in the form:
   - Category: Select "Labor"
   - Description: "Site Labor Budget Q1"
   - Allocated Amount: 50000
3. Tap "Create Budget"
```

**Expected Result**: ✅
- Dialog closes
- Success snackbar appears
- New budget card appears in list
- Budget shows:
  * Category: Labor
  * Description: "Site Labor Budget Q1"
  * Allocated: $50,000
  * Actual: $0 (initially)
  * Variance: $50,000 (green)

**Result**: ⬜ PASS / ⬜ FAIL
Observeation:- Ok

### 2.3 Search & Filter

**Steps:**
```
1. Tap search bar
2. Type "Labor"
3. Observe filtered results
4. Clear search
5. Tap "Labor" category chip
6. Observe category filter
```

**Expected Result**: ✅
- Search filters budgets by description
- Category filter shows only Labor budgets
- Filtered count displayed
- Clearing filters shows all budgets

**Result**: ⬜ PASS / ⬜ FAIL
Observeation:- Ok

### 2.4 Edit Budget

**Steps:**
```
1. Long-press on the Labor budget card
2. Select "Edit" from context menu
3. Change Allocated Amount to 60000
4. Tap "Update Budget"
```

**Expected Result**: ✅
- Dialog opens with pre-filled values
- Amount updates successfully
- Card reflects new allocated amount
- Variance recalculates automatically

**Result**: ⬜ PASS / ⬜ FAIL
Observeation:- Ok

### 2.5 Delete Budget

**Steps:**
```
1. Long-press on the Labor budget card
2. Select "Delete" from context menu
3. Tap "Delete" in confirmation dialog
```

**Expected Result**: ✅
- Confirmation dialog appears
- Budget deleted successfully
- Card removed from list
- Success snackbar displayed

**Result**: ⬜ PASS / ⬜ FAIL

**Test 2 Overall Result**: ⬜ PASS / ⬜ FAIL
**Notes**: All tests of Test passed except for Total spent not being updated.
_____________________________________

---

## Test 3: Cost Tracking

### Objective
Test Cost Tracking screen with PO linkage and budget comparison.

### 3.1 View Cost List

**Steps:**
```
1. Tap "Costs" tab
2. Observe the cost entries list
```

**Expected Result**: ✅
- Screen displays "Cost Tracking" title
- Cost cards show:
  * Description
  * Amount (in blue)
  * Date
  * Category chip
  * PO Number (if linked)
  * Budget comparison section
- FAB "+" visible
- Category filter chips

**Result**: ⬜ PASS / ⬜ FAIL
Observation:-All ok but no Budget comparison section
### 3.2 Create New Cost Entry

**Steps:**
```
1. First, create a test budget:
   - Go to Budget tab
   - Create Materials budget: $30,000
2. Return to Costs tab
3. Tap FAB "+" button
4. Fill in the form:
   - Description: "Steel beams delivery"
   - Amount: 12000
   - Category: Materials
   - PO Number: PO-2024-001
   - Cost Date: Select today's date
5. Tap "Create Cost"
```

**Expected Result**: ✅
- Date picker works (platform-specific)
- Cost created successfully
- Card shows:
  * Description: "Steel beams delivery"
  * Amount: $12,000
  * Category: Materials chip
  * PO#: PO-2024-001
  * Date: Today's date
  * Budget comparison showing Materials budget vs spent

**Result**: ⬜ PASS / ⬜ FAIL
Observeation:- Ok

### 3.3 Budget Comparison Display

**Steps:**
```
1. Observe the budget comparison section in the cost card
2. Verify calculations
```

**Expected Result**: ✅
- Shows category budget (e.g., Materials: $30,000)
- Shows total spent in category (e.g., $12,000)
- Shows remaining (e.g., $18,000)
- Progress bar displays utilization (40%)
- If over budget, warning icon displayed

**Result**: ⬜ PASS / ⬜ FAIL
Observeation:- Ok

### 3.4 Edit Cost Entry

**Steps:**
```
1. Long-press on the cost card
2. Select "Edit"
3. Change amount to 15000
4. Tap "Update Cost"
```

**Expected Result**: ✅
- Dialog opens with pre-filled values
- Amount updates
- Budget comparison recalculates
- New spent: $15,000
- New remaining: $15,000

**Result**: ⬜ PASS / ⬜ FAIL
Observeation:- Ok

### 3.5 Delete Cost Entry

**Steps:**
```
1. Long-press on the cost card
2. Select "Delete"
3. Confirm deletion
```

**Expected Result**: ✅
- Confirmation dialog appears
- Cost deleted
- Budget comparison updates (spent decreases)

**Result**: ⬜ PASS / ⬜ FAIL

**Test 3 Overall Result**: ⬜ PASS / ⬜ FAIL
**Notes**: All passed_____________________________________

---

## Test 4: Invoice Management

### Objective
Test Invoice Management with payment tracking and automatic overdue calculation.

### 4.1 View Invoice List

**Steps:**
```
1. Tap "Invoices" tab
2. Observe invoice list
```

**Expected Result**: ✅
- Screen displays "Invoice Management" title
- Invoice cards show:
  * Invoice number
  * Vendor name
  * Amount
  * Invoice date
  * Payment status chip (Pending/Paid/Overdue)
- Summary section at top shows:
  * Total invoices count
  * Pending count and amount
  * Paid count and amount
  * Overdue count (if any)
- FAB "+" visible
- Status filter chips

**Result**: ⬜ PASS / ⬜ FAIL
Observeation:- Ok but Vendor name is unknown vendor

### 4.2 Create New Invoice

**Steps:**
```
1. Tap FAB "+" button
2. Fill in the form:
   - Invoice Number: INV-2024-001
   - Vendor: Select a vendor from dropdown
   - Amount: 25000
   - Invoice Date: Select today's date
   - Payment Status: Pending
3. Tap "Create Invoice"
```

**Expected Result**: ✅
- Vendor dropdown populated from vendors table
- Invoice created successfully
- Card shows:
  * Invoice#: INV-2024-001
  * Vendor name resolved from database
  * Amount: $25,000
  * Status: Pending (orange chip)
  * Invoice Date: Today

**Result**: ⬜ PASS / ⬜ FAIL
Observation:- All ok but vendor dropdown not there

### 4.3 Mark Invoice as Paid

**Steps:**
```
1. Long-press on pending invoice
2. Select "Mark as Paid"
3. Confirm action
```

**Expected Result**: ✅
- Confirmation dialog appears
- Payment status changes to "Paid" (green chip)
- Payment date automatically set to current date
- Summary updates:
  * Pending count decreases
  * Paid count increases
  * Amounts update accordingly

**Result**: ⬜ PASS / ⬜ FAIL
Observeation:- Ok

### 4.4 Test Automatic Overdue Calculation

**Steps:**
```
1. Create a test invoice:
   - Invoice Date: Set to 35 days ago
   - Payment Status: Pending
2. Observe the invoice card after creation
```

**Expected Result**: ✅
- Invoice automatically shows "Overdue" status (red chip)
- Calculation: Invoice date + 30 days < today = Overdue
- Overdue count in summary increments
- Warning icon displayed on card

**Result**: ⬜ PASS / ⬜ FAIL
Observeation:- Ok

### 4.5 Filter by Status

**Steps:**
```
1. Tap "Pending" filter chip
2. Observe filtered list
3. Tap "Paid" filter chip
4. Tap "All" to clear filter
```

**Expected Result**: ✅
- Filters work correctly
- Only invoices with selected status shown
- Summary stats update based on filter
- "All" chip shows all invoices

**Result**: ⬜ PASS / ⬜ FAIL
Observeation:- Ok

### 4.6 Edit & Delete Invoice

**Steps:**
```
1. Long-press on invoice
2. Select "Edit"
3. Change amount
4. Update successfully
5. Long-press again
6. Select "Delete"
7. Confirm deletion
```

**Expected Result**: ✅
- Edit dialog opens with pre-filled values
- Updates save correctly
- Delete confirmation shown
- Invoice removed
- Summary recalculates

**Result**: ⬜ PASS / ⬜ FAIL
Observeation:- Ok
**Test 4 Overall Result**: ⬜ PASS / ⬜ FAIL
**Notes**: All ok, filter button not working on second click to get all status. _____________________________________

---

## Test 5: Financial Reports

### Objective
Test Financial Reports screen with multi-table data aggregation and analytics.

### 5.1 View Reports Dashboard

**Steps:**
```
1. Tap "Reports" tab
2. Observe the reports screen
```

**Expected Result**: ✅
- Screen displays "Financial Reports" title
- Date range filter at top (Start Date - End Date)
- 5 report sections visible:
  1. Budget Summary
  2. Budget Variance by Category
  3. Cost Distribution
  4. Cash Flow Analysis
  5. Profitability Metrics

**Result**: ⬜ PASS / ⬜ FAIL
Observeation:- Ok

### 5.2 Budget Summary Section

**Steps:**
```
1. Scroll to Budget Summary section
2. Verify displayed metrics
```

**Expected Result**: ✅
- Shows:
  * Total Budget (sum of all budget allocations)
  * Total Spent (sum of all costs)
  * Remaining Budget (budget - spent)
  * Variance Percentage
- Color coding:
  * Green if under budget
  * Red if over budget
- All calculations accurate

**Result**: ⬜ PASS / ⬜ FAIL
Observeation:- Ok

### 5.3 Budget Variance by Category

**Steps:**
```
1. Scroll to Budget Variance by Category
2. Verify category breakdown
```

**Expected Result**: ✅
- Shows 4 categories (Labor, Materials, Equipment, Other)
- For each category displays:
  * Allocated budget
  * Spent amount
  * Variance (allocated - spent)
- Progress bars show utilization
- Color-coded (green/red) based on status

**Result**: ⬜ PASS / ⬜ FAIL
Observeation:- Ok, however i dont see Progress bars show utilization in Budget variance

### 5.4 Cost Distribution

**Steps:**
```
1. Scroll to Cost Distribution section
2. Verify percentage breakdown
```

**Expected Result**: ✅
- Shows percentage of total costs by category
- Progress bars visualize distribution
- Percentages add up to 100%
- Sorted by highest percentage

**Result**: ⬜ PASS / ⬜ FAIL
Observeation:- Ok, no sorting 

### 5.5 Cash Flow Analysis

**Steps:**
```
1. Scroll to Cash Flow section
2. Verify calculations
```

**Expected Result**: ✅
- Revenue: Sum of paid invoices
- Costs: Sum of all cost entries
- Net Cash Flow: Revenue - Costs
- Color coding:
  * Green if positive
  * Red if negative

**Result**: ⬜ PASS / ⬜ FAIL
Observeation:- Ok
### 5.6 Profitability Metrics

**Steps:**
```
1. Scroll to Profitability section
2. Verify profitability calculations
```

**Expected Result**: ✅
- Gross Profit: Revenue - Costs
- Profit Margin: (Profit / Revenue) × 100
- Color-coded values
- Percentages accurate

**Result**: ⬜ PASS / ⬜ FAIL
Observeation:- Ok

### 5.7 Date Range Filtering

**Steps:**
```
1. Tap "Start Date" button
2. Select a date 30 days ago
3. Tap "End Date" button
4. Select today's date
5. Observe filtered results
```

**Expected Result**: ✅
- Date picker appears (platform-specific)
- Selected dates displayed
- All reports filter to show only data within date range
- Costs filtered by cost_date
- Invoices filtered by invoice_date
- Budgets show actual spent within date range

**Result**: ⬜ PASS / ⬜ FAIL
Observeation:- Ok

**Test 5 Overall Result**: ⬜ PASS / ⬜ FAIL
**Notes**: _____________________________________

---

## Test 6: Commercial Dashboard

### Objective
Test Commercial Dashboard with real-time financial health overview and intelligent alerts.

### 6.1 Dashboard Overview

**Steps:**
```
1. Tap "Dashboard" tab
2. Observe the dashboard layout
```

**Expected Result**: ✅
- Screen displays project name in header
- 6 main sections visible (scroll to see all):
  1. Alerts (if any)
  2. Budget Summary
  3. Category Breakdown
  4. Cash Flow
  5. Invoices Overview
  6. Recent Costs

**Result**: ⬜ PASS / ⬜ FAIL
Observeation:- Ok, recent cost chip text fully not visible
### 6.2 Intelligent Alerts System

**Steps:**
```
1. Check Alerts section (if visible)
2. Verify alert types and triggers
```

**Expected Alert Types**: ✅
- 🚨 **Danger Alerts** (red):
  * Category over budget
  * Project budget exceeded
- ⚠️ **Warning Alerts** (orange):
  * Overdue invoices exist
  * Budget utilization > 80%
- ✅ **Info Alerts** (green):
  * Positive cash flow

**Alert Display**:
- Icon emoji matches alert type
- Color-coded background
- Clear, actionable message
- Sorted by priority (danger → warning → info)

**Result**: ⬜ PASS / ⬜ FAIL
Observeation:- Ok

### 6.3 Budget Summary Card

**Steps:**
```
1. Observe Budget Summary section
2. Verify displayed data
```

**Expected Result**: ✅
- Shows:
  * Total Budget: $XXX,XXX
  * Total Spent: $XXX,XXX
  * Remaining: $XXX,XXX (green if positive, red if negative)
- Budget Utilization:
  * Progress bar showing percentage
  * Percentage value displayed
  * Color: Blue if < 100%, Red if > 100%

**Result**: ⬜ PASS / ⬜ FAIL
Observeation:- Ok

### 6.4 Category Breakdown Section

**Steps:**
```
1. Scroll to Category Breakdown
2. Verify category displays
```

**Expected Result**: ✅
- Shows all 4 categories (Labor, Materials, Equipment, Other)
- For each category:
  * Category chip (color-coded)
  * "OVER" badge if over budget (red)
  * Amount: $spent / $budget
  * Percentage utilized
  * Progress bar (colored by category or red if over)

**Result**: ⬜ PASS / ⬜ FAIL
Observeation:- Ok

### 6.5 Cash Flow Card

**Steps:**
```
1. Observe Cash Flow section
2. Verify calculations
```

**Expected Result**: ✅
- 3 columns displayed:
  * Revenue (green): Sum of paid invoices
  * Costs: Sum of all costs
  * Net (large, bold): Revenue - Costs
    - Green if positive
    - Red if negative

**Result**: ⬜ PASS / ⬜ FAIL
Observeation:- Ok

### 6.6 Invoices Overview

**Steps:**
```
1. Observe Invoices Overview section
2. Verify statistics
```

**Expected Result**: ✅
- 4 invoice statistics displayed:
  * Total count (with icon)
  * Paid count (green) with amount
  * Pending count (orange) with amount
  * Overdue count (red)
- All counts accurate
- Amounts match invoice totals

**Result**: ⬜ PASS / ⬜ FAIL
Observeation:- Ok

### 6.7 Recent Costs Section

**Steps:**
```
1. Scroll to Recent Costs
2. Verify cost entries
```

**Expected Result**: ✅
- Shows last 5 cost entries
- Each entry displays:
  * Description (truncated if long)
  * Amount (blue, right-aligned)
  * Category chip (color-coded)
  * Date (formatted)
- Sorted by most recent first

**Result**: ⬜ PASS / ⬜ FAIL
Observeation:- Ok

### 6.8 Dashboard Refresh

**Steps:**
```
1. Note current dashboard values
2. Go to Costs tab
3. Add a new cost entry
4. Return to Dashboard
5. Observe updated values
```

**Expected Result**: ✅
- Dashboard auto-refreshes with new data
- Budget utilization updates
- Category breakdown updates
- Recent Costs shows new entry
- All calculations accurate

**Result**: ⬜ PASS / ⬜ FAIL

**Test 6 Overall Result**: ⬜ PASS / ⬜ FAIL
**Notes**: _____________________________________
Observeation:- Ok, not auto refreshing

---

## Test 7: Data Integrity & Calculations

### Objective
Verify that all calculations are accurate and data relationships work correctly.

### 7.1 Budget vs Actual Calculation

**Test Scenario:**
```
Setup:
1. Create Budget: Materials - $50,000
2. Create Cost 1: Materials - $15,000
3. Create Cost 2: Materials - $20,000

Expected Results:
- Budget Allocated: $50,000
- Actual Spent: $35,000
- Remaining: $15,000
- Utilization: 70%
```

**Verify in:**
- ✅ Budget Management screen
- ✅ Cost Tracking screen (budget comparison)
- ✅ Financial Reports screen
- ✅ Commercial Dashboard

**Result**: ⬜ PASS / ⬜ FAIL
Observeation:- Ok

### 7.2 Multi-Category Aggregation

**Test Scenario:**
```
Setup:
1. Create budgets for all 4 categories
2. Create costs in each category
3. Create invoices (paid and pending)

Expected:
- Total Budget = Sum of all category budgets
- Total Spent = Sum of all costs
- Revenue = Sum of paid invoices only
- All category-specific calculations isolated
```

**Verify in:**
- ✅ Financial Reports (Budget Summary)
- ✅ Commercial Dashboard (totals)
- ✅ Category breakdowns match individual categories

**Result**: ⬜ PASS / ⬜ FAIL
Observeation:- Ok

### 7.3 Cash Flow Accuracy

**Test Scenario:**
```
Setup:
1. Create Invoice 1: $30,000 (Paid)
2. Create Invoice 2: $20,000 (Pending)
3. Create Invoice 3: $15,000 (Paid)
4. Create total costs: $40,000

Expected:
- Revenue: $45,000 (only paid invoices)
- Costs: $40,000
- Net Cash Flow: $5,000
- Pending invoices NOT included in revenue
```

**Verify in:**
- ✅ Financial Reports (Cash Flow section)
- ✅ Commercial Dashboard (Cash Flow card)
- ✅ Invoice Management (summary)

**Result**: ⬜ PASS / ⬜ FAIL
Observation:- Created 3 invoices as desired, where to create total cost, give detailed steps

### 7.4 Overdue Calculation

**Test Scenario:**
```
Create invoices with different dates:
1. Invoice Date: 35 days ago, Status: Pending → Should be Overdue
2. Invoice Date: 25 days ago, Status: Pending → Should be Pending
3. Invoice Date: 35 days ago, Status: Paid → Should remain Paid
4. Invoice Date: Today, Status: Pending → Should be Pending

Logic: Invoice Date + 30 days < Today AND Status = Pending → Overdue
```

**Verify:**
- ✅ Correct status badges displayed
- ✅ Overdue count accurate in summary
- ✅ Paid invoices never show as overdue
- ✅ Dashboard alerts show overdue warning

**Result**: ⬜ PASS / ⬜ FAIL
Obsrvation:-Overdue status badge displayed, count in summary & Dashboard is not refreshing/updating

### 7.5 Date Range Filtering

**Test Scenario:**
```
Setup:
1. Create costs with dates: 60 days ago, 30 days ago, today
2. Create invoices with dates: 60 days ago, 30 days ago, today
3. Set filter: Last 45 days

Expected:
- Only costs/invoices from last 45 days included
- Calculations based on filtered data
- Budgets show actual spent within range
```

**Verify in:**
- ✅ Financial Reports with date filter applied
- ✅ Totals recalculate correctly
- ✅ Removing filter shows all data again

**Result**: ⬜ PASS / ⬜ FAIL
Observation:-OK

**Test 7 Overall Result**: ⬜ PASS / ⬜ FAIL
**Notes**: _____________________________________

---

## Test 8: Context & Navigation

### Objective
Verify project context isolation and navigation consistency.

### 8.1 Project Context Display

**Steps:**
```
1. Verify project name displays in all screen headers:
   - Dashboard header
   - Budget Management header
   - Cost Tracking header
   - Invoice Management header
   - Financial Reports header
```

**Expected Result**: ✅
- Consistent project name across all screens
- If no project assigned, shows "No project assigned"

**Result**: ⬜ PASS / ⬜ FAIL
Observation:- OK, 

### 8.2 Data Isolation by Project

**Steps:**
```
1. Note current project ID
2. Verify all data shown is for current project only
3. No data from other projects should appear
```

**Expected Result**: ✅
- All budgets filtered by project_id
- All costs filtered by project_id
- All invoices filtered by project_id
- Aggregations only include current project data

**Result**: ⬜ PASS / ⬜ FAIL
Observation:- ok
### 8.3 Navigation Consistency

**Steps:**
```
1. Navigate between all 5 tabs multiple times
2. Use Android back button (if applicable)
3. Verify navigation stack behavior
```

**Expected Result**: ✅
- Tab navigation smooth and instant
- No navigation errors or crashes
- Back button behavior correct
- State preserved when returning to tabs

**Result**: ⬜ PASS / ⬜ FAIL
Observation:- ok

### 8.4 Logout and Re-login

**Steps:**
```
1. From any Commercial screen
2. Try to access logout (via role switcher if available)
3. Logout
4. Login again as commercial
5. Verify you return to Commercial Dashboard
```

**Expected Result**: ✅
- Logout works correctly
- Re-login returns to Commercial role
- Data persists after logout/login
- No data loss

**Result**: ⬜ PASS / ⬜ FAIL

**Test 8 Overall Result**: ⬜ PASS / ⬜ FAIL
**Notes**: _____________________________________
Observation:- ok
---

## Final Checklist

### Functionality Tests
- ⬜ All CRUD operations work (Create, Read, Update, Delete)
- ⬜ All calculations are accurate
- ⬜ Data aggregation from multiple tables works
- ⬜ Date pickers function correctly (platform-specific)
- ⬜ Search and filters work as expected
- ⬜ Context menus (long-press) work
- ⬜ FAB buttons are accessible
- ⬜ Confirmation dialogs appear when needed

### Data Integrity
- ⬜ Budget vs Actual calculations correct
- ⬜ Cash flow calculations accurate
- ⬜ Overdue calculation logic works (30-day rule)
- ⬜ Multi-category aggregation correct
- ⬜ Date range filtering works
- ⬜ Project isolation enforced

### User Experience
- ⬜ All screens load without errors
- ⬜ Navigation is smooth and intuitive
- ⬜ Color coding is consistent and meaningful
- ⬜ Progress bars display correctly
- ⬜ Success/error messages appear appropriately
- ⬜ Forms are easy to use
- ⬜ Data displays clearly and readably

### Performance
- ⬜ No noticeable lag when loading screens
- ⬜ CRUD operations complete quickly
- ⬜ Dashboard refreshes efficiently
- ⬜ No memory leaks or crashes
- ⬜ Smooth scrolling on all screens

### Technical Quality
- ⬜ No console errors or warnings
- ⬜ No TypeScript errors
- ⬜ ESLint warnings are acceptable (inline styles only)
- ⬜ useCallback optimization working

---

## Test Results Summary

**Date Tested**: _________________________
**Tester Name**: _________________________
**Device/Emulator**: _________________________
**OS Version**: _________________________

### Overall Results

| Test Section | Result | Notes |
|-------------|--------|-------|
| Test 1: Authentication & Navigation | ⬜ PASS / ⬜ FAIL | |
| Test 2: Budget Management | ⬜ PASS / ⬜ FAIL | |
| Test 3: Cost Tracking | ⬜ PASS / ⬜ FAIL | |
| Test 4: Invoice Management | ⬜ PASS / ⬜ FAIL | |
| Test 5: Financial Reports | ⬜ PASS / ⬜ FAIL | |
| Test 6: Commercial Dashboard | ⬜ PASS / ⬜ FAIL | |
| Test 7: Data Integrity & Calculations | ⬜ PASS / ⬜ FAIL | |
| Test 8: Context & Navigation | ⬜ PASS / ⬜ FAIL | |

### Issues Found

| # | Severity | Description | Status |
|---|----------|-------------|--------|
| 1 | | | |
| 2 | | | |
| 3 | | | |

Severity Levels: 🔴 Critical | 🟡 Major | 🟢 Minor | 🔵 Cosmetic

---

## Sign-Off

**Tested By**: Utpal Priyadarshi_________________________
**Date**: 6th & 7th December 25 _________________________
**Signature**: _________________________

**Approved for Merge**: ⬜ YES / ⬜ NO

**Approval Comments**:
_________________________________________________________
_________________________________________________________
_________________________________________________________

---

## Additional Notes

### Known Limitations
- Inline style warnings in ESLint (pre-existing, acceptable)
- Design Engineer and Commercial Manager users require password update via Admin interface

### Future Enhancements (Post-Merge)
- Export reports to PDF/Excel
- Advanced filtering options
- Custom date range presets (This Month, Last Quarter, etc.)
- Budget templates for quick setup
- Cost approval workflow
- Invoice document attachments

---

**End of Test Guide**

For questions or issues, refer to:
- README.md
- ARCHITECTURE_UNIFIED.md
- v2.11_REVISED_MULTI_ROLE_PLAN.md
