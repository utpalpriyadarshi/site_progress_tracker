# Logistics Navigation Redesign Plan

**Date:** 2026-02-06
**Target:** Match Planner/Manager design pattern
**Status:** Planning

## Current State Analysis

### Existing Navigation (Logistics)
```
Header: Blue (#007AFF), NO hamburger menu
Tabs: 5 tabs (Dashboard, Materials, Inventory, Deliveries, Analytics)
Drawer: Equipment, Purchase Orders, DOORS Register, RFQ Management
```

**Issues:**
- ❌ No hamburger menu (drawer not easily accessible)
- ❌ Blue color (should be purple #673AB7)
- ❌ 5 tabs (should be 4 for consistency)
- ❌ No tutorial integration
- ❌ No demo data

## Proposed Changes

### 1. Navigation Structure
```
Header: Purple (#673AB7), Hamburger menu, "Logistics", Logout
Tabs: 4 tabs (Dashboard, Materials, Inventory, Deliveries)
Drawer: Analytics, Equipment, Purchase Orders, DOORS Register, RFQ Management, Tutorial
```

### 2. Tab Changes
**Keep (4 primary workflows):**
- ✅ Dashboard - Overview and widgets
- ✅ Materials - Material tracking (core function)
- ✅ Inventory - Inventory management (core function)
- ✅ Deliveries - Delivery scheduling (core function)

**Move to Drawer:**
- ➡️ Analytics - Reports and analytics (secondary, less frequent)

**Already in Drawer (keep):**
- Equipment Management
- Purchase Orders
- DOORS Register
- RFQ Management

**Add to Drawer:**
- Tutorial (at bottom, like Planner/Manager)

### 3. Header Design
```
┌─────────────────────────────────┐
│ ☰  Logistics        Logout │ ← Purple #673AB7
├─────────────────────────────────┤
```

### 4. Drawer Structure
```
┌──────────────────────────┐
│   📦 Logistics Icon      │
│   Logistics              │
│   [Project Name]         │
├──────────────────────────┤
│ MAIN                     │
│ 📊 Dashboard             │
├──────────────────────────┤
│ MANAGEMENT               │
│ 📈 Analytics             │ ← Moved from tabs
│ 🔧 Equipment             │
│ 📋 Purchase Orders       │
│ 🚪 DOORS Register        │
│ 📄 RFQ Management        │
├──────────────────────────┤
│ 🎓 Tutorial              │
└──────────────────────────┘
```

### 5. Tutorial Steps (12 steps)

1. **Welcome** - Introduction to Logistics module
2. **Dashboard Overview** - Widgets and KPIs
3. **Material Tracking** - Track materials across sites
4. **Inventory Management** - Stock levels and locations
5. **Delivery Scheduling** - Schedule and track deliveries
6. **Analytics Reports** - Access analytics from drawer
7. **Equipment Management** - Manage equipment inventory
8. **Purchase Orders** - Create and track POs
9. **DOORS Register** - Requirements management
10. **RFQ Management** - Manage RFQs and quotations
11. **Offline Mode** - Work offline, sync later
12. **Monitor Progress** - Return to dashboard

### 6. Demo Data Requirements

**Materials:**
- 15-20 materials with different statuses
- Categories: Electrical, Mechanical, Civil, Piping
- Assigned to different sites
- Various delivery statuses

**Inventory:**
- 10-15 inventory items
- Multiple locations (warehouses, sites)
- Stock levels, reorder points
- Movement history

**Deliveries:**
- 8-10 delivery schedules
- Mix of upcoming, in-progress, completed
- Different vendors and sites
- Some delayed for metrics

**Equipment:**
- 10-12 equipment items
- Categories: Heavy machinery, tools, vehicles
- Assignment status, location tracking

**Purchase Orders:**
- Already have some from Manager demo data
- Link to materials and equipment

**DOORS Packages:**
- Already have some from Designer demo data
- Link to requirements

**RFQs:**
- Already have some from Designer demo data
- Link to vendors

## Implementation Steps

### Phase 1: Navigation Structure
1. ✅ Update LogisticsNavigator.tsx
   - Add hamburger menu to header
   - Change header color to purple
   - Remove Analytics tab
   - Add HeaderLeft component (hamburger)

2. ✅ Update drawer
   - Add Analytics screen to drawer
   - Add Tutorial button at bottom
   - Update drawer content layout

### Phase 2: Tutorial Integration
1. ✅ Create logisticsTutorialSteps.ts
   - 12 tutorial steps
   - Icons and descriptions
   - Navigation hints

2. ✅ Update LogisticsDashboard
   - Add tutorial integration
   - Check for first-time users
   - Handle tutorial navigation

3. ✅ Add TutorialService integration
   - Track tutorial progress
   - Store completion status
   - Handle restart

### Phase 3: Demo Data
1. ✅ Create generateLogisticsDemoData function
   - Materials with tracking
   - Inventory items
   - Delivery schedules
   - Equipment records

2. ✅ Update DemoDataCard
   - Add Logistics option
   - Call demo data function
   - Show success message

### Phase 4: Testing & Documentation
1. ✅ Test navigation flow
2. ✅ Test tutorial walkthrough
3. ✅ Test demo data generation
4. ✅ Update documentation
5. ✅ Create PR

## File Changes Required

### New Files
- `src/tutorial/logisticsTutorialSteps.ts`

### Modified Files
- `src/nav/LogisticsNavigator.tsx` (major refactor)
- `src/logistics/dashboard/LogisticsDashboard.tsx` (add tutorial)
- `src/services/DemoDataService.ts` (add Logistics demo data)
- `src/admin/dashboard/components/DemoDataCard.tsx` (add Logistics option)

## Color Palette

```css
/* Logistics Theme (Purple like Planner/Manager) */
--header-background: #673AB7;  /* Purple */
--header-text: #FFFFFF;         /* White */
--tab-active: #673AB7;          /* Purple */
--tab-inactive: #8E8E93;        /* Gray */
--drawer-active: #673AB7;       /* Purple */
--drawer-inactive: #8E8E93;     /* Gray */
```

## Expected Outcome

After implementation:
- ✅ Purple header matching Planner/Manager
- ✅ Hamburger menu for easy drawer access
- ✅ 4 main tabs (primary workflows)
- ✅ 5 drawer items + Tutorial
- ✅ Tutorial for first-time users
- ✅ Realistic demo data
- ✅ Consistent user experience across roles

## Benefits

1. **Consistency** - Same pattern as Planner/Manager
2. **Usability** - Cleaner tab bar, easier navigation
3. **Onboarding** - Tutorial guides new users
4. **Testing** - Demo data for validation
5. **Professional** - Purple theme, polished UI

## Next Steps

1. Implement Phase 1 (Navigation)
2. Implement Phase 2 (Tutorial)
3. Implement Phase 3 (Demo Data)
4. Test thoroughly
5. Document changes
6. Commit and push
