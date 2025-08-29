// frontend/src/app/(main)/layout.tsx (UPDATED for DEBUGGING)
'use client';
import React, { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { useLayout } from '../../contexts/LayoutContext';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Toolbar from '@mui/material/Toolbar';

import AppNavbar from '../../components/layout/AppNavbar';
import AppSidebar from '../../components/layout/AppSidebar';

const drawerWidth = 240;

export default function MainLayout({ children }: { children: ReactNode }) {
    const { isAuthenticated, isLoading, user } = useAuth(); // Get 'user' as well for debugging
    const { navLayout } = useLayout();
    const router = useRouter();

    // --- FOR DEBUGGING: Log the state from contexts ---
    console.log('--- MainLayout Render ---');
    console.log('Auth Is Loading:', isLoading);
    console.log('Is Authenticated:', isAuthenticated);
    console.log('Navigation Layout:', navLayout);
    console.log('User Object:', user); // See if user object with roles/permissions is available
    // --- END DEBUGGING ---

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            console.log("MainLayout: Redirecting to /login because user is not authenticated.");
            router.replace('/login');
        }
    }, [isAuthenticated, isLoading, router]);

    // Show a full-page loader while checking authentication state
    if (isLoading) {
        console.log("MainLayout: Showing loading spinner.");
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    // Don't render anything if not authenticated (will be redirected by useEffect)
    if (!isAuthenticated) {
        console.log("MainLayout: Not rendering layout because user is not authenticated.");
        return null; 
    }

    // If authenticated, render the full layout
    console.log("MainLayout: Rendering full layout with Navbar and Sidebar.");
    return (
        <Box sx={{ display: 'flex' }}>
            <AppNavbar />

            {/* Conditionally render the sidebar based on the navLayout setting */}
            {navLayout === 'left' && (
                <AppSidebar />
            )}

            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: 3,
                    width: { md: navLayout === 'left' ? `calc(100% - ${drawerWidth}px)` : '100%' },
                }}
            >
                <Toolbar /> 
                {children}
            </Box>
        </Box>
    );
}