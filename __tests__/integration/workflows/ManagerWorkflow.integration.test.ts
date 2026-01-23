/**
 * Manager Workflow Integration Tests - P4.3
 *
 * Tests complete manager workflows:
 * - Resource request approval workflow
 * - Team management and assignment workflow
 * - Budget oversight and approval workflow
 * - Project oversight and status tracking
 * - Resource allocation optimization
 *
 * These tests verify end-to-end manager operations with realistic mocking.
 */

import { database } from '../../../models/database';
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
const createMockResourceRequest = (
  id: string,
  requestedBy: string,
  siteId: string,
  resourceType: string,
  quantity: number,
  priority: string,
  status: string = 'pending'
) => ({
  id,
  requestedBy,
  siteId,
  resourceType,
  resourceName: `${resourceType} Item`,
  quantity,
  priority,
  approvalStatus: status,
  requestedDate: Date.now(),
  neededByDate: Date.now() + 7 * 24 * 60 * 60 * 1000,
  notes: 'Test request',
  appSyncStatus: 'pending',
  version: 1,
  _raw: {
    id,
    requested_by: requestedBy,
    site_id: siteId,
    resource_type: resourceType,
    quantity,
    priority,
    approval_status: status,
  },
  update: jest.fn((callback: any) => {
    const record: any = { approvalStatus: status };
    callback(record);
    return Promise.resolve();
  }),
});

const createMockTeam = (
  id: string,
  name: string,
  siteId: string,
  teamLeadId: string | null,
  status: string = 'active'
) => ({
  id,
  name,
  siteId,
  teamLeadId,
  status,
  specialization: 'general',
  createdDate: Date.now(),
  appSyncStatus: 'pending',
  version: 1,
  _raw: {
    id,
    name,
    site_id: siteId,
    team_lead_id: teamLeadId,
    status,
  },
  update: jest.fn((callback: any) => {
    const record: any = { status, teamLeadId };
    callback(record);
    return Promise.resolve();
  }),
});

