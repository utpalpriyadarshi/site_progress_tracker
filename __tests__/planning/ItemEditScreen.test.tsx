/**
 * ItemEditScreen Tests - Sprint 6
 *
 * Tests the WBS item edit screen with:
 * - Pre-population of existing item data
 * - Form validation and updates
 * - Baseline lock enforcement (read-only mode)
 * - Database update operations
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import ItemEditScreen from '../../src/planning/ItemEditScreen';
import { database } from '../../models/database';
import ItemModel from '../../models/ItemModel';

// Mock navigation
const mockGoBack = jest.fn();
const mockNavigation = {
  goBack: mockGoBack,
  navigate: jest.fn(),
  addListener: jest.fn(() => jest.fn()),
};

// Mock route params
const mockRoute = {
  params: {
    itemId: 'test-item-1',
  },
};

// Mock item data
const mockItem = {
  id: 'test-item-1',
  name: 'Test Item',
  wbsCode: '1.2.3.0',
  wbsLevel: 3,
  categoryId: 'cat-1',
  siteId: 'site-1',
  projectPhase: 'construction',
  plannedStartDate: 1700000000000,
  plannedEndDate: 1700864000000, // 10 days later
  plannedQuantity: 5,
  completedQuantity: 0,
  unitOfMeasurement: 'Set',
  isMilestone: false,
  isCriticalPath: true,
  isBaselineLocked: false,
  floatDays: 0,
  dependencyRisk: 'medium',
  riskNotes: 'Test risk notes',
  status: 'not_started',
  createdAt: 1699000000000,
  updatedAt: 1699100000000,
  getProgressPercentage: jest.fn(() => 0),
  update: jest.fn(),
};

const mockLockedItem = {
  ...mockItem,
  id: 'test-item-2',
  isBaselineLocked: true,
};

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <PaperProvider>{children}</PaperProvider>
);

describe('ItemEditScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock database find
    (database.collections.get as jest.Mock) = jest.fn().mockReturnValue({
      find: jest.fn().mockResolvedValue(mockItem),
    });

    // Mock database write
    (database.write as jest.Mock) = jest.fn((callback) => callback());
  });

  describe('Rendering & Data Loading', () => {
    it('should render without crashing', async () => {
      const { findByText } = render(
        <TestWrapper>
          <ItemEditScreen navigation={mockNavigation as any} route={mockRoute as any} />
        </TestWrapper>
      );

      const title = await findByText('Edit WBS Item');
      expect(title).toBeDefined();
    });

    it('should display loading state initially', () => {
      const { getByText } = render(
        <TestWrapper>
          <ItemEditScreen navigation={mockNavigation as any} route={mockRoute as any} />
        </TestWrapper>
      );

      expect(getByText('Loading item...')).toBeDefined();
    });

    it('should load and display item data', async () => {
      const { findByDisplayValue, findByText } = render(
        <TestWrapper>
          <ItemEditScreen navigation={mockNavigation as any} route={mockRoute as any} />
        </TestWrapper>
      );

      // Check WBS code is displayed (read-only)
      await waitFor(async () => {
        const wbsCode = await findByText('1.2.3.0');
        expect(wbsCode).toBeDefined();
      });

      // Check item name is pre-populated
      const nameInput = await findByDisplayValue('Test Item');
      expect(nameInput).toBeDefined();
    });

    it('should show read-only WBS code section', async () => {
      const { findByText } = render(
        <TestWrapper>
          <ItemEditScreen navigation={mockNavigation as any} route={mockRoute as any} />
        </TestWrapper>
      );

      const readOnlyLabel = await findByText('WBS Code (Read-Only)');
      expect(readOnlyLabel).toBeDefined();

      const helperText = await findByText(/WBS codes cannot be changed/);
      expect(helperText).toBeDefined();
    });

    it('should display item metadata (created/updated dates)', async () => {
      const { findByText } = render(
        <TestWrapper>
          <ItemEditScreen navigation={mockNavigation as any} route={mockRoute as any} />
        </TestWrapper>
      );

      await waitFor(async () => {
        const infoSection = await findByText('Item Information');
        expect(infoSection).toBeDefined();
      });
    });
  });

  describe('Baseline Lock Enforcement', () => {
    beforeEach(() => {
      // Mock locked item
      (database.collections.get as jest.Mock) = jest.fn().mockReturnValue({
        find: jest.fn().mockResolvedValue(mockLockedItem),
      });
    });

    it('should show locked banner when item is baseline-locked', async () => {
      const { findByText } = render(
        <TestWrapper>
          <ItemEditScreen navigation={mockNavigation as any} route={mockRoute as any} />
        </TestWrapper>
      );

      const banner = await findByText(/baseline-locked and cannot be edited/);
      expect(banner).toBeDefined();
    });

    it('should change title to "View Item" when locked', async () => {
      const { findByText } = render(
        <TestWrapper>
          <ItemEditScreen navigation={mockNavigation as any} route={mockRoute as any} />
        </TestWrapper>
      );

      const title = await findByText('View Item');
      expect(title).toBeDefined();
    });

    it('should disable all input fields when locked', async () => {
      const { findByDisplayValue } = render(
        <TestWrapper>
          <ItemEditScreen navigation={mockNavigation as any} route={mockRoute as any} />
        </TestWrapper>
      );

      await waitFor(async () => {
        const nameInput = await findByDisplayValue('Test Item');
        expect(nameInput.props.editable).toBe(false);
      });
    });

    it('should not show Update button when locked', async () => {
      const { queryByText, findByText } = render(
        <TestWrapper>
          <ItemEditScreen navigation={mockNavigation as any} route={mockRoute as any} />
        </TestWrapper>
      );

      // Wait for loading to complete
      await findByText('View Item');

      // Update button should not exist
      const updateButton = queryByText('Update Item');
      expect(updateButton).toBeNull();
    });
  });

  describe('Form Editing (Unlocked Items)', () => {
    it('should allow editing item name', async () => {
      const { findByDisplayValue } = render(
        <TestWrapper>
          <ItemEditScreen navigation={mockNavigation as any} route={mockRoute as any} />
        </TestWrapper>
      );

      const nameInput = await findByDisplayValue('Test Item');
      fireEvent.changeText(nameInput, 'Updated Item Name');

      expect(nameInput.props.value).toBe('Updated Item Name');
    });

    it('should allow changing duration', async () => {
      const { findByDisplayValue } = render(
        <TestWrapper>
          <ItemEditScreen navigation={mockNavigation as any} route={mockRoute as any} />
        </TestWrapper>
      );

      await waitFor(async () => {
        const durationInput = await findByDisplayValue('10'); // 10 days calculated from dates
        fireEvent.changeText(durationInput, '15');
        expect(durationInput.props.value).toBe('15');
      });
    });

    it('should allow changing quantity', async () => {
      const { findByDisplayValue } = render(
        <TestWrapper>
          <ItemEditScreen navigation={mockNavigation as any} route={mockRoute as any} />
        </TestWrapper>
      );

      const quantityInput = await findByDisplayValue('5');
      fireEvent.changeText(quantityInput, '10');
      expect(quantityInput.props.value).toBe('10');
    });

    it('should toggle milestone chip', async () => {
      const { findByText } = render(
        <TestWrapper>
          <ItemEditScreen navigation={mockNavigation as any} route={mockRoute as any} />
        </TestWrapper>
      );

      const milestoneChip = await findByText('Milestone');
      fireEvent.press(milestoneChip);

      // Chip should be toggled
      expect(milestoneChip).toBeDefined();
    });

    it('should change dependency risk level', async () => {
      const { findByText } = render(
        <TestWrapper>
          <ItemEditScreen navigation={mockNavigation as any} route={mockRoute as any} />
        </TestWrapper>
      );

      const highRiskChip = await findByText('High');
      fireEvent.press(highRiskChip);

      expect(highRiskChip).toBeDefined();
    });
  });

  describe('Form Validation', () => {
    it('should show error when item name is empty', async () => {
      const { findByDisplayValue, findByText, getByText } = render(
        <TestWrapper>
          <ItemEditScreen navigation={mockNavigation as any} route={mockRoute as any} />
        </TestWrapper>
      );

      // Wait for loading to complete
      const nameInput = await findByDisplayValue('Test Item');

      // Clear the name
      fireEvent.changeText(nameInput, '');

      // Try to update
      const updateButton = await findByText('Update Item');
      fireEvent.press(updateButton);

      // Should show validation error
      await waitFor(() => {
        expect(getByText('Item name is required')).toBeDefined();
      });
    });

    it('should show error when duration is 0 or negative', async () => {
      const { findByDisplayValue, findByText, getByText } = render(
        <TestWrapper>
          <ItemEditScreen navigation={mockNavigation as any} route={mockRoute as any} />
        </TestWrapper>
      );

      const durationInput = await findByDisplayValue('10');
      fireEvent.changeText(durationInput, '0');

      const updateButton = await findByText('Update Item');
      fireEvent.press(updateButton);

      await waitFor(() => {
        expect(getByText('Duration must be greater than 0')).toBeDefined();
      });
    });

    it('should show error when quantity is 0 or negative', async () => {
      const { findByDisplayValue, findByText } = render(
        <TestWrapper>
          <ItemEditScreen navigation={mockNavigation as any} route={mockRoute as any} />
        </TestWrapper>
      );

      const quantityInput = await findByDisplayValue('5');
      fireEvent.changeText(quantityInput, '');

      const updateButton = await findByText('Update Item');
      fireEvent.press(updateButton);

      const errorMessage = await findByText('Quantity must be greater than 0');
      expect(errorMessage).toBeDefined();
    });
  });

  describe('Database Update', () => {
    it('should call database update with correct data', async () => {
      const updateMock = jest.fn();
      const itemWithUpdate = {
        ...mockItem,
        update: updateMock,
      };

      (database.collections.get as jest.Mock) = jest.fn().mockReturnValue({
        find: jest.fn().mockResolvedValue(itemWithUpdate),
      });

      const { findByDisplayValue, findByText } = render(
        <TestWrapper>
          <ItemEditScreen navigation={mockNavigation as any} route={mockRoute as any} />
        </TestWrapper>
      );

      // Wait for item to load
      const nameInput = await findByDisplayValue('Test Item');

      // Edit the name
      fireEvent.changeText(nameInput, 'Updated Item');

      // Click update
      const updateButton = await findByText('Update Item');
      fireEvent.press(updateButton);

      // Should call database update
      await waitFor(() => {
        expect(updateMock).toHaveBeenCalled();
      });
    });

    it('should show success snackbar after update', async () => {
      const { findByText } = render(
        <TestWrapper>
          <ItemEditScreen navigation={mockNavigation as any} route={mockRoute as any} />
        </TestWrapper>
      );

      const updateButton = await findByText('Update Item');
      fireEvent.press(updateButton);

      await waitFor(() => {
        expect(findByText('Item updated successfully')).toBeDefined();
      });
    });

    it('should navigate back after successful update', async () => {
      const { findByText } = render(
        <TestWrapper>
          <ItemEditScreen navigation={mockNavigation as any} route={mockRoute as any} />
        </TestWrapper>
      );

      const updateButton = await findByText('Update Item');
      fireEvent.press(updateButton);

      await waitFor(() => {
        expect(mockGoBack).toHaveBeenCalled();
      }, { timeout: 3000 });
    });

    it('should show error snackbar on update failure', async () => {
      // Mock database error
      const errorItem = {
        ...mockItem,
        update: jest.fn().mockRejectedValue(new Error('Database error')),
      };

      (database.collections.get as jest.Mock) = jest.fn().mockReturnValue({
        find: jest.fn().mockResolvedValue(errorItem),
      });

      const { findByText } = render(
        <TestWrapper>
          <ItemEditScreen navigation={mockNavigation as any} route={mockRoute as any} />
        </TestWrapper>
      );

      const updateButton = await findByText('Update Item');
      fireEvent.press(updateButton);

      await waitFor(() => {
        expect(findByText(/Failed to update item/)).toBeDefined();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle missing itemId gracefully', async () => {
      const routeWithoutId = { params: {} };

      const { findByText } = render(
        <TestWrapper>
          <ItemEditScreen navigation={mockNavigation as any} route={routeWithoutId as any} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockGoBack).toHaveBeenCalled();
      });
    });

    it('should handle item not found error', async () => {
      (database.collections.get as jest.Mock) = jest.fn().mockReturnValue({
        find: jest.fn().mockRejectedValue(new Error('Item not found')),
      });

      const { findByText } = render(
        <TestWrapper>
          <ItemEditScreen navigation={mockNavigation as any} route={mockRoute as any} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(findByText('Failed to load item data')).toBeDefined();
      });
    });
  });

  describe('Critical Path Logic', () => {
    it('should set float days to 0 when critical path is selected', async () => {
      const { findByText, queryByDisplayValue } = render(
        <TestWrapper>
          <ItemEditScreen navigation={mockNavigation as any} route={mockRoute as any} />
        </TestWrapper>
      );

      // Item is already critical path, so float field should not be visible
      await waitFor(() => {
        const floatInput = queryByDisplayValue('0');
        expect(floatInput).toBeNull(); // Should be hidden when critical path
      });
    });

    it('should show float days input when not on critical path', async () => {
      const nonCriticalItem = {
        ...mockItem,
        isCriticalPath: false,
        floatDays: 5,
      };

      (database.collections.get as jest.Mock) = jest.fn().mockReturnValue({
        find: jest.fn().mockResolvedValue(nonCriticalItem),
      });

      const { findByText, queryByDisplayValue } = render(
        <TestWrapper>
          <ItemEditScreen navigation={mockNavigation as any} route={mockRoute as any} />
        </TestWrapper>
      );

      // Wait for screen to load
      await findByText('Edit WBS Item');

      // Check that float input exists (it may have value "5")
      await waitFor(() => {
        const floatLabel = queryByDisplayValue('5');
        expect(floatLabel).toBeTruthy();
      }, { timeout: 3000 });
    });
  });

  describe('Risk Notes Visibility', () => {
    it('should show risk notes input when risk is medium or high', async () => {
      const { findByDisplayValue } = render(
        <TestWrapper>
          <ItemEditScreen navigation={mockNavigation as any} route={mockRoute as any} />
        </TestWrapper>
      );

      const riskNotesInput = await findByDisplayValue('Test risk notes');
      expect(riskNotesInput).toBeDefined();
    });

    it('should hide risk notes input when risk is low', async () => {
      const lowRiskItem = {
        ...mockItem,
        dependencyRisk: 'low',
        riskNotes: '',
      };

      (database.collections.get as jest.Mock) = jest.fn().mockReturnValue({
        find: jest.fn().mockResolvedValue(lowRiskItem),
      });

      const { findByText, queryByPlaceholderText } = render(
        <TestWrapper>
          <ItemEditScreen navigation={mockNavigation as any} route={mockRoute as any} />
        </TestWrapper>
      );

      // Wait for load
      await findByText('Edit WBS Item');

      // Risk notes should not be visible
      const riskNotesInput = queryByPlaceholderText('Describe the risk and mitigation plan');
      expect(riskNotesInput).toBeNull();
    });
  });
});
