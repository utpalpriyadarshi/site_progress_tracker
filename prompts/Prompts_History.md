


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


Prompts
Prompt 1: Manager BOM Foundation Setup
CRITICAL: Implement Bill of Materials (BOM) Management in Manager Role

REQUIREMENT: Add BOM Management as 5th tab in Manager Navigator with dual pre/post contract support

FILES TO CREATE/MODIFY:

1. UPDATE: src/nav/ManagerNavigator.tsx
   - Add BOM Management as 5th tab
   - Update TypeScript types for new tab

2. CREATE: src/manager/BomManagementScreen.tsx (NEW)
   - Main BOM management interface
   - Tabbed interface for Pre-Contract vs Post-Contract
   - Basic BOM list with create/edit functionality

3. CREATE: src/manager/context/BomContext.tsx (NEW)
   - Shared state for BOM data across manager screens
   - Pre/Post contract BOM management

4. UPDATE: src/manager/context/ManagerContext.tsx
   - Integrate with existing ManagerContext

5. CREATE: src/database/models/BomModel.ts (NEW)
   - BOM data model with pre/post contract support
   - Relationships with Projects and Materials

DATA MODELS NEEDED:

// Pre-Contract BOM
interface EstimatingBOM {
  id: string;
  projectId: string;
  type: 'estimating';
  status: 'draft' | 'submitted' | 'won' | 'lost';
  tenderDate: Date;
  client: string;
  totalEstimatedCost: number;
  contingency: number;
  profitMargin: number;
  items: BOMItem[];
}

// Post-Contract BOM  
interface ExecutionBOM {
  id: string;
  projectId: string;
  type: 'execution';
  status: 'baseline' | 'active' | 'closed';
  contractValue: number;
  clientBOMReference: string;
  totalActualCost: number;
  items: BOMItem[];
}

// BOM Item
interface BOMItem {
  id: string;
  materialId: string;
  description: string;
  category: string;
  quantity: number;
  unit: string;
  unitCost: number;
  totalCost: number;
  wbsCode: string;
  phase: string;
}

IMPLEMENTATION REQUIREMENTS:
1. Dual BOM type support (estimating/execution)
2. Basic CRUD operations for BOMs
3. Cost percentage calculations
4. Integration with existing Project and Material models
5. WatermelonDB offline capability

Please provide complete code for all new files and modifications.
Prompt 2: BOM Cost Tracking & Percentage Features
markdown
ENHANCE BOM: Implement Cost Percentage Tracking and Analytics

REQUIREMENT: Add comprehensive cost tracking and percentage calculations to BOM Management

FILES TO MODIFY:

1. ENHANCE: src/manager/BomManagementScreen.tsx
   - Add cost dashboard section
   - Implement percentage calculations
   - Add cost variance analysis

2. CREATE: src/manager/components/BomCostDashboard.tsx (NEW)
   - Cost summary cards
   - Percentage breakdown charts
   - Budget vs Actual comparison

3. CREATE: src/manager/components/BomItemEditor.tsx (NEW)
   - BOM item creation/editing
   - Cost calculation automation
   - Unit conversions

4. CREATE: src/services/BomCalculatorService.ts (NEW)
   - Cost percentage calculations
   - Budget utilization analytics
   - Profitability analysis

COST CALCULATIONS NEEDED:

1. Pre-Contract Cost Breakdown:
   - Direct vs Indirect costs
   - Contingency percentage
   - Profit margin calculation
   - Competitive pricing analysis

2. Post-Contract Cost Tracking:
   - Budget utilization percentage
   - Cost variance (Estimated vs Actual)
   - Cost Performance Index (CPI)
   - Earned Value Analysis

3. Percentage Calculations:
   - Material cost % of total
   - Labor cost % of total  
   - Equipment cost % of total
   - Category-wise cost distribution
   - Phase-wise cost allocation

FEATURES TO IMPLEMENT:
1. Real-time cost percentage updates
2. Color-coded budget alerts (Green/Yellow/Red)
3. Cost trend analysis
4. Variation impact calculation
5. Profitability tracking

Please provide complete implementation with proper TypeScript types and calculations.
Prompt 3: BOM Integration with Logistics
markdown
INTEGRATE BOM: Connect Manager BOM with Logistics Workflow

