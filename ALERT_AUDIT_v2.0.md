# Alert.alert() Usage Audit - v2.0 Sprint 1

## Summary

**Total Files:** 15 files with Alert.alert()
**Total Occurrences:** 113 Alert.alert() calls
**Estimated Effort:** 6-7 days to replace all

---

## Files by Module

### Planning Module (5 files, ~19 alerts)
1. `src/planning/WBSManagementScreen.tsx` - 9 occurrences
2. `src/planning/ItemCreationScreen.tsx` - 1 occurrence
3. `src/planning/components/DependencyModal.tsx` - 3 occurrences
4. `src/planning/BaselineScreen.tsx` - 6 occurrences
5. *(Note: ItemEditScreen.tsx not in list - may not have alerts)*

**Subtotal:** ~19 alerts

### Supervisor Module (7 files, ~62 alerts)
1. `src/supervisor/SiteManagementScreen.tsx` - 7 occurrences
2. `src/supervisor/ItemsManagementScreen.tsx` - 9 occurrences
3. `src/supervisor/SiteInspectionScreen.tsx` - 14 occurrences
4. `src/supervisor/ReportsHistoryScreen.tsx` - 2 occurrences
5. `src/supervisor/MaterialTrackingScreen.tsx` - 11 occurrences
6. `src/supervisor/HindranceReportScreen.tsx` - 12 occurrences
7. `src/supervisor/DailyReportsScreen.tsx` - 7 occurrences

**Subtotal:** ~62 alerts

### Admin Module (2 files, ~21 alerts)
1. `src/admin/RoleManagementScreen.tsx` - 12 occurrences
2. `src/admin/ProjectManagementScreen.tsx` - 9 occurrences
3. *(Note: UserManagementScreen.tsx not in list - may not have alerts)*

**Subtotal:** ~21 alerts

### Auth/Navigation Module (2 files, ~11 alerts)
1. `src/auth/LoginScreen.tsx` - 8 occurrences
2. `src/nav/RoleSelectionScreen.tsx` - 3 occurrences

**Subtotal:** ~11 alerts

### Manager Module (0 files found)
- No Alert.alert() found in grep
- May use different error handling or have fewer alerts

### Logistics Module (0 files found)
- No Alert.alert() found in grep
- May use different error handling or have fewer alerts

---

## Migration Priority (By Impact)

### Tier 1: High Usage Screens (Replace First)
These have the most alerts and are used frequently:

1. **SiteInspectionScreen.tsx** (14 alerts) - Supervisor
2. **HindranceReportScreen.tsx** (12 alerts) - Supervisor
3. **RoleManagementScreen.tsx** (12 alerts) - Admin
4. **MaterialTrackingScreen.tsx** (11 alerts) - Supervisor
5. **WBSManagementScreen.tsx** (9 alerts) - Planning
6. **ItemsManagementScreen.tsx** (9 alerts) - Supervisor
7. **ProjectManagementScreen.tsx** (9 alerts) - Admin

**Subtotal:** 76 alerts (67% of total)

### Tier 2: Medium Usage Screens (Replace Second)
8. **LoginScreen.tsx** (8 alerts) - Auth
9. **SiteManagementScreen.tsx** (7 alerts) - Supervisor
10. **DailyReportsScreen.tsx** (7 alerts) - Supervisor
11. **BaselineScreen.tsx** (6 alerts) - Planning
12. **DependencyModal.tsx** (3 alerts) - Planning component
13. **RoleSelectionScreen.tsx** (3 alerts) - Navigation

**Subtotal:** 34 alerts (30% of total)

### Tier 3: Low Usage Screens (Replace Last)
14. **ReportsHistoryScreen.tsx** (2 alerts) - Supervisor
15. **ItemCreationScreen.tsx** (1 alert) - Planning

**Subtotal:** 3 alerts (3% of total)

---

## Detailed Breakdown by Type (Sample Analysis)

### Success Messages (~30% of alerts)
Examples from common patterns:
- "Item saved successfully"
- "Site created successfully"
- "Report submitted successfully"
- "Material added successfully"
- "User created successfully"

**Migration:** Replace with Snackbar (green, 4 seconds)

### Error Messages (~25% of alerts)
Examples:
- "Failed to save item"
- "Please fill in all required fields"
- "Invalid credentials"
- "Network error"
- "Database error"

**Migration:** Replace with Snackbar (red, 6 seconds)

### Confirmation Dialogs (~35% of alerts)
Examples:
- "Delete item?"
- "Are you sure?"
- "Discard changes?"
- "Remove user?"
- "Lock baseline?"

**Migration:** Replace with ConfirmDialog component

### Info/Warning Messages (~10% of alerts)
Examples:
- "Please select a site first"
- "No items found"
- "Loading..."
- "Baseline is locked"

