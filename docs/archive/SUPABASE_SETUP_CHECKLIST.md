# Supabase Setup - Step-by-Step Checklist

**Date Started**: 2025-12-23
**Status**: In Progress
**Estimated Time**: 2-3 hours

---

## Progress Tracker

- [ ] **Step 1**: Create Supabase Account (5 min)
- [ ] **Step 2**: Create New Project (5 min)
- [ ] **Step 3**: Save Project Credentials (5 min)
- [ ] **Step 4**: Configure Email Authentication (10 min)
- [ ] **Step 5**: Customize Email Templates (15 min)
- [ ] **Step 6**: Configure Redirect URLs (10 min)
- [ ] **Step 7**: Install Dependencies (15 min)
- [ ] **Step 8**: Create Environment Configuration (10 min)
- [ ] **Step 9**: Verify Supabase Connection (20 min)

---

## STEP 1: Create Supabase Account

### Actions:
1. Open browser and go to: https://supabase.com
2. Click "Start your project" button (green button in top right)
3. Choose sign-up method:
   - **Recommended**: "Continue with GitHub" (easier account management)
   - Alternative: "Continue with Email"

### If using GitHub:
4. Authorize Supabase to access your GitHub account
5. Complete any 2FA if prompted

### If using Email:
4. Enter email address
5. Create strong password
6. Verify email (check inbox for verification link)

### Verification Checkpoint:
- [ ] Successfully logged into Supabase dashboard
- [ ] Can see "New Project" or "Organizations" screen
- [ ] Email verified (if using email signup)

### Error Check:
**Problem**: Email verification link not received
**Solution**:
- Check spam folder
- Wait 2-3 minutes
- Click "Resend verification email"

**Problem**: GitHub authorization fails
**Solution**:
- Ensure you're logged into GitHub
- Try email signup instead
- Clear browser cache and try again

---

## STEP 2: Create New Supabase Project

### Actions:
1. From dashboard, click "New Project" (or "+ New Project")
2. If prompted, create an Organization first:
   - Organization name: "Site Progress Tracker" (or your company name)
   - Click "Create organization"

3. Fill in project details:
   ```
   Name: site-progress-tracker
   Database Password: [GENERATE STRONG PASSWORD]
   Region: [Choose closest to your users]
   Pricing Plan: Free
   ```

4. **IMPORTANT**: Copy and save the database password NOW
   - Open Notepad or text editor
   - Paste password
   - Label it: "Supabase DB Password - site-progress-tracker"
   - Save file securely

5. Click "Create new project"

6. Wait for project initialization (1-2 minutes)
   - You'll see a progress screen
   - Status will show "Setting up project..."
   - When ready, you'll see the project dashboard

### Verification Checkpoint:
- [ ] Project shows "Active" status
- [ ] Database password saved securely
- [ ] Can see project dashboard with navigation menu on left
- [ ] Project name shows "site-progress-tracker" in top left

### Error Check:
**Problem**: "Creating project" stuck for > 5 minutes
**Solution**:
- Refresh browser
- If still stuck, contact Supabase support (chat icon in bottom right)
- Try creating project with different name

**Problem**: Forgot to save database password
**Solution**:
- Go to Settings → Database
- Click "Reset Database Password"
- Save new password securely

---

## STEP 3: Save Project Credentials

### Actions:
1. In Supabase dashboard, click "Settings" (gear icon in left sidebar)
2. Click "API" in settings menu

