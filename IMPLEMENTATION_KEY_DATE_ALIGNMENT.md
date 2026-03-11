# Implementation Plan: Key Date & Site Auto-Alignment

**Status:** Approved — ready for implementation
**Prepared:** 2026-02-22
**Source doc:** `prompts/key-date-site-alignment.md`
**Schema version:** v49 (no migration required)

---

## Decisions Locked In

| Decision | Answer |
|----------|--------|
| All DE document types (simulation, product, installation, as-built) → Category A | ✓ |
| Key Date shown read-only in form (no manual selection) | ✓ |
| Site picker inside form when engineer is in "All Sites" view | ✓ |
| Project-scoped docs (no site) → Category A picker, filtered to project-level KDs | ✓ (Option A) |
| Multiple Category A KDs on same site → pick first by code (lowest) | ✓ |
| Manager sees design doc progress vs site activity progress split | ✓ |
| Supervisor visibility of KD-site links → deferred | ✓ |

---

## Current State (What Exists Today)

- `loadKeyDates()` in `useDocumentCrud.ts` fetches **all** project Key Dates (flat list, no site filtering)
- `CreateDesignDocumentDialog.tsx` shows a **Key Date dropdown** — editable, engineer picks manually
- Dialog has a `DOC_TYPE_TO_KD_CATEGORY` map (already correctly maps all types → `'A'`) used for auto-suggestion hint only, not enforcement
- `DesignDocumentCard.tsx` shows a purple `"Key Date"` badge with no code or description
- `KeyDateSiteModel` (`key_date_sites` table) has `siteId` and `keyDateId` fields — the junction exists but is not queried by the DE flow
- `KeyDateModel` has a `designWeightage` field (schema v35+) — Manager split partially anticipated

---

## Phase 1 — Core DE Flow (Site-Scoped Documents)

**Goal:** Auto-resolve Key Date from site → Category A lookup. Show read-only in form.

### 1A. `src/design_engineer/hooks/useDocumentCrud.ts`

**Add** a `resolveKeyDateForSite(siteId: string)` async function:

```typescript
// Logic:
// 1. Query key_date_sites WHERE site_id = siteId
// 2. Extract keyDateIds from results
// 3. If none → return null (no KD linked)
// 4. Query key_dates WHERE id IN keyDateIds AND category = 'A'
// 5. Sort by code ascending → pick first
// 6. Return { id, code, description, category } | null
```

**Add** a `loadProjectKeyDates()` function for project-scoped docs (Phase 2, but build here):

```typescript
// Logic:
// 1. Query key_dates WHERE project_id = projectId AND category = 'A'
// 2. Return sorted array { id, code, description }
// (Used when no site is selected — engineer picks from this filtered list)
```

**Remove** `loadKeyDates()` or keep it internal-only — it must no longer be passed to the dialog as a selectable list.

**Expose from hook:**
```typescript
resolveKeyDateForSite: (siteId: string) => Promise<ResolvedKeyDate | null>;
projectCategoryAKeyDates: KeyDate[];   // For project-scoped doc picker
```

**Add type:**
```typescript
interface ResolvedKeyDate {
  id: string;
  code: string;
  description: string;
  category: string;
}
```

---

### 1B. `src/design_engineer/components/CreateDesignDocumentDialog.tsx`

**Remove:** Key Date dropdown (`<Menu>` / `<TextInput>` with key date options)

**Add props:**
```typescript
resolvedKeyDate: ResolvedKeyDate | null;   // null = no Category A KD linked to site
projectCategoryAKeyDates: KeyDate[];       // For project-scoped docs (no site)
onSiteSelectedInForm?: (siteId: string) => void; // Fires when engineer picks site inside the form
```

**Key Date field — three render states:**

| Condition | Renders |
|-----------|---------|
| Site selected + Category A KD found | Read-only row: `calendar-check` icon + `KD-A-XX — Description` |
| Site selected + no Category A KD | Warning row: `alert-circle` icon + `"No Key Date linked to this site — contact Planner"` |
| No site selected (project-scoped doc) | Filtered picker: Category A Key Dates only (from `projectCategoryAKeyDates`) |

