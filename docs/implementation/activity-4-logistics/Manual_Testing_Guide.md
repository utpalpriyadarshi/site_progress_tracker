# Logistics System - Manual Testing Guide

**Version**: 1.0
**Date**: Week 8 - Post-Development
**Status**: Ready for Manual Testing
**Weeks Covered**: 1-7 (Foundation through Integration)

---

## Table of Contents

1. [Testing Prerequisites](#testing-prerequisites)
2. [Week 1: Foundation & Dashboard](#week-1-foundation--dashboard)
3. [Week 2: Materials Tracking](#week-2-materials-tracking)
4. [Week 3: Equipment Management](#week-3-equipment-management)
5. [Week 4: Delivery Scheduling](#week-4-delivery-scheduling)
6. [Week 5: Inventory Management](#week-5-inventory-management)
7. [Week 6: Advanced Analytics](#week-6-advanced-analytics)
8. [Week 7: Automation & Integration](#week-7-automation--integration)
9. [Cross-Module Testing](#cross-module-testing)
10. [Test Results Template](#test-results-template)

---

## Testing Prerequisites

### Environment Setup:
- ✅ App running on device/emulator
- ✅ Test user account logged in
- ✅ Sample project with active sites
- ✅ Mock data loaded (materials, equipment, deliveries, inventory)

### Test Data Required:
- **Projects**: At least 2 active projects
- **Sites**: At least 3 sites with different locations
- **Materials**: 10+ materials across categories
- **Equipment**: 5+ equipment items
- **Suppliers**: 3+ suppliers with different locations
- **Users**: Manager, logistics lead, procurement team roles

### Navigation:
1. Open app
2. Navigate to **Logistics** section
3. Access logistics tabs: Dashboard, Materials, Equipment, Delivery, Inventory, Analytics

---

## Week 1: Foundation & Dashboard

### Test Case 1.1: Logistics Dashboard Overview
**Objective**: Verify dashboard displays key logistics metrics

**Steps**:
1. Navigate to **Logistics → Dashboard**
2. Verify dashboard loads successfully
3. Check for the following sections:
   - Material availability status cards
   - Equipment utilization gauges
   - Delivery performance metrics
   - Inventory health indicators
   - Critical alerts panel
   - Pending actions list

**Expected Results**:
- ✅ Dashboard displays without errors
- ✅ All KPI cards show numeric values
- ✅ Metrics are properly labeled
- ✅ Charts/graphs render correctly
- ✅ Real-time data updates visible

**Test Data**:
- Project: Any active project with logistics data

**Pass/Fail**: ___________
**Notes**: ___________________________________________

---

### Test Case 1.2: Critical Alerts Panel
**Objective**: Verify critical alerts are displayed and prioritized

**Steps**:
1. On Logistics Dashboard, locate **Critical Alerts** panel
2. Verify alerts are sorted by priority (Critical → High → Medium)
3. Click on an alert to view details
4. Verify alert actions are available (e.g., "View Details", "Take Action")

**Expected Results**:
- ✅ Alerts display with severity indicators (colors/icons)
- ✅ Critical alerts appear at top
- ✅ Alert details modal opens on click
- ✅ Action buttons are functional

**Pass/Fail**: ___________
**Notes**: ___________________________________________

---

### Test Case 1.3: Quick Navigation
**Objective**: Verify navigation between logistics tabs

**Steps**:
1. From Dashboard, click navigation to each tab:
   - Materials Tracking
   - Equipment Management
   - Delivery Scheduling
   - Inventory Management
   - Analytics Dashboard
2. Verify each screen loads correctly
3. Use back navigation to return to Dashboard

**Expected Results**:
- ✅ All tabs accessible from Dashboard
- ✅ Screens load within 2 seconds
- ✅ Back navigation works
- ✅ Tab state persists when switching

**Pass/Fail**: ___________
**Notes**: ___________________________________________

---

## Week 2: Materials Tracking

### Test Case 2.1: Material Requirements View
**Objective**: Verify BOM-driven material requirements display

**Steps**:
1. Navigate to **Logistics → Materials Tracking**
2. Select "Requirements" view
3. Verify materials list displays:
   - Material name and category
   - Required quantity vs. available quantity
   - Shortage amounts (if any)
   - Procurement status
4. Check filters work (category, status, site)

**Expected Results**:
- ✅ Materials grouped by category
- ✅ Shortage amounts highlighted in red
- ✅ Available stock shown in green
- ✅ Filters update list correctly
- ✅ Search functionality works

**Pass/Fail**: ___________
**Notes**: ___________________________________________

---

### Test Case 2.2: Material Shortages & Procurement Suggestions
**Objective**: Verify shortage detection and auto-procurement suggestions

**Steps**:
1. Switch to "Shortages" view
2. Verify shortage list shows:
   - Shortage amount and urgency level
   - Affected projects
   - Recommended action
3. Select a shortage item
4. Verify purchase order suggestion displays:
   - Recommended supplier
   - Quantity to order
   - Estimated cost and delivery date
5. Click "Create Purchase Order" (if available)

**Expected Results**:
- ✅ Shortages sorted by urgency (Critical → High → Medium → Low)
- ✅ Urgency color-coded (Red → Orange → Yellow → Blue)
- ✅ PO suggestions include supplier comparison
- ✅ Cost estimates reasonable
- ✅ Lead times calculated correctly

**Pass/Fail**: ___________
**Notes**: ___________________________________________

---

### Test Case 2.3: Supplier Comparison
**Objective**: Verify supplier selection algorithm

**Steps**:
1. From Shortages view, select a material
2. Open "Supplier Comparison" modal
3. Verify comparison shows:
   - Supplier name and rating
   - Unit price and total cost
   - Lead time
   - Reliability score
   - Distance/location
4. Verify sorting options (price, lead time, reliability)
5. Select a supplier and verify selection

**Expected Results**:
- ✅ At least 2 suppliers shown for comparison
- ✅ Metrics clearly displayed
- ✅ Best supplier highlighted/recommended
- ✅ Sorting updates supplier order
- ✅ Selection saves preference

**Pass/Fail**: ___________
**Notes**: ___________________________________________

---

### Test Case 2.4: Consumption Analytics
**Objective**: Verify consumption rate tracking and forecasting

**Steps**:
1. Switch to "Analytics" view
2. Select a material with historical usage
3. Verify consumption chart shows:
   - Daily/weekly/monthly consumption
   - Trend line (increasing/stable/decreasing)
   - 7-day and 30-day demand forecast
4. Check consumption rate calculations
5. Verify reorder recommendations based on consumption

**Expected Results**:
- ✅ Chart displays consumption over time
- ✅ Trend correctly identified
- ✅ Forecasts show future demand
- ✅ Reorder point recommended
- ✅ Data updates when date range changes

**Pass/Fail**: ___________
**Notes**: ___________________________________________

---

## Week 3: Equipment Management

### Test Case 3.1: Equipment Overview
**Objective**: Verify equipment list and status indicators

**Steps**:
1. Navigate to **Logistics → Equipment Management**
2. Select "Overview" view
3. Verify equipment list shows:
   - Equipment name and type
   - Current status (Available/In-Use/Maintenance/Repair)
   - Utilization percentage
   - Health score (0-100)
   - Location
4. Filter by status and location
5. Search for specific equipment

**Expected Results**:
- ✅ All equipment items displayed
- ✅ Status badges color-coded (Green/Blue/Orange/Red)
- ✅ Utilization bars show percentage visually
- ✅ Health score displayed with color indicator
- ✅ Filters and search work correctly

**Pass/Fail**: ___________
**Notes**: ___________________________________________

---

### Test Case 3.2: Maintenance Scheduling
**Objective**: Verify preventive maintenance tracking

**Steps**:
1. Switch to "Maintenance" view
2. Verify maintenance schedule shows:
   - Equipment name
   - Maintenance type (Preventive/Corrective/Inspection)
   - Scheduled date
   - Priority/urgency
   - Overdue indicators
3. Click on a maintenance item
4. Verify detail modal shows:
   - Maintenance description
   - Estimated duration
   - Required parts/resources
   - Schedule impact analysis

**Expected Results**:
- ✅ Maintenance sorted by date
- ✅ Overdue items highlighted in red
- ✅ Upcoming maintenance (within 7 days) in orange
- ✅ Priority badges displayed
- ✅ Detail modal provides complete information

**Pass/Fail**: ___________
**Notes**: ___________________________________________

---

### Test Case 3.3: Equipment Allocation
**Objective**: Verify equipment allocation to projects

**Steps**:
1. Switch to "Allocation" view
2. Verify allocation list shows:
   - Equipment name
   - Allocated to project/site
   - Allocation period (start - end dates)
   - Utilization during allocation
3. Check for allocation conflicts (overlapping dates)
4. View allocation timeline/calendar view

**Expected Results**:
- ✅ All current allocations displayed
- ✅ Conflicts marked with warning icon
- ✅ Utilization percentage shown
- ✅ Timeline view shows visual allocation schedule
- ✅ Available equipment easily identifiable

**Pass/Fail**: ___________
**Notes**: ___________________________________________

---

### Test Case 3.4: Equipment Performance Metrics
**Objective**: Verify performance tracking (MTBF, MTTR, availability)

**Steps**:
1. Switch to "Performance" view
2. Select an equipment item
3. Verify performance metrics display:
   - MTBF (Mean Time Between Failures)
   - MTTR (Mean Time To Repair)
   - Availability percentage
   - Total downtime hours
   - Failure rate
4. Check performance trend chart
5. Verify maintenance impact on performance

**Expected Results**:
- ✅ All metrics calculated correctly
- ✅ MTBF shows hours between failures
- ✅ MTTR shows average repair time
- ✅ Availability percentage accurate (>95% is good)
- ✅ Trend chart shows historical performance
- ✅ Downtime correctly attributed to maintenance vs failures

**Pass/Fail**: ___________
**Notes**: ___________________________________________

---

## Week 4: Delivery Scheduling

### Test Case 4.1: Delivery Schedule View
**Objective**: Verify delivery schedule displays correctly

**Steps**:
1. Navigate to **Logistics → Delivery Scheduling**
2. Select "Schedule" view
3. Verify delivery list shows:
   - Delivery number and date
   - Material name and quantity
   - Supplier and destination
   - Status (Scheduled/Confirmed/In-Transit/Delivered)
   - Priority level
4. Filter by status, date range, and site
5. Sort by delivery date, priority

**Expected Results**:
- ✅ All scheduled deliveries displayed
- ✅ Status badges color-coded
- ✅ Priority indicators visible (Critical/High/Medium/Low)
- ✅ Filters update list correctly
- ✅ Sorting works properly

**Pass/Fail**: ___________
**Notes**: ___________________________________________

---

### Test Case 4.2: Real-Time Delivery Tracking
**Objective**: Verify delivery tracking with progress indicators

**Steps**:
1. Switch to "Tracking" view
2. Select an in-transit delivery
3. Verify tracking information shows:
   - Current location/status
   - Progress bar (0-100%)
   - Estimated time of arrival (ETA)
   - Distance remaining
   - Route map (if available)
4. Check for delay indicators
5. Verify status updates

**Expected Results**:
- ✅ Progress bar reflects delivery stage
- ✅ ETA calculated based on distance and traffic
- ✅ Current status clearly displayed
- ✅ Delay warnings shown if behind schedule
- ✅ Route visualization (if map integration available)

**Pass/Fail**: ___________
**Notes**: ___________________________________________

---

### Test Case 4.3: Route Optimization
**Objective**: Verify route optimization calculations

**Steps**:
1. Switch to "Routes" view
2. Select a delivery route
3. Verify route details show:
   - Origin (supplier) and destination (site)
   - Distance and estimated duration
   - Optimization score (0-100)
   - Potential savings (time/cost)
   - Alternative routes
4. View optimized route vs. original route
5. Check traffic conditions impact

**Expected Results**:
- ✅ Route displayed with distance/duration
- ✅ Optimization score >85 indicates good route
- ✅ Savings calculated (time and cost)
- ✅ Alternative routes available for comparison
- ✅ Traffic conditions factored into ETA

**Pass/Fail**: ___________
**Notes**: ___________________________________________

---

### Test Case 4.4: Site Readiness Validation
**Objective**: Verify site readiness checks before delivery

**Steps**:
1. Select a scheduled delivery
2. View "Site Readiness" section
3. Verify readiness checks include:
   - Storage space availability
   - Access road conditions
   - Weather conditions
   - Personnel availability
   - Readiness score (0-100)
4. Check for readiness warnings/alerts
5. Verify recommendations for unready sites

**Expected Results**:
- ✅ All readiness factors checked
- ✅ Readiness score >80 indicates ready
- ✅ Warnings displayed for issues (e.g., insufficient storage)
- ✅ Weather conditions assessed (safe/unsafe)
- ✅ Recommendations provided for improvement

**Pass/Fail**: ___________
**Notes**: ___________________________________________

---

### Test Case 4.5: Delivery Performance Analytics
**Objective**: Verify delivery performance metrics

**Steps**:
1. Switch to "Performance" view
2. Verify analytics display:
   - On-time delivery percentage
   - Average delay days
   - Total deliveries (completed/pending)
   - Cost per delivery
   - Performance by supplier
3. Check performance trends over time
4. Verify recommendations based on performance

**Expected Results**:
- ✅ On-time delivery rate >90% is good
- ✅ Average delay calculated correctly
- ✅ Costs tracked accurately
- ✅ Supplier performance ranked
- ✅ Trend chart shows improvement/decline
- ✅ Recommendations actionable

**Pass/Fail**: ___________
**Notes**: ___________________________________________

---

## Week 5: Inventory Management

### Test Case 5.1: Multi-Location Inventory Overview
**Objective**: Verify inventory across multiple locations

**Steps**:
1. Navigate to **Logistics → Inventory Management**
2. Select "Overview" view
3. Verify inventory summary shows:
   - Total items tracked
   - Total inventory value
   - Stock health score
   - Locations count
4. View inventory by location
5. Check ABC analysis summary

**Expected Results**:
- ✅ Summary metrics displayed prominently
- ✅ Total value calculated correctly
- ✅ Health score indicates overall status
- ✅ Location breakdown available
- ✅ ABC categories shown (A: 80%, B: 15%, C: 5%)

**Pass/Fail**: ___________
**Notes**: ___________________________________________

---

### Test Case 5.2: ABC Analysis
**Objective**: Verify ABC categorization of inventory

**Steps**:
1. View ABC analysis section
2. Verify materials categorized as:
   - **A items**: High value (80% of value, 20% of items)
   - **B items**: Medium value (15% of value, 30% of items)
   - **C items**: Low value (5% of value, 50% of items)
3. Filter by ABC category
4. Check category recommendations

**Expected Results**:
- ✅ Items correctly categorized by value contribution
- ✅ Category badges color-coded (A=Red, B=Orange, C=Green)
- ✅ Value percentages sum to 100%
- ✅ Recommendations specific to category (e.g., tight control for A items)

**Pass/Fail**: ___________
**Notes**: ___________________________________________

---

### Test Case 5.3: Inventory Locations View
**Objective**: Verify location-specific inventory tracking

**Steps**:
1. Switch to "Locations" view
2. Select a warehouse/site
3. Verify location details show:
   - Location name and type (warehouse/site/yard)
   - Total capacity and used capacity
   - Capacity utilization percentage
   - Materials stored at location
   - Location-specific metrics
4. View capacity visualization (bar chart)
5. Check materials by location

**Expected Results**:
- ✅ All locations listed
- ✅ Capacity bars show percentage filled
- ✅ Utilization >85% shows warning (near capacity)
- ✅ Materials list filterable by location
- ✅ Location details complete

**Pass/Fail**: ___________
**Notes**: ___________________________________________

---

### Test Case 5.4: Stock Transfers
**Objective**: Verify inter-site transfer management

**Steps**:
1. Switch to "Transfers" view
2. Verify transfer list shows:
   - Transfer ID and date
   - Material name and quantity
   - From location → To location
   - Transfer status (Requested/Approved/In-Transit/Received)
   - Reason for transfer
3. View transfer details
4. Check transfer timeline/route

**Expected Results**:
- ✅ All transfers displayed
- ✅ Status workflow visible (Requested → Approved → In-Transit → Received)
- ✅ Route shown visually (From → To)
- ✅ Transfer reasons documented
- ✅ Approval status clear

**Pass/Fail**: ___________
**Notes**: ___________________________________________

---

### Test Case 5.5: Inventory Health Dashboard
**Objective**: Verify inventory health metrics

**Steps**:
1. Switch to "Analytics" view
2. Verify health metrics display:
   - Inventory turnover rate
   - Stockout risk percentage
   - Overstock risk percentage
   - Obsolescence risk
   - Total health score (0-100)
3. View health recommendations
4. Check item-level health indicators

**Expected Results**:
- ✅ Turnover rate >6 is healthy
- ✅ Stockout risk <10% is acceptable
- ✅ Overstock risk <15% is acceptable
- ✅ Health score >75 indicates good health
- ✅ Recommendations prioritized by impact
- ✅ Problem items highlighted

**Pass/Fail**: ___________
**Notes**: ___________________________________________

---

### Test Case 5.6: EOQ and Safety Stock
**Objective**: Verify Economic Order Quantity calculations

**Steps**:
1. Select a material with EOQ data
2. Verify EOQ calculation shows:
   - Optimal order quantity
   - Annual demand
   - Order cost and carrying cost
   - Safety stock level
   - Reorder point
3. Check cost savings from EOQ
4. Verify Z-score service level (typically 95% = 1.65)

**Expected Results**:
- ✅ EOQ calculated using Wilson formula
- ✅ Safety stock includes lead time variability
- ✅ Reorder point = Lead time demand + Safety stock
- ✅ Cost savings estimated
- ✅ Service level configurable (90%, 95%, 99%)

**Pass/Fail**: ___________
**Notes**: ___________________________________________

---

## Week 6: Advanced Analytics

### Test Case 6.1: Analytics Dashboard Overview
**Objective**: Verify analytics dashboard displays key insights

**Steps**:
1. Navigate to **Logistics → Analytics**
2. Select "Overview" view
3. Verify health score section shows:
   - Overall logistics health score (0-100)
   - Health rating (Excellent/Good/Fair/Poor)
   - Component metrics (Forecast Accuracy, Cost Stability, Supply Reliability, Demand Predictability)
4. View key insights panel
5. Check risk alerts and opportunities

**Expected Results**:
- ✅ Health score displayed prominently with color coding
- ✅ Rating matches score (>80=Excellent, 65-80=Good, 50-65=Fair, <50=Poor)
- ✅ Component metrics show percentages
- ✅ Insights sorted by severity
- ✅ Risks and opportunities clearly separated

**Pass/Fail**: ___________
**Notes**: ___________________________________________

---

### Test Case 6.2: Demand Forecasting
**Objective**: Verify demand prediction for materials

**Steps**:
1. Switch to "Demand" view
2. Select a material
3. Verify forecast displays:
   - Current demand
   - Historical average
   - 30-day/90-day forecast
   - Confidence intervals (upper/lower bounds)
   - Trend direction (increasing/decreasing/stable)
4. Check project-based demand factors
5. Verify recommended order quantity and date

**Expected Results**:
- ✅ Forecast chart shows predictions over time
- ✅ Confidence intervals visualized
- ✅ Trend correctly identified
- ✅ Project impacts included in forecast
- ✅ Recommendations actionable

**Pass/Fail**: ___________
**Notes**: ___________________________________________

---

### Test Case 6.3: Lead Time Prediction
**Objective**: Verify supplier lead time analysis

**Steps**:
1. View supplier lead time section
2. Select a supplier
3. Verify prediction shows:
   - Predicted lead time (days)
   - Historical average, median, min, max
   - Reliability score (0-100%)
   - Confidence interval
   - Risk factors
4. Check recommended buffer days
5. Verify trend (improving/stable/worsening)

**Expected Results**:
- ✅ Predicted lead time based on median (more robust than mean)
- ✅ Reliability score reflects consistency (>80% is good)
- ✅ Risk factors identified (high variability, extreme delays, etc.)
- ✅ Buffer days recommended based on std deviation
- ✅ Trend shows supplier performance over time

**Pass/Fail**: ___________
**Notes**: ___________________________________________

---

### Test Case 6.4: Cost Trend Analysis
**Objective**: Verify cost forecasting and budget impact

**Steps**:
1. Switch to "Costs" view
2. Select a material
3. Verify cost analysis shows:
   - Current cost
   - Historical trend (increasing/decreasing/stable)
   - Cost forecast (30/90 days)
   - Volatility rating (low/medium/high)
   - Budget impact assessment
4. View market factors
5. Check cost optimization recommendations

**Expected Results**:
- ✅ Cost chart shows historical and forecast
- ✅ Trend correctly identified
- ✅ Volatility based on coefficient of variation
- ✅ Budget impact shows projected increase/decrease
- ✅ Recommendations include bulk purchase, alternatives, timing

**Pass/Fail**: ___________
**Notes**: ___________________________________________

---

### Test Case 6.5: Performance Benchmarking
**Objective**: Verify performance vs. industry standards

**Steps**:
1. Switch to "Performance" view
2. Verify benchmarks display:
   - Metric name (e.g., Inventory Turnover, Order Fulfillment Time)
   - Current value
   - Industry average
   - Industry best-in-class
   - Company target
   - Performance rating (Excellent/Good/Average/Below Average/Poor)
   - Percentile ranking (0-100)
3. View improvement gap analysis
4. Check improvement action recommendations

**Expected Results**:
- ✅ Current performance compared to benchmarks
- ✅ Rating accurate (Excellent if near best-in-class)
- ✅ Percentile shows relative position
- ✅ Gap to target calculated
- ✅ Actions prioritized by impact

**Pass/Fail**: ___________
**Notes**: ___________________________________________

---

### Test Case 6.6: Cost Optimization Recommendations
**Objective**: Verify cost reduction opportunities

**Steps**:
1. Switch to "Optimization" view
2. Verify quick wins section (low effort, high impact)
3. Verify strategic initiatives section (high effort, high impact)
4. Check procurement bundle opportunities
5. View transportation optimization
6. Review storage optimization

**Expected Results**:
- ✅ Quick wins clearly marked (low effort badge)
- ✅ Potential savings estimated for each opportunity
- ✅ ROI calculated (net savings / implementation cost)
- ✅ Procurement bundles show volume discount savings
- ✅ Transportation shows route consolidation opportunities
- ✅ Storage shows space optimization potential

**Pass/Fail**: ___________
**Notes**: ___________________________________________

---

## Week 7: Automation & Integration

### Test Case 7.1: Material Shortage Automation
**Objective**: Verify automatic shortage detection and PO generation

**Simulation Steps**:
1. Create a scenario where material quantity < required quantity
2. Verify automation triggers:
   - Shortage detected
   - Urgency calculated (critical/high/medium/low)
   - Purchase order suggestion generated
3. Check auto-approval logic:
   - Low-cost orders (<$10k) auto-approved
   - High-cost orders require approval
4. Verify notifications sent to procurement team

**Expected Results**:
- ✅ Shortage detected within 1 minute
- ✅ Urgency based on shortage percentage
- ✅ PO includes supplier, quantity, cost, delivery date
- ✅ Auto-approval works for low-cost items
- ✅ Notifications delivered to correct recipients

**Pass/Fail**: ___________
**Notes**: ___________________________________________

---

### Test Case 7.2: Equipment Maintenance Automation
**Objective**: Verify maintenance impact analysis

**Simulation Steps**:
1. Schedule equipment maintenance
2. Verify automation:
   - Conflicting allocations identified
   - Project impacts calculated
   - Alternative equipment suggested
   - Notifications scheduled (3 days in advance)
3. Check impact analysis:
   - Affected projects listed
   - Delay days calculated
   - Recommendations provided

**Expected Results**:
- ✅ Conflicts detected accurately
- ✅ Impact on critical path identified
- ✅ Alternative equipment matches capability
- ✅ Notifications scheduled properly
- ✅ Recommendations feasible

**Pass/Fail**: ___________
**Notes**: ___________________________________________

---

### Test Case 7.3: Delivery Delay Automation
**Objective**: Verify automatic timeline adjustment on delays

**Simulation Steps**:
1. Simulate a delivery delay (change delivery date)
2. Verify automation:
   - Delay detected
   - Affected projects identified
   - Timeline adjustments calculated
   - Escalation triggered if critical
3. Check mitigation actions:
   - Expediting options provided
   - Alternative sources checked
   - Cost-time tradeoffs shown

**Expected Results**:
- ✅ Delay days calculated correctly
- ✅ Cascading impacts identified
- ✅ Timelines adjusted for all affected tasks
- ✅ Escalation triggered for >7 day delays
- ✅ Mitigation actions actionable

**Pass/Fail**: ___________
**Notes**: ___________________________________________

---

### Test Case 7.4: Inventory Reorder Automation
**Objective**: Verify automatic reordering when stock is low

**Simulation Steps**:
1. Set material quantity below reorder point
2. Verify automation:
   - Reorder triggered
   - Urgency calculated based on stockout date
   - Supplier selected automatically
   - Order placed if below safety stock
3. Check approval workflow:
   - Auto-order if <$20k and below safety stock
   - Pending approval otherwise

**Expected Results**:
- ✅ Reorder triggered when quantity < reorder point
- ✅ Urgency: immediate if <3 days to stockout
- ✅ Best supplier selected (price, lead time, reliability)
- ✅ Auto-order only for low-risk items
- ✅ Order ID generated

**Pass/Fail**: ___________
**Notes**: ___________________________________________

---

### Test Case 7.5: Multi-Channel Notifications
**Objective**: Verify notification delivery across channels

**Steps**:
1. Trigger a notification event (e.g., material shortage)
2. Verify notification delivered via:
   - **In-App**: Check in-app notification center
   - **Push**: Check device notification
   - **Email**: Check email inbox (if configured)
   - **SMS**: Check phone (if critical and configured)
3. Check notification contains:
   - Title and message
   - Priority indicator
   - Actionable buttons (if applicable)
4. Test notification actions (e.g., "View Details", "Approve")

**Expected Results**:
- ✅ Notification appears in all enabled channels
- ✅ Priority reflected in styling (critical=red, high=orange)
- ✅ Message clear and actionable
- ✅ Actions work correctly
- ✅ Read status tracked

**Pass/Fail**: ___________
**Notes**: ___________________________________________

---

### Test Case 7.6: Notification Preferences
**Objective**: Verify user can configure notification settings

**Steps**:
1. Navigate to notification preferences/settings
2. Configure channels:
   - Disable push notifications
   - Enable email notifications
   - Set SMS to critical only
3. Set quiet hours (e.g., 10 PM - 7 AM)
4. Configure category preferences (e.g., only high priority for materials)
5. Trigger test notifications

**Expected Results**:
- ✅ Preferences save successfully
- ✅ Notifications respect channel settings
- ✅ Quiet hours honored (except critical if allowed)
- ✅ Category filters work
- ✅ Critical notifications bypass quiet hours if configured

**Pass/Fail**: ___________
**Notes**: ___________________________________________

---

### Test Case 7.7: Accounting Integration
**Objective**: Verify inventory valuation syncs to accounting

**Steps**:
1. Check current inventory valuation
2. Make inventory adjustment (add/remove stock)
3. Verify accounting sync:
   - Inventory valuation updated
   - Transaction created (type: adjustment)
   - Debit and credit accounts assigned
   - Account codes mapped correctly
4. View sync history

**Expected Results**:
- ✅ Valuation calculated correctly (quantity × unit cost)
- ✅ Transaction created with proper accounts
- ✅ Account codes match category (1100, 1110, etc.)
- ✅ Sync status shows success
- ✅ Last sync timestamp updated

**Pass/Fail**: ___________
**Notes**: ___________________________________________

---

### Test Case 7.8: Projects Integration
**Objective**: Verify material/equipment allocation syncs with projects

**Steps**:
1. Allocate materials to a project
2. Allocate equipment to a project
3. Verify project integration shows:
   - Materials allocated, used, and remaining
   - Equipment allocated with utilization
   - Project timeline updated
4. Check dependency tracking
5. Verify resource availability reflected in project

**Expected Results**:
- ✅ Material allocation shows in project view
- ✅ Equipment allocation tracked with hours
- ✅ Timeline adjusted based on resource availability
- ✅ Dependencies identified (blocked/unblocked)
- ✅ Sync status successful

**Pass/Fail**: ___________
**Notes**: ___________________________________________

---

### Test Case 7.9: Weather Integration
**Objective**: Verify weather data for delivery planning

**Steps**:
1. View a scheduled delivery
2. Check weather data for delivery location:
   - Current weather conditions
   - 7-day forecast
   - Weather alerts (if any)
3. Verify delivery safety check:
   - Safe/unsafe for delivery
   - Warnings for high wind, precipitation, low visibility
4. Check recommendations based on weather

**Expected Results**:
- ✅ Weather data displays for delivery location
- ✅ Current conditions show temperature, wind, precipitation
- ✅ Forecast shows next 7 days
- ✅ Safety check flags dangerous conditions
- ✅ Recommendations provided (e.g., reschedule if severe weather)

**Pass/Fail**: ___________
**Notes**: ___________________________________________

---

### Test Case 7.10: Supplier Integration
**Objective**: Verify supplier catalog and availability sync

**Steps**:
1. View supplier details
2. Check supplier integration status (connected/disconnected)
3. Verify supplier data:
   - Catalog items with SKUs
   - Price updates (old → new)
   - Material availability
   - Active orders
4. Search nearby suppliers for a location
5. Verify distance and travel time calculations

**Expected Results**:
- ✅ Integration status shows connected
- ✅ Catalog items listed with current prices
- ✅ Price changes tracked with effective dates
- ✅ Availability updated (in stock / out of stock)
- ✅ Nearby suppliers sorted by distance
- ✅ Distance calculated accurately (Haversine formula)

**Pass/Fail**: ___________
**Notes**: ___________________________________________

---

## Cross-Module Testing

### Test Case X.1: End-to-End Material Flow
**Objective**: Test complete material lifecycle

**Steps**:
1. **Requirement**: Create BOM with material requirements
2. **Shortage**: Verify shortage detected
3. **Procurement**: Generate purchase order
4. **Approval**: Approve purchase order
5. **Delivery**: Schedule delivery
6. **Tracking**: Track delivery in transit
7. **Receipt**: Receive material at site
8. **Inventory**: Verify inventory updated
9. **Usage**: Consume material in project
10. **Accounting**: Verify transaction recorded

**Expected Results**:
- ✅ Material flows through all stages smoothly
- ✅ Status updates at each stage
- ✅ Notifications sent to relevant stakeholders
- ✅ Inventory and accounting sync correctly
- ✅ No data loss or errors

**Pass/Fail**: ___________
**Notes**: ___________________________________________

---

### Test Case X.2: Cross-Tab Data Consistency
**Objective**: Verify data consistency across logistics tabs

**Steps**:
1. Make a change in Materials (e.g., update quantity)
2. Verify change reflected in:
   - Dashboard metrics
   - Inventory management
   - Analytics (consumption data)
3. Allocate equipment in Equipment Management
4. Verify change in:
   - Dashboard equipment utilization
   - Project integration
5. Update delivery status
6. Verify change in:
   - Dashboard delivery metrics
   - Material availability

**Expected Results**:
- ✅ Changes propagate to all related views within 5 seconds
- ✅ Metrics recalculated correctly
- ✅ No stale data in any tab
- ✅ Context shared across tabs

**Pass/Fail**: ___________
**Notes**: ___________________________________________

---

### Test Case X.3: Performance Under Load
**Objective**: Test system with realistic data volumes

**Simulation**:
- 100+ materials
- 20+ equipment items
- 50+ deliveries
- 10+ locations
- Multiple concurrent users

**Steps**:
1. Load large dataset
2. Navigate between tabs
3. Perform searches and filters
4. Generate reports and analytics
5. Measure load times

**Expected Results**:
- ✅ Tab switching < 2 seconds
- ✅ Search results < 1 second
- ✅ Charts render < 3 seconds
- ✅ No crashes or freezes
- ✅ Smooth scrolling

**Pass/Fail**: ___________
**Notes**: ___________________________________________

---

## Test Results Template

### Test Session Information
- **Date**: ___________
- **Tester**: ___________
- **Build Version**: ___________
- **Device/Platform**: ___________
- **Environment**: Development / Staging / Production

### Summary Statistics
- **Total Test Cases**: 50
- **Tests Passed**: ___________
- **Tests Failed**: ___________
- **Tests Skipped**: ___________
- **Pass Rate**: ___________%

### Critical Issues Found
1. Issue: ___________
   - Severity: Critical / High / Medium / Low
   - Steps to Reproduce: ___________
   - Expected: ___________
   - Actual: ___________

2. Issue: ___________
   - Severity: ___________
   - Details: ___________

### Recommendations
1. ___________
2. ___________
3. ___________

### Sign-Off
- **Tester**: ___________ (Signature/Date)
- **Reviewed By**: ___________ (Signature/Date)
- **Status**: Approved / Needs Fixes / Re-test Required

---

## Quick Reference - Test Priorities

### High Priority (Must Test):
1. ✅ Material shortage detection and auto-PO
2. ✅ Equipment maintenance scheduling
3. ✅ Delivery tracking and status updates
4. ✅ Inventory stock levels and reorder points
5. ✅ Multi-channel notifications
6. ✅ Accounting/projects integration sync

### Medium Priority (Should Test):
7. ✅ Analytics forecasting accuracy
8. ✅ Cost optimization recommendations
9. ✅ Supplier comparison and selection
10. ✅ Equipment performance metrics
11. ✅ Weather integration for deliveries
12. ✅ Cross-tab data consistency

### Low Priority (Nice to Test):
13. ✅ UI animations and transitions
14. ✅ Search and filter performance
15. ✅ Chart rendering quality
16. ✅ Notification preference customization
17. ✅ Report export functionality

---

**End of Manual Testing Guide**

**Questions?** Contact development team or refer to technical documentation.
