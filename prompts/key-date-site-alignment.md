# Key Date & Site Assignment — Cross-Role Alignment Document

**Status:** Pending stakeholder review
**Prepared:** 2026-02-22
**Scope:** Design Engineer → Design Document creation flow + Key Date auto-resolution

---

## 1. The Problem Being Solved

Currently, when a Design Engineer creates a Design Document, the form asks them to **manually pick a Key Date** from a dropdown showing all project Key Dates. This is wrong because:

- The Design Engineer does not know (and should not decide) which Key Date their work contributes to.
- That relationship is defined by the **Planner** — who links a Site to specific Key Dates.
- The engineer guessing or leaving it blank breaks the project's progress tracking chain.

---

## 2. How the System Currently Works (Data Model)

```
Project
 └── Key Dates  (KD-G-01, KD-A-01, KD-B-01 ...)
      └── key_date_sites  (junction table)
           ├── Site A  → KD-A-01 (Design), KD-C-01 (Installation)
           ├── Site B  → KD-A-02 (Design), KD-D-01 (Installation)
           └── ...

Project
 └── Sites
      ├── Site A  ← design_engineer_id = Engineer X
      │            ← supervisor_id     = Supervisor Y
      └── Site B  ← design_engineer_id = Engineer X
                   ← supervisor_id     = Supervisor Z
```

**Key rule:** The Planner is the only one who:
1. Assigns a Site to a Design Engineer (`design_engineer_id` on Site).
2. Links a Site to one or more Key Dates (via `key_date_sites` table).

---

## 3. Key Date Categories (CMRL Contract Structure)

| Category | Meaning | Example Key Dates |
|----------|---------|------------------|
| **G** | General / Project-wide milestones | Project Commencement, Final Completion |
| **A** | Design submissions & approvals | Submit Design Docs, Design Approval |
| **B–F** | Works at specific sites/depots | Complete Installation at Substation A, T&C at Site B |

A single site typically has **multiple Key Dates across different categories**:
- `KD-A-03` — Submit Design Documents for Substation A ← *relevant to Design docs*
- `KD-C-01` — Complete Installation at Substation A ← *relevant to Installation/As-Built docs*

---

## 4. The Proposed Change (Design Engineer Flow)

### Before (current, wrong)
```
Engineer opens Create Document form
  → Sees dropdown: ALL project Key Dates (KD-G-01, KD-A-01, KD-A-02 ...)
  → Manually picks one (or leaves blank)
  → Key Date saved
```

### After (proposed, correct)
```
Engineer selects Site on main Design Doc screen  (already exists — SiteSelector)
  → Opens Create Document form
  → Form inherits the selected Site automatically (no re-selection needed)
  → System queries key_date_sites for Key Dates linked to that site
  → System picks the relevant Key Date based on document type:
       Design-type docs      → Key Date category A
       Installation/As-Built → Key Date category B–F
  → Key Date shown read-only — engineer sees it, cannot change it
  → Document saved with auto-resolved key_date_id
```

### What the Design Engineer sees in the form

| Field | Change |
|-------|--------|
| Site | **Read-only label** (inherited from main screen selection); picker shown only if viewing "All Sites" |
| Key Date | **Read-only info row** — icon + code + description (e.g., "KD-A-03 — Submit Design Documents") |
| Key Date (no match) | Shows "No Key Date linked to this site — contact Planner" |
| All other fields | Unchanged (Category, Doc Type, Doc Number, Title, DOORS link, Weightage) |

---

## 5. Document Type → Key Date Category Mapping

| Document Type | Maps To | Rationale |
|--------------|---------|-----------|
| `simulation_study` | Category **A** (Design) | Design-phase deliverable |
| `product_equipment` | Category **A** (Design) | Design-phase deliverable |
| `installation` | Category **B–F** (Works) | Site-specific works phase |
| `as_built` | Category **B–F** (Works) | Post-installation record |

If a site has multiple Key Dates within the same category (e.g., two Category A dates), the system picks the **first one** (lowest code). This edge case can be refined once we see real data.

---

## 6. Impact on Each Role

### Planner
**New responsibility (already partially exists):**
- Must link each Site to its relevant Key Dates via `key_date_sites` **before** the Design Engineer starts creating documents.
- Must assign `design_engineer_id` on each site (already done today).
- If the Planner has not linked a site to a Key Date, the engineer will see "No Key Date linked — contact Planner". This is intentional: it surfaces the gap immediately.

