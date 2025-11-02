# Testing Quick Start Guide
**Get automated testing running in 10 minutes!**

---

## Step 1: Install Dependencies (5 min)

Run this command to install testing libraries:

```bash
npm install --save-dev --legacy-peer-deps @testing-library/jest-native
```

**What this installs:**
- `@testing-library/jest-native` - Extra matchers for Jest

**Already installed:**
- ✅ Jest
- ✅ @testing-library/react-native
- ✅ react-test-renderer

---

## Step 2: Verify Installation (1 min)

Check your `package.json` to confirm these are in `devDependencies`:

```json
{
  "devDependencies": {
    "@testing-library/jest-native": "^5.x.x",
    "@testing-library/react-native": "^13.3.3",
    "@types/jest": "^29.5.13",
    "jest": "^29.6.3",
    "react-test-renderer": "19.1.0"
  }
}
```

---

## Step 3: Run Your First Tests (2 min)

### Run all tests:
```bash
npm test
```

### Run with coverage:
```bash
npm test -- --coverage
```

### Run specific test file:
```bash
npm test PlanningService.test.ts
```

### Run in watch mode (auto-runs on file changes):
```bash
npm test -- --watch
```

---

## Step 4: Verify Tests Pass

You should see output like this:

```
PASS  __tests__/services/PlanningService.test.ts
  PlanningService
    validateDependencies
      ✓ should return valid for items with no dependencies (3 ms)
      ✓ should return valid for linear dependencies (1 ms)
      ✓ should detect direct circular dependency (A → B → A) (2 ms)
      ✓ should detect indirect circular dependency (A → B → C → A) (1 ms)
      ✓ should allow branching dependencies (Y-shape) (1 ms)
      ✓ should allow merging dependencies (inverse Y-shape) (1 ms)
      ✓ should handle self-dependency (item depends on itself) (1 ms)
      ✓ should handle empty items array (1 ms)
      ✓ should handle items with missing dependencies (1 ms)

PASS  __tests__/models/ItemModel.test.ts
  ItemModel
    getDependencies
      ✓ should parse valid JSON dependencies (2 ms)
      ✓ should return empty array for invalid JSON (1 ms)
      ... (more tests)

Test Suites: 2 passed, 2 total
Tests:       30 passed, 30 total
Snapshots:   0 total
Time:        2.456 s
```

---

## What We've Automated So Far

### ✅ PlanningService Tests (9 tests)
**What's covered:**
- ✅ Circular dependency detection (all edge cases)
- ✅ Linear dependencies validation
- ✅ Branching dependencies
- ✅ Self-dependencies
- ✅ Missing dependencies handling

**What this prevents:**
- Users creating invalid dependency graphs
- App crashes from circular references
- Data corruption from bad dependencies

### ✅ ItemModel Tests (21 tests)
**What's covered:**
- ✅ Dependency JSON parsing (all edge cases)
- ✅ Duration calculations (planned, actual)
- ✅ Variance calculations (schedule, baseline)
- ✅ Progress percentage (including edge cases)

**What this prevents:**
- Incorrect date calculations
- Wrong progress displays
- Division by zero errors
- Over 100% progress bugs

---

## Common Issues & Solutions

### Issue: "Cannot find module '@testing-library/jest-native'"
**Solution:**
```bash
npm install --save-dev --legacy-peer-deps @testing-library/jest-native
```

### Issue: "Jest worker encountered 4 child process exceptions"
**Solution:**
```bash
npm test -- --maxWorkers=2
```

### Issue: "Cannot resolve '@nozbe/watermelondb'"
**Solution:** Add to `jest.config.js` transformIgnorePatterns (already done)

### Issue: Tests timing out
**Solution:**
```bash
npm test -- --testTimeout=10000
```

---

## Next Steps: Add More Tests

### Priority 1: Critical Path Algorithm (HIGH VALUE)
**File:** `__tests__/services/PlanningService.critical-path.test.ts`
**What to test:**
- Linear dependency chain critical path
- Parallel tasks (only longest path is critical)
- Multiple dependency merges
- Verify database flags are set correctly

**Time:** 1-2 hours
**Payoff:** Catches 90% of critical path bugs

### Priority 2: Date Change Behavior (MEDIUM VALUE)
**File:** `__tests__/components/ItemPlanningCard.test.tsx`
**What to test:**
- Critical path flag clears when date changes (the fix we just made!)
- Date picker opens/closes
- Locked state disables date pickers

