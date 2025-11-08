/**
 * EquipmentManagementService
 *
 * Comprehensive equipment management including:
 * - Equipment tracking and status monitoring
 * - Preventive maintenance scheduling
 * - Allocation and utilization tracking
 * - Downtime analysis
 * - Operator certification management
 * - Predictive maintenance alerts
 *
 * Week 3: Core equipment management features
 * Week 6: Enhanced with ML-based predictive maintenance
 */

// ===== TYPES & INTERFACES =====

export type EquipmentStatus = 'available' | 'in_use' | 'maintenance' | 'repair' | 'retired';
export type EquipmentCategory = 'heavy_machinery' | 'light_equipment' | 'tools' | 'vehicles' | 'safety';
export type MaintenanceType = 'preventive' | 'corrective' | 'predictive' | 'breakdown';
export type MaintenancePriority = 'low' | 'medium' | 'high' | 'critical';

export interface Equipment {
  id: string;
  name: string;
  category: EquipmentCategory;
  model: string;
  manufacturer: string;
  serialNumber: string;
  purchaseDate: Date;
  purchaseCost: number;
  currentValue: number; // Depreciated value

  // Status
  status: EquipmentStatus;
  condition: number; // 0-100 percentage
  locationId: string;
  locationName: string;

  // Specifications
  specifications: {
    power?: string;
    capacity?: string;
    weight?: string;
    dimensions?: string;
    fuelType?: string;
    [key: string]: string | undefined;
  };

  // Maintenance
  lastMaintenanceDate: Date;
  nextMaintenanceDate: Date;
  maintenanceIntervalDays: number;
  totalMaintenanceHours: number;
  totalMaintenanceCost: number;

  // Usage
  totalOperatingHours: number;
  averageHoursPerDay: number;
  currentProjectId?: string;
  currentOperatorId?: string;

  // Certification
  certificationRequired: boolean;
  certificationLevel?: string;

  // Documents
  warrantyExpiryDate?: Date;
  insuranceExpiryDate?: Date;

  notes?: string;
}

export interface MaintenanceRecord {
  id: string;
  equipmentId: string;
  equipmentName: string;
  type: MaintenanceType;
  priority: MaintenancePriority;

  // Scheduling
  scheduledDate: Date;
  completedDate?: Date;
  durationHours: number;

  // Details
  description: string;
  workPerformed?: string;
  partsReplaced?: string[];
  technician?: string;

  // Cost
  laborCost: number;
  partsCost: number;
  totalCost: number;

  // Status
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

  // Impact
  downtimeHours: number;
  notes?: string;
}

export interface EquipmentAllocation {
  id: string;
  equipmentId: string;
  equipmentName: string;
  projectId: string;
  projectName: string;
  siteId: string;
  siteName: string;

  // Allocation period
  startDate: Date;
  endDate: Date;
  allocatedDays: number;

  // Usage
  plannedHoursPerDay: number;
  actualHoursUsed: number;
  utilizationRate: number; // Percentage

  // Assignment
  operatorId?: string;
  operatorName?: string;

  status: 'planned' | 'active' | 'completed';
}

export interface UtilizationMetrics {
  equipmentId: string;
  equipmentName: string;

  // Time-based
  totalHours: number;
  operatingHours: number;
  idleHours: number;
  maintenanceHours: number;
  downtimeHours: number;

  // Rates
  utilizationRate: number; // Operating / Total available
  availabilityRate: number; // (Total - Downtime) / Total
  maintenanceRate: number; // Maintenance / Total

  // Efficiency
  productiveHours: number;
  productivityRate: number; // Productive / Operating

  // Trends (7-day, 30-day)
  utilizationTrend: 'increasing' | 'stable' | 'decreasing';
  trendPercentage: number;
}

export interface OperatorCertification {
  id: string;
  operatorId: string;
  operatorName: string;

  // Certification
  certificationLevel: string;
  certificationNumber: string;
  issuingAuthority: string;
  issueDate: Date;
  expiryDate: Date;

  // Equipment qualified for
  qualifiedEquipment: string[]; // Equipment IDs or categories

  // Status
  status: 'active' | 'expired' | 'suspended';

  // Training
  trainingHours: number;
  lastTrainingDate?: Date;

  notes?: string;
}

export interface MaintenanceSchedule {
  equipmentId: string;
  equipmentName: string;

  // Schedule
  nextMaintenanceDate: Date;
  daysUntilDue: number;
  isOverdue: boolean;

