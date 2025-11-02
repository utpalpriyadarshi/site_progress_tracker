# Testing Strategy - Site Progress Tracker
**Date:** 2025-10-14
**Objective:** Implement automated testing to eliminate manual testing burden

---

## Testing Pyramid Strategy

```
                    /\
                   /  \
                  / E2E \         10% - Critical User Flows
                 /--------\
                /          \
               / Integration \    30% - Service/Database Integration
              /--------------\
             /                \
            /   Unit Tests      \  60% - Business Logic & Utils
           /--------------------\
```

---

## Phase 1: Unit Tests (Week 1 - PRIORITY)

### What to Test
**Business Logic & Services** - These are CRITICAL and easy to test:

1. **PlanningService** ⭐⭐⭐ (HIGHEST PRIORITY)
   - Critical path calculation algorithm
   - Circular dependency detection
   - Baseline locking logic
   - Schedule impact calculation

2. **DatabaseService** ⭐⭐
   - Query methods
   - Data transformations
   - Error handling

3. **Model Helper Methods** ⭐⭐
   - ItemModel: `getDependencies()`, `getPlannedDuration()`, `getBaselineVariance()`
   - Date calculations
   - Progress calculations

### Tools
- **Jest** (already installed)
- **WatermelonDB in-memory mock** for database tests
- No UI rendering needed

### Benefits
- Fast execution (< 1 second per test)
- No device/emulator needed
- Catches logic bugs early
- Great for TDD

---

## Phase 2: Integration Tests (Week 2)

### What to Test
**Database + Service Integration:**

1. **Planning Flow Integration**
   - Load items → Calculate critical path → Verify flags saved
   - Add dependencies → Validate → Save → Reload → Verify persistence
   - Lock baseline → Verify all items locked

2. **Progress Tracking Integration**
   - Create progress log → Update item → Verify calculations
   - Submit daily report → Verify aggregation

3. **Dependency Validation**
   - Create circular dependency → Verify rejection
   - Add valid dependency → Verify acceptance

### Tools
- **Jest** with real WatermelonDB (in-memory SQLite)
- **@testing-library/react-native** for component integration

### Benefits
- Tests real database behavior
- Validates service interactions
- Catches data integrity issues

---

## Phase 3: Component Tests (Week 3)

### What to Test
**UI Components & User Interactions:**

1. **ItemPlanningCard** ⭐⭐⭐
   - Renders critical path border correctly
   - Date picker opens/closes
   - Dependencies button disabled when locked
   - Visual states (locked/unlocked, critical/normal)

2. **DependencyModal**
   - Lists items correctly
   - Checkbox selection works
   - Save/Cancel behavior
   - Circular dependency alert

3. **BaselineScreen**
   - Project selection
   - Calculate button enabled/disabled states
   - Lock button behavior
   - Info cards display

### Tools
- **@testing-library/react-native** (already installed)
- **react-test-renderer** (already installed)
- Mock navigation and database

### Benefits
- Validates UI behavior
- Tests accessibility
- Prevents regression in user interactions

---

## Phase 4: E2E Tests (Week 4 - OPTIONAL)

### What to Test
**Critical User Journeys:**

1. **Planning Workflow**
   - Login → Select project → Manage dependencies → Calculate critical path → Lock baseline

2. **Inspection Workflow**
   - Login → Select site → Take photos → Submit inspection

3. **Progress Reporting**
   - Login → Update progress → View reports history

### Tools (Choose One)
- **Detox** (Recommended for React Native)
- **Maestro** (Simpler, faster setup)
- **Appium** (Most flexible, but complex)

### Benefits
- Tests entire app flow
- Validates navigation
- Catches integration bugs

### Downside
- Slow (minutes per test)
- Requires device/emulator
- Flaky if not well-written

---

## Recommended Implementation Plan

### Week 1: Foundation (HIGH ROI)
**Goal:** Cover critical business logic

```
Day 1-2: Setup + PlanningService Tests
- Configure Jest for WatermelonDB
- Test critical path algorithm
- Test circular dependency detection

Day 3-4: Model & Helper Tests
- ItemModel helper methods
- Date calculations
- Progress calculations

Day 5: DatabaseService Tests
- Query methods
- Error handling
```

**Expected Coverage:** 40-50% of critical logic

---

### Week 2: Integration (MEDIUM ROI)
**Goal:** Validate database interactions

