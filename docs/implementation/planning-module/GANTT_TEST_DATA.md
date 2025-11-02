# Gantt Chart Test Data

This document provides test data for manually testing the Gantt Chart screen.

---

## Quick Start

**Method 1: Use the App UI (Recommended)**
1. Login as **Planner**
2. Go to **Sites** tab → Create a site: "Gantt Test Site"
3. Go to **WBS** tab → Select "Gantt Test Site"
4. Create items using the data below (use "+" FAB button)
5. Go to **Gantt** tab → Select "Gantt Test Site"
6. Test the Gantt Chart!

**Method 2: Use Database Service (Advanced)**
- See `SimpleDatabaseService.ts` → Add test data method
- Requires code modification

---

## Test Site

**Site Name**: Gantt Test Site
**Location**: Test Location
**Project**: Default Project (already exists)

---

## Test Items to Create (20 items for comprehensive testing)

### Phase 1: Design & Engineering (3 items)

#### Item 1: Structural Design
- **Name**: Structural Design and Calculations
- **Category**: Design
- **Phase**: Design & Engineering
- **Start Date**: Today - 30 days
- **End Date**: Today - 20 days
- **Duration**: 10 days
- **Quantity**: 1
- **Unit**: Set
- **Status**: Completed (100%)
- **Critical Path**: No
- **Float Days**: 5
- **Dependency Risk**: Low

#### Item 2: Electrical Design
- **Name**: Electrical System Design
- **Category**: Design
- **Phase**: Design & Engineering
- **Start Date**: Today - 25 days
- **End Date**: Today - 15 days
- **Duration**: 10 days
- **Quantity**: 1
- **Unit**: Set
- **Status**: Completed (100%)
- **Critical Path**: No
- **Float Days**: 3
- **Dependency Risk**: Low

#### Item 3: Architectural Plans
- **Name**: Architectural Drawings & Specifications
- **Category**: Design
- **Phase**: Design & Engineering
- **Start Date**: Today - 28 days
- **End Date**: Today - 18 days
- **Duration**: 10 days
- **Quantity**: 1
- **Unit**: Set
- **Status**: Completed (100%)
- **Critical Path**: Yes (mark this)
- **Float Days**: 0
- **Dependency Risk**: High
- **Risk Notes**: Foundation work depends on this

---

### Phase 2: Statutory Approvals (2 items)

#### Item 4: Building Permits
- **Name**: Building Permit Approval
- **Category**: Approvals
- **Phase**: Statutory Approvals
- **Start Date**: Today - 18 days
- **End Date**: Today - 10 days
- **Duration**: 8 days
- **Quantity**: 1
- **Unit**: Set
- **Status**: Completed (100%)
- **Critical Path**: Yes
- **Float Days**: 0
- **Dependency Risk**: High
- **Risk Notes**: Required before mobilization

#### Item 5: Utility Clearances
- **Name**: Electrical & Water Utility Clearances
- **Category**: Approvals
- **Phase**: Statutory Approvals
- **Start Date**: Today - 15 days
- **End Date**: Today - 8 days
- **Duration**: 7 days
- **Quantity**: 1
- **Unit**: Set
- **Status**: In Progress (80%)
- **Critical Path**: No
- **Float Days**: 2
- **Dependency Risk**: Medium

---

### Phase 3: Site Preparation (3 items)

#### Item 6: Site Mobilization
- **Name**: Site Mobilization & Setup
- **Category**: Construction
- **Phase**: Mobilization
- **Start Date**: Today - 10 days
- **End Date**: Today - 5 days
- **Duration**: 5 days
- **Quantity**: 1
- **Unit**: Set
- **Status**: Completed (100%)
- **Critical Path**: Yes
- **Float Days**: 0
- **Dependency Risk**: Medium

#### Item 7: Site Clearing
- **Name**: Land Clearing & Grading
- **Category**: Construction
- **Phase**: Site Preparation
- **Start Date**: Today - 8 days
- **End Date**: Today - 3 days
- **Duration**: 5 days
- **Quantity**: 500
- **Unit**: Square Meters
- **Status**: Completed (100%)
- **Critical Path**: Yes
- **Float Days**: 0
- **Dependency Risk**: Low

#### Item 8: Excavation
- **Name**: Excavation for Foundation
- **Category**: Construction
- **Phase**: Site Preparation
- **Start Date**: Today - 5 days
- **End Date**: Today
- **Duration**: 5 days
- **Quantity**: 200
- **Unit**: Cubic Meters
- **Status**: In Progress (75%)
- **Critical Path**: Yes
- **Float Days**: 0
- **Dependency Risk**: High
- **Risk Notes**: Weather dependent - rainy season risk

---

### Phase 4: Construction (6 items)

