# Project Simulation Plan — MRE Line-7 Extension
**Site Progress Tracker v2.25**
*Complete end-to-end walkthrough across all 7 roles*

---

## Overview

This document guides a full project lifecycle simulation for a **Metro Rail Electrification (MRE)** project. The simulation covers every role in sequence, with specific steps, data values, and expected outcomes at each stage. Use this as the reference during implementation.

**Project**: MRE Line-7 Extension
**Scope**: Traction Substation + OHE (Overhead Equipment) installation
**Contract Value**: ₹150 Crore
**Duration**: 365 days (12 months)
**DLP**: 24 months post-completion

---

## Default User Credentials

| Role | Username | Password |
|------|----------|----------|
| Admin | `admin` | `Admin@2025` |
| Planner | `planner` | `Planner@2025` |
| Design Engineer | `designer` | `Designer@2025` |
| Manager | `manager` | `Manager@2025` |
| Supervisor | `supervisor` | `Supervisor@2025` |
| Logistics | `logistics` | `Logistics@2025` |
| Commercial Manager | `commercial` | `Commercial@2025` |

---

## Project Setup Summary

When demo data is generated for all 6 roles, the following baseline data exists:

### Sites (3)
| Site | Type | Location |
|------|------|----------|
| Simulation Studies | Design/Project-Level | Project-Level — All Systems |
| Traction Substation (TSS-01) | Physical | Zone 1 — North Block, Plot 14 |
| OHE Zone 1 — North Corridor | Physical | Zone 2 — North Corridor, Ch. 0+000 to 15+500 |

### Key Dates (6)
| ID | Milestone | Day | Weightage |
|----|-----------|-----|-----------|
| KD-G-01 | Site Possession & Access | 30 | 10% |
| KD-A-01 | Design Approval | 60 | 15% |
| KD-B-01 | Material Procurement Complete | 120 | 15% |
| KD-C-01 | Civil Works Complete | 240 | 25% |
| KD-D-01 | Erection & Commissioning | 330 | 20% |
| KD-F-01 | Final Completion & Handover | 365 | 15% |

### Commercial Config (set on project record)
- Contract Value: ₹150 Crore
- Advance (Mobilization): ₹15 Crore @ 10% recovery per IPC
- Advance (Performance): ₹5 Crore @ 5% recovery per IPC
- Retention Rate: 5% per IPC
- DLP: 24 months

---

## Simulation Phases

---

## Phase 0 — Admin Setup

**Role**: Admin
**Login**: `admin` / `Admin@2025`
**Pre-condition**: Fresh install or DB reset

### Steps

**Step 0.1 — Verify DB Reset**
1. Open app → Login as `admin`
2. Admin Dashboard → tap **Database Reset** card → **Reset Database**
3. Restart app → login again as `admin`
4. Confirm 3 tabs: Dashboard | Projects | Users

**Step 0.2 — Create Project**
1. Tap **Projects** tab
2. Tap **+** FAB → create project: `MRE Line-7 Extension`
   - Client: Metro Rail Corporation
   - Start Date: today
3. Tap Save → project appears in the list

**Step 0.3 — Assign All Users to the Project**

> **CRITICAL**: Every user must be assigned to `MRE Line-7 Extension` before generating demo data. The demo data generators use the selected project, so all users must be linked to it first.

1. Tap **Users** tab
2. Confirm all 7 users exist (admin, planner, designer, manager, supervisor, logistics, commercial)
3. For each of the 6 non-admin users:
   - Tap the user card → tap **Edit**
   - Tap **Assigned Project** dropdown → select `MRE Line-7 Extension`
   - Tap **Update** to save

| User | Role | Assignment |
|------|------|------------|
| planner | Planner | MRE Line-7 Extension |
| designer | Design Engineer | MRE Line-7 Extension |
| supervisor | Supervisor | MRE Line-7 Extension *(Required)* |
| manager | Manager | MRE Line-7 Extension *(Required)* |
| logistics | Logistics | MRE Line-7 Extension |
| commercial | Commercial Manager | MRE Line-7 Extension |

> `admin` does not need a project assignment.

**Step 0.4 — Generate Demo Data (in order)**

> **IMPORTANT**: Run demo data in this exact sequence to satisfy dependencies.

