import { useState, useEffect } from 'react';

const KEY = 'pfj:theme';

export function useTheme() {
  const [isDark, setIsDark] = useState(() => {
    // Default: light mode. Only go dark if user explicitly chose it before.
    return localStorage.getItem(KEY) === 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem(KEY, isDark ? 'dark' : 'light');
  }, [isDark]);

  return { isDark, toggle: () => setIsDark((d) => !d) };
}
