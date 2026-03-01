# Database Schema

[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ecf8e?style=flat-square)](https://supabase.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?style=flat-square)](https://www.postgresql.org/)
[![RLS](https://img.shields.io/badge/Row_Level_Security-Enabled-green?style=flat-square)](https://supabase.com/docs/guides/auth/row-level-security)

Quietude uses **Supabase** (PostgreSQL) as its cloud database, implementing Row Level Security (RLS) for data isolation and secure multi-tenant access. This document details the complete database schema, relationships, and security policies.

---

## Table of Contents

- [Schema Overview](#schema-overview)
- [Entity Relationship Diagram](#entity-relationship-diagram)
- [Table Definitions](#table-definitions)
- [Row Level Security Policies](#row-level-security-policies)
- [Indexes and Performance](#indexes-and-performance)
- [Functions and Triggers](#functions-and-triggers)
- [Migration Strategy](#migration-strategy)

---

## Schema Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          DATABASE SCHEMA                                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   Core Tables                                                                   │
│   ├── profiles           User identity and preferences                         │
│   ├── otp_codes          Temporary authentication codes                        │
│   └── user_sessions      Active login sessions                                 │
│                                                                                 │
│   Learning Data                                                                 │
│   ├── learning_paths     AI-generated study roadmaps                           │
│   ├── quiz_sessions      Quiz attempts and results                             │
│   └── notes              AI-generated notes and summaries                      │
│                                                                                 │
│   Content Storage                                                               │
│   ├── uploaded_content   PDF/URL content metadata                              │
│   └── content_analysis   Gemini analysis results cache                         │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      ENTITY RELATIONSHIPS                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│                              ┌───────────────┐                                  │
│                              │   profiles    │                                  │
│                              │───────────────│                                  │
│                              │ id (PK)       │                                  │
│                              │ email         │                                  │
│                              │ name          │                                  │
│                              │ avatar_url    │                                  │
│                              │ preferences   │                                  │
│                              │ created_at    │                                  │
│                              └───────┬───────┘                                  │
│                                      │                                          │
│           ┌──────────────────────────┼──────────────────────────┐              │
│           │                          │                          │              │
│           ▼                          ▼                          ▼              │
│   ┌───────────────┐         ┌───────────────┐         ┌───────────────┐       │
│   │ user_sessions │         │learning_paths │         │uploaded_content│       │
│   │───────────────│         │───────────────│         │───────────────│       │
│   │ id (PK)       │         │ id (PK)       │         │ id (PK)       │       │
│   │ user_id (FK)  │         │ user_id (FK)  │         │ user_id (FK)  │       │
│   │ token_hash    │         │ title         │         │ title         │       │
│   │ expires_at    │         │ subject       │         │ content_type  │       │
│   │ user_agent    │         │ topics (JSON) │         │ raw_text      │       │
│   │ created_at    │         │ progress      │         │ file_url      │       │
│   └───────────────┘         │ created_at    │         │ created_at    │       │
│                             └───────┬───────┘         └───────┬───────┘       │
│                                     │                         │                │
│                                     │              ┌──────────┴──────────┐     │
│                                     │              │                     │     │
│                                     ▼              ▼                     ▼     │
│                             ┌───────────────┐  ┌───────────────┐  ┌───────────┐│
│                             │ quiz_sessions │  │content_analysis│ │   notes   ││
│                             │───────────────│  │───────────────│  │───────────││
│                             │ id (PK)       │  │ id (PK)       │  │ id (PK)   ││
│                             │ user_id (FK)  │  │ content_id(FK)│  │ user_id   ││
│                             │ path_id (FK)  │  │ analysis(JSON)│  │content_id ││
│                             │ content_id(FK)│  │ cached_at     │  │ title     ││
│                             │ config (JSON) │  └───────────────┘  │ summary   ││
│                             │ questions     │                     │flashcards ││
│                             │ answers       │                     │created_at ││
│                             │ score         │                     └───────────┘│
│                             │ completed_at  │                                  │
│                             └───────────────┘                                  │
│                                                                                 │
│   Standalone Tables                                                             │
│   ┌───────────────┐                                                            │
│   │   otp_codes   │  (No FK - uses email directly)                             │
│   │───────────────│                                                            │
│   │ id (PK)       │                                                            │
│   │ email         │                                                            │
│   │ code_hash     │                                                            │
│   │ expires_at    │                                                            │
│   │ attempts      │                                                            │
│   └───────────────┘                                                            │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Table Definitions

### profiles

Stores user identity and preferences.

```sql
-- supabase/schema.sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255),
  avatar_url TEXT,
  preferences JSONB DEFAULT '{
    "defaultDifficulty": "medium",
    "defaultQuestionCount": 10,
    "showExplanations": true,
    "notifications": {
      "email": true,
      "push": false
    }
  }'::jsonb,
  learning_style JSONB,
  onboarding_complete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_email CHECK (
    email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  )
);

-- Indexes
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_created_at ON profiles(created_at DESC);
```

### otp_codes

Temporary storage for authentication OTP codes.

```sql
CREATE TABLE otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  code_hash VARCHAR(64) NOT NULL,  -- SHA-256 hash (64 hex chars)
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_email CHECK (
    email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  ),
  CONSTRAINT max_attempts CHECK (attempts <= 5)
);

-- Index for expiry cleanup
CREATE INDEX idx_otp_codes_expires_at ON otp_codes(expires_at);
```

### user_sessions

Active authentication sessions.

```sql
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  token_hash VARCHAR(64) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  user_agent TEXT,
  ip_address INET,
  last_active TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_expiry CHECK (expires_at > created_at)
);

-- Indexes
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX idx_user_sessions_token_hash ON user_sessions(token_hash);
```

### learning_paths

AI-generated study roadmaps.

```sql
CREATE TABLE learning_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  subject VARCHAR(100) NOT NULL,
  description TEXT,
  topics JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- topics structure:
  -- [
  --   {
  --     "id": "uuid",
  --     "title": "string",
  --     "description": "string",
  --     "prerequisites": ["topic_id"],
  --     "status": "locked|available|in-progress|completed",
  --     "order": number
  --   }
  -- ]
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  is_active BOOLEAN DEFAULT TRUE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_learning_paths_user_id ON learning_paths(user_id);
CREATE INDEX idx_learning_paths_subject ON learning_paths(subject);
CREATE INDEX idx_learning_paths_active ON learning_paths(user_id, is_active) WHERE is_active = TRUE;
```

### uploaded_content

User-uploaded educational content.

```sql
CREATE TABLE uploaded_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content_type VARCHAR(50) NOT NULL CHECK (
    content_type IN ('pdf', 'url', 'text', 'youtube')
  ),
  source_url TEXT,
  file_path TEXT,
  raw_text TEXT,
  word_count INTEGER,
  metadata JSONB DEFAULT '{}'::jsonb,
  -- metadata structure:
  -- {
  --   "pages": number (for PDF),
  --   "domain": "string" (for URL),
  --   "extractedAt": "ISO timestamp"
  -- }
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_uploaded_content_user_id ON uploaded_content(user_id);
CREATE INDEX idx_uploaded_content_type ON uploaded_content(content_type);
```

### content_analysis

Cached Gemini analysis results.

```sql
CREATE TABLE content_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL REFERENCES uploaded_content(id) ON DELETE CASCADE,
  analysis JSONB NOT NULL,
  -- analysis structure:
  -- {
  --   "title": "string",
  --   "subject": "string",
  --   "topics": ["string"],
  --   "difficulty": "easy|medium|hard",
  --   "estimatedReadTime": number,
  --   "keyTerms": ["string"],
  --   "prerequisites": ["string"]
  -- }
  model_version VARCHAR(50) DEFAULT 'gemini-2.5-flash',
  cached_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
  
  CONSTRAINT unique_content_analysis UNIQUE (content_id)
);

-- Index for cache expiry
CREATE INDEX idx_content_analysis_expires ON content_analysis(expires_at);
```

### quiz_sessions

Quiz attempts and results.

```sql
CREATE TABLE quiz_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  path_id UUID REFERENCES learning_paths(id) ON DELETE SET NULL,
  content_id UUID REFERENCES uploaded_content(id) ON DELETE SET NULL,
  content_title VARCHAR(255) NOT NULL,
  
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- config structure:
  -- {
  --   "questionCount": number,
  --   "difficulty": "easy|medium|hard",
  --   "questionTypes": ["mcq", "true-false", "fill-blank"],
  --   "timeLimit": number (optional),
  --   "shuffleQuestions": boolean
  -- }
  
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- questions structure:
  -- [
  --   {
  --     "id": "uuid",
  --     "type": "mcq|true-false|fill-blank",
  --     "question": "string",
  --     "options": ["string"] (for mcq),
  --     "correctAnswer": "string",
  --     "explanation": "string",
  --     "topic": "string"
  --   }
  -- ]
  
  answers JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- answers structure:
  -- [
  --   {
  --     "questionId": "uuid",
  --     "answer": "string",
  --     "isCorrect": boolean,
  --     "timeSpent": number (ms),
  --     "matchType": "exact|fuzzy|acceptable"
  --   }
  -- ]
  
  score JSONB,
  -- score structure:
  -- {
  --   "correct": number,
  --   "incorrect": number,
  --   "total": number,
  --   "percentage": number,
  --   "passed": boolean,
  --   "timeBonus": number,
  --   "streakBonus": number
  -- }
  
  phase VARCHAR(50) DEFAULT 'idle' CHECK (
    phase IN ('idle', 'uploading', 'analyzing', 'configuring', 
              'generating', 'ready', 'active', 'paused', 
              'reviewing', 'completed', 'dig-deeper', 'error')
  ),
  
  dig_deeper_parent_id UUID REFERENCES quiz_sessions(id),
  
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_quiz_sessions_user_id ON quiz_sessions(user_id);
CREATE INDEX idx_quiz_sessions_path_id ON quiz_sessions(path_id);
CREATE INDEX idx_quiz_sessions_content_id ON quiz_sessions(content_id);
CREATE INDEX idx_quiz_sessions_completed ON quiz_sessions(user_id, completed_at DESC) 
  WHERE completed_at IS NOT NULL;
CREATE INDEX idx_quiz_sessions_phase ON quiz_sessions(phase) WHERE phase != 'completed';
```

### notes

AI-generated notes and summaries.

```sql
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content_id UUID REFERENCES uploaded_content(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  summary TEXT NOT NULL,
  key_points JSONB DEFAULT '[]'::jsonb,
  -- key_points: ["string", "string", ...]
  
  flashcards JSONB DEFAULT '[]'::jsonb,
  -- flashcards structure:
  -- [
  --   {
  --     "id": "uuid",
  --     "front": "string",
  --     "back": "string",
  --     "difficulty": "easy|medium|hard"
  --   }
  -- ]
  
  tags JSONB DEFAULT '[]'::jsonb,
  -- tags: ["biology", "chapter-5", ...]
  
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_notes_user_id ON notes(user_id);
CREATE INDEX idx_notes_content_id ON notes(content_id);
CREATE INDEX idx_notes_tags ON notes USING GIN (tags);
CREATE INDEX idx_notes_favorite ON notes(user_id, is_favorite) WHERE is_favorite = TRUE;
CREATE INDEX idx_notes_fulltext ON notes USING GIN (
  to_tsvector('english', title || ' ' || summary)
);
```

---

## Row Level Security Policies

### RLS Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      ROW LEVEL SECURITY                                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   Principle: Users can only access their own data                               │
│                                                                                 │
│   Policy Pattern:                                                               │
│   ┌─────────────────────────────────────────────────────────────────────┐      │
│   │  USING (user_id = auth.uid())                                        │      │
│   │  - Applied to SELECT, UPDATE, DELETE                                 │      │
│   │  - Ensures queries only return user's own rows                       │      │
│   │                                                                      │      │
│   │  WITH CHECK (user_id = auth.uid())                                   │      │
│   │  - Applied to INSERT, UPDATE                                         │      │
│   │  - Ensures new/modified rows belong to user                          │      │
│   └─────────────────────────────────────────────────────────────────────┘      │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Policy Definitions

```sql
-- Enable RLS on all user-data tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploaded_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read/update their own profile
CREATE POLICY profiles_select ON profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY profiles_update ON profiles
  FOR UPDATE USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- User Sessions: Full access to own sessions
CREATE POLICY user_sessions_all ON user_sessions
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Learning Paths: Full access to own paths
CREATE POLICY learning_paths_all ON learning_paths
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Uploaded Content: Full access to own content
CREATE POLICY uploaded_content_all ON uploaded_content
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Content Analysis: Read if user owns the content
CREATE POLICY content_analysis_select ON content_analysis
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM uploaded_content 
      WHERE uploaded_content.id = content_analysis.content_id 
      AND uploaded_content.user_id = auth.uid()
    )
  );

-- Quiz Sessions: Full access to own sessions
CREATE POLICY quiz_sessions_all ON quiz_sessions
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Notes: Full access to own notes
CREATE POLICY notes_all ON notes
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- OTP Codes: No RLS (handled by functions with SECURITY DEFINER)
-- This table is accessed via server-side functions only
```

---

## Indexes and Performance

### Index Strategy

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        INDEX STRATEGY                                           │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   Index Type      │ Use Case                      │ Tables Applied              │
│   ────────────────┼───────────────────────────────┼──────────────────────────  │
│   B-tree (FK)     │ Foreign key lookups           │ All tables with user_id    │
│   B-tree (sort)   │ Ordered queries               │ created_at, completed_at   │
│   B-tree (unique) │ Uniqueness constraints        │ email, token_hash          │
│   GIN (JSONB)     │ JSON field queries            │ tags, topics               │
│   GIN (fulltext)  │ Text search                   │ notes (title + summary)    │
│   Partial         │ Filtered queries              │ is_active, is_favorite     │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Query Optimization Examples

```sql
-- Efficient: Uses idx_quiz_sessions_completed
SELECT * FROM quiz_sessions 
WHERE user_id = $1 
  AND completed_at IS NOT NULL 
ORDER BY completed_at DESC 
LIMIT 10;

-- Efficient: Uses idx_notes_tags GIN index
SELECT * FROM notes 
WHERE user_id = $1 
  AND tags @> '["biology"]'::jsonb;

-- Efficient: Uses idx_notes_fulltext
SELECT * FROM notes 
WHERE user_id = $1 
  AND to_tsvector('english', title || ' ' || summary) @@ to_tsquery('mitochondria');

-- Efficient: Uses partial index on is_favorite
SELECT * FROM notes 
WHERE user_id = $1 
  AND is_favorite = TRUE;
```

---

## Functions and Triggers

### Auto-update Timestamps

```sql
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER trigger_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_learning_paths_updated_at
  BEFORE UPDATE ON learning_paths
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_quiz_sessions_updated_at
  BEFORE UPDATE ON quiz_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_notes_updated_at
  BEFORE UPDATE ON notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### OTP Cleanup

```sql
-- Function to clean expired OTPs
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS void AS $$
BEGIN
  DELETE FROM otp_codes WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule via pg_cron (if available) or call periodically
-- SELECT cron.schedule('cleanup-otps', '*/5 * * * *', 'SELECT cleanup_expired_otps()');
```

### Profile Creation on First Login

```sql
-- Function to get or create profile
CREATE OR REPLACE FUNCTION get_or_create_profile(user_email TEXT)
RETURNS profiles AS $$
DECLARE
  profile_record profiles;
BEGIN
  -- Try to find existing profile
  SELECT * INTO profile_record
  FROM profiles
  WHERE email = LOWER(user_email);
  
  -- Create if not exists
  IF NOT FOUND THEN
    INSERT INTO profiles (email)
    VALUES (LOWER(user_email))
    RETURNING * INTO profile_record;
  END IF;
  
  RETURN profile_record;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Migration Strategy

### Version Control

```sql
-- Migrations are stored in supabase/migrations/
-- Each migration has a timestamp prefix: YYYYMMDDHHMMSS_description.sql

-- Example migration: 20240115120000_add_flashcard_difficulty.sql
ALTER TABLE notes 
ADD COLUMN IF NOT EXISTS flashcard_settings JSONB DEFAULT '{
  "reviewInterval": 1,
  "lastReviewed": null
}'::jsonb;
```

### Migration Commands

```bash
# Create new migration
supabase migration new add_feature_name

# Apply migrations locally
supabase db reset

# Push to production
supabase db push

# Pull remote changes
supabase db pull
```

### Rollback Strategy

```sql
-- Each migration should have a corresponding down migration
-- Example down migration
-- 20240115120000_add_flashcard_difficulty_down.sql
ALTER TABLE notes DROP COLUMN IF EXISTS flashcard_settings;
```

---

## Summary

The Quietude database schema provides:

| Feature | Implementation | Benefit |
|---------|----------------|---------|
| User Isolation | Row Level Security | Data privacy |
| Efficient Queries | Strategic indexes | Fast performance |
| JSON Flexibility | JSONB columns | Schema evolution |
| Data Integrity | Foreign keys + checks | Consistency |
| Auto-maintenance | Triggers + functions | Reduced code |
| Full-text Search | GIN indexes | Better UX |

---

**Related Documentation:**
- [Authentication](./AUTHENTICATION.md) - OTP and session tables
- [Sync Mechanism](./SYNC_MECHANISM.md) - Data synchronization
- [Architecture Overview](./ARCHITECTURE.md) - System design

---

<div align="center">
  <sub>Structured data for reliable learning experiences</sub>
</div>
