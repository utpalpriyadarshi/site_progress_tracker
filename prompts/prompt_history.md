PLEASE BE SPECIFIC TO CONSTRUCTION INDUSTRY:
- Use construction terminology (Gantt charts, progress tracking, material shortages)
- Consider site supervisors working offline at remote locations
- Include role-specific workflows for construction teams

Prompt 1: Folder Structure

Generate a React Native folder structure for a construction management app with:
- Role-based screen organization (auth/, supervisor/, manager/, planning/)
- Construction-specific component categories
- Offline-first service architecture
- WatermelonDB database setup for construction data

Prompt 2: Navigation Structure

Create a navigation structure for construction management app with:
- Role-based navigators (SupervisorNavigator, ManagerNavigator, PlanningNavigator)
- Authentication flow with role selection
- Tab navigation for role-specific workflows
- Construction-specific screen relationships

Prompt 3: Database Models

Design WatermelonDB models for construction management:
- Project, Site, Category, Item, ProgressLog, Hindrance, Material
- Relationships between construction entities
- Offline sync considerations for site supervisors

PROMPT 4:

Please set up the complete WatermelonDB database for our construction management app with the following models and relationships:

REQUIRED MODELS:
1. Project → has many → Sites
2. Site → has many → Items, belongs to → Project  
3. Category → has many → Items
4. Item → has many → ProgressLogs, belongs to → Site and Category
5. ProgressLog → belongs to → Item, recorded by → User
6. Hindrance → belongs to → Item/Site, assigned to → User
7. Material → belongs to → Item, managed by → Procurement

CONSTRUCTION-SPECIFIC FIELDS:
- Projects: name, client, start_date, end_date, status, budget
- Sites: name, location, project_id, supervisor_id
- Items: name, category_id, site_id, planned_quantity, completed_quantity, unit_of_measurement, planned_start_date, planned_end_date, status, weightage
- ProgressLog: item_id, date, completed_quantity, reported_by, photos[], notes, sync_status
- Hindrance: title, description, item_id, priority, status, assigned_to, reported_by

Please:
1. Update all model files in models/ folder with proper WatermelonDB decorators
2. Update database.ts with all model registrations
3. Create proper migrations for initial setup
4. Ensure offline-sync ready architecture

Return the complete code for each file.

PROMPT:5

Now that our database is set up, let's build the first critical screen: Supervisor Daily Progress Reporting.

PLEASE CREATE: src/supervisor/DailyReportsScreen.tsx

REQUIREMENTS:
1. Show a list of assigned Sites and Items for the supervisor
2. For each Item, show: name, planned quantity, completed quantity, progress percentage
3. Allow updating completed quantity with a simple +1/-1 or input field
4. Add offline capability - updates should work without internet
5. Show sync status (online/offline/syncing)
6. Use React Native Paper components for UI
7. Include a "Submit Progress" button that works offline

TECH REQUIREMENTS:
- Use WatermelonDB models we just created (Item, ProgressLog)
- Implement offline-first pattern
- Use React Native Paper for UI components
- Follow the existing code style in the project

Please provide the complete DailyReportsScreen.tsx code with proper TypeScript types and offline functionality.







Claude analysis

● Based on my analysis of the supervisor functionality, here
  are my recommendations for what to implement next:

  Immediate Priorities for Supervisor Features

  1. Site Inspection Screen (Currently Placeholder)

  Priority: HIGH - Core supervisor responsibility
  - Photo capture for site conditions
  - Inspection checklist (safety, quality, progress)
  - Issue/hindrance reporting with severity levels
  - GPS location tagging
  - Link inspections to specific sites and items

  2. Enhanced Material Tracking

  Priority: HIGH - Currently static UI
  - Connect to WatermelonDB materials collection
  - Real-time material usage updates
  - Material request/order workflow
  - Shortage alerts and notifications
  - Filter by site and item
  - Track deliveries and receipts

  3. Hindrance Management

  Priority: MEDIUM - Data exists but no UI
  - View/create/update hindrances
  - Link to specific items or sites
  - Priority management (low/medium/high)
  - Status tracking (open/in_progress/resolved/closed)
  - Photo documentation
  - Assignment to team members

  4. Daily Reports Enhancements

  Priority: MEDIUM - Build on existing implementation
  - Photo upload for progress logs
  - Filter items by status/date range
  - View progress history for items
  - Export daily summary reports
  - Better offline indicator with pending sync count
  - Bulk update multiple items

  5. Site Overview Dashboard

  Priority: LOW - Nice to have
  - Overall site progress summary
  - Today's tasks and priorities
  - Material shortages at a glance
  - Recent hindrances
  - Weather integration
  - Team attendance tracking

  6. Fix Sync Service

  Priority: MEDIUM - Currently broken
  - Update SyncService to use current schema (items, sites,       
  progress_logs vs old tasks, progress_reports)
  - Implement actual API integration
  - Handle conflict resolution
  - Retry logic for failed syncs
  - Sync status indicators per record

  Recommended Implementation Order:
  1. Site Inspection Screen - Most critical missing feature       
  2. Material Tracking (DB integration) - Completes the
  existing placeholder
  3. Hindrance Management - Data exists, just needs UI
  4. Daily Reports Photos - Natural enhancement to working        
  feature
  5. Sync Service Fixes - Enable actual online/offline sync       

  Would you like me to implement any of these features? I'd       
  recommend starting with the Site Inspection Screen as it's a    
   core supervisor responsibility and would provide the most      
  value.

> While your suggestions are welcome but to get more 
flexibility what is your suggestion on selection of diffrent      
sites as the same supervisor may be working on various sites      
and different itemas accordingly. if ok suggest 