| Order | Role | Why this order |
|-------|------|---------------|
| 1 | Planner | Creates sites, key dates, WBS — foundation for all others |
| 2 | Design Engineer | Needs sites to exist (DOORS + docs link to sites) |
| 3 | Supervisor | Needs sites to exist (assigns sites to supervisor user) |
| 4 | Manager | Creates vendors, POs (references sites) |
| 5 | Logistics | Needs items + sites (links materials to WBS items) |
| 6 | Commercial Manager | Needs project + KDs to exist |

For each:
1. Dashboard → **Demo Data Generator** card
2. Select Role → Select Project (`MRE Line-7 Extension`)
3. For Supervisor: also select Supervisor user (`John Supervisor`)
4. Tap **Generate [Role] Demo Data** → confirm

**Expected after all 6 generations**:
- 3 sites, 6 key dates, 7 milestones, ~24 WBS items
- 5 DOORS packages, 5 RFQs, 12 design documents
- 4 vendors, 5 POs, 3 BOMs, 12 BOM items
- 20 discipline-specific materials
- 5 budget categories, 12 costs, 8 invoices, 2 advances, 3 VOs

**Step 0.5 — Switch to Each Role (Verify)**
1. Dashboard → **Role Switcher** card
2. Cycle through each role briefly to confirm app loads without crash

---

## Phase 1 — Planning & Scheduling

**Role**: Planner
**Login**: `planner` / `Planner@2025`
**Pre-condition**: Planner demo data generated (Phase 0)

