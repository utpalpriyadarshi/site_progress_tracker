# Commercial Manager — Advanced Implementation Plan
**Date:** 2026-03-04
**Based on:** `prompts/commercial_manager_improvements.md`
**Status:** Planning

---

## 1. Prompt Set Analysis

The improvement file contains **two overlapping prompt sets**. Here is how they relate:

| Dimension | Set 1 (Lines 4–233) | Set 2 (Lines 244–281) |
|-----------|---------------------|----------------------|
| Focus | **What to calculate** — formulas, deductions, outputs | **What to build** — screens, columns, interactions |
| Format | Narrative billing prompts (12 items) | Structured UI/UX specifications (10 items) |
| Unique value | Adds: Milestone Readiness, Cash Flow Forecast, Variation Orders, LD Risk, IPC Readiness, DLP Closure, Commercial Risk Early Warning | Adds: Auto-draft invoice on KD achievement, Link vendor invoice to KD |

### Merged Canonical Feature List (12 distinct features)

After deduplication, the two sets produce **12 features** (neither set alone covers all):

| # | Feature | Set 1 | Set 2 |
|---|---------|-------|-------|
| A | **KD Milestone Billing** — tracker, invoice gen, gross/net calc | #1 | #1 #2 #3 |
| B | **Advance Recovery** — scheduler, auto-deduct, balance tracker | #3 | #6 #7 |
| C | **Retention Management** — 5% hold, DLP, release tracker | #4 | #8 #9 |
| D | **Contractor/Vendor Payment** — back-to-back, recommendation | #5 | #4 #5 |
| E | **Cash Flow Forecasting** — 6-month inflow/outflow projection | #6 | — |
| F | **Variation Orders** — VO module, revenue impact, margin | #7 | — |
| G | **LD Risk Calculator** — exposure, EOT, revenue at risk | #8 | — |
| H | **KPI Dashboard Enhancements** — contract value, billing vs progress gap, aging | #9 | #10 |
| I | **IPC Readiness Checklist** — pre-submission verification | #10 | — |
| J | **DLP & Final Bill Closure** — post-completion settlement | #11 | — |
| K | **Milestone Readiness Check** — engineer cert, MB, BOQ, hindrance | #2 | — |
| L | **Commercial Risk Early Warning** — lag, pressure, slow-paying | #12 | — |

---

## 2. Current Codebase State

### What Already Exists

| Module | Status | Location |
|--------|--------|----------|
| Budget Management (CRUD) | ✅ Production | `src/commercial/BudgetManagementScreen.tsx` |
| Cost Tracking (CRUD) | ✅ Production | `src/commercial/CostTrackingScreen.tsx` |
| Invoice Management (basic) | ✅ Production | `src/commercial/InvoiceManagementScreen.tsx` |
| Financial Reports | ✅ Production | `src/commercial/FinancialReportsScreen.tsx` |
| Dashboard (budget health, cash flow, invoice status) | ✅ Production | `src/commercial/CommercialDashboardScreen.tsx` |
| KeyDateModel with weightage, delay damages, status | ✅ Production | `models/KeyDateModel.ts` |
| InvoiceModel (basic: amount, status, vendor, PO) | ✅ Production | `models/InvoiceModel.ts` |
| BudgetModel / CostModel | ✅ Production | `models/BudgetModel.ts`, `models/CostModel.ts` |

### What the KeyDateModel Already Provides (reuse opportunity)

`models/KeyDateModel.ts` already has:
- `code` — KD identifier (KD-G-01, KD-A-01, …)
- `weightage` — % of project value billable at this milestone
- `status` — `not_started | in_progress | completed | delayed`
- `targetDate` / `actualDate` — schedule vs. actuals
- `delayDamagesInitial` / `delayDamagesExtended` — LD rate tiers
- `progressPercentage` — 0–100

This means **Feature A (KD Billing) and Feature G (LD Risk)** can be built without a new model — only InvoiceModel needs a `key_date_id` FK and new financial fields.

---

## 3. Gap Analysis — What's Missing

### Missing Data Models (new tables needed)

| Model | Table | Purpose |
|-------|-------|---------|
| `AdvanceModel` | `advances` | Track mobilization/performance advances issued/received |
| `AdvanceRecoveryModel` | `advance_recoveries` | Per-invoice recovery records (auto-created on KD billing) |
| `RetentionModel` | `retentions` | Track retention held from each KD invoice (client) or vendor bill |
| `VariationOrderModel` | `variation_orders` | VO tracking with approval, execution %, revenue impact |

### InvoiceModel — New Fields Required (schema migration)

