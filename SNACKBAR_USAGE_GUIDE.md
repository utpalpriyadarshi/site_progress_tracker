# Snackbar & Dialog Usage Guide

## Overview

This guide explains how to use the Snackbar and Dialog components that replaced Alert.alert() in v2.0.

**Benefits:**
- ✅ Non-blocking user interface
- ✅ Auto-dismiss functionality
- ✅ Color-coded by message type
- ✅ Queue management for multiple messages
- ✅ Action support (Undo, View buttons)
- ✅ Consistent UX across iOS and Android

---

## Snackbar Usage

### Basic Usage

```typescript
import { useSnackbar } from '../../components/Snackbar';

const MyScreen = () => {
  const { showSnackbar } = useSnackbar();

  const handleSave = async () => {
    try {
      await saveItem();
      showSnackbar('Item saved successfully!', 'success');
    } catch (error) {
      showSnackbar('Failed to save item', 'error');
    }
  };

  return (
    <Button onPress={handleSave}>Save</Button>
  );
};
```

### Snackbar Types

**Success (Green - 4 seconds):**
```typescript
showSnackbar('Item created successfully!', 'success');
showSnackbar('Site saved!', 'success');
showSnackbar('Report submitted!', 'success');
```

**Error (Red - 6 seconds):**
```typescript
showSnackbar('Failed to save item', 'error');
showSnackbar('Network error occurred', 'error');
showSnackbar('Validation failed', 'error');
```

**Warning (Orange - 5 seconds):**
```typescript
showSnackbar('Baseline is locked', 'warning');
showSnackbar('Some fields are optional', 'warning');
showSnackbar('Changes will be lost', 'warning');
```

**Info (Blue - 5 seconds):**
```typescript
showSnackbar('Loading data...', 'info');
showSnackbar('Syncing in background', 'info');
showSnackbar('Please select a site first', 'info');
```

### Snackbar with Actions

```typescript
const handleDelete = async () => {
  const item = await deleteItem();

  showSnackbar(
    'Item deleted',
    'success',
    {
      label: 'Undo',
      onPress: async () => {
        await restoreItem(item);
        showSnackbar('Item restored', 'success');
      }
    }
  );
};
```

### Custom Duration

```typescript
// Show for 10 seconds instead of default
showSnackbar(
  'This is a longer message that needs more time to read',
  'info',
  undefined, // no action
  10000 // 10 seconds
);
```

---

## Dialog Usage

### Basic Confirmation Dialog

```typescript
import { useState } from 'react';
import { ConfirmDialog } from '../../components/Dialog';
import { useSnackbar } from '../../components/Snackbar';

const MyScreen = () => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { showSnackbar } = useSnackbar();

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    setShowDeleteDialog(false);
    try {
      await deleteItem();
      showSnackbar('Item deleted', 'success');
    } catch (error) {
      showSnackbar('Failed to delete item', 'error');
    }
  };

  return (
    <>
      <Button onPress={handleDelete}>Delete</Button>

      <ConfirmDialog
        visible={showDeleteDialog}
        title="Delete Item"
        message="Are you sure you want to delete this item? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteDialog(false)}
        destructive={true} // Makes confirm button red
      />
    </>
  );
};
```

### Non-Destructive Confirmation

```typescript
<ConfirmDialog
  visible={showSaveDialog}
  title="Save Changes"
  message="Do you want to save your changes before leaving?"
  confirmText="Save"
  cancelText="Discard"
  onConfirm={handleSave}
  onCancel={() => setShowSaveDialog(false)}
  destructive={false} // Confirm button will be blue
/>
```

### Async Confirmation with Loading State

```typescript
const confirmLockBaseline = async () => {
  // Dialog will show loading spinner during this operation
  await lockBaseline();
  await calculateCriticalPath();
  setShowLockDialog(false);
  showSnackbar('Baseline locked successfully', 'success');
};

<ConfirmDialog
  visible={showLockDialog}
  title="Lock Baseline"
  message="Once locked, you cannot edit dates or dependencies. Continue?"
  confirmText="Lock Baseline"
  cancelText="Cancel"
  onConfirm={confirmLockBaseline} // Async function
  onCancel={() => setShowLockDialog(false)}
/>
```

---

## Migration Patterns

### OLD: Alert.alert for Success

**Before:**
```typescript
import { Alert } from 'react-native';

const handleSave = async () => {
  await saveItem();
  Alert.alert('Success', 'Item saved successfully!');
};
```

**After:**
```typescript
import { useSnackbar } from '../../components/Snackbar';

const { showSnackbar } = useSnackbar();

const handleSave = async () => {
  await saveItem();
  showSnackbar('Item saved successfully!', 'success');
};
```

### OLD: Alert.alert for Errors

**Before:**
```typescript
try {
  await saveItem();
} catch (error) {
  Alert.alert('Error', 'Failed to save item');
}
```

**After:**
```typescript
try {
  await saveItem();
} catch (error) {
  showSnackbar('Failed to save item', 'error');
}
```

### OLD: Alert.alert for Confirmations

**Before:**
```typescript
const handleDelete = () => {
  Alert.alert(
    'Delete Item',
    'Are you sure?',
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', onPress: confirmDelete, style: 'destructive' }
    ]
  );
};
```

**After:**
```typescript
const [showDeleteDialog, setShowDeleteDialog] = useState(false);

const handleDelete = () => {
  setShowDeleteDialog(true);
};

const confirmDelete = async () => {
  setShowDeleteDialog(false);
  await deleteItem();
  showSnackbar('Item deleted', 'success');
};

// In JSX:
<ConfirmDialog
  visible={showDeleteDialog}
  title="Delete Item"
  message="Are you sure you want to delete this item?"
  confirmText="Delete"
  cancelText="Cancel"
  onConfirm={confirmDelete}
  onCancel={() => setShowDeleteDialog(false)}
  destructive={true}
/>
```

