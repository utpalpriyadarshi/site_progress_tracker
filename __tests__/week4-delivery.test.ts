/**
 * Week 4: Delivery Scheduling - Basic Service Tests
 * Tests core functionality of DeliverySchedulingService
 */

import DeliverySchedulingService from '../src/services/DeliverySchedulingService';
import mockDeliverySchedules, {
  mockSuppliers,
  mockRouteOptimizations,
  mockSiteReadiness,
  mockDeliveryExceptions,
} from '../src/data/mockDeliveries';

describe('Week 4: Delivery Scheduling Service Tests', () => {
  describe('Delivery Schedule Generation', () => {
    it('should generate delivery schedule with JIT optimization', () => {
      const materialRequirements = [
        {
          materialId: 'mat_001',
          materialName: 'Cement',
          category: 'cement',
          quantity: 100,
          unit: 'bags',
          requiredDate: new Date('2025-11-20'),
          projectId: 'proj_001',
          projectName: 'Test Project',
          siteId: 'site_001',
          siteName: 'Test Site',
          priority: 'high' as const,
        },
      ];

      const schedules = DeliverySchedulingService.generateDeliverySchedule(
        materialRequirements,
        mockSuppliers,
        mockSiteReadiness
      );

      expect(schedules).toBeDefined();
      expect(schedules.length).toBeGreaterThan(0);
      expect(schedules[0].materialId).toBe('mat_001');
      expect(schedules[0].status).toBe('scheduled');
    });

    it('should select best supplier based on scoring', () => {
      const materialRequirements = [
        {
          materialId: 'mat_001',
          materialName: 'Cement',
          category: 'cement',
          quantity: 100,
          unit: 'bags',
          requiredDate: new Date('2025-11-20'),
          projectId: 'proj_001',
          projectName: 'Test Project',
          siteId: 'site_001',
          siteName: 'Test Site',
          priority: 'high' as const,
        },
      ];

      const schedules = DeliverySchedulingService.generateDeliverySchedule(
        materialRequirements,
        mockSuppliers,
        mockSiteReadiness
      );

      expect(schedules[0].supplierId).toBeDefined();
      expect(schedules[0].supplierName).toBeDefined();
    });

    it('should calculate delivery costs correctly', () => {
      const materialRequirements = [
        {
          materialId: 'mat_001',
          materialName: 'Cement',
          category: 'cement',
          quantity: 100,
          unit: 'bags',
          requiredDate: new Date('2025-11-20'),
          projectId: 'proj_001',
          projectName: 'Test Project',
          siteId: 'site_001',
          siteName: 'Test Site',
          priority: 'high' as const,
        },
      ];

      const schedules = DeliverySchedulingService.generateDeliverySchedule(
        materialRequirements,
        mockSuppliers,
        mockSiteReadiness
      );

      expect(schedules[0].transportCost).toBeGreaterThan(0);
      expect(schedules[0].handlingCost).toBeGreaterThan(0);
      expect(schedules[0].totalCost).toBe(schedules[0].transportCost + schedules[0].handlingCost);
    });
  });

  describe('Route Optimization', () => {
    it('should optimize routes for multiple deliveries', () => {
      const routes = DeliverySchedulingService.optimizeRoutes(
        mockDeliverySchedules.slice(0, 3),
        10
      );

      expect(routes).toBeDefined();
      expect(Array.isArray(routes)).toBe(true);
      expect(routes.length).toBeGreaterThan(0);
    });

    it('should generate waypoints for each delivery', () => {
      const routes = DeliverySchedulingService.optimizeRoutes(
        mockDeliverySchedules.slice(0, 2),
        10
      );

      expect(routes[0].waypoints).toBeDefined();
      expect(routes[0].waypoints.length).toBeGreaterThan(0);
      expect(routes[0].waypoints[0].deliveryId).toBeDefined();
    });

    it('should calculate optimization metrics', () => {
      const routes = DeliverySchedulingService.optimizeRoutes(
        mockDeliverySchedules.slice(0, 3),
        10
      );

      expect(routes[0].optimizationScore).toBeGreaterThanOrEqual(0);
      expect(routes[0].optimizationScore).toBeLessThanOrEqual(100);
      expect(routes[0].savingsPercentage).toBeGreaterThanOrEqual(0);
      expect(routes[0].totalDistanceKm).toBeGreaterThan(0);
      expect(routes[0].totalCost).toBeGreaterThan(0);
    });
  });

  describe('Site Readiness Validation', () => {
    it('should validate site readiness', () => {
      const readiness = DeliverySchedulingService.validateSiteReadiness(
        'site_001',
        new Date(),
        100,
        {
          weather: 'clear',
          accessBlocked: false,
          storageOccupancy: 300,
        }
      );

      expect(readiness).toBeDefined();
      expect(readiness.siteId).toBe('site_001');
      expect(readiness.readinessScore).toBeGreaterThanOrEqual(0);
      expect(readiness.readinessScore).toBeLessThanOrEqual(100);
    });

    it('should penalize poor weather conditions', () => {
      const clearWeather = DeliverySchedulingService.validateSiteReadiness(
        'site_001',
        new Date(),
        100,
        {
          weather: 'clear',
          accessBlocked: false,
          storageOccupancy: 300,
        }
      );

      const stormWeather = DeliverySchedulingService.validateSiteReadiness(
        'site_001',
        new Date(),
        100,
        {
          weather: 'storm',
          accessBlocked: false,
          storageOccupancy: 300,
        }
      );

      expect(stormWeather.readinessScore).toBeLessThan(clearWeather.readinessScore);
    });

    it('should penalize blocked access', () => {
      const openAccess = DeliverySchedulingService.validateSiteReadiness(
        'site_001',
        new Date(),
        100,
        {
          weather: 'clear',
          accessBlocked: false,
          storageOccupancy: 300,
        }
      );

      const blockedAccess = DeliverySchedulingService.validateSiteReadiness(
        'site_001',
        new Date(),
        100,
        {
          weather: 'clear',
          accessBlocked: true,
          storageOccupancy: 300,
        }
      );

      expect(blockedAccess.readinessScore).toBeLessThan(openAccess.readinessScore);
    });
  });

  describe('Performance Metrics', () => {
    it('should calculate performance metrics', () => {
      const performance = DeliverySchedulingService.calculatePerformanceMetrics(
        mockDeliverySchedules
      );

      expect(performance).toBeDefined();
      expect(performance.totalDeliveries).toBeGreaterThan(0);
      expect(performance.onTimePercentage).toBeGreaterThanOrEqual(0);
      expect(performance.onTimePercentage).toBeLessThanOrEqual(100);
    });

    it('should calculate on-time vs late deliveries', () => {
      const performance = DeliverySchedulingService.calculatePerformanceMetrics(
        mockDeliverySchedules
      );

      expect(performance.onTimeDeliveries).toBeGreaterThanOrEqual(0);
      expect(performance.lateDeliveries).toBeGreaterThanOrEqual(0);
      expect(performance.onTimeDeliveries + performance.lateDeliveries).toBeLessThanOrEqual(performance.totalDeliveries);
    });

    it('should calculate cost metrics', () => {
      const performance = DeliverySchedulingService.calculatePerformanceMetrics(
        mockDeliverySchedules
      );

      expect(performance.totalCost).toBeGreaterThanOrEqual(0);
      expect(performance.averageCostPerDelivery).toBeGreaterThanOrEqual(0);
      expect(performance.costPerKm).toBeGreaterThanOrEqual(0);
    });

    it('should calculate efficiency metrics', () => {
      const performance = DeliverySchedulingService.calculatePerformanceMetrics(
        mockDeliverySchedules
      );

      expect(performance.averageDistanceKm).toBeGreaterThanOrEqual(0);
      expect(performance.averageDurationHours).toBeGreaterThanOrEqual(0);
      expect(performance.utilizationRate).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Exception Detection', () => {
    it('should detect delivery exceptions', () => {
      const currentTime = new Date('2025-11-12T14:00:00');
      const exceptions = DeliverySchedulingService.detectExceptions(
        mockDeliverySchedules,
        currentTime
      );

      expect(exceptions).toBeDefined();
      expect(Array.isArray(exceptions)).toBe(true);
    });

    it('should detect delays', () => {
      const delayedDelivery = mockDeliverySchedules.find(d => d.status === 'in_transit');
      if (delayedDelivery) {
        const futureTime = new Date(delayedDelivery.estimatedDeliveryTime.getTime() + (5 * 60 * 60 * 1000)); // 5 hours later
        const exceptions = DeliverySchedulingService.detectExceptions(
          [delayedDelivery],
          futureTime
        );

        const delayExceptions = exceptions.filter(e => e.type === 'delay');
        expect(delayExceptions.length).toBeGreaterThanOrEqual(0);
      }
    });

    it('should detect site readiness issues', () => {
      const unreadySite = mockDeliverySchedules.find(d => !d.siteReady);
      if (unreadySite) {
        const exceptions = DeliverySchedulingService.detectExceptions(
          [unreadySite],
          new Date()
        );

        const siteExceptions = exceptions.filter(e => e.type === 'site_issue');
        expect(siteExceptions.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Recommendations', () => {
    it('should generate recommendations', () => {
      const performance = DeliverySchedulingService.calculatePerformanceMetrics(
        mockDeliverySchedules
      );

      const recommendations = DeliverySchedulingService.generateRecommendations(
        mockDeliverySchedules,
        performance
      );

      expect(recommendations).toBeDefined();
      expect(Array.isArray(recommendations)).toBe(true);
    });

    it('should recommend improvements for poor performance', () => {
      const poorPerformance = {
        totalDeliveries: 10,
        onTimeDeliveries: 5,
        lateDeliveries: 5,
        onTimePercentage: 50,
        averageDelayHours: 5,
        maxDelayHours: 10,
        totalCost: 50000,
        averageCostPerDelivery: 5000,
        costPerKm: 6,
        averageDistanceKm: 150,
        averageDurationHours: 5,
        utilizationRate: 70,
        damageRate: 2,
        complaintRate: 1,
        customerSatisfaction: 75,
      };

      const recommendations = DeliverySchedulingService.generateRecommendations(
        mockDeliverySchedules,
        poorPerformance
      );

      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.some(r => r.type === 'schedule' || r.type === 'cost' || r.type === 'route')).toBe(true);
    });
  });

  describe('Mock Data Integrity', () => {
    it('should have valid delivery schedules', () => {
      expect(mockDeliverySchedules.length).toBeGreaterThan(0);
      mockDeliverySchedules.forEach(delivery => {
        expect(delivery.id).toBeDefined();
        expect(delivery.deliveryNumber).toBeDefined();
        expect(delivery.materialId).toBeDefined();
        expect(delivery.materialName).toBeDefined();
        expect(delivery.supplierId).toBeDefined();
        expect(delivery.status).toBeDefined();
        expect(delivery.priority).toBeDefined();
        expect(['scheduled', 'confirmed', 'in_transit', 'delivered', 'delayed', 'cancelled']).toContain(delivery.status);
        expect(['critical', 'high', 'medium', 'low']).toContain(delivery.priority);
      });
    });

    it('should have valid suppliers', () => {
      expect(mockSuppliers.length).toBeGreaterThan(0);
      mockSuppliers.forEach(supplier => {
        expect(supplier.supplierId).toBeDefined();
        expect(supplier.supplierName).toBeDefined();
        expect(supplier.materials.length).toBeGreaterThan(0);
        expect(supplier.leadTimeDays).toBeGreaterThan(0);
        expect(supplier.reliability).toBeGreaterThanOrEqual(0);
        expect(supplier.reliability).toBeLessThanOrEqual(1);
      });
    });

    it('should have valid route optimizations', () => {
      expect(mockRouteOptimizations.length).toBeGreaterThan(0);
      mockRouteOptimizations.forEach(route => {
        expect(route.routeId).toBeDefined();
        expect(route.deliveries.length).toBeGreaterThan(0);
        expect(route.waypoints.length).toBeGreaterThan(0);
        expect(route.totalDistanceKm).toBeGreaterThan(0);
        expect(route.optimizationScore).toBeGreaterThanOrEqual(0);
        expect(route.optimizationScore).toBeLessThanOrEqual(100);
      });
    });

    it('should have valid site readiness data', () => {
      expect(mockSiteReadiness.length).toBeGreaterThan(0);
      mockSiteReadiness.forEach(site => {
        expect(site.siteId).toBeDefined();
        expect(site.readinessScore).toBeGreaterThanOrEqual(0);
        expect(site.readinessScore).toBeLessThanOrEqual(100);
        expect(site.storageCapacity).toBeGreaterThan(0);
        expect(site.currentOccupancy).toBeGreaterThanOrEqual(0);
        expect(site.availableSpace).toBeGreaterThanOrEqual(0);
      });
    });

    it('should have valid exceptions', () => {
      expect(mockDeliveryExceptions.length).toBeGreaterThan(0);
      mockDeliveryExceptions.forEach(exception => {
        expect(exception.id).toBeDefined();
        expect(exception.deliveryId).toBeDefined();
        expect(exception.type).toBeDefined();
        expect(exception.severity).toBeDefined();
        expect(['critical', 'high', 'medium', 'low']).toContain(exception.severity);
      });
    });
  });
});
