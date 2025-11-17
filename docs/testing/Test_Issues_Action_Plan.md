# DOORS Phase 2 - Test Issues & Action Plan

**Date**: November 12, 2025
**Tester**: Utpal Priyadarshi
**Total Test Cases**: 40
**Tests Completed**: 40
**Tests Passed**: ~28-30 (with observations)
**Issues Found**: 11 issues (3 critical, 4 medium, 4 minor)

---

## 📊 Test Results Summary

### Overall Assessment
- **Core Functionality**: ✅ Working (navigation, data loading, search, filters)
- **Database & Models**: ✅ Working (schema, migrations, observables)
- **UI Components**: ⚠️ Issues (text visibility, styling)
- **Integrations**: ❌ Missing (Dashboard KPIs, BOM linking)
- **Demo Data**: ⚠️ Incorrect (requirement counts, compliance values)

---

## 🚨 CRITICAL ISSUES (Priority 1)

### Issue #1: Filter Chip Text Not Visible
**Severity**: CRITICAL
**Affected Test Cases**: 5, 7, 9, 13, 15
**Screenshots**: Doors2.png, Doors5.png, Doors6.png

**Problem**:
- Filter chip text is not visible before tapping
- Status badge text cannot be seen on package cards
- Pill size changes when tapped
- Each pill has different size

**Location**:
- `DoorsRegisterScreen.tsx`: Status filter chips (lines 277-316)
- `DoorsDetailScreen.tsx`: Category and status filter chips
- Package card badges (lines 179-185)