---

## Best Practices

### 1. When to Use Snackbar vs Dialog

**Use Snackbar for:**
- Success confirmations
- Error messages
- Info/warning messages
- Non-critical notifications
- Status updates

**Use Dialog for:**
- Destructive actions (delete, remove, lock)
- Critical decisions
- Actions that cannot be undone
- Requiring explicit user confirmation

### 2. Message Writing Guidelines

**Good Snackbar Messages:**
- ✅ "Item saved successfully!"
- ✅ "Failed to delete item"
- ✅ "Please fill in all required fields"

**Bad Snackbar Messages:**
- ❌ "Success" (too vague)
- ❌ "An error occurred" (not specific)
- ❌ "Error: E001XYZ database connection timeout..." (too technical/long)

### 3. Dialog Message Guidelines

**Good Dialog Messages:**
- ✅ "Are you sure you want to delete this item? This action cannot be undone."
- ✅ "Locking the baseline will prevent further edits. Continue?"

**Bad Dialog Messages:**
- ❌ "Delete?" (too brief)
- ❌ "Are you sure you want to delete this item from the database and remove all associated records including progress logs, materials, and hindrances?" (too long)

### 4. Don't Overuse Snackbars

**Good:**
```typescript
// Show one success message after batch operation
await Promise.all(items.map(saveItem));
showSnackbar(`${items.length} items saved`, 'success');
```

**Bad:**
```typescript
// Don't show snackbar for each item in a loop
for (const item of items) {
  await saveItem(item);
  showSnackbar('Item saved', 'success'); // ❌ Will queue 100 messages!
}
```

### 5. Always Provide Context

**Good:**
```typescript
showSnackbar('WBS item "Foundation Work" saved', 'success');
showSnackbar('Failed to save item: Network timeout', 'error');
```

**Bad:**
```typescript
showSnackbar('Saved', 'success'); // What was saved?
showSnackbar('Error', 'error'); // What error?
```

---

## Troubleshooting

### Error: "useSnackbar must be used within a SnackbarProvider"

**Cause:** You're trying to use `useSnackbar()` in a component that's not wrapped by SnackbarProvider.

**Solution:** Check that App.tsx has SnackbarProvider wrapping MainNavigator:
```typescript
<SnackbarProvider>
  <MainNavigator />
</SnackbarProvider>
```

### Snackbar Not Showing

**Check:**
1. Is the message being called? Add `console.log()` before `showSnackbar()`
2. Is SnackbarProvider in App.tsx?
3. Is react-native-paper installed?
4. Try showing a simple test message: `showSnackbar('Test', 'info')`

### Dialog Not Dismissing

**Check:**
1. Is `visible` state being set to `false` in `onCancel` and `onConfirm`?
2. Are you using controlled component pattern (`visible={state}`)?
3. Make sure to call the state setter:

```typescript
// ✅ Correct
onCancel={() => setShowDialog(false)}

// ❌ Wrong
onCancel={() => {}} // Forgot to set state
```

### Multiple Snackbars Showing at Once

**This is expected behavior** - Snackbars queue automatically. Each will show for its duration, then the next in queue appears.

If you want to replace the current snackbar:
```typescript
// Option 1: Clear queue first (not implemented yet)
// Option 2: Just call showSnackbar() - it will queue

// Current behavior: Messages queue and show one at a time
```

---

## Complete Example

Here's a complete screen showing all patterns:

```typescript
import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, TextInput } from 'react-native-paper';
import { useSnackbar } from '../../components/Snackbar';
import { ConfirmDialog } from '../../components/Dialog';

const ExampleScreen = () => {
  const { showSnackbar } = useSnackbar();
  const [itemName, setItemName] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  const handleSave = async () => {
    if (!itemName.trim()) {
      showSnackbar('Please enter an item name', 'warning');
      return;
    }

    try {
      await saveItem({ name: itemName });
      showSnackbar('Item saved successfully!', 'success');
      setItemName('');
    } catch (error) {
      showSnackbar('Failed to save item', 'error');
    }
  };

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    setShowDeleteDialog(false);
    try {
      const deletedItem = await deleteItem();
      showSnackbar(
        'Item deleted',
        'success',
        {
          label: 'Undo',
          onPress: async () => {
            await restoreItem(deletedItem);
            showSnackbar('Item restored', 'success');
          }
        }
      );
    } catch (error) {
      showSnackbar('Failed to delete item', 'error');
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        label="Item Name"
        value={itemName}
        onChangeText={setItemName}
        mode="outlined"
      />

      <Button mode="contained" onPress={handleSave} style={styles.button}>
        Save Item
      </Button>

      <Button mode="outlined" onPress={handleDelete} style={styles.button}>
        Delete Item
      </Button>

      <ConfirmDialog
        visible={showDeleteDialog}
        title="Delete Item"
        message="Are you sure you want to delete this item? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteDialog(false)}
        destructive={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  button: {
    marginTop: 12,
  },
});

export default ExampleScreen;
```

---

## Summary

**Key Takeaways:**
1. Use `useSnackbar()` hook to show non-blocking messages
2. Use `<ConfirmDialog>` for critical confirmations
3. Always provide context in messages
4. Choose appropriate type (success, error, warning, info)
5. Keep messages concise and actionable

**Quick Reference:**
- Success: `showSnackbar('Message', 'success')`
- Error: `showSnackbar('Message', 'error')`
- Warning: `showSnackbar('Message', 'warning')`
- Info: `showSnackbar('Message', 'info')`
- Confirm: `<ConfirmDialog visible={state} ... />`

---

**Last Updated:** October 21, 2025 (v2.0 Sprint 1)
