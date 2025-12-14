# Hindrance Report Screen Documentation

**Version**: v2.13
**Status**: ✅ Refactored (Task 1.3.3 Complete)
**Location**: `src/supervisor/hindrance_reports/`
**Last Updated**: December 11, 2025

---

## Overview

The Hindrance Report Screen enables supervisors to report and track obstacles, delays, and issues affecting site progress. The screen was refactored from a 866-line monolithic file into a modular architecture with 81.5% code reduction.

### Before Refactoring
- **File**: `src/supervisor/HindranceReportScreen.tsx`
- **Size**: 866 lines
- **Issues**: Hard to maintain, difficult to test, code duplication

### After Refactoring (v2.13)
- **Main Screen**: `src/supervisor/hindrance_reports/HindranceReportScreen.tsx` (160 lines)
- **Total Module**: 12 files organized in components, hooks, utils
- **Reduction**: 81.5% smaller main file
- **Benefits**: Maintainable, reusable, testable, separation of concerns

---

## Architecture

### Directory Structure

```
src/supervisor/hindrance_reports/
├── HindranceReportScreen.tsx       (160 lines) - Main screen component
├── components/
│   ├── HindranceCard.tsx           (171 lines) - Hindrance display card
│   ├── HindranceForm.tsx           (250 lines) - Hindrance form dialog
│   ├── HindranceList.tsx           (75 lines)  - List view component
│   └── index.ts                    (3 lines)   - Barrel exports
├── hooks/
│   ├── useHindranceData.ts         (164 lines) - Data fetching & sync
│   ├── useHindranceForm.ts         (252 lines) - Form state management
│   └── index.ts                    (2 lines)   - Barrel exports
├── utils/
│   ├── hindranceFormatters.ts      (52 lines)  - Date/status formatting
│   ├── hindranceValidation.ts      (27 lines)  - Form validation
│   └── index.ts                    (2 lines)   - Barrel exports
└── types.ts                        (22 lines)  - Type definitions

Shared Hooks (src/hooks/):
└── usePhotoUpload.ts               (247 lines) - Photo upload logic
```

**Total Lines**: 1,179 lines across 12 files
**Main Screen**: 160 lines (81.5% reduction from 866 lines)

---

## Components

### 1. HindranceReportScreen (Main Screen)

**File**: `HindranceReportScreen.tsx` (160 lines)

**Responsibilities**:
- Coordinate all child components
- Manage screen-level state (site selection)
- Handle navigation and screen lifecycle
- Integrate with SiteContext for site selection

**Key Features**:
- Site selector dropdown
- Report Hindrance button (disabled if no site selected)
- Hindrance list with pull-to-refresh
- Delete confirmation dialog
- Empty state display

**Props**: None (uses SiteContext)

**Usage**:
```typescript
import HindranceReportScreen from './hindrance_reports/HindranceReportScreen';

<ErrorBoundary name="HindranceReportScreen">
  <HindranceReportScreen />
</ErrorBoundary>
```

**Implementation Highlights**:
```typescript
const HindranceReportScreen = () => {
  const { selectedSiteId, supervisorId, projectId } = useSiteContext();
  const { showSnackbar } = useSnackbar();

  // Photo upload hook (shared)
  const { photos, handleTakePhoto, handleSelectPhotos, ... } = usePhotoUpload({
    maxPhotos: 10,
    quality: 0.8,
  });

  // Data management hook
  const { hindrances, siteItems, refreshing, onRefresh, ... } = useHindranceData({
    supervisorId,
    projectId,
    selectedSiteId,
  });

  // Form state hook
  const { dialogVisible, handleAdd, handleEdit, handleSave, ... } = useHindranceForm({
    supervisorId,
    selectedSiteId,
    photos,
    setPhotos,
  });

  return (
    <View>
      <SiteSelector />
      <Button onPress={handleAdd}>Report Hindrance</Button>
      <HindranceList hindrances={hindrances} onEdit={handleEdit} />
      <HindranceForm visible={dialogVisible} onSave={handleSave} />
    </View>
  );
};
```

---

### 2. HindranceCard Component

**File**: `components/HindranceCard.tsx` (171 lines)

**Responsibilities**:
- Display hindrance details in a card format
- Show priority badges and status indicators
- Display associated item and site information
- Provide Edit and Delete action buttons
- Show photo thumbnails if available

**Props**:
```typescript
interface HindranceCardProps {
  hindrance: HindranceWithDetails;
  onEdit: (hindrance: HindranceModel) => void;
  onDelete: (hindrance: HindranceModel) => void;
}
```

