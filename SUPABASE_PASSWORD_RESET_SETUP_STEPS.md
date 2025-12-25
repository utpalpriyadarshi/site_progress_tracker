# Supabase Password Reset Setup Steps

## Step 1: Create Database Table (DO THIS NOW)

1. Open Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: **site-progress-tracker**
3. Click **SQL Editor** in the left sidebar
4. Click **New query**
5. Copy and paste the contents of `supabase_password_reset_setup.sql`
6. Click **Run** button
7. You should see "Table created successfully!" message
8. Verify by going to **Table Editor** → you should see `password_reset_tokens` table

**IMPORTANT**: Please complete this step before proceeding!

---

## Step 2: Set Up Email Service (Resend) - WE'LL DO THIS NEXT

1. Go to https://resend.com
2. Sign up for free account
3. Verify your email
4. Get your API key from the dashboard
5. Add your sending domain (or use resend.dev for testing)

**Free tier**: 3,000 emails/month, 100 emails/day

---

## Step 3: Create Supabase Edge Function - WE'LL DO THIS AFTER STEP 2

We'll use Supabase CLI to deploy the Edge Function for sending emails.

---

## Current Status

- [ ] Step 1: Create database table ← **DO THIS NOW**
- [ ] Step 2: Set up Resend account
- [ ] Step 3: Create Edge Function
- [ ] Step 4: Implement PasswordResetService
- [ ] Step 5: Update UI screens
- [ ] Step 6: Test end-to-end flow

---

## After You Complete Step 1

Please confirm:
1. "Table created successfully" message appeared
2. You can see `password_reset_tokens` table in Table Editor

Then I'll proceed with the next steps!
