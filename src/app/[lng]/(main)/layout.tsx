//frontend/src/app/(main)/layout.tsx
'use client';

import React, { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from '../../../contexts/AuthContext';
import { LayoutProvider, useLayout } from '../../../contexts/LayoutContext';
import { DriverSessionProvider, useDriverSession } from '../../../contexts/DriverSessionContext';
import { NotificationProvider } from '@/contexts/NotificationContext';

import { fetchAllVehicles } from '@/services/vehicleService';
import { IVehicleBasicInfo, IVehicleBackendResponse } from '@/types';
import ThemeProvider from '@/theme/ThemeProvider';

import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import AppNavbar from '../../../components/layout/AppNavbar';
import AppSidebar from '../../../components/layout/AppSidebar';
import SelectVehicleModal from '@/components/drivers/SelectVehicleModal';

const drawerWidth = 240;

function LayoutRenderer({ children }: { children: ReactNode }) {
    const { navLayout } = useLayout();
    const { isVehicleSelectionRequired, selectVehicle, isInitialized } = useDriverSession();
    const [vehicleList, setVehicleList] = useState<IVehicleBasicInfo[]>([]);

    useEffect(() => {
        if (isInitialized && isVehicleSelectionRequired) {
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
                    mt: (theme) => `${theme.mixins.toolbar.minHeight}px`,
                    height: (theme) => `calc(100vh - ${theme.mixins.toolbar.minHeight}px)`
                }}
            >
                {children}
            </Box>

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
                    <NotificationProvider>
                        <DriverSessionProvider>
                            <AuthWrapper>
                                {children}
                            </AuthWrapper>
                        </DriverSessionProvider>
                    </NotificationProvider>
                </ThemeProvider>
            </LayoutProvider>
        </AuthProvider>
    );
}