  // Type
  maintenanceType: MaintenanceType;
  estimatedDurationHours: number;
  estimatedCost: number;

  // Priority
  priority: MaintenancePriority;
  urgency: number; // 0-100 score

  // Details
  taskDescription: string;
  partsRequired?: string[];

  // Impact
  criticalityScore: number; // Based on equipment importance
}

export interface EquipmentPerformance {
  equipmentId: string;
  equipmentName: string;

  // Reliability
  meanTimeBetweenFailures: number; // Hours
  meanTimeToRepair: number; // Hours
  failureRate: number; // Failures per 1000 hours

  // Availability
  uptime: number; // Hours
  downtime: number; // Hours
  availability: number; // Percentage

  // Costs
  operatingCost: number;
  maintenanceCost: number;
  costPerHour: number;

  // Efficiency
  fuelConsumption?: number;
  productivityScore: number; // 0-100

  // Health
  overallHealthScore: number; // 0-100
  predictedRemainingLife: number; // Days
}

// ===== SERVICE CLASS =====

class EquipmentManagementService {
  /**
   * Calculate utilization metrics for equipment
   */
  static calculateUtilizationMetrics(
    equipment: Equipment,
    allocations: EquipmentAllocation[],
    maintenanceRecords: MaintenanceRecord[],
    periodDays: number = 30
  ): UtilizationMetrics {
    const totalHours = periodDays * 24;

    // Calculate operating hours from allocations
    const recentAllocations = allocations.filter(a => {
      const daysSinceStart = this.daysBetween(a.startDate, new Date());
      return daysSinceStart <= periodDays && a.status !== 'planned';
    });

    const operatingHours = recentAllocations.reduce((sum, a) => {
      return sum + a.actualHoursUsed;
    }, 0);

    // Calculate maintenance hours from records
    const recentMaintenance = maintenanceRecords.filter(m => {
      const daysSinceCompletion = m.completedDate
        ? this.daysBetween(m.completedDate, new Date())
        : 999;
      return daysSinceCompletion <= periodDays;
    });

    const maintenanceHours = recentMaintenance.reduce((sum, m) => {
      return sum + (m.durationHours || 0);
    }, 0);

    const downtimeHours = recentMaintenance.reduce((sum, m) => {
      return sum + (m.downtimeHours || 0);
    }, 0);

    const idleHours = totalHours - operatingHours - maintenanceHours - downtimeHours;

    // Calculate rates
    const utilizationRate = (operatingHours / totalHours) * 100;
    const availabilityRate = ((totalHours - downtimeHours) / totalHours) * 100;
    const maintenanceRate = (maintenanceHours / totalHours) * 100;

    // Productive hours (assuming 80% of operating hours are productive)
    const productiveHours = operatingHours * 0.8;
    const productivityRate = operatingHours > 0 ? (productiveHours / operatingHours) * 100 : 0;

    // Calculate trend (compare last 7 days vs previous 7 days)
    const last7Days = this.calculatePeriodUtilization(allocations, 7);
    const prev7Days = this.calculatePeriodUtilization(allocations, 7, 7);

    const trendPercentage = prev7Days > 0
      ? ((last7Days - prev7Days) / prev7Days) * 100
      : 0;

    let utilizationTrend: 'increasing' | 'stable' | 'decreasing' = 'stable';
    if (trendPercentage > 10) utilizationTrend = 'increasing';
    else if (trendPercentage < -10) utilizationTrend = 'decreasing';

    return {
      equipmentId: equipment.id,
      equipmentName: equipment.name,
      totalHours,
      operatingHours,
      idleHours: Math.max(0, idleHours),
      maintenanceHours,
      downtimeHours,
      utilizationRate,
      availabilityRate,
      maintenanceRate,
      productiveHours,
      productivityRate,
      utilizationTrend,
      trendPercentage,
    };
  }

