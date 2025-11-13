// frontend/src/app/(main)/layout.tsx
'use client';

import React, { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from '../../../contexts/AuthContext';
import { LayoutProvider, useLayout } from '../../../contexts/LayoutContext';
import { DriverSessionProvider, useDriverSession } from '../../../contexts/DriverSessionContext';
import { fetchAllVehicles } from '@/services/vehicleService';
import { IVehicleBasicInfo, IVehicleBackendResponse } from '@/types';
import ThemeProvider from '@/theme/ThemeProvider';

import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import AppNavbar from '../../../components/layout/AppNavbar';
import AppSidebar from '../../../components/layout/AppSidebar';
import SelectVehicleModal from '@/components/drivers/SelectVehicleModal'; // Re-import the modal

const drawerWidth = 240;

// This component now contains the logic for the vehicle selection modal
function LayoutRenderer({ children }: { children: ReactNode }) {
    const { navLayout } = useLayout();
    const { isVehicleSelectionRequired, selectVehicle, isInitialized } = useDriverSession();
    const [vehicleList, setVehicleList] = useState<IVehicleBasicInfo[]>([]);
    
    // Fetch the vehicle list only when the modal needs to be shown
    useEffect(() => {
        // Run this effect only after the session is initialized and if selection is required
        if (isInitialized && isVehicleSelectionRequired) {
            fetchAllVehicles()
                .then((data: IVehicleBackendResponse[]) => {
                    const mappedVehicles = data.map(v => ({
                        id: String(v.kalustoNro),
                        registrationNo: v.rekNro,
                        name: v.rekNro, // For IVehicleBasicInfo compatibility
                        vehicleNo: String(v.kalustoNro) // For IVehicleBasicInfo compatibility
                    }));
                    setVehicleList(mappedVehicles);
                })
                .catch(err => console.error("Failed to fetch vehicles for selection modal:", err));
        }
    }, [isInitialized, isVehicleSelectionRequired]);

    return (
         <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
            <AppNavbar />
            {navLayout === 'left' && <AppSidebar />}

            <Box 
                component="main" 
                sx={{ 
                    flexGrow: 1, 
                    width: { md: navLayout === 'left' ? `calc(100% - ${drawerWidth}px)` : '100%' },
                    overflow: 'auto', 
                    // Use margin-top to push content below the AppBar
                    mt: (theme) => `${theme.mixins.toolbar.minHeight}px`,
                    // Height should be the remaining vertical space
                    height: (theme) => `calc(100vh - ${theme.mixins.toolbar.minHeight}px)`
                }}
            >
                {children}
            </Box>

            {/* Render the modal based on the hydration-safe logic from the context */}
            <SelectVehicleModal
                open={isInitialized && isVehicleSelectionRequired}
                vehicles={vehicleList}
                onVehicleSelectAction={selectVehicle}
            />
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

    // Show loading spinner while auth state is being determined
    if (isLoading || (token && !isAuthenticated)) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }
    
    // If authenticated, render the main layout with its children
    if (isAuthenticated) {
        return <LayoutRenderer>{children}</LayoutRenderer>;
    }

    // Otherwise, render nothing (will be redirected to login)
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