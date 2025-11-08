# Materials Tracking - Fix Plan

**Issue**: BOM not displaying in Materials Tracking screen
**Reference**: Test Case 2.1 - FAIL
**Priority**: P0 - Critical
**Date**: User Feedback Session

---

## Root Cause Analysis

### Issue 1: No BOMs Created
**Finding**: MaterialTrackingScreen shows "No active BOMs found for this project"

**Root Cause**:
- BOMs are created in Manager tab, not Logistics tab
- User doesn't know how to create BOMs
- No guidance or "Create BOM" button in Materials screen

**Evidence**:
```typescript
// Line 566-575 in MaterialTrackingScreen.tsx
if (boms.length === 0) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateTitle}>No Active BOMs</Text>
      <Text style={styles.emptyStateText}>
        No active BOMs found for this project. Create a BOM in the Manager tab...
      </Text>
    </View>
  );
}
```

### Issue 2: Mock Data Not Available
**Finding**: No sample/mock BOMs loaded for testing

**Root Cause**:
- Logistics screens use real database data
- No test/sample BOMs pre-loaded
- Cannot test without creating BOMs first

### Issue 3: Data Flow Not Clear
**Finding**: User doesn't understand where data comes from

**Root Cause**:
- No documentation of data flow
- No visual indicators of data source
- No "how to get started" guide

---

## Fix Strategy

### Approach: Multi-Pronged Fix

**Phase 1: Immediate Fixes** (Today)
1. Add "Create BOM" button in Materials screen
2. Add sample/mock BOMs for testing
3. Improve empty state with actionable guidance
4. Add data source indicators

**Phase 2: User Experience** (Tomorrow)
1. Create BOM creation workflow in Logistics
2. Add import BOM from Excel
3. Add BOM templates for Metro Railway projects
4. Guided tour for first-time users

**Phase 3: Testing** (After fixes)
1. Automated tests for BOM display
2. Manual testing with mock data
3. End-to-end workflow testing
4. Documentation updates

---

## Detailed Fix Plan

### Fix 1: Add Mock BOM Data for Testing

**File**: `src/data/mockBOMs.ts` (NEW)

**Purpose**: Provide sample BOMs for Metro Railway projects

**Content**:
```typescript
export const mockBOMs = [
  {
    id: 'bom-station-a-civil',
    name: 'Station A - Civil Works',
    type: 'execution',
    projectId: 'project-1',
    status: 'active',
    items: [
      {
        itemCode: 'CEM-001',
        description: 'Cement OPC 53 Grade',
        quantity: 500,
        unit: 'MT',
        category: 'Civil',
      },
      {
        itemCode: 'STL-001',
        description: 'TMT Steel Bars 12mm',
        quantity: 50,
        unit: 'MT',
        category: 'Civil',
      },
      // ... more items
    ],
  },
  {
    id: 'bom-ocs-section-1',
    name: 'OCS - Section 1 (5km)',
    type: 'execution',
    projectId: 'project-1',
    status: 'active',
    items: [
      {
        itemCode: 'OCS-CW-107',
        description: 'Contact Wire Copper 107mm²',
        quantity: 10,
        unit: 'km',
        category: 'OCS',
      },
      {
        itemCode: 'OCS-CAT-95',
        description: 'Catenary Wire Copper 95mm²',
        quantity: 10,
        unit: 'km',
        category: 'OCS',
      },
      {
        itemCode: 'OCS-MAST',
        description: 'Steel Mast for OCS',
        quantity: 200,
        unit: 'Nos',
        category: 'OCS',
      },
      // ... more items
    ],
  },
];
```

**Implementation**:
1. Create mock data file
2. Load in LogisticsContext if no real BOMs exist
3. Add toggle to switch between mock and real data

---

### Fix 2: Improve Empty State with Guidance

**File**: `src/logistics/MaterialTrackingScreen.tsx`

