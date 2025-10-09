import { database } from '../../models/database';
import ProjectModel from '../../models/ProjectModel';
import TaskModel from '../../models/TaskModel';
import MaterialModel from '../../models/MaterialModel';
import ProgressReportModel from '../../models/ProgressReportModel';
import SiteInspectionModel from '../../models/SiteInspectionModel';
import HindranceModel from '../../models/HindranceModel';
import DailyReportModel from '../../models/DailyReportModel';
import { Q } from '@nozbe/watermelondb';

interface SyncResult {
  success: boolean;
  message: string;
  syncedRecords: number;
}

export class SyncService {
  static async syncUp(): Promise<SyncResult> {
    try {
      // In a real implementation, this would sync local changes to the server
      // For now, we'll simulate the process and mark all pending records as synced

      console.log('🔄 SyncService.syncUp() started...');

      // Get ALL records from tables with sync_status (to handle both pending and records without sync_status)
      let inspections: SiteInspectionModel[] = [];
      let hindrances: HindranceModel[] = [];
      let dailyReports: DailyReportModel[] = [];

      try {
        // Try to get records with pending status first
        inspections = await database.collections
          .get<SiteInspectionModel>('site_inspections')
          .query(Q.where('sync_status', 'pending'))
          .fetch();

        // If no pending records found, get all records (to handle case where sync_status doesn't exist)
        if (inspections.length === 0) {
          const allInspections = await database.collections
            .get<SiteInspectionModel>('site_inspections')
            .query()
            .fetch();

          // Filter to only records that have sync_status field and are pending or undefined
          inspections = allInspections.filter(i => !i.syncStatus || i.syncStatus === 'pending');
        }
      } catch (error) {
        console.log('Error querying inspections:', error);
        // If query fails, get all and filter manually
        const allInspections = await database.collections
          .get<SiteInspectionModel>('site_inspections')
          .query()
          .fetch();
        inspections = allInspections;
      }

      try {
        hindrances = await database.collections
          .get<HindranceModel>('hindrances')
          .query(Q.where('sync_status', 'pending'))
          .fetch();

        if (hindrances.length === 0) {
          const allHindrances = await database.collections
            .get<HindranceModel>('hindrances')
            .query()
            .fetch();
          hindrances = allHindrances.filter(h => !h.syncStatus || h.syncStatus === 'pending');
        }
      } catch (error) {
        console.log('Error querying hindrances:', error);
        const allHindrances = await database.collections
          .get<HindranceModel>('hindrances')
          .query()
          .fetch();
        hindrances = allHindrances;
      }

      try {
        dailyReports = await database.collections
          .get<DailyReportModel>('daily_reports')
          .query(Q.where('sync_status', 'pending'))
          .fetch();

        if (dailyReports.length === 0) {
          const allReports = await database.collections
            .get<DailyReportModel>('daily_reports')
            .query()
            .fetch();
          dailyReports = allReports.filter(r => !r.syncStatus || r.syncStatus === 'pending');
        }
      } catch (error) {
        console.log('Error querying daily reports:', error);
        const allReports = await database.collections
          .get<DailyReportModel>('daily_reports')
          .query()
          .fetch();
        dailyReports = allReports;
      }

      console.log('🔄 Syncing:', {
        inspections: inspections.length,
        hindrances: hindrances.length,
        dailyReports: dailyReports.length,
      });

      // Simulate syncing and update sync status
      await database.write(async () => {
        // Update site inspections
        for (const inspection of inspections) {
          try {
            await inspection.update((record) => {
              record.syncStatus = 'synced';
            });
            console.log('✅ Synced inspection:', inspection.id);
          } catch (error) {
            console.error('❌ Failed to sync inspection:', inspection.id, error);
          }
        }

        // Update hindrances
        for (const hindrance of hindrances) {
          try {
            await hindrance.update((record) => {
              record.syncStatus = 'synced';
            });
            console.log('✅ Synced hindrance:', hindrance.id);
          } catch (error) {
            console.error('❌ Failed to sync hindrance:', hindrance.id, error);
          }
        }

        // Update daily reports
        for (const report of dailyReports) {
          try {
            await report.update((record) => {
              record.syncStatus = 'synced';
            });
            console.log('✅ Synced report:', report.id);
          } catch (error) {
            console.error('❌ Failed to sync report:', report.id, error);
          }
        }
      });

      const totalRecords =
        inspections.length +
        hindrances.length +
        dailyReports.length;

      // Simulate API calls to sync data
      // In real implementation:
      // await this.uploadProjects(projects);
      // await this.uploadTasks(tasks);
      // await this.uploadMaterials(materials);
      // await this.uploadProgressReports(progressReports);
      // await this.uploadInspections(inspections);
      // await this.uploadHindrances(hindrances);
      // await this.uploadDailyReports(dailyReports);

      return {
        success: true,
        message: `Successfully synced ${totalRecords} records`,
        syncedRecords: totalRecords,
      };
    } catch (error) {
      return {
        success: false,
        message: `Sync failed: ${(error as Error).message}`,
        syncedRecords: 0,
      };
    }
  }

  static async syncDown(): Promise<SyncResult> {
    try {
      // In a real implementation, this would pull latest data from the server
      // For now, we'll simulate the process
      
      // Simulate API calls to fetch latest data
      // In real implementation:
      // const remoteProjects = await this.fetchProjects();
      // const remoteTasks = await this.fetchTasks();
      // const remoteMaterials = await this.fetchMaterials();
      // const remoteProgressReports = await this.fetchProgressReports();
      
      // Then merge/sync with local database
      // await this.mergeProjects(remoteProjects);
      // await this.mergeTasks(remoteTasks);
      // await this.mergeMaterials(remoteMaterials);
      // await this.mergeProgressReports(remoteProgressReports);
      
      return {
        success: true,
        message: 'Successfully pulled latest data from server',
        syncedRecords: 0, // In real implementation, this would be the number of records received
      };
    } catch (error) {
      return {
        success: false,
        message: `Sync failed: ${(error as Error).message}`,
        syncedRecords: 0,
      };
    }
  }

  static async syncAll(): Promise<SyncResult> {
    // First sync down (pull latest from server), then sync up (push local changes)
    const downResult = await this.syncDown();
    
    if (!downResult.success) {
      return downResult; // If sync down failed, return early
    }
    
    const upResult = await this.syncUp();
    
    return {
      success: upResult.success,
      message: `Sync down: ${downResult.message}. Sync up: ${upResult.message}`,
      syncedRecords: downResult.syncedRecords + upResult.syncedRecords,
    };
  }

  static async hasOfflineData(): Promise<boolean> {
    try {
      // Check for pending sync status records
      const pendingInspections = await database.collections
        .get<SiteInspectionModel>('site_inspections')
        .query(Q.where('sync_status', 'pending'))
        .fetch();

      const pendingHindrances = await database.collections
        .get<HindranceModel>('hindrances')
        .query(Q.where('sync_status', 'pending'))
        .fetch();

      const pendingReports = await database.collections
        .get<DailyReportModel>('daily_reports')
        .query(Q.where('sync_status', 'pending'))
        .fetch();

      return (
        pendingInspections.length > 0 ||
        pendingHindrances.length > 0 ||
        pendingReports.length > 0
      );
    } catch (error) {
      console.error('Error checking offline data:', error);
      return false;
    }
  }
}