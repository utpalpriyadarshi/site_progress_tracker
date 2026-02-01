# Design Documents Feature - Test Plan

## Prerequisites

1. Login as **Admin** (`admin / Admin@2025`)
2. Perform **Database Reset** (to pick up v36 schema)
3. Login as **Design Engineer** (`designer / Designer@2025`)
4. Navigate to **Design Docs** tab (2nd tab after Dashboard)

---

## Test 1: Tab Visibility

| # | Step | Expected Result | Pass/Fail |
|---|------|-----------------|-----------|
| 1.1 | Open Design Engineer navigator | "Design Docs" tab visible as 2nd tab (after Dashboard) | |
| 1.2 | Tap "Design Docs" tab | Screen loads with blue header, search bar, filter chips | |
| 1.3 | Verify header | Shows project name + "Design Document Management" + Logout button | |
| 1.4 | Verify empty state | Shows "No Design Documents Yet" with "Create Document" button | |

---

## Test 2: Manage Categories

| # | Step | Expected Result | Pass/Fail |
|---|------|-----------------|-----------|
| 2.1 | Tap **+** FAB button | FAB expands showing "New Document" and "Manage Categories" | |
| 2.2 | Tap "Manage Categories" | Manage Categories dialog opens | |
| 2.3 | Select "Installation" from dropdown | 3 default categories shown: Layout Plan & Section, Cable Tray Layout, Cable Schedule | |
| 2.4 | Verify default categories show "Default" badge | Default categories cannot be deleted (no delete icon) | |
| 2.5 | Select "Simulation/Study" from dropdown | Empty list shown ("No categories for this type") | |
| 2.6 | Type "Thermal Analysis" in new category field | Text appears in input | |
| 2.7 | Tap "Add" | Category "Thermal Analysis" appears in list | |
| 2.8 | Add another category "Load Flow Study" | Second category appears in list | |
| 2.9 | Tap delete icon on "Load Flow Study" | Category removed from list | |
| 2.10 | Select "Product/Equipment" and add "Transformer Design" | Category added under Product/Equipment type | |
| 2.11 | Select "As-Built Design" and add "As-Built Layout" | Category added under As-Built type | |
| 2.12 | Tap "Close" | Dialog closes, categories persist | |

---

## Test 3: Create Documents

### 3A: Project-wide Document (Simulation/Study)

| # | Step | Expected Result | Pass/Fail |
|---|------|-----------------|-----------|
| 3A.1 | Tap **+** FAB → "New Document" | Create Design Document dialog opens | |
| 3A.2 | Enter Document Number: `DD-SIM-001` | Text entered | |
| 3A.3 | Enter Title: `Thermal Study Report` | Text entered | |
| 3A.4 | Enter Description: `Initial thermal analysis` | Text entered | |
| 3A.5 | Select Document Type: "Simulation/Study" | Type selected, **no Site dropdown** appears | |
| 3A.6 | Select Category: "Thermal Analysis" | Category selected (filtered to Simulation/Study categories only) | |
| 3A.7 | Revision Number shows "R0" | Pre-filled default | |
| 3A.8 | Tap "Create" | Success alert, dialog closes, card appears in list | |
| 3A.9 | Verify card shows | Document number, title, "Simulation/Study" badge, "Draft" status, category name, revision R0 | |

### 3B: Site-specific Document (Installation)

| # | Step | Expected Result | Pass/Fail |
|---|------|-----------------|-----------|
| 3B.1 | Tap **+** FAB → "New Document" | Dialog opens | |
| 3B.2 | Enter Document Number: `DD-INS-001` | Text entered | |
| 3B.3 | Enter Title: `Cable Tray Layout Drawing` | Text entered | |
| 3B.4 | Select Document Type: "Installation" | Type selected, **Site dropdown appears** | |
| 3B.5 | Select Category: "Cable Tray Layout" | Category selected (shows default Installation categories) | |
| 3B.6 | Select a Site from dropdown | Site selected | |
| 3B.7 | Tap "Create" | Success alert, card appears with site name shown | |

### 3C: Product/Equipment Document

| # | Step | Expected Result | Pass/Fail |
|---|------|-----------------|-----------|
| 3C.1 | Create document: `DD-PRD-001`, "Transformer Application Design", Type: Product/Equipment | No site dropdown, card created with Draft status | |

### 3D: As-Built Document

| # | Step | Expected Result | Pass/Fail |
|---|------|-----------------|-----------|
| 3D.1 | Create document: `DD-ABD-001`, "As-Built Station Layout", Type: As-Built Design | **Site dropdown appears**, must select site, card created | |

### 3E: Validation

| # | Step | Expected Result | Pass/Fail |
|---|------|-----------------|-----------|
| 3E.1 | Try creating with empty Document Number | Validation error alert | |
| 3E.2 | Try creating with empty Title | Validation error alert | |
| 3E.3 | Try creating Installation without Site | Validation error: "Site is required for this document type" | |

---

## Test 4: Status Workflow

### 4A: Draft -> Submitted

| # | Step | Expected Result | Pass/Fail |
|---|------|-----------------|-----------|
| 4A.1 | On DD-SIM-001 (Draft), tap **send icon** (arrow) | "Submit Document" confirmation dialog appears | |
| 4A.2 | Tap "Confirm" | Status changes to "Submitted", submitted date shown on card | |
| 4A.3 | Verify Draft actions disappear | Edit, delete, submit icons no longer shown | |

