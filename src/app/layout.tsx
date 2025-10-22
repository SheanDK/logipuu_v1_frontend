// src/app/layout.tsx
import '@/app/globals.css';
import 'leaflet/dist/leaflet.css';
import React from 'react';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { AuthProvider } from '@/contexts/AuthContext';
import { LayoutProvider } from '@/contexts/LayoutContext';
import AppThemeWrapper from '@/components/theme/AppThemeWrapper';
import { fallbackLng } from '@/i18n/settings';
import { DriverSessionProvider } from '@/contexts/DriverSessionContext';
import { SettingsProvider } from '@/contexts/SettingsContext'; // --- Import the provider

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang={fallbackLng}>
      <head>
        <title>WoodMaster LogiApp</title>
      </head>
      <body>
        <AppRouterCacheProvider>
          {/* Wrap the entire app so the setting is available everywhere */}
          <SettingsProvider>
            <AuthProvider>
              <DriverSessionProvider>
                <LayoutProvider>
                  <AppThemeWrapper>{children}</AppThemeWrapper>
                </LayoutProvider>
              </DriverSessionProvider>
            </AuthProvider>
          </SettingsProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}