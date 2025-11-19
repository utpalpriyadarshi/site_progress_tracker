# Report Generation - Analysis & Improvement Plan

**Document Version**: 1.1
**Date**: November 19, 2025
**Current App Version**: v2.7
**Analyst**: Claude Code

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current State Analysis](#current-state-analysis)
3. [Critical Issues](#critical-issues)
4. [Improvement Plan](#improvement-plan)
5. [Implementation Roadmap](#implementation-roadmap)
6. [Technical Specifications](#technical-specifications)
7. [Testing Strategy](#testing-strategy)

---

## Executive Summary

### Overview
The Construction Site Progress Tracker has a well-designed PDF report generation system that is currently **disabled** due to native module linking issues. Additionally, critical financial reporting features for the Manager role are missing (placeholder only).

### Key Findings
- ✅ **ReportPdfService**: Professional PDF generation service exists (293 lines, well-designed)
- 🔴 **Status**: Disabled in production code (lines 300-315 in DailyReportsScreen.tsx)
- 🔴 **Blocker**: react-native-html-to-pdf native module not linked
- ❌ **Financial Reports**: Completely missing (placeholder screen only)
- 🟡 **ProgressReportModel**: Exists but not utilized

### Impact Assessment
- **High Priority**:
  - Supervisors cannot export daily reports to PDF
  - Managers have no financial reporting tools
  - Missing critical business intelligence features

- **Business Value**:
  - PDF reports essential for client deliverables
  - Financial reports critical for project management
  - Compliance and audit requirements

### Recommended Approach
**Phase 1** (2 days): Enable PDF generation - immediate user value
**Phase 2** (3 days): Enhanced daily reports with photos
**Phase 3** (5 days): Financial reporting suite
**Phase 4** (4 days): Advanced analytics and trends

**Total Estimated Time**: 14 days

---

## Current State Analysis

### 1. Implemented Components ✅

#### 1.1 ReportPdfService
**File**: `services/pdf/ReportPdfService.ts`
**Lines**: 293
**Status**: ✅ Complete but disabled

**Features**:
- Professional HTML template generation
- Beautiful gradient header design
- Responsive table layouts
- Color-coded progress indicators
- Status badges with visual feedback
- Site and supervisor information
- Overall progress summary
- Individual item tracking with notes

**Template Design**:
```html
- Gradient blue header (007AFF → 0051D5)
- Info grid layout (site, location, date, supervisor)
- Large progress summary card
- Detailed item table with:
  - Work Item name
  - Quantity (completed/planned)
  - Progress percentage (color-coded)
  - Status badge
  - Notes field
- Professional footer
```

**Color Scheme**:
- Green (#4CAF50): 75%+ progress, completed status
- Orange (#FF9800): 50-74% progress
- Yellow (#FFC107): 25-49% progress
- Red (#F44336): <25% progress
- Blue (#2196F3): In progress status
- Gray (#9E9E9E): Not started status

**Why Disabled**:
```typescript
// Line 300-315 in DailyReportsScreen.tsx
// TODO: Re-enable after linking react-native-html-to-pdf
pdfPath = ''; // PDF generation temporarily disabled
console.log('PDF generation skipped - will enable after library linking');
```

---

#### 1.2 DailyReportModel
**File**: `models/DailyReportModel.ts`
**Status**: ✅ In use

**Schema**:
```typescript
{
  site_id: string           // Foreign key to sites
  supervisor_id: string     // Foreign key to users
  report_date: number       // Timestamp (start of day)
  submitted_at: number      // Timestamp (when submitted)
  total_items: number       // Count of items updated
  total_progress: number    // Overall progress percentage
  pdf_path: string          // Local file path to PDF
  notes: string             // Report summary/notes
  sync_status: string       // pending, synced, failed
  _version: number          // Conflict resolution
}
```

**Associations**:
- belongs_to: Site
- belongs_to: Supervisor (User)

**Usage**: Currently stores report metadata, but `pdf_path` is always empty string

---

#### 1.3 ProgressReportModel
**File**: `models/ProgressReportModel.ts`
**Status**: 🟡 Exists but **NOT USED**

**Schema**:
```typescript
{
  project_id: string
  task_id: string
  supervisor_id: string
  report_id: string
  report_date: Date
  progress_percentage: number
  work_completed: string
  issues_identified: string
  weather_conditions: string      // 🌟 Additional field
  next_day_plan: string          // 🌟 Additional field
  photos_count: number           // 🌟 Additional field
  status: string                 // draft, submitted, approved
  summary: string
  created_at: Date
  updated_at: Date
}
```

**Associations**:
- belongs_to: Project
- belongs_to: Task
- belongs_to: Supervisor
- has_many: ProgressLogs

**Analysis**: This model is more comprehensive than DailyReportModel but is completely unused. Contains valuable fields like weather_conditions and next_day_plan.

---

#### 1.4 ReportsHistoryScreen
**File**: `src/supervisor/ReportsHistoryScreen.tsx`
**Status**: ✅ Fully functional

**Features**:
- View all submitted daily reports
- Filter by date: today, week, month, all
- Filter by site (uses SiteSelector)
- Search functionality
- View report details in dialog
- Shows progress logs associated with each report
- Pull-to-refresh
- Sync status indicators

**Data Display**:
- Report date and submission time
- Site name and location
- Total items updated
- Overall progress percentage
- Color-coded status chip
- Item-by-item breakdown in detail view

**Missing Features**:
- ❌ PDF download/view button
- ❌ Share PDF functionality
- ❌ Export to email
- ❌ Print option
- ❌ Delete old reports

---

#### 1.5 FinancialReportsScreen
**File**: `src/manager/FinancialReportsScreen.tsx`
**Status**: ❌ **PLACEHOLDER ONLY**

**Current Code** (27 lines):
```typescript
const FinancialReportsScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Financial Reports</Text>
      <Text>Generate and analyze financial reports for projects</Text>
    </View>
  );
};
```

**What's Missing**:
- ❌ Budget vs Actual reports
- ❌ BOM cost breakdown
- ❌ Cost variance analysis
- ❌ Procurement summary
- ❌ Resource utilization
- ❌ Cash flow projections
- ❌ P&L statements
- ❌ Invoice tracking
- ❌ Payment schedules

---

### 2. Package Dependencies

**react-native-html-to-pdf**: `^1.3.0`
**Status**: ✅ Installed in package.json
**Link Status**: ❌ **NOT LINKED** (native module not configured)

**Required Steps**:
1. Run `npx react-native link react-native-html-to-pdf`
2. Update Android permissions in `AndroidManifest.xml`:
   ```xml
   <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"/>
   <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"/>
   ```
3. Rebuild the app
4. Test PDF generation on device

---

## Critical Issues

### Priority Matrix

| Issue | Severity | Impact | Effort | Priority |
|-------|----------|--------|--------|----------|
| PDF generation disabled | 🔴 HIGH | Users can't export reports | LOW | 1 |
| Native module not linked | 🔴 HIGH | Blocks PDF feature | LOW | 1 |
| No financial reporting | 🔴 HIGH | Manager role incomplete | HIGH | 2 |
| No PDF viewer/share | 🟡 MEDIUM | Poor UX | MEDIUM | 3 |
| ProgressReportModel unused | 🟡 MEDIUM | Code duplication | LOW | 4 |
| No photo attachments in PDF | 🟡 MEDIUM | Limited report value | MEDIUM | 5 |
| No weather/next day plan | 🟢 LOW | Nice to have | LOW | 6 |
| No BOM cost reports | 🟡 MEDIUM | Missing insights | MEDIUM | 7 |
| No trend analysis | 🟢 LOW | Advanced feature | HIGH | 8 |

---

## Improvement Plan

### Phase 1: Fix PDF Generation (Priority 🔴 - 2 days)

#### Task 1.1: Link Native Module ⚡
**Duration**: 1 hour
**Complexity**: Low
**Assignee**: Developer

**Steps**:
1. Stop Metro bundler
2. Run linking command:
   ```bash
   npx react-native link react-native-html-to-pdf
   ```
3. Update `android/app/src/main/AndroidManifest.xml`:
   ```xml
   <manifest ...>
     <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"/>
     <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"/>
     <!-- ... other permissions -->
   </manifest>
   ```
4. Clean and rebuild:
   ```bash
   cd android && ./gradlew clean && cd ..
   npm start -- --reset-cache
   npm run android
   ```

**Testing**:
- [ ] App launches without errors
- [ ] No native module warnings in logs
- [ ] RNHTMLtoPDF.convert() executes without crashing

---

#### Task 1.2: Enable PDF Generation ⚡
**Duration**: 30 minutes
**Complexity**: Low
**File**: `src/supervisor/DailyReportsScreen.tsx`

**Changes**:

**BEFORE** (Lines 298-320):
```typescript
// Generate PDF (temporarily disabled - will enable after linking library)
let pdfPath = '';
try {
  // TODO: Re-enable after linking react-native-html-to-pdf
  // const itemsWithLogs = siteItems.map(item => ({
  //   item,
  //   progressLog: siteLogs.find(log => (log as any).itemId === item.id) || null,
  // }));

  // pdfPath = await ReportPdfService.generateDailyReport({
  //   site,
  //   items: itemsWithLogs,
  //   supervisorName: `Supervisor ${supervisorId}`,
  //   reportDate: new Date(),
  // });
  // reportPaths.push(pdfPath);

  pdfPath = ''; // PDF generation temporarily disabled
  console.log('PDF generation skipped - will enable after library linking');
} catch (pdfError) {
  console.error('Error generating PDF:', pdfError);
  // Continue even if PDF generation fails
}
```

**AFTER**:
```typescript
// Generate PDF report
let pdfPath = '';
try {
  const itemsWithLogs = siteItems.map(item => ({
    item,
    progressLog: siteLogs.find(log => (log as any).itemId === item.id) || null,
  }));

  pdfPath = await ReportPdfService.generateDailyReport({
    site,
    items: itemsWithLogs,
    supervisorName: `Supervisor ${supervisorId}`,
    reportDate: new Date(),
  });
  reportPaths.push(pdfPath);

  console.log('[PDF] Generated successfully:', pdfPath);
} catch (pdfError) {
  console.error('[PDF] Generation failed:', pdfError);
  showSnackbar('Report saved but PDF generation failed', 'warning');
  // Continue even if PDF generation fails - report still saved
}
```

**Additional Changes**:
- Update success message to include PDF generation status:
```typescript
const message = isOnline
  ? `${totalReportsGenerated} daily report(s) submitted - ${progressLogs.length} updates for ${reportDate}${reportPaths.length > 0 ? ` - ${reportPaths.length} PDF(s) generated` : ''}`
  : `${totalReportsGenerated} report(s) saved locally - ${progressLogs.length} updates for ${reportDate}${reportPaths.length > 0 ? ` - ${reportPaths.length} PDF(s) saved` : ''}`;
```

**Testing**:
- [ ] Submit daily report
- [ ] Check logs for PDF path
- [ ] Verify PDF file exists at path
- [ ] Open PDF and verify content
- [ ] Check DailyReport record has pdf_path populated

---

#### Task 1.3: Add PDF Viewer/Share 📱
**Duration**: 3 hours
**Complexity**: Medium
**Files**: `src/supervisor/ReportsHistoryScreen.tsx`

**Install Dependencies**:
```bash
npm install react-native-share react-native-file-viewer
npx react-native link react-native-share
npx react-native link react-native-file-viewer
```

**New Features**:

1. **View PDF Button**:
```typescript
// In report detail dialog
{selectedReport.report.pdfPath && (
  <Button
    mode="outlined"
    icon="file-pdf-box"
    onPress={() => handleViewPdf(selectedReport.report.pdfPath)}
    style={styles.pdfButton}
  >
    View PDF Report
  </Button>
)}
```

2. **Share PDF Button**:
```typescript
{selectedReport.report.pdfPath && (
  <Button
    mode="contained"
    icon="share-variant"
    onPress={() => handleSharePdf(selectedReport.report.pdfPath)}
    style={styles.shareButton}
  >
    Share Report
  </Button>
)}
```

3. **Implementation**:
```typescript
import FileViewer from 'react-native-file-viewer';
import Share from 'react-native-share';
import RNFS from 'react-native-fs';

const handleViewPdf = async (pdfPath: string) => {
  try {
    await FileViewer.open(pdfPath);
  } catch (error) {
    console.error('Error viewing PDF:', error);
    showSnackbar('Failed to open PDF', 'error');
  }
};

const handleSharePdf = async (pdfPath: string) => {
  try {
    const fileExists = await RNFS.exists(pdfPath);
    if (!fileExists) {
      showSnackbar('PDF file not found', 'error');
      return;
    }

    await Share.open({
      url: `file://${pdfPath}`,
      type: 'application/pdf',
      title: 'Share Daily Report',
      subject: `Daily Progress Report - ${new Date().toLocaleDateString()}`,
    });
  } catch (error) {
    console.error('Error sharing PDF:', error);
    if (error.message !== 'User did not share') {
      showSnackbar('Failed to share PDF', 'error');
    }
  }
};
```

**Testing**:
- [ ] View PDF button opens PDF in device viewer
- [ ] Share button shows share sheet
- [ ] Can share via WhatsApp
- [ ] Can share via Email
- [ ] Can share via other apps
- [ ] Handle missing PDF gracefully

---

### Phase 2: Enhanced Daily Reports (Priority 🟡 - 3 days)

#### Task 2.1: Add Photos to PDF Reports 📸
**Duration**: 4 hours
**Complexity**: Medium

**Changes Required**:

1. **Update ReportPdfService to include photos**:
```typescript
// Add photo section to HTML template
private static generatePhotosHtml(progressLog: ProgressLogModel): string {
  if (!progressLog.photos || progressLog.photos === '[]') {
    return '<p style="color: #999; font-style: italic;">No photos attached</p>';
  }

  const photos = JSON.parse(progressLog.photos);
  const photosHtml = photos.map((photoUri: string, index: number) => `
    <div style="display: inline-block; margin: 10px;">
      <img src="${photoUri}" style="width: 200px; height: 150px; object-fit: cover; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);" />
      <p style="text-align: center; margin-top: 5px; font-size: 10px; color: #666;">Photo ${index + 1}</p>
    </div>
  `).join('');

  return `
    <div style="margin-top: 10px;">
      <h4 style="font-size: 12px; color: #666; margin-bottom: 10px;">Attached Photos</h4>
      ${photosHtml}
    </div>
  `;
}
```

2. **Update item row template**:
```typescript
return `
  <tr>
    <td colspan="5" style="padding: 12px; border-bottom: 1px solid #e0e0e0;">
      <div>
        <strong>${item.name}</strong>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 10px;">
          <div>Quantity: ${item.completedQuantity}/${item.plannedQuantity} ${item.unitOfMeasurement}</div>
          <div>Progress: ${progress}%</div>
          <div>Status: ${item.status}</div>
        </div>
        ${progressLog ? this.generatePhotosHtml(progressLog) : ''}
        ${progressLog?.notes ? `<p style="margin-top: 10px; font-size: 12px;"><strong>Notes:</strong> ${progressLog.notes}</p>` : ''}
      </div>
    </td>
  </tr>
`;
```

**Testing**:
- [x] Photos appear in PDF ✅ (v2.7 - Nov 19, 2025)
- [x] Photo quality is acceptable ✅
- [x] Multiple photos layout correctly ✅
- [x] Photo chip indicators on item cards ✅
- [x] Photo count refreshes after save ✅

- [x] PDF file size is reasonable (269KB with photos vs 148KB without) ✅
- [x] Works with no photos (shows placeholder) ✅

**Status**: ✅ **COMPLETED** (v2.7)

---

#### Task 2.2: Weather & Next Day Plan 🌤️
**Duration**: 4 hours
**Complexity**: Medium

**Database Migration Required**: YES (Schema v29)

**Migration**:
```typescript
// models/migrations/index.js - Add schema v29
{
  toVersion: 29,
  steps: [
    {
      type: 'add_columns',
      table: 'daily_reports',
      columns: [
        { name: 'weather_conditions', type: 'string', isOptional: true },
        { name: 'next_day_plan', type: 'string', isOptional: true },
      ],
    },
  ],
},
```

**Model Update**:
```typescript
// models/DailyReportModel.ts
@field('weather_conditions') weatherConditions?: string;
@field('next_day_plan') nextDayPlan?: string;
```

**UI Changes** (DailyReportsScreen):
```typescript
// Add state
const [weatherInput, setWeatherInput] = useState('');
const [nextDayPlanInput, setNextDayPlanInput] = useState('');

// Add to submit dialog (before submit button)
<TextInput
  label="Weather Conditions (Optional)"
  value={weatherInput}
  onChangeText={setWeatherInput}
  mode="outlined"
  placeholder="e.g., Sunny, Rainy, Cloudy"
  style={styles.weatherInput}
/>

<TextInput
  label="Next Day Plan (Optional)"
  value={nextDayPlanInput}
  onChangeText={setNextDayPlanInput}
  mode="outlined"
  multiline
  numberOfLines={3}
  placeholder="Brief plan for tomorrow's work..."
  style={styles.nextDayInput}
/>

// Update report creation
report.weatherConditions = weatherInput || '';
report.nextDayPlan = nextDayPlanInput || '';
```

**PDF Template Update**:
```typescript
// Add to info-grid
<div class="info-box">
  <h3>Weather</h3>
  <p>${data.weatherConditions || 'Not recorded'}</p>
</div>

// Add section before footer
${data.nextDayPlan ? `
  <div style="margin-top: 30px; padding: 20px; background: #FFF9C4; border-left: 4px solid #FBC02D; border-radius: 8px;">
    <h3 style="font-size: 16px; color: #F57F17; margin-bottom: 10px;">📋 Next Day Plan</h3>
    <p style="font-size: 14px; color: #333; line-height: 1.6;">${data.nextDayPlan}</p>
  </div>
` : ''}
```

**Testing**:
- [ ] Migration runs successfully
- [ ] Weather field accepts input
- [ ] Next day plan accepts multiline text
- [ ] Fields are optional (can submit without)
- [ ] Data saves to database
- [ ] Appears correctly in PDF
- [ ] Shows in ReportsHistoryScreen

---

#### Task 2.3: Email Report Directly 📧
**Duration**: 4 hours
**Complexity**: Medium

**Install Dependency**:
```bash
npm install react-native-mail
npx react-native link react-native-mail
```

**Implementation**:
```typescript
// src/supervisor/ReportsHistoryScreen.tsx
import Mailer from 'react-native-mail';

const handleEmailReport = async (report: DailyReportModel, pdfPath: string) => {
  try {
    // Check if PDF exists
    const fileExists = await RNFS.exists(pdfPath);
    if (!fileExists) {
      showSnackbar('PDF file not found. Please regenerate the report.', 'error');
      return;
    }

    // Compose email
    await Mailer.mail({
      subject: `Daily Progress Report - ${report.site.name} - ${formatDate(new Date(report.reportDate))}`,
      recipients: ['manager@construction.com'], // Can be made configurable
      body: `
        <h2>Daily Progress Report</h2>
        <p><strong>Site:</strong> ${report.site.name}</p>
        <p><strong>Location:</strong> ${report.site.location}</p>
        <p><strong>Date:</strong> ${formatDate(new Date(report.reportDate))}</p>
        <p><strong>Submitted by:</strong> Supervisor ${report.supervisorId}</p>
        <p><strong>Overall Progress:</strong> ${report.totalProgress.toFixed(1)}%</p>
        <p><strong>Items Updated:</strong> ${report.totalItems}</p>
        ${report.notes ? `<p><strong>Notes:</strong> ${report.notes}</p>` : ''}
        <br/>
        <p>Please find the detailed PDF report attached.</p>
      `,
      isHTML: true,
      attachments: [{
        path: pdfPath,
        type: 'pdf',
        name: `DailyReport_${report.site.name}_${formatDate(new Date(report.reportDate))}.pdf`,
      }],
    }, (error, event) => {
      if (error) {
        showSnackbar('Failed to send email', 'error');
      } else if (event === 'sent') {
        showSnackbar('Email sent successfully', 'success');
      }
    });
  } catch (error) {
    console.error('Error sending email:', error);
    showSnackbar('Failed to compose email', 'error');
  }
};
```

**UI Addition**:
```typescript
// Add email button to report detail dialog
<Button
  mode="contained"
  icon="email-send"
  onPress={() => handleEmailReport(selectedReport.report, selectedReport.report.pdfPath)}
  disabled={!selectedReport.report.pdfPath}
  style={styles.emailButton}
>
  Email Report
</Button>
```

**Testing**:
- [ ] Email composer opens
- [ ] PDF is attached correctly
- [ ] Email body formatted properly
- [ ] Can modify recipients
- [ ] Sending works
- [ ] Handle errors gracefully

---

### Phase 3: Financial Reports (Priority 🔴 - 5 days)

#### Task 3.1: Project Cost Summary Report 💰
**Duration**: 1 day
**Complexity**: High
**File**: `src/manager/FinancialReportsScreen.tsx` (complete rewrite)

**Features to Implement**:

1. **Project Selector** (dropdown)
2. **Date Range Picker** (for filtering)
3. **Cost Breakdown Cards**:
   - Total Budget
   - Actual Spent
   - Variance ($ and %)
   - Remaining Budget

4. **BOM Cost Breakdown**:
   - Material Costs
   - Labor Costs
   - Equipment Costs
   - Overhead
   - Total Cost

5. **Visual Charts**:
   - Pie chart: Cost distribution by category
   - Bar chart: Budget vs Actual by category
   - Line chart: Cumulative spending over time

6. **Export Options**:
   - PDF report
   - Excel export
   - Email summary

**Data Sources**:
```typescript
// Fetch BOM data for project
const boms = await database.collections
  .get('boms')
  .query(Q.where('project_id', projectId))
  .fetch();

// Calculate costs
const materialCost = boms.reduce((sum, bom) => sum + bom.materialCost, 0);
const laborCost = boms.reduce((sum, bom) => sum + bom.laborCost, 0);
const equipmentCost = boms.reduce((sum, bom) => sum + bom.equipmentCost, 0);
const totalCost = boms.reduce((sum, bom) => sum + bom.totalCost, 0);

// Get project budget (would need to add budget field to Project model)
const project = await database.collections
  .get('projects')
  .find(projectId);

const variance = project.budget - totalCost;
const variancePercent = (variance / project.budget) * 100;
```

**UI Layout**:
```
┌─────────────────────────────────────┐
│  Financial Reports                   │
├─────────────────────────────────────┤
│  [Project Selector ▼]               │
│  [Date Range: Last 30 Days ▼]       │
├─────────────────────────────────────┤
│  ┌───────┐ ┌───────┐ ┌───────┐     │
│  │Budget │ │Actual │ │Variance│    │
│  │$100K  │ │ $75K  │ │ +$25K  │    │
│  └───────┘ └───────┘ └───────┘     │
├─────────────────────────────────────┤
│  Cost Breakdown                      │
│  ┌─────────────────────────────┐   │
│  │ Materials    $40K   53%     │   │
│  │ Labor        $25K   33%     │   │
│  │ Equipment    $10K   14%     │   │
│  └─────────────────────────────┘   │
├─────────────────────────────────────┤
│  [📊 View Charts] [📄 Export PDF]  │
│  [📧 Email Report]                  │
└─────────────────────────────────────┘
```

**Testing**:
- [ ] Project selector works
- [ ] Cost calculations accurate
- [ ] Charts display correctly
- [ ] PDF export functional
- [ ] Excel export working
- [ ] Email integration

---

#### Task 3.2: Procurement Summary Report 📦
**Duration**: 1 day
**Complexity**: High

**Features**:
1. **RFQ Status Dashboard**:
   - Total RFQs: Draft, Issued, Evaluated, Awarded
   - Pending evaluations count
   - Overdue RFQs (past closing date)

2. **Vendor Performance Metrics**:
   - Response rate (quotes received / RFQs sent)
   - Average quote value
   - Win rate (awarded / participated)
   - On-time delivery rate

3. **Purchase Order Tracking**:
   - Total POs issued
   - Pending deliveries
   - Completed deliveries
   - Payment status

4. **Visual Dashboard**:
   - Donut chart: RFQ status distribution
   - Bar chart: Top 5 vendors by award value
   - Timeline: Upcoming deliveries

**Data Queries**:
```typescript
// RFQ statistics
const totalRfqs = await database.collections.get('rfqs').query().fetchCount();
const draftRfqs = await database.collections.get('rfqs').query(Q.where('status', 'draft')).fetchCount();
const issuedRfqs = await database.collections.get('rfqs').query(Q.where('status', 'issued')).fetchCount();
const evaluatedRfqs = await database.collections.get('rfqs').query(Q.where('status', 'evaluated')).fetchCount();
const awardedRfqs = await database.collections.get('rfqs').query(Q.where('status', 'awarded')).fetchCount();

// Vendor performance
const vendors = await database.collections.get('vendors').query().fetch();
for (const vendor of vendors) {
  const quotes = await database.collections.get('rfq_vendor_quotes')
    .query(Q.where('vendor_id', vendor.id))
    .fetch();

  const awards = quotes.filter(q => q.isAwarded).length;
  vendor.winRate = quotes.length > 0 ? (awards / quotes.length) * 100 : 0;
}
```

**Testing**:
- [ ] Statistics accurate
- [ ] Vendor rankings correct
- [ ] Charts render properly
- [ ] Export functions work

---

#### Task 3.3: Resource Utilization Report 👷
**Duration**: 1 day
**Complexity**: Medium

**Features**:
1. **Labor Utilization**:
   - Total labor hours (by team/role)
   - Productive hours vs idle time
   - Overtime hours
   - Cost per hour

2. **Equipment Utilization**:
   - Equipment usage hours
   - Idle equipment
   - Maintenance costs
   - Rental vs owned analysis

3. **Material Consumption**:
   - Materials used vs planned
   - Waste percentage
   - Top consumed materials
   - Inventory turnover

**Testing**:
- [ ] Data aggregation correct
- [ ] Calculations verified
- [ ] Export working

---

#### Task 3.4: Cash Flow Projection 💵
**Duration**: 2 days
**Complexity**: High

**Features**:
1. **Monthly Cash Flow**:
   - Projected income
   - Planned expenses
   - Net cash flow
   - Running balance

2. **Payment Schedule**:
   - Upcoming payments (to vendors)
   - Expected receipts (from clients)
   - Payment terms tracking

3. **Working Capital Analysis**:
   - Current assets
   - Current liabilities
   - Working capital ratio
   - Cash conversion cycle

4. **Forecast Charts**:
   - 6-month cash flow projection
   - Waterfall chart: sources and uses
   - Burn rate analysis

**Testing**:
- [ ] Projections mathematically sound
- [ ] Charts accurate
- [ ] Scenarios testable

---

### Phase 4: Advanced Reports (Priority 🟢 - 4 days)

#### Task 4.1: Project Executive Summary 📊
**Duration**: 1 day
**Complexity**: Medium

**Features**:
- Overall project health score (0-100)
- Key milestones status (on track, at risk, delayed)
- Critical path items
- Top 5 risks
- Resource allocation efficiency
- Budget health indicator
- Schedule performance index (SPI)
- Cost performance index (CPI)

**One-Page PDF Export**: Executive-friendly summary

---

#### Task 4.2: Safety & Quality Reports 🦺
**Duration**: 1 day
**Complexity**: Medium

**Features**:
- Safety inspection compliance rate
- Quality checklist scores
- Incident reports summary
- Corrective actions (open/closed)
- Safety KPIs (days without incident)
- Non-conformance tracking

---

#### Task 4.3: Progress Trend Analysis 📈
**Duration**: 2 days
**Complexity**: High

**Features**:
- Historical progress charts (weekly/monthly)
- Velocity tracking (work completed per period)
- Forecast completion date (based on trends)
- S-curve: planned vs actual progress
- Productivity trends
- Delay analysis (reasons for slippage)
- Resource productivity trends

**Advanced Analytics**:
- Moving average calculations
- Regression analysis for forecasting
- Variance analysis
- Trend indicators (improving/declining)

---

## Implementation Roadmap

### Sprint 1: Enable PDF Generation (Week 1)
**Duration**: 2 days
**Deliverables**:
- ✅ Linked react-native-html-to-pdf
- ✅ PDF generation enabled
- ✅ View/Share PDF functionality
- ✅ Testing complete
- ✅ Documentation updated
- ✅ Committed to main

**Success Criteria**:
- Supervisors can generate and share PDF reports
- PDFs render correctly on all devices
- No crashes or errors

---

### Sprint 2: Enhanced Daily Reports (Week 2)
**Duration**: 3 days
**Deliverables**:
- ✅ Photos in PDF reports
- ✅ Weather & next day plan fields
- ✅ Email report functionality
- ✅ Schema migration to v29
- ✅ Testing complete
- ✅ Documentation updated
- ✅ Committed to main

**Success Criteria**:
- Photos appear in PDFs
- Weather/plan data captured
- Email sharing works

---

### Sprint 3: Financial Reports - Part 1 (Week 3)
**Duration**: 3 days
**Deliverables**:
- ✅ Cost summary report
- ✅ Procurement summary
- ✅ Charts and visualizations
- ✅ PDF export for financial reports
- ✅ Testing complete
- ✅ Committed to main

**Success Criteria**:
- Managers can view financial data
- Cost calculations accurate
- Reports exportable

---

### Sprint 4: Financial Reports - Part 2 (Week 3-4)
**Duration**: 2 days
**Deliverables**:
- ✅ Resource utilization
- ✅ Cash flow projections
- ✅ Complete financial suite
- ✅ Testing complete
- ✅ Committed to main

---

### Sprint 5: Advanced Reports (Week 4)
**Duration**: 4 days
**Deliverables**:
- ✅ Executive summary
- ✅ Safety & quality reports
- ✅ Trend analysis
- ✅ Complete report library
- ✅ User guide documentation
- ✅ Final testing
- ✅ Production ready

---

## Technical Specifications

### PDF Generation Architecture

**Library**: react-native-html-to-pdf v1.3.0
**Approach**: HTML → PDF conversion
**Storage**: Local device storage (Documents folder)

**File Naming Convention**:
```
DailyReport_[SiteName]_[YYYY-MM-DD].pdf
FinancialReport_[ProjectName]_[YYYY-MM-DD].pdf
ExecutiveSummary_[ProjectName]_[YYYY-MM-DD].pdf
```

**File Path Structure**:
```
/storage/emulated/0/Documents/
  └── ConstructionReports/
      ├── DailyReports/
      ├── FinancialReports/
      └── ExecutiveSummaries/
```

**Storage Limits**:
- Max file size: 10MB per PDF
- Retention: 90 days (auto-cleanup)
- Total storage quota: 500MB

---

### Chart Libraries

**Recommended**: react-native-chart-kit or victory-native

**Chart Types Needed**:
1. Line charts (progress trends)
2. Bar charts (budget comparisons)
3. Pie/Donut charts (cost distribution)
4. Waterfall charts (cash flow)
5. S-curves (schedule performance)

**Installation**:
```bash
npm install react-native-chart-kit react-native-svg
npx react-native link react-native-svg
```

---

### Email Integration

**Library**: react-native-mail
**Fallback**: react-native-share with email option

**Email Template**:
```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; }
    h2 { color: #007AFF; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #007AFF; color: white; }
  </style>
</head>
<body>
  <h2>{{REPORT_TITLE}}</h2>
  <p><strong>Generated:</strong> {{TIMESTAMP}}</p>
  {{REPORT_BODY}}
  <p>This is an automated email from Construction Site Progress Tracker.</p>
</body>
</html>
```

---

### Database Schema Changes

**Schema v29** (Weather & Next Day Plan):
```typescript
{
  toVersion: 29,
  steps: [
    {
      type: 'add_columns',
      table: 'daily_reports',
      columns: [
        { name: 'weather_conditions', type: 'string', isOptional: true },
        { name: 'next_day_plan', type: 'string', isOptional: true },
      ],
    },
  ],
}
```

**Future Schema v30** (Budget tracking):
```typescript
{
  toVersion: 30,
  steps: [
    {
      type: 'add_columns',
      table: 'projects',
      columns: [
        { name: 'budget_amount', type: 'number', isOptional: true },
        { name: 'budget_currency', type: 'string', isOptional: true },
        { name: 'actual_spent', type: 'number', isOptional: true },
      ],
    },
  ],
}
```

---

## Testing Strategy

### Unit Tests

**Files to Test**:
1. `ReportPdfService.ts`
   - HTML generation correctness
   - Color coding logic
   - Date formatting
   - Error handling

2. Financial calculation functions
   - Cost aggregation
   - Variance calculations
   - Percentage calculations
   - Rounding accuracy

**Framework**: Jest
**Coverage Target**: 80%+

---

### Integration Tests

**Test Scenarios**:

1. **PDF Generation Flow**:
   - Submit daily report → PDF created → File exists → PDF readable

2. **Share Flow**:
   - Generate PDF → Share button → WhatsApp opens → PDF attached

3. **Email Flow**:
   - Generate PDF → Email button → Mail composer opens → PDF attached → Send

4. **Financial Reports**:
   - Select project → Fetch BOMs → Calculate costs → Display charts → Export

**Framework**: Detox or React Native Testing Library

---

### Manual Testing Checklist

**Phase 1 - PDF Generation**:
- [ ] Daily report submission creates PDF
- [ ] PDF file path stored in database
- [ ] PDF opens correctly
- [ ] PDF content matches data
- [ ] Photos render in PDF (Phase 2)
- [ ] Share to WhatsApp works
- [ ] Share to Email works
- [ ] PDF file size reasonable (<5MB)
- [ ] Works offline (generates locally)
- [ ] Error handling (disk full, permissions)

**Phase 2 - Enhanced Reports**:
- [ ] Weather input saves
- [ ] Next day plan saves
- [ ] Data appears in PDF
- [ ] Email sends successfully
- [ ] Email has correct attachment
- [ ] Email body formatted correctly

**Phase 3 - Financial Reports**:
- [ ] Cost calculations accurate
- [ ] Charts display correctly
- [ ] Project selector works
- [ ] Date range filtering works
- [ ] Export to PDF
- [ ] Export to Excel
- [ ] Email report works

**Phase 4 - Advanced Reports**:
- [ ] Executive summary accurate
- [ ] Safety reports complete
- [ ] Trend analysis correct
- [ ] All charts render
- [ ] Performance acceptable

---

## Risk Assessment

### Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Native module linking fails | LOW | HIGH | Test on multiple devices, provide manual linking guide |
| PDF file size too large | MEDIUM | MEDIUM | Compress images, limit photos per report |
| Email library compatibility | LOW | MEDIUM | Use fallback share option |
| Chart rendering performance | MEDIUM | LOW | Use optimized chart library, limit data points |
| Storage quota exceeded | LOW | MEDIUM | Implement auto-cleanup, warn user |

### Business Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| User adoption low | LOW | HIGH | Training, clear benefits communication |
| Report accuracy questioned | LOW | HIGH | Thorough testing, data validation |
| Performance issues on old devices | MEDIUM | MEDIUM | Progressive enhancement, graceful degradation |

---

## Success Metrics

### Key Performance Indicators (KPIs)

1. **Adoption Rate**:
   - Target: 90% of supervisors use PDF export within 2 weeks
   - Measurement: Track PDF generation events

2. **Report Generation Success Rate**:
   - Target: 95%+ success rate (no errors)
   - Measurement: Log PDF generation attempts vs successes

3. **User Satisfaction**:
   - Target: 4.5/5 rating on report quality
   - Measurement: In-app feedback survey

4. **Performance**:
   - Target: PDF generation <5 seconds
   - Target: Financial report load <3 seconds
   - Measurement: Performance monitoring

5. **Error Rate**:
   - Target: <1% error rate
   - Measurement: Error tracking and logging

---

## Documentation Requirements

### User Documentation

1. **User Guide**: "How to Generate and Share Reports"
   - Step-by-step with screenshots
   - Common issues and solutions
   - Best practices

2. **Feature Overview**: "Report Types and Use Cases"
   - When to use each report
   - Who should receive reports
   - Report interpretation guide

### Technical Documentation

1. **Developer Guide**: "Report Generation System"
   - Architecture overview
   - Adding new report types
   - Customizing templates
   - Troubleshooting guide

2. **API Documentation**:
   - ReportPdfService methods
   - Financial calculation functions
   - Chart configuration

---

## Maintenance Plan

### Regular Tasks

1. **Weekly**:
   - Monitor error logs for PDF generation failures
   - Check disk space usage
   - Review user feedback

2. **Monthly**:
   - Clean up old PDF files (>90 days)
   - Review storage quota usage
   - Update chart libraries if needed

3. **Quarterly**:
   - Audit report accuracy
   - Performance optimization review
   - User satisfaction survey

### Support Plan

**Common Issues**:
1. "PDF won't open" → Check file permissions, reinstall PDF viewer
2. "Share button not working" → Check app permissions
3. "Email not sending" → Check email app configuration
4. "Charts not displaying" → Clear cache, update app

**Escalation Path**:
- Level 1: User guide/FAQ
- Level 2: In-app support chat
- Level 3: Developer support ticket

---

## Appendix

### A. Sample PDF Templates

See: `services/pdf/templates/` (to be created)
- DailyReportTemplate.html
- FinancialReportTemplate.html
- ExecutiveSummaryTemplate.html

### B. Chart Configuration Examples

See: `src/components/charts/` (to be created)
- CostBreakdownChart.tsx
- ProgressTrendChart.tsx
- CashFlowChart.tsx

### C. Database Queries Reference

Common queries for report generation:

```typescript
// Get all BOMs for a project
const boms = await database.collections
  .get('boms')
  .query(Q.where('project_id', projectId))
  .fetch();

// Get daily reports for date range
const reports = await database.collections
  .get('daily_reports')
  .query(
    Q.where('report_date', Q.gte(startDate)),
    Q.where('report_date', Q.lte(endDate)),
    Q.sortBy('report_date', Q.desc)
  )
  .fetch();

// Get RFQs by status
const rfqs = await database.collections
  .get('rfqs')
  .query(Q.where('status', status))
  .fetch();
```

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-17 | Claude Code | Initial plan created |

---

**End of Document**
