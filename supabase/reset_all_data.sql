-- =====================================================
-- RESET ALL USER DATA FROM SUPABASE
-- =====================================================
-- Run this in your Supabase SQL Editor to delete ALL user data
-- WARNING: This is IRREVERSIBLE! Make sure you want to do this.
-- 
-- Order matters due to foreign key constraints:
-- 1. Delete child tables first (notes, quiz_sessions, learning_paths, user_sessions, otp_codes)
-- 2. Delete profiles last (parent table)
-- 3. Delete Supabase Auth accounts (auth.users)
--
-- Run this BEFORE deploying new code to ensure fresh start
-- =====================================================

-- =====================================================
-- STEP 1: DELETE ALL APP DATA (run this section)
-- =====================================================

-- Delete all notes (depends on quiz_sessions and profiles)
DELETE FROM public.notes;

-- Delete all quiz sessions (depends on learning_paths and profiles)
DELETE FROM public.quiz_sessions;

-- Delete all learning paths (depends on profiles)
DELETE FROM public.learning_paths;

-- Delete all user sessions (auth sessions)
DELETE FROM public.user_sessions;

-- Delete all OTP codes
DELETE FROM public.otp_codes;

-- Delete all profiles (parent table - delete last)
DELETE FROM public.profiles;

-- Delete all Supabase Auth accounts (removes actual user accounts)
DELETE FROM auth.users;

-- =====================================================
-- VERIFICATION QUERIES
-- Run these after the deletes to confirm all data is gone
-- =====================================================

-- Should all return 0 rows:
SELECT 'profiles' as table_name, COUNT(*) as count FROM public.profiles
UNION ALL
SELECT 'otp_codes', COUNT(*) FROM public.otp_codes
UNION ALL
SELECT 'learning_paths', COUNT(*) FROM public.learning_paths
UNION ALL
SELECT 'quiz_sessions', COUNT(*) FROM public.quiz_sessions
UNION ALL
SELECT 'notes', COUNT(*) FROM public.notes
UNION ALL
SELECT 'user_sessions', COUNT(*) FROM public.user_sessions
UNION ALL
SELECT 'auth.users', COUNT(*) FROM auth.users;

-- =====================================================
-- ALTERNATIVE: TRUNCATE (faster, but requires more privileges)
-- This also resets auto-increment counters
-- =====================================================
-- TRUNCATE public.notes CASCADE;
-- TRUNCATE public.quiz_sessions CASCADE;
-- TRUNCATE public.learning_paths CASCADE;
-- TRUNCATE public.user_sessions CASCADE;
-- TRUNCATE public.otp_codes CASCADE;
-- TRUNCATE public.profiles CASCADE;
