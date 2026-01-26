# Phase 5: Key Dates Architecture - Progress Summary

## Document Info
- **Created:** 25-01-2026
- **Last Updated:** 25-01-2026
- **Reference:** KeyDatesCMRL.pdf (in /prompts folder)
- **Parent Document:** Planner_Code_Improvements.md

---

## Overview

Phase 5 implements a **Contract Key Dates** tracking system based on the CMRL (Chennai Metro Rail Limited) contract structure. Key dates are contractual milestones with associated delay damages.

**Phase 5 is split into 3 sub-phases:**
- **Phase 5a:** Database Models & Schema ✅ Completed
- **Phase 5b:** Key Date Management UI (Pending)
- **Phase 5c:** Integration & Timeline (Pending)

---

## Phase 5a: Database Models & Schema ✅ COMPLETED

**PR:** #78
**Branch:** `feature/planner-key-dates-phase5a`
**Status:** Merged/Pending

### Files Created

| File | Purpose |
|------|---------|
| `models/KeyDateModel.ts` | WatermelonDB model for contract key dates |
| `models/KeyDateSiteModel.ts` | Junction table model for key date ↔ site mapping |
| `models/migrations/v35_add_key_dates_tables.ts` | Database migration v35 |

### Files Modified

| File | Changes |
|------|---------|
| `models/schema/index.ts` | Added key_dates and key_date_sites tables, version bumped to 35 |
| `models/database.ts` | Registered KeyDateModel and KeyDateSiteModel |
| `models/ItemModel.ts` | Added key_date_id field and association |
| `models/migrations/index.js` | Imported v35Migration |

### Database Schema (v35)

#### key_dates table
```
- code (string, indexed)           // KD-G-01, KD-A-01, etc.
- category (string, indexed)       // G, A, B, C, D, E, F
- category_name (string)           // Full name (General, Design, etc.)
- description (string)
- target_days (number)             // Calendar days from commencement
- target_date (number, optional)   // Calculated target date
- actual_date (number, optional)   // Actual completion date
- status (string, indexed)         // not_started, in_progress, completed, delayed
- progress_percentage (number)
- delay_damages_initial (number)   // INR Lakhs/day (days 1-28)
- delay_damages_extended (number)  // INR Lakhs/day (day 29+)
- delay_damages_special (string, optional) // Special cases like "0.1% of Contract Price"
- project_id (string, indexed)
- sequence_order (number)
- dependencies (string, optional)  // JSON array of key_date IDs
- created_by, created_at, updated_at, sync_status, _version
```

#### key_date_sites table (junction)
```
- key_date_id (string, indexed)
- site_id (string, indexed)
- contribution_percentage (number) // How much this site contributes to KD completion
- progress_percentage (number)     // Current progress at this site
- status (string)
- planned_start_date, planned_end_date (optional)
- actual_start_date, actual_end_date (optional)
- notes (optional)
- updated_by, created_at, updated_at, sync_status, _version
```

#### items table (modified)
```
+ key_date_id (string, optional, indexed) // Link work items to key dates
```

### KeyDateModel Helper Methods

```typescript
getFormattedCode(): string          // Returns "KD-G-01" format
getDaysRemaining(): number          // Days until target date
getDaysDelayed(): number            // Days past target (negative if on time)
getEstimatedDelayDamages(): number  // Calculate delay damages in INR Lakhs
getStatusColor(): string            // Color for UI display
getCategoryColor(): string          // Category-specific color
getDependencies(): string[]         // Parse dependencies JSON
isCritical(): boolean               // Check if delayed or at risk
```

### Key Date Categories (from CMRL Contract)

| Code | Name | Description |
|------|------|-------------|
| G | General | Site Office, Construction Program |
| A | Design | Design submissions, FAT, Equipment delivery |
| B | Poonamallee Depot | RSS Building, Commissioning, Traction |
| C | Corridor 4 ECV | ECV01 & ECV02 packages |
| D | Thirumayilai | RSS at Thirumayilai |
| E | Corridor 4 UG02 | Underground section 02 |
| F | Corridor 4 UG01 | Underground section 01 |

### Delay Damages Structure

Most key dates follow this pattern:
- **Days 1-28:** 1 INR Lakh per day
- **Day 29 onwards:** 10 INR Lakhs per day

Special cases (e.g., KD-C-07, KD-E-04, KD-F-04):
- **0.1% of Contract Price per day**

---

## Phase 5b: Key Date Management UI (PENDING)

