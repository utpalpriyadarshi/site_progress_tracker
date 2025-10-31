# Sync System Architecture

**Document Version:** 1.0
**Last Updated:** October 31, 2025
**Activity:** Activity 2 - SyncService Implementation
**Status:** ✅ Complete (Week 9 Documentation)

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Core Components](#core-components)
4. [Sync Flow](#sync-flow)
5. [Conflict Resolution](#conflict-resolution)
6. [Queue Management](#queue-management)
7. [Network Monitoring](#network-monitoring)
8. [Auto-Sync System](#auto-sync-system)
9. [Error Handling](#error-handling)
10. [Data Models](#data-models)
11. [API Integration](#api-integration)
12. [Security](#security)
13. [Performance](#performance)

---

## Overview

### Purpose

The Construction Site Progress Tracker implements an **offline-first** synchronization system that enables:

- ✅ **Offline operation** - Full app functionality without network
- ✅ **Bidirectional sync** - Push local changes, pull remote changes
- ✅ **Conflict resolution** - Automatic resolution using Last-Write-Wins
- ✅ **Queue management** - Reliable delivery with retry logic
- ✅ **Auto-sync** - Automatic synchronization with multiple triggers

### Key Design Principles

1. **Offline-First**: App works fully offline, syncs when online
2. **Local Authority**: Local database is source of truth during offline
3. **Eventual Consistency**: Data converges across devices over time
4. **Automatic Conflict Resolution**: No user intervention needed
5. **Resilient**: Handles network errors, retries, and failures gracefully

### Technology Stack

```
Mobile App (React Native)
├── WatermelonDB (SQLite) - Local database
├── AsyncStorage - Persistent storage for sync state
├── NetInfo - Network state monitoring
└── JWT Authentication - Secure API access

Backend API (Node.js)
├── Express.js - REST API framework
├── Sequelize - ORM for PostgreSQL
├── PostgreSQL - Server database
└── JWT - Token-based authentication
```

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Mobile App (Offline-First)              │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ User Actions │  │ App Triggers │  │ Network      │      │
│  │ (CRUD Ops)   │  │ (Launch/etc) │  │ Monitoring   │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │               │
│         ▼                  ▼                  ▼               │
│  ┌─────────────────────────────────────────────────┐        │
│  │           WatermelonDB (Local SQLite)           │        │
│  │  - Projects, Sites, Items, Progress Logs, etc.  │        │
│  │  - sync_status field: pending/synced/failed     │        │
│  │  - _version field: for conflict detection       │        │
│  └─────────────┬───────────────────────────────────┘        │
│                │                                              │
│                ▼                                              │
│  ┌─────────────────────────────────────────────────┐        │
│  │              SyncService                         │        │
│  │  - syncUp(): Push local changes to server        │        │
│  │  - syncDown(): Pull remote changes from server   │        │
│  │  - Conflict resolution (LWW strategy)            │        │
│  │  - Queue management                              │        │
│  └─────────────┬───────────────────────────────────┘        │
│                │                                              │
│                ▼                                              │
│  ┌─────────────────────────────────────────────────┐        │
│  │         AutoSyncManager + NetworkMonitor         │        │
│  │  - Auto-sync on app launch                       │        │
│  │  - Auto-sync on network change                   │        │
│  │  - Periodic sync (every 5 minutes)               │        │
│  │  - App foreground sync                           │        │
│  └─────────────┬───────────────────────────────────┘        │
│                │                                              │
└────────────────┼──────────────────────────────────────────────┘
                 │ HTTPS + JWT
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend API (Node.js)                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────┐       │
│  │          JWT Authentication Middleware           │       │
│  └──────────────────┬───────────────────────────────┘       │
│                     │                                         │
│                     ▼                                         │
│  ┌──────────────────────────────────────────────────┐       │
│  │              Sync Endpoints                       │       │
│  │  POST /api/sync/push  - Receive client changes   │       │
│  │  GET  /api/sync/pull  - Send server changes      │       │
│  │  GET  /api/sync/status - Sync status info        │       │
│  └──────────────────┬───────────────────────────────┘       │
│                     │                                         │
│                     ▼                                         │
│  ┌──────────────────────────────────────────────────┐       │
│  │        Sequelize ORM + PostgreSQL                │       │
│  │  - Version tracking (_version auto-increment)    │       │
│  │  - Sync status tracking                          │       │
│  │  - Foreign key relationships                     │       │
│  └──────────────────────────────────────────────────┘       │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Core Components

### 1. SyncService (`services/sync/SyncService.ts`)

**Purpose:** Core synchronization engine

**Lines of Code:** 1,132 lines

**Key Methods:**

```typescript
// Main sync operations
static async syncNow(): Promise<SyncResult>
static async syncUp(): Promise<SyncResult>
static async syncDown(): Promise<SyncResult>

// Queue management
static async getSyncQueue(): Promise<any[]>
static async clearSyncQueue(): Promise<void>
static async getSyncStatus(): Promise<any>

// Retry logic (Week 8)
static async retryWithBackoff(fn: Function, maxRetries: number): Promise<any>

// Dead letter queue (Week 8)
static async moveToDeadLetterQueue(queueItem: any): Promise<void>
static async getDeadLetterQueue(): Promise<any[]>
static async retryDeadLetterItem(itemId: string): Promise<void>
static async clearDeadLetterQueue(): Promise<void>

// Conflict resolution (Week 7)
private static shouldApplyServerData(existing: any, serverData: any, tableName: string): boolean

// Apply changes from server
private static async applyProjectChange(data: any): Promise<void>
private static async applySiteChange(data: any): Promise<void>
private static async applyCategoryChange(data: any): Promise<void>
private static async applyItemChange(data: any): Promise<void>
private static async applyMaterialChange(data: any): Promise<void>
```

**Configuration:**

```typescript
const API_CONFIG = {
  BASE_URL: __DEV__ ? 'http://localhost:3000' : 'https://api.construction-tracker.com',
  ENDPOINTS: {
    SYNC_PUSH: '/api/sync/push',
    SYNC_PULL: '/api/sync/pull',
    SYNC_STATUS: '/api/sync/status',
  },
  TIMEOUT: 30000, // 30 seconds
};
```

---

### 2. AutoSyncManager (`services/sync/AutoSyncManager.ts`)

**Purpose:** Automatic sync trigger management

**Lines of Code:** 398 lines

**Features:**

- **Trigger 1:** App launch sync (2-second delay for initialization)
- **Trigger 2:** Network change sync (offline → online)
- **Trigger 3:** Periodic sync (every 5 minutes)
- **Trigger 4:** App foreground sync (background → foreground, 1-minute cooldown)

**State Management:**

```typescript
interface SyncState {
  isSyncing: boolean;         // Currently syncing
  lastSyncAt: number;         // Timestamp of last sync
  lastSyncSuccess: boolean;   // Last sync succeeded
  lastSyncError: string | null; // Last error message
  syncCount: number;          // Total sync operations
}
```

**Key Methods:**

```typescript
static initialize(): void                          // Start auto-sync system
static startAfterLogin(): Promise<void>            // Initial sync after login
static triggerManualSync(): Promise<void>          // User-initiated sync
static addListener(listener: SyncStateListener): void  // Subscribe to state changes
static getSyncState(): SyncState                   // Get current state
```

---

### 3. NetworkMonitor (`services/network/NetworkMonitor.ts`)

**Purpose:** Real-time network state monitoring

**Lines of Code:** 240 lines

**Features:**

- Connection type detection (WiFi, Cellular, None)
- Network change listeners
- Auto-sync trigger on network restoration
- Connection quality monitoring

**Key Methods:**

```typescript
static initialize(): void                              // Start monitoring
static isConnected(): Promise<boolean>                 // Check connection
static getConnectionType(): Promise<string>            // Get connection type
static addListener(listener: NetworkListener): void    // Subscribe to changes
static enableAutoSync(): void                          // Enable auto-sync on restore
static disableAutoSync(): void                         // Disable auto-sync
```

---

### 4. SyncQueue Model (`models/SyncQueueModel.ts`)

**Purpose:** Track pending changes for synchronization

**Schema:** (v19 - Week 6)

```typescript
{
  name: 'sync_queue',
  columns: [
    { name: 'table_name', type: 'string' },      // Which table
    { name: 'record_id', type: 'string' },       // Which record
    { name: 'action', type: 'string' },          // create/update/delete
    { name: 'data', type: 'string' },            // JSON serialized data
    { name: 'synced_at', type: 'number', isOptional: true },
    { name: 'retry_count', type: 'number' },     // Retry attempts
    { name: 'last_error', type: 'string', isOptional: true },
  ]
}
```

---

## Sync Flow

### Complete Sync Flow (syncNow)

```
User Action → Local DB Update → Sync Queue → syncNow() → syncUp() + syncDown()
```

**Detailed Flow:**

```
┌─────────────────────────────────────────────────────────────┐
│ Step 1: User Creates/Updates/Deletes Data                   │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 2: Save to Local Database (WatermelonDB)               │
│  - Set sync_status = 'pending'                              │
│  - Increment _version (for updates)                         │
│  - App continues working offline                            │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 3: Sync Triggered (Auto or Manual)                     │
│  - Network check: Is online?                                │
│  - Auth check: Has valid JWT?                               │
│  - If yes → proceed, if no → queue for later                │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 4: syncUp() - Push Local Changes to Server             │
│  1. Query all records WHERE sync_status = 'pending'         │
│  2. Group by table (maintain dependency order)              │
│  3. Serialize to JSON                                       │
│  4. POST /api/sync/push with JWT token                      │
│  5. Server processes changes                                │
│  6. If success:                                             │
│     - Set sync_status = 'synced'                            │
│     - Clear from queue                                      │
│  7. If error:                                               │
│     - Retry with exponential backoff                        │
│     - After 5 retries → move to Dead Letter Queue           │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 5: syncDown() - Pull Remote Changes from Server        │
│  1. Get last_sync_at from AsyncStorage                      │
│  2. GET /api/sync/pull?last_sync_at=<timestamp>             │
│  3. Server returns changes since timestamp                  │
│  4. For each change:                                        │
│     a. Find local record                                    │
│     b. Check version (conflict detection)                   │
│     c. Apply conflict resolution (LWW)                      │
│     d. If server wins: update local record                  │
│     e. If local wins: skip update                           │
│  5. Update last_sync_at to server timestamp                 │
│  6. Save to AsyncStorage                                    │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 6: Sync Complete                                       │
│  - Update UI (SyncIndicator)                                │
│  - Notify listeners (AutoSyncManager)                       │
│  - Log results                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Conflict Resolution

### Strategy: Last-Write-Wins (LWW)

**Implemented:** Week 7 (Days 16-20)

### How It Works

When the same record is modified on multiple devices while offline:

```
Device A (Offline):        Device B (Offline):
Update item-1 → v3         Update item-1 → v3
(10:00 AM)                 (10:05 AM)
         │                          │
         └─────────┬────────────────┘
                   │ Both sync to server
                   ▼
              Server detects conflict
              (both claim version 3)
                   │
                   ▼
         Compare updated_at timestamps
              10:05 AM > 10:00 AM
                   │
                   ▼
         Device B wins (Last-Write-Wins)
         Server keeps Device B's changes
                   │
                   ▼
         Device A pulls during next sync
         Device A receives Device B's version
```

### Conflict Resolution Algorithm

```typescript
/**
 * Conflict resolution logic (Week 7, Day 3)
 */
private static shouldApplyServerData(
  existing: any,
  serverData: any,
  tableName: string
): boolean {
  const localVersion = existing.version || 0;
  const serverVersion = serverData._version || 0;

  // Primary: Compare versions
  if (serverVersion > localVersion) {
    return true;  // Server is newer → apply
  }

  // Secondary: Timestamp tie-breaker (same version)
  if (serverVersion === localVersion) {
    const localUpdated = existing._raw.updated_at || 0;
    const serverUpdated = serverData.updated_at || 0;

    if (serverUpdated > localUpdated) {
      return true;  // Server timestamp newer → apply
    }
  }

  // Local is newer or equal
  return false;  // Keep local data
}
```

### Version Tracking

**Schema v20** (Week 7, Day 1): Added `_version` field to 10 models

**Version Lifecycle:**

1. **Create:** Initialize `_version = 1`
2. **Update (Server):** Auto-increment `_version = _version + 1`
3. **Update (Mobile):** Inherit server version on next pull
4. **Conflict:** Higher version wins, timestamp breaks ties

**Syncable Models with Version Tracking:**

1. projects
2. sites
3. categories
4. items
5. materials
6. progress_logs
7. hindrances
8. daily_reports
9. site_inspections
10. schedule_revisions

---

## Queue Management

### Sync Queue (Week 6)

**Purpose:** Track all pending changes that need to sync

**Implementation:** `SyncQueueModel` + `sync_queue` table (Schema v19)

**Queue Operations:**

```typescript
// Add to queue (automatic on create/update/delete)
await database.write(async () => {
  await database.collections.get('sync_queue').create(queue => {
    queue.tableName = 'items';
    queue.recordId = item.id;
    queue.action = 'update';
    queue.data = JSON.stringify(item._raw);
    queue.retryCount = 0;
  });
});

// Process queue (during syncUp)
const queue = await database.collections
  .get('sync_queue')
  .query(Q.where('synced_at', null))
  .fetch();

// Clear queue on success
await queueItem.update(q => {
  q.syncedAt = Date.now();
});
```

---

### Retry Logic with Exponential Backoff (Week 8)

**Implemented:** Week 8, Days 1-2

**Algorithm:**

```
Retry Delay = min(1000ms × 2^retry_count, 60000ms) ± jitter
```

**Retry Schedule:**

| Attempt | Delay (base) | With Jitter (±25%) | Max Delay |
|---------|--------------|-------------------|-----------|
| 1       | 1s           | 0.75s - 1.25s     | 1.25s     |
| 2       | 2s           | 1.5s - 2.5s       | 2.5s      |
| 3       | 4s           | 3s - 5s           | 5s        |
| 4       | 8s           | 6s - 10s          | 10s       |
| 5       | 16s          | 12s - 20s         | 20s       |
| 6+      | 60s (cap)    | 45s - 75s         | 75s       |

**Code:**

```typescript
private static async retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 5
): Promise<T> {
  for (let retry = 0; retry <= maxRetries; retry++) {
    try {
      return await fn();
    } catch (error) {
      if (retry === maxRetries) throw error;

      // Calculate exponential backoff with jitter
      const baseDelay = Math.min(1000 * Math.pow(2, retry), 60000);
      const jitter = 0.5 + Math.random(); // 0.5 to 1.5 (±25%)
      const delay = baseDelay * jitter;

      console.log(`⏳ Retry ${retry + 1}/${maxRetries} in ${Math.round(delay)}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

---

### Dead Letter Queue (Week 8)

**Purpose:** Capture items that fail repeatedly for manual intervention

**Implemented:** Week 8, Days 2-3

**Criteria:** Move to DLQ after 10+ failed attempts

**Storage:** AsyncStorage (persistent across app restarts)

**Operations:**

```typescript
// Move to DLQ
static async moveToDeadLetterQueue(queueItem: any): Promise<void>

// View DLQ
static async getDeadLetterQueue(): Promise<any[]>

// Retry item from DLQ
static async retryDeadLetterItem(itemId: string): Promise<void>

// Clear DLQ
static async clearDeadLetterQueue(): Promise<void>
```

**Admin UI:** `SyncMonitoringScreen` displays DLQ with retry controls

---

## Network Monitoring

### NetInfo Integration (Week 8, Day 3)

**Library:** `@react-native-community/netinfo`

**Features:**

1. **Real-time monitoring** - Detects connection changes instantly
2. **Connection types** - WiFi, Cellular, Ethernet, None
3. **Reachability** - Tests actual internet connectivity
4. **Listener system** - Notify components of changes

**Implementation:**

```typescript
// Initialize monitoring
NetworkMonitor.initialize();

// Subscribe to changes
NetworkMonitor.addListener((isConnected, connectionType) => {
  console.log(`Network: ${connectionType}, Connected: ${isConnected}`);
});

// Check current state
const isOnline = await NetworkMonitor.isConnected();
const type = await NetworkMonitor.getConnectionType();
```

**Auto-Sync Trigger:**

```typescript
// When network is restored (offline → online)
private static handleNetworkChange(state: NetInfoState): void {
  const wasConnected = this.currentState?.isConnected || false;
  const isConnected = state.isConnected || false;

  if (!wasConnected && isConnected && this.autoSyncEnabled) {
    console.log('🔄 Network restored! Triggering auto-sync...');

    // Wait 2 seconds for network to stabilize
    setTimeout(() => {
      SyncService.syncNow();
    }, 2000);
  }
}
```

---

## Auto-Sync System

### Auto-Sync Triggers (Week 8, Day 4)

**Manager:** `AutoSyncManager.ts` (398 lines)

**4 Automatic Triggers:**

#### 1. App Launch Sync
```typescript
// Runs after user login (2-second delay)
AutoSyncManager.startAfterLogin();

// Delay allows:
// - App initialization to complete
// - Database to be ready
// - Network state to stabilize
```

#### 2. Network Change Sync
```typescript
// Triggered by NetworkMonitor
// When: offline → online
// Delay: 2 seconds (network stabilization)
```

#### 3. Periodic Sync
```typescript
// Interval: Every 5 minutes
// Runs in background if app is active
// Skips if already syncing
setInterval(() => {
  if (!this.syncState.isSyncing) {
    SyncService.syncNow();
  }
}, 5 * 60 * 1000);
```

#### 4. App Foreground Sync
```typescript
// When: App returns from background
// Cooldown: 1 minute (prevents rapid syncs)
AppState.addEventListener('change', (nextState) => {
  if (nextState === 'active' && wasInBackground) {
    if (timeSinceLastSync > 60000) {  // 1 minute
      SyncService.syncNow();
    }
  }
});
```

### Manual Sync

**UI Component:** `SyncIndicator` (manual sync button)

```typescript
// User clicks sync button
AutoSyncManager.triggerManualSync();

// Bypasses cooldowns and runs immediately
```

---

## Error Handling

### Error Categories

#### 1. Network Errors
```typescript
// Timeout (30 seconds)
// No internet connection
// Server unreachable

Action: Retry with exponential backoff
Retries: Up to 5 attempts
Final: Move to Dead Letter Queue
```

#### 2. Authentication Errors
```typescript
// 401 Unauthorized
// Token expired

Action: Attempt token refresh
Fallback: Redirect to login
```

#### 3. Server Errors
```typescript
// 500 Internal Server Error
// 503 Service Unavailable

Action: Retry with backoff
Retries: Up to 5 attempts
```

#### 4. Data Errors
```typescript
// Invalid JSON
// Schema mismatch
// Foreign key violations

Action: Log error, skip record
Notify: Add to error log for admin review
```

### Error Recovery Flow

```
Error Occurs
    │
    ▼
Is Retryable?
    │
    ├─ Yes → Exponential Backoff Retry
    │         │
    │         ▼
    │    Retry Count < 5?
    │         │
    │         ├─ Yes → Retry
    │         └─ No → Dead Letter Queue
    │
    └─ No → Log Error, Skip Record
```

---

## Data Models

### Syncable Models (10 total)

All models with `sync_status` and `_version` fields:

#### 1. Projects
```typescript
{
  id: string (UUID)
  name: string
  client: string
  start_date: number
  end_date: number
  status: string
  budget: number
  sync_status: 'pending' | 'synced' | 'failed'
  _version: number
  created_at: number
  updated_at: number
}
```

#### 2. Sites
```typescript
{
  id: string
  name: string
  location: string
  project_id: string (FK → projects)
  supervisor_id: string
  sync_status: string
  _version: number
}
```

#### 3. Categories
```typescript
{
  id: string
  name: string
  description: string
  sync_status: string
  _version: number
}
```

#### 4. Items (30+ fields)
```typescript
{
  id: string
  name: string
  site_id: string (FK → sites)
  category_id: string (FK → categories)
  unit_of_measurement: string
  planned_quantity: number
  completed_quantity: number
  wbs_code: string
  wbs_level: number
  status: string
  sync_status: string
  _version: number
  // ... 20+ more fields
}
```

#### 5. Materials
```typescript
{
  id: string
  item_id: string (FK → items)
  material_name: string
  unit: string
  quantity_required: number
  quantity_available: number
  quantity_used: number
  supplier: string
  status: string
  sync_status: string
  _version: number
}
```

**Additional Models:** progress_logs, hindrances, daily_reports, site_inspections, schedule_revisions

---

## API Integration

### Backend Endpoints

**Base URL:**
- Development: `http://localhost:3000`
- Production: `https://api.construction-tracker.com`

### Authentication

**Method:** JWT Bearer Token

```typescript
Authorization: Bearer <access_token>
```

**Token Storage:** `TokenStorage` service (AsyncStorage)

**Token Refresh:** Automatic refresh before expiry

### Sync Endpoints

#### 1. POST /api/sync/push

**Purpose:** Send local changes to server

**Request:**
```json
{
  "changes": {
    "projects": [
      { "id": "...", "name": "...", "_version": 2, ... }
    ],
    "items": [
      { "id": "...", "name": "...", "_version": 5, ... }
    ]
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Sync push successful",
  "syncedCount": 15,
  "conflicts": [],
  "timestamp": 1698765450000
}
```

#### 2. GET /api/sync/pull

**Purpose:** Receive changes from server

**Query Parameters:**
```
?last_sync_at=1698765432000
```

**Response:**
```json
{
  "success": true,
  "message": "Pulled 10 records",
  "data": {
    "projects": [...],
    "sites": [...],
    "items": [...]
  },
  "timestamp": 1698765450000,
  "counts": {
    "projects": 2,
    "sites": 3,
    "items": 5
  }
}
```

#### 3. GET /api/sync/status

**Purpose:** Get sync status and statistics

**Response:**
```json
{
  "success": true,
  "totalRecords": 1250,
  "totalPending": 5,
  "stats": {
    "projects": 10,
    "sites": 50,
    "items": 1000,
    "materials": 190
  },
  "pending": {
    "projects": 0,
    "sites": 2,
    "items": 3
  },
  "lastSync": "2025-10-31T10:30:00.000Z"
}
```

---

## Security

### Authentication

**Method:** JWT (JSON Web Tokens)

**Token Types:**
- **Access Token:** Short-lived (1 hour), used for API requests
- **Refresh Token:** Long-lived (7 days), used to get new access tokens

**Security Features:**
1. Tokens stored securely in AsyncStorage
2. HTTPS only in production
3. Token expiry validation before each request
4. Automatic token refresh
5. Logout clears all tokens

### Authorization

**Backend:** All sync endpoints require valid JWT

```typescript
// Middleware checks JWT on every request
Authorization: Bearer <access_token>

// If invalid: 401 Unauthorized
// If expired: Attempt refresh or redirect to login
```

### Data Protection

1. **Transport:** HTTPS (TLS 1.2+)
2. **At Rest:** SQLite encryption (optional)
3. **Tokens:** Secure storage in AsyncStorage
4. **API Keys:** Environment variables, never committed

---

## Performance

### Optimization Strategies

#### 1. Incremental Sync
```typescript
// Only sync changes since last sync
?last_sync_at=1698765432000

// Not full database every time
// Reduces bandwidth and processing time
```

#### 2. Batch Operations
```typescript
// Send multiple changes in one request
POST /api/sync/push
{
  "changes": {
    "projects": [item1, item2, ...],  // Batch
    "items": [item1, item2, ...]       // Batch
  }
}

// Not: One request per record
```

#### 3. Background Processing
```typescript
// Sync runs in background
// UI remains responsive
// User can continue working during sync
```

#### 4. Smart Triggers
```typescript
// Avoid redundant syncs
if (isSyncing) return;  // Skip if already syncing
if (timeSinceLastSync < 60000) return;  // Cooldown period
```

### Performance Metrics

**Target Performance:**

| Operation | Target | Notes |
|-----------|--------|-------|
| Initial Sync (1000 records) | < 60s | Full database pull |
| Incremental Sync (100 changes) | < 10s | Changes only |
| Conflict Resolution (10 conflicts) | < 5s | LWW strategy |
| Network Timeout | 30s | Per request |
| Retry Delay | 1s - 60s | Exponential backoff |

**Actual Performance:** (To be measured in Week 9 testing)

---

## Monitoring & Debugging

### Admin UI: SyncMonitoringScreen

**Location:** `src/admin/SyncMonitoringScreen.tsx` (300 lines)

**Features:**

1. **Sync Status Dashboard**
   - Last sync timestamp
   - Total synced records
   - Pending records count
   - Current sync state

2. **Dead Letter Queue Viewer**
   - Failed items list
   - Error messages
   - Retry count
   - Manual retry buttons

3. **Manual Controls**
   - Force sync button
   - Clear queue button
   - Clear DLQ button
   - View logs button

4. **Statistics**
   - Sync count by model
   - Success/failure rates
   - Network status

### User UI: SyncIndicator

**Location:** `src/components/SyncIndicator.tsx` (200 lines)

**Modes:**

1. **Compact Mode** (header bar)
   - Cloud icon with color coding
   - Green: Synced
   - Yellow: Syncing
   - Red: Error

2. **Detailed Mode** (sync screen)
   - Last sync time (relative)
   - Network status
   - Sync button
   - Error messages

### Console Logging

**Log Levels:**

```typescript
console.log('📡 Network changed: WiFi')       // Info
console.log('🔄 Syncing...')                  // Progress
console.log('✅ Sync complete: 10 records')   // Success
console.warn('⚠️ Conflict detected: item-1')  // Warning
console.error('❌ Sync failed: Network error') // Error
```

---

## Best Practices

### For Developers

1. **Always use sync_status field**
   ```typescript
   // When creating/updating records
   await item.update(i => {
     i.name = 'New Name';
     i.syncStatus = 'pending';  // Trigger sync
   });
   ```

2. **Handle offline gracefully**
   ```typescript
   // Check network before sync
   const isOnline = await NetworkMonitor.isConnected();
   if (!isOnline) {
     console.log('Offline - changes queued');
     return;
   }
   ```

3. **Use version tracking**
   ```typescript
   // Server must increment version on every update
   UPDATE items SET _version = _version + 1 WHERE id = ?
   ```

4. **Test multi-device scenarios**
   ```typescript
   // Simulate two devices editing same record
   // Verify conflict resolution works
   ```

### For Users

1. **Manual sync** when important changes are made
2. **Check sync indicator** before going offline
3. **Review DLQ** in admin screen if sync issues occur
4. **Ensure good network** for initial sync (large data)

---

## Future Enhancements

### Potential Improvements (Post-Activity 2)

1. **Delta Sync**
   - Send only changed fields, not entire records
   - Reduces bandwidth significantly

2. **Compression**
   - Compress JSON payloads with gzip
   - Reduces data transfer by ~70%

3. **Selective Sync**
   - Allow users to choose what to sync
   - Example: Only sync current project

4. **Three-Way Merge**
   - More intelligent conflict resolution
   - Preserve changes from both sides when possible

5. **Optimistic Locking**
   - Prevent simultaneous edits
   - Use etags or version checks

6. **Sync History**
   - Track all sync operations
   - Audit trail for troubleshooting

7. **Real-Time Sync**
   - WebSocket connection for instant updates
   - Push notifications for changes

---

## Related Documents

### Activity 2 Documentation
- `docs/implementation/ACTIVITY_2_SYNC_SERVICE_IMPLEMENTATION.md` - Complete plan
- `docs/implementation/ACTIVITY_2_KICKOFF.md` - Week-by-week breakdown
- `docs/implementation/WEEK_6_SYNCSERVICE_COMPLETE.md` - Mobile sync details
- `docs/implementation/WEEK_7_CONFLICT_RESOLUTION.md` - Conflict resolution
- `docs/testing/WEEK_5_API_TEST_REPORT.md` - Backend API tests

### Code Files
- `services/sync/SyncService.ts` - Core sync engine (1,132 lines)
- `services/sync/AutoSyncManager.ts` - Auto-sync triggers (398 lines)
- `services/network/NetworkMonitor.ts` - Network monitoring (240 lines)
- `models/SyncQueueModel.ts` - Queue model
- `src/components/SyncIndicator.tsx` - UI component (200 lines)
- `src/admin/SyncMonitoringScreen.tsx` - Admin UI (300 lines)

### Architecture
- `ARCHITECTURE_UNIFIED.md` - Overall architecture
- `DATABASE.md` - Database schema
- `CLAUDE.md` - Development guidelines

---

**Document Status:** ✅ Complete
**Created:** October 31, 2025
**Author:** Development Team
**Activity:** Activity 2 - Week 9 Documentation
**Version:** 1.0

---

**END OF SYNC ARCHITECTURE DOCUMENTATION**
