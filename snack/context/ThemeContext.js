import React, { createContext, useContext, useMemo, useState } from 'react';

const light = {
  background: '#f6f0ea',
  surface: '#ffffff',
  text: '#2f2f2f',
  textMuted: '#7d7d7d',
  border: '#d7b8b0',
};

const dark = {
  background: '#171717',
  surface: '#242424',
  text: '#f5f1ed',
  textMuted: '#b9b0aa',
  border: '#4b3d38',
};

const ThemeContext = createContext({ isDark: false, theme: light, setIsDark: () => {} });

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(false);
  const value = useMemo(() => ({ isDark, theme: isDark ? dark : light, setIsDark }), [isDark]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
