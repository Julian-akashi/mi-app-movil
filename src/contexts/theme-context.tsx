import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance } from 'react-native';
import { getSavedTheme, saveTheme } from '../database';

type ThemeContextValue = {
  colorScheme: 'light' | 'dark';
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [colorScheme, setColorScheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    let active = true;

    getSavedTheme()
      .then((savedTheme) => {
        if (active) {
          setColorScheme(savedTheme);
          Appearance.setColorScheme(savedTheme);
        }
      })
      .catch((error) => {
        console.error('No se pudo cargar el tema guardado:', error);
      });

    return () => {
      active = false;
    };
  }, []);

  const toggleTheme = useCallback(() => {
    const nextTheme = colorScheme === 'dark' ? 'light' : 'dark';
    setColorScheme(nextTheme);
    Appearance.setColorScheme(nextTheme);
    saveTheme(nextTheme).catch((error) => {
      console.error('No se pudo guardar el tema:', error);
    });
  }, [colorScheme]);

  const value = useMemo(() => ({ colorScheme, toggleTheme }), [colorScheme, toggleTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useAppTheme debe usarse dentro de ThemeProvider.');
  }

  return context;
}
