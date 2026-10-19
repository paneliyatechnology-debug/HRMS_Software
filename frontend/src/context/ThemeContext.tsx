'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
  setLight: () => void;
  setDark: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  isDark: false,
  toggleTheme: () => {},
  setLight: () => {},
  setDark: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    localStorage.setItem('hrms_theme', 'light');
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
    setIsDark(false);
  }, []);

  const setLight = () => {
    setIsDark(false);
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
    localStorage.setItem('hrms_theme', 'light');
  };

  const setDark = () => {
    // Keep light mode as default per user request
    setLight();
  };

  const toggleTheme = () => {
    setLight();
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, setLight, setDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
