// frontend/src/app/(main)/my-loads/page.tsx
'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { Box, Button, Typography, Paper } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const ModeSelection = dynamic(() => import('../../../../components/drivers/ModeSelection'), { ssr: false });
const TimberDashboard = dynamic(() => import('../../../../components/drivers/TimberDashboard'), { ssr: false });

export default function DriverDashboardPage() {
    const [view, setView] = useState<'mode-select' | 'timber' | 'consignment'>('mode-select');

    // This page will now only render when both authentication AND vehicle selection are complete.
    // So, we can directly show the mode selection.
    
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
                    <Typography variant="h4" sx={{mt: 2}}>Consignments</Typography>
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