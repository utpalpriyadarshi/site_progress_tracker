/**
 * LogisticsIntegrationService - Week 7
 *
 * Cross-system integrations:
 * - Accounting: Inventory valuation sync
 * - Projects: Timeline and resource integration
 * - Sites: Location-based automation
 * - External APIs: Weather, maps, suppliers
 * - Webhook management
 * - Data synchronization
 */

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type IntegrationSystem = 'accounting' | 'projects' | 'sites' | 'weather' | 'maps' | 'suppliers' | 'erp';

export type SyncStatus = 'success' | 'partial' | 'failed' | 'pending';

export type WebhookEvent =
  | 'material.created'
  | 'material.updated'
  | 'delivery.scheduled'
  | 'delivery.completed'
  | 'inventory.adjusted'
  | 'equipment.allocated'
  | 'bom.approved'
  | 'exception.created';

export interface IntegrationConfig {
  id: string;
  system: IntegrationSystem;
  name: string;
  enabled: boolean;

  // Connection
  baseUrl?: string;
  apiKey?: string;
  credentials?: {
    username?: string;
    password?: string;
    token?: string;
  };

  // Settings
  syncInterval?: number; // minutes
  syncDirection: 'push' | 'pull' | 'bidirectional';
  autoSync: boolean;

  // Mapping
  fieldMappings?: FieldMapping[];

  // Status
  lastSyncAt?: string;
  lastSyncStatus?: SyncStatus;
  connected: boolean;
}

export interface FieldMapping {
  sourceField: string;
  targetField: string;
  transform?: (value: any) => any;
  required: boolean;
}

export interface SyncOperation {
  id: string;
  system: IntegrationSystem;
  operation: 'create' | 'update' | 'delete' | 'sync';
  entityType: string;
  entityId: string;

  // Status
  status: SyncStatus;
  startedAt: string;
  completedAt?: string;
  duration?: number; // milliseconds

  // Results
  recordsProcessed: number;
  recordsSuccess: number;
  recordsFailed: number;
  errors: SyncError[];

  // Metadata
  triggeredBy: 'manual' | 'scheduled' | 'webhook' | 'event';
}

export interface SyncError {
  entityId: string;
  field?: string;
  error: string;
  timestamp: string;
}

export interface WebhookEndpoint {
  id: string;
  url: string;
  events: WebhookEvent[];
  enabled: boolean;
  secret?: string;

  // Delivery
  retryOnFailure: boolean;
  maxRetries: number;

  // Status
  lastTriggeredAt?: string;
  successCount: number;
  failureCount: number;
}

export interface WebhookPayload {
  event: WebhookEvent;
  timestamp: string;
  data: Record<string, any>;
  signature?: string;
}

// Accounting Integration
export interface AccountingInventoryValuation {
  materialId: string;
  materialName: string;
  quantity: number;
  unitCost: number;
  totalValue: number;
  locationId: string;
  locationName: string;
  costingMethod: 'FIFO' | 'LIFO' | 'WAC';
  accountCode: string;
  lastUpdated: string;
}

export interface AccountingTransaction {
  id: string;
  type: 'purchase' | 'usage' | 'adjustment' | 'transfer';
  date: string;
  materialId: string;
  materialName: string;
  quantity: number;
  unitCost: number;
  totalAmount: number;
  debitAccount: string;
  creditAccount: string;
  reference: string;
  description: string;
  synced: boolean;
}

// Projects Integration
export interface ProjectResourceIntegration {
  projectId: string;
  projectName: string;

  // Materials
  materialsAllocated: MaterialAllocation[];
  materialsUsed: MaterialUsage[];
  materialsRemaining: number;

  // Equipment
  equipmentAllocated: EquipmentAllocation[];
  equipmentUtilization: number; // percentage

  // Timeline
  timeline: ProjectTimeline;
  dependencies: ProjectDependency[];

  // Status
  lastSyncAt: string;
  syncStatus: SyncStatus;
}

export interface MaterialAllocation {
  materialId: string;
  materialName: string;
  allocatedQuantity: number;
  usedQuantity: number;
  remainingQuantity: number;
  allocatedDate: string;
}