**Features**:
- **Priority Badges**: Color-coded (High: red, Medium: orange, Low: gray)
- **Status Chips**: Visual indicators (Open, In Progress, Resolved, Closed)
- **Item Display**: Shows related construction item if linked
- **Photo Count**: Displays number of attached photos
- **Date Formatting**: Human-readable date display
- **Action Menu**: Edit and Delete options

**Visual Layout**:
```
┌─────────────────────────────────────────┐
│ 🔴 High Priority    ⚠️ Open             │
│ Hindrance Title                         │
│ Description text...                     │
│                                         │
│ 📋 Item: Foundation Work                │
│ 📷 3 photos | 📅 Dec 11, 2025           │
│                                         │
│ [✏️ Edit] [🗑️ Delete]                   │
└─────────────────────────────────────────┘
```

**Usage**:
```typescript
<HindranceCard
  hindrance={hindranceWithDetails}
  onEdit={handleEdit}
  onDelete={handleDelete}
/>
```

---

### 3. HindranceForm Component

**File**: `components/HindranceForm.tsx` (250 lines)

**Responsibilities**:
- Display hindrance creation/edit dialog
- Handle form input (title, description, priority, status, item)
- Integrate photo upload functionality
- Validate and save hindrance data

**Props**:
```typescript
interface HindranceFormProps {
  visible: boolean;
  isEditing: boolean;
  title: string;
  description: string;
  priority: HindrancePriority;
  status: HindranceStatus;
  selectedItemId: string;
  siteItems: ItemModel[];
  photos: string[];
  photoMenuVisible: boolean;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onPriorityChange: (value: HindrancePriority) => void;
  onStatusChange: (value: HindranceStatus) => void;
  onItemSelect: (value: string) => void;
  onPhotoMenuToggle: (value: boolean) => void;
  onTakePhoto: () => void;
  onSelectPhoto: () => void;
  onRemovePhoto: (index: number) => void;
  onSave: () => void;
  onCancel: () => void;
}
```

**Form Fields**:
1. **Title** (TextInput, required)
2. **Description** (TextInput, multiline, required)
3. **Priority** (SegmentedButtons: Low, Medium, High)
4. **Status** (SegmentedButtons: Open, In Progress, Resolved, Closed)
5. **Related Item** (Dropdown, optional)
6. **Photos** (PhotoGallery with menu: Take Photo, Choose from Gallery)

**Validation**:
- Title is required and non-empty
- Description is required and non-empty
- Priority must be selected
- Status must be selected
- Max 10 photos allowed

**Usage**:
```typescript
<HindranceForm
  visible={dialogVisible}
  isEditing={!!editingHindrance}
  title={title}
  description={description}
  priority={priority}
  status={status}
  selectedItemId={selectedItemId}
  siteItems={siteItems}
  photos={photos}
  onSave={handleSave}
  onCancel={closeDialog}
  // ... other handlers
/>
```

---

### 4. HindranceList Component

**File**: `components/HindranceList.tsx` (75 lines)

**Responsibilities**:
- Display list of hindrances with pull-to-refresh
- Handle empty states
- Pass actions to HindranceCard components
- Provide ScrollView with RefreshControl

**Props**:
```typescript
interface HindranceListProps {
  hindrances: HindranceWithDetails[];
  selectedSiteId: string;
  refreshing: boolean;
  onRefresh: () => void;
  onEdit: (hindrance: HindranceModel) => void;
  onDelete: (hindrance: HindranceModel) => void;
}
```

**Features**:
- Pull-to-refresh functionality
- Empty state when no site selected
- Empty state when no hindrances exist
- Scrollable list of HindranceCard components

**Empty States**:
```typescript
// No site selected
"Please select a site to view hindrances"

// No hindrances for site
"No hindrances reported for this site"
```

**Usage**:
```typescript
<HindranceList
  hindrances={hindrances}
  selectedSiteId={selectedSiteId}
  refreshing={refreshing}
  onRefresh={onRefresh}
  onEdit={handleEdit}
  onDelete={handleDelete}
/>
```

---

## Hooks

### 1. useHindranceData Hook

**File**: `hooks/useHindranceData.ts` (164 lines)

**Purpose**: Manages data fetching, filtering, and synchronization for hindrances

**Parameters**:
```typescript
interface UseHindranceDataParams {
  supervisorId: string;
  projectId: string;
  selectedSiteId: string;
  onError: (message: string) => void;
}
```