**Root Cause Analysis**:
Likely causes:
1. Font size too small (`fontSize: 10` for badges)
2. Background color might be too light/dark for text
3. Padding insufficient to show text
4. Text color (#666) might have low contrast with background

**Proposed Fix**:
1. Increase badge font size from 10 to 11-12
2. Increase filter chip font size to 14
3. Add minimum width to filter chips
4. Ensure text color has sufficient contrast
5. Add more padding to chips

**Files to Modify**:
- `src/logistics/DoorsRegisterScreen.tsx` (styles)
- `src/logistics/DoorsDetailScreen.tsx` (styles)

---

### Issue #2: Dashboard DOORS KPIs Not Displaying
**Severity**: CRITICAL
**Affected Test Cases**: 21, 22, 27
**Status**: Feature not working

**Problem**:
- No DOORS KPI cards visible on Logistics Dashboard
- Expected 4 KPI cards:
  1. DOORS Packages (5)
  2. DOORS Compliance (94.4%)
  3. Approved Packages (2)
  4. With Purchase Order (1)

**Location**:
- `src/logistics/LogisticsDashboardScreen.tsx`

**Root Cause**:
Dashboard integration code might not be properly added or DOORS statistics service not being called.

**Proposed Fix**:
1. Check if `DoorsStatisticsService` is imported in Dashboard
2. Add DOORS KPI cards after existing Material Tracking KPIs
3. Use observable to fetch DOORS packages
4. Calculate statistics using `DoorsStatisticsService.calculateOverallStats()`
5. Add conditional rendering (only show if DOORS packages exist)

**Files to Check/Modify**:
- `src/logistics/LogisticsDashboardScreen.tsx`
- `src/services/DoorsStatisticsService.ts` (already exists)

---

### Issue #3: Demo Data - Wrong Requirement Count
**Severity**: HIGH
**Affected Test Cases**: 9, 13, 19

**Problem**:
- Expected: 100 requirements for Auxiliary Transformer
- Actual: 13 requirements
- Compliance values don't match expected:
  - Expected Tech: 85.0% → Actual: 91.7%
  - Expected Type: 92.0% → Actual: 66.7%

**Location**:
- `src/utils/demoData/DoorsSeeder.ts`

**Root Cause**:
Demo data seeder not creating all 100 requirements per package.

**Proposed Fix**:
1. Review `DoorsSeeder.ts` to ensure all requirements are created
2. Verify loop creates 100 requirements for Transformer package
3. Recalculate compliance percentages based on actual requirements
4. Update test expectations if demo data intentionally uses 13 requirements

**Files to Modify**:
- `src/utils/demoData/DoorsSeeder.ts`
- OR update test documentation to reflect actual demo data

---

## ⚠️ MEDIUM PRIORITY ISSUES (Priority 2)

### Issue #4: BOM-DOORS Integration Not Working
**Severity**: MEDIUM
**Affected Test Cases**: 24, 25, 27

**Problem**:
- No BOM cards show DOORS section
- Cannot navigate from Material Tracking to DOORS Detail
- `doors_id` field might not be populated on BOM items

**Location**:
- `src/logistics/components/BomRequirementCard.tsx`
- Demo data for BOM items

**Root Cause**:
1. BOM items don't have `doors_id` populated in demo data
2. DOORS section component might not be rendering properly
3. Navigation might not be wired up correctly

**Proposed Fix**:
1. Update BOM demo data to link some items with `doors_id`
2. Verify `BomRequirementCard.tsx` has DOORS section code
3. Test navigation from BOM card to DOORS Detail
4. Add at least 2-3 BOM items with DOORS links for testing

**Files to Modify**:
- BOM demo data seeder
- Verify `src/logistics/components/BomRequirementCard.tsx`

---

### Issue #5: Category Filter Missing on Register
**Severity**: MEDIUM
**Affected Test Case**: 8

**Problem**:
- Test Case 8 expects category filter (TSS, OHE, SCADA, Cables)
- Only status filter is visible
- Cannot filter packages by category

**Location**:
- `DoorsRegisterScreen.tsx` (filter section)

**Root Cause**:
Category filter not implemented on Register screen (might have been in plan but not completed).

**Proposed Fix**:
Two options:
1. **Add category filter** (similar to status filter)
2. **Update test** to reflect current implementation (status filter only)

**Recommendation**: Mark as "Phase 3 enhancement" and update test documentation.

---

### Issue #6: Status Badge Not Visible on Cards
**Severity**: MEDIUM
**Affected Test Case**: 9

**Problem**:
- Status "Under Review" text cannot be seen
- Quantity "2 nos" text cannot be seen

**Location**:
- Package card rendering (lines 179-193 in DoorsRegisterScreen.tsx)

**Root Cause**:
- Badge font size too small (10px)
- Possible layout issue hiding text

**Proposed Fix**:
1. Increase badge font size to 11-12px
2. Ensure badges have proper padding
3. Check if badge background colors are correct
4. Verify quantity info is displayed in equipmentInfo line

**Files to Modify**:
- `src/logistics/DoorsRegisterScreen.tsx` (badge styles)

---

### Issue #7: Compliance Color Coding (Only 2 Colors)
**Severity**: MEDIUM
**Affected Test Case**: 5

**Problem**:
- Expected 3 colors: Green (≥95%), Orange (80-94%), Red (<80%)
- User reports only seeing 2 colors

**Location**:
- `DoorsRegisterScreen.tsx` lines 164-166

**Current Code**:
```typescript
const complianceColor =
  item.compliancePercentage >= 95 ? '#4CAF50' :
  item.compliancePercentage >= 80 ? '#FF9800' : '#F44336';
```

**Root Cause**:
Logic looks correct. Issue might be:
1. No packages with <80% compliance in demo data (lowest is 87.3%)
2. User might not be seeing red color in testing

**Proposed Fix**:
1. Add one more package with <80% compliance to demo data
2. Verify color logic is working
3. Update test to clarify when red appears

---

## 🔧 MINOR ISSUES (Priority 3)

### Issue #8: Filter Pill Size Changes When Tapped
**Severity**: MINOR
**Affected Test Case**: 7

**Problem**:
- Filter pill size changes when selected
- Each pill has different size

**Root Cause**:
- Font weight changes from '500' to '600' when active
- This causes text width to change slightly
- Pills auto-size to content

**Proposed Fix**:
1. Set `minWidth` on filter chips for consistency
2. OR use fixed width based on content
3. OR use same font weight for active/inactive

---

### Issue #9: Green Chip/Button Below Approved Status
**Severity**: MINOR
**Affected Test Case**: 13

**Problem**:
- Extra green chip or button appearing below Approved status
- Needs adjustment

**Location**:
- Likely in DoorsDetailScreen.tsx Requirements tab

**Proposed Fix**:
- Investigate and remove/adjust the extra element

---

### Issue #10: Back Button Position
**Severity**: MINOR (UX Enhancement)
**Affected Test Case**: 10

**Problem**:
- Back button position could be on right side at same level

**Current**: Likely top-left (standard position)
**Suggested**: Top-right at same level as title

**Proposed Fix**:
- Consider as Phase 3 UX enhancement
- OR adjust header layout if quick fix

---

### Issue #11: No Clear Search Cross
**Severity**: MINOR
**Affected Test Case**: 14

**Problem**:
- No clear/cross button to clear search filter
- Have to manually delete text

**Location**:
- DoorsDetailScreen.tsx search input

**Current Code**:
DoorsRegisterScreen HAS clear button (lines 263-267):
```tsx
{searchQuery.length > 0 && (
  <TouchableOpacity onPress={() => setSearchQuery('')}>
    <Text>✕</Text>
  </TouchableOpacity>
)}
```

**Proposed Fix**:
- Add same clear button pattern to DoorsDetailScreen search inputs

---

## 📋 Action Plan - Recommended Sequence

### Phase 1: Critical Fixes (Do First) 🔥

1. **Fix Filter Chip Text Visibility** (Issue #1)
   - Increase font sizes
   - Improve contrast
   - Add minimum width to chips
   - **Estimated Time**: 30 minutes
   - **Impact**: HIGH - Affects usability across multiple screens

2. **Fix Dashboard DOORS KPIs** (Issue #2)
   - Add DOORS KPI cards to Dashboard
   - Integrate DoorsStatisticsService
   - Add observable for DOORS packages
   - **Estimated Time**: 45 minutes
   - **Impact**: HIGH - Major feature missing

3. **Fix Demo Data Requirements** (Issue #3)
   - Investigate actual requirement count (13 vs 100)
   - Either fix seeder or update test expectations
   - **Estimated Time**: 30 minutes
   - **Impact**: MEDIUM - Affects testing accuracy

### Phase 2: Medium Priority Fixes (Do Second) ⚡

4. **Fix BOM-DOORS Integration** (Issue #4)
   - Add `doors_id` to BOM demo data
   - Verify BomRequirementCard DOORS section
   - **Estimated Time**: 45 minutes
   - **Impact**: MEDIUM - Integration feature

5. **Fix Status Badge Visibility** (Issue #6)
   - Increase badge font size
   - Verify rendering
   - **Estimated Time**: 15 minutes
   - **Impact**: MEDIUM - Information visibility

6. **Add Package with <80% Compliance** (Issue #7)
   - Add to demo data to test red color
   - **Estimated Time**: 10 minutes
   - **Impact**: LOW - Testing completeness

### Phase 3: Minor Fixes & Enhancements (Do Last) ✨

7. **Fix Filter Pill Sizing** (Issue #8)
   - Add minWidth to chips
   - **Estimated Time**: 10 minutes

8. **Remove Extra Green Chip** (Issue #9)
   - Find and remove/adjust
   - **Estimated Time**: 15 minutes

9. **Add Clear Search Buttons** (Issue #11)
   - Add to Detail screen search
   - **Estimated Time**: 10 minutes

10. **Category Filter** (Issue #5)
    - Mark as Phase 3 enhancement
    - Update documentation
    - **Estimated Time**: 5 minutes (documentation only)

11. **Back Button Position** (Issue #10)
    - Mark as Phase 3 UX enhancement
    - **Estimated Time**: 5 minutes (documentation only)

---

## ⏱️ Total Estimated Time

- **Critical Fixes**: ~1.75 hours
- **Medium Priority**: ~1.25 hours
- **Minor Fixes**: ~0.75 hours
- **Total**: ~3.75 hours

---

## ✅ Tests That Passed Completely

These test cases passed with no issues:
- Test Case 3: Empty State ✅
- Test Case 4: Load Demo Data ✅
- Test Case 6: Search Functionality ✅
- Test Case 11: Package Header ✅
- Test Case 12: Tab Navigation ✅
- Test Case 14: Requirements Search ✅
- Test Case 16: Status Filter ✅
- Test Case 17: Requirement Modal ✅
- Test Case 18: Compliance Summary ✅
- Test Case 20: Documents Tab ✅
- Test Case 23: Dashboard No Data ✅
- Test Case 26: BOM No DOORS ✅
- Test Case 29: Tab Persistence ✅
- Test Case 30: Pull to Refresh ✅
- Test Cases 33-40: All performance, UX, loading tests ✅

**Pass Rate**: ~70% (28/40 fully passed, 12 with issues)

---

## 📝 Recommendations

### Immediate Actions
1. **Start with Issue #1** (Filter text visibility) - Most impactful
2. **Fix Issue #2** (Dashboard KPIs) - Major feature gap
3. **Clarify Issue #3** (Demo data) - Understand intent

### For Discussion
1. **Issue #3**: Should demo data have 100 requirements or 13?
   - If 13 is intentional (smaller demo), update test docs
   - If 100 is required, fix seeder

2. **Issue #5**: Should category filter be in Phase 2 or Phase 3?
   - If Phase 3, update test case as "Future Enhancement"

3. **Issue #10**: Back button position - keep standard or customize?

### Testing Strategy
After fixes:
1. Re-run all failed test cases
2. Focus on visual verification (use screenshots)
3. Test on multiple devices if possible
4. Update test results in checklist

---

## 🎯 Success Criteria for Sign-Off

To mark Phase 2 as complete:
- [ ] All Critical issues fixed (Issues #1, #2, #3)
- [ ] Dashboard DOORS KPIs displaying correctly
- [ ] Filter chip text clearly visible
- [ ] Demo data matches test expectations
- [ ] At least 90% test pass rate (36/40 tests)
- [ ] No P0 or P1 bugs remaining
- [ ] Documentation updated with known limitations

---

## 📸 Screenshots to Review

User mentioned these screenshots showing issues:
1. **Doors1.png** - Empty state (Issue resolved ✅)
2. **Doors2.png** - Filter chip text visibility issue
3. **Doors4.png** - Critical compliance colors
4. **Doors5.png** - Filter pill size changes
5. **Doors6.png** - Filter chips text not visible
6. **Doors7.png** - Package card details

**Action**: Review these screenshots to understand visual issues better.

---

**Next Step**: Start with Issue #1 (Filter Chip Text Visibility) - Highest impact, affects multiple screens.