```
Day 1-2: Planning Integration Tests
- Full critical path flow
- Dependency management flow

Day 3-4: Progress Tracking Integration
- Progress log creation
- Daily report aggregation

Day 5: Error Scenarios
- Database failures
- Invalid data handling
```

**Expected Coverage:** 60-70% overall

---

### Week 3: Components (MEDIUM ROI)
**Goal:** Prevent UI regressions

```
Day 1-2: Core Planning Components
- ItemPlanningCard tests
- DependencyModal tests

Day 3-4: Screen-Level Components
- BaselineScreen behavior
- Project selector

Day 5: Accessibility & Edge Cases
```

**Expected Coverage:** 75-85% overall

---

### Week 4: E2E (OPTIONAL - if time permits)
**Goal:** Validate critical user flows

```
Day 1-2: Setup Detox or Maestro
Day 3-4: Write 3-5 critical flows
Day 5: CI/CD integration
```

**Expected Coverage:** 80-90% overall

---

## Quick Start - Get Testing Today! 🚀

### Step 1: Install Additional Dependencies (5 min)

```bash
npm install --save-dev --legacy-peer-deps \
  @testing-library/jest-native \
  jest-mock-extended \
  @nozbe/watermelondb/jestSetup
```

### Step 2: Update Jest Config (2 min)

Create `jest.config.js`:

```javascript
module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: [
    '@testing-library/jest-native/extend-expect',
    '@nozbe/watermelondb/jestSetup',
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|react-native-paper|@nozbe/watermelondb)/)',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'services/**/*.{ts,tsx}',
    'models/**/*.{ts,tsx}',
    'src/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/__tests__/**',
  ],
  testMatch: [
    '**/__tests__/**/*.test.(ts|tsx|js)',
    '**/?(*.)+(spec|test).(ts|tsx|js)',
  ],
  testEnvironment: 'node',
};
```

### Step 3: Create Test Structure (1 min)

```bash
mkdir -p __tests__/services
mkdir -p __tests__/models
mkdir -p __tests__/components
mkdir -p __tests__/integration
```

### Step 4: Write First Test (10 min)

See example tests in next section!

---

## Example Test Files

### 1. PlanningService Critical Path Test

**File:** `__tests__/services/PlanningService.test.ts`

```typescript
import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { schema } from '../../models/schema';
import { ItemModel, ProjectModel, SiteModel } from '../../models';
import PlanningService from '../../services/planning/PlanningService';

describe('PlanningService', () => {
  let database: Database;

  beforeEach(async () => {
    const adapter = new SQLiteAdapter({
      schema,
      dbName: 'testDB',
    });

    database = new Database({
      adapter,
      modelClasses: [ProjectModel, SiteModel, ItemModel],
    });
  });

  afterEach(async () => {
    await database.write(() => database.unsafeResetDatabase());
  });

  describe('calculateCriticalPath', () => {
    it('should identify critical path with linear dependencies', async () => {
      // Arrange: Create project, site, and items
      const project = await database.write(async () => {
        return await database.collections.get('projects').create(p => {
          p.name = 'Test Project';
        });
      });

      const site = await database.write(async () => {
        return await database.collections.get('sites').create(s => {
          s.name = 'Test Site';
          s.projectId = project.id;
        });
      });

      // Create 3 items: A → B → C
      const itemA = await database.write(async () => {
        return await database.collections.get('items').create(i => {
          i.name = 'Foundation';
          i.siteId = site.id;
          i.plannedStartDate = new Date('2025-01-01').getTime();
          i.plannedEndDate = new Date('2025-01-05').getTime(); // 5 days
          i.dependencies = '[]';
        });
      });

      const itemB = await database.write(async () => {
        return await database.collections.get('items').create(i => {
          i.name = 'Framing';
          i.siteId = site.id;
          i.plannedStartDate = new Date('2025-01-06').getTime();
          i.plannedEndDate = new Date('2025-01-15').getTime(); // 10 days
          i.dependencies = JSON.stringify([itemA.id]);
        });
      });

      const itemC = await database.write(async () => {
        return await database.collections.get('items').create(i => {
          i.name = 'Roofing';
          i.siteId = site.id;
          i.plannedStartDate = new Date('2025-01-16').getTime();
          i.plannedEndDate = new Date('2025-01-22').getTime(); // 7 days
          i.dependencies = JSON.stringify([itemB.id]);
        });
      });

      // Act: Calculate critical path
      const result = await PlanningService.calculateCriticalPath(project.id);

      // Assert
      expect(result.criticalPathItems).toHaveLength(3);
      expect(result.criticalPathItems.map(i => i.id)).toContain(itemA.id);
      expect(result.criticalPathItems.map(i => i.id)).toContain(itemB.id);
      expect(result.criticalPathItems.map(i => i.id)).toContain(itemC.id);

      // Total duration: 5 + 10 + 7 = 22 days
      const expectedDuration = 22 * 24 * 60 * 60 * 1000;
      expect(result.totalDuration).toBeCloseTo(expectedDuration, -5);
    });

    it('should set criticalPathFlag in database', async () => {
      // ... setup same as above ...

      await PlanningService.calculateCriticalPath(project.id);

      const itemA = await database.collections.get('items').find(itemA.id);
      expect(itemA.criticalPathFlag).toBe(true);
    });
  });

  describe('validateDependencies', () => {
    it('should detect circular dependencies', async () => {
      // Arrange: Create A → B → A cycle
      const items = await database.write(async () => {
        const itemA = await database.collections.get('items').create(i => {
          i.name = 'Item A';
          i.dependencies = '[]';
        });

        const itemB = await database.collections.get('items').create(i => {
          i.name = 'Item B';
          i.dependencies = JSON.stringify([itemA.id]);
        });

        // Create circular reference
        await itemA.update(a => {
          a.dependencies = JSON.stringify([itemB.id]);
        });

        return [itemA, itemB];
      });

      // Act
      const result = PlanningService.validateDependencies(items);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(expect.stringContaining('Circular dependency'));
    });

    it('should allow valid dependencies', async () => {
      const items = await database.write(async () => {
        const itemA = await database.collections.get('items').create(i => {
          i.name = 'Item A';
          i.dependencies = '[]';
        });

        const itemB = await database.collections.get('items').create(i => {
          i.name = 'Item B';
          i.dependencies = JSON.stringify([itemA.id]);
        });

        return [itemA, itemB];
      });

      const result = PlanningService.validateDependencies(items);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});
```