**Returns**:
```typescript
{
  hindrances: HindranceWithDetails[];      // Filtered hindrances with site/item details
  siteItems: ItemModel[];                  // Items for selected site
  refreshing: boolean;                     // Pull-to-refresh state
  loadHindrances: () => Promise<void>;     // Manually reload hindrances
  onRefresh: () => Promise<void>;          // Pull-to-refresh handler
}
```

**Features**:
- Fetches hindrances from WatermelonDB using observables
- Filters by supervisor's sites and selected site
- Joins hindrance data with site and item details
- Provides pull-to-refresh functionality
- Integrates with LoggingService for error tracking

**Implementation**:
```typescript
const { hindrances, siteItems, loadHindrances } = useHindranceData({
  supervisorId: 'sup_001',
  projectId: 'proj_001',
  selectedSiteId: 'site_001',
  onError: (msg) => showSnackbar(msg, 'error'),
});
```

**Database Queries**:
- Queries `hindrances` collection with site filter
- Queries `items` collection for site items
- Uses WatermelonDB observables for reactive updates
- Filters by `supervisor_id`, `site_id`, and `project_id`

---

### 2. useHindranceForm Hook

**File**: `hooks/useHindranceForm.ts` (252 lines)

**Purpose**: Manages form state, validation, and CRUD operations for hindrances

**Parameters**:
```typescript
interface UseHindranceFormParams {
  supervisorId: string;
  selectedSiteId: string;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  onLoadHindrances: () => Promise<void>;
  photos: string[];
  setPhotos: (photos: string[]) => void;
}
```

**Returns**:
```typescript
{
  // Dialog state
  dialogVisible: boolean;
  setDialogVisible: (visible: boolean) => void;
  closeDialog: () => void;

  // Form fields
  title: string;
  setTitle: (value: string) => void;
  description: string;
  setDescription: (value: string) => void;
  priority: HindrancePriority;
  setPriority: (value: HindrancePriority) => void;
  status: HindranceStatus;
  setStatus: (value: HindranceStatus) => void;
  selectedItemId: string;
  setSelectedItemId: (value: string) => void;

  // Edit state
  editingHindrance: HindranceModel | null;

  // Delete state
  showDeleteDialog: boolean;
  hindranceToDelete: HindranceModel | null;

  // Actions
  handleAdd: () => void;
  handleEdit: (hindrance: HindranceModel) => void;
  handleSave: () => Promise<void>;
  handleDelete: (hindrance: HindranceModel) => void;
  confirmDelete: () => Promise<void>;
  cancelDelete: () => void;
}
```

**Features**:
- Complete form state management (all input fields)
- Create new hindrance functionality
- Edit existing hindrance (pre-populates form)
- Delete with confirmation dialog
- Form validation (title, description required)
- Photo integration
- Database write operations
- Success/error callbacks
- Auto-refresh after save/delete

**Form Lifecycle**:

1. **Add New**:
   ```typescript
   handleAdd() → Opens dialog → User fills form → handleSave() → Creates record
   ```

2. **Edit Existing**:
   ```typescript
   handleEdit(hindrance) → Pre-populates form → User edits → handleSave() → Updates record
   ```

3. **Delete**:
   ```typescript
   handleDelete(hindrance) → Shows confirmation → confirmDelete() → Deletes record
   ```

**Validation Rules**:
- Title: Required, non-empty string
- Description: Required, non-empty string
- Priority: Must be 'low' | 'medium' | 'high'
- Status: Must be 'open' | 'in_progress' | 'resolved' | 'closed'
- Photos: Max 10 photos

**Database Operations**:
```typescript
// Create
await database.collections.get('hindrances').create((hindrance) => {
  hindrance.siteId = selectedSiteId;
  hindrance.title = title;
  hindrance.description = description;
  hindrance.priority = priority;
  hindrance.status = status;
  hindrance.reportedBy = supervisorId;
  hindrance.reportedAt = new Date().getTime();
  hindrance.photos = JSON.stringify(photos);
  hindrance.relatedItemId = selectedItemId || null;
  hindrance.appSyncStatus = 'pending';
});

// Update
await hindrance.update((h) => {
  h.title = title;
  h.description = description;
  h.priority = priority;
  h.status = status;
  h.photos = JSON.stringify(photos);
  h.relatedItemId = selectedItemId || null;
});

// Delete
await hindrance.markAsDeleted();
```

---

## Utils

### 1. hindranceFormatters.ts

**File**: `utils/hindranceFormatters.ts` (52 lines)

**Purpose**: Format hindrance data for display

**Functions**:

