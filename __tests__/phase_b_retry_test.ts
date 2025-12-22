/**
 * Phase B - Automated Retry Test (TC-B4 & TC-B5)
 *
 * This test simulates PDF generation failures to verify:
 * - TC-B4: Automatic retry with exponential backoff
 * - TC-B5: Manual retry from UI
 *
 * Usage:
 * 1. Run this test before manual testing
 * 2. Check app logs for retry behavior
 * 3. Verify UI shows correct status and retry button
 */

import { Database } from '@nozbe/watermelondb';
import { BackgroundPdfQueue } from '../services/BackgroundPdfQueue';
import { ReportPdfService } from '../services/pdf/ReportPdfService';

/**
 * Test Configuration
 */
const TEST_CONFIG = {
  // Number of failures to simulate before success
  failuresBeforeSuccess: 2, // Will fail twice, succeed on 3rd attempt

  // Whether to test manual retry (TC-B5)
  testManualRetry: true,

  // Delay between checks (ms)
  checkInterval: 1000,
};

/**
 * Simulated Failure Counter
 * This will be injected into ReportPdfService to cause failures
 */
let failureCount = 0;

/**
 * TC-B4: Test Automatic Retry with Exponential Backoff
 *
 * Expected Behavior:
 * - Attempt 1: Fails immediately
 * - Wait 2 seconds
 * - Attempt 2: Fails after 2s backoff
 * - Wait 4 seconds
 * - Attempt 3: Fails after 4s backoff
 * - Status = "failed", attempts = 3
 */
