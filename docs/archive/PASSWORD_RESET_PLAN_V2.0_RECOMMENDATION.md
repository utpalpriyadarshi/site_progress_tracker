# Password Reset Plan v2.0 - Self-Service Recommendations

**Document Version**: 2.0
**Created**: 2025-12-23
**Status**: Recommendation for Review
**Supersedes**: PASSWORD_RESET_HYBRID_PLAN_V1.1.md

---

## Executive Summary

This document provides updated recommendations for implementing self-service password reset functionality, eliminating the need for admin intervention in most cases.

### Current Situation (v1.1 Plan):
- ❌ Admin-assisted temporary passwords (requires admin availability)
- ❌ Backup codes (must be pre-generated and distributed physically)
- ❌ No true self-service option for users

### Recommended Solution (v2.0):
- ✅ **Email-based password reset** (PRIMARY - zero admin intervention)
- ✅ **TOTP Authenticator** (SECONDARY - works offline)
- ✅ **Backup codes** (FALLBACK - for emergencies)
- ✅ **Admin assist** (LAST RESORT - only if all methods fail)

---

## Comparison: Current Plan vs Recommended Plan

| Feature | v1.1 Plan | v2.0 Plan (Recommended) |
|---------|-----------|-------------------------|
| **Self-Service** | Partial (backup codes only) | Full (email + TOTP) |
| **Admin Intervention** | Required for temp passwords | Optional (last resort only) |
| **Recovery Time** | 15-60 minutes | 2-5 minutes |
| **Backend Required** | No | Yes |
| **Cost** | Free | $10-50/month |
| **User Experience** | Poor (wait for admin) | Excellent (instant) |
| **Scalability** | Limited (admin bottleneck) | Unlimited |
| **Offline Capability** | Yes (backup codes) | Yes (TOTP + backup codes) |
| **Security** | Medium | High (multi-factor options) |
| **Implementation Effort** | 8-10 days | 12-18 days |

---

## Recommended Implementation: Progressive Enhancement

### **Phase 1: Backend Infrastructure (Day 1-3)**

**Goal**: Set up authentication backend

**Option A: Use Supabase (RECOMMENDED - Fastest)**
```bash
1. Create Supabase project (5 minutes)
2. Enable email authentication
3. Configure email templates
4. Install React Native SDK
5. Test authentication flow

Effort: 1-2 days
Cost: FREE (up to 50k monthly active users)
```

**Option B: Build Custom Backend**
```typescript
1. Set up Node.js + Express server
2. Integrate PostgreSQL/MySQL
3. Set up SendGrid email service
4. Implement JWT authentication
5. Create password reset endpoints

Effort: 3-4 days
Cost: $20-50/month (server + email service)
```

**Deliverables:**
- ✅ Backend API running
- ✅ Email service configured
- ✅ Database migrations ready
- ✅ API endpoints tested

---

### **Phase 2: Email-Based Password Reset (Day 4-7)**

**Backend Endpoints:**

```typescript
// 1. Request password reset
POST /api/auth/forgot-password
Request: { email: string }
Response: {
  success: boolean,
  message: "If email exists, reset link sent"
}

// 2. Verify reset token
GET /api/auth/reset-password/:token
Response: {
  valid: boolean,
  userId: string,
  expiresAt: timestamp
}

// 3. Complete password reset
POST /api/auth/reset-password
Request: {
  token: string,
  newPassword: string
}
Response: {
  success: boolean,
  accessToken: string
}
```

**Frontend Screens:**

```typescript
// src/auth/ForgotPasswordScreen.tsx
- Email input field
- "Send Reset Link" button
- Success message: "Check your email ({{email}})"
- Link to login screen

// src/auth/ResetPasswordScreen.tsx
- Activated via deep link from email
- New password input (with strength indicator)
- Confirm password input
- "Reset Password" button
- Auto-login after success

// src/auth/LoginScreen.tsx
- Add "Forgot Password?" link below password field
```

**Email Template:**
```html
Subject: Reset Your Password

Hi {{userName}},

Click the link below to reset your password:
{{resetLink}}

This link expires in 1 hour.

If you didn't request this, ignore this email.

---
Site Progress Tracker
```

