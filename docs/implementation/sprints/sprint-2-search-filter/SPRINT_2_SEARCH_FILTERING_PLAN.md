# Sprint 2: Search & Filtering Implementation Plan

**Project:** Construction Site Progress Tracker - v2.1
**Sprint:** UX Improvements - Sprint 2 (Search & Filtering Part 1)
**Branch:** feature/v2.1
**Estimated Duration:** 5-7 days
**Priority:** Critical
**Impact:** Makes app production-viable for large projects (100+ items/sites/reports)

---

## 📊 Executive Summary

### Problem Statement
- No search functionality anywhere in the app
- Unusable with 100+ items/sites/reports
- Users must scroll through long lists
- No way to filter by status, date, phase, etc.

### Solution Overview
- Add search bars to all major list screens
- Add filter chips for common filters (status, phase, date)
- Add sort options (date, name, status, progress)
- Debounced search for performance
- Reusable components for consistency

### Expected Impact
- **Usability:** App becomes production-ready for large datasets
- **Performance:** Debouncing prevents lag
- **User Experience:** Find items quickly without scrolling
- **Consistency:** Same search/filter pattern across all screens

---

## 🎯 Sprint 2 Objectives

### Week 1 Scope (3 Screens)

1. **ItemsManagementScreen** (Supervisor) - 2 days
   - Search by item name
   - Filter by status (not_started, in_progress, completed)
   - Filter by phase (11 phases)
   - Sort by name, date, progress

2. **WBSManagementScreen** (Planning) - 1 day
   - Search by item name or WBS code
   - Enhance existing phase filter
   - Add "Show Critical Path Only" filter
   - Sort by WBS code, name, duration

3. **SiteManagementScreen** (Supervisor) - 1 day
   - Search by site name
   - Filter by active/inactive status
   - Sort by name, creation date

---

## 🏗️ Architecture & Components

### Reusable Components to Create

#### 1. SearchBar Component
**File:** `src/components/SearchBar.tsx`
**Purpose:** Reusable search input with debouncing
**Props:**
```typescript
interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  debounceMs?: number; // Default: 300ms
}
```

**Features:**
- Debounced input (300ms delay)
- Clear button (X icon)
- Search icon
- Material Design styling (React Native Paper)

---

#### 2. FilterChips Component
**File:** `src/components/FilterChips.tsx`
**Purpose:** Reusable filter chip group
**Props:**
```typescript
interface FilterChipsProps {
  filters: FilterOption[];
  selectedFilters: string[];
  onFilterToggle: (filterId: string) => void;
  multiSelect?: boolean; // Default: true
}

interface FilterOption {
  id: string;
  label: string;
  icon?: string;
  color?: string;
}
```

**Features:**
- Multi-select or single-select mode
- Visual selection state
- Chip colors and icons
- "Clear All" button

---

#### 3. SortMenu Component
**File:** `src/components/SortMenu.tsx`
**Purpose:** Reusable sort dropdown menu
**Props:**
```typescript
interface SortMenuProps {
  sortOptions: SortOption[];
  currentSort: string;
  onSortChange: (sortId: string) => void;
  sortDirection?: 'asc' | 'desc';
  onDirectionChange?: (direction: 'asc' | 'desc') => void;
}

interface SortOption {
  id: string;
  label: string;
  icon?: string;
}
```

**Features:**
- Dropdown menu (React Native Paper Menu)
- Visual checkmark for selected sort
- Ascending/descending toggle
- Sort icon button

---

#### 4. FilterBar Component (Composite)
**File:** `src/components/FilterBar.tsx`
**Purpose:** Complete search/filter/sort bar (combines above components)
**Props:**
```typescript
interface FilterBarProps {
  // Search
  searchValue: string;
  onSearchChange: (text: string) => void;
  searchPlaceholder?: string;

  // Filters
  filters?: FilterOption[];
  selectedFilters?: string[];
  onFilterToggle?: (filterId: string) => void;

  // Sort
  sortOptions?: SortOption[];
  currentSort?: string;
  onSortChange?: (sortId: string) => void;

  // Results
  resultCount?: number;
  totalCount?: number;
}
```

**Features:**
- Integrated search + filters + sort
- "X results of Y total" display
- "Clear All" button to reset all filters
- Compact, space-efficient layout

---

## 📱 Screen-by-Screen Implementation

### 1. ItemsManagementScreen (Supervisor)

**Location:** `src/supervisor/ItemsManagementScreen.tsx`
**Current Status:** Uses ScrollView, no search/filter
**Estimated Effort:** 2 days

#### Features to Add

**Search:**
- Search by item name (case-insensitive, includes partial matches)
- Debounced to prevent lag (300ms)

