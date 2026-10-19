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
    // Force default to clean light mode as requested by user
    const saved = localStorage.getItem('hrms_theme');
    if (saved === 'dark') {
      // If user had manually selected dark previously, let's reset to light as requested
      localStorage.setItem('hrms_theme', 'light');
    }
    document.documentElement.classList.remove('dark');
    setIsDark(false);
  }, []);

  const setLight = () => {
    setIsDark(false);
    document.documentElement.classList.remove('dark');
    localStorage.setItem('hrms_theme', 'light');
  };

  const setDark = () => {
    setIsDark(true);
    document.documentElement.classList.add('dark');
    localStorage.setItem('hrms_theme', 'dark');
  };

  const toggleTheme = () => {
    if (isDark) {
      setLight();
    } else {
      setDark();
    }
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, setLight, setDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
