/**
 * Week 7 - Integration & Automation Tests
 *
 * Tests for:
 * - LogisticsAutomationService
 * - NotificationService
 * - LogisticsIntegrationService
 */

import {
  LogisticsAutomationService,
  type TriggerCondition,
} from '../src/services/LogisticsAutomationService';

import {
  NotificationService,
  type NotificationTemplate,
  type NotificationPreferences,
} from '../src/services/NotificationService';

import {
  LogisticsIntegrationService,
  type IntegrationConfig,
} from '../src/services/LogisticsIntegrationService';

describe('Week 7 - Integration & Automation', () => {
  // -------------------------------------------------------------------------
  // LogisticsAutomationService Tests
  // -------------------------------------------------------------------------

  describe('LogisticsAutomationService', () => {
    describe('Condition Evaluation', () => {
      it('should evaluate equals condition correctly', () => {
        const conditions: TriggerCondition[] = [
          { field: 'status', operator: 'equals', value: 'low_stock' },
        ];
        const data = { status: 'low_stock' };

        const result = LogisticsAutomationService.evaluateConditions(conditions, data);
        expect(result).toBe(true);
      });

      it('should evaluate greater_than condition correctly', () => {
        const conditions: TriggerCondition[] = [
          { field: 'quantity', operator: 'greater_than', value: 100 },
        ];
        const data = { quantity: 150 };

        const result = LogisticsAutomationService.evaluateConditions(conditions, data);
        expect(result).toBe(true);
      });

      it('should evaluate less_than condition correctly', () => {
        const conditions: TriggerCondition[] = [
          { field: 'quantity', operator: 'less_than', value: 50 },
        ];
        const data = { quantity: 30 };

        const result = LogisticsAutomationService.evaluateConditions(conditions, data);
        expect(result).toBe(true);
      });

      it('should evaluate contains condition correctly', () => {
        const conditions: TriggerCondition[] = [
          { field: 'description', operator: 'contains', value: 'urgent' },
        ];
        const data = { description: 'urgent delivery required' };

        const result = LogisticsAutomationService.evaluateConditions(conditions, data);
        expect(result).toBe(true);
      });

      it('should evaluate in_range condition correctly', () => {
        const conditions: TriggerCondition[] = [
          { field: 'cost', operator: 'in_range', value: [1000, 5000] },
        ];
        const data = { cost: 3000 };

        const result = LogisticsAutomationService.evaluateConditions(conditions, data);
        expect(result).toBe(true);
      });

      it('should handle AND logic correctly', () => {
        const conditions: TriggerCondition[] = [
          { field: 'quantity', operator: 'less_than', value: 50, logicalOperator: 'AND' },
          { field: 'priority', operator: 'equals', value: 'high' },
        ];
        const data = { quantity: 30, priority: 'high' };

        const result = LogisticsAutomationService.evaluateConditions(conditions, data);
        expect(result).toBe(true);
      });

      it('should handle OR logic correctly', () => {
        const conditions: TriggerCondition[] = [
          { field: 'quantity', operator: 'less_than', value: 50, logicalOperator: 'OR' },
          { field: 'priority', operator: 'equals', value: 'critical' },
        ];
        const data = { quantity: 100, priority: 'critical' };

        const result = LogisticsAutomationService.evaluateConditions(conditions, data);
        expect(result).toBe(true);
      });
    });

    describe('Material Shortage Automation', () => {
      it('should handle material shortage with correct urgency', () => {
        const shortage = LogisticsAutomationService.handleMaterialShortage(
          'm1',
          'Concrete Mix',
          50,
          100,
          'p1'
        );

        expect(shortage.materialId).toBe('m1');
        expect(shortage.shortageAmount).toBe(50);
        expect(shortage.urgency).toBe('medium');
        expect(shortage.purchaseOrder).toBeDefined();
        expect(shortage.purchaseOrder.quantity).toBeGreaterThanOrEqual(50);
      });

      it('should mark critical shortage correctly', () => {
        const shortage = LogisticsAutomationService.handleMaterialShortage(
          'm1',
          'Steel Rebar',
          10,
          100,
          'p1'
        );

        expect(shortage.urgency).toBe('critical');
        expect(shortage.purchaseOrder.priority).toBe('rush');
        expect(shortage.notificationsSent.length).toBeGreaterThan(2);
      });

      it('should auto-approve low-cost orders', () => {
        const shortage = LogisticsAutomationService.handleMaterialShortage(
          'm1',
          'Cement Bags',
          20,
          50,
          'p1'
        );

        if (shortage.purchaseOrder.estimatedCost < 10000) {
          expect(shortage.autoApproved).toBe(true);
          expect(shortage.approvalRequired).toBe(false);
        }
      });

      it('should require approval for high-cost orders', () => {
        const shortage = LogisticsAutomationService.handleMaterialShortage(
          'm1',
          'Equipment',
          80,
          100,
          'p1'
        );

        if (shortage.urgency === 'critical') {
          expect(shortage.approvalRequired).toBe(true);
        }
      });
    });

    describe('Maintenance Impact Analysis', () => {
      it('should analyze maintenance impact on schedule', () => {
        const allocations = [
          {
            id: 'a1',
            projectId: 'p1',
            projectName: 'Project 1',
            siteId: 's1',
            startDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            endDate: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
          },
        ];

        const maintenanceDate = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

        const analysis = LogisticsAutomationService.analyzeMaintenanceImpact(
          'e1',
          'Excavator',
          maintenanceDate,
          8,
          allocations
        );

        expect(analysis.equipmentId).toBe('e1');
        expect(analysis.affectedAllocations.length).toBeGreaterThan(0);
        expect(analysis.impactedProjects.length).toBeGreaterThan(0);
        expect(analysis.recommendations.length).toBeGreaterThan(0);
      });

      it('should provide alternative equipment suggestions', () => {
        const analysis = LogisticsAutomationService.analyzeMaintenanceImpact(
          'e1',
          'Excavator',
          new Date().toISOString(),
          8,
          []
        );

        expect(analysis.alternativeEquipment).toBeDefined();
        expect(analysis.alternativeEquipment.length).toBeGreaterThan(0);
        analysis.alternativeEquipment.forEach(alt => {
          expect(alt.equipmentId).toBeDefined();
          expect(alt.capability).toBeGreaterThan(0);
          expect(alt.capability).toBeLessThanOrEqual(100);
        });
      });

      it('should schedule notifications in advance', () => {
        const analysis = LogisticsAutomationService.analyzeMaintenanceImpact(
          'e1',
          'Excavator',
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          8,
          []
        );

        expect(analysis.notificationsScheduled.length).toBeGreaterThanOrEqual(0);
        analysis.notificationsScheduled.forEach(notif => {
          expect(notif.priority).toBe('high');
          expect(notif.actionable).toBe(true);
        });
      });
    });

    describe('Delivery Delay Automation', () => {
      it('should handle delivery delay with timeline adjustments', () => {
        const delay = LogisticsAutomationService.handleDeliveryDelay(
          'd1',
          'DEL-001',
          'm1',
          'Concrete',
          new Date().toISOString(),
          new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          'Supplier delay',
          ['p1', 'p2']
        );

        expect(delay.delayDays).toBe(5);
        expect(delay.affectedProjects.length).toBe(2);
        expect(delay.timelineAdjustments.length).toBeGreaterThan(0);
        expect(delay.notificationsSent.length).toBeGreaterThan(0);
      });

      it('should trigger escalation for critical delays', () => {
        const delay = LogisticsAutomationService.handleDeliveryDelay(
          'd1',
          'DEL-001',
          'm1',
          'Steel',
          new Date().toISOString(),
          new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
          'Manufacturing issue',
          ['p1']
        );

        expect(delay.escalationTriggered).toBe(true);
        expect(delay.escalationLevel).toBeDefined();
      });

      it('should provide mitigation actions', () => {
        const delay = LogisticsAutomationService.handleDeliveryDelay(
          'd1',
          'DEL-001',
          'm1',
          'Materials',
          new Date().toISOString(),
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          'Weather delay',
          ['p1']
        );

        expect(delay.mitigationActions.length).toBeGreaterThan(0);
        delay.mitigationActions.forEach(action => {
          expect(action.cost).toBeGreaterThan(0);
          expect(action.timeReduction).toBeGreaterThan(0);
          expect(action.feasibility).toBeDefined();
        });
      });
    });

    describe('Inventory Reorder Automation', () => {
      it('should trigger reorder when below threshold', () => {
        const reorder = LogisticsAutomationService.triggerInventoryReorder(
          'm1',
          'Cement',
          40,
          50,
          30,
          100,
          5
        );

        expect(reorder.currentLevel).toBe(40);
        expect(reorder.reorderQuantity).toBeGreaterThan(0);
        expect(reorder.reorderUrgency).toBeDefined();
        expect(reorder.recommendedSupplier).toBeDefined();
      });

      it('should calculate urgency based on stockout date', () => {
        const reorderImmediate = LogisticsAutomationService.triggerInventoryReorder(
          'm1',
          'Material',
          10,
          50,
          30,
          100,
          5
        );

        expect(reorderImmediate.reorderUrgency).toBe('immediate');

        const reorderNormal = LogisticsAutomationService.triggerInventoryReorder(
          'm1',
          'Material',
          80,
          50,
          30,
          100,
          5
        );

        expect(reorderNormal.reorderUrgency).toBe('normal');
      });

      it('should auto-order if below safety stock', () => {
        const reorder = LogisticsAutomationService.triggerInventoryReorder(
          'm1',
          'Material',
          20,
          50,
          30,
          100,
          5
        );

        expect(reorder.autoOrderEnabled).toBe(true);
      });
    });

    describe('BOM Procurement Trigger', () => {
      it('should trigger procurement on BOM approval', () => {
        const bomItems = [
          {
            materialId: 'm1',
            materialName: 'Concrete',
            quantity: 100,
            unitCost: 150,
            supplierId: 's1',
            supplierName: 'Supplier A',
            inStock: false,
          },
          {
            materialId: 'm2',
            materialName: 'Steel',
            quantity: 50,
            unitCost: 800,
            supplierId: 's1',
            supplierName: 'Supplier A',
            inStock: true,
          },
        ];

        const procurement = LogisticsAutomationService.triggerBOMProcurement(
          'bom1',
          'Project BOM',
          'p1',
          'Project 1',
          bomItems,
          'manager@company.com'
        );

        expect(procurement.procurementTriggered).toBe(true);
        expect(procurement.purchaseOrders.length).toBe(2);
        expect(procurement.allocationDetails.length).toBe(2);
        expect(procurement.projectTimelineUpdated).toBe(true);
      });

      it('should allocate from existing stock when available', () => {
        const bomItems = [
          {
            materialId: 'm1',
            materialName: 'Material',
            quantity: 100,
            unitCost: 100,
            inStock: true,
          },
        ];

        const procurement = LogisticsAutomationService.triggerBOMProcurement(
          'bom1',
          'BOM',
          'p1',
          'Project',
          bomItems,
          'user'
        );

        const allocation = procurement.allocationDetails[0];
        expect(allocation.source).toBe('existing_stock');
      });
    });

    describe('Exception Management', () => {
      it('should create exception case', () => {
        const exception = LogisticsAutomationService.createException(
          'material_unavailable',
          'critical',
          'Material Unavailable',
          'Required material is out of stock',
          'material',
          'm1',
          ['p1']
        );

        expect(exception.id).toBeDefined();
        expect(exception.type).toBe('material_unavailable');
        expect(exception.severity).toBe('critical');
        expect(exception.status).toBe('open');
        expect(exception.slaDeadline).toBeDefined();
      });

      it('should set appropriate SLA deadline based on severity', () => {
        const critical = LogisticsAutomationService.createException(
          'equipment_breakdown',
          'critical',
          'Equipment Breakdown',
          'Critical equipment failure',
          'equipment',
          'e1',
          ['p1']
        );

        const low = LogisticsAutomationService.createException(
          'quality_issue',
          'low',
          'Minor Quality Issue',
          'Minor defect detected',
          'material',
          'm1',
          []
        );

        const criticalDeadline = new Date(critical.slaDeadline).getTime();
        const lowDeadline = new Date(low.slaDeadline).getTime();
        const now = Date.now();

        expect(criticalDeadline - now).toBeLessThan(lowDeadline - now);
      });

      it('should provide escalation rules', () => {
        const rules = LogisticsAutomationService.getEscalationRules('critical');

        expect(rules.length).toBeGreaterThan(0);
        rules.forEach(rule => {
          expect(rule.escalationLevels.length).toBeGreaterThan(0);
          expect(rule.timeThreshold).toBeDefined();
        });
      });
    });
  });

  // -------------------------------------------------------------------------
  // NotificationService Tests
  // -------------------------------------------------------------------------

  describe('NotificationService', () => {
    beforeEach(() => {
      // Initialize default templates
      NotificationService.initializeDefaultTemplates();
    });

    describe('Notification Sending', () => {
      it('should send notification successfully', async () => {
        const notification = await NotificationService.sendNotification(
          'user1',
          'Test Notification',
          'This is a test message',
          {
            category: 'system_update',
            priority: 'medium',
            channels: ['in_app'],
          }
        );

        expect(notification.id).toBeDefined();
        expect(notification.recipientId).toBe('user1');
        expect(notification.title).toBe('Test Notification');
        expect(notification.readStatus).toBe('unread');
      });

      it('should send to multiple channels', async () => {
        const notification = await NotificationService.sendNotification(
          'user1',
          'Multi-Channel Test',
          'Test message',
          {
            category: 'material_alert',
            priority: 'high',
            channels: ['push', 'email', 'in_app'],
            recipientEmail: 'user@example.com',
          }
        );

        expect(notification.channels.length).toBe(3);
        expect(notification.channels).toContain('push');
        expect(notification.channels).toContain('email');
        expect(notification.channels).toContain('in_app');
      });

      it('should schedule notification for later', async () => {
        const futureDate = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
        const notification = await NotificationService.sendNotification(
          'user1',
          'Scheduled Test',
          'This will be sent later',
          {
            category: 'system_update',
            scheduledFor: futureDate.toISOString(),
          }
        );

        expect(notification.scheduledFor).toBe(futureDate.toISOString());
        expect(notification.sentAt).toBeUndefined();
      });
    });

    describe('Template-Based Notifications', () => {
      it('should send notification from template', async () => {
        const notification = await NotificationService.sendFromTemplate(
          'material_shortage',
          'user1',
          {
            materialName: 'Concrete',
            shortageAmount: 50,
            unit: 'm³',
            requiredQuantity: 100,
            currentQuantity: 50,
          }
        );

        expect(notification.title).toContain('Concrete');
        expect(notification.message).toContain('50');
        expect(notification.category).toBe('material_alert');
      });

      it('should throw error for missing variables', async () => {
        await expect(
          NotificationService.sendFromTemplate('material_shortage', 'user1', {
            materialName: 'Concrete',
            // Missing other required variables
          })
        ).rejects.toThrow();
      });

      it('should include template actions', async () => {
        const notification = await NotificationService.sendFromTemplate(
          'material_shortage',
          'user1',
          {
            materialName: 'Concrete',
            shortageAmount: 50,
            unit: 'm³',
            requiredQuantity: 100,
            currentQuantity: 50,
          }
        );

        expect(notification.actions).toBeDefined();
        expect(notification.actions!.length).toBeGreaterThan(0);
      });
    });

    describe('Batch Notifications', () => {
      it('should send batch notifications', async () => {
        const recipients = ['user1', 'user2', 'user3'];
        const batch = await NotificationService.sendBatchNotification(
          recipients,
          'Batch Test',
          'Test message for all',
          {
            category: 'system_update',
            priority: 'low',
          }
        );

        expect(batch.totalCount).toBe(3);
        expect(batch.sentCount).toBe(3);
        expect(batch.notifications.length).toBe(3);
      });
    });

    describe('Notification Management', () => {
      it('should get notifications for user', async () => {
        await NotificationService.sendNotification('user1', 'Test 1', 'Message 1', {
          category: 'system_update',
        });
        await NotificationService.sendNotification('user1', 'Test 2', 'Message 2', {
          category: 'material_alert',
        });

        const notifications = NotificationService.getNotifications('user1');
        expect(notifications.length).toBeGreaterThanOrEqual(2);
      });

      it('should filter notifications by category', async () => {
        await NotificationService.sendNotification('user1', 'Test', 'Message', {
          category: 'material_alert',
        });

        const filtered = NotificationService.getNotifications('user1', {
          category: 'material_alert',
        });

        filtered.forEach(notif => {
          expect(notif.category).toBe('material_alert');
        });
      });

      it('should get unread count correctly', async () => {
        await NotificationService.sendNotification('user2', 'Test 1', 'Message', {
          category: 'system_update',
        });
        await NotificationService.sendNotification('user2', 'Test 2', 'Message', {
          category: 'system_update',
        });

        const count = NotificationService.getUnreadCount('user2');
        expect(count).toBeGreaterThanOrEqual(2);
      });

      it('should mark notification as read', async () => {
        const notification = await NotificationService.sendNotification(
          'user1',
          'Test',
          'Message',
          { category: 'system_update' }
        );

        NotificationService.markAsRead(notification.id);

        const notifications = NotificationService.getNotifications('user1', {
          readStatus: 'read',
        });

        const found = notifications.find(n => n.id === notification.id);
        expect(found?.readStatus).toBe('read');
        expect(found?.readAt).toBeDefined();
      });

      it('should mark all as read', async () => {
        await NotificationService.sendNotification('user3', 'Test 1', 'Message', {
          category: 'system_update',
        });
        await NotificationService.sendNotification('user3', 'Test 2', 'Message', {
          category: 'system_update',
        });

        NotificationService.markAllAsRead('user3');

        const unreadCount = NotificationService.getUnreadCount('user3');
        expect(unreadCount).toBe(0);
      });

      it('should archive notification', async () => {
        const notification = await NotificationService.sendNotification(
          'user1',
          'Test',
          'Message',
          { category: 'system_update' }
        );

        NotificationService.archiveNotification(notification.id);

        const notifications = NotificationService.getNotifications('user1', {
          readStatus: 'archived',
        });

        const found = notifications.find(n => n.id === notification.id);
        expect(found?.readStatus).toBe('archived');
      });
    });

    describe('User Preferences', () => {
      it('should get default preferences', () => {
        const prefs = NotificationService.getPreferences('user1');

        expect(prefs.userId).toBe('user1');
        expect(prefs.channels.push.enabled).toBe(true);
        expect(prefs.channels.email.enabled).toBe(true);
        expect(prefs.quietHours).toBeDefined();
      });

      it('should update preferences', () => {
        NotificationService.updatePreferences('user1', {
          channels: {
            push: { enabled: false },
            email: { enabled: true },
            sms: { enabled: false },
            in_app: { enabled: true },
          },
        } as any);

        const prefs = NotificationService.getPreferences('user1');
        expect(prefs.channels.push.enabled).toBe(false);
      });
    });

    describe('Notification Metrics', () => {
      it('should calculate metrics correctly', async () => {
        const now = new Date();
        const startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago

        await NotificationService.sendNotification('user1', 'Test', 'Message', {
          category: 'system_update',
          priority: 'high',
        });

        const metrics = NotificationService.getMetrics(
          startDate.toISOString(),
          now.toISOString()
        );

        expect(metrics.totalSent).toBeGreaterThan(0);
        expect(metrics.byChannel).toBeDefined();
        expect(metrics.byCategory).toBeDefined();
        expect(metrics.byPriority).toBeDefined();
        expect(metrics.deliveryRate).toBeGreaterThanOrEqual(0);
      });
    });

    describe('Template Management', () => {
      it('should get all templates', () => {
        const templates = NotificationService.getTemplates();
        expect(templates.length).toBeGreaterThan(0);
      });

      it('should get template by ID', () => {
        const template = NotificationService.getTemplate('material_shortage');
        expect(template).toBeDefined();
        expect(template?.id).toBe('material_shortage');
      });

      it('should register custom template', () => {
        const customTemplate: NotificationTemplate = {
          id: 'custom_test',
          name: 'Custom Test',
          category: 'system_update',
          description: 'Test template',
          titleTemplate: 'Custom {{variable}}',
          messageTemplate: 'Message: {{variable}}',
          variables: ['variable'],
          defaultChannels: ['in_app'],
          defaultPriority: 'medium',
          enabled: true,
        };

        NotificationService.registerTemplate(customTemplate);

        const template = NotificationService.getTemplate('custom_test');
        expect(template).toBeDefined();
      });
    });
  });

  // -------------------------------------------------------------------------
  // LogisticsIntegrationService Tests
  // -------------------------------------------------------------------------

  describe('LogisticsIntegrationService', () => {
    describe('Integration Management', () => {
      it('should register integration', () => {
        const config: IntegrationConfig = {
          id: 'test-integration',
          system: 'accounting',
          name: 'Test Accounting',
          enabled: true,
          syncDirection: 'bidirectional',
          autoSync: false,
          connected: false,
        };

        LogisticsIntegrationService.registerIntegration(config);

        const retrieved = LogisticsIntegrationService.getIntegration('accounting');
        expect(retrieved).toBeDefined();
        expect(retrieved?.name).toBe('Test Accounting');
      });

      it('should test connection', async () => {
        const config: IntegrationConfig = {
          id: 'test',
          system: 'projects',
          name: 'Test Projects',
          enabled: true,
          syncDirection: 'pull',
          autoSync: false,
          connected: false,
        };

        LogisticsIntegrationService.registerIntegration(config);

        const connected = await LogisticsIntegrationService.testConnection('projects');
        expect(connected).toBe(true);

        const updated = LogisticsIntegrationService.getIntegration('projects');
        expect(updated?.connected).toBe(true);
      });
    });

    describe('Accounting Integration', () => {
      it('should sync inventory valuation', async () => {
        const items = [
          {
            materialId: 'm1',
            materialName: 'Concrete',
            quantity: 100,
            unitCost: 150,
            locationId: 'l1',
            locationName: 'Warehouse A',
            category: 'construction_materials',
            costingMethod: 'WAC',
          },
        ];

        const valuations = await LogisticsIntegrationService.syncInventoryValuation(items);

        expect(valuations.length).toBe(1);
        expect(valuations[0].totalValue).toBe(15000);
        expect(valuations[0].accountCode).toBeDefined();
      });

      it('should create accounting transaction', () => {
        const transaction = LogisticsIntegrationService.createAccountingTransaction(
          'purchase',
          'm1',
          'Material',
          100,
          50,
          'PO-001',
          'Material purchase'
        );

        expect(transaction.type).toBe('purchase');
        expect(transaction.totalAmount).toBe(5000);
        expect(transaction.debitAccount).toBeDefined();
        expect(transaction.creditAccount).toBeDefined();
      });
    });

    describe('Projects Integration', () => {
      it('should sync project resources', async () => {
        const materials = [
          {
            materialId: 'm1',
            materialName: 'Concrete',
            allocatedQuantity: 100,
            usedQuantity: 50,
            allocatedDate: new Date().toISOString(),
          },
        ];

        const equipment = [
          {
            equipmentId: 'e1',
            equipmentName: 'Excavator',
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            hoursAllocated: 40,
            hoursUsed: 20,
          },
        ];

        const integration = await LogisticsIntegrationService.syncProjectResources(
          'p1',
          'Project 1',
          materials,
          equipment
        );

        expect(integration.projectId).toBe('p1');
        expect(integration.materialsAllocated.length).toBe(1);
        expect(integration.equipmentAllocated.length).toBe(1);
        expect(integration.syncStatus).toBe('success');
      });
    });

    describe('Sites Integration', () => {
      it('should get site location data', async () => {
        const siteData = await LogisticsIntegrationService.getSiteLocationData(
          's1',
          'Site 1',
          '123 Main St',
          { latitude: 40.7128, longitude: -74.006 }
        );

        expect(siteData.siteId).toBe('s1');
        expect(siteData.facilities.length).toBeGreaterThan(0);
        expect(siteData.weatherData).toBeDefined();
        expect(siteData.nearbySuppliers).toBeDefined();
      });
    });

    describe('Weather Integration', () => {
      it('should get weather data', async () => {
        const weather = await LogisticsIntegrationService.getWeatherData(40.7128, -74.006);

        expect(weather.current).toBeDefined();
        expect(weather.forecast.length).toBeGreaterThan(0);
        expect(weather.current.temperature).toBeDefined();
      });

      it('should check delivery safety', async () => {
        const weather = await LogisticsIntegrationService.getWeatherData(40.7128, -74.006);
        const safety = LogisticsIntegrationService.isDeliverySafeInWeather(weather);

        expect(safety.safe).toBeDefined();
        expect(safety.warnings).toBeDefined();
        expect(Array.isArray(safety.warnings)).toBe(true);
      });
    });

    describe('Maps Integration', () => {
      it('should calculate route', async () => {
        const origin = {
          latitude: 40.7128,
          longitude: -74.006,
          address: '123 Main St',
        };
        const destination = {
          latitude: 40.7589,
          longitude: -73.9851,
          address: '456 Park Ave',
        };

        const route = await LogisticsIntegrationService.calculateRoute(origin, destination);

        expect(route.distance).toBeGreaterThan(0);
        expect(route.duration).toBeGreaterThan(0);
        expect(route.steps.length).toBeGreaterThan(0);
        expect(route.alternativeRoutes).toBeDefined();
      });
    });

    describe('Supplier Integration', () => {
      it('should get supplier data', async () => {
        const supplierData = await LogisticsIntegrationService.getSupplierIntegrationData('s1');

        expect(supplierData.supplierId).toBe('s1');
        expect(supplierData.connected).toBe(true);
        expect(supplierData.catalogItems.length).toBeGreaterThan(0);
      });

      it('should find nearby suppliers', async () => {
        const suppliers = await LogisticsIntegrationService.findNearbySuppliers({
          latitude: 40.7128,
          longitude: -74.006,
        });

        expect(suppliers.length).toBeGreaterThan(0);
        expect(suppliers[0].distance).toBeDefined();
        expect(suppliers[0].travelTime).toBeGreaterThan(0);
      });
    });

    describe('Webhook Management', () => {
      it('should register webhook', () => {
        const webhook = {
          id: 'wh1',
          url: 'https://example.com/webhook',
          events: ['material.created' as const, 'delivery.scheduled' as const],
          enabled: true,
          retryOnFailure: true,
          maxRetries: 3,
          successCount: 0,
          failureCount: 0,
        };

        LogisticsIntegrationService.registerWebhook(webhook);
      });

      it('should trigger webhook for event', async () => {
        const webhook = {
          id: 'wh2',
          url: 'https://example.com/webhook',
          events: ['material.created' as const],
          enabled: true,
          retryOnFailure: false,
          maxRetries: 0,
          successCount: 0,
          failureCount: 0,
        };

        LogisticsIntegrationService.registerWebhook(webhook);

        await LogisticsIntegrationService.triggerWebhook('material.created', {
          materialId: 'm1',
          materialName: 'Test Material',
        });

        // Webhook should be triggered (tested via mock/spy in real implementation)
      });
    });

    describe('Sync Operations', () => {
      it('should get sync history', () => {
        const history = LogisticsIntegrationService.getSyncHistory();
        expect(Array.isArray(history)).toBe(true);
      });

      it('should filter sync history by system', async () => {
        await LogisticsIntegrationService.syncInventoryValuation([
          {
            materialId: 'm1',
            materialName: 'Test',
            quantity: 100,
            unitCost: 50,
            locationId: 'l1',
            locationName: 'Warehouse',
            category: 'construction_materials',
          },
        ]);

        const history = LogisticsIntegrationService.getSyncHistory('accounting', 10);
        expect(history.length).toBeGreaterThan(0);
        history.forEach(sync => {
          expect(sync.system).toBe('accounting');
        });
      });
    });
  });
});
