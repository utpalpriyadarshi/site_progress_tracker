


Logistics Tabs Implementation Prompts
Prompt 1: Materials Tracking Tab - BOM Integrated
markdown
IMPLEMENT: Materials Tracking Tab with BOM Integration

REQUIREMENT: Enhance Materials Tracking Screen to be BOM-aware with intelligent procurement

FILE: src/logistics/MaterialTrackingScreen.tsx

CORE FEATURES TO IMPLEMENT:

1. BOM-DRIVEN MATERIAL REQUIREMENTS:
   - Display BOM requirements for selected project/site
   - Show planned vs actual material quantities
   - Color-coded status (Green=Sufficient, Yellow=Low, Red=Shortage)

2. INTELLIGENT PROCUREMENT:
   - Auto-generated purchase suggestions from BOM shortages
   - Supplier comparison and selection
   - Lead time consideration in ordering

3. REAL-TIME STOCK MONITORING:
   - Multi-location inventory tracking
   - Consumption rate analytics
   - Reorder level automation

DATA MODELS NEEDED:

interface MaterialTrackingView {
  materialId: string;
  materialName: string;
  category: string;
  
  // BOM Requirements
  bomRequired: number;
  bomUnit: string;
  bomPhase: string;
  
  // Current Status
  currentStock: number;
  allocatedStock: number;  // Reserved for active work
  availableStock: number;  // currentStock - allocatedStock
  
  // Procurement
  reorderLevel: number;
  leadTime: number;        // Days for delivery
  preferredSupplier: string;
  lastOrderDate: Date;
  
  // Status Calculation
  status: 'adequate' | 'low' | 'critical';
  shortageQuantity: number;
  urgency: 'low' | 'medium' | 'high';
}

VISUAL COMPONENTS:

1. Material Status Cards:
   - Material name, category, image
   - Progress bar: Current vs Required
   - Color-coded status badge
   - Quick action buttons (Order, Transfer, Allocate)

2. Procurement Panel:
   - Suggested purchase orders from shortages
   - Supplier quotes comparison
   - Bulk order creation

3. Stock Movement Timeline:
   - Recent stock in/out movements
   - Consumption trends
   - Delivery expected dates

INTEGRATION POINTS:

- BOM: Pull material requirements
- Projects: Filter by active projects
- Sites: Show site-specific requirements
- Suppliers: Integrate supplier database

Please implement complete Materials Tracking Screen with BOM integration and real-time status monitoring.
Prompt 2: Equipment Management Tab - Enhanced
markdown
IMPLEMENT: Equipment Management Tab with Maintenance & Allocation

REQUIREMENT: Create comprehensive equipment tracking with maintenance scheduling and site allocation

FILE: src/logistics/EquipmentManagementScreen.tsx

CORE FEATURES:

1. EQUIPMENT INVENTORY & STATUS:
   - Complete equipment database with specs
   - Real-time status tracking (Available, In-Use, Maintenance, Repair)
   - Location tracking across sites

2. MAINTENANCE MANAGEMENT:
   - Preventive maintenance scheduling
   - Maintenance history and costs
   - Downtime tracking and analysis

3. ALLOCATION & UTILIZATION:
   - Equipment allocation to sites/projects
   - Utilization rate analytics
   - Operator assignment and certification tracking

DATA MODELS:

interface Equipment {
  id: string;
  name: string;
  type: 'heavy' | 'light' | 'specialized' | 'vehicle';
  category: string;  // 'Excavation', 'Concrete', 'Electrical', etc.
  model: string;
  serialNumber: string;
  
  // Status & Location
  currentStatus: 'available' | 'in_use' | 'maintenance' | 'repair' | 'retired';
  currentSiteId: string;
  currentProjectId: string;
  
  // Maintenance
  lastMaintenanceDate: Date;
  nextMaintenanceDate: Date;
  maintenanceInterval: number;  // Days or hours
  totalOperatingHours: number;
  
  // Allocation
  assignedOperator: string;
  operatorCertification: string;
  utilizationRate: number;  // Percentage
  
  // Costs
  purchaseCost: number;
  maintenanceCost: number;
  depreciationRate: number;
}

VISUAL COMPONENTS:

1. Equipment Dashboard:
   - Status summary cards (Available, In Use, Maintenance)
   - Utilization rate gauge
   - Maintenance overdue alerts

2. Equipment Calendar:
   - Maintenance schedule view
   - Allocation timeline
   - Availability forecasting

3. Maintenance Module:
   - Maintenance checklist templates
   - Parts and labor tracking
   - Service history records

INTELLIGENT FEATURES:

1. Predictive Maintenance:
   - Usage-based maintenance alerts
   - Parts replacement forecasting
   - Downtime cost analysis

2. Allocation Optimization:
   - Equipment sharing between sites
   - Rental vs Purchase analysis
   - Utilization improvement suggestions

INTEGRATION:
- BOM: Equipment requirements from project plans
- Projects: Equipment needs by phase
- Sites: Location-based equipment tracking

