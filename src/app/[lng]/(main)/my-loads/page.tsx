// frontend/src/app/(main)/my-loads/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Box, Button, CircularProgress, Typography, Paper } from '@mui/material';
import { useDriverSession } from '@/contexts/DriverSessionContext';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useTranslation } from '@/i18n/useTranslation';
import SelectVehicleModal from '@/components/drivers/SelectVehicleModal';
import { IVehicleBackendResponse, IVehicleBasicInfo } from '@/types';
import { fetchAllVehicles } from '@/services/vehicleService';

// --- Dynamic Component Imports ---
// This page now only needs to know about the top-level dashboards and the mode selector.
const ModeSelection = dynamic(() => import('../../../../components/drivers/ModeSelection'), { ssr: false });
const TimberDashboard = dynamic(() => import('../../../../components/drivers/TimberDashboard'), { ssr: false });

interface TimberDashboardProps {
    onBackAction: () => void;
}


export default function DriverDashboardPage() {
    const { selectedVehicleId, selectVehicle } = useDriverSession();
    
    const [view, setView] = useState<'mode-select' | 'timber' | 'consignment'>('mode-select');
    const [vehicles, setVehicles] = useState<IVehicleBasicInfo[]>([]);
    const [isLoadingVehicles, setIsLoadingVehicles] = useState(true);

    // This effect runs once to fetch the list of vehicles for the modal.
    useEffect(() => {
        setIsLoadingVehicles(true);
        fetchAllVehicles()
            .then((data: IVehicleBackendResponse[]) => {
                const mappedVehicles = data.map(v => ({
                    id: String(v.kalustoNro),
                    registrationNo: v.rekNro,
                    name: v.rekNro,
                    vehicleNo: String(v.kalustoNro)
                }));
                setVehicles(mappedVehicles);
            })
            .catch(err => console.error("Failed to fetch vehicles:", err))
            .finally(() => setIsLoadingVehicles(false));
    }, []);

    // --- RENDER LOGIC ---
    
    // 1. If a vehicle is NOT selected, show the vehicle selection modal.
    if (!selectedVehicleId) {
        if (isLoadingVehicles) {
            return (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <CircularProgress />
                </Box>
            );
        }
        return (
            <SelectVehicleModal
                open={true} // The modal is always open if no vehicle is selected
                vehicles={vehicles}
                onVehicleSelectAction={selectVehicle}
            />
        );
    }

    // 2. A vehicle IS selected, so proceed with the view logic.
    switch (view) {
        case 'mode-select':
            return <ModeSelection onModeSelectAction={(selectedMode) => setView(selectedMode)} />;
        
        case 'timber':
            return <TimberDashboard onBackAction={() => setView('mode-select')} />;

        case 'consignment':
            return (
                 <Box sx={{ p: 3, height: '100%' }}>
                    <Button startIcon={<ArrowBackIcon />} onClick={() => setView('mode-select')}>
                        Back to Mode Selection
                    </Button>
                    <Typography variant="h4" sx={{mt: 2}}>Consignments (Rahtikirjat)</Typography>
                    <Paper sx={{p:4, mt: 2}}>
                        <Typography color="text.secondary">
                            Consignment list view will be implemented here.
                        </Typography>
                    </Paper>
                </Box>
            );

        default:
            return null;
    }
}