### Step 1.1 — Review Dashboard KPIs
1. Login as `planner` → tutorial launches automatically (11 steps — go through each)
2. Dashboard tab → observe:
   - **Schedule Overview**: ~2% (expected — Supervisor demo data seeds a few WBS items with partial progress)
   - **Project Progress**: ~2% (weighted rollup of KD progress across all 6 KDs)
   - **KD-A-01 (Design Approval)**: ~11% (expected — Designer demo data seeds some approved/submitted docs that contribute to this KD's dual-track progress)
   - KD progress count: 0 of 6 complete

> Note: Tutorial steps may blink briefly when tapping Next — cosmetic re-render, not a bug.

### Step 1.2 — Review Key Dates
1. Tap **Key Dates** tab
2. Verify all 6 KDs are listed with target dates and weightages
3. Observe KD-G-01 (Site Possession) — status: Not Started

### Step 1.3 — Review WBS Structure
1. Drawer → **Work Breakdown**
2. Select **TSS-01** site → confirm 9 items in flat list: 3 top-level groups (Site Preparation, Civil & Structural, Equipment Erection) each with 2 sub-items (indented)
3. Select **OHE Zone 1** → confirm 9 items: 3 top-level groups (Survey & Preparation, OHE Civil Works, OHE Erection & Stringing) each with 2 sub-items

### Step 1.4 — Set Gantt Baseline
1. Tap **Gantt** tab → Tasks sub-tab
2. Select site: TSS-01 → review task bars
3. Tap baseline chip → **Set Baseline** → confirm
4. Switch to Key Dates sub-tab → observe milestone diamonds

### Step 1.5 — View Schedule
1. Tap **Schedule** tab → switch to Timeline view
2. Observe tasks in calendar/timeline layout
3. Switch to List view → confirm all items visible

### Step 1.6 — Simulate KD-G-01 Completion
1. Key Dates tab → tap **Edit** on **KD-G-01** (Site Possession & Access)
2. In the edit form: change Progress Mode to **Binary**, toggle the **Done / Not Done** switch ON → Save
3. Dashboard → observe Schedule Overview: KD-G-01 shows 100% → project KD progress updates

> **Note**: KD cards are not tappable for navigation — use the Edit / Sites buttons directly on the card.
> KDs with site-linked items (auto mode) derive progress from WBS completion; binary/manual KDs can be toggled directly.

**Expected outcome**: Schedule Overview shows 1 completed item, KD-G-01 at 100%, project dashboard updates.

---

## Phase 2 — Design & Engineering

**Role**: Design Engineer
**Login**: `designer` / `Designer@2025`
**Pre-condition**: Designer demo data generated, KD-A-01 (Design Approval) is the next KD target

### Step 2.1 — Review Dashboard
1. Login as `designer`
2. Dashboard → observe document counts by status (draft, submitted, approved)

### Step 2.2 — Review Simulation Study Documents
1. Tap **Design Documents** tab
2. Filter by site: Simulation Studies
3. Observe 4 docs: DD-SIM-001 through DD-SIM-004 (various statuses)

### Step 2.3 — Submit a Draft Document
1. Find a `draft` document → tap → tap **Submit for Review**
2. Confirm status changes to `submitted`
3. Note: this triggers a Pending Approvals count increase in Manager dashboard

### Step 2.4 — Review DOORS Packages
1. Tap **DOORS Packages** tab
2. Review 5 packages — note TSS and OHE discipline separation
3. On the **DOORS-TSS-AUX-TRF-001** card, observe: Linked Docs count, quantity, compliance bars, and status timeline
4. Tap **Mark Received** → then **Mark Reviewed** → then **Approve** to advance the status through the workflow
   > Note: All details are shown inline on the card. Tap the action buttons (not the card itself) to update status.

### Step 2.5 — Review Design RFQs
1. Tap **Design RFQs** tab
2. Observe statuses: draft, issued, evaluated, awarded, cancelled
3. On the **RFQ-DE-2026-003** (Contact Wire Supply — awarded) card, tap **Quotes (5)**
4. In the Vendor Quotes sheet: observe 5 vendor quotes with scores and ranks — CableCo is L1 (awarded)
5. Switch to **Compare** view to see price, lead time, and compliance side-by-side

### Step 2.6 — Create a New Document (TSS Installation)
1. Tap **+** FAB → Create Design Document
2. Site: TSS-01
3. Type: Installation
4. Fill: Number, Title, Revision → Save
5. Submit immediately → verify status = `submitted`

**Expected outcome**: Manager dashboard Pending Approvals count increases.

---

## Phase 3 — Management & Procurement

**Role**: Manager
**Login**: `manager` / `Manager@2025`
**Pre-condition**: Design docs submitted (Phase 2), Planner demo data exists

### Step 3.1 — Review Dashboard KPIs
1. Login as `manager`
2. Dashboard → observe:
   - **Customer Review** KPI badge (should show count > 0 — highlighted in orange border)
   - Contract/budget overview
   - Milestone progress

### Step 3.2 — Monitor Design Document Approvals
> **Note**: The approving authority is the **Customer (Metro Rail Corporation)**, not the Manager.
> The Manager's role here is **monitoring only** — no approve/reject actions.
> Status changes (submitted → approved / rejected) are made by the Design Engineer based on customer response.

1. Tap **Customer Review** KPI card → opens Doc Approvals screen
   (or Drawer → **Doc Approvals**)
2. Observe submitted documents with aging chips:
   - Green chip (< 7 days): within normal review window
   - Amber chip (7–14 days): follow-up recommended
   - Red chip (≥ 14 days): overdue — escalate with the Design Engineer
3. Note the info banner: "Submitted to customer for review. Status is updated by the Design Engineer when the customer responds."
4. Return to dashboard

### Step 3.3 — Review Purchase Orders
1. Tabs → **Finance**
2. Observe 5 Purchase Orders showing aggregate totals: total value, statuses (delivered, in_progress, issued, overdue)
3. Note the PO summary section — individual PO details are tracked in the Logistics module

### Step 3.4 — Review Finance Overview
1. Finance tab → observe aggregate metrics: total PO value ₹90,00,000, active supplier count
2. Note: Detailed vendor scorecards and individual PO tracking are in the **Logistics** module (accessible to the Logistics role)

### Step 3.5 — Review BOM
1. Drawer → **BOM Management**
2. Tap **TSS Main Equipment BOM v2.0** → observe 4 line items:
   - Material, Labor, Equipment, Subcontractor (one each)
3. Tap another BOM (OHE or Simulation Studies) to see their respective items
   - Total across all 3 BOMs: ~12 items

### Step 3.6 — Create a Change Order
1. Drawer → **Change Orders**
2. Tap **+** FAB → New Change Order
3. Fill: `CO-001 — Additional grounding requirements at TSS-01`
   - Type: Scope Addition
   - Value: ₹45L
   - Justification: Safety compliance requirement
4. Save → observe change order in list with Pending status

### Step 3.7 — Review Key Date Progress
1. Tabs → **Key Dates**
2. Confirm KD-G-01 shows as complete (updated by Planner in Phase 1)
3. Note KD-A-01 (Design Approval, Day 60) — target upcoming

**Expected outcome**: Manager can monitor document submission aging and track project financials. Customer approval status changes are reflected when the Design Engineer updates them. Change order visible to commercial.

---

## Phase 4 — Site Execution

**Role**: Supervisor
**Login**: `supervisor` / `Supervisor@2025`
**Pre-condition**: Supervisor demo data generated (sites assigned to John Supervisor)

### Step 4.1 — Review Dashboard
1. Login as `supervisor`
2. Dashboard → observe 2 sites: TSS-01 and OHE Zone 1
3. Check overall site progress % (should be partial from demo data)

### Step 4.2 — Update WBS Item Progress (TSS-01)
1. **Items** tab → select TSS-01
2. Tap **Foundation Excavation** → update progress to 100% → Save
3. Tap **RCC Foundation** → update progress to 75% → Save
4. Return to dashboard → observe progress bar update

### Step 4.3 — Log a Daily Report
1. **Daily Reports** tab → tap **+** FAB
2. Fill:
   - Date: today
   - Site: TSS-01
   - Labour: 25 (Civil: 10, Electrical: 10, Supervisory: 5)
   - Plant: Crane 1 no., Excavator 1 no.
   - Progress: Foundation excavation 100% complete. RCC shuttering in progress.
3. Save → confirm report created

### Step 4.4 — Raise a Hindrance
1. Drawer → **Hindrance Reports** → tap **+** FAB
2. Fill:
   - Site: OHE Zone 1
   - Type: Material Shortage
   - Description: Contact wire delivery delayed by 2 weeks — OHE stringing cannot commence
   - Impact: 14 days delay to KD-D-01 (Erection & Commissioning)
3. Save → observe hindrance in list

### Step 4.5 — Record Material Consumption
1. Drawer → **Material Tracking**
2. Select site: TSS-01
3. Log consumption: OPC Cement 25 bags, TMT Steel 500 kg
4. Observe updated stock levels

### Step 4.6 — Complete a Site Inspection
1. Drawer → **Site Inspection** → tap **+** New Inspection
2. Type: Safety Inspection
3. Site: TSS-01
4. Complete checklist items (tick each)
5. Remarks: All safety norms complied. Helmets, vests in use.
6. Save → inspection logged

### Step 4.7 — Update OHE Zone 1 Progress
1. Items tab → select OHE Zone 1
2. Tap **Mast Foundation** → update to 100% → Save
3. Tap **Mast Erection** → update to 60% → Save
4. Note: Stringing is blocked (hindrance raised in 4.4)

**Expected outcome**: Planner dashboard reflects updated WBS progress. KD-C-01 (Civil Works) progress increases. Risk of delay to KD-D-01 visible to Commercial.

---

## Phase 5 — Logistics & Supply Chain

**Role**: Logistics
**Login**: `logistics` / `Logistics@2025`
**Pre-condition**: Logistics demo data generated

### Step 5.1 — Review Dashboard
1. Login as `logistics`
2. Dashboard → observe delivery summary: ordered, in-transit, delivered, overdue counts
3. Note any shortage flags

### Step 5.2 — Review Materials by Site
1. **Materials** tab
2. Filter by TSS discipline → observe 8 TSS materials
3. Filter by OHE discipline → observe 8 OHE materials
4. Note: Contact Wire status = `shortage` (aligns with Supervisor hindrance in Phase 4)

### Step 5.3 — Review Inventory
1. **Inventory** tab
2. Check stock levels → identify low-stock items
3. Flag Contact Wire for urgent reorder

### Step 5.4 — Mark a Delivery as Received
1. **Deliveries** tab
2. Find pending delivery (Transformer Oil or Silica Gel)
3. Tap → **Mark as Received** → enter actual receipt date
4. Observe material status changes from `ordered` → `delivered`

### Step 5.5 — Review DOORS Register
1. Drawer → **DOORS Register**
2. View 5 packages — observe delivery/approval status per package
3. Cross-check DOORS-TSS-AUX-TRF-001 against PO-MGR-2026-001 (delivered)

### Step 5.6 — Review RFQ Status
1. Drawer → **RFQ Management**
2. Observe 5 RFQs (from Design Engineer demo data)
3. Review RFQ-DE-2026-002 (evaluated) → view vendor comparison

### Step 5.7 — Review Purchase Orders
1. Drawer → **Purchase Orders**
2. Confirm PO-MGR-2026-005 (SCADA RTU) overdue status
3. Note for escalation to Manager

**Expected outcome**: Logistics dashboard shows improved delivery rate after marking receipt. Contact Wire shortage noted for cross-role action.

---

## Phase 6 — Commercial Management

**Role**: Commercial Manager
**Login**: `commercial` / `Commercial@2025`
**Pre-condition**: All other demo data generated, KD-G-01 marked complete (Phase 1), some WBS progress updated (Phase 4)

---

### Stage 6A — Early Project (KDs 1–2 Period)

**Objective**: Raise first IPC against KD-G-01 (Site Possession, completed in Phase 1)

#### Step 6A.1 — Review Dashboard
1. Login as `commercial`
2. Dashboard → observe:
   - **Contract KPI card**: Contract Value ₹150 Cr, Gross Billed 0%, KD Progress ~10%
   - **Commercial Risk Alerts**: likely shows Billing Lag (work ahead of billing)
3. Tap Billing Lag risk row → navigates to KD Billing screen

#### Step 6A.2 — Generate IPC-001 (KD-G-01)
1. Drawer → **KD Billing** (or tap Billing Lag shortcut)
2. KD-G-01 (Site Possession, 10% weight) shows as Complete + unbilled (orange highlight)
3. Tap **Generate IPC** → IPC dialog opens:
   - Gross = ₹150 Cr × 10% = **₹15.00 Cr**
   - Retention (5%) = ₹0.75 Cr
   - Advance Recovery (10%) = ₹1.50 Cr
   - LD = ₹0 (no delay)
   - TDS (2%) = ₹0.30 Cr
   - **Net Payable = ₹12.45 Cr**
4. Review deductions → tap **Save IPC**
5. Observe: Invoice created, Retention record auto-created

#### Step 6A.3 — Review Advance Recovery
1. Drawer → **Advance Recovery**
2. Observe 2 advances:
   - Mobilization: ₹15 Cr issued, ₹3 Cr recovered, ₹12 Cr outstanding
   - Performance: ₹5 Cr issued, ₹0 recovered
3. Review "Impact on Next 3 KD Bills" section — projected deductions per upcoming IPC
4. Observe mobilization advance balance = ₹12 Cr (after IPC-001 recovery of ₹1.5 Cr)

#### Step 6A.4 — Review Retention Monitor
1. Drawer → **Retention Monitor** → **Client** tab
2. Observe IPC-001 retention: ₹0.75 Cr, aging badge = Green (<6 months)
3. Switch to **Vendor** tab → observe retention held from subcontractor invoices
4. Note DLP end dates (24 months from project completion)

#### Step 6A.5 — Review Commercial Risk Alerts
1. Return to Dashboard
2. Risk widget should show updated risks:
   - Billing Lag may have reduced (IPC-001 raised) or cleared
   - Slow-Paying Client risk if IPC-001 not yet paid (>60 days threshold not reached yet)
   - Pending VOs: 2 VOs (VO-002 under_review, VO-003 pending) still at risk

---

### Stage 6B — Mid-Project (KDs 3–4 Period)

**Objective**: Handle LD risk, VO approvals, vendor payments, cash flow planning

#### Step 6B.1 — Simulate KD-A-01 Completion with Delay
*(Switch to Planner briefly: mark KD-A-01 as complete but past target date)*
1. Login as `planner` → Key Dates → KD-A-01 (Design Approval, Day 60)
2. Mark complete with actual date = Day 75 (15 days late)
3. Login as `commercial`

#### Step 6B.2 — LD Risk Calculator
1. Drawer → **LD Risk Calculator**
2. Observe KD-A-01 delayed:
   - Delay: 15 days → LD exposure calculated (tiered rate)
   - Days 1–28 at initial rate, Day 29+ at extended rate
3. Set EOT status for KD-A-01: **Filed** (Extension of Time claim submitted)
4. Observe LD exposure with EOT note

#### Step 6B.3 — Generate IPC-002 (KD-A-01, with LD)
1. Drawer → **IPC Readiness** → select KD-A-01
2. Review 8-item checklist:
   - Auto-checked: VO approval (VO-002 under_review → will show Conditional)
   - Manual items: tick Engineer Certificate, Measurement Book, BOQ Reconciliation
3. Readiness badge = **Conditional** (some optional items missing)
4. Tap **Proceed to KD Billing**
5. KD Billing → Generate IPC for KD-A-01:
   - Gross = ₹150 Cr × 15% = **₹22.50 Cr**
   - Retention (5%) = ₹1.125 Cr
   - Advance Recovery (10%) = ₹2.25 Cr
   - LD Deducted = calculated value (e.g., ₹0.30 Cr for 15 days)
   - TDS (2%) = ₹0.45 Cr
   - **Net Payable ≈ ₹18.375 Cr**
6. Save IPC-002

#### Step 6B.4 — Variation Orders
1. Drawer → **Variation Orders**
2. Review summary: Total VO Value ₹4.55 Cr, Approved ₹2.5 Cr, Revenue at Risk ₹2.55 Cr
3. Tap VO-001 (approved) → toggle **Include in next IPC** = ON
4. Tap VO-002 chip (under_review) → advance to **Approved**
5. Observe VO-002 now shows Include in IPC toggle
6. VO-003 (pending) → advance to **Under Review**

#### Step 6B.5 — Vendor Payments
1. Drawer → **Vendor Payments**
2. Filter: **Overdue** → observe CableCo, SwitchGear with overdue invoices
3. Review PowerTech: Full recommendation (green) → all good
4. Review CableCo: Partial recommendation (amber) — review overdue detail
5. Review SwitchGear Solutions: Hold recommendation (red) — SCADA PO overdue + zero recent payment
6. Note recommendations for next payment cycle

#### Step 6B.6 — Cash Flow Forecast
1. Drawer → **Cash Flow Forecast**
2. Observe 6-month bar chart:
   - Inflows: pending KD dates × weightage × ₹150 Cr
   - Outflows: vendor invoices + advance recovery
3. Identify months with funding gap (red highlight)
4. Note peak working capital requirement (prominent display)
5. Plan: flag month 4 gap to management

---

### Stage 6C — Pre-IPC Submission (KD-B-01 / KD-C-01)

**Objective**: Use IPC Readiness checklist before raising next IPCs

#### Step 6C.1 — IPC Readiness for KD-B-01
1. Drawer → **IPC Readiness** → select KD-B-01 (Material Procurement)
2. Checklist (8 items):
   - ✅ Auto: Previous IPC paid (IPC-002 paid = yes / no — observe)
   - ✅ Auto: LD status reviewed
   - ✅ Auto: VO-001 approved (yes)
   - ☐ Manual (mandatory): Engineer Certificate
   - ☐ Manual (mandatory): Measurement Book reference
   - ☐ Manual (mandatory): BOQ reconciliation checked
   - ☐ Optional: Hindrance register reviewed
   - ☐ Optional: GST compliance verified
3. Tick all mandatory + optional items
4. Readiness badge = **Safe** ✅
5. Tap **Proceed to KD Billing**

#### Step 6C.2 — Generate IPC-003 (KD-B-01, with VO-001)
1. KD Billing → Generate IPC for KD-B-01:
   - Gross = ₹150 Cr × 15% + VO-001 billable ₹2.5 Cr = **₹25 Cr**
   - Retention = ₹1.25 Cr
   - Advance Recovery = ₹2.25 Cr + VO recovery
   - TDS = ₹0.5 Cr
   - **Net Payable ≈ ₹21 Cr (approx)**
2. Save IPC-003
3. Dashboard → Contract KPI: Gross Billed now shows 40%+ of CV

#### Step 6C.3 — Observe Dashboard Risk Update
1. Return to Dashboard
2. Risk widget: Billing Lag risk should clear or reduce (billing now near work progress %)
3. Advance Pressure risk: check if outstanding advance now below 15% CV threshold

---

### Stage 6D — Project Closure (Post KD-F-01)

**Objective**: DLP tracking, retention release, commercial closure checklist

**Pre-condition**: All 6 KDs marked complete (simulate in Planner)

#### Step 6D.1 — Mark All Remaining KDs Complete
*(Switch to Planner)*
1. Login as `planner`
2. Key Dates → mark KD-C-01, KD-D-01, KD-F-01 as complete
3. Login as `commercial`

#### Step 6D.2 — Final Bill & DLP Screen
1. Drawer → **Final Bill & DLP**
2. Observe DLP Status banner:
   - Status: **DLP Running** (project complete, DLP period started)
   - DLP End Date = last KD completion date + 24 months
   - Countdown to DLP end
3. Retention Register: lists all client retentions (from IPC-001, IPC-002, IPC-003)
   - Release buttons = inactive (DLP not yet ended)
4. Closure Checklist (7 items — all auto-checked from data):
   - VOs settled: VO-001 ✅, VO-002 ✅, VO-003 ❌ (still pending)
   - Advances recovered: check balance
   - BGs returned, snag list cleared, etc.
5. Overall status: **Hold** (VO-003 pending, DLP running)

#### Step 6D.3 — Resolve VO-003
1. Drawer → **Variation Orders**
2. VO-003 → advance from Under Review → **Approved**
3. Return to Final Bill — VO settlement auto-check updates

#### Step 6D.4 — Simulate DLP End (Test Release)
> Note: In real usage, this happens after DLP end date passes. For simulation, observe the UI state.
1. Final Bill screen → observe retention rows
2. If any DLP end date has passed → **Release** button becomes active (green)
3. Tap Release → confirm → retention marked as released
4. Observe Retention Monitor Client tab — released records show `Released` badge

#### Step 6D.5 — Commercial Closure
1. Final Bill → Closure Checklist → tick all remaining manual items
2. Observe status badge change: **Closure Ready** 🎉
3. Tap **Mark as Commercially Closed**
4. Project status updates to Commercially Closed

---

## Phase 7 — Cross-Role Verification

After completing all phases, verify these end-to-end data linkages:

| Check | Where to Verify | Expected |
|-------|----------------|----------|
| KD progress updates from WBS | Planner Dashboard | KD-C-01 progress reflects Supervisor's TSS-01 + OHE progress |
| Manager sees submitted docs | Manager → Pending Approvals KPI | Count matches docs submitted by Designer |
| Commercial KPI gross billed % | Commercial Dashboard KPI card | Increases after each IPC saved |
| Billing Lag risk clears | Commercial Risk Alerts widget | Cleared once billing % catches up to work % |
| Advance balance reduces | Advance Recovery screen | ₹12 Cr → ₹10.5 Cr → ₹9 Cr after each IPC |
| Retention aging | Retention Monitor Client tab | Turns orange after 6 months, red after 12 |
| DOORS delivery status | Logistics DOORS Register | Aligns with PO delivery status from Manager |
| Hindrance impact on KD | Planner Key Dates | KD-D-01 at risk due to Contact Wire shortage hindrance |

---

## Simulation Sequence Summary

```
Phase 0  Admin        DB Reset → Create Project → Generate Demo Data (all 6 roles in order)
   ↓
Phase 1  Planner      Review KDs/WBS → Set Baseline → Mark KD-G-01 Complete
   ↓
Phase 2  Designer     Submit docs → Review DOORS → Create new TSS installation doc
   ↓
Phase 3  Manager      Approve docs → Review POs (SCADA overdue) → Create Change Order
   ↓
Phase 4  Supervisor   Update WBS progress (TSS + OHE) → Daily Report → Raise Hindrance
   ↓
Phase 5  Logistics    Review materials → Mark delivery received → Flag Contact Wire shortage
   ↓
Phase 6A Commercial   Generate IPC-001 (KD-G-01) → Review Advances + Retention
   ↓
Phase 6B Commercial   LD Risk for KD-A-01 → Generate IPC-002 → VO approvals → Vendor payments → Cash flow
   ↓
Phase 6C Commercial   IPC Readiness → Generate IPC-003 with VO-001
   ↓
Phase 6D Commercial   All KDs complete → DLP tracking → Retention release → Commercial Closure
```

---

## Notes & Tips

- **Demo data is additive**: Running generator twice creates duplicates. Reset DB if restarting simulation.
- **KD completion is the trigger**: Commercial IPC generation only works when the KD is marked complete by Planner.
- **IPC Readiness is session-only**: Manual checklist toggles reset on screen close (no DB write — it's a pre-flight check, not audit trail).
- **Risk widget is reactive**: Returns to All Clear state when underlying risks are resolved.
- **Retention Release**: Only activates when `dlpEndDate < today`. For testing, set a past date on the project's DLP or complete a KD with a past date.
- **Advance recovery projection**: Looks at next 3 pending (uncompleted) KDs — mark KDs complete to see projection shift.
- **Cash Flow Forecast**: Inflows are computed from pending KD `targetDate` and weightage — completed KDs disappear from the forecast.

---

*Document version: 1.0 | Created: 2026-03-05 | App version: v2.25*