export interface MaterialUsage {
  materialId: string;
  materialName: string;
  quantity: number;
  date: string;
  taskId?: string;
  taskName?: string;
}

export interface EquipmentAllocation {
  equipmentId: string;
  equipmentName: string;
  startDate: string;
  endDate: string;
  hoursAllocated: number;
  hoursUsed: number;
  utilizationRate: number;
}

export interface ProjectTimeline {
  startDate: string;
  endDate: string;
  actualStartDate?: string;
  estimatedCompletionDate: string;
  percentComplete: number;
  criticalPath: boolean;
  delayDays: number;
}

export interface ProjectDependency {
  dependentProjectId: string;
  dependentProjectName: string;
  dependencyType: 'material' | 'equipment' | 'resource';
  blocked: boolean;
  reason?: string;
}

// Sites Integration
export interface SiteLocationData {
  siteId: string;
  siteName: string;

  // Location
  address: string;
  coordinates: { latitude: number; longitude: number };
  timezone: string;

  // Facilities
  facilities: SiteFacility[];

  // Logistics
  deliveryInstructions: string;
  accessRestrictions: string[];
  operatingHours: { start: string; end: string };

  // Environment
  weatherData?: WeatherData;
  nearbySuppliers: NearbySupplier[];

  // Status
  lastUpdated: string;
}

export interface SiteFacility {
  type: 'storage' | 'parking' | 'loading_dock' | 'office';
  capacity: number;
  available: number;
  units: string;
}

// Weather Integration
export interface WeatherData {
  location: string;
  coordinates: { latitude: number; longitude: number };
  current: CurrentWeather;
  forecast: WeatherForecast[];
  alerts: WeatherAlert[];
  lastUpdated: string;
}

export interface CurrentWeather {
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  windDirection: string;
  precipitation: number;
  conditions: string;
  visibility: number;
}

export interface WeatherForecast {
  date: string;
  highTemp: number;
  lowTemp: number;
  precipitation: number;
  precipitationChance: number;
  windSpeed: number;
  conditions: string;
}

export interface WeatherAlert {
  type: 'warning' | 'watch' | 'advisory';
  severity: 'extreme' | 'severe' | 'moderate' | 'minor';
  event: string;
  description: string;
  startTime: string;
  endTime: string;
}

// Maps Integration
export interface RouteCalculation {
  origin: { latitude: number; longitude: number; address: string };
  destination: { latitude: number; longitude: number; address: string };

  // Route details
  distance: number; // kilometers
  duration: number; // minutes
  steps: RouteStep[];

  // Traffic
  trafficConditions: 'light' | 'moderate' | 'heavy' | 'severe';
  delayMinutes: number;

  // Alternatives
  alternativeRoutes: AlternativeRoute[];

  // Restrictions
  tollsRequired: boolean;
  estimatedTollCost?: number;
  truckRestrictions: string[];
}

export interface RouteStep {
  instruction: string;
  distance: number;
  duration: number;
  coordinates: { latitude: number; longitude: number };
}

export interface AlternativeRoute {
  name: string;
  distance: number;
  duration: number;
  savings: { distance: number; time: number; cost: number };
}

// Supplier Integration
export interface SupplierIntegrationData {
  supplierId: string;
  supplierName: string;

  // Connection
  apiEndpoint?: string;
  connected: boolean;
  lastSyncAt?: string;

  // Catalog
  catalogItems: SupplierCatalogItem[];

  // Pricing
  priceUpdates: PriceUpdate[];

  // Availability
  availabilityData: MaterialAvailability[];

  // Orders
  activeOrders: SupplierOrder[];
}

export interface SupplierCatalogItem {
  supplierSKU: string;
  internalMaterialId?: string;
  materialName: string;
  description: string;
  unitPrice: number;
  unit: string;
  leadTime: number;
  moq: number; // Minimum Order Quantity
  available: boolean;
  lastUpdated: string;
}

export interface PriceUpdate {
  materialId: string;
  materialName: string;
  oldPrice: number;
  newPrice: number;
  changePercentage: number;
  effectiveDate: string;
  reason?: string;
}

export interface MaterialAvailability {
  materialId: string;
  materialName: string;
  quantityAvailable: number;
  nextRestockDate?: string;
  leadTime: number;
}

