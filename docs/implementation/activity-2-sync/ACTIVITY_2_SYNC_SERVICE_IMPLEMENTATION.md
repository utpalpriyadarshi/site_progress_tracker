# Activity 2: SyncService Implementation

**Phase:** Phase 1 - Critical Path
**Activity Duration:** 6 weeks (30 working days)
**Priority:** 🔴 CRITICAL - Production Blocker
**Prerequisites:** Activity 1 (Security Implementation) must be complete
**Depends On:** JWT authentication system
**Blocks:** Production deployment (app is offline-only without this)

---

## 📋 Overview

### Current State (Gap Analysis Reference: Lines 130-149)

**Critical Problem:**
- ❌ App is **offline-only**, not **offline-first**
- ❌ Database has `sync_status` fields in progress_logs, hindrances, daily_reports
- ❌ `SyncService.ts` exists but is a stub
- ❌ No backend API integration
- ❌ Data **never syncs** to server

**Impact:** Cannot deploy to production - data trapped on device, no cross-device sync, no backup

### Target State

**After Activity 2 Completion:**
- ✅ App is **offline-first** (works offline, syncs when online)
- ✅ Backend API deployed and operational
- ✅ Bidirectional sync logic functional
- ✅ Conflict resolution system in place
- ✅ Queue management with retry logic
- ✅ Data syncs to server automatically
- ✅ Multiple devices can sync same project

---

## 🎯 Objectives

1. **Backend API Development**
   - Build REST API with Express.js + Sequelize + PostgreSQL
   - Implement endpoints for all syncable models
   - Add JWT authentication middleware
   - Deploy to production server

2. **Bidirectional Sync Logic**
   - Client → Server (push local changes)
   - Server → Client (pull remote changes)
   - Incremental sync (only changed records)
   - Full sync (initial or after long offline)

3. **Conflict Resolution**
   - Detect conflicts (same record edited on multiple devices)
   - Implement Last-Write-Wins (LWW) strategy
   - Use Kahn's algorithm for dependency-aware conflict resolution
   - Preserve data integrity (no orphaned records)

4. **Queue Management & Retry Logic**
   - Queue local changes while offline
   - Retry failed sync attempts
   - Exponential backoff for network errors
   - Sync status tracking (pending, syncing, synced, failed)

---

## 📊 Gap Analysis Alignment

**Reference:** `PROJECT_GAP_ANALYSIS_AND_ROADMAP.md` Section "1. SyncService NOT Implemented" (Lines 130-149)

**Gap Analysis Estimates:**
- Effort: 4-6 weeks ✅
- Tasks identified: 5 tasks ✅
- Priority: CRITICAL ✅

**This Activity Addresses:**
- Backend API development (2 weeks) → Week 1-2
- Bidirectional sync logic (1 week) → Week 3
- Conflict resolution (1 week) → Week 4
- Queue management & retry logic (1 week) → Week 5
- Testing & validation (1 week) → Week 6

---

## 🗓️ Week-by-Week Implementation Plan

### **Week 1-2: Backend API Development**

#### Week 1, Days 1-3: Backend Setup & Infrastructure
**Tasks:**
- [ ] Initialize Node.js backend project
- [ ] Install dependencies: express, sequelize, pg, jsonwebtoken, bcrypt
- [ ] Set up PostgreSQL database (local + production)
- [ ] Configure Sequelize models (match WatermelonDB schema)
- [ ] Set up JWT authentication middleware
- [ ] Create database migrations
- [ ] Deploy to production server (Heroku, DigitalOcean, or AWS)

**Deliverables:**
- Backend repo: `construction-tracker-api/`
- Sequelize models for all syncable tables
- Database migrations
- Production deployment

**Backend Tech Stack:**
```
Runtime:       Node.js v18+
Framework:     Express.js
ORM:           Sequelize
Database:      PostgreSQL 14+
Auth:          JWT (from Activity 1)
Deployment:    Heroku / DigitalOcean / AWS
```

**Sequelize Models to Create:**
```
models/
├── Project.js
├── Site.js
├── Category.js
├── Item.js
├── WBSItem.js
├── ProgressLog.js
├── Hindrance.js
├── DailyReport.js
├── Material.js
├── User.js
└── Session.js
```

