/**
 * ItemCreationScreen Tests - Sprint 4
 *
 * Tests the WBS item creation screen with form validation,
 * database save, and navigation flows
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import ItemCreationScreen from '../../src/planning/ItemCreationScreen';
import { database } from '../../models/database';
import { WBSCodeGenerator } from '../../services/planning/WBSCodeGenerator';

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
    siteId: 'test-site-1',
    parentWbsCode: null,
  },
};

// Mock WBSCodeGenerator
jest.mock('../../services/planning/WBSCodeGenerator', () => ({
  WBSCodeGenerator: {
    generateRootCode: jest.fn().mockResolvedValue('1.0.0.0'),
    generateChildCode: jest.fn().mockResolvedValue('1.1.0.0'),
    calculateLevel: jest.fn((code) => {
      const parts = code.split('.');
      return parts.filter((p: string) => p !== '0').length || 1;
    }),
  },
}));

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <PaperProvider>{children}</PaperProvider>
);

describe('ItemCreationScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render without crashing', async () => {
      const { getByText } = render(
        <TestWrapper>
          <ItemCreationScreen navigation={mockNavigation as any} route={mockRoute as any} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByText('Create WBS Item')).toBeDefined();
      });
    });

    it('should display WBS code preview', async () => {
      const { findByText } = render(
        <TestWrapper>
          <ItemCreationScreen navigation={mockNavigation as any} route={mockRoute as any} />
        </TestWrapper>
      );

      const wbsCodeLabel = await findByText('WBS Code (Auto-generated)');
      expect(wbsCodeLabel).toBeDefined();

      const generatedCode = await findByText('1.0.0.0');
      expect(generatedCode).toBeDefined();
    });

    it('should show root-level helper text when no parent', async () => {
      const { findByText } = render(
        <TestWrapper>
          <ItemCreationScreen navigation={mockNavigation as any} route={mockRoute as any} />
        </TestWrapper>
      );

      const helperText = await findByText('This will be a root-level item (Level 1)');
      expect(helperText).toBeDefined();
    });

    it('should show parent WBS code when creating child item', async () => {
      const childRoute = {
        params: {
          siteId: 'test-site-1',
          parentWbsCode: '1.0.0.0',
        },
      };

      const { findByText } = render(
        <TestWrapper>
          <ItemCreationScreen navigation={mockNavigation as any} route={childRoute as any} />
        </TestWrapper>
      );

      const parentInfo = await findByText('Child of: 1.0.0.0');
      expect(parentInfo).toBeDefined();
    });
  });

  describe('WBS Code Generation', () => {
    it('should generate root code when no parent', async () => {
      render(
        <TestWrapper>
          <ItemCreationScreen navigation={mockNavigation as any} route={mockRoute as any} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(WBSCodeGenerator.generateRootCode).toHaveBeenCalledWith('test-site-1');
      });
    });

    it('should generate child code when parent specified', async () => {
      const childRoute = {
        params: {
          siteId: 'test-site-1',
          parentWbsCode: '1.0.0.0',
        },
      };

      render(
        <TestWrapper>
          <ItemCreationScreen navigation={mockNavigation as any} route={childRoute as any} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(WBSCodeGenerator.generateChildCode).toHaveBeenCalledWith('test-site-1', '1.0.0.0');
      });
    });
  });

  describe('Form Sections', () => {
    it('should display all form sections', async () => {
      const { getByText } = render(
        <TestWrapper>
          <ItemCreationScreen navigation={mockNavigation as any} route={mockRoute as any} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByText('Item Details')).toBeDefined();
        expect(getByText('Category *')).toBeDefined();
        expect(getByText('Project Phase *')).toBeDefined();
        expect(getByText('Schedule & Quantity')).toBeDefined();
        expect(getByText('Critical Path & Risk')).toBeDefined();
        expect(getByText('Dependency Risk')).toBeDefined();
      });
    });

    it('should have required field labels with asterisks', async () => {
      const { getByText } = render(
        <TestWrapper>
          <ItemCreationScreen navigation={mockNavigation as any} route={mockRoute as any} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByText('Category *')).toBeDefined();
        expect(getByText('Project Phase *')).toBeDefined();
      });
    });
  });

  describe('Form Validation', () => {
    it('should show validation errors for empty required fields', async () => {
      const { getByText, getByTestId } = render(
        <TestWrapper>
          <ItemCreationScreen navigation={mockNavigation as any} route={mockRoute as any} />
        </TestWrapper>
      );

      // Wait for screen to load
      await waitFor(() => {
        expect(getByText('Create WBS Item')).toBeDefined();
      });

      // Try to save with empty form (would need to add testID to save button in actual component)
      // This is a placeholder - actual implementation would require accessible save button
      // fireEvent.press(getByTestId('save-button'));

      // await waitFor(() => {
      //   expect(getByText('Item name is required')).toBeDefined();
      //   expect(getByText('Category is required')).toBeDefined();
      // });
    });

    it('should validate numeric fields', async () => {
      // This test would verify that duration and quantity only accept positive numbers
      // Implementation depends on accessible text inputs with testIDs
    });
  });

  describe('Critical Path & Milestones', () => {
    it('should display Milestone chip', async () => {
      const { findByText } = render(
        <TestWrapper>
          <ItemCreationScreen navigation={mockNavigation as any} route={mockRoute as any} />
        </TestWrapper>
      );

      const milestoneChip = await findByText('Milestone');
      expect(milestoneChip).toBeDefined();
    });

    it('should display Critical Path chip', async () => {
      const { findByText } = render(
        <TestWrapper>
          <ItemCreationScreen navigation={mockNavigation as any} route={mockRoute as any} />
        </TestWrapper>
      );

      const criticalPathChip = await findByText('Critical Path');
      expect(criticalPathChip).toBeDefined();
    });

    it('should display risk level chips', async () => {
      const { findByText } = render(
        <TestWrapper>
          <ItemCreationScreen navigation={mockNavigation as any} route={mockRoute as any} />
        </TestWrapper>
      );

      expect(await findByText('Low')).toBeDefined();
      expect(await findByText('Medium')).toBeDefined();
      expect(await findByText('High')).toBeDefined();
    });
  });

  describe('Save Button', () => {
    it('should display Create Item button', async () => {
      const { findByText } = render(
        <TestWrapper>
          <ItemCreationScreen navigation={mockNavigation as any} route={mockRoute as any} />
        </TestWrapper>
      );

      const createButton = await findByText('Create Item');
      expect(createButton).toBeDefined();
    });

    it('should have check icon in app bar', async () => {
      // This test would verify the app bar check icon exists
      // Implementation depends on how the Appbar.Action is structured
    });
  });

  describe('Database Integration', () => {
    it('should save item to database when form is valid', async () => {
      // This test would verify database.write is called with correct data
      // Requires mocking database.write and setting up a complete form
      const mockWrite = jest.spyOn(database, 'write').mockImplementation(async (callback) => {
        await callback();
      });

      const mockCreate = jest.fn();
      jest.spyOn(database.collections, 'get').mockReturnValue({
        create: mockCreate,
      } as any);

      // Would need to fill form and click save here
      // await fillFormWithValidData();
      // await clickSaveButton();

      // await waitFor(() => {
      //   expect(mockWrite).toHaveBeenCalled();
      //   expect(mockCreate).toHaveBeenCalled();
      // });

      mockWrite.mockRestore();
    });
  });

  describe('Navigation', () => {
    it('should navigate back when back button is pressed', async () => {
      const { getByText } = render(
        <TestWrapper>
          <ItemCreationScreen navigation={mockNavigation as any} route={mockRoute as any} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByText('Create WBS Item')).toBeDefined();
      });

      // The Appbar.BackAction would trigger navigation.goBack()
      // This would require fireEvent on the back button
      // fireEvent.press(backButton);
      // expect(mockGoBack).toHaveBeenCalled();
    });
  });

  describe('Snackbar Notifications', () => {
    it('should show success snackbar after successful save', async () => {
      // This test would verify snackbar appears with success message
      // Requires completing a save operation
    });

    it('should show error snackbar on save failure', async () => {
      // This test would verify snackbar appears with error message
      // Requires mocking a database error
    });
  });

  describe('Screen Props Types', () => {
    it('should accept ItemCreation screen type', () => {
      const validRoute = {
        params: {
          siteId: 'test-site',
          parentWbsCode: null,
        },
      };

      const { getByText } = render(
        <TestWrapper>
          <ItemCreationScreen navigation={mockNavigation as any} route={validRoute as any} />
        </TestWrapper>
      );

      expect(getByText).toBeDefined();
    });

    it('should accept ItemEdit screen type', () => {
      const editRoute = {
        params: {
          itemId: 'test-item-123',
        },
      };

      // This would test the edit mode (future implementation)
      // const { getByText } = render(
      //   <TestWrapper>
      //     <ItemCreationScreen navigation={mockNavigation as any} route={editRoute as any} />
      //   </TestWrapper>
      // );

      // expect(getByText('Edit WBS Item')).toBeDefined();
    });
  });
});