```
gross_amount         number   — invoice value before deductions
retention_deducted   number   — 5% (or agreed %) retention held
advance_recovered    number   — advance recovery amount this bill
ld_deducted          number   — LD deducted this bill (if any)
tds_deducted         number   — TDS and other statutory deductions
net_amount           number   — final payable (gross − all deductions)
key_date_id          string?  — FK → key_dates (indexed, optional)
invoice_type         string   — 'client_billing' | 'vendor_payment' | 'ipc'
ipc_number           number?  — IPC serial number
contract_value_snapshot number? — contract value at time of billing
cumulative_billed    number?  — total billed including this invoice
```

### ProjectModel — New Field (or CommercialProjectConfig)

```
contract_value       number?  — total contract value for billing basis
commencement_date    number?  — project start date for LD calculation
advance_mobilization number?  — mobilization advance received
advance_recovery_pct number?  — % to recover per running bill
retention_pct        number?  — retention % (default 5)
dlp_months           number?  — Defect Liability Period in months
```

---

## 4. Feasibility Assessment

| Feature | Feasibility | Effort | Dependency |
|---------|-------------|--------|------------|
| A — KD Milestone Billing | 🟢 High | Medium | Schema migration (InvoiceModel fields) |
| B — Advance Recovery | 🟢 High | Medium | New AdvanceModel |
| C — Retention Management | 🟢 High | Medium | New RetentionModel or computed from Invoice |
| D — Contractor Payment | 🟡 Medium | Medium | Needs vendor→KD linking |
| E — Cash Flow Forecasting | 🟡 Medium | High | Based on KD target dates + payment schedule |
| F — Variation Orders | 🟢 High | Medium | New VariationOrderModel |
| G — LD Risk Calculator | 🟢 High | Low | KeyDateModel already has LD rates |
| H — KPI Dashboard | 🟢 High | Low | Computed from existing + new models |
| I — IPC Readiness Checklist | 🟢 High | Low | Lightweight checklist screen |
| J — DLP & Final Bill | 🟡 Medium | High | Requires DLP tracking across sections |
| K — Milestone Readiness | 🟡 Medium | Medium | Needs engineer cert + hindrance data |
| L — Commercial Risk Alerts | 🟡 Medium | Medium | Analytics on top of existing data |

**Recommended scope for implementation:** A, B, C, G, H first (highest impact, cleanest dependencies). Then F, D, E. Then I, K, L. DLP (J) deferred to post-project phase.

---

## 5. Implementation Plan — 4 Sprints

---

### Sprint 1 — KD Billing Foundation + LD Risk
**Theme:** Connect the commercial module to Key Dates — the core of construction billing.

#### 1.1 Schema Migration (v52)
- Extend `invoices` table with: `gross_amount`, `retention_deducted`, `advance_recovered`, `ld_deducted`, `tds_deducted`, `net_amount`, `key_date_id` (indexed), `invoice_type`, `ipc_number`, `cumulative_billed`
- Extend `projects` table with: `contract_value`, `commencement_date`, `advance_mobilization`, `advance_recovery_pct`, `retention_pct`, `dlp_months`
- File: `models/migrations/v52_commercial_billing_fields.ts`

#### 1.2 InvoiceModel Update
- Add new `@field` decorators for all new fields
- Add `@relation('key_dates', 'key_date_id') keyDate` belongs_to relation
- Add helper: `getNetAmount()`, `getRetentionAmount()`, `isKDBilling()`

#### 1.3 ProjectModel Update
- Add commercial configuration fields
- Add helper: `getAdvanceBalance(totalRecovered)`, `getRetentionPct()`

#### 1.4 KD Billing Screen (new tab or drawer item)
**File:** `src/commercial/kd-billing/KDBillingScreen.tsx`
**Route:** Add as 5th tab or `ManagerDrawerParamList` item

Features:
- List all project Key Dates from `key_dates` table (existing data)
- Per KD row: code, description, weightage %, target date, status, invoice raised (Y/N)
- Color-code: green = completed + invoiced, orange = completed + not yet invoiced, red = delayed
- Tap completed KD → open **Generate IPC Dialog**:
  - Pre-fill: `gross_amount = contract_value × weightage / 100`
  - Show: advance recovery deduction (based on project `advance_recovery_pct`)
  - Show: retention deduction (based on project `retention_pct`, default 5%)
  - Show: LD deduction (auto-calculated from `KeyDateModel.getEstimatedDelayDamages()`)
  - Computed: `net_amount = gross − advance_recovery − retention − ld`
  - Fields: IPC number, invoice date, vendor/client name
  - On confirm → create Invoice record with all fields pre-filled