**Acceptance Criteria:**
- Backend server running locally
- PostgreSQL database created
- Sequelize models match WatermelonDB schema
- Database migrations work
- Production deployment accessible

---

#### Week 1, Days 4-5: Core API Endpoints (Projects & Sites)
**Tasks:**
- [ ] Create CRUD endpoints for `projects`
- [ ] Create CRUD endpoints for `sites`
- [ ] Add JWT authentication to all endpoints
- [ ] Add pagination support
- [ ] Add filtering by `updated_at` for incremental sync
- [ ] Write API tests

**API Endpoints:**
```
POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/auth/logout

GET    /api/projects
GET    /api/projects/:id
POST   /api/projects
PUT    /api/projects/:id
DELETE /api/projects/:id

GET    /api/sites
GET    /api/sites/:id
POST   /api/sites
PUT    /api/sites/:id
DELETE /api/sites/:id
GET    /api/sites?project_id=:id
GET    /api/sites?updated_after=:timestamp
```

**Authentication:**
- All endpoints require `Authorization: Bearer <access_token>`
- Token validation via middleware
- Extract user from token payload

**Acceptance Criteria:**
- All CRUD operations work
- JWT authentication enforced
- Pagination works (limit, offset)
- Filtering by `updated_at` works
- API tests passing (Postman/Jest)

---

#### Week 2, Days 6-8: Syncable Entity Endpoints
**Tasks:**
- [ ] Create CRUD endpoints for `categories`
- [ ] Create CRUD endpoints for `items`
- [ ] Create CRUD endpoints for `wbs_items`
- [ ] Create CRUD endpoints for `progress_logs`
- [ ] Create CRUD endpoints for `hindrances`
- [ ] Create CRUD endpoints for `daily_reports`
- [ ] Create CRUD endpoints for `materials`
- [ ] Add cascade delete logic (match WatermelonDB)

**Additional Endpoints:**
```
GET    /api/categories
POST   /api/categories
PUT    /api/categories/:id
DELETE /api/categories/:id

GET    /api/items?site_id=:id
POST   /api/items
PUT    /api/items/:id
DELETE /api/items/:id

GET    /api/wbs_items?site_id=:id
POST   /api/wbs_items
PUT    /api/wbs_items/:id
DELETE /api/wbs_items/:id

GET    /api/progress_logs?item_id=:id
POST   /api/progress_logs
PUT    /api/progress_logs/:id

GET    /api/hindrances?site_id=:id
POST   /api/hindrances
PUT    /api/hindrances/:id

GET    /api/daily_reports?site_id=:id
POST   /api/daily_reports
PUT    /api/daily_reports/:id

GET    /api/materials?item_id=:id
POST   /api/materials
PUT    /api/materials/:id
```

**Cascade Delete Logic:**
```
DELETE Project → Delete Sites, WBS Items
DELETE Site → Delete Items, Hindrances, Daily Reports
DELETE Item → Delete Progress Logs, Materials, Hindrances
DELETE Category → Set items.category_id = NULL
```

**Acceptance Criteria:**
- All CRUD endpoints functional
- Cascade delete matches WatermelonDB behavior
- Foreign key constraints enforced
- API tests passing

---

#### Week 2, Days 9-10: Sync Endpoints
**Tasks:**
- [ ] Create bulk sync endpoints (push/pull)
- [ ] Implement incremental sync (by `updated_at`)
- [ ] Implement full sync (initial sync)
- [ ] Add sync transaction support (all-or-nothing)
- [ ] Add sync conflict detection
- [ ] Write sync endpoint tests

**Sync Endpoints:**
```
POST   /api/sync/push
  Body: { changes: [{ table, id, action, data }], last_sync_at }
  Response: { success, conflicts, server_timestamp }

POST   /api/sync/pull
  Body: { last_sync_at, tables: ['projects', 'sites', ...] }
  Response: { changes: [...], server_timestamp }

GET    /api/sync/status
  Response: { last_sync_at, pending_changes_count }
```

