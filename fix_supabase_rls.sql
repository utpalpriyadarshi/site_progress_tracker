-- Fix RLS issue for password_reset_tokens table
-- Run this in Supabase SQL Editor

-- Option 1: Disable RLS entirely (simplest fix)
ALTER TABLE password_reset_tokens DISABLE ROW LEVEL SECURITY;

-- Option 2: If you want to keep RLS enabled, run these policies:
-- DROP POLICY IF EXISTS "Allow all operations" ON password_reset_tokens;
-- CREATE POLICY "Allow all operations" ON password_reset_tokens
--   FOR ALL
--   USING (true)
--   WITH CHECK (true);

-- Verify the table is accessible
SELECT COUNT(*) FROM password_reset_tokens;
