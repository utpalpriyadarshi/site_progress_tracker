import { database } from '../../../../models/database';
import { logger } from '../../../services/LoggingService';
import { DEFAULT_MILESTONES } from './projectConstants';

/**
 * Create default milestones for a new project
 */
export const createDefaultMilestones = async (
  projectId: string,
  createdBy: string
): Promise<void> => {
  const now = Date.now();

  for (const milestone of DEFAULT_MILESTONES) {
    await database.collections.get('milestones').create((record: any) => {
      record.projectId = projectId;
      record.milestoneCode = milestone.code;
      record.milestoneName = milestone.name;
      record.description = `Default milestone: ${milestone.name}`;
      record.sequenceOrder = milestone.order;
      record.weightage = milestone.weightage;
      record.isActive = true;
      record.isCustom = false; // Default milestones
      record.createdBy = createdBy;
      // createdAt is @readonly and set automatically by WatermelonDB
      record.updatedAt = now;
      record.appSyncStatus = 'pending';
      record.version = 1;
    });
  }

  logger.info(`Created ${DEFAULT_MILESTONES.length} default milestones for project ${projectId}`);
};
