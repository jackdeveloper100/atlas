-- Migration 004: Admin Role and Audit Logging Extensions
-- Phase 7 — Admin System

-- 1. Add role column to profiles table with default 'user'
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin'));

-- Index role column for fast server-side admin check queries
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- 2. Update audit_log event_type check constraint to preserve existing types and include admin events
ALTER TABLE audit_log DROP CONSTRAINT IF EXISTS audit_log_event_type_check;
ALTER TABLE audit_log ADD CONSTRAINT audit_log_event_type_check 
  CHECK (event_type IN (
    'signup', 
    'login', 
    'subscribe', 
    'cancel', 
    'delete_account', 
    'reset_password', 
    'update_password', 
    'update_profile',
    'admin_role_change',
    'admin_snapshot_toggle',
    'admin_library_toggle'
  ));

COMMENT ON COLUMN profiles.role IS 'User access role: user (default) or admin';