● Excellent point! You're absolutely right - a supervisor
  typically manages multiple sites, and the current
  implementation has a critical limitation: it's hardcoded to     
  only show sites for supervisor-1 with no way to switch
  between them.

  Proposed Multi-Site Selection Feature

  Current Problem:

  - DailyReportsScreen.tsx:447 has hardcoded query:
  Q.where('supervisor_id', 'supervisor-1')
  - No way to filter or switch between different sites
  - All items from all supervisor's sites are mixed together      
  - No site context awareness

  Recommended Solution:

  1. Add Site Selector Component

  Location: Create src/supervisor/components/SiteSelector.tsx     
  - Dropdown/picker to select active site
  - "All Sites" option to view everything
  - Persist selected site in React state or AsyncStorage
  - Display site location and basic info

  2. Update Daily Reports Screen

  Changes to: src/supervisor/DailyReportsScreen.tsx
  - Add site filter state
  - Modify observables to filter by selected site
  - Show site selector at top of screen
  - Filter items based on selected site

  // Pseudocode example:
  const [selectedSiteId, setSelectedSiteId] = useState<string     
  | 'all'>('all');

  // Update observables:
  items: selectedSiteId === 'all'
    ? database.collections.get('items').query()
    :
  database.collections.get('items').query(Q.where('site_id',      
  selectedSiteId))

  3. Site Context Provider (Optional but Recommended)

  Location: src/supervisor/context/SiteContext.tsx
  - Global site selection context
  - Share selected site across all supervisor screens
  - Persist selection across app restarts
  - Switch sites from any screen

  4. Enhanced Material Tracking

  - Filter materials by selected site/items
  - Show materials only relevant to current site

  5. Site Inspection Screen

  - Pre-select the active site for inspection
  - Option to switch sites within inspection flow

  Implementation Approach:

  Option A: Simple (Recommended for MVP)
  - Add site picker dropdown to each screen
  - Local state management per screen
  - Quick to implement

  Option B: Advanced (Better UX)
  - Site context provider for global state
  - Persistent storage with AsyncStorage
  - Site badge in navigation header
  - Quick site switcher in tab navigator

  Option C: Multi-Site Dashboard (Most Comprehensive)
  - Landing screen showing all supervisor's sites as cards        
  - Tap site to drill into site-specific views
  - Site-level metrics and alerts
  - Navigate back to switch sites

  My Recommendation:

  Start with Option B (Site Context Provider) because:
  1. ✅ Works across all supervisor screens
  2. ✅ Single source of truth for selected site
  3. ✅ Persists user preference
  4. ✅ Easy to add site badge to header
  5. ✅ Foundation for future features (push notifications per    
   site, etc.)

  Implementation Steps:
  1. Create SiteContext provider
  2. Add site selector UI component
  3. Update DailyReportsScreen with site filtering
  4. Update MaterialTrackingScreen similarly
  5. Add site info to navigation header
  6. Persist selection in AsyncStorage

  Would you like me to implement the Site Context Provider        
  with Site Selector feature? This would give supervisors the     
  flexibility to:
  - View all sites or filter to specific one
  - Switch sites easily from any screen
  - See which site they're currently managing
  - Have their selection persist across app sessions

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


Prompt: 6

I’m extending my existing React Native app called Construction Site Progress Tracker, which already has offline-first architecture using WatermelonDB, role-based navigation (Supervisor, Manager, Planner, Logistics), and entity models such as Projects, Sites, Items, and DailyReports.

I need to implement an Admin role with the following features:

1. Role Overview

Admin is a user type who can switch between roles (Supervisor, Manager, Planner, Logistic) using a dropdown selector or toggle button at the top of the main admin page.

When switched, the admin should see the same UI and functionality as the selected role (reuse existing navigators).

Admin mode should clearly display the active role context.

2. CRUD Administration

Create a dedicated AdminDashboardScreen accessible only to Admin users.

Admin should be able to:

Manage Projects (Create, Read, Update, Delete)

Manage Roles (Create, Assign, Update, Delete)

Assign roles to users

Implement CRUD using WatermelonDB (local-first) — updates should work offline and sync when online.

Use database.write() transactions for create/update/delete.

3. UI/UX Requirements

Use React Navigation to add a new AdminNavigator with:

AdminDashboardScreen (overview + role switcher)

ProjectManagementScreen

RoleManagementScreen

Use React Native Paper (or your preferred component library) for UI consistency.

Add a Floating Action Button (FAB) for adding new records (projects or roles).

Each management screen should include:

A searchable list

Modal forms for create/edit

Swipe-to-delete or context menu for delete

4. Role Switching

Maintain selected role context using React Context or Redux.

When the admin switches roles, update the global role state and render the corresponding role navigator (SupervisorNavigator, ManagerNavigator, etc.).

Persist the last selected role using AsyncStorage.

5. Code & Architecture Expectations

Modify existing MainNavigator to include the AdminNavigator.

Add new WatermelonDB models and schemas if needed (e.g., roles or users_roles table).

Ensure consistency with your naming convention:

snake_case for schema fields

camelCase for model properties

Include TypeScript types for new entities (e.g., Role, UserRole, Project).

6. Output Expected

Please generate:

AdminNavigator.tsx

AdminDashboardScreen.tsx

ProjectManagementScreen.tsx

RoleManagementScreen.tsx

Example code showing role switching logic using Context API

Example WatermelonDB model for roles

Optional

Include offline sync placeholders for admin CRUD changes.

Use mock data for users and projects if real sync isn’t implemented yet.

Goal: A fully functional Admin interface that integrates cleanly into the existing architecture — reuses navigators, adheres to WatermelonDB best practices, and lets Admin manage both projects and roles with CRUD, while being able to switch into any role context seamlessly.