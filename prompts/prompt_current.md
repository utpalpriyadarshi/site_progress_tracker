Prompt 7

🧩 Suggested Prompt Refinement for Each Screen
P1 — BaselineScreen.tsx

Goal: Establish a master plan for schedule control.

Add these refinements:

Allow project selection at top (dropdown or context from active project)

Editable list of project items with planned start/end date pickers

“Set Dependency” modal (select predecessor/successor)

Button: [Calculate Critical Path]

Use topological sort (Kahn’s algorithm) with durations

Button: [Lock Baseline]

When locked → baseline dates copied to baseline_start_date, baseline_end_date fields in DB

Extra prompt refinement:

Integrate with WatermelonDB items table by adding planned_start_date, planned_end_date, baseline_start_date, baseline_end_date, and dependencies (JSON array of item IDs). Use database.write() transactions. Store dates as timestamps (numbers).

P2 — GanttChartScreen.tsx

Goal: Visual, interactive progress comparison.

Add these refinements:

Use react-native-svg or react-native-animated-gantt-chart for rendering.

Horizontal scrollable timeline (week/day/month zoom)

Each item:

Bar = planned duration (gray)

Overlay bar = actual progress (green/orange/red depending on variance)

Dependency arrows (SVG lines between bars)

Critical path items highlighted (red border)

Tap item → open detail modal (planned vs actual dates, variance, progress %)

Extra prompt refinement:

Fetch planned & actual progress data from items and progress_logs. Calculate variance dynamically. Use moment or dayjs for time scale calculations.

P3 — ProgressAnalyticsScreen.tsx

Goal: Quantitative insight.

Add these refinements:

KPIs:

Overall Progress (%) = sum(actual_qty) / sum(planned_qty)

Schedule Variance (days) = average(actual_end_date - planned_end_date)

Charts:

Line chart: Progress trend (weekly)

Bar chart: Schedule variance by site/item

Donut chart: On-track / delayed / ahead

Alerts:

List items behind schedule (variance > 0)

Forecast:

Trend-based completion estimate (use linear regression or moving average)

Extra prompt refinement:

Use recharts for visual analytics. Fetch data offline from WatermelonDB collections items and progress_logs. Include a “Sync Status” indicator showing if analytics are based on offline data.

P4 — ScheduleUpdateScreen.tsx

Goal: Controlled re-planning.

Add these refinements:

Editable list of items with current vs revised planned dates

Field: “Reason for change” (text input or dropdown)

On submit:

Store revision in schedule_revisions table with fields:

item_id, old_start, old_end, new_start, new_end, reason, timestamp

Calculate and display impact:

If a predecessor is delayed, dependent items show “Impacted”

Compare charts: Baseline vs Revised Gantt overlay

Extra prompt refinement:

Add a new WatermelonDB model: schedule_revisions. Each revision is versioned (v1, v2, …). Keep baseline locked for reference. Allow exporting revision history as JSON.

🔧 Additional Planning Module Infrastructure (Before You Code)

Add these in your prompt sequence before implementing the screens:

PL1 – Schema Update

Update WatermelonDB schema to version 11:

Add planned_start_date, planned_end_date, baseline_start_date, baseline_end_date to items

Add new table schedule_revisions with:

id, item_id, old_start, old_end, new_start, new_end, reason, timestamp

PL2 – PlanningService.ts

Create /src/planning/PlanningService.ts containing:

calculateCriticalPath(items: Item[]): Item[]

calculateProgressMetrics(projectId: string)

calculateScheduleVariance(itemId: string)

generateForecast(projectId: string)

Keep computation in this file to reuse across screens.

PL3 – Navigation

Create PlanningNavigator with 4 bottom tabs:

Baseline

Gantt

Analytics

Schedule Update

Each tab loads one of the four screens.