#### Item 9: Foundation Work
- **Name**: Foundation Concrete Pouring
- **Category**: Construction
- **Phase**: Construction
- **Start Date**: Today
- **End Date**: Today + 7 days
- **Duration**: 7 days
- **Quantity**: 150
- **Unit**: Cubic Meters
- **Status**: In Progress (30%)
- **Critical Path**: Yes
- **Float Days**: 0
- **Dependency Risk**: High
- **Risk Notes**: Critical path - delays will impact entire project

#### Item 10: Column Erection
- **Name**: RCC Column Construction
- **Category**: Construction
- **Phase**: Construction
- **Start Date**: Today + 8 days
- **End Date**: Today + 18 days
- **Duration**: 10 days
- **Quantity**: 50
- **Unit**: Numbers
- **Status**: Not Started (0%)
- **Critical Path**: Yes
- **Float Days**: 0
- **Dependency Risk**: High
- **Risk Notes**: Depends on foundation curing

#### Item 11: Beam & Slab Work
- **Name**: Beam & Slab Casting
- **Category**: Construction
- **Phase**: Construction
- **Start Date**: Today + 19 days
- **End Date**: Today + 30 days
- **Duration**: 11 days
- **Quantity**: 800
- **Unit**: Square Meters
- **Status**: Not Started (0%)
- **Critical Path**: Yes
- **Float Days**: 0
- **Dependency Risk**: Medium

#### Item 12: Masonry Work
- **Name**: Brick Masonry Walls
- **Category**: Construction
- **Phase**: Construction
- **Start Date**: Today + 25 days
- **End Date**: Today + 40 days
- **Duration**: 15 days
- **Quantity**: 1000
- **Unit**: Square Meters
- **Status**: Not Started (0%)
- **Critical Path**: No
- **Float Days**: 5
- **Dependency Risk**: Low

#### Item 13: Roofing
- **Name**: Roof Structure & Waterproofing
- **Category**: Construction
- **Phase**: Construction
- **Start Date**: Today + 31 days
- **End Date**: Today + 45 days
- **Duration**: 14 days
- **Quantity**: 600
- **Unit**: Square Meters
- **Status**: Not Started (0%)
- **Critical Path**: Yes
- **Float Days**: 0
- **Dependency Risk**: Medium
- **Risk Notes**: Weather dependent

#### Item 14: Plastering
- **Name**: Internal & External Plastering
- **Category**: Construction
- **Phase**: Construction
- **Start Date**: Today + 41 days
- **End Date**: Today + 55 days
- **Duration**: 14 days
- **Quantity**: 2000
- **Unit**: Square Meters
- **Status**: Not Started (0%)
- **Critical Path**: No
- **Float Days**: 3
- **Dependency Risk**: Low

---

### Phase 5: Electrical & Plumbing (2 items)

#### Item 15: Electrical Installation
- **Name**: Electrical Conduit & Wiring
- **Category**: Installation
- **Phase**: Construction
- **Start Date**: Today + 35 days
- **End Date**: Today + 50 days
- **Duration**: 15 days
- **Quantity**: 1
- **Unit**: Set
- **Status**: Not Started (0%)
- **Critical Path**: No
- **Float Days**: 5
- **Dependency Risk**: Medium

#### Item 16: Plumbing Work
- **Name**: Water Supply & Drainage
- **Category**: Installation
- **Phase**: Construction
- **Start Date**: Today + 35 days
- **End Date**: Today + 48 days
- **Duration**: 13 days
- **Quantity**: 1
- **Unit**: Set
- **Status**: Not Started (0%)
- **Critical Path**: No
- **Float Days**: 7
- **Dependency Risk**: Low

---

### Phase 6: Testing & Commissioning (2 items)

#### Item 17: Electrical Testing
- **Name**: Electrical System Testing & Certification
- **Category**: Testing
- **Phase**: Testing & Pre-commissioning
- **Start Date**: Today + 51 days
- **End Date**: Today + 58 days
- **Duration**: 7 days
- **Quantity**: 1
- **Unit**: Set
- **Status**: Not Started (0%)
- **Critical Path**: Yes
- **Float Days**: 0
- **Dependency Risk**: Medium

#### Item 18: Water Testing
- **Name**: Plumbing & Water Quality Testing
- **Category**: Testing
- **Phase**: Testing & Pre-commissioning
- **Start Date**: Today + 49 days
- **End Date**: Today + 55 days
- **Duration**: 6 days
- **Quantity**: 1
- **Unit**: Set
- **Status**: Not Started (0%)
- **Critical Path**: No
- **Float Days**: 3
- **Dependency Risk**: Low

---

### Phase 7: Finishing & Handover (2 items)

#### Item 19: Painting & Finishing
- **Name**: Painting & Final Finishing
- **Category**: Construction
- **Phase**: Construction
- **Start Date**: Today + 56 days
- **End Date**: Today + 70 days
- **Duration**: 14 days
- **Quantity**: 2500
- **Unit**: Square Meters
- **Status**: Not Started (0%)
- **Critical Path**: No
- **Float Days**: 2
- **Dependency Risk**: Low

