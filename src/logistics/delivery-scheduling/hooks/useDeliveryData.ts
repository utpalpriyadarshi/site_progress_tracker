/**
 * useDeliveryData Hook
 *
 * Manages delivery data loading, state, and statistics
 */

import { useState, useEffect, useMemo } from 'react';
import { logger } from '../../../services/LoggingService';
import DeliverySchedulingService, {
  DeliverySchedule,
  RouteOptimization,
  SiteReadiness,
  DeliveryException,
  DeliveryPerformance,
} from '../../../services/DeliverySchedulingService';
import mockDeliverySchedules, {
  mockRouteOptimizations,
  mockSiteReadiness,
  mockDeliveryExceptions,
} from '../../../data/mockDeliveries';

export interface DeliveryStatistics {
  total: number;
  scheduled: number;
  inTransit: number;
  delivered: number;
  delayed: number;
  critical: number;
}

export const useDeliveryData = () => {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Delivery data
  const [deliveries, setDeliveries] = useState<DeliverySchedule[]>([]);
  const [routes, setRoutes] = useState<RouteOptimization[]>([]);
  const [siteReadiness, setSiteReadiness] = useState<SiteReadiness[]>([]);
  const [exceptions, setExceptions] = useState<DeliveryException[]>([]);
  const [performance, setPerformance] = useState<DeliveryPerformance | null>(null);

  // Load data on mount
  useEffect(() => {
    loadDeliveryData();
  }, []);

  const loadDeliveryData = () => {
    setLoading(true);
    try {
      // Load mock data
      setDeliveries(mockDeliverySchedules);
      setRoutes(mockRouteOptimizations);
      setSiteReadiness(mockSiteReadiness);
      setExceptions(mockDeliveryExceptions);

      // Calculate performance
      const performanceMetrics = DeliverySchedulingService.calculatePerformanceMetrics(
        mockDeliverySchedules
      );
      setPerformance(performanceMetrics);

      logger.debug('Delivery data loaded', {
        deliveries: mockDeliverySchedules.length,
        routes: mockRouteOptimizations.length,
        exceptions: mockDeliveryExceptions.length,
      });
    } catch (error) {
      logger.error('Error loading delivery data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadDeliveryData();
    setRefreshing(false);
  };

  // Calculate statistics
  const stats: DeliveryStatistics = useMemo(() => {
    const total = deliveries.length;
    const scheduled = deliveries.filter(d => d.status === 'scheduled').length;
    const inTransit = deliveries.filter(d => d.status === 'in_transit').length;
    const delivered = deliveries.filter(d => d.status === 'delivered').length;
    const delayed = deliveries.filter(d => d.status === 'delayed').length;
    const critical = deliveries.filter(d => d.priority === 'critical').length;

    return { total, scheduled, inTransit, delivered, delayed, critical };
  }, [deliveries]);

  return {
    loading,
    refreshing,
    deliveries,
    routes,
    siteReadiness,
    exceptions,
    performance,
    stats,
    handleRefresh,
  };
};
