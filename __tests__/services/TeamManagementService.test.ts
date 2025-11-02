/**
 * TeamManagementService Tests
 *
 * Tests for team CRUD operations and member assignment workflows
 * Added for Activity 3: Manager Role - Week 1, Day 2
 */

import { database } from '../../models/database';
import TeamManagementService from '../../services/team/TeamManagementService';
import TeamModel from '../../models/TeamModel';
import TeamMemberModel from '../../models/TeamMemberModel';

describe('TeamManagementService', () => {
  // Database is already initialized by jest.setup.js

  describe('Team CRUD Operations', () => {
    let createdTeamId: string;

    afterEach(async () => {
      // Clean up created team
      if (createdTeamId) {
        try {
          const team = await database.collections
            .get<TeamModel>('teams')
            .find(createdTeamId);
          await database.write(async () => {
            await team.destroyPermanently();
          });
        } catch (error) {
          // Team may not exist, ignore
        }
        createdTeamId = '';
      }
    });

    it('should create a new team', async () => {
      const teamData = {
        name: 'Test Construction Team',
        siteId: 'site-123',
        teamLeadId: 'user-456',
        status: 'active',
        specialization: 'electrical',
      };

      const team = await TeamManagementService.createTeam(teamData);
      createdTeamId = team.id;

      expect(team.name).toBe(teamData.name);
      expect(team.siteId).toBe(teamData.siteId);
      expect(team.teamLeadId).toBe(teamData.teamLeadId);
      expect(team.status).toBe(teamData.status);
      expect(team.specialization).toBe(teamData.specialization);
      expect(team.appSyncStatus).toBe('pending');
      expect(team.version).toBe(1);
    });

    it('should update an existing team', async () => {
      // Create team first
      const team = await TeamManagementService.createTeam({
        name: 'Original Team',
        siteId: 'site-123',
        status: 'active',
      });
      createdTeamId = team.id;

      // Update team
      const updatedTeam = await TeamManagementService.updateTeam(team.id, {
        name: 'Updated Team Name',
        specialization: 'plumbing',
      });

      expect(updatedTeam.name).toBe('Updated Team Name');
      expect(updatedTeam.specialization).toBe('plumbing');
      expect(updatedTeam.version).toBe(2);
      expect(updatedTeam.appSyncStatus).toBe('pending');
    });

    it('should delete a team (mark as disbanded)', async () => {
      // Create team first
      const team = await TeamManagementService.createTeam({
        name: 'Team to Delete',
        siteId: 'site-123',
        status: 'active',
      });
      createdTeamId = team.id;

      // Delete team
      await TeamManagementService.deleteTeam(team.id);

      // Verify team is disbanded
      const deletedTeam = await database.collections
        .get<TeamModel>('teams')
        .find(team.id);
      expect(deletedTeam.status).toBe('disbanded');
      expect(deletedTeam.version).toBe(2);
    });
  });

  describe('Team Queries', () => {
    let testTeams: TeamModel[] = [];

    beforeEach(async () => {
      // Create multiple test teams
      await database.write(async () => {
        const team1 = await database.collections
          .get<TeamModel>('teams')
          .create((record) => {
            record.name = 'Electrical Team';
            record.siteId = 'site-A';
            record.status = 'active';
            record.specialization = 'electrical';
            record.createdDate = Date.now();
            record.appSyncStatus = 'pending';
            record.version = 1;
          });

        const team2 = await database.collections
          .get<TeamModel>('teams')
          .create((record) => {
            record.name = 'Plumbing Team';
            record.siteId = 'site-A';
            record.status = 'active';
            record.specialization = 'plumbing';
            record.createdDate = Date.now();
            record.appSyncStatus = 'pending';
            record.version = 1;
          });

        const team3 = await database.collections
          .get<TeamModel>('teams')
          .create((record) => {
            record.name = 'Inactive Team';
            record.siteId = 'site-B';
            record.status = 'inactive';
            record.createdDate = Date.now();
            record.appSyncStatus = 'pending';
            record.version = 1;
          });

        testTeams = [team1, team2, team3];
      });
    });

    afterEach(async () => {
      // Clean up test teams
      await database.write(async () => {
        for (const team of testTeams) {
          await team.destroyPermanently();
        }
      });
      testTeams = [];
    });

    it('should get teams by site', async () => {
      const teams = await TeamManagementService.getTeamsBySite('site-A');
      expect(teams.length).toBe(2);
      expect(teams.every((t) => t.siteId === 'site-A')).toBe(true);
    });

    it('should get active teams', async () => {
      const activeTeams = await TeamManagementService.getActiveTeams();
      const ourActiveTeams = activeTeams.filter((t) =>
        testTeams.map((team) => team.id).includes(t.id)
      );
      expect(ourActiveTeams.length).toBe(2);
      expect(ourActiveTeams.every((t) => t.status === 'active')).toBe(true);
    });

    it('should get teams by specialization', async () => {
      const electricalTeams = await TeamManagementService.getTeamsBySpecialization('electrical');
      const ourElectricalTeams = electricalTeams.filter((t) =>
        testTeams.map((team) => team.id).includes(t.id)
      );
      expect(ourElectricalTeams.length).toBe(1);
      expect(ourElectricalTeams[0].specialization).toBe('electrical');
    });
  });

  describe('Member Assignment', () => {
    let testTeam: TeamModel;
    let testMembers: TeamMemberModel[] = [];

    beforeEach(async () => {
      // Create test team
      await database.write(async () => {
        testTeam = await database.collections
          .get<TeamModel>('teams')
          .create((record) => {
            record.name = 'Test Team';
            record.siteId = 'site-123';
            record.status = 'active';
            record.createdDate = Date.now();
            record.appSyncStatus = 'pending';
            record.version = 1;
          });
      });
    });

    afterEach(async () => {
      // Clean up members and team
      await database.write(async () => {
        for (const member of testMembers) {
          await member.destroyPermanently();
        }
        await testTeam.destroyPermanently();
      });
      testMembers = [];
    });

    it('should assign a member to a team', async () => {
      const member = await TeamManagementService.assignMember(
        testTeam.id,
        'user-123',
        'worker'
      );
      testMembers.push(member);

      expect(member.teamId).toBe(testTeam.id);
      expect(member.userId).toBe('user-123');
      expect(member.role).toBe('worker');
      expect(member.status).toBe('active');
      expect(member.appSyncStatus).toBe('pending');
      expect(member.version).toBe(1);
    });

    it('should remove a member from a team', async () => {
      // Assign member first
      const member = await TeamManagementService.assignMember(
        testTeam.id,
        'user-123',
        'worker'
      );
      testMembers.push(member);

      // Remove member
      await TeamManagementService.removeMember(member.id);

      // Verify member is inactive
      const removedMember = await database.collections
        .get<TeamMemberModel>('team_members')
        .find(member.id);
      expect(removedMember.status).toBe('inactive');
      expect(removedMember.endDate).toBeDefined();
      expect(removedMember.version).toBe(2);
    });

    it('should get team members', async () => {
      // Assign multiple members
      const member1 = await TeamManagementService.assignMember(
        testTeam.id,
        'user-1',
        'lead'
      );
      const member2 = await TeamManagementService.assignMember(
        testTeam.id,
        'user-2',
        'worker'
      );
      testMembers.push(member1, member2);

      const members = await TeamManagementService.getTeamMembers(testTeam.id);
      expect(members.length).toBe(2);
      expect(members.every((m) => m.teamId === testTeam.id)).toBe(true);
    });

    it('should get team member count', async () => {
      // Assign members
      const member1 = await TeamManagementService.assignMember(
        testTeam.id,
        'user-1',
        'lead'
      );
      const member2 = await TeamManagementService.assignMember(
        testTeam.id,
        'user-2',
        'worker'
      );
      testMembers.push(member1, member2);

      const count = await TeamManagementService.getTeamMemberCount(testTeam.id);
      expect(count).toBe(2);
    });

    it('should transfer a member to a different team', async () => {
      // Create second team
      let team2: TeamModel;
      await database.write(async () => {
        team2 = await database.collections
          .get<TeamModel>('teams')
          .create((record) => {
            record.name = 'Team 2';
            record.siteId = 'site-456';
            record.status = 'active';
            record.createdDate = Date.now();
            record.appSyncStatus = 'pending';
            record.version = 1;
          });
      });

      // Assign member to first team
      const member = await TeamManagementService.assignMember(
        testTeam.id,
        'user-123',
        'worker'
      );
      testMembers.push(member);

      // Transfer to second team
      const newMember = await TeamManagementService.transferMember(member.id, team2!.id);
      testMembers.push(newMember);

      // Verify old member is transferred
      const oldMember = await database.collections
        .get<TeamMemberModel>('team_members')
        .find(member.id);
      expect(oldMember.status).toBe('transferred');
      expect(oldMember.endDate).toBeDefined();

      // Verify new member is active in new team
      expect(newMember.teamId).toBe(team2!.id);
      expect(newMember.userId).toBe('user-123');
      expect(newMember.status).toBe('active');

      // Clean up team2
      await database.write(async () => {
        await team2!.destroyPermanently();
      });
    });

    it('should get user team assignments', async () => {
      // Assign user to team
      const member = await TeamManagementService.assignMember(
        testTeam.id,
        'user-123',
        'worker'
      );
      testMembers.push(member);

      const assignments = await TeamManagementService.getUserTeamAssignments('user-123');
      const ourAssignments = assignments.filter((a) => a.id === member.id);
      expect(ourAssignments.length).toBe(1);
      expect(ourAssignments[0].userId).toBe('user-123');
    });
  });
});
