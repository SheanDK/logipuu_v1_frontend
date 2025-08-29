// frontend/src/app/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

export default function HomePage() {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading) { // Wait until auth state is loaded
            if (isAuthenticated) {
                router.replace('/dashboard'); // User is logged in, go to dashboard
            } else {
                router.replace('/login'); // User is not logged in, go to login
            }
        }
    }, [isAuthenticated, isLoading, router]);

    // Show a loading indicator while auth state is being determined
    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return null; // Or a very minimal non-distracting loading text/component
}