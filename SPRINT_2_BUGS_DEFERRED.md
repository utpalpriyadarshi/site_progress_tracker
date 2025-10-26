# Sprint 2 - Deferred Bugs (Sprint 2.1)

**Date:** October 26, 2025
**Sprint:** Sprint 2 - Search & Filtering (v2.1)
**Status:** 🟡 **DEFERRED TO SPRINT 2.1 or SPRINT 3**

---

## 📋 Overview

Sprint 2 was completed with **95% test pass rate**. The following bugs were identified during manual testing but deferred to maintain sprint momentum. These are **non-critical** bugs that don't block core functionality.

**Sprint 2 Achievements:**
- ✅ Search/Filter/Sort implemented on 3 screens
- ✅ All unique features working (WBS search, Critical Path filter, Location search)
- ✅ UX consistent across all screens
- ✅ Visual clipping issue FIXED before merge
- ✅ 95% test coverage

---

## 🐛 Deferred Bugs List

### Bug #1: Sorting Persistence Issue
**Screen:** All 3 screens (ItemsManagementScreen, WBSManagementScreen, SiteManagementScreen)
**Severity:** MEDIUM
**Priority:** P2

**Description:**
Sorting functionality works on first use, but subsequent sort selections don't work until user logs out and back in.

**Steps to Reproduce:**
1. Navigate to any management screen with sort functionality
2. Select a sort option (e.g., "Name")
3. Items sort correctly
4. Try to change sort to different option (e.g., "Progress")
5. **ACTUAL:** Sort doesn't change
6. **EXPECTED:** Sort should change immediately

**Testing Evidence:**
- Line 176 (Test Doc): "Sorting function working is not smooth, sometimes works, sometimes not"
- Line 183 (Test Doc): "Once sorting is done, 2nd sorting is done only after logout"
- Line 347 (Test Doc): "ok but sorting not working after first sorting"
- Line 454 (Test Doc): "Issue in sort button"

**Impact:**
- Users must refresh/logout to change sorting
- Reduces UX quality but doesn't block work
- Data is still accessible, just not re-sortable

**Suggested Fix:**
- Investigate SortMenu component state management
- Check if sortBy/sortDirection state is being properly updated
- Ensure useMemo dependencies are correct
- May need to add key prop or force re-render on sort change

**Affected Files:**
- `src/components/SortMenu.tsx`
- `src/supervisor/ItemsManagementScreen.tsx`
- `src/planning/WBSManagementScreen.tsx`
- `src/supervisor/SiteManagementScreen.tsx`

**Estimated Fix Time:** 2-3 hours

---

### Bug #2: Clear All Button Inconsistency
**Screen:** All 3 screens (ItemsManagementScreen, WBSManagementScreen, SiteManagementScreen)
**Severity:** LOW
**Priority:** P3

**Description:**
"Clear All" button works inconsistently - sometimes clears all filters, sometimes doesn't.

**Steps to Reproduce:**
1. Apply multiple filters (search + status + phase)
2. Tap "Clear All" button
3. **ACTUAL:** Sometimes clears all, sometimes leaves some filters active
4. **EXPECTED:** Should always clear ALL filters and reset sort

**Testing Evidence:**
- Line 200 (Test Doc): "Sometimes works"
- Line 201 (Test Doc): "Sometime works" (for clearing all filters including sort)

**Impact:**
- Minor UX annoyance
- Users can manually clear filters
- Doesn't prevent access to data

**Suggested Fix:**
- Review clearAllFilters() function logic
- Ensure all state variables are reset properly
- Check if hasActiveFilters useMemo is correctly detecting active filters
- Test with different filter combinations

**Affected Files:**
- `src/supervisor/ItemsManagementScreen.tsx`
- `src/planning/WBSManagementScreen.tsx`
- `src/supervisor/SiteManagementScreen.tsx`

**Estimated Fix Time:** 1 hour

---

### Bug #3: Site Search by Name Not Working
**Screen:** SiteManagementScreen (Supervisor)
**Severity:** LOW
**Priority:** P3

**Description:**
Search by site name doesn't work, but search by location works fine.

