# Manager Navigation - Planner Design Match

**Date:** 2026-02-06
**Commit:** 4ea67b4
**Reference:** prompts/planner1.jpeg

## Overview

Redesigned Manager navigation to match Planner's design pattern with purple header, hamburger menu, and streamlined 4-tab layout. BOM Management moved to drawer for cleaner navigation.

## Visual Changes

### Before (Original Design)
```
Header: Individual per tab
Tabs: 6 tabs (Dashboard, Team, Finance, Milestones, BOM, More)
Color: Blue (#007AFF)
Menu: "More" tab to open drawer
```

### After (Planner-style Design)
```
Header: Purple (#673AB7) with hamburger menu + logout
Tabs: 4 tabs (Dashboard, Team, Finance, Milestones)
Color: Purple (#673AB7)
Menu: Hamburger icon (☰) on top-left
Drawer: BOM Management + Tutorial
```

## Design Specifications

### 1. Header Bar
- **Background**: Purple `#673AB7`
- **Height**: Standard navigation header
- **Left**: Hamburger menu icon (☰) - 28px, white
- **Center**: "Manager" title - 20px, bold, white
- **Right**: "Logout" button - 16px, white

### 2. Bottom Tabs (4 tabs)
| Tab | Icon (Active) | Icon (Inactive) | Label |
|-----|---------------|-----------------|-------|
| Dashboard | view-dashboard | view-dashboard-outline | Dashboard |
| Team | account-group | account-group-outline | Team |
| Finance | currency-usd | currency-usd | Finance |
| Milestones | flag-checkered | flag-outline | Milestones |

**Tab Bar Styling:**
- Active color: Purple `#673AB7`
- Inactive color: Gray
- Height: 56px
- Label size: 11px, weight: 500
- Padding bottom: 4px

### 3. Drawer Menu
When hamburger icon is tapped, drawer opens with:

1. **Header Section**
   - Business icon (32px, purple)
   - "Manager" title (20px, bold)
   - "Project Management" subtitle (12px, gray)

2. **Navigation Items**
   - BOM Management (clipboard-list icon)

3. **Tutorial Section** (bottom)
   - Divider
   - Tutorial button (school icon, purple)

## Code Changes

### ManagerNavigator.tsx
**Key Updates:**
1. Removed `BomManagement` and `More` tabs
2. Added hamburger menu button in header left
3. Added purple header styling
4. Changed tab icons from emoji to MaterialCommunityIcons
5. Added proper screen options with callbacks
6. All tabs show "Manager" as header title

**New Functions:**
- `handleDrawerToggle()` - Opens/closes drawer
- `HeaderLeft` component - Hamburger menu button
- `HeaderRight` component - Logout button
- `getTabBarIcon()` - Returns icon based on route
- `screenOptions` - Memoized tab configuration

### ManagerDrawerNavigator.tsx
**Key Updates:**
1. Added `BomManagement` screen to drawer
2. Added `DrawerItemList` to show navigation items
3. Changed icon library from MaterialIcons to MaterialCommunityIcons
4. Added `getDrawerIcon()` function
5. Added BOM screen with proper routing

**New Exports:**
- `BomManagement` route in `ManagerDrawerParamList`

## Navigation Flow

### Tab Navigation
```
User taps tab → Navigate to screen
All tabs: Show purple header with "Manager" title
Dashboard/Team/Finance/Milestones always accessible
```

### Drawer Navigation
```
User taps hamburger (☰) → Drawer opens from left
Options:
  1. Tap "BOM Management" → Navigate to BOM screen
  2. Tap "Tutorial" → Restart tutorial from Dashboard
  3. Tap outside → Close drawer
```

### Tutorial Flow
```
From Dashboard:
  - Auto-show on first login
  - Manual trigger: Hamburger → Tutorial

From Drawer:
  - Tutorial button resets progress
  - Navigates to Dashboard with showTutorial=true
```

## Pattern Comparison

### Planner Pattern
```
Header: Purple, Hamburger, "Planning", Logout
Tabs: 4 (Dashboard, Key Dates, Schedule, Gantt)
Drawer: Resources, Sites, WBS, Milestones, Baseline, Tutorial
```

### Manager Pattern (Now Matching)
```
Header: Purple, Hamburger, "Manager", Logout
Tabs: 4 (Dashboard, Team, Finance, Milestones)
Drawer: BOM Management, Tutorial
```

### Supervisor Pattern (Different)
```
Header: Per-tab, No hamburger
Tabs: 5 + More button
Drawer: Only Tutorial (opened via More tab)
```

## Benefits

### User Experience
- ✅ Familiar pattern for users who use Planner
- ✅ Cleaner bottom navigation (4 vs 6 tabs)
- ✅ More intuitive drawer access (hamburger vs More tab)
- ✅ Consistent visual identity (purple header)

### Developer Experience
- ✅ Consistent component structure across roles
- ✅ Better separation of primary/secondary screens
- ✅ Easier to maintain with shared patterns
- ✅ Performance: Memoized callbacks and screen options

### Navigation
- ✅ Primary workflows in tabs (quick access)
- ✅ Secondary screens in drawer (organized)
- ✅ Tutorial always accessible via drawer
- ✅ Less clutter on bottom tab bar

## Testing Checklist

- [x] Hamburger menu opens drawer
- [x] All 4 tabs navigate correctly
- [x] BOM Management accessible from drawer
- [x] Tutorial button works from drawer
- [x] Logout button works from header
- [x] Purple header color matches Planner
- [x] Tab icons show correct states (active/inactive)
- [x] Drawer closes when tapping outside
- [x] Header shows "Manager" on all tabs
- [x] Navigation persists after orientation change

## Future Enhancements

1. **Additional Drawer Items**: Could add more secondary screens
2. **Header Title Customization**: Show screen-specific titles if needed
3. **Gesture Navigation**: Swipe from left to open drawer
4. **Badge Indicators**: Show counts on drawer items (e.g., pending approvals)

## Files Modified

- `src/nav/ManagerNavigator.tsx` (144 insertions, 88 deletions)
- `src/nav/ManagerDrawerNavigator.tsx` (improved structure)

## Migration Notes

Users upgrading from previous version will notice:
1. BOM tab moved to drawer (tap hamburger → BOM Management)
2. More tab removed (tap hamburger to access drawer)
3. Purple header replaces per-tab headers
4. Tutorial accessible via drawer instead of More tab

No data migration required - purely UI/navigation changes.

## Screenshots Reference

Original design: `prompts/planner1.jpeg`
- Purple header with hamburger menu
- "Planning" title in center
- "Logout" on right
- 4 bottom tabs with icons

## Color Palette

```css
/* Manager Theme (Matching Planner) */
--header-background: #673AB7;  /* Purple */
--header-text: #FFFFFF;         /* White */
--tab-active: #673AB7;          /* Purple */
--tab-inactive: #808080;        /* Gray */
--drawer-active: #007AFF;       /* Blue */
--drawer-inactive: #666666;     /* Dark Gray */
```

## Related Documentation

- Manager Tutorial Steps: `src/tutorial/managerTutorialSteps.ts`
- Manager Context: `src/manager/context/ManagerContext.tsx`
- BOM Context: `src/manager/context/BomContext.tsx`
- Demo Data: `src/services/DemoDataService.ts`

## Version History

- v2.16: Initial Manager tutorial and demo data (commit 2f9fe30)
- v2.17: Planner design match with hamburger menu (commit 4ea67b4)