### Tasks
- [ ] Create `KeyDateManagementScreen.tsx`
- [ ] Create `KeyDateCard.tsx` component
- [ ] Create `KeyDateForm.tsx` for add/edit
- [ ] Create `KeyDateStatusBadge.tsx` component
- [ ] Add to PlanningNavigator (drawer item)
- [ ] Create state management (reducer pattern)

### Suggested File Structure
```
src/planning/
├── key-dates/
│   ├── KeyDateManagementScreen.tsx
│   ├── components/
│   │   ├── KeyDateCard.tsx
│   │   ├── KeyDateForm.tsx
│   │   ├── KeyDateStatusBadge.tsx
│   │   ├── KeyDateProgressBar.tsx
│   │   └── index.ts
│   ├── hooks/
│   │   ├── useKeyDates.ts
│   │   └── index.ts
│   └── utils/
│       ├── keyDateHelpers.ts
│       └── index.ts
├── state/
│   └── key-dates/
│       ├── keyDateReducer.ts
│       └── index.ts
```

### UI Features to Implement
1. **List View:** Display key dates grouped by category
2. **Filter:** By status, category, project
3. **Search:** By code or description
4. **Detail View:** Show progress, sites, linked items
5. **Add/Edit Form:** Create/modify key dates
6. **Progress Update:** Update progress percentage
7. **Site Mapping:** Assign sites to key dates with contribution %

---

## Phase 5c: Integration & Timeline (PENDING)

### Tasks
- [ ] Update Schedule tab to show Key Dates timeline
- [ ] Create KeyDateTimeline component (horizontal timeline)
- [ ] Implement dependency tracking visualization
- [ ] Update Gantt chart to include Key Dates as milestones
- [ ] Link items to key dates from Item creation/edit screens
- [ ] Add KeyDateSelector component

### Integration Points
1. **Schedule Tab:** Add Key Dates view alongside existing schedule
2. **Gantt Chart:** Show key dates as diamond milestones
3. **Item Forms:** Add key date selector dropdown
4. **Dashboard:** Add key dates summary widget

---

## How to Resume Work

### For Phase 5b (UI):
1. Checkout main and create new branch: `git checkout main && git pull && git checkout -b feature/planner-key-dates-phase5b`
2. Create the folder structure under `src/planning/key-dates/`
3. Start with `KeyDateCard.tsx` component (display single key date)
4. Then create `KeyDateManagementScreen.tsx` using withObservables pattern
5. Add to navigation in `PlanningNavigator.tsx`

### For Phase 5c (Integration):
1. Wait for Phase 5b to be merged
2. Create branch: `feature/planner-key-dates-phase5c`
3. Start with Schedule tab modifications
4. Then update Gantt chart

### Key Files to Reference
- `models/KeyDateModel.ts` - Model with helper methods
- `models/KeyDateSiteModel.ts` - Junction table model
- `src/planning/MilestoneTrackingScreen.tsx` - Similar pattern for list screen
- `src/planning/SiteManagementScreen.tsx` - Similar CRUD screen pattern
- `prompts/KeyDatesCMRL.pdf` - Contract reference document

---

## Git Branches

| Branch | Status | PR |
|--------|--------|-----|
| `feature/planner-key-dates-phase5a` | Completed | #78 |
| `feature/planner-key-dates-phase5b` | Not created | - |
| `feature/planner-key-dates-phase5c` | Not created | - |

---

## Testing Notes

### Phase 5a Testing
- [ ] App builds without TypeScript errors
- [ ] Database migration runs on fresh install
- [ ] Database migration runs on upgrade from v34
- [ ] KeyDateModel methods return correct values
- [ ] ItemModel can reference key_date_id

### Phase 5b Testing (when implemented)
- [ ] Key dates list displays correctly
- [ ] Add key date works
- [ ] Edit key date works
- [ ] Delete key date works
- [ ] Site mapping works
- [ ] Progress updates work
- [ ] Filters work correctly

### Phase 5c Testing (when implemented)
- [ ] Schedule tab shows key dates
- [ ] Gantt chart shows key date milestones
- [ ] Item forms allow key date selection
- [ ] Dependencies display correctly

---

## Notes

- Key dates are project-specific (each project has its own set)
- The CMRL contract has ~35 key dates across 6 categories
- Some key dates span multiple sites (use key_date_sites junction)
- Work items (from items table) can be linked to key dates
- Delay damages are calculated based on tiered rates
