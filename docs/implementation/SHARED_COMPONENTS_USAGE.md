# Manager Shared Components - Usage Guide

**Created:** 2026-01-03
**Components:** 5 reusable components
**Location:** `src/manager/shared/components/`

---

## Overview

This guide provides usage examples and integration patterns for all Manager shared components. These components are fully typed, tested, and ready for use across Manager role screens.

## Import Statement

All components can be imported from the shared module:

```typescript
import {
  ApprovalWorkflowCard,
  BomItemEditor,
  CostBreakdownChart,
  TeamMemberSelector,
  ResourceAllocationGrid,
} from '../shared';

// Or import types separately
import type {
  ApprovalWorkflowItem,
  BomItemData,
  CostBreakdownData,
  TeamMember,
  ResourceAllocation,
} from '../shared';
```

---

## 1. ApprovalWorkflowCard

**Purpose:** Display approval workflows with priority, status, and action buttons

### Basic Usage

```typescript
import React from 'react';
import { ApprovalWorkflowCard } from '../shared';

const ApprovalScreen = () => {
  const handleApprove = (id: string) => {
    console.log('Approved:', id);
    // Your approval logic here
  };

  const handleReject = (id: string) => {
    console.log('Rejected:', id);
    // Your rejection logic here
  };

  const approvalItem = {
    id: '123',
    title: 'Material Request - Steel Beams',
    description: 'Request for 20 tons of steel beams for Site A construction',
    requester: 'John Doe',
    requestDate: Date.now() - 86400000, // Yesterday
    priority: 'high' as const,
    status: 'pending' as const,
    category: 'Material',
    site: 'Site A',
  };

  return (
    <ApprovalWorkflowCard
      item={approvalItem}
      onApprove={handleApprove}
      onReject={handleReject}
      showActions={true}
    />
  );
};
```

### Compact Mode

```typescript
<ApprovalWorkflowCard
  item={approvalItem}
  onPress={(id) => navigateToDetails(id)}
  showActions={false}
  compact={true}
/>
```

### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| item | ApprovalWorkflowItem | Yes | - | Approval data to display |
| onApprove | (id: string) => void | No | - | Approve button handler |
| onReject | (id: string) => void | No | - | Reject button handler |
| onPress | (id: string) => void | No | - | Card press handler |
| showActions | boolean | No | true | Show approve/reject buttons |
| compact | boolean | No | false | Compact mode (no description) |

---

## 2. BomItemEditor

**Purpose:** Modal component for adding/editing BOM items with validation

### Add New Item

```typescript
import React, { useState } from 'react';
import { BomItemEditor, type BomItemData } from '../shared';

const BomManagementScreen = () => {
  const [editorVisible, setEditorVisible] = useState(false);

  const handleSave = async (data: BomItemData) => {
    try {
      // Save to database
      await database.write(async () => {
        await database.collections.get('bom_items').create((item) => {
          item.description = data.description;
          item.category = data.category;
          item.quantity = data.quantity;
          item.unit = data.unit;
          item.unitCost = data.unitCost;
          // ... other fields
        });
      });
      setEditorVisible(false);
    } catch (error) {
      console.error('Failed to save:', error);
    }
  };

  return (
    <>
      <Button title="Add Item" onPress={() => setEditorVisible(true)} />

      <BomItemEditor
        visible={editorVisible}
        mode="add"
        onSave={handleSave}
        onCancel={() => setEditorVisible(false)}
        bomType="estimating"
      />
    </>
  );
};
```

### Edit Existing Item

```typescript
const handleEdit = (item: BomItemModel) => {
  const initialData: BomItemData = {
    description: item.description,
    category: item.category,
    quantity: item.quantity,
    unit: item.unit,
    unitCost: item.unitCost,
    wbsCode: item.wbsCode,
    phase: item.phase,
    notes: item.notes,
  };

  setInitialData(initialData);
  setEditorMode('edit');
  setEditorVisible(true);
};

<BomItemEditor
  visible={editorVisible}
  mode="edit"
  initialData={initialData}
  onSave={handleUpdate}
  onCancel={() => setEditorVisible(false)}
/>
```

