# Admin Phase 2: Implementation Plan

**Project:** Site Progress Tracker
**Phase:** Phase 2 - Important Improvements
**Role:** Admin
**Total Estimated Time:** 24-30 hours
**Created:** 2026-01-08

---

## Table of Contents

1. [Overview](#overview)
2. [Current State Analysis](#current-state-analysis)
3. [Task 2.1: Refactor State Management](#task-21-refactor-state-management)
4. [Task 2.2: Create Shared Components](#task-22-create-shared-components)
5. [Task 2.3: Add Loading Skeletons](#task-23-add-loading-skeletons)
6. [Implementation Timeline](#implementation-timeline)
7. [Success Metrics](#success-metrics)
8. [Testing Strategy](#testing-strategy)
9. [Quality Checklist](#quality-checklist)
10. [References](#references)

---

## Overview

This document provides a comprehensive implementation plan for Admin Phase 2, covering all 3 tasks: State Management Refactor, Shared Components, and Loading Skeletons.

### Why Admin Phase 2 Matters

**Admin Role** manages 4 screens with critical system functionality:
- User and role management
- Project administration
- System dashboard
- Sync monitoring

**Current Pain Points:**
- 25+ useState hooks across hooks files
- useUserForm has 7 useState hooks (form, dialogs, menus)
- useProjectForm has similar complexity
- No shared components for admin UI patterns
- Loading states use generic spinners
- Potential for state synchronization issues

**Phase 2 Goals:**
1. Reduce state complexity by 80-90% in top 3 hooks
2. Create 4 reusable admin-specific shared components
3. Add professional loading skeletons to 3 key screens
4. Improve code maintainability and consistency

---

## Current State Analysis

### Admin Screens Overview (4 total)

| Screen | useState Count | Complexity | Phase 1 Status | Phase 2 Priority |
|--------|---------------|------------|----------------|------------------|
| RoleManagementScreen | ~7 (in useUserForm) | High | ✅ Refactored | 🎯 **#1 for Task 2.1** |
| ProjectManagementScreen | ~6 (in useProjectForm) | High | ✅ Refactored | 🎯 **#2 for Task 2.1** |
| AdminDashboardScreen | ~10 (across hooks) | High | ✅ Refactored | 🎯 **#3 for Task 2.1** |
| SyncMonitoringScreen | ~2-3 | Low | ❌ Not Refactored | ⏳ Phase 3 |

**Total:** ~25 useState hooks across Admin role

**Phase 1 Progress:** 3 screens refactored (Role Management, Project Management, Admin Dashboard)

**Phase 2 Target:** Top 3 screens with complex state management

---

## Task 2.1: Refactor State Management

**Estimated Time:** 12-15 hours
**Priority:** High
**Complexity:** High

### Objective

Convert the top 3 most complex Admin hooks from multiple `useState` to centralized `useReducer` pattern, following the established Manager and Logistics role patterns.

### Target Screens

#### 1. RoleManagementScreen - useUserForm (7 useState → 1 useReducer)

**Current State (7 useState):**
```typescript
const [modalVisible, setModalVisible] = useState(false);
const [editingUser, setEditingUser] = useState<UserModel | null>(null);
const [roleMenuVisible, setRoleMenuVisible] = useState(false);
const [projectMenuVisible, setProjectMenuVisible] = useState(false);
const [showDeleteDialog, setShowDeleteDialog] = useState(false);
const [userToDelete, setUserToDelete] = useState<UserModel | null>(null);
const [formData, setFormData] = useState<UserFormData>({
  username: '',
  password: '',
  fullName: '',
  email: '',
  phone: '',
  roleId: '',
  projectId: '',
  isActive: true,
});
```

**Target State (1 useReducer):**
```typescript
interface UserManagementState {
  ui: {
    modalVisible: boolean;
    roleMenuVisible: boolean;
    projectMenuVisible: boolean;
    showDeleteDialog: boolean;
  };
  data: {
    editingUser: UserModel | null;
    userToDelete: UserModel | null;
  };
  form: {
    username: string;
    password: string;
    fullName: string;
    email: string;
    phone: string;
    roleId: string;
    projectId: string;
    isActive: boolean;
  };
}

const [state, dispatch] = useReducer(userManagementReducer, initialState);
```

**Reduction:** 7 useState → 1 useReducer (**86% reduction!**)

**Actions:**
```typescript
type UserManagementAction =
  | { type: 'OPEN_CREATE_MODAL'; payload: { defaultRoleId: string } }
  | { type: 'OPEN_EDIT_MODAL'; payload: { user: UserModel } }
  | { type: 'CLOSE_MODAL' }
  | { type: 'UPDATE_FORM_FIELD'; payload: { field: string; value: any } }
  | { type: 'UPDATE_FORM_DATA'; payload: Partial<UserFormData> }
  | { type: 'TOGGLE_ROLE_MENU' }
  | { type: 'TOGGLE_PROJECT_MENU' }
  | { type: 'OPEN_DELETE_DIALOG'; payload: { user: UserModel } }
  | { type: 'CLOSE_DELETE_DIALOG' }
  | { type: 'RESET_FORM'; payload: { defaultRoleId: string } };
```

---

#### 2. ProjectManagementScreen - useProjectForm (6 useState → 1 useReducer)

**Current State (6 useState):**
```typescript
const [modalVisible, setModalVisible] = useState(false);
const [editingProject, setEditingProject] = useState<ProjectModel | null>(null);
const [showDeleteDialog, setShowDeleteDialog] = useState(false);
const [projectToDelete, setProjectToDelete] = useState<ProjectModel | null>(null);
const [showDatePicker, setShowDatePicker] = useState<'start' | 'end' | null>(null);
const [formData, setFormData] = useState<ProjectFormData>({
  name: '',
  code: '',
  startDate: new Date(),
  endDate: new Date(),
  budget: '',
  description: '',
  status: 'active',
});
```

**Target State (1 useReducer):**
```typescript
interface ProjectManagementState {
  ui: {
    modalVisible: boolean;
    showDeleteDialog: boolean;
    showDatePicker: 'start' | 'end' | null;
  };
  data: {
    editingProject: ProjectModel | null;
    projectToDelete: ProjectModel | null;
  };
  form: {
    name: string;
    code: string;
    startDate: Date;
    endDate: Date;
    budget: string;
    description: string;
    status: 'active' | 'completed' | 'on-hold';
  };
}

const [state, dispatch] = useReducer(projectManagementReducer, initialState);
```

**Reduction:** 6 useState → 1 useReducer (**83% reduction!**)

**Actions:**
```typescript
type ProjectManagementAction =
  | { type: 'OPEN_CREATE_MODAL' }
  | { type: 'OPEN_EDIT_MODAL'; payload: { project: ProjectModel } }
  | { type: 'CLOSE_MODAL' }
  | { type: 'UPDATE_FORM_FIELD'; payload: { field: string; value: any } }
  | { type: 'UPDATE_FORM_DATA'; payload: Partial<ProjectFormData> }
  | { type: 'SHOW_DATE_PICKER'; payload: { picker: 'start' | 'end' } }
  | { type: 'HIDE_DATE_PICKER' }
  | { type: 'OPEN_DELETE_DIALOG'; payload: { project: ProjectModel } }
  | { type: 'CLOSE_DELETE_DIALOG' }
  | { type: 'RESET_FORM' };
```

---

#### 3. AdminDashboardScreen - Multiple hooks (10 useState → 1 useReducer)

**Current State (10 useState across hooks):**
```typescript
// useDashboardStats
const [stats, setStats] = useState<DashboardStats>({
  totalUsers: 0,
  activeUsers: 0,
  totalProjects: 0,
  activeProjects: 0,
});
const [loading, setLoading] = useState(true);

// useRoleSwitcher
const [selectedRole, setSelectedRole] = useState<AdminRole | null>(null);
const [switchDialogVisible, setSwitchDialogVisible] = useState(false);

// usePasswordMigration
const [migrating, setMigrating] = useState(false);
const [migrationProgress, setMigrationProgress] = useState({ current: 0, total: 0 });

// useCategoryMigration
const [categoryMigrating, setCategoryMigrating] = useState(false);

// useDatabaseReset
const [resetDialogVisible, setResetDialogVisible] = useState(false);
const [resetting, setResetting] = useState(false);
```

**Target State (1 useReducer):**
```typescript
interface AdminDashboardState {
  ui: {
    loading: boolean;
    switchDialogVisible: boolean;
    resetDialogVisible: boolean;
  };
  stats: {
    totalUsers: number;
    activeUsers: number;
    totalProjects: number;
    activeProjects: number;
  };
  roleSwitcher: {
    selectedRole: AdminRole | null;
  };
  migrations: {
    passwordMigration: {
      inProgress: boolean;
      current: number;
      total: number;
    };
    categoryMigration: {
      inProgress: boolean;
    };
    databaseReset: {
      inProgress: boolean;
    };
  };
}

const [state, dispatch] = useReducer(adminDashboardReducer, initialState);
```

**Reduction:** 10 useState → 1 useReducer (**90% reduction!**)

**Actions:**
```typescript
type AdminDashboardAction =
  | { type: 'LOAD_STATS_START' }
  | { type: 'LOAD_STATS_SUCCESS'; payload: { stats: DashboardStats } }
  | { type: 'LOAD_STATS_ERROR' }
  | { type: 'OPEN_ROLE_SWITCHER'; payload: { role: AdminRole } }
  | { type: 'CLOSE_ROLE_SWITCHER' }
  | { type: 'START_PASSWORD_MIGRATION'; payload: { total: number } }
  | { type: 'UPDATE_PASSWORD_MIGRATION_PROGRESS'; payload: { current: number } }
  | { type: 'COMPLETE_PASSWORD_MIGRATION' }
  | { type: 'START_CATEGORY_MIGRATION' }
  | { type: 'COMPLETE_CATEGORY_MIGRATION' }
  | { type: 'OPEN_RESET_DIALOG' }
  | { type: 'CLOSE_RESET_DIALOG' }
  | { type: 'START_DATABASE_RESET' }
  | { type: 'COMPLETE_DATABASE_RESET' };
```

---

### Implementation Structure

```
src/admin/state/
├── user-management/
│   ├── userManagementReducer.ts    # RoleManagementScreen reducer
│   ├── userManagementActions.ts    # Action creators
│   └── index.ts
├── project-management/
│   ├── projectManagementReducer.ts # ProjectManagementScreen reducer
│   ├── projectManagementActions.ts # Action creators
│   └── index.ts
├── dashboard/
│   ├── adminDashboardReducer.ts    # AdminDashboardScreen reducer
│   ├── adminDashboardActions.ts    # Action creators
│   └── index.ts
└── index.ts                         # Barrel exports
```

### Implementation Steps (Task 2.1)

**Phase 1:** useUserForm Refactor (4-5 hours)
1. Create userManagementReducer and actions
2. Refactor useUserForm hook to use useReducer
3. Update RoleManagementScreen
4. Test all CRUD operations, dialogs, form validation
5. Validate TypeScript 0 errors

**Phase 2:** useProjectForm Refactor (4-5 hours)
1. Create projectManagementReducer and actions
2. Refactor useProjectForm hook to use useReducer
3. Update ProjectManagementScreen
4. Test project CRUD, date pickers, cascade delete
5. Validate TypeScript 0 errors

**Phase 3:** Dashboard hooks consolidation (4-5 hours)
1. Create adminDashboardReducer and actions
2. Consolidate all dashboard hooks state
3. Update AdminDashboardScreen and all hooks
4. Test stats loading, role switching, migrations, reset
5. Validate TypeScript 0 errors

**Total Task 2.1 Time:** 12-15 hours

---

## Task 2.2: Create Shared Components

**Estimated Time:** 7-10 hours
**Priority:** High
**Complexity:** Medium

### Objective

Create 4 reusable shared components to reduce code duplication and establish consistent UI patterns across Admin screens.

### Component Specifications

#### 1. UserRoleCard (120-150 LOC)

**Purpose:** Display user information with role badge and status

**Props:**
```typescript
interface UserRoleCardProps {
  user: UserModel;
  role?: RoleModel;
  project?: ProjectModel;
  onPress?: (user: UserModel) => void;
  onEdit?: (user: UserModel) => void;
  onDelete?: (user: UserModel) => void;
  onToggleStatus?: (user: UserModel) => void;
  onResetPassword?: (user: UserModel) => void;
  showActions?: boolean;
  variant?: 'default' | 'compact' | 'detailed';
}

interface UserModel {
  id: string;
  username: string;
  fullName: string;
  email: string;
  phone: string;
  roleId: string;
  projectId?: string;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}
```

**Features:**
- User avatar/initials
- Role badge with color coding
- Status indicator (active/inactive)
- Project assignment display
- Contact information (email, phone)
- Action buttons (Edit, Delete, Reset Password, Toggle Status)
- Compact/detailed variants
- Last updated timestamp

**Usage:**
```typescript
<UserRoleCard
  user={user}
  role={role}
  project={project}
  onEdit={handleEdit}
  onDelete={handleDelete}
  onToggleStatus={handleToggleStatus}
  onResetPassword={handleResetPassword}
  showActions
  variant="detailed"
/>
```

---

#### 2. PermissionEditor (180-220 LOC)

**Purpose:** Visual editor for role permissions management

**Props:**
```typescript
interface PermissionEditorProps {
  roleId: string;
  permissions: Permission[];
  onPermissionChange: (permissions: Permission[]) => void;
  readOnly?: boolean;
  groupBy?: 'category' | 'module';
  showDescription?: boolean;
}

interface Permission {
  id: string;
  name: string;
  category: 'admin' | 'manager' | 'logistics' | 'commercial' | 'planning' | 'design';
  module: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'execute';
  description?: string;
  enabled: boolean;
}
```

**Features:**
- Grouped permissions display (by category or module)
- Toggle switches for each permission
- Select all/none per group
- Permission description tooltips
- Visual hierarchy (category → module → permissions)
- Read-only mode
- Validation warnings
- Dirty state indicator

**Usage:**
```typescript
<PermissionEditor
  roleId={role.id}
  permissions={rolePermissions}
  onPermissionChange={handlePermissionsUpdate}
  groupBy="category"
  showDescription
/>
```

---

#### 3. ProjectCard (140-170 LOC)

**Purpose:** Display project information with status and metrics

**Props:**
```typescript
interface ProjectCardProps {
  project: ProjectModel;
  onPress?: (project: ProjectModel) => void;
  onEdit?: (project: ProjectModel) => void;
  onDelete?: (project: ProjectModel) => void;
  showMetrics?: boolean;
  showActions?: boolean;
  variant?: 'default' | 'compact';
}

interface ProjectModel {
  id: string;
  name: string;
  code: string;
  description: string;
  startDate: number;
  endDate: number;
  budget: number;
  status: 'active' | 'completed' | 'on-hold';
  createdAt: number;
  updatedAt: number;
}

interface ProjectMetrics {
  totalUsers: number;
  totalItems: number;
  completionPercentage: number;
  daysRemaining: number;
}
```

**Features:**
- Project header with code and name
- Status badge (active/completed/on-hold)
- Date range display with progress bar
- Budget display
- Project metrics (optional)
- Action buttons (Edit, Delete)
- Compact variant for lists
- Color-coded status indicators
- Overdue warning

**Usage:**
```typescript
<ProjectCard
  project={project}
  onEdit={handleEdit}
  onDelete={handleDelete}
  showMetrics
  showActions
  variant="default"
/>
```

---

#### 4. SyncStatusPanel (150-180 LOC)

**Purpose:** Display sync status and monitoring information

**Props:**
```typescript
interface SyncStatusPanelProps {
  syncStatus: SyncStatus;
  onSync?: () => void;
  onViewLogs?: () => void;
  showDetails?: boolean;
  variant?: 'compact' | 'detailed';
}

interface SyncStatus {
  isOnline: boolean;
  lastSyncTime: number;
  syncInProgress: boolean;
  pendingChanges: number;
  syncErrors: number;
  nextSyncTime?: number;
}

interface SyncDetails {
  uploadedRecords: number;
  downloadedRecords: number;
  conflictsResolved: number;
  failedRecords: number;
  syncDuration: number;
}
```

**Features:**
- Online/offline status indicator
- Last sync time with relative display
- Sync progress bar (if in progress)
- Pending changes count
- Error count with warnings
- Manual sync button
- View logs button
- Next scheduled sync time
- Detailed sync statistics (optional)
- Auto-refresh status

**Usage:**
```typescript
<SyncStatusPanel
  syncStatus={currentSyncStatus}
  onSync={handleManualSync}
  onViewLogs={handleViewLogs}
  showDetails
  variant="detailed"
/>
```

---

### Component Directory Structure

```
src/admin/shared/
├── components/
│   ├── UserRoleCard.tsx
│   ├── PermissionEditor.tsx
│   ├── ProjectCard.tsx
│   ├── SyncStatusPanel.tsx
│   └── index.ts
├── types/
│   ├── user.ts
│   ├── permission.ts
│   ├── project.ts
│   ├── sync.ts
│   └── index.ts
└── index.ts
```

### Implementation Steps (Task 2.2)

**Phase 1:** UserRoleCard & PermissionEditor (4-5 hours)
1. Create type files for user and permissions
2. Implement UserRoleCard with all variants
3. Implement PermissionEditor with grouping logic
4. Add JSDoc documentation with examples
5. Export via barrel

**Phase 2:** ProjectCard & SyncStatusPanel (3-5 hours)
1. Create type files for project and sync
2. Implement ProjectCard with metrics calculation
3. Implement SyncStatusPanel with auto-refresh
4. Add JSDoc documentation
5. Complete barrel exports

**Total Task 2.2 Time:** 7-10 hours

---

## Task 2.3: Add Loading Skeletons

**Estimated Time:** 5 hours
**Priority:** Medium
**Complexity:** Medium

### Objective

Create 3 specialized loading skeletons for key Admin screens to improve perceived performance during data loading.

### Skeleton Specifications

#### 1. RoleManagementSkeleton (120-150 LOC)

**Purpose:** Loading skeleton for RoleManagementScreen

**Structure:**
```typescript
interface RoleManagementSkeletonProps {
  count?: number;
  style?: ViewStyle;
}

/**
 * RoleManagementSkeleton Component
 *
 * Loading skeleton for Role Management Screen.
 * Shows placeholders for search, filters, and user cards.
 */
export const RoleManagementSkeleton: React.FC<RoleManagementSkeletonProps> = ({
  count = 6,
  style
}) => {
  return (
    <ScrollView style={[styles.container, style]}>
      {/* Search Bar */}
      <Skeleton width="100%" height={56} borderRadius={4} marginBottom={16} />

      {/* Filter Chips */}
      <View style={styles.filterRow}>
        <Skeleton width={80} height={32} borderRadius={16} marginRight={8} />
        <Skeleton width={100} height={32} borderRadius={16} marginRight={8} />
        <Skeleton width={90} height={32} borderRadius={16} />
      </View>

      {/* User Cards */}
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={styles.userCard}>
          {/* Avatar */}
          <Skeleton width={56} height={56} borderRadius={28} marginRight={12} />

          <View style={styles.cardContent}>
            {/* Name */}
            <Skeleton width="60%" height={18} marginBottom={6} />
            {/* Email */}
            <Skeleton width="80%" height={14} marginBottom={6} />
            {/* Role Badge */}
            <Skeleton width="40%" height={24} borderRadius={12} />
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <Skeleton width={32} height={32} borderRadius={16} marginBottom={8} />
            <Skeleton width={32} height={32} borderRadius={16} />
          </View>
        </View>
      ))}
    </ScrollView>
  );
};
```

---

#### 2. ProjectManagementSkeleton (100-130 LOC)

**Purpose:** Loading skeleton for ProjectManagementScreen

**Structure:**
```typescript
interface ProjectManagementSkeletonProps {
  count?: number;
  style?: ViewStyle;
}

/**
 * ProjectManagementSkeleton Component
 *
 * Loading skeleton for Project Management Screen.
 * Shows placeholders for project cards.
 */
export const ProjectManagementSkeleton: React.FC<ProjectManagementSkeletonProps> = ({
  count = 4,
  style
}) => {
  return (
    <ScrollView style={[styles.container, style]}>
      {/* Header */}
      <View style={styles.header}>
        <Skeleton width="50%" height={28} marginBottom={8} />
        <Skeleton width="70%" height={16} />
      </View>

      {/* Project Cards */}
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={styles.projectCard}>
          {/* Project Header */}
          <View style={styles.projectHeader}>
            <View>
              <Skeleton width={100} height={20} marginBottom={4} />
              <Skeleton width={150} height={16} />
            </View>
            <Skeleton width={80} height={28} borderRadius={14} />
          </View>

          {/* Project Details */}
          <View style={styles.projectDetails}>
            <Skeleton width="100%" height={14} marginBottom={4} />
            <Skeleton width="80%" height={14} marginBottom={8} />
          </View>

          {/* Metrics */}
          <View style={styles.metricsRow}>
            <View style={styles.metric}>
              <Skeleton width={60} height={12} marginBottom={4} />
              <Skeleton width={40} height={20} />
            </View>
            <View style={styles.metric}>
              <Skeleton width={60} height={12} marginBottom={4} />
              <Skeleton width={40} height={20} />
            </View>
            <View style={styles.metric}>
              <Skeleton width={60} height={12} marginBottom={4} />
              <Skeleton width={40} height={20} />
            </View>
          </View>

          {/* Progress Bar */}
          <Skeleton width="100%" height={8} borderRadius={4} marginTop={8} />
        </View>
      ))}
    </ScrollView>
  );
};
```

---

#### 3. AdminDashboardSkeleton (110-140 LOC)

**Purpose:** Loading skeleton for AdminDashboardScreen

**Structure:**
```typescript
interface AdminDashboardSkeletonProps {
  style?: ViewStyle;
}

/**
 * AdminDashboardSkeleton Component
 *
 * Loading skeleton for Admin Dashboard Screen.
 * Shows placeholders for stats, actions, and status panels.
 */
export const AdminDashboardSkeleton: React.FC<AdminDashboardSkeletonProps> = ({ style }) => {
  return (
    <ScrollView style={[styles.container, style]}>
      {/* Header */}
      <Skeleton width="60%" height={28} marginBottom={24} />

      {/* Stats Cards */}
      <View style={styles.statsRow}>
        {[1, 2, 3, 4].map(i => (
          <View key={i} style={styles.statCard}>
            <Skeleton width="50%" height={14} marginBottom={8} />
            <Skeleton width="70%" height={32} marginBottom={4} />
            <Skeleton width="40%" height={12} />
          </View>
        ))}
      </View>

      {/* Role Switcher */}
      <View style={styles.section}>
        <Skeleton width="40%" height={20} marginBottom={12} />
        <View style={styles.roleGrid}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} width={100} height={80} borderRadius={8} margin={4} />
          ))}
        </View>
      </View>

      {/* Management Cards */}
      <View style={styles.section}>
        <Skeleton width="50%" height={20} marginBottom={12} />
        {[1, 2].map(i => (
          <View key={i} style={styles.managementCard}>
            <Skeleton width="60%" height={18} marginBottom={8} />
            <Skeleton width="100%" height={14} marginBottom={12} />
            <Skeleton width="30%" height={36} borderRadius={4} />
          </View>
        ))}
      </View>

      {/* Sync Status */}
      <View style={styles.section}>
        <Skeleton width="40%" height={20} marginBottom={12} />
        <View style={styles.syncPanel}>
          <Skeleton width={40} height={40} borderRadius={20} marginRight={12} />
          <View style={{ flex: 1 }}>
            <Skeleton width="70%" height={16} marginBottom={6} />
            <Skeleton width="50%" height={14} />
          </View>
          <Skeleton width={80} height={36} borderRadius={4} />
        </View>
      </View>
    </ScrollView>
  );
};
```

---

### Skeleton Directory Structure

```
src/admin/shared/skeletons/
├── RoleManagementSkeleton.tsx
├── ProjectManagementSkeleton.tsx
├── AdminDashboardSkeleton.tsx
└── index.ts
```

### Implementation Steps (Task 2.3)

**Phase 1:** Setup & RoleManagementSkeleton (2 hours)
1. Create skeletons directory structure
2. Create barrel exports
3. Implement RoleManagementSkeleton
4. Match RoleManagementScreen layout
5. Test shimmer animation

**Phase 2:** ProjectManagementSkeleton (1.5 hours)
1. Implement ProjectManagementSkeleton
2. Match ProjectManagementScreen layout
3. Test responsiveness

**Phase 3:** AdminDashboardSkeleton (1.5 hours)
1. Implement AdminDashboardSkeleton
2. Match AdminDashboardScreen layout
3. Test all sections

**Phase 4:** Integration & Testing (30 minutes)
1. Integrate into RoleManagementScreen
2. Integrate into ProjectManagementScreen
3. Integrate into AdminDashboardScreen
4. Final validation

**Total Task 2.3 Time:** 5 hours

---

## Implementation Timeline

### Week 1: Task 2.1 - State Management (12-15 hours)

**Days 1-2:** useUserForm Refactor (4-5h)
- Create userManagementReducer and actions
- Refactor hook and screen
- Test and validate

**Days 3-4:** useProjectForm Refactor (4-5h)
- Create projectManagementReducer and actions
- Refactor hook and screen
- Test cascade delete

**Day 5:** Dashboard hooks consolidation (4-5h)
- Create adminDashboardReducer
- Consolidate all hooks
- Final validation

### Week 2: Task 2.2 - Shared Components (7-10 hours)

**Days 1-2:** UserRoleCard & PermissionEditor (4-5h)
- Create components
- Implement features
- Documentation

**Days 3-4:** ProjectCard & SyncStatusPanel (3-5h)
- Create components
- Complete exports
- Final documentation

### Week 3: Task 2.3 - Loading Skeletons (5 hours)

**Day 1:** All 3 skeletons (4h)
- Implement all skeletons
- Match layouts

**Day 2:** Integration (1h)
- Integrate into screens
- Final validation

---

## Success Metrics

### Task 2.1 Success Criteria

- ✅ 3 hooks refactored (useUserForm, useProjectForm, dashboard hooks)
- ✅ useState reduction: 23 → 3 useReducer (**87% reduction**)
- ✅ TypeScript: 0 errors across all refactored files
- ✅ ESLint: 0 errors
- ✅ All existing functionality works identically
- ✅ Improved maintainability (centralized state logic)

### Task 2.2 Success Criteria

- ✅ 4 shared components created
- ✅ Total component LOC: ~590-720
- ✅ All components have TypeScript interfaces
- ✅ JSDoc documentation with examples
- ✅ Reusable across multiple screens
- ✅ Clean barrel exports
- ✅ 0 TypeScript errors
- ✅ 0 ESLint errors

### Task 2.3 Success Criteria

- ✅ 3 loading skeletons created
- ✅ Total skeleton LOC: ~330-420
- ✅ All skeletons integrated into screens
- ✅ Smooth shimmer animation
- ✅ Perceived performance improvement: 40-60%
- ✅ 0 TypeScript errors
- ✅ 0 ESLint errors

---

## Testing Strategy

### Manual Testing Checklist

**Task 2.1: State Management**
- [ ] RoleManagement: User CRUD, form validation, dialogs, password reset
- [ ] ProjectManagement: Project CRUD, date pickers, cascade delete
- [ ] AdminDashboard: Stats loading, role switching, migrations, database reset

**Task 2.2: Shared Components**
- [ ] UserRoleCard: All variants, actions, status toggle
- [ ] PermissionEditor: Permission toggling, grouping, validation
- [ ] ProjectCard: Metrics display, status badges, date calculations
- [ ] SyncStatusPanel: Status updates, manual sync, log viewing

**Task 2.3: Loading Skeletons**
- [ ] RoleManagementSkeleton: Matches real layout, smooth animation
- [ ] ProjectManagementSkeleton: Card layout, responsive design
- [ ] AdminDashboardSkeleton: All sections, proper spacing

### Automated Testing

**TypeScript Validation:**
```bash
npx tsc --noEmit src/admin/**/*.{ts,tsx}
```

**ESLint Validation:**
```bash
npx eslint "src/admin/**/*.{ts,tsx}" --max-warnings 0
```

---

## Quality Checklist

### Code Quality
- [ ] All new files have proper file headers
- [ ] All components have TypeScript interfaces
- [ ] All functions have JSDoc documentation
- [ ] No console.log statements
- [ ] No hardcoded values (use constants)
- [ ] Follows existing code style

### Component Quality
- [ ] All props have default values where appropriate
- [ ] All components handle edge cases
- [ ] All components are accessible
- [ ] All components are performant
- [ ] All components have usage examples

### Testing Quality
- [ ] All manual tests pass
- [ ] TypeScript: 0 errors
- [ ] ESLint: 0 errors
- [ ] No regression issues
- [ ] Performance is improved

### Documentation Quality
- [ ] Implementation plan is complete
- [ ] Usage examples are provided
- [ ] PROGRESS_TRACKING.md is updated
- [ ] Code comments are helpful
- [ ] All exports are documented

---

## References

### Related Documents
- `docs/implementation/LOGISTICS_PHASE2_IMPLEMENTATION_PLAN.md` - useReducer pattern reference
- `docs/implementation/MANAGER_PHASE2_TASK2.1_IMPLEMENTATION_PLAN.md` - State management patterns
- `docs/implementation/MANAGER_PHASE2_TASK2.2_IMPLEMENTATION_PLAN.md` - Shared components pattern
- `docs/implementation/MANAGER_PHASE2_TASK2.3_IMPLEMENTATION_PLAN.md` - Loading skeletons pattern
- `ALL_ROLES_IMPROVEMENTS_ROADMAP.md` - Overall project roadmap

### Existing Patterns to Follow
- Manager state management (useReducer with nested state)
- Logistics state management (batch actions, logical grouping)
- Commercial state management (form state patterns)
- Manager shared components (barrel exports, TypeScript interfaces)
- Manager loading skeletons (base skeleton components, shimmer animation)
- Existing Admin Phase 1 refactors (RoleManagement, ProjectManagement, AdminDashboard)

### Key Files to Reference
- `src/manager/state/` - State management patterns
- `src/logistics/state/` - Reducer patterns with batch actions
- `src/commercial/state/` - Form state patterns
- `src/manager/shared/components/` - Shared component patterns
- `src/logistics/shared/components/` - Component structure examples
- `src/admin/role-management/hooks/useUserForm.ts` - Current state to refactor
- `src/admin/project-management/hooks/useProjectForm.ts` - Current state to refactor
- `src/admin/dashboard/hooks/` - Dashboard hooks to consolidate
- `src/components/skeletons/` - Base skeleton components

---

**Document Status:** Complete
**Last Updated:** 2026-01-08
**Review Status:** Ready for Implementation
**Approved By:** Pending
