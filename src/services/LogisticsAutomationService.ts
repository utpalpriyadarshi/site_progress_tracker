/**
 * LogisticsAutomationService - Week 7
 *
 * Workflow automation and intelligent triggers:
 * - Material shortage → Auto purchase suggestion
 * - Equipment maintenance → Schedule impact analysis
 * - Delivery delay → Project timeline adjustment
 * - Inventory low → Reorder automation
 * - BOM approval → Material procurement trigger
 * - Exception management with auto-escalation
 */

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type AutomationTriggerType =
  | 'material_shortage'
  | 'equipment_maintenance_due'
  | 'delivery_delay'
  | 'inventory_low'
  | 'bom_approved'
  | 'cost_threshold_exceeded'
  | 'quality_issue'
  | 'supplier_delay';

export type AutomationActionType =
  | 'create_purchase_order'
  | 'send_notification'
  | 'update_schedule'
  | 'escalate_issue'
  | 'request_approval'
  | 'adjust_inventory'
  | 'assign_resource'
  | 'create_task';

export type AutomationStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';

export type EscalationLevel = 'team_lead' | 'manager' | 'director' | 'executive';

export type NotificationChannel = 'push' | 'email' | 'sms' | 'in_app';

export type NotificationPriority = 'critical' | 'high' | 'medium' | 'low';

export interface AutomationRule {
  id: string;
  name: string;
  description: string;

  // Trigger configuration
  triggerType: AutomationTriggerType;
  triggerConditions: TriggerCondition[];

  // Action configuration
  actions: AutomationAction[];

  // Settings
  enabled: boolean;
  priority: number; // 1-10, higher = more important
  retryOnFailure: boolean;
  maxRetries: number;

  // Metadata
  createdAt: string;
  createdBy: string;
  lastTriggered?: string;
  triggerCount: number;
}

export interface TriggerCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'in_range';
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

export interface AutomationAction {
  type: AutomationActionType;
  config: Record<string, any>;
  delaySeconds?: number; // Delay before executing
  requiresApproval?: boolean;
  approvers?: string[];
}

export interface AutomationExecution {
  id: string;
  ruleId: string;
  ruleName: string;

  // Trigger details
  triggeredBy: AutomationTriggerType;
  triggerData: Record<string, any>;
  triggeredAt: string;

  // Execution
  status: AutomationStatus;
  actions: ActionExecution[];

  // Results
  startedAt?: string;
  completedAt?: string;
  duration?: number; // seconds
  success: boolean;
  errorMessage?: string;

  // Retry
  retryCount: number;
  nextRetryAt?: string;
}

export interface ActionExecution {
  actionType: AutomationActionType;
  status: AutomationStatus;
  startedAt?: string;
  completedAt?: string;
  result?: any;
  error?: string;
}

// Material Shortage Automation
export interface MaterialShortageAutomation {
  materialId: string;
  materialName: string;
  currentQuantity: number;
  requiredQuantity: number;
  shortageAmount: number;
  urgency: 'critical' | 'high' | 'medium' | 'low';

  // Suggested action
  suggestedAction: 'immediate_purchase' | 'expedite_delivery' | 'find_alternative' | 'adjust_schedule';
  purchaseOrder: {
    supplierId: string;
    supplierName: string;
    quantity: number;
    estimatedCost: number;
    estimatedDelivery: string;
    priority: 'rush' | 'normal';
  };

  // Impact
  affectedProjects: string[];
  impactScore: number; // 0-100

  // Automation
  autoApproved: boolean;
  approvalRequired: boolean;
  notificationsSent: string[];
}

// Equipment Maintenance Automation
export interface MaintenanceImpactAnalysis {
  equipmentId: string;
  equipmentName: string;
  maintenanceType: 'preventive' | 'corrective' | 'inspection';
  scheduledDate: string;
  estimatedDuration: number; // hours

  // Schedule impact
  affectedAllocations: EquipmentAllocation[];
  impactedProjects: ProjectImpact[];
  totalDowntimeHours: number;

