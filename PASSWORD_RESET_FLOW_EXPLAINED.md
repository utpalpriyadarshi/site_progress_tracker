# Password Reset Flow - Complete Explanation

## Current Implementation (Working Now)

### Step-by-Step Flow:

```
┌─────────────────────────────────────────────────────────────┐
│ 1. USER: Clicks "Forgot Password?" on Login Screen         │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. USER: Enters email (admin@construction.com)             │
│    Clicks "Send Reset Link"                                 │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. APP: Checks if user exists in WatermelonDB              │
│    ✅ User found with that email                            │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. APP: Generates secure token (UUID)                      │
│    Token: 4f5c2700-672a-40ac-bda6-2a6eaec8b810            │
│    Expires: 1 hour from now                                 │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. APP: Stores token in Supabase database                  │
│    Table: password_reset_tokens                             │
│    Fields: email, token, expires_at, used=false            │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. APP: Creates reset link                                  │
│    Link: myapp://reset-password?token=xxx&email=yyy        │
│    ⚠️ CURRENTLY: Logs to console (for testing)              │
│    🔜 FUTURE: Will send email with this link                │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. USER: Sees success message                               │
│    "Check the console for the reset link"                   │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 8. TESTING: You run ADB command to simulate clicking link   │
│    (In production: User clicks link in email)               │
│    adb shell 'am start -d "myapp://reset-password?..."'    │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 9. APP: Deep link opens Reset Password screen              │
│    Extracts token & email from URL                         │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 10. APP: Validates token                                    │
│     - Checks if token exists in Supabase                    │
│     - Checks if token is not expired (< 1 hour)            │
│     - Checks if token not already used                      │
│     ✅ Token is valid                                        │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 11. USER: Enters new password                               │
│     Confirms password                                        │
│     Clicks "Reset Password"                                 │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 12. APP: Updates password in WatermelonDB                  │
│     - Hashes new password with bcrypt                       │
│     - Updates user.passwordHash in database                │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 13. APP: Marks token as used in Supabase                   │
│     - Updates: used = true                                  │
│     - Token can never be reused                            │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 14. USER: Sees success message                              │
│     "Password reset successful! Redirecting..."            │
│     App navigates to Login screen                          │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 15. USER: Logs in with NEW password                        │
│     ✅ Login successful!                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## What's Currently Working ✅

1. **Forgot Password Screen** - User can enter email
2. **User Validation** - Checks if user exists in WatermelonDB
3. **Token Generation** - Creates secure UUID token
4. **Token Storage** - Saves to Supabase with expiry
5. **Deep Linking** - URL parsing with query parameters
6. **Token Validation** - Checks validity, expiry, usage
7. **Password Update** - Updates WatermelonDB password hash
8. **Token Invalidation** - Marks token as used
9. **Security** - One-time use, 1-hour expiry

## What's NOT Yet Implemented ⚠️

**EMAIL SENDING** - Currently missing!

Instead of:
```
User receives email → Clicks link in email
```

We're doing:
```
Developer sees link in console → Runs ADB command
```

---

## Why Email is NOT Implemented Yet

We need to set up:

1. **Email Service Account** (Resend or SendGrid)
   - Free tier: 3,000 emails/month
   - Get API key

2. **Supabase Edge Function** (serverless function)
   - Sends emails securely
   - Keeps API key hidden (never in app)

3. **Email Template**
   - Branded email design
   - "Click here to reset password" button
   - Security warnings

---

## How It Will Work When Email is Added (Future)

### Current (Testing):
```
ForgotPasswordScreen
    ↓
Console.log(reset link) ← You copy this manually
    ↓
ADB command ← You run this manually
    ↓
ResetPasswordScreen
```

### Future (Production):
```
ForgotPasswordScreen
    ↓
Call Edge Function
    ↓
Edge Function sends email via Resend
    ↓
User receives email in inbox
    ↓
User clicks link in email
    ↓
App opens automatically to ResetPasswordScreen
```

---

## The Missing Piece: Email Sending

### What happens when you click "Send Reset Link":

**Currently:**
```javascript
// src/services/PasswordResetService.ts (line 160)

console.log('========================================');
console.log('🔐 PASSWORD RESET LINK (FOR TESTING)');
console.log('========================================');
console.log(`Email: ${email}`);
console.log(`Link: ${resetLink}`);
console.log(`Expires: ${expiresAt.toLocaleString()}`);
console.log('========================================');

// TODO: Call Edge Function to send email
```

**Future (When we add email):**
```javascript
// Call Supabase Edge Function
const { data, error } = await supabase.functions.invoke('send-reset-email', {
  body: {
    email: email,
    token: token,
    resetLink: resetLink,
  },
});

// Edge Function sends email via Resend API
// User receives email with clickable link
```

---

## Why We Built It This Way

**Separation of Concerns:**
- ✅ **Core logic working** - Token generation, validation, password update
- ⚠️ **Email delivery** - Separate service (can be added without breaking existing code)

**Testing Without Email:**
- You can test the entire flow using ADB commands
- No need to wait for emails during development
- Faster iteration

**Production Ready:**
- When we add email, we just replace the `console.log` with an API call
- Everything else stays the same
- Zero changes to screens or database

---

## Next Steps to Add Email (Optional)

If you want to add email sending now:

1. **Sign up for Resend** (free)
   - https://resend.com
   - Get API key

2. **Create Supabase Edge Function**
   ```bash
   supabase functions new send-reset-email
   ```

3. **Add email sending code**
   - Template with your branding
   - Send via Resend API

4. **Update PasswordResetService**
   - Replace console.log with Edge Function call

5. **Test with real email**
   - Use your email address
   - Receive actual email
   - Click link in email

**Time needed:** ~1-2 hours

---

## Summary

**What you tested today:**
1. Click "Forgot Password?" ✅
2. Enter email ✅
3. Token generated and stored ✅
4. Link logged to console ✅ (Instead of email)
5. ADB command simulates email click ✅
6. App opens to Reset Password ✅
7. Set new password ✅
8. Login with new password ✅

**What's missing:**
- Real email delivery (currently using console + ADB)

**Why it's fine:**
- All core functionality works
- Email can be added later without any changes to existing code
- Perfect for testing and development

---

## Questions?

**Q: How does the user get the reset link?**
A: Currently in console (for testing). In production: via email.

**Q: What happens when they click the link in email?**
A: The `myapp://` deep link opens the app automatically to Reset Password screen.

**Q: Is the password actually changing?**
A: Yes! It's being updated in WatermelonDB with bcrypt hashing.

**Q: Can the same link be used twice?**
A: No! The token is marked as "used" after password reset.

**Q: How long is the link valid?**
A: 1 hour from when it was generated.

**Q: Where is the token stored?**
A: In Supabase `password_reset_tokens` table.

**Q: Where is the password stored?**
A: In WatermelonDB `users` table (local database on device).