**Filters:**
- Status filter: All, Not Started, In Progress, Completed
- Phase filter: All, 11 project phases (Design, Construction, etc.)
- Multi-select (can filter by multiple phases)

**Sort:**
- Name (A-Z, Z-A)
- Start Date (Earliest, Latest)
- Progress (0-100%, 100-0%)

**UI Layout:**
```
┌─────────────────────────────────────┐
│ [Search items...]           [Sort ▼]│
├─────────────────────────────────────┤
│ [All] [Not Started] [In Progress] […│  ← Status filter chips
├─────────────────────────────────────┤
│ [All Phases] [Design] [Construction]│  ← Phase filter chips (scrollable)
├─────────────────────────────────────┤
│ Showing 12 of 45 items     [Clear]  │  ← Result count
├─────────────────────────────────────┤
│                                      │
│   [Item Card 1]                      │
│   [Item Card 2]                      │
│   ...                                │
│                                      │
└─────────────────────────────────────┘
```

#### Implementation Steps

**Step 1: Add State (0.5 day)**
```typescript
const [searchQuery, setSearchQuery] = useState('');
const [selectedStatus, setSelectedStatus] = useState<string[]>(['all']);
const [selectedPhases, setSelectedPhases] = useState<string[]>(['all']);
const [sortBy, setSortBy] = useState<'name' | 'date' | 'progress'>('name');
const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
```

**Step 2: Add Filtering Logic (0.5 day)**
```typescript
const filteredItems = useMemo(() => {
  let result = items;

  // Search filter
  if (searchQuery.trim()) {
    result = result.filter(item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  // Status filter
  if (!selectedStatus.includes('all')) {
    result = result.filter(item => selectedStatus.includes(item.status));
  }

  // Phase filter
  if (!selectedPhases.includes('all')) {
    result = result.filter(item => selectedPhases.includes(item.phase));
  }

  // Sort
  result = [...result].sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'name') {
      comparison = a.name.localeCompare(b.name);
    } else if (sortBy === 'date') {
      comparison = (a.plannedStartDate || 0) - (b.plannedStartDate || 0);
    } else if (sortBy === 'progress') {
      const progressA = (a.completedQuantity / a.plannedQuantity) * 100 || 0;
      const progressB = (b.completedQuantity / b.plannedQuantity) * 100 || 0;
      comparison = progressA - progressB;
    }
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  return result;
}, [items, searchQuery, selectedStatus, selectedPhases, sortBy, sortDirection]);
```

**Step 3: Add UI Components (0.5 day)**
```typescript
<View style={styles.container}>
  {/* Search Bar */}
  <SearchBar
    value={searchQuery}
    onChangeText={setSearchQuery}
    placeholder="Search items..."
  />

  {/* Status Filter Chips */}
  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
    <FilterChips
      filters={STATUS_FILTERS}
      selectedFilters={selectedStatus}
      onFilterToggle={(id) => {
        if (id === 'all') {
          setSelectedStatus(['all']);
        } else {
          const newFilters = selectedStatus.includes(id)
            ? selectedStatus.filter(f => f !== id)
            : [...selectedStatus.filter(f => f !== 'all'), id];
          setSelectedStatus(newFilters.length === 0 ? ['all'] : newFilters);
        }
      }}
    />
  </ScrollView>

  {/* Phase Filter Chips */}
  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
    <FilterChips
      filters={PHASE_FILTERS}
      selectedFilters={selectedPhases}
      onFilterToggle={(id) => {
        // Same logic as status filter
      }}
    />
  </ScrollView>

  {/* Result Count & Sort */}
  <View style={styles.resultsRow}>
    <Text>Showing {filteredItems.length} of {items.length} items</Text>
    <SortMenu
      sortOptions={SORT_OPTIONS}
      currentSort={sortBy}
      onSortChange={(id) => setSortBy(id as any)}
      sortDirection={sortDirection}
      onDirectionChange={setSortDirection}
    />
  </View>

  {/* Items List */}
  <FlatList
    data={filteredItems}
    renderItem={({ item }) => <ItemCard item={item} />}
    keyExtractor={(item) => item.id}
    ListEmptyComponent={<EmptyState message="No items match your filters" />}
  />
</View>
```

**Step 4: Testing (0.5 day)**
- Test search with various queries
- Test filter combinations (status + phase)
- Test sort by each option
- Test "Clear All" resets everything
- Test with 100+ items (performance)
- Test empty states

---

### 2. WBSManagementScreen (Planning)

**Location:** `src/planning/WBSManagementScreen.tsx`
**Current Status:** Has phase filter, uses ScrollView
**Estimated Effort:** 1 day

