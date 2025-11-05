# Logistics System - User Guide

**Version**: 2.3
**Last Updated**: Week 10
**Target Audience**: Project Managers, Logistics Coordinators, Site Supervisors

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Logistics Dashboard](#logistics-dashboard)
3. [Materials Tracking](#materials-tracking)
4. [Equipment Management](#equipment-management)
5. [Delivery Scheduling](#delivery-scheduling)
6. [Inventory Management](#inventory-management)
7. [Analytics & Reports](#analytics--reports)
8. [Tips & Best Practices](#tips--best-practices)
9. [Troubleshooting](#troubleshooting)
10. [FAQs](#faqs)

---

## Getting Started

### Accessing the Logistics Module

1. Open the Site Progress Tracker app
2. Navigate to the **Logistics** section from the main menu
3. Select your project from the project selector
4. The Logistics Dashboard will display

### Interface Overview

The Logistics module consists of 6 main screens:

- **Dashboard**: Overview of all logistics activities
- **Materials**: Track materials, shortages, and procurement
- **Equipment**: Manage equipment utilization and maintenance
- **Delivery**: Schedule and track deliveries
- **Inventory**: Multi-location inventory management
- **Analytics**: Predictive insights and cost optimization

### Navigation

- Use the **tab bar** at the bottom to switch between sections
- Tap the **project selector** to change projects
- Use **search** and **filters** to find specific items
- Tap any card or list item for detailed information

---

## Logistics Dashboard

### Overview

The Dashboard provides a real-time snapshot of your logistics operations.

### Key Metrics

1. **Critical Alerts** (Top Section)
   - Material shortages requiring immediate attention
   - Equipment maintenance overdue
   - Delayed deliveries affecting project timelines

2. **Active Projects** (Middle Section)
   - Number of active projects
   - Overall logistics health score (0-100)
   - Material requirements summary

3. **Quick Stats** (Bottom Section)
   - Equipment utilization percentage
   - On-time delivery rate
   - Inventory turnover rate
   - Pending procurement requests

### Actions

- **Tap a critical alert** → Navigate to relevant screen for details
- **Tap a project card** → Switch to that project
- **Pull down** → Refresh all data

---

## Materials Tracking

### Viewing Material Requirements

1. Navigate to **Materials** screen
2. See all materials required for selected project
3. View status indicators:
   - 🟢 **Adequate**: Stock available
   - 🟡 **Low Stock**: Below safety stock
   - 🔴 **Shortage**: Insufficient for project needs

### Material Categories

Switch between view modes:
- **Overview**: All materials with shortages highlighted
- **BOM**: Materials organized by Bill of Materials
- **Procurement**: Pending and completed purchase orders
- **Suppliers**: Supplier comparison and ratings

### Managing Shortages

When you see a material shortage:

1. **Identify the shortage**: Red indicator shows shortage amount
2. **Review recommended action**: System suggests procurement quantity
3. **Compare suppliers**: View 3+ suppliers with prices and lead times
4. **Create purchase order**: Tap "Order" button
5. **Track status**: Monitor PO status in Procurement tab

### Supplier Comparison

For each material, compare suppliers by:
- **Unit Price**: Current pricing
- **Lead Time**: Delivery time in days
- **Reliability Score**: Based on past performance (0-100)
- **Delivery Track Record**: On-time delivery percentage

**Tip**: The system highlights the "Best Value" supplier considering price, lead time, and reliability.

---

## Equipment Management

### Equipment Status Overview

View all equipment with status indicators:
- **Idle** (Gray): Available for use
- **Operating** (Green): Currently in use
- **Maintenance** (Yellow): Scheduled/ongoing maintenance
- **Repair** (Orange): Under repair
- **Decommissioned** (Red): Out of service

### Checking Equipment Utilization

1. Navigate to **Equipment** → **Performance** tab
2. View utilization metrics:
   - **Total Hours**: Operational time in period
   - **Idle Hours**: Equipment not in use
   - **Operating Hours**: Productive time
   - **Maintenance Hours**: Servicing time
   - **Utilization %**: Percentage of time in productive use

3. Compare to **Target**: Green = on target, Red = below target

### Maintenance Scheduling

#### Viewing Maintenance Schedule

1. Go to **Equipment** → **Maintenance** tab
2. See all upcoming maintenance sorted by priority:
   - **Overdue** (Red): Past due date
   - **Due Soon** (Yellow): Within 7 days
   - **Scheduled** (Green): Planned ahead

#### Maintenance Details

For each maintenance item:
- **Equipment Name**: Which equipment needs service
- **Due Date**: When maintenance is required
- **Last Service**: When it was last serviced
- **Priority**: High/Medium/Low
- **Estimated Downtime**: Expected hours offline

#### Actions

- **Schedule Maintenance**: Tap equipment → "Schedule Maintenance"
- **Mark Complete**: After maintenance done, tap "Complete"
- **View History**: See all past maintenance records

### Operator Certifications

1. Go to **Equipment** → **Allocation** tab
2. Scroll to **Operator Certifications** section
3. View certification status:
   - **Expired** (Red): Cannot operate equipment
   - **Expiring Soon** (Yellow): Expires within 30 days
   - **Valid** (Green): Current certification

**Action**: Tap expired/expiring certifications to initiate renewal process

---

## Delivery Scheduling

### Viewing Delivery Schedule

1. Navigate to **Delivery** screen
2. See all deliveries for selected project
3. Filter by status:
   - All
   - Scheduled
   - In Transit
   - Delivered
   - Delayed

### Delivery Types

- **JIT (Just-In-Time)**: Delivered exactly when needed, minimal storage
- **Standard**: Normal delivery with buffer time
- **Express**: Expedited delivery for urgent needs
- **Bulk**: Large quantity delivery with advance notice

### Scheduling a Delivery

1. Tap **"+ Schedule Delivery"** button
2. Fill in delivery details:
   - **Materials**: Select items and quantities
   - **Supplier**: Choose supplier
   - **Site**: Delivery location
   - **Date**: Requested delivery date
   - **Type**: JIT, Standard, Express, or Bulk

3. System checks:
   - ✓ Site readiness (access, storage, weather)
   - ✓ Material availability at supplier
   - ✓ Lead time compatibility

4. Review optimized delivery plan
5. Tap **"Confirm Delivery"**

### Route Optimization

For multiple deliveries on same day:
1. System automatically optimizes routes
2. View savings: Distance reduced, Time saved, Cost saved
3. Consolidated deliveries shown with route map
4. Estimated arrival times for each stop

### Tracking Deliveries

1. Tap any delivery to view details
2. See real-time status:
   - **Scheduled**: Confirmed with supplier
   - **Dispatched**: Left supplier location
   - **In Transit**: On the way (with ETA)
   - **Arrived**: At site location
   - **Delivered**: Materials received and verified

3. Receive notifications for:
   - Dispatch confirmation
   - Delay alerts (with reason and new ETA)
   - Arrival at site
   - Delivery completion

### Handling Delays

When a delivery is delayed:
1. **Alert**: Notification sent immediately
2. **Impact**: System calculates project timeline impact
3. **Alternatives**: View expediting options if critical
4. **Communication**: Automatic notifications to affected stakeholders

---

## Inventory Management

### Multi-Location Overview

1. Navigate to **Inventory** screen
2. See inventory across all locations:
   - Main warehouse
   - Site storage areas
   - Supplier locations (consignment)

### ABC Classification

Materials are categorized by value:
- **A Items** (80% of value): Tight control, frequent monitoring
- **B Items** (15% of value): Moderate control, periodic review
- **C Items** (5% of value): Simple control, bulk ordering

**Tip**: Focus your attention on A items for maximum impact.

### Stock Transfer Between Locations

When you need to transfer stock:

1. Go to **Inventory** → **Transfers** tab
2. Tap **"+ New Transfer"**
3. Fill transfer details:
   - **Material**: What to transfer
   - **From Location**: Source warehouse/site
   - **To Location**: Destination warehouse/site
   - **Quantity**: Amount to transfer
   - **Priority**: Urgent/Normal/Low
   - **Reason**: Why transfer is needed

4. System validates:
   - ✓ Source has sufficient stock
   - ✓ Destination has capacity
   - ✓ Transport route available

5. Tap **"Create Transfer"**
6. Track transfer status until completed

### Inventory Health Monitoring

Health score (0-100) based on:
- **Stock Adequacy**: Sufficient levels vs shortages
- **Turnover**: How quickly inventory moves
- **Aging**: Percentage of slow-moving items
- **Accuracy**: Inventory record accuracy

**Interpretation**:
- 80-100: Excellent health
- 60-79: Good, minor improvements needed
- 40-59: Fair, attention required
- 0-39: Poor, urgent action needed

### Reorder Automation

The system automatically triggers reorders when:
- Stock falls below **reorder point**
- Predicted stockout date < 7 days
- Project requirements exceed available stock

**Manual Override**: You can always create manual purchase orders.

---

## Analytics & Reports

### Demand Forecasting

1. Navigate to **Analytics** → **Demand** tab
2. Select a material
3. View 90-day forecast with:
   - **Predicted demand**: Daily/weekly/monthly
   - **Confidence interval**: Upper and lower bounds
   - **Trend**: Increasing, decreasing, or stable
   - **Seasonality**: Seasonal patterns detected

4. Use forecast to:
   - Plan procurement in advance
   - Optimize inventory levels
   - Identify upcoming shortages

### Cost Optimization

1. Go to **Analytics** → **Costs** tab
2. View optimization opportunities:
   - **Quick Wins**: Low effort, high impact savings
   - **Procurement Bundles**: Volume discount opportunities
   - **Supplier Negotiation**: Competitive pricing insights
   - **Transportation**: Route consolidation savings
   - **Storage**: Space optimization potential

3. Tap any recommendation to:
   - See detailed analysis
   - View projected savings
   - Implement the optimization

### Performance Benchmarking

Compare your performance to industry standards:

1. Go to **Analytics** → **Performance** tab
2. View metrics:
   - **Material Shortage Rate**: % of time materials unavailable
   - **Equipment Utilization**: % of productive time
   - **On-Time Delivery**: % of deliveries on time
   - **Inventory Turnover**: How fast inventory moves

3. See percentile ranking (0-100):
   - Top 25%: Excellent
   - 50%: Average
   - Bottom 25%: Needs improvement

4. Review **Improvement Actions** for below-average metrics

### Generating Reports

1. Tap **"Generate Report"** in Analytics
2. Select report type:
   - Weekly Summary
   - Monthly Performance
   - Quarterly Analysis
   - Custom Date Range

3. Choose format: PDF, Excel, or Email
4. Report includes:
   - Executive summary
   - Key metrics and trends
   - Charts and visualizations
   - Recommendations

---

## Tips & Best Practices

### Daily Tasks

✅ **Morning**: Check Dashboard for critical alerts
✅ **Review**: Material shortages and take action
✅ **Monitor**: Deliveries scheduled for today
✅ **Update**: Equipment status and location

### Weekly Tasks

✅ **Review**: Upcoming deliveries for next 7 days
✅ **Check**: Equipment maintenance schedule
✅ **Analyze**: Inventory levels and reorder needs
✅ **Plan**: Material procurement for next 2 weeks

### Monthly Tasks

✅ **Review**: Analytics and performance metrics
✅ **Optimize**: Inventory levels based on forecasts
✅ **Evaluate**: Supplier performance and contracts
✅ **Plan**: Major equipment maintenance

### Performance Tips

1. **Use ABC Analysis**: Focus 80% of effort on A items
2. **Enable Notifications**: Stay informed of critical events
3. **Review Forecasts**: Plan procurement proactively
4. **Optimize Deliveries**: Consolidate to save costs
5. **Monitor Utilization**: Maximize equipment productivity

### Cost Saving Tips

1. **Bundle Procurement**: Order multiple items from same supplier
2. **Negotiate**: Use competitive pricing insights
3. **JIT Delivery**: Reduce storage costs
4. **Optimize Routes**: Consolidate deliveries
5. **Prevent Shortages**: Avoid expedited shipping costs

---

## Troubleshooting

### Common Issues

#### Material Not Found in Search

**Solution**:
1. Check spelling
2. Try searching by category instead
3. Use material code if available
4. Clear filters (may be hiding results)

#### Delivery Not Showing in Schedule

**Solution**:
1. Check project filter (may be viewing different project)
2. Check date range (may be outside current view)
3. Check status filter (may be filtered out)
4. Pull down to refresh data

#### Equipment Showing Incorrect Status

**Solution**:
1. Refresh the screen (pull down)
2. Check if status was recently updated
3. If still incorrect, tap equipment → "Report Issue"
4. Update status manually if authorized

#### Notifications Not Received

**Solution**:
1. Check app notification settings (Settings → Notifications)
2. Check device notification permissions
3. Verify notification preferences in profile
4. Check "quiet hours" settings (may be muted)

### Performance Issues

If app is slow:
1. Close and restart the app
2. Clear app cache (Settings → Clear Cache)
3. Check internet connection
4. Update to latest version

### Data Sync Issues

If data isn't syncing:
1. Check internet connection
2. Try manual refresh (pull down)
3. Check last sync time (Settings → Sync Status)
4. If offline, data will sync when connection restored

---

## FAQs

**Q: How often is data updated?**
A: Real-time for critical data (deliveries, alerts). Other data cached for 5 minutes to improve performance.

**Q: Can I use the app offline?**
A: Yes, view mode works offline. Changes sync when connection restored.

**Q: How do I change my default project?**
A: Settings → Default Project → Select project

**Q: Can I export data to Excel?**
A: Yes, go to Analytics → Generate Report → Export to Excel

**Q: How are supplier ratings calculated?**
A: Based on on-time delivery %, product quality, responsiveness, and pricing competitiveness.

**Q: What is the difference between safety stock and reorder point?**
A: Safety stock is buffer for demand variability. Reorder point is when to order (includes safety stock + lead time demand).

**Q: How accurate are demand forecasts?**
A: Typically 85-95% accuracy for materials with stable demand patterns. Less accurate for new materials or irregular demand.

**Q: Can I override automated reorders?**
A: Yes, you can modify or cancel automated reorder suggestions before they're submitted.

**Q: How do I request new features?**
A: Settings → Feedback → Feature Request

**Q: Where can I get training?**
A: Help → Training Resources or contact support@siteprogress.com

---

## Getting Help

### In-App Help

- Tap **"?"** icon on any screen for contextual help
- Go to **Settings → Help & Support** for full help center
- Use **Search** in help center to find specific topics

### Contact Support

- **Email**: support@siteprogress.com
- **Phone**: 1-800-SITE-PROG (business hours)
- **In-App**: Settings → Contact Support → Send Message

### Training Resources

- **Video Tutorials**: help.siteprogress.com/videos
- **User Forum**: community.siteprogress.com
- **Live Training**: Quarterly sessions (check calendar)

---

**Document Version**: 1.0
**Last Updated**: Week 10
**Next Review**: Quarterly
**Feedback**: help@siteprogress.com
