# Quietude - Hackathon Presentation Plan

## Overview

This document outlines the complete plan for the Quietude hackathon presentation. The presentation is built as an **immersive, story-driven experience** that matches the app's design system and demonstrates the product's philosophy through its own design.

## Quick Start

```bash
# Start the development server
pnpm dev

# Access the presentation
http://localhost:8080/presentation
```

## Keyboard Controls

| Key | Action |
|-----|--------|
| **Arrow Keys** | Navigate between slides |
| **Space** | Next slide |
| **1-8** | Jump directly to a slide |
| **F** | Toggle fullscreen |
| **Escape** | Exit fullscreen |

---

## Presentation Details

- **Total Slides:** 8
- **Estimated Duration:** 8-10 minutes
- **Format:** Interactive web-based presentation
- **Technology:** React + Framer Motion + TailwindCSS
- **Theme:** Matches Quietude's time-aware theming system

---

## Slide Structure (Redesigned)

### SLIDE 1: Story-Based Problem + Solution (Auto-Playing Narrative)

**Purpose:** Immersive storytelling experience that hooks judges immediately

**Narrative Flow (9 stages, auto-advancing):**
1. Meet Alex (student preparing for exams)
2. Problem 1: Drowning in Materials
3. Problem 2: Generic Study Tools (Quizlet doesn't match their content)
4. Problem 3: The Overwhelm (flashy apps = more stress)
5. Transition: "What if there was a better way?"
6. Introducing Quietude
7. Solution 1: Upload YOUR Content
8. Solution 2: AI-Generated Quizzes  
9. Solution 3: Calm, Focused Design

**Visuals:**
- Progress bar showing red (problem) → green (solution)
- Large animated icons
- Play/Pause controls with dot navigation

---

### SLIDE 2: How It Works (Interactive User Journey)

**Purpose:** Show the complete learning loop in one visual

**Content - Flow Steps:**
1. Upload - PDF, Images, Audio, or Text
2. AI Analyzes - Gemini extracts topics and concepts
3. Take Quiz - MCQ, True/False, Fill-in-Blank
4. Score < 75%? - AI generates study notes
5. Score >= 75% - Next topic unlocked
6. Track Progress - Analytics and streaks

**Visuals:**
- Horizontal flow diagram with connecting lines
- Icons for each step
- Animated step-by-step reveal

---

### SLIDE 3: The Quiz Experience

**Purpose:** Showcase the core product value - the quiz system

**Content:**
- Three question types displayed side by side:
  - MCQ: 4 smart options with AI-generated distractors
  - True/False: Conceptual statements testing understanding
  - Fill-in-Blank: Active recall with fuzzy answer matching
- Key features:
  - 75% pass threshold to progress
  - "Dig Deeper" for advanced challenges
  - Timer and progress tracking
  - Crash recovery

**Visuals:**
- Interactive mini-demos of each question type
- Animated selection feedback
- Match the actual quiz UI from the app

---

### SLIDE 4: Time-Aware Theming

**Purpose:** Highlight the unique differentiator

**Content:**
- Philosophy quote: "Environment affects cognition"
- 5 Time-based themes:
  - Morning Mist (05:00-10:59) - Warm, energizing tones
  - Afternoon Focus (11:00-15:59) - Clean, productive
  - Golden Hour (16:00-18:59) - Warm amber transition
  - Evening Wind (19:00-21:59) - Gentle, calming
  - Midnight Study (22:00-04:59) - Dark, eye-friendly
- 5 Mood overrides: Sage, Storm, Sand, Plum, Ink

**Visuals:**
- Theme cards showing color palettes
- Live theme indicator
- Smooth transition animation between themes

---

### SLIDE 5: Offline-First + Security

**Purpose:** Show technical reliability and security

**Content - Left (Offline-First):**
- Full PWA - installable on any device
- IndexedDB stores everything locally
- Queue-based sync when online
- Automatic conflict resolution

**Content - Right (Security):**
- Passwordless OTP authentication
- SHA-256 hashed codes with 10-min expiry
- Row Level Security on all database tables
- User data isolation

**Visuals:**
- Split layout with icons
- Sync animation showing online/offline states
- Security shield iconography

---

### SLIDE 6: Architecture + Tech Stack

**Purpose:** Demonstrate production-grade engineering

**Content - Architecture (4 layers):**
```
Presentation → State → Services → Storage
(React)      (Zustand)  (Gemini/Firebase)  (Local + Cloud)
```

**Content - Tech Stack Grid:**
| Category | Technologies |
|----------|-------------|
| Frontend | React 18, TypeScript, TailwindCSS, Framer Motion |
| State | Zustand with Persist middleware |
| AI | Google Gemini 2.5 Flash |
| Backend | Firebase (Firestore), Auth, OTP |
| PWA | Workbox, IndexedDB, Service Worker |

**Visuals:**
- Layered architecture diagram
- Tech logo grid with subtle animations
- Clean, minimal layout

---

### SLIDE 7: Product Showcase

**Purpose:** Show the real product in action without live demo risks

**Format:** Auto-playing cinematic walkthrough with desktop AND mobile views

**Showcase Sequence:**
1. Landing page with live theme (2s)
2. Login/OTP flow (2s)
3. Dashboard with upload zone (2s)
4. File upload animation (2s)
5. AI analysis progress (2s)
6. Topic roadmap generated (2s)
7. Quiz configuration screen (2s)
8. Quiz in action - answering questions (3s)
9. Score screen with results (2s)
10. Study notes generated (2s)
11. Stats dashboard with charts (2s)

**Features:**
- Desktop view on left, Mobile view on right
- Auto-advances with progress indicator
- Pause/play control
- Smooth transitions between screens
- Uses actual UI components from the app

---

### SLIDE 8: Why Quietude + Closing

**Purpose:** End with vision and call to action

**Content:**
- What Makes Us Different:
  - Not Quizlet: AI generates from YOUR content
  - Not Notion: Built specifically for learning
  - Not Duolingo: No gamification noise, just calm focus
- Philosophy quote:
  - "Learning should feel like a gentle stream, not a raging river."
- Links:
  - Live Demo URL
  - GitHub Repository
- Team credits
- "Questions?" prompt

**Visuals:**
- Comparison cards
- Animated quote reveal
- QR codes for links
- Thank you animation

---

## Design System

### Typography
- **Display Font:** Lora (serif) - Headings, titles
- **Body Font:** DM Sans (sans-serif) - Content, labels

### Colors (CSS Variables from app)
- Uses the same time-aware theme system
- Background: `--bg`, `--bg-2`
- Surface: `--surface`
- Text: `--text`, `--text-soft`, `--text-muted`
- Accent: `--accent`, `--accent-soft`, `--accent-text`
- Feedback: `--correct`, `--incorrect`

### Animations
- Fade-in reveals for content
- Subtle scale effects on hover
- Smooth slide transitions
- Floating background shapes

### Layout
- Max width: 1200px centered
- Generous whitespace
- 16:9 aspect ratio optimized
- Responsive for presenter display

---

## Navigation

- **Arrow Keys:** Next/Previous slide
- **Number Keys:** Jump to slide (1-8)
- **Space:** Pause/Play (on Slide 7)
- **F:** Fullscreen toggle
- **Escape:** Exit fullscreen

---

## File Structure

```
presentation/
├── PRESENTATION_PLAN.md    # This documentation
├── index.html              # Entry point
├── styles.css              # Presentation styles
├── presentation.tsx        # Main presentation component
├── slides/
│   ├── Slide1Title.tsx
│   ├── Slide2HowItWorks.tsx
│   ├── Slide3QuizExperience.tsx
│   ├── Slide4Theming.tsx
│   ├── Slide5OfflineSecurity.tsx
│   ├── Slide6Architecture.tsx
│   ├── Slide7ProductShowcase.tsx
│   └── Slide8Closing.tsx
├── components/
│   ├── SlideWrapper.tsx
│   ├── Navigation.tsx
│   ├── ProgressBar.tsx
│   ├── ThemeIndicator.tsx
│   ├── FloatingShapes.tsx
│   ├── PhoneFrame.tsx
│   ├── LaptopFrame.tsx
│   └── MockScreens/
│       ├── MockLanding.tsx
│       ├── MockDashboard.tsx
│       ├── MockQuiz.tsx
│       ├── MockNotes.tsx
│       └── MockStats.tsx
└── assets/
    └── (any static assets)
```

---

## Build Commands

```bash
# Development
pnpm dev

# Access presentation at
http://localhost:5173/presentation

# Build for production
pnpm build
```

---

## Presenter Notes

1. **Before presenting:**
   - Test on the presentation display
   - Check theme matches time of day (or set manually)
   - Ensure fullscreen works
   - Have backup PDF export ready

2. **During Slide 7 (Product Showcase):**
   - Let it auto-play, don't rush
   - Point out desktop vs mobile views
   - Highlight key interactions

3. **Timing guide:**
   - Slides 1-6: ~1 minute each
   - Slide 7: ~30 seconds (auto-plays)
   - Slide 8: ~1 minute + Q&A

---

## Revision History

| Date | Change |
|------|--------|
| 2026-03-02 | Initial plan created |