REQUIREMENT: Make Logistics tabs BOM-aware and enable cross-role BOM consumption

FILES TO MODIFY:

1. ENHANCE: src/logistics/MaterialTrackingScreen.tsx
   - Show BOM requirements vs actual stock
   - Color-coded material status based on BOM
   - Procurement suggestions from BOM

2. ENHANCE: src/logistics/DeliverySchedulingScreen.tsx
   - Schedule deliveries based on BOM timeline
   - BOM-driven delivery priorities
   - Phase-based delivery planning

3. ENHANCE: src/logistics/InventoryManagementScreen.tsx
   - Target stock levels from BOM
   - BOM-based inventory valuation
   - Consumption tracking against BOM

4. CREATE: src/shared/hooks/useBomData.ts (NEW)
   - Shared BOM data access across roles
   - BOM item filtering by site/phase
   - Real-time BOM updates

INTEGRATION FEATURES:

1. Material Tracking BOM Integration:
   - BOM requirements display
   - Shortage alerts based on BOM
   - Procurement status linked to BOM items

2. Delivery Scheduling BOM Integration:
   - BOM phase-based delivery planning
   - Just-in-time delivery optimization
   - Delivery progress against BOM

3. Inventory Management BOM Integration:
   - BOM-based stock targets
   - Consumption rate calculation
   - Reorder level automation

4. Cross-Role BOM Access:
   - Read-only BOM access for Logistics
   - BOM item delegation system
   - BOM change notifications

DATA FLOW IMPLEMENTATION:
Manager creates BOM → Logistics consumes for planning → Supervisors execute against BOM → All track against baseline

Please provide complete integration code with proper data relationships.
Prompt 4: BOM Version Control & Variation Management
markdown
ADVANCED BOM: Implement Version Control and Variation Management

REQUIREMENT: Add professional BOM versioning and variation order tracking

FILES TO CREATE/MODIFY:

1. CREATE: src/manager/components/BomVersionHistory.tsx (NEW)
   - BOM version timeline
   - Change comparison between versions
   - Version restoration capability

2. CREATE: src/manager/components/VariationManagement.tsx (NEW)
   - Variation order creation/approval
   - Cost impact analysis
   - Client approval workflow

3. ENHANCE: src/database/models/BomModel.ts
   - Add version control fields
   - Variation order data model
   - Audit trail support

4. CREATE: src/services/BomVersionService.ts (NEW)
   - Version comparison algorithms
   - Change impact analysis
   - Cost delta calculations

VERSION CONTROL FEATURES:

1. BOM Version Types:
   - Estimating versions (v1.0, v2.0 for tender revisions)
   - Execution versions (v3.0 baseline, v3.1 variation, etc.)
   - Archived versions for audit

2. Version Comparison:
   - Side-by-side version diff
   - Cost change highlights
   - Item quantity changes
   - Added/removed items

3. Variation Management:
   - Variation order numbering
   - Client approval tracking
   - Cost impact calculation
   - Schedule impact assessment

AUDIT TRAIL REQUIREMENTS:
- Who changed what and when
- Change justifications
- Approval workflows
- Cost change history

PROFESSIONAL WORKFLOW:
Pre-Contract: v1.0 → v2.0 (revisions) → Contract Award
Post-Contract: v3.0 (baseline) → v3.1 (VO1) → v3.2 (VO2) → Project Close

Please implement complete version control system with construction industry standards.
Prompt 5: BOM Reporting & Analytics
markdown
BOM ANALYTICS: Implement Comprehensive Reporting and Dashboards

REQUIREMENT: Add advanced BOM reporting, analytics, and executive dashboards

FILES TO CREATE:

1. CREATE: src/manager/components/BomReportsScreen.tsx (NEW)
   - Comprehensive BOM reporting interface
   - Export functionality (PDF, Excel)
   - Custom report builder

2. CREATE: src/manager/components/BomAnalyticsDashboard.tsx (NEW)
   - Executive-level BOM analytics
   - Cost performance metrics
   - Predictive analytics

3. CREATE: src/services/BomAnalyticsService.ts (NEW)
   - Advanced cost analytics
   - Trend analysis algorithms
   - Predictive costing models

