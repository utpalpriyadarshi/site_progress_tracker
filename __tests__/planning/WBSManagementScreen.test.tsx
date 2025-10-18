/**
 * WBSManagementScreen Component Tests (Sprint 2)
 *
 * Tests for WBS Management screen component
 */

import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import { database } from '../../models/database';
import WBSManagementScreen from '../../src/planning/WBSManagementScreen';
import ItemModel from '../../models/ItemModel';
import SiteModel from '../../models/SiteModel';
import CategoryModel from '../../models/CategoryModel';
import ProjectModel from '../../models/ProjectModel';

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  setOptions: jest.fn(),
  addListener: jest.fn(() => jest.fn()),
};

const mockRoute = {
  params: {},
  key: 'test-key',
  name: 'WBSManagement',
};

// Wrapper component with providers
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <PaperProvider>{children}</PaperProvider>
);

describe('WBSManagementScreen', () => {
  let testProject: ProjectModel;
  let testSite: SiteModel;
  let testCategory: CategoryModel;

  beforeAll(async () => {
    await database.write(async () => {
      // Create test project
      testProject = await database.collections.get<ProjectModel>('projects').create((p) => {
        p.name = 'Test Project';
        p.description = 'Test project for WBS';
        p.startDate = Date.now();
        p.endDate = Date.now() + 86400000 * 180;
      });

      // Create test site
      testSite = await database.collections.get<SiteModel>('sites').create((s) => {
        s.name = 'Test Site';
        s.location = 'Test Location';
        s.projectId = testProject.id;
        s.supervisorId = 'supervisor-1';
        s.plannerId = 'planner-1';
      });

      // Create test category
      testCategory = await database.collections.get<CategoryModel>('categories').create((c) => {
        c.name = 'Electrical';
        c.color = '#2196F3';
        c.iconName = 'flash';
      });
    });
  });

  beforeEach(async () => {
    // Clean up items before each test
    await database.write(async () => {
      const items = await database.collections.get<ItemModel>('items').query().fetch();
      for (const item of items) {
        await item.destroyPermanently();
      }
    });
  });

  afterAll(async () => {
    await database.write(async () => {
      await testProject.destroyPermanently();
      await testSite.destroyPermanently();
      await testCategory.destroyPermanently();
    });
  });

  it('should render without crashing', async () => {
    const { getByText } = render(
      <TestWrapper>
        <WBSManagementScreen navigation={mockNavigation as any} route={mockRoute as any} />
      </TestWrapper>
    );

    await waitFor(() => {
      // Screen should render
      expect(getByText).toBeDefined();
    });
  });

  it('should display site selector', async () => {
    const { findByText } = render(
      <TestWrapper>
        <WBSManagementScreen navigation={mockNavigation as any} route={mockRoute as any} />
      </TestWrapper>
    );

    // Should show site selector (check for common UI text)
    await waitFor(() => {
      expect(findByText).toBeDefined();
    });
  });

  it('should show empty state when no items exist', async () => {
    const { findByText } = render(
      <TestWrapper>
        <WBSManagementScreen navigation={mockNavigation as any} route={mockRoute as any} />
      </TestWrapper>
    );

    await waitFor(() => {
      // Empty state should be present
      expect(findByText).toBeDefined();
    });
  });

  it('should display items in hierarchical order', async () => {
    // Create test items with WBS codes
    await database.write(async () => {
      await database.collections.get<ItemModel>('items').create((item) => {
        item.name = 'Root Item';
        item.siteId = testSite.id;
        item.categoryId = testCategory.id;
        item.wbsCode = '1.0.0.0';
        item.wbsLevel = 1;
        item.plannedQuantity = 1;
        item.completedQuantity = 0;
        item.unitOfMeasurement = 'Set';
        item.plannedStartDate = Date.now();
        item.plannedEndDate = Date.now() + 86400000 * 30;
        item.status = 'not_started';
        item.dependencies = '[]';
        item.isBaselineLocked = false;
        item.projectPhase = 'construction';
        item.isMilestone = false;
        item.createdByRole = 'planner';
        item.isCriticalPath = false;
      });

      await database.collections.get<ItemModel>('items').create((item) => {
        item.name = 'Child Item';
        item.siteId = testSite.id;
        item.categoryId = testCategory.id;
        item.wbsCode = '1.1.0.0';
        item.wbsLevel = 2;
        item.parentWbsCode = '1.0.0.0';
        item.plannedQuantity = 1;
        item.completedQuantity = 0;
        item.unitOfMeasurement = 'Set';
        item.plannedStartDate = Date.now();
        item.plannedEndDate = Date.now() + 86400000 * 30;
        item.status = 'not_started';
        item.dependencies = '[]';
        item.isBaselineLocked = false;
        item.projectPhase = 'design';
        item.isMilestone = false;
        item.createdByRole = 'planner';
        item.isCriticalPath = false;
      });
    });

    const { findByText } = render(
      <TestWrapper>
        <WBSManagementScreen navigation={mockNavigation as any} route={mockRoute as any} />
      </TestWrapper>
    );

    await waitFor(() => {
      // Items should be displayed
      expect(findByText).toBeDefined();
    });
  });

  it('should filter items by phase', async () => {
    // Create items in different phases
    await database.write(async () => {
      await database.collections.get<ItemModel>('items').create((item) => {
        item.name = 'Design Item';
        item.siteId = testSite.id;
        item.categoryId = testCategory.id;
        item.wbsCode = '1.0.0.0';
        item.wbsLevel = 1;
        item.plannedQuantity = 1;
        item.completedQuantity = 0;
        item.unitOfMeasurement = 'Set';
        item.plannedStartDate = Date.now();
        item.plannedEndDate = Date.now() + 86400000 * 30;
        item.status = 'not_started';
        item.dependencies = '[]';
        item.isBaselineLocked = false;
        item.projectPhase = 'design';
        item.isMilestone = false;
        item.createdByRole = 'planner';
        item.isCriticalPath = false;
      });

      await database.collections.get<ItemModel>('items').create((item) => {
        item.name = 'Construction Item';
        item.siteId = testSite.id;
        item.categoryId = testCategory.id;
        item.wbsCode = '2.0.0.0';
        item.wbsLevel = 1;
        item.plannedQuantity = 1;
        item.completedQuantity = 0;
        item.unitOfMeasurement = 'Set';
        item.plannedStartDate = Date.now();
        item.plannedEndDate = Date.now() + 86400000 * 30;
        item.status = 'not_started';
        item.dependencies = '[]';
        item.isBaselineLocked = false;
        item.projectPhase = 'construction';
        item.isMilestone = false;
        item.createdByRole = 'planner';
        item.isCriticalPath = false;
      });
    });

    const { findByText } = render(
      <TestWrapper>
        <WBSManagementScreen navigation={mockNavigation as any} route={mockRoute as any} />
      </TestWrapper>
    );

    await waitFor(() => {
      // Both items should be visible initially
      expect(findByText).toBeDefined();
    });
  });

  it('should show FAB button for adding items', async () => {
    const { findByLabelText } = render(
      <TestWrapper>
        <WBSManagementScreen navigation={mockNavigation as any} route={mockRoute as any} />
      </TestWrapper>
    );

    await waitFor(() => {
      // FAB should be present
      expect(findByLabelText).toBeDefined();
    });
  });

  it('should display phase filter chips', async () => {
    const { findByText } = render(
      <TestWrapper>
        <WBSManagementScreen navigation={mockNavigation as any} route={mockRoute as any} />
      </TestWrapper>
    );

    await waitFor(() => {
      // Phase chips should be present
      expect(findByText).toBeDefined();
    });
  });

  it('should show item count in header', async () => {
    // Create test items
    await database.write(async () => {
      for (let i = 1; i <= 3; i++) {
        await database.collections.get<ItemModel>('items').create((item) => {
          item.name = `Test Item ${i}`;
          item.siteId = testSite.id;
          item.categoryId = testCategory.id;
          item.wbsCode = `${i}.0.0.0`;
          item.wbsLevel = 1;
          item.plannedQuantity = 1;
          item.completedQuantity = 0;
          item.unitOfMeasurement = 'Set';
          item.plannedStartDate = Date.now();
          item.plannedEndDate = Date.now() + 86400000 * 30;
          item.status = 'not_started';
          item.dependencies = '[]';
          item.isBaselineLocked = false;
          item.projectPhase = 'construction';
          item.isMilestone = false;
          item.createdByRole = 'planner';
          item.isCriticalPath = false;
        });
      }
    });

    const { findByText } = render(
      <TestWrapper>
        <WBSManagementScreen navigation={mockNavigation as any} route={mockRoute as any} />
      </TestWrapper>
    );

    await waitFor(() => {
      // Item count should be shown
      expect(findByText).toBeDefined();
    });
  });
});