**Changes**:
```typescript
// OLD (lines 566-575)
if (boms.length === 0) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateTitle}>No Active BOMs</Text>
      <Text style={styles.emptyStateText}>
        No active BOMs found for this project. Create a BOM in the Manager tab...
      </Text>
    </View>
  );
}

// NEW
if (boms.length === 0) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateIcon}>📋</Text>
      <Text style={styles.emptyStateTitle}>No Bills of Materials (BOMs)</Text>
      <Text style={styles.emptyStateText}>
        To track materials, you need to create a Bill of Materials (BOM) first.
      </Text>
      <Text style={styles.emptyStateSubtext}>
        A BOM lists all materials required for a work package or project phase.
      </Text>

      <View style={styles.emptyStateActions}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleCreateBOM}
        >
          <Text style={styles.primaryButtonText}>
            + Create New BOM
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleLoadSampleData}
        >
          <Text style={styles.secondaryButtonText}>
            📊 Load Sample Data (for testing)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={handleShowGuide}
        >
          <Text style={styles.linkButtonText}>
            ℹ️ How to create a BOM?
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
```

**Benefits**:
- Clear explanation of what BOMs are
- Actionable buttons (Create, Load Sample, Learn)
- Better UX for first-time users

---

### Fix 3: Add "Create BOM" Modal

**File**: `src/logistics/components/CreateBOMModal.tsx` (NEW)

**Purpose**: Allow users to create BOMs directly from Materials screen

**Features**:
- Simple form for BOM details
- Add materials line-by-line
- Import from Excel template
- Save to database

**UI Flow**:
1. User clicks "Create New BOM"
2. Modal opens with form:
   - BOM Name (e.g., "Station A - Civil Works")
   - Work Package Code
   - Project (pre-selected)
   - Description
3. Add Materials section:
   - Material Code (search existing or create new)
   - Description
   - Quantity
   - Unit
   - Category
   - Add/Remove rows
4. Save button creates BOM and items
5. Returns to Materials screen with new BOM loaded

---

### Fix 4: Add Data Source Indicators

**File**: `src/logistics/MaterialTrackingScreen.tsx`

**Changes**: Add header showing data source

```typescript
const renderDataSourceIndicator = () => {
  return (
    <View style={styles.dataSourceBanner}>
      <Text style={styles.dataSourceLabel}>
        Data Source:
      </Text>
      <View style={styles.dataSourceValue}>
        <Text style={styles.dataSourceText}>
          {bomItems.length > 0
            ? `${boms.length} Active BOMs`
            : 'No BOMs Loaded'}
        </Text>
        {__DEV__ && (
          <TouchableOpacity onPress={toggleMockData}>
            <Text style={styles.debugLink}>
              [{usingMockData ? 'Using Mock Data' : 'Using Real Data'}]
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};
```

**Benefits**:
- Users see where data comes from
- Developers can toggle mock data easily
- Clear indication of data state

---

### Fix 5: Add Material Category Filters

**File**: `src/logistics/MaterialTrackingScreen.tsx`

**Issue**: Filters not working (Test Case 2.1)

**Root Cause**: No category filter UI implemented

**Fix**: Add category chips above material list

```typescript
const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

const MATERIAL_CATEGORIES = [
  { id: 'all', name: 'All', icon: '📦' },
  { id: 'civil', name: 'Civil', icon: '🏗️' },
  { id: 'track', name: 'Track', icon: '🛤️' },
  { id: 'ocs', name: 'OCS', icon: '⚡' },
  { id: 'electrical', name: 'Electrical', icon: '🔌' },
  { id: 'signaling', name: 'Signaling', icon: '🚦' },
  { id: 'mep', name: 'MEP', icon: '🔧' },
];

const renderCategoryFilters = () => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.categoryFilters}
    >
      {MATERIAL_CATEGORIES.map(category => (
        <TouchableOpacity
          key={category.id}
          style={[
            styles.categoryChip,
            selectedCategory === category.id && styles.categoryChipActive
          ]}
          onPress={() => setSelectedCategory(
            selectedCategory === category.id ? null : category.id
          )}
        >
          <Text style={styles.categoryIcon}>{category.icon}</Text>
          <Text style={[
            styles.categoryName,
            selectedCategory === category.id && styles.categoryNameActive
          ]}>
            {category.name}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

// Update filteredRequirements to include category filter
const filteredRequirements = React.useMemo(() => {
  let filtered = materialRequirements;

  // Category filter
  if (selectedCategory && selectedCategory !== 'all') {
    filtered = filtered.filter(req =>
      req.category?.toLowerCase() === selectedCategory.toLowerCase()
    );
  }

  // View mode filter
  if (viewMode === 'shortages') {
    filtered = shortages;
  }

  // Search filter
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(
      (req) =>
        req.itemCode.toLowerCase().includes(query) ||
        req.description.toLowerCase().includes(query)
    );
  }

  return filtered;
}, [materialRequirements, shortages, viewMode, searchQuery, selectedCategory]);
```

