# Quick Start: Sync Configuration

**TL;DR:** Quick reference for enabling/disabling sync in the Construction Site Progress Tracker app.

---

## 🚀 Quick Setup

### Working Offline (No Backend Server)

**File:** `services/sync/SyncService.ts` (Line 51)

```typescript
const OFFLINE_DEVELOPMENT_MODE = true; // ✅ Offline mode enabled
```

Then rebuild:
```bash
npx react-native run-android
```

✅ **Result:** App works fully offline, no network errors

---

### Working Online (With Backend Server)

**Step 1:** Start your backend server
```bash
cd path/to/backend
npm start
# Server should run on http://localhost:3000
```

**Step 2:** Enable sync mode

**File:** `services/sync/SyncService.ts` (Line 51)

```typescript
const OFFLINE_DEVELOPMENT_MODE = false; // ✅ Sync enabled
```

**Step 3:** Rebuild
```bash
npx react-native run-android
```

✅ **Result:** App syncs with backend server

---

## 🔍 Quick Troubleshooting

### "Network error" messages appearing?

**Solution 1:** Enable offline mode
```typescript
const OFFLINE_DEVELOPMENT_MODE = true;
```

**Solution 2:** Start your backend server
```bash
# Check if server is running
netstat -ano | findstr ":3000"
```

---

## 📖 Full Documentation

See **[SYNC_CONFIGURATION.md](./SYNC_CONFIGURATION.md)** for complete details.

---

## 🎯 What Was Fixed (Dec 2025)

### Issue
App showed "Network error" when tokens expired.

### Solution
Changed sync service to use `AuthService.getAccessToken()` which auto-refreshes expired tokens.

### Files Changed
- `services/sync/SyncService.ts` (lines 13, 66, 161, 353)

### Result
- ✅ Tokens auto-refresh seamlessly
- ✅ No more false network errors
- ✅ Users stay logged in longer

---

**Questions?** See [SYNC_CONFIGURATION.md](./SYNC_CONFIGURATION.md) for detailed guide.
