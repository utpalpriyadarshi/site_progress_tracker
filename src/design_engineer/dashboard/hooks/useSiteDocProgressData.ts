/**
 * useSiteDocProgressData Hook
 *
 * Fetches per-site design document progress for the Design Engineer dashboard.
 * Loads docs directly by site_id (not by KD) so each site gets its own progress.
 *
 * @version 1.1.0
 */

import { useState, useEffect, useCallback } from 'react';
import { Q } from '@nozbe/watermelondb';
import { database } from '../../../../models/database';
import SiteModel from '../../../../models/SiteModel';
import KeyDateSiteModel from '../../../../models/KeyDateSiteModel';
import { calculateSiteProgressFromDesignDocuments } from '../../../planning/utils/designDocumentProgress';
import { batchLoadDesignDocsBySites } from '../../../planning/utils/dataLoading';
import type { SiteProgressItem } from '../../../planning/dashboard/hooks/useSiteProgressData';

interface UseSiteDocProgressResult {
  sites: SiteProgressItem[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useSiteDocProgressData(
  projectId: string | null,
  engineerId: string | null
): UseSiteDocProgressResult {
  const [sites, setSites] = useState<SiteProgressItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!projectId) {
      setSites([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch sites assigned to this DE
      const allSites = await database.collections
        .get<SiteModel>('sites')
        .query(
          Q.where('project_id', projectId),
          ...(engineerId ? [Q.where('design_engineer_id', engineerId)] : []),
        )
        .fetch();

      if (allSites.length === 0) {
        setSites([]);
        setLoading(false);
        return;
      }

      const siteIds = allSites.map(s => s.id);

      // Load design docs directly by site_id — each site gets its own docs
      const docsBySite = await batchLoadDesignDocsBySites(siteIds);

      // Fetch KD-site associations (just for kdCount display)
      const allKdSites = await database.collections
        .get<KeyDateSiteModel>('key_date_sites')
        .query(Q.where('site_id', Q.oneOf(siteIds)))
        .fetch();

      const kdCountBySite: Record<string, number> = {};
      for (const kds of allKdSites) {
        kdCountBySite[kds.siteId] = (kdCountBySite[kds.siteId] || 0) + 1;
      }

      // Calculate doc progress per site from site-specific docs
      const siteProgressItems: SiteProgressItem[] = allSites.map(site => {
        const siteDocs = docsBySite[site.id] || [];
        const docProgress = calculateSiteProgressFromDesignDocuments(siteDocs);

        return {
          id: site.id,
          name: site.name || 'Unnamed Site',
          location: site.location || '',
          progress: Math.round(docProgress * 100) / 100,
          itemProgress: 0,
          docProgress: Math.round(docProgress * 100) / 100,
          hasSupervisor: !!site.supervisorId,
          hasDE: !!site.designEngineerId,
          kdCount: kdCountBySite[site.id] || 0,
        };
      });

      siteProgressItems.sort((a, b) => a.name.localeCompare(b.name));
      setSites(siteProgressItems);
    } catch (err) {
      console.error('Error loading site doc progress:', err);
      setError('Failed to load site progress');
    } finally {
      setLoading(false);
    }
  }, [projectId, engineerId]);

  useEffect(() => {
    fetchData();
    const subscription = database
      .withChangesForTables(['design_documents', 'key_date_sites', 'sites'])
      .subscribe(() => {
        fetchData();
      });
    return () => subscription.unsubscribe();
  }, [fetchData]);

  return { sites, loading, error, refresh: fetchData };
}
