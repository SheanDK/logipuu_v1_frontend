// frontend/src/theme/theme.ts
import { PaletteMode } from '@mui/material';
import { amber, grey, deepOrange } from '@mui/material/colors';

// This function returns the theme configuration object based on the mode (light/dark)
export const getDesignTokens = (mode: PaletteMode) => ({
  palette: {
    mode,
    ...(mode === 'light'
      ? {
          // Palette values for light mode
          primary: {
            main: '#8d7c63ff', // A nice brown color
            light: '#BE9C91',
            dark: '#5F4339',
          },
          secondary: {
            main: '#FFC107', // A vibrant amber/yellow
            light: '#FFD54F',
            dark: '#FFA000',
          },
          divider: 'rgba(248, 154, 14, 0.48)',
          background: {
            default: '#ffffffff', // Off-white background
            paper: '#FFFFFF',
          },
          text: {
            primary: grey[900],
            secondary: grey[700],
          },
        }
      : {
          // Palette values for dark mode
          primary: {
            main: '#BE9C91', // Lighter brown for dark mode
            light: '#F1CEBF',
            dark: '#dd5f31ff',
          },

          secondary: {
            main: '#FFC107', // Amber works well in dark mode too
          },
          divider: 'rgba(241, 188, 14, 0.36)',
          background: {
            default: '#3d3d3cff',
            paper: '#2b2a2ace',
          },
          text: {
            primary: '#fff',
            secondary: grey[500],
          },
        }),
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
        fontWeight: 700,
    },
    h5: {
        fontWeight: 700,
    },
    h6: {
        fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        containedPrimary: {
          color: '#fff', // White text on primary buttons
        },
      },
    },
    MuiAppBar: {
        styleOverrides: {
            root: {
                // In light mode, the AppBar will have a clean white background
                backgroundColor: mode === 'light' ? '#FFFFFF' : '#1E1E1E',
                color: mode === 'light' ? grey[900] : '#FFFFFF',
            }
        }
    }
  }
});