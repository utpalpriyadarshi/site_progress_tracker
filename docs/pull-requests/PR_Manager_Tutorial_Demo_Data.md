# PR: Manager Tutorial, Demo Data & Purple Header

## Summary

Implement drawer navigation for Manager role with integrated tutorial system and comprehensive demo data generation. Update navigation to match Planner design pattern with purple header and hamburger menu.

## Changes Overview

### 🎯 Navigation Restructure
- **Added ManagerDrawerNavigator** wrapping tab navigator
- **Purple header** (#673AB7) matching Planner
- **Hamburger menu** (☰) for drawer access
- **4 main tabs**: Dashboard, Team, Finance, Milestones
- **BOM moved to drawer** for cleaner navigation

### 📚 Tutorial Integration
- **11-step tutorial** covering all Manager functionality
- **Auto-show on first login** for new users
- **Manual restart** from drawer menu
- **Progress tracking** with TutorialService
- **Comprehensive coverage**: Dashboard, Engineering, Sites, Equipment, Finance, Team, Reports, Milestones, BOM

### 🎲 Demo Data Generation
- **5 Vendors**: Electrical, Mechanical, Civil, Piping, Instrumentation suppliers
- **10 Purchase Orders**: Various statuses (draft, issued, in-progress, delivered, closed)
- **3 BOMs**: One per site with different statuses
- **15 BOM Items**: Across all categories (material, labor, equipment, subcontractor)

## Files Changed

### New Files (3)
- `src/nav/ManagerDrawerNavigator.tsx` - Drawer navigation wrapper
- `src/tutorial/managerTutorialSteps.ts` - Tutorial steps definition
- `docs/implementation/Manager_Tutorial_Drawer_Implementation.md` - Documentation
- `docs/implementation/Manager_Planner_Design_Match.md` - Design documentation

### Modified Files (5)
- `src/nav/ManagerNavigator.tsx` - Updated to 4 tabs with purple header
- `src/nav/MainNavigator.tsx` - Routes to ManagerDrawerNavigator
- `src/manager/ManagerDashboardScreen.tsx` - Added tutorial integration
- `src/services/DemoDataService.ts` - Added generateManagerDemoData()
- `src/admin/dashboard/components/DemoDataCard.tsx` - Added Manager option

## Technical Details

### Navigation Pattern
```
ManagerDrawerNavigator (Drawer)
└── ManagerTabNavigator (4 Tabs)
    ├── Dashboard
    ├── Team Performance
    ├── Financial Reports
    ├── Milestones
    └── [BOM in Drawer]
```

### Context Providers
- ManagerProvider (for Manager context)
- BomProvider (for BOM management)

### Demo Data Structure
```typescript
{
  vendorsCreated: 5,
  purchaseOrdersCreated: 10,
  bomsCreated: 3,
  bomItemsCreated: 15
}
```

## Benefits

### User Experience
- ✅ Consistent with Planner/Supervisor patterns
- ✅ Cleaner navigation (4 vs 6 tabs)
- ✅ Guided onboarding via tutorial
- ✅ Professional purple theme

### Developer Experience
- ✅ Maintainable code structure
- ✅ Well-documented changes
- ✅ Consistent patterns across roles
- ✅ Tutorial system integration

## Testing

### Navigation
- [x] Hamburger menu opens drawer
- [x] All 4 tabs work correctly
- [x] BOM accessible from drawer
- [x] Purple header displays
- [x] Logout works

### Tutorial
- [x] Auto-shows on first Manager login
- [x] Tutorial button in drawer works
- [x] All 11 steps display correctly
- [x] Progress persists when dismissed

### Demo Data
- [x] Manager option in dropdown
- [x] Generates all data types
- [x] Data visible in Manager screens
- [x] No errors during generation

## Dependencies

- Requires WatermelonDB models: Vendor, PurchaseOrder, BOM, BOMItem
- Compatible with existing tutorial system
- No breaking changes to existing functionality

## Related PRs

- #96 - Planner Tutorial & Demo Data
- #97 - Design Engineer Tutorial & Demo Data
- #98 - Supervisor Tutorial & Demo Data

## Screenshots

_Purple header with hamburger menu matching Planner design_
_Tutorial walkthrough for Manager role_
_Demo data in Manager dashboard_

## Commits

```
1bcd430 refactor(manager): Match Planner design with hamburger menu and 4 tabs
2f9fe30 feat(manager): Add drawer navigation with tutorial and demo data
```

## Stats

- 9 files changed
- 1,276 insertions, 80 deletions
- 3 new files created

---

**Ready for Review** ✅
**No Conflicts** ✅
**Tests Passing** ✅
