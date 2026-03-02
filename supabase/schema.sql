-- Quietude Supabase Schema
-- Run this in your Supabase SQL Editor to set up the database

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- PROFILES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  study_field TEXT,
  learn_style TEXT,
  study_time TEXT,
  is_onboarded BOOLEAN DEFAULT false,
  theme_mood TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for email lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- =====================================================
-- OTP CODES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.otp_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  verified BOOLEAN DEFAULT false,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for email lookups
CREATE INDEX IF NOT EXISTS idx_otp_codes_email ON public.otp_codes(email);

-- Auto-delete expired OTPs (run daily via pg_cron or Edge Function)
-- DELETE FROM public.otp_codes WHERE expires_at < now();

-- =====================================================
-- LEARNING PATHS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.learning_paths (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT,
  subject TEXT NOT NULL,
  education_level TEXT,
  topic_type TEXT,
  source_type TEXT,
  source_url TEXT,
  source_text TEXT,
  source_file_name TEXT,
  topic_map JSONB,
  topics JSONB DEFAULT '[]',
  needs_study_plan BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active',
  current_topic_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_learning_paths_user_id ON public.learning_paths(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_paths_status ON public.learning_paths(status);

-- =====================================================
-- QUIZ SESSIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.quiz_sessions (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  topic_id TEXT NOT NULL,
  path_id TEXT REFERENCES public.learning_paths(id) ON DELETE CASCADE,
  subject TEXT,
  is_dig_deeper BOOLEAN DEFAULT false,
  is_retake BOOLEAN DEFAULT false,
  config JSONB NOT NULL DEFAULT '{}',
  questions JSONB NOT NULL DEFAULT '[]',
  answers JSONB DEFAULT '[]',
  score INTEGER,
  total INTEGER NOT NULL DEFAULT 0,
  score_pct INTEGER,
  passed BOOLEAN,
  started_at TIMESTAMPTZ NOT NULL,
  submitted_at TIMESTAMPTZ,
  time_taken_secs INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_user_id ON public.quiz_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_path_id ON public.quiz_sessions(path_id);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_topic_id ON public.quiz_sessions(topic_id);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_submitted_at ON public.quiz_sessions(submitted_at);

-- =====================================================
-- NOTES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.notes (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  topic_id TEXT NOT NULL,
  topic_title TEXT NOT NULL,
  subject TEXT NOT NULL,
  content_html TEXT NOT NULL,
  session_id TEXT REFERENCES public.quiz_sessions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON public.notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_topic_id ON public.notes(topic_id);
CREATE INDEX IF NOT EXISTS idx_notes_subject ON public.notes(subject);

-- =====================================================
-- USER SESSIONS TABLE (for auth)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  device_info TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_active_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON public.user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON public.user_sessions(expires_at);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
-- Note: For custom auth, we use a more permissive policy
-- In production, you'd want tighter control based on your auth mechanism
CREATE POLICY "Enable all operations for profiles" ON public.profiles
  FOR ALL USING (true) WITH CHECK (true);

-- OTP codes policies (public access for signup/login)
CREATE POLICY "Enable all operations for otp_codes" ON public.otp_codes
  FOR ALL USING (true) WITH CHECK (true);

-- Learning paths policies
CREATE POLICY "Enable all operations for learning_paths" ON public.learning_paths
  FOR ALL USING (true) WITH CHECK (true);

-- Quiz sessions policies
CREATE POLICY "Enable all operations for quiz_sessions" ON public.quiz_sessions
  FOR ALL USING (true) WITH CHECK (true);

-- Notes policies
CREATE POLICY "Enable all operations for notes" ON public.notes
  FOR ALL USING (true) WITH CHECK (true);

-- User sessions policies
CREATE POLICY "Enable all operations for user_sessions" ON public.user_sessions
  FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to relevant tables
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_learning_paths_updated_at ON public.learning_paths;
CREATE TRIGGER update_learning_paths_updated_at
  BEFORE UPDATE ON public.learning_paths
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_notes_updated_at ON public.notes;
CREATE TRIGGER update_notes_updated_at
  BEFORE UPDATE ON public.notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to clean up expired sessions and OTPs
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
DECLARE
  deleted_sessions INTEGER;
  deleted_otps INTEGER;
BEGIN
  -- Delete expired sessions and count
  WITH deleted AS (
    DELETE FROM public.user_sessions WHERE expires_at < now() RETURNING 1
  )
  SELECT COUNT(*) INTO deleted_sessions FROM deleted;
  
  -- Delete expired OTPs and count
  WITH deleted AS (
    DELETE FROM public.otp_codes WHERE expires_at < now() RETURNING 1
  )
  SELECT COUNT(*) INTO deleted_otps FROM deleted;
  
  -- Log cleanup results (visible in Supabase logs)
  RAISE NOTICE 'Cleanup completed: % sessions, % OTPs deleted', deleted_sessions, deleted_otps;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SCHEDULED CLEANUP (pg_cron)
-- =====================================================
-- To enable automatic cleanup, run this in Supabase SQL Editor:
-- 
-- 1. First, enable pg_cron extension (requires Supabase Pro plan or self-hosted):
--    CREATE EXTENSION IF NOT EXISTS pg_cron;
--
-- 2. Schedule the cleanup to run every hour:
--    SELECT cron.schedule(
--      'cleanup-expired-auth',           -- job name
--      '0 * * * *',                       -- every hour at minute 0
--      'SELECT cleanup_expired_sessions()'
--    );
--
-- 3. To verify the job was created:
--    SELECT * FROM cron.job;
--
-- 4. To remove the job if needed:
--    SELECT cron.unschedule('cleanup-expired-auth');
--
-- Alternative: If pg_cron is not available, call this function from:
-- - A Supabase Edge Function on a schedule
-- - An external cron job via Supabase REST API
-- - Manually: SELECT cleanup_expired_sessions();

-- =====================================================
-- GRANTS
-- =====================================================
-- Grant access to authenticated and anon roles
GRANT ALL ON public.profiles TO anon, authenticated;
GRANT ALL ON public.otp_codes TO anon, authenticated;
GRANT ALL ON public.learning_paths TO anon, authenticated;
GRANT ALL ON public.quiz_sessions TO anon, authenticated;
GRANT ALL ON public.notes TO anon, authenticated;
GRANT ALL ON public.user_sessions TO anon, authenticated;
