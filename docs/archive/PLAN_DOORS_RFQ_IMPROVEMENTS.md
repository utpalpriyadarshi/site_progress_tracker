# Improvement Plan: DOORS Package & Design RFQ Tabs

## Session Summary (2026-02-14)

### What Was Completed — Sprint 1 (Phase 1 + Phase 4)

**PR #126** — Weightage summary bar for Design Doc tab
**PR #127** — Sprint 1 fixes for DOORS & RFQ tabs

Both merged to `main`. Current HEAD: `eee7e0d`

#### Phase 1: Critical Fixes & Data Integrity — DONE

| Task | Status | Details |
|------|--------|---------|
| 1.1 Fix DOORS hardcoded values | DONE | Category dropdown (OHE/TSS/SCADA/Cables/Hardware/Consumables), configurable requirements count (1-500), proper `engineerId` from context, duplicate DOORS ID detection |
| 1.2 Fix RFQ hardcoded values | DONE | `createdById` set to `engineerId` (was empty string), delivery days validation (1-365) |
| 1.3 Connect site filtering | DONE | DOORS queries now filter by `selectedSiteId` when not 'all', added to useEffect deps |
| 1.4 Edit/Delete DOORS packages | DONE | Edit (pending/received), delete (pending only, blocked if RFQs linked), reused dialog in edit mode |
| 1.5 Edit/Delete RFQs | DONE | Edit/delete for draft status only, reused dialog in edit mode |

#### Phase 4: Header Compaction — DONE

| Task | Status | Details |
|------|--------|---------|
| 4.1 Compact DOORS header | DONE | paddingTop/Bottom 12, headerTop margin 8, searchbar margin 8, siteSelector margin 4 |
| 4.2 Compact RFQ header | DONE | Same compaction as DOORS |

#### Additional improvements delivered:
- **Snackbar feedback** on both screens (replaced blocking Alert for success messages)
- **SET_FORM** and **DELETE_PACKAGE** actions added to DOORS reducer
- **SET_FORM** action added to RFQ reducer
- **editingPackageId** / **editingRfqId** tracked in UI state

### Files Modified in Sprint 1 (9 files)
1. `src/design_engineer/DoorsPackageManagementScreen.tsx`
2. `src/design_engineer/DesignRfqManagementScreen.tsx`
3. `src/design_engineer/components/DoorsPackageCard.tsx`
4. `src/design_engineer/components/DesignRfqCard.tsx`
5. `src/design_engineer/components/CreateDoorsPackageDialog.tsx`
6. `src/design_engineer/components/CreateDesignRfqDialog.tsx`
7. `src/design_engineer/state/doors-package-management/doorsPackageManagementReducer.ts`
8. `src/design_engineer/state/design-rfq-management/designRfqManagementReducer.ts`
9. `src/design_engineer/types/DoorsPackageTypes.ts`

---

## What's Next — Remaining Phases

### Sprint 2: Phase 2 — Enhanced Status Workflows (~3-4 hours)

#### 2.1 DOORS Full Status Workflow
**Files:** `DoorsPackageManagementScreen.tsx`, `DoorsPackageCard.tsx`
- Expand: `pending → received → reviewed → approved → closed`
- Workflow validation: must go in order (can't skip steps)
- "Approve" button (when reviewed), "Close" with closure remarks dialog
- Store `reviewedBy` when marking reviewed
- Update filter menu for all statuses

#### 2.2 RFQ Full Status Workflow
**Files:** `DesignRfqManagementScreen.tsx`, `DesignRfqCard.tsx`
- Complete: `draft → issued → quotes_received → evaluated → awarded`
- "Evaluate" button (quotes_received → evaluated, saves evaluationDate)
- "Award" with vendor selection + awarded value input
- "Cancel" action with confirmation (any status → cancelled)
- Replace chip filters with dropdown (too many statuses for chips)

#### 2.3 Status Timeline on Cards
**Files:** `DoorsPackageCard.tsx`, `DesignRfqCard.tsx`
- Compact horizontal step indicator per card
- Steps: completed (green), current (blue), pending (gray)

### Sprint 3: Phase 3 — Compliance & Analytics Display (~2-3 hours)

#### 3.1 DOORS Compliance Summary Bar
- Summary bar below SiteSelector: total packages, avg compliance %, status distribution
- Color-coded progress bar

#### 3.2 DOORS Card Compliance Display
- Mini progress bar per card, category-wise breakdown (Technical/Datasheet/Type Test/Routine Test/Site)

#### 3.3 RFQ Summary Bar
- Total RFQs, status distribution, total awarded value

#### 3.4 DOORS Card Rich Fields
- Equipment Name, Priority badge, Quantity+Unit, Spec Reference, Drawing Reference

### Sprint 4: Phase 5 + 7 — Copy/Templates + Validation (~6-8 hours)

#### 5.1 Copy DOORS Packages Between Sites
- New `CopyDoorsPackagesDialog.tsx`, duplicate ID handling

#### 5.2 Duplicate Individual Package/RFQ
- "Duplicate" action on cards, new ID generated

#### 5.3 DOORS Package Templates
- New `DoorsPackageTemplates.ts`, predefined per category

#### 7.1 DOORS ID Validation
- Format validation: `DOORS-{CATEGORY}-{TYPE}-{NUMBER}`

#### 7.2 RFQ Validation
- Title length, prevent duplicate active RFQs per DOORS package

#### 7.3 Granular Error Handling
- Specific error messages, retry logic, sync status on cards

### Sprint 5: Phase 6 + 8 — Vendor Quotes + Bulk Ops (~8-10 hours)

#### 6.1 Vendor Quote UI
- New `VendorQuoteDialog.tsx`, `VendorQuoteCard.tsx`
- Add/view/compare vendor quotes with scores

#### 6.2 Award Flow
- Side-by-side quote comparison, winning vendor selection with justification

#### 8.1 Multi-Select Mode
- Long-press selection, bulk actions

#### 8.2 Bulk Status Update
- "Mark All Received", "Issue All"

---

## Key Architecture Notes for Next Session

- **Models** are in `models/` (root), imports use `../../models/` from `src/services/`
- **Database** imported from `models/database` (WatermelonDB)
- **Context**: `useDesignEngineerContext()` provides `projectId`, `projectName`, `engineerId`, `selectedSiteId`, `refreshTrigger`
- **State pattern**: `useReducer` in each screen, reducers in `src/design_engineer/state/<feature>/`
- **Dialog pattern**: Single dialog component reused for create/edit via `isEditing` prop
- **Card pattern**: Cards receive `onEdit`, `onDelete`, `onMarkReceived` etc. as callbacks
- **DOORS_CATEGORIES**: Defined in `types/DoorsPackageTypes.ts` as const array
- **RFQ model** uses `_version` (underscore prefix), DOORS model uses `version`
- **Site filtering**: Design Doc and DOORS tabs use `selectedSiteId` from context; RFQ tab is project-scoped (no site filtering yet)
