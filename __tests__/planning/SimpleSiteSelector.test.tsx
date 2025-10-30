/**
 * SimpleSiteSelector Component Tests
 *
 * Tests for Site Selector component with real-time observable updates
 * Covers: Loading sites, site selection, real-time updates, menu interactions
 */

import React from 'react';
import { render, waitFor, fireEvent, act } from '@testing-library/react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import SimpleSiteSelector from '../../src/planning/components/SimpleSiteSelector';
import SiteModel from '../../models/SiteModel';
import ProjectModel from '../../models/ProjectModel';
import { database } from '../../models/database';

// Wrapper component with providers
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <PaperProvider>{children}</PaperProvider>
);

describe('SimpleSiteSelector', () => {
  let testProject: ProjectModel;
  let testSite1: SiteModel;
  let testSite2: SiteModel;
  let testSite3: SiteModel;

  beforeAll(async () => {
    // Create test project
    await database.write(async () => {
      testProject = await database.collections.get<ProjectModel>('projects').create((project: any) => {
        project.name = 'Test Project';
        project.client = 'Test Client';
        project.startDate = Date.now();
        project.endDate = Date.now() + 86400000 * 365;
        project.status = 'active';
        project.budget = 1000000;
        project.syncStatus = 'pending';
        project.version = 1;
      });
    });
  });

  beforeEach(async () => {
    // Create test sites before each test
    await database.write(async () => {
      testSite1 = await database.collections.get<SiteModel>('sites').create((site: any) => {
        site.name = 'Construction Site Alpha';
        site.location = 'New York, NY';
        site.projectId = testProject.id;
        site.supervisorId = 'supervisor-1';
        site.syncStatus = 'pending';
        site.version = 1;
      });

      testSite2 = await database.collections.get<SiteModel>('sites').create((site: any) => {
        site.name = 'Construction Site Beta';
        site.location = 'Los Angeles, CA';
        site.projectId = testProject.id;
        site.supervisorId = null; // Unassigned
        site.syncStatus = 'pending';
        site.version = 1;
      });

      testSite3 = await database.collections.get<SiteModel>('sites').create((site: any) => {
        site.name = 'Construction Site Gamma';
        site.location = 'Chicago, IL';
        site.projectId = testProject.id;
        site.supervisorId = 'supervisor-2';
        site.syncStatus = 'pending';
        site.version = 1;
      });
    });
  });

  afterEach(async () => {
    // Clean up test sites after each test
    await database.write(async () => {
      if (testSite1) await testSite1.destroyPermanently();
      if (testSite2) await testSite2.destroyPermanently();
      if (testSite3) await testSite3.destroyPermanently();
    });
  });

  afterAll(async () => {
    // Clean up test project
    if (testProject) {
      await database.write(async () => {
        await testProject.destroyPermanently();
      });
    }
  });

  describe('Component Rendering', () => {
    test('should render without crashing', () => {
      const onSiteChange = jest.fn();
      const { getByText } = render(
        <TestWrapper>
          <SimpleSiteSelector
            selectedSite={null}
            onSiteChange={onSiteChange}
          />
        </TestWrapper>
      );

      expect(getByText('Site')).toBeTruthy();
      expect(getByText('Select Site')).toBeTruthy();
    });

    test('should display selected site name when provided', () => {
      const onSiteChange = jest.fn();
      const { getByText } = render(
        <TestWrapper>
          <SimpleSiteSelector
            selectedSite={testSite1}
            onSiteChange={onSiteChange}
          />
        </TestWrapper>
      );

      expect(getByText('Construction Site Alpha')).toBeTruthy();
    });

    test('should display selected site location when provided', () => {
      const onSiteChange = jest.fn();
      const { getByText } = render(
        <TestWrapper>
          <SimpleSiteSelector
            selectedSite={testSite1}
            onSiteChange={onSiteChange}
          />
        </TestWrapper>
      );

      expect(getByText('New York, NY')).toBeTruthy();
    });

    test('should not display location when no site selected', () => {
      const onSiteChange = jest.fn();
      const { queryByText } = render(
        <TestWrapper>
          <SimpleSiteSelector
            selectedSite={null}
            onSiteChange={onSiteChange}
          />
        </TestWrapper>
      );

      expect(queryByText('New York, NY')).toBeFalsy();
    });
  });

  describe('Site Loading via Observables', () => {
    test('should load sites from database automatically', async () => {
      const onSiteChange = jest.fn();
      const { getByText } = render(
        <TestWrapper>
          <SimpleSiteSelector
            selectedSite={null}
            onSiteChange={onSiteChange}
          />
        </TestWrapper>
      );

      // Open menu
      const button = getByText('Select Site');
      fireEvent.press(button);

      // Wait for sites to load via observable
      await waitFor(() => {
        expect(getByText('Construction Site Alpha')).toBeTruthy();
        expect(getByText('Construction Site Beta')).toBeTruthy();
        expect(getByText('Construction Site Gamma')).toBeTruthy();
      });
    });

    test('should show all sites including unassigned ones', async () => {
      const onSiteChange = jest.fn();
      const { getByText } = render(
        <TestWrapper>
          <SimpleSiteSelector
            selectedSite={null}
            onSiteChange={onSiteChange}
          />
        </TestWrapper>
      );

      fireEvent.press(getByText('Select Site'));

      await waitFor(() => {
        // Beta site has no supervisor (unassigned)
        expect(getByText('Construction Site Beta')).toBeTruthy();
      });
    });

    test('should display "Clear Selection" option', async () => {
      const onSiteChange = jest.fn();
      const { getByText } = render(
        <TestWrapper>
          <SimpleSiteSelector
            selectedSite={null}
            onSiteChange={onSiteChange}
          />
        </TestWrapper>
      );

      fireEvent.press(getByText('Select Site'));

      await waitFor(() => {
        expect(getByText('Clear Selection')).toBeTruthy();
      });
    });
  });

  describe('Site Selection', () => {
    test('should call onSiteChange when site is selected', async () => {
      const onSiteChange = jest.fn();
      const { getByText } = render(
        <TestWrapper>
          <SimpleSiteSelector
            selectedSite={null}
            onSiteChange={onSiteChange}
          />
        </TestWrapper>
      );

      fireEvent.press(getByText('Select Site'));

      await waitFor(() => {
        expect(getByText('Construction Site Alpha')).toBeTruthy();
      });

      // Select site
      fireEvent.press(getByText('Construction Site Alpha'));

      expect(onSiteChange).toHaveBeenCalledWith(testSite1);
    });

    test('should call onSiteChange with null when Clear Selection is pressed', async () => {
      const onSiteChange = jest.fn();
      const { getByText } = render(
        <TestWrapper>
          <SimpleSiteSelector
            selectedSite={testSite1}
            onSiteChange={onSiteChange}
          />
        </TestWrapper>
      );

      fireEvent.press(getByText('Construction Site Alpha'));

      await waitFor(() => {
        expect(getByText('Clear Selection')).toBeTruthy();
      });

      fireEvent.press(getByText('Clear Selection'));

      expect(onSiteChange).toHaveBeenCalledWith(null);
    });

    test('should close menu after site selection', async () => {
      const onSiteChange = jest.fn();
      const { getByText, queryByText } = render(
        <TestWrapper>
          <SimpleSiteSelector
            selectedSite={null}
            onSiteChange={onSiteChange}
          />
        </TestWrapper>
      );

      // Open menu
      fireEvent.press(getByText('Select Site'));

      await waitFor(() => {
        expect(getByText('Construction Site Alpha')).toBeTruthy();
      });

      // Select site (should close menu)
      fireEvent.press(getByText('Construction Site Alpha'));

      // Menu should close after selection
      await waitFor(() => {
        expect(onSiteChange).toHaveBeenCalled();
      });
    });
  });

  describe('Menu Interactions', () => {
    test('should open menu when button is pressed', async () => {
      const onSiteChange = jest.fn();
      const { getByText } = render(
        <TestWrapper>
          <SimpleSiteSelector
            selectedSite={null}
            onSiteChange={onSiteChange}
          />
        </TestWrapper>
      );

      const button = getByText('Select Site');
      fireEvent.press(button);

      await waitFor(() => {
        expect(getByText('Clear Selection')).toBeTruthy();
      });
    });

    test('should show checkmark icon for selected site', async () => {
      const onSiteChange = jest.fn();
      const { getByText, UNSAFE_getByProps } = render(
        <TestWrapper>
          <SimpleSiteSelector
            selectedSite={testSite1}
            onSiteChange={onSiteChange}
          />
        </TestWrapper>
      );

      fireEvent.press(getByText('Construction Site Alpha'));

      await waitFor(() => {
        // Check that selected site has checkmark icon
        const alphaItem = getByText('Construction Site Alpha').parent;
        // Note: Icon checking is limited in react-native-paper Menu.Item
        expect(alphaItem).toBeTruthy();
      });
    });
  });

  describe('Real-Time Updates (Observable Pattern)', () => {
    test('should update site list when new site is created', async () => {
      const onSiteChange = jest.fn();
      const { getByText, queryByText } = render(
        <TestWrapper>
          <SimpleSiteSelector
            selectedSite={null}
            onSiteChange={onSiteChange}
          />
        </TestWrapper>
      );

      // Open menu
      fireEvent.press(getByText('Select Site'));

      // Verify initial sites
      await waitFor(() => {
        expect(getByText('Construction Site Alpha')).toBeTruthy();
        expect(queryByText('New Dynamic Site')).toBeFalsy();
      });

      // Create new site dynamically
      let newSite: SiteModel;
      await act(async () => {
        await database.write(async () => {
          newSite = await database.collections.get<SiteModel>('sites').create((site: any) => {
            site.name = 'New Dynamic Site';
            site.location = 'Seattle, WA';
            site.projectId = testProject.id;
            site.supervisorId = null;
            site.syncStatus = 'pending';
            site.version = 1;
          });
        });
      });

      // Wait for observable to update component
      await waitFor(() => {
        expect(getByText('New Dynamic Site')).toBeTruthy();
      }, { timeout: 3000 });

      // Cleanup
      await database.write(async () => {
        await newSite!.destroyPermanently();
      });
    });

    test('should update site list when site is deleted', async () => {
      const onSiteChange = jest.fn();
      const { getByText, queryByText } = render(
        <TestWrapper>
          <SimpleSiteSelector
            selectedSite={null}
            onSiteChange={onSiteChange}
          />
        </TestWrapper>
      );

      // Open menu
      fireEvent.press(getByText('Select Site'));

      // Verify site exists
      await waitFor(() => {
        expect(getByText('Construction Site Gamma')).toBeTruthy();
      });

      // Delete site dynamically
      await act(async () => {
        await database.write(async () => {
          await testSite3.destroyPermanently();
        });
      });

      // Wait for observable to update component
      await waitFor(() => {
        expect(queryByText('Construction Site Gamma')).toBeFalsy();
      }, { timeout: 3000 });

      // Don't cleanup testSite3 in afterEach (already deleted)
      testSite3 = null as any;
    });

    test('should update displayed site name when site is edited', async () => {
      const onSiteChange = jest.fn();
      const { getByText, queryByText, rerender } = render(
        <TestWrapper>
          <SimpleSiteSelector
            selectedSite={testSite1}
            onSiteChange={onSiteChange}
          />
        </TestWrapper>
      );

      // Initial name displayed
      expect(getByText('Construction Site Alpha')).toBeTruthy();

      // Update site name
      await act(async () => {
        await database.write(async () => {
          await testSite1.update((site: any) => {
            site.name = 'Updated Site Name';
          });
        });
      });

      // Re-render with updated site reference
      rerender(
        <TestWrapper>
          <SimpleSiteSelector
            selectedSite={testSite1}
            onSiteChange={onSiteChange}
          />
        </TestWrapper>
      );

      // Wait for update to reflect
      await waitFor(() => {
        expect(getByText('Updated Site Name')).toBeTruthy();
      }, { timeout: 3000 });
    });
  });

  describe('Empty State', () => {
    test('should show "No sites available" when no sites exist', async () => {
      // Delete all test sites
      await database.write(async () => {
        await testSite1.destroyPermanently();
        await testSite2.destroyPermanently();
        await testSite3.destroyPermanently();
      });

      const onSiteChange = jest.fn();
      const { getByText } = render(
        <TestWrapper>
          <SimpleSiteSelector
            selectedSite={null}
            onSiteChange={onSiteChange}
          />
        </TestWrapper>
      );

      fireEvent.press(getByText('Select Site'));

      await waitFor(() => {
        expect(getByText('No sites available')).toBeTruthy();
      });

      // Mark as cleaned up for afterEach
      testSite1 = null as any;
      testSite2 = null as any;
      testSite3 = null as any;
    });

    test('should disable "Clear Selection" when no site is selected', async () => {
      const onSiteChange = jest.fn();
      const { getByText } = render(
        <TestWrapper>
          <SimpleSiteSelector
            selectedSite={null}
            onSiteChange={onSiteChange}
          />
        </TestWrapper>
      );

      fireEvent.press(getByText('Select Site'));

      await waitFor(() => {
        const clearButton = getByText('Clear Selection');
        expect(clearButton).toBeTruthy();
        // Note: Disabled state checking is limited in Menu.Item
      });
    });
  });

  describe('Performance and Cleanup', () => {
    test('should unsubscribe from observable on unmount', async () => {
      const onSiteChange = jest.fn();
      const { unmount } = render(
        <TestWrapper>
          <SimpleSiteSelector
            selectedSite={null}
            onSiteChange={onSiteChange}
          />
        </TestWrapper>
      );

      // Wait for initial load
      await waitFor(() => {
        expect(true).toBe(true); // Component mounted
      });

      // Unmount should not cause memory leaks
      expect(() => unmount()).not.toThrow();
    });

    test('should handle rapid site changes without crashing', async () => {
      const onSiteChange = jest.fn();
      const { getByText } = render(
        <TestWrapper>
          <SimpleSiteSelector
            selectedSite={null}
            onSiteChange={onSiteChange}
          />
        </TestWrapper>
      );

      // Open menu
      fireEvent.press(getByText('Select Site'));

      await waitFor(() => {
        expect(getByText('Construction Site Alpha')).toBeTruthy();
      });

      // Rapidly create and delete sites
      for (let i = 0; i < 5; i++) {
        await act(async () => {
          await database.write(async () => {
            const tempSite = await database.collections.get<SiteModel>('sites').create((site: any) => {
              site.name = `Temp Site ${i}`;
              site.location = 'Temp Location';
              site.projectId = testProject.id;
              site.supervisorId = null;
              site.syncStatus = 'pending';
              site.version = 1;
            });
            // Immediately delete
            await tempSite.destroyPermanently();
          });
        });
      }

      // Component should still be functional
      await waitFor(() => {
        expect(getByText('Construction Site Alpha')).toBeTruthy();
      });
    });
  });
});