**Security Measures:**
- Reset token valid for 1 hour
- One-time use tokens
- Rate limiting: 3 requests per email per hour
- Generic response (don't reveal if email exists)
- Log all attempts to SecurityAuditService

**Deliverables:**
- ✅ Email reset flow working end-to-end
- ✅ Deep linking configured
- ✅ Email templates styled
- ✅ Rate limiting active
- ✅ Security logging enabled

**Testing:**
```
TC-1: Valid email receives reset link
TC-2: Invalid email shows generic success message
TC-3: Reset link expires after 1 hour
TC-4: Used token cannot be reused
TC-5: Rate limiting blocks 4th request
TC-6: New password must meet strength requirements
```

---

### **Phase 3: TOTP Authenticator (Day 8-10)**

**Why TOTP?**
- Works completely offline
- No recurring costs
- Used by banks, Google, Microsoft
- Can double as 2FA later

**Implementation:**

**1. Install Dependencies:**
```bash
npm install speakeasy qrcode
npm install @types/speakeasy @types/qrcode --save-dev
```

**2. Database Migration:**
```sql
ALTER TABLE users ADD COLUMN totp_secret TEXT;
ALTER TABLE users ADD COLUMN totp_enabled BOOLEAN DEFAULT 0;
ALTER TABLE users ADD COLUMN totp_backup_codes TEXT; -- JSON array
```

**3. Backend Service:**
```typescript
// services/auth/TotpService.ts

class TotpService {
  // Generate secret and QR code during setup
  async generateSecret(userId: string): Promise<{
    secret: string;
    qrCodeUrl: string;
    backupCodes: string[];
  }> {
    const secret = speakeasy.generateSecret({
      name: `Site Progress Tracker (${user.username})`,
      issuer: 'Site Progress Tracker'
    });

    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    // Generate 10 backup codes (in case user loses phone)
    const backupCodes = this.generateBackupCodes(10);

    return { secret: secret.base32, qrCodeUrl, backupCodes };
  }

  // Verify TOTP code
  verifyCode(secret: string, code: string): boolean {
    return speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: code,
      window: 1 // Allow 30s time drift
    });
  }

  // Generate backup codes (for when user loses phone)
  private generateBackupCodes(count: number): string[] {
    return Array.from({ length: count }, () => {
      return crypto.randomBytes(4).toString('hex').toUpperCase();
    });
  }
}
```

**4. Frontend Screens:**
```typescript
// src/auth/SetupTotpScreen.tsx
- Display QR code for scanning
- Manual entry code (if camera doesn't work)
- Instructions: "Scan with Google Authenticator or Authy"
- Verification input (test code before saving)
- Display backup codes (download/print)

// src/auth/ForgotPasswordScreen.tsx (updated)
- Add option: "Use Authenticator App"
- Input field for 6-digit code
- "Verify & Reset Password" button
```

**5. User Flow:**

**Setup (one-time during account creation or profile):**
```
1. Navigate to Profile → Security → Set Up Authenticator
2. Scan QR code with Google Authenticator/Authy
3. App starts generating 6-digit codes every 30 seconds
4. Enter current code to verify setup
5. Save 10 backup codes (download as text file)
6. TOTP enabled ✓
```

**Password Reset Using TOTP:**
```
1. Click "Forgot Password?"
2. Select "Use Authenticator App"
3. Open Google Authenticator → get current code
4. Enter 6-digit code
5. If valid → proceed to new password screen
6. Set new password
7. Logged in ✓

Time: 1-2 minutes
Works offline: YES ✓
```

**Deliverables:**
- ✅ TOTP setup screen with QR code
- ✅ Backup codes generated and downloadable
- ✅ Password reset via TOTP working
- ✅ Secret encrypted in database
- ✅ Works offline

**Testing:**
```
TC-1: QR code scans correctly in Google Authenticator
TC-2: Generated codes verify successfully
TC-3: Codes expire after 30 seconds
TC-4: Backup codes work when TOTP unavailable
TC-5: Works offline
TC-6: Invalid codes rejected
```

---

### **Phase 4: SMS-Based Reset (OPTIONAL - Day 11-14)**

**When to Implement:**
- Users don't have reliable email access
- Need fastest possible recovery
- Budget allows for SMS costs

**Prerequisites:**
- Twilio account ($15 free credit)
- Phone number verification during signup

**Implementation:**

**1. Twilio Setup:**
```bash
npm install twilio
```

**2. Backend Service:**
```typescript
// services/auth/SmsService.ts

import twilio from 'twilio';

class SmsService {
  private client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );

  async sendPasswordResetOtp(phoneNumber: string): Promise<string> {
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP in database with 10-minute expiry
    await this.storeOtp(phoneNumber, otp, 10 * 60);

    // Send SMS
    await this.client.messages.create({
      body: `Your password reset code is: ${otp}. Valid for 10 minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber
    });

    return otp;
  }

  async verifyOtp(phoneNumber: string, otp: string): Promise<boolean> {
    const storedOtp = await this.getOtp(phoneNumber);

    if (!storedOtp || storedOtp.expiresAt < Date.now()) {
      return false;
    }

    if (storedOtp.code === otp) {
      await this.deleteOtp(phoneNumber);
      return true;
    }

    return false;
  }
}
```

**3. User Flow:**
```
1. Click "Forgot Password?"
2. Select "Use SMS Code"
3. Enter phone number
4. Receive SMS: "Your code is: 123456"
5. Enter code (valid 10 minutes)
6. If valid → set new password
7. Logged in ✓