4. CREATE: src/utils/BomReportGenerator.ts (NEW)
   - PDF report generation
   - Excel export functionality
   - Chart and graph generation

REPORTING FEATURES:

1. Standard Reports:
   - BOM Cost Summary Report
   - Material Take-off Report
   - Cost Variance Analysis Report
   - Procurement Status Report
   - Variation Order Report

2. Analytics Dashboard:
   - Cost Performance Index (CPI)
   - Schedule Performance Index (SPI)
   - Estimate at Completion (EAC)
   - Variance at Completion (VAC)
   - Profitability Trends

3. Predictive Analytics:
   - Cost completion forecasting
   - Cash flow projections
   - Risk assessment scoring
   - Opportunity identification

4. Export Capabilities:
   - Client-ready BOM reports
   - Accounting system integration
   - Procurement system feeds
   - Executive summary dashboards

CONSTRUCTION METRICS:
- % Budget Utilized
- % Cost Variance
- % Schedule Variance  
- % Physical Progress vs Cost Progress
- % Profitability

Please implement comprehensive reporting system with construction industry metrics.
Execution Strategy:
Recommended Order:

Start with Prompt 1 (Foundation)

Then Prompt 2 (Cost Tracking)

Then Prompt 3 (Logistics Integration)

Then Prompt 4 (Version Control)

Finally Prompt 5 (Analytics)

Each prompt builds on the previous and can be executed sequentially. This gives you a complete, professional BOM management system integrated across your construction app! 🏗️📊

Revised

IMPLEMENT: Railway/Metro Electrification BOM Management for Manager Role

REQUIREMENT: Create specialized BOM system for railway electrification projects with technical specifications and system-based categorization

FILES TO CREATE/MODIFY:

1. UPDATE: src/nav/ManagerNavigator.tsx - Add BOM Management as 5th tab
2. CREATE: src/manager/BomManagementScreen.tsx - Main BOM interface
3. CREATE: src/manager/context/BomContext.tsx - BOM shared state
4. CREATE: src/database/models/RailwayBomModel.ts - Specialized BOM models

SPECIALIZED DATA MODELS FOR RAILWAY ELECTRIFICATION:

// Main BOM Structure
interface RailwayBOM {
  id: string;
  projectId: string;
  projectType: 'metro' | 'mainline' | 'light_rail';
  systemType: 'catenary' | 'traction_power' | 'signaling' | 'scada' | 'civil_works';
  version: string;
  status: 'draft' | 'approved' | 'baseline' | 'closed';
  
  // Project Details
  lineSection: string;        // "Line 3 - Section A"
  trackKm: number;           // Kilometer reference
  electrificationSystem: '1500V DC' | '25kV AC' | '750V DC';
  
  // Technical Specifications
  designSpeed: number;       // km/h
  trainHeadway: number;      // seconds
  powerRequirement: number;  // MW
  
  items: RailwayBOMItem[];
}

// Specialized BOM Item with Railway-Specific Fields
interface RailwayBOMItem {
  id: string;
  
  // Basic Identification
  itemCode: string;          // "CAT-OW-001"
  description: string;
  system: 'catenary' | 'traction' | 'signaling' | 'scada' | 'civil';
  subsystem: string;         // "Overhead Wiring", "Foundations", "Power Electronics"
  
  // Technical Specifications
  technicalSpec: string;     // "ASTM A123, Grade 60"
  voltageRating?: number;    // kV
  currentRating?: number;    // A
  mechanicalStrength?: number; // kN
  temperatureRating?: string; // "-40°C to +85°C"
  
  // Quantities & Units
  quantity: number;
  unit: string;              // "meters", "units", "sets", "kms"
  unitWeight: number;        // kg per unit
  totalWeight: number;       // kg total
  
  // Location & Installation
  installationLocation: string;  // "Between KM 5+200 to KM 5+800"
  track: 'up' | 'down' | 'both';
  structureType: 'portal' | 'cantilever' | 'headspan' | 'tensioning';
  
  // Costs
  unitCost: number;
  totalCost: number;
  currency: string;
  
  // Procurement
  supplier: string;
  leadTime: number;          // days
  procurementStatus: 'not_ordered' | 'rfq_issued' | 'ordered' | 'delivered';
  
