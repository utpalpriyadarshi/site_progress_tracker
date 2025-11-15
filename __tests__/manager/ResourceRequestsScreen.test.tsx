import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ResourceRequestsScreen from '../../src/manager/ResourceRequestsScreen';

// Mock the components
jest.mock('../../src/manager/components/ResourceRequestForm', () => {
  return function ResourceRequestForm({ currentUserId }: { currentUserId: string }) {
    const React = require('react');
    const { View, Text } = require('react-native');
    return (
      <View testID="resource-request-form">
        <Text>ResourceRequestForm</Text>
        <Text testID="form-user-id">{currentUserId}</Text>
      </View>
    );
  };
});

jest.mock('../../src/manager/components/ApprovalQueue', () => {
  return function ApprovalQueue({ currentUserId }: { currentUserId: string }) {
    const React = require('react');
    const { View, Text } = require('react-native');
    return (
      <View testID="approval-queue">
        <Text>ApprovalQueue</Text>
        <Text testID="queue-user-id">{currentUserId}</Text>
      </View>
    );
  };
});

describe('ResourceRequestsScreen Component', () => {
  describe('Component Rendering', () => {
    it('should render the screen with header', () => {
      const { getByText } = render(<ResourceRequestsScreen />);

      expect(getByText('Resource Requests')).toBeTruthy();
    });

    it('should render tab bar with both tabs', () => {
      const { getByText } = render(<ResourceRequestsScreen />);

      expect(getByText('Create Request')).toBeTruthy();
      expect(getByText('Approval Queue')).toBeTruthy();
    });

    it('should render Create Request tab as active by default', () => {
      const { getByTestId } = render(<ResourceRequestsScreen />);

      expect(getByTestId('resource-request-form')).toBeTruthy();
    });
  });

  describe('Tab Navigation', () => {
    it('should switch to Approval Queue tab when clicked', () => {
      const { getByText, getByTestId, queryByTestId } = render(
        <ResourceRequestsScreen />
      );

      // Initially on Create Request tab
      expect(getByTestId('resource-request-form')).toBeTruthy();

      // Click Approval Queue tab
      fireEvent.press(getByText('Approval Queue'));

      // Should show ApprovalQueue component
      expect(getByTestId('approval-queue')).toBeTruthy();
      expect(queryByTestId('resource-request-form')).toBeNull();
    });

    it('should switch back to Create Request tab when clicked', () => {
      const { getByText, getByTestId, queryByTestId } = render(
        <ResourceRequestsScreen />
      );

      // Switch to Approval Queue
      fireEvent.press(getByText('Approval Queue'));
      expect(getByTestId('approval-queue')).toBeTruthy();

      // Switch back to Create Request
      fireEvent.press(getByText('Create Request'));

      // Should show ResourceRequestForm component
      expect(getByTestId('resource-request-form')).toBeTruthy();
      expect(queryByTestId('approval-queue')).toBeNull();
    });

    it('should highlight active tab', () => {
      const { getByText } = render(<ResourceRequestsScreen />);

      const createRequestTab = getByText('Create Request');
      const approvalQueueTab = getByText('Approval Queue');

      // Create Request should be active initially
      expect(createRequestTab.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ color: '#2196F3' }),
        ])
      );

      // Switch to Approval Queue
      fireEvent.press(approvalQueueTab);

      // Approval Queue should now be active
      expect(approvalQueueTab.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ color: '#2196F3' }),
        ])
      );
    });
  });

  describe('Props Passing', () => {
    it('should pass currentUserId to ResourceRequestForm', () => {
      const { getByTestId } = render(<ResourceRequestsScreen />);

      const userIdText = getByTestId('form-user-id');
      expect(userIdText.props.children).toBe('manager1');
    });

    it('should pass currentUserId to ApprovalQueue', () => {
      const { getByText, getByTestId } = render(<ResourceRequestsScreen />);

      // Switch to Approval Queue tab
      fireEvent.press(getByText('Approval Queue'));

      const userIdText = getByTestId('queue-user-id');
      expect(userIdText.props.children).toBe('manager1');
    });
  });

  describe('User Experience', () => {
    it('should maintain selected tab when re-rendered', () => {
      const { getByText, getByTestId, rerender } = render(
        <ResourceRequestsScreen />
      );

      // Switch to Approval Queue
      fireEvent.press(getByText('Approval Queue'));
      expect(getByTestId('approval-queue')).toBeTruthy();

      // Re-render
      rerender(<ResourceRequestsScreen />);

      // Should still be on Approval Queue tab
      expect(getByTestId('approval-queue')).toBeTruthy();
    });

    it('should render only one tab content at a time', () => {
      const { getByTestId, queryByTestId } = render(
        <ResourceRequestsScreen />
      );

      // Initially only ResourceRequestForm should be visible
      expect(getByTestId('resource-request-form')).toBeTruthy();
      expect(queryByTestId('approval-queue')).toBeNull();
    });
  });

  describe('Layout and Styling', () => {
    it('should render with proper container structure', () => {
      const { getByText } = render(<ResourceRequestsScreen />);

      const header = getByText('Resource Requests');
      expect(header).toBeTruthy();
    });

    it('should render tab content in content area', () => {
      const { getByTestId } = render(<ResourceRequestsScreen />);

      const form = getByTestId('resource-request-form');
      expect(form).toBeTruthy();
    });
  });

  describe('Integration', () => {
    it('should work with both ResourceRequestForm and ApprovalQueue components', () => {
      const { getByText, getByTestId } = render(<ResourceRequestsScreen />);

      // Test Create Request tab
      expect(getByTestId('resource-request-form')).toBeTruthy();
      expect(getByText('ResourceRequestForm')).toBeTruthy();

      // Test Approval Queue tab
      fireEvent.press(getByText('Approval Queue'));
      expect(getByTestId('approval-queue')).toBeTruthy();
      expect(getByText('ApprovalQueue')).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible tab buttons', () => {
      const { getByText } = render(<ResourceRequestsScreen />);

      const createRequestTab = getByText('Create Request');
      const approvalQueueTab = getByText('Approval Queue');

      expect(createRequestTab).toBeTruthy();
      expect(approvalQueueTab).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid tab switching', () => {
      const { getByText, getByTestId, queryByTestId } = render(
        <ResourceRequestsScreen />
      );

      const createRequestTab = getByText('Create Request');
      const approvalQueueTab = getByText('Approval Queue');

      // Rapidly switch tabs
      fireEvent.press(approvalQueueTab);
      fireEvent.press(createRequestTab);
      fireEvent.press(approvalQueueTab);
      fireEvent.press(createRequestTab);

      // Should end on Create Request tab
      expect(getByTestId('resource-request-form')).toBeTruthy();
      expect(queryByTestId('approval-queue')).toBeNull();
    });

    it('should handle unmounting gracefully', () => {
      const { unmount } = render(<ResourceRequestsScreen />);

      expect(() => unmount()).not.toThrow();
    });
  });
});