Please implement comprehensive Equipment Management with maintenance and allocation features.
Prompt 3: Delivery Scheduling Tab - BOM Optimized
markdown
IMPLEMENT: Delivery Scheduling Tab with BOM-Driven Optimization

REQUIREMENT: Create intelligent delivery scheduling based on BOM requirements and site progress

FILE: src/logistics/DeliverySchedulingScreen.tsx

CORE FEATURES:

1. BOM-DRIVEN DELIVERY PLANNING:
   - Automatic delivery scheduling from BOM phases
   - Just-in-time delivery optimization
   - Site readiness validation

2. DELIVERY EXECUTION & TRACKING:
   - Real-time delivery status updates
   - Driver and vehicle assignment
   - Route optimization and GPS tracking

3. DELIVERY ANALYTICS:
   - On-time delivery performance
   - Cost per delivery analysis
   - Carrier performance metrics

DATA MODELS:

interface DeliverySchedule {
  id: string;
  deliveryNumber: string;
  
  // Scheduling
  scheduledDate: Date;
  estimatedArrival: Date;
  actualArrival?: Date;
  
  // Parties
  supplierId: string;
  carrierId: string;
  driverId: string;
  vehicleId: string;
  
  // Locations
  fromLocation: string;  // Supplier/warehouse
  toLocation: string;    // Site location
  siteId: string;
  
  // Status
  status: 'scheduled' | 'loading' | 'in_transit' | 'arrived' | 'unloaded' | 'completed' | 'delayed';
  delayReason?: string;
  
  // Contents
  items: DeliveryItem[];
  totalWeight: number;
  specialInstructions: string;
  
  // Verification
  proofOfDelivery?: string;  // Photo/signature
  receivedBy?: string;
}

interface DeliveryItem {
  materialId: string;
  quantity: number;
  unit: string;
  bomReference: string;  // Links to BOM item
  phase: string;         // Construction phase
  urgency: 'low' | 'medium' | 'high';
}

VISUAL COMPONENTS:

1. Delivery Calendar View:
   - Daily/weekly delivery schedule
   - Color-coded urgency levels
   - Conflict detection and resolution

2. Live Tracking Dashboard:
   - Real-time delivery status
   - GPS tracking integration
   - ETA updates and notifications

3. Delivery Optimization Panel:
   - Route optimization suggestions
   - Load consolidation opportunities
   - Cost-saving recommendations

INTELLIGENT FEATURES:

1. Smart Scheduling:
   - Site progress-based timing
   - Weather and traffic considerations
   - Resource availability checking

2. Exception Management:
   - Delay prediction and mitigation
   - Alternative supplier sourcing
   - Emergency delivery protocols

INTEGRATION:
- BOM: Material requirements and timing
- Sites: Site access and storage capacity
- Weather: External weather data API
- Maps: Route optimization API

Please implement intelligent Delivery Scheduling with BOM optimization and real-time tracking.
Prompt 4: Inventory Management Tab - Multi-Location
markdown
IMPLEMENT: Inventory Management Tab with Multi-Location Tracking

REQUIREMENT: Create comprehensive inventory management across all sites and warehouses

FILE: src/logistics/InventoryManagementScreen.tsx

CORE FEATURES:

1. MULTI-LOCATION INVENTORY:
   - Centralized view of all inventory locations
   - Site-specific stock levels and valuations
   - Inter-site transfer management

2. INVENTORY ANALYTICS:
   - Stock turnover rates and aging
   - Inventory valuation and costing
   - Obsolete stock identification

3. INVENTORY OPTIMIZATION:
   - ABC analysis for stock categorization
   - Economic Order Quantity (EOQ) calculations
   - Safety stock level optimization

DATA MODELS:

interface InventoryLocation {
  id: string;
  name: string;
  type: 'warehouse' | 'site_storage' | 'site_active' | 'yard';
  address: string;
  capacity: number;  // Total capacity
  currentUtilization: number;  // Percentage
  manager: string;
  contact: string;
}

interface InventoryItem {
  id: string;
  materialId: string;
  locationId: string;
  
  // Stock Levels
  currentQuantity: number;
  allocatedQuantity: number;  // Reserved for issues
  availableQuantity: number;  // current - allocated
  
  // Stock Management
  minStockLevel: number;
  maxStockLevel: number;
  reorderPoint: number;
  economicOrderQuantity: number;
  
  // Valuation
  averageCost: number;
  totalValue: number;
  lastCost: number;
  
  // Analytics
  stockTurnoverRate: number;
  daysInInventory: number;
  abcCategory: 'A' | 'B' | 'C';  // ABC analysis
  
  // Movement
  lastReceivedDate: Date;
  lastIssuedDate: Date;
}

interface StockMovement {
  id: string;
  materialId: string;
  fromLocation: string;
  toLocation: string;
  quantity: number;
  movementType: 'receipt' | 'issue' | 'transfer' | 'adjustment';
  reference: string;  // PO, Delivery, Issue note, etc.
  date: Date;
  value: number;
}

VISUAL COMPONENTS:

1. Inventory Dashboard:
   - Total inventory value across locations
   - Stock category distribution
   - Critical stock alerts