  // Installation
  installationSequence: number;
  dependencyItems: string[]; // IDs of items that must be installed first
  commissioningDate?: Date;
}

// System-Specific Interfaces
interface CatenarySystemItem extends RailwayBOMItem {
  wireType: 'contact' | 'messenger' | 'dropper' | 'stitch';
  tension: number;           // kN
  sag: number;              // mm
  registration: 'center' | 'staggered';
}

interface TractionPowerItem extends RailwayBOMItem {
  equipmentType: 'transformer' | 'rectifier' | 'switchgear' | 'cable';
  protectionClass: string;   // "IP54", "IP65"
  coolingType: 'ONAN' | 'ONAF' | 'OFAN';
}

BOM CATEGORIZATION BY SYSTEM:

1. CATENARY SYSTEM ITEMS:
   - Contact Wire: Copper alloy, cross-section, tension
   - Messenger Wire: Strength, diameter, material
   - Droppers & Clamps: Types, materials, corrosion protection
   - Cantilevers & Portals: Structural steel, foundations
   - Insulators: Ceramic/polymer, voltage rating
   - Tensioning Equipment: Weights, pulleys, tension limits

2. TRACTION POWER SYSTEM ITEMS:
   - Traction Substations: Transformers, rectifiers, switchgear
   - Power Cables: XLPE, voltage rating, current capacity
   - Overhead Line Equipment: Circuit breakers, disconnectors
   - Return Current System: Rails, bonds, negative cables
   - Earthing & Bonding: Grounding rods, cables, test points

3. SIGNALING & CONTROL ITEMS:
   - Track Circuits: Impedance bonds, relays
   - Signals & Points: LED signals, point machines
   - Control Systems: Interlocking, ATP, ATC
   - Cables & Conduits: Signaling cables, cable trays

4. SCADA & MONITORING ITEMS:
   - RTUs & PLCs: Remote terminal units
   - Sensors: Current, voltage, temperature
   - Communication: Fiber optics, ethernet switches
   - Control Center: Servers, workstations, displays

VISUAL COMPONENTS NEEDED:

1. SYSTEM-BASED BOM FILTER:
   - Quick filter by: Catenary, Traction, Signaling, SCADA, Civil
   - Subsystem filtering within each main system

2. TECHNICAL SPECIFICATION VIEW:
   - Show technical parameters prominently
   - Color-coding by system type
   - Installation sequence visualization

3. LOCATION-BASED GROUPING:
   - Group items by track kilometer
   - Show installation locations on mini-map
   - Track-wise segregation (Up/Down/Both)

4. PROCUREMENT STATUS DASHBOARD:
   - System-wise procurement progress
   - Critical path items highlighting
   - Lead time alerts for long-lead items

IMPLEMENTATION FEATURES:

1. BOM TEMPLATES:
   - Pre-defined templates for different electrification systems
   - Standard item libraries for common railway components
   - Copy BOM from similar projects

2. TECHNICAL CALCULATIONS:
   - Weight calculations (unit weight × quantity)
   - Cost roll-up by system and subsystem
   - Power load calculations for traction systems

3. INSTALLATION PLANNING:
   - Dependency management between items
   - Installation sequence validation
   - Commissioning schedule integration

4. RAILWAY-SPECIFIC REPORTING:
   - System-wise cost breakdown
   - Weight summary for logistics planning
   - Technical compliance reporting
   - Installation progress by track section

Please implement the specialized Railway/Metro Electrification BOM system with these technical requirements.

 Example BOM Items for Reference:
Catenary System Example:
{
  itemCode: "CAT-CW-150-01",
  description: "Hard Drawn Copper Contact Wire 150mm²",
  system: "catenary",
  subsystem: "overhead_wiring",
  technicalSpec: "EN 50149:2012, Cu-ETP",
  voltageRating: 25,
  currentRating: 1000,
  quantity: 25000,
  unit: "meters",
  unitWeight: 1.35,
  installationLocation: "KM 0+000 to KM 25+000",
  track: "both",
  wireType: "contact",
  tension: 12
}

Key Benefits of This Approach:
Domain-Specific - Captures railway electrification requirements

Technical Depth - Includes all necessary engineering parameters

System-Based - Organized by electrical systems

Location-Aware - Track kilometer referencing

Installation-Ready - Sequence and dependency management