**Open question for Planner role:**
> Does the Planner currently have a UI to link Key Dates to Sites? If not, this is a prerequisite feature that needs to be built or verified.
Answer-Yes planner have a UI to assign both Design Engineer and Supervisor
---

### Design Engineer
**Change in workflow:**
- Must select a specific Site on the main screen **before** creating a document (cannot create from "All Sites" view without picking a site first — or pick in the form if still in "All" view).
- No longer sees or touches the Key Date field — it appears automatically.
- If the wrong Key Date appears, they know to contact the Planner (not fiddle with the form themselves).

**Open question for Design Engineer role:**
> Should creating a document from "All Sites" view (no site selected) be blocked, or should a site picker appear inside the form? Recommendation: show site picker inside form only when context site = "All". Answer- Agreed
- There are certain design works like Simulation or Product Application Engineering which are project specific not site specific. 
---

### Supervisor
**No direct change to their workflow.**
However, their Site progress (via Items/Activities they update) and the Design Engineer's document progress both roll up to the **same Key Dates**. This change ensures design documents count correctly toward those Key Dates without manual intervention.

**Open question for Supervisor role:**
> Do supervisors need visibility of which Key Dates a site is linked to, or is this only a Planner/Design Engineer concern?
-Answer- Leave at this moment
---

### Manager
**No direct change to their workflow.**
The Manager's Change Orders and project-level KPIs will benefit from more accurate Key Date progress (since design document linkage is now automatic and reliable).

**Open question for Manager role:**
> Should the Manager's Key Date progress view distinguish between progress from design documents vs. progress from site activities (Items)? Currently both contribute to the same `progressPercentage` on a Key Date.
-Answer- Yes manager should see progress distinction between design vs site activities
---

### Logistics / Commercial
**No impact.**
These roles do not interact with Design Documents or Key Dates directly.

---

## 7. Edge Cases to Resolve

| Scenario | Proposed Handling |
|----------|------------------|
| Site has NO linked Key Dates | Show warning: "No Key Date linked to this site — contact Planner" |
| Site has Key Dates but none match the document type category | Same warning as above |
| `selectedSiteId = 'all'` (engineer hasn't selected a site) | Show site picker inside the form |
| Engineer editing an existing document (already has a Key Date) | Re-resolve from site + doc type; show read-only (same logic) |
| Site is unassigned (no `design_engineer_id` match) | Not applicable — SiteSelector already filters to assigned sites only |

---

## 8. What Does NOT Change

- The `key_date_id` field on `design_documents` table — still stores the ID (no schema migration needed).
- How Key Date progress is calculated — no change to rollup logic.
- The DOORS package link, weightage, doc number, title, category, revision fields.
- All other roles' screens and workflows.

---

## 9. Files to be Changed (Implementation Scope)

| File | Change |
|------|--------|
| `src/design_engineer/hooks/useDocumentCrud.ts` | Add `loadKeyDateSites()` — query `key_date_sites` by site; replace manual key date list with resolver function |
| `src/design_engineer/components/CreateDesignDocumentDialog.tsx` | Replace Key Date dropdown → read-only info row; Site picker → read-only label (or conditional picker) |
| `src/design_engineer/DesignDocumentManagementScreen.tsx` | Pass `selectedSiteId` into dialog props |
| `src/design_engineer/components/DesignDocumentCard.tsx` | (Minor) show Key Date code + description on card instead of just "Key Date" badge |

No database schema migration required.

---

## 10. Open Questions Summary (for stakeholder review)

1. **Planner UI** — Does the Planner currently have a screen to link Key Dates to Sites? If not, is that a blocker?-- Yes
2. **Create from "All Sites" view** — Show site picker inside form, or block creation until a site is selected?--Yes
3. **Supervisor visibility** — Do supervisors need to see Key Date–Site links?--will decide later
4. **Manager analytics** — Should design doc progress vs. site activity progress be broken out separately in Key Date views?--Yes
5. **Multiple KDs in same category** — If a site has two Category A Key Dates, which one wins? First by code, or does Planner set a priority?--Answered already above

---

*Add your comments and observations below for each role before implementation begins.*

## Stakeholder Comments

### Planner
< Also Assigns a Site to a supervisor )

### Design Engineer
<- The documents type in serial no 5 above remains part of design in different stages, Simulation, Installation, Product and As built all belongs to design Key Dates.
- If a site belongs to diffrent key dates means for diffrent works, for design works a key date, for other site installation & commissioning another key date, >

### Supervisor
<!-- Add observations here -->

### Manager
<!-- Add observations here -->

### Commercial / Logistics
<!-- Add observations here -->
