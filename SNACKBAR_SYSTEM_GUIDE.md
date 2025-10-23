# Snackbar/Dialog System - Developer Guide

**Version:** 2.0
**Last Updated:** October 23, 2025
**Status:** Production Ready

---

## 📖 Overview

This guide provides comprehensive documentation for using the custom Snackbar and ConfirmDialog components in the Construction Site Progress Tracker app. As of v2.0, **all Alert.alert calls have been migrated** to this system.

### Why We Use Custom Snackbar/Dialog

**❌ Problems with Alert.alert:**
- Blocks user interaction (modal dialog)
- No color coding for message types
- Not recommended for React Native Paper apps
- Disrupts workflow
- Same UI for all message types

**✅ Benefits of Custom System:**
- Non-blocking notifications (work while seeing feedback)
- Color-coded by type (instant understanding)
- Auto-dismiss after 4 seconds
- Professional animations
- Consistent with React Native Paper design
- Swipe-to-dismiss gesture

---

## 🎯 Quick Start

### 1. Import the Hook

```typescript
import { useSnackbar } from '../components/Snackbar';
```

### 2. Use in Your Component

```typescript
const MyScreen = () => {
  const { showSnackbar } = useSnackbar();

  const handleSave = async () => {
    try {
      await saveData();
      showSnackbar('Data saved successfully', 'success');
    } catch (error) {
      showSnackbar('Failed to save data', 'error');
    }
  };

  return (
    // Your JSX
  );
};
```

**That's it!** The snackbar is automatically handled by the SnackbarProvider at the app root.

---

## 📚 Complete API Reference

### Snackbar Hook

```typescript
const { showSnackbar } = useSnackbar();
```

**Function Signature:**
```typescript
showSnackbar(message: string, type: 'success' | 'error' | 'warning' | 'info'): void
```

**Parameters:**
- `message` (string, required): The text to display in the snackbar
- `type` (string, required): The type of message, affects color