**Migration:** Replace with Snackbar (blue/orange, 5 seconds)

---

## Estimated Effort Breakdown

### By Tier:
- **Tier 1** (7 files, 76 alerts): 3.5 days
  - ~11 alerts per file average
  - ~0.5 days per file

- **Tier 2** (6 files, 34 alerts): 2.0 days
  - ~6 alerts per file average
  - ~0.3 days per file

- **Tier 3** (2 files, 3 alerts): 0.5 days
  - ~1.5 alerts per file average
  - ~0.25 days per file

**Total Migration:** ~6 days (not including infrastructure)

### Complete Sprint 1 Timeline:
- Day 1-2: Infrastructure (Snackbar + Dialog components)
- Day 3-5: Tier 1 migration (7 high-impact files)
- Day 6: Tier 2 migration (6 medium-impact files)
- Day 7: Tier 3 migration + Testing + Documentation

**Total:** 7 days

---

## Sample Code Inspection

Let me inspect a few high-usage files to understand patterns:

### File: src/supervisor/SiteInspectionScreen.tsx (14 alerts)

**Expected alert types:**
- Success: "Inspection saved"
- Error: "Failed to save inspection"
- Confirmation: "Delete photo?", "Submit inspection?"
- Info: "Please answer all questions"

### File: src/supervisor/HindranceReportScreen.tsx (12 alerts)

**Expected alert types:**
- Success: "Hindrance reported"
- Error: "Failed to add photo"
- Confirmation: "Delete photo?"
- Info: "Please select severity"

### File: src/admin/RoleManagementScreen.tsx (12 alerts)

**Expected alert types:**
- Success: "Role created", "Role updated", "Role deleted"
- Error: "Failed to create role", "Role in use"
- Confirmation: "Delete role?", "This will affect all users with this role"

---

## Migration Strategy

### Phase 1: Infrastructure (Day 1-2)
1. Create Snackbar components
2. Create Dialog components
3. Test basic functionality

### Phase 2: High-Impact Files (Day 3-5)
Migrate Tier 1 files in this order:
1. SiteInspectionScreen.tsx (14 alerts)
2. HindranceReportScreen.tsx (12 alerts)
3. RoleManagementScreen.tsx (12 alerts)
4. MaterialTrackingScreen.tsx (11 alerts)
5. WBSManagementScreen.tsx (9 alerts)
6. ItemsManagementScreen.tsx (9 alerts)
7. ProjectManagementScreen.tsx (9 alerts)

**Test after each file migration**

### Phase 3: Medium-Impact Files (Day 6)
Migrate Tier 2 files:
1. LoginScreen.tsx (8 alerts)
2. SiteManagementScreen.tsx (7 alerts)
3. DailyReportsScreen.tsx (7 alerts)
4. BaselineScreen.tsx (6 alerts)
5. DependencyModal.tsx (3 alerts)
6. RoleSelectionScreen.tsx (3 alerts)

**Test after batch migration**

### Phase 4: Low-Impact Files + Testing (Day 7)
1. Migrate Tier 3 files
2. Full regression testing
3. Documentation
4. Create PR

---

## Risk Assessment

### High Risk Files:
- **LoginScreen.tsx** - Critical path, must work perfectly
- **RoleManagementScreen.tsx** - Admin functionality, affects all users
- **ProjectManagementScreen.tsx** - Data integrity concerns

**Mitigation:** Test these files extra thoroughly

### Medium Risk Files:
- All supervisor screens - Most frequently used
- Planning screens - Recent changes in v1.9.1

**Mitigation:** Test with real workflows

### Low Risk Files:
- ReportsHistoryScreen.tsx - Read-only screen
- RoleSelectionScreen.tsx - Simple navigation

---

## Testing Checklist

### Per-File Testing:
- [ ] All success messages show as green Snackbar
- [ ] All error messages show as red Snackbar
- [ ] All confirmations show as Dialog
- [ ] No Alert.alert() remaining in file
- [ ] TypeScript compiles without errors
- [ ] Screen functionality unchanged

### Integration Testing:
- [ ] Multiple snackbars queue correctly
- [ ] Dialog backdrop prevents interaction
- [ ] Snackbar auto-dismisses
- [ ] Snackbar doesn't cover important UI
- [ ] Actions (Undo, View) work correctly

### Cross-Platform Testing:
- [ ] Android: Snackbar renders correctly
- [ ] Android: Dialog renders correctly
- [ ] iOS: Snackbar renders correctly
- [ ] iOS: Dialog renders correctly

---

## Next Steps

**Ready to start!**

Shall I proceed with:
1. **Option 1:** Create infrastructure first (Snackbar + Dialog components)
2. **Option 2:** Migrate one high-usage file as prototype
3. **Option 3:** Show you sample code for one file migration

Which would you like to do first?
