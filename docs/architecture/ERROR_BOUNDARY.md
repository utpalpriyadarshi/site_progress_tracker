# ErrorBoundary Documentation

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
7. [Error Handling Strategies](#error-handling-strategies)
8. [Integration](#integration)
9. [Testing](#testing)
10. [Troubleshooting](#troubleshooting)

---

## Overview

### Purpose

The `ErrorBoundary` component provides graceful error handling for React components in the Site Progress Tracker application. It catches JavaScript errors anywhere in the component tree, logs them, and displays a fallback UI instead of crashing the entire application.

### Benefits

✅ **Graceful Degradation** - App stays functional when errors occur
✅ **Better UX** - Users see friendly error messages instead of white screens
✅ **Error Recovery** - "Try Again" button allows users to recover from errors
✅ **Error Isolation** - Errors in one screen don't crash the entire app
✅ **Integrated Logging** - Errors automatically logged to LoggingService
✅ **Development Friendly** - Shows detailed error info in DEV mode

---

## Architecture

### File Location

```
src/components/common/ErrorBoundary.tsx
```

### What ErrorBoundary Catches

✅ **Errors During Rendering**
```typescript
// This will be caught
render() {
  if (this.state.data.length === 0) {
    throw new Error('No data available');
  }
  return <View>...</View>;
}
```

✅ **Errors in Lifecycle Methods**
```typescript
// This will be caught
componentDidMount() {
  throw new Error('Mount failed');
}
```

✅ **Errors in Component Constructors**
```typescript
// This will be caught
constructor(props) {
  super(props);
  throw new Error('Construction failed');
}
```

### What ErrorBoundary Does NOT Catch

❌ **Event Handlers** - Use try-catch
```typescript
// NOT caught by ErrorBoundary
handleClick() {
  throw new Error('Click failed'); // Use try-catch here
}
```

❌ **Async Code** - Use try-catch
```typescript
// NOT caught by ErrorBoundary
async loadData() {
  throw new Error('Load failed'); // Use try-catch here
}
```

❌ **Server-Side Rendering** - React Native specific

❌ **Errors in ErrorBoundary Itself**

---

## Installation

The ErrorBoundary is already installed and available throughout the application.

### Import

```typescript
import { ErrorBoundary } from '../components/common/ErrorBoundary';
```

---

## Usage Guide

### Basic Usage

#### Wrapping a Single Component

```typescript
import { ErrorBoundary } from '../components/common/ErrorBoundary';

function MyScreen() {
  return (
    <ErrorBoundary name="MyScreen">
      <MyComponent />
    </ErrorBoundary>
  );
}
```

#### Wrapping Multiple Components

```typescript
function App() {
  return (
    <ErrorBoundary name="App">
      <Header />
      <Content />
      <Footer />
    </ErrorBoundary>
  );
}
```

#### With Navigation (Current Implementation)

```typescript
// In SupervisorNavigator.tsx
const WrappedDailyReportsScreen: React.FC<any> = (props) => (
  <ErrorBoundary name="DailyReportsScreen">
    <DailyReportsScreen {...props} />
  </ErrorBoundary>
);

// Use in Tab.Screen
<Tab.Screen
  name="DailyReports"
  component={WrappedDailyReportsScreen}
  options={{...}}
/>
```

### Advanced Usage

#### Custom Fallback UI

```typescript
<ErrorBoundary
  name="CustomScreen"
  fallback={(error, retry) => (
    <View style={styles.customError}>
      <Text>Oops! {error.message}</Text>
      <Button onPress={retry}>Retry</Button>
    </View>
  )}
>
  <MyComponent />
</ErrorBoundary>
```

#### With Error Callback

```typescript
<ErrorBoundary
  name="MonitoredScreen"
  onError={(error, errorInfo) => {
    // Send to analytics
    analytics.track('ComponentError', {
      error: error.message,
      component: errorInfo.componentStack,
    });
  }}
>
  <MyComponent />
</ErrorBoundary>
```

#### Conditional Details

```typescript
<ErrorBoundary
  name="DetailedScreen"
  showDetails={__DEV__} // Only show details in development
>
  <MyComponent />
</ErrorBoundary>
```

---

## API Reference

### ErrorBoundary Props

#### `children` (Required)

The React components to protect with the error boundary.

**Type:** `ReactNode`

**Example:**
```typescript
<ErrorBoundary name="Screen">
  <MyComponent />
</ErrorBoundary>
```

---

#### `name` (Optional)

A descriptive name for the error boundary, used in logging and error messages.

**Type:** `string`
**Default:** `'ErrorBoundary'`

**Example:**
```typescript
<ErrorBoundary name="DailyReportsScreen">
  <DailyReportsScreen />
</ErrorBoundary>
```

---

#### `fallback` (Optional)

Custom fallback UI to render when an error occurs.

**Type:** `(error: Error, retry: () => void) => ReactNode`
**Default:** Built-in fallback UI

**Example:**
```typescript
<ErrorBoundary
  name="Screen"
  fallback={(error, retry) => (
    <View>
      <Text>Error: {error.message}</Text>
      <Button onPress={retry}>Try Again</Button>
    </View>
  )}
>
  <MyComponent />
</ErrorBoundary>
```

---

#### `onError` (Optional)

Callback invoked when an error is caught.

**Type:** `(error: Error, errorInfo: ErrorInfo) => void`

**Example:**
```typescript
<ErrorBoundary
  name="Screen"
  onError={(error, errorInfo) => {
    console.log('Error caught:', error);
    sendToAnalytics(error, errorInfo);
  }}
>
  <MyComponent />
</ErrorBoundary>
```

---

#### `showDetails` (Optional)

Whether to show detailed error information in the fallback UI.

**Type:** `boolean`
**Default:** `__DEV__` (true in development, false in production)

**Example:**
```typescript
<ErrorBoundary name="Screen" showDetails={false}>
  <MyComponent />
</ErrorBoundary>
```

---

### Default Fallback UI

The built-in fallback UI displays:

**In Production:**
```
⚠️

Something went wrong

We encountered an unexpected error. Please try again
or contact support if the problem persists.

[Try Again]
```

**In Development (showDetails=true):**
```
⚠️

Something went wrong

We encountered an unexpected error. Please try again
or contact support if the problem persists.

Error Details:
Error: Cannot read property 'name' of undefined
  at DailyReportsScreen.render (DailyReportsScreen.tsx:156)
  at ...

Component Stack:
  at DailyReportsScreen
  at ErrorBoundary
  at ...

[Try Again]
```

---

## Best Practices

### 1. Use Meaningful Names

```typescript
// ✅ GOOD - Descriptive name
<ErrorBoundary name="DailyReportsScreen">
  <DailyReportsScreen />
</ErrorBoundary>

// ❌ BAD - Generic name
<ErrorBoundary name="Screen1">
  <DailyReportsScreen />
</ErrorBoundary>
```

### 2. Granular Boundaries

```typescript
// ✅ GOOD - Each screen has its own boundary
<Tab.Screen name="Reports" component={WrappedReportsScreen} />
<Tab.Screen name="Items" component={WrappedItemsScreen} />

// ❌ BAD - One boundary for all screens
<ErrorBoundary name="AllScreens">
  <Tab.Screen name="Reports" component={ReportsScreen} />
  <Tab.Screen name="Items" component={ItemsScreen} />
</ErrorBoundary>
```

### 3. Don't Overuse

```typescript
// ✅ GOOD - Screen-level boundaries
<ErrorBoundary name="Screen">
  <Header />
  <Content />
  <Footer />
</ErrorBoundary>

// ❌ BAD - Too many boundaries
<ErrorBoundary name="Header">
  <Header />
</ErrorBoundary>
<ErrorBoundary name="Content">
  <Content />
</ErrorBoundary>
<ErrorBoundary name="Footer">
  <Footer />
</ErrorBoundary>
```

### 4. Handle Async Errors Separately

```typescript
// ErrorBoundary won't catch this
async function loadData() {
  try {
    const data = await fetchData();
  } catch (error) {
    // Handle async errors with try-catch
    logger.error('Load failed', error, {...});
    showErrorMessage('Failed to load data');
  }
}
```

### 5. Forward Props Correctly

```typescript
// ✅ GOOD - Props forwarded
const WrappedScreen: React.FC<any> = (props) => (
  <ErrorBoundary name="Screen">
    <Screen {...props} />
  </ErrorBoundary>
);

// ❌ BAD - Props not forwarded
const WrappedScreen = () => (
  <ErrorBoundary name="Screen">
    <Screen /> {/* Props missing! */}
  </ErrorBoundary>
);
```

---

## Error Handling Strategies

### Strategy 1: Screen-Level Protection

**Use Case:** Protect individual screens in navigation

**Implementation:**
```typescript
// Wrap each screen component
const WrappedScreen = (props) => (
  <ErrorBoundary name="ScreenName">
    <Screen {...props} />
  </ErrorBoundary>
);

// Use in navigation
<Tab.Screen name="Screen" component={WrappedScreen} />
```

**Benefits:**
- ✅ Errors isolated to one screen
- ✅ Other screens continue working
- ✅ Easy to implement

---

### Strategy 2: Feature-Level Protection

**Use Case:** Protect specific features or sections

**Implementation:**
```typescript
function Dashboard() {
  return (
    <View>
      <Header />

      <ErrorBoundary name="DashboardStats">
        <Statistics />
      </ErrorBoundary>

      <ErrorBoundary name="DashboardCharts">
        <Charts />
      </ErrorBoundary>

      <Footer />
    </View>
  );
}
```

**Benefits:**
- ✅ Fine-grained error isolation
- ✅ Rest of page remains functional
- ✅ Good for complex screens

---

### Strategy 3: Critical Path Protection

**Use Case:** Protect critical user flows

**Implementation:**
```typescript
<ErrorBoundary
  name="CheckoutFlow"
  fallback={(error, retry) => (
    <View>
      <Text>Checkout Error</Text>
      <Button onPress={retry}>Retry Checkout</Button>
      <Button onPress={contactSupport}>Contact Support</Button>
    </View>
  )}
>
  <CheckoutProcess />
</ErrorBoundary>
```

**Benefits:**
- ✅ Custom recovery for critical flows
- ✅ Better user experience
- ✅ Support escalation path

---

## Integration

### Current Integration Status

#### ✅ Implemented

**Supervisor Screens (All 7 wrapped):**
- ✅ SiteManagementScreen
- ✅ ItemsManagementScreen
- ✅ DailyReportsScreen
- ✅ MaterialTrackingScreen
- ✅ HindranceReportScreen
- ✅ SiteInspectionScreen
- ✅ ReportsHistoryScreen

**Implementation:** `src/nav/SupervisorNavigator.tsx`

#### ⏳ Pending

- Manager screens
- Admin screens
- Planning screens
- Commercial screens
- Design Engineer screens
- Logistics screens

### Integration with LoggingService

ErrorBoundary automatically logs all caught errors to LoggingService:

```typescript
// Automatic logging in componentDidCatch
logger.error(`Error caught by ${name || 'ErrorBoundary'}`, error, {
  component: name || 'ErrorBoundary',
  action: 'componentDidCatch',
  componentStack: errorInfo.componentStack,
});
```

**Log Output:**
```
[ERROR] [DailyReportsScreen] Error caught by DailyReportsScreen
Error: Cannot read property 'name' of undefined
  at DailyReportsScreen.render...
Context: {
  component: 'DailyReportsScreen',
  action: 'componentDidCatch',
  componentStack: '...'
}
```

---

## Testing

### Manual Testing

#### Test 1: Trigger Error Boundary

1. Add test error in component:
```typescript
const MyScreen = () => {
  if (true) throw new Error('Test error');
  return <View>...</View>;
};
```

2. Navigate to screen
3. Verify fallback UI appears
4. Verify error is logged
5. Test "Try Again" button

#### Test 2: Verify Error Isolation

1. Trigger error in one screen
2. Navigate to other screens
3. Verify other screens work normally
4. Navigate back to error screen
5. Verify error persists

#### Test 3: Test Error Recovery

1. Trigger error
2. Fix the error (remove test code)
3. Press "Try Again"
4. Verify screen loads normally

### Automated Testing

```typescript
// __tests__/components/ErrorBoundary.test.tsx
import { render } from '@testing-library/react-native';
import { ErrorBoundary } from '../ErrorBoundary';

describe('ErrorBoundary', () => {
  it('should render children when no error', () => {
    const { getByText } = render(
      <ErrorBoundary name="Test">
        <Text>Content</Text>
      </ErrorBoundary>
    );
    expect(getByText('Content')).toBeTruthy();
  });

  it('should render fallback when error occurs', () => {
    const ThrowError = () => {
      throw new Error('Test error');
    };

    const { getByText } = render(
      <ErrorBoundary name="Test">
        <ThrowError />
      </ErrorBoundary>
    );

    expect(getByText(/Something went wrong/i)).toBeTruthy();
  });

  it('should call onError callback', () => {
    const onError = jest.fn();
    const ThrowError = () => {
      throw new Error('Test error');
    };

    render(
      <ErrorBoundary name="Test" onError={onError}>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalled();
  });
});
```

---

## Troubleshooting

### Error Not Caught

**Issue:** Error causes app to crash instead of showing fallback

**Possible Causes:**
1. Error is in event handler (not caught by ErrorBoundary)
2. Error is in async code (not caught by ErrorBoundary)
3. Error is at module level (before rendering)
4. ErrorBoundary not wrapping the component

**Solutions:**
1. Use try-catch for event handlers and async code
2. Ensure error occurs during rendering
3. Check ErrorBoundary is properly wrapping the component

### Fallback Not Showing

**Issue:** ErrorBoundary catches error but doesn't show fallback

**Possible Causes:**
1. Custom fallback returns null
2. Styling issues hiding the fallback
3. ErrorBoundary unmounted before rendering fallback

**Solutions:**
1. Check custom fallback returns valid JSX
2. Verify fallback styles
3. Ensure ErrorBoundary stays mounted

### "Try Again" Not Working

**Issue:** Clicking "Try Again" doesn't reset the error

**Possible Causes:**
1. Error still present in component
2. Component not re-mounting
3. State not resetting

**Solutions:**
1. Fix the underlying error first
2. Ensure handleRetry is called correctly
3. Check component lifecycle

---

## Comparison with Other Solutions

### ErrorBoundary vs try-catch

| Feature | ErrorBoundary | try-catch |
|---------|---------------|-----------|
| Render errors | ✅ Catches | ❌ Doesn't catch |
| Async errors | ❌ Doesn't catch | ✅ Catches |
| Event handler errors | ❌ Doesn't catch | ✅ Catches |
| Provides fallback UI | ✅ Yes | ❌ Manual |
| Error recovery | ✅ Built-in | ❌ Manual |

**Best Practice:** Use both!
- ErrorBoundary for render errors
- try-catch for async and event handlers

---

## Changelog

### Version 1.0 (2025-12-09)
- ✅ Integrated with LoggingService
- ✅ Applied to all 7 Supervisor screens
- ✅ Proper prop forwarding in wrappers
- ✅ Production-ready implementation
- ✅ Comprehensive testing completed

---

## Related Documentation

- [LoggingService Documentation](./LOGGING_SERVICE.md)
- [Architecture Overview](./ARCHITECTURE_UNIFIED.md)
- [Supervisor Improvements Roadmap](../../SUPERVISOR_IMPROVEMENTS_ROADMAP.md)
- [Testing Guide](../../TESTING_PHASE_1_TASKS_1.1_1.2.md)

---

## Support

For questions or issues with ErrorBoundary:
1. Check this documentation
2. Review the source code: `src/components/common/ErrorBoundary.tsx`
3. Check the testing guide: `TESTING_PHASE_1_TASKS_1.1_1.2.md`
4. Refer to the roadmap: `SUPERVISOR_IMPROVEMENTS_ROADMAP.md`

---

**Last Reviewed:** 2025-12-09
**Next Review:** After Phase 1 completion
