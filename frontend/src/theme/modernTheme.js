import { createTheme } from '@mui/material/styles';

// Modern Professional Theme inspired by Binance
export const getModernTheme = (mode) => createTheme({
  palette: {
    mode,
    primary: {
      main: mode === 'dark' ? '#60A5FA' : '#1D4ED8', // Blue tones
      light: mode === 'dark' ? '#93C5FD' : '#3B82F6',
      dark: mode === 'dark' ? '#1D4ED8' : '#1E3A8A',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: mode === 'dark' ? '#38BDF8' : '#0F172A',
      light: mode === 'dark' ? '#7DD3FC' : '#1F2937',
      dark: mode === 'dark' ? '#0EA5E9' : '#020617',
      contrastText: '#FFFFFF',
    },
    background: {
      default: mode === 'dark' ? '#020617' : '#F3F4F6',
      paper: mode === 'dark' ? '#020617' : '#FFFFFF',
      elevated: mode === 'dark' ? '#0B1120' : '#E5E7EB',
    },
    text: {
      primary: mode === 'dark' ? '#E5E7EB' : '#111827',
      secondary: mode === 'dark' ? '#9CA3AF' : '#4B5563',
      disabled: mode === 'dark' ? '#6B7280' : '#9CA3AF',
    },
    success: {
      main: '#16A34A',
      light: '#22C55E',
      dark: '#166534',
      contrastText: '#FFFFFF',
    },
    error: {
      main: '#DC2626',
      light: '#F97373',
      dark: '#991B1B',
      contrastText: '#FFFFFF',
    },
    warning: {
      main: '#D97706',
      light: '#FBBF24',
      dark: '#92400E',
      contrastText: '#111827',
    },
    info: {
      main: '#2563EB',
      light: '#3B82F6',
      dark: '#1D4ED8',
      contrastText: '#FFFFFF',
    },
    divider: mode === 'dark' ? '#1F2937' : '#E5E7EB',
  },
  typography: {
    fontFamily: '"Times New Roman", Times, serif',
    h1: {
      fontFamily: '"Times New Roman", Times, serif',
      fontSize: '2.6rem',
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontFamily: '"Times New Roman", Times, serif',
      fontSize: '2.2rem',
      fontWeight: 700,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontFamily: '"Times New Roman", Times, serif',
      fontSize: '1.8rem',
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    h4: {
      fontFamily: '"Times New Roman", Times, serif',
      fontSize: '1.5rem',
      fontWeight: 600,
    },
    h5: {
      fontFamily: '"Times New Roman", Times, serif',
      fontSize: '1.25rem',
      fontWeight: 600,
    },
    h6: {
      fontFamily: '"Times New Roman", Times, serif',
      fontSize: '1.1rem',
      fontWeight: 600,
    },
    subtitle1: {
      fontFamily: '"Times New Roman", Times, serif',
      fontSize: '1rem',
      fontWeight: 500,
    },
    subtitle2: {
      fontFamily: '"Times New Roman", Times, serif',
      fontSize: '0.95rem',
      fontWeight: 500,
    },
    body1: {
      fontFamily: '"Times New Roman", Times, serif',
      fontSize: '0.95rem',
      fontWeight: 400,
    },
    body2: {
      fontFamily: '"Times New Roman", Times, serif',
      fontSize: '0.9rem',
      fontWeight: 400,
    },
    button: {
      fontFamily: '"Times New Roman", Times, serif',
      fontSize: '0.9rem',
      fontWeight: 600,
      textTransform: 'none',
    },
    caption: {
      fontFamily: '"Times New Roman", Times, serif',
      fontSize: '0.75rem',
      fontWeight: 400,
    },
  },
  shape: {
    borderRadius: 8,
  },
  shadows: [
    'none',
    mode === 'dark' 
      ? '0px 2px 4px rgba(0, 0, 0, 0.4)'
      : '0px 2px 4px rgba(0, 0, 0, 0.08)',
    mode === 'dark'
      ? '0px 4px 8px rgba(0, 0, 0, 0.4)'
      : '0px 4px 8px rgba(0, 0, 0, 0.08)',
    mode === 'dark'
      ? '0px 8px 16px rgba(0, 0, 0, 0.4)'
      : '0px 8px 16px rgba(0, 0, 0, 0.08)',
    mode === 'dark'
      ? '0px 12px 24px rgba(0, 0, 0, 0.4)'
      : '0px 12px 24px rgba(0, 0, 0, 0.08)',
    mode === 'dark'
      ? '0px 16px 32px rgba(0, 0, 0, 0.4)'
      : '0px 16px 32px rgba(0, 0, 0, 0.08)',
    ...Array(19).fill('none'),
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          padding: '10px 24px',
          fontSize: '14px',
          fontWeight: 600,
          textTransform: 'none',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
        contained: {
          '&:hover': {
            transform: 'translateY(-1px)',
            transition: 'all 0.2s ease',
          },
        },
        containedPrimary: {
          background: '#F0B90B',
          color: '#000000',
          '&:hover': {
            background: '#FCD535',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          border: mode === 'dark' ? '1px solid #2B3139' : '1px solid #EAECEF',
          boxShadow:
            mode === 'dark'
              ? '0 12px 30px rgba(0,0,0,0.6)'
              : '0 12px 30px rgba(15,23,42,0.12)',
          backgroundImage: 'linear-gradient(135deg, rgba(240,185,11,0.04), transparent)',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow:
              mode === 'dark'
                ? '0 18px 40px rgba(0,0,0,0.8)'
                : '0 18px 40px rgba(15,23,42,0.18)',
            borderColor: '#F0B90B',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          fontWeight: 600,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 4,
            backgroundColor: mode === 'dark' ? '#1E2329' : '#FAFAFA',
            '& fieldset': {
              borderColor: mode === 'dark' ? '#2B3139' : '#EAECEF',
            },
            '&:hover fieldset': {
              borderColor: mode === 'dark' ? '#474D57' : '#B7BDC6',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#F0B90B',
              borderWidth: 2,
            },
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: mode === 'dark' ? '#1E2329' : '#FFFFFF',
          color: mode === 'dark' ? '#EAECEF' : '#1E2329',
          boxShadow: 'none',
          borderBottom: mode === 'dark' ? '1px solid #2B3139' : '1px solid #EAECEF',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: mode === 'dark' ? '#1E2329' : '#FFFFFF',
          borderRight: mode === 'dark' ? '1px solid #2B3139' : '1px solid #EAECEF',
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: mode === 'dark' ? '#111827' : '#F3F4F6',
        },
      },
    },
  },
});

export default getModernTheme;