- Show cumulative billing progress bar: `totalBilled / contractValue × 100`

#### 1.5 LD Risk Calculator (screen or section)
**File:** `src/commercial/ld-risk/LDRiskScreen.tsx`
Or embed as a widget in KD Billing Screen.

Features:
- Pull all Key Dates with `status = 'delayed'`
- For each: show `getDaysDelayed()`, LD rate, calculated exposure (lakhs)
- Total LD exposure across all delayed KDs
- Revenue at risk % = `totalLDExposure / contractValue × 100`
- EOT claim status field (manual: "Filed" / "Pending" / "None")
- Recommended action chip per KD

#### 1.6 Dashboard KPI Enhancements (Sprint 1 slice)
Add to existing `CommercialDashboardScreen`:
- Contract Value KPI card (from `project.contractValue`)
- Billing vs Progress gap: `(totalBilled/contractValue × 100)` vs `avgKDProgress`
- LD Exposure alert widget (red warning if > 0)

---

### Sprint 2 — Advance Recovery + Retention Tracking
**Theme:** Track the two most critical deduction mechanisms in Indian construction billing.

#### 2.1 New Models (v53 migration)
**AdvanceModel** (`advances` table):
```
project_id           string   (indexed FK)
advance_type         string   'mobilization' | 'performance' | 'material'
advance_amount       number
recovery_start_kd_id string?  (FK → key_dates)
recovery_pct         number   % to recover per running bill
total_recovered      number   (updated on each billing)
issued_date          number   (timestamp)
fully_recovered_date number?
notes                string?
```

**RetentionModel** (`retentions` table):
```
project_id           string   (indexed FK)
invoice_id           string   (FK → invoices)
party_type           string   'client' | 'vendor'
party_id             string?
gross_invoice_amount number
retention_pct        number
retention_amount     number
dlp_end_date         number?
released_date        number?
released_amount      number?
bg_in_lieu           boolean  (Bank Guarantee in lieu of retention)
bg_reference         string?
```

#### 2.2 Advance Recovery Screen
**File:** `src/commercial/advance-recovery/AdvanceRecoveryScreen.tsx`

Features:
- List all active advances (mobilization, performance)
- Per advance: amount issued, total recovered, balance outstanding, % complete progress bar
- Recovery schedule: which KDs trigger recovery, % per bill
- Expected full recovery milestone (project KD dates × recovery %)
- "Impact on next 3 bills" section: show projected recovery deductions
- Add new advance button (Admin only)

#### 2.3 Retention Monitor Screen
**File:** `src/commercial/retention/RetentionMonitorScreen.tsx`

Features:
- Two tabs: **Client Retention** (held from our KD invoices) | **Vendor Retention** (we hold from contractor)
- Per row: KD/Invoice ref, gross amount, retention %, amount held, cumulative retention
- Bottom summary: total retention held, eligible for release, pending release
- Retention Release section: DLP end date, release application date, amount realized
- BG in lieu toggle (marks retention as replaced by Bank Guarantee)
- **Aging analysis**: retention held > 6 months, > 12 months (color-coded)

#### 2.4 Auto-Calculate Retention on Invoice Create
- When creating a KD billing invoice, auto-create a `RetentionModel` record
- When vendor invoice is created, auto-create a retention record if applicable
- Retention amount flows back to `InvoiceModel.retention_deducted`

---

### Sprint 3 — Vendor Payment + Variation Orders + Cash Flow
**Theme:** Complete the back-to-back payment chain and forecasting.

#### 3.1 Variation Order Model (v54 migration)
**VariationOrderModel** (`variation_orders` table):
```
project_id           string   (indexed FK)
vo_number            string   e.g., "VO-007"
description          string
value                number
approval_status      string   'pending' | 'approved' | 'rejected' | 'under_review'
execution_pct        number   0–100
billable_amount      number   (computed: value × execution_pct / 100)
revenue_at_risk      number   (computed: value − billable_amount, if not approved)
margin_impact        number
include_in_next_ipc  boolean
linked_kd_id         string?  (FK → key_dates)
raised_date          number
approved_date        number?
```

#### 3.2 Variation Order Screen
**File:** `src/commercial/variation-orders/VariationOrderScreen.tsx`

Features:
- List of VOs with status chips (pending = amber, approved = green, rejected = red)
- Summary: total VO value, approved value, revenue at risk, pending VOs count
- Detail: approval status, execution %, billable amount, margin impact
- "Include in next IPC" toggle for approved VOs
- Alert banner: "X VOs pending approval — ₹Y at risk"

