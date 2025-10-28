# Week 2 Checklist - JWT Token Implementation

**Activity:** Activity 1 - Security Implementation
**Week:** 2 of 3 (Days 6-10)
**Focus:** JWT Authentication & Token Management
**Status:** 🚧 **IN PROGRESS** (Starting 2025-10-27)
**Reference:** `ACTIVITY_1_SECURITY_IMPLEMENTATION.md`

---

## 📋 Daily Checklists

### Day 6: JWT Setup & Configuration ⏳

**Morning Tasks:**
- [ ] Read `ACTIVITY_1_SECURITY_IMPLEMENTATION.md` (Week 2 section, Lines 172-250)
- [ ] Verify you're on the correct branch: `git branch` (should show `feature/v2.2`)
- [ ] Verify JWT dependencies installed (from Week 1):
  ```bash
  npm list jsonwebtoken @types/jsonwebtoken
  ```
- [ ] If not installed:
  ```bash
  npm install --save jsonwebtoken @types/jsonwebtoken --legacy-peer-deps
  npm install --save @react-native-async-storage/async-storage --legacy-peer-deps
  ```

**Afternoon Tasks:**
- [ ] Create JWT configuration file: `config/jwt.config.ts`
  - Generate ACCESS_TOKEN_SECRET (256-bit random string)
  - Generate REFRESH_TOKEN_SECRET (256-bit random string)
  - Set ACCESS_TOKEN_EXPIRY: '15m'
  - Set REFRESH_TOKEN_EXPIRY: '7d'
- [ ] Create config directory if needed: `mkdir config`
- [ ] Test configuration loads correctly

**Evening Review:**
- [ ] JWT configuration file created
- [ ] Secrets are strong (256-bit, random)
- [ ] Expiry times set appropriately
- [ ] Configuration exports correctly
- [ ] Commit changes: `git commit -m "v2.2: Add JWT configuration (Week 2, Day 6)"`

**Deliverables:**
- `config/jwt.config.ts` - JWT configuration with secrets and expiry settings

---

### Day 7: Token Generation Service ⏳

**Morning Tasks:**
- [ ] Create TokenService: `services/auth/TokenService.ts`
- [ ] Implement `generateAccessToken(userId, username, role)`
  - Use ACCESS_TOKEN_SECRET
  - Set expiry to 15 minutes
  - Include payload: userId, username, role, sessionId, iat, exp
- [ ] Implement `generateRefreshToken(userId, sessionId)`
  - Use REFRESH_TOKEN_SECRET
  - Set expiry to 7 days
  - Include payload: userId, sessionId, iat, exp

**Afternoon Tasks:**
- [ ] Implement `verifyAccessToken(token)` - validates and decodes access token
- [ ] Implement `verifyRefreshToken(token)` - validates and decodes refresh token
- [ ] Implement `decodeToken(token)` - decodes without verification
- [ ] Add error handling for expired/invalid tokens
- [ ] Add TypeScript interfaces for token payloads

**Evening Review:**
- [ ] Test token generation (access + refresh)
- [ ] Test token verification (valid tokens)
- [ ] Test token verification (expired tokens)
- [ ] Test token verification (invalid tokens)
- [ ] Verify token payload structure
- [ ] Commit changes: `git commit -m "v2.2: Implement TokenService (Week 2, Day 7)"`

**Deliverables:**
- `services/auth/TokenService.ts` - Complete token management service

**Token Payload Structure:**
```typescript
AccessToken: {
  userId: string
  username: string
  role: string
  sessionId: string
  iat: number
  exp: number
}

RefreshToken: {
  userId: string
  sessionId: string
  iat: number
  exp: number
}
```

---

### Day 8: Token Storage & AuthService Integration ⏳

**Morning Tasks:**
- [ ] Install AsyncStorage (if not already installed):
  ```bash
  npm install --save @react-native-async-storage/async-storage --legacy-peer-deps
  ```
- [ ] Create `services/storage/TokenStorage.ts`
- [ ] Implement `storeTokens(accessToken, refreshToken)`
- [ ] Implement `getAccessToken()`
- [ ] Implement `getRefreshToken()`
- [ ] Implement `clearTokens()`
- [ ] Add error handling for storage operations

