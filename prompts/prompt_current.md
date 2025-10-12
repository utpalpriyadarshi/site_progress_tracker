Prompt:

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