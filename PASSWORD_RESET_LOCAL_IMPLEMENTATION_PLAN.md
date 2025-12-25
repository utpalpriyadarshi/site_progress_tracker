# Local Password Reset Implementation Plan

## Overview
Implement password reset for existing WatermelonDB users using Supabase for token storage and email delivery while keeping authentication local.

## Architecture

### Components
1. **WatermelonDB** - User storage and authentication (existing)
2. **Supabase Database** - Password reset token storage (new)
3. **Supabase Edge Function** - Secure email sending (new)
4. **React Native App** - UI and orchestration

### Data Flow
```
User enters email
    ↓
Check user exists in WatermelonDB
    ↓
Generate secure token (UUID)
    ↓
Store token in Supabase (expires in 1 hour)
    ↓
Call Edge Function to send email
    ↓
User receives email with deep link
    ↓
User clicks link (myapp://reset-password?token=xxx&email=yyy)
    ↓
App validates token via Supabase
    ↓
User sets new password
    ↓
Update password hash in WatermelonDB
    ↓
Mark token as used in Supabase
```

## Implementation Steps

### Phase 1: Supabase Setup

#### 1.1 Create password_reset_tokens table
```sql
CREATE TABLE password_reset_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for faster lookups
CREATE INDEX idx_token ON password_reset_tokens(token);
CREATE INDEX idx_email_unused ON password_reset_tokens(email, used);
```

#### 1.2 Set Row Level Security (RLS) policies
```sql
-- Enable RLS
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- Allow insert for authenticated users (app uses anon key)
CREATE POLICY "Allow insert tokens" ON password_reset_tokens
  FOR INSERT TO anon
  WITH CHECK (true);

-- Allow select for token validation
CREATE POLICY "Allow select tokens" ON password_reset_tokens
  FOR SELECT TO anon
  USING (true);

-- Allow update to mark as used
CREATE POLICY "Allow update tokens" ON password_reset_tokens
  FOR UPDATE TO anon
  USING (true);
```

#### 1.3 Create Supabase Edge Function
Location: `supabase/functions/send-reset-email/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

serve(async (req) => {
  try {
    const { email, token } = await req.json()

    // Send email via Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Site Progress Tracker <noreply@yourdomain.com>',
        to: [email],
        subject: 'Reset Your Password',
        html: `
          <h2>Password Reset Request</h2>
          <p>Click the link below to reset your password:</p>
          <a href="myapp://reset-password?token=${token}&email=${encodeURIComponent(email)}">
            Reset Password
          </a>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this, please ignore this email.</p>
        `,
      }),
    })

    const data = await res.json()

    return new Response(
      JSON.stringify({ success: true, data }),
      { headers: { "Content-Type": "application/json" } },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    )
  }
})
```

### Phase 2: React Native Implementation

#### 2.1 Create PasswordResetService
Location: `src/services/PasswordResetService.ts`

Responsibilities:
- Generate secure tokens
- Store/validate tokens in Supabase
- Trigger email sending
- Update passwords in WatermelonDB

#### 2.2 Update ForgotPasswordScreen
- Check if email exists in WatermelonDB
- Call PasswordResetService to send reset email
- Show success message

#### 2.3 Update ResetPasswordScreen
- Extract token and email from deep link params
- Validate token via PasswordResetService
- Update password in WatermelonDB
- Mark token as used

#### 2.4 Update Deep Linking
- Parse query parameters from deep link
- Pass token and email to ResetPasswordScreen

### Phase 3: Testing

1. **Forgot Password Flow**
   - Enter existing user email
   - Verify email received
   - Check token stored in Supabase

2. **Reset Password Flow**
   - Click email link
   - App opens to reset screen
   - Enter new password
   - Verify password updated in WatermelonDB
   - Verify token marked as used

3. **Error Cases**
   - Invalid email (not in database)
   - Expired token
   - Already used token
   - Invalid token

## Security Considerations

1. **Token Generation**: Use cryptographically secure random tokens (UUID v4)
2. **Token Expiry**: 1 hour validity
3. **One-time Use**: Mark tokens as used after password reset
4. **HTTPS Only**: Supabase enforces HTTPS
5. **No API Keys in App**: Email API key stored in Edge Function environment

## Email Service Options

### Option A: Resend (Recommended)
- Free tier: 3,000 emails/month
- Simple API
- Good deliverability
- Setup: Get API key from resend.com

### Option B: SendGrid
- Free tier: 100 emails/day
- More features
- Setup: Get API key from sendgrid.com

### Option C: AWS SES
- $0.10 per 1,000 emails
- Requires AWS account
- More complex setup

## Estimated Implementation Time

- Supabase setup: 30 minutes
- Edge Function: 1 hour
- React Native service: 1 hour
- UI updates: 30 minutes
- Testing: 1 hour
- **Total: ~4 hours**

## Next Steps

1. ✅ User approves plan
2. Create Supabase table
3. Set up email service (Resend)
4. Create Edge Function
5. Implement PasswordResetService
6. Update UI screens
7. Test end-to-end flow
