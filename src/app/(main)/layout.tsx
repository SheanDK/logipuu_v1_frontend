// frontend/src/app/(main)/layout.tsx
'use client';
import React, { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';
import { LayoutProvider, useLayout } from '../../contexts/LayoutContext';
import { DriverSessionProvider, useDriverSession } from '../../contexts/DriverSessionContext';
import { fetchAllVehicles } from '@/services/vehicleService';
import { IVehicleBasicInfo, IVehicleBackendResponse } from '@/types';

import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Toolbar from '@mui/material/Toolbar';

import AppNavbar from '../../components/layout/AppNavbar';
import AppSidebar from '../../components/layout/AppSidebar';
import SelectVehicleModal from '@/components/drivers/SelectVehicleModal';
import ThemeProvider from '@/theme/ThemeProvider'; // Import the new ThemeProvider

const drawerWidth = 240;

function LayoutRenderer({ children }: { children: ReactNode }) {
    const { navLayout } = useLayout();
    const { isVehicleSelectionRequired, selectVehicle } = useDriverSession();
    const [vehicleList, setVehicleList] = useState<IVehicleBasicInfo[]>([]);
    
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
                .catch(err => console.error("Failed to fetch vehicles for selection modal:", err));
        }
    }, [isVehicleSelectionRequired]);

    return (
        <Box sx={{ display: 'flex' }}>
            <AppNavbar />
            {navLayout === 'left' && <AppSidebar />}
            <Box component="main" sx={{ flexGrow: 1, p: 3, width: { md: navLayout === 'left' ? `calc(100% - ${drawerWidth}px)` : '100%' } }}>
                <Toolbar /> 
                {children}
            </Box>
            <SelectVehicleModal
                open={isVehicleSelectionRequired}
                vehicles={vehicleList}
                onVehicleSelectAction={selectVehicle}
            />
        </Box>
    );
}

function AuthWrapper({ children }: { children: ReactNode }) {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.replace('/login');
        }
    }, [isAuthenticated, isLoading, router]);

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!isAuthenticated) {
        return null;
    }
    return <LayoutRenderer>{children}</LayoutRenderer>;
}

export default function MainLayout({ children }: { children: ReactNode }) {
    return (
        <AuthProvider>
            <LayoutProvider>
                {/* --- THIS IS THE FIX --- */}
                {/* ThemeProvider goes inside LayoutProvider so it can access the themeMode state */}
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