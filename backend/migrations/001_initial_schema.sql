-- Migration 001: Initial Schema
-- Phase 2 — User profiles, subscriptions, audit log
-- Apply this migration in Supabase SQL Editor

-- ============================================================================
-- 1. Helper Functions
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 2. profiles table
-- ============================================================================

CREATE TABLE profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name  TEXT,
  age_confirmed_at TIMESTAMPTZ NOT NULL,  -- Age gate confirmation timestamp
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger to auto-update updated_at
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Index for common queries
CREATE INDEX idx_profiles_created_at ON profiles(created_at DESC);

-- RLS Policies for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY profiles_select_own
  ON profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Users can insert their own profile (on signup)
CREATE POLICY profiles_insert_own
  ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY profiles_update_own
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================================================
-- 3. subscription_plans table
-- ============================================================================

CREATE TABLE subscription_plans (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  stripe_price_id  TEXT NOT NULL UNIQUE,
  price_gbp        INTEGER NOT NULL,  -- Price in pence (e.g., 1000 = £10.00)
  interval         TEXT NOT NULL CHECK (interval IN ('month', 'year')),
  features         JSONB DEFAULT '[]'::jsonb,
  is_active        BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER subscription_plans_updated_at
  BEFORE UPDATE ON subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_subscription_plans_active ON subscription_plans(is_active) WHERE is_active = true;

-- No RLS on subscription_plans (public read for pricing page)

-- ============================================================================
-- 4. subscriptions table
-- ============================================================================

CREATE TABLE subscriptions (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan_id                  UUID NOT NULL REFERENCES subscription_plans(id),
  stripe_customer_id       TEXT NOT NULL,
  stripe_subscription_id   TEXT NOT NULL UNIQUE,
  status                   TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'incomplete', 'trialing')),
  current_period_start     TIMESTAMPTZ,
  current_period_end       TIMESTAMPTZ,
  cancel_at_period_end     BOOLEAN NOT NULL DEFAULT false,
  canceled_at              TIMESTAMPTZ,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Indexes for common queries
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_stripe_subscription ON subscriptions(stripe_subscription_id);

-- Unique constraint: one active subscription per user
CREATE UNIQUE INDEX idx_subscriptions_user_active 
  ON subscriptions(user_id) 
  WHERE status = 'active';

-- RLS Policies for subscriptions
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can only read their own subscriptions (no writes)
CREATE POLICY subscriptions_select_own
  ON subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users cannot INSERT, UPDATE, or DELETE subscriptions
-- (all writes happen server-side with service-role key)

-- ============================================================================
-- 5. stripe_webhook_events table
-- ============================================================================

CREATE TABLE stripe_webhook_events (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id  TEXT NOT NULL UNIQUE,  -- Idempotency key
  event_type       TEXT NOT NULL,
  processed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  payload          JSONB,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_stripe_webhook_events_stripe_id ON stripe_webhook_events(stripe_event_id);
CREATE INDEX idx_stripe_webhook_events_type ON stripe_webhook_events(event_type);
CREATE INDEX idx_stripe_webhook_events_created ON stripe_webhook_events(created_at DESC);

-- No RLS (backend-only access)

-- ============================================================================
-- 6. audit_log table
-- ============================================================================

CREATE TABLE audit_log (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES profiles(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('signup', 'login', 'subscribe', 'cancel', 'delete_account')),
  metadata   JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_event_type ON audit_log(event_type);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at DESC);

-- No RLS (backend-only access, zero user access)

-- ============================================================================
-- 7. Seed Data — Subscription Plans
-- ============================================================================

-- Founding Member Plan (£10/month)
-- Replace 'price_FOUNDING_MEMBER_PLACEHOLDER' with your actual Stripe price ID
INSERT INTO subscription_plans (name, stripe_price_id, price_gbp, interval, features, is_active)
VALUES (
  'Founding Member',
  'price_FOUNDING_MEMBER_PLACEHOLDER',  -- Replace with actual Stripe price ID
  1000,  -- £10.00
  'month',
  '["Full access to Archive", "All audio tracks", "Interactive timeline", "Early access to new features"]'::jsonb,
  true
);

-- ============================================================================
-- Migration Complete
-- ============================================================================

COMMENT ON TABLE profiles IS 'User profiles extending auth.users';
COMMENT ON TABLE subscription_plans IS 'Available subscription tiers';
COMMENT ON TABLE subscriptions IS 'User subscription records linked to Stripe';
COMMENT ON TABLE stripe_webhook_events IS 'Webhook idempotency tracking';
COMMENT ON TABLE audit_log IS 'Append-only compliance event log (server-side only)';
