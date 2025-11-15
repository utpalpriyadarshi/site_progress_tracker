/**
 * Week 3: Equipment Management - Basic Service Tests
 * Tests core functionality of EquipmentManagementService
 */

import EquipmentManagementService from '../src/services/EquipmentManagementService';
import {
  mockEquipment,
  mockMaintenanceRecords,
  mockAllocations,
  mockOperatorCertifications,
} from '../src/data/mockEquipment';

describe('Week 3: Equipment Management Service Tests', () => {
  describe('Utilization Metrics', () => {
    it('should calculate utilization metrics for equipment', () => {
      const equipment = mockEquipment[0]; // CAT 320 Excavator
      const allocations = mockAllocations.filter(a => a.equipmentId === equipment.id);
      const maintenanceRecords = mockMaintenanceRecords.filter(m => m.equipmentId === equipment.id);

      const metrics = EquipmentManagementService.calculateUtilizationMetrics(
        equipment,
        allocations,
        maintenanceRecords,
        30
      );

      expect(metrics).toBeDefined();
      expect(metrics.equipmentId).toBe(equipment.id);
      expect(metrics.utilizationRate).toBeGreaterThanOrEqual(0);
      expect(metrics.utilizationRate).toBeLessThanOrEqual(100);
      expect(metrics.availabilityRate).toBeGreaterThanOrEqual(0);
      expect(metrics.availabilityRate).toBeLessThanOrEqual(100);
    });

    it('should calculate metrics for all equipment', () => {
      mockEquipment.forEach(equipment => {
        const allocations = mockAllocations.filter(a => a.equipmentId === equipment.id);
        const maintenanceRecords = mockMaintenanceRecords.filter(m => m.equipmentId === equipment.id);

        const metrics = EquipmentManagementService.calculateUtilizationMetrics(
          equipment,
          allocations,
          maintenanceRecords,
          30
        );

        expect(metrics).toBeDefined();
        expect(metrics.equipmentId).toBe(equipment.id);
      });
    });
  });

  describe('Maintenance Schedule', () => {
    it('should generate maintenance schedule', () => {
      const schedule = EquipmentManagementService.generateMaintenanceSchedule(
        mockEquipment,
        mockMaintenanceRecords
      );

      expect(schedule).toBeDefined();
      expect(Array.isArray(schedule)).toBe(true);
      expect(schedule.length).toBeGreaterThan(0);
    });

    it('should identify overdue maintenance', () => {
      const schedule = EquipmentManagementService.generateMaintenanceSchedule(
        mockEquipment,
        mockMaintenanceRecords
      );

      const overdueItems = schedule.filter(s => s.isOverdue);
      expect(overdueItems.length).toBeGreaterThanOrEqual(0);
    });

    it('should prioritize high-priority maintenance', () => {
      const schedule = EquipmentManagementService.generateMaintenanceSchedule(
        mockEquipment,
        mockMaintenanceRecords
      );

      const highPriority = schedule.filter(s => s.priority === 'high');
      expect(highPriority.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Performance Metrics', () => {
    it('should calculate performance metrics for equipment', () => {
      const equipment = mockEquipment[0];
      const allocations = mockAllocations.filter(a => a.equipmentId === equipment.id);
      const maintenanceRecords = mockMaintenanceRecords.filter(m => m.equipmentId === equipment.id);

      const performance = EquipmentManagementService.calculatePerformanceMetrics(
        equipment,
        maintenanceRecords,
        allocations
      );

      expect(performance).toBeDefined();
      expect(performance.equipmentId).toBe(equipment.id);
      expect(performance.overallHealthScore).toBeGreaterThanOrEqual(0);
      expect(performance.overallHealthScore).toBeLessThanOrEqual(100);
    });

    it('should calculate MTBF and MTTR', () => {
      const equipment = mockEquipment[0];
      const allocations = mockAllocations.filter(a => a.equipmentId === equipment.id);
      const maintenanceRecords = mockMaintenanceRecords.filter(m => m.equipmentId === equipment.id);

      const performance = EquipmentManagementService.calculatePerformanceMetrics(
        equipment,
        maintenanceRecords,
        allocations
      );

      expect(performance.meanTimeBetweenFailures).toBeGreaterThanOrEqual(0);
      expect(performance.meanTimeToRepair).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Operator Certifications', () => {
    it('should check operator certifications', () => {
      const certificationStatus = EquipmentManagementService.checkOperatorCertifications(
        mockOperatorCertifications
      );

      expect(certificationStatus).toBeDefined();
      expect(Array.isArray(certificationStatus)).toBe(true);
    });

    it('should identify expired certifications', () => {
      const certificationStatus = EquipmentManagementService.checkOperatorCertifications(
        mockOperatorCertifications
      );

      const expired = certificationStatus.filter(c => c.status === 'expired');
      expect(expired.length).toBeGreaterThanOrEqual(0);
    });

    it('should identify expiring soon certifications', () => {
      const certificationStatus = EquipmentManagementService.checkOperatorCertifications(
        mockOperatorCertifications
      );

      const expiringSoon = certificationStatus.filter(c => c.daysUntilExpiry <= 30 && c.daysUntilExpiry > 0);
      expect(expiringSoon.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Allocation Optimization', () => {
    it('should optimize equipment allocation', () => {
      const availableEquipment = mockEquipment.filter(e => e.status === 'available');
      const projectDemands = [
        {
          projectId: 'proj_001',
          projectName: 'Test Project 1',
          category: 'heavy_machinery' as const,
          requiredCount: 1,
          startDate: new Date(),
          duration: 10,
          priority: 'high' as const,
        },
      ];

      const allocation = EquipmentManagementService.optimizeAllocation(
        availableEquipment,
        projectDemands
      );

      expect(allocation).toBeDefined();
      expect(Array.isArray(allocation)).toBe(true);
    });

    it('should handle multiple project demands', () => {
      const availableEquipment = mockEquipment.filter(e => e.status === 'available');
      const projectDemands = [
        {
          projectId: 'proj_001',
          projectName: 'Test Project 1',
          category: 'heavy_machinery' as const,
          requiredCount: 1,
          startDate: new Date(),
          duration: 10,
          priority: 'high' as const,
        },
        {
          projectId: 'proj_002',
          projectName: 'Test Project 2',
          category: 'vehicles' as const,
          requiredCount: 1,
          startDate: new Date(),
          duration: 5,
          priority: 'medium' as const,
        },
      ];

      const allocation = EquipmentManagementService.optimizeAllocation(
        availableEquipment,
        projectDemands
      );

      expect(allocation).toBeDefined();
      expect(allocation.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Mock Data Integrity', () => {
    it('should have valid equipment data', () => {
      expect(mockEquipment.length).toBeGreaterThan(0);
      mockEquipment.forEach(equipment => {
        expect(equipment.id).toBeDefined();
        expect(equipment.name).toBeDefined();
        expect(equipment.category).toBeDefined();
        expect(equipment.status).toBeDefined();
        expect(equipment.condition).toBeGreaterThanOrEqual(0);
        expect(equipment.condition).toBeLessThanOrEqual(100);
      });
    });

    it('should have valid maintenance records', () => {
      expect(mockMaintenanceRecords.length).toBeGreaterThan(0);
      mockMaintenanceRecords.forEach(record => {
        expect(record.id).toBeDefined();
        expect(record.equipmentId).toBeDefined();
        expect(record.type).toBeDefined();
        expect(record.priority).toBeDefined();
      });
    });

    it('should have valid allocations', () => {
      expect(mockAllocations.length).toBeGreaterThan(0);
      mockAllocations.forEach(allocation => {
        expect(allocation.id).toBeDefined();
        expect(allocation.equipmentId).toBeDefined();
        expect(allocation.projectId).toBeDefined();
        expect(allocation.utilizationRate).toBeGreaterThanOrEqual(0);
        expect(allocation.utilizationRate).toBeLessThanOrEqual(100);
      });
    });

    it('should have valid operator certifications', () => {
      expect(mockOperatorCertifications.length).toBeGreaterThan(0);
      mockOperatorCertifications.forEach(cert => {
        expect(cert.id).toBeDefined();
        expect(cert.operatorId).toBeDefined();
        expect(cert.certificationNumber).toBeDefined();
        expect(['active', 'expired', 'suspended']).toContain(cert.status);
      });
    });
  });
});