**Site field — two render states:**

| Condition | Renders |
|-----------|---------|
| `selectedSiteId` is a real site ID | Read-only label showing site name |
| `selectedSiteId === 'all'` | Site picker dropdown (same as today but now triggers KD resolution on selection) |

**Internal logic:**
- When engineer picks a site in the form → call `onSiteSelectedInForm(siteId)` → parent resolves KD → passes back as `resolvedKeyDate`
- Key Date ID written to form state from `resolvedKeyDate.id` (not user-editable)
- On save: `keyDateId = resolvedKeyDate?.id ?? pickedProjectKDId ?? undefined`

**Remove:** `DOC_TYPE_TO_KD_CATEGORY` auto-suggestion (no longer needed — resolution is by site, not by doc type in the UI)

---

### 1C. `src/design_engineer/DesignDocumentManagementScreen.tsx`

**Add state:**
```typescript
const [resolvedKeyDate, setResolvedKeyDate] = useState<ResolvedKeyDate | null>(null);
```

**On dialog open (create or edit):**
```typescript
if (selectedSiteId !== 'all') {
  const kd = await resolveKeyDateForSite(selectedSiteId);
  setResolvedKeyDate(kd);
}
```

**Wire new props to dialog:**
```typescript
<CreateDesignDocumentDialog
  resolvedKeyDate={resolvedKeyDate}
  projectCategoryAKeyDates={projectCategoryAKeyDates}
  onSiteSelectedInForm={async (siteId) => {
    const kd = await resolveKeyDateForSite(siteId);
    setResolvedKeyDate(kd);
  }}
  // ... existing props
/>
```

---

### 1D. `src/design_engineer/components/DesignDocumentCard.tsx`

**Change:** Replace `"Key Date"` generic badge with actual code + description.

**Requires:** `DesignDocument` type to carry `keyDateCode` and `keyDateDescription` fields.

**In `loadDocuments()` (useDocumentCrud.ts):** When building the document object, look up the Key Date record by `keyDateId` and attach `keyDateCode` and `keyDateDescription`.

**Card renders:**
```
Before: [calendar-check] Key Date
After:  [calendar-check] KD-A-03 · Submit Design Documents
```

---

## Phase 2 — Project-Scoped Documents (Option A)

**Goal:** Documents with no site (simulation studies, product application engineering) pick from a Category A picker, not a full-project KD list.

This is partially built in Phase 1 (`projectCategoryAKeyDates` prop + picker when no site selected).

**Additional rules:**
- Document types `simulation_study` and `product_equipment` should NOT require a site (site field hidden or optional)
- Document types `installation` and `as_built` MUST have a site (site field required, form blocks submission without one)
- When `siteId` is absent and doc type is `simulation_study`/`product_equipment`, the Key Date picker shows `projectCategoryAKeyDates`

**File:** `CreateDesignDocumentDialog.tsx`
- Derive `requiresSite` from document type: `installation | as_built → true`, others → false
- If `!requiresSite`: hide site field (or show as optional), show Category A picker
- If `requiresSite`: site field required, Key Date auto-resolved from site

**File:** `useDocumentCrud.ts` — validation in `handleCreateDocument`:
```typescript
// if documentType requires site AND siteId is empty → validation error
// (already exists; verify it handles the new requiresSite logic correctly)
```

---

## Phase 3 — Manager Analytics: Design vs Site Activity Split

**Goal:** Manager's Key Date progress view shows separate bars/numbers for design document progress and site activity (Items) progress.

### Background