**Push Logic:**
```typescript
// Client sends local changes since last sync
{
  changes: [
    { table: 'items', id: 'item-1', action: 'update', data: {...} },
    { table: 'progress_logs', id: 'log-1', action: 'create', data: {...} },
    { table: 'sites', id: 'site-1', action: 'delete', data: null }
  ],
  last_sync_at: 1698765432000
}

// Server applies changes and returns conflicts
{
  success: true,
  conflicts: [
    { table: 'items', id: 'item-1', client_version: 5, server_version: 7 }
  ],
  server_timestamp: 1698765450000
}
```

**Pull Logic:**
```typescript
// Client requests changes since last sync
{
  last_sync_at: 1698765432000,
  tables: ['projects', 'sites', 'items', 'progress_logs']
}

// Server returns all changes since timestamp
{
  changes: [
    { table: 'items', id: 'item-2', action: 'update', data: {...}, updated_at: 1698765440000 },
    { table: 'sites', id: 'site-3', action: 'create', data: {...}, updated_at: 1698765445000 }
  ],
  server_timestamp: 1698765450000
}
```

**Acceptance Criteria:**
- Push endpoint accepts bulk changes
- Pull endpoint returns incremental changes
- Conflicts detected and reported
- Sync transactions are atomic
- API tests passing

---

### **Week 3: Bidirectional Sync Logic (Client-Side)**

#### Days 11-13: Push Logic Implementation
**Tasks:**
- [ ] Update `SyncService.ts` (currently a stub)
- [ ] Implement `SyncService.pushChanges()`
- [ ] Track local changes in `sync_queue` table
- [ ] Send changes to `/api/sync/push`
- [ ] Handle push success/failure
- [ ] Update `sync_status` fields
- [ ] Test push with various change types

**Sync Queue Table:**
```typescript
sync_queue {
  id: string
  table_name: string
  record_id: string
  action: 'create' | 'update' | 'delete'
  data: string (JSON)
  created_at: number
  synced_at: number (nullable)
  retry_count: number
  last_error: string (nullable)
}
```

**Schema Update:**
- Create migration: `v17_add_sync_queue_table.ts`
- Create model: `models/SyncQueueModel.ts`

**Push Algorithm:**
```typescript
1. Query sync_queue WHERE synced_at IS NULL
2. Group by table_name (maintain dependencies)
3. For each group:
   a. Send to /api/sync/push
   b. If success:
      - Update sync_queue.synced_at
      - Update record.sync_status = 'synced'
   c. If failure:
      - Increment retry_count
      - Store error in last_error
      - Schedule retry with exponential backoff
```

**Deliverables:**
- Updated: `services/sync/SyncService.ts`
- New model: `models/SyncQueueModel.ts`
- Migration: `migrations/v17_add_sync_queue_table.ts`

**Acceptance Criteria:**
- Local changes added to sync_queue
- Push sends changes to backend
- Success updates sync_status to 'synced'
- Failures increment retry_count
- Exponential backoff working

---

#### Days 14-15: Pull Logic Implementation
**Tasks:**
- [ ] Implement `SyncService.pullChanges()`
- [ ] Request changes from `/api/sync/pull`
- [ ] Apply remote changes to local database
- [ ] Handle create/update/delete actions
- [ ] Update local `last_sync_at` timestamp
- [ ] Test pull with various change types

**Pull Algorithm:**
```typescript
1. Get last_sync_at from AsyncStorage
2. Send request to /api/sync/pull with last_sync_at
3. Receive changes from server
4. For each change:
   a. If action = 'create': insert record
   b. If action = 'update': update record
   c. If action = 'delete': delete record
5. Update last_sync_at to server_timestamp
6. Store in AsyncStorage
```

**Deliverables:**
- Updated: `services/sync/SyncService.ts`
- Pull logic implemented

**Acceptance Criteria:**
- Pull requests changes since last sync
- Remote changes applied to local database
- Create/update/delete actions work
- last_sync_at updated correctly
- Pull works with empty changes (no-op)

---

### **Week 4: Conflict Resolution**

#### Days 16-18: Conflict Detection & LWW Strategy
**Tasks:**
- [ ] Implement conflict detection
- [ ] Implement Last-Write-Wins (LWW) strategy
- [ ] Add version field to all syncable models
- [ ] Update schema to include `_version` field
- [ ] Test conflict scenarios

