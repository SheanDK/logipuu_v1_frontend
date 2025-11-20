// src/app/layout.tsx
import '@/app/globals.css';
import 'leaflet/dist/leaflet.css';
import React from 'react';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';        // MUI provider for App Router – handles Emotion caching and style hydration
import { AuthProvider } from '@/contexts/AuthContext';                              // Custom authentication context
import { LayoutProvider } from '@/contexts/LayoutContext';                          // Manages layout state (sidebar, headers, etc.)
import AppThemeWrapper from '@/components/theme/AppThemeWrapper';                   // Wraps MUI theme and CssBaseline setup
import { fallbackLng } from '@/i18n/settings';                                      // Default language code for <html lang>
import { DriverSessionProvider } from '@/contexts/DriverSessionContext';            // Context for driver session / work shift state
import { SettingsProvider } from '@/contexts/SettingsContext';                      // User/app settings state
import ConnectivityBoundary from '@/components/providers/ConnectivityBoundary';     // Component that monitors network connectivity 
import DriverOfflineBootstrap from '@/components/providers/DriverOfflineBootstrap'; // Prepares offline mode


export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang={fallbackLng}>
      <head>
        <title>WoodMaster LogiApp</title>
      </head>
      <body>
        <AppRouterCacheProvider>
          <SettingsProvider>
            <AuthProvider>
              <DriverSessionProvider>
                <ConnectivityBoundary>
                  <DriverOfflineBootstrap>
                    <LayoutProvider>
                      <AppThemeWrapper>{children}</AppThemeWrapper>
                    </LayoutProvider>
                  </DriverOfflineBootstrap>
                </ConnectivityBoundary>
              </DriverSessionProvider>
            </AuthProvider>
          </SettingsProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
