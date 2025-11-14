import { database } from '../../models/database';
import DoorsPackageModel from '../../models/DoorsPackageModel';
import DoorsRequirementModel from '../../models/DoorsRequirementModel';

/**
 * DoorsEditService - Service for editing DOORS packages and requirements
 *
 * Handles all edit operations for DOORS with:
 * - Validation
 * - Audit trail tracking
 * - Statistics recalculation
 * - Optimistic locking (version-based conflict detection)
 *
 * Phase 3: Activity 4 - DOORS Advanced Features
 */

export interface PackageEditData {
  equipmentName?: string;
  category?: string;
  equipmentType?: string;
  status?: string;
  priority?: string;
  quantity?: number;
  unit?: string;
  specificationRef?: string;
  drawingRef?: string;
  assignedTo?: string;
}

export interface RequirementEditData {
  complianceStatus?: string; // 'compliant', 'non_compliant', 'partial', 'not_verified'
  compliancePercentage?: number; // For partial compliance (0-100)
  vendorResponse?: string;
  reviewStatus?: string; // 'pending', 'approved', 'rejected', 'clarification_needed'
  reviewComments?: string;
  verificationMethod?: string;
  verificationStatus?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: { [field: string]: string };
}

class DoorsEditService {
  private doorsPackagesCollection = database.collections.get<DoorsPackageModel>('doors_packages');
  private doorsRequirementsCollection = database.collections.get<DoorsRequirementModel>('doors_requirements');

