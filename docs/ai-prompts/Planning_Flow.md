You are Claude Code acting as a senior staff engineer and technical writer.

GOAL:
Reconstruct the COMPLETE action flow for the Planning user role AND update project documentation accordingly.

The Planning role has multiple tabs forming a logical workflow, but the action flow has been lost over time.

Your task is to:
1) Reconstruct the Planning workflow accurately from code and docs
2) Produce clear, authoritative Markdown documentation
3) Update README.md and ARCHITECTURE_UNIFIED.md with the recovered flow

SCOPE:
Focus ONLY on the Planning role:
- src/planning/
- Planning navigator
- Related hooks, services, models, and database tables
- Existing README.md and ARCHITECTURE_UNIFIED.md

PLANNING TABS (LOGICAL ORDER):
1. DashboardScreen
2. Key Dates Screen
3. Schedule Screen
4. Gantt Screen
5. inside Drawer
    -Resource
    -SiteManagementScreen
    -WBSManagementScreen
    -Create Item
    -MilestoneTrackingScreen
    -BaselineScreen

--------------------------------------------------
PART 1: DETAILED TAB-LEVEL ACTION FLOW
--------------------------------------------------

For EACH tab, produce a Markdown section with the following structure:

### <Tab Name>

#### Purpose
- Why this tab exists
- What planning responsibility it covers

#### User Actions
- All actions a planner can perform
- Mandatory vs optional actions

#### Action Sequence
- Step-by-step flow in correct order
- Explicit prerequisites
- Blocking vs non-blocking steps

#### Data Flow
- Database tables READ
- Database tables WRITTEN
- Key foreign keys and status fields
- Dependencies on data from previous tabs

#### Offline-First Behavior
- Local database writes
- appSyncStatus transitions
- sync_queue usage
- Behavior on reconnection

#### Navigation & Dependencies
- Previous and next tabs
- Hard dependencies (must exist)
- Soft dependencies (recommended)

#### Failure Modes & Edge Cases
- Empty states
- Partial planning data
- Sync conflicts or invalid state transitions
- How the UI should respond

If any behavior cannot be confidently inferred:
- Explicitly mark it as **UNCERTAIN**
- Do NOT invent behavior

--------------------------------------------------
PART 2: GLOBAL PLANNING WORKFLOW
--------------------------------------------------

Create a Markdown section:

## Planning Workflow Overview

Include:
- Ideal end-to-end planning sequence
- Which steps are irreversible
- Which steps are safe to revisit
- Where planners commonly break the flow
- Design intent vs actual enforcement (if mismatched)

--------------------------------------------------
PART 3: FLOW DIAGRAM (MARKDOWN)
--------------------------------------------------

Produce a Mermaid-compatible flowchart:

- Show all Planning tabs
- Include decision points and dependencies
- Indicate data prerequisites
- Mark optional vs required paths

The diagram MUST be valid Mermaid syntax and renderable in Markdown.

--------------------------------------------------
PART 4: README.md UPDATE
--------------------------------------------------

Produce a FULL Markdown section intended to be pasted into README.md:

### Planning Module Overview

Include:
- Purpose of the Planning role
- Ordered list of tabs with short descriptions
- High-level workflow summary
- Link references (logical, not URLs)

Do NOT rewrite unrelated README sections.

--------------------------------------------------
PART 5: ARCHITECTURE_UNIFIED.md UPDATE
--------------------------------------------------

Produce a FULL Markdown section intended to be pasted into ARCHITECTURE_UNIFIED.md:

### Planning Module Architecture

Include:
- Role responsibility boundaries
- Interaction with Database, SyncService, and other roles
- Data ownership rules
- Offline-first guarantees
- Architectural invariants (what must never be violated)

--------------------------------------------------
OUTPUT RULES (STRICT):
- Output MUST be valid Markdown
- Use clear headings and bullet points
- No emojis
- No code changes
- No speculation
- Prefer correctness over completeness
- Do NOT summarize — document as source-of-truth
- Assume WatermelonDB and SyncService patterns apply
- Use snake_case for DB columns, camelCase for model properties

FINAL NOTE:
You are producing documentation that future developers will rely on as authoritative.