export async function testAutomaticRetry(
  database: Database,
  backgroundPdfQueue: BackgroundPdfQueue
): Promise<{
  passed: boolean;
  details: string;
  logs: string[];
}> {
  console.log('🧪 Starting TC-B4: Automatic Retry Test');

  const logs: string[] = [];
  const startTime = Date.now();

  try {
    // Step 1: Create a test report
    logs.push('Creating test report...');
    const report = await database.write(async () => {
      return await database.get('daily_reports').create((r: any) => {
        r.siteId = 'test_site_retry';
        r.supervisorId = 'test_supervisor';
        r.reportDate = Date.now();
        r.submittedAt = Date.now();
        r.totalItems = 1;
        r.totalProgress = 50;
        r.pdfPath = '';
        r.notes = 'Test report for retry logic';
        r.pdfGenerationStatus = 'pending';
        r.pdfGenerationAttempts = 0;
        r.pdfLastAttemptTimestamp = null;
        r.pdfErrorMessage = null;
        r.pdfErrorTimestamp = null;
        r.pdfPhotoCount = null;
        r.appSyncStatus = 'synced';
      });
    });

    logs.push(`✅ Test report created: ${report.id}`);

    // Step 2: Inject failure logic
    logs.push('Injecting failure logic into PDF service...');
    const originalGenerate = ReportPdfService.generateComprehensiveReport;

    ReportPdfService.generateComprehensiveReport = async (reportData: any) => {
      failureCount++;
      logs.push(`Attempt ${failureCount}: Simulating failure...`);

      if (failureCount <= TEST_CONFIG.failuresBeforeSuccess) {
        throw new Error(`Simulated PDF generation failure (attempt ${failureCount})`);
      }

      // Success on 3rd attempt
      logs.push(`Attempt ${failureCount}: Success!`);
      return originalGenerate(reportData);
    };

    // Step 3: Enqueue report (this will trigger automatic retries)
    logs.push('Enqueueing report for PDF generation...');
    await backgroundPdfQueue.enqueueReport(report.id);

    // Step 4: Monitor retry attempts
    logs.push('Monitoring retry attempts...');
    let previousAttempts = 0;
    let retryTimes: number[] = [];
    let lastCheckTime = startTime;

    for (let i = 0; i < 60; i++) { // Monitor for 60 seconds max
      await new Promise(resolve => setTimeout(resolve, TEST_CONFIG.checkInterval));

      // Refresh report from database
      const updatedReport = await database.get('daily_reports').find(report.id);
      const currentAttempts = updatedReport.pdfGenerationAttempts;
      const currentStatus = updatedReport.pdfGenerationStatus;

      // Log attempt changes
      if (currentAttempts > previousAttempts) {
        const timeSinceLastAttempt = Date.now() - lastCheckTime;
        retryTimes.push(timeSinceLastAttempt);
        logs.push(
          `📊 Attempt ${currentAttempts} completed. ` +
          `Time since last: ${timeSinceLastAttempt}ms. ` +
          `Status: ${currentStatus}`
        );
        previousAttempts = currentAttempts;
        lastCheckTime = Date.now();
      }

      // Check if done (failed after 3 attempts OR succeeded)
      if (currentStatus === 'failed' || currentStatus === 'completed') {
        logs.push(`✅ Final status: ${currentStatus}`);
        logs.push(`Total attempts: ${currentAttempts}`);
        break;
      }
    }

    // Step 5: Restore original function
    ReportPdfService.generateComprehensiveReport = originalGenerate;

    // Step 6: Verify exponential backoff timing
    logs.push('\n📈 Backoff Analysis:');
    const expectedBackoffs = [2000, 4000, 8000]; // 2s, 4s, 8s
    let backoffCorrect = true;

    retryTimes.forEach((time, index) => {
      if (index === 0) return; // Skip first attempt (immediate)

      const expected = expectedBackoffs[index - 1];
      const tolerance = 1000; // 1 second tolerance
      const difference = Math.abs(time - expected);
      const isCorrect = difference <= tolerance;

      logs.push(
        `  Attempt ${index + 1}: ${time}ms (expected ~${expected}ms) ` +
        `${isCorrect ? '✅' : '❌'}`
      );

      if (!isCorrect) backoffCorrect = false;
    });

    // Step 7: Determine pass/fail
    const updatedReport = await database.get('daily_reports').find(report.id);
    const finalAttempts = updatedReport.pdfGenerationAttempts;
    const finalStatus = updatedReport.pdfGenerationStatus;

    const passed =
      finalAttempts === 3 &&
      (finalStatus === 'failed' || finalStatus === 'completed') &&
      backoffCorrect;

    const details = passed
      ? '✅ TC-B4 PASSED: Retry logic working correctly with exponential backoff'
      : '❌ TC-B4 FAILED: Check logs for details';

    return { passed, details, logs };

  } catch (error) {
    logs.push(`❌ Test error: ${(error as Error).message}`);
    return {
      passed: false,
      details: `Test failed with error: ${(error as Error).message}`,
      logs,
    };
  }
}

/**
 * TC-B5: Test Manual Retry from UI
 *
 * Expected Behavior:
 * - Report has status "failed" with attempts < 3
 * - User taps retry chip
 * - Status changes to "pending"
 * - Queue picks up and processes
 * - PDF generates successfully
 */