#### Features to Add

**Search:**
- Search by item name OR WBS code (e.g., "1.2.3" or "Foundation")

**Filters:**
- Phase filter: Enhance existing chip filter
- Critical Path filter: Show only critical path items (new)
- Status filter: All, Not Started, In Progress, Completed (new)

**Sort:**
- WBS Code (1.0.0.0 → 4.0.0.0)
- Name (A-Z, Z-A)
- Duration (shortest → longest)
- Progress (0% → 100%)

#### Implementation Steps

**Step 1: Add State & Enhance Existing Filter (0.25 day)**
```typescript
const [searchQuery, setSearchQuery] = useState('');
const [showCriticalPathOnly, setShowCriticalPathOnly] = useState(false);
const [selectedStatus, setSelectedStatus] = useState<string[]>(['all']);
// selectedPhase already exists
const [sortBy, setSortBy] = useState<'wbs' | 'name' | 'duration' | 'progress'>('wbs');
```

**Step 2: Add Filtering Logic (0.5 day)**
```typescript
const filteredItems = useMemo(() => {
  let result = items;

  // Search filter (name OR WBS code)
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    result = result.filter(item =>
      item.name.toLowerCase().includes(query) ||
      item.wbsCode.toLowerCase().includes(query)
    );
  }

  // Critical path filter
  if (showCriticalPathOnly) {
    result = result.filter(item => item.isCriticalPath);
  }

  // Status filter
  if (!selectedStatus.includes('all')) {
    result = result.filter(item => selectedStatus.includes(item.status));
  }

  // Phase filter (already exists, keep it)
  if (selectedPhase !== 'all') {
    result = result.filter(item => item.phase === selectedPhase);
  }

  // Sort
  result = [...result].sort((a, b) => {
    if (sortBy === 'wbs') {
      return a.wbsCode.localeCompare(b.wbsCode);
    } else if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    } else if (sortBy === 'duration') {
      const durationA = (a.plannedEndDate - a.plannedStartDate) / (1000 * 60 * 60 * 24);
      const durationB = (b.plannedEndDate - b.plannedStartDate) / (1000 * 60 * 60 * 24);
      return durationA - durationB;
    } else if (sortBy === 'progress') {
      const progressA = (a.completedQuantity / a.plannedQuantity) * 100 || 0;
      const progressB = (b.completedQuantity / b.plannedQuantity) * 100 || 0;
      return progressA - progressB;
    }
    return 0;
  });

  return result;
}, [items, searchQuery, showCriticalPathOnly, selectedStatus, selectedPhase, sortBy]);
```

**Step 3: Update UI (0.25 day)**
- Add SearchBar above existing phase filter
- Add "Critical Path Only" toggle chip
- Add Status filter chips
- Add SortMenu in header
- Update item count display

---

### 3. SiteManagementScreen (Supervisor)

**Location:** `src/supervisor/SiteManagementScreen.tsx`
**Current Status:** Simple list, no search/filter
**Estimated Effort:** 1 day

#### Features to Add

**Search:**
- Search by site name (case-insensitive)

**Filters:**
- Status: All, Active, Inactive
- Supervisor: All, Assigned, Unassigned

**Sort:**
- Name (A-Z, Z-A)
- Creation Date (Newest, Oldest)

#### Implementation Steps

Similar to ItemsManagementScreen but simpler (fewer filters).

**Step 1: Add State (0.25 day)**
**Step 2: Add Filtering Logic (0.25 day)**
**Step 3: Add UI Components (0.25 day)**
**Step 4: Testing (0.25 day)**

---

## 📦 Component Implementation Details

### SearchBar Component

**File:** `src/components/SearchBar.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Searchbar as PaperSearchbar } from 'react-native-paper';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  debounceMs?: number;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  placeholder = 'Search...',
  debounceMs = 300,
}) => {
  const [localValue, setLocalValue] = useState(value);

  // Debounce logic
  useEffect(() => {
    const timer = setTimeout(() => {
      onChangeText(localValue);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [localValue, debounceMs, onChangeText]);

  // Sync external changes
  useEffect(() => {
    if (value !== localValue) {
      setLocalValue(value);
    }
  }, [value]);

  return (
    <View style={styles.container}>
      <PaperSearchbar
        placeholder={placeholder}
        value={localValue}
        onChangeText={setLocalValue}
        style={styles.searchbar}
        iconColor="#666"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchbar: {
    elevation: 2,
  },
});
```

---

### FilterChips Component

**File:** `src/components/FilterChips.tsx`

