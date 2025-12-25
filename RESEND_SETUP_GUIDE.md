# Resend Email Setup Guide

## Step 1: Create Resend Account ✅ (Do this first)

1. Go to: https://resend.com
2. Sign up with your email
3. Verify your email
4. Get your API Key:
   - Dashboard → API Keys
   - Click "Create API Key"
   - Name: "password-reset"
   - Copy the key (starts with `re_...`)
   - **Save it somewhere safe!**

---

## Step 2: Install Supabase CLI

**Check if already installed:**
```bash
supabase --version
```

**If not installed, install it:**

### Windows (using npm):
```bash
npm install -g supabase
```

### Or using Scoop:
```bash
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

---

## Step 3: Link Your Supabase Project

```bash
cd /c/Projects/site_progress_tracker
supabase login
```

This will open a browser for authentication.

After login:
```bash
supabase link --project-ref imylwwjaannqcbcquelv
```

When prompted for database password, use the password from `Supabase DB Password - sit.txt`

---

## Step 4: Set Resend API Key as Secret

```bash
supabase secrets set RESEND_API_KEY=re_YOUR_API_KEY_HERE
```

Replace `re_YOUR_API_KEY_HERE` with your actual Resend API key.

---

## Step 5: Deploy Edge Function

```bash
supabase functions deploy send-reset-email
```

This will deploy the function to Supabase.

---

## Step 6: Verify Deployment

1. Go to Supabase Dashboard: https://supabase.com/dashboard
2. Select project: **site-progress-tracker**
3. Click **Edge Functions** in sidebar
4. You should see: `send-reset-email` with status "Active"

---

## Step 7: Test Edge Function (Optional)

Test from command line:
```bash
curl -i --location --request POST 'https://imylwwjaannqcbcquelv.supabase.co/functions/v1/send-reset-email' \
  --header 'Authorization: Bearer YOUR_SUPABASE_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"email":"your-email@example.com","token":"test-token","resetLink":"myapp://reset-password?token=test"}'
```

Replace:
- `YOUR_SUPABASE_ANON_KEY` with your anon key from `.env`
- `your-email@example.com` with your actual email

You should receive a test email!

---

## Troubleshooting

### Error: "RESEND_API_KEY is not set"
- Make sure you ran: `supabase secrets set RESEND_API_KEY=...`
- Redeploy the function after setting secrets

### Error: "Failed to send email"
- Check Resend API key is correct
- Check email address is valid
- Check Resend dashboard for error details

### Error: "supabase command not found"
- Install Supabase CLI (see Step 2)
- Restart terminal after installation

---

## Next Steps

After deployment succeeds, we'll update the React Native app to call this Edge Function instead of logging to console.