  // Recommendations
  recommendations: MaintenanceRecommendation[];
  alternativeEquipment: AlternativeEquipment[];

  // Automation
  scheduleAdjustmentsApplied: boolean;
  notificationsScheduled: NotificationSchedule[];
}

export interface EquipmentAllocation {
  allocationId: string;
  projectId: string;
  projectName: string;
  siteId: string;
  startDate: string;
  endDate: string;
  conflict: boolean;
}

export interface ProjectImpact {
  projectId: string;
  projectName: string;
  delayDays: number;
  criticalPath: boolean;
  mitigationRequired: boolean;
}

export interface MaintenanceRecommendation {
  type: 'reschedule' | 'use_alternative' | 'adjust_project' | 'expedite_maintenance';
  description: string;
  impact: 'minimal' | 'moderate' | 'significant';
  cost: number;
  feasibility: 'high' | 'medium' | 'low';
}

export interface AlternativeEquipment {
  equipmentId: string;
  equipmentName: string;
  availability: boolean;
  capability: number; // 0-100% match
  additionalCost: number;
  location: string;
}

// Delivery Delay Automation
export interface DeliveryDelayAutomation {
  deliveryId: string;
  deliveryNumber: string;
  materialId: string;
  materialName: string;

  // Delay details
  originalDeliveryDate: string;
  newDeliveryDate: string;
  delayDays: number;
  delayReason: string;

  // Impact
  affectedProjects: ProjectTimelineAdjustment[];
  criticalPathImpacted: boolean;
  cascadingDelays: CascadingDelay[];

  // Automation
  timelineAdjustments: TimelineAdjustment[];
  notificationsSent: string[];
  escalationTriggered: boolean;
  escalationLevel?: EscalationLevel;

  // Mitigation
  mitigationActions: MitigationAction[];
  alternativeSourcesChecked: boolean;
  expeditingOptions: ExpeditingOption[];
}

export interface ProjectTimelineAdjustment {
  projectId: string;
  projectName: string;
  impactedTasks: string[];
  delayDays: number;
  newCompletionDate: string;
  stakeholdersNotified: boolean;
}

export interface CascadingDelay {
  dependentDeliveryId: string;
  materialName: string;
  additionalDelayDays: number;
}

export interface TimelineAdjustment {
  taskId: string;
  taskName: string;
  originalDate: string;
  adjustedDate: string;
  approved: boolean;
}

export interface MitigationAction {
  action: string;
  cost: number;
  timeReduction: number; // days
  feasibility: 'high' | 'medium' | 'low';
  requiresApproval: boolean;
}

export interface ExpeditingOption {
  description: string;
  additionalCost: number;
  timeReduction: number; // days
  available: boolean;
}

// Inventory Reorder Automation
export interface InventoryReorderAutomation {
  materialId: string;
  materialName: string;

  // Inventory status
  currentLevel: number;
  reorderPoint: number;
  safetyStock: number;
  optimalLevel: number;

  // Reorder calculation
  reorderQuantity: number;
  reorderUrgency: 'immediate' | 'urgent' | 'normal';
  estimatedStockoutDate?: string;

  // Supplier selection
  recommendedSupplier: {
    supplierId: string;
    supplierName: string;
    unitPrice: number;
    leadTime: number;
    reliability: number;
    totalCost: number;
  };
  alternativeSuppliers: any[];

  // Automation
  autoOrderEnabled: boolean;
  orderPlaced: boolean;
  orderId?: string;
  approvalStatus: 'auto_approved' | 'pending_approval' | 'approved' | 'rejected';
}

// BOM Approval Automation
export interface BOMApprovalAutomation {
  bomId: string;
  bomName: string;
  projectId: string;
  projectName: string;

  // BOM details
  totalItems: number;
  totalCost: number;
  approvedAt: string;
  approvedBy: string;

  // Procurement trigger
  procurementTriggered: boolean;
  purchaseOrders: PurchaseOrderTrigger[];

  // Material allocation
  materialsAllocated: boolean;
  allocationDetails: MaterialAllocation[];

  // Timeline impact
  procurementStartDate: string;
  estimatedDeliveryDate: string;
  projectTimelineUpdated: boolean;
}

