-- =============================================
-- NIFTY50 Analytics - Database Repair & Setup
-- Run this ENTIRE file in your Supabase SQL Editor
-- =============================================

-- 1. Ensure extensions exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Users table if not exists (public.users)
CREATE TABLE IF NOT EXISTS public.users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  full_name   TEXT,
  avatar_url  TEXT,
  plan        TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free','pro')),
  is_admin    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 4. Re-create Policies (To avoid errors, we drop first if you have them)
DROP POLICY IF EXISTS "users_select_own" ON public.users;
DROP POLICY IF EXISTS "users_insert_own" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;

CREATE POLICY "users_select_own" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_insert_own" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "users_update_own" ON public.users FOR UPDATE USING (auth.uid() = id);

-- 5. Trigger to handle NEW users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER SECURITY DEFINER LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, plan, is_admin)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'free',
    FALSE
  )
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = COALESCE(public.users.full_name, EXCLUDED.full_name);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. CRITICAL: Backfill existing users (If they signed up before the trigger)
INSERT INTO public.users (id, email, full_name, plan, is_admin)
SELECT 
  id, 
  email, 
  COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1)), 
  'free', 
  FALSE
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 7. Other Tables (Watchlist & Alerts)
CREATE TABLE IF NOT EXISTS public.watchlists (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id   UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  symbol    TEXT NOT NULL,
  added_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, symbol)
);

CREATE TABLE IF NOT EXISTS public.alerts (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  symbol        TEXT NOT NULL,
  condition     TEXT NOT NULL CHECK (condition IN ('above','below','percent_change')),
  target_value  NUMERIC NOT NULL,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  triggered_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.watchlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "watchlists_own" ON public.watchlists;
CREATE POLICY "watchlists_own" ON public.watchlists FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "alerts_own" ON public.alerts;
CREATE POLICY "alerts_own" ON public.alerts FOR ALL USING (auth.uid() = user_id);

-- 8. Newsletter (Mailing List)
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email       TEXT UNIQUE NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anyone_can_subscribe" ON public.newsletter_subscribers;
CREATE POLICY "anyone_can_subscribe" ON public.newsletter_subscribers FOR INSERT WITH CHECK (true);

-- 9. Success Message
SELECT 'Database synced successfully! Refresh your app.' AS status;
