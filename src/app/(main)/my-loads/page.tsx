// frontend/src/app/(main)/my-loads/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Box, Button, CircularProgress, Typography, Paper } from '@mui/material';
import { useDriverSession } from '@/contexts/DriverSessionContext';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

// --- Dynamic Component Imports ---
// This page now only needs to know about the top-level dashboards and the mode selector.
const ModeSelection = dynamic(() => import('../../../components/drivers/ModeSelection'), { ssr: false });
const TimberDashboard = dynamic(() => import('../../../components/drivers/TimberDashboard'), { ssr: false });

interface TimberDashboardProps {
    onBackAction: () => void;
}


export default function DriverDashboardPage() {
    const { selectedVehicleId } = useDriverSession();
    const [view, setView] = useState<'mode-select' | 'timber' | 'consignment'>('mode-select');

    // Reset to mode selection if the vehicle changes (e.g., on page reload)
    useEffect(() => {
        if (selectedVehicleId) {
            setView('mode-select');
        }
    }, [selectedVehicleId]);

    // --- RENDER LOGIC ---
    if (!selectedVehicleId) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <CircularProgress />
            </Box>
        );
    }
    // 2. Based on the 'view' state, render the appropriate component.
    switch (view) {
        case 'mode-select':
            return <ModeSelection onModeSelectAction={(selectedMode) => setView(selectedMode)} />;
        
        case 'timber':
            // The onBackAction prop is the only thing passed to the dashboard
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