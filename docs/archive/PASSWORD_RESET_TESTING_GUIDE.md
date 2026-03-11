# Password Reset Testing Guide

## Implementation Summary

✅ **Completed Steps:**
1. Created `password_reset_tokens` table in Supabase
2. Created `PasswordResetService` for local password reset
3. Updated `ForgotPasswordScreen` to use local auth
4. Updated `ResetPasswordScreen` to validate tokens and update WatermelonDB
5. Configured deep linking for password reset
6. Fixed TypeScript errors

## How to Test

### Step 1: Start Testing (App should already be running)

The app should auto-reload with the new code. If not, you may need to restart Metro:
```bash
npx kill-port 8081
npx react-native start --reset-cache
```

### Step 2: Test Forgot Password Flow

1. **Open the app** on your device
2. **Click "Forgot Password?"** link on the login screen
3. **Enter an existing user email** (use one of these):
   - admin@construction.com
   - supervisor@construction.com
   - manager@construction.com
   - planner@construction.com
   - logistics@construction.com
   - designer@construction.com
   - commercial@construction.com

4. **Click "Send Reset Link"**
5. **Check Metro Bundler console or logcat** for the reset link
   - You should see a box with:
     ```
     ========================================
     🔐 PASSWORD RESET LINK (FOR TESTING)
     ========================================
     Email: admin@construction.com
     Link: myapp://reset-password?token=xxx&email=yyy
     Expires: [timestamp]
     ========================================
     ```

### Step 3: Test Reset Password Flow

#### Option A: Using ADB (Recommended)
6. **Copy the link** from the console
7. **Run this command** (replace with your actual link):
   ```bash
   adb shell am start -W -a android.intent.action.VIEW -d "myapp://reset-password?token=YOUR_TOKEN&email=admin@construction.com"
   ```

#### Option B: Manual Testing
6. **Copy the token and email** from the console
7. **Navigate manually** to Reset Password screen
8. The app should validate the token automatically

### Step 4: Complete Password Reset

8. **Enter a new password** (must meet requirements):
   - At least 8 characters
   - One uppercase letter
   - One lowercase letter
   - One number

9. **Confirm the password**
10. **Click "Reset Password"**
11. **You should see** "Password reset successful! Redirecting..."
12. **App redirects** to login screen after 2 seconds

### Step 5: Verify Password Was Updated

13. **Try to login** with the old password - should FAIL
14. **Login with the new password** - should SUCCESS

## Expected Behavior

### Success Flow:
- ✅ Email exists → Token generated → Link logged to console
- ✅ Click link → App opens to Reset Password screen
- ✅ Token validated → Password input shown
- ✅ Enter new password → Password updated in WatermelonDB
- ✅ Token marked as used in Supabase
- ✅ Can login with new password

### Error Cases to Test:

#### Invalid Email:
- Enter non-existent email
- Should show: "If an account exists with this email, you will receive a password reset link."
- (Same message for security - doesn't reveal if email exists)

#### Expired Token:
- Wait 1 hour after generating link
- Should show: "This reset link has expired. Please request a new one."

#### Reused Token:
- Use the same link twice
- Second time should show: "Invalid or expired reset link."

#### Weak Password:
- Try password without uppercase
- Should show: "Password must contain at least one uppercase letter"

#### Password Mismatch:
- Enter different passwords in confirm field
- Should show: "Passwords do not match"

## Checking Logs

### Metro Bundler Console:
```bash
# Look for these logs:
- "🔐 PASSWORD RESET LINK (FOR TESTING)"
- "Password reset requested"
- "Password reset token created"
- "Validating password reset token"
- "Password updated in database"
- "Password reset completed successfully"
```

### Logcat:
```bash
adb logcat | grep -E "PasswordResetService|ReactNativeJS"
```

### Supabase Database:
1. Go to Supabase Dashboard
2. Click "Table Editor"
3. Select `password_reset_tokens` table
4. You should see tokens with:
   - email
   - token (UUID)
   - expires_at (1 hour from creation)
   - used (false initially, true after reset)

## Troubleshooting

### App doesn't reload:
```bash
npx kill-port 8081
npx react-native start --reset-cache
```

### Deep link doesn't work:
- Check AndroidManifest.xml has the intent-filter
- Verify the link format: `myapp://reset-password?token=xxx&email=yyy`
- Try running adb command manually

### Token validation fails:
- Check Supabase connection
- Verify token in database
- Check if token expired (1 hour limit)

### Password not updating:
- Check logcat for errors
- Verify user exists in WatermelonDB
- Check password hash is being generated

## Next Steps

After testing successfully, we can:
1. Set up email service (Resend or SendGrid)
2. Create Supabase Edge Function for sending emails
3. Remove console.log and use actual email delivery
4. Add email templates with proper formatting

## Current Limitations

- ⚠️ **No actual email sending** - links are logged to console
- ⚠️ **Token cleanup** - old tokens stay in database (can add cleanup job later)
- ⚠️ **Single device testing** - deep linking works best on physical device

---

## Test Checklist

- [ ] Forgot Password screen loads
- [ ] Can enter email and submit
- [ ] Reset link appears in console
- [ ] Deep link opens app to Reset Password screen
- [ ] Token validation shows loading state
- [ ] Valid token shows password input
- [ ] Invalid token shows error message
- [ ] Password strength indicator works
- [ ] Can submit new password
- [ ] Password updated in database
- [ ] Token marked as used
- [ ] Can login with new password
- [ ] Cannot reuse same reset link
- [ ] Cannot login with old password

---

**Ready to test!** Start with Step 2 above.
