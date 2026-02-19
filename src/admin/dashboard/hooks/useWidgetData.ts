import { useState, useEffect, useCallback } from 'react';
import { database } from '../../../../models/database';
import { SyncService } from '../../../../services/sync/SyncService';
import AutoSyncManager, { SyncState } from '../../../../services/sync/AutoSyncManager';
import NetworkMonitor from '../../../../services/network/NetworkMonitor';
import { Q } from '@nozbe/watermelondb';
import SyncQueueModel from '../../../../models/SyncQueueModel';
import {
  HealthStatus,
  UserActivityData,
  RoleDistribution,
  SyncStatusData,
  QuickStatsData,
} from '../widgets';
import { COLORS } from '../../../theme/colors';

/**
 * Hook to provide data for admin dashboard widgets
 */
export function useWidgetData() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // System Health
  const [healthStatus, setHealthStatus] = useState<HealthStatus>({
    database: 'healthy',
    sync: 'active',
    network: 'online',
    lastBackup: undefined,
  });

  // User Activity
  const [userActivity, setUserActivity] = useState<UserActivityData>({
    activeUsers: 0,
    totalUsers: 0,
    newUsersThisWeek: 0,
    recentLogins: 0,
    roleDistribution: [],
  });

  // Sync Status
  const [syncStatus, setSyncStatus] = useState<SyncStatusData>({
    isSyncing: false,
    lastSyncAt: undefined,
    lastSyncSuccess: true,
    queueCount: 0,
    deadLetterCount: 0,
    syncCount: 0,
  });
  const [isConnected, setIsConnected] = useState(true);

  // Quick Stats
  const [quickStats, setQuickStats] = useState<QuickStatsData>({
    totalProjects: 0,
    totalSites: 0,
    totalUsers: 0,
    totalItems: 0,
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Load Quick Stats
      const [projectsCount, sitesCount, usersCount, itemsCount] = await Promise.all([
        database.collections.get('projects').query().fetchCount(),
        database.collections.get('sites').query().fetchCount(),
        database.collections.get('users').query().fetchCount(),
        database.collections.get('items').query().fetchCount(),
      ]);

      setQuickStats({
        totalProjects: projectsCount,
        totalSites: sitesCount,
        totalUsers: usersCount,
        totalItems: itemsCount,
      });

      // Load User Activity
      const [users, roles] = await Promise.all([
        database.collections.get('users').query().fetch(),
        database.collections.get('roles').query().fetch(),
      ]);

      // Create roleId -> roleName mapping
      const roleNameMap = new Map<string, string>();
      roles.forEach((role: any) => {
        roleNameMap.set(role.id, role.name?.toLowerCase() || 'unknown');
      });

      const now = Date.now();
      const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
      const dayAgo = now - 24 * 60 * 60 * 1000;

      // Count users by role name
      const roleMap = new Map<string, number>();
      let activeCount = 0;
      let newThisWeek = 0;
      let recentLogins = 0;

      users.forEach((user: any) => {
        // Get role name from roleId mapping
        const roleName = roleNameMap.get(user.roleId) || 'unknown';
        roleMap.set(roleName, (roleMap.get(roleName) || 0) + 1);

        // Count active (has logged in within last 7 days)
        if (user.lastLoginAt && user.lastLoginAt > weekAgo) {
          activeCount++;
        }

        // Count recent logins (last 24 hours)
        if (user.lastLoginAt && user.lastLoginAt > dayAgo) {
          recentLogins++;
        }

        // Count new this week
        if (user.createdAt && user.createdAt > weekAgo) {
          newThisWeek++;
        }
      });

      const roleDistribution: RoleDistribution[] = Array.from(roleMap.entries())
        .map(([role, count]) => ({
          role,
          count,
          color: getRoleColor(role),
        }))
        .sort((a, b) => b.count - a.count);

      setUserActivity({
        activeUsers: activeCount,
        totalUsers: users.length,
        newUsersThisWeek: newThisWeek,
        recentLogins: recentLogins,
        roleDistribution,
      });

      // Load Sync Status
      const syncState = AutoSyncManager.getSyncState();
      const queueItems = await database.collections
        .get<SyncQueueModel>('sync_queue')
        .query(Q.where('synced_at', null))
        .fetchCount();
      const deadLetterItems = await SyncService.getDeadLetterQueue();

      setSyncStatus({
        isSyncing: syncState.isSyncing,
        lastSyncAt: syncState.lastSyncAt,
        lastSyncSuccess: syncState.lastSyncSuccess,
        queueCount: queueItems,
        deadLetterCount: deadLetterItems.length,
        syncCount: syncState.syncCount,
      });

      // Check network
      const connected = await NetworkMonitor.isConnected();
      setIsConnected(connected);

      // Update Health Status
      setHealthStatus({
        database: 'healthy', // If we got here, database is working
        sync: syncState.isSyncing ? 'active' : syncState.lastSyncSuccess ? 'active' : 'error',
        network: connected ? 'online' : 'offline',
        lastBackup: syncState.lastSyncAt, // Use last sync as proxy for backup
      });

    } catch (err) {
      setError('Failed to load dashboard data');
      setHealthStatus(prev => ({ ...prev, database: 'degraded' }));
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Subscribe to sync state changes
  useEffect(() => {
    const unsubscribeSync = AutoSyncManager.addListener((state: SyncState) => {
      setSyncStatus(prev => ({
        ...prev,
        isSyncing: state.isSyncing,
        lastSyncAt: state.lastSyncAt,
        lastSyncSuccess: state.lastSyncSuccess,
        syncCount: state.syncCount,
      }));

      setHealthStatus(prev => ({
        ...prev,
        sync: state.isSyncing ? 'active' : state.lastSyncSuccess ? 'active' : 'error',
      }));
    });

    const unsubscribeNetwork = NetworkMonitor.addListener((connected: boolean) => {
      setIsConnected(connected);
      setHealthStatus(prev => ({
        ...prev,
        network: connected ? 'online' : 'offline',
      }));
    });

    return () => {
      unsubscribeSync();
      unsubscribeNetwork();
    };
  }, []);

  // Manual sync handler
  const handleManualSync = useCallback(async () => {
    if (!isConnected) return false;
    return await AutoSyncManager.manualSync();
  }, [isConnected]);

  return {
    loading,
    error,
    healthStatus,
    userActivity,
    syncStatus,
    isConnected,
    quickStats,
    refresh: loadData,
    handleManualSync,
  };
}

function getRoleColor(role: string): string {
  const colors: Record<string, string> = {
    admin: COLORS.STATUS_EVALUATED,
    manager: COLORS.INFO,
    supervisor: COLORS.SUCCESS,
    commercial: COLORS.WARNING,
    logistics: '#00BCD4',
    planning: '#E91E63',
    design_engineer: '#795548',
  };
  return colors[role] || COLORS.DISABLED;
}
