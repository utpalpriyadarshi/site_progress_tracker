/**
 * DOORS Statistics Service
 *
 * Calculates statistics and KPIs for DOORS packages and requirements
 */

import DoorsPackageModel from '../../models/DoorsPackageModel';
import DoorsRequirementModel from '../../models/DoorsRequirementModel';
import type { DoorsStatistics } from '../../types/doors';

export interface DoorsKPIs {
  totalPackages: number;
  averageCompliance: number;
  criticalPackages: number;        // < 80% compliance
  approvedPackages: number;
  packagesWithPO: number;           // Has purchase order
  totalRequirements: number;
  compliantRequirements: number;
  pendingReview: number;            // Packages under review
  completionRate: number;           // % of packages closed
}

export class DoorsStatisticsService {
  /**
   * Calculate comprehensive DOORS statistics
   */
  static calculateStatistics(packages: DoorsPackageModel[]): DoorsStatistics {
    if (packages.length === 0) {
      return {
        totalPackages: 0,
        draftPackages: 0,
        underReviewPackages: 0,
        approvedPackages: 0,
        closedPackages: 0,
        averageCompliance: 0,
        criticalPackages: 0,
        totalRequirements: 0,
        compliantRequirements: 0,
      };
    }

    const draftPackages = packages.filter(p => p.status === 'draft').length;
    const underReviewPackages = packages.filter(p => p.status === 'under_review').length;
    const approvedPackages = packages.filter(p => p.status === 'approved').length;
    const closedPackages = packages.filter(p => p.status === 'closed').length;

    const totalRequirements = packages.reduce((sum, p) => sum + p.totalRequirements, 0);
    const compliantRequirements = packages.reduce((sum, p) => sum + p.compliantRequirements, 0);

    const averageCompliance = packages.reduce((sum, p) => sum + p.compliancePercentage, 0) / packages.length;
    const criticalPackages = packages.filter(p => p.compliancePercentage < 80).length;

    return {
      totalPackages: packages.length,
      draftPackages,
      underReviewPackages,
      approvedPackages,
      closedPackages,
      averageCompliance: Math.round(averageCompliance * 10) / 10,
      criticalPackages,
      totalRequirements,
      compliantRequirements,
    };
  }

  /**
   * Calculate KPIs for dashboard display
   */
  static calculateKPIs(packages: DoorsPackageModel[]): DoorsKPIs {
    if (packages.length === 0) {
      return {
        totalPackages: 0,
        averageCompliance: 0,
        criticalPackages: 0,
        approvedPackages: 0,
        packagesWithPO: 0,
        totalRequirements: 0,
        compliantRequirements: 0,
        pendingReview: 0,
        completionRate: 0,
      };
    }

    const approvedPackages = packages.filter(p => p.status === 'approved').length;
    const closedPackages = packages.filter(p => p.status === 'closed').length;
    const underReviewPackages = packages.filter(p => p.status === 'under_review').length;
    const packagesWithPO = packages.filter(p => p.poNo && p.poNo.trim() !== '').length;

    const totalRequirements = packages.reduce((sum, p) => sum + p.totalRequirements, 0);
    const compliantRequirements = packages.reduce((sum, p) => sum + p.compliantRequirements, 0);

    const averageCompliance = packages.reduce((sum, p) => sum + p.compliancePercentage, 0) / packages.length;
    const criticalPackages = packages.filter(p => p.compliancePercentage < 80).length;

    const completionRate = packages.length > 0 ? (closedPackages / packages.length) * 100 : 0;

    return {
      totalPackages: packages.length,
      averageCompliance: Math.round(averageCompliance * 10) / 10,
      criticalPackages,
      approvedPackages,
      packagesWithPO,
      totalRequirements,
      compliantRequirements,
      pendingReview: underReviewPackages,
      completionRate: Math.round(completionRate),
    };
  }

  /**
   * Get packages by priority
   */
  static getPackagesByPriority(packages: DoorsPackageModel[]): {
    high: number;
    medium: number;
    low: number;
  } {
    return {
      high: packages.filter(p => p.priority === 'high').length,
      medium: packages.filter(p => p.priority === 'medium').length,
      low: packages.filter(p => p.priority === 'low').length,
    };
  }

  /**
   * Get packages by category
   */
  static getPackagesByCategory(packages: DoorsPackageModel[]): Map<string, number> {
    const categoryMap = new Map<string, number>();

    packages.forEach(pkg => {
      const count = categoryMap.get(pkg.category) || 0;
      categoryMap.set(pkg.category, count + 1);
    });

    return categoryMap;
  }

  /**
   * Get critical packages (< 80% compliance)
   */
  static getCriticalPackages(packages: DoorsPackageModel[]): DoorsPackageModel[] {
    return packages
      .filter(p => p.compliancePercentage < 80)
      .sort((a, b) => a.compliancePercentage - b.compliancePercentage);
  }

  /**
   * Get high priority packages
   */
  static getHighPriorityPackages(packages: DoorsPackageModel[]): DoorsPackageModel[] {
    return packages
      .filter(p => p.priority === 'high')
      .sort((a, b) => a.compliancePercentage - b.compliancePercentage);
  }

  /**
   * Get packages pending procurement (approved but no PO)
   */
  static getPackagesPendingProcurement(packages: DoorsPackageModel[]): DoorsPackageModel[] {
    return packages.filter(
      p => p.status === 'approved' && (!p.poNo || p.poNo.trim() === '')
    );
  }

  /**
   * Calculate category-wise compliance
   */
  static getCategoryCompliance(packages: DoorsPackageModel[]): Map<string, number> {
    const categoryMap = new Map<string, { total: number; compliant: number }>();

    packages.forEach(pkg => {
      const existing = categoryMap.get(pkg.category) || { total: 0, compliant: 0 };
      categoryMap.set(pkg.category, {
        total: existing.total + pkg.totalRequirements,
        compliant: existing.compliant + pkg.compliantRequirements,
      });
    });

    const complianceMap = new Map<string, number>();
    categoryMap.forEach((value, key) => {
      const compliance = value.total > 0 ? (value.compliant / value.total) * 100 : 0;
      complianceMap.set(key, Math.round(compliance * 10) / 10);
    });

    return complianceMap;
  }

  /**
   * Get procurement readiness (packages ready for procurement)
   */
  static getProcurementReadiness(packages: DoorsPackageModel[]): {
    readyForRFQ: number;
    readyForPO: number;
    awaitingDelivery: number;
  } {
    const readyForRFQ = packages.filter(
      p => p.status === 'approved' && (!p.rfqNo || p.rfqNo.trim() === '')
    ).length;

    const readyForPO = packages.filter(
      p => p.rfqNo && p.rfqNo.trim() !== '' && (!p.poNo || p.poNo.trim() === '')
    ).length;

    const awaitingDelivery = packages.filter(
      p => p.poNo && p.poNo.trim() !== '' && p.deliveryStatus !== 'delivered'
    ).length;

    return {
      readyForRFQ,
      readyForPO,
      awaitingDelivery,
    };
  }
}

export default DoorsStatisticsService;