**Version Field:**
```typescript
// Add to all syncable models
@field('_version') version!: number;
```

**Schema Update:**
- Migration: `v18_add_version_fields.ts`
- Add `_version` to: projects, sites, items, wbs_items, progress_logs, hindrances, daily_reports, materials

**Conflict Detection:**
```typescript
// Conflict occurs when:
client_version !== server_version

// Example:
Client updates item-1: version 5 → 6
Server has item-1: version 7 (updated by another device)
Conflict detected!
```

**Last-Write-Wins (LWW) Strategy:**
```typescript
if (conflict_detected) {
  if (client_updated_at > server_updated_at) {
    // Client wins - overwrite server
    applyClientChange()
  } else {
    // Server wins - discard client change, apply server change
    applyServerChange()
    notifyUser("Your changes were overwritten by newer data")
  }
}
```

**Deliverables:**
- Migration: `migrations/v18_add_version_fields.ts`
- Updated: `services/sync/SyncService.ts` (conflict detection)
- Conflict resolution logic

**Acceptance Criteria:**
- Version field added to all syncable models
- Conflicts detected correctly
- LWW strategy applies server changes when server is newer
- LWW strategy applies client changes when client is newer
- User notified of overwritten changes

---

#### Days 19-20: Dependency-Aware Conflict Resolution (Kahn's Algorithm)
**Tasks:**
- [ ] Implement Kahn's algorithm for topological sort
- [ ] Define dependency graph for models
- [ ] Apply changes in dependency order
- [ ] Handle orphaned records (cascade delete)
- [ ] Test complex conflict scenarios

**Dependency Graph:**
```
Project
  ↓
Site
  ↓
├── Item → ProgressLog, Material, Hindrance
└── WBSItem
```

**Kahn's Algorithm:**
```typescript
// Apply changes in topological order to maintain referential integrity

1. Build dependency graph
2. Find nodes with no dependencies (e.g., Projects)
3. Apply changes to those nodes
4. Remove from graph
5. Repeat until graph is empty
```

**Example Scenario:**
```
Changes from server:
- Delete Site (id: site-1)
- Update Item (id: item-1, site_id: site-1)

Without Kahn's:
1. Delete Site → Item becomes orphaned ❌

With Kahn's:
1. Delete Item first (dependent)
2. Then delete Site (parent) ✅
```

**Deliverables:**
- Kahn's algorithm implementation: `services/sync/DependencyResolver.ts`
- Updated sync logic to use topological sort

**Acceptance Criteria:**
- Changes applied in correct order
- No orphaned records
- Cascade deletes work correctly
- Complex scenarios pass (nested deletes)

---

### **Week 5: Queue Management & Retry Logic**

#### Days 21-23: Sync Queue Management
**Tasks:**
- [ ] Implement retry logic with exponential backoff
- [ ] Add max retry limit (3 attempts)
- [ ] Implement dead letter queue for failed syncs
- [ ] Add sync queue cleanup (delete synced records older than 30 days)
- [ ] Add manual retry option for failed syncs
- [ ] Create sync monitoring UI (Admin screen)

**Exponential Backoff:**
```typescript
retry_delay = base_delay * (2 ^ retry_count)

retry_count = 0: retry in 5 seconds
retry_count = 1: retry in 10 seconds
retry_count = 2: retry in 20 seconds
retry_count = 3: move to dead letter queue (manual intervention)
```

**Dead Letter Queue:**
```typescript
dead_letter_queue {
  id: string
  table_name: string
  record_id: string
  action: string
  data: string (JSON)
  error: string
  retry_count: number
  created_at: number
}
```

**Sync Monitoring UI:**
- Screen: `src/admin/SyncMonitoringScreen.tsx`
- Shows sync queue status
- Shows dead letter queue
- Allows manual retry
- Shows last sync timestamp

**Deliverables:**
- Updated: `services/sync/SyncService.ts` (retry logic)
- New model: `models/DeadLetterQueueModel.ts`
- Migration: `v19_add_dead_letter_queue_table.ts`
- New screen: `src/admin/SyncMonitoringScreen.tsx`

