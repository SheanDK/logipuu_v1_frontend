// frontend/src/app/layout.tsx
'use client'; // This component now uses client-side context and state for theme

import type { Metadata } from 'next'; // Metadata can still be defined server-side if needed, but the component is client
import { Inter } from 'next/font/google';
import './globals.css';
import 'leaflet/dist/leaflet.css';
import { ThemeProvider, CssBaseline, createTheme } from '@mui/material';
// import theme from '../styles/theme'; // Old static theme import
import { AuthProvider } from '../contexts/AuthContext';
import { LayoutProvider, useLayout } from '../contexts/LayoutContext'; // Import LayoutProvider
import { getDesignTokens } from '../styles/theme'; // Import getDesignTokens
import React, { useMemo } from 'react';

const inter = Inter({ subsets: ['latin'] });

// export const metadata: Metadata = { // This might need to be handled differently if layout.tsx is 'use client'
//     title: 'WoodMaster LogiApp',
//     description: 'Wood Loading and Unloading Management System',
// };
// For client components, metadata is typically not exported this way.
// You might set document.title in a useEffect if needed.

// A new component to consume LayoutContext for theme creation
function AppThemeWrapper({ children }: { children: React.ReactNode }) {
    const { themeMode } = useLayout(); // Get themeMode from LayoutContext

    // Create MUI theme object based on current themeMode
    const theme = useMemo(() => createTheme(getDesignTokens(themeMode)), [themeMode]);

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            {children}
        </ThemeProvider>
    );
}

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            {/* Add suppressHydrationWarning if you see mismatches due to localStorage theme loading */}
            <head>
                 <title>WoodMaster LogiApp</title>
                 <meta name="description" content="Wood Loading and Unloading Management System" />
            </head>
            <body className={inter.className}>
                <AuthProvider>
                    <LayoutProvider> {/* Wrap with LayoutProvider */}
                        <AppThemeWrapper> {/* ThemeProvider is now inside this */}
                            {children}
                        </AppThemeWrapper>
                    </LayoutProvider>
                </AuthProvider>
            </body>
        </html>
    );
}