```typescript
import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Chip } from 'react-native-paper';

export interface FilterOption {
  id: string;
  label: string;
  icon?: string;
  color?: string;
}

interface FilterChipsProps {
  filters: FilterOption[];
  selectedFilters: string[];
  onFilterToggle: (filterId: string) => void;
  multiSelect?: boolean;
}

export const FilterChips: React.FC<FilterChipsProps> = ({
  filters,
  selectedFilters,
  onFilterToggle,
  multiSelect = true,
}) => {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {filters.map((filter) => (
          <Chip
            key={filter.id}
            selected={selectedFilters.includes(filter.id)}
            onPress={() => onFilterToggle(filter.id)}
            style={[
              styles.chip,
              selectedFilters.includes(filter.id) && styles.chipSelected,
            ]}
            icon={filter.icon}
            textStyle={styles.chipText}
          >
            {filter.label}
          </Chip>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    marginRight: 8,
  },
  chipSelected: {
    backgroundColor: '#2196F3',
  },
  chipText: {
    fontSize: 12,
  },
});
```

---

### SortMenu Component

**File:** `src/components/SortMenu.tsx`

```typescript
import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Menu, IconButton, Text } from 'react-native-paper';

export interface SortOption {
  id: string;
  label: string;
  icon?: string;
}

interface SortMenuProps {
  sortOptions: SortOption[];
  currentSort: string;
  onSortChange: (sortId: string) => void;
  sortDirection?: 'asc' | 'desc';
  onDirectionChange?: (direction: 'asc' | 'desc') => void;
}

export const SortMenu: React.FC<SortMenuProps> = ({
  sortOptions,
  currentSort,
  onSortChange,
  sortDirection = 'asc',
  onDirectionChange,
}) => {
  const [visible, setVisible] = useState(false);

  const currentOption = sortOptions.find((opt) => opt.id === currentSort);

  return (
    <View style={styles.container}>
      <Menu
        visible={visible}
        onDismiss={() => setVisible(false)}
        anchor={
          <IconButton
            icon="sort"
            onPress={() => setVisible(true)}
            style={styles.button}
          />
        }
      >
        {sortOptions.map((option) => (
          <Menu.Item
            key={option.id}
            title={option.label}
            onPress={() => {
              onSortChange(option.id);
              setVisible(false);
            }}
            leadingIcon={option.icon}
            trailingIcon={currentSort === option.id ? 'check' : undefined}
          />
        ))}

        {onDirectionChange && (
          <>
            <Menu.Item title="" disabled /> {/* Divider */}
            <Menu.Item
              title="Ascending"
              onPress={() => {
                onDirectionChange('asc');
                setVisible(false);
              }}
              trailingIcon={sortDirection === 'asc' ? 'check' : undefined}
            />
            <Menu.Item
              title="Descending"
              onPress={() => {
                onDirectionChange('desc');
                setVisible(false);
              }}
              trailingIcon={sortDirection === 'desc' ? 'check' : undefined}
            />
          </>
        )}
      </Menu>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  button: {
    margin: 0,
  },
});
```

---

## 🧪 Testing Strategy

### Unit Tests (Optional - if time permits)

**Test Files to Create:**
- `__tests__/components/SearchBar.test.tsx`
- `__tests__/components/FilterChips.test.tsx`
- `__tests__/components/SortMenu.test.tsx`

**Test Cases:**
- SearchBar debouncing works
- FilterChips multi-select logic
- SortMenu selection updates

### Manual Testing (Required)

**Test Plan:** `SPRINT_2_MANUAL_TEST_PLAN.md` (to be created)

**Test Scenarios:**

1. **Search Functionality**
   - [ ] Empty search shows all items
   - [ ] Search with partial match works
   - [ ] Search is case-insensitive
   - [ ] Search with no results shows empty state
   - [ ] Clearing search shows all items

2. **Filter Functionality**
   - [ ] Single filter works (status only)
   - [ ] Multiple filters work (status + phase)
   - [ ] "All" filter resets other filters
   - [ ] Filter count updates correctly
   - [ ] "Clear All" resets all filters

3. **Sort Functionality**
   - [ ] Sort by name works (A-Z, Z-A)
   - [ ] Sort by date works (earliest, latest)
   - [ ] Sort by progress works (0-100%, 100-0%)
   - [ ] Sort persists when filtering

4. **Performance**
   - [ ] No lag with 100+ items
   - [ ] Debouncing prevents excessive filtering
   - [ ] Smooth scrolling with filtered results

5. **Integration**
   - [ ] Search + filter + sort work together
   - [ ] Filters persist when navigating away and back
   - [ ] Clear all resets everything correctly

---

## 📋 Implementation Checklist

