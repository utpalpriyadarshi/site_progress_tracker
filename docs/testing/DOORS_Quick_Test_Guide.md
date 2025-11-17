# DOORS Phase 2 - Quick Test Guide
**For Rapid Testing & Verification**

---

## 🚀 Quick Start (5 Minutes)

### 1. Launch the App
```bash
# Terminal 1: Start Metro bundler
npm start

# Terminal 2: Run on device
npm run android
# OR
npm run ios
```

### 2. Login & Navigate
1. Login with any credentials
2. Switch to **Logistics** role (use role switcher)
3. Tap **DOORS** tab (📋 icon at bottom)

### 3. Clear Existing Data (if needed)
**Note**: If you already have DOORS data loaded, you'll see packages instead of empty state.
1. If packages are visible, tap **"🗑️ Clear All Data (Testing)"** button at top
2. Wait 1-2 seconds for data to clear
3. Screen will show empty state

### 4. Load Demo Data
1. See empty state message: "No DOORS Packages"
2. Tap **"Load Demo DOORS Data"** button
3. Wait 2-3 seconds
4. See 5 DOORS packages appear

### 5. Quick Smoke Test
✅ **If you can do these 5 things, Phase 2 is working:**
1. See 5 package cards with progress bars
2. Tap a package → Detail screen opens
3. See 100 requirements listed
4. Switch to "Compliance" tab → See statistics
5. Tap Back → Return to Register

---

## 📋 30-Second Checklist

Run through this quickly to verify basics:

### DOORS Register Screen
- [ ] Empty state shows "Load Demo Data" button
- [ ] Tapping button loads 5 packages
- [ ] Each package shows:
  - DOORS ID (e.g., DOORS-TSS-AUX-TRF-001)
  - Equipment name
  - Compliance percentage (e.g., 94%)
  - Progress bar (colored: green/orange/red)
  - Category badges (TSS, OHE, SCADA, Cables)
- [ ] KPI summary at top shows: Total: 5, Avg: ~94%
- [ ] Search box visible
- [ ] Filter pills visible (All, Draft, Under Review, etc.)

### DOORS Detail Screen
- [ ] Tap package card → Navigates to detail
- [ ] Header shows package name and DOORS ID
- [ ] Three tabs visible: Requirements, Compliance, Documents
- [ ] Requirements tab (default):
  - Lists many requirements (50-100)
  - Shows requirement codes (TR-001, DS-001, etc.)
  - Shows status badges (colored circles/pills)
- [ ] Compliance tab:
  - Shows large percentage at top
  - Shows 5 category cards
  - Each has progress bar
- [ ] Documents tab:
  - Shows "Phase 3" placeholder message
- [ ] Back button returns to Register

### Dashboard Integration
- [ ] Go to Dashboard (first tab)
- [ ] Scroll horizontally through KPI cards
- [ ] Find DOORS KPI cards (after inventory cards):
  - "DOORS Packages" (light blue)
  - "DOORS Compliance" (yellow, shows %)
  - "Approved Packages" (gray)
  - "With Purchase Order" (green)
- [ ] Values look reasonable (5, 94%, 2, 1)

---

## 🎯 Critical Path Test (2 Minutes)

**This is the minimum test to verify core functionality:**

### Test Scenario: Review Transformer Compliance

1. **Start**: Dashboard
2. **Action**: Scroll KPIs → See DOORS section
3. **Verify**: Shows 5 packages, ~94% compliance
4. **Action**: Tap DOORS tab (📋)
5. **Verify**: See Register screen
6. **Action**: Tap "Load Demo Data" (if empty)
7. **Verify**: 5 packages appear
8. **Action**: Tap first package "Auxiliary Transformer"
9. **Verify**: Detail screen opens
10. **Verify**: Shows "DOORS-TSS-AUX-TRF-001"
11. **Verify**: Requirements tab active (default)
12. **Verify**: Many requirements listed (~100)
13. **Action**: Scroll through requirements
14. **Verify**: Smooth scrolling, no crashes
15. **Action**: Tap any requirement
16. **Verify**: Modal opens with details
17. **Action**: Tap X to close modal
18. **Verify**: Modal closes, back to list
19. **Action**: Tap "Compliance" tab
20. **Verify**: Shows 94% overall
21. **Verify**: Shows 5 category cards
22. **Action**: Tap "Documents" tab
23. **Verify**: Shows "Phase 3" message
24. **Action**: Tap Back button (←)
25. **Verify**: Returns to Register
26. **Success**: ✅ Critical path working!

**Time**: ~2 minutes

---

## 🔍 Detailed Test (10 Minutes)

### A. Register Screen Features

#### Search Test
1. Type "Transformer" → Should show 1 result
2. Type "TSS" → Should show 2 results
3. Clear search → Should show all 5

#### Filter by Status
1. Tap "Under Review" → Should show 2 packages
2. Tap "Approved" → Should show 2 packages
3. Tap "All" → Should show all 5

#### Package Card Details
Check first package (Transformer):
- DOORS ID: DOORS-TSS-AUX-TRF-001
- Name: Auxiliary Transformer 1000kVA
- Category: TSS
- Status: Under Review (orange/yellow badge)
- Priority: High (red badge)
- Compliance: 94% (green bar)
- Breakdown shows:
  - Technical: 85%
  - Datasheet: 100%
  - Type: 92%
  - Routine: 100%
  - Site: 100%

### B. Detail Screen Features

#### Requirements Tab
1. **Count**: Should show ~100 requirements for Transformer
2. **Search**:
   - Type "Cooling" → Should filter to matching
   - Clear → Should show all again
