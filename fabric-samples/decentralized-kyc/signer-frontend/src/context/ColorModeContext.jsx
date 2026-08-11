import { createContext, useContext, useMemo, useState, useCallback } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import getTheme from '../theme.js';

const STORAGE_KEY = 'docchain_color_mode';
const ColorModeContext = createContext(null);

function loadStoredMode() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'dark' || stored === 'light' ? stored : 'light';
  } catch {
    return 'light';
  }
}

// Wraps children in a ThemeProvider whose mode can be toggled at runtime
// (e.g. from a Navbar icon button) and is remembered across visits.
export function ColorModeProvider({ children }) {
  const [mode, setMode] = useState(loadStoredMode());

  const toggleColorMode = useCallback(() => {
    setMode((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // ignore storage errors (e.g. private browsing) — mode just won't persist
      }
      return next;
    });
  }, []);

  const theme = useMemo(() => getTheme(mode), [mode]);

  return (
    <ColorModeContext.Provider value={{ mode, toggleColorMode }}>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </ColorModeContext.Provider>
  );
}

export function useColorMode() {
  const ctx = useContext(ColorModeContext);
  if (!ctx) throw new Error('useColorMode must be used within ColorModeProvider');
  return ctx;
}
