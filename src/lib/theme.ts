export type TimedTheme = 'morning' | 'afternoon' | 'golden' | 'evening' | 'midnight';
export type MoodTheme = 'sage' | 'storm' | 'sand' | 'plum' | 'golden-glow' | 'midnight' | 'morning-mist';
export type AnyTheme = TimedTheme | MoodTheme;

const TIME_THEMES: TimedTheme[] = ['morning', 'afternoon', 'golden', 'evening', 'midnight'];
const MOOD_THEMES: MoodTheme[] = ['sage', 'storm', 'sand', 'plum', 'golden-glow', 'midnight', 'morning-mist'];

function hslToHex(hslValue: string): string | null {
  const match = hslValue.trim().match(/^([\d.]+)\s+([\d.]+)%\s+([\d.]+)%$/);
  if (!match) return null;

  const hue = Number(match[1]) % 360;
  const saturation = Number(match[2]) / 100;
  const lightness = Number(match[3]) / 100;

  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const hueSegment = hue / 60;
  const secondary = chroma * (1 - Math.abs((hueSegment % 2) - 1));

  let red = 0;
  let green = 0;
  let blue = 0;

  if (hueSegment >= 0 && hueSegment < 1) {
    red = chroma;
    green = secondary;
  } else if (hueSegment < 2) {
    red = secondary;
    green = chroma;
  } else if (hueSegment < 3) {
    green = chroma;
    blue = secondary;
  } else if (hueSegment < 4) {
    green = secondary;
    blue = chroma;
  } else if (hueSegment < 5) {
    red = secondary;
    blue = chroma;
  } else {
    red = chroma;
    blue = secondary;
  }

  const matchValue = lightness - chroma / 2;
  const toHex = (value: number) => Math.round((value + matchValue) * 255).toString(16).padStart(2, '0');

  return `#${toHex(red)}${toHex(green)}${toHex(blue)}`;
}

function updateThemeColorMeta(target: HTMLElement): void {
  if (typeof document === 'undefined') return;

  const computedStyle = getComputedStyle(target);
  const themeColor = hslToHex(computedStyle.getPropertyValue('--theme-color'))
    ?? hslToHex(computedStyle.getPropertyValue('--bg'))
    ?? '#c26838';
  let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');

  if (!meta) {
    meta = document.createElement('meta');
    meta.name = 'theme-color';
    document.head.appendChild(meta);
  }

  meta.content = themeColor;
}

// Skip night owl theme (evening/midnight) on March 2-3, 2026
export function isNightOwlSkipDate(): boolean {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed, so March = 2
  const day = now.getDate();
  return year === 2026 && month === 2 && (day === 2 || day === 3);
}

export function getTimeTheme(): TimedTheme {
  const hour = new Date().getHours();
  const skipNightOwl = isNightOwlSkipDate();

  if (hour >= 5 && hour < 11) return 'morning';
  if (hour >= 11 && hour < 16) return 'afternoon';
  if (hour >= 16 && hour < 19) return 'golden';
  // Skip evening and midnight themes on March 2-3, 2026 - fallback to golden hour
  if (hour >= 19 && hour < 22) return skipNightOwl ? 'golden' : 'evening';
  return skipNightOwl ? 'golden' : 'midnight';
}

export function applyTheme(theme: AnyTheme, target: HTMLElement = document.documentElement): void {
  if ((TIME_THEMES as string[]).includes(theme)) {
    target.removeAttribute('data-mood');
    target.setAttribute('data-theme', theme);
  } else {
    target.removeAttribute('data-theme');
    target.setAttribute('data-mood', theme);
  }

  updateThemeColorMeta(target);
}

export function getPersistedMood(): MoodTheme | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem('quietude:mood');
  return MOOD_THEMES.includes(stored as MoodTheme) ? (stored as MoodTheme) : null;
}

export function persistMood(mood: MoodTheme | null): void {
  if (typeof window === 'undefined') return;
  if (mood) localStorage.setItem('quietude:mood', mood);
  else localStorage.removeItem('quietude:mood');
}

export function getActiveTheme(): AnyTheme {
  return getPersistedMood() ?? getTimeTheme();
}

export const THEME_LABELS: Record<AnyTheme, string> = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  golden: 'Golden Hour',
  evening: 'Evening',
  midnight: 'Dark Mode (Midnight)',
  sage: 'Sage',
  storm: 'Storm',
  sand: 'Sand',
  plum: 'Plum',
  'golden-glow': 'Golden Glow',
  'morning-mist': 'Morning Mist',
};

export const TIME_THEME_WINDOWS: Record<TimedTheme, string> = {
  morning: '05:00 – 10:59',
  afternoon: '11:00 – 15:59',
  golden: '16:00 – 18:59',
  evening: '19:00 – 21:59',
  midnight: '22:00 – 04:59',
};