export interface PurchaseOrderTrigger {
  materialId: string;
  materialName: string;
  quantity: number;
  supplierId: string;
  supplierName: string;
  estimatedCost: number;
  priority: 'rush' | 'normal';
  poNumber?: string;
  status: 'created' | 'sent' | 'confirmed';
}

export interface MaterialAllocation {
  materialId: string;
  materialName: string;
  allocatedQuantity: number;
  source: 'existing_stock' | 'new_order';
  availabilityDate: string;
}

// Exception Management
export interface ExceptionCase {
  id: string;
  type: 'material_unavailable' | 'equipment_breakdown' | 'supplier_failure' | 'quality_issue' | 'cost_overrun' | 'timeline_risk';
  severity: 'critical' | 'high' | 'medium' | 'low';

  // Details
  title: string;
  description: string;
  detectedAt: string;
  detectedBy: 'system' | 'user' | 'integration';

  // Context
  relatedEntityType: 'material' | 'equipment' | 'delivery' | 'project' | 'supplier';
  relatedEntityId: string;
  affectedProjects: string[];

  // Status
  status: 'open' | 'investigating' | 'resolving' | 'resolved' | 'escalated';
  assignedTo?: string;
  escalationLevel?: EscalationLevel;

  // Resolution
  resolutionStrategy?: ResolutionStrategy;
  alternativeOptions: AlternativeOption[];
  contingencyPlans: ContingencyPlan[];

  // Timeline
  slaDeadline: string;
  resolvedAt?: string;
  resolutionTime?: number; // minutes
}

export interface ResolutionStrategy {
  strategy: string;
  steps: string[];
  estimatedTime: number; // hours
  cost: number;
  riskLevel: 'low' | 'medium' | 'high';
  approved: boolean;
}

export interface AlternativeOption {
  option: string;
  description: string;
  cost: number;
  timeline: string;
  feasibility: 'high' | 'medium' | 'low';
  pros: string[];
  cons: string[];
}

export interface ContingencyPlan {
  scenario: string;
  triggerConditions: string[];
  actions: string[];
  resources: string[];
  estimatedCost: number;
  activationThreshold: number; // 0-100
}

// Escalation
export interface EscalationRule {
  id: string;
  name: string;
  triggerType: string;

  // Conditions
  severity: 'critical' | 'high' | 'medium' | 'low';
  timeThreshold: number; // minutes before escalation
  costThreshold?: number;

  // Escalation path
  escalationLevels: EscalationStep[];

  // Settings
  enabled: boolean;
  notifyAll: boolean; // Notify all levels simultaneously or sequentially
}

export interface EscalationStep {
  level: EscalationLevel;
  recipients: string[];
  channels: NotificationChannel[];
  delayMinutes: number; // Delay before this level
  requiresResponse: boolean;
}

// Notification
export interface NotificationSchedule {
  id: string;
  recipient: string;
  recipientRole?: string;

  // Message
  title: string;
  message: string;
  data?: Record<string, any>;

  // Delivery
  channels: NotificationChannel[];
  priority: NotificationPriority;
  scheduledFor: string;

  // Status
  sent: boolean;
  sentAt?: string;
  delivered: boolean;
  read: boolean;

  // Actions
  actionable: boolean;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  label: string;
  action: string;
  url?: string;
  requiresConfirmation: boolean;
}

// ============================================================================
// SERVICE CLASS
// ============================================================================

export class LogisticsAutomationService {
  private static automationRules: AutomationRule[] = [];
  private static executions: AutomationExecution[] = [];
  private static exceptionCases: ExceptionCase[] = [];

  // -------------------------------------------------------------------------
  // Rule Management
  // -------------------------------------------------------------------------

  /**
   * Register a new automation rule
   */
  static registerRule(rule: AutomationRule): void {
    this.automationRules.push(rule);
  }

  /**
   * Get all automation rules
   */
  static getRules(): AutomationRule[] {
    return this.automationRules.filter(r => r.enabled);
  }

