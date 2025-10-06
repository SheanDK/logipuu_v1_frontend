'use client';

import React, { useMemo } from 'react';
import { ThemeProvider, CssBaseline, createTheme } from '@mui/material';
import { useLayout } from '@/contexts/LayoutContext';
import { getDesignTokens } from '@/styles/theme';

export default function AppThemeWrapper({ children }: { children: React.ReactNode }) {
  const { themeMode } = useLayout();
  const theme = useMemo(() => createTheme(getDesignTokens(themeMode)), [themeMode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
