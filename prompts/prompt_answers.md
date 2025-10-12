5. Key Challenges & Decisions

  Challenge 1: User Management
  - The current app uses simple test credentials (supervisor/supervisor123)
  - Do you want to build a full user management system, or continue with
  predefined users? - full user management system
  - Should we create a mock user system for now? - yes

  Challenge 2: Role Assignment Scope
  - Should roles be assigned per-project or globally?-Globally
  - Can a user have multiple roles simultaneously?-No
  - How do we handle the existing auth system? - suggest and implement best

  Challenge 3: Project Relationships
  - Projects already exist in schema
  - Sites belong to Projects
  - Should Admin be able to delete Projects with existing Sites?-yes
  - Cascade delete or prevent deletion?-cascade delete

  Challenge 4: Navigation Reuse
  - When Admin switches to "Supervisor" role, should they see ALL sites or only     
  sites they're "acting as supervisor" for?-all sites
  - Should we filter data based on the simulated role context?-no

  Proposed Implementation Plan

  I can implement this in phases:

  Phase 1: Database Foundation

  1. Create new schema (v9) with roles, users, user_roles tables
  2. Create corresponding WatermelonDB models
  3. Create migration file
  4. Seed default roles and users

  Phase 2: Admin Navigation

  1. Create AdminNavigator
  2. Create AdminDashboardScreen with role switcher UI
  3. Implement AdminContext for role state management
  4. Integrate with MainNavigator

  Phase 3: Project Management

  1. Create ProjectManagementScreen with CRUD
  2. Implement searchable list with Paper components
  3. Add modal forms for create/edit
  4. Handle delete with cascade considerations

  Phase 4: Role Management

  1. Create RoleManagementScreen
  2. Implement user-role assignment UI
  3. Add CRUD for roles
  4. Handle assignment persistence

  Phase 5: Role Switching Logic

  1. Implement role context switching
  2. Dynamically render role navigators
  3. Persist selected role
  4. Handle data filtering (if needed)

  Questions Before Implementation

  Before I start coding, I'd like to clarify:

  1. User System: Should I create a basic user management system, or use mock       
  data with the existing test credentials?-use mock       
  data with the existing test credentials
  2. Role Scope: Should users be able to have multiple roles at once, or one        
  role per user?-no
  3. Data Filtering: When Admin switches to "Supervisor" role, should they see:     
    - ALL data (full admin access)-yes
    - Only data relevant to that role (simulated role experience)
  4. Project Deletion: Should we allow deleting Projects that have Sites? If        
  yes, cascade delete or prevent?-cascade
  5. Priority: Would you like me to implement all phases, or start with a
  specific phase for review? - all phases in sequential steps. start with phase 1 and so on

  Please let me know your preferences, and I'll proceed with the implementation!    