  /**
   * Evaluate if conditions are met for a rule
   */
  static evaluateConditions(
    conditions: TriggerCondition[],
    data: Record<string, any>
  ): boolean {
    if (conditions.length === 0) return true;

    let result = true;
    let currentOperator: 'AND' | 'OR' = 'AND';

    for (const condition of conditions) {
      const value = data[condition.field];
      let conditionMet = false;

      switch (condition.operator) {
        case 'equals':
          conditionMet = value === condition.value;
          break;
        case 'not_equals':
          conditionMet = value !== condition.value;
          break;
        case 'greater_than':
          conditionMet = value > condition.value;
          break;
        case 'less_than':
          conditionMet = value < condition.value;
          break;
        case 'contains':
          conditionMet = String(value).includes(String(condition.value));
          break;
        case 'in_range':
          const [min, max] = condition.value;
          conditionMet = value >= min && value <= max;
          break;
      }

      // Apply logical operator
      if (currentOperator === 'AND') {
        result = result && conditionMet;
      } else {
        result = result || conditionMet;
      }

      currentOperator = condition.logicalOperator || 'AND';
    }

    return result;
  }

  // -------------------------------------------------------------------------
  // Material Shortage Automation
  // -------------------------------------------------------------------------

  /**
   * Handle material shortage and auto-create purchase suggestions
   */
  static handleMaterialShortage(
    materialId: string,
    materialName: string,
    currentQuantity: number,
    requiredQuantity: number,
    projectId: string
  ): MaterialShortageAutomation {
    const shortageAmount = requiredQuantity - currentQuantity;

    // Calculate urgency
    const shortagePercentage = (shortageAmount / requiredQuantity) * 100;
    const urgency: 'critical' | 'high' | 'medium' | 'low' =
      shortagePercentage > 75 ? 'critical' :
      shortagePercentage > 50 ? 'high' :
      shortagePercentage > 25 ? 'medium' :
      'low';

    // Determine suggested action
    const suggestedAction: any =
      urgency === 'critical' ? 'immediate_purchase' :
      urgency === 'high' ? 'expedite_delivery' :
      'immediate_purchase';

    // Create purchase order suggestion (would integrate with actual supplier data)
    const purchaseOrder = {
      supplierId: 's1',
      supplierName: 'Primary Supplier',
      quantity: shortageAmount * 1.1, // Add 10% buffer
      estimatedCost: shortageAmount * 100, // Mock cost
      estimatedDelivery: this.addDays(new Date(), urgency === 'critical' ? 3 : 7).toISOString(),
      priority: urgency === 'critical' || urgency === 'high' ? 'rush' as const : 'normal' as const,
    };

    // Auto-approve for low-cost, low-urgency items
    const autoApproved = purchaseOrder.estimatedCost < 10000 && urgency !== 'critical';
    const approvalRequired = !autoApproved;

    // Create notifications
    const notificationsSent = urgency === 'critical'
      ? ['procurement_team', 'project_manager', 'logistics_lead']
      : ['procurement_team'];

    return {
      materialId,
      materialName,
      currentQuantity,
      requiredQuantity,
      shortageAmount,
      urgency,
      suggestedAction,
      purchaseOrder,
      affectedProjects: [projectId],
      impactScore: shortagePercentage,
      autoApproved,
      approvalRequired,
      notificationsSent,
    };
  }