export async function testManualRetry(
  database: Database,
  backgroundPdfQueue: BackgroundPdfQueue
): Promise<{
  passed: boolean;
  details: string;
  logs: string[];
}> {
  console.log('🧪 Starting TC-B5: Manual Retry Test');

  const logs: string[] = [];

  try {
    // Step 1: Create a failed report (attempts = 1)
    logs.push('Creating failed report for manual retry...');
    const report = await database.write(async () => {
      return await database.get('daily_reports').create((r: any) => {
        r.siteId = 'test_site_manual_retry';
        r.supervisorId = 'test_supervisor';
        r.reportDate = Date.now();
        r.submittedAt = Date.now();
        r.totalItems = 1;
        r.totalProgress = 50;
        r.pdfPath = '';
        r.notes = 'Test report for manual retry';
        r.pdfGenerationStatus = 'failed';
        r.pdfGenerationAttempts = 1; // < 3, so retry should be available
        r.pdfLastAttemptTimestamp = Date.now();
        r.pdfErrorMessage = 'Simulated failure for testing';
        r.pdfErrorTimestamp = Date.now();
        r.pdfPhotoCount = 0;
        r.appSyncStatus = 'synced';
      });
    });

    logs.push(`✅ Failed report created: ${report.id}`);
    logs.push(`   Status: ${report.pdfGenerationStatus}`);
    logs.push(`   Attempts: ${report.pdfGenerationAttempts}/3`);

    // Step 2: Simulate user tapping retry button
    logs.push('\n🖱️  Simulating user tap on retry chip...');
    await backgroundPdfQueue.retryPdfGeneration(report.id);
    logs.push('✅ Manual retry initiated');

    // Step 3: Wait for queue to pick up the retry
    logs.push('⏳ Waiting for queue to process retry...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 4: Check if status changed to pending
    let updatedReport = await database.get('daily_reports').find(report.id);
    logs.push(`   Status after retry: ${updatedReport.pdfGenerationStatus}`);

    if (updatedReport.pdfGenerationStatus !== 'pending' &&
        updatedReport.pdfGenerationStatus !== 'generating') {
      return {
        passed: false,
        details: '❌ TC-B5 FAILED: Status did not change to pending after manual retry',
        logs,
      };
    }

    // Step 5: Wait for PDF to generate
    logs.push('⏳ Waiting for PDF generation to complete...');
    for (let i = 0; i < 30; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      updatedReport = await database.get('daily_reports').find(report.id);

      if (updatedReport.pdfGenerationStatus === 'completed') {
        logs.push('✅ PDF generated successfully after manual retry');
        break;
      }

      if (updatedReport.pdfGenerationStatus === 'failed') {
        logs.push('❌ PDF generation failed again after manual retry');
        break;
      }
    }

    // Step 6: Verify final state
    const finalStatus = updatedReport.pdfGenerationStatus;
    const finalAttempts = updatedReport.pdfGenerationAttempts;

    logs.push('\n📊 Final State:');
    logs.push(`   Status: ${finalStatus}`);
    logs.push(`   Attempts: ${finalAttempts}`);
    logs.push(`   PDF Path: ${updatedReport.pdfPath || 'N/A'}`);

    const passed = finalStatus === 'completed' && updatedReport.pdfPath !== '';

    const details = passed
      ? '✅ TC-B5 PASSED: Manual retry working correctly'
      : '❌ TC-B5 FAILED: Manual retry did not complete successfully';

    return { passed, details, logs };

  } catch (error) {
    logs.push(`❌ Test error: ${(error as Error).message}`);
    return {
      passed: false,
      details: `Test failed with error: ${(error as Error).message}`,
      logs,
    };
  }
}

/**
 * Run All Retry Tests
 */
export async function runRetryTests(
  database: Database,
  backgroundPdfQueue: BackgroundPdfQueue
): Promise<void> {
  console.log('🚀 Starting Phase B Retry Tests (TC-B4 & TC-B5)');
  console.log('='.repeat(60));

  // Test TC-B4: Automatic Retry
  const tc4Result = await testAutomaticRetry(database, backgroundPdfQueue);
  console.log('\n📋 TC-B4 Results:');
  console.log(tc4Result.details);
  tc4Result.logs.forEach(log => console.log('  ' + log));

  console.log('\n' + '='.repeat(60));

  // Test TC-B5: Manual Retry (if enabled)
  if (TEST_CONFIG.testManualRetry) {
    const tc5Result = await testManualRetry(database, backgroundPdfQueue);
    console.log('\n📋 TC-B5 Results:');
    console.log(tc5Result.details);
    tc5Result.logs.forEach(log => console.log('  ' + log));
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Retry Tests Complete');
}

/**
 * Export test runner for use in app
 */
export default {
  runRetryTests,
  testAutomaticRetry,
  testManualRetry,
  TEST_CONFIG,
};