```typescript
// Format priority for display
export const formatPriority = (priority: HindrancePriority): string => {
  const map = { low: 'Low', medium: 'Medium', high: 'High' };
  return map[priority] || 'Unknown';
};

// Get priority color
export const getPriorityColor = (priority: HindrancePriority): string => {
  const colors = {
    low: '#9E9E9E',      // Gray
    medium: '#FF9800',   // Orange
    high: '#F44336',     // Red
  };
  return colors[priority] || '#9E9E9E';
};

// Format status for display
export const formatStatus = (status: HindranceStatus): string => {
  const map = {
    open: 'Open',
    in_progress: 'In Progress',
    resolved: 'Resolved',
    closed: 'Closed',
  };
  return map[status] || 'Unknown';
};

// Get status color
export const getStatusColor = (status: HindranceStatus): string => {
  const colors = {
    open: '#F44336',           // Red
    in_progress: '#FF9800',    // Orange
    resolved: '#4CAF50',       // Green
    closed: '#9E9E9E',         // Gray
  };
  return colors[status] || '#9E9E9E';
};

// Format date for display
export const formatDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleDateString();
};
```

**Usage**:
```typescript
import { formatPriority, getPriorityColor } from './utils';

<Chip
  style={{ backgroundColor: getPriorityColor(hindrance.priority) }}
>
  {formatPriority(hindrance.priority)}
</Chip>
```

---

### 2. hindranceValidation.ts

**File**: `utils/hindranceValidation.ts` (27 lines)

**Purpose**: Validate hindrance form data

**Functions**:

```typescript
// Validate title
export const validateTitle = (title: string): string | null => {
  if (!title || title.trim() === '') {
    return 'Title is required';
  }
  return null;
};

// Validate description
export const validateDescription = (description: string): string | null => {
  if (!description || description.trim() === '') {
    return 'Description is required';
  }
  return null;
};

// Validate hindrance can be added
export const canAddHindrance = (selectedSiteId: string): boolean => {
  return selectedSiteId !== '' && selectedSiteId !== 'all';
};

// Validate all fields
export const validateHindranceForm = (data: {
  title: string;
  description: string;
}): string | null => {
  return validateTitle(data.title) || validateDescription(data.description);
};
```

**Usage**:
```typescript
import { validateHindranceForm, canAddHindrance } from './utils';

const error = validateHindranceForm({ title, description });
if (error) {
  showSnackbar(error, 'error');
  return;
}
```

---

## Types

### Type Definitions

**File**: `types.ts` (22 lines)

```typescript
import HindranceModel from '../../../models/HindranceModel';
import SiteModel from '../../../models/SiteModel';
import ItemModel from '../../../models/ItemModel';

// Priority levels
export type HindrancePriority = 'low' | 'medium' | 'high';

// Status values
export type HindranceStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

// Hindrance with joined site and item data
export interface HindranceWithDetails {
  hindrance: HindranceModel;  // The hindrance record
  site: SiteModel;            // Associated site
  item?: ItemModel;           // Optional related item
}

// Form data structure
export interface HindranceFormData {
  title: string;
  description: string;
  priority: HindrancePriority;
  status: HindranceStatus;
  selectedItemId: string;
  photos: string[];
}
```

---

## Integration with Shared Hooks

### usePhotoUpload Hook

The HindranceReportScreen uses the shared `usePhotoUpload` hook from `src/hooks/usePhotoUpload.ts`:

```typescript
const {
  photos,
  photoMenuVisible,
  setPhotoMenuVisible,
  handleTakePhoto,
  handleSelectPhotos,
  handleRemovePhoto,
  setPhotos,
} = usePhotoUpload({
  maxPhotos: 10,
  quality: 0.8,
  onError: (error) => showSnackbar(error, 'error'),
});
```

**Benefits**:
- Consistent photo handling across all supervisor screens
- Permission management handled automatically
- Image compression and optimization
- Gallery and camera integration

**Also Used By**:
- SiteInspectionScreen
- DailyReportsScreen

---

## Testing

### Test Coverage

**Status**: Manual testing completed ✅

**Test Scenarios** (15 critical tests):

1. ✅ Display empty state when no site selected
2. ✅ Display empty state when no hindrances exist
3. ✅ Display list of hindrances for selected site
4. ✅ Open create dialog when "Report Hindrance" clicked
5. ✅ Validate required fields (title, description)
6. ✅ Create new hindrance with all fields
7. ✅ Create hindrance with photos (camera + gallery)
8. ✅ Save hindrance and see it in list
9. ✅ Edit existing hindrance (pre-populate form)
10. ✅ Update hindrance and see changes
11. ✅ Delete hindrance with confirmation
12. ✅ Cancel delete operation
13. ✅ Priority badges display correct colors
14. ✅ Status chips display correct colors
15. ✅ Pull-to-refresh functionality works

