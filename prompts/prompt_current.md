Enhance the Supervisor Daily Reports Screen to:

1. Show a SITE SELECTOR dropdown at the top
2. Allow supervisor to switch between multiple assigned sites
3. When site changes, show only items for that selected site
4. Use our WatermelonDB SiteModel to fetch all sites assigned to current user

Keep it simple - just site switching functionality.

Create a new screen: src/supervisor/ItemsManagementScreen.tsx

Functionality:
1. List all items for selected site
2. Add new items (name, planned quantity, unit of measurement)
3. Edit existing items
4. Delete items (with confirmation)
5. All operations should work offline

Use WatermelonDB ItemModel for CRUD operations.

Create src/supervisor/MaterialTrackingScreen.tsx

Functionality:
1. List materials needed for current site
2. Show required vs available quantities
3. Flag material shortages
4. Update material usage/consumption

Use WatermelonDB MaterialModel.

Create src/supervisor/SiteInspectionScreen.tsx

Functionality:
1. Record site inspections with photos
2. Add inspection notes and ratings
3. Flag safety issues
4. Schedule follow-up inspections

Create src/supervisor/HindranceReportScreen.tsx

Functionality:
1. Report new hindrances/issues
2. Add photos and descriptions
3. Set priority levels
4. Track hindrance status
5. Offline capability

Use WatermelonDB HindranceModel.