  /**
   * Generate maintenance schedule with priorities
   */
  static generateMaintenanceSchedule(
    equipment: Equipment[],
    maintenanceRecords: MaintenanceRecord[]
  ): MaintenanceSchedule[] {
    const schedules: MaintenanceSchedule[] = [];
    const now = new Date();

    equipment.forEach(eq => {
      if (eq.status === 'retired') return;

      const daysUntilDue = this.daysBetween(now, eq.nextMaintenanceDate);
      const isOverdue = daysUntilDue < 0;

      // Determine priority based on how overdue and equipment criticality
      let priority: MaintenancePriority = 'medium';
      let urgency = 50;

      if (isOverdue) {
        if (Math.abs(daysUntilDue) > 30) {
          priority = 'critical';
          urgency = 95;
        } else if (Math.abs(daysUntilDue) > 14) {
          priority = 'high';
          urgency = 80;
        } else {
          priority = 'high';
          urgency = 70;
        }
      } else if (daysUntilDue < 7) {
        priority = 'high';
        urgency = 60;
      } else if (daysUntilDue < 14) {
        priority = 'medium';
        urgency = 40;
      } else {
        priority = 'low';
        urgency = 20;
      }

      // Adjust priority based on equipment condition
      if (eq.condition < 50) {
        urgency += 20;
        if (priority === 'low') priority = 'medium';
        if (priority === 'medium') priority = 'high';
      }

      // Calculate criticality score (based on equipment value and usage)
      const criticalityScore = this.calculateCriticalityScore(eq);

      // Estimate cost based on previous maintenance
      const recentMaintenance = maintenanceRecords
        .filter(m => m.equipmentId === eq.id)
        .slice(0, 3);

      const avgCost = recentMaintenance.length > 0
        ? recentMaintenance.reduce((sum, m) => sum + m.totalCost, 0) / recentMaintenance.length
        : 5000; // Default estimate

      schedules.push({
        equipmentId: eq.id,
        equipmentName: eq.name,
        nextMaintenanceDate: eq.nextMaintenanceDate,
        daysUntilDue,
        isOverdue,
        maintenanceType: 'preventive',
        estimatedDurationHours: 4,
        estimatedCost: avgCost,
        priority,
        urgency: Math.min(100, urgency),
        taskDescription: `Scheduled preventive maintenance for ${eq.name}`,
        partsRequired: [],
        criticalityScore,
      });
    });

    // Sort by urgency descending
    return schedules.sort((a, b) => b.urgency - a.urgency);
  }

  /**
   * Calculate equipment performance metrics
   */
  static calculatePerformanceMetrics(
    equipment: Equipment,
    maintenanceRecords: MaintenanceRecord[],
    allocations: EquipmentAllocation[]
  ): EquipmentPerformance {
    // Calculate MTBF (Mean Time Between Failures)
    const breakdowns = maintenanceRecords.filter(m =>
      m.type === 'breakdown' && m.equipmentId === equipment.id
    );

    const mtbf = breakdowns.length > 0
      ? equipment.totalOperatingHours / breakdowns.length
      : equipment.totalOperatingHours || 10000; // Default if no breakdowns

    // Calculate MTTR (Mean Time To Repair)
    const completedRepairs = maintenanceRecords.filter(m =>
      m.equipmentId === equipment.id && m.status === 'completed'
    );

    const mttr = completedRepairs.length > 0
      ? completedRepairs.reduce((sum, m) => sum + m.durationHours, 0) / completedRepairs.length
      : 2; // Default 2 hours

    // Failure rate (failures per 1000 hours)
    const failureRate = (breakdowns.length / (equipment.totalOperatingHours || 1)) * 1000;

    // Calculate uptime/downtime
    const totalDowntime = maintenanceRecords
      .filter(m => m.equipmentId === equipment.id)
      .reduce((sum, m) => sum + m.downtimeHours, 0);

    const uptime = equipment.totalOperatingHours;
    const availability = uptime > 0
      ? (uptime / (uptime + totalDowntime)) * 100
      : 100;

    // Calculate costs
    const totalMaintenanceCost = equipment.totalMaintenanceCost || 0;
    const operatingHours = equipment.totalOperatingHours || 1;
    const costPerHour = (totalMaintenanceCost + (equipment.purchaseCost * 0.1)) / operatingHours;

    // Calculate health score (0-100)
    const conditionScore = equipment.condition;
    const availabilityScore = availability;
    const maintenanceScore = failureRate < 1 ? 100 : Math.max(0, 100 - failureRate * 10);
    const overallHealthScore = (conditionScore + availabilityScore + maintenanceScore) / 3;

    // Predict remaining life (simplified - based on condition and age)
    const ageInDays = this.daysBetween(equipment.purchaseDate, new Date());
    const expectedLifeDays = 3650; // 10 years
    const predictedRemainingLife = Math.max(0, expectedLifeDays - ageInDays);

    return {
      equipmentId: equipment.id,
      equipmentName: equipment.name,
      meanTimeBetweenFailures: mtbf,
      meanTimeToRepair: mttr,
      failureRate,
      uptime,
      downtime: totalDowntime,
      availability,
      operatingCost: equipment.purchaseCost * 0.1, // Placeholder
      maintenanceCost: totalMaintenanceCost,
      costPerHour,
      productivityScore: this.calculateProductivityScore(equipment, allocations),
      overallHealthScore,
      predictedRemainingLife,
    };
  }

