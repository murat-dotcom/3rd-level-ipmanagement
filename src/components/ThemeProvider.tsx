'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { getProgress, saveProgress } from '@/lib/storage';
import { ThemeName } from '@/types/question';

type Mode = 'light' | 'dark';

interface ThemeContextValue {
  mode: Mode;
  colorTheme: ThemeName;
  toggleMode: () => void;
  setColorTheme: (theme: ThemeName) => void;
  // Backwards compat
  theme: Mode;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'light',
  colorTheme: 'ocean',
  toggleMode: () => {},
  setColorTheme: () => {},
  theme: 'light',
  toggleTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

function applyTheme(mode: Mode, colorTheme: ThemeName) {
  const html = document.documentElement;
  html.setAttribute('data-mode', mode);
  html.setAttribute('data-theme', colorTheme);
  html.classList.toggle('dark', mode === 'dark');
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<Mode>('light');
  const [colorTheme, setColorThemeState] = useState<ThemeName>('ocean');

  useEffect(() => {
    const progress = getProgress();
    const savedMode = progress.theme || 'light';
    const savedTheme = progress.colorTheme || 'ocean';
    setMode(savedMode);
    setColorThemeState(savedTheme);
    applyTheme(savedMode, savedTheme);
  }, []);

  const toggleMode = () => {
    const next: Mode = mode === 'light' ? 'dark' : 'light';
    setMode(next);
    applyTheme(next, colorTheme);
    const progress = getProgress();
    progress.theme = next;
    saveProgress(progress);
  };

  const setColorTheme = (theme: ThemeName) => {
    setColorThemeState(theme);
    applyTheme(mode, theme);
    const progress = getProgress();
    progress.colorTheme = theme;
    saveProgress(progress);
  };

  return (
    <ThemeContext.Provider
      value={{
        mode,
        colorTheme,
        toggleMode,
        setColorTheme,
        theme: mode,
        toggleTheme: toggleMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
