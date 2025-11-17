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