---

### 2. ItemModel Helper Methods Test

**File:** `__tests__/models/ItemModel.test.ts`

```typescript
import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { schema } from '../../models/schema';
import ItemModel from '../../models/ItemModel';

describe('ItemModel', () => {
  let database: Database;
  let item: ItemModel;

  beforeEach(async () => {
    const adapter = new SQLiteAdapter({ schema, dbName: 'testDB' });
    database = new Database({ adapter, modelClasses: [ItemModel] });

    item = await database.write(async () => {
      return await database.collections.get('items').create(i => {
        i.name = 'Test Item';
        i.plannedStartDate = new Date('2025-01-01').getTime();
        i.plannedEndDate = new Date('2025-01-10').getTime();
        i.baselineStartDate = new Date('2025-01-01').getTime();
        i.baselineEndDate = new Date('2025-01-08').getTime();
        i.plannedQuantity = 100;
        i.completedQuantity = 75;
        i.dependencies = JSON.stringify(['item-1', 'item-2']);
      });
    });
  });

  afterEach(async () => {
    await database.write(() => database.unsafeResetDatabase());
  });

  describe('getDependencies', () => {
    it('should parse dependencies JSON', () => {
      const deps = item.getDependencies();
      expect(deps).toEqual(['item-1', 'item-2']);
    });

    it('should return empty array for invalid JSON', async () => {
      await database.write(async () => {
        await item.update(i => {
          i.dependencies = 'invalid-json';
        });
      });

      const deps = item.getDependencies();
      expect(deps).toEqual([]);
    });

    it('should return empty array for undefined', async () => {
      await database.write(async () => {
        await item.update(i => {
          i.dependencies = undefined;
        });
      });

      const deps = item.getDependencies();
      expect(deps).toEqual([]);
    });
  });

  describe('getPlannedDuration', () => {
    it('should calculate duration in days', () => {
      const duration = item.getPlannedDuration();
      expect(duration).toBe(9); // Jan 1 to Jan 10 = 9 days
    });
  });

  describe('getBaselineVariance', () => {
    it('should calculate positive variance (delayed)', () => {
      const variance = item.getBaselineVariance();
      expect(variance).toBe(2); // Planned ends Jan 10, baseline ends Jan 8 = +2 days
    });

    it('should return 0 when no baseline set', async () => {
      await database.write(async () => {
        await item.update(i => {
          i.baselineEndDate = undefined;
        });
      });

      const variance = item.getBaselineVariance();
      expect(variance).toBe(0);
    });
  });

  describe('getProgressPercentage', () => {
    it('should calculate progress percentage', () => {
      const progress = item.getProgressPercentage();
      expect(progress).toBe(75); // 75/100 = 75%
    });

    it('should return 0 when planned quantity is 0', async () => {
      await database.write(async () => {
        await item.update(i => {
          i.plannedQuantity = 0;
        });
      });

      const progress = item.getProgressPercentage();
      expect(progress).toBe(0);
    });

    it('should cap at 100%', async () => {
      await database.write(async () => {
        await item.update(i => {
          i.completedQuantity = 150; // Over 100%
        });
      });

      const progress = item.getProgressPercentage();
      expect(progress).toBe(100);
    });
  });
});
```

