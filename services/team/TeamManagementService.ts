import { database } from '../../models/database';
import TeamModel from '../../models/TeamModel';
import TeamMemberModel from '../../models/TeamMemberModel';
import { Q } from '@nozbe/watermelondb';

/**
 * Data structure for creating/updating teams
 */
export interface TeamData {
  name: string;
  siteId: string;
  teamLeadId?: string;
  status: string;
  specialization?: string;
}

/**
 * Data structure for assigning team members
 */
export interface MemberAssignmentData {
  teamId: string;
  userId: string;
  role: string;
}

/**
 * TeamManagementService
 *
 * Service for managing construction teams and team members.
 * Provides CRUD operations for teams and member assignment workflows.
 *
 * Features:
 * - Create, update, and delete teams
 * - Assign and remove team members
 * - Transfer members between teams
 * - Query teams by site, status, or specialization
 * - Track team composition and leadership
 */
class TeamManagementService {
  /**
   * Create a new team
   *
   * @param data - Team data (name, siteId, status, etc.)
   * @returns Promise resolving to created TeamModel
   * @throws Error if team creation fails
   */
  async createTeam(data: TeamData): Promise<TeamModel> {
    try {
      const team = await database.write(async () => {
        return await database.collections
          .get<TeamModel>('teams')
          .create((record) => {
            record.name = data.name;
            record.siteId = data.siteId;
            record.teamLeadId = data.teamLeadId;
            record.createdDate = Date.now();
            record.status = data.status;
            record.specialization = data.specialization;
            record.appSyncStatus = 'pending';
            record.version = 1;
          });
      });
      return team;
    } catch (error) {
      console.error('Error creating team:', error);
      throw new Error('Failed to create team');
    }
  }

  /**
   * Update an existing team
   *
   * @param teamId - ID of the team to update
   * @param data - Partial team data to update
   * @returns Promise resolving to updated TeamModel
   * @throws Error if team not found or update fails
   */
  async updateTeam(teamId: string, data: Partial<TeamData>): Promise<TeamModel> {
    try {
      const team = await database.collections
        .get<TeamModel>('teams')
        .find(teamId);

      const updatedTeam = await database.write(async () => {
        return await team.update((record) => {
          if (data.name !== undefined) record.name = data.name;
          if (data.siteId !== undefined) record.siteId = data.siteId;
          if (data.teamLeadId !== undefined) record.teamLeadId = data.teamLeadId;
          if (data.status !== undefined) record.status = data.status;
          if (data.specialization !== undefined) record.specialization = data.specialization;
          record.appSyncStatus = 'pending';
          record.version = record.version + 1;
        });
      });

      return updatedTeam;
    } catch (error) {
      console.error('Error updating team:', error);
      throw new Error('Failed to update team');
    }
  }

  /**
   * Delete a team (marks as disbanded)
   *
   * @param teamId - ID of the team to delete
   * @throws Error if team not found or deletion fails
   */
  async deleteTeam(teamId: string): Promise<void> {
    try {
      const team = await database.collections
        .get<TeamModel>('teams')
        .find(teamId);

      await database.write(async () => {
        await team.update((record) => {
          record.status = 'disbanded';
          record.appSyncStatus = 'pending';
          record.version = record.version + 1;
        });
      });
    } catch (error) {
      console.error('Error deleting team:', error);
      throw new Error('Failed to delete team');
    }
  }

  /**
   * Get all teams for a specific site
   *
   * @param siteId - ID of the site
   * @returns Promise resolving to array of TeamModel
   */
  async getTeamsBySite(siteId: string): Promise<TeamModel[]> {
    try {
      const teams = await database.collections
        .get<TeamModel>('teams')
        .query(Q.where('site_id', siteId))
        .fetch();
      return teams;
    } catch (error) {
      console.error('Error fetching teams by site:', error);
      throw new Error('Failed to fetch teams by site');
    }
  }

  /**
   * Get all active teams
   *
   * @returns Promise resolving to array of active TeamModel
   */
  async getActiveTeams(): Promise<TeamModel[]> {
    try {
      const teams = await database.collections
        .get<TeamModel>('teams')
        .query(Q.where('status', 'active'))
        .fetch();
      return teams;
    } catch (error) {
      console.error('Error fetching active teams:', error);
      throw new Error('Failed to fetch active teams');
    }
  }

