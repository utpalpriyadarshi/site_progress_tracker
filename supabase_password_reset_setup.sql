-- ============================================
-- Password Reset Tokens Table Setup
-- Execute this in Supabase SQL Editor
-- ============================================

-- 1. Create password_reset_tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_email_unused ON password_reset_tokens(email, used);
CREATE INDEX IF NOT EXISTS idx_expires_at ON password_reset_tokens(expires_at);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies if they exist (for re-running script)
DROP POLICY IF EXISTS "Allow insert tokens" ON password_reset_tokens;
DROP POLICY IF EXISTS "Allow select tokens" ON password_reset_tokens;
DROP POLICY IF EXISTS "Allow update tokens" ON password_reset_tokens;

-- 5. Create RLS policies
-- Allow insert for anyone (app uses anon key)
CREATE POLICY "Allow insert tokens" ON password_reset_tokens
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Allow select for token validation
CREATE POLICY "Allow select tokens" ON password_reset_tokens
  FOR SELECT TO anon, authenticated
  USING (true);

-- Allow update to mark as used
CREATE POLICY "Allow update tokens" ON password_reset_tokens
  FOR UPDATE TO anon, authenticated
  USING (true);

-- 6. Create function to clean up expired tokens (run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS void AS $$
BEGIN
  DELETE FROM password_reset_tokens
  WHERE expires_at < now() OR (used = true AND created_at < now() - INTERVAL '7 days');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Verify table creation
SELECT 'Table created successfully!' as status;
SELECT * FROM password_reset_tokens LIMIT 1;