### With Disabled Fields

```typescript
<BomItemEditor
  visible={editorVisible}
  mode="edit"
  initialData={initialData}
  onSave={handleSave}
  onCancel={() => setEditorVisible(false)}
  disabledFields={['category', 'unitCost']} // Lock these fields
/>
```

### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| visible | boolean | Yes | - | Modal visibility |
| mode | 'add' \| 'edit' | Yes | - | Editor mode |
| initialData | BomItemData | No | - | Initial form data (edit mode) |
| onSave | (data: BomItemData) => void | Yes | - | Save handler |
| onCancel | () => void | Yes | - | Cancel handler |
| bomType | 'estimating' \| 'execution' | No | - | BOM type indicator |
| disabledFields | string[] | No | [] | Fields to disable |

---

## 3. CostBreakdownChart

**Purpose:** Visual cost breakdown with stacked bar chart

### Basic Usage

```typescript
import React from 'react';
import { CostBreakdownChart, type CostBreakdownData } from '../shared';

const DashboardScreen = () => {
  const costData: CostBreakdownData = {
    material: 500000,
    labor: 300000,
    equipment: 150000,
    subcontractor: 50000,
  };

  return (
    <CostBreakdownChart
      data={costData}
      showPercentages={true}
      showLegend={true}
    />
  );
};
```

### With Budget Comparison

```typescript
const costData: CostBreakdownData = {
  material: 600000,
  labor: 350000,
  equipment: 200000,
  subcontractor: 100000,
};

<CostBreakdownChart
  data={costData}
  totalBudget={1200000}
  showPercentages={true}
  showLegend={true}
  onCategoryPress={(category) => {
    // Navigate to category details
    navigation.navigate('CategoryDetails', { category });
  }}
/>
```

### Compact Mode

```typescript
<CostBreakdownChart
  data={costData}
  showPercentages={false}
  showLegend={false}
  compact={true}
  height={30}
/>
```

### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| data | CostBreakdownData | Yes | - | Cost data by category |
| totalBudget | number | No | - | Budget for variance display |
| showPercentages | boolean | No | true | Show % labels on segments |
| showLegend | boolean | No | true | Show category legend |
| height | number | No | 40 | Bar height in pixels |
| compact | boolean | No | false | Compact mode |
| onCategoryPress | (category: string) => void | No | - | Category click handler |

---

## 4. TeamMemberSelector

**Purpose:** Modal selector for choosing team members with search and filters

### Single Select

```typescript
import React, { useState } from 'react';
import { TeamMemberSelector, type TeamMember } from '../shared';

const AssignmentScreen = () => {
  const [selectorVisible, setSelectorVisible] = useState(false);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);

  const teamMembers: TeamMember[] = [
    {
      id: '1',
      name: 'John Doe',
      role: 'Site Engineer',
      site: 'Site A',
      availability: 'available',
    },
    {
      id: '2',
      name: 'Jane Smith',
      role: 'Supervisor',
      site: 'Site B',
      availability: 'busy',
    },
    // ... more members
  ];

  const handleSelect = (memberIds: string[]) => {
    setSelectedMember(memberIds[0]);
    setSelectorVisible(false);
  };

  return (
    <>
      <Button title="Assign Member" onPress={() => setSelectorVisible(true)} />

      <TeamMemberSelector
        visible={selectorVisible}
        members={teamMembers}
        selectedMembers={selectedMember ? [selectedMember] : []}
        onSelect={handleSelect}
        onCancel={() => setSelectorVisible(false)}
        multiSelect={false}
        title="Select Team Member"
      />
    </>
  );
};
```

### Multi Select with Filters