export interface SupplierOrder {
  orderId: string;
  orderDate: string;
  expectedDeliveryDate: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered';
  items: SupplierOrderItem[];
  totalAmount: number;
}

export interface SupplierOrderItem {
  materialId: string;
  materialName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

// Nearby Supplier
export interface NearbySupplier {
  supplierId: string;
  supplierName: string;
  distance: number; // kilometers
  travelTime: number; // minutes
  coordinates: { latitude: number; longitude: number };
  materials: string[];
  rating: number;
}

// ============================================================================
// SERVICE CLASS
// ============================================================================

export class LogisticsIntegrationService {
  private static integrations: Map<IntegrationSystem, IntegrationConfig> = new Map();
  private static syncOperations: SyncOperation[] = [];
  private static webhooks: WebhookEndpoint[] = [];

  // -------------------------------------------------------------------------
  // Integration Management
  // -------------------------------------------------------------------------

  /**
   * Register an integration
   */
  static registerIntegration(config: IntegrationConfig): void {
    this.integrations.set(config.system, config);
  }

  /**
   * Get integration config
   */
  static getIntegration(system: IntegrationSystem): IntegrationConfig | undefined {
    return this.integrations.get(system);
  }

  /**
   * Test integration connection
   */
  static async testConnection(system: IntegrationSystem): Promise<boolean> {
    const config = this.integrations.get(system);
    if (!config || !config.enabled) {
      return false;
    }

    // Mock connection test
    console.log(`Testing connection to ${system}...`);
    await this.delay(500);

    config.connected = true;
    config.lastSyncAt = new Date().toISOString();
    config.lastSyncStatus = 'success';

    return true;
  }

  // -------------------------------------------------------------------------
  // Accounting Integration
  // -------------------------------------------------------------------------

  /**
   * Sync inventory valuation to accounting system
   */
  static async syncInventoryValuation(
    inventoryItems: any[]
  ): Promise<AccountingInventoryValuation[]> {
    const valuations: AccountingInventoryValuation[] = inventoryItems.map(item => ({
      materialId: item.materialId,
      materialName: item.materialName,
      quantity: item.quantity,
      unitCost: item.unitCost,
      totalValue: item.quantity * item.unitCost,
      locationId: item.locationId,
      locationName: item.locationName,
      costingMethod: item.costingMethod || 'WAC',
      accountCode: this.getAccountCode(item.category),
      lastUpdated: new Date().toISOString(),
    }));

    // Record sync operation
    this.recordSync('accounting', 'sync', 'inventory_valuation', 'batch', valuations.length, 0);

    return valuations;
  }

  /**
   * Create accounting transaction for material usage
   */
  static createAccountingTransaction(
    type: AccountingTransaction['type'],
    materialId: string,
    materialName: string,
    quantity: number,
    unitCost: number,
    reference: string,
    description: string
  ): AccountingTransaction {
    const transaction: AccountingTransaction = {
      id: `txn-${Date.now()}`,
      type,
      date: new Date().toISOString(),
      materialId,
      materialName,
      quantity,
      unitCost,
      totalAmount: quantity * unitCost,
      debitAccount: this.getDebitAccount(type),
      creditAccount: this.getCreditAccount(type),
      reference,
      description,
      synced: false,
    };

    // Would push to accounting system here
    console.log('Created accounting transaction:', transaction.id);

    return transaction;
  }

  /**
   * Get account code based on category
   */
  private static getAccountCode(category: string): string {
    const codes: Record<string, string> = {
      'construction_materials': '1100',
      'electrical': '1110',
      'plumbing': '1120',
      'structural': '1130',
      'finishing': '1140',
    };
    return codes[category.toLowerCase()] || '1100';
  }

  /**
   * Get debit account based on transaction type
   */
  private static getDebitAccount(type: AccountingTransaction['type']): string {
    const accounts: Record<string, string> = {
      purchase: '1100', // Inventory
      usage: '5000', // Cost of Goods Sold
      adjustment: '6000', // Inventory Adjustments
      transfer: '1100', // Inventory
    };
    return accounts[type];
  }

