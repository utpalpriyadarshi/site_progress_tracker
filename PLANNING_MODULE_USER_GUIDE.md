# Planning Module User Guide

**Version:** v1.4 (Baseline Planning)
**Last Updated:** 2025-10-13
**For:** Construction Managers, Planners, Supervisors

---

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Baseline Planning Workflow](#baseline-planning-workflow)
4. [Features Guide](#features-guide)
5. [Tips & Best Practices](#tips--best-practices)
6. [Troubleshooting](#troubleshooting)

---

## Introduction

The Planning Module helps you create and manage construction project schedules with advanced features including:

- **Baseline Planning** - Set and lock your original project schedule
- **Dependency Management** - Define which tasks must complete before others
- **Critical Path Analysis** - Identify bottleneck tasks that affect project completion
- **Schedule Variance Tracking** - Compare actual vs. planned progress

### Who Should Use This Module?

- **Project Managers** - Plan overall project schedules
- **Planning Specialists** - Create detailed work breakdowns
- **Site Supervisors** - Track actual vs. planned dates

---

## Getting Started

### Accessing the Planning Module

1. Log in to the app
2. Select **"Planner"** role from the home screen
3. Navigate to **"Baseline"** tab at the bottom

### Prerequisites

Before using the Planning Module, ensure you have:
- ✅ At least one project created
- ✅ At least one site under that project
- ✅ Construction items added to the site
- ✅ Planned start and end dates set for each item

---

## Baseline Planning Workflow

### Step-by-Step Guide

#### Step 1: Select Your Project

1. On the Baseline screen, tap the **"Choose Project"** button
2. Select your project from the dropdown menu
3. The screen will load all items for that project

**What you'll see:**
- List of all construction items
- Current planned dates for each item
- Item status and duration

---

#### Step 2: Review and Adjust Planned Dates

For each item, you can:

**View Information:**
- Item name
- Planned start and end dates
- Duration (calculated automatically)
- Current status (not started, in progress, completed)

**Edit Dates (if baseline not locked):**
1. Tap the **start date** or **end date** field
2. Select new date from the picker
3. Date updates automatically
4. Duration recalculates

**Visual Indicators:**
- **Blue bar** - Shows baseline dates (after baseline is locked)
- **Red border** - Item is on the critical path
- **Orange chip** - Baseline is locked (dates cannot be edited)

---

#### Step 3: Define Dependencies

Dependencies tell the system which items must complete before others can start.

**Example:**
- Foundation must complete before Framing can start
- Framing depends on Foundation

**How to Set Dependencies:**

1. Find the item that depends on others (e.g., "Framing")
2. Tap the **"Manage"** button next to "Dependencies: 0"
3. A modal opens showing all available items
4. **Check the boxes** for items that must complete first
5. Use the **search bar** to find specific items
6. Review the count: "X dependencies selected"
7. Tap **"Save"**

**Important Notes:**
- ⚠️ You cannot create circular dependencies (A depends on B, B depends on A)
- ⚠️ The system will alert you if you try
- ✅ You can add multiple dependencies per item
- ✅ Dependencies can be changed anytime before baseline is locked

---

#### Step 4: Calculate Critical Path

The critical path shows which tasks, if delayed, will delay the entire project.

**How to Calculate:**

1. After setting up dependencies, tap **"Calculate Critical Path"**
2. The system analyzes all items and dependencies
3. A dialog shows:
   - Number of critical items found
   - Total project duration

**Understanding Results:**

**Critical Path Items (Red Border):**
- These tasks have zero "slack" or "float"
- Any delay to these tasks delays the entire project
- Focus your attention on keeping these on schedule

**Non-Critical Items:**
- These have some slack time
- Can be delayed a few days without affecting project completion
- Still important, but less urgent

**Info Card Displayed:**
- Blue card shows critical path summary
- "Items with red borders are critical"
- Helps you prioritize work

---

#### Step 5: Lock the Baseline

Once you're satisfied with your plan, lock it to create a baseline for comparison.

**What is a Baseline?**
- A snapshot of your planned schedule
- Used to compare against actual progress
- Shows schedule variance (delays or early completion)
- Industry best practice for project management

**How to Lock Baseline:**

1. Review all dates and dependencies
2. Tap **"Lock Baseline"** button
3. Read the confirmation dialog carefully:
   - "This will save current planned dates as baseline"
   - "This action cannot be easily undone"
4. Tap **"Lock Baseline"** to confirm

**What Happens After Locking:**

✅ **Changes Made:**
- Baseline dates saved for all items
- `Baseline Locked` button becomes disabled
- Orange warning card appears at top
- All date pickers become disabled (greyed out)
- Dependency management disabled
- Blue baseline info bars appear on each item card

✅ **You Can Still:**
- View all information
- Calculate critical path
- Navigate to other screens
- Make schedule changes through "Schedule Update" screen (Phase 6)

⚠️ **You Cannot:**
- Edit dates directly (must use revision process)
- Change dependencies
- Unlock baseline easily

---

## Features Guide

### Feature 1: Project Selector

**Purpose:** Switch between different projects.

**How to Use:**
- Tap the dropdown button at the top
- Select a different project
- Screen updates with new project's items

**Tips:**
- Project name is always visible
- Current selection is marked with a checkmark

---

### Feature 2: Item Planning Cards

Each item is displayed as a card with comprehensive information.

**Card Components:**

1. **Header:**
   - Item name
   - Critical path chip (if applicable)
   - Lock status chip (if baseline locked)

2. **Duration & Status:**
   - "Duration: X days"
   - "Status: not started / in progress / completed"

3. **Date Fields:**
   - Start date (editable if not locked)
   - End date (editable if not locked)
   - Calendar icon for date picker

4. **Baseline Info (after lock):**
   - Blue bar showing baseline date range
   - Variance display:
     - Green text = ahead of schedule
     - Red text = behind schedule
     - Example: "+3 days" (3 days delayed)

5. **Dependencies:**
   - Count of predecessor items
   - "Manage" button to edit dependencies

**Color Coding:**
- **Red border** = Critical path item
- **Blue info bar** = Baseline dates
- **Green variance** = Ahead of schedule
- **Red variance** = Behind schedule
- **Orange chip** = Locked

---

### Feature 3: Dependency Management Modal

**Opening the Modal:**
- Tap "Manage" button on any item card

**Modal Features:**

1. **Search Bar:**
   - Type to filter items
   - Searches by item name
   - Real-time filtering

2. **Item List:**
   - All items except current one
   - Shows item name
   - Shows date range for reference
   - Checkbox for selection

3. **Multi-Select:**
   - Check multiple items
   - Counter shows: "X dependencies selected"

4. **Validation:**
   - System prevents circular dependencies
   - Alert shows if invalid
   - Can correct and retry

5. **Actions:**
   - **Cancel** - Discard changes, close modal
   - **Save** - Save dependencies, update count

---

### Feature 4: Critical Path Calculation

**What It Does:**
- Analyzes all items and dependencies
- Uses industry-standard Kahn's algorithm
- Identifies the longest path through the project
- Calculates total project duration
- Highlights critical items visually

**When to Calculate:**
- After setting up all dependencies
- When you change dependencies
- Periodically to verify critical tasks
- Before locking baseline

**Understanding the Results:**

**Example Project:**
```
Foundation (5 days) → Framing (10 days) → Roofing (7 days) = 22 days
                    → Plumbing (3 days) → Electrical (4 days) = 12 days
```

**Critical Path:** Foundation → Framing → Roofing (22 days)
- These 3 tasks determine project completion
- Plumbing and Electrical have 10 days of slack

**Slack/Float:**
- Time a task can be delayed without affecting project
- Plumbing can start anytime in a 10-day window
- Critical tasks have zero slack

---

### Feature 5: Baseline Locking

**Purpose:** Create an immutable reference point for schedule comparison.

**Benefits:**
- Track schedule variance over time
- Identify trends (always delayed vs. occasional delays)
- Justify schedule changes to stakeholders
- Measure planning accuracy
- Industry-standard project management practice

**When to Lock:**
- After thorough review of all dates
- After setting all dependencies
- After stakeholder approval (if required)
- Before work begins (ideal)
- When you're confident in the plan

**When NOT to Lock:**
- During initial planning (dates still rough)
- If major scope changes expected
- If client hasn't approved dates
- Before calculating critical path

**After Locking:**
- Dates are preserved in `baseline_start_date` and `baseline_end_date` fields
- Original planned dates can still be updated (through revision process)
- Variance is calculated automatically
- Blue info bars show baseline dates for reference

---

## Tips & Best Practices

### Planning Best Practices

#### 1. Start with High-Level Items
- Break project into major phases
- Add dependencies between phases
- Calculate critical path early
- Then add detailed tasks

#### 2. Realistic Duration Estimates
- Include buffer time for weather
- Account for material delivery delays
- Consider crew availability
- Add contingency (10-20% extra time)

#### 3. Logical Dependencies
- Use Finish-to-Start relationships (most common)
- Foundation finishes → Framing starts
- Don't over-constrain (too many dependencies)
- Keep it simple and logical

#### 4. Regular Critical Path Checks
- Recalculate after dependency changes
- Monitor critical tasks closely
- Focus resources on critical path
- Non-critical tasks can flex

#### 5. Baseline Timing
- Lock baseline after client approval
- Lock before work starts if possible
- Don't lock too early (dates still uncertain)
- Don't delay too long (baseline becomes irrelevant)

---

### Dependency Management Tips

#### Start with Major Dependencies Only
```
Phase-level dependencies:
✅ Site Prep → Foundation → Structure → MEP → Finishes

Avoid over-constraining:
❌ Every task depends on every previous task
```

#### Use Parallel Paths
```
✅ Foundation → Framing
             → Plumbing (can overlap)
             → Electrical (can overlap)
```

#### Common Dependency Patterns

**Sequential:**
```
Excavation → Foundation → Framing → Roofing
```

**Parallel:**
```
Framing → Electrical
       → Plumbing
       → HVAC
```

**Convergent:**
```
Rough Electrical ↘
Rough Plumbing → Drywall Installation
Rough HVAC     ↗
```

---

### Critical Path Management

#### Focus on Critical Tasks
- Assign best crews to critical tasks
- Monitor daily progress
- Address delays immediately
- Communicate status to stakeholders

#### Protect the Critical Path
- Add safety buffers to critical tasks
- Have contingency plans
- Order materials early
- Pre-qualify subcontractors

#### Accelerate When Needed
- Add crews to critical tasks
- Work overtime if delayed
- Use faster construction methods
- Don't add resources to non-critical tasks (waste)

---

### Variance Tracking

#### What Variance Tells You

**Positive Variance (+days):**
- Task took longer than planned
- Project delayed if on critical path
- Need to investigate cause

**Negative Variance (-days):**
- Task finished early
- Opportunity to start next task sooner
- Possibly over-estimated originally

**Zero Variance:**
- Task finished exactly on time
- Good planning accuracy

#### Using Variance Data

1. **Identify Patterns:**
   - Are estimates consistently off?
   - Which task types are problematic?
   - Which crews are most reliable?

2. **Improve Future Planning:**
   - Adjust estimates based on history
   - Build in appropriate buffers
   - Set realistic expectations

3. **Communicate Proactively:**
   - Show variance to stakeholders
   - Explain causes of delays
   - Demonstrate corrective actions

---

## Troubleshooting

### Issue: Cannot Select Project

**Symptoms:**
- Dropdown is empty
- No projects shown

**Solutions:**
1. ✅ Ensure at least one project exists in the database
2. ✅ Check that you're logged in as Planner role
3. ✅ Try refreshing the screen (pull down to refresh)
4. ✅ Restart the app

---

### Issue: Items Not Loading

**Symptoms:**
- Selected project but no items shown
- Shows "No Items Found"

**Solutions:**
1. ✅ Verify the project has items added
2. ✅ Check that items belong to sites under this project
3. ✅ Try selecting a different project
4. ✅ Check database integrity

---

### Issue: Cannot Edit Dates

**Symptoms:**
- Date pickers are greyed out
- Tapping dates does nothing

**Solutions:**
1. ✅ Check if baseline is locked (orange warning card)
2. ✅ If locked, use Schedule Update screen to make changes (Phase 6)
3. ✅ If not locked, ensure you have edit permissions

---

### Issue: Circular Dependency Error

**Symptoms:**
- Alert: "Circular dependency detected"
- Cannot save dependencies

**Solutions:**
1. ✅ Review dependency chain:
   - Item A depends on Item B
   - Item B depends on Item C
   - Item C depends on Item A (❌ circular!)
2. ✅ Remove one dependency to break the cycle
3. ✅ Rethink the logical order of tasks

**Example Fix:**
```
Before (circular):
A → B → C → A

After (fixed):
A → B → C
```

---

### Issue: Critical Path Calculation Fails

**Symptoms:**
- Button shows loading indefinitely
- Error message displayed

**Solutions:**
1. ✅ Ensure all items have valid dates
2. ✅ Check for missing dependencies
3. ✅ Verify no circular dependencies exist
4. ✅ Try with fewer items (test with simple project first)
5. ✅ Check console for error logs
6. ✅ Restart the app

---

### Issue: Baseline Lock Button Disabled

**Symptoms:**
- Button is greyed out
- Cannot click to lock

**Possible Reasons:**
1. **Already Locked:**
   - Button text: "Baseline Locked"
   - Orange warning card visible
   - This is normal - baseline is already locked

2. **No Items:**
   - Project has no items to lock
   - Add items first

3. **Permission Issue:**
   - Check user role and permissions

---

### Issue: Dates Don't Update After Edit

**Symptoms:**
- Changed date but card still shows old date
- Changes don't persist

**Solutions:**
1. ✅ Ensure date picker dialog was confirmed (not cancelled)
2. ✅ Check for error messages
3. ✅ Try again with different date
4. ✅ Reload the screen (navigate away and back)
5. ✅ Check database permissions
6. ✅ Restart the app

---

### Issue: Dependency Count Wrong

**Symptoms:**
- Shows "Dependencies: 0" but item has dependencies
- Count doesn't match selected items

**Solutions:**
1. ✅ Open Dependency Modal to verify
2. ✅ Save dependencies again
3. ✅ Reload the screen
4. ✅ Check database directly (dev tools)

---

### Issue: Performance is Slow

**Symptoms:**
- Loading takes > 2 seconds
- App feels laggy

**Solutions:**
1. ✅ Check number of items (>100 may be slow)
2. ✅ Close other apps
3. ✅ Restart the app
4. ✅ Clear app cache (if available)
5. ✅ Update to latest version

**Note:** Performance optimization is planned for Phase 7.

---

## Frequently Asked Questions (FAQ)

### Q: What happens to my baseline if I need to change dates?

**A:** After baseline is locked, you'll use the Schedule Update screen (Phase 6) to make controlled changes. This creates a revision record with:
- Reason for change
- Impact analysis
- Approval workflow
- Full audit trail

The original baseline dates are preserved for variance comparison.

---

### Q: Can I unlock a baseline after locking?

**A:** Not easily. Baseline locking is intentionally difficult to reverse to maintain data integrity. If you absolutely need to unlock:
1. Contact your system administrator
2. Database changes required
3. Revision history may be lost

**Better Approach:** Use Schedule Update screen to make controlled revisions.

---

### Q: How many dependencies can one item have?

**A:** Technically unlimited, but practically:
- **Recommended:** 1-5 dependencies per item
- **Maximum tested:** 20 dependencies
- **Performance:** May degrade with 50+ dependencies

**Best Practice:** Only add true prerequisites, not every prior task.

---

### Q: What's the difference between planned dates and baseline dates?

**A:**
- **Planned Dates:** Current working schedule (can change)
- **Baseline Dates:** Original locked schedule (frozen reference)

**Example:**
- Baseline: Jan 1-10 (locked)
- Planned: Jan 1-12 (revised due to rain delay)
- Variance: +2 days

---

### Q: Can I have multiple projects with locked baselines?

**A:** Yes! Each project has its own independent baseline. You can:
- Lock baseline for Project A
- Continue planning Project B
- Lock Project B's baseline later
- Each maintains separate baseline dates

---

### Q: Do I need to calculate critical path before locking baseline?

**A:** Not required, but **strongly recommended**:
- Identifies which tasks need most attention
- Helps optimize schedule before locking
- Reveals if project duration is reasonable
- Industry best practice

---

### Q: What if I don't set any dependencies?

**A:** The module still works:
- ✅ Can lock baseline
- ✅ Can track variance
- ❌ Cannot calculate critical path (needs dependencies)
- ❌ Cannot identify bottlenecks
- ❌ Missing schedule optimization benefits

**Recommendation:** Add at least major dependencies between phases.

---

### Q: Can supervisors see the baseline plan?

**A:** Yes! (Implementation dependent)
- Baseline data is in the database
- Available to all roles with appropriate permissions
- Supervisors can view planned vs. actual dates
- Helps field teams stay on schedule

---

## Glossary

**Baseline:** Original planned schedule locked for reference and variance comparison.

**Critical Path:** The sequence of tasks that determines the minimum project duration. Delays to critical path tasks delay the entire project.

**Dependency:** A relationship where one task must finish before another can start (Finish-to-Start).

**Duration:** The planned time to complete a task, calculated from start to end date.

**Float/Slack:** The amount of time a task can be delayed without affecting the project completion date. Critical path tasks have zero float.

**Kahn's Algorithm:** A graph algorithm used to calculate critical path by performing topological sort on task dependencies.

**Predecessor:** A task that must complete before another task (the successor) can start.

**Schedule Variance:** The difference between planned and actual dates, measured in days.

**Successor:** A task that depends on another task (the predecessor) to complete first.

**Topological Sort:** Ordering of tasks that respects all dependencies (predecessors before successors).

---

## Getting Help

### In-App Help
- Look for info icons (ⓘ) throughout the interface
- Info cards provide context-specific guidance
- Error messages suggest solutions

### Support Resources
- **User Guide:** This document
- **Testing Plan:** PLANNING_MODULE_TESTING_PLAN.md
- **Technical Documentation:** PLANNING_MODULE_IMPLEMENTATION_STATUS.md
- **Report Issues:** Contact your system administrator

---

## Appendix: Example Workflows

### Workflow A: Small Project (10 tasks, 2 weeks)

**Project:** Residential Renovation

1. **Setup** (5 minutes)
   - Create project: "Smith Home Renovation"
   - Add 10 items with planned dates

2. **Dependencies** (10 minutes)
   - Demo → Framing
   - Framing → Electrical, Plumbing, Drywall
   - Drywall → Painting
   - Painting → Flooring

3. **Analysis** (2 minutes)
   - Calculate critical path
   - Identify: Demo → Framing → Drywall → Painting → Flooring

4. **Baseline** (1 minute)
   - Review all dates
   - Lock baseline

**Total Time:** ~18 minutes

---

### Workflow B: Large Project (50 tasks, 6 months)

**Project:** Commercial Building

1. **Phase Planning** (30 minutes)
   - Create major phases as items
   - Set phase-level dependencies
   - Calculate critical path for phases

2. **Detailed Tasks** (2 hours)
   - Add detailed tasks under each phase
   - Set task-level dependencies
   - Recalculate critical path

3. **Review & Optimize** (1 hour)
   - Analyze critical path
   - Look for opportunities to parallelize
   - Adjust durations for realism
   - Add buffer to critical tasks

4. **Stakeholder Review** (ongoing)
   - Export schedule (future feature)
   - Present to client
   - Make adjustments

5. **Baseline Lock** (5 minutes)
   - Final review
   - Lock baseline
   - Communicate to team

**Total Time:** ~4 hours

---

**End of User Guide**

For technical questions or issues, contact your system administrator or refer to the testing plan and implementation documentation.
