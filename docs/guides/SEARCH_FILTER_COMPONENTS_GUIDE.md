# Search & Filter Components Guide

**Version:** v2.1
**Created:** October 23, 2025
**Sprint:** Sprint 2 - Search & Filtering (Day 1)
**Status:** ✅ Complete

---

## 📋 Overview

This guide documents the three reusable components created for Sprint 2: Search & Filtering functionality. These components provide a consistent, performant way to add search, filter, and sort capabilities to any list screen in the app.

---

## 🎯 Components Overview

| Component | Purpose | File | Lines |
|-----------|---------|------|-------|
| **SearchBar** | Debounced search input | `src/components/SearchBar.tsx` | 78 |
| **FilterChips** | Multi-select filter chips | `src/components/FilterChips.tsx` | 128 |
| **SortMenu** | Dropdown sort menu | `src/components/SortMenu.tsx` | 149 |

---

## 🔍 SearchBar Component

### Purpose
A reusable search input with debouncing to prevent excessive filtering operations. Uses React Native Paper's Searchbar for consistent Material Design styling.

### Props

```typescript
interface SearchBarProps {
  value: string;           // Current search value (controlled)
  onChangeText: (text: string) => void;  // Callback fired after debounce delay
  placeholder?: string;    // Placeholder text (default: "Search...")
  debounceMs?: number;     // Debounce delay in ms (default: 300ms)
}
```

### Features

- ✅ **Debouncing:** Delays `onChangeText` callback by 300ms (configurable)
- ✅ **Prevents Lag:** Avoids excessive re-filtering while user types
- ✅ **Material Design:** Uses React Native Paper's Searchbar
- ✅ **Clear Button:** Shows "X" icon to clear search
- ✅ **Controlled Component:** Parent manages the search value

### Usage Example

```typescript
import { SearchBar } from '../components';

const MyScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <SearchBar
      value={searchQuery}
      onChangeText={setSearchQuery}
      placeholder="Search items..."
      debounceMs={300}
    />
  );
};
```

### How Debouncing Works

1. User types in search field
2. Local state updates immediately (no lag in UI)
3. Timer starts (300ms)
4. If user types again, timer resets
5. After 300ms of no typing, `onChangeText` fires
6. Parent component filters the list

**Result:** Smooth typing experience, no lag, fewer filter operations.

### Styling

