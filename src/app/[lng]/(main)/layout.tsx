// frontend/src/app/(main)/layout.tsx
'use client';
import React, { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from '../../../contexts/AuthContext';
import { LayoutProvider, useLayout } from '../../../contexts/LayoutContext';
import { DriverSessionProvider } from '../../../contexts/DriverSessionContext'; // Keep the provider
import ThemeProvider from '@/theme/ThemeProvider';

import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Toolbar from '@mui/material/Toolbar';
import AppNavbar from '../../../components/layout/AppNavbar';
import AppSidebar from '../../../components/layout/AppSidebar';

const drawerWidth = 240;

function LayoutRenderer({ children }: { children: ReactNode }) {
    const { navLayout } = useLayout();
    return (
         <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
            <AppNavbar />
            {navLayout === 'left' && <AppSidebar />}

            {/* --- THIS IS THE FIX --- */}
            <Box 
                component="main" 
                sx={{ 
                    flexGrow: 1, 
                    // This width calculation is correct
                    width: { md: navLayout === 'left' ? `calc(100% - ${drawerWidth}px)` : '100%' },
                    // The main box itself should not scroll. Content inside it will scroll.
                    overflow: 'hidden', 
                    // Add padding top to account for the fixed AppBar
                    mt: (theme) => `${theme.mixins.toolbar.minHeight}px`,
                    // The height should be the remaining vertical space
                    height: (theme) => `calc(100vh - ${theme.mixins.toolbar.minHeight}px)`
                }}
            >
                {/* 
                    We REMOVE the <Toolbar /> from here because we are using margin-top (mt) now.
                    We also REMOVE the padding (p: 3) from here and apply it on a page-by-page basis.
                */}
                {children}
            </Box>
        </Box>
    );
}

function AuthWrapper({ children }: { children: ReactNode }) {
    const { isAuthenticated, isLoading, token } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !isAuthenticated && !token) {
            router.replace('/login');
        }
    }, [isAuthenticated, isLoading, token, router]);

    if (isLoading || (token && !isAuthenticated)) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }
    
    if (isAuthenticated) {
        return <LayoutRenderer>{children}</LayoutRenderer>;
    }

    return null;
}

export default function MainLayout({ children }: { children: ReactNode }) {
    return (
        <AuthProvider>
            <LayoutProvider>
                <ThemeProvider>
                    <DriverSessionProvider>
                        <AuthWrapper>
                            {children}
                        </AuthWrapper>
                    </DriverSessionProvider>
                </ThemeProvider>
            </LayoutProvider>
        </AuthProvider>
    );
}