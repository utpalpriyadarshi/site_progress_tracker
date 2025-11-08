/**
 * NotificationService - Week 7
 *
 * Multi-channel notification system:
 * - Push notifications for critical alerts
 * - Email notifications for workflows
 * - SMS alerts for urgent issues
 * - In-app notification center
 * - Template-based messaging
 * - Delivery tracking and read receipts
 */

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type NotificationChannel = 'push' | 'email' | 'sms' | 'in_app';

export type NotificationPriority = 'critical' | 'high' | 'medium' | 'low';

export type NotificationCategory =
  | 'material_alert'
  | 'equipment_update'
  | 'delivery_status'
  | 'inventory_warning'
  | 'approval_request'
  | 'exception_alert'
  | 'system_update'
  | 'report_ready';

export type DeliveryStatus = 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced';

export type ReadStatus = 'unread' | 'read' | 'archived';

export interface Notification {
  id: string;

  // Recipient
  recipientId: string;
  recipientEmail?: string;
  recipientPhone?: string;

  // Message
  title: string;
  message: string;
  category: NotificationCategory;
  priority: NotificationPriority;

  // Delivery
  channels: NotificationChannel[];
  deliveryStatus: Record<NotificationChannel, DeliveryStatus>;

  // Content
  data?: Record<string, any>; // Additional data for deep linking
  imageUrl?: string;
  actions?: NotificationAction[];

  // Status
  readStatus: ReadStatus;
  createdAt: string;
  scheduledFor?: string;
  sentAt?: string;
  deliveredAt?: string;
  readAt?: string;
  archivedAt?: string;

  // Tracking
  clickCount: number;
  actionTaken?: string;

  // Metadata
  sourceType: 'automation' | 'user' | 'system';
  sourceId?: string;
  expiresAt?: string;
}

export interface NotificationAction {
  id: string;
  label: string;
  action: string; // Action identifier for handling
  url?: string;
  style?: 'primary' | 'secondary' | 'danger';
  requiresConfirmation: boolean;
  confirmationMessage?: string;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  category: NotificationCategory;
  description: string;

  // Template content
  titleTemplate: string; // e.g., "{{materialName}} shortage detected"
  messageTemplate: string;
  variables: string[]; // Required variables for this template

  // Settings
  defaultChannels: NotificationChannel[];
  defaultPriority: NotificationPriority;
  enabled: boolean;

  // Actions
  actions?: NotificationAction[];
}

export interface NotificationPreferences {
  userId: string;

  // Channel preferences
  channels: {
    push: { enabled: boolean; mutedUntil?: string };
    email: { enabled: boolean; digestMode?: boolean };
    sms: { enabled: boolean; criticalOnly?: boolean };
    in_app: { enabled: boolean };
  };

  // Category preferences
  categories: {
    [key in NotificationCategory]?: {
      enabled: boolean;
      channels: NotificationChannel[];
      minPriority: NotificationPriority;
    };
  };

  // Quiet hours
  quietHours?: {
    enabled: boolean;
    start: string; // HH:MM format
    end: string;
    allowCritical: boolean;
  };

  // Digest settings
  emailDigest?: {
    enabled: boolean;
    frequency: 'daily' | 'weekly';
    time: string; // HH:MM format
  };
}

export interface NotificationBatch {
  id: string;
  name: string;
  notifications: Notification[];
  createdAt: string;
  scheduledFor?: string;
  sentAt?: string;
  totalCount: number;
  sentCount: number;
  deliveredCount: number;
  failedCount: number;
}

export interface DeliveryReport {
  notificationId: string;
  channel: NotificationChannel;
  status: DeliveryStatus;
  attempts: number;
  lastAttemptAt: string;
  deliveredAt?: string;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

export interface NotificationMetrics {
  period: { startDate: string; endDate: string };

