# v2.9 - Quick UI Fix for Project Assignment

## Issue
Admin screens (RoleManagementScreen and ProjectManagementScreen) do not have UI for assigning supervisors to projects.

## Status
**PARTIAL FIX APPLIED** to RoleManagementScreen.tsx:
- ✅ Added `projectId` to UserFormData interface
- ✅ Added `projects` state to load project list
- ✅ Added `projectMenuVisible` state for dropdown
- ✅ Updated `loadData()` to fetch projects
- ✅ Updated `openCreateModal()` to initialize projectId
- ✅ Updated `openEditModal()` to load user's projectId
- ✅ Updated `handleSave()` to save projectId on create/update
- ❌ **MISSING**: UI components in the modal (TextInput/Menu for project selection)

## TODO: Complete the UI

### Add Project Selector to Modal JSX

Find the modal in RoleManagementScreen.tsx (around line 450-600) and add this AFTER the Role selector:

```tsx
{/* v2.9: Project Assignment for Supervisors */}
{roles.find(r => r.id === formData.roleId)?.name === 'Supervisor' && (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>Assigned Project (Optional):</Text>
    <Menu
      visible={projectMenuVisible}
      onDismiss={() => setProjectMenuVisible(false)}
      anchor={
        <Button
          mode="outlined"
          onPress={() => setProjectMenuVisible(true)}
          style={styles.menuButton}
        >
          {projects.find(p => p.id === formData.projectId)?.name || 'No Project Assigned'}
        </Button>
      }
    >
      <Menu.Item
        onPress={() => {
          setFormData({ ...formData, projectId: '' });
          setProjectMenuVisible(false);
        }}
        title="No Project"
      />
      {projects.map(project => (
        <Menu.Item
          key={project.id}
          onPress={() => {
            setFormData({ ...formData, projectId: project.id });
            setProjectMenuVisible(false);
          }}
          title={project.name}
        />
      ))}
    </Menu>
  </View>
)}
```

### Key Points:
1. Only show project selector when role is "Supervisor"
2. Allow "No Project" option (projectId can be empty)
3. Load projects from state
4. Save projectId on user create/update

## Testing After Fix

1. Login as admin (`admin` / `admin123`)
2. Create Project A and Project B
3. Create supervisor1:
   - Username: `supervisor1`
   - Password: `supervisor123`
   - Role: Supervisor
   - Project: **Project A**
4. Create supervisor2:
   - Username: `supervisor2`
   - Password: `supervisor123`
   - Role: Supervisor
   - Project: **Project B**
5. Logout and test isolation

## Alternative: Quick SQL Fix

If UI is taking too long, manually assign projects via database:

```sql
-- Get project IDs
SELECT id, name FROM projects;

-- Get supervisor user IDs
SELECT id, username, role_id FROM users WHERE role_id = (SELECT id FROM roles WHERE name = 'Supervisor');

-- Assign supervisor to project
UPDATE users SET project_id = '<project_a_id>' WHERE username = 'supervisor';
UPDATE users SET project_id = '<project_b_id>' WHERE username = 'supervisor2';
```

Then restart app and test.
