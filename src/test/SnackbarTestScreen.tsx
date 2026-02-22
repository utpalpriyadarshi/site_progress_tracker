/**
 * SnackbarTestScreen
 * Test screen for Snackbar and Dialog components
 * This screen will be removed after testing is complete
 */

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Button, Text, Card, Divider } from 'react-native-paper';
import { useSnackbar } from '../components/Snackbar';
import { ConfirmDialog } from '../components/Dialog';
import { COLORS } from '../theme/colors';

const SnackbarTestScreen = () => {
  const { showSnackbar } = useSnackbar();
  const [showSimpleDialog, setShowSimpleDialog] = useState(false);
  const [showDestructiveDialog, setShowDestructiveDialog] = useState(false);
  const [showAsyncDialog, setShowAsyncDialog] = useState(false);
  const [deleteCount, setDeleteCount] = useState(0);

  // Test: Success Snackbar
  const testSuccess = () => {
    showSnackbar('Item saved successfully!', 'success');
  };

  // Test: Error Snackbar
  const testError = () => {
    showSnackbar('Failed to save item', 'error');
  };

  // Test: Warning Snackbar
  const testWarning = () => {
    showSnackbar('Baseline is locked', 'warning');
  };

  // Test: Info Snackbar
  const testInfo = () => {
    showSnackbar('Please select a site first', 'info');
  };

  // Test: Snackbar with Action
  const testWithAction = () => {
    const count = deleteCount + 1;
    setDeleteCount(count);

    showSnackbar(
      `Item ${count} deleted`,
      'success',
      {
        label: 'Undo',
        onPress: () => {
          showSnackbar(`Item ${count} restored`, 'success');
          setDeleteCount(count - 1);
        },
      }
    );
  };

  // Test: Queue Multiple Messages
  const testQueue = () => {
    showSnackbar('First message', 'info');
    setTimeout(() => showSnackbar('Second message', 'success'), 100);
    setTimeout(() => showSnackbar('Third message', 'warning'), 200);
    setTimeout(() => showSnackbar('Fourth message', 'error'), 300);
  };

  // Test: Long Message
  const testLongMessage = () => {
    showSnackbar(
      'This is a very long message that should auto-dismiss after the configured duration based on the message type',
      'info'
    );
  };

  // Test: Custom Duration
  const testCustomDuration = () => {
    showSnackbar(
      'This message will show for 10 seconds',
      'info',
      undefined,
      10000
    );
  };

  // Test: Simple Dialog
  const testSimpleDialog = () => {
    setShowSimpleDialog(true);
  };

  const confirmSimple = async () => {
    setShowSimpleDialog(false);
    showSnackbar('Confirmed!', 'success');
  };

  // Test: Destructive Dialog
  const testDestructiveDialog = () => {
    setShowDestructiveDialog(true);
  };

  const confirmDelete = async () => {
    setShowDestructiveDialog(false);
    showSnackbar('Item deleted', 'success');
  };

  // Test: Async Dialog with Loading
  const testAsyncDialog = () => {
    setShowAsyncDialog(true);
  };

  const confirmAsync = async () => {
    // Simulate async operation
    await new Promise<void>((resolve) => setTimeout(() => resolve(), 2000));
    setShowAsyncDialog(false);
    showSnackbar('Async operation completed', 'success');
  };

  // Test: Real-world scenario - Save with validation
  const testRealWorldSave = () => {
    // Simulate validation failure
    const hasErrors = Math.random() > 0.5;

    if (hasErrors) {
      showSnackbar('Please fill in all required fields', 'warning');
    } else {
      // Simulate save
      setTimeout(() => {
        const success = Math.random() > 0.2;
        if (success) {
          showSnackbar('WBS item "Foundation Work" saved', 'success');
        } else {
          showSnackbar('Failed to save: Network timeout', 'error');
        }
      }, 500);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Title title="Snackbar Tests" />
        <Card.Content>
          <Text variant="bodyMedium" style={styles.description}>
            Test different snackbar types and behaviors
          </Text>

          <Button
            mode="contained"
            onPress={testSuccess}
            style={styles.button}
            buttonColor={COLORS.SUCCESS}
          >
            Success Snackbar (Green)
          </Button>

          <Button
            mode="contained"
            onPress={testError}
            style={styles.button}
            buttonColor={COLORS.ERROR}
          >
            Error Snackbar (Red)
          </Button>

          <Button
            mode="contained"
            onPress={testWarning}
            style={styles.button}
            buttonColor={COLORS.WARNING}
          >
            Warning Snackbar (Orange)
          </Button>

          <Button
            mode="contained"
            onPress={testInfo}
            style={styles.button}
            buttonColor={COLORS.INFO}
          >
            Info Snackbar (Blue)
          </Button>

          <Divider style={styles.divider} />

          <Button
            mode="outlined"
            onPress={testWithAction}
            style={styles.button}
          >
            Snackbar with Undo Action
          </Button>

          <Button
            mode="outlined"
            onPress={testQueue}
            style={styles.button}
          >
            Queue 4 Messages
          </Button>

          <Button
            mode="outlined"
            onPress={testLongMessage}
            style={styles.button}
          >
            Long Message
          </Button>

          <Button
            mode="outlined"
            onPress={testCustomDuration}
            style={styles.button}
          >
            10 Second Duration
          </Button>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Title title="Dialog Tests" />
        <Card.Content>
          <Text variant="bodyMedium" style={styles.description}>
            Test confirmation dialogs
          </Text>

          <Button
            mode="contained"
            onPress={testSimpleDialog}
            style={styles.button}
            buttonColor={COLORS.INFO}
          >
            Simple Dialog
          </Button>

          <Button
            mode="contained"
            onPress={testDestructiveDialog}
            style={styles.button}
            buttonColor={COLORS.ERROR}
          >
            Destructive Dialog (Red Button)
          </Button>

          <Button
            mode="contained"
            onPress={testAsyncDialog}
            style={styles.button}
            buttonColor={COLORS.STATUS_EVALUATED}
          >
            Async Dialog (Loading State)
          </Button>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Title title="Real-World Scenarios" />
        <Card.Content>
          <Text variant="bodyMedium" style={styles.description}>
            Test realistic use cases
          </Text>

          <Button
            mode="contained"
            onPress={testRealWorldSave}
            style={styles.button}
          >
            Save with Validation (Random)
          </Button>

          <Text variant="bodySmall" style={styles.info}>
            Items deleted with undo: {deleteCount}
          </Text>
        </Card.Content>
      </Card>

      {/* Simple Dialog */}
      <ConfirmDialog
        visible={showSimpleDialog}
        title="Confirm Action"
        message="This is a simple confirmation dialog. Do you want to continue?"
        confirmText="Yes"
        cancelText="No"
        onConfirm={confirmSimple}
        onCancel={() => setShowSimpleDialog(false)}
        destructive={false}
      />

      {/* Destructive Dialog */}
      <ConfirmDialog
        visible={showDestructiveDialog}
        title="Delete Item"
        message="Are you sure you want to delete this item? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={() => setShowDestructiveDialog(false)}
        destructive={true}
      />

      {/* Async Dialog */}
      <ConfirmDialog
        visible={showAsyncDialog}
        title="Lock Baseline"
        message="This operation will take a few seconds. The confirm button will show a loading spinner."
        confirmText="Lock"
        cancelText="Cancel"
        onConfirm={confirmAsync}
        onCancel={() => setShowAsyncDialog(false)}
        destructive={false}
      />

      <View style={styles.footer}>
        <Text variant="bodySmall" style={styles.footerText}>
          Test all features above. This screen will be removed after testing.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  card: {
    margin: 16,
    marginBottom: 8,
  },
  description: {
    marginBottom: 16,
    color: '#666',
  },
  button: {
    marginBottom: 12,
  },
  divider: {
    marginVertical: 16,
  },
  info: {
    marginTop: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  footer: {
    padding: 16,
    marginBottom: 32,
  },
  footerText: {
    textAlign: 'center',
    color: '#999',
  },
});

export default SnackbarTestScreen;