  /**
   * Get credit account based on transaction type
   */
  private static getCreditAccount(type: AccountingTransaction['type']): string {
    const accounts: Record<string, string> = {
      purchase: '2100', // Accounts Payable
      usage: '1100', // Inventory
      adjustment: '6000', // Inventory Adjustments
      transfer: '1100', // Inventory
    };
    return accounts[type];
  }

  // -------------------------------------------------------------------------
  // Projects Integration
  // -------------------------------------------------------------------------

  /**
   * Sync project resources
   */
  static async syncProjectResources(
    projectId: string,
    projectName: string,
    materials: any[],
    equipment: any[]
  ): Promise<ProjectResourceIntegration> {
    // Calculate material allocations
    const materialsAllocated: MaterialAllocation[] = materials.map(m => ({
      materialId: m.materialId,
      materialName: m.materialName,
      allocatedQuantity: m.allocatedQuantity,
      usedQuantity: m.usedQuantity || 0,
      remainingQuantity: m.allocatedQuantity - (m.usedQuantity || 0),
      allocatedDate: m.allocatedDate || new Date().toISOString(),
    }));

    // Calculate equipment allocations
    const equipmentAllocated: EquipmentAllocation[] = equipment.map(e => ({
      equipmentId: e.equipmentId,
      equipmentName: e.equipmentName,
      startDate: e.startDate,
      endDate: e.endDate,
      hoursAllocated: e.hoursAllocated,
      hoursUsed: e.hoursUsed || 0,
      utilizationRate: e.hoursAllocated > 0 ? ((e.hoursUsed || 0) / e.hoursAllocated) * 100 : 0,
    }));

    // Mock timeline
    const timeline: ProjectTimeline = {
      startDate: new Date().toISOString(),
      endDate: this.addDays(new Date(), 90).toISOString(),
      estimatedCompletionDate: this.addDays(new Date(), 85).toISOString(),
      percentComplete: 35,
      criticalPath: true,
      delayDays: 0,
    };

    const integration: ProjectResourceIntegration = {
      projectId,
      projectName,
      materialsAllocated,
      materialsUsed: [],
      materialsRemaining: materialsAllocated.reduce((sum, m) => sum + m.remainingQuantity, 0),
      equipmentAllocated,
      equipmentUtilization: equipmentAllocated.reduce((sum, e) => sum + e.utilizationRate, 0) / equipmentAllocated.length || 0,
      timeline,
      dependencies: [],
      lastSyncAt: new Date().toISOString(),
      syncStatus: 'success',
    };

    // Record sync
    this.recordSync('projects', 'sync', 'project_resources', projectId, materials.length + equipment.length, 0);

    return integration;
  }

  // -------------------------------------------------------------------------
  // Sites Integration
  // -------------------------------------------------------------------------

  /**
   * Get site location data with logistics information
   */
  static async getSiteLocationData(
    siteId: string,
    siteName: string,
    address: string,
    coordinates: { latitude: number; longitude: number }
  ): Promise<SiteLocationData> {
    // Get weather data
    const weatherData = await this.getWeatherData(coordinates.latitude, coordinates.longitude);

    // Find nearby suppliers
    const nearbySuppliers = await this.findNearbySuppliers(coordinates);

    const siteData: SiteLocationData = {
      siteId,
      siteName,
      address,
      coordinates,
      timezone: 'America/New_York', // Mock
      facilities: [
        { type: 'storage', capacity: 1000, available: 650, units: 'm³' },
        { type: 'parking', capacity: 20, available: 12, units: 'vehicles' },
        { type: 'loading_dock', capacity: 4, available: 2, units: 'docks' },
      ],
      deliveryInstructions: 'Use loading dock B. Call site manager 30 minutes before arrival.',
      accessRestrictions: ['Requires security clearance', 'No deliveries on weekends'],
      operatingHours: { start: '07:00', end: '18:00' },
      weatherData,
      nearbySuppliers,
      lastUpdated: new Date().toISOString(),
    };

    return siteData;
  }

  // -------------------------------------------------------------------------
  // Weather Integration
  // -------------------------------------------------------------------------