**Afternoon Tasks:**
- [ ] Create or update `services/auth/AuthService.ts`
- [ ] Implement `login(username, password)` method:
  - Query user from database
  - Validate password with bcrypt
  - Generate access + refresh tokens
  - Store tokens in AsyncStorage
  - Return user data + tokens
- [ ] Implement `logout()` method:
  - Clear tokens from AsyncStorage
  - Clear user context
- [ ] Add token refresh logic placeholder (will implement in Day 9-10)

**Evening Review:**
- [ ] Test login flow with token generation
- [ ] Verify tokens stored in AsyncStorage
- [ ] Test logout clears tokens
- [ ] Test invalid credentials handling
- [ ] Commit changes: `git commit -m "v2.2: Add token storage and AuthService integration (Week 2, Day 8)"`

**Deliverables:**
- `services/storage/TokenStorage.ts` - Token storage utilities
- `services/auth/AuthService.ts` - Updated with JWT token support

---

### Day 9: AuthContext Integration ⏳

**Morning Tasks:**
- [ ] Update `src/auth/AuthContext.tsx` (or create if needed)
- [ ] Add token state to AuthContext:
  ```typescript
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  tokenExpiry: number | null
  ```
- [ ] Add token management functions:
  - `setTokens(accessToken, refreshToken)`
  - `clearTokens()`
  - `checkTokenExpiry()`
- [ ] Implement token restoration on app startup (load from AsyncStorage)

**Afternoon Tasks:**
- [ ] Update `src/auth/LoginScreen.tsx` to use new AuthService
- [ ] Update login flow to store tokens in context
- [ ] Update logout flow to clear tokens from context
- [ ] Add token expiry check on app resume/navigation
- [ ] Test login → logout → login flow

**Evening Review:**
- [ ] Login stores tokens in context and AsyncStorage
- [ ] Logout clears tokens from context and AsyncStorage
- [ ] App restores tokens on restart
- [ ] Token expiry checked appropriately
- [ ] Commit changes: `git commit -m "v2.2: Integrate JWT tokens with AuthContext (Week 2, Day 9)"`

**Deliverables:**
- Updated: `src/auth/AuthContext.tsx` - Token state management
- Updated: `src/auth/LoginScreen.tsx` - Token-based login

---

### Day 10: Token Refresh Logic & Testing ⏳

**Morning Tasks:**
- [ ] Implement token refresh logic in `services/auth/AuthService.ts`:
  - `refreshAccessToken(refreshToken)` method
  - Verify refresh token is valid
  - Check refresh token not expired
  - Generate new access token
  - Store new access token
  - Return new access token
- [ ] Add automatic refresh logic in AuthContext:
  - Check token expiry before API calls (future)
  - Refresh if access token expired but refresh token valid
  - Logout if both tokens expired

**Afternoon Tasks:**
- [ ] Test complete authentication flow:
  - [ ] Login as admin → verify tokens generated
  - [ ] Login as supervisor → verify tokens generated
  - [ ] Login as manager → verify tokens generated
  - [ ] Login as planner → verify tokens generated
  - [ ] Login as logistics → verify tokens generated
- [ ] Test token refresh (simulate expired access token)
- [ ] Test logout clears all tokens
- [ ] Test app restart restores session

**Evening Review:**
- [ ] All test users can login with JWT tokens
- [ ] Tokens stored and retrieved correctly
- [ ] Token refresh works (when access token expires)
- [ ] Logout properly clears all tokens
- [ ] Session persistence works across app restarts
- [ ] Create Week 2 completion summary
- [ ] Commit changes: `git commit -m "v2.2: Complete JWT token implementation (Week 2, Day 10)"`

**Deliverables:**
- Token refresh implementation in AuthService
- Comprehensive testing complete
- Week 2 completion summary document

---

## ✅ Week 2 Deliverables Checklist