```typescript
const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

<TeamMemberSelector
  visible={selectorVisible}
  members={teamMembers}
  selectedMembers={selectedMembers}
  onSelect={(ids) => {
    setSelectedMembers(ids);
    setSelectorVisible(false);
  }}
  onCancel={() => setSelectorVisible(false)}
  multiSelect={true}
  filterBySite="Site A"
  filterByRole="Engineer"
  showAvailability={true}
  title="Select Team Members"
  searchPlaceholder="Search by name..."
/>
```

### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| visible | boolean | Yes | - | Modal visibility |
| members | TeamMember[] | Yes | - | Available team members |
| selectedMembers | string[] | No | [] | Pre-selected member IDs |
| onSelect | (memberIds: string[]) => void | Yes | - | Selection handler |
| onCancel | () => void | Yes | - | Cancel handler |
| multiSelect | boolean | No | false | Allow multiple selection |
| filterBySite | string | No | - | Filter by site name |
| filterByRole | string | No | - | Filter by role |
| showAvailability | boolean | No | true | Show availability indicators |
| title | string | No | 'Select Team Member' | Modal title |
| searchPlaceholder | string | No | 'Search by name...' | Search placeholder |

---

## 5. ResourceAllocationGrid

**Purpose:** Display resource allocation across sites with color coding

### Basic Usage

```typescript
import React from 'react';
import { ResourceAllocationGrid, type ResourceAllocation } from '../shared';

const ResourceDashboard = () => {
  const resources: ResourceAllocation[] = [
    {
      resourceId: '1',
      resourceName: 'John Doe',
      type: 'person',
      allocations: [
        { siteId: 'A', siteName: 'Site A', percentage: 50, hours: 20 },
        { siteId: 'B', siteName: 'Site B', percentage: 30, hours: 12 },
      ],
    },
    {
      resourceId: '2',
      resourceName: 'Excavator #1',
      type: 'equipment',
      allocations: [
        { siteId: 'A', siteName: 'Site A', percentage: 100, hours: 40 },
      ],
    },
    // ... more resources
  ];

  return (
    <ResourceAllocationGrid
      resources={resources}
      showPercentages={true}
      highlightOverallocated={true}
    />
  );
};
```

### With Click Handlers

```typescript
<ResourceAllocationGrid
  resources={resources}
  onResourcePress={(resourceId) => {
    // Navigate to resource details
    navigation.navigate('ResourceDetails', { resourceId });
  }}
  onAllocationPress={(resourceId, siteId) => {
    // Open allocation editor
    openAllocationEditor(resourceId, siteId);
  }}
  showPercentages={true}
  showHours={true}
  highlightOverallocated={true}
/>
```

### Compact Mode

```typescript
<ResourceAllocationGrid
  resources={resources}
  showPercentages={true}
  showHours={false}
  highlightOverallocated={false}
  compact={true}
/>
```

### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| resources | ResourceAllocation[] | Yes | - | Resource allocation data |
| onResourcePress | (resourceId: string) => void | No | - | Resource row click handler |
| onAllocationPress | (resourceId: string, siteId: string) => void | No | - | Cell click handler |
| showPercentages | boolean | No | true | Show percentages in cells |
| showHours | boolean | No | false | Show hours instead of % |
| highlightOverallocated | boolean | No | true | Highlight >100% rows |
| compact | boolean | No | false | Compact mode |

---

## Integration Patterns

### Pattern 1: Dashboard Integration

```typescript
import {
  CostBreakdownChart,
  ApprovalWorkflowCard,
  ResourceAllocationGrid,
} from '../shared';

const ManagerDashboard = () => {
  return (
    <ScrollView>
      {/* Cost Overview */}
      <CostBreakdownChart
        data={costData}
        totalBudget={budget}
        showLegend={true}
      />

      {/* Pending Approvals */}
      <Text style={styles.sectionTitle}>Pending Approvals</Text>
      {approvals.map((item) => (
        <ApprovalWorkflowCard
          key={item.id}
          item={item}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      ))}

      {/* Resource Allocation */}
      <ResourceAllocationGrid
        resources={resources}
        highlightOverallocated={true}
      />
    </ScrollView>
  );
};
```

### Pattern 2: BOM Management Integration

