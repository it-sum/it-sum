'use client';

import { createContext, useContext, useLayoutEffect, useRef, useState, type ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'it-sum-theme';

function resolveTheme(theme: Theme): 'light' | 'dark' {
  return theme === 'system'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : theme;
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  const resolved = resolveTheme(theme);

  root.dataset.theme = resolved;
  root.dataset.themePreference = theme;
  root.style.colorScheme = resolved;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  const preferenceRef = useRef<Theme>('light');

  useLayoutEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const initial: Theme = stored === 'dark' || stored === 'system' ? stored : 'light';

    preferenceRef.current = initial;
    setTheme(initial);
    applyTheme(initial);

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (preferenceRef.current === 'system') applyTheme('system');
    };

    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, []);

  function changeTheme(next: Theme) {
    preferenceRef.current = next;
    setTheme(next);
    window.localStorage.setItem(STORAGE_KEY, next);
    applyTheme(next);
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme: changeTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme(): ThemeContextValue {
  const value = useContext(ThemeContext);
  if (value == null) throw new Error('useTheme must be used inside ThemeProvider');
  return value;
}