  /**
   * Analyze equipment maintenance impact on schedule
   */
  static analyzeMaintenanceImpact(
    equipmentId: string,
    equipmentName: string,
    maintenanceDate: string,
    estimatedDuration: number,
    currentAllocations: any[]
  ): MaintenanceImpactAnalysis {
    // Find conflicting allocations
    const maintenanceStart = new Date(maintenanceDate);
    const maintenanceEnd = this.addHours(maintenanceStart, estimatedDuration);

    const affectedAllocations: EquipmentAllocation[] = currentAllocations
      .filter(alloc => {
        const allocStart = new Date(alloc.startDate);
        const allocEnd = new Date(alloc.endDate);
        return this.datesOverlap(maintenanceStart, maintenanceEnd, allocStart, allocEnd);
      })
      .map(alloc => ({
        allocationId: alloc.id,
        projectId: alloc.projectId,
        projectName: alloc.projectName || 'Unknown Project',
        siteId: alloc.siteId,
        startDate: alloc.startDate,
        endDate: alloc.endDate,
        conflict: true,
      }));

    // Calculate project impacts
    const impactedProjects: ProjectImpact[] = affectedAllocations.map(alloc => ({
      projectId: alloc.projectId,
      projectName: alloc.projectName,
      delayDays: Math.ceil(estimatedDuration / 24), // Convert hours to days
      criticalPath: Math.random() > 0.5, // Mock: would check actual critical path
      mitigationRequired: true,
    }));

    // Generate recommendations
    const recommendations: MaintenanceRecommendation[] = [
      {
        type: 'reschedule',
        description: 'Reschedule maintenance to avoid project conflicts',
        impact: 'minimal',
        cost: 0,
        feasibility: 'high',
      },
      {
        type: 'use_alternative',
        description: 'Use alternative equipment during maintenance',
        impact: 'moderate',
        cost: 500,
        feasibility: 'medium',
      },
    ];

    // Find alternative equipment (mock)
    const alternativeEquipment: AlternativeEquipment[] = [
      {
        equipmentId: 'alt-1',
        equipmentName: 'Backup ' + equipmentName,
        availability: true,
        capability: 85,
        additionalCost: 500,
        location: 'Central Warehouse',
      },
    ];

    // Schedule notifications
    const notificationsScheduled: NotificationSchedule[] = affectedAllocations.map(alloc => ({
      id: `notif-${alloc.allocationId}`,
      recipient: 'project_manager',
      title: 'Equipment Maintenance Scheduled',
      message: `${equipmentName} scheduled for maintenance on ${maintenanceDate}. Your project may be affected.`,
      channels: ['email', 'in_app'] as NotificationChannel[],
      priority: 'high' as NotificationPriority,
      scheduledFor: this.addDays(new Date(maintenanceDate), -3).toISOString(), // 3 days notice
      sent: false,
      delivered: false,
      read: false,
      actionable: true,
      actions: [
        {
          label: 'View Alternatives',
          action: 'view_alternatives',
          requiresConfirmation: false,
        },
        {
          label: 'Request Reschedule',
          action: 'request_reschedule',
          requiresConfirmation: true,
        },
      ],
    }));

    return {
      equipmentId,
      equipmentName,
      maintenanceType: 'preventive',
      scheduledDate: maintenanceDate,
      estimatedDuration,
      affectedAllocations,
      impactedProjects,
      totalDowntimeHours: estimatedDuration,
      recommendations,
      alternativeEquipment,
      scheduleAdjustmentsApplied: false,
      notificationsScheduled,
    };
  }

