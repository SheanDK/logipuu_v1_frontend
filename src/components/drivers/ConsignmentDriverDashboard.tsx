// frontend/src/components/drivers/ConsignmentDriverDashboard.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Box, Paper, Typography, CircularProgress, Alert, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Fab } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useDriverSession } from '@/contexts/DriverSessionContext';
import { getDriverConsignments } from '@/services/consignmentDriverService';
import { IConsignmentKuormaListItem } from '@/types';

interface ConsignmentDashboardProps {
    onBackAction: () => void; // This might not be needed if navigation is handled differently, but good to have
    onNavigateToFormAction: (id: number | null) => void;
}

export default function ConsignmentDriverDashboard({ onNavigateToFormAction }: ConsignmentDashboardProps) {
    const { selectedVehicleId } = useDriverSession();
    const [consignments, setConsignments] = useState<IConsignmentKuormaListItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchConsignments = useCallback(async () => {
        if (!selectedVehicleId) return;
        setIsLoading(true);
        try {
            const data = await getDriverConsignments(selectedVehicleId);
            setConsignments(data);
        } catch (err) {
            setError("Failed to load consignments.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [selectedVehicleId]);

    useEffect(() => {
        fetchConsignments();
    }, [fetchConsignments]);

    if (isLoading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress /></Box>;
    }

    if (error) {
        return <Box sx={{ p: 2 }}><Alert severity="error">{error}</Alert></Box>;
    }

    return (
        <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Paper elevation={2} sx={{ p: 2, borderBottom: '1px solid #ddd' }}>
                <Typography variant="h5" component="h1">Rahtikirjat</Typography>
            </Paper>

            <TableContainer component={Paper} elevation={0} sx={{ flexGrow: 1, overflow: 'auto' }}>
                <Table stickyHeader>
                    <TableHead>
                        <TableRow sx={{ '& th': { fontWeight: 'bold', backgroundColor: '#f5f5f5' } }}>
                            <TableCell>Asiakas</TableCell>
                            <TableCell>Pvm</TableCell>
                            <TableCell>Auto</TableCell>
                            <TableCell>Kuljettaja</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {consignments.map((item) => (
                            <TableRow 
                                key={item.kuormaId} 
                                hover 
                                sx={{ cursor: 'pointer' }}
                                onClick={() => onNavigateToFormAction(item.kuormaId)} // Click a row to edit
                            >
                                <TableCell>{item.asiakkaanNimi}</TableCell>
                                <TableCell>{new Date(item.pvm).toLocaleDateString('fi-FI')}</TableCell>
                                <TableCell>{item.autoNro}</TableCell>
                                <TableCell>{item.kuljettajanNimi}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Fab 
                color="primary" 
                aria-label="add" 
                sx={{ position: 'absolute', bottom: 24, left: 24 }}
                onClick={() => onNavigateToFormAction(null)} // Click '+' to create
            >
                <AddIcon />
            </Fab>
        </Box>
    );
}