  /**
   * Get weather data for coordinates (mock)
   */
  static async getWeatherData(latitude: number, longitude: number): Promise<WeatherData> {
    // Mock weather data
    const weatherData: WeatherData = {
      location: `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`,
      coordinates: { latitude, longitude },
      current: {
        temperature: 22,
        feelsLike: 20,
        humidity: 65,
        windSpeed: 15,
        windDirection: 'NW',
        precipitation: 0,
        conditions: 'Partly Cloudy',
        visibility: 10,
      },
      forecast: [
        {
          date: new Date().toISOString(),
          highTemp: 25,
          lowTemp: 18,
          precipitation: 0,
          precipitationChance: 10,
          windSpeed: 12,
          conditions: 'Sunny',
        },
        {
          date: this.addDays(new Date(), 1).toISOString(),
          highTemp: 23,
          lowTemp: 16,
          precipitation: 5,
          precipitationChance: 40,
          windSpeed: 18,
          conditions: 'Light Rain',
        },
      ],
      alerts: [],
      lastUpdated: new Date().toISOString(),
    };

    return weatherData;
  }

  /**
   * Check if weather conditions are suitable for delivery
   */
  static isDeliverySafeInWeather(weatherData: WeatherData): {
    safe: boolean;
    warnings: string[];
  } {
    const warnings: string[] = [];

    // Check current conditions
    if (weatherData.current.windSpeed > 50) {
      warnings.push('High wind speeds may affect delivery safety');
    }
    if (weatherData.current.precipitation > 10) {
      warnings.push('Heavy precipitation may delay delivery');
    }
    if (weatherData.current.visibility < 5) {
      warnings.push('Low visibility may impact delivery');
    }

    // Check alerts
    weatherData.alerts.forEach(alert => {
      if (alert.severity === 'extreme' || alert.severity === 'severe') {
        warnings.push(`${alert.event}: ${alert.description}`);
      }
    });

    return {
      safe: warnings.length === 0,
      warnings,
    };
  }

  // -------------------------------------------------------------------------
  // Maps Integration
  // -------------------------------------------------------------------------