  /**
   * Handle delivery delay and auto-adjust project timelines
   */
  static handleDeliveryDelay(
    deliveryId: string,
    deliveryNumber: string,
    materialId: string,
    materialName: string,
    originalDate: string,
    newDate: string,
    delayReason: string,
    affectedProjectIds: string[]
  ): DeliveryDelayAutomation {
    const delayDays = this.daysBetween(new Date(originalDate), new Date(newDate));

    // Calculate project impacts
    const affectedProjects: ProjectTimelineAdjustment[] = affectedProjectIds.map(projectId => ({
      projectId,
      projectName: `Project ${projectId}`,
      impactedTasks: ['foundation', 'framing'], // Mock
      delayDays,
      newCompletionDate: this.addDays(new Date(), 30 + delayDays).toISOString(),
      stakeholdersNotified: false,
    }));

    // Check for cascading delays
    const cascadingDelays: CascadingDelay[] = [];

    // Timeline adjustments
    const timelineAdjustments: TimelineAdjustment[] = affectedProjects.flatMap(project =>
      project.impactedTasks.map(taskId => ({
        taskId,
        taskName: `Task ${taskId}`,
        originalDate: this.addDays(new Date(), 15).toISOString(),
        adjustedDate: this.addDays(new Date(), 15 + delayDays).toISOString(),
        approved: false,
      }))
    );

    // Determine escalation
    const criticalPathImpacted = delayDays > 5;
    const escalationTriggered = criticalPathImpacted || delayDays > 7;
    const escalationLevel: EscalationLevel | undefined = escalationTriggered
      ? delayDays > 14 ? 'director' : 'manager'
      : undefined;

    // Mitigation actions
    const mitigationActions: MitigationAction[] = [
      {
        action: 'Expedite shipping',
        cost: 500,
        timeReduction: Math.ceil(delayDays / 2),
        feasibility: 'medium',
        requiresApproval: true,
      },
      {
        action: 'Source from alternative supplier',
        cost: 1000,
        timeReduction: delayDays - 2,
        feasibility: 'high',
        requiresApproval: true,
      },
    ];

    // Expediting options
    const expeditingOptions: ExpeditingOption[] = [
      {
        description: 'Air freight upgrade',
        additionalCost: 800,
        timeReduction: Math.max(1, delayDays - 2),
        available: delayDays > 3,
      },
    ];

    return {
      deliveryId,
      deliveryNumber,
      materialId,
      materialName,
      originalDeliveryDate: originalDate,
      newDeliveryDate: newDate,
      delayDays,
      delayReason,
      affectedProjects,
      criticalPathImpacted,
      cascadingDelays,
      timelineAdjustments,
      notificationsSent: ['project_manager', 'logistics_lead'],
      escalationTriggered,
      escalationLevel,
      mitigationActions,
      alternativeSourcesChecked: true,
      expeditingOptions,
    };
  }

  /**
   * Auto-trigger inventory reorder when below threshold
   */
  static triggerInventoryReorder(
    materialId: string,
    materialName: string,
    currentLevel: number,
    reorderPoint: number,
    safetyStock: number,
    optimalLevel: number,
    dailyConsumption: number
  ): InventoryReorderAutomation {
    // Calculate reorder quantity (Economic Order Quantity simplified)
    const reorderQuantity = optimalLevel - currentLevel;

    // Calculate urgency
    const daysUntilStockout = currentLevel / Math.max(dailyConsumption, 1);
    const reorderUrgency: 'immediate' | 'urgent' | 'normal' =
      daysUntilStockout < 3 ? 'immediate' :
      daysUntilStockout < 7 ? 'urgent' :
      'normal';

    const estimatedStockoutDate = daysUntilStockout < 14
      ? this.addDays(new Date(), Math.floor(daysUntilStockout)).toISOString()
      : undefined;

    // Supplier selection (mock)
    const recommendedSupplier = {
      supplierId: 's1',
      supplierName: 'Primary Supplier',
      unitPrice: 100,
      leadTime: 7,
      reliability: 92,
      totalCost: reorderQuantity * 100,
    };

    // Auto-order logic
    const autoOrderEnabled = currentLevel < safetyStock;
    const orderPlaced = autoOrderEnabled && reorderQuantity * 100 < 20000; // Auto-order if < $20k
    const approvalStatus: any =
      orderPlaced ? 'auto_approved' :
      autoOrderEnabled ? 'pending_approval' :
      'approved';

    return {
      materialId,
      materialName,
      currentLevel,
      reorderPoint,
      safetyStock,
      optimalLevel,
      reorderQuantity,
      reorderUrgency,
      estimatedStockoutDate,
      recommendedSupplier,
      alternativeSuppliers: [],
      autoOrderEnabled,
      orderPlaced,
      orderId: orderPlaced ? `PO-${Date.now()}` : undefined,
      approvalStatus,
    };
  }

  /**
   * Trigger material procurement when BOM is approved
   */
  static triggerBOMProcurement(
    bomId: string,
    bomName: string,
    projectId: string,
    projectName: string,
    bomItems: any[],
    approvedBy: string
  ): BOMApprovalAutomation {
    const totalItems = bomItems.length;
    const totalCost = bomItems.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0);

