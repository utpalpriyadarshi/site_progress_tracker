# Sync Configuration Guide

**Version:** 1.0
**Last Updated:** December 30, 2025
**Purpose:** Guide for configuring sync behavior in development and production

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Offline Development Mode](#offline-development-mode)
3. [Backend Integration Mode](#backend-integration-mode)
4. [Token Management](#token-management)
5. [Troubleshooting](#troubleshooting)
6. [Backend Requirements](#backend-requirements)

---

## Overview

The Construction Site Progress Tracker uses an **offline-first architecture** with WatermelonDB for local data storage. Sync functionality is optional and can be enabled when a backend server is available.

### Architecture

```
┌─────────────────────┐
│   React Native App  │
│  (WatermelonDB)     │
└──────────┬──────────┘
           │
           ├─────────────────┐
           │                 │
    ┌──────▼──────┐   ┌─────▼──────┐
    │  Offline    │   │  Sync      │
    │  Mode       │   │  Mode      │
    │  (Local)    │   │  (Server)  │
    └─────────────┘   └────────────┘
```

---

## Offline Development Mode

### When to Use

Use offline mode when:
- 🏗️ Developing locally without a backend server
- 🧪 Testing features that don't require sync
- 📱 Single-device deployment
- 🌐 No internet connectivity required

### Configuration

**File:** `services/sync/SyncService.ts`

```typescript
/**
 * DEVELOPMENT MODE: Disable sync when no backend is available
 *
 * Set to true when developing locally without a backend server.
 * The app will work in pure offline mode using WatermelonDB.
 *
 * Set to false when you have a backend server running.
 */
const OFFLINE_DEVELOPMENT_MODE = true; // 👈 Set to false when backend is ready
```

### How It Works

When `OFFLINE_DEVELOPMENT_MODE = true`:

1. **SyncUp() Behavior:**
   - ✅ Skips API calls
   - ✅ Returns success immediately
   - ✅ All data saved locally in WatermelonDB
   - ✅ No network errors

2. **SyncDown() Behavior:**
   - ✅ Skips API calls
   - ✅ Returns success immediately
   - ✅ Uses only local data
   - ✅ No network errors

3. **Console Logs:**
   ```
   🔄 SyncService.syncUp() started...
   📴 SyncUp skipped: Offline development mode enabled
   💡 Working in pure offline mode - all data saved locally in WatermelonDB
   ```

### Features Available in Offline Mode

| Feature | Status | Notes |
|---------|--------|-------|
| ✅ Login/Authentication | Full | Local database validation |
| ✅ Data CRUD Operations | Full | Create, Read, Update, Delete |
| ✅ Inspections | Full | With photo capture |
| ✅ Daily Reports | Full | Local storage |
| ✅ Planning Module | Full | WBS, Gantt, Milestones |
| ✅ Material Management | Full | BOM, Inventory |
| ✅ Financial Tracking | Full | Budget, Costs, Invoices |
| ❌ Cloud Backup | Disabled | No server sync |
| ❌ Multi-Device Sync | Disabled | Single device only |

---

## Backend Integration Mode

### When to Use

Enable backend integration when:
- 🌐 You have a backend server running
- 🔄 You need multi-device synchronization
- ☁️ You want cloud backup
- 👥 You need team collaboration

### Prerequisites

Before enabling sync, ensure you have:

1. **Backend Server Running**
   - Development: `http://localhost:3000`
   - Production: `https://api.construction-tracker.com`

2. **Required Endpoints Implemented**
   - `POST /api/auth/login` - User authentication
   - `POST /api/auth/refresh` - Token refresh
   - `POST /api/sync/push` - Push local changes
   - `GET /api/sync/pull` - Pull server changes

3. **Database Setup**
   - PostgreSQL 14+ (recommended)
   - Sequelize ORM configured
   - All tables created (see API_DOCUMENTATION.md)

### Configuration

**Step 1: Disable Offline Mode**

Edit `services/sync/SyncService.ts` line 51:

```typescript
const OFFLINE_DEVELOPMENT_MODE = false; // ✅ Enable sync
```

**Step 2: Verify Backend URL**

Check line 34:

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

**Step 3: Start Backend Server**

```bash
# Navigate to your backend project
cd path/to/backend

# Start the server
npm start
# OR
npm run dev
# OR
node server.js

# Verify server is running
curl http://localhost:3000/api/health
```

**Step 4: Rebuild React Native App**

```bash
# Rebuild to apply configuration changes
npx react-native run-android
# OR
npx react-native run-ios
```

### Testing Sync

After enabling sync mode:

1. **Login** to the app
2. **Create some data** (inspection, items, etc.)
3. **Check logs** for sync activity:
   ```
   🔄 SyncService.syncUp() started...
   📊 Pending records: { projects: 0, sites: 0, items: 5 }
   📤 Pushing changes to server...
   ✅ SyncUp completed: 5 records synced
   ```

4. **Verify on server** that data was received
5. **Test multi-device** by logging in on another device

---

## Token Management

### Authentication Flow

```
1. User Login
   ↓
2. Server returns: accessToken + refreshToken
   ↓
3. App stores tokens in AsyncStorage
   ↓
4. API requests use accessToken
   ↓
5. When token expires → Auto-refresh using refreshToken
   ↓
6. Continue using new accessToken
```

### Token Fix (December 2025)

**Problem:** App was experiencing false "Network error" messages due to expired tokens.

**Root Cause:** `SyncService` was using `TokenStorage.getAccessToken()` which:
- ❌ Didn't check token expiry
- ❌ Returned expired tokens
- ❌ Caused 401 errors reported as network errors

**Solution:** Changed to use `AuthService.getAccessToken()` which:
- ✅ Checks token expiry automatically
- ✅ Auto-refreshes expired tokens
- ✅ Returns valid token or null
- ✅ Seamless user experience

**Files Modified:**
- `services/sync/SyncService.ts` (lines 13, 66, 161, 353)

**Code Changes:**
```typescript
// ❌ OLD (Wrong)
const accessToken = await TokenStorage.getAccessToken();

// ✅ NEW (Correct)
const accessToken = await AuthService.getAccessToken();
```

### Token Expiry Times

| Token Type | Duration | Purpose |
|------------|----------|---------|
| Access Token | 1 hour | API requests |
| Refresh Token | 7 days | Token renewal |

### Token Auto-Refresh

The app automatically refreshes tokens:
- ⏰ **When:** Access token is expired but refresh token is valid
- 🔄 **How:** `AuthService.getAccessToken()` detects expiry and calls refresh endpoint
- 🎯 **Result:** User stays logged in seamlessly
- ❌ **Logout only if:** Refresh token also expires

---

## Troubleshooting

### Issue: "Network error. Please check your internet connection."

**Possible Causes:**

1. **Backend server not running**
   ```bash
   # Check if server is running on port 3000
   netstat -ano | findstr ":3000"

   # If nothing, start your backend server
   cd path/to/backend
   npm start
   ```

2. **Offline mode is disabled but no backend available**
   ```typescript
   // Solution: Enable offline mode
   const OFFLINE_DEVELOPMENT_MODE = true;
   ```

3. **Backend URL is wrong**
   ```typescript
   // Check API_CONFIG.BASE_URL matches your server
   const API_CONFIG = {
     BASE_URL: __DEV__ ? 'http://localhost:3000' : '...',
   };
   ```

### Issue: "No access token available. Please login first."

**Possible Causes:**

1. **User not logged in**
   - Solution: Login through the app

2. **Tokens expired**
   - Solution: Already fixed with `AuthService.getAccessToken()` auto-refresh

3. **AsyncStorage cleared**
   - Solution: Login again

### Issue: Sync fails with 401 Unauthorized

**Possible Causes:**

1. **Token expired and refresh failed**
   - Check if refresh token is still valid
   - Check backend refresh endpoint

2. **Backend authentication issues**
   - Verify JWT secret matches between app and server
   - Check backend authentication middleware

### Issue: Data not syncing between devices

**Checklist:**

- [ ] Offline mode is disabled (`OFFLINE_DEVELOPMENT_MODE = false`)
- [ ] Backend server is running and accessible
- [ ] Both devices are connected to the same network (development)
- [ ] Both devices logged in with same user account
- [ ] Check server logs for errors

---

## Backend Requirements

### Minimum Backend Implementation

To enable sync, your backend needs:

#### 1. Authentication Endpoints

**POST /api/auth/login**
```json
Request:
{
  "username": "supervisor1",
  "password": "password123"
}

Response:
{
  "success": true,
  "user": {
    "id": "user-uuid",
    "username": "supervisor1",
    "role": "supervisor"
  },
  "tokens": {
    "accessToken": "eyJhbGci...",
    "refreshToken": "eyJhbGci...",
    "accessTokenExpiry": 1735567200000,
    "refreshTokenExpiry": 1736172000000
  }
}
```

**POST /api/auth/refresh**
```json
Request:
{
  "refreshToken": "eyJhbGci..."
}

Response:
{
  "success": true,
  "accessToken": "eyJhbGci...",
  "accessTokenExpiry": 1735567200000
}
```

#### 2. Sync Endpoints

**POST /api/sync/push**
```json
Request:
Headers: { Authorization: "Bearer <accessToken>" }
Body:
{
  "changes": {
    "items": [
      {
        "id": "item-uuid",
        "name": "Foundation Work",
        "categoryId": "cat-uuid",
        "operation": "create",
        "version": 1,
        "updatedAt": 1735567200000
      }
    ],
    "materials": [...],
    "inspections": [...]
  }
}

Response:
{
  "success": true,
  "syncedRecords": 5,
  "errors": []
}
```

**GET /api/sync/pull?updated_after=1735567200000**
```json
Request:
Headers: { Authorization: "Bearer <accessToken>" }

Response:
{
  "changes": {
    "items": [...],
    "materials": [...],
    "inspections": [...]
  },
  "timestamp": 1735570800000
}
```

### Technology Stack Recommendations

```
Runtime:    Node.js v18+
Framework:  Express.js
ORM:        Sequelize
Database:   PostgreSQL 14+
Auth:       jsonwebtoken (JWT)
```

### Database Schema

See `docs/api/API_DOCUMENTATION.md` for complete schema requirements.

### Testing Your Backend

```bash
# Test health endpoint
curl http://localhost:3000/api/health

# Test login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"supervisor1","password":"password123"}'

# Test sync push (with token)
curl -X POST http://localhost:3000/api/sync/push \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"changes":{"items":[]}}'
```

---

## Summary

### For Development Without Backend

```typescript
// services/sync/SyncService.ts
const OFFLINE_DEVELOPMENT_MODE = true; // ✅ Offline mode
```

**Result:**
- ✅ No network errors
- ✅ Full app functionality
- ✅ Local data storage only
- ❌ No multi-device sync

### For Production With Backend

```typescript
// services/sync/SyncService.ts
const OFFLINE_DEVELOPMENT_MODE = false; // ✅ Sync enabled
```

**Requirements:**
- ✅ Backend server running
- ✅ All endpoints implemented
- ✅ Database configured
- ✅ Network connectivity

**Result:**
- ✅ Cloud backup
- ✅ Multi-device sync
- ✅ Team collaboration
- ✅ Auto token refresh

---

## Additional Resources

- **API Documentation:** `docs/api/API_DOCUMENTATION.md`
- **Database Schema:** See API docs
- **Authentication Flow:** See API docs, section "Authentication"
- **WatermelonDB Docs:** https://nozbe.github.io/WatermelonDB/

---

**Questions?** Check the troubleshooting section or refer to the API documentation.
