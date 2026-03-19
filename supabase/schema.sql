-- =============================================
-- NIFTY50 Analytics - Complete Schema
-- Run this ENTIRE file in Supabase SQL Editor
-- Dashboard → SQL Editor → New Query → Paste → Run
-- =============================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Drop existing tables (clean slate) ────
DROP TABLE IF EXISTS public.stock_prices   CASCADE;
DROP TABLE IF EXISTS public.watchlists     CASCADE;
DROP TABLE IF EXISTS public.alerts         CASCADE;
DROP TABLE IF EXISTS public.subscriptions  CASCADE;
DROP TABLE IF EXISTS public.users          CASCADE;

-- ─── Users ─────────────────────────────────
CREATE TABLE public.users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  full_name   TEXT,
  avatar_url  TEXT,
  plan        TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free','pro')),
  is_admin    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Watchlists ─────────────────────────────
CREATE TABLE public.watchlists (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id   UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  symbol    TEXT NOT NULL,
  added_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, symbol)
);

-- ─── Alerts ─────────────────────────────────
CREATE TABLE public.alerts (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  symbol        TEXT NOT NULL,
  condition     TEXT NOT NULL CHECK (condition IN ('above','below','percent_change')),
  target_value  NUMERIC NOT NULL,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  triggered_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Subscriptions ──────────────────────────
CREATE TABLE public.subscriptions (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                 UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  stripe_customer_id      TEXT,
  stripe_subscription_id  TEXT UNIQUE,
  plan                    TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free','pro')),
  status                  TEXT NOT NULL DEFAULT 'active',
  current_period_end      TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Indexes ────────────────────────────────
CREATE INDEX idx_watchlists_user ON public.watchlists(user_id);
CREATE INDEX idx_alerts_user     ON public.alerts(user_id);
CREATE INDEX idx_alerts_symbol   ON public.alerts(symbol);
CREATE INDEX idx_alerts_active   ON public.alerts(is_active) WHERE is_active = TRUE;

-- ─── RLS ────────────────────────────────────
ALTER TABLE public.users         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watchlists    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Users policies
-- Stable recursion-free baseline.
-- Only allows users to manage their own records. Physically impossible to loop.
CREATE POLICY "users_self_secure" ON public.users FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Admin access: For now, we use a metadata check if needed, but keeping it simple for stability.
-- CREATE POLICY "admin_view" ON public.users FOR SELECT USING ((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true);

-- ─── Admin Check Function ──────────────────
-- Queries auth.users metadata to ensure zero recursion on the public table.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN SECURITY DEFINER STABLE AS $$
BEGIN
  RETURN COALESCE((SELECT (raw_user_meta_data->>'is_admin')::boolean FROM auth.users WHERE id = auth.uid()), false);
END;
$$ LANGUAGE plpgsql;

-- Watchlists policies
CREATE POLICY "watchlists_own" ON public.watchlists FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Alerts policies
CREATE POLICY "alerts_own" ON public.alerts FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Subscriptions policies
CREATE POLICY "subscriptions_own" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);

-- ─── Auto-create user profile on signup ─────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, plan, is_admin)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)),
    'free',
    FALSE
  )
  ON CONFLICT (id) DO UPDATE
    SET email     = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, public.users.full_name),
        updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── Updated_at trigger ──────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── Make yourself admin ─────────────────────
-- Run this separately after signing up:
-- UPDATE public.users SET is_admin = TRUE WHERE email = 'your@email.com';

SELECT 'Schema created successfully ✅' AS status;
