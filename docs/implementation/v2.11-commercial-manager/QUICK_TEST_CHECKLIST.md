# Phase 5 (v2.11) - Quick Test Checklist

**Time Required**: 10-15 minutes
**Purpose**: Rapid confidence check before merging to main

---

## Login & Access
```
Username: commercial1
Password: Password@2025
```

- ⬜ Login successful
- ⬜ Lands on Commercial Dashboard
- ⬜ 5 tabs visible: Dashboard, Budget, Costs, Invoices, Reports

---

## Quick Feature Tests

### Budget Management (2 min)
- ⬜ Create budget: Materials, $50,000
- ⬜ View budget card with allocated amount
- ⬜ Edit budget: Change to $60,000
- ⬜ Delete budget successfully

### Cost Tracking (2 min)
- ⬜ Create cost: "Test materials", $15,000, Materials category
- ⬜ View budget comparison showing $15k/$60k
- ⬜ Progress bar displays ~25%
- ⬜ Delete cost successfully

### Invoice Management (3 min)
- ⬜ Create invoice: INV-001, select vendor, $25,000, pending
- ⬜ View invoice with vendor name resolved
- ⬜ Long-press → Mark as Paid
- ⬜ Status changes to Paid (green chip)
- ⬜ Delete invoice successfully

### Financial Reports (2 min)
- ⬜ All 5 report sections visible:
  - Budget Summary
  - Budget Variance by Category
  - Cost Distribution
  - Cash Flow Analysis
  - Profitability Metrics
- ⬜ Date range filter buttons work
- ⬜ Data displays correctly

### Commercial Dashboard (3 min)
- ⬜ Budget Summary card shows totals
- ⬜ Category Breakdown displays all 4 categories
- ⬜ Cash Flow shows Revenue, Costs, Net
- ⬜ Invoices Overview shows counts
- ⬜ Recent Costs section displays (if any)
- ⬜ Alerts appear if applicable (over budget, overdue, etc.)

---

## Critical Calculations Check

### Test Scenario:
1. Create budget: Labor $10,000
2. Create cost: Labor $7,000
3. Create invoice: $15,000 (mark as paid)

### Verify:
- ⬜ Budget shows: $10k allocated, $7k spent, $3k remaining (70% used)
- ⬜ Cost card shows budget comparison correctly
- ⬜ Reports show: Total budget $10k, Total spent $7k
- ⬜ Dashboard Cash Flow shows: Revenue $15k, Costs $7k, Net $8k
- ⬜ Profitability shows: Profit $8k, Margin 53.3%

---

## Navigation & Context
- ⬜ All tab navigation works smoothly
- ⬜ Project name displays in all screen headers
- ⬜ Back button navigation works correctly
- ⬜ No errors in console/logs

---

## Final Check
- ⬜ No crashes or freezes
- ⬜ All CRUD operations work
- ⬜ Calculations are accurate
- ⬜ UI displays correctly (no visual glitches)
- ⬜ Data persists across navigation

---

## Result

**Overall Status**: ⬜ READY TO MERGE / ⬜ NEEDS FIXES

**Issues Found**:
_________________________________________
_________________________________________

**Tested By**: _____________________
**Date**: _____________________

---

## Next Steps

### If READY TO MERGE:
```bash
# Create pull request
gh pr create --title "v2.11: Commercial Manager Role Implementation" \
             --body "$(cat docs/implementation/v2.11-commercial-manager/PR_TEMPLATE.md)"

# Or merge locally
git checkout main
git merge feature/v2.11 --no-ff
git push origin main
```

### If NEEDS FIXES:
1. Document issues found above
2. Fix issues on feature/v2.11 branch
3. Re-run this quick test
4. Proceed to merge when ready