#### 3.3 Vendor Payment Tracker
**File:** `src/commercial/vendor-payment/VendorPaymentScreen.tsx`

Features:
- List all vendors from existing `vendors`/PO data
- Per vendor: contract value, work completed %, eligible payment, advance outstanding, TDS, retention, **net payable**
- Filter: "Due This Week" | "Overdue" | "All"
- Tap vendor → link RA bill to a specific KD or work package
- Auto-calculate net payable: `gross − retention − advance_recovery − TDS`
- Payment Recommendation chips: **Full** (green) | **Partial** (amber) | **Hold** (red)
  - Hold triggers: advance in default, previous payment not certified, LD exposure active

#### 3.4 Cash Flow Forecast Widget (extend Financial Reports)
**File:** Add to `src/commercial/financial-reports/CashFlowForecastCard.tsx`

Features:
- 6-month inflow projection: pending KDs × weightage × contract_value grouped by `targetDate`
- 6-month outflow projection: vendor payment schedule + advance recoveries + retention releases
- Net cash position bar chart (month-by-month)
- Funding gap alert: months where outflow > inflow highlighted red
- Working capital requirement: peak funding gap amount

---

### Sprint 4 — Compliance, Risk, and Closure
**Theme:** Complete the commercial manager's risk management toolkit.

#### 4.1 Milestone Readiness Check
**File:** `src/commercial/ipc-readiness/MilestoneReadinessScreen.tsx`

Checklist items per KD (before raising IPC):
- [ ] Engineer completion certificate uploaded
- [ ] Measurement Book (MB) entry reference noted
- [ ] BOQ reconciliation done
- [ ] Variation orders impacting this KD are approved
- [ ] LD exposure calculated and accepted
- [ ] Hindrance register reviewed (link to supervisor hindrance data)
- [ ] Previous IPC payment received
- [ ] GST compliance confirmed

Status: **Safe to raise IPC** (all green) | **Conditional** (amber items) | **Hold** (red items)

#### 4.2 IPC Submission Readiness Checklist
Embed as a modal/sheet within KD Billing Screen (tap "Generate IPC" → checklist first):
- Checklist with toggles for each item above
- Cannot submit until mandatory items are checked
- Generate PDF-ready summary (text export for now)

#### 4.3 Commercial Risk Early Warning (extend Dashboard)
Add `CommercialRiskWidget` to dashboard:

**Auto-detected risks:**
1. **Billing lag**: `(totalBilled / contractValue) < (avgKDProgress / 100) - 0.1` → "Revenue lag of X%"
2. **Advance pressure**: `advanceBalanceOutstanding / contractValue > 0.15` → "Advance exceeds 15% of CV"
3. **Retention accumulation**: `totalRetentionHeld > contractValue × 0.08` → "Retention above threshold"
4. **Pending variations**: count of unapproved VOs × value → "₹X at risk from X VOs"
5. **Slow-paying client**: invoices outstanding > 60 days → "X invoices overdue > 60 days"

Display: Top 3 risks with severity (🔴/🟡) and suggested action.

#### 4.4 KPI Dashboard Final Enhancements
Add to existing dashboard:

| KPI | Source |
|-----|--------|
| Total Contract Value | `project.contractValue` |
| % Work Completed | avg of `keyDate.progressPercentage` weighted by `weightage` |
| % Revenue Billed | `sum(invoice.grossAmount) / contractValue × 100` |
| Advance Outstanding | `sum(advance.totalRecovered) vs advance.advanceAmount` |
| Retention Held (Client) | `sum(retention.retentionAmount where party_type='client')` |
| Certified but Unpaid | `sum(invoice where status='pending' and certification_date IS NOT NULL)` |
| Subcontractor Payable Aging | vendor invoices buckets: 0–30d, 31–60d, 60d+ |
| Cash Flow Gap | `clientPaymentsReceived − vendorPaymentsMade` (rolling 30 days) |

#### 4.5 DLP & Final Bill Closure (basic)
**File:** `src/commercial/final-bill/FinalBillScreen.tsx`

Features:
- Show DLP end date per section (derived from `project.dlpMonths` + completion date)
- List retention eligible for release (DLP expired, no open defects)
- Final bill calculation: sum of all approved invoices + pending VOs + retention release
- Commercial closure checklist: all VOs settled, all retention released, all advances recovered, BGs returned
- Status: **Open** | **DLP Running** | **Closure Ready** | **Closed**

---

## 6. New Navigation Structure