### 4B: Submitted -> Approved

| # | Step | Expected Result | Pass/Fail |
|---|------|-----------------|-----------|
| 4B.1 | On DD-SIM-001 (Submitted), tap **check icon** | "Approve Document" confirmation dialog appears | |
| 4B.2 | Tap "Confirm" | Status changes to "Approved" (green), approved date shown | |
| 4B.3 | Verify no action icons on approved document | No edit/delete/approve buttons visible | |

### 4C: Submitted -> Approved with Comment

| # | Step | Expected Result | Pass/Fail |
|---|------|-----------------|-----------|
| 4C.1 | Submit DD-INS-001 (follow 4A steps) | Status: Submitted | |
| 4C.2 | Tap **comment-check icon** | "Approve with Comment" dialog with comment field | |
| 4C.3 | Enter comment: "Approved pending minor revisions" | Comment entered | |
| 4C.4 | Tap "Confirm" | Status: "Approved w/ Comment" (orange), comment shown on card | |

### 4D: Submitted -> Rejected

| # | Step | Expected Result | Pass/Fail |
|---|------|-----------------|-----------|
| 4D.1 | Submit DD-PRD-001 (follow 4A steps) | Status: Submitted | |
| 4D.2 | Tap **X icon** | "Reject Document" dialog with comment field | |
| 4D.3 | Try "Confirm" without comment | Button disabled (comment required for rejection) | |
| 4D.4 | Enter comment: "Missing specifications" | Comment entered | |
| 4D.5 | Tap "Confirm" | Status: "Rejected" (red), rejection comment shown on card | |

---

## Test 5: Filtering

| # | Step | Expected Result | Pass/Fail |
|---|------|-----------------|-----------|
| 5.1 | Tap "Simulation/Study" type chip | Only Simulation/Study documents shown | |
| 5.2 | Tap "Installation" type chip | Only Installation documents shown | |
| 5.3 | Tap "All" type chip | All documents shown | |
| 5.4 | Tap "Draft" status chip | Only Draft documents shown | |
| 5.5 | Tap "Approved" status chip | Only Approved documents shown | |
| 5.6 | Tap "Rejected" status chip | Only Rejected documents shown | |
| 5.7 | Tap same status chip again | Filter cleared, all documents shown | |
| 5.8 | Combine type + status filter | Both filters applied together | |
| 5.9 | Type "Cable" in search bar | Only documents with "Cable" in title/number/category/description shown | |
| 5.10 | Clear search | All documents shown again | |
| 5.11 | Apply filter with no results | "No Matching Documents" empty state with "Clear Filters" button | |

---

## Test 6: Edit & Delete

| # | Step | Expected Result | Pass/Fail |
|---|------|-----------------|-----------|
| 6.1 | Create a new Draft document: `DD-TEST-001`, "Test Document" | Card appears as Draft | |
| 6.2 | Tap **pencil icon** on the card | Edit dialog opens pre-filled with document data | |
| 6.3 | Change title to "Updated Test Document" | Title changed | |
| 6.4 | Tap "Update" | Card updates with new title, success alert | |
| 6.5 | Tap **trash icon** on the card | "Confirm Delete" alert appears | |
| 6.6 | Tap "Delete" | Card removed from list, success alert | |
| 6.7 | Verify edit/delete only on Draft | Submitted/Approved/Rejected docs have no pencil/trash icons | |

---

## Test 7: Category Protection

| # | Step | Expected Result | Pass/Fail |
|---|------|-----------------|-----------|
| 7.1 | Open Manage Categories → select Installation | Default categories shown with "Default" badge | |
| 7.2 | Verify no delete icon on default categories | Cannot delete Layout Plan & Section, Cable Tray Layout, Cable Schedule | |
| 7.3 | Add custom category "Custom Test" | Custom category appears with delete icon | |
| 7.4 | Create a document using "Custom Test" category | Document created | |
| 7.5 | Try to delete "Custom Test" category | Alert: "This category is used by existing documents" | |
| 7.6 | Delete the document using that category | Document deleted | |
| 7.7 | Now delete "Custom Test" category | Category deleted successfully | |

---

## Test 8: Logout & Navigation

| # | Step | Expected Result | Pass/Fail |
|---|------|-----------------|-----------|
| 8.1 | Tap "Logout" button in header | Navigates to login screen | |
| 8.2 | Login again as designer | Design Docs tab shows previously created documents (data persisted) | |
| 8.3 | Switch between tabs (Dashboard, Design Docs, DOORS, RFQs) | Each tab loads correctly | |

---

## Observations

*(Fill in any issues, UI glitches, or suggestions below)*

| # | Observation | Severity (Low/Med/High) | Notes |
|---|-------------|------------------------|-------|
| | | | |
| | | | |
| | | | |
| | | | |

---

## Summary

| Test Area | Total Tests | Passed | Failed |
|-----------|-------------|--------|--------|
| Tab Visibility | 4 | | |
| Manage Categories | 12 | | |
| Create Documents | 14 | | |
| Status Workflow | 12 | | |
| Filtering | 11 | | |
| Edit & Delete | 7 | | |
| Category Protection | 7 | | |
| Logout & Navigation | 3 | | |
| **Total** | **70** | | |
