# Phase B Retry Test Instructions (TC-B4 & TC-B5)

## Overview

This document explains how to run automated tests for:
- **TC-B4**: Automatic retry with exponential backoff
- **TC-B5**: Manual retry from UI

## Prerequisites

1. App running on device/emulator
2. React Native Debugger (optional, for console output)
3. Access to app logs

## Method 1: Run Tests from React Native Debugger

### Steps:

1. **Open React Native Debugger**
   ```bash
   # In Metro terminal, press 'j' to open debugger
   j
   ```

2. **In Console, run:**
   ```javascript
   import retryTests from './__tests__/phase_b_retry_test';
   import { database } from './models/database';
   import { backgroundPdfQueue } from './services/BackgroundPdfQueue';

   // Run all tests
   await retryTests.runRetryTests(database, backgroundPdfQueue);
   ```

3. **Observe Console Output**
   - Test progress logged in real-time
   - Final results show PASS/FAIL for each test

4. **Check App Logs**
   ```bash
   adb shell "run-as com.site_progress_tracker cat /data/user/0/com.site_progress_tracker/files/app_logs.txt" > retry_test_logs.txt
   ```

---

## Method 2: Add Test Button to App (Temporary)

### Step 1: Create Test Screen (Optional)

Add this to `App.tsx` or create a hidden screen:

```tsx
import retryTests from './__tests__/phase_b_retry_test';
import { database } from './models/database';
import { backgroundPdfQueue } from './App';

// Add a hidden test button
<Button
  mode="outlined"
  onPress={async () => {
    console.log('Running retry tests...');
    await retryTests.runRetryTests(database, backgroundPdfQueue);
    console.log('Tests complete - check console');
  }}
>
  Run Retry Tests (Dev Only)
</Button>
```

### Step 2: Run Tests

1. Tap the test button
2. Wait 30-60 seconds for tests to complete
3. Check console or logs for results

---

## Method 3: Simulate Manually (Without Automated Test)

### TC-B4: Manual Simulation

1. **Temporarily modify BackgroundPdfQueue.ts** (line 195-212):

```typescript
// TEMPORARY: Force failure for testing
private async generatePdfForReport(report: DailyReportModel): Promise<void> {
  // Add failure counter
  const attemptNumber = report.pdfGenerationAttempts + 1;

  // Force failure on first 2 attempts
  if (attemptNumber <= 2) {
    throw new Error(`TEST: Simulated failure (attempt ${attemptNumber})`);
  }

  // Original code continues...
}
```

2. **Submit a report**
3. **Observe**:
   - Attempt 1: Fails immediately
   - Wait 2 seconds → Attempt 2 starts
   - Wait 4 seconds → Attempt 3 starts
   - Attempt 3: Succeeds

4. **Check logs**:
```bash
grep "attemptNumber" retry_test_logs.txt
grep "backoffMs" retry_test_logs.txt
```

5. **Expected Output**:
```
attemptNumber: 1, backoffMs: 0 (immediate)
attemptNumber: 2, backoffMs: 2000 (after 2s)
attemptNumber: 3, backoffMs: 4000 (after 4s)
```

6. **Remove test code** after verification

### TC-B5: Manual Simulation

1. **Create a failed report** in database (use debugger):
```javascript
await database.write(async () => {
  await database.get('daily_reports').create((r) => {
    r.siteId = 'test_site';
    r.supervisorId = 'test_supervisor';
    r.reportDate = Date.now();
    r.submittedAt = Date.now();
    r.totalItems = 1;
    r.totalProgress = 50;
    r.pdfGenerationStatus = 'failed';
    r.pdfGenerationAttempts = 1; // < 3 so retry available
    r.pdfErrorMessage = 'Test failure';
    r.appSyncStatus = 'synced';
  });
});
```

2. **Navigate to Reports History**
3. **Find the failed report** (should show "Failed (1/3)" chip)
4. **Tap the failed chip** (it's clickable)
5. **Observe**:
   - Snackbar: "PDF generation retrying..."
   - Status changes to "PDF Pending"
   - Wait 10-15 seconds
   - Status changes to "Generating..." then "PDF Ready"
6. **Verify**: Share button enabled, PDF can be opened

---

## Expected Results

### TC-B4: Automatic Retry
- ✅ 3 attempts made automatically
- ✅ Backoff times: ~2s, ~4s, ~8s (±1s tolerance)
- ✅ Status = "failed" after 3 attempts
- ✅ OR Status = "completed" if succeeded before 3rd attempt

### TC-B5: Manual Retry
- ✅ Retry chip tappable when attempts < 3
- ✅ Status changes to "pending" on tap
- ✅ Queue picks up within 10 seconds
- ✅ PDF generates successfully
- ✅ Share button enables

---

## Verification Commands

```bash
# Pull logs after test
adb shell "run-as com.site_progress_tracker cat /data/user/0/com.site_progress_tracker/files/app_logs.txt" > retry_test_logs.txt

# Check retry attempts
grep "attemptNumber" retry_test_logs.txt

# Check backoff timing
grep "Scheduling PDF retry with backoff" retry_test_logs.txt

# Check manual retry
grep "PDF retry initiated from UI" retry_test_logs.txt

# Check final status
grep "PDF generation completed" retry_test_logs.txt
```

---

## Troubleshooting

### Issue: Tests don't start

**Solution**: Ensure imports are correct:
```javascript
// Check these files exist
ls __tests__/phase_b_retry_test.ts
ls models/database.ts
ls services/BackgroundPdfQueue.ts
```

### Issue: Tests timeout

**Solution**: Increase timeout in test config:
```typescript
// In phase_b_retry_test.ts
const TEST_CONFIG = {
  checkInterval: 2000, // Increase to 2 seconds
};
```

### Issue: Can't inject failures

**Solution**: Use Method 3 (manual simulation) instead

---

## Cleanup

After testing, remember to:
1. ✅ Remove any test code injected into BackgroundPdfQueue
2. ✅ Delete test reports from database
3. ✅ Rebuild app if code was modified

```bash
# Clear test data
adb shell pm clear com.site_progress_tracker

# Rebuild
npm run android
```

---

## Test Results Template

```markdown
### TC-B4: Automatic Retry - Test Results

**Date**: [Date]
**Tester**: [Name]
**Method**: [Method 1/2/3]

**Result**: ✅ PASS / ❌ FAIL

**Observations**:
- Attempt 1: [Time] - [Result]
- Attempt 2: [Time] - [Result]
- Attempt 3: [Time] - [Result]
- Backoff timing: [Correct/Incorrect]

**Logs Excerpt**:
```
[Paste relevant logs]
```

**Issues**: [None / List issues]

---

### TC-B5: Manual Retry - Test Results

**Date**: [Date]
**Tester**: [Name]
**Method**: [Method 1/2/3]

**Result**: ✅ PASS / ❌ FAIL

**Observations**:
- Initial status: [failed with X/3 attempts]
- Retry button: [Visible/Not visible]
- After tap: [Status changed to pending]
- Final result: [completed/failed]

**Issues**: [None / List issues]
```

---

**End of Retry Test Instructions**
