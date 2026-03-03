-- Add new columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS theme text DEFAULT 'lt-classic';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verification_request text DEFAULT '';