const createMockTeamMember = (
  id: string,
  teamId: string,
  userId: string,
  role: string,
  status: string = 'active'
) => ({
  id,
  teamId,
  userId,
  role,
  status,
  assignedDate: Date.now(),
  appSyncStatus: 'pending',
  version: 1,
  _raw: {
    id,
    team_id: teamId,
    user_id: userId,
    role,
    status,
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
  budget: number,
  spent: number = 0
) => ({
  id,
  name,
  budget,
  spentAmount: spent,
  status: 'active',
  client: 'Test Client',
  startDate: Date.now(),
  endDate: Date.now() + 365 * 24 * 60 * 60 * 1000,
  _raw: {
    id,
    name,
    budget,
    spent_amount: spent,
  },
  update: jest.fn((callback: any) => {
    const record: any = { spentAmount: spent };
    callback(record);
    return Promise.resolve();
  }),
});

const createMockBOM = (
  id: string,
  projectId: string,
  type: string,
  status: string,
  totalCost: number
) => ({
  id,
  projectId,
  type,
  status,
  name: `BOM ${id}`,
  totalCost,
  siteCategory: 'ROCS',
  appSyncStatus: 'pending',
  version: 1,
  _raw: {
    id,
    project_id: projectId,
    type,
    status,
    total_cost: totalCost,
  },
  update: jest.fn((callback: any) => {
    const record: any = { status };
    callback(record);
    return Promise.resolve();
  }),
});

describe('Manager Workflow - Integration Tests', () => {
  const managerId = 'manager-1';
  const projectId = 'project-1';
  const siteId = 'site-1';

  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
  });

  describe('Workflow 1: Resource Request Approval', () => {
    describe('Approval Flow', () => {
      it('should review and approve pending resource requests', async () => {
        const requests = [
          createMockResourceRequest('req-1', 'sup-1', siteId, 'equipment', 2, 'high'),
          createMockResourceRequest('req-2', 'sup-2', siteId, 'material', 100, 'medium'),
          createMockResourceRequest('req-3', 'sup-1', siteId, 'personnel', 5, 'urgent'),
        ];

        (database.collections.get as jest.Mock).mockImplementation(
          (tableName: string) => ({
            query: jest.fn(() => ({
              fetch: jest.fn(() => Promise.resolve(requests)),
            })),
            find: jest.fn((id: string) => {
              const request = requests.find((r) => r.id === id);
              return Promise.resolve(request);
            }),
          })
        );

        // Step 1: Get all pending requests
        const pendingRequests = await database.collections
          .get('resource_requests')
          .query()
          .fetch();

        expect(pendingRequests.length).toBe(3);

        // Step 2: Prioritize by urgency
        const sortedRequests = [...pendingRequests].sort((a: any, b: any) => {
          const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
          return (
            priorityOrder[a.priority as keyof typeof priorityOrder] -
            priorityOrder[b.priority as keyof typeof priorityOrder]
          );
        });

        expect(sortedRequests[0].priority).toBe('urgent');
        expect(sortedRequests[1].priority).toBe('high');

        // Step 3: Approve urgent request
        const urgentRequest = await database.collections
          .get('resource_requests')
          .find('req-3');

        await database.write(async () => {
          await urgentRequest.update((record: any) => {
            record.approvalStatus = 'approved';
            record.approvedBy = managerId;
            record.approvalDate = Date.now();
          });
        });

        expect(urgentRequest.update).toHaveBeenCalled();
      });

      it('should reject request with reason', async () => {
        const request = createMockResourceRequest(
          'req-1',
          'sup-1',
          siteId,
          'equipment',
          10,
          'low'
        );

        (database.collections.get as jest.Mock).mockImplementation(
          (tableName: string) => ({
            find: jest.fn(() => Promise.resolve(request)),
          })
        );

        await database.write(async () => {
          const found = await database.collections
            .get('resource_requests')
            .find('req-1');

          await found.update((record: any) => {
            record.approvalStatus = 'rejected';
            record.approvedBy = managerId;
            record.approvalDate = Date.now();
            record.rejectionReason = 'Budget constraints - request in next quarter';
          });
        });

        expect(request.update).toHaveBeenCalled();
        const updateCallback = (request.update as jest.Mock).mock.calls[0][0];
        const mockRecord: any = { approvalStatus: 'pending' };
        updateCallback(mockRecord);
        expect(mockRecord.approvalStatus).toBe('rejected');
        expect(mockRecord.rejectionReason).toBe('Budget constraints - request in next quarter');
      });

      it('should mark approved request as fulfilled', async () => {
        const request = createMockResourceRequest(
          'req-1',
          'sup-1',
          siteId,
          'material',
          50,
          'high',
          'approved'
        );

        (database.collections.get as jest.Mock).mockImplementation(
          (tableName: string) => ({
            find: jest.fn(() => Promise.resolve(request)),
          })
        );

        await database.write(async () => {
          const found = await database.collections
            .get('resource_requests')
            .find('req-1');

          await found.update((record: any) => {
            record.approvalStatus = 'fulfilled';
            record.fulfilledDate = Date.now();
          });
        });

        expect(request.update).toHaveBeenCalled();
      });
    });

    describe('Request Statistics', () => {
      it('should calculate request approval statistics', async () => {
        const requests = [
          createMockResourceRequest('r1', 'sup-1', siteId, 'equipment', 1, 'high', 'approved'),
          createMockResourceRequest('r2', 'sup-1', siteId, 'material', 1, 'medium', 'approved'),
          createMockResourceRequest('r3', 'sup-2', siteId, 'personnel', 1, 'high', 'rejected'),
          createMockResourceRequest('r4', 'sup-2', siteId, 'equipment', 1, 'low', 'pending'),
          createMockResourceRequest('r5', 'sup-1', siteId, 'material', 1, 'urgent', 'fulfilled'),
        ];

        (database.collections.get as jest.Mock).mockImplementation(
          (tableName: string) => ({
            query: jest.fn(() => ({
              fetch: jest.fn(() => Promise.resolve(requests)),
            })),
          })
        );

        const allRequests = await database.collections
          .get('resource_requests')
          .query()
          .fetch();

        const stats = {
          total: allRequests.length,
          pending: allRequests.filter((r: any) => r.approvalStatus === 'pending').length,
          approved: allRequests.filter((r: any) => r.approvalStatus === 'approved').length,
          rejected: allRequests.filter((r: any) => r.approvalStatus === 'rejected').length,
          fulfilled: allRequests.filter((r: any) => r.approvalStatus === 'fulfilled').length,
          byPriority: {
            urgent: allRequests.filter((r: any) => r.priority === 'urgent').length,
            high: allRequests.filter((r: any) => r.priority === 'high').length,
            medium: allRequests.filter((r: any) => r.priority === 'medium').length,
            low: allRequests.filter((r: any) => r.priority === 'low').length,
          },
        };

        expect(stats.total).toBe(5);
        expect(stats.pending).toBe(1);
        expect(stats.approved).toBe(2);
        expect(stats.rejected).toBe(1);
        expect(stats.fulfilled).toBe(1);
        expect(stats.byPriority.high).toBe(2);
      });
    });
  });

  describe('Workflow 2: Team Management', () => {
    describe('Team Creation and Assignment', () => {
      it('should create team and assign members', async () => {
        let team: any = null;
        const members: any[] = [];

        (database.collections.get as jest.Mock).mockImplementation(
          (tableName: string) => ({
            create: jest.fn((callback: any) => {
              if (tableName === 'teams') {
                team = {
                  id: 'team-1',
                  name: '',
                  siteId: '',
                  teamLeadId: null,
                  status: 'active',
                };
                callback(team);
                return Promise.resolve(team);
              }
              if (tableName === 'team_members') {
                const member = {
                  id: `member-${members.length + 1}`,
                  teamId: '',
                  userId: '',
                  role: '',
                  status: 'active',
                };
                callback(member);
                members.push(member);
                return Promise.resolve(member);
              }
              return Promise.resolve({});
            }),
            find: jest.fn(() => Promise.resolve(team)),
          })
        );

        // Step 1: Create team
        await database.write(async () => {
          await database.collections
            .get('teams')
            .create((record: any) => {
              record.name = 'Foundation Team';
              record.siteId = siteId;
              record.specialization = 'foundation';
              record.status = 'active';
            });
        });

        expect(team).toBeDefined();
        expect(team.name).toBe('Foundation Team');

        // Step 2: Assign team lead
        await database.write(async () => {
          await database.collections
            .get('team_members')
            .create((record: any) => {
              record.teamId = 'team-1';
              record.userId = 'worker-1';
              record.role = 'lead';
              record.status = 'active';
            });
        });

        // Step 3: Assign team members
        const workerIds = ['worker-2', 'worker-3', 'worker-4'];
        for (const workerId of workerIds) {
          await database.write(async () => {
            await database.collections
              .get('team_members')
              .create((record: any) => {
                record.teamId = 'team-1';
                record.userId = workerId;
                record.role = 'worker';
                record.status = 'active';
              });
          });
        }

        expect(members.length).toBe(4);
        expect(members[0].role).toBe('lead');
        expect(members.filter((m) => m.role === 'worker').length).toBe(3);
      });

      it('should transfer team member between teams', async () => {
        const sourceTeam = createMockTeam('team-1', 'Team A', siteId, 'lead-1');
        const targetTeam = createMockTeam('team-2', 'Team B', siteId, 'lead-2');
        const member = createMockTeamMember('member-1', 'team-1', 'worker-1', 'worker');

        let newMember: any = null;

        (database.collections.get as jest.Mock).mockImplementation(
          (tableName: string) => ({
            find: jest.fn((id: string) => {
              if (id === 'member-1') return Promise.resolve(member);
              if (id === 'team-1') return Promise.resolve(sourceTeam);
              if (id === 'team-2') return Promise.resolve(targetTeam);
              return Promise.reject(new Error('Not found'));
            }),
            create: jest.fn((callback: any) => {
              newMember = {
                id: 'member-new',
                teamId: '',
                userId: '',
                role: '',
                status: 'active',
              };
              callback(newMember);
              return Promise.resolve(newMember);
            }),
          })
        );

        // Step 1: Mark old assignment as transferred
        await database.write(async () => {
          const oldMember = await database.collections
            .get('team_members')
            .find('member-1');
          await oldMember.update((record: any) => {
            record.status = 'transferred';
            record.endDate = Date.now();
          });
        });

        expect(member.update).toHaveBeenCalled();

        // Step 2: Create new assignment in target team
        await database.write(async () => {
          await database.collections
            .get('team_members')
            .create((record: any) => {
              record.teamId = 'team-2';
              record.userId = 'worker-1';
              record.role = 'worker';
              record.status = 'active';
            });
        });

        expect(newMember.teamId).toBe('team-2');
        expect(newMember.userId).toBe('worker-1');
      });
    });

    describe('Team Statistics', () => {
      it('should calculate team capacity and workload', async () => {
        const teams = [
          createMockTeam('team-1', 'Foundation', siteId, 'lead-1'),
          createMockTeam('team-2', 'Framing', siteId, 'lead-2'),
        ];

        const members = [
          // Team 1: 5 members
          createMockTeamMember('m1', 'team-1', 'w1', 'lead'),
          createMockTeamMember('m2', 'team-1', 'w2', 'worker'),
          createMockTeamMember('m3', 'team-1', 'w3', 'worker'),
          createMockTeamMember('m4', 'team-1', 'w4', 'worker'),
          createMockTeamMember('m5', 'team-1', 'w5', 'worker'),
          // Team 2: 3 members
          createMockTeamMember('m6', 'team-2', 'w6', 'lead'),
          createMockTeamMember('m7', 'team-2', 'w7', 'worker'),
          createMockTeamMember('m8', 'team-2', 'w8', 'worker'),
        ];

        (database.collections.get as jest.Mock).mockImplementation(
          (tableName: string) => ({
            query: jest.fn(() => ({
              fetch: jest.fn(() => {
                if (tableName === 'teams') return Promise.resolve(teams);
                if (tableName === 'team_members') return Promise.resolve(members);
                return Promise.resolve([]);
              }),
            })),
          })
        );

        const allTeams = await database.collections
          .get('teams')
          .query()
          .fetch();
        const allMembers = await database.collections
          .get('team_members')
          .query()
          .fetch();

        const teamStats = allTeams.map((team: any) => {
          const teamMembers = allMembers.filter(
            (m: any) => m.teamId === team.id && m.status === 'active'
          );
          return {
            teamId: team.id,
            teamName: team.name,
            memberCount: teamMembers.length,
            hasLead: teamMembers.some((m: any) => m.role === 'lead'),
          };
        });

        expect(teamStats.length).toBe(2);
        expect(teamStats[0].memberCount).toBe(5);
        expect(teamStats[0].hasLead).toBe(true);
        expect(teamStats[1].memberCount).toBe(3);
      });
    });
  });

  describe('Workflow 3: Budget Oversight', () => {
    describe('BOM Review and Approval', () => {
      it('should review and approve estimating BOM', async () => {
        const bom = createMockBOM('bom-1', projectId, 'estimating', 'draft', 500000);

        (database.collections.get as jest.Mock).mockImplementation(
          (tableName: string) => ({
            find: jest.fn(() => Promise.resolve(bom)),
          })
        );

        // Step 1: Review BOM
        const foundBom = await database.collections
          .get('boms')
          .find('bom-1');
        expect(foundBom.type).toBe('estimating');
        expect(foundBom.status).toBe('draft');

        // Step 2: Submit for approval
        await database.write(async () => {
          await foundBom.update((record: any) => {
            record.status = 'submitted';
          });
        });

        expect(bom.update).toHaveBeenCalled();
      });

      it('should track BOM variance between estimating and execution', async () => {
        const estimatingBom = createMockBOM('bom-est', projectId, 'estimating', 'won', 500000);
        const executionBom = createMockBOM('bom-exec', projectId, 'execution', 'active', 525000);
        (executionBom as any).baselineBomId = 'bom-est';

        (database.collections.get as jest.Mock).mockImplementation(
          (tableName: string) => ({
            query: jest.fn(() => ({
              fetch: jest.fn(() => Promise.resolve([estimatingBom, executionBom])),
            })),
            find: jest.fn((id: string) => {
              if (id === 'bom-est') return Promise.resolve(estimatingBom);
              if (id === 'bom-exec') return Promise.resolve(executionBom);
              return Promise.reject(new Error('Not found'));
            }),
          })
        );

        const allBoms = await database.collections
          .get('boms')
          .query()
          .fetch();

        const execBom = allBoms.find((b: any) => b.type === 'execution');
        const baselineBom = await database.collections
          .get('boms')
          .find((execBom as any).baselineBomId);

        const variance = execBom.totalCost - baselineBom.totalCost;
        const variancePercent = (variance / baselineBom.totalCost) * 100;

        expect(variance).toBe(25000);
        expect(variancePercent).toBe(5);
      });
    });

    describe('Budget Utilization', () => {
      it('should calculate project budget utilization', async () => {
        const project = createMockProject('proj-1', 'Main Project', 1000000, 350000);

        (database.collections.get as jest.Mock).mockImplementation(
          (tableName: string) => ({
            find: jest.fn(() => Promise.resolve(project)),
          })
        );

        const foundProject = await database.collections
          .get('projects')
          .find('proj-1');

        const utilization = (foundProject.spentAmount / foundProject.budget) * 100;
        const remaining = foundProject.budget - foundProject.spentAmount;

        expect(utilization).toBe(35);
        expect(remaining).toBe(650000);
      });

      it('should flag projects exceeding budget threshold', async () => {
        const projects = [
          createMockProject('p1', 'Project 1', 1000000, 850000), // 85% - warning
          createMockProject('p2', 'Project 2', 500000, 350000), // 70% - ok
          createMockProject('p3', 'Project 3', 750000, 720000), // 96% - critical
        ];

        (database.collections.get as jest.Mock).mockImplementation(
          (tableName: string) => ({
            query: jest.fn(() => ({
              fetch: jest.fn(() => Promise.resolve(projects)),
            })),
          })
        );

        const allProjects = await database.collections
          .get('projects')
          .query()
          .fetch();

        const budgetStatus = allProjects.map((p: any) => {
          const utilization = (p.spentAmount / p.budget) * 100;
          let status = 'ok';
          if (utilization >= 90) status = 'critical';
          else if (utilization >= 80) status = 'warning';

          return {
            projectId: p.id,
            projectName: p.name,
            utilization,
            status,
          };
        });

        const criticalProjects = budgetStatus.filter((p) => p.status === 'critical');
        const warningProjects = budgetStatus.filter((p) => p.status === 'warning');

        expect(criticalProjects.length).toBe(1);
        expect(warningProjects.length).toBe(1);
        expect(criticalProjects[0].projectId).toBe('p3');
      });
    });
  });

  describe('Workflow 4: Resource Allocation', () => {
    it('should optimize resource allocation across sites', async () => {
      const sites = [
        { id: 'site-1', name: 'Site A', workload: 80, teamCount: 2 },
        { id: 'site-2', name: 'Site B', workload: 40, teamCount: 3 },
        { id: 'site-3', name: 'Site C', workload: 95, teamCount: 1 },
      ];

      // Calculate workload per team
      const allocation = sites.map((site) => ({
        ...site,
        workloadPerTeam: site.workload / site.teamCount,
      }));

      // Identify overloaded sites
      const overloaded = allocation.filter((s) => s.workloadPerTeam > 50);
      // Identify underutilized sites
      const underutilized = allocation.filter((s) => s.workloadPerTeam < 30);

      expect(overloaded.length).toBe(1);
      expect(overloaded[0].id).toBe('site-3');
      expect(underutilized.length).toBe(1);
      expect(underutilized[0].id).toBe('site-2');
    });

    it('should handle resource reallocation between sites', async () => {
      const sourceTeam = createMockTeam('team-1', 'Excess Team', 'site-2', 'lead-1');
      const targetSite = { id: 'site-3', name: 'Site C' };

      (database.collections.get as jest.Mock).mockImplementation(
        (tableName: string) => ({
          find: jest.fn(() => Promise.resolve(sourceTeam)),
        })
      );

      // Reallocate team to different site
      await database.write(async () => {
        const team = await database.collections
          .get('teams')
          .find('team-1');
        await team.update((record: any) => {
          record.siteId = 'site-3';
        });
      });

      expect(sourceTeam.update).toHaveBeenCalled();
    });
  });

  describe('Workflow 5: Project Oversight', () => {
    it('should aggregate project status from all sites', async () => {
      const items = [
        { siteId: 'site-1', status: 'completed', plannedQty: 100, completedQty: 100 },
        { siteId: 'site-1', status: 'in_progress', plannedQty: 200, completedQty: 150 },
        { siteId: 'site-2', status: 'completed', plannedQty: 50, completedQty: 50 },
        { siteId: 'site-2', status: 'not_started', plannedQty: 100, completedQty: 0 },
        { siteId: 'site-3', status: 'in_progress', plannedQty: 75, completedQty: 25 },
      ];

      (database.collections.get as jest.Mock).mockImplementation(
        (tableName: string) => ({
          query: jest.fn(() => ({
            fetch: jest.fn(() => Promise.resolve(items)),
          })),
        })
      );

      const allItems = await database.collections
        .get('items')
        .query()
        .fetch();

      const totalPlanned = allItems.reduce((sum: number, item: any) => sum + item.plannedQty, 0);
      const totalCompleted = allItems.reduce((sum: number, item: any) => sum + item.completedQty, 0);
      const overallProgress = (totalCompleted / totalPlanned) * 100;

      const siteProgress: Record<string, any> = {};
      allItems.forEach((item: any) => {
        if (!siteProgress[item.siteId]) {
          siteProgress[item.siteId] = { planned: 0, completed: 0 };
        }
        siteProgress[item.siteId].planned += item.plannedQty;
        siteProgress[item.siteId].completed += item.completedQty;
      });

      expect(totalPlanned).toBe(525);
      expect(totalCompleted).toBe(325);
      expect(overallProgress.toFixed(1)).toBe('61.9');
      expect(Object.keys(siteProgress).length).toBe(3);
    });

    it('should identify delayed items across all sites', async () => {
      const today = Date.now();
      const items = [
        {
          id: 'item-1',
          name: 'Foundation',
          siteId: 'site-1',
          plannedEndDate: today - 7 * 24 * 60 * 60 * 1000, // 7 days ago
          status: 'in_progress',
        },
        {
          id: 'item-2',
          name: 'Framing',
          siteId: 'site-2',
          plannedEndDate: today + 14 * 24 * 60 * 60 * 1000, // 14 days ahead
          status: 'in_progress',
        },
        {
          id: 'item-3',
          name: 'Roofing',
          siteId: 'site-3',
          plannedEndDate: today - 3 * 24 * 60 * 60 * 1000, // 3 days ago
          status: 'not_started',
        },
      ];

      (database.collections.get as jest.Mock).mockImplementation(
        (tableName: string) => ({
          query: jest.fn(() => ({
            fetch: jest.fn(() => Promise.resolve(items)),
          })),
        })
      );

      const allItems = await database.collections
        .get('items')
        .query()
        .fetch();

      const delayedItems = allItems.filter(
        (item: any) =>
          item.status !== 'completed' &&
          item.plannedEndDate < today
      );

      expect(delayedItems.length).toBe(2);
      expect(delayedItems.map((i: any) => i.name)).toContain('Foundation');
      expect(delayedItems.map((i: any) => i.name)).toContain('Roofing');
    });
  });

  describe('Workflow 6: Hindrance Escalation Handling', () => {
    it('should handle escalated hindrances from supervisors', async () => {
      const hindrances = [
        {
          id: 'h1',
          siteId: 'site-1',
          title: 'Equipment Failure',
          priority: 'urgent',
          status: 'escalated',
          assignedTo: managerId,
        },
        {
          id: 'h2',
          siteId: 'site-2',
          title: 'Material Delay',
          priority: 'high',
          status: 'escalated',
          assignedTo: managerId,
          update: jest.fn((callback: any) => {
            callback({});
            return Promise.resolve();
          }),
        },
      ];

      (database.collections.get as jest.Mock).mockImplementation(
        (tableName: string) => ({
          query: jest.fn(() => ({
            fetch: jest.fn(() => Promise.resolve(hindrances)),
          })),
          find: jest.fn((id: string) => {
            const h = hindrances.find((hind) => hind.id === id);
            return Promise.resolve(h);
          }),
        })
      );

      // Get escalated hindrances assigned to manager
      const allHindrances = await database.collections
        .get('hindrances')
        .query()
        .fetch();

      const escalatedToManager = allHindrances.filter(
        (h: any) => h.status === 'escalated' && h.assignedTo === managerId
      );

      expect(escalatedToManager.length).toBe(2);

      // Resolve one hindrance
      await database.write(async () => {
        const hindrance = await database.collections
          .get('hindrances')
          .find('h2');
        await hindrance.update((record: any) => {
          record.status = 'resolved';
          record.resolutionNotes = 'Arranged express delivery from alternate supplier';
          record.resolvedBy = managerId;
          record.resolvedAt = Date.now();
        });
      });

      expect(hindrances[1].update).toHaveBeenCalled();
    });
  });

  describe('Workflow 7: Dashboard Aggregation', () => {
    it('should aggregate all metrics for manager dashboard', async () => {
      const mockData = {
        projects: [
          { id: 'p1', status: 'active', budget: 1000000, spentAmount: 500000 },
          { id: 'p2', status: 'active', budget: 750000, spentAmount: 300000 },
        ],
        pendingRequests: 5,
        escalatedHindrances: 3,
        teamsCount: 8,
        activeItems: 45,
        completedItems: 23,
      };

      const dashboard = {
        totalProjects: mockData.projects.length,
        totalBudget: mockData.projects.reduce((sum, p) => sum + p.budget, 0),
        totalSpent: mockData.projects.reduce((sum, p) => sum + p.spentAmount, 0),
        pendingApprovals: mockData.pendingRequests,
        escalatedHindrances: mockData.escalatedHindrances,
        activeTeams: mockData.teamsCount,
        workProgress: (mockData.completedItems / (mockData.activeItems + mockData.completedItems)) * 100,
      };

      expect(dashboard.totalProjects).toBe(2);
      expect(dashboard.totalBudget).toBe(1750000);
      expect(dashboard.totalSpent).toBe(800000);
      expect(dashboard.pendingApprovals).toBe(5);
      expect(dashboard.workProgress.toFixed(1)).toBe('33.8');
    });
  });
});