  /**
   * Validate package edit data
   */
  validatePackageEdit(data: PackageEditData): ValidationResult {
    const errors: { [field: string]: string } = {};

    // Equipment name validation
    if (data.equipmentName !== undefined) {
      if (!data.equipmentName || data.equipmentName.trim().length === 0) {
        errors.equipmentName = 'Equipment name is required';
      } else if (data.equipmentName.length > 100) {
        errors.equipmentName = 'Equipment name must be less than 100 characters';
      }
    }

    // Category validation
    if (data.category !== undefined) {
      const validCategories = ['OHE', 'TSS', 'SCADA', 'Cables', 'Hardware', 'Consumables'];
      if (!validCategories.includes(data.category)) {
        errors.category = `Category must be one of: ${validCategories.join(', ')}`;
      }
    }

    // Status validation
    if (data.status !== undefined) {
      const validStatuses = ['draft', 'under_review', 'approved', 'closed'];
      if (!validStatuses.includes(data.status)) {
        errors.status = `Status must be one of: ${validStatuses.join(', ')}`;
      }
    }

    // Priority validation
    if (data.priority !== undefined) {
      const validPriorities = ['high', 'medium', 'low'];
      if (!validPriorities.includes(data.priority)) {
        errors.priority = `Priority must be one of: ${validPriorities.join(', ')}`;
      }
    }

    // Quantity validation
    if (data.quantity !== undefined) {
      if (data.quantity <= 0) {
        errors.quantity = 'Quantity must be greater than 0';
      }
    }

    // Unit validation
    if (data.unit !== undefined) {
      if (!data.unit || data.unit.trim().length === 0) {
        errors.unit = 'Unit is required';
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  /**
   * Validate requirement edit data
   */
  validateRequirementEdit(data: RequirementEditData): ValidationResult {
    const errors: { [field: string]: string } = {};

    // Compliance status validation
    if (data.complianceStatus !== undefined) {
      const validStatuses = ['compliant', 'non_compliant', 'partial', 'not_verified'];
      if (!validStatuses.includes(data.complianceStatus)) {
        errors.complianceStatus = `Compliance status must be one of: ${validStatuses.join(', ')}`;
      }
    }

    // Compliance percentage validation
    if (data.compliancePercentage !== undefined) {
      if (data.compliancePercentage < 0 || data.compliancePercentage > 100) {
        errors.compliancePercentage = 'Compliance percentage must be between 0 and 100';
      }
    }

    // Review status validation
    if (data.reviewStatus !== undefined) {
      const validReviewStatuses = ['pending', 'approved', 'rejected', 'clarification_needed'];
      if (!validReviewStatuses.includes(data.reviewStatus)) {
        errors.reviewStatus = `Review status must be one of: ${validReviewStatuses.join(', ')}`;
      }
    }

    // Verification method validation
    if (data.verificationMethod !== undefined) {
      const validMethods = ['test', 'inspection', 'calculation', 'certificate'];
      if (!validMethods.includes(data.verificationMethod)) {
        errors.verificationMethod = `Verification method must be one of: ${validMethods.join(', ')}`;
      }
    }

    // Verification status validation
    if (data.verificationStatus !== undefined) {
      const validVerificationStatuses = ['pending', 'verified', 'failed'];
      if (!validVerificationStatuses.includes(data.verificationStatus)) {
        errors.verificationStatus = `Verification status must be one of: ${validVerificationStatuses.join(', ')}`;
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  /**
   * Check if user can edit a DOORS package
   * Supervisors can edit anything, regular users can only edit drafts
   */
  canEditPackage(userRole: string, packageStatus: string): boolean {
    // Supervisors can edit anything
    if (userRole === 'Supervisor') return true;

    // Regular users can only edit draft packages
    if (packageStatus === 'draft') return true;

    // Can't edit approved or closed packages
    return false;
  }

  /**
   * Update a DOORS package
   *
   * @param packageId - Package ID to update
   * @param updates - Partial package data to update
   * @param userId - User ID making the edit
   * @param userRole - User role for permission check
   * @returns Updated package
   * @throws Error if validation fails or user doesn't have permission
   */
  async updatePackage(
    packageId: string,
    updates: PackageEditData,
    userId: string,
    userRole: string
  ): Promise<DoorsPackageModel> {
    // Validate updates
    const validation = this.validatePackageEdit(updates);
    if (!validation.isValid) {
      const errorMessages = Object.values(validation.errors).join(', ');
      throw new Error(`Validation failed: ${errorMessages}`);
    }

    return await database.write(async () => {
      const pkg = await this.doorsPackagesCollection.find(packageId);

      // Check permissions
      if (!this.canEditPackage(userRole, pkg.status)) {
        throw new Error(
          `You don't have permission to edit this package. Status: ${pkg.status}. Only Supervisors can edit approved or closed packages.`
        );
      }

      // Update the package
      const updatedPackage = await pkg.update(p => {
        // Apply updates
        if (updates.equipmentName !== undefined) p.equipmentName = updates.equipmentName;
        if (updates.category !== undefined) p.category = updates.category;
        if (updates.equipmentType !== undefined) p.equipmentType = updates.equipmentType;
        if (updates.status !== undefined) p.status = updates.status;
        if (updates.priority !== undefined) p.priority = updates.priority;
        if (updates.quantity !== undefined) p.quantity = updates.quantity;
        if (updates.unit !== undefined) p.unit = updates.unit;
        if (updates.specificationRef !== undefined) p.specificationRef = updates.specificationRef;
        if (updates.drawingRef !== undefined) p.drawingRef = updates.drawingRef;
        if (updates.assignedTo !== undefined) p.assignedTo = updates.assignedTo;

        // Update audit trail
        p.lastModifiedAt = Date.now();
        p.modifiedById = userId;
        p.updatedAt = Date.now();

        // Increment version for optimistic locking
        p.version = (p.version || 0) + 1;

        // Update sync status
        p.appSyncStatus = 'pending';
      });

      console.log('[DoorsEditService] Package updated successfully:', updatedPackage.id);
      return updatedPackage;
    });
  }

  /**
   * Update a DOORS requirement
   *
   * @param requirementId - Requirement ID to update
   * @param updates - Partial requirement data to update
   * @param userId - User ID making the edit
   * @param userRole - User role for permission check
   * @returns Updated requirement
   * @throws Error if validation fails
   */
  async updateRequirement(
    requirementId: string,
    updates: RequirementEditData,
    userId: string,
    userRole: string
  ): Promise<DoorsRequirementModel> {
    // Validate updates
    const validation = this.validateRequirementEdit(updates);
    if (!validation.isValid) {
      const errorMessages = Object.values(validation.errors).join(', ');
      throw new Error(`Validation failed: ${errorMessages}`);
    }

    return await database.write(async () => {
      const requirement = await this.doorsRequirementsCollection.find(requirementId);

      // Get parent package for permission check
      const pkg = await requirement.package.fetch();
      if (!this.canEditPackage(userRole, pkg.status)) {
        throw new Error(
          `You don't have permission to edit requirements in this package. Package status: ${pkg.status}`
        );
      }

      // Update the requirement
      const updatedRequirement = await requirement.update(r => {
        // Apply updates
        if (updates.complianceStatus !== undefined) r.complianceStatus = updates.complianceStatus;
        if (updates.compliancePercentage !== undefined) r.compliancePercentage = updates.compliancePercentage;
        if (updates.vendorResponse !== undefined) r.vendorResponse = updates.vendorResponse;
        if (updates.reviewStatus !== undefined) r.reviewStatus = updates.reviewStatus;
        if (updates.reviewComments !== undefined) r.reviewComments = updates.reviewComments;
        if (updates.verificationMethod !== undefined) r.verificationMethod = updates.verificationMethod;
        if (updates.verificationStatus !== undefined) r.verificationStatus = updates.verificationStatus;

        // Update review timestamp if review status changes
        if (updates.reviewStatus !== undefined) {
          r.reviewedAt = Date.now();
          r.reviewedBy = userId;
        }

        // Update audit trail
        r.lastModifiedAt = Date.now();
        r.modifiedById = userId;
        r.updatedAt = Date.now();

        // Increment version
        r.version = (r.version || 0) + 1;

        // Update sync status
        r.appSyncStatus = 'pending';
      });

      // Recalculate package statistics if compliance status changed
      if (updates.complianceStatus !== undefined || updates.compliancePercentage !== undefined) {
        await this.recalculatePackageStatistics(pkg.id);
      }

      return updatedRequirement;
    });
  }

  /**
   * Recalculate compliance statistics for a package
   * Called after requirement updates that affect compliance
   */
  async recalculatePackageStatistics(packageId: string): Promise<void> {
    await database.write(async () => {
      const pkg = await this.doorsPackagesCollection.find(packageId);
      const requirements = await pkg.requirements.fetch();

      // Count compliant requirements
      let compliantCount = 0;
      let technicalCompliant = 0;
      let technicalTotal = 0;
      let datasheetCompliant = 0;
      let datasheetTotal = 0;
      let typeTestCompliant = 0;
      let typeTestTotal = 0;
      let routineTestCompliant = 0;
      let routineTestTotal = 0;
      let siteReqCompliant = 0;
      let siteReqTotal = 0;

      for (const req of requirements) {
        const isCompliant = req.complianceStatus === 'compliant';
        if (isCompliant) compliantCount++;

        // Category-wise compliance
        if (req.category === 'technical') {
          technicalTotal++;
          if (isCompliant) technicalCompliant++;
        } else if (req.category === 'datasheet') {
          datasheetTotal++;
          if (isCompliant) datasheetCompliant++;
        } else if (req.category === 'type_test') {
          typeTestTotal++;
          if (isCompliant) typeTestCompliant++;
        } else if (req.category === 'routine_test') {
          routineTestTotal++;
          if (isCompliant) routineTestCompliant++;
        } else if (req.category === 'site') {
          siteReqTotal++;
          if (isCompliant) siteReqCompliant++;
        }
      }

      const totalRequirements = requirements.length;
      const compliancePercentage = totalRequirements > 0
        ? (compliantCount / totalRequirements) * 100
        : 0;

      // Update package statistics
      await pkg.update(p => {
        p.totalRequirements = totalRequirements;
        p.compliantRequirements = compliantCount;
        p.compliancePercentage = Math.round(compliancePercentage * 10) / 10; // Round to 1 decimal

        // Update category-wise compliance
        p.technicalReqCompliance = technicalTotal > 0
          ? Math.round((technicalCompliant / technicalTotal) * 1000) / 10
          : 0;
        p.datasheetCompliance = datasheetTotal > 0
          ? Math.round((datasheetCompliant / datasheetTotal) * 1000) / 10
          : 0;
        p.typeTestCompliance = typeTestTotal > 0
          ? Math.round((typeTestCompliant / typeTestTotal) * 1000) / 10
          : 0;
        p.routineTestCompliance = routineTestTotal > 0
          ? Math.round((routineTestCompliant / routineTestTotal) * 1000) / 10
          : 0;
        p.siteReqCompliance = siteReqTotal > 0
          ? Math.round((siteReqCompliant / siteReqTotal) * 1000) / 10
          : 0;

        p.updatedAt = Date.now();
        p.version = (p.version || 0) + 1;
        p.appSyncStatus = 'pending';
      });
    });
  }

  /**
   * Get edit history for a package
   * Returns metadata about last modification
   */
  async getPackageEditHistory(packageId: string): Promise<{
    lastModifiedAt?: number;
    modifiedBy?: string;
    version: number;
  }> {
    const pkg = await this.doorsPackagesCollection.find(packageId);
    return {
      lastModifiedAt: pkg.lastModifiedAt,
      modifiedBy: pkg.modifiedById,
      version: pkg.version,
    };
  }

  /**
   * Get edit history for a requirement
   */
  async getRequirementEditHistory(requirementId: string): Promise<{
    lastModifiedAt?: number;
    modifiedBy?: string;
    version: number;
  }> {
    const req = await this.doorsRequirementsCollection.find(requirementId);
    return {
      lastModifiedAt: req.lastModifiedAt,
      modifiedBy: req.modifiedById,
      version: req.version,
    };
  }
}

export default new DoorsEditService();