2. Location Management:
   - Site and warehouse capacity utilization
   - Storage optimization suggestions
   - Location performance metrics

3. Stock Movement Timeline:
   - Complete audit trail of all movements
   - Consumption pattern analysis
   - Stock aging report

ADVANCED FEATURES:

1. Inventory Optimization:
   - ABC analysis implementation
   - EOQ calculation automation
   - Safety stock optimization

2. Cost Management:
   - FIFO/LIFO cost tracking
   - Inventory carrying cost calculation
   - Write-off and adjustment management

3. Reporting & Compliance:
   - Inventory valuation reports
   - Stock reconciliation tools
   - Audit preparation features

INTEGRATION:
- BOM: Target stock levels and valuation
- Accounting: Inventory valuation sync
- Projects: Project-specific inventory
- Sites: Location-based inventory tracking

Please implement comprehensive Inventory Management with multi-location support and advanced analytics.
Prompt 5: Logistics Dashboard & Cross-Tab Integration
markdown
IMPLEMENT: Logistics Dashboard and Cross-Tab Integration

REQUIREMENT: Create unified logistics dashboard and seamless integration between all logistics tabs

FILES TO CREATE/MODIFY:

1. CREATE: src/logistics/LogisticsDashboardScreen.tsx (NEW)
   - Unified view of all logistics operations
   - Key performance indicators (KPIs)
   - Critical alerts and actions

2. ENHANCE: src/nav/LogisticsNavigator.tsx
   - Add Dashboard as first tab
   - Update navigation flow

3. CREATE: src/logistics/context/LogisticsContext.tsx (NEW)
   - Shared state across logistics tabs
   - Real-time data synchronization

4. CREATE: src/services/LogisticsOptimizationService.ts (NEW)
   - Cross-tab optimization algorithms
   - Cost-saving recommendations
   - Performance analytics

CORE DASHBOARD FEATURES:

1. EXECUTIVE OVERVIEW:
   - Material availability status
   - Equipment utilization rates
   - Delivery performance metrics
   - Inventory health indicators

2. CRITICAL ALERTS:
   - Material shortages affecting projects
   - Equipment maintenance overdue
   - Delivery delays with impact analysis
   - Inventory discrepancies

3. PERFORMANCE KPIs:
   - On-time delivery rate: 95%
   - Equipment utilization: 78%
   - Inventory turnover: 4.2x
   - Order fulfillment rate: 98%

DATA MODELS:

interface LogisticsDashboard {
  // Material KPIs
  totalMaterialsTracked: number;
  materialsAtRisk: number;
  procurementCycleTime: number;  // Days
  
  // Equipment KPIs
  totalEquipment: number;
  equipmentAvailability: number;  // Percentage
  maintenanceCompliance: number;  // Percentage
  
  // Delivery KPIs
  deliveriesThisWeek: number;
  onTimeDeliveryRate: number;
  averageDeliveryCost: number;
  
  // Inventory KPIs
  totalInventoryValue: number;
  inventoryTurnover: number;
  stockAccuracy: number;  // Percentage
  
  // Critical Alerts
  criticalAlerts: LogisticsAlert[];
  pendingActions: PendingAction[];
}

interface LogisticsAlert {
  id: string;
  type: 'material' | 'equipment' | 'delivery' | 'inventory';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  affectedItems: string[];
  recommendedAction: string;
  timestamp: Date;
}

CROSS-TAB INTEGRATION FEATURES:

1. UNIFIED SEARCH:
   - Search across all logistics data
   - Material → Equipment → Delivery → Inventory links
   - Quick navigation between related items

2. WORKFLOW AUTOMATION:
   - Material shortage → Auto purchase suggestion
   - Equipment maintenance → Schedule impact analysis
   - Delivery delay → Project timeline adjustment
   - Inventory low → Reorder automation

3. DATA SYNCHRONIZATION:
   - Real-time updates across all tabs
   - Conflict resolution for concurrent edits
   - Audit trail for all changes

INTELLIGENT FEATURES:

1. Predictive Analytics:
   - Demand forecasting from project pipeline
   - Lead time prediction from supplier performance
   - Cost trend analysis for budgeting

2. Optimization Engine:
   - Delivery route optimization
   - Equipment allocation optimization
   - Inventory level optimization
   - Procurement bundle optimization

3. Exception Management:
   - Automatic escalation of critical issues
   - Alternative sourcing recommendations
   - Contingency planning triggers

Please implement comprehensive Logistics Dashboard with seamless cross-tab integration and intelligent features.
Execution Strategy:
Recommended Order:

Prompt 5 - Logistics Dashboard & Context (Foundation)

Prompt 1 - Materials Tracking (BOM Integrated)

Prompt 2 - Equipment Management

Prompt 3 - Delivery Scheduling

Prompt 4 - Inventory Management

Why this order:

Start with dashboard for overview and context

Then build core operational tabs

Each tab integrates with the previous

End with comprehensive inventory management

This gives you a fully integrated logistics operation that's BOM-driven and optimized for construction efficiency! 🚛🏗️📊