  // Volume metrics
  totalSent: number;
  byChannel: Record<NotificationChannel, number>;
  byCategory: Record<NotificationCategory, number>;
  byPriority: Record<NotificationPriority, number>;

  // Delivery metrics
  deliveryRate: number; // percentage
  averageDeliveryTime: number; // seconds
  failureRate: number;

  // Engagement metrics
  readRate: number;
  clickRate: number;
  actionRate: number;
  averageTimeToRead: number; // seconds

  // Channel performance
  channelPerformance: ChannelPerformance[];
}

export interface ChannelPerformance {
  channel: NotificationChannel;
  sent: number;
  delivered: number;
  failed: number;
  deliveryRate: number;
  averageDeliveryTime: number;
  readRate: number;
}

// ============================================================================
// SERVICE CLASS
// ============================================================================

export class NotificationService {
  private static notifications: Notification[] = [];
  private static templates: NotificationTemplate[] = [];
  private static preferences: Map<string, NotificationPreferences> = new Map();

  // -------------------------------------------------------------------------
  // Notification Creation
  // -------------------------------------------------------------------------

  /**
   * Send a notification to a user
   */
  static async sendNotification(
    recipientId: string,
    title: string,
    message: string,
    options: {
      category: NotificationCategory;
      priority?: NotificationPriority;
      channels?: NotificationChannel[];
      data?: Record<string, any>;
      actions?: NotificationAction[];
      scheduledFor?: string;
      imageUrl?: string;
      recipientEmail?: string;
      recipientPhone?: string;
    }
  ): Promise<Notification> {
    // Get user preferences
    const userPrefs = this.preferences.get(recipientId) || this.getDefaultPreferences(recipientId);

    // Determine channels based on preferences
    const channels = options.channels || this.determineChannels(userPrefs, options.category, options.priority || 'medium');

    // Check quiet hours
    if (!this.isAllowedByQuietHours(userPrefs, options.priority || 'medium')) {
      // Schedule for after quiet hours
      if (!options.scheduledFor) {
        options.scheduledFor = this.calculateNextAvailableTime(userPrefs).toISOString();
      }
    }

    // Create notification
    const notification: Notification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      recipientId,
      recipientEmail: options.recipientEmail,
      recipientPhone: options.recipientPhone,
      title,
      message,
      category: options.category,
      priority: options.priority || 'medium',
      channels,
      deliveryStatus: {} as any,
      data: options.data,
      imageUrl: options.imageUrl,
      actions: options.actions,
      readStatus: 'unread',
      createdAt: new Date().toISOString(),
      scheduledFor: options.scheduledFor,
      clickCount: 0,
      sourceType: 'system',
    };

    // Initialize delivery status for each channel
    channels.forEach(channel => {
      notification.deliveryStatus[channel] = 'pending';
    });

    // Store notification
    this.notifications.push(notification);

    // Send immediately if not scheduled
    if (!options.scheduledFor) {
      await this.deliverNotification(notification);
    }

    return notification;
  }