```typescript
import { BomItemEditor, CostBreakdownChart } from '../shared';

const BomManagementScreen = () => {
  const [editorVisible, setEditorVisible] = useState(false);

  return (
    <View>
      {/* Cost Breakdown */}
      <CostBreakdownChart data={bomCosts} showLegend={true} />

      {/* Items List */}
      <FlatList
        data={items}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => openEditor(item)}>
            <ItemCard item={item} />
          </TouchableOpacity>
        )}
      />

      {/* Editor Modal */}
      <BomItemEditor
        visible={editorVisible}
        mode={editorMode}
        initialData={selectedItem}
        onSave={handleSave}
        onCancel={() => setEditorVisible(false)}
      />
    </View>
  );
};
```

### Pattern 3: Team Assignment Integration

```typescript
import { TeamMemberSelector, ResourceAllocationGrid } from '../shared';

const TeamManagementScreen = () => {
  const [selectorVisible, setSelectorVisible] = useState(false);

  return (
    <View>
      {/* Current Allocations */}
      <ResourceAllocationGrid
        resources={teamAllocations}
        onAllocationPress={(resourceId, siteId) => {
          // Open re-assignment selector
          setSelectorVisible(true);
        }}
      />

      {/* Assignment Selector */}
      <TeamMemberSelector
        visible={selectorVisible}
        members={availableMembers}
        onSelect={handleAssignment}
        onCancel={() => setSelectorVisible(false)}
        multiSelect={true}
      />
    </View>
  );
};
```

---

## Color Schemes

### ApprovalWorkflowCard
- **Priority**: Urgent=#F44336, High=#FF9800, Medium=#FFC107, Low=#9E9E9E
- **Status**: Approved=#4CAF50, Rejected=#F44336, Pending=#FFC107

### CostBreakdownChart
- **Material**: #2196F3 (Blue)
- **Labor**: #4CAF50 (Green)
- **Equipment**: #FF9800 (Orange)
- **Subcontractor**: #9C27B0 (Purple)

### TeamMemberSelector
- **Available**: #4CAF50 (Green dot)
- **Busy**: #FFC107 (Yellow dot)
- **Offline**: #9E9E9E (Gray dot)

### ResourceAllocationGrid
- **<50%**: #C8E6C9 (Light green - under-utilized)
- **50-90%**: #FFF9C4 (Light yellow - optimal)
- **90-100%**: #FFCCBC (Light orange - near capacity)
- **>100%**: #FFCDD2 (Light red - overallocated)

---

## TypeScript Type Exports

All components export their data types for easy integration:

```typescript
import type {
  ApprovalWorkflowItem,
  BomItemData,
  CostBreakdownData,
  TeamMember,
  ResourceAllocation,
} from '../shared';

// Use in your component state
const [approvals, setApprovals] = useState<ApprovalWorkflowItem[]>([]);
const [costData, setCostData] = useState<CostBreakdownData | null>(null);
const [team, setTeam] = useState<TeamMember[]>([]);
```

---

## Best Practices

1. **Always handle errors** in onSave/onSelect callbacks
2. **Use TypeScript types** for type safety
3. **Provide meaningful titles** for modal components
4. **Handle empty states** gracefully
5. **Use compact mode** in space-constrained layouts
6. **Implement loading states** during async operations
7. **Show user feedback** (snackbars) after actions
8. **Test with various data** (empty, small, large datasets)

---

## Troubleshooting

**Issue: Component not rendering**
- Check import path is correct
- Verify all required props are provided
- Check console for TypeScript errors

**Issue: Modal not closing**
- Ensure visible prop is controlled by state
- Verify onCancel updates the state

**Issue: Styles look wrong**
- Components use absolute positioning for dropdowns
- Ensure parent has proper flex layout

**Issue: TypeScript errors**
- Import types explicitly
- Use `as const` for literal types (priority, status, etc.)

---

**Document Version:** 1.0
**Last Updated:** 2026-01-03
**Components:** 5 shared components ready for production use
