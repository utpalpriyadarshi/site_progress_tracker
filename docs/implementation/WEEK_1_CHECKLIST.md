# Week 1 Checklist - Security Implementation

**Activity:** Activity 1 - Security Implementation
**Week:** 1 of 3 (Days 1-5)
**Focus:** Password Hashing & Migration
**Reference:** `ACTIVITY_1_SECURITY_IMPLEMENTATION.md`

---

## 📋 Daily Checklists

### Day 1: Setup & Schema Updates

**Morning Tasks:**
- [ ] Read `ACTIVITY_1_SECURITY_IMPLEMENTATION.md` (Days 1-2 section)
- [ ] Verify you're on the correct branch: `git branch` (should show `feature/v2.2`)
- [ ] Install dependencies:
  ```bash
  npm install --save bcrypt @types/bcrypt --legacy-peer-deps
  npm install --save jsonwebtoken @types/jsonwebtoken --legacy-peer-deps
  ```
- [ ] Verify installation (check package.json)

**Afternoon Tasks:**
- [ ] Update schema: `models/schema/index.ts`
  - Add `password_hash` field to users table
- [ ] Create migration file: `models/migrations/v13_add_password_hashing.ts`
  - Write migration logic to add new column
- [ ] Update UserModel: `models/UserModel.ts`
  - Add `@field('password_hash') passwordHash!: string`
- [ ] Increment schema version: v12 → v13

**Evening Review:**
- [ ] Test migration runs without errors
- [ ] Verify `password_hash` column exists in database
- [ ] Commit changes: `git commit -m "v2.2: Add password_hash field to users schema (Day 1)"`

---

### Day 2: Password Migration Script

**Morning Tasks:**
- [ ] Create service: `services/auth/PasswordMigrationService.ts`
- [ ] Implement `hashAllPasswords()` method
  - Loop through all users
  - Hash each plaintext password with bcrypt (salt rounds: 12)
  - Store in `password_hash` field
- [ ] Implement `verifyMigration()` method
  - Verify each hash matches original password

**Afternoon Tasks:**
- [ ] Add rollback capability
  - Keep `password` field until verification complete
- [ ] Test with default users (manager, supervisor, planner, admin)
- [ ] Add migration trigger in Admin panel (optional)

**Evening Review:**
- [ ] Test migration script on fresh database
- [ ] Verify all 5 default users migrated successfully
- [ ] Check migration performance (should be < 1 second for test data)
- [ ] Commit changes: `git commit -m "v2.2: Implement password migration service with bcrypt (Day 2)"`

---

### Day 3: Update Login Logic

**Morning Tasks:**
- [ ] Update `services/auth/AuthService.ts`
  - Modify `login()` to use `bcrypt.compare()`
  - Update to check `passwordHash` instead of `password`
- [ ] Add password strength validation function
  - Min 8 characters
  - At least 1 uppercase, 1 lowercase, 1 number, 1 special char

**Afternoon Tasks:**
- [ ] Update `src/admin/RoleManagementScreen.tsx`
  - Hash passwords on user creation
  - Hash passwords on user update
- [ ] Test login flow with hashed passwords
  - Login as manager
  - Login as supervisor
  - Login as planner
  - Login as admin

**Evening Review:**
- [ ] All test users can login successfully
- [ ] Password strength validation working
- [ ] Commit changes: `git commit -m "v2.2: Update login logic to use bcrypt comparison (Day 3)"`

---

### Day 4: Remove Plaintext Password Field

**Morning Tasks:**
- [ ] Create migration: `models/migrations/v14_remove_plaintext_password.ts`
- [ ] Update schema: Remove `password` field from users table
- [ ] Update UserModel: Remove `password` field declaration
- [ ] Increment schema version: v13 → v14

**Afternoon Tasks:**
- [ ] Run migration
- [ ] Verify no plaintext passwords in database
- [ ] Test login still works (should use `password_hash` only)
- [ ] Update seed data script if needed