**Types and Colors:**
- `'success'` - Green (#4CAF50) - For successful operations
- `'error'` - Red (#F44336) - For errors and failures
- `'warning'` - Orange (#FF9800) - For validation errors and warnings
- `'info'` - Blue (#2196F3) - For informational messages

**Behavior:**
- Appears at bottom of screen
- Auto-dismisses after 4 seconds
- Can be dismissed early by swiping down
- Only one snackbar shown at a time (newer replaces older)

---

## 🎨 Usage Examples

### Success Messages

```typescript
// Item created
showSnackbar('Item created successfully', 'success');

// Data saved
showSnackbar('Changes saved', 'success');

// Operation completed
showSnackbar('Baseline locked successfully', 'success');

// Sync completed
showSnackbar('Data synced with server', 'success');
```

### Error Messages

```typescript
// Save error
showSnackbar('Failed to save item', 'error');

// Load error
showSnackbar('Failed to load data', 'error');

// Network error
showSnackbar('Network connection failed', 'error');

// Invalid credentials
showSnackbar('Invalid username or password', 'error');
```

### Warning Messages

```typescript
// Validation error
showSnackbar('Please fill all required fields', 'warning');

// Missing selection
showSnackbar('Please select a site first', 'warning');

// Invalid input
showSnackbar('Quantity must be greater than 0', 'warning');

// Account issue
showSnackbar('Your account has been deactivated', 'warning');
```

### Info Messages

```typescript
// Feature coming soon
showSnackbar('PDF sharing coming soon!', 'info');

// Status update
showSnackbar('Report submitted (offline - will sync later)', 'info');

// Helpful tip
showSnackbar('Long-press item for more options', 'info');
```

---

## 🔔 ConfirmDialog Component

### When to Use

Use ConfirmDialog for:
- ✅ Delete operations (destructive)
- ✅ Lock/unlock operations (important)
- ✅ Irreversible actions
- ✅ Actions that need user confirmation
- ✅ Informational dialogs with OK button

**Do NOT use for:**
- ❌ Simple notifications (use Snackbar)
- ❌ Validation errors (use Snackbar)
- ❌ Success/error messages (use Snackbar)

### Import

```typescript
import { ConfirmDialog } from '../components/Dialog';
```

### Basic Setup

```typescript
import React, { useState } from 'react';
import { ConfirmDialog } from '../components/Dialog';
import { useSnackbar } from '../components/Snackbar';

const MyScreen = () => {
  const { showSnackbar } = useSnackbar();

  // State for dialog visibility
  const [showDialog, setShowDialog] = useState(false);

  // State for item to be acted upon
  const [selectedItem, setSelectedItem] = useState(null);

  // Trigger dialog
  const handleDeleteClick = (item) => {
    setSelectedItem(item);
    setShowDialog(true);
  };

  // Confirm action
  const confirmDelete = async () => {
    setShowDialog(false); // Close dialog first

    try {
      await database.write(async () => {
        await selectedItem.destroyPermanently();
      });
      showSnackbar('Item deleted successfully', 'success');
      setSelectedItem(null);
    } catch (error) {
      showSnackbar('Failed to delete item', 'error');
    }
  };

  // Cancel action
  const cancelDelete = () => {
    setShowDialog(false);
    setSelectedItem(null);
  };

  return (
    <View>
      {/* Your component JSX */}

      <ConfirmDialog
        visible={showDialog}
        title="Delete Item"
        message={`Are you sure you want to delete ${selectedItem?.name}?`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        destructive={true}
      />
    </View>
  );
};
```

### Props Reference

```typescript
interface ConfirmDialogProps {
  visible: boolean;           // Show/hide dialog
  title: string;             // Dialog title
  message: string;           // Dialog message (can be multi-line)
  confirmText?: string;      // Confirm button text (default: "Confirm")
  cancelText?: string;       // Cancel button text (default: "Cancel")
  onConfirm: () => void;     // Called when confirm button clicked
  onCancel: () => void;      // Called when cancel button or backdrop clicked
  destructive?: boolean;     // If true, confirm button is red (default: false)
}
```

**Destructive Mode:**
- `destructive={true}` - Red confirm button for dangerous actions (delete, lock, etc.)
- `destructive={false}` - Blue confirm button for safe actions (info dialogs, etc.)

### Examples

**Destructive Action (Delete):**
```typescript
<ConfirmDialog
  visible={showDeleteDialog}
  title="Delete Project"
  message="This project has 3 sites. Deleting it will also delete all associated sites, items, and data. This action cannot be undone."
  confirmText="Delete"
  cancelText="Cancel"
  onConfirm={confirmDelete}
  onCancel={() => setShowDeleteDialog(false)}
  destructive={true}  // Red button
/>
```

**Important Action (Lock):**
```typescript
<ConfirmDialog
  visible={showLockDialog}
  title="Lock Baseline"
  message="This will save current planned dates as the baseline. This action cannot be easily undone. Continue?"
  confirmText="Lock Baseline"
  cancelText="Cancel"
  onConfirm={confirmLock}
  onCancel={() => setShowLockDialog(false)}
  destructive={true}  // Red button
/>
```

**Informational Dialog:**
```typescript
<ConfirmDialog
  visible={showInfoDialog}
  title="Default Test Accounts"
  message={`• admin / admin123
• supervisor / supervisor123
• manager / manager123
• planner / planner123
• logistics / logistics123`}
  confirmText="OK"
  cancelText="Cancel"
  onConfirm={() => setShowInfoDialog(false)}
  onCancel={() => setShowInfoDialog(false)}
  destructive={false}  // Blue button
/>
```

---

## ⚠️ Critical Pattern: Dialog-Close-Before-Snackbar

### The Problem

When showing validation snackbars from inside a modal/dialog, the snackbar can appear **behind** the modal due to z-index ordering.

### The Solution

**Always close the dialog/modal BEFORE showing the snackbar:**

```typescript
// ❌ WRONG - Snackbar appears behind modal
const handleSave = async () => {
  if (!fieldValue.trim()) {
    showSnackbar('Field is required', 'warning'); // Snackbar behind modal!
    return;
  }
  // Save logic...
};

// ✅ CORRECT - Dialog closes, then snackbar appears
const handleSave = async () => {
  if (!fieldValue.trim()) {
    setModalVisible(false); // Close modal FIRST!
    showSnackbar('Field is required', 'warning'); // Now snackbar is visible
    return;
  }
  // Save logic...
};
```

### Real-World Example

```typescript
const handleCreateItem = async () => {
  // Validation
  if (!itemName.trim()) {
    setDialogVisible(false); // Close dialog first
    showSnackbar('Item name is required', 'warning');
    return;
  }

  if (!selectedCategoryId) {
    setDialogVisible(false); // Close dialog first
    showSnackbar('Please select a category', 'warning');
    return;
  }

  // If validation passes, proceed with save
  try {
    await saveItem();
    setDialogVisible(false); // Close on success
    showSnackbar('Item created successfully', 'success');
  } catch (error) {
    showSnackbar('Failed to create item', 'error');
  }
};
```

### Why This Works

1. User sees validation error snackbar clearly
2. User can read the message
3. User can reopen dialog to fix the issue
4. Better UX than error hidden behind modal

---

## 📋 Best Practices

### DO ✅

1. **Use appropriate types**
   ```typescript
   showSnackbar('Success message', 'success');
   showSnackbar('Error message', 'error');
   showSnackbar('Warning message', 'warning');
   showSnackbar('Info message', 'info');
   ```

2. **Keep messages concise**
   ```typescript
   // Good
   showSnackbar('Item saved successfully', 'success');

   // Too long
   showSnackbar('Your item has been successfully saved to the database and is now available for viewing', 'success');
   ```

3. **Close dialogs before showing validation snackbars**
   ```typescript
   setModalVisible(false);
   showSnackbar('Validation error', 'warning');
   ```

4. **Use ConfirmDialog for destructive actions**
   ```typescript
   <ConfirmDialog
     visible={showDialog}
     title="Delete Item"
     message="Are you sure?"
     onConfirm={handleDelete}
     onCancel={handleCancel}
     destructive={true}
   />
   ```

5. **Show snackbar after async operations**
   ```typescript
   try {
     await saveData();
     showSnackbar('Saved successfully', 'success');
   } catch (error) {
     showSnackbar('Save failed', 'error');
   }
   ```

### DON'T ❌

1. **Never use Alert.alert**
   ```typescript
   // ❌ NEVER DO THIS
   Alert.alert('Success', 'Item saved');

   // ✅ DO THIS INSTEAD
   showSnackbar('Item saved successfully', 'success');
   ```

2. **Don't use wrong types**
   ```typescript
   // ❌ Wrong type
   showSnackbar('Item deleted', 'info'); // Should be 'success'

   // ✅ Correct type
   showSnackbar('Item deleted successfully', 'success');
   ```

3. **Don't show snackbar before closing dialog**
   ```typescript
   // ❌ Wrong order
   showSnackbar('Error', 'error');
   setModalVisible(false);

   // ✅ Correct order
   setModalVisible(false);
   showSnackbar('Error', 'error');
   ```

4. **Don't use ConfirmDialog for simple notifications**
   ```typescript
   // ❌ Overkill for success message
   <ConfirmDialog
     title="Success"
     message="Item saved"
     onConfirm={() => {}}
   />

   // ✅ Use snackbar instead
   showSnackbar('Item saved successfully', 'success');
   ```

5. **Don't create custom Alert-like solutions**
   ```typescript
   // ❌ Don't reinvent the wheel
   const showCustomAlert = (message) => {
     // Custom alert implementation
   };

   // ✅ Use existing system
   showSnackbar(message, 'info');
   ```

---

## 🎨 Color Guidelines

### Success (Green #4CAF50)
**Use for:**
- Item created/updated/deleted successfully
- Data saved
- Operation completed
- Sync successful
- Login successful

### Error (Red #F44336)
**Use for:**
- Save/load/delete failures
- Network errors
- Invalid credentials
- Server errors
- Unexpected errors

### Warning (Orange #FF9800)
**Use for:**
- Validation errors
- Missing required fields
- Invalid input values
- Account disabled
- Permission denied

### Info (Blue #2196F3)
**Use for:**
- Feature coming soon messages
- Helpful tips
- Status updates
- Non-critical notifications
- Informational messages

---

## 🔧 Advanced Usage

### Dynamic Messages

```typescript
const handleDelete = (item) => {
  // Calculate dynamic message
  const sites = await getSitesForProject(item.id);
  const message = sites.length > 0
    ? `This project has ${sites.length} site(s). Deleting will remove all data.`
    : 'Are you sure you want to delete this project?';

  setDeleteMessage(message);
  setShowDeleteDialog(true);
};

<ConfirmDialog
  visible={showDeleteDialog}
  title="Delete Project"
  message={deleteMessage}  // Dynamic message
  confirmText="Delete"
  cancelText="Cancel"
  onConfirm={confirmDelete}
  onCancel={() => setShowDeleteDialog(false)}
  destructive={true}
/>
```

### Chaining Operations

```typescript
const handleSaveAndNavigate = async () => {
  try {
    await saveItem();
    showSnackbar('Item created successfully', 'success');

    // Navigate after short delay to show snackbar
    setTimeout(() => {
      navigation.goBack();
    }, 1500);
  } catch (error) {
    showSnackbar('Failed to create item', 'error');
  }
};
```

### Conditional Snackbars

```typescript
const handleSubmitReport = async () => {
  const isOnline = await NetInfo.fetch();

  try {
    await saveReport();

    if (isOnline.isConnected) {
      showSnackbar('Report submitted and synced', 'success');
    } else {
      showSnackbar('Report saved (will sync when online)', 'info');
    }
  } catch (error) {
    showSnackbar('Failed to submit report', 'error');
  }
};
```

---

## 🐛 Troubleshooting

### Issue: Snackbar not appearing

**Cause:** `useSnackbar()` hook called outside SnackbarProvider
**Solution:** Ensure your screen is wrapped by SnackbarProvider (it's at app root)

### Issue: Snackbar appears behind modal

**Cause:** Didn't close modal before showing snackbar
**Solution:** Use dialog-close-before-snackbar pattern

```typescript
setModalVisible(false);
showSnackbar('Error message', 'error');
```

### Issue: Wrong import path

**Cause:** Import path incorrect for screen location
**Solution:** Use `../components/` (one level up) for all screens

```typescript
// ✅ Correct for screens in src/admin/, src/supervisor/, src/planning/
import { useSnackbar } from '../components/Snackbar';

// ❌ Wrong
import { useSnackbar } from '../../components/Snackbar';
```

### Issue: All snackbars same color

**Cause:** Type parameter not passed or incorrect
**Solution:** Always pass type as second parameter

```typescript
// ❌ Missing type
showSnackbar('Message');

// ✅ With type
showSnackbar('Message', 'success');
```

### Issue: Snackbar doesn't auto-dismiss

**Cause:** Duration not set in SnackbarProvider
**Solution:** Already configured to 4000ms, should work automatically

---

## 📊 Migration Checklist

If you're migrating existing code with Alert.alert:

- [ ] Replace `Alert.alert` imports with `useSnackbar`
- [ ] Add `const { showSnackbar } = useSnackbar();` to component
- [ ] Replace success alerts with `showSnackbar(message, 'success')`
- [ ] Replace error alerts with `showSnackbar(message, 'error')`
- [ ] Replace validation alerts with `showSnackbar(message, 'warning')`
- [ ] Replace info alerts with `showSnackbar(message, 'info')`
- [ ] Replace confirmation alerts with `<ConfirmDialog>` component
- [ ] Add dialog state: `useState(false)` for visibility
- [ ] Add item state: `useState(null)` for selected item
- [ ] Add ConfirmDialog JSX to component
- [ ] Test all scenarios (success, error, validation, confirmation)
- [ ] Verify snackbars appear at bottom
- [ ] Verify dialogs appear centered
- [ ] Verify colors are correct
- [ ] Verify auto-dismiss works

---

## 📚 Related Documentation

- **ALERT_MIGRATION_COMPLETE.md** - Technical migration report
- **SPRINT_1_DAY_3_PROGRESS_UPDATE.md** - Migration session log
- **MANUAL_TESTING_GUIDE.md** - Testing procedures
- **ALERT_MIGRATION_TEST_REPORT.md** - Test results
- **ARCHITECTURE_UNIFIED.md** - Architecture patterns

---

## 🎓 Examples from Codebase

### LoginScreen.tsx
```typescript
// Empty credentials validation
if (!username || !password) {
  showSnackbar('Please enter both username and password', 'warning');
  return;
}

// Invalid credentials
showSnackbar('Invalid username or password', 'error');

// Account disabled
showSnackbar('Your account has been deactivated. Please contact an administrator.', 'error');
```

### BaselineScreen.tsx
```typescript
// Lock baseline confirmation
<ConfirmDialog
  visible={showLockBaselineDialog}
  title="Lock Baseline"
  message="This will save current planned dates as the baseline. This action cannot be easily undone. Continue?"
  confirmText="Lock Baseline"
  cancelText="Cancel"
  onConfirm={confirmLockBaseline}
  onCancel={() => setShowLockBaselineDialog(false)}
  destructive={true}
/>

// Success feedback
showSnackbar('Baseline locked successfully', 'success');
```

### DependencyModal.tsx
```typescript
// Circular dependency validation
if (!validation.valid) {
  showSnackbar(`Cannot save: ${validation.errors.join(', ')}`, 'error');
  return;
}

// Save success
showSnackbar(`Dependencies saved for ${item.name}`, 'success');
```

---

## ✅ Summary

**Key Points to Remember:**

1. **Always use Snackbar for notifications** (never Alert.alert)
2. **Use ConfirmDialog for confirmations** (delete, lock, important actions)
3. **Close dialogs before showing validation snackbars**
4. **Use correct types** (success, error, warning, info)
5. **Keep messages concise and clear**
6. **Test all scenarios** (success, error, validation)

**Import Pattern:**
```typescript
import { useSnackbar } from '../components/Snackbar';
import { ConfirmDialog } from '../components/Dialog';
```

**Basic Usage:**
```typescript
const { showSnackbar } = useSnackbar();
showSnackbar('Message here', 'success');
```

---

**Version:** 2.0
**Status:** ✅ Production Ready
**Last Updated:** October 23, 2025

**Questions or Issues?** See ALERT_MIGRATION_COMPLETE.md or contact the development team.

---

**Happy coding!** 🚀
