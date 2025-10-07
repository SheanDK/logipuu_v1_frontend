// frontend/src/app/(main)/layout.tsx (UPDATED for DEBUGGING)
'use client';
import React, { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from '../../../contexts/AuthContext';
import { LayoutProvider, useLayout } from '../../../contexts/LayoutContext';
import { DriverSessionProvider, useDriverSession } from '../../../contexts/DriverSessionContext';
import { fetchAllVehicles } from '@/services/vehicleService';
import { IVehicleBasicInfo, IVehicleBackendResponse } from '@/types';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import AppNavbar from '../../../components/layout/AppNavbar';
import AppSidebar from '../../../components/layout/AppSidebar';
import SelectVehicleModal from '@/components/drivers/SelectVehicleModal';
import ThemeProvider from '@/theme/ThemeProvider';

const drawerWidth = 240;

// This is the core logic component
function AppContent({ children }: { children: ReactNode }) {
    // --- THIS IS THE FIX for 'implicitly has an 'any' type' ---
    // We explicitly use the useAuth() hook which returns a typed object.
    const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
    const { isVehicleSelectionRequired, selectVehicle } = useDriverSession();
    const { navLayout } = useLayout();
    const router = useRouter();
    const [vehicleList, setVehicleList] = useState<IVehicleBasicInfo[]>([]);

    // Effect for handling redirection if the user is not authenticated.
    useEffect(() => {
        if (!isAuthLoading && !isAuthenticated) {
            router.replace('/login');
        }
    }, [isAuthLoading, isAuthenticated, router]);

    // Effect for fetching the vehicle list when the selection modal is needed.
    useEffect(() => {
        if (isVehicleSelectionRequired) {
            fetchAllVehicles()
                .then((data: IVehicleBackendResponse[]) => {
                    const mappedVehicles = data.map(v => ({ 
                        id: String(v.kalustoNro), 
                        registrationNo: v.rekNro, 
                        name: v.rekNro, 
                        vehicleNo: String(v.kalustoNro) 
                    }));
                    setVehicleList(mappedVehicles);
                })
                .catch(err => console.error("Failed to fetch vehicles for modal:", err));
        }
    }, [isVehicleSelectionRequired]);

    // --- RENDER LOGIC ---

    // 1. While the AuthContext is checking the token, show a full-page loader.
    // This is the most critical guard against redirect loops.
    if (isAuthLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    // 2. If authentication is done and the user is NOT authenticated, render nothing.
    // The useEffect above will handle the redirect to the login page.
    if (!isAuthenticated) {
        return null;
    }

    // 3. If authenticated, render the main application layout.
    return (
        <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
            <AppNavbar />
            {navLayout === 'left' && <AppSidebar />}
            
            <Box 
                component="main" 
                sx={{ 
                    flexGrow: 1, 
                    width: { md: `calc(100% - ${drawerWidth}px)` }, 
                    overflow: 'auto', 
                    // Add padding top to account for the fixed AppBar height
                    pt: (theme) => `${theme.mixins.toolbar.minHeight}px` 
                }}
            >
                {/* The vehicle selection modal floats above everything else when open */}
                <SelectVehicleModal
                    open={isVehicleSelectionRequired}
                    vehicles={vehicleList}
                    onVehicleSelectAction={selectVehicle}
                />
                
                {/* --- THIS IS THE FIX --- */}
                {/* Only render the page's content (`children`) if vehicle selection is NOT required.
                    This prevents the `my-loads` page from trying to load data before a vehicle is selected. */}
                {!isVehicleSelectionRequired && children}
            </Box>
        </Box>
    );
}

// Main Layout component that wraps everything with context providers.
export default function MainLayout({ children }: { children: ReactNode }) {
    return (
        <AuthProvider>
            <DriverSessionProvider>
                <LayoutProvider>
                    <ThemeProvider>
                        <AppContent>
                            {children}
                        </AppContent>
                    </ThemeProvider>
                </LayoutProvider>
            </DriverSessionProvider>
        </AuthProvider>
    );
}