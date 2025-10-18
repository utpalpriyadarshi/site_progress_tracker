# Sprint 1 & 2 - Self Test Plan

**Date:** 2025-10-15
**Project:** Planning Module v1.4 - WBS Management
**Purpose:** Manual self-testing guide for Sprint 1 & 2 deliverables
**Tester:** Self Testing

---

## Table of Contents

1. [Test Environment Setup](#test-environment-setup)
2. [Sprint 1 Tests: Database Foundation](#sprint-1-tests-database-foundation)
3. [Sprint 2 Tests: UI Components](#sprint-2-tests-ui-components)
4. [Integration Tests](#integration-tests)
5. [Test Reporting Template](#test-reporting-template)

---

## Test Environment Setup

### Prerequisites

Before starting tests, ensure you have:

```bash
# 1. Install dependencies
npm install --legacy-peer-deps

# 2. Start Metro bundler
npm start

# 3. Run app on device/emulator (in separate terminal)
npm run android
# OR
npm run ios
```

### Test User Credentials

Use the following test credentials:

- **Planner:** `planner` / `planner123`
- **Supervisor:** `supervisor` / `supervisor123`
- **Manager:** `manager` / `manager123`

### Test Data Setup

Before testing, ensure you have:
- At least 2 projects created
- At least 3 sites created (assigned to different projects)
- Default categories exist in the database

---

## Sprint 1 Tests: Database Foundation

Sprint 1 focuses on backend models, services, and database functionality. These tests verify data integrity without UI interaction.

### Test Suite 1: TemplateModuleModel

**Purpose:** Verify template module functionality for storing pre-configured item templates

**Test Location:** `models/TemplateModuleModel.ts`

---

#### Test 1.1: Create Template Module

**Objective:** Verify that template modules can be created with all required fields

**Test Steps:**
1. Open React Native Debugger or use console logs
2. Add the following code to `App.tsx` temporarily (or create a test screen):

```typescript
import { database } from './models/database';

// Test function
const testTemplateModuleCreation = async () => {
  try {
    const result = await database.write(async () => {
      return await database.collections.get('template_modules').create((module) => {
        module.name = 'Test 220kV Substation';
        module.category = 'substation';
        module.voltageLevel = '220kV';
        module.description = 'Standard 220kV substation template';
        module.itemsJson = JSON.stringify([
          { phase: 'design', name: 'Single Line Diagram', duration: 10 },
          { phase: 'procurement', name: 'Power Transformer', duration: 120 },
        ]);
        module.compatibleModuleIdsJson = JSON.stringify(['module-2', 'module-3']);
        module.estimatedTotalDuration = 180;
        module.isActive = true;
      });
    });

    console.log('✅ Template module created:', result.id);
    console.log('   Name:', result.name);
    console.log('   Category:', result.category);
    return true;
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
};
```

**Expected Results:**
- ✅ Module is created successfully
- ✅ All fields are populated correctly
- ✅ No errors in console
- ✅ Module ID is generated

**Pass/Fail:** ⬜ PASS ⬜ FAIL

**Notes:**
_______________________________________________

---

#### Test 1.2: Template Categories

**Objective:** Verify all 5 category types are supported

**Test Steps:**
Test creating template modules with each category type:
- `substation`
- `ohe` (Overhead Electrification)
- `third_rail`
- `building`
- `interface`

```typescript
const testCategories = async () => {
  const categories = ['substation', 'ohe', 'third_rail', 'building', 'interface'];

  for (const category of categories) {
    const module = await database.write(async () => {
      return await database.collections.get('template_modules').create((m) => {
        m.name = `Test ${category} Template`;
        m.category = category;
        m.voltageLevel = '25kV';
        m.itemsJson = '[]';
        m.isActive = true;
      });
    });
    console.log(`✅ Created module with category: ${category}`);
  }
};
```

**Expected Results:**
- ✅ All 5 categories work without errors
- ✅ Each module is created with correct category

**Pass/Fail:** ⬜ PASS ⬜ FAIL

**Notes:**
_______________________________________________

---

#### Test 1.3: Voltage Levels

**Objective:** Verify all 6 voltage levels are supported

**Test Steps:**
Test creating modules with each voltage level:
- `220kV`
- `132kV`
- `66kV`
- `33kV`
- `25kV`
- `650VDC`

```typescript
const testVoltageLevels = async () => {
  const levels = ['220kV', '132kV', '66kV', '33kV', '25kV', '650VDC'];

  for (const level of levels) {
    const module = await database.write(async () => {
      return await database.collections.get('template_modules').create((m) => {
        m.name = `Test ${level} Template`;
        m.category = 'substation';
        m.voltageLevel = level;
        m.itemsJson = '[]';
        m.isActive = true;
      });
    });
    console.log(`✅ Created module with voltage: ${level}`);
  }
};
```

**Expected Results:**
- ✅ All 6 voltage levels work correctly
- ✅ Values are stored and retrieved properly

**Pass/Fail:** ⬜ PASS ⬜ FAIL

**Notes:**
_______________________________________________

---

#### Test 1.4: JSON Parsing - getItems()

**Objective:** Verify `getItems()` method correctly parses JSON items

**Test Steps:**
```typescript
const testGetItems = async () => {
  const module = await database.write(async () => {
    return await database.collections.get('template_modules').create((m) => {
      m.name = 'Test Items Parsing';
      m.category = 'substation';
      m.voltageLevel = '220kV';
      m.itemsJson = JSON.stringify([
        { phase: 'design', name: 'Item 1', duration: 10 },
        { phase: 'construction', name: 'Item 2', duration: 30 },
        { phase: 'testing', name: 'Item 3', duration: 15 },
      ]);
      m.isActive = true;
    });
  });

  const items = module.getItems();
  console.log('✅ Parsed items:', items.length);
  console.log('   Items:', items);

  // Verify
  if (items.length === 3) {
    console.log('✅ Correct number of items');
  }
  if (items[0].name === 'Item 1') {
    console.log('✅ Item data is correct');
  }
};
```

**Expected Results:**
- ✅ Returns array with 3 items
- ✅ Each item has phase, name, duration fields
- ✅ No parsing errors

**Pass/Fail:** ⬜ PASS ⬜ FAIL

**Notes:**
_______________________________________________

---

#### Test 1.5: Invalid JSON Handling

**Objective:** Verify graceful handling of invalid JSON

**Test Steps:**
```typescript
const testInvalidJSON = async () => {
  const module = await database.write(async () => {
    return await database.collections.get('template_modules').create((m) => {
      m.name = 'Invalid JSON Test';
      m.category = 'substation';
      m.voltageLevel = '220kV';
      m.itemsJson = 'THIS IS NOT JSON!!!';
      m.isActive = true;
    });
  });

  const items = module.getItems();
  console.log('Items returned:', items);

  if (items.length === 0) {
    console.log('✅ Invalid JSON handled gracefully (returned empty array)');
  }
};
```

**Expected Results:**
- ✅ No crash or error thrown
- ✅ Returns empty array `[]`
- ✅ Console shows warning/error message

**Pass/Fail:** ⬜ PASS ⬜ FAIL

**Notes:**
_______________________________________________

---

#### Test 1.6: Helper Methods

**Objective:** Verify `getItemCount()` and `getEstimatedDuration()` methods

**Test Steps:**
```typescript
const testHelperMethods = async () => {
  const module = await database.write(async () => {
    return await database.collections.get('template_modules').create((m) => {
      m.name = 'Helper Methods Test';
      m.category = 'substation';
      m.voltageLevel = '220kV';
      m.itemsJson = JSON.stringify([
        { phase: 'design', name: 'Item 1', duration: 10 },
        { phase: 'construction', name: 'Item 2', duration: 30 },
        { phase: 'testing', name: 'Item 3', duration: 15 },
      ]);
      m.estimatedTotalDuration = 90;
      m.isActive = true;
    });
  });

  const itemCount = module.getItemCount();
  const duration = module.getEstimatedDuration();

  console.log('Item count:', itemCount);
  console.log('Estimated duration:', duration);

  if (itemCount === 3) {
    console.log('✅ getItemCount() works correctly');
  }
  if (duration === 90) {
    console.log('✅ getEstimatedDuration() works correctly');
  }
};
```

**Expected Results:**
- ✅ `getItemCount()` returns 3
- ✅ `getEstimatedDuration()` returns 90

**Pass/Fail:** ⬜ PASS ⬜ FAIL

**Notes:**
_______________________________________________

---

### Test Suite 2: InterfacePointModel

**Purpose:** Verify interface point functionality for managing handovers between contractors

**Test Location:** `models/InterfacePointModel.ts`

---

#### Test 2.1: Create Interface Point

**Objective:** Verify interface points can be created with all required fields

**Test Steps:**
```typescript
const testInterfacePointCreation = async () => {
  // First, create a test item
  const item = await database.write(async () => {
    return await database.collections.get('items').create((i) => {
      i.name = 'Test Item for Interface';
      i.categoryId = 'some-category-id';
      i.siteId = 'some-site-id';
      i.wbsCode = '1.0.0.0';
    });
  });

  // Create interface point
  const interfacePoint = await database.write(async () => {
    return await database.collections.get('interface_points').create((ip) => {
      ip.itemId = item.id;
      ip.fromContractor = 'Civil Contractor';
      ip.toContractor = 'Electrical Contractor';
      ip.interfaceType = 'handover';
      ip.status = 'pending';
      ip.description = 'Foundation handover';
      ip.requiredDate = new Date('2025-11-01').getTime();
    });
  });

  console.log('✅ Interface point created:', interfacePoint.id);
  console.log('   From:', interfacePoint.fromContractor);
  console.log('   To:', interfacePoint.toContractor);
  console.log('   Type:', interfacePoint.interfaceType);
};
```

**Expected Results:**
- ✅ Interface point is created successfully
- ✅ All fields are populated correctly
- ✅ Linked to item via itemId

**Pass/Fail:** ⬜ PASS ⬜ FAIL

**Notes:**
_______________________________________________

---

#### Test 2.2: Interface Types

**Objective:** Verify all 3 interface types are supported

**Test Steps:**
Test creating interface points with each type:
- `handover`
- `approval`
- `information`

```typescript
const testInterfaceTypes = async () => {
  const types = ['handover', 'approval', 'information'];

  for (const type of types) {
    const ip = await database.write(async () => {
      return await database.collections.get('interface_points').create((i) => {
        i.itemId = 'test-item-id';
        i.fromContractor = 'Contractor A';
        i.toContractor = 'Contractor B';
        i.interfaceType = type;
        i.status = 'pending';
      });
    });
    console.log(`✅ Created interface with type: ${type}`);
  }
};
```

**Expected Results:**
- ✅ All 3 types work without errors

**Pass/Fail:** ⬜ PASS ⬜ FAIL

**Notes:**
_______________________________________________

---

#### Test 2.3: Status Types

**Objective:** Verify all 4 status types are supported

**Test Steps:**
Test creating interface points with each status:
- `pending`
- `in_progress`
- `resolved`
- `blocked`

```typescript
const testStatusTypes = async () => {
  const statuses = ['pending', 'in_progress', 'resolved', 'blocked'];

  for (const status of statuses) {
    const ip = await database.write(async () => {
      return await database.collections.get('interface_points').create((i) => {
        i.itemId = 'test-item-id';
        i.fromContractor = 'Contractor A';
        i.toContractor = 'Contractor B';
        i.interfaceType = 'handover';
        i.status = status;
      });
    });
    console.log(`✅ Created interface with status: ${status}`);
  }
};
```

**Expected Results:**
- ✅ All 4 statuses work without errors

**Pass/Fail:** ⬜ PASS ⬜ FAIL

**Notes:**
_______________________________________________

---

#### Test 2.4: isOverdue() Method

**Objective:** Verify overdue detection logic

**Test Steps:**
```typescript
const testIsOverdue = async () => {
  const today = Date.now();
  const yesterday = today - (24 * 60 * 60 * 1000);
  const tomorrow = today + (24 * 60 * 60 * 1000);

  // Test 1: Overdue and pending
  const overdueIP = await database.write(async () => {
    return await database.collections.get('interface_points').create((i) => {
      i.itemId = 'test-item';
      i.fromContractor = 'A';
      i.toContractor = 'B';
      i.interfaceType = 'handover';
      i.status = 'pending';
      i.requiredDate = yesterday;
    });
  });

  // Test 2: Not overdue (future date)
  const futureIP = await database.write(async () => {
    return await database.collections.get('interface_points').create((i) => {
      i.itemId = 'test-item';
      i.fromContractor = 'A';
      i.toContractor = 'B';
      i.interfaceType = 'handover';
      i.status = 'pending';
      i.requiredDate = tomorrow;
    });
  });

  // Test 3: Overdue but resolved (should not be overdue)
  const resolvedIP = await database.write(async () => {
    return await database.collections.get('interface_points').create((i) => {
      i.itemId = 'test-item';
      i.fromContractor = 'A';
      i.toContractor = 'B';
      i.interfaceType = 'handover';
      i.status = 'resolved';
      i.requiredDate = yesterday;
    });
  });

  console.log('Overdue IP:', overdueIP.isOverdue()); // Should be true
  console.log('Future IP:', futureIP.isOverdue());   // Should be false
  console.log('Resolved IP:', resolvedIP.isOverdue()); // Should be false
};
```

**Expected Results:**
- ✅ Overdue pending item returns `true`
- ✅ Future date returns `false`
- ✅ Resolved item returns `false` (even if past due date)

**Pass/Fail:** ⬜ PASS ⬜ FAIL

**Notes:**
_______________________________________________

---

#### Test 2.5: getDaysOverdue() Method

**Objective:** Verify overdue days calculation

**Test Steps:**
```typescript
const testGetDaysOverdue = async () => {
  const today = Date.now();
  const threeDaysAgo = today - (3 * 24 * 60 * 60 * 1000);

  const overdueIP = await database.write(async () => {
    return await database.collections.get('interface_points').create((i) => {
      i.itemId = 'test-item';
      i.fromContractor = 'A';
      i.toContractor = 'B';
      i.interfaceType = 'handover';
      i.status = 'pending';
      i.requiredDate = threeDaysAgo;
    });
  });

  const daysOverdue = overdueIP.getDaysOverdue();
  console.log('Days overdue:', daysOverdue); // Should be around 3
};
```

**Expected Results:**
- ✅ Returns approximately 3 days
- ✅ Returns 0 if not overdue

**Pass/Fail:** ⬜ PASS ⬜ FAIL

**Notes:**
_______________________________________________

---

### Test Suite 3: WBSCodeGenerator Service

**Purpose:** Verify WBS code generation and hierarchical logic

**Test Location:** `services/planning/WBSCodeGenerator.ts`

---

#### Test 3.1: Generate Root Code

**Objective:** Verify first root-level WBS code generation

**Test Steps:**
```typescript
import { WBSCodeGenerator } from '../../services/planning/WBSCodeGenerator';

const testGenerateRootCode = async () => {
  const generator = new WBSCodeGenerator(database);

  const firstRootCode = await generator.generateRootCode('site-id-1');
  console.log('First root code:', firstRootCode); // Should be 1.0.0.0

  // Create an item with this code
  await database.write(async () => {
    await database.collections.get('items').create((item) => {
      item.name = 'First Root Item';
      item.siteId = 'site-id-1';
      item.categoryId = 'cat-1';
      item.wbsCode = firstRootCode;
      item.wbsLevel = 1;
    });
  });

  // Generate second root code
  const secondRootCode = await generator.generateRootCode('site-id-1');
  console.log('Second root code:', secondRootCode); // Should be 2.0.0.0
};
```

**Expected Results:**
- ✅ First call returns `1.0.0.0`
- ✅ Second call returns `2.0.0.0`
- ✅ Sequential numbering works correctly

**Pass/Fail:** ⬜ PASS ⬜ FAIL

**Notes:**
_______________________________________________

---

#### Test 3.2: Generate Child Code

**Objective:** Verify child code generation under parent

**Test Steps:**
```typescript
const testGenerateChildCode = async () => {
  const generator = new WBSCodeGenerator(database);

  // First create parent item
  await database.write(async () => {
    await database.collections.get('items').create((item) => {
      item.name = 'Parent Item';
      item.siteId = 'site-id-1';
      item.categoryId = 'cat-1';
      item.wbsCode = '1.0.0.0';
      item.wbsLevel = 1;
    });
  });

  // Generate child codes
  const firstChild = await generator.generateChildCode('site-id-1', '1.0.0.0');
  console.log('First child:', firstChild); // Should be 1.1.0.0

  // Create the child item
  await database.write(async () => {
    await database.collections.get('items').create((item) => {
      item.name = 'Child Item 1';
      item.siteId = 'site-id-1';
      item.categoryId = 'cat-1';
      item.wbsCode = firstChild;
      item.wbsLevel = 2;
      item.parentWbsCode = '1.0.0.0';
    });
  });

  const secondChild = await generator.generateChildCode('site-id-1', '1.0.0.0');
  console.log('Second child:', secondChild); // Should be 1.2.0.0
};
```

**Expected Results:**
- ✅ First child is `1.1.0.0`
- ✅ Second child is `1.2.0.0`
- ✅ Parent-child relationship maintained

**Pass/Fail:** ⬜ PASS ⬜ FAIL

**Notes:**
_______________________________________________

---

#### Test 3.3: Multi-Level Hierarchy

**Objective:** Verify 4-level deep WBS hierarchy

**Test Steps:**
```typescript
const testMultiLevelHierarchy = async () => {
  const generator = new WBSCodeGenerator(database);

  // Level 1
  const level1 = await generator.generateRootCode('site-id-1');
  console.log('Level 1:', level1); // 1.0.0.0

  // Level 2
  const level2 = await generator.generateChildCode('site-id-1', level1);
  console.log('Level 2:', level2); // 1.1.0.0

  // Level 3
  const level3 = await generator.generateChildCode('site-id-1', level2);
  console.log('Level 3:', level3); // 1.1.1.0

  // Level 4
  const level4 = await generator.generateChildCode('site-id-1', level3);
  console.log('Level 4:', level4); // 1.1.1.1
};
```

**Expected Results:**
- ✅ Level 1: `1.0.0.0`
- ✅ Level 2: `1.1.0.0`
- ✅ Level 3: `1.1.1.0`
- ✅ Level 4: `1.1.1.1`

**Pass/Fail:** ⬜ PASS ⬜ FAIL

**Notes:**
_______________________________________________

---

#### Test 3.4: Calculate Level

**Objective:** Verify WBS level calculation from code

**Test Steps:**
```typescript
const testCalculateLevel = () => {
  const generator = new WBSCodeGenerator(database);

  console.log('Level of 1.0.0.0:', generator.calculateLevel('1.0.0.0')); // 1
  console.log('Level of 1.2.0.0:', generator.calculateLevel('1.2.0.0')); // 2
  console.log('Level of 1.2.3.0:', generator.calculateLevel('1.2.3.0')); // 3
  console.log('Level of 1.2.3.4:', generator.calculateLevel('1.2.3.4')); // 4
};
```

**Expected Results:**
- ✅ `1.0.0.0` → Level 1
- ✅ `1.2.0.0` → Level 2
- ✅ `1.2.3.0` → Level 3
- ✅ `1.2.3.4` → Level 4

**Pass/Fail:** ⬜ PASS ⬜ FAIL

**Notes:**
_______________________________________________

---

#### Test 3.5: Get Parent Code

**Objective:** Verify parent code extraction from child code

**Test Steps:**
```typescript
const testGetParentCode = () => {
  const generator = new WBSCodeGenerator(database);

  console.log('Parent of 1.1.0.0:', generator.getParentCode('1.1.0.0')); // 1.0.0.0
  console.log('Parent of 1.2.3.0:', generator.getParentCode('1.2.3.0')); // 1.2.0.0
  console.log('Parent of 1.2.3.4:', generator.getParentCode('1.2.3.4')); // 1.2.3.0
  console.log('Parent of 1.0.0.0:', generator.getParentCode('1.0.0.0')); // null
};
```

**Expected Results:**
- ✅ `1.1.0.0` → `1.0.0.0`
- ✅ `1.2.3.0` → `1.2.0.0`
- ✅ `1.2.3.4` → `1.2.3.0`
- ✅ `1.0.0.0` → `null` (no parent)

**Pass/Fail:** ⬜ PASS ⬜ FAIL

**Notes:**
_______________________________________________

---

#### Test 3.6: Code Uniqueness Validation

**Objective:** Verify code uniqueness check

**Test Steps:**
```typescript
const testIsCodeUnique = async () => {
  const generator = new WBSCodeGenerator(database);

  // Create an item with code 1.0.0.0
  await database.write(async () => {
    await database.collections.get('items').create((item) => {
      item.name = 'Test Item';
      item.siteId = 'site-id-1';
      item.categoryId = 'cat-1';
      item.wbsCode = '1.0.0.0';
      item.wbsLevel = 1;
    });
  });

  const isUnique1 = await generator.isCodeUnique('site-id-1', '1.0.0.0');
  console.log('Is 1.0.0.0 unique?', isUnique1); // Should be false

  const isUnique2 = await generator.isCodeUnique('site-id-1', '2.0.0.0');
  console.log('Is 2.0.0.0 unique?', isUnique2); // Should be true
};
```

**Expected Results:**
- ✅ Existing code returns `false`
- ✅ Non-existing code returns `true`

**Pass/Fail:** ⬜ PASS ⬜ FAIL

**Notes:**
_______________________________________________

---

## Sprint 2 Tests: UI Components

Sprint 2 focuses on user interface components for WBS management. These tests require running the app and manual interaction.

### Test Suite 4: WBSManagementScreen

**Purpose:** Verify the main WBS management screen functionality

**Test Location:** `src/planning/WBSManagementScreen.tsx`

---

#### Test 4.1: Screen Rendering

**Objective:** Verify screen loads without crashes

**Test Steps:**
1. Launch the app on device/emulator
2. Login as **Planner** (`planner` / `planner123`)
3. Navigate to **Planning** tab (bottom navigation)
4. Tap on **WBS Management** option

**Expected Results:**
- ✅ Screen loads without crashes
- ✅ App bar shows "WBS Management"
- ✅ Site selector is visible at top
- ✅ No error messages displayed

**Pass/Fail:** ⬜ PASS ⬜ FAIL

**Screenshot Required:** Yes

**Notes:**
__There is no planning tab, however WBS tab is there,No WBS Management option, refer screen shot @prompt\wbs1.png, App bar shows "Work Breakdown structure"_instead of WBS management____________________________________________

---

#### Test 4.2: Site Selector

**Objective:** Verify site selection dropdown works

**Test Steps:**
1. On WBS Management screen
2. Tap on site selector dropdown
3. Verify list of sites appears
4. Select a different site
5. Verify screen refreshes with selected site data

**Expected Results:**
- ✅ Site selector dropdown opens
- ✅ Shows all sites from database
- ✅ Can select a site
- ✅ Screen refreshes after selection
- ✅ Selected site name is displayed

**Pass/Fail:** ⬜ PASS ⬜ FAIL

**Screenshot Required:** Yes

**Notes:**
_ok______________________________________________

---

#### Test 4.3: Empty State

**Objective:** Verify empty state when no items exist

**Test Steps:**
1. Select a site that has no WBS items
2. Observe the empty state

**Expected Results:**
- ✅ Shows "No items found" message-yes
- ✅ Shows icon (e.g., folder icon)-no
- ✅ Shows helpful text like "Tap + to create your first item"-yes
- ✅ FAB button is still visible-yes

**Pass/Fail:** ⬜ PASS ⬜ FAIL

**Screenshot Required:** Yes- @prompt\wbs2.png

**Notes:**
work Breakdown structure with 0 items, Folder icon not visble_______________________________________________

---

#### Test 4.4: Phase Filter Chips

**Objective:** Verify phase filtering chips display and work

**Test Steps:**
1. Create some WBS items in different phases (or use existing data)
2. Observe phase filter chips below site selector
3. Tap on different phase chips
4. Verify items are filtered by selected phase

**Expected Results:**
- ✅ Phase chips are visible (horizontally scrollable) -ok
- ✅ Shows all 11 phases with icons -ok
- ✅ "All Phases" chip is selected by default -ok
- ✅ Tapping a phase filters the item list-ok, but items cannot be tagged as per phases at this this time
- ✅ Selected chip is highlighted- ok
- ✅ Item count updates when filtering- cannot be verified as items are not tagged as per phases

**Phase List:**
- All Phases
- Design & Engineering
- Statutory Approvals
- Mobilization
- Procurement
- Interface Coordination
- Site Preparation
- Construction
- Testing
- Commissioning
- Site Acceptance Test
- Handover

**Pass/Fail:** ⬜ PASS ⬜ FAIL

**Screenshot Required:** Yes-@prompt\wbs3.png

**Notes:**
_______________________________________________

---

#### Test 4.5: Hierarchical Item Display

**Objective:** Verify items are displayed in WBS hierarchy

**Test Steps:**
1. Create a hierarchical structure:
   - 1.0.0.0 - Root Item
     - 1.1.0.0 - Child Item 1
       - 1.1.1.0 - Grandchild Item
     - 1.2.0.0 - Child Item 2
   - 2.0.0.0 - Second Root Item

2. Verify items are displayed in correct order

**Expected Results:**
- ✅ Items are sorted by WBS code-no
- ✅ Hierarchy is visually indicated (indentation)-no
- ✅ Parent items appear before children-no
- ✅ Sibling items are in correct order-no
- ✅ WBS codes are clearly visible-no

**Pass/Fail:** ⬜ PASS ⬜ FAIL

**Screenshot Required:** Yes-refer screenshot wbs2.pn

**Notes:**
_Fail, I cannot see, message is items creation will be implimeneted in sprint 3 ____________________________________________

---

#### Test 4.6: FAB Button

**Objective:** Verify Floating Action Button for adding items

**Test Steps:**
1. On WBS Management screen
2. Observe FAB button (bottom right corner)
3. Tap the FAB button
4. Verify it navigates to item creation screen

**Expected Results:**
- ✅ FAB button is visible (+ icon)-yes
- ✅ Button is positioned at bottom right-yes
- ✅ Tapping opens item creation screen-yes
- ✅ Button is accessible (not blocked by other elements)-yes

**Pass/Fail:** ⬜ PASS ⬜ FAIL

**Screenshot Required:** Yes

**Notes:**
Fail- message is items creation will be implimeneted in sprint 3 _______________________________________________

---

#### Test 4.7: Item Count Display

**Objective:** Verify item count is shown in header

**Test Steps:**
1. On WBS Management screen with items
2. Observe the header/app bar
3. Check if item count is displayed (e.g., "12 items")
4. Filter by phase
5. Verify count updates

**Expected Results:**
- ✅ Total item count is displayed
- ✅ Count updates when filtering
- ✅ Count is clearly visible
- ✅ Shows "0 items" when no items match filter

**Pass/Fail:** ⬜ PASS ⬜ FAIL

**Screenshot Required:** Yes

**Notes:**
Fail Since items cannot be added hence 0 items are shown.______________________________________________

---

### Test Suite 5: WBSItemCard Component

**Purpose:** Verify individual WBS item card display and interactions

**Test Location:** `src/planning/components/WBSItemCard.tsx`

---

#### Test 5.1: Basic Item Display

**Objective:** Verify basic item information is displayed

**Test Steps:**
1. Create a simple WBS item with:
   - Name: "Power Transformer Installation"
   - WBS Code: 1.2.3.0
   - Phase: Construction
   - Duration: 30 days
   - Status: In Progress

2. View the item in WBS Management screen

**Expected Results:**
- ✅ WBS code is displayed (e.g., "1.2.3.0")-No
- ✅ Item name is displayed
- ✅ Phase label is shown with icon
- ✅ Duration is shown (e.g., "30 days")
- ✅ Status is displayed
- ✅ Card has proper styling (borders, padding)

**Pass/Fail:** ⬜ PASS ⬜ FAIL

**Screenshot Required:** Yes

**Notes:**
___Fail____________________________________________

---

#### Test 5.2: Critical Path Badge

**Objective:** Verify critical path items show special badge

**Test Steps:**
1. Create a WBS item with `isCriticalPath = true`
2. View the item in the list

**Expected Results:**
- ✅ Shows "Critical Path" badge (or icon)
- ✅ Badge is prominently displayed (e.g., red color)
- ✅ Badge is easily distinguishable

**Pass/Fail:** ⬜ PASS ⬜ FAIL

**Screenshot Required:** Yes

**Notes:**
_Fail______________________________________________

---

#### Test 5.3: Float Days Display

**Objective:** Verify float days are shown for non-critical items

**Test Steps:**
1. Create item with:
   - `isCriticalPath = false`
   - `floatDays = 5`

2. View the item

**Expected Results:**
- ✅ Shows float days (e.g., "Float: 5 days")
- ✅ Float is clearly visible
- ✅ Different styling from critical path items

**Pass/Fail:** ⬜ PASS ⬜ FAIL

**Screenshot Required:** Yes

**Notes:**
_Fail______________________________________________

---

#### Test 5.4: Risk Badges

**Objective:** Verify risk level badges display correctly

**Test Steps:**
1. Create 3 items with different risk levels:
   - Item 1: `dependencyRisk = 'low'`
   - Item 2: `dependencyRisk = 'medium'`
   - Item 3: `dependencyRisk = 'high'`

2. View all items in list

**Expected Results:**
- ✅ Low risk: No badge or green indicator
- ✅ Medium risk: Yellow badge with "Medium Risk"
- ✅ High risk: Red badge with "High Risk" + warning icon
- ✅ Risk badges are clearly visible

**Pass/Fail:** ⬜ PASS ⬜ FAIL

**Screenshot Required:** Yes

**Notes:**
_Fail______________________________________________

---

#### Test 5.5: Risk Notes Display

**Objective:** Verify risk notes are shown when present

**Test Steps:**
1. Create item with:
   - `dependencyRisk = 'high'`
   - `riskNotes = 'Depends on external contractor approval'`

2. View the item

**Expected Results:**
- ✅ Risk notes are displayed below item details
- ✅ Notes are clearly readable
- ✅ Notes have distinct styling (e.g., italic, smaller font)

**Pass/Fail:** ⬜ PASS ⬜ FAIL

**Screenshot Required:** Yes

**Notes:**
Fail_______________________________________________

---

#### Test 5.6: Milestone Indicator

**Objective:** Verify milestone items show star indicator

**Test Steps:**
1. Create item with `isMilestone = true`
2. View the item

**Expected Results:**
- ✅ Shows star icon (⭐) or similar milestone indicator
- ✅ Milestone is easily recognizable
- ✅ Different from regular items

**Pass/Fail:** ⬜ PASS ⬜ FAIL

**Screenshot Required:** Yes

**Notes:**
__Fail_____________________________________________

---

#### Test 5.7: Indentation Levels

**Objective:** Verify hierarchical indentation

**Test Steps:**
1. Create 4-level hierarchy:
   - Level 1: 1.0.0.0 (no indentation)
   - Level 2: 1.1.0.0 (indent 1x)
   - Level 3: 1.1.1.0 (indent 2x)
   - Level 4: 1.1.1.1 (indent 3x)

2. View all items in list

**Expected Results:**
- ✅ Level 1: No indentation
- ✅ Level 2: 16dp left padding
- ✅ Level 3: 32dp left padding
- ✅ Level 4: 48dp left padding
- ✅ Visual hierarchy is clear

**Pass/Fail:** ⬜ PASS ⬜ FAIL

**Screenshot Required:** Yes

**Notes:**
__Fail_____________________________________________

---

#### Test 5.8: Phase Icons

**Objective:** Verify each phase has correct icon

**Test Steps:**
1. Create items in each of the 11 phases
2. View all items

**Expected Results:**
- ✅ Design: Pencil/design icon
- ✅ Approvals: Document icon
- ✅ Mobilization: Truck icon
- ✅ Procurement: Shopping icon
- ✅ Interface: Link icon
- ✅ Site Prep: Site/foundation icon
- ✅ Construction: Hammer/tools icon
- ✅ Testing: Test tube icon
- ✅ Commissioning: Power/lightning icon
- ✅ SAT: Checkmark icon
- ✅ Handover: Package/delivery icon

**Pass/Fail:** ⬜ PASS ⬜ FAIL

**Screenshot Required:** Yes

**Notes:**
_Fail______________________________________________

---

#### Test 5.9: Edit/Delete Buttons

**Objective:** Verify action buttons work correctly

**Test Steps:**
1. View a WBS item card
2. Look for edit and delete buttons/icons
3. Tap edit button
4. Verify navigation to edit screen

**Expected Results:**
- ✅ Edit button is visible
- ✅ Delete button is visible
- ✅ Tapping edit opens edit screen
- ✅ Buttons are properly positioned

**Pass/Fail:** ⬜ PASS ⬜ FAIL

**Screenshot Required:** Yes

**Notes:**
_Fail______________________________________________

---

#### Test 5.10: Long Item Names

**Objective:** Verify long item names are handled properly

**Test Steps:**
1. Create item with very long name (100+ characters)
2. View the item card

**Expected Results:**
- ✅ Name is displayed properly (wrapped or truncated)
- ✅ Card doesn't break layout
- ✅ All information remains visible

**Pass/Fail:** ⬜ PASS ⬜ FAIL

**Screenshot Required:** Yes

**Notes:**
_Fail______________________________________________

---

## Integration Tests

These tests verify end-to-end workflows combining multiple components.

### Test Suite 6: End-to-End WBS Creation

---

#### Test 6.1: Create Full WBS Hierarchy

**Objective:** Test complete WBS creation workflow

**Test Steps:**
1. Login as Planner
2. Navigate to WBS Management
3. Select a site
4. Create root item (Level 1):
   - Tap FAB (+)
   - Enter name: "220kV Substation Project"
   - Select phase: "Design"
   - Save

5. Create child items under root:
   - Select root item
   - Tap "Add Child Item"
   - Create "Single Line Diagram"
   - Create "Protection Scheme"

6. Create grandchild item:
   - Select "Single Line Diagram"
   - Add child "SLD Revision 1"

7. Verify hierarchy in WBS Management screen

**Expected Results:**
- ✅ All items created successfully
- ✅ WBS codes auto-generated correctly:
  - Root: 1.0.0.0
  - Children: 1.1.0.0, 1.2.0.0
  - Grandchild: 1.1.1.0
- ✅ Hierarchy displayed with proper indentation
- ✅ Items sorted by WBS code
- ✅ All parent-child relationships preserved

**Pass/Fail:** ⬜ PASS ⬜ FAIL

**Screenshot Required:** Yes

**Notes:**
_______________________________________________

---

#### Test 6.2: Filter by Phase

**Objective:** Test phase filtering end-to-end

**Test Steps:**
1. Create items in 3 different phases:
   - Design: 2 items
   - Procurement: 3 items
   - Construction: 1 item

2. Select "All Phases" - should show 6 items
3. Select "Design" - should show 2 items
4. Select "Procurement" - should show 3 items
5. Select "Construction" - should show 1 item

**Expected Results:**
- ✅ Filtering works correctly for each phase
- ✅ Item count updates correctly
- ✅ Only matching items are displayed
- ✅ Selected chip is highlighted
- ✅ Can switch between phases smoothly

**Pass/Fail:** ⬜ PASS ⬜ FAIL

**Screenshot Required:** Yes

**Notes:**
_______________________________________________

---

#### Test 6.3: Critical Path Workflow

**Objective:** Test critical path marking and display

**Test Steps:**
1. Create 3 sequential items
2. Mark item 2 as critical path
3. Set float days for items 1 and 3
4. View in WBS Management

**Expected Results:**
- ✅ Critical path item shows red badge
- ✅ Non-critical items show float days
- ✅ Visual distinction is clear

**Pass/Fail:** ⬜ PASS ⬜ FAIL

**Screenshot Required:** Yes

**Notes:**
_______________________________________________

---

#### Test 6.4: Milestone Marking

**Objective:** Test milestone creation and display

**Test Steps:**
1. Create regular item
2. Mark it as milestone
3. View in list

**Expected Results:**
- ✅ Milestone shows star indicator
- ✅ Easily distinguishable from regular items

**Pass/Fail:** ⬜ PASS ⬜ FAIL

**Screenshot Required:** Yes

**Notes:**
_______________________________________________

---

#### Test 6.5: Risk Management

**Objective:** Test risk level assignment and display

**Test Steps:**
1. Create 3 items with different risk levels
2. Add risk notes to high-risk item
3. View all items

**Expected Results:**
- ✅ Risk badges display correctly
- ✅ Risk notes are visible
- ✅ High-risk items are clearly flagged

**Pass/Fail:** ⬜ PASS ⬜ FAIL

**Screenshot Required:** Yes

**Notes:**
_______________________________________________

---

## Test Reporting Template

### Test Execution Summary

**Test Date:** _______________
**Tester Name:** _______________
**Device/Emulator:** _______________
**OS Version:** _______________
**App Version:** _______________

---

### Test Results Overview

| Sprint | Test Suite | Total Tests | Passed | Failed | Blocked | Pass Rate |
|--------|------------|-------------|--------|--------|---------|-----------|
| Sprint 1 | TemplateModuleModel | 6 | | | | |
| Sprint 1 | InterfacePointModel | 5 | | | | |
| Sprint 1 | WBSCodeGenerator | 6 | | | | |
| Sprint 2 | WBSManagementScreen | 7 | | | | |
| Sprint 2 | WBSItemCard | 10 | | | | |
| Integration | End-to-End | 5 | | | | |
| **TOTAL** | | **39** | | | | |

---

### Critical Issues Found

**Priority: HIGH**

| Issue ID | Test Case | Description | Severity | Status |
|----------|-----------|-------------|----------|--------|
| | | | | |
| | | | | |

**Priority: MEDIUM**

| Issue ID | Test Case | Description | Severity | Status |
|----------|-----------|-------------|----------|--------|
| | | | | |

**Priority: LOW**

| Issue ID | Test Case | Description | Severity | Status |
|----------|-----------|-------------|----------|--------|
| | | | | |

---

### Recommendations

1.
2.
3.

---

### Screenshots Attachment

Please attach all screenshots referenced in the test cases above.

**Naming Convention:** `test_[suite]_[case]_[result].png`

Example: `test_wbs_management_phase_filter_pass.png`

---

### Sign-Off

**Tested By:** _______________
**Date:** _______________
**Signature:** _______________

---

## Appendix: Test Data Setup Scripts

### Script 1: Create Sample WBS Structure

```typescript
// Add this to a test screen or App.tsx temporarily

const createSampleWBSStructure = async () => {
  const generator = new WBSCodeGenerator(database);
  const siteId = 'your-site-id'; // Replace with actual site ID

  await database.write(async () => {
    // Root item
    const rootCode = await generator.generateRootCode(siteId);
    const rootItem = await database.collections.get('items').create((item) => {
      item.name = '220kV Substation Project';
      item.siteId = siteId;
      item.categoryId = 'cat-id';
      item.wbsCode = rootCode;
      item.wbsLevel = 1;
      item.projectPhase = 'design';
      item.duration = 180;
      item.isCriticalPath = true;
      item.isMilestone = false;
      item.createdByRole = 'planner';
    });

    // Child 1
    const child1Code = await generator.generateChildCode(siteId, rootCode);
    await database.collections.get('items').create((item) => {
      item.name = 'Single Line Diagram';
      item.siteId = siteId;
      item.categoryId = 'cat-id';
      item.wbsCode = child1Code;
      item.wbsLevel = 2;
      item.parentWbsCode = rootCode;
      item.projectPhase = 'design';
      item.duration = 15;
      item.floatDays = 5;
      item.isCriticalPath = false;
      item.createdByRole = 'planner';
    });

    // Child 2
    const child2Code = await generator.generateChildCode(siteId, rootCode);
    await database.collections.get('items').create((item) => {
      item.name = 'Equipment Procurement';
      item.siteId = siteId;
      item.categoryId = 'cat-id';
      item.wbsCode = child2Code;
      item.wbsLevel = 2;
      item.parentWbsCode = rootCode;
      item.projectPhase = 'procurement';
      item.duration = 120;
      item.isCriticalPath = true;
      item.dependencyRisk = 'high';
      item.riskNotes = 'Long lead item - transformer delivery';
      item.createdByRole = 'planner';
    });

    console.log('✅ Sample WBS structure created');
  });
};
```

---

### Script 2: Clean Up Test Data

```typescript
const cleanUpTestData = async () => {
  await database.write(async () => {
    // Delete all items for a specific site
    const items = await database.collections
      .get('items')
      .query(Q.where('site_id', 'your-site-id'))
      .fetch();

    for (const item of items) {
      await item.destroyPermanently();
    }

    // Delete template modules
    const templates = await database.collections
      .get('template_modules')
      .query()
      .fetch();

    for (const template of templates) {
      await template.destroyPermanently();
    }

    // Delete interface points
    const interfaces = await database.collections
      .get('interface_points')
      .query()
      .fetch();

    for (const ip of interfaces) {
      await ip.destroyPermanently();
    }

    console.log('✅ Test data cleaned up');
  });
};
```

---

## End of Test Plan

**Total Test Cases:** 39
**Estimated Testing Time:** 4-6 hours
**Prerequisites:** Sprint 1 & 2 implementation complete

**Good luck with testing!** 🎯
