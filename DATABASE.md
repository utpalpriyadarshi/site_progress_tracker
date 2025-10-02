# Database Schema and Default Users for Construction Site Progress Tracker

## Database Overview

The application uses WatermelonDB as an offline-first database solution, allowing full functionality even in remote construction sites with limited connectivity. WatermelonDB provides reactive queries that automatically update UI components when data changes.

## Schema Definition

### Projects Table
- `id`: Primary key
- `name`: Project name (string)
- `description`: Project description (string, optional)
- `location`: Project location (string)
- `status`: Project status (string) - active, completed, on_hold
- `start_date`: Project start date (timestamp)
- `end_date`: Project end date (timestamp)
- `budget`: Project budget (number, optional)
- `manager_id`: Reference to managing user (string, optional)
- `created_at`: Record creation timestamp (timestamp, readonly)
- `updated_at`: Record update timestamp (timestamp, readonly)

### Tasks Table
- `id`: Primary key
- `project_id`: Reference to parent project (string, indexed)
- `name`: Task name (string)
- `description`: Task description (string, optional)
- `status`: Task status (string) - not_started, in_progress, completed
- `priority`: Task priority (string) - low, medium, high
- `start_date`: Task start date (timestamp)
- `end_date`: Task end date (timestamp)
- `assigned_to`: Reference to supervisor (string, optional)
- `estimated_hours`: Estimated hours for task (number, optional)
- `created_at`: Record creation timestamp (timestamp, readonly)
- `updated_at`: Record update timestamp (timestamp, readonly)

### Materials Table
- `id`: Primary key
- `project_id`: Reference to parent project (string, indexed)
- `name`: Material name (string)
- `description`: Material description (string, optional)
- `category`: Material category (string) - concrete, steel, wood, etc.
- `unit`: Unit of measurement (string) - kg, m³, pieces, etc.
- `quantity_required`: Required quantity (number)
- `quantity_available`: Available quantity (number)
- `quantity_used`: Used quantity (number)
- `unit_cost`: Cost per unit (number)
- `status`: Material status (string) - ordered, delivered, in_use, shortage
- `delivery_date`: Expected delivery date (timestamp)
- `supplier`: Supplier name (string, optional)
- `created_at`: Record creation timestamp (timestamp, readonly)
- `updated_at`: Record update timestamp (timestamp, readonly)

### Progress Reports Table
- `id`: Primary key
- `project_id`: Reference to parent project (string, indexed)
- `task_id`: Reference to associated task (string, indexed)
- `supervisor_id`: Reference to reporting supervisor (string, indexed)
- `report_date`: Date of report (timestamp)
- `progress_percentage`: Progress as percentage (number)
- `work_completed`: Description of work completed (string, optional)
- `issues_identified`: Description of issues (string, optional)
- `weather_conditions`: Weather conditions (string, optional)
- `next_day_plan`: Plan for next day (string, optional)
- `photos_count`: Number of photos attached (number)
- `status`: Report status (string) - draft, submitted, approved
- `created_at`: Record creation timestamp (timestamp, readonly)
- `updated_at`: Record update timestamp (timestamp, readonly)

## Default Users for Testing

The application will include the following default users for testing different roles:

### Admin User
- Username: `admin`
- Password: `admin123`
- Role: Administrator (full access)

### Manager User
- Username: `manager`
- Password: `manager123`
- Role: Project Manager (can view and manage all projects, budgets, and team performance)

### Supervisor User
- Username: `supervisor`
- Password: `supervisor123`
- Role: Site Supervisor (can create reports, track materials, update task status)

### Planner User
- Username: `planner`
- Password: `planner123`
- Role: Planning Specialist (can manage schedules, Gantt charts, and resources)

## Database Initialization

### Default Data Setup
When the app starts for the first time, it will create default data entries:

1. **Default Project**: "Sample Construction Project"
2. **Sample Tasks**: 
   - Foundation work
   - Framing
   - Electrical
   - Plumbing
   - Finishing

3. **Sample Materials**:
   - Concrete (100 m³ required)
   - Steel Beams (50 pieces required)
   - Cement Bags (200 bags required)

4. **Sample Progress Reports**: Initial status reports for demonstration

## Offline-Sync Architecture

### Sync Process
1. **Sync Down**: Pulls latest data from server when online
2. **Local Changes**: All modifications are saved locally in WatermelonDB
3. **Sync Up**: Changes are pushed to server when connectivity is restored
4. **Conflict Resolution**: Timestamp-based conflict resolution for concurrent edits

### Connection Handling
- The app checks network status when starting
- All operations work offline by default
- Changes are queued and synced when connection is restored
- Users are notified of sync status

## Testing Credentials

For development and testing, use the following credentials:

| Role | Username | Password |
|------|----------|----------|
| Manager | `manager` | `manager123` |
| Supervisor | `supervisor` | `supervisor123` |
| Planner | `planner` | `planner123` |
| Admin | `admin` | `admin123` |

These users will be created during the initial database setup.