`KeyDateModel` already has `designWeightage` field (the % of a Key Date's weight that comes from design). The `progressPercentage` on a Key Date is a blended number today.

### What to Build

**In Manager's Key Date detail / progress view** (identify the exact screen):
- Current: single `progressPercentage` bar
- New: two progress indicators
  - **Design progress**: calculated from `design_documents` WHERE `key_date_id = kdId`, weighted by `weightage` field on each doc
  - **Site activity progress**: calculated from `items`/supervisor activities linked to sites on this Key Date

**Calculation (Design progress for a Key Date):**
```
designProgress = SUM(doc.weightage * progressFactor(doc.status)) / totalDesignWeightage
where progressFactor: draft=0, submitted=0.5, approved=1.0, approved_with_comment=1.0
```

**Calculation (Site activity progress for a Key Date):**
- Existing rollup logic from `items` — extract from current blended calculation

**Files likely affected:**
- Planning context or a Manager-specific hook that calculates KD progress
- Manager's Key Date screen component (identify path before implementing)
- Possibly `KeyDateProgressCalculator` service if one exists

> **Note:** Identify the exact Manager Key Date screen file before implementing Phase 3. Search for `progressPercentage` usage in Manager screens.

---

## Execution Order

```
Phase 1A → useDocumentCrud.ts (add resolver, expose new data)
Phase 1B → CreateDesignDocumentDialog.tsx (replace dropdown with read-only row)
Phase 1C → DesignDocumentManagementScreen.tsx (wire resolver, new props)
Phase 1D → DesignDocumentCard.tsx (show code + description)
Phase 2  → requiresSite logic, project-scoped doc handling
Phase 3  → Manager analytics split (separate PR)
```

Phases 1 and 2 should be a single PR. Phase 3 is a separate PR after Phase 1/2 is merged.

---

## Files Changed Summary

| File | Phase | Change |
|------|-------|--------|
| `src/design_engineer/hooks/useDocumentCrud.ts` | 1A | Add `resolveKeyDateForSite()`, `loadProjectKeyDates()`; expose `projectCategoryAKeyDates` |
| `src/design_engineer/components/CreateDesignDocumentDialog.tsx` | 1B | Replace KD dropdown → read-only row; add site picker in form; use `resolvedKeyDate` prop |
| `src/design_engineer/DesignDocumentManagementScreen.tsx` | 1C | Manage `resolvedKeyDate` state; wire `onSiteSelectedInForm`; pass new props |
| `src/design_engineer/components/DesignDocumentCard.tsx` | 1D | Show `keyDateCode + keyDateDescription` on card |
| `src/design_engineer/types/DesignDocumentTypes.ts` | 1D | Add `keyDateCode?: string`, `keyDateDescription?: string` to `DesignDocument` |
| Manager Key Date screen (TBD) | 3 | Split progress display: design docs vs site activities |
| Planning/Manager KD progress hook (TBD) | 3 | Separate design vs site activity progress calculation |

---

## No Schema Migration Required

All fields used (`key_date_id` on `design_documents`, `key_date_sites` junction, `category` on `key_dates`, `designWeightage` on `key_dates`) exist in the current schema (v49).

---

## Testing Checklist

### Phase 1 / 2
- [ ] Engineer selects a site that has a Category A Key Date → KD shown read-only ✓
- [ ] Engineer selects a site with NO Key Date linked → warning shown ✓
- [ ] Engineer is in "All Sites" view → site picker appears inside form ✓
- [ ] Engineer picks site in form → KD resolves and shows immediately ✓
- [ ] Simulation study doc (no site required) → Category A picker shown ✓
- [ ] Installation doc with no site → blocked (validation error) ✓
- [ ] Document card shows `KD-A-03 · Submit Design Documents` (not just "Key Date") ✓
- [ ] Edit existing document → KD re-resolves from site (shows current correct KD) ✓
- [ ] Site with two Category A KDs → first by code wins ✓

### Phase 3
- [ ] Manager Key Date view shows two separate progress values ✓
- [ ] Design progress: approved docs count, submitted = 50%, draft = 0% ✓
- [ ] Site activity progress: unchanged from current rollup logic ✓
- [ ] Total on KD card still shows blended/combined progress ✓
