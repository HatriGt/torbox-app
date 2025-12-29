'use client';

import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [darkMode, setDarkMode] = useState(true); // Default to dark mode
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    // Load theme from localStorage on mount, default to dark if not set
    const storedTheme = localStorage.getItem('darkMode');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Use stored theme if exists, otherwise default to dark mode
    const initialTheme = storedTheme !== null ? storedTheme === 'true' : true;
    setDarkMode(initialTheme);
    
    // Apply theme to document
    document.documentElement.classList.toggle('dark', initialTheme);
  }, []);

  // Ensure theme is applied whenever darkMode changes
  useEffect(() => {
    if (isClient) {
      document.documentElement.classList.toggle('dark', darkMode);
      localStorage.setItem('darkMode', darkMode);
    }
  }, [darkMode, isClient]);

  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  const value = {
    darkMode,
    toggleDarkMode,
    isClient,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
