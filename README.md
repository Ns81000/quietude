<div align="center">

# Quietude

### Your Calm, Intelligent Learning Partner

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Gemini AI](https://img.shields.io/badge/Gemini-2.5_Flash-4285F4?style=flat-square&logo=google&logoColor=white)](https://ai.google.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-12.x-FFCA28?style=flat-square&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![License](https://img.shields.io/badge/License-MIT-A855F7?style=flat-square)](LICENSE)
[![PWA](https://img.shields.io/badge/PWA-Ready-5A0FC8?style=flat-square&logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)

<br />

**Quietude** transforms how you learn by combining artificial intelligence with thoughtful design. Upload any study material, and watch as it becomes an interactive learning journey with AI-generated quizzes, personalized study notes, and progress tracking — all wrapped in a calming, adaptive interface that shifts with the time of day.

<br />

[Getting Started](#getting-started) · [Features](#features) · [Architecture](#architecture) · [Documentation](#documentation) · [Contributing](#contributing)

</div>

---

<br />

## The Philosophy

> *"In the midst of movement and chaos, keep stillness inside of you."* — Deepak Chopra

Modern learning tools often overwhelm with notifications, gamification, and visual noise. **Quietude** takes a different path — one of intentional simplicity and focused calm. The application adapts to your natural rhythm, shifting its visual atmosphere from morning mist to midnight study, ensuring your environment supports rather than distracts from deep learning.

<br />

## Features

<table>
<tr>
<td width="50%">

### Intelligent Content Analysis

Upload PDFs, images, audio files, or paste text directly. Quietude's AI engine analyzes your material, identifies topics, and automatically structures a personalized study plan.

**Supported Formats:**
- PDF documents
- Images (PNG, JPEG, WebP)
- Audio recordings (MP3, WAV, M4A)
- Plain text and Markdown

</td>
<td width="50%">

### Adaptive Quiz Generation

Three question types tailored to your content:

| Type | Description |
|------|-------------|
| **Multiple Choice** | Four plausible options with smart distractors |
| **True/False** | Conceptual statements testing understanding |
| **Fill-in-Blank** | Active recall with fuzzy answer matching |

Pass at 75% to unlock the next topic, or **Dig Deeper** for advanced challenges.

</td>
</tr>
<tr>
<td width="50%">

### Time-Aware Theming

The interface naturally transitions through five time-based themes:

| Theme | Hours | Atmosphere |
|-------|-------|------------|
| Morning Mist | 05:00–10:59 | Warm, soft tones |
| Afternoon Focus | 11:00–15:59 | Clean, productive |
| Golden Hour | 16:00–18:59 | Warm amber accents |
| Evening Wind | 19:00–21:59 | Gentle rose tints |
| Midnight Study | 22:00–04:59 | Dark, eye-friendly |

Plus five mood overrides: **Sage**, **Storm**, **Sand**, **Plum**, and **Ink**.

</td>
<td width="50%">

### AI-Generated Study Notes

When you score below 75%, Quietude generates comprehensive study notes featuring:

- Hierarchical structure (H1 → H3)
- Concrete examples and analogies
- Key terms highlighted
- 4-5 actionable takeaways
- Export to PDF capability

Notes are cached for 24 hours to minimize API usage.

</td>
</tr>
<tr>
<td width="50%">

### Offline-First Architecture

Study anywhere, even without internet:

- Full PWA with service worker
- IndexedDB local storage
- Automatic sync with Firebase
- Automatic conflict resolution
- Crash recovery for quizzes

</td>
<td width="50%">

### Learning Analytics

Track your progress with detailed statistics:

- Score trends over time
- Activity heatmap calendar
- Subject-by-subject breakdown
- Best study time insights
- Streak tracking

</td>
</tr>
</table>

<br />

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              QUIETUDE ARCHITECTURE                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐ │
│   │   Landing   │    │  Dashboard  │    │    Learn    │    │    Quiz     │ │
│   │    Page     │───▶│    Page     │───▶│    Page     │───▶│    Page     │ │
│   └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘ │
│         │                  │                  │                  │          │
│         ▼                  ▼                  ▼                  ▼          │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │                        ZUSTAND STATE LAYER                          │  │
│   │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐       │  │
│   │  │  Auth   │ │  Quiz   │ │  Notes  │ │Sessions │ │  Paths  │ ...   │  │
│   │  │  Store  │ │  Store  │ │  Store  │ │  Store  │ │  Store  │       │  │
│   │  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘       │  │
│   └───────┼──────────┼──────────┼──────────┼──────────┼─────────────────┘  │
│           │          │          │          │          │                     │
│           ▼          ▼          ▼          ▼          ▼                     │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │                     PERSISTENCE & SYNC LAYER                         │  │
│   │  ┌───────────────┐    ┌───────────────┐    ┌───────────────┐        │  │
│   │  │  localStorage │    │   IndexedDB   │    │   Firebase    │        │  │
│   │  │   (Zustand)   │    │  (idb-keyval) │    │  (Firestore)  │        │  │
│   │  └───────────────┘    └───────────────┘    └───────────────┘        │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│                                    │                                        │
│                                    ▼                                        │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │                        GEMINI AI ENGINE                              │  │
│   │  ┌─────────────────────────────────────────────────────────────┐    │  │
│   │  │                   Multi-Key Pool Manager                     │    │  │
│   │  │  • 6 API keys with automatic rotation                        │    │  │
│   │  │  • 24-hour exhaustion cooldown                               │    │  │
│   │  │  • Instant failover on quota errors                          │    │  │
│   │  │  • Smart retry with key switching                            │    │  │
│   │  └─────────────────────────────────────────────────────────────┘    │  │
│   │  ┌───────────────┐    ┌───────────────┐    ┌───────────────┐        │  │
│   │  │   Analysis    │    │     Quiz      │    │    Notes      │        │  │
│   │  │   Prompts     │    │   Prompts     │    │   Prompts     │        │  │
│   │  └───────────────┘    └───────────────┘    └───────────────┘        │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

<br />

### Core Data Flow

```
┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│                  │      │                  │      │                  │
│   User Upload    │─────▶│  Gemini Analyze  │─────▶│   Topic Map      │
│   (PDF/Image/    │      │  (content →      │      │   Generated      │
│    Audio/Text)   │      │   topics)        │      │                  │
│                  │      │                  │      │                  │
└──────────────────┘      └──────────────────┘      └────────┬─────────┘
                                                             │
                                                             ▼
┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│                  │      │                  │      │                  │
│   Study Notes    │◀─────│   Score < 75%   │◀─────│   Take Quiz      │
│   Generated      │      │                  │      │   (10 questions) │
│                  │      │                  │      │                  │
└──────────────────┘      └──────────────────┘      └──────────────────┘
                                   │
                                   │ Score ≥ 75%
                                   ▼
                          ┌──────────────────┐
                          │                  │
                          │   Next Topic     │
                          │   Unlocked       │
                          │                  │
                          └──────────────────┘
```

<br />

---

## Tech Stack

<table>
<tr>
<th>Category</th>
<th>Technology</th>
<th>Purpose</th>
</tr>
<tr>
<td><strong>Framework</strong></td>
<td>React 18 + TypeScript</td>
<td>Component architecture with type safety</td>
</tr>
<tr>
<td><strong>Build Tool</strong></td>
<td>Vite 5</td>
<td>Lightning-fast HMR and optimized builds</td>
</tr>
<tr>
<td><strong>Styling</strong></td>
<td>TailwindCSS + CSS Variables</td>
<td>Utility-first with dynamic theming</td>
</tr>
<tr>
<td><strong>UI Components</strong></td>
<td>Radix UI + shadcn/ui</td>
<td>Accessible, unstyled primitives</td>
</tr>
<tr>
<td><strong>Animation</strong></td>
<td>Framer Motion</td>
<td>Declarative animations and gestures</td>
</tr>
<tr>
<td><strong>State Management</strong></td>
<td>Zustand</td>
<td>Lightweight stores with persistence</td>
</tr>
<tr>
<td><strong>AI Integration</strong></td>
<td>Google Gemini 2.5 Flash</td>
<td>Content analysis, quiz generation, notes</td>
</tr>
<tr>
<td><strong>Backend</strong></td>
<td>Firebase (Firestore)</td>
<td>Database, auth infrastructure, sync</td>
</tr>
<tr>
<td><strong>Email</strong></td>
<td>EmailJS</td>
<td>OTP delivery for passwordless auth</td>
</tr>
<tr>
<td><strong>Offline Storage</strong></td>
<td>idb-keyval (IndexedDB)</td>
<td>Client-side persistence</td>
</tr>
<tr>
<td><strong>PWA</strong></td>
<td>vite-plugin-pwa + Workbox</td>
<td>Service worker and caching</td>
</tr>
<tr>
<td><strong>Charts</strong></td>
<td>Recharts</td>
<td>Statistics visualization</td>
</tr>
<tr>
<td><strong>Forms</strong></td>
<td>React Hook Form + Zod</td>
<td>Form handling with validation</td>
</tr>
<tr>
<td><strong>Testing</strong></td>
<td>Vitest + Testing Library</td>
<td>Unit and integration testing</td>
</tr>
</table>

<br />

---

## Getting Started

### Prerequisites

- **Node.js** 18.x or higher
- **pnpm** (recommended) or npm
- **Firebase** project (free tier works)
- **Google AI Studio** API keys
- **EmailJS** account (for OTP emails)

### Installation

```bash
# Clone the repository
git clone https://github.com/Ns81000/quietude.git
cd quietude

# Install dependencies
pnpm install

# Copy environment template
cp .env.example .env
```

### Environment Configuration

Create a `.env` file with the following variables:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id

# Gemini API Keys (supports up to 6 for load balancing)
VITE_GEMINI_KEY_1=your-gemini-key-1
VITE_GEMINI_KEY_2=your-gemini-key-2
VITE_GEMINI_KEY_3=your-gemini-key-3
VITE_GEMINI_KEY_4=your-gemini-key-4
VITE_GEMINI_KEY_5=your-gemini-key-5
VITE_GEMINI_KEY_6=your-gemini-key-6

# EmailJS Configuration
VITE_EMAILJS_SERVICE_ID=your-service-id
VITE_EMAILJS_TEMPLATE_ID=your-template-id
VITE_EMAILJS_PUBLIC_KEY=your-public-key

# Security
VITE_OTP_SALT=your-random-salt-string
```

### Development

```bash
# Start development server
pnpm dev

# Run tests
pnpm test

# Build for production
pnpm build

# Preview production build
pnpm preview
```

<br />

---

## Documentation

Detailed documentation for each system component:

| Document | Description |
|----------|-------------|
| [Architecture Overview](docs/ARCHITECTURE.md) | System design, component relationships, data flow |
| [Gemini AI Mechanism](docs/GEMINI_MECHANISM.md) | Key pool management, prompts, parsers, caching |
| [Theme System](docs/THEME_SYSTEM.md) | Time-based themes, mood overrides, CSS variables |
| [Quiz Mechanism](docs/QUIZ_MECHANISM.md) | Learning phases, question types, answer matching |
| [State Management](docs/STATE_MANAGEMENT.md) | Zustand stores, persistence, selectors |
| [Authentication](docs/AUTHENTICATION.md) | OTP flow, session management, security |
| [Sync Mechanism](docs/SYNC_MECHANISM.md) | Offline-first sync, queue processing, conflict resolution |
| [PWA Features](docs/PWA_FEATURES.md) | Service worker, caching strategies, offline storage |
| [Database Schema](docs/DATABASE_SCHEMA.md) | Tables, relationships, RLS policies |

<br />

---

## Project Structure

```
quietude/
├── public/                 # Static assets
│   ├── robots.txt
│   └── site.webmanifest
├── src/
│   ├── components/         # React components
│   │   ├── auth/          # Authentication components
│   │   ├── dashboard/     # Dashboard widgets
│   │   ├── layout/        # Shell, navigation, theming
│   │   ├── learn/         # Study plan, topic roadmap
│   │   ├── notes/         # Note cards, viewer
│   │   ├── quiz/          # Quiz components
│   │   ├── stats/         # Charts, calendar, tables
│   │   ├── ui/            # shadcn/ui components
│   │   └── upload/        # Drop zone, paste area
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Core utilities
│   │   ├── gemini/        # AI integration
│   │   ├── pwa/           # Service worker, offline
│   │   └── firebase/      # Firestore client, sync
│   ├── pages/             # Route pages
│   ├── store/             # Zustand state stores
│   ├── test/              # Test utilities
│   └── types/             # TypeScript definitions
├── docs/                   # Documentation
└── package.json
```

<br />

---

## Learning Phases

Quietude implements a sophisticated state machine for the learning journey:

```
IDLE ──▶ UPLOADING ──▶ ANALYSING ──▶ TOPIC_MAP_READY
                                           │
                                           ▼
TOPIC_COMPLETE ◀── NOTES_READY ◀── QUIZ_RESULT_FAIL
      │                                    │
      │                              QUIZ_RESULT_PASS
      │                                    │
      ▼                                    ▼
DIG_DEEPER_ACTIVE               NOTES_GENERATING
      │                                    │
      └────────────────────────────────────┘
                       │
                       ▼
              TOPIC_SELECTED ──▶ CONFIGURING ──▶ QUIZ_GENERATING
                                                        │
                                                        ▼
                                                 QUIZ_ACTIVE
                                                        │
                                                        ▼
                                               QUIZ_SUBMITTING
```

<br />

---

## API Key Management

Quietude implements production-grade API key rotation:

```typescript
// Key Pool Features:
• Supports 1-6+ API keys
• Automatic rotation based on usage
• Instant failover on quota errors
• 24-hour cooldown for exhausted keys
• Smart retry with key switching
• Usage tracking per key
• Health monitoring
```

When all keys are exhausted, the system gracefully falls back to demo mode with mock data.

<br />

---

## Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript strict mode
- Use conventional commits
- Write tests for new features
- Update documentation as needed

<br />

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

<br />

---

<div align="center">

### Built with intention and care

*Quietude — because learning should feel like a gentle stream, not a raging river.*

<br />

[![GitHub](https://img.shields.io/badge/GitHub-Ns81000%2Fquietude-181717?style=flat-square&logo=github)](https://github.com/Ns81000/quietude)

</div>
