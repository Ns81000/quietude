# Firebase Migration Guide

## Complete Migration Plan from Supabase to Firebase

> **Estimated Migration Time**: 4-6 hours
> **Risk Level**: Medium (complete rewrite of backend layer)
> **Goal**: Same functionality, zero user-facing changes

---

## Table of Contents

1. [Current Architecture Analysis](#1-current-architecture-analysis)
2. [Firebase Architecture](#2-firebase-architecture)
3. [Data Model Mapping](#3-data-model-mapping)
4. [Files to Create](#4-files-to-create)
5. [Files to Modify](#5-files-to-modify)
6. [Files to Delete](#6-files-to-delete)
7. [Implementation Steps](#7-implementation-steps)
8. [Environment Variables](#8-environment-variables)
9. [Security Rules](#9-security-rules)
10. [Testing Checklist](#10-testing-checklist)

---

## 1. Current Architecture Analysis

### 1.1 Supabase Files (src/lib/supabase/)

| File | Purpose | Lines | Complexity |
|------|---------|-------|------------|
| `client.ts` | Supabase client + proxy fetch | 100 | Medium |
| `auth.ts` | OTP send/verify, sessions, profiles | 460 | High |
| `sync.ts` | Offline queue, data sync | 420 | High |
| `database.types.ts` | TypeScript types | 258 | Low |
| `retry.ts` | Exponential backoff utility | 75 | Low |
| `knownUser.ts` | Multi-layer storage (localStorage+IDB) | 154 | Medium |
| `index.ts` | Re-exports | 10 | Low |

### 1.2 Database Tables

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    profiles     │────▶│ learning_paths  │────▶│  quiz_sessions  │
│  (users)        │     │  (study topics) │     │  (quiz attempts)│
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                       │                       │
         │                       └───────────┬───────────┘
         │                                   │
         ▼                                   ▼
┌─────────────────┐                 ┌─────────────────┐
│  otp_codes      │                 │     notes       │
│  (temp auth)    │                 │  (study notes)  │
└─────────────────┘                 └─────────────────┘
         │
         ▼
┌─────────────────┐
│ user_sessions   │
│ (auth tokens)   │
└─────────────────┘
```

### 1.3 Auth Flow (Current)

```
1. User enters email
2. Server generates OTP → stores hash in otp_codes
3. EmailJS sends OTP to user
4. User enters OTP
5. Server validates hash → creates/updates profile
6. Server creates user_session with token
7. Client stores session in localStorage
```

### 1.4 Data Sync Flow (Current)

```
1. User creates/updates data locally (Zustand stores)
2. Change added to IndexedDB sync queue
3. When online, queue processes items
4. Each item upserted to Supabase
5. On login, fetch all user data from server
```

---

## 2. Firebase Architecture

### 2.1 Services to Use

| Supabase Feature | Firebase Equivalent | Notes |
|-----------------|---------------------|-------|
| PostgreSQL | Cloud Firestore | Document-based, better offline |
| Row Level Security | Firestore Security Rules | Similar concept |
| Realtime subscriptions | Firestore onSnapshot | Built-in |
| REST API | Firebase SDK | Direct SDK, no proxy needed |
| (none) | Firebase Auth | Built-in email/password |

### 2.2 Why Firebase Won't Have ISP Issues

- Firebase uses `*.firebaseapp.com` and `*.googleapis.com` domains
- These are Google infrastructure, never blocked by ISPs
- No proxy needed
- Direct SDK connection

### 2.3 Recommended Auth Approach

**Option A: Firebase Email Link (Magic Link)** ✅ RECOMMENDED
- User enters email
- Firebase sends magic link
- User clicks link → authenticated
- No OTP needed, more secure

**Option B: Keep Custom OTP with Firebase**
- Continue using EmailJS for OTP
- Store OTP in Firestore instead of Supabase
- More code, but same UX

**We'll implement Option A** - simpler and more secure.

---

## 3. Data Model Mapping

### 3.1 Firestore Collections

```
/users/{userId}                    ← profiles table
  - email: string
  - name: string | null
  - studyField: string | null
  - learnStyle: string | null
  - studyTime: string | null
  - isOnboarded: boolean
  - themeMood: string | null
  - createdAt: timestamp
  - updatedAt: timestamp

/users/{userId}/learningPaths/{pathId}    ← learning_paths table
  - title: string | null
  - subject: string
  - educationLevel: string | null
  - topicType: string | null
  - sourceType: string | null
  - sourceUrl: string | null
  - sourceText: string | null
  - sourceFileName: string | null
  - topicMap: object | null
  - topics: array
  - needsStudyPlan: boolean
  - status: string
  - currentTopicId: string | null
  - createdAt: timestamp
  - updatedAt: timestamp

/users/{userId}/quizSessions/{sessionId}  ← quiz_sessions table
  - topicId: string
  - pathId: string
  - subject: string | null
  - isDigDeeper: boolean
  - isRetake: boolean
  - config: object
  - questions: array
  - answers: array
  - score: number | null
  - total: number
  - scorePct: number | null
  - passed: boolean | null
  - startedAt: timestamp
  - submittedAt: timestamp | null
  - timeTakenSecs: number | null

/users/{userId}/notes/{noteId}            ← notes table
  - topicId: string
  - topicTitle: string
  - subject: string
  - contentHtml: string
  - sessionId: string | null
  - createdAt: timestamp
  - updatedAt: timestamp
```

### 3.2 Why Subcollections?

- Each user's data is isolated
- Security rules are simpler
- Queries are scoped to user automatically
- Firestore's offline persistence works per-collection

### 3.3 Field Name Mapping (snake_case → camelCase)

```typescript
// Supabase (snake_case)    →    Firebase (camelCase)
user_id                     →    (implicit in path)
is_onboarded                →    isOnboarded
study_field                 →    studyField
learn_style                 →    learnStyle
study_time                  →    studyTime
theme_mood                  →    themeMood
created_at                  →    createdAt
updated_at                  →    updatedAt
education_level             →    educationLevel
topic_type                  →    topicType
source_type                 →    sourceType
source_url                  →    sourceUrl
source_text                 →    sourceText
source_file_name            →    sourceFileName
topic_map                   →    topicMap
needs_study_plan            →    needsStudyPlan
current_topic_id            →    currentTopicId
path_id                     →    pathId
topic_id                    →    topicId
is_dig_deeper               →    isDigDeeper
is_retake                   →    isRetake
score_pct                   →    scorePct
started_at                  →    startedAt
submitted_at                →    submittedAt
time_taken_secs             →    timeTakenSecs
topic_title                 →    topicTitle
content_html                →    contentHtml
session_id                  →    sessionId
```

---

## 4. Files to Create

### 4.1 New Firebase Files

```
src/lib/firebase/
├── client.ts           # Firebase initialization
├── auth.ts             # Firebase Auth (magic link)
├── firestore.ts        # Firestore operations
├── sync.ts             # Offline sync (simpler than Supabase)
├── types.ts            # TypeScript types
└── index.ts            # Re-exports
```

### 4.2 File Contents Overview

#### `client.ts` (~50 lines)
```typescript
// Initialize Firebase app
// Export auth, firestore instances
// Check if configured
```

#### `auth.ts` (~200 lines)
```typescript
// sendSignInLink(email)
// handleSignInLink()
// getCurrentUser()
// signOut()
// onAuthStateChanged()
```

#### `firestore.ts` (~300 lines)
```typescript
// User profile CRUD
// Learning paths CRUD
// Quiz sessions CRUD
// Notes CRUD
// Offline persistence config
```

#### `sync.ts` (~100 lines)
```typescript
// Firestore handles offline sync automatically
// Just need to enable persistence
// Much simpler than Supabase version
```

#### `types.ts` (~150 lines)
```typescript
// User, LearningPath, QuizSession, Note types
// Converter functions for Firestore
```

---

## 5. Files to Modify

### 5.1 Store Files

| File | Changes Needed |
|------|----------------|
| `src/store/auth.ts` | Change imports, use Firebase auth |
| `src/store/paths.ts` | None (uses local state) |
| `src/store/sessions.ts` | None (uses local state) |
| `src/store/notes.ts` | None (uses local state) |
| `src/store/user.ts` | None (uses local state) |

### 5.2 Component Files

| File | Changes Needed |
|------|----------------|
| `src/components/auth/AuthProvider.tsx` | Major changes - Firebase auth listener |
| `src/components/auth/ProtectedRoute.tsx` | Minor - use Firebase user state |
| `src/pages/Login.tsx` | Change to email link flow |
| `src/pages/Verify.tsx` | Handle magic link callback OR keep OTP |
| `src/pages/Onboarding.tsx` | Use Firebase user ID |
| `src/pages/Dashboard.tsx` | Minor - sync function imports |

### 5.3 Config Files

| File | Changes Needed |
|------|----------------|
| `.env` | Add Firebase config vars |
| `vercel.json` | Remove proxy route (not needed) |
| `package.json` | Add firebase package |

---

## 6. Files to Delete

After migration is complete and tested:

```
src/lib/supabase/           # Entire folder
  ├── auth.ts
  ├── client.ts
  ├── database.types.ts
  ├── index.ts
  ├── knownUser.ts
  ├── retry.ts
  └── sync.ts

api/
  └── supabase-proxy.ts     # No longer needed

supabase/
  ├── schema.sql            # Keep for reference, optional
  └── migrations/           # Keep for reference, optional
```

---

## 7. Implementation Steps

### Phase 1: Setup (30 mins)

1. **Create Firebase Project**
   - Go to console.firebase.google.com
   - Create new project "quietude-prod"
   - Enable Authentication (Email Link sign-in)
   - Enable Cloud Firestore
   - Copy config to `.env`

2. **Install Firebase SDK**
   ```bash
   pnpm add firebase
   ```

3. **Create Firebase lib folder**
   ```bash
   mkdir src/lib/firebase
   ```

### Phase 2: Core Implementation (2-3 hours)

4. **Create `src/lib/firebase/client.ts`**

5. **Create `src/lib/firebase/types.ts`**

6. **Create `src/lib/firebase/auth.ts`**

7. **Create `src/lib/firebase/firestore.ts`**

8. **Create `src/lib/firebase/sync.ts`**

9. **Create `src/lib/firebase/index.ts`**

### Phase 3: Integration (1-2 hours)

10. **Update `src/store/auth.ts`**

11. **Update `src/components/auth/AuthProvider.tsx`**

12. **Update `src/pages/Login.tsx`**

13. **Update `src/pages/Verify.tsx`** (or create new callback page)

14. **Update `src/pages/Onboarding.tsx`**

### Phase 4: Testing (1 hour)

15. **Test auth flow**
16. **Test data sync**
17. **Test offline mode**
18. **Test across browsers**

### Phase 5: Cleanup (30 mins)

19. **Delete Supabase files**
20. **Remove proxy route**
21. **Update documentation**

---

## 8. Environment Variables

### Current (.env)
```env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
```

### New (.env)
```env
# Firebase (replace Supabase vars)
VITE_FIREBASE_API_KEY=xxx
VITE_FIREBASE_AUTH_DOMAIN=xxx.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=xxx
VITE_FIREBASE_STORAGE_BUCKET=xxx.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=xxx
VITE_FIREBASE_APP_ID=xxx

# EmailJS (keep if using custom OTP, remove if using magic link)
VITE_EMAILJS_SERVICE_ID=xxx
VITE_EMAILJS_TEMPLATE_ID=xxx
VITE_EMAILJS_PUBLIC_KEY=xxx
```

### Vercel Environment Variables

Add the same `VITE_FIREBASE_*` variables in Vercel dashboard.

---

## 9. Security Rules

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users can only read/write their own profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // Subcollections follow same rule
      match /learningPaths/{pathId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      
      match /quizSessions/{sessionId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      
      match /notes/{noteId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
    
    // Deny all other access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

## 10. Testing Checklist

### Auth Flow
- [ ] User can enter email and receive magic link
- [ ] Clicking magic link logs user in
- [ ] Session persists across page refreshes
- [ ] Logout works correctly
- [ ] Protected routes redirect unauthenticated users

### Data Operations
- [ ] New user profile created on first login
- [ ] Onboarding data saves to Firestore
- [ ] Learning paths sync to Firestore
- [ ] Quiz sessions sync to Firestore
- [ ] Notes sync to Firestore
- [ ] Data loads correctly on re-login

### Offline Mode
- [ ] App works offline (PWA)
- [ ] Changes made offline sync when back online
- [ ] Firestore persistence enabled

### Edge Cases
- [ ] Multiple tabs don't conflict
- [ ] Account switch clears old data
- [ ] Error states handled gracefully

---

## Summary

### What Changes
- Backend: Supabase → Firebase
- Auth: Custom OTP → Firebase Magic Link (or keep OTP)
- Database: PostgreSQL → Firestore
- Sync: Custom queue → Firestore offline persistence

### What Stays Same
- UI/UX (identical)
- Zustand stores (local state)
- PWA functionality
- Theme system
- Quiz mechanics
- Notes system

### Benefits of Migration
1. ✅ No ISP blocking (Google domains)
2. ✅ No proxy needed
3. ✅ Better offline support (built-in)
4. ✅ Simpler auth (magic link)
5. ✅ Generous free tier (50K reads/day)
6. ✅ Real-time sync built-in

### Risks
1. ⚠️ 4-6 hours of development
2. ⚠️ Need to migrate existing users manually
3. ⚠️ Different query patterns (no SQL)
4. ⚠️ Learning curve for Firestore

---

## Next Steps

When you're ready to proceed, say:

**"Implement Firebase migration Phase 1"** - Setup + client.ts

**"Implement Firebase migration Phase 2"** - All core files

**"Implement Firebase migration Phase 3"** - Integration

Or **"Implement Firebase migration - All phases"** - Everything at once
