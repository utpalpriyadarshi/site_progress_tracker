import { useState, useEffect } from 'react';
import { database } from '../../../models/database';
import { Q } from '@nozbe/watermelondb';
import { logger } from '../../services/LoggingService';
import { DoorsPackage, Site } from '../types/DoorsPackageTypes';

export const useDoorsPackages = (projectId: string, refreshTrigger: number, showSnackbar: (message: string) => void) => {
  const [packages, setPackages] = useState<DoorsPackage[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPackages();
    loadSites();
  }, [projectId, refreshTrigger]);

  const loadSites = async () => {
    if (!projectId) return;

    try {
      const sitesCollection = database.collections.get('sites');
      const sitesData = await sitesCollection.query(Q.where('project_id', projectId)).fetch();

      const sitesList = sitesData.map((site: any) => ({
        id: site.id,
        name: site.name,
      }));

      setSites(sitesList);
    } catch (error) {
      logger.error('[DoorsPackage] Error loading sites:', error as Error);
    }
  };

  const loadPackages = async () => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      logger.info('[DoorsPackage] Loading packages for project:', { projectId });

      const doorsCollection = database.collections.get('doors_packages');
      const packagesData = await doorsCollection.query(Q.where('project_id', projectId)).fetch();

      const packagesWithSites = await Promise.all(
        packagesData.map(async (pkg: any) => {
          let siteName = '';
          if (pkg.siteId) {
            try {
              const site = await database.collections.get('sites').find(pkg.siteId);
              siteName = (site as any).name;
            } catch (error) {
              logger.warn('[DoorsPackage] Site not found:', pkg.siteId);
            }
          }

          return {
            id: pkg.id,
            doorsId: pkg.doorsId,
            projectId: pkg.projectId,
            siteId: pkg.siteId,
            siteName,
            equipmentType: pkg.equipmentType,
            materialType: pkg.materialType,
            category: pkg.category,
            totalRequirements: pkg.totalRequirements,
            receivedDate: pkg.receivedDate,
            reviewedDate: pkg.reviewedDate,
            status: pkg.status,
            engineerId: pkg.engineerId,
            createdAt: pkg.createdAt,
          };
        })
      );

      logger.debug('[DoorsPackage] Loaded packages:', { value: packagesWithSites.length });
      setPackages(packagesWithSites);
    } catch (error) {
      logger.error('[DoorsPackage] Error loading packages:', error as Error);
      showSnackbar('Failed to load DOORS packages');
    } finally {
      setLoading(false);
    }
  };

  const createPackage = async (doorsId: string, siteId: string, equipmentType: string, materialType: string) => {
    if (!doorsId || !equipmentType || !siteId) {
      showSnackbar('Please fill in all required fields');
      return false;
    }

    try {
      const doorsCollection = database.collections.get('doors_packages');

      await database.write(async () => {
        await doorsCollection.create((record: any) => {
          record.doorsId = doorsId;
          record.projectId = projectId;
          record.siteId = siteId;
          record.equipmentType = equipmentType;
          record.materialType = materialType || null;
          record.category = 'equipment';
          record.totalRequirements = 100;
          record.status = 'pending';
          record.engineerId = '';
          record.appSyncStatus = 'pending';
          record.version = 1;
        });
      });

      showSnackbar('DOORS package created successfully');
      loadPackages();
      return true;
    } catch (error) {
      logger.error('[DoorsPackage] Error creating package:', error as Error);
      showSnackbar('Failed to create DOORS package');
      return false;
    }
  };

  const markAsReceived = async (packageId: string) => {
    try {
      const doorsCollection = database.collections.get('doors_packages');
      const packageRecord = await doorsCollection.find(packageId);

      await database.write(async () => {
        await packageRecord.update((record: any) => {
          record.receivedDate = Date.now();
          record.status = 'received';
        });
      });

      showSnackbar('Package marked as received');
      loadPackages();
    } catch (error) {
      logger.error('[DoorsPackage] Error marking as received:', error as Error);
      showSnackbar('Failed to update package');
    }
  };

  const markAsReviewed = async (packageId: string) => {
    try {
      const doorsCollection = database.collections.get('doors_packages');
      const packageRecord = await doorsCollection.find(packageId);

      await database.write(async () => {
        await packageRecord.update((record: any) => {
          record.reviewedDate = Date.now();
          record.status = 'reviewed';
        });
      });

      showSnackbar('Package marked as reviewed');
      loadPackages();
    } catch (error) {
      logger.error('[DoorsPackage] Error marking as reviewed:', error as Error);
      showSnackbar('Failed to update package');
    }
  };

  return {
    packages,
    sites,
    loading,
    createPackage,
    markAsReceived,
    markAsReviewed,
  };
};