**Evening Review:**
- [ ] Database inspection: No `password` column exists
- [ ] All logins working with hashed passwords
- [ ] Commit changes: `git commit -m "v2.2: Remove plaintext password field (Day 4)"`

---

### Day 5: Testing & Week 1 Review

**Morning Tasks:**
- [ ] Write unit tests: `__tests__/services/auth/PasswordMigrationService.test.ts`
  - Test password hashing
  - Test verification
  - Test rollback
- [ ] Write unit tests: `__tests__/services/auth/AuthService.test.ts`
  - Test login with correct password
  - Test login with incorrect password
  - Test password strength validation

**Afternoon Tasks:**
- [ ] Manual testing checklist:
  - [ ] Create new user with weak password (should reject)
  - [ ] Create new user with strong password (should succeed)
  - [ ] Login with correct password (should succeed)
  - [ ] Login with incorrect password (should fail)
  - [ ] Inspect database (no plaintext passwords)
- [ ] Run all tests: `npm test`

**Week 1 Review:**
- [ ] All Day 1-5 tasks completed
- [ ] Schema version: v12 → v14
- [ ] All passwords hashed with bcrypt
- [ ] Login logic updated
- [ ] Tests passing
- [ ] Code committed to feature branch
- [ ] Ready for Week 2 (JWT implementation)

---

## ✅ Week 1 Deliverables Checklist

### Code Files Created/Modified:
- [ ] `models/schema/index.ts` (updated)
- [ ] `models/UserModel.ts` (updated)
- [ ] `models/migrations/v13_add_password_hashing.ts` (new)
- [ ] `models/migrations/v14_remove_plaintext_password.ts` (new)
- [ ] `services/auth/PasswordMigrationService.ts` (new)
- [ ] `services/auth/AuthService.ts` (updated)
- [ ] `src/admin/RoleManagementScreen.tsx` (updated)

### Tests Created:
- [ ] `__tests__/services/auth/PasswordMigrationService.test.ts`
- [ ] `__tests__/services/auth/AuthService.test.ts`

### Documentation:
- [ ] Update `ARCHITECTURE_UNIFIED.md` (password hashing section)

---

## 🚨 Common Issues & Solutions

### Issue 1: bcrypt installation fails
**Solution:** Make sure you have Python and build tools installed:
```bash
# Windows
npm install --global windows-build-tools

# macOS
xcode-select --install
```

### Issue 2: Migration fails with "column already exists"
**Solution:** Drop and recreate the database or make migration idempotent:
```typescript
// Check if column exists before adding
if (!columnExists('password_hash')) {
  addColumn('password_hash', 'string');
}
```

### Issue 3: Login fails after migration
**Solution:**
- Check bcrypt.compare() is being called correctly
- Verify password_hash field is populated
- Check salt rounds match (12)

---

## 📊 Progress Tracking

**Daily Standup Template:**
```
Yesterday: [what you completed]
Today: [what you're working on]
Blockers: [any issues]
```

**End of Week 1 Status:**
- [ ] All 5 days completed
- [ ] All checklist items done
- [ ] Tests passing
- [ ] Code reviewed
- [ ] Ready for Week 2

---

## 🎯 Week 2 Preview

**Next Week Focus:** JWT Token Implementation
- Generate access tokens (15min expiry)
- Generate refresh tokens (7 days expiry)
- Token storage in AsyncStorage
- Token validation logic

**Prerequisites from Week 1:**
- ✅ Password hashing working
- ✅ Login logic updated
- ✅ No plaintext passwords

---

**Estimated Time:** 40 hours (5 days × 8 hours)
**Completion Target:** End of Week 1
**Next:** Week 2 - JWT Implementation

---

**Reference Documents:**
- `ACTIVITY_1_SECURITY_IMPLEMENTATION.md` - Full activity plan
- `PHASE_1_MASTER_PLAN.md` - Overall Phase 1 plan
- `PROJECT_GAP_ANALYSIS_AND_ROADMAP.md` - Gap analysis