**Benefits**:
- Easy filtering by Metro Railway categories
- Visual category indicators
- Working filters as per Test Case 2.1

---

### Fix 6: Add Search Functionality

**File**: `src/logistics/MaterialTrackingScreen.tsx`

**Issue**: Search not visible/working

**Fix**: Ensure search bar is prominent and functional

```typescript
const renderSearchBar = () => {
  return (
    <View style={styles.searchContainer}>
      <TextInput
        style={styles.searchInput}
        placeholder="Search materials (code or description)..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        returnKeyType="search"
        clearButtonMode="while-editing"
      />
      {searchQuery.length > 0 && (
        <TouchableOpacity
          style={styles.clearButton}
          onPress={() => setSearchQuery('')}
        >
          <Text style={styles.clearButtonText}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};
```

**Place**: Above category filters, below stats cards

---

## Testing Plan

### Automated Tests

**File**: `__tests__/logistics/MaterialTrackingScreen.test.ts` (NEW)

**Test Cases**:
1. Renders empty state when no BOMs
2. Shows "Create BOM" button when no BOMs
3. Loads and displays mock BOM data
4. Filters materials by category
5. Searches materials by code/description
6. Switches between view modes (Requirements/Shortages/Procurement)
7. Calculates statistics correctly

**Example Test**:
```typescript
describe('MaterialTrackingScreen', () => {
  it('should show empty state when no BOMs exist', () => {
    const { getByText } = render(<MaterialTrackingScreen />);
    expect(getByText('No Bills of Materials (BOMs)')).toBeTruthy();
    expect(getByText('+ Create New BOM')).toBeTruthy();
  });

  it('should display BOMs when loaded', () => {
    // Load mock BOMs
    const { getByText } = render(<MaterialTrackingScreen />);
    fireEvent.press(getByText('Load Sample Data'));

    expect(getByText('Station A - Civil Works')).toBeTruthy();
    expect(getByText('Cement OPC 53 Grade')).toBeTruthy();
  });

  it('should filter materials by category', () => {
    const { getByText, queryByText } = render(<MaterialTrackingScreen />);

    // Load data first
    fireEvent.press(getByText('Load Sample Data'));

    // Filter by OCS
    fireEvent.press(getByText('OCS'));

    expect(getByText('Contact Wire')).toBeTruthy();
    expect(queryByText('Cement')).toBeNull();
  });
});
```

### Manual Testing

**Test Case 2.1 - Material Requirements View** (UPDATED)

**Pre-requisites**:
1. Open Materials Tracking screen
2. Select a project

**Scenario A: No BOMs exist**
1. Verify empty state displays
2. Verify "Create New BOM" button visible
3. Click "Load Sample Data (for testing)"
4. Verify sample BOMs load
5. Verify materials list displays
6. **Expected**: BOMs load, materials show

**Scenario B: With BOMs**
1. Materials list displays with:
   - Material code and description ✓
   - Required vs Available quantity ✓
   - Shortage indicators (red) ✓
   - Category badges ✓
2. Click category filters (Civil, OCS, etc.)
3. Verify list filters correctly ✓
4. Type in search box
5. Verify search works ✓
6. **Expected**: All features functional

**Pass Criteria**:
- Empty state shows guidance
- Sample data loads successfully
- Materials display with all info
- Filters work
- Search works

---

## Implementation Timeline

**Day 1 (Today)**:
- [x] Create mockBOMs.ts with Metro Railway sample data
- [ ] Update MaterialTrackingScreen empty state
- [ ] Add category filters
- [ ] Fix search bar visibility
- [ ] Add data source indicator
- [ ] Write automated tests
- [ ] Manual testing

**Day 2 (Tomorrow)**:
- [ ] Create CreateBOMModal component
- [ ] Add BOM creation workflow
- [ ] Add Excel import for BOMs
- [ ] Add BOM templates
- [ ] Integration testing

---

## Success Criteria

✅ **Fix Complete When**:
1. Test Case 2.1 PASSES
2. BOMs display when loaded
3. Category filters work
4. Search works
5. Empty state is helpful
6. Sample data available for testing
7. Automated tests pass
8. Manual test updated and passing

---

**Status**: Ready to implement
**Next Step**: Create mock BOM data
**Owner**: Development Team