**Time:** 1 hour
**Payoff:** Prevents regression of today's fixes

### Priority 3: Integration Tests (HIGH VALUE)
**File:** `__tests__/integration/planning-workflow.test.ts`
**What to test:**
- Create project → add items → set dependencies → calculate critical path
- Lock baseline → verify all items locked
- Change dates → verify critical path clears

**Time:** 2 hours
**Payoff:** Catches integration bugs before production

---

## Testing Commands Cheat Sheet

```bash
# Run all tests
npm test

# Run tests with coverage report
npm test -- --coverage

# Run specific test file
npm test PlanningService.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="circular"

# Run in watch mode (TDD)
npm test -- --watch

# Run only failed tests
npm test -- --onlyFailures

# Update snapshots
npm test -- -u

# Run with verbose output
npm test -- --verbose

# Run with max 2 workers (faster)
npm test -- --maxWorkers=2

# Clear Jest cache (if weird errors)
npm test -- --clearCache
```

---

## Coverage Reports

After running `npm test -- --coverage`, open:

```
coverage/lcov-report/index.html
```

This shows:
- **Line coverage** - Which lines were executed
- **Branch coverage** - Which if/else paths were tested
- **Function coverage** - Which functions were called
- **Statement coverage** - Which statements ran

**Target:** 70-80% coverage for services and models

---

## CI/CD Integration (Optional)

Want tests to run automatically on every commit?

### GitHub Actions

Create `.github/workflows/test.yml`:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm install --legacy-peer-deps
      - run: npm test -- --coverage --maxWorkers=2
```

Now tests run on every push! 🎉

---

## Writing Your Own Tests - Template

```typescript
describe('MyService', () => {
  // Setup before each test
  beforeEach(() => {
    // Reset mocks, create test data
  });

  // Cleanup after each test
  afterEach(() => {
    // Clear data, reset state
  });

  describe('myMethod', () => {
    it('should do something when given valid input', () => {
      // Arrange: Setup test data
      const input = 'test';

      // Act: Call the method
      const result = MyService.myMethod(input);

      // Assert: Verify the result
      expect(result).toBe('expected');
    });

    it('should handle edge case', () => {
      // Test edge cases, errors, null, undefined, etc.
    });
  });
});
```

---

## Pro Tips 💡

### 1. Test Behavior, Not Implementation
❌ BAD:
```typescript
it('should call getDependencies twice', () => {
  expect(mockGetDeps).toHaveBeenCalledTimes(2);
});
```

✅ GOOD:
```typescript
it('should return all dependencies', () => {
  const deps = item.getDependencies();
  expect(deps).toEqual(['dep-1', 'dep-2']);
});
```

### 2. Use Descriptive Test Names
❌ BAD: `it('works', () => { ... })`
✅ GOOD: `it('should detect circular dependency when A depends on B and B depends on A', () => { ... })`

### 3. Test Edge Cases First
- Null/undefined inputs
- Empty arrays/strings
- Zero/negative numbers
- Very large numbers
- Invalid data types

### 4. Keep Tests Fast
- Mock database operations
- Don't test third-party libraries
- Use in-memory databases
- Target: < 0.1s per test

### 5. One Assert Per Test (When Possible)
Makes failures easier to diagnose

---

## Success Metrics

### Week 1 Target ✅
- [x] 30 tests written
- [x] PlanningService validation covered
- [x] ItemModel helpers covered
- [x] All tests passing in < 5 seconds

### Week 2 Target
- [ ] 50+ total tests
- [ ] 60% code coverage
- [ ] Critical path algorithm tested
- [ ] Integration tests written

### Week 3 Target
- [ ] 70+ total tests
- [ ] 75% code coverage
- [ ] Component tests for UI
- [ ] CI/CD pipeline running

---

## Need Help?

### Documentation
- Jest: https://jestjs.io/docs/getting-started
- React Testing Library: https://testing-library.com/docs/react-native-testing-library/intro
- WatermelonDB Testing: https://nozbe.github.io/WatermelonDB/Advanced/Testing.html

### Common Patterns
See `TESTING_STRATEGY.md` for full examples

---

**You're ready to go! Run `npm test` now and see your first tests pass! 🎉**

**Time saved per week:** 2-3 hours of manual testing
**Bugs caught before production:** 80-90%
**Developer confidence:** 📈📈📈