3. You'll see these values - COPY EACH ONE:

   **Project URL**:
   ```
   URL: https://xxxxxxxxxxxxx.supabase.co
   ```
   Copy this entire URL

   **API Keys**:
   ```
   anon public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3...
   ```
   Copy the entire key (it's long!)

   **service_role key** (DO NOT share this!):
   ```
   service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3...
   ```
   Copy this too (keep it secret!)

4. Create credentials file:
   - Open text editor
   - Create file named: `SUPABASE_CREDENTIALS.txt`
   - Paste this template:

   ```
   ============================================
   SUPABASE CREDENTIALS - site-progress-tracker
   Created: 2025-12-23
   ============================================

   Project URL:
   [paste URL here]

   Anon/Public Key:
   [paste anon key here]

   Service Role Key (KEEP SECRET!):
   [paste service role key here]

   Database Password:
   [paste DB password from Step 2 here]

   ============================================
   IMPORTANT: Do NOT commit this file to Git!
   ============================================
   ```

5. Save file in project root directory: `C:\Projects\site_progress_tracker\SUPABASE_CREDENTIALS.txt`

6. Add to `.gitignore`:
   ```
   SUPABASE_CREDENTIALS.txt
   ```

### Verification Checkpoint:
- [ ] SUPABASE_CREDENTIALS.txt file created
- [ ] All 4 credentials saved (URL, anon key, service key, DB password)
- [ ] File added to .gitignore
- [ ] Can access credentials file when needed

### Error Check:
**Problem**: Can't find API keys
**Solution**:
- Ensure you're on Settings → API page
- Scroll down - keys are in "Project API keys" section
- If missing, refresh browser

**Problem**: Keys look truncated
**Solution**:
- Click "Copy" button next to each key
- Don't manually select and copy (might miss characters)

---

## STEP 4: Configure Email Authentication

### Actions:
1. In Supabase dashboard, click "Authentication" (left sidebar)
2. Click "Providers" tab
3. Locate "Email" provider in the list

4. Verify these settings are ENABLED (green toggle):
   ```
   ✅ Enable Email provider
   ✅ Confirm email
   ✅ Secure email change
   ```

5. **Email Confirmation Settings**:
   - Double entry: OFF (for better UX)
   - Email OTP length: 6 (default)

6. **Advanced Settings** (scroll down):
   ```
   Minimum password length: 8
   Password requirements:
     ✅ Require uppercase letters
     ✅ Require lowercase letters
     ✅ Require numbers
     ⬜ Require special characters (optional)
   ```

7. Click "Save" at bottom right

### Verification Checkpoint:
- [ ] Email provider shows as "Enabled"
- [ ] "Confirm email" is ON
- [ ] Password requirements configured
- [ ] Changes saved (green success notification appears)

### Error Check:
**Problem**: Can't find "Email" in providers list
**Solution**:
- It should be first in the list
- Look for email icon 📧
- Refresh page if not visible

**Problem**: Save button doesn't work
**Solution**:
- Check for validation errors (red text)
- Ensure password length is 6-72 characters
- Try disabling browser extensions
- Refresh and try again

---

## STEP 5: Customize Email Templates

### Actions:
1. In Authentication section, click "Email Templates" tab
2. You'll see 4 templates:
   - Confirm signup
   - Magic Link
   - Change Email Address
   - **Reset Password** ← We'll customize this one

### Customize "Reset Password" Template:

3. Click on "Reset Password" template

4. Replace the template with this:

**Subject Line**:
```
Reset Your Password - Site Progress Tracker
```

**Email Body (HTML)**:
```html
<h2>Reset Your Password</h2>

<p>Hi there,</p>

<p>You requested to reset your password for <strong>Site Progress Tracker</strong>.</p>

<p>Click the button below to reset your password:</p>

<p style="text-align: center; margin: 30px 0;">
  <a href="{{ .ConfirmationURL }}"
     style="background-color: #2196F3;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 4px;
            display: inline-block;">
    Reset Password
  </a>
</p>

<p>Or copy and paste this link into your browser:</p>
<p style="word-break: break-all; color: #666;">{{ .ConfirmationURL }}</p>

<p><strong>This link expires in 1 hour.</strong></p>

<p>If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.</p>

<hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

<p style="color: #666; font-size: 12px;">
  Best regards,<br>
  Site Progress Tracker Team
</p>
```

5. Click "Save" button

### Optional: Customize "Confirm Signup" Template:

6. Click "Confirm signup" template

**Subject Line**:
```
Verify Your Email - Site Progress Tracker
```

**Email Body**:
```html
<h2>Welcome to Site Progress Tracker!</h2>

<p>Hi there,</p>

<p>Thank you for creating an account with Site Progress Tracker.</p>

<p>Click the button below to verify your email address:</p>

<p style="text-align: center; margin: 30px 0;">
  <a href="{{ .ConfirmationURL }}"
     style="background-color: #4CAF50;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 4px;
            display: inline-block;">
    Verify Email
  </a>
</p>

<p>Or copy and paste this link into your browser:</p>
<p style="word-break: break-all; color: #666;">{{ .ConfirmationURL }}</p>

<p><strong>This link expires in 24 hours.</strong></p>

<hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

<p style="color: #666; font-size: 12px;">
  Best regards,<br>
  Site Progress Tracker Team
</p>
```

7. Click "Save"

### Verification Checkpoint:
- [ ] Reset Password template customized
- [ ] Template includes company branding
- [ ] {{ .ConfirmationURL }} placeholder present
- [ ] Templates saved successfully
- [ ] Preview looks good (click "Preview" button to test)

### Error Check:
**Problem**: Template won't save
**Solution**:
- Ensure {{ .ConfirmationURL }} is present (required)
- Check for HTML syntax errors
- Remove any <script> tags (not allowed)
- Try copying template again

**Problem**: Preview shows broken HTML
**Solution**:
- Check all HTML tags are closed properly
- Verify no special characters in subject line
- Use simple HTML (tables, basic styling only)

---

## STEP 6: Configure Redirect URLs

### Actions:
1. Still in Authentication section, click "URL Configuration" tab

2. You'll see these fields:
   ```
   Site URL: [Your main website/app URL]
   Redirect URLs: [List of allowed redirect URLs]
   ```

3. Set **Site URL**:
   ```
   For development: http://localhost:19006
   For production: https://your-app-domain.com
   ```
   (Use development URL for now)

4. **Add Redirect URLs** (click "+ Add redirect URL" for each):
   ```
   myapp://reset-password
   myapp://auth-callback
   http://localhost:19006/reset-password
   http://localhost:19006/auth-callback
   http://localhost:3000/reset-password
   exp://127.0.0.1:19000/--/reset-password
   ```

   **Why these URLs?**
   - `myapp://` - Deep link scheme for mobile app
   - `localhost:19006` - Expo web development
   - `localhost:3000` - React web development
   - `exp://` - Expo Go app development

5. Click "Save" button

### Verification Checkpoint:
- [ ] Site URL configured
- [ ] At least 4 redirect URLs added
- [ ] All URLs saved without errors
- [ ] Green success notification appears

### Error Check:
**Problem**: Invalid URL format error
**Solution**:
- Ensure URLs start with http://, https://, or custom scheme (myapp://)
- No spaces in URLs
- Use correct port numbers

**Problem**: Too many redirect URLs error
**Solution**:
- Maximum is usually 100 URLs
- Remove duplicates
- Keep only necessary ones for now

---

## STEP 7: Install Supabase Dependencies

### Actions:
1. Open terminal/command prompt in project directory:
   ```bash
   cd C:\Projects\site_progress_tracker
   ```

2. Verify you're in correct directory:
   ```bash
   dir
   ```
   You should see: package.json, src folder, etc.

3. Install Supabase client:
   ```bash
   npm install @supabase/supabase-js
   ```

4. Wait for installation (30-60 seconds)

5. Install additional dependencies:
   ```bash
   npm install react-native-url-polyfill
   ```

6. Install AsyncStorage (for token persistence):
   ```bash
   npm install @react-native-async-storage/async-storage
   ```

7. Install environment variables handler:
   ```bash
   npm install react-native-dotenv
   ```

8. Install TypeScript types (if using TypeScript):
   ```bash
   npm install --save-dev @types/react-native-dotenv
   ```

### Verification Checkpoint:
- [ ] All npm install commands completed without errors
- [ ] package.json updated with new dependencies
- [ ] node_modules folder contains new packages
- [ ] No "WARN" or "ERR" messages in terminal

### Verify Installation:
Run this command:
```bash
npm list @supabase/supabase-js react-native-url-polyfill @react-native-async-storage/async-storage react-native-dotenv
```

Expected output should show all packages installed.

### Error Check:
**Problem**: `npm: command not found`
**Solution**:
- Install Node.js from https://nodejs.org
- Restart terminal after installation
- Verify: `node --version`

**Problem**: Permission denied / EACCES error
**Solution**:
- Windows: Run terminal as Administrator
- Mac/Linux: Use `sudo npm install ...`
- Or fix npm permissions: https://docs.npmjs.com/resolving-eacces-permissions-errors

**Problem**: Peer dependency warnings
**Solution**:
- Usually safe to ignore
- If concerned, run: `npm install --legacy-peer-deps`

**Problem**: Network timeout
**Solution**:
- Check internet connection
- Try: `npm cache clean --force`
- Retry installation

---

## STEP 8: Create Environment Configuration

### Actions:
1. Create `.env` file in project root:
   ```bash
   # In project root: C:\Projects\site_progress_tracker
   ```

2. Create new file named exactly: `.env` (note the dot at start)

3. Add this content (use YOUR credentials from Step 3):
   ```env
   # Supabase Configuration
   SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3...

   # DO NOT COMMIT THIS FILE TO GIT!
   ```

4. Replace the placeholder values with YOUR actual credentials from SUPABASE_CREDENTIALS.txt

5. Save the `.env` file

6. Update `.gitignore` to prevent committing secrets:
   ```
   # Add these lines to .gitignore
   .env
   .env.local
   .env.production
   SUPABASE_CREDENTIALS.txt
   ```

7. Configure react-native-dotenv:

   **Update babel.config.js**:
   ```javascript
   module.exports = function(api) {
     api.cache(true);
     return {
       presets: ['babel-preset-expo'],
       plugins: [
         // ... existing plugins ...
         [
           'module:react-native-dotenv',
           {
             moduleName: '@env',
             path: '.env',
             safe: false,
             allowUndefined: true,
           },
         ],
       ],
     };
   };
   ```

8. Create TypeScript declaration file (if using TypeScript):

   **Create `src/types/env.d.ts`**:
   ```typescript
   declare module '@env' {
     export const SUPABASE_URL: string;
     export const SUPABASE_ANON_KEY: string;
   }
   ```

### Verification Checkpoint:
- [ ] .env file created in project root
- [ ] Credentials pasted correctly (no extra spaces)
- [ ] .env added to .gitignore
- [ ] babel.config.js updated
- [ ] TypeScript declarations created (if applicable)

### Test Environment Variables:
Create test file `test-env.js`:
```javascript
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@env';

console.log('Supabase URL:', SUPABASE_URL);
console.log('Anon Key (first 20 chars):', SUPABASE_ANON_KEY?.substring(0, 20));
```

Run:
```bash
node test-env.js
```

Expected: Should print your URL and first 20 characters of key.

### Error Check:
**Problem**: .env file not found
**Solution**:
- Ensure file is named `.env` (with dot)
- Place in project root (same level as package.json)
- Check file isn't named `.env.txt` (Windows hides extensions)

**Problem**: Environment variables undefined
**Solution**:
- Restart Metro bundler: `npm start --reset-cache`
- Check babel.config.js syntax
- Ensure no typos in variable names

**Problem**: babel.config.js error
**Solution**:
- Check all brackets are closed
- Ensure commas between array items
- Validate JSON structure

---

## STEP 9: Verify Supabase Connection

### Actions:
1. Create test service file: `src/services/supabase/testConnection.ts`

2. Add this code:
   ```typescript
   import 'react-native-url-polyfill/auto';
   import AsyncStorage from '@react-native-async-storage/async-storage';
   import { createClient } from '@supabase/supabase-js';
   import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@env';

   export async function testSupabaseConnection() {
     console.log('🧪 Testing Supabase connection...');
     console.log('URL:', SUPABASE_URL);
     console.log('Key (first 20):', SUPABASE_ANON_KEY?.substring(0, 20));

     try {
       // Create Supabase client
       const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
         auth: {
           storage: AsyncStorage,
           autoRefreshToken: true,
           persistSession: true,
           detectSessionInUrl: false,
         },
       });

       console.log('✅ Supabase client created');

       // Test connection by checking auth state
       const { data: { session }, error } = await supabase.auth.getSession();

       if (error) {
         console.error('❌ Error getting session:', error.message);
         return false;
       }

       console.log('✅ Connection successful!');
       console.log('Current session:', session ? 'Logged in' : 'Not logged in');

       return true;
     } catch (error) {
       console.error('❌ Connection failed:', error);
       return false;
     }
   }
   ```

3. Add test to App.tsx (temporary):
   ```typescript
   import { testSupabaseConnection } from './src/services/supabase/testConnection';

   // In your component:
   useEffect(() => {
     testSupabaseConnection();
   }, []);
   ```

4. Run the app:
   ```bash
   npm start
   ```

5. Check console output

### Expected Console Output:
```
🧪 Testing Supabase connection...
URL: https://xxxxxxxxxxxxx.supabase.co
Key (first 20): eyJhbGciOiJIUzI1NiIs
✅ Supabase client created
✅ Connection successful!
Current session: Not logged in
```

### Verification Checkpoint:
- [ ] Test file created
- [ ] App runs without errors
- [ ] Console shows "✅ Connection successful!"
- [ ] No error messages in console
- [ ] Supabase URL printed correctly

### Error Check:
**Problem**: "Invalid API key" error
**Solution**:
- Verify SUPABASE_ANON_KEY in .env is complete
- No extra spaces or line breaks in key
- Restart Metro: `npm start --reset-cache`
- Re-copy key from Supabase dashboard

**Problem**: "fetch is not defined"
**Solution**:
- Ensure `react-native-url-polyfill/auto` imported
- Import must be at TOP of file (before createClient)
- Restart Metro bundler

**Problem**: AsyncStorage error
**Solution**:
- Verify @react-native-async-storage/async-storage installed
- Run: `npm install @react-native-async-storage/async-storage`
- For iOS: `cd ios && pod install`

**Problem**: Module '@env' not found
**Solution**:
- Restart Metro: `npm start --reset-cache`
- Verify babel.config.js has react-native-dotenv plugin
- Check .env file exists in project root
- Restart IDE (VS Code)

---

## FINAL VERIFICATION CHECKLIST

Before proceeding to implementation:

- [ ] Supabase account created and verified
- [ ] Project "site-progress-tracker" is Active
- [ ] All credentials saved in SUPABASE_CREDENTIALS.txt
- [ ] Email authentication enabled
- [ ] Email templates customized
- [ ] Redirect URLs configured
- [ ] All npm packages installed
- [ ] .env file created with credentials
- [ ] .env added to .gitignore
- [ ] babel.config.js configured
- [ ] Test connection successful

---

## Next Steps

Once all checkboxes above are ✅:

1. **Remove test code** from App.tsx
2. **Delete** testConnection.ts (or keep for debugging)
3. **Proceed to** SUPABASE_EMAIL_RESET_IMPLEMENTATION.md
4. **Start with** Phase 4: Create Supabase Service

---

## Troubleshooting Contacts

**Supabase Issues**:
- Dashboard: https://supabase.com/dashboard
- Support: https://supabase.com/support
- Discord: https://discord.supabase.com

**React Native Issues**:
- Expo Discord: https://discord.gg/expo
- Stack Overflow: Tag [react-native] [supabase]

---

**Setup Status**: [ ] Complete | [ ] In Progress | [ ] Blocked

**Blocked By**: _________________________________

**Notes**: _________________________________