  /**
   * Get teams by specialization
   *
   * @param specialization - Team specialization (electrical, plumbing, etc.)
   * @returns Promise resolving to array of TeamModel
   */
  async getTeamsBySpecialization(specialization: string): Promise<TeamModel[]> {
    try {
      const teams = await database.collections
        .get<TeamModel>('teams')
        .query(Q.where('specialization', specialization))
        .fetch();
      return teams;
    } catch (error) {
      console.error('Error fetching teams by specialization:', error);
      throw new Error('Failed to fetch teams by specialization');
    }
  }

  /**
   * Assign a member to a team
   *
   * @param teamId - ID of the team
   * @param userId - ID of the user to assign
   * @param role - Role of the member (lead, supervisor, worker)
   * @returns Promise resolving to created TeamMemberModel
   * @throws Error if assignment fails
   */
  async assignMember(teamId: string, userId: string, role: string): Promise<TeamMemberModel> {
    try {
      const member = await database.write(async () => {
        return await database.collections
          .get<TeamMemberModel>('team_members')
          .create((record) => {
            record.teamId = teamId;
            record.userId = userId;
            record.role = role;
            record.assignedDate = Date.now();
            record.status = 'active';
            record.appSyncStatus = 'pending';
            record.version = 1;
          });
      });
      return member;
    } catch (error) {
      console.error('Error assigning member:', error);
      throw new Error('Failed to assign member');
    }
  }

  /**
   * Remove a member from a team (marks as inactive and sets end date)
   *
   * @param memberId - ID of the team member to remove
   * @throws Error if member not found or removal fails
   */
  async removeMember(memberId: string): Promise<void> {
    try {
      const member = await database.collections
        .get<TeamMemberModel>('team_members')
        .find(memberId);

      await database.write(async () => {
        await member.update((record) => {
          record.status = 'inactive';
          record.endDate = Date.now();
          record.appSyncStatus = 'pending';
          record.version = record.version + 1;
        });
      });
    } catch (error) {
      console.error('Error removing member:', error);
      throw new Error('Failed to remove member');
    }
  }

  /**
   * Transfer a member to a different team
   *
   * @param memberId - ID of the team member to transfer
   * @param newTeamId - ID of the new team
   * @returns Promise resolving to updated TeamMemberModel
   * @throws Error if member not found or transfer fails
   */
  async transferMember(memberId: string, newTeamId: string): Promise<TeamMemberModel> {
    try {
      const member = await database.collections
        .get<TeamMemberModel>('team_members')
        .find(memberId);

      const updatedMember = await database.write(async () => {
        return await member.update((record) => {
          record.teamId = newTeamId;
          record.status = 'transferred';
          record.endDate = Date.now();
          record.appSyncStatus = 'pending';
          record.version = record.version + 1;
        });
      });

      // Create new active assignment in the new team
      const newMember = await this.assignMember(newTeamId, member.userId, member.role);

      return newMember;
    } catch (error) {
      console.error('Error transferring member:', error);
      throw new Error('Failed to transfer member');
    }
  }

  /**
   * Get all members of a team
   *
   * @param teamId - ID of the team
   * @returns Promise resolving to array of TeamMemberModel
   */
  async getTeamMembers(teamId: string): Promise<TeamMemberModel[]> {
    try {
      const members = await database.collections
        .get<TeamMemberModel>('team_members')
        .query(
          Q.where('team_id', teamId),
          Q.where('status', 'active')
        )
        .fetch();
      return members;
    } catch (error) {
      console.error('Error fetching team members:', error);
      throw new Error('Failed to fetch team members');
    }
  }

  /**
   * Get active members count for a team
   *
   * @param teamId - ID of the team
   * @returns Promise resolving to count of active members
   */
  async getTeamMemberCount(teamId: string): Promise<number> {
    try {
      const members = await this.getTeamMembers(teamId);
      return members.length;
    } catch (error) {
      console.error('Error fetching team member count:', error);
      throw new Error('Failed to fetch team member count');
    }
  }

  /**
   * Get all teams a user is assigned to
   *
   * @param userId - ID of the user
   * @returns Promise resolving to array of TeamMemberModel
   */
  async getUserTeamAssignments(userId: string): Promise<TeamMemberModel[]> {
    try {
      const assignments = await database.collections
        .get<TeamMemberModel>('team_members')
        .query(
          Q.where('user_id', userId),
          Q.where('status', 'active')
        )
        .fetch();
      return assignments;
    } catch (error) {
      console.error('Error fetching user team assignments:', error);
      throw new Error('Failed to fetch user team assignments');
    }
  }
}

export default new TeamManagementService();