  /**
   * Calculate delivery route (mock)
   */
  static async calculateRoute(
    origin: { latitude: number; longitude: number; address: string },
    destination: { latitude: number; longitude: number; address: string }
  ): Promise<RouteCalculation> {
    // Mock route calculation
    const distance = this.calculateDistance(
      origin.latitude,
      origin.longitude,
      destination.latitude,
      destination.longitude
    );

    const duration = (distance / 60) * 60; // Assume 60 km/h average speed

    const route: RouteCalculation = {
      origin,
      destination,
      distance,
      duration,
      steps: [
        {
          instruction: `Head ${origin.address}`,
          distance: distance * 0.3,
          duration: duration * 0.3,
          coordinates: origin,
        },
        {
          instruction: `Continue to ${destination.address}`,
          distance: distance * 0.7,
          duration: duration * 0.7,
          coordinates: destination,
        },
      ],
      trafficConditions: 'moderate',
      delayMinutes: 5,
      alternativeRoutes: [
        {
          name: 'Highway Route',
          distance: distance * 1.1,
          duration: duration * 0.9,
          savings: { distance: -distance * 0.1, time: duration * 0.1, cost: 5 },
        },
      ],
      tollsRequired: false,
      truckRestrictions: [],
    };

    return route;
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  private static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  // -------------------------------------------------------------------------
  // Supplier Integration
  // -------------------------------------------------------------------------

  /**
   * Get supplier integration data
   */
  static async getSupplierIntegrationData(supplierId: string): Promise<SupplierIntegrationData> {
    // Mock supplier data
    const supplierData: SupplierIntegrationData = {
      supplierId,
      supplierName: `Supplier ${supplierId}`,
      connected: true,
      lastSyncAt: new Date().toISOString(),
      catalogItems: [
        {
          supplierSKU: 'SKU-001',
          materialName: 'Concrete Mix',
          description: 'High-strength concrete mix',
          unitPrice: 150,
          unit: 'm³',
          leadTime: 3,
          moq: 10,
          available: true,
          lastUpdated: new Date().toISOString(),
        },
      ],
      priceUpdates: [],
      availabilityData: [],
      activeOrders: [],
    };

    return supplierData;
  }

  /**
   * Find nearby suppliers based on coordinates
   */
  static async findNearbySuppliers(
    coordinates: { latitude: number; longitude: number }
  ): Promise<NearbySupplier[]> {
    // Mock nearby suppliers
    const suppliers: NearbySupplier[] = [
      {
        supplierId: 's1',
        supplierName: 'ABC Materials Inc',
        distance: 12.5,
        travelTime: 18,
        coordinates: { latitude: coordinates.latitude + 0.1, longitude: coordinates.longitude + 0.1 },
        materials: ['concrete', 'steel', 'lumber'],
        rating: 4.5,
      },
      {
        supplierId: 's2',
        supplierName: 'XYZ Supplies Co',
        distance: 8.3,
        travelTime: 12,
        coordinates: { latitude: coordinates.latitude - 0.05, longitude: coordinates.longitude + 0.08 },
        materials: ['electrical', 'plumbing', 'hardware'],
        rating: 4.2,
      },
    ];

    return suppliers.sort((a, b) => a.distance - b.distance);
  }

  // -------------------------------------------------------------------------
  // Webhook Management
  // -------------------------------------------------------------------------

  /**
   * Register webhook endpoint
   */
  static registerWebhook(webhook: WebhookEndpoint): void {
    this.webhooks.push(webhook);
  }

  /**
   * Trigger webhook for event
   */
  static async triggerWebhook(event: WebhookEvent, data: Record<string, any>): Promise<void> {
    const relevantWebhooks = this.webhooks.filter(
      wh => wh.enabled && wh.events.includes(event)
    );

    for (const webhook of relevantWebhooks) {
      const payload: WebhookPayload = {
        event,
        timestamp: new Date().toISOString(),
        data,
        signature: this.generateSignature(webhook.secret, data),
      };

      try {
        await this.sendWebhook(webhook, payload);
        webhook.successCount++;
        webhook.lastTriggeredAt = new Date().toISOString();
      } catch (error) {
        webhook.failureCount++;
        console.error(`Webhook failed for ${webhook.url}:`, error);

        if (webhook.retryOnFailure && webhook.maxRetries > 0) {
          // Would implement retry logic here
        }
      }
    }
  }

  /**
   * Send webhook (mock)
   */
  private static async sendWebhook(
    webhook: WebhookEndpoint,
    payload: WebhookPayload
  ): Promise<void> {
    console.log(`Sending webhook to ${webhook.url}:`, payload.event);
    await this.delay(100);
    // In real app: HTTP POST to webhook.url with payload
  }

  /**
   * Generate webhook signature
   */
  private static generateSignature(secret: string | undefined, data: Record<string, any>): string {
    if (!secret) return '';
    // In real app: use HMAC SHA256
    const raw = JSON.stringify(data) + secret;
    return `sha256=${btoa(unescape(encodeURIComponent(raw)))}`;
  }

  // -------------------------------------------------------------------------
  // Sync Operations
  // -------------------------------------------------------------------------

  /**
   * Record sync operation
   */
  private static recordSync(
    system: IntegrationSystem,
    operation: SyncOperation['operation'],
    entityType: string,
    entityId: string,
    successCount: number,
    failCount: number
  ): void {
    const sync: SyncOperation = {
      id: `sync-${Date.now()}`,
      system,
      operation,
      entityType,
      entityId,
      status: failCount === 0 ? 'success' : successCount > 0 ? 'partial' : 'failed',
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      duration: 1000,
      recordsProcessed: successCount + failCount,
      recordsSuccess: successCount,
      recordsFailed: failCount,
      errors: [],
      triggeredBy: 'manual',
    };

    this.syncOperations.push(sync);

    // Update integration status
    const config = this.integrations.get(system);
    if (config) {
      config.lastSyncAt = sync.completedAt;
      config.lastSyncStatus = sync.status;
    }
  }

  /**
   * Get sync history
   */
  static getSyncHistory(
    system?: IntegrationSystem,
    limit: number = 50
  ): SyncOperation[] {
    let filtered = system
      ? this.syncOperations.filter(s => s.system === system)
      : this.syncOperations;

    return filtered.slice(-limit).reverse();
  }

  // -------------------------------------------------------------------------
  // Utility Methods
  // -------------------------------------------------------------------------

  private static addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
