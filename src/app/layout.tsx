//frontend/src/app/layout.tsx
import '@/app/globals.css';
import 'leaflet/dist/leaflet.css';
import React from 'react';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { AuthProvider } from '@/contexts/AuthContext';
import { LayoutProvider } from '@/contexts/LayoutContext';
import AppThemeWrapper from '@/components/theme/AppThemeWrapper';
import { fallbackLng } from '@/i18n/settings';
import { DriverSessionProvider } from '@/contexts/DriverSessionContext';
import { SettingsProvider } from '@/contexts/SettingsContext';
import ConnectivityBoundary from '@/components/providers/ConnectivityBoundary';
import DriverOfflineBootstrap from '@/components/providers/DriverOfflineBootstrap';


import I18nProvider from '@/components/providers/I18nProvider';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang={fallbackLng}>
      <head>
        <title>WoodMaster LogiApp</title>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0091cac4" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="apple-touch-icon" href="/images/icons/apple-touch-icon.png" />

        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="32x32" href="/images/icons/icon-32x32.png" />
      </head>
      <body>
        <I18nProvider>
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
        </I18nProvider>
      </body>
    </html>
  );
}