**Unit Tests**: Deferred (to be added later)

**Integration Tests**: Deferred (to be added later)

---

## Code Metrics

### Before vs After

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| **Main Screen** | 866 lines | 160 lines | ↓ 81.5% |
| **Total Files** | 1 file | 12 files | Better organization |
| **Largest File** | 866 lines | 252 lines | More maintainable |
| **Components** | 0 | 3 | Reusable |
| **Hooks** | 0 | 2 | Testable logic |
| **Utils** | 0 | 2 | Shared utilities |

### File Size Distribution

```
📊 hindrance_reports/ module (1,179 lines total):
├── Components (499 lines)
│   ├── HindranceForm.tsx    - 250 lines
│   ├── HindranceCard.tsx    - 171 lines
│   └── HindranceList.tsx    - 75 lines
├── Hooks (418 lines)
│   ├── useHindranceForm.ts  - 252 lines
│   └── useHindranceData.ts  - 164 lines
├── Utils (81 lines)
│   ├── hindranceFormatters  - 52 lines
│   └── hindranceValidation  - 27 lines
├── Main Screen (160 lines)
└── Types (22 lines)
```

---

## Benefits Achieved

### 1. Maintainability
- ✅ Small, focused files (average 98 lines)
- ✅ Clear separation of concerns
- ✅ Easy to locate and modify specific functionality

### 2. Reusability
- ✅ Components can be used in other screens
- ✅ Hooks can be shared across features
- ✅ Utils are generic and reusable

### 3. Testability
- ✅ Components can be tested in isolation
- ✅ Hooks have clear inputs/outputs
- ✅ Utils are pure functions (easy to test)

### 4. Code Quality
- ✅ Type-safe with centralized type definitions
- ✅ Consistent error handling with LoggingService
- ✅ Validation logic centralized
- ✅ Formatting logic centralized

### 5. Developer Experience
- ✅ Easier onboarding for new developers
- ✅ Faster bug fixes (smaller files)
- ✅ Better code review experience
- ✅ Cleaner git diffs

---

## Usage Examples

### Create a New Hindrance

```typescript
// User flow:
1. Select a site from SiteSelector
2. Click "Report Hindrance" button
3. Fill in the form:
   - Title: "Equipment breakdown"
   - Description: "Concrete mixer is not working"
   - Priority: High
   - Status: Open
   - Related Item: (select from dropdown)
   - Photos: Take photo of broken equipment
4. Click "Save"
5. Hindrance appears in the list
```

### Edit Existing Hindrance

```typescript
// User flow:
1. Click "Edit" button on a hindrance card
2. Form pre-populates with existing data
3. Change status to "In Progress"
4. Add notes to description
5. Click "Save"
6. Card updates with new information
```

### Delete a Hindrance

```typescript
// User flow:
1. Click "Delete" button on a hindrance card
2. Confirmation dialog appears
3. Click "Delete" to confirm
4. Hindrance is removed from the list
```

---

## Future Enhancements

### Potential Improvements

1. **Filtering & Sorting**
   - Filter by priority (High, Medium, Low)
   - Filter by status (Open, In Progress, Resolved, Closed)
   - Sort by date, priority, or status

2. **Search Functionality**
   - Search by title or description
   - Search by related item

3. **Status Transitions**
   - Workflow enforcement (e.g., Open → In Progress → Resolved → Closed)
   - Auto-status updates based on time

4. **Notifications**
   - Notify when hindrance is assigned
   - Remind about unresolved high-priority hindrances

5. **Analytics**
   - Hindrance count by site
   - Average resolution time
   - Most common hindrance types

6. **Comments & Updates**
   - Add comments to hindrances
   - Track history of changes
   - @mention team members

---

## Related Documentation

- [Site Inspection Screen](./SITE_INSPECTION.md) - Similar architecture pattern
- [Architecture Guide](../../architecture/ARCHITECTURE_UNIFIED.md) - Overall app architecture
- [Claude AI Prompts](../../ai-prompts/CLAUDE.md) - Development guidelines
- [Supervisor Improvements Roadmap](../../../SUPERVISOR_IMPROVEMENTS_ROADMAP.md) - Project roadmap

---

**Last Updated**: December 11, 2025
**Maintained By**: Development Team
**Questions**: Create GitHub issue with tag `supervisor-improvements`