The SearchBar uses Paper's default styling with:
- White background
- Elevation shadow (2dp)
- 16px horizontal padding
- 8px vertical padding
- Gray search icon (#666)

---

## 🏷️ FilterChips Component

### Purpose
A reusable filter chip group with multi-select or single-select mode. Displays horizontally scrollable chips for filtering list data.

### Props

```typescript
interface FilterChipsProps {
  filters: FilterOption[];        // Array of filter options
  selectedFilters: string[];      // Currently selected filter IDs
  onFilterToggle: (filterId: string) => void;  // Toggle callback
  multiSelect?: boolean;          // Allow multiple selections (default: true)
}

interface FilterOption {
  id: string;          // Unique filter ID
  label: string;       // Display text
  icon?: string;       // Material Community Icon name
  color?: string;      // Custom color when selected
}
```

### Features

- ✅ **Multi-Select Mode:** Select multiple filters at once (default)
- ✅ **Single-Select Mode:** Only one filter active at a time
- ✅ **Horizontal Scroll:** Scrollable chip list for many filters
- ✅ **Visual Selection:** Selected chips highlighted in blue
- ✅ **Icon Support:** Optional icons for each filter
- ✅ **Custom Colors:** Override selection color per filter

### Usage Example

#### Status Filter (Multi-Select)

```typescript
import { FilterChips, FilterOption } from '../components';

const STATUS_FILTERS: FilterOption[] = [
  { id: 'all', label: 'All' },
  { id: 'not_started', label: 'Not Started', icon: 'circle-outline' },
  { id: 'in_progress', label: 'In Progress', icon: 'progress-clock' },
  { id: 'completed', label: 'Completed', icon: 'check-circle' },
];

const MyScreen = () => {
  const [selectedStatus, setSelectedStatus] = useState(['all']);

  const handleStatusToggle = (id: string) => {
    if (id === 'all') {
      setSelectedStatus(['all']);
    } else {
      const newFilters = selectedStatus.includes(id)
        ? selectedStatus.filter(f => f !== id && f !== 'all')
        : [...selectedStatus.filter(f => f !== 'all'), id];
      setSelectedStatus(newFilters.length === 0 ? ['all'] : newFilters);
    }
  };

  return (
    <FilterChips
      filters={STATUS_FILTERS}
      selectedFilters={selectedStatus}
      onFilterToggle={handleStatusToggle}
      multiSelect={true}
    />
  );
};
```

#### Phase Filter (Multi-Select with Colors)

```typescript
const PHASE_FILTERS: FilterOption[] = [
  { id: 'all', label: 'All Phases' },
  { id: 'design', label: 'Design', icon: 'pencil-ruler', color: '#9C27B0' },
  { id: 'procurement', label: 'Procurement', icon: 'cart', color: '#FF9800' },
  { id: 'construction', label: 'Construction', icon: 'hammer', color: '#4CAF50' },
  { id: 'finishing', label: 'Finishing', icon: 'brush', color: '#2196F3' },
];

<FilterChips
  filters={PHASE_FILTERS}
  selectedFilters={selectedPhases}
  onFilterToggle={handlePhaseToggle}
/>
```

### Multi-Select Logic Pattern

The parent component handles the "All" logic:

```typescript
const handleFilterToggle = (id: string) => {
  if (id === 'all') {
    // Selecting "All" clears other selections
    setSelectedFilters(['all']);
  } else {
    // Selecting specific filter removes "All"
    const newFilters = selectedFilters.includes(id)
      ? selectedFilters.filter(f => f !== id)  // Deselect
      : [...selectedFilters.filter(f => f !== 'all'), id];  // Add + remove "All"

    // If nothing selected, default to "All"
    setSelectedFilters(newFilters.length === 0 ? ['all'] : newFilters);
  }
};
```

### Styling

- **Unselected Chips:** White background, gray border, gray text
- **Selected Chips:** Blue background (#2196F3), white text, bold
- **Custom Color:** Uses `filter.color` when selected (overrides blue)
- **Spacing:** 8px gap between chips, 16px horizontal padding
- **Scrolling:** Horizontal scroll without scroll indicator

---

## 📊 SortMenu Component

### Purpose
A reusable dropdown menu for sorting list data with optional direction toggle. Uses React Native Paper's Menu component.

### Props

```typescript
interface SortMenuProps {
  sortOptions: SortOption[];      // Array of sort options
  currentSort: string;            // Currently selected sort ID
  onSortChange: (sortId: string) => void;  // Sort change callback
  sortDirection?: 'asc' | 'desc'; // Current direction (default: 'asc')
  onDirectionChange?: (direction: 'asc' | 'desc') => void;  // Optional direction callback
}

interface SortOption {
  id: string;          // Unique sort ID
  label: string;       // Display text
  icon?: string;       // Material Community Icon name
}
```

### Features

- ✅ **Dropdown Menu:** Opens on icon button press
- ✅ **Visual Selection:** Checkmark for selected sort
- ✅ **Direction Toggle:** Optional ascending/descending
- ✅ **Icon Support:** Icons for each sort option
- ✅ **Auto-Close:** Menu closes after selection
- ✅ **Dynamic Icon:** Button icon changes based on direction

### Usage Example

#### Basic Sort (No Direction Toggle)

```typescript
import { SortMenu, SortOption } from '../components';

const SORT_OPTIONS: SortOption[] = [
  { id: 'name', label: 'Name', icon: 'format-letter-case' },
  { id: 'date', label: 'Date', icon: 'calendar' },
  { id: 'progress', label: 'Progress', icon: 'chart-line' },
];

const MyScreen = () => {
  const [sortBy, setSortBy] = useState('name');

  return (
    <SortMenu
      sortOptions={SORT_OPTIONS}
      currentSort={sortBy}
      onSortChange={setSortBy}
    />
  );
};
```

#### Sort with Direction Toggle

```typescript
const MyScreen = () => {
  const [sortBy, setSortBy] = useState('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  return (
    <SortMenu
      sortOptions={SORT_OPTIONS}
      currentSort={sortBy}
      onSortChange={setSortBy}
      sortDirection={sortDirection}
      onDirectionChange={setSortDirection}
    />
  );
};
```

### Menu Structure

When opened, the menu shows:

1. **Sort Options** (top section)
   - Each option with icon and label
   - Checkmark on selected option

2. **Divider** (if direction toggle enabled)

3. **Direction Options** (bottom section)
   - "Ascending" with sort-ascending icon
   - "Descending" with sort-descending icon
   - Checkmark on current direction

### Icon Behavior

The button icon changes based on state:

- No direction toggle: `sort` icon
- Direction = ascending: `sort-ascending` icon
- Direction = descending: `sort-descending` icon

### Styling

- IconButton: 24px size, no margin
- Menu anchors to button
- Menu items: standard Paper styling
- Divider: 1px gray line between sections

---

## 🎨 Complete Screen Integration Example

Here's how to use all three components together:

```typescript
import React, { useState, useMemo } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { SearchBar, FilterChips, SortMenu, FilterOption, SortOption } from '../components';

// Define filters
const STATUS_FILTERS: FilterOption[] = [
  { id: 'all', label: 'All' },
  { id: 'not_started', label: 'Not Started' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'completed', label: 'Completed' },
];

const PHASE_FILTERS: FilterOption[] = [
  { id: 'all', label: 'All Phases' },
  { id: 'design', label: 'Design' },
  { id: 'construction', label: 'Construction' },
  { id: 'finishing', label: 'Finishing' },
];

const SORT_OPTIONS: SortOption[] = [
  { id: 'name', label: 'Name', icon: 'format-letter-case' },
  { id: 'date', label: 'Date', icon: 'calendar' },
  { id: 'progress', label: 'Progress', icon: 'chart-line' },
];

const MyListScreen = () => {
  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Filter state
  const [selectedStatus, setSelectedStatus] = useState(['all']);
  const [selectedPhases, setSelectedPhases] = useState(['all']);

  // Sort state
  const [sortBy, setSortBy] = useState('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Your data
  const [items, setItems] = useState([/* ... */]);

  // Combined filtering and sorting logic
  const filteredItems = useMemo(() => {
    let result = items;

    // 1. Search filter
    if (searchQuery.trim()) {
      result = result.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // 2. Status filter
    if (!selectedStatus.includes('all')) {
      result = result.filter(item => selectedStatus.includes(item.status));
    }

    // 3. Phase filter
    if (!selectedPhases.includes('all')) {
      result = result.filter(item => selectedPhases.includes(item.phase));
    }

    // 4. Sort
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

  // Filter toggle handlers
  const handleStatusToggle = (id: string) => {
    if (id === 'all') {
      setSelectedStatus(['all']);
    } else {
      const newFilters = selectedStatus.includes(id)
        ? selectedStatus.filter(f => f !== id && f !== 'all')
        : [...selectedStatus.filter(f => f !== 'all'), id];
      setSelectedStatus(newFilters.length === 0 ? ['all'] : newFilters);
    }
  };

  const handlePhaseToggle = (id: string) => {
    if (id === 'all') {
      setSelectedPhases(['all']);
    } else {
      const newFilters = selectedPhases.includes(id)
        ? selectedPhases.filter(f => f !== id && f !== 'all')
        : [...selectedPhases.filter(f => f !== 'all'), id];
      setSelectedPhases(newFilters.length === 0 ? ['all'] : newFilters);
    }
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedStatus(['all']);
    setSelectedPhases(['all']);
    setSortBy('name');
    setSortDirection('asc');
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search items..."
      />

      {/* Status Filter */}
      <FilterChips
        filters={STATUS_FILTERS}
        selectedFilters={selectedStatus}
        onFilterToggle={handleStatusToggle}
      />

      {/* Phase Filter */}
      <FilterChips
        filters={PHASE_FILTERS}
        selectedFilters={selectedPhases}
        onFilterToggle={handlePhaseToggle}
      />

      {/* Results Row with Sort */}
      <View style={styles.resultsRow}>
        <Text variant="bodySmall" style={styles.resultCount}>
          Showing {filteredItems.length} of {items.length} items
        </Text>

        {(searchQuery || !selectedStatus.includes('all') || !selectedPhases.includes('all')) && (
          <Button mode="text" onPress={clearAllFilters} compact>
            Clear All
          </Button>
        )}

        <SortMenu
          sortOptions={SORT_OPTIONS}
          currentSort={sortBy}
          onSortChange={setSortBy}
          sortDirection={sortDirection}
          onDirectionChange={setSortDirection}
        />
      </View>

      {/* Items List */}
      <FlatList
        data={filteredItems}
        renderItem={({ item }) => <ItemCard item={item} />}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text>No items match your filters</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  resultsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  resultCount: {
    flex: 1,
    color: '#666',
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
});

export default MyListScreen;
```

---

## 📦 Import Paths

### Individual Imports
```typescript
import { SearchBar } from '../components/SearchBar';
import { FilterChips, FilterOption } from '../components/FilterChips';
import { SortMenu, SortOption } from '../components/SortMenu';
```

### Barrel Import (Recommended)
```typescript
import {
  SearchBar,
  FilterChips,
  FilterOption,
  SortMenu,
  SortOption,
} from '../components';
```

---

## 🧪 Testing Checklist

### SearchBar Testing
- [ ] Typing shows immediate feedback in UI
- [ ] Debounce delay works (300ms)
- [ ] Clear button clears search
- [ ] External value changes sync to component
- [ ] No lag when typing quickly

### FilterChips Testing
- [ ] Single filter selection works
- [ ] Multi-filter selection works
- [ ] "All" filter resets others
- [ ] Selected chips highlighted correctly
- [ ] Horizontal scroll works with many chips
- [ ] Icons display correctly
- [ ] Custom colors work

### SortMenu Testing
- [ ] Menu opens on button press
- [ ] Menu closes after selection
- [ ] Checkmark shows on selected sort
- [ ] Direction toggle works (if enabled)
- [ ] Button icon changes with direction
- [ ] All sort options selectable

### Integration Testing
- [ ] Search + filter + sort work together
- [ ] Result count updates correctly
- [ ] Clear all resets everything
- [ ] Performance good with 100+ items
- [ ] No memory leaks

---

## 🎯 Performance Considerations

### SearchBar
- **Debouncing:** Reduces filter operations from hundreds to ~3 per search
- **Local State:** Keeps UI responsive during typing
- **Cleanup:** Clears timeouts on unmount

### FilterChips
- **Horizontal Scroll:** Only renders visible chips
- **No Scroll Indicator:** Cleaner UI, better performance

### SortMenu
- **On-Demand:** Menu items only render when open
- **Auto-Close:** Releases menu resources after selection

### Overall
- **useMemo:** Use `useMemo` for filtering logic to prevent re-computation
- **FlatList:** Combine with FlatList for virtualization
- **Batch Updates:** Update multiple filters at once when possible

---

## 🔧 Customization Options

### SearchBar Customization
```typescript
// Change debounce delay
<SearchBar debounceMs={500} />

// Custom placeholder
<SearchBar placeholder="Find construction items..." />

// Custom styling (wrap in View)
<View style={{ backgroundColor: '#f0f0f0' }}>
  <SearchBar {...props} />
</View>
```

### FilterChips Customization
```typescript
// Single-select mode
<FilterChips multiSelect={false} {...props} />

// Custom colors per filter
const filters = [
  { id: 'critical', label: 'Critical', color: '#F44336' },
  { id: 'normal', label: 'Normal', color: '#4CAF50' },
];
```

### SortMenu Customization
```typescript
// Hide direction toggle
<SortMenu
  {...props}
  // Don't pass onDirectionChange
/>

// Custom icons
const sortOptions = [
  { id: 'name', label: 'Name', icon: 'alphabetical' },
  { id: 'priority', label: 'Priority', icon: 'fire' },
];
```

---

## 🐛 Common Issues & Solutions

### Issue: SearchBar not updating parent state
**Cause:** Debounce delay still pending
**Solution:** Debounce is working correctly. Parent updates after 300ms. To test, wait 300ms after typing.

### Issue: FilterChips "All" not working
**Cause:** Parent logic not handling "all" correctly
**Solution:** Use the toggle pattern from examples above.

### Issue: SortMenu not showing checkmark
**Cause:** `currentSort` doesn't match any `option.id`
**Solution:** Verify `currentSort` value matches exactly (case-sensitive).

### Issue: Performance lag with many items
**Cause:** Not using `useMemo` for filtering
**Solution:** Wrap filtering logic in `useMemo` with correct dependencies.

---

## 📚 Related Documentation

- **SPRINT_2_SEARCH_FILTERING_PLAN.md** - Complete Sprint 2 plan
- **PLANNING_MASTER_STATUS.md** - Sprint 2 overview
- **SNACKBAR_SYSTEM_GUIDE.md** - Component design patterns

---

## ✅ Component Checklist

- [x] SearchBar component created
- [x] FilterChips component created
- [x] SortMenu component created
- [x] TypeScript interfaces defined
- [x] Props documented with JSDoc
- [x] Usage examples provided
- [x] Barrel export (index.ts) created
- [x] Comprehensive guide written

---

**Created:** October 23, 2025
**Version:** v2.1
**Status:** ✅ Complete
**Next Steps:** Day 2 - Integrate components into ItemsManagementScreen

---

**END OF GUIDE**