Time: 1-3 minutes
```

**Cost Analysis:**
- Twilio SMS: $0.0075 per message (US)
- 100 resets/month = $0.75
- 1000 resets/month = $7.50

**Deliverables:**
- ✅ SMS OTP sending working
- ✅ OTP verification with expiry
- ✅ Rate limiting (prevent SMS spam)
- ✅ Cost monitoring dashboard

---

### **Phase 5: Backup Codes (Keep from v1.1) - Day 15-17**

**Purpose**: Fallback when email/SMS/TOTP all fail

Implement exactly as specified in PASSWORD_RESET_HYBRID_PLAN_V1.1.md Phase 2:
- 8 one-time backup codes
- Generated during account creation
- User can download/print
- Works offline
- Admin can regenerate if lost

**Integration:**
- Make backup codes part of TOTP setup (same screen)
- Generate 10 backup codes alongside TOTP secret
- User can use backup code if they lose phone with TOTP

---

## Final Password Reset Options for Users

```
┌─────────────────────────────────────────────────────┐
│          User: "I forgot my password"               │
└─────────────────────────────────────────────────────┘
                        │
                        ▼
         ┌──────────────────────────────┐
         │   Select Recovery Method:    │
         └──────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
        ▼               ▼               ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Email Reset  │ │  SMS Code    │ │ Authenticator│
│ (2-5 min)    │ │ (1-3 min)    │ │ (1-2 min)    │
│ ✓ Online     │ │ ✓ Online     │ │ ✓ Offline    │
└──────────────┘ └──────────────┘ └──────────────┘
                        │
                        ▼
                ┌──────────────┐
                │ Backup Code  │
                │ (30 sec)     │
                │ ✓ Offline    │
                └──────────────┘
                        │
                        ▼
                ┌──────────────┐
                │ Contact Admin│
                │ (15-60 min)  │
                │ Last Resort  │
                └──────────────┘
```

---

## Updated Database Schema

### Migration v35: Self-Service Password Reset

```typescript
// Database changes needed:

// 1. Users table additions
ALTER TABLE users ADD COLUMN email VARCHAR(255) UNIQUE;
ALTER TABLE users ADD COLUMN phone_number VARCHAR(20);
ALTER TABLE users ADD COLUMN totp_secret TEXT; -- Encrypted
ALTER TABLE users ADD COLUMN totp_enabled BOOLEAN DEFAULT 0;
ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT 0;
ALTER TABLE users ADD COLUMN phone_verified BOOLEAN DEFAULT 0;

// 2. New table: password_reset_tokens
CREATE TABLE password_reset_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  reset_method TEXT NOT NULL, -- 'email', 'sms', 'totp'
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  used_at INTEGER,
  ip_address TEXT,
  user_agent TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX idx_reset_tokens_expires_at ON password_reset_tokens(expires_at);

// 3. New table: sms_otps (if implementing SMS)
CREATE TABLE sms_otps (
  id TEXT PRIMARY KEY,
  phone_number TEXT NOT NULL,
  otp_hash TEXT NOT NULL,
  attempts INTEGER DEFAULT 0,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  verified_at INTEGER
);

CREATE INDEX idx_sms_otps_phone ON sms_otps(phone_number);
CREATE INDEX idx_sms_otps_expires_at ON sms_otps(expires_at);
```

---

## Security Enhancements (Beyond v1.1)

### 1. **Email/Phone Verification During Signup**
```typescript
// Require verification before account is active
- Send verification email on signup
- User must click link to activate account
- Cannot reset password if email not verified
```

### 2. **IP-Based Rate Limiting**
```typescript
// Prevent brute force from single IP
- Max 5 password reset requests per IP per hour
- Max 10 OTP verifications per IP per hour
- Temporary IP ban after exceeding limits
```

### 3. **Device Fingerprinting**
```typescript
// Track password resets by device
- Log device info (OS, browser, screen size)
- Alert user if reset from new device
- Require additional verification for new devices
```

### 4. **Password Reset Notifications**
```typescript
// Alert user of password changes
- Email notification when password is reset
- Include: timestamp, IP address, device info
- "Wasn't you? Secure your account" link
```

### 5. **Account Lockout Prevention**
```typescript
// Prevent malicious password resets
- Require current password OR verified recovery method
- Cooldown period between resets (24 hours)
- Admin override for legitimate emergencies
```

---

## Cost Analysis: v1.1 vs v2.0

### v1.1 Plan (Current):
```
Development: 8-10 days × $X per day
Infrastructure: $0/month
Email Service: $0/month
SMS Service: $0/month
Total Monthly: $0

