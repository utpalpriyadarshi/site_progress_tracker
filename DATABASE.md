# Database Schema and Default Users for Construction Site Progress Tracker

## Database Overview

The application uses WatermelonDB as an offline-first database solution, allowing full functionality even in remote construction sites with limited connectivity. WatermelonDB provides reactive queries that automatically update UI components when data changes.

**Current Schema Version**: 12 (v1.6 - October 2025)

**Schema Evolution:**
- v8: Initial schema with daily_reports and hindrance photos
- v9: Preparation for user management
- v10: Added users and roles tables (Admin module)
- v11: Added planning fields (critical path, dependencies, baseline)
- v12: Added WBS fields (hierarchical codes, phases, risk management)

## Schema Definition

### Projects Table
- `id`: Primary key
- `name`: Project name (string)
- `client`: Client name (string)
- `start_date`: Project start date (timestamp)
- `end_date`: Project end date (timestamp)
- `status`: Project status (string) - active, completed, on_hold, cancelled
- `budget`: Project budget (number)
- `created_at`: Record creation timestamp (timestamp, readonly, auto-managed)
- `updated_at`: Record update timestamp (timestamp, readonly, auto-managed)

### Sites Table
- `id`: Primary key
- `name`: Site name (string)
- `location`: Site location (string)
- `project_id`: Reference to parent project (string, indexed)
- `supervisor_id`: Reference to assigned supervisor (string, indexed)
- `created_at`: Record creation timestamp (timestamp, readonly, auto-managed)
- `updated_at`: Record update timestamp (timestamp, readonly, auto-managed)

### Categories Table
- `id`: Primary key
- `name`: Category name (string)
- `description`: Category description (string, optional)
- `created_at`: Record creation timestamp (timestamp, readonly, auto-managed)
- `updated_at`: Record update timestamp (timestamp, readonly, auto-managed)

### Items Table
- `id`: Primary key
- `name`: Item name (string)
- `category_id`: Reference to category (string, indexed)
- `site_id`: Reference to site (string, indexed)
- `planned_quantity`: Planned quantity (number)
- `completed_quantity`: Completed quantity (number)
- `unit_of_measurement`: Unit of measurement (string) - m³, kg, pieces, etc.
- `planned_start_date`: Planned start date (timestamp)
- `planned_end_date`: Planned end date (timestamp)
- `status`: Item status (string) - not_started, in_progress, completed
- `weightage`: Percentage weightage in project (number)
- `created_at`: Record creation timestamp (timestamp, readonly, auto-managed)
- `updated_at`: Record update timestamp (timestamp, readonly, auto-managed)

### Progress Logs Table
- `id`: Primary key
- `item_id`: Reference to item (string, indexed)
- `date`: Log date (timestamp)
- `completed_quantity`: Quantity completed (number)
- `reported_by`: Reference to reporting user (string, indexed)
- `photos`: JSON string array of photo URIs (string)
- `notes`: Progress notes (string, optional)
- `sync_status`: Sync status (string) - pending, synced, failed
- `created_at`: Record creation timestamp (timestamp, readonly, auto-managed)
- `updated_at`: Record update timestamp (timestamp, readonly, auto-managed)

### Hindrances Table
- `id`: Primary key
- `title`: Hindrance title (string)
- `description`: Hindrance description (string, optional)
- `item_id`: Reference to related item (string, indexed, optional)
- `site_id`: Reference to related site (string, indexed)
- `priority`: Priority level (string) - low, medium, high
- `status`: Hindrance status (string) - open, in_progress, resolved, closed
- `assigned_to`: Reference to assigned user (string, indexed)
- `reported_by`: Reference to reporting user (string, indexed)
- `reported_at`: Report timestamp (timestamp)
- `photos`: JSON string array of photo URIs (string)
- `sync_status`: Sync status (string) - pending, synced, failed
- `created_at`: Record creation timestamp (timestamp, readonly, auto-managed)
- `updated_at`: Record update timestamp (timestamp, readonly, auto-managed)

### Materials Table
- `id`: Primary key
- `name`: Material name (string)
- `item_id`: Reference to item (string, indexed)
- `quantity_required`: Required quantity (number)
- `quantity_available`: Available quantity (number)
- `quantity_used`: Used quantity (number)
- `unit`: Unit of measurement (string) - kg, m³, pieces, etc.
- `status`: Material status (string) - ordered, delivered, in_use, shortage
- `supplier`: Supplier name (string, optional)
- `procurement_manager_id`: Reference to procurement manager (string, indexed)
- `created_at`: Record creation timestamp (timestamp, readonly, auto-managed)
- `updated_at`: Record update timestamp (timestamp, readonly, auto-managed)

### Daily Reports Table
- `id`: Primary key
- `site_id`: Reference to site (string, indexed)
- `supervisor_id`: Reference to supervisor (string, indexed)
- `report_date`: Report date (timestamp)
- `submitted_at`: Submission timestamp (timestamp)
- `total_items`: Count of items updated (number)
- `total_progress`: Overall progress percentage (number)
- `pdf_path`: Local path to PDF file (string, optional) - **Note**: PDF generation currently disabled
- `notes`: Report notes (string, optional)
- `sync_status`: Sync status (string) - pending, synced, failed
- `created_at`: Record creation timestamp (timestamp, readonly, auto-managed)
- `updated_at`: Record update timestamp (timestamp, readonly, auto-managed)

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

## Database Relationships

### Entity Relationships

```
Projects (1) ──→ (Many) Sites
Sites (1) ──→ (Many) Items
Sites (1) ──→ (Many) Hindrances
Categories (1) ──→ (Many) Items
Items (1) ──→ (Many) ProgressLogs
Items (1) ──→ (Many) Materials
Items (1) ──→ (Many) Hindrances
```

**Relationship Details**:
- **Project → Sites**: One project can have multiple construction sites
- **Site → Items**: One site can have multiple work items
- **Category → Items**: Items are categorized (e.g., Structural, Electrical, Plumbing)
- **Item → ProgressLogs**: Each item tracks daily progress updates
- **Item → Materials**: Each item tracks required materials
- **Item/Site → Hindrances**: Issues can be linked to specific items or sites

## Database Initialization

### Default Data Setup
When the app starts for the first time, it will create default data entries:

1. **Default Project**: "Main Construction Project"
2. **Default Site**: "Main Construction Site"
3. **Sample Categories**:
   - Structural Work
   - Electrical Work
   - Plumbing Work
   - Finishing Work

4. **Sample Items** (10 construction tasks):
   - Foundation Work
   - Excavation Work
   - Concrete Pouring
   - Steel Framework
   - Drywall Installation
   - Electrical Wiring
   - Plumbing Installation
   - Roofing Work
   - Painting & Finishing
   - Flooring Installation
   - HVAC Installation

5. **Sample Materials**: Materials linked to items for tracking

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