#### Item 20: Final Handover
- **Name**: Documentation & Project Handover
- **Category**: Handover
- **Phase**: Handover & Documentation
- **Start Date**: Today + 71 days
- **End Date**: Today + 75 days
- **Duration**: 4 days
- **Quantity**: 1
- **Unit**: Set
- **Status**: Not Started (0%)
- **Critical Path**: Yes
- **Float Days**: 0
- **Dependency Risk**: Low
- **Milestone**: Yes (mark this as milestone)

---

## Quick Data Entry Tips

### For Faster Entry:
1. **Start with Critical Path Items First** (Items 3, 4, 6, 7, 8, 9, 10, 11, 13, 17, 20)
   - These will show red borders in Gantt
2. **Vary the phases** to see different colors
3. **Mix progress percentages** (0%, 30%, 75%, 80%, 100%)
4. **Use realistic durations** (5-15 days) for better visualization

### Date Calculation Helper:
- **Today**: Use current date
- **Today - 30 days**: Go back 30 days from today
- **Today + 7 days**: Go forward 7 days from today

Example: If today is October 20, 2025:
- Today - 30 = September 20, 2025
- Today + 7 = October 27, 2025

---

## Expected Gantt Chart Visualization

After entering all 20 items, the Gantt Chart should show:

### Timeline:
- **Start**: ~September 20 (Today - 30 days)
- **End**: ~January 5 (Today + 75 days)
- **Total Span**: ~105 days (~3.5 months)

### Visual Features:
- **7 Critical Path items** with red borders (Items 3, 4, 6, 7, 8, 9, 10, 11, 13, 17, 20)
- **13 Non-critical items** with colored borders
- **5 Completed items** (100% progress) with full color overlay
- **3 In-Progress items** (30%, 75%, 80%) with partial overlay
- **12 Not-Started items** (0%) with no overlay
- **Multiple phases** with different colors
- **Today marker** (blue line) roughly in middle of timeline

### Zoom Testing:
- **Day View**: ~105 columns (very detailed)
- **Week View**: ~15 columns (balanced)
- **Month View**: ~4 columns (overview)

---

## Testing Scenarios

### Scenario 1: Critical Path Visualization
- Focus on Items: 3, 4, 6, 7, 8, 9, 10, 11, 13, 17, 20
- **Expected**: All have thick red borders
- **Expected**: Form a continuous chain on timeline

### Scenario 2: Progress Tracking
- Check Items 8, 9, 5 (In Progress with 75%, 30%, 80%)
- **Expected**: Progress overlay visible
- **Expected**: Percentage displayed on bar

### Scenario 3: Phase Colors
- Design (Blue): Items 1, 2, 3
- Approvals (Purple): Items 4, 5
- Construction (Green): Items 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 19
- Testing (Red): Items 17, 18
- Handover (Gray): Item 20

### Scenario 4: Zoom Levels
- Switch Day → Week → Month
- **Expected**: All items adjust positions correctly
- **Expected**: Timeline labels change format

### Scenario 5: Today Marker
- Today should fall between Item 8 and Item 9
- **Expected**: Blue vertical line at today's position
- **Expected**: Past items on left, future items on right

---

## Validation Checklist

After creating all items:

- [ ] All 20 items visible in Gantt Chart
- [ ] Items sorted by start date
- [ ] 7 items have red critical path borders
- [ ] Progress percentages match (100%, 80%, 75%, 30%, 0%)
- [ ] Colors match phases (Blue, Purple, Green, Red, Gray)
- [ ] Today marker visible (blue line)
- [ ] Timeline spans ~3.5 months
- [ ] Zoom controls work (Day/Week/Month)
- [ ] Horizontal scrolling works
- [ ] No visual glitches or overlaps

---

## Troubleshooting

### Issue: Items not showing in Gantt
- **Solution**: Verify site is selected in both WBS and Gantt tabs

### Issue: Dates are wrong
- **Solution**: Double-check date calculations (Today ± X days)
- **Solution**: Use calendar picker for accuracy

### Issue: Critical path items not highlighted
- **Solution**: Ensure "Critical Path" checkbox is checked during item creation

### Issue: Progress not showing
- **Solution**: Go to WBS → Edit item → Update "Completed Quantity"
- **Solution**: Progress = (Completed / Planned) × 100%

### Issue: Timeline looks compressed
- **Solution**: Switch to Day zoom for more detail
- **Solution**: Scroll horizontally to see full timeline

---

## Clean Up

To remove test data after testing:

1. Go to WBS Management tab
2. Select "Gantt Test Site"
3. Long-press each item → Delete
4. Go to Sites tab → Delete "Gantt Test Site"

Or keep the data for future regression testing!

---

## Notes

- This test data provides comprehensive coverage of all Gantt features
- Mix of past, present, and future dates for realistic timeline
- Critical path creates a logical dependency chain
- Various phases show color-coding capabilities
- Progress percentages demonstrate overlay feature

**Happy Testing!** 🎉