3. **Category Filter**:
   - Tap "Technical Requirements" → Shows ~30
   - Tap "Datasheet Parameters" → Shows ~20
   - Tap "All" → Shows all 100
4. **Requirement Card**:
   - Shows code (e.g., TR-001)
   - Shows description (truncated to 2 lines)
   - Shows spec clause (e.g., IEC 60076-1)
   - Shows status badge (Compliant/Partial/etc.)
5. **Modal**:
   - Tap requirement → Modal opens
   - Shows full details
   - Has close button (X)
   - Close works

#### Compliance Tab
1. **Overall Summary**:
   - Large percentage (94%)
   - Total requirements (100)
   - Compliant count (94)
   - Remaining count (6)
2. **Category Cards** (5 total):
   - Each shows category name
   - Each shows percentage
   - Each has colored progress bar
   - Each shows breakdown (Total, Compliant, Partial, Non-Compliant)

#### Documents Tab
1. Shows placeholder
2. Has icon (📄)
3. Says "Phase 3"
4. Lists planned features

### C. Navigation Test

Test this flow:
```
Dashboard → DOORS Tab → Register
   → Package Detail → Requirements
   → Tap Requirement → Modal
   → Close Modal → Back to Requirements
   → Compliance Tab
   → Documents Tab
   → Back Button → Register
   → Material Tracking Tab → (check for DOORS section if BOM linked)
   → Dashboard Tab → (see DOORS KPIs)
   → DOORS Tab → (data still there, no reload needed)
```

All transitions should be smooth, no crashes.

---

## 🐛 What to Look For

### ✅ Good Signs
- Smooth scrolling
- No console errors
- Colors make sense (green = good, red = bad)
- Text readable
- Touch targets easy to tap
- Back button always works
- Data loads quickly (<1 second)
- Progress bars match percentages

### ❌ Bad Signs / Issues to Report
- App crashes
- Screens blank/empty when shouldn't be
- Console shows red errors
- Scrolling stutters/lags
- Text overlaps or cuts off
- Can't tap buttons
- Back button doesn't work
- Wrong data displays
- Progress bars don't match numbers
- Colors inconsistent

---

## 📊 Expected Demo Data

You should see exactly these 5 packages:

| # | DOORS ID | Equipment | Category | Req. | Comp. | Status |
|---|----------|-----------|----------|------|-------|--------|
| 1 | DOORS-TSS-AUX-TRF-001 | Auxiliary Transformer 1000kVA | TSS | 100 | 94.0% | Under Review |
| 2 | DOORS-TSS-CB-001 | 33kV Circuit Breaker SF6 | TSS | 85 | 100.0% | Approved |
| 3 | DOORS-OHE-MAST-001 | OHE Mast - Tubular Steel 12m | OHE | 65 | 90.8% | Under Review |
| 4 | DOORS-SCADA-RTU-001 | SCADA RTU | SCADA | 75 | 100.0% | Approved |
| 5 | DOORS-CABLE-PW-001 | 33kV XLPE Power Cable | Cables | 55 | 87.3% | Draft |

**Total**: 380 requirements across all packages
**Average Compliance**: 94.42%

---

## 🎬 Quick Demo Script

**For showing to stakeholders (3 minutes):**

### Opening
"Let me show you our new DOORS tracking system for equipment compliance..."

### Demo Flow
1. **Dashboard**: "Here we track all our equipment. See the new DOORS section showing 5 packages with 94% average compliance."

2. **DOORS Tab**: "Let's drill into details. Here's our DOORS register - each card shows an equipment package."

3. **Pick Transformer**: "This transformer has 100 individual technical requirements we need to verify compliance for."

4. **Detail Screen**: "We're at 94% compliance overall. Let's see the breakdown..."

5. **Requirements**: "Here are all 100 requirements. We can search, filter by category, and drill into each one."

6. **Tap Requirement**: "For example, this cooling requirement - the vendor offered ONAF instead of ONAN. We marked it as 75% compliant and flagged for engineering review."

7. **Compliance Tab**: "Here's our category-wise view. Technical specs are 85% compliant, type tests 92%, but datasheets and routine tests are 100%."

8. **Wrap Up**: "Engineering reviews each requirement, marks compliance, and we track everything at this granular level. This ensures we don't miss any critical specs before procurement."

**Time**: 2-3 minutes
**Impact**: Shows real-world value of granular tracking

---

## 📝 Quick Issue Template

If you find a bug, copy-paste this and fill in:

```
**Issue**: [Brief description]
**Severity**: Critical / High / Medium / Low
**Screen**: Dashboard / Register / Detail
**Steps**:
1.
2.
3.

**Expected**:
**Actual**:
**Screenshot**: [If available]
**Console Errors**: [If any]
```

---

## ✅ Quick Pass/Fail

After testing, answer these:

- [ ] Can load demo data?
- [ ] Can see 5 packages?
- [ ] Can navigate to detail?
- [ ] Can see requirements?
- [ ] Can see compliance stats?
- [ ] Can navigate back?
- [ ] Dashboard shows KPIs?
- [ ] No crashes?

**If all YES** → ✅ Phase 2 PASSES basic test
**If any NO** → ⚠️ Need to investigate

---

## 🎯 Next Actions

### After Quick Test PASSES:
1. ✅ Mark Phase 2 as "Basic Functionality Verified"
2. → Run full 40-test checklist for comprehensive validation
3. → Document any issues found
4. → Fix critical bugs
5. → Get sign-off

### After Quick Test FAILS:
1. Document specific failure
2. Check console for errors
3. Verify file structure
4. Check TypeScript compilation
5. Report back for fixes

---

**Happy Testing! 🚀**
