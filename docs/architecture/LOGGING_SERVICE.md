# LoggingService Documentation

**Version:** 1.0
**Created:** 2025-12-09
**Last Updated:** 2025-12-09
**Status:** ✅ Production Ready

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Installation](#installation)
4. [Usage Guide](#usage-guide)
5. [API Reference](#api-reference)
6. [Best Practices](#best-practices)
7. [Migration Guide](#migration-guide)
8. [Integration](#integration)
9. [Testing](#testing)
10. [Troubleshooting](#troubleshooting)

---

## Overview

### Purpose

The `LoggingService` provides a centralized, structured logging system for the Site Progress Tracker application. It replaces scattered `console.log`, `console.error`, and `console.warn` statements with a unified logging interface that supports:

- **Structured logging** with contextual metadata
- **Log levels** (DEBUG, INFO, WARN, ERROR)
- **Component tracking** for easier debugging
- **Production-ready** integration points for external logging services
- **Type-safe** logging with TypeScript

### Benefits

✅ **Consistent Logging Format** - All logs follow the same structure
✅ **Better Debugging** - Context and metadata make issues easier to trace
✅ **Production Ready** - Easy integration with services like Sentry, LogRocket
✅ **Performance** - Can be disabled/filtered in production builds
✅ **Type Safety** - Full TypeScript support with proper types

---

## Architecture

### File Location

```
src/services/LoggingService.ts
```

### Log Levels

The service supports four log levels, listed from lowest to highest severity:

| Level | Use Case | Production | Example |
|-------|----------|------------|---------|
| `DEBUG` | Development debugging, verbose output | ❌ Disabled | Tracking function calls, state changes |
| `INFO` | General information, application flow | ✅ Enabled | User logged in, data loaded successfully |
| `WARN` | Warning conditions, potential issues | ✅ Enabled | Deprecated API usage, missing optional data |
| `ERROR` | Error conditions, failures | ✅ Enabled | API errors, database failures |

### Structure

```typescript
// Log entry structure
{
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR',
  timestamp: string,
  message: string,
  context?: {
    component: string,
    action: string,
    [key: string]: any
  },
  error?: Error
}
```

---

## Installation

The LoggingService is already installed and available throughout the application.

### Import

```typescript
import { logger } from '../services/LoggingService';
// Adjust the path based on your file location
```

---

## Usage Guide

### Basic Usage

#### Debug Logging

Use for development debugging and verbose information:

```typescript
logger.debug('Function called with parameters', {
  component: 'DailyReportsScreen',
  action: 'updateProgress',
  itemId: 'item-123',
  newQuantity: 50,
});
```

**Output (DEV mode):**
```
[DEBUG] [DailyReportsScreen] Function called with parameters
Context: { component: 'DailyReportsScreen', action: 'updateProgress', itemId: 'item-123', newQuantity: 50 }
```

#### Info Logging

Use for general application flow and important events:

```typescript
logger.info('User logged in successfully', {
  component: 'AuthContext',
  action: 'login',
  userId: 'user-456',
  role: 'supervisor',
});
```

**Output:**
```
[INFO] [AuthContext] User logged in successfully
Context: { component: 'AuthContext', action: 'login', userId: 'user-456', role: 'supervisor' }
```

#### Warning Logging

Use for potentially problematic situations:

```typescript
logger.warn('No project assigned to user', {
  component: 'SiteContext',
  action: 'loadSupervisorProject',
  userId: 'user-789',
});
```

**Output:**
```
[WARN] [SiteContext] No project assigned to user
Context: { component: 'SiteContext', action: 'loadSupervisorProject', userId: 'user-789' }
```

#### Error Logging

Use for errors and exceptions:

```typescript
try {
  await saveData();
} catch (error) {
  logger.error('Failed to save data', error as Error, {
    component: 'DataService',
    action: 'saveData',
    recordId: 'rec-123',
  });
}
```

**Output:**
```
[ERROR] [DataService] Failed to save data
Error: Network request failed
  at saveData (DataService.ts:45)
  ...
Context: { component: 'DataService', action: 'saveData', recordId: 'rec-123' }
```

### Advanced Usage

#### Nested Context

You can include complex objects in the context:

```typescript
logger.info('Report generated successfully', {
  component: 'ReportService',
  action: 'generateReport',
  report: {
    id: 'report-123',
    type: 'daily',
    itemCount: 15,
    date: new Date().toISOString(),
  },
  performance: {
    durationMs: 234,
    itemsProcessed: 15,
  },
});
```

#### Conditional Logging

```typescript
if (__DEV__) {
  logger.debug('Detailed state dump', {
    component: 'StateManager',
    action: 'debugState',
    state: entireStateObject, // Only log in development
  });
}
```

---

## API Reference

### `logger.debug(message: string, context?: LogContext)`

Logs a debug message (only in development).

**Parameters:**
- `message` (string) - The log message
- `context` (optional object) - Additional context data

**Example:**
```typescript
logger.debug('Item selected', {
  component: 'ItemsList',
  action: 'onItemPress',
  itemId: 'item-123',
});
```

---

### `logger.info(message: string, context?: LogContext)`

Logs an informational message.

**Parameters:**
- `message` (string) - The log message
- `context` (optional object) - Additional context data

**Example:**
```typescript
logger.info('Data synchronized', {
  component: 'SyncService',
  action: 'syncCompleted',
  recordsSynced: 42,
});
```

---

### `logger.warn(message: string, context?: LogContext)`

Logs a warning message.

**Parameters:**
- `message` (string) - The log message
- `context` (optional object) - Additional context data

**Example:**
```typescript
logger.warn('API rate limit approaching', {
  component: 'APIClient',
  action: 'checkRateLimit',
  remaining: 10,
  limit: 1000,
});
```

---

### `logger.error(message: string, error: Error, context?: LogContext)`

Logs an error with full error details.

**Parameters:**
- `message` (string) - Human-readable error description
- `error` (Error) - The error object
- `context` (optional object) - Additional context data

**Example:**
```typescript
try {
  await dangerousOperation();
} catch (error) {
  logger.error('Operation failed', error as Error, {
    component: 'DataProcessor',
    action: 'processData',
    operationType: 'critical',
  });
}
```

---

## Best Practices

### 1. Always Include Component and Action

```typescript
// ✅ GOOD
logger.info('Data loaded', {
  component: 'DailyReportsScreen',
  action: 'loadItems',
});

// ❌ BAD
logger.info('Data loaded');
```

### 2. Use Appropriate Log Levels

```typescript
// ✅ GOOD - Use DEBUG for development details
logger.debug('Function parameters', { component: 'Utils', params: {...} });

// ✅ GOOD - Use INFO for application flow
logger.info('User action completed', { component: 'UI', action: 'submit' });

// ✅ GOOD - Use WARN for potential issues
logger.warn('Deprecated API used', { component: 'API', method: 'oldMethod' });

// ✅ GOOD - Use ERROR for actual errors
logger.error('Failed to save', error, { component: 'DB', action: 'save' });

// ❌ BAD - Using ERROR for non-errors
logger.error('User clicked button', ...); // This should be DEBUG or INFO
```

### 3. Include Relevant Context

```typescript
// ✅ GOOD - Rich context
logger.error('Failed to update item', error, {
  component: 'ItemManager',
  action: 'updateItem',
  itemId: item.id,
  itemName: item.name,
  attemptedQuantity: newQuantity,
  currentQuantity: item.quantity,
});

// ❌ BAD - Minimal context
logger.error('Update failed', error, {
  component: 'ItemManager',
});
```

### 4. Don't Log Sensitive Data

```typescript
// ❌ BAD - Logging passwords
logger.debug('Login attempt', {
  component: 'Auth',
  username: 'user@example.com',
  password: '123456', // NEVER LOG PASSWORDS!
});

// ✅ GOOD - Safe logging
logger.debug('Login attempt', {
  component: 'Auth',
  username: 'user@example.com',
  hasPassword: true, // Just indicate presence
});
```

### 5. Use Consistent Component Names

```typescript
// ✅ GOOD - Consistent naming
logger.info('Action 1', { component: 'DailyReportsScreen', ... });
logger.info('Action 2', { component: 'DailyReportsScreen', ... });

// ❌ BAD - Inconsistent naming
logger.info('Action 1', { component: 'DailyReportsScreen', ... });
logger.info('Action 2', { component: 'Daily Reports Screen', ... });
logger.info('Action 3', { component: 'dailyReports', ... });
```

---

## Migration Guide

### Migrating from console.log

#### Before (console.log)
```typescript
console.log('Saving item...', item.id);
```

#### After (LoggingService)
```typescript
logger.debug('Saving item', {
  component: 'ItemManager',
  action: 'saveItem',
  itemId: item.id,
});
```

---

### Migrating from console.error

#### Before (console.error)
```typescript
try {
  await saveData();
} catch (error) {
  console.error('Save failed:', error);
}
```

#### After (LoggingService)
```typescript
try {
  await saveData();
} catch (error) {
  logger.error('Failed to save data', error as Error, {
    component: 'DataService',
    action: 'saveData',
  });
}
```

---

### Migrating from console.warn

#### Before (console.warn)
```typescript
if (!user.projectId) {
  console.warn('User has no project assigned');
}
```

#### After (LoggingService)
```typescript
if (!user.projectId) {
  logger.warn('User has no project assigned', {
    component: 'UserManager',
    action: 'checkUserProject',
    userId: user.id,
  });
}
```

---

## Integration

### Current Integration Status

#### ✅ Implemented
- All Supervisor screens (7 files)
- SiteContext
- SiteSelector component
- ErrorBoundary component
- Planning SiteManagementScreen

#### ⏳ Pending
- Other Planning screens
- Manager screens
- Admin screens
- Commercial screens
- Design Engineer screens
- Logistics screens

### Future Integrations

#### Sentry Integration

```typescript
// src/services/LoggingService.ts
import * as Sentry from '@sentry/react-native';

// In error method:
if (!__DEV__ && level === 'ERROR') {
  Sentry.captureException(error, {
    contexts: {
      custom: context,
    },
    tags: {
      component: context?.component,
      action: context?.action,
    },
  });
}
```

#### LogRocket Integration

```typescript
// src/services/LoggingService.ts
import LogRocket from 'logrocket';

// In log methods:
if (!__DEV__) {
  LogRocket.log(level, message, context);
}
```

---

## Testing

### Unit Testing

```typescript
// __tests__/services/LoggingService.test.ts
import { logger } from '../services/LoggingService';

describe('LoggingService', () => {
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should log debug messages in DEV mode', () => {
    logger.debug('Test message', { component: 'Test' });
    expect(console.log).toHaveBeenCalled();
  });

  it('should log error messages with error object', () => {
    const error = new Error('Test error');
    logger.error('Error occurred', error, { component: 'Test' });
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('[ERROR]'),
      expect.any(String),
      expect.any(Error),
      expect.any(Object)
    );
  });
});
```

### Manual Testing

1. Check Metro bundler console for log output
2. Verify log levels appear correctly
3. Verify context is included
4. Test error logging with actual errors

---

## Troubleshooting

### Logs Not Appearing

**Issue:** Logs don't show in console

**Solutions:**
1. Check if Metro bundler is running
2. Verify log level (DEBUG only shows in DEV mode)
3. Check browser/device console settings
4. Ensure LoggingService is properly imported

### TypeScript Errors

**Issue:** Type errors when using logger

**Solution:**
```typescript
// Use type assertion for error objects
catch (error) {
  logger.error('Message', error as Error, {...});
}
```

### Context Not Showing

**Issue:** Context doesn't appear in logs

**Solution:**
Ensure context is a plain object:
```typescript
// ✅ GOOD
logger.info('Message', { component: 'Test', data: 'value' });

// ❌ BAD
logger.info('Message', null); // Context is null
```

---

## Changelog

### Version 1.0 (2025-12-09)
- ✅ Initial implementation
- ✅ Four log levels (DEBUG, INFO, WARN, ERROR)
- ✅ Structured logging with context
- ✅ Full TypeScript support
- ✅ Integrated in all Supervisor screens
- ✅ Integrated in ErrorBoundary
- ✅ Production-ready architecture

---

## Related Documentation

- [ErrorBoundary Documentation](./ERROR_BOUNDARY.md)
- [Architecture Overview](./ARCHITECTURE_UNIFIED.md)
- [Supervisor Improvements Roadmap](../../SUPERVISOR_IMPROVEMENTS_ROADMAP.md)
- [Testing Guide](../../TESTING_PHASE_1_TASKS_1.1_1.2.md)

---

## Support

For questions or issues with LoggingService:
1. Check this documentation
2. Review the source code: `src/services/LoggingService.ts`
3. Check the testing guide: `TESTING_PHASE_1_TASKS_1.1_1.2.md`
4. Refer to the roadmap: `SUPERVISOR_IMPROVEMENTS_ROADMAP.md`

---

**Last Reviewed:** 2025-12-09
**Next Review:** After Phase 1 completion