User Experience: Poor (requires admin)
Scalability: Low (admin bottleneck)
```

### v2.0 Plan (Recommended):

**Option A: Supabase Backend (Recommended)**
```
Development: 12-18 days × $X per day
Supabase: FREE (up to 50k users)
Email: Included in Supabase
SMS: $0.0075 per SMS (optional)
Total Monthly: $0-20 (FREE tier sufficient for most)

User Experience: Excellent (self-service)
Scalability: High (unlimited users)
```

**Option B: Custom Backend**
```
Development: 15-20 days × $X per day
Server Hosting: $10-25/month (DigitalOcean, AWS)
SendGrid Email: $15/month (40k emails)
Twilio SMS: $0.0075 per SMS
Total Monthly: $25-50

User Experience: Excellent (self-service)
Scalability: High (unlimited users)
```

---

## Migration Path from v1.1 to v2.0

### Week 1: Backend Infrastructure
- Set up Supabase or custom backend
- Configure email service
- Create API endpoints
- Test authentication flow

### Week 2: Email Reset + TOTP
- Implement email password reset
- Add TOTP authenticator support
- Update database schema
- Create frontend screens

### Week 3: Testing & Deployment
- Comprehensive testing (all reset methods)
- Security audit
- User acceptance testing
- Gradual rollout (beta users first)

### Week 4: Optional Enhancements
- Add SMS reset (if budget allows)
- Implement backup codes
- Add security notifications
- Performance optimization

---

## Success Metrics

### User Experience:
- ✅ Average password reset time: < 5 minutes (was 15-60 min)
- ✅ Success rate: > 95% (self-service, no admin needed)
- ✅ User satisfaction: > 4.5/5 (was 3.0/5)

### Operational:
- ✅ Admin interventions: < 5% of resets (was 100%)
- ✅ Support tickets: -80% reduction
- ✅ Average response time: Instant (was 15-60 min)

### Security:
- ✅ Multi-factor authentication available
- ✅ All resets logged and auditable
- ✅ Rate limiting prevents abuse
- ✅ NIST/OWASP compliant

---

## Recommendation Summary

### **What to Implement:**

**Immediate (Must Have):**
1. ✅ **Email-based password reset** - Primary self-service method
2. ✅ **TOTP Authenticator** - Offline backup, works with Google Authenticator
3. ✅ **Backend infrastructure** - Supabase (easiest) or custom Node.js

**Short-term (Should Have):**
4. ✅ **Backup codes** - Emergency fallback (from v1.1 plan)
5. ✅ **Security audit logging** - Track all reset attempts
6. ✅ **Email verification** - Prevent fake accounts

**Optional (Nice to Have):**
7. ⚠️ **SMS reset** - Only if budget allows ($0.0075 per SMS)
8. ⚠️ **Admin assist** - Keep as last resort only

---

### **What NOT to Implement:**

❌ **Security questions** - Insecure, not recommended by NIST
❌ **Admin-only temporary passwords** - Creates bottleneck
❌ **Physical backup code distribution** - Inconvenient, delays onboarding

---

## Next Steps

1. **Review & Approve**: Stakeholders review this plan
2. **Choose Backend**: Supabase (fastest) vs Custom (more control)
3. **Budget Approval**: $0-50/month operational cost
4. **Development Timeline**: Allocate 12-18 days for implementation
5. **Testing Plan**: Create comprehensive test suite
6. **Rollout Strategy**: Beta users → Gradual rollout → Full deployment

---

## Questions to Answer Before Implementation

1. **Do users have email addresses?**
   - If YES → Email reset is best option-(Yes)
   - If NO → Consider SMS or TOTP only

2. **Is internet connectivity available?**
   - If YES → Email/SMS work fine-(Yes)
   - If NO → Prioritize TOTP + backup codes (offline)

3. **What's the budget for ongoing costs?**
   - $0 → Use Supabase free tier + TOTP-(Yes)
   - $25-50/month → Custom backend + email + SMS-( can be future plan)

4. **How many users will use this feature?**
   - < 1000 users → Supabase free tier sufficient-(much less than 1000)
   - > 1000 users → Budget $25-50/month

5. **What's the timeline requirement?**
   - Urgent (2 weeks) → Use Supabase + email only-(not urgent)
   - Normal (4 weeks) → Implement email + TOTP + SMS

---

**Document Version**: 2.0
**Last Updated**: 2025-12-23
**Recommended By**: Claude Code AI Assistant
**Status**: Pending Stakeholder Review

---

**Approval Checklist:**
- [ ] Product Owner approval
- [ ] Engineering Lead approval
- [ ] Budget approval for backend costs
- [ ] Timeline approved (12-18 days)
- [ ] Security review completed
- [ ] User research validates approach