  /**
   * Check operator certifications and generate alerts
   */
  static checkOperatorCertifications(
    certifications: OperatorCertification[]
  ): Array<{ operatorId: string; operatorName: string; daysUntilExpiry: number; status: string }> {
    const alerts: Array<{ operatorId: string; operatorName: string; daysUntilExpiry: number; status: string }> = [];
    const now = new Date();

    certifications.forEach(cert => {
      const daysUntilExpiry = this.daysBetween(now, cert.expiryDate);

      if (daysUntilExpiry < 0) {
        alerts.push({
          operatorId: cert.operatorId,
          operatorName: cert.operatorName,
          daysUntilExpiry,
          status: 'expired',
        });
      } else if (daysUntilExpiry < 30) {
        alerts.push({
          operatorId: cert.operatorId,
          operatorName: cert.operatorName,
          daysUntilExpiry,
          status: 'expiring_soon',
        });
      }
    });

    return alerts.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
  }

  /**
   * Optimize equipment allocation across projects
   */
  static optimizeAllocation(
    availableEquipment: Equipment[],
    projectDemands: Array<{
      projectId: string;
      equipmentCategory: EquipmentCategory;
      quantity: number;
      startDate: Date;
      endDate: Date;
    }>
  ): Array<{
    projectId: string;
    equipmentId: string;
    startDate: Date;
    endDate: Date;
    utilizationScore: number;
  }> {
    const allocations: Array<{
      projectId: string;
      equipmentId: string;
      startDate: Date;
      endDate: Date;
      utilizationScore: number;
    }> = [];

    // Simple allocation algorithm: match available equipment to demands
    // Priority: 1) Status, 2) Location proximity, 3) Condition

    projectDemands.forEach(demand => {
      const suitable = availableEquipment.filter(eq =>
        eq.category === demand.equipmentCategory &&
        eq.status === 'available'
      );

      // Sort by condition (best first)
      suitable.sort((a, b) => b.condition - a.condition);

      // Allocate top equipment
      const toAllocate = suitable.slice(0, demand.quantity);

      toAllocate.forEach(eq => {
        allocations.push({
          projectId: demand.projectId,
          equipmentId: eq.id,
          startDate: demand.startDate,
          endDate: demand.endDate,
          utilizationScore: 85, // Placeholder
        });
      });
    });

    return allocations;
  }

  // ===== HELPER METHODS =====

  private static daysBetween(date1: Date, date2: Date): number {
    const diff = date2.getTime() - date1.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  private static calculatePeriodUtilization(
    allocations: EquipmentAllocation[],
    periodDays: number,
    offsetDays: number = 0
  ): number {
    const now = new Date();
    const endDate = new Date(now.getTime() - offsetDays * 24 * 60 * 60 * 1000);
    const startDate = new Date(endDate.getTime() - periodDays * 24 * 60 * 60 * 1000);

    const periodAllocations = allocations.filter(a => {
      return a.startDate >= startDate && a.startDate <= endDate;
    });

    return periodAllocations.reduce((sum, a) => sum + a.actualHoursUsed, 0);
  }

  private static calculateCriticalityScore(equipment: Equipment): number {
    // Score based on: value (40%), condition (30%), usage (30%)
    const valueScore = Math.min(100, (equipment.currentValue / 1000000) * 40);
    const conditionScore = (equipment.condition / 100) * 30;
    const usageScore = Math.min(30, (equipment.averageHoursPerDay / 24) * 30);

    return valueScore + conditionScore + usageScore;
  }

  private static calculateProductivityScore(
    equipment: Equipment,
    allocations: EquipmentAllocation[]
  ): number {
    const recentAllocations = allocations
      .filter(a => a.equipmentId === equipment.id && a.status === 'completed')
      .slice(0, 10);

    if (recentAllocations.length === 0) return 75; // Default

    const avgUtilization = recentAllocations.reduce((sum, a) =>
      sum + a.utilizationRate, 0
    ) / recentAllocations.length;

    return Math.min(100, avgUtilization);
  }
}

export default EquipmentManagementService;