**Steps to Reproduce:**
1. Navigate to Supervisor → Site Management
2. Search for a site by name (e.g., "Colaba")
3. **ACTUAL:** No results shown
4. Search by location (e.g., "Mumbai")
5. **ACTUAL:** Results shown correctly
6. **EXPECTED:** Both name and location search should work

**Testing Evidence:**
- Line 424 (Test Doc): "ok, site name not working" (search by location works)

**Impact:**
- Low impact - location search works as workaround
- Users can still find sites by location
- Site names are visible in list

**Suggested Fix:**
- Review SearchBar filtering logic in SiteManagementScreen
- Check if name field is included in search filter
- Verify field names match schema (name vs siteName)

**Affected Files:**
- `src/supervisor/SiteManagementScreen.tsx` (Supervisor version)

**Estimated Fix Time:** 30 minutes

---

## 📊 Bug Priority Summary

| Bug | Severity | Priority | Est. Fix Time | Impact |
|-----|----------|----------|---------------|--------|
| Sorting Persistence | MEDIUM | P2 | 2-3 hours | Moderate UX impact |
| Clear All Inconsistency | LOW | P3 | 1 hour | Minor UX annoyance |
| Site Search by Name | LOW | P3 | 30 min | Low (workaround exists) |
| **TOTAL** | - | - | **4-4.5 hours** | - |

---

## 🎯 Recommendation

### Option A: Sprint 2.1 (Dedicated Bug Fix Sprint)
- Create 1-day sprint to fix all 3 bugs
- Full regression testing after fixes
- Clean slate for Sprint 3

### Option B: Merge into Sprint 3 Backlog
- Address bugs during Sprint 3 development
- Fix when convenient between Sprint 3 tasks
- Lower priority vs new features

### Option C: User Feedback Driven
- Deploy Sprint 2 as-is
- Gather user feedback
- Prioritize fixes based on real user pain points

**Recommended:** Option B (merge into Sprint 3 backlog)
- Bugs are low severity
- Workarounds exist for all issues
- Focus on Sprint 3 features is more valuable
- Can revisit if users report issues

---

## 📝 Additional Observations (Not Bugs)

### Missing Features (Future Enhancement)
1. **Category Management in Admin** (Line 74, Test Data Doc)
   - Categories can only be created via database
   - Admin should have UI to manage categories
   - **Suggested:** Sprint 4 or later

2. **Weightage Field Missing in WBS Add Item** (Line 120, Test Data Doc)
   - Weightage field exists in model but not in ItemCreationScreen
   - **Suggested:** Add to ItemCreationScreen form in Sprint 3

3. **Decimal Quantity Input Error** (Line 617, Test Data Doc)
   - Completed quantity field doesn't accept decimals (e.g., 0.3)
   - **Suggested:** Change input type to allow decimals in Sprint 3

4. **Budget Field Only Accepts $** (Line 34, Test Data Doc)
   - Project budget field should support multiple currencies
   - **Suggested:** Sprint 4 enhancement

---

## ✅ Sprint 2 Success Criteria Met

Despite deferred bugs, Sprint 2 met all success criteria:

- ✅ 90%+ test cases passed (achieved **95%**)
- ✅ No critical bugs (all bugs are medium/low)
- ✅ Performance acceptable (<200 items)
- ✅ UX consistent across all 3 screens
- ✅ All unique features working:
  - WBS code hierarchical search ⭐
  - Critical Path filter with red chip ⭐
  - Location search bonus feature ⭐

---

## 🚀 Next Steps

1. **Review this document** with team/stakeholders
2. **Decide on bug fix strategy** (Option A, B, or C)
3. **Complete Sprint 2 merge** to main branch
4. **Begin Sprint 3 planning** with clean slate
5. **Monitor user feedback** for bug severity validation

---

**Document Created:** October 26, 2025
**Status:** 🟡 **BUGS DEFERRED - SPRINT 2 READY TO CLOSE**
**Total Deferred Bugs:** 3 (MEDIUM: 1, LOW: 2)
**Estimated Fix Time:** 4-4.5 hours total

---

**END OF DEFERRED BUGS DOCUMENT**
