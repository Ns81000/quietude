import { useEffect } from 'react';
import { getActiveTheme, applyTheme, getTimeTheme, getPersistedMood } from '@/lib/theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    applyTheme(getActiveTheme());

    const interval = setInterval(() => {
      if (!getPersistedMood()) {
        applyTheme(getTimeTheme());
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return <>{children}</>;
}
