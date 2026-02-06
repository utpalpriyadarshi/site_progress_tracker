 The Edge Function for sending emails requires setup. Here's what needs to
   be done:                                                                
                                                                             Edge Function Setup Required                                             
                                                                             1. Deploy the Edge Function

  The send-reset-email function must be deployed to Supabase:

  # Install Supabase CLI if not already
  npm install -g supabase

  # Login to Supabase
  supabase login

  # Link to your project (get project-ref from Supabase dashboard URL)     
  supabase link --project-ref YOUR_PROJECT_REF

  # Deploy the function
  supabase functions deploy send-reset-email

  2. Set the RESEND_API_KEY

  The function uses https://resend.com for email delivery:  

  1. Create a free account at https://resend.com
  2. Get your API key from Resend dashboard
  3. Set it in Supabase:

  supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxxxxxx

  Or via Supabase Dashboard:
  - Go to Project Settings → Edge Functions → Manage Secrets
  - Add RESEND_API_KEY with your Resend API key

  3. Fix Security Advisor Issues

  You mentioned 3 errors and 1 warning in Security Advisor. Common issues: 
  Issue: RLS not enabled
  Fix: Run: ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
  ────────────────────────────────────────
  Issue: No RLS policies
  Fix: Add appropriate SELECT/INSERT/UPDATE policies
  ────────────────────────────────────────
  Issue: Leaked service key
  Fix: Rotate keys in Project Settings
  ────────────────────────────────────────
  Issue: Weak password policy
  Fix: Enable in Auth settings
  ---
  Note: The password reset token was created successfully. Even without the
   email, you can test the reset flow manually by:
  1. Checking the password_reset_tokens table in Supabase
  2. Using the token directly with the reset link format:
  myapp://reset-password?token=TOKEN&email=EMAIL

  Would you like me to help set up an alternative that works without Resend
   (like logging the reset link for now)?