### Day 1: Reusable Components (1 day)

- [ ] Create `SearchBar.tsx` component
- [ ] Create `FilterChips.tsx` component
- [ ] Create `SortMenu.tsx` component
- [ ] Test components in isolation
- [ ] Document component APIs

### Day 2-3: ItemsManagementScreen (2 days)

- [ ] Add search state and logic
- [ ] Add filter state and logic (status, phase)
- [ ] Add sort state and logic
- [ ] Integrate SearchBar component
- [ ] Integrate FilterChips component
- [ ] Integrate SortMenu component
- [ ] Add result count display
- [ ] Add "Clear All" button
- [ ] Test with various filter combinations
- [ ] Test with 100+ items

### Day 4: WBSManagementScreen (1 day)

- [ ] Add search state and logic (name + WBS code)
- [ ] Enhance existing phase filter
- [ ] Add "Critical Path Only" filter
- [ ] Add status filter
- [ ] Add sort options
- [ ] Update UI with new components
- [ ] Test search by WBS code
- [ ] Test critical path filter

### Day 5: SiteManagementScreen (1 day)

- [ ] Add search state and logic
- [ ] Add status filter (active/inactive)
- [ ] Add supervisor filter
- [ ] Add sort options
- [ ] Integrate components
- [ ] Test all features
- [ ] Performance test

### Day 6: Testing & Polish (1 day)

- [ ] Create manual test plan
- [ ] Execute all test scenarios
- [ ] Fix any bugs found
- [ ] Performance optimization
- [ ] Update documentation
- [ ] Commit and push changes

### Day 7: Documentation & PR (1 day)

- [ ] Update README.md with search/filter features
- [ ] Create SPRINT_2_COMPLETION_REPORT.md
- [ ] Update PLANNING_MASTER_STATUS.md
- [ ] Create PR for review
- [ ] Demo to stakeholders

---

## 📈 Success Metrics

### Quantitative Metrics

- [ ] Search works in <300ms (debouncing)
- [ ] No lag with 500+ items
- [ ] Filter logic executes in <100ms
- [ ] All 3 screens have search/filter/sort

### Qualitative Metrics

- [ ] Users can find items quickly
- [ ] Filter combinations make sense
- [ ] UI is intuitive and consistent
- [ ] Empty states are clear and helpful

---

## 🚧 Known Limitations & Future Work

### Sprint 2 Scope Limits

**What's NOT included in Sprint 2:**
- Date range filters (reserved for Sprint 3)
- Saved filter presets (reserved for Sprint 3)
- Advanced filters (e.g., filter by supervisor name)
- ReportsHistoryScreen, MaterialTrackingScreen, HindranceReportScreen (Sprint 3)

### Future Enhancements (Sprint 3)

**Sprint 3: Search & Filtering Part 2 (Week 2)**
1. ReportsHistoryScreen - Date range filter
2. MaterialTrackingScreen - Item selector, status filter
3. HindranceReportScreen - Date range, priority filter
4. Saved filter presets
5. Quick filter buttons ("Last 7 days", "This month")

---

## 📚 Reference Documents

### Related Documentation
- **PLANNING_MASTER_STATUS.md** - Sprint 2 overview (lines 1062-1162)
- **ARCHITECTURE_UNIFIED.md** - UI component patterns
- **SNACKBAR_SYSTEM_GUIDE.md** - Component design patterns

### Git Strategy
- **Branch:** feature/v2.1
- **Base Branch:** main
- **Merge Target:** main (after testing)

### Commit Message Format
```
feat: Implement search/filter for [Screen Name] (Sprint 2 - Day X)

- Add SearchBar component with debouncing
- Add FilterChips for status/phase filtering
- Add SortMenu with multiple sort options
- Update [Screen] with filter logic

Files created:
- src/components/SearchBar.tsx
- src/components/FilterChips.tsx
- src/components/SortMenu.tsx

Files modified:
- src/[module]/[Screen].tsx

Testing: Manual testing completed, 100% test cases passed

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

---

## 🎯 Ready to Start

**Next Steps:**

1. Review this plan and confirm scope
2. Start Day 1: Create reusable components
3. Follow daily checklist sequentially
4. Test each screen before moving to next
5. Create PR after Day 7 completion

**Estimated Completion:** 7 days from start
**Current Branch:** feature/v2.1 (ready)
**Status:** 🟢 READY TO BEGIN

---

**Document Created:** October 23, 2025
**Sprint Start:** To be confirmed
**Sprint End:** Start + 7 days
**Status:** 🟢 PLAN APPROVED - Ready for Implementation

---

**END OF SPRINT 2 PLAN**
