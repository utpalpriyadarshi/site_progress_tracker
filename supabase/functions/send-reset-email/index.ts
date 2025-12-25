// Supabase Edge Function to send password reset emails via Resend
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, token, resetLink } = await req.json()

    console.log('Sending password reset email to:', email)

    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not set')
    }

    // Send email via Resend API
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Site Progress Tracker <noreply@resend.dev>',
        to: [email],
        subject: 'Reset Your Password - Site Progress Tracker',
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background-color: #2196f3; padding: 40px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Site Progress Tracker</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">Reset Your Password</h2>

              <p style="color: #666666; font-size: 16px; line-height: 24px; margin: 0 0 20px 0;">
                We received a request to reset your password for your Site Progress Tracker account.
              </p>

              <p style="color: #666666; font-size: 16px; line-height: 24px; margin: 0 0 30px 0;">
                Click the button below to reset your password:
              </p>

              <!-- Reset Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${resetLink}" style="display: inline-block; background-color: #2196f3; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 4px; font-size: 16px; font-weight: bold;">Reset Password</a>
                  </td>
                </tr>
              </table>

              <p style="color: #999999; font-size: 14px; line-height: 20px; margin: 30px 0 0 0;">
                Or copy and paste this link into your browser:
              </p>

              <p style="color: #2196f3; font-size: 14px; word-break: break-all; margin: 10px 0 0 0;">
                ${resetLink}
              </p>

              <!-- Security Notice -->
              <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 30px 0;">
                <p style="color: #856404; font-size: 14px; margin: 0;">
                  <strong>⚠️ Security Notice:</strong>
                </p>
                <ul style="color: #856404; font-size: 14px; margin: 10px 0 0 0; padding-left: 20px;">
                  <li>This link will expire in <strong>1 hour</strong></li>
                  <li>The link can only be used <strong>once</strong></li>
                  <li>If you didn't request this reset, please ignore this email</li>
                </ul>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f8f8; padding: 30px; text-align: center; border-top: 1px solid #eeeeee;">
              <p style="color: #999999; font-size: 14px; margin: 0 0 10px 0;">
                This email was sent by Site Progress Tracker
              </p>
              <p style="color: #999999; font-size: 12px; margin: 0;">
                If you didn't request a password reset, you can safely ignore this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      console.error('Resend API error:', data)
      throw new Error(data.message || 'Failed to send email')
    }

    console.log('Email sent successfully:', data)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Password reset email sent successfully',
        emailId: data.id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error sending email:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to send email'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})