  /**
   * Send notification from template
   */
  static async sendFromTemplate(
    templateId: string,
    recipientId: string,
    variables: Record<string, any>,
    options?: {
      channels?: NotificationChannel[];
      priority?: NotificationPriority;
      scheduledFor?: string;
    }
  ): Promise<Notification> {
    const template = this.templates.find(t => t.id === templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    // Validate required variables
    const missingVars = template.variables.filter(v => !(v in variables));
    if (missingVars.length > 0) {
      throw new Error(`Missing required variables: ${missingVars.join(', ')}`);
    }

    // Interpolate template
    const title = this.interpolateTemplate(template.titleTemplate, variables);
    const message = this.interpolateTemplate(template.messageTemplate, variables);

    // Send notification
    return this.sendNotification(recipientId, title, message, {
      category: template.category,
      priority: options?.priority || template.defaultPriority,
      channels: options?.channels || template.defaultChannels,
      actions: template.actions,
      scheduledFor: options?.scheduledFor,
      data: variables,
    });
  }

  /**
   * Send batch notification to multiple recipients
   */
  static async sendBatchNotification(
    recipientIds: string[],
    title: string,
    message: string,
    options: {
      category: NotificationCategory;
      priority?: NotificationPriority;
      channels?: NotificationChannel[];
      data?: Record<string, any>;
    }
  ): Promise<NotificationBatch> {
    const batch: NotificationBatch = {
      id: `batch-${Date.now()}`,
      name: title,
      notifications: [],
      createdAt: new Date().toISOString(),
      sentAt: new Date().toISOString(),
      totalCount: recipientIds.length,
      sentCount: 0,
      deliveredCount: 0,
      failedCount: 0,
    };

    // Send to each recipient
    for (const recipientId of recipientIds) {
      try {
        const notification = await this.sendNotification(recipientId, title, message, options);
        batch.notifications.push(notification);
        batch.sentCount++;
      } catch (error) {
        console.error(`Failed to send notification to ${recipientId}:`, error);
        batch.failedCount++;
      }
    }

    return batch;
  }

  // -------------------------------------------------------------------------
  // Notification Delivery
  // -------------------------------------------------------------------------

  /**
   * Deliver notification through specified channels
   */
  private static async deliverNotification(notification: Notification): Promise<void> {
    notification.sentAt = new Date().toISOString();

    // Deliver to each channel
    for (const channel of notification.channels) {
      try {
        await this.deliverToChannel(notification, channel);
        notification.deliveryStatus[channel] = 'delivered';
      } catch (error) {
        console.error(`Failed to deliver to ${channel}:`, error);
        notification.deliveryStatus[channel] = 'failed';
      }
    }

    // Set delivered time if at least one channel succeeded
    if (Object.values(notification.deliveryStatus).some(status => status === 'delivered')) {
      notification.deliveredAt = new Date().toISOString();
    }
  }

  /**
   * Deliver to specific channel (mock implementation)
   */
  private static async deliverToChannel(
    notification: Notification,
    channel: NotificationChannel
  ): Promise<void> {
    switch (channel) {
      case 'push':
        await this.sendPushNotification(notification);
        break;
      case 'email':
        await this.sendEmail(notification);
        break;
      case 'sms':
        await this.sendSMS(notification);
        break;
      case 'in_app':
        // In-app notifications are already stored, just mark as delivered
        break;
    }
  }

  /**
   * Send push notification (mock)
   */
  private static async sendPushNotification(notification: Notification): Promise<void> {
    // Mock implementation
    console.log('Sending push notification:', notification.title);
    // In real app: integrate with Firebase Cloud Messaging or similar
    await this.delay(100);
  }

  /**
   * Send email notification (mock)
   */
  private static async sendEmail(notification: Notification): Promise<void> {
    // Mock implementation
    console.log('Sending email to:', notification.recipientEmail, notification.title);
    // In real app: integrate with SendGrid, AWS SES, etc.
    await this.delay(100);
  }

  /**
   * Send SMS notification (mock)
   */
  private static async sendSMS(notification: Notification): Promise<void> {
    // Mock implementation
    console.log('Sending SMS to:', notification.recipientPhone, notification.message);
    // In real app: integrate with Twilio, AWS SNS, etc.
    await this.delay(100);
  }

  // -------------------------------------------------------------------------
  // Notification Management
  // -------------------------------------------------------------------------

  /**
   * Get notifications for a user
   */
  static getNotifications(
    recipientId: string,
    options?: {
      category?: NotificationCategory;
      priority?: NotificationPriority;
      readStatus?: ReadStatus;
      limit?: number;
      offset?: number;
    }
  ): Notification[] {
    let filtered = this.notifications.filter(n => n.recipientId === recipientId);

    if (options?.category) {
      filtered = filtered.filter(n => n.category === options.category);
    }
    if (options?.priority) {
      filtered = filtered.filter(n => n.priority === options.priority);
    }
    if (options?.readStatus) {
      filtered = filtered.filter(n => n.readStatus === options.readStatus);
    }

    // Sort by creation date (newest first)
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Pagination
    const offset = options?.offset || 0;
    const limit = options?.limit || 50;
    return filtered.slice(offset, offset + limit);
  }

  /**
   * Get unread count for a user
   */
  static getUnreadCount(recipientId: string, category?: NotificationCategory): number {
    return this.notifications.filter(
      n =>
        n.recipientId === recipientId &&
        n.readStatus === 'unread' &&
        (!category || n.category === category)
    ).length;
  }

  /**
   * Mark notification as read
   */
  static markAsRead(notificationId: string): void {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification && notification.readStatus === 'unread') {
      notification.readStatus = 'read';
      notification.readAt = new Date().toISOString();
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  static markAllAsRead(recipientId: string, category?: NotificationCategory): void {
    this.notifications
      .filter(
        n =>
          n.recipientId === recipientId &&
          n.readStatus === 'unread' &&
          (!category || n.category === category)
      )
      .forEach(n => {
        n.readStatus = 'read';
        n.readAt = new Date().toISOString();
      });
  }

  /**
   * Archive notification
   */
  static archiveNotification(notificationId: string): void {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.readStatus = 'archived';
      notification.archivedAt = new Date().toISOString();
    }
  }

  /**
   * Delete notification
   */
  static deleteNotification(notificationId: string): void {
    const index = this.notifications.findIndex(n => n.id === notificationId);
    if (index !== -1) {
      this.notifications.splice(index, 1);
    }
  }

  // -------------------------------------------------------------------------
  // Template Management
  // -------------------------------------------------------------------------

  /**
   * Register a notification template
   */
  static registerTemplate(template: NotificationTemplate): void {
    this.templates.push(template);
  }

  /**
   * Get all templates
   */
  static getTemplates(): NotificationTemplate[] {
    return this.templates.filter(t => t.enabled);
  }

  /**
   * Get template by ID
   */
  static getTemplate(templateId: string): NotificationTemplate | undefined {
    return this.templates.find(t => t.id === templateId);
  }

  /**
   * Interpolate template with variables
   */
  private static interpolateTemplate(template: string, variables: Record<string, any>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return variables[key] !== undefined ? String(variables[key]) : match;
    });
  }

  // -------------------------------------------------------------------------
  // Preferences Management
  // -------------------------------------------------------------------------

  /**
   * Get user preferences
   */
  static getPreferences(userId: string): NotificationPreferences {
    return this.preferences.get(userId) || this.getDefaultPreferences(userId);
  }

  /**
   * Update user preferences
   */
  static updatePreferences(userId: string, preferences: Partial<NotificationPreferences>): void {
    const current = this.getPreferences(userId);
    this.preferences.set(userId, { ...current, ...preferences });
  }

  /**
   * Get default preferences
   */
  private static getDefaultPreferences(userId: string): NotificationPreferences {
    return {
      userId,
      channels: {
        push: { enabled: true },
        email: { enabled: true, digestMode: false },
        sms: { enabled: false, criticalOnly: true },
        in_app: { enabled: true },
      },
      categories: {},
      quietHours: {
        enabled: true,
        start: '22:00',
        end: '08:00',
        allowCritical: true,
      },
    };
  }

  /**
   * Determine appropriate channels based on preferences
   */
  private static determineChannels(
    prefs: NotificationPreferences,
    category: NotificationCategory,
    priority: NotificationPriority
  ): NotificationChannel[] {
    const channels: NotificationChannel[] = [];

    // Check category preferences
    const categoryPrefs = prefs.categories[category];
    if (categoryPrefs && !categoryPrefs.enabled) {
      return []; // Category disabled
    }

    // Check if priority meets minimum
    if (categoryPrefs?.minPriority) {
      const priorityLevels: NotificationPriority[] = ['low', 'medium', 'high', 'critical'];
      const minLevel = priorityLevels.indexOf(categoryPrefs.minPriority);
      const currentLevel = priorityLevels.indexOf(priority);
      if (currentLevel < minLevel) {
        return []; // Priority too low
      }
    }

    // Use category-specific channels if defined
    if (categoryPrefs?.channels) {
      return categoryPrefs.channels.filter(ch => prefs.channels[ch].enabled);
    }

    // Default channels based on priority and preferences
    if (prefs.channels.in_app.enabled) {
      channels.push('in_app');
    }

    if (priority === 'critical' || priority === 'high') {
      if (prefs.channels.push.enabled) {
        channels.push('push');
      }
      if (priority === 'critical' && prefs.channels.sms.enabled) {
        channels.push('sms');
      }
    }

    if (prefs.channels.email.enabled && !prefs.channels.email.digestMode) {
      channels.push('email');
    }

    return channels;
  }

  /**
   * Check if notification is allowed during quiet hours
   */
  private static isAllowedByQuietHours(
    prefs: NotificationPreferences,
    priority: NotificationPriority
  ): boolean {
    if (!prefs.quietHours?.enabled) {
      return true;
    }

    // Allow critical notifications during quiet hours
    if (priority === 'critical' && prefs.quietHours.allowCritical) {
      return true;
    }

    // Check if current time is within quiet hours
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const start = prefs.quietHours.start;
    const end = prefs.quietHours.end;

    if (start < end) {
      // Normal range (e.g., 12:00 to 14:00)
      return currentTime < start || currentTime >= end;
    } else {
      // Overnight range (e.g., 22:00 to 08:00)
      return currentTime >= end && currentTime < start;
    }
  }

  /**
   * Calculate next available time after quiet hours
   */
  private static calculateNextAvailableTime(prefs: NotificationPreferences): Date {
    if (!prefs.quietHours?.enabled) {
      return new Date();
    }

    const now = new Date();
    const [endHour, endMinute] = prefs.quietHours.end.split(':').map(Number);

    const nextAvailable = new Date(now);
    nextAvailable.setHours(endHour, endMinute, 0, 0);

    // If end time is earlier today, it's tomorrow
    if (nextAvailable <= now) {
      nextAvailable.setDate(nextAvailable.getDate() + 1);
    }

    return nextAvailable;
  }

  // -------------------------------------------------------------------------
  // Metrics & Analytics
  // -------------------------------------------------------------------------

  /**
   * Get notification metrics for a period
   */
  static getMetrics(startDate: string, endDate: string): NotificationMetrics {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const periodNotifications = this.notifications.filter(n => {
      const createdAt = new Date(n.createdAt);
      return createdAt >= start && createdAt <= end;
    });

    const totalSent = periodNotifications.length;

    // Count by channel
    const byChannel: Record<NotificationChannel, number> = {
      push: 0,
      email: 0,
      sms: 0,
      in_app: 0,
    };
    periodNotifications.forEach(n => {
      n.channels.forEach(ch => {
        byChannel[ch]++;
      });
    });

    // Count by category
    const byCategory: Record<NotificationCategory, number> = {} as any;
    periodNotifications.forEach(n => {
      byCategory[n.category] = (byCategory[n.category] || 0) + 1;
    });

    // Count by priority
    const byPriority: Record<NotificationPriority, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    };
    periodNotifications.forEach(n => {
      byPriority[n.priority]++;
    });

    // Delivery metrics
    const delivered = periodNotifications.filter(n =>
      Object.values(n.deliveryStatus).some(s => s === 'delivered')
    ).length;
    const failed = periodNotifications.filter(n =>
      Object.values(n.deliveryStatus).every(s => s === 'failed')
    ).length;
    const deliveryRate = totalSent > 0 ? (delivered / totalSent) * 100 : 0;
    const failureRate = totalSent > 0 ? (failed / totalSent) * 100 : 0;

    // Delivery time
    const deliveryTimes = periodNotifications
      .filter(n => n.sentAt && n.deliveredAt)
      .map(n => {
        const sent = new Date(n.sentAt!).getTime();
        const delivered = new Date(n.deliveredAt!).getTime();
        return (delivered - sent) / 1000; // seconds
      });
    const averageDeliveryTime =
      deliveryTimes.length > 0
        ? deliveryTimes.reduce((sum, t) => sum + t, 0) / deliveryTimes.length
        : 0;

    // Engagement metrics
    const read = periodNotifications.filter(n => n.readStatus !== 'unread').length;
    const clicked = periodNotifications.filter(n => n.clickCount > 0).length;
    const actionTaken = periodNotifications.filter(n => n.actionTaken).length;

    const readRate = totalSent > 0 ? (read / totalSent) * 100 : 0;
    const clickRate = totalSent > 0 ? (clicked / totalSent) * 100 : 0;
    const actionRate = totalSent > 0 ? (actionTaken / totalSent) * 100 : 0;

    // Time to read
    const readTimes = periodNotifications
      .filter(n => n.readAt && n.createdAt)
      .map(n => {
        const created = new Date(n.createdAt).getTime();
        const read = new Date(n.readAt!).getTime();
        return (read - created) / 1000; // seconds
      });
    const averageTimeToRead =
      readTimes.length > 0 ? readTimes.reduce((sum, t) => sum + t, 0) / readTimes.length : 0;

    // Channel performance
    const channelPerformance: ChannelPerformance[] = (['push', 'email', 'sms', 'in_app'] as NotificationChannel[]).map(
      channel => {
        const channelNotifs = periodNotifications.filter(n => n.channels.includes(channel));
        const sent = channelNotifs.length;
        const delivered = channelNotifs.filter(n => n.deliveryStatus[channel] === 'delivered').length;
        const failed = channelNotifs.filter(n => n.deliveryStatus[channel] === 'failed').length;
        const deliveryRate = sent > 0 ? (delivered / sent) * 100 : 0;
        const read = channelNotifs.filter(n => n.readStatus !== 'unread').length;
        const readRate = sent > 0 ? (read / sent) * 100 : 0;

        const channelDeliveryTimes = channelNotifs
          .filter(n => n.sentAt && n.deliveredAt && n.deliveryStatus[channel] === 'delivered')
          .map(n => {
            const sent = new Date(n.sentAt!).getTime();
            const delivered = new Date(n.deliveredAt!).getTime();
            return (delivered - sent) / 1000;
          });
        const avgDeliveryTime =
          channelDeliveryTimes.length > 0
            ? channelDeliveryTimes.reduce((sum, t) => sum + t, 0) / channelDeliveryTimes.length
            : 0;

        return {
          channel,
          sent,
          delivered,
          failed,
          deliveryRate,
          averageDeliveryTime: avgDeliveryTime,
          readRate,
        };
      }
    );

    return {
      period: { startDate, endDate },
      totalSent,
      byChannel,
      byCategory,
      byPriority,
      deliveryRate,
      averageDeliveryTime,
      failureRate,
      readRate,
      clickRate,
      actionRate,
      averageTimeToRead,
      channelPerformance,
    };
  }

  // -------------------------------------------------------------------------
  // Pre-defined Templates
  // -------------------------------------------------------------------------

  /**
   * Initialize default notification templates
   */
  static initializeDefaultTemplates(): void {
    const templates: NotificationTemplate[] = [
      {
        id: 'material_shortage',
        name: 'Material Shortage Alert',
        category: 'material_alert',
        description: 'Notification for material shortages',
        titleTemplate: '⚠️ {{materialName}} Shortage',
        messageTemplate: 'Shortage of {{shortageAmount}} {{unit}} detected. Required: {{requiredQuantity}}, Available: {{currentQuantity}}',
        variables: ['materialName', 'shortageAmount', 'unit', 'requiredQuantity', 'currentQuantity'],
        defaultChannels: ['push', 'email', 'in_app'],
        defaultPriority: 'high',
        enabled: true,
        actions: [
          {
            id: 'create_po',
            label: 'Create Purchase Order',
            action: 'create_purchase_order',
            style: 'primary',
            requiresConfirmation: false,
          },
          {
            id: 'view_details',
            label: 'View Details',
            action: 'view_material_details',
            style: 'secondary',
            requiresConfirmation: false,
          },
        ],
      },
      {
        id: 'equipment_maintenance',
        name: 'Equipment Maintenance Due',
        category: 'equipment_update',
        description: 'Notification for upcoming equipment maintenance',
        titleTemplate: '🔧 {{equipmentName}} Maintenance Due',
        messageTemplate: 'Maintenance scheduled for {{maintenanceDate}}. Estimated duration: {{duration}} hours. {{affectedProjects}} projects may be affected.',
        variables: ['equipmentName', 'maintenanceDate', 'duration', 'affectedProjects'],
        defaultChannels: ['email', 'in_app'],
        defaultPriority: 'medium',
        enabled: true,
      },
      {
        id: 'delivery_delay',
        name: 'Delivery Delay Alert',
        category: 'delivery_status',
        description: 'Notification for delivery delays',
        titleTemplate: '⏰ Delivery Delayed: {{materialName}}',
        messageTemplate: 'Delivery delayed by {{delayDays}} days. New ETA: {{newDeliveryDate}}. Reason: {{delayReason}}',
        variables: ['materialName', 'delayDays', 'newDeliveryDate', 'delayReason'],
        defaultChannels: ['push', 'email', 'sms', 'in_app'],
        defaultPriority: 'critical',
        enabled: true,
      },
      {
        id: 'inventory_reorder',
        name: 'Inventory Reorder Notification',
        category: 'inventory_warning',
        description: 'Notification for automatic reorders',
        titleTemplate: '📦 Auto-Reorder: {{materialName}}',
        messageTemplate: 'Inventory below reorder point ({{currentLevel}}/{{reorderPoint}}). Order for {{reorderQuantity}} {{unit}} has been {{orderStatus}}.',
        variables: ['materialName', 'currentLevel', 'reorderPoint', 'reorderQuantity', 'unit', 'orderStatus'],
        defaultChannels: ['email', 'in_app'],
        defaultPriority: 'medium',
        enabled: true,
      },
      {
        id: 'approval_request',
        name: 'Approval Request',
        category: 'approval_request',
        description: 'Notification for approval requests',
        titleTemplate: '✋ Approval Required: {{itemName}}',
        messageTemplate: '{{requesterName}} is requesting approval for {{itemName}}. Amount: {{amount}}. Reason: {{reason}}',
        variables: ['itemName', 'requesterName', 'amount', 'reason'],
        defaultChannels: ['push', 'email', 'in_app'],
        defaultPriority: 'high',
        enabled: true,
        actions: [
          {
            id: 'approve',
            label: 'Approve',
            action: 'approve_request',
            style: 'primary',
            requiresConfirmation: true,
            confirmationMessage: 'Are you sure you want to approve this request?',
          },
          {
            id: 'reject',
            label: 'Reject',
            action: 'reject_request',
            style: 'danger',
            requiresConfirmation: true,
            confirmationMessage: 'Are you sure you want to reject this request?',
          },
        ],
      },
    ];

    templates.forEach(t => this.registerTemplate(t));
  }

  // -------------------------------------------------------------------------
  // Utility Methods
  // -------------------------------------------------------------------------

  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Initialize default templates on load
NotificationService.initializeDefaultTemplates();
