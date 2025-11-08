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