**Acceptance Criteria:**
- Retry logic works with exponential backoff
- Max retries enforced (3 attempts)
- Failed syncs move to dead letter queue
- Sync queue cleaned up (old records deleted)
- Admin can manually retry failed syncs
- Sync monitoring UI shows real-time status

---

#### Days 24-25: Network Status & Auto-Sync
**Tasks:**
- [ ] Integrate `@react-native-community/netinfo`
- [ ] Auto-sync when network becomes available
- [ ] Auto-sync on app launch (if online)
- [ ] Auto-sync every 5 minutes (if online)
- [ ] Show sync indicator in UI
- [ ] Add manual sync button

**Network Monitoring:**
```typescript
// Listen for network status changes
NetInfo.addEventListener(state => {
  if (state.isConnected && state.isInternetReachable) {
    SyncService.syncNow()
  }
})
```

**Auto-Sync Triggers:**
1. App launch (if online)
2. Network becomes available (offline → online)
3. Every 5 minutes (background interval)
4. Manual sync button pressed

**Sync Indicator UI:**
- Snackbar: "Syncing..." (while syncing)
- Snackbar: "Sync complete" (on success)
- Snackbar: "Sync failed - retrying" (on failure)
- Icon in header: Cloud icon with sync status

**Deliverables:**
- Updated: `services/sync/SyncService.ts` (network monitoring)
- Sync indicator component: `src/components/SyncIndicator.tsx`
- Manual sync button in navigation header

**Acceptance Criteria:**
- Auto-sync on app launch works
- Auto-sync on network change works
- Auto-sync every 5 minutes works
- Sync indicator shows current status
- Manual sync button triggers sync
- No sync attempts when offline

---

### **Week 6: Testing & Validation**

#### Days 26-28: Comprehensive Testing
**Tasks:**
- [ ] Write unit tests for SyncService
- [ ] Write integration tests for sync flow
- [ ] Write API tests for all endpoints
- [ ] Test offline → online scenarios
- [ ] Test multi-device sync scenarios
- [ ] Test conflict resolution scenarios
- [ ] Test network error handling
- [ ] Performance testing (large datasets)

**Test Suites:**

**1. SyncService Unit Tests**
```typescript
✓ Push changes to server
✓ Pull changes from server
✓ Detect conflicts
✓ Apply LWW conflict resolution
✓ Apply changes in dependency order
✓ Retry failed syncs with exponential backoff
✓ Move to dead letter queue after max retries
✓ Clean up old sync queue records
```

**2. Integration Tests**
```typescript
✓ Create item offline → go online → sync to server
✓ Update item on Device A → sync to Device B
✓ Delete item on Device A → sync to Device B (item deleted)
✓ Update same item on Device A and B → conflict resolved
✓ Cascade delete: delete site → items deleted
✓ Network error during sync → retry → success
✓ Network error 3 times → move to dead letter queue
```

**3. API Tests (Postman/Jest)**
```typescript
✓ All CRUD endpoints return correct data
✓ Authentication required for all endpoints
✓ Pagination works correctly
✓ Filtering by updated_at works
✓ Sync push endpoint accepts bulk changes
✓ Sync pull endpoint returns incremental changes
✓ Conflict detection works
```

**4. Multi-Device Scenarios**
```typescript
Test Setup: 2 devices (Device A, Device B)

Scenario 1: Simple sync
1. Device A creates item
2. Device A syncs
3. Device B syncs
4. Device B sees new item ✓

Scenario 2: Conflict (LWW)
1. Device A updates item-1 to "Version A" at 10:00
2. Device B updates item-1 to "Version B" at 10:05
3. Both devices sync
4. Both devices have "Version B" (LWW) ✓

Scenario 3: Cascade delete
1. Device A deletes site-1
2. Device A syncs
3. Device B syncs
4. Device B: site-1 deleted, all items deleted ✓
```

**Acceptance Criteria:**
- All unit tests passing (coverage > 80%)
- All integration tests passing
- All API tests passing
- Multi-device scenarios work
- Performance acceptable (sync 1000 records < 30 seconds)

---

