// frontend/src/theme/ThemeProvider.tsx
'use client';

import React, { ReactNode, useMemo } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme, Theme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useLayout } from '@/contexts/LayoutContext';
import { getDesignTokens } from './theme'; // Import our new theme configuration

export default function ThemeProvider({ children }: { children: ReactNode }) {
    const { themeMode } = useLayout();

    // --- THIS IS THE FIX ---
    // useMemo ensures the theme is only recalculated when the themeMode changes.
    const theme: Theme = useMemo(() => createTheme(getDesignTokens(themeMode)), [themeMode]);

    return (
        <MuiThemeProvider theme={theme}>
            <CssBaseline />
            {children}
        </MuiThemeProvider>
    );
}