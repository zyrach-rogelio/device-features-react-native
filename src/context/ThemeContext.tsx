import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ThemeColors } from '../types';

const lightColors: ThemeColors = {
  background: '#F6F4F0',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  text: '#1A1A1A',
  subtext: '#666666',
  border: '#E4E1D9',
  primary: '#534AB7',
  danger: '#D85A30',
  inputBg: '#F9F8F5',
};

const darkColors: ThemeColors = {
  background: '#0F0F0F',
  surface: '#1C1C1C',
  card: '#242424',
  text: '#F0F0F0',
  subtext: '#999999',
  border: '#333333',
  primary: '#7B73E0',
  danger: '#E07050',
  inputBg: '#1A1A1A',
};

interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
  colors: ThemeColors;
}

const ThemeContext = createContext<ThemeContextType>({
  isDark: false,
  toggleTheme: () => {},
  colors: lightColors,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState<boolean>(false);

  const toggleTheme = () => setIsDark((prev) => !prev);

  return (
    <ThemeContext.Provider
      value={{
        isDark,
        toggleTheme,
        colors: isDark ? darkColors : lightColors,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = (): ThemeContextType => useContext(ThemeContext);