#### Days 29-30: Documentation & Production Deployment
**Tasks:**
- [ ] Write sync architecture documentation
- [ ] Document API endpoints (OpenAPI/Swagger)
- [ ] Update ARCHITECTURE_UNIFIED.md
- [ ] Create sync troubleshooting guide
- [ ] Deploy backend to production
- [ ] Configure production database
- [ ] Set up monitoring (logs, metrics)
- [ ] Final production readiness review

**Deliverables:**
- Documentation: `docs/sync/SYNC_ARCHITECTURE.md`
- API docs: `docs/api/API_DOCUMENTATION.md` (Swagger)
- Updated: `ARCHITECTURE_UNIFIED.md`
- Troubleshooting: `docs/sync/SYNC_TROUBLESHOOTING.md`
- Production deployment complete

**Production Checklist:**
- [ ] Backend deployed and accessible
- [ ] PostgreSQL database configured
- [ ] Environment variables set (JWT secrets, DB connection)
- [ ] HTTPS enabled
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] Logging configured (Winston/Morgan)
- [ ] Monitoring configured (PM2/New Relic)
- [ ] Backup strategy in place

**Acceptance Criteria:**
- Backend accessible at production URL
- Sync works in production environment
- Documentation complete
- Production monitoring operational

---

## 🧪 Testing Strategy

### Unit Tests
**Target Coverage: 80%+**

**Files to Test:**
- `services/sync/SyncService.ts`
- `services/sync/DependencyResolver.ts`
- `services/sync/ConflictResolver.ts`
- Backend: All API controllers

**Test Cases:** See Days 26-28 above

---

### Integration Tests
**Complete User Flows**

**Test Scenarios:**
1. Create record offline → sync → verify on server
2. Update record offline → sync → verify on server
3. Delete record offline → sync → verify on server
4. Pull changes from server → verify on device
5. Conflict resolution → verify LWW works
6. Network error → retry → success
7. Max retries → dead letter queue

---

### Performance Tests

**Test Data:**
- 1000 items
- 100 sites
- 5000 progress logs

**Performance Targets:**
- Initial sync (full): < 60 seconds
- Incremental sync (100 changes): < 10 seconds
- Conflict resolution (10 conflicts): < 5 seconds

---

## 📦 Deliverables Checklist

### Backend Deliverables
- [ ] Backend repo: `construction-tracker-api/`
- [ ] Sequelize models (10 models)
- [ ] API endpoints (30+ endpoints)
- [ ] Sync endpoints (/push, /pull)
- [ ] JWT authentication middleware
- [ ] Database migrations
- [ ] API tests
- [ ] Production deployment

### Client Deliverables
- [ ] Updated: `services/sync/SyncService.ts`
- [ ] New: `services/sync/DependencyResolver.ts`
- [ ] New: `services/sync/ConflictResolver.ts`
- [ ] New model: `models/SyncQueueModel.ts`
- [ ] New model: `models/DeadLetterQueueModel.ts`
- [ ] New screen: `src/admin/SyncMonitoringScreen.tsx`
- [ ] New component: `src/components/SyncIndicator.tsx`
- [ ] Schema migrations: v17, v18, v19

### Documentation Deliverables
- [ ] `docs/sync/SYNC_ARCHITECTURE.md`
- [ ] `docs/api/API_DOCUMENTATION.md`
- [ ] `docs/sync/SYNC_TROUBLESHOOTING.md`
- [ ] Updated `ARCHITECTURE_UNIFIED.md`

### Testing Deliverables
- [ ] Unit tests (80%+ coverage)
- [ ] Integration tests
- [ ] API tests
- [ ] Performance tests

---

## 🚨 Risk Management

### Risk 1: Backend Development Complexity
**Probability:** Medium
**Impact:** High
**Mitigation:**
- Use familiar stack (Express + Sequelize)
- Start with simple CRUD, add complexity later
- Consider BaaS (Supabase/Firebase) if falling behind

**Contingency:**
- Use Supabase (PostgreSQL + auto-generated API)
- Saves 1-2 weeks of backend development
- Trade-off: less control, vendor lock-in

---

### Risk 2: Conflict Resolution Edge Cases
**Probability:** High
**Impact:** Medium
**Mitigation:**
- Start with simple LWW strategy
- Kahn's algorithm for dependencies
- Extensive testing of edge cases

