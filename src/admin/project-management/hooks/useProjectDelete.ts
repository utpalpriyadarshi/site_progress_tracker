import { useState } from 'react';
import { database } from '../../../../models/database';
import ProjectModel from '../../../../models/ProjectModel';
import { Q } from '@nozbe/watermelondb';
import { logger } from '../../../services/LoggingService';

interface UseProjectDeleteProps {
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  onDataReload: () => void;
}

export const useProjectDelete = ({
  onSuccess,
  onError,
  onDataReload,
}: UseProjectDeleteProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<ProjectModel | null>(null);
  const [deleteMessage, setDeleteMessage] = useState('');

  const handleDelete = async (project: ProjectModel) => {
    // Get sites count for this project
    const sites = await database.collections
      .get('sites')
      .query(Q.where('project_id', project.id))
      .fetch();

    const sitesCount = sites.length;
    const message =
      sitesCount > 0
        ? `This project has ${sitesCount} site(s). Deleting it will also delete all associated sites, items, and data. This action cannot be undone.`
        : 'Are you sure you want to delete this project? This action cannot be undone.';

    setProjectToDelete(project);
    setDeleteMessage(message);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!projectToDelete) return;

    setShowDeleteDialog(false);
    try {
      // Get sites for this project
      const sites = await database.collections
        .get('sites')
        .query(Q.where('project_id', projectToDelete.id))
        .fetch();

      await database.write(async () => {
        // Cascade delete: Delete all sites and their related data
        for (const site of sites) {
          // Get all items for this site
          const items = await database.collections
            .get('items')
            .query(Q.where('site_id', site.id))
            .fetch();

          // Delete all related data for each item
          for (const item of items) {
            // Delete progress logs
            const progressLogs = await database.collections
              .get('progress_logs')
              .query(Q.where('item_id', item.id))
              .fetch();
            await Promise.all(progressLogs.map((log) => log.markAsDeleted()));

            // Delete hindrances
            const hindrances = await database.collections
              .get('hindrances')
              .query(Q.where('item_id', item.id))
              .fetch();
            await Promise.all(hindrances.map((h) => h.markAsDeleted()));

            // Delete materials
            const materials = await database.collections
              .get('materials')
              .query(Q.where('item_id', item.id))
              .fetch();
            await Promise.all(materials.map((m) => m.markAsDeleted()));

            // Delete the item
            await item.markAsDeleted();
          }

          // Delete site-level hindrances
          const siteHindrances = await database.collections
            .get('hindrances')
            .query(Q.where('site_id', site.id))
            .fetch();
          await Promise.all(siteHindrances.map((h) => h.markAsDeleted()));

          // Delete daily reports
          const dailyReports = await database.collections
            .get('daily_reports')
            .query(Q.where('site_id', site.id))
            .fetch();
          await Promise.all(dailyReports.map((r) => r.markAsDeleted()));

          // Delete site inspections
          const inspections = await database.collections
            .get('site_inspections')
            .query(Q.where('site_id', site.id))
            .fetch();
          await Promise.all(inspections.map((i) => i.markAsDeleted()));

          // Delete the site
          await site.markAsDeleted();
        }

        // Finally, delete the project
        await projectToDelete.markAsDeleted();
      });

      onDataReload();
      onSuccess('Project and all related data deleted successfully');
      setProjectToDelete(null);
    } catch (error) {
      logger.error('Error deleting project:', error as Error);
      onError('Failed to delete project');
    }
  };

  const cancelDelete = () => {
    setShowDeleteDialog(false);
    setProjectToDelete(null);
    setDeleteMessage('');
  };

  return {
    showDeleteDialog,
    projectToDelete,
    deleteMessage,
    handleDelete,
    confirmDelete,
    cancelDelete,
  };
};
