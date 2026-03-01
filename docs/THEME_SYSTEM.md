# Theme System

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6?style=flat-square)](https://typescriptlang.org)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8?style=flat-square)](https://tailwindcss.com)
[![CSS Variables](https://img.shields.io/badge/CSS_Variables-Custom_Properties-ff6b6b?style=flat-square)](https://developer.mozilla.org/docs/Web/CSS/--*)

Quietude features an **adaptive theming system** that responds to both time of day and user mood preferences. The system creates a harmonious visual experience that aligns with natural circadian rhythms while respecting individual preferences.

---

## Table of Contents

- [Philosophy](#philosophy)
- [Time-Based Themes](#time-based-themes)
- [Mood Override System](#mood-override-system)
- [CSS Architecture](#css-architecture)
- [Theme Provider](#theme-provider)
- [Mood Control Component](#mood-control-component)
- [Color Token Reference](#color-token-reference)
- [Implementation Details](#implementation-details)

---

## Philosophy

The theming system is built on the principle that **environment affects cognition**. By automatically adjusting colors based on time of day, Quietude reduces visual fatigue and supports natural focus patterns:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CIRCADIAN VISUAL RHYTHM                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   🌅 Morning (5-11)    → Warm, energizing tones to kickstart learning       │
│   ☀️  Afternoon (11-17) → Balanced, neutral palette for sustained focus      │
│   🌤️  Golden (17-19)    → Soft amber transition as day winds down           │
│   🌆 Evening (19-22)   → Cool, calming tones for relaxed review             │
│   🌙 Midnight (22-5)   → Deep, low-contrast for reduced eye strain          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Time-Based Themes

### Theme Schedule

The system automatically selects themes based on the current hour:

```typescript
// src/lib/theme.ts
export type TimedTheme = 'morning' | 'afternoon' | 'golden' | 'evening' | 'midnight';

export function getTimeTheme(): TimedTheme {
  const hour = new Date().getHours();
  
  if (hour >= 5 && hour < 11)  return 'morning';
  if (hour >= 11 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 19) return 'golden';
  if (hour >= 19 && hour < 22) return 'evening';
  return 'midnight';
}
```

### Time Theme Characteristics

```
┌──────────────┬─────────────┬────────────────────────────────────────────────┐
│ THEME        │ HOURS       │ VISUAL CHARACTERISTICS                         │
├──────────────┼─────────────┼────────────────────────────────────────────────┤
│ morning      │ 05:00-10:59 │ Warm cream backgrounds, coral accents          │
│              │             │ High contrast for alertness                    │
│              │             │ Rose and peach undertones                      │
├──────────────┼─────────────┼────────────────────────────────────────────────┤
│ afternoon    │ 11:00-16:59 │ Clean white/light gray base                    │
│              │             │ Balanced neutral palette                       │
│              │             │ Maximum readability for focused work           │
├──────────────┼─────────────┼────────────────────────────────────────────────┤
│ golden       │ 17:00-18:59 │ Warm amber and honey tones                     │
│              │             │ Nostalgic, sunset-inspired                     │
│              │             │ Transitional warmth                            │
├──────────────┼─────────────┼────────────────────────────────────────────────┤
│ evening      │ 19:00-21:59 │ Cool slate and blue-gray                       │
│              │             │ Reduced brightness for comfort                 │
│              │             │ Calming undertones                             │
├──────────────┼─────────────┼────────────────────────────────────────────────┤
│ midnight     │ 22:00-04:59 │ Deep charcoal and navy backgrounds             │
│              │             │ Lowest contrast for eye protection             │
│              │             │ Minimal blue light emission                    │
└──────────────┴─────────────┴────────────────────────────────────────────────┘
```

---

## Mood Override System

### Available Moods

Users can override the automatic time-based theme with a **mood preference** that persists until cleared:

```typescript
export type MoodTheme = 'sage' | 'storm' | 'sand' | 'plum' | 'ink' | null;
```

### Mood Characteristics

```
┌───────────────────────────────────────────────────────────────────────────────┐
│                             MOOD THEMES                                       │
├───────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│   ┌─────────┐  SAGE                                                          │
│   │ ░░░░░░░ │  Muted green and earthy tones                                  │
│   │ ░░███░░ │  Inspired by forest canopies                                   │
│   │ ░░░░░░░ │  Best for: Calm, nature-focused sessions                       │
│   └─────────┘                                                                 │
│                                                                               │
│   ┌─────────┐  STORM                                                         │
│   │ ▓▓▓▓▓▓▓ │  Cool grays and steel blues                                    │
│   │ ▓▓███▓▓ │  Inspired by overcast skies                                    │
│   │ ▓▓▓▓▓▓▓ │  Best for: Deep focus, analytical work                         │
│   └─────────┘                                                                 │
│                                                                               │
│   ┌─────────┐  SAND                                                          │
│   │ ▒▒▒▒▒▒▒ │  Warm beige and terracotta                                     │
│   │ ▒▒███▒▒ │  Inspired by desert landscapes                                 │
│   │ ▒▒▒▒▒▒▒ │  Best for: Comfortable, extended reading                       │
│   └─────────┘                                                                 │
│                                                                               │
│   ┌─────────┐  PLUM                                                          │
│   │ ░▓░▓░▓░ │  Deep purples and mauve accents                                │
│   │ ▓░███░▓ │  Inspired by twilight gardens                                  │
│   │ ░▓░▓░▓░ │  Best for: Creative, imaginative work                          │
│   └─────────┘                                                                 │
│                                                                               │
│   ┌─────────┐  INK                                                           │
│   │ ███████ │  True dark mode with pure blacks                               │
│   │ ██░░░██ │  Maximum contrast reduction                                    │
│   │ ███████ │  Best for: Night owls, OLED displays                           │
│   └─────────┘                                                                 │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘
```

---

## CSS Architecture

### Custom Property System

The theme system uses CSS custom properties (CSS variables) defined on the `:root` element with `data-theme` and `data-mood` attribute selectors:

```css
/* Base structure in src/index.css */

/* Default light theme variables */
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96.1%;
  --muted: 210 40% 96.1%;
  --accent: 210 40% 96.1%;
  --border: 214.3 31.8% 91.4%;
  --ring: 222.2 84% 4.9%;
  --radius: 0.5rem;
}
```

### Time Theme Definitions

```css
/* Morning Theme - Warm, energizing */
[data-theme="morning"] {
  --background: 30 50% 98%;      /* Warm cream */
  --foreground: 20 30% 20%;      /* Deep brown */
  --card: 30 40% 97%;
  --primary: 12 76% 61%;         /* Coral accent */
  --secondary: 30 30% 92%;
  --muted: 30 20% 90%;
  --accent: 24 95% 65%;          /* Warm orange */
  --border: 30 30% 85%;
}

/* Afternoon Theme - Balanced, neutral */
[data-theme="afternoon"] {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --card: 0 0% 100%;
  --primary: 222.2 47.4% 11.2%;
  --secondary: 210 40% 96.1%;
  --muted: 210 40% 96.1%;
  --accent: 210 40% 96.1%;
  --border: 214.3 31.8% 91.4%;
}

/* Golden Theme - Sunset warmth */
[data-theme="golden"] {
  --background: 40 60% 96%;      /* Honey cream */
  --foreground: 30 40% 18%;      /* Warm brown */
  --card: 40 50% 95%;
  --primary: 35 90% 50%;         /* Golden amber */
  --secondary: 40 40% 90%;
  --muted: 40 30% 88%;
  --accent: 28 85% 55%;          /* Sunset orange */
  --border: 40 35% 82%;
}

/* Evening Theme - Cool, calming */
[data-theme="evening"] {
  --background: 220 25% 18%;     /* Slate blue */
  --foreground: 210 30% 90%;     /* Soft white */
  --card: 220 25% 22%;
  --primary: 210 60% 70%;        /* Sky blue */
  --secondary: 220 20% 28%;
  --muted: 220 15% 32%;
  --accent: 200 65% 60%;         /* Ocean blue */
  --border: 220 20% 35%;
}

/* Midnight Theme - Deep, protective */
[data-theme="midnight"] {
  --background: 230 25% 10%;     /* Deep navy */
  --foreground: 220 20% 85%;     /* Muted white */
  --card: 230 25% 14%;
  --primary: 220 50% 65%;        /* Soft blue */
  --secondary: 230 20% 18%;
  --muted: 230 15% 22%;
  --accent: 250 40% 60%;         /* Purple hint */
  --border: 230 20% 25%;
}
```

### Mood Override Definitions

```css
/* Sage Mood - Forest serenity */
[data-mood="sage"] {
  --background: 140 20% 95%;     /* Misty green */
  --foreground: 140 30% 18%;     /* Forest green */
  --card: 140 18% 93%;
  --primary: 145 45% 42%;        /* Sage green */
  --secondary: 140 15% 88%;
  --muted: 140 12% 85%;
  --accent: 155 50% 48%;         /* Emerald */
  --border: 140 18% 80%;
}

/* Storm Mood - Overcast focus */
[data-mood="storm"] {
  --background: 215 20% 22%;     /* Steel gray */
  --foreground: 210 15% 88%;     /* Silver white */
  --card: 215 20% 26%;
  --primary: 210 35% 60%;        /* Storm blue */
  --secondary: 215 18% 30%;
  --muted: 215 15% 34%;
  --accent: 200 40% 55%;         /* Lightning blue */
  --border: 215 18% 38%;
}

/* Sand Mood - Desert warmth */
[data-mood="sand"] {
  --background: 35 40% 94%;      /* Warm sand */
  --foreground: 25 35% 22%;      /* Terracotta brown */
  --card: 35 35% 92%;
  --primary: 25 55% 50%;         /* Terracotta */
  --secondary: 35 30% 88%;
  --muted: 35 25% 85%;
  --accent: 15 60% 55%;          /* Rust orange */
  --border: 35 28% 78%;
}

/* Plum Mood - Twilight creativity */
[data-mood="plum"] {
  --background: 280 25% 18%;     /* Deep plum */
  --foreground: 280 15% 88%;     /* Lavender white */
  --card: 280 25% 22%;
  --primary: 280 50% 65%;        /* Bright plum */
  --secondary: 280 20% 26%;
  --muted: 280 15% 30%;
  --accent: 300 45% 60%;         /* Magenta */
  --border: 280 18% 35%;
}

/* Ink Mood - Pure dark mode */
[data-mood="ink"] {
  --background: 0 0% 5%;         /* Near black */
  --foreground: 0 0% 92%;        /* Off white */
  --card: 0 0% 8%;
  --primary: 0 0% 80%;           /* Light gray */
  --secondary: 0 0% 12%;
  --muted: 0 0% 15%;
  --accent: 0 0% 70%;            /* Medium gray */
  --border: 0 0% 20%;
}
```

---

## Theme Provider

### Component Structure

The `ThemeProvider` component manages theme state and synchronization:

```
┌───────────────────────────────────────────────────────────────────────────────┐
│                           THEME PROVIDER                                      │
├───────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│   ┌─────────────────────────────────────────────────────────────────────┐    │
│   │                        ThemeProvider                                 │    │
│   │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │    │
│   │  │   useEffect     │  │   useEffect     │  │   useEffect     │     │    │
│   │  │   (interval)    │  │   (mood)        │  │   (theme)       │     │    │
│   │  │   1min check    │  │   onChange      │  │   onChange      │     │    │
│   │  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘     │    │
│   │           │                    │                    │               │    │
│   │           ▼                    ▼                    ▼               │    │
│   │   ┌───────────────────────────────────────────────────────┐        │    │
│   │   │                  applyTheme()                          │        │    │
│   │   │  document.documentElement.setAttribute()               │        │    │
│   │   │  - data-theme="morning|afternoon|golden|evening|..."   │        │    │
│   │   │  - data-mood="sage|storm|sand|plum|ink" (if set)       │        │    │
│   │   └───────────────────────────────────────────────────────┘        │    │
│   │                                                                     │    │
│   └─────────────────────────────────────────────────────────────────────┘    │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘
```

### Implementation

```typescript
// src/components/layout/ThemeProvider.tsx
import { useEffect } from 'react';
import { useUIStore } from '@/store/ui';
import { getTimeTheme, applyTheme, MoodTheme } from '@/lib/theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const mood = useUIStore((state) => state.mood);
  const setTheme = useUIStore((state) => state.setTheme);

  // Initial theme application
  useEffect(() => {
    const timeTheme = getTimeTheme();
    setTheme(timeTheme);
    applyTheme(timeTheme, mood);
  }, []);

  // Periodic time-based theme updates
  useEffect(() => {
    const checkAndUpdateTheme = () => {
      const newTheme = getTimeTheme();
      setTheme(newTheme);
      applyTheme(newTheme, mood);
    };

    // Check every minute for theme transitions
    const interval = setInterval(checkAndUpdateTheme, 60000);
    
    return () => clearInterval(interval);
  }, [mood, setTheme]);

  // Mood change handler
  useEffect(() => {
    const currentTheme = getTimeTheme();
    applyTheme(currentTheme, mood);
  }, [mood]);

  return <>{children}</>;
}
```

### Theme Application Function

```typescript
// src/lib/theme.ts
export function applyTheme(theme: TimedTheme, mood: MoodTheme): void {
  const root = document.documentElement;
  
  // Always set the time-based theme
  root.setAttribute('data-theme', theme);
  
  // Apply or remove mood override
  if (mood) {
    root.setAttribute('data-mood', mood);
  } else {
    root.removeAttribute('data-mood');
  }
}
```

---

## Mood Control Component

### User Interface

The `MoodControl` component provides an accessible interface for mood selection:

```
┌───────────────────────────────────────────────────────────────────────────────┐
│                           MOOD SELECTOR                                       │
├───────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│   ┌─────────────────────────────────────────────────────────────────────┐    │
│   │  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐             │    │
│   │  │ 🌿  │  │ 🌩️  │  │ 🏜️  │  │ 🍇  │  │ 🖋️  │  │ ❌  │             │    │
│   │  │Sage │  │Storm│  │Sand │  │Plum │  │ Ink │  │Clear│             │    │
│   │  └──┬──┘  └──┬──┘  └──┬──┘  └──┬──┘  └──┬──┘  └──┬──┘             │    │
│   │     │        │        │        │        │        │                  │    │
│   │     └────────┴────────┴────────┴────────┴────────┘                  │    │
│   │                         │                                           │    │
│   │                         ▼                                           │    │
│   │              ┌──────────────────────┐                               │    │
│   │              │   setMood(mood)       │                               │    │
│   │              │   Updates UI Store    │                               │    │
│   │              │   Triggers rerender   │                               │    │
│   │              └──────────────────────┘                               │    │
│   │                                                                     │    │
│   └─────────────────────────────────────────────────────────────────────┘    │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘
```

### Implementation

```typescript
// src/components/layout/MoodControl.tsx
import { useUIStore } from '@/store/ui';
import { MoodTheme } from '@/lib/theme';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Palette } from 'lucide-react';

const MOODS: { value: MoodTheme; label: string; description: string }[] = [
  { value: 'sage', label: 'Sage', description: 'Calm forest greens' },
  { value: 'storm', label: 'Storm', description: 'Cool steel grays' },
  { value: 'sand', label: 'Sand', description: 'Warm desert tones' },
  { value: 'plum', label: 'Plum', description: 'Deep purple twilight' },
  { value: 'ink', label: 'Ink', description: 'Pure dark mode' },
];

export function MoodControl() {
  const mood = useUIStore((state) => state.mood);
  const setMood = useUIStore((state) => state.setMood);

  const handleMoodSelect = (newMood: MoodTheme) => {
    // Toggle off if selecting current mood
    if (mood === newMood) {
      setMood(null);
    } else {
      setMood(newMood);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Select mood theme">
          <Palette className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {MOODS.map((m) => (
          <DropdownMenuItem
            key={m.value}
            onClick={() => handleMoodSelect(m.value)}
            className={mood === m.value ? 'bg-accent' : ''}
          >
            <span className="font-medium">{m.label}</span>
            <span className="text-muted-foreground ml-2 text-sm">
              {m.description}
            </span>
          </DropdownMenuItem>
        ))}
        {mood && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setMood(null)}>
              Clear mood override
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

---

## Color Token Reference

### Complete Token Map

All theme tokens follow the HSL color format for consistency and easy manipulation:

```
┌─────────────────┬────────────────────────────────────────────────────────────┐
│ TOKEN           │ PURPOSE                                                    │
├─────────────────┼────────────────────────────────────────────────────────────┤
│ --background    │ Main page background color                                 │
│ --foreground    │ Primary text color                                         │
│ --card          │ Card/container background                                  │
│ --card-fg       │ Card text color                                            │
│ --primary       │ Primary action/brand color                                 │
│ --primary-fg    │ Text on primary color                                      │
│ --secondary     │ Secondary backgrounds                                      │
│ --secondary-fg  │ Text on secondary                                          │
│ --muted         │ Subtle backgrounds                                         │
│ --muted-fg      │ Subtle text (descriptions)                                 │
│ --accent        │ Highlight/focus color                                      │
│ --accent-fg     │ Text on accent                                             │
│ --destructive   │ Error/danger actions                                       │
│ --destructive-fg│ Text on destructive                                        │
│ --border        │ Border colors                                              │
│ --input         │ Input field backgrounds                                    │
│ --ring          │ Focus ring color                                           │
│ --radius        │ Border radius value                                        │
└─────────────────┴────────────────────────────────────────────────────────────┘
```

### Usage in Components

```css
/* Component styling with theme tokens */
.card {
  background: hsl(var(--card));
  color: hsl(var(--card-foreground));
  border: 1px solid hsl(var(--border));
  border-radius: var(--radius);
}

.button-primary {
  background: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
}

.button-primary:hover {
  background: hsl(var(--primary) / 0.9);
}

.text-muted {
  color: hsl(var(--muted-foreground));
}
```

---

## Implementation Details

### CSS Specificity Strategy

The mood override system uses CSS specificity to ensure mood themes take precedence:

```css
/* Specificity Order (lowest to highest):
   1. :root (default values)
   2. [data-theme="..."] (time-based)
   3. [data-mood="..."] (user override - highest priority)
*/

/* Example cascade */
:root {
  --primary: 222.2 47.4% 11.2%;  /* Default blue */
}

[data-theme="morning"] {
  --primary: 12 76% 61%;          /* Override to coral */
}

[data-mood="sage"] {
  --primary: 145 45% 42%;         /* Final override to sage green */
}
```

### Transition Effects

Smooth theme transitions enhance the user experience:

```css
/* Global transition for theme changes */
* {
  transition: background-color 0.3s ease,
              color 0.3s ease,
              border-color 0.3s ease;
}

/* Disable transitions during initial load */
.no-transitions * {
  transition: none !important;
}
```

### State Persistence

Theme preferences are persisted through the Zustand UI store:

```typescript
// src/store/ui.ts
interface UIState {
  theme: TimedTheme;
  mood: MoodTheme;
  setTheme: (theme: TimedTheme) => void;
  setMood: (mood: MoodTheme) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: 'afternoon',
      mood: null,
      setTheme: (theme) => set({ theme }),
      setMood: (mood) => set({ mood }),
    }),
    {
      name: 'quietude-ui',
      partialize: (state) => ({ mood: state.mood }), // Only persist mood
    }
  )
);
```

### Accessibility Considerations

The theme system maintains WCAG 2.1 AA compliance:

```
┌───────────────────────────────────────────────────────────────────────────────┐
│                         ACCESSIBILITY FEATURES                                │
├───────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│   Contrast Ratios                                                             │
│   ├── All themes maintain 4.5:1 minimum for normal text                      │
│   ├── Large text (18px+) maintains 3:1 minimum                               │
│   └── Interactive elements have visible focus indicators                      │
│                                                                               │
│   Reduced Motion Support                                                      │
│   ├── @media (prefers-reduced-motion) respects user preference               │
│   └── Theme transitions can be disabled                                       │
│                                                                               │
│   Color Independence                                                          │
│   ├── Information never conveyed by color alone                              │
│   ├── Icons and labels accompany color indicators                            │
│   └── Focus states use both color and outline                                 │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘
```

---

## Summary

The Quietude theme system provides a **sophisticated yet maintainable** approach to visual customization:

| Feature | Implementation | Benefit |
|---------|----------------|---------|
| Time-based themes | Automatic hourly checks | Reduced eye strain |
| Mood overrides | User-controlled persistence | Personal preference |
| CSS variables | HSL color tokens | Easy customization |
| Smooth transitions | CSS transitions | Polish and refinement |
| State persistence | Zustand with localStorage | Consistent experience |

---

**Related Documentation:**
- [Architecture Overview](./ARCHITECTURE.md) - System design patterns
- [State Management](./STATE_MANAGEMENT.md) - UI store implementation
- [PWA Features](./PWA_FEATURES.md) - Offline theme support

---

<div align="center">
  <sub>Adaptive themes for natural learning rhythms</sub>
</div>