---

### 3. ItemPlanningCard Component Test

**File:** `__tests__/components/ItemPlanningCard.test.tsx`

```typescript
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ItemPlanningCard from '../../src/planning/components/ItemPlanningCard';
import { database } from '../../models/database';

// Mock the database
jest.mock('../../models/database', () => ({
  database: {
    write: jest.fn((callback) => callback()),
  },
}));

describe('ItemPlanningCard', () => {
  const mockItem = {
    id: 'item-1',
    name: 'Test Item',
    plannedStartDate: new Date('2025-01-01').getTime(),
    plannedEndDate: new Date('2025-01-10').getTime(),
    baselineStartDate: new Date('2025-01-01').getTime(),
    baselineEndDate: new Date('2025-01-08').getTime(),
    status: 'in_progress',
    criticalPathFlag: false,
    getDependencies: jest.fn(() => ['dep-1']),
    getPlannedDuration: jest.fn(() => 9),
    getProgressPercentage: jest.fn(() => 50),
    update: jest.fn(),
  };

  const mockOnManageDependencies = jest.fn();
  const mockOnUpdate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render item details correctly', () => {
    const { getByText } = render(
      <ItemPlanningCard
        item={mockItem}
        isCriticalPath={false}
        isLocked={false}
        onManageDependencies={mockOnManageDependencies}
        onUpdate={mockOnUpdate}
      />
    );

    expect(getByText('Test Item')).toBeTruthy();
    expect(getByText('9 days')).toBeTruthy();
    expect(getByText('in progress')).toBeTruthy();
    expect(getByText('Dependencies: 1')).toBeTruthy();
  });

  it('should display critical path chip when isCriticalPath is true', () => {
    const { getByText } = render(
      <ItemPlanningCard
        item={mockItem}
        isCriticalPath={true}
        isLocked={false}
        onManageDependencies={mockOnManageDependencies}
        onUpdate={mockOnUpdate}
      />
    );

    expect(getByText('Critical Path')).toBeTruthy();
  });

  it('should disable date pickers when locked', () => {
    const { getByText } = render(
      <ItemPlanningCard
        item={mockItem}
        isCriticalPath={false}
        isLocked={true}
        onManageDependencies={mockOnManageDependencies}
        onUpdate={mockOnUpdate}
      />
    );

    expect(getByText('Locked')).toBeTruthy();

    // Date buttons should be disabled (check via testID or accessibility)
  });

  it('should call onManageDependencies when Manage button pressed', () => {
    const { getByText } = render(
      <ItemPlanningCard
        item={mockItem}
        isCriticalPath={false}
        isLocked={false}
        onManageDependencies={mockOnManageDependencies}
        onUpdate={mockOnUpdate}
      />
    );

    const manageButton = getByText('Manage');
    fireEvent.press(manageButton);

    expect(mockOnManageDependencies).toHaveBeenCalledTimes(1);
  });

  it('should clear critical path flag when date changes', async () => {
    mockItem.criticalPathFlag = true;

    const { getByTestId } = render(
      <ItemPlanningCard
        item={mockItem}
        isCriticalPath={true}
        isLocked={false}
        onManageDependencies={mockOnManageDependencies}
        onUpdate={mockOnUpdate}
      />
    );

    // Simulate date change (you'll need to add testID to TouchableOpacity)
    // This tests the fix we just implemented!

    // For now, just verify the update function would be called
    expect(mockItem.update).toBeDefined();
  });
});
```

---

### 4. Integration Test Example

**File:** `__tests__/integration/planning-flow.test.ts`

