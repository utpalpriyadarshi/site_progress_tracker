/**
 * Hook for managing milestone data and progress
 */

import { useState, useEffect } from 'react';
import { database } from '../../../models/database';
import { Q } from '@nozbe/watermelondb';
import MilestoneProgressModel from '../../../models/MilestoneProgressModel';
import { logger } from '../../../services/LoggingService';

export const useMilestoneData = (selectedProjectId: string, selectedSiteId: string) => {
  const [milestoneProgress, setMilestoneProgress] = useState<MilestoneProgressModel[]>([]);
  const [loading, setLoading] = useState(false);

  const loadMilestoneProgress = async () => {
    try {
      setLoading(true);
      const progressCollection = database.collections.get<MilestoneProgressModel>('milestone_progress');

      let query = progressCollection.query(Q.where('project_id', selectedProjectId));

      if (selectedSiteId) {
        query = progressCollection.query(
          Q.where('project_id', selectedProjectId),
          Q.where('site_id', selectedSiteId)
        );
      }

      const progressData = await query.fetch();
      setMilestoneProgress(progressData);
    } catch (error) {
      logger.error('[Milestone] Error loading progress', error as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedProjectId) {
      loadMilestoneProgress();
    }
  }, [selectedProjectId, selectedSiteId]);

  const getProgressForMilestone = (milestoneId: string): MilestoneProgressModel | null => {
    return milestoneProgress.find(p => p.milestoneId === milestoneId) || null;
  };

  const refreshProgress = () => {
    loadMilestoneProgress();
  };

  return {
    milestoneProgress,
    loading,
    getProgressForMilestone,
    refreshProgress,
  };
};