```
CommercialDrawerNavigator
├── CommercialTabNavigator (5 tabs)
│   ├── Dashboard          (enhanced KPIs + risk widget)
│   ├── KD Billing         ← NEW (was "Budget Management" becomes secondary)
│   ├── Cost Tracking
│   ├── Invoice Management
│   └── Budget Management
├── Drawer: Advance Recovery    ← NEW
├── Drawer: Retention Monitor   ← NEW
├── Drawer: Vendor Payments     ← NEW
├── Drawer: Variation Orders    ← NEW
├── Drawer: LD Risk Calculator  ← NEW
├── Drawer: Cash Flow Forecast  ← NEW (or tab in Financial Reports)
├── Drawer: IPC Readiness       ← NEW
├── Drawer: Final Bill Closure  ← NEW
├── Drawer: Financial Reports
└── Drawer: Tutorial
```

---

## 7. Schema Migration Summary

| Version | Changes |
|---------|---------|
| v52 | Extend `invoices` (9 new fields), extend `projects` (6 commercial fields) |
| v53 | New `advances` table, new `retentions` table |
| v54 | New `variation_orders` table |

All migrations follow the pattern in `models/migrations/v{N}_name.ts` registered in `models/migrations/index.js`.

---

## 8. Demo Data Updates

`generateCommercialManagerDemoData()` in `src/services/DemoDataService.ts` needs:
- Set `project.contractValue = 150_00_00_000` (₹150 Crore example)
- Set `project.advanceMobilization = 15_00_00_000` (10% mobilization advance)
- Set `project.retentionPct = 5`
- Set `project.dlpMonths = 24`
- Create 2 advances (mobilization: ₹15Cr, performance: ₹5Cr)
- Create 5 KD billing invoices with gross/net breakdown
- Create retention records linked to those invoices
- Create 3 variation orders (1 approved, 1 pending, 1 rejected)

---

## 9. Priority Order for Development

| Priority | Feature | Sprint | Reason |
|----------|---------|--------|--------|
| 🔴 P0 | KD Milestone Billing (A) | 1 | Core workflow — everything derives from KD billing |
| 🔴 P0 | Schema v52 (InvoiceModel + ProjectModel) | 1 | Foundation for all commercial features |
| 🔴 P1 | LD Risk Calculator (G) | 1 | KeyDateModel already has all data; low effort |
| 🔴 P1 | Dashboard KPI enhancements (H) | 1 | High visibility, computed from existing data |
| 🟡 P2 | Advance Recovery (B) | 2 | Critical deduction mechanism for net payable |
| 🟡 P2 | Retention Management (C) | 2 | 5% retention is contractual requirement |
| 🟡 P3 | Variation Orders (F) | 3 | Revenue risk tracking |
| 🟡 P3 | Vendor Payment Tracker (D) | 3 | Contractor back-to-back |
| 🟡 P3 | Cash Flow Forecast (E) | 3 | Enhanced reporting |
| 🟠 P4 | IPC Readiness (I) | 4 | Compliance workflow |
| 🟠 P4 | Milestone Readiness Check (K) | 4 | Pre-billing validation |
| 🟠 P4 | Commercial Risk Alerts (L) | 4 | Analytics layer |
| ⚪ P5 | DLP & Final Bill Closure (J) | 4 | Post-project phase |

---

## 10. Key Architectural Decisions

1. **Reuse KeyDateModel** — Do not create a separate `KDModel` for commercial. The planning `key_dates` table is the single source of truth. Commercial reads it read-only and links invoices to it via `key_date_id`.

2. **Invoice is the central transaction** — All deductions (advance recovery, retention, LD) are recorded as fields on the Invoice, not as separate transaction records. This keeps the ledger simple. Retention records are a separate audit trail but the numbers flow from Invoice fields.

3. **Contract Value on Project** — Add `contract_value` to the `projects` table (v52 migration). This is the multiplier for all KD billing calculations. The existing `BudgetModel` tracks internal cost budget (separate concern).

4. **Computed vs. Stored** — Store `gross_amount`, `retention_deducted`, `advance_recovered`, `net_amount` as actual fields (not computed) so they are immutable once an IPC is raised. Do not recompute from rules, as rates can change between bills.

5. **LD deduction on Invoice** — LD (Liquidated Damages) is an input field on the invoice (commercial manager decides to deduct or defer). The LD Risk Calculator provides the suggested amount; the manager applies their judgement.

6. **Vendor Payment Tracker scope** — Uses existing `PurchaseOrderModel` + `InvoiceModel` with `party_type = 'vendor_payment'`. No new model needed if we extend InvoiceModel correctly.