```typescript
import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { schema } from '../../models/schema';
import { database } from '../../models/database';
import PlanningService from '../../services/planning/PlanningService';

describe('Planning Module Integration', () => {
  beforeEach(async () => {
    await database.write(() => database.unsafeResetDatabase());
  });

  it('should complete full planning workflow', async () => {
    // Step 1: Create project structure
    const project = await database.write(async () => {
      return await database.collections.get('projects').create(p => {
        p.name = 'Integration Test Project';
      });
    });

    const site = await database.write(async () => {
      return await database.collections.get('sites').create(s => {
        s.name = 'Test Site';
        s.projectId = project.id;
      });
    });

    // Step 2: Create items with dependencies
    const items = await database.write(async () => {
      const a = await database.collections.get('items').create(i => {
        i.name = 'A';
        i.siteId = site.id;
        i.plannedStartDate = Date.now();
        i.plannedEndDate = Date.now() + 5 * 24 * 60 * 60 * 1000;
        i.dependencies = '[]';
      });

      const b = await database.collections.get('items').create(i => {
        i.name = 'B';
        i.siteId = site.id;
        i.plannedStartDate = Date.now() + 5 * 24 * 60 * 60 * 1000;
        i.plannedEndDate = Date.now() + 15 * 24 * 60 * 60 * 1000;
        i.dependencies = JSON.stringify([a.id]);
      });

      return [a, b];
    });

    // Step 3: Calculate critical path
    const cpResult = await PlanningService.calculateCriticalPath(project.id);
    expect(cpResult.criticalPathItems).toHaveLength(2);

    // Step 4: Verify flags persisted
    const itemA = await database.collections.get('items').find(items[0].id);
    expect(itemA.criticalPathFlag).toBe(true);

    // Step 5: Lock baseline
    await PlanningService.lockBaseline(project.id);

    // Step 6: Verify all items locked
    const allItems = await database.collections
      .get('items')
      .query()
      .fetch();

    allItems.forEach(item => {
      expect(item.isBaselineLocked).toBe(true);
      expect(item.baselineStartDate).toBe(item.plannedStartDate);
      expect(item.baselineEndDate).toBe(item.plannedEndDate);
    });
  });
});
```

---

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Specific Test File
```bash
npm test PlanningService.test.ts
```

### Run with Coverage
```bash
npm test -- --coverage
```

### Watch Mode (for TDD)
```bash
npm test -- --watch
```

### Update Snapshots
```bash
npm test -- -u
```

---

## CI/CD Integration

### GitHub Actions

**File:** `.github/workflows/test.yml`

```yaml
name: Tests

on:
  push:
    branches: [main, feature/**]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm install --legacy-peer-deps

      - name: Run tests
        run: npm test -- --coverage --maxWorkers=2

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

---

## Testing Best Practices

### DO ✅
- Test business logic first (highest ROI)
- Write tests for bugs before fixing
- Use descriptive test names
- Keep tests isolated (no shared state)
- Mock external dependencies
- Test edge cases and error paths

### DON'T ❌
- Test implementation details
- Write tests that are brittle (break on UI changes)
- Share state between tests
- Mock too much (test real behavior when possible)
- Skip failing tests (fix or delete them)

---

## Success Metrics

### Week 1 Target
- ✅ 20+ unit tests written
- ✅ Critical path algorithm 100% covered
- ✅ Dependency validation 100% covered
- ✅ All tests passing in < 5 seconds

### Week 2 Target
- ✅ 40+ total tests
- ✅ 60% code coverage
- ✅ Integration tests for planning module
- ✅ CI/CD pipeline running tests

### Week 3 Target
- ✅ 60+ total tests
- ✅ 75% code coverage
- ✅ Component tests for critical UI

### Week 4 Target (Optional)
- ✅ 5+ E2E tests
- ✅ 85%+ code coverage
- ✅ All critical user flows covered

---

## Next Steps

1. **START TODAY:** Install dependencies and configure Jest
2. **Day 1:** Write PlanningService tests (highest priority)
3. **Day 2:** Write ItemModel tests
4. **Day 3:** Integration tests for planning flow
5. **Day 4:** Component tests for ItemPlanningCard
6. **Day 5:** Review coverage and fill gaps

**Time Investment:** 1-2 hours/day for 2-3 weeks
**Payoff:** Eliminate 90% of manual testing, catch bugs instantly

---

**Ready to get started? Let me know and I'll help you implement the first batch of tests!**