**Contingency:**
- If Kahn's is too complex, use simpler approach:
  - Always delete dependents before parents
  - Manual conflict resolution UI for complex cases

---

### Risk 3: Sync Performance with Large Datasets
**Probability:** Medium
**Impact:** Medium
**Mitigation:**
- Use incremental sync (only changed records)
- Batch changes (100 at a time)
- Background sync (don't block UI)

**Contingency:**
- Add pagination to sync endpoints
- Implement delta sync (only send changed fields)
- Add progress indicator for long syncs

---

### Risk 4: Network Reliability
**Probability:** High (construction sites often have poor connectivity)
**Impact:** Medium
**Mitigation:**
- Robust retry logic with exponential backoff
- Queue all changes locally
- Manual sync button for user control
- Clear sync status indicators

**Contingency:**
- Increase max retries to 5
- Add "sync manually" option in dead letter queue
- Allow exporting/importing data manually (JSON)

---

## 🎯 Acceptance Criteria

### Activity 2 is complete when:

#### Backend Requirements
- [ ] Backend API deployed to production
- [ ] All CRUD endpoints functional
- [ ] Sync endpoints (/push, /pull) functional
- [ ] JWT authentication enforced
- [ ] Cascade delete logic implemented
- [ ] API tests passing

#### Sync Requirements
- [ ] Push local changes to server
- [ ] Pull remote changes from server
- [ ] Incremental sync works (only changed records)
- [ ] Full sync works (initial sync)
- [ ] Conflict detection works
- [ ] LWW conflict resolution works
- [ ] Dependency-aware sync (Kahn's algorithm)
- [ ] No orphaned records after sync

#### Queue Requirements
- [ ] Local changes queued while offline
- [ ] Retry logic with exponential backoff
- [ ] Max retries enforced (3 attempts)
- [ ] Dead letter queue for failed syncs
- [ ] Sync queue cleanup (delete old records)
- [ ] Manual retry option

#### UX Requirements
- [ ] Auto-sync on app launch
- [ ] Auto-sync on network change
- [ ] Auto-sync every 5 minutes
- [ ] Sync indicator in UI
- [ ] Manual sync button
- [ ] Sync monitoring screen (Admin)

#### Testing Requirements
- [ ] Unit test coverage > 80%
- [ ] Integration tests passing
- [ ] API tests passing
- [ ] Multi-device scenarios tested
- [ ] Performance acceptable (1000 records < 30s)

#### Documentation Requirements
- [ ] Sync architecture documented
- [ ] API documented (Swagger)
- [ ] Troubleshooting guide created
- [ ] Architecture docs updated

---

## 📞 Stakeholder Sign-Off

**Activity Owner:** [Name]
**Reviewer:** [Name]
**Backend Developer:** [Name]
**Approved By:** [Name]
**Approval Date:** [Date]

---

## 🔄 Dependencies for Next Activity

**Activity 3: Manager Role Completion**

Activity 3 **can start in parallel** with Activity 2 if you have multiple developers.

**No hard dependencies** because:
- Manager screens can be built with local-only data first
- Sync can be added to Manager screens after Activity 2 completes
- Testing Manager screens can happen offline

**Recommended Approach:**
- If 1 developer: Complete Activity 2 first, then start Activity 3
- If 2+ developers: Start Activity 3 in Week 3 while Activity 2 is ongoing

---

## 📚 Reference Documents

- `PROJECT_GAP_ANALYSIS_AND_ROADMAP.md` - Gap Analysis (Lines 130-149)
- `PHASE_1_MASTER_PLAN.md` - Overall Phase 1 plan
- `ACTIVITY_1_SECURITY_IMPLEMENTATION.md` - JWT auth (prerequisite)
- `ARCHITECTURE_UNIFIED.md` - Current architecture
- `DATABASE.md` - Database schema reference

---

**Document Status:** ✅ READY FOR IMPLEMENTATION
**Created:** October 26, 2025
**Estimated Start:** [Date] (after Activity 1 complete)
**Estimated Completion:** [Date + 6 weeks]
**Owner:** Development Team

---

**END OF ACTIVITY 2: SYNCSERVICE IMPLEMENTATION**
