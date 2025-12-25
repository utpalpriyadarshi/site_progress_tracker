# Password Reset Email Edge Function

This Supabase Edge Function sends password reset emails using the Resend API.

## TypeScript Errors in IDE

**Note:** You may see TypeScript errors in VS Code for Deno imports. These are IDE-only warnings and do not affect the function's execution. The function works perfectly when deployed to Supabase's Deno runtime.

Common IDE errors (can be ignored):
- `Cannot find module 'https://deno.land/std@0.168.0/http/server.ts'`
- These are due to VS Code not recognizing Deno's URL imports

## Configuration

The function requires the following environment variable in Supabase:
- `RESEND_API_KEY` - Your Resend API key

## Deployment

Deploy to Supabase:
```bash
supabase functions deploy send-reset-email
```

Set the environment variable:
```bash
supabase secrets set RESEND_API_KEY=your_api_key_here
```

## Usage

The function accepts a POST request with:
```json
{
  "email": "user@example.com",
  "token": "uuid-token",
  "resetLink": "myapp://reset-password?token=xxx&email=yyy"
}
```

Returns:
```json
{
  "success": true,
  "message": "Password reset email sent successfully",
  "emailId": "resend-email-id"
}
```