### Code Files Created/Modified:
- [ ] `config/jwt.config.ts` (new - JWT configuration)
- [ ] `services/auth/TokenService.ts` (new - ~200 lines)
- [ ] `services/storage/TokenStorage.ts` (new - ~100 lines)
- [ ] `services/auth/AuthService.ts` (new/updated - JWT login/logout)
- [ ] `src/auth/AuthContext.tsx` (updated - token state)
- [ ] `src/auth/LoginScreen.tsx` (updated - JWT integration)
- [ ] `package.json` (verify dependencies)

### Dependencies Installed:
- [ ] `jsonwebtoken` - JWT token generation/verification
- [ ] `@types/jsonwebtoken` - TypeScript types
- [ ] `@react-native-async-storage/async-storage` - Token storage

### Tests Created:
- [ ] Manual testing completed for all 5 test users
- [ ] Token generation tested
- [ ] Token validation tested
- [ ] Token refresh tested
- [ ] Token storage/retrieval tested

### Documentation:
- [ ] Create `WEEK_2_COMPLETION_SUMMARY.md`
- [ ] Update `WEEK_2_CHECKLIST.md` with completion status

---

## 🚨 Common Issues & Solutions

### Issue 1: JWT secret key too weak
**Solution:** Use strong 256-bit random strings:
```typescript
// Generate strong secrets (run in Node.js):
require('crypto').randomBytes(32).toString('hex')
```

### Issue 2: AsyncStorage permission errors on Android
**Solution:** Add permission to `AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
```

### Issue 3: Tokens not persisting across app restarts
**Solution:**
- Check AsyncStorage is properly initialized
- Verify token restoration in AuthContext useEffect
- Check for AsyncStorage errors in console

### Issue 4: Token expiry time incorrect
**Solution:**
- Verify JWT config has correct expiry format ('15m', '7d')
- Check system time is correct
- Use `Date.now()` for consistent timestamps

---

## 📊 Progress Tracking

**Daily Standup Template:**
```
Yesterday: [what you completed]
Today: [what you're working on]
Blockers: [any issues]
```

**End of Week 2 Goals:**
- [ ] JWT tokens generated on login
- [ ] Tokens stored in AsyncStorage
- [ ] Tokens validated correctly
- [ ] Token refresh working
- [ ] All 5 test users can login with JWT
- [ ] Session persists across app restarts
- [ ] Ready for Week 3 (Session Management)

---

## 🎯 Week 3 Preview

**Next Week Focus:** Session Management & Password Reset
- Create sessions database table
- Implement SessionService
- Add session tracking and revocation
- Implement password reset workflow
- Add password strength validation
- Create password history table

**Prerequisites from Week 2:**
- ✅ JWT tokens working
- ✅ Token storage working
- ✅ Login flow integrated
- ✅ Token refresh working

---

**Estimated Time:** 40 hours (5 days × 8 hours)
**Completion Target:** End of Week 2
**Next:** Week 3 - Session Management & Password Reset

---

## 📖 Reference Documents

- `ACTIVITY_1_SECURITY_IMPLEMENTATION.md` - Full activity plan
- `WEEK_1_CHECKLIST.md` - Previous week (Password Hashing)
- `PHASE_1_MASTER_PLAN.md` - Overall Phase 1 plan
- `PROJECT_GAP_ANALYSIS_AND_ROADMAP.md` - Gap analysis

---

## 🔒 Security Notes

**Important Security Considerations:**
- **NEVER commit JWT secrets to Git** - Add to .gitignore or use environment variables
- **Use strong random secrets** (256-bit minimum)
- **Set appropriate token expiry times** (15m for access, 7d for refresh)
- **Store tokens securely** (AsyncStorage for React Native)
- **Validate tokens on every request** (future API integration)
- **Rotate refresh tokens** on use (implement in Week 3)
- **Revoke sessions** on logout and password reset

**Token Security Checklist:**
- [ ] Secrets are 256-bit random strings
- [ ] Secrets NOT committed to Git
- [ ] Access token expiry = 15 minutes
- [ ] Refresh token expiry = 7 days
- [ ] Tokens stored in AsyncStorage (secure on mobile)
- [ ] No sensitive data in JWT payload
- [ ] Token validation implemented
- [ ] Error handling for expired/invalid tokens

---

**Status:** 🚧 **STARTING WEEK 2** (2025-10-27)
**Ready to begin Day 6!**