    // Create purchase orders for each material
    const purchaseOrders: PurchaseOrderTrigger[] = bomItems.map(item => ({
      materialId: item.materialId,
      materialName: item.materialName,
      quantity: item.quantity,
      supplierId: item.supplierId || 's1',
      supplierName: item.supplierName || 'Default Supplier',
      estimatedCost: item.quantity * item.unitCost,
      priority: item.critical ? 'rush' : 'normal',
      poNumber: `PO-${bomId}-${item.materialId}`,
      status: 'created',
    }));

    // Material allocations
    const allocationDetails: MaterialAllocation[] = bomItems.map(item => ({
      materialId: item.materialId,
      materialName: item.materialName,
      allocatedQuantity: item.quantity,
      source: item.inStock ? 'existing_stock' : 'new_order',
      availabilityDate: item.inStock
        ? new Date().toISOString()
        : this.addDays(new Date(), 14).toISOString(), // Mock 14-day lead time
    }));

    // Timeline calculations
    const longestLeadTime = 14; // Mock
    const procurementStartDate = new Date().toISOString();
    const estimatedDeliveryDate = this.addDays(new Date(), longestLeadTime).toISOString();

    return {
      bomId,
      bomName,
      projectId,
      projectName,
      totalItems,
      totalCost,
      approvedAt: new Date().toISOString(),
      approvedBy,
      procurementTriggered: true,
      purchaseOrders,
      materialsAllocated: true,
      allocationDetails,
      procurementStartDate,
      estimatedDeliveryDate,
      projectTimelineUpdated: true,
    };
  }

  // -------------------------------------------------------------------------
  // Exception Management
  // -------------------------------------------------------------------------

  /**
   * Create and manage exception cases
   */
  static createException(
    type: ExceptionCase['type'],
    severity: ExceptionCase['severity'],
    title: string,
    description: string,
    relatedEntityType: ExceptionCase['relatedEntityType'],
    relatedEntityId: string,
    affectedProjects: string[]
  ): ExceptionCase {
    const exception: ExceptionCase = {
      id: `exc-${Date.now()}`,
      type,
      severity,
      title,
      description,
      detectedAt: new Date().toISOString(),
      detectedBy: 'system',
      relatedEntityType,
      relatedEntityId,
      affectedProjects,
      status: 'open',
      slaDeadline: this.addHours(new Date(), severity === 'critical' ? 4 : 24).toISOString(),
      alternativeOptions: [],
      contingencyPlans: [],
    };

    this.exceptionCases.push(exception);
    return exception;
  }

  /**
   * Get escalation rules for a severity level
   */
  static getEscalationRules(severity: 'critical' | 'high' | 'medium' | 'low'): EscalationRule[] {
    const rules: EscalationRule[] = [
      {
        id: 'esc-critical',
        name: 'Critical Issue Escalation',
        triggerType: 'exception',
        severity: 'critical',
        timeThreshold: 30, // 30 minutes
        escalationLevels: [
          {
            level: 'team_lead',
            recipients: ['team_lead@company.com'],
            channels: ['sms', 'push', 'email'],
            delayMinutes: 0,
            requiresResponse: true,
          },
          {
            level: 'manager',
            recipients: ['manager@company.com'],
            channels: ['sms', 'email'],
            delayMinutes: 30,
            requiresResponse: true,
          },
          {
            level: 'director',
            recipients: ['director@company.com'],
            channels: ['sms', 'email'],
            delayMinutes: 60,
            requiresResponse: true,
          },
        ],
        enabled: true,
        notifyAll: false,
      },
    ];

    return rules.filter(r => r.severity === severity);
  }

  // -------------------------------------------------------------------------
  // Helper Methods
  // -------------------------------------------------------------------------

  private static addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  private static addHours(date: Date, hours: number): Date {
    const result = new Date(date);
    result.setHours(result.getHours() + hours);
    return result;
  }

  private static daysBetween(date1: Date, date2: Date): number {
    const diffTime = Math.abs(date2.getTime() - date1.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  private static datesOverlap(
    start1: Date,
    end1: Date,
    start2: Date,
    end2: Date
  ): boolean {
    return start1 <= end2 && end1 >= start2;
  }
}
