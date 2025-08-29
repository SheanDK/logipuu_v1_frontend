// frontend/src/styles/theme.ts

import { PaletteMode, Theme } from '@mui/material'; // <<<--- Theme type එක import කරගන්න
import { amber, deepOrange, grey } from '@mui/material/colors';

// Function to create a theme based on the mode
export const getDesignTokens = (mode: PaletteMode) => ({
    palette: {
        mode,
        ...(mode === 'light'
            ? {
                primary: { main: '#C1A78E' },
                secondary: { main: '#dc004e' },
                divider: amber[200],
                text: {
                    primary: grey[900],
                    secondary: grey[800],
                },
                background: {
                    default: grey[100],
                    paper: '#ffffff',
                }
            }
            : {
                primary: { main: '#64b5f6' },
                secondary: { main: '#f48fb1' },
                divider: deepOrange[700],
                background: {
                    default: grey[900],
                    paper: grey[800],
                },
                text: {
                    primary: '#fffff7',
                    secondary: grey[500],
                },
            }),
    },
    typography: {
        fontFamily: 'Roboto, Arial, sans-serif',
    },
    components: {
        MuiAppBar: {
            styleOverrides: {
                // theme parameter එකට Theme type එක assign කරනවා
                root: ({ theme }: { theme: Theme }) => ({ // <<<--- මෙතන වෙනස් කළා
                    // Use theme.palette.mode instead of the mode from getDesignTokens closure
                    // for consistency if theme object is passed around.
                    backgroundColor: theme.palette.mode === 'dark' ? grey[800] : theme.palette.primary.main,
                }),
            },
        },
        // You can add other component overrides here
        MuiDrawer: {
            styleOverrides: {
                paper: ({ theme }: { theme: Theme }) => ({
                     backgroundColor: theme.palette.mode === 'dark' ? grey[800] : grey[50], // Example for Drawer
                }),
            }
        },
        MuiButton: {
            styleOverrides: {
                // Example: contained primary button style
                containedPrimary: ({theme}: {theme: Theme}) => ({
                    color: theme.palette.primary.contrastText, // Ensure contrast
                })
            }
        }
    },
});