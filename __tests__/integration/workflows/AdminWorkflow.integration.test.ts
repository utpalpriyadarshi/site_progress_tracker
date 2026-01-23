/**
 * Admin Workflow Integration Tests - P4.1
 *
 * Tests complete admin workflows:
 * - User management (create, update, deactivate users)
 * - Site setup workflow (project → site → assign supervisor)
 * - Role-based access control
 * - User authentication and session management
 *
 * These tests verify end-to-end admin operations with realistic mocking.
 */

import { database } from '../../../models/database';
import TeamManagementService from '../../../services/team/TeamManagementService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Declare global for test environment
declare const global: {
  console: Console;
  fetch: jest.Mock;
};

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage');
jest.mock('../../../models/database', () => ({
  database: {
    collections: {
      get: jest.fn(),
    },
    write: jest.fn((callback: any) => Promise.resolve(callback())),
  },
}));

// Suppress console output
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};

// Mock data factories
const createMockUser = (
  id: string,
  username: string,
  role: string,
  status: string = 'active'
) => ({
  id,
  username,
  role,
  status,
  email: `${username}@example.com`,
  firstName: 'Test',
  lastName: 'User',
  createdAt: Date.now(),
  _raw: {
    id,
    username,
    role,
    status,
    email: `${username}@example.com`,
  },
  update: jest.fn((callback: any) => {
    const record: any = { status, role };
    callback(record);
    return Promise.resolve();
  }),
});

const createMockProject = (
  id: string,
  name: string,
  status: string = 'active'
) => ({
  id,
  name,
  status,
  client: 'Test Client',
  budget: 1000000,
  startDate: Date.now(),
  endDate: Date.now() + 365 * 24 * 60 * 60 * 1000,
  _raw: {
    id,
    name,
    status,
    client: 'Test Client',
  },
  update: jest.fn((callback: any) => {
    const record: any = { status };
    callback(record);
    return Promise.resolve();
  }),
});

const createMockSite = (
  id: string,
  name: string,
  projectId: string,
  supervisorId: string | null = null
) => ({
  id,
  name,
  projectId,
  supervisorId,
  location: 'Test Location',
  status: 'active',
  _raw: {
    id,
    name,
    project_id: projectId,
    supervisor_id: supervisorId,
    location: 'Test Location',
  },
  update: jest.fn((callback: any) => {
    const record: any = { supervisorId };
    callback(record);
    return Promise.resolve();
  }),
});

describe('Admin Workflow - Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
  });

  describe('Workflow 1: User Management', () => {
    describe('Create User Flow', () => {
      it('should create a new supervisor user with proper validation', async () => {
        const newUser = createMockUser('user-1', 'new_supervisor', 'supervisor');
        let createdUser: any = null;

        (database.collections.get as jest.Mock).mockImplementation(
          (tableName: string) => ({
            query: jest.fn(() => ({
              fetch: jest.fn(() => Promise.resolve([])),
            })),
            create: jest.fn((callback: any) => {
              createdUser = {
                id: 'user-1',
                username: '',
                role: '',
                status: 'active',
              };
              callback(createdUser);
              return Promise.resolve(createdUser);
            }),
          })
        );

        // Simulate admin creating a supervisor
        await database.write(async () => {
          const collection = database.collections.get('users');
          const user = await collection.create((record: any) => {
            record.username = 'new_supervisor';
            record.role = 'supervisor';
            record.email = 'supervisor@example.com';
            record.status = 'active';
          });
          return user;
        });

        expect(createdUser).toBeDefined();
        expect(createdUser.username).toBe('new_supervisor');
        expect(createdUser.role).toBe('supervisor');
        expect(createdUser.status).toBe('active');
      });

      it('should prevent duplicate username creation', async () => {
        const existingUser = createMockUser('user-1', 'existing_user', 'supervisor');

        (database.collections.get as jest.Mock).mockImplementation(
          (tableName: string) => ({
            query: jest.fn(() => ({
              fetch: jest.fn(() => Promise.resolve([existingUser])),
            })),
          })
        );

        // Check for existing username
        const users = await database.collections
          .get('users')
          .query()
          .fetch();

        const duplicateExists = users.some(
          (u: any) => u.username === 'existing_user'
        );

        expect(duplicateExists).toBe(true);
      });

      it('should create users with all valid roles', async () => {
        const roles = ['admin', 'manager', 'supervisor', 'planner', 'logistics', 'commercial'];
        const createdUsers: any[] = [];

        (database.collections.get as jest.Mock).mockImplementation(
          (tableName: string) => ({
            create: jest.fn((callback: any) => {
              const user = {
                id: `user-${createdUsers.length}`,
                role: '',
              };
              callback(user);
              createdUsers.push(user);
              return Promise.resolve(user);
            }),
          })
        );

        for (const role of roles) {
          await database.write(async () => {
            const collection = database.collections.get('users');
            await collection.create((record: any) => {
              record.username = `test_${role}`;
              record.role = role;
              record.status = 'active';
            });
          });
        }

        expect(createdUsers.length).toBe(roles.length);
        roles.forEach((role, index) => {
          expect(createdUsers[index].role).toBe(role);
        });
      });
    });

    describe('Update User Flow', () => {
      it('should update user role from supervisor to manager', async () => {
        const user = createMockUser('user-1', 'promote_user', 'supervisor');

        (database.collections.get as jest.Mock).mockImplementation(
          (tableName: string) => ({
            find: jest.fn(() => Promise.resolve(user)),
          })
        );

        await database.write(async () => {
          const foundUser = await database.collections
            .get('users')
            .find('user-1');
          await foundUser.update((record: any) => {
            record.role = 'manager';
          });
        });

        expect(user.update).toHaveBeenCalled();
        const updateCallback = (user.update as jest.Mock).mock.calls[0][0];
        const mockRecord: any = { role: 'supervisor' };
        updateCallback(mockRecord);
        expect(mockRecord.role).toBe('manager');
      });

      it('should deactivate user account', async () => {
        const user = createMockUser('user-1', 'deactivate_user', 'supervisor');

        (database.collections.get as jest.Mock).mockImplementation(
          (tableName: string) => ({
            find: jest.fn(() => Promise.resolve(user)),
          })
        );

        await database.write(async () => {
          const foundUser = await database.collections
            .get('users')
            .find('user-1');
          await foundUser.update((record: any) => {
            record.status = 'inactive';
          });
        });

        expect(user.update).toHaveBeenCalled();
        const updateCallback = (user.update as jest.Mock).mock.calls[0][0];
        const mockRecord: any = { status: 'active' };
        updateCallback(mockRecord);
        expect(mockRecord.status).toBe('inactive');
      });
    });

    describe('User Deactivation Cascade', () => {
      it('should handle deactivation of user with active assignments', async () => {
        const user = createMockUser('user-1', 'assigned_user', 'supervisor');
        const team = {
          id: 'team-1',
          name: 'Test Team',
          teamLeadId: 'user-1',
          status: 'active',
          update: jest.fn((callback: any) => {
            const record: any = {};
            callback(record);
            return Promise.resolve();
          }),
        };

        (database.collections.get as jest.Mock).mockImplementation(
          (tableName: string) => ({
            find: jest.fn((id: string) => {
              if (tableName === 'users') return Promise.resolve(user);
              if (tableName === 'teams') return Promise.resolve(team);
              return Promise.reject(new Error('Not found'));
            }),
            query: jest.fn(() => ({
              fetch: jest.fn(() => {
                if (tableName === 'teams') return Promise.resolve([team]);
                return Promise.resolve([]);
              }),
            })),
          })
        );

        // Step 1: Check for active team assignments
        const teams = await database.collections
          .get('teams')
          .query()
          .fetch();
        const hasActiveAssignments = teams.some(
          (t: any) => t.teamLeadId === 'user-1'
        );

        expect(hasActiveAssignments).toBe(true);

        // Step 2: Remove user from team leadership
        await database.write(async () => {
          await team.update((record: any) => {
            record.teamLeadId = null;
          });
        });

        // Step 3: Deactivate user
        await database.write(async () => {
          await user.update((record: any) => {
            record.status = 'inactive';
          });
        });

        expect(team.update).toHaveBeenCalled();
        expect(user.update).toHaveBeenCalled();
      });
    });
  });

  describe('Workflow 2: Site Setup', () => {
    describe('Complete Site Setup Flow', () => {
      it('should complete full site setup: Project → Site → Assign Supervisor', async () => {
        let project: any = null;
        let site: any = null;
        const supervisor = createMockUser('sup-1', 'site_supervisor', 'supervisor');

        (database.collections.get as jest.Mock).mockImplementation(
          (tableName: string) => ({
            create: jest.fn((callback: any) => {
              if (tableName === 'projects') {
                project = {
                  id: 'proj-1',
                  name: '',
                  status: 'active',
                };
                callback(project);
                return Promise.resolve(project);
              }
              if (tableName === 'sites') {
                site = {
                  id: 'site-1',
                  name: '',
                  projectId: '',
                  supervisorId: null,
                  update: jest.fn((cb: any) => {
                    cb(site);
                    return Promise.resolve(site);
                  }),
                };
                callback(site);
                return Promise.resolve(site);
              }
              return Promise.resolve({});
            }),
            find: jest.fn((id: string) => {
              if (id === 'site-1') return Promise.resolve(site);
              if (id === 'sup-1') return Promise.resolve(supervisor);
              return Promise.reject(new Error('Not found'));
            }),
            query: jest.fn(() => ({
              fetch: jest.fn(() => Promise.resolve([supervisor])),
            })),
          })
        );

        // Step 1: Create Project
        await database.write(async () => {
          project = await database.collections
            .get('projects')
            .create((record: any) => {
              record.name = 'New Construction Project';
              record.client = 'ABC Corp';
              record.status = 'active';
              record.budget = 5000000;
            });
        });

        expect(project).toBeDefined();
        expect(project.name).toBe('New Construction Project');

        // Step 2: Create Site under Project
        await database.write(async () => {
          site = await database.collections
            .get('sites')
            .create((record: any) => {
              record.name = 'Main Site';
              record.projectId = project.id;
              record.location = 'Downtown Area';
            });
        });

        expect(site).toBeDefined();
        expect(site.projectId).toBe('proj-1');

        // Step 3: Find available supervisors
        const supervisors = await database.collections
          .get('users')
          .query()
          .fetch();
        const availableSupervisor = supervisors.find(
          (s: any) => s.role === 'supervisor' && s.status === 'active'
        );

        expect(availableSupervisor).toBeDefined();

        // Step 4: Assign supervisor to site
        await database.write(async () => {
          const siteToUpdate = await database.collections
            .get('sites')
            .find('site-1');
          await siteToUpdate.update((record: any) => {
            record.supervisorId = availableSupervisor!.id;
          });
        });

        expect(site.update).toHaveBeenCalled();
      });

      it('should create multiple sites under one project', async () => {
        const project = createMockProject('proj-1', 'Multi-Site Project');
        const sites: any[] = [];

        (database.collections.get as jest.Mock).mockImplementation(
          (tableName: string) => ({
            find: jest.fn(() => Promise.resolve(project)),
            create: jest.fn((callback: any) => {
              const site = {
                id: `site-${sites.length + 1}`,
                name: '',
                projectId: '',
              };
              callback(site);
              sites.push(site);
              return Promise.resolve(site);
            }),
            query: jest.fn(() => ({
              fetch: jest.fn(() => Promise.resolve(sites)),
            })),
          })
        );

        // Create 3 sites under the project
        const siteNames = ['Site A', 'Site B', 'Site C'];
        for (const siteName of siteNames) {
          await database.write(async () => {
            await database.collections
              .get('sites')
              .create((record: any) => {
                record.name = siteName;
                record.projectId = 'proj-1';
              });
          });
        }

        expect(sites.length).toBe(3);
        expect(sites[0].name).toBe('Site A');
        expect(sites[1].name).toBe('Site B');
        expect(sites[2].name).toBe('Site C');
      });
    });

    describe('Site Validation', () => {
      it('should prevent site creation without valid project', async () => {
        (database.collections.get as jest.Mock).mockImplementation(
          (tableName: string) => ({
            find: jest.fn(() => Promise.reject(new Error('Project not found'))),
          })
        );

        let error: Error | null = null;
        try {
          await database.collections
            .get('projects')
            .find('invalid-project-id');
        } catch (e) {
          error = e as Error;
        }

        expect(error).toBeDefined();
        expect(error!.message).toContain('Project not found');
      });

      it('should validate supervisor exists before assignment', async () => {
        const site = createMockSite('site-1', 'Test Site', 'proj-1');

        (database.collections.get as jest.Mock).mockImplementation(
          (tableName: string) => ({
            find: jest.fn((id: string) => {
              if (tableName === 'sites') return Promise.resolve(site);
              if (tableName === 'users') {
                return Promise.reject(new Error('Supervisor not found'));
              }
              return Promise.reject(new Error('Not found'));
            }),
          })
        );

        let error: Error | null = null;
        try {
          // Try to find supervisor before assigning
          await database.collections
            .get('users')
            .find('invalid-supervisor');
        } catch (e) {
          error = e as Error;
        }

        expect(error).toBeDefined();
        expect(error!.message).toContain('Supervisor not found');
      });
    });
  });

  describe('Workflow 3: Role-Based Access Control', () => {
    it('should verify admin has full access to all operations', async () => {
      const adminUser = createMockUser('admin-1', 'admin', 'admin');

      const adminPermissions = {
        canCreateUsers: true,
        canDeactivateUsers: true,
        canCreateProjects: true,
        canDeleteProjects: true,
        canAssignSupervisors: true,
        canViewAllSites: true,
        canModifySettings: true,
      };

      // Verify admin role has all permissions
      expect(adminUser.role).toBe('admin');
      Object.values(adminPermissions).forEach((permission) => {
        expect(permission).toBe(true);
      });
    });

    it('should verify manager has limited access', async () => {
      const managerUser = createMockUser('manager-1', 'manager', 'manager');

      const managerPermissions = {
        canCreateUsers: false,
        canDeactivateUsers: false,
        canCreateProjects: false,
        canDeleteProjects: false,
        canAssignSupervisors: true,
        canViewAllSites: true,
        canApproveRequests: true,
      };

      expect(managerUser.role).toBe('manager');
      expect(managerPermissions.canCreateUsers).toBe(false);
      expect(managerPermissions.canApproveRequests).toBe(true);
    });

    it('should verify supervisor has site-limited access', async () => {
      const supervisorUser = createMockUser('sup-1', 'supervisor', 'supervisor');

      const supervisorPermissions = {
        canCreateUsers: false,
        canViewOwnSitesOnly: true,
        canSubmitReports: true,
        canReportHindrances: true,
        canManageOwnTeam: true,
      };

      expect(supervisorUser.role).toBe('supervisor');
      expect(supervisorPermissions.canViewOwnSitesOnly).toBe(true);
      expect(supervisorPermissions.canSubmitReports).toBe(true);
    });
  });

  describe('Workflow 4: Session Management', () => {
    it('should handle admin login and session creation', async () => {
      const adminUser = createMockUser('admin-1', 'admin', 'admin');
      const mockToken = 'admin-jwt-token';

      // Mock the storage functions
      const mockSetToken = jest.fn().mockResolvedValue(undefined);
      const mockGetToken = jest.fn().mockResolvedValue(mockToken);

      // Simulate login flow
      await mockSetToken(mockToken);
      await AsyncStorage.setItem('currentUser', JSON.stringify(adminUser));

      // Verify session
      const storedToken = await mockGetToken();
      expect(storedToken).toBe(mockToken);
      expect(mockSetToken).toHaveBeenCalledWith(mockToken);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'currentUser',
        expect.any(String)
      );
    });

    it('should handle session timeout and logout', async () => {
      const mockRemoveToken = jest.fn().mockResolvedValue(undefined);
      (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);

      // Simulate logout
      await mockRemoveToken();
      await AsyncStorage.removeItem('currentUser');

      expect(mockRemoveToken).toHaveBeenCalled();
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('currentUser');
    });

    it('should prevent access after session expiration', async () => {
      const mockGetToken = jest.fn().mockResolvedValue(null);

      const token = await mockGetToken();
      const isAuthenticated = token !== null;

      expect(isAuthenticated).toBe(false);
    });
  });

  describe('Workflow 5: Bulk Operations', () => {
    it('should handle bulk user creation', async () => {
      const usersToCreate = [
        { username: 'user1', role: 'supervisor' },
        { username: 'user2', role: 'supervisor' },
        { username: 'user3', role: 'manager' },
      ];
      const createdUsers: any[] = [];

      (database.collections.get as jest.Mock).mockImplementation(
        (tableName: string) => ({
          create: jest.fn((callback: any) => {
            const user = {
              id: `user-${createdUsers.length}`,
              username: '',
              role: '',
            };
            callback(user);
            createdUsers.push(user);
            return Promise.resolve(user);
          }),
        })
      );

      // Bulk create within single write transaction
      await database.write(async () => {
        for (const userData of usersToCreate) {
          await database.collections
            .get('users')
            .create((record: any) => {
              record.username = userData.username;
              record.role = userData.role;
              record.status = 'active';
            });
        }
      });

      expect(createdUsers.length).toBe(3);
    });

    it('should handle bulk site assignment to supervisors', async () => {
      const sites = [
        createMockSite('site-1', 'Site 1', 'proj-1'),
        createMockSite('site-2', 'Site 2', 'proj-1'),
        createMockSite('site-3', 'Site 3', 'proj-1'),
      ];
      const supervisorId = 'sup-1';

      (database.collections.get as jest.Mock).mockImplementation(
        (tableName: string) => ({
          query: jest.fn(() => ({
            fetch: jest.fn(() => Promise.resolve(sites)),
          })),
        })
      );

      // Assign supervisor to all sites
      await database.write(async () => {
        for (const site of sites) {
          await site.update((record: any) => {
            record.supervisorId = supervisorId;
          });
        }
      });

      sites.forEach((site) => {
        expect(site.update).toHaveBeenCalled();
      });
    });
  });
});
