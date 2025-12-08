import { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import getModernTheme from '../theme/modernTheme';

const ThemeContext = createContext(null);

export const useThemeContext = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [mode, setMode] = useState(() => {
    return localStorage.getItem('theme-mode') || 'light';
  });

  const [fontSize, setFontSize] = useState(() => {
    return localStorage.getItem('font-size') || 'medium';
  });

  const [highContrast, setHighContrast] = useState(() => {
    return localStorage.getItem('high-contrast') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('theme-mode', mode);
  }, [mode]);

  useEffect(() => {
    localStorage.setItem('font-size', fontSize);
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem('high-contrast', highContrast);
  }, [highContrast]);

  const toggleTheme = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  const getFontSize = () => {
    const sizes = {
      small: 12,
      medium: 14,
      large: 16,
      'extra-large': 18,
    };
    return sizes[fontSize] || 14;
  };

  const theme = useMemo(
    () => getModernTheme(mode),
    [mode, fontSize, highContrast]
  );

  const value = {
    mode,
    toggleTheme,
    fontSize,
    setFontSize,
    highContrast,
    setHighContrast,
  };

  return (
    <ThemeContext.Provider value={value}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};
