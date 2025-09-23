
// frontend/src/components/loads/TripDetailsPanel.tsx

'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import {
    Drawer, Box, Typography, Alert, CircularProgress, Button, Stack, Divider,
    Chip, Snackbar, IconButton, Tooltip, List, ListItem, ListItemText, Paper
} from '@mui/material';
import type { AlertColor } from '@mui/material';

// --- Import Icons ---
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PauseCircleOutlineIcon from '@mui/icons-material/PauseCircleOutline';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import FlagIcon from '@mui/icons-material/Flag';

// --- Other Imports ---
import { ITripDetails, ITripLeg } from '@/types';
import { getTripById, updateLoadStatus } from '@/services/loadService';

// --- Dynamic Imports ---
const TripCreatorPanel = dynamic(() => import('@/components/loads/TripCreatorPanel'), { ssr: false });

interface TripDetailsPanelProps {
    open: boolean;
    onCloseAction: () => void;
    tripId: number | null;
    onTripUpdateAction: () => void;
    // The prop name must end with 'Action' for consistency
    onEditTripAction: (tripId: number) => void; 
}

export default function TripDetailsPanel({ open, onCloseAction, tripId, onTripUpdateAction, onEditTripAction }: TripDetailsPanelProps) {
    const [trip, setTrip] = useState<ITripDetails | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: AlertColor }>({ open: false, message: '', severity: 'info' });
    const [isEditPanelOpen, setIsEditPanelOpen] = useState(false);

    const fetchTripData = useCallback(async () => {
        if (!tripId) return;
        try {
            setIsLoading(true);
            setError(null);
            const tripData = await getTripById(tripId);
            setTrip(tripData || null);
            if (!tripData) setError("Trip details could not be found.");
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to fetch trip data.");
        } finally {
            setIsLoading(false);
        }
    }, [tripId]);

    useEffect(() => {
        if (open && tripId) {
            fetchTripData();
        } else {
            setTrip(null);
        }
    }, [open, tripId, fetchTripData]);
    
    const handleEditSuccess = (message: string) => {
        setIsEditPanelOpen(false);
        setSnackbar({ open: true, message, severity: 'success' });
        onTripUpdateAction();
        onCloseAction();
    };

    const handleOverallStatusUpdate = async (newStatus: string) => {
        if (!trip || trip.legs.length === 0) return;
        setIsUpdating(true);
        try {
            const firstLegId = trip.legs[0].kuormaId;
            await updateLoadStatus(firstLegId, { status: newStatus });
            await fetchTripData();
            onTripUpdateAction();
            setSnackbar({ open: true, message: `Trip status updated to "${newStatus}"`, severity: 'success' });
        } catch (err: any) {
            setSnackbar({ open: true, message: err.response?.data?.message || 'Failed to update trip status.', severity: 'error' });
        } finally {
            setIsUpdating(false);
        }
    };

    const overallStatus = useMemo(() => {
        if (!trip?.legs || trip.legs.length === 0) return '';
        return trip.legs[0]?.status || 'Unknown';
    }, [trip]);
    
    const getNextAction = () => {
        const actionButtonProps = { size: "large" as "large", variant: "contained" as "contained", fullWidth: true, disabled: isUpdating };
        switch (overallStatus) {
            case 'Assigned': return <Button {...actionButtonProps} startIcon={<PlayCircleOutlineIcon />} onClick={() => handleOverallStatusUpdate('In Progress')}>Start Trip</Button>;
            case 'In Progress': return <Button {...actionButtonProps} startIcon={<LocationOnIcon />} onClick={() => handleOverallStatusUpdate('At Origin')}>Arrived at First Pickup</Button>;
            case 'At Origin': return <Button {...actionButtonProps} startIcon={<WarehouseIcon />} onClick={() => handleOverallStatusUpdate('En Route to Destination')}>Depart for Destination</Button>;
            case 'En Route to Destination': return <Button {...actionButtonProps} startIcon={<LocationOnIcon />} onClick={() => handleOverallStatusUpdate('At Destination')}>Arrived at Final Destination</Button>;
            case 'At Destination': return <Button {...actionButtonProps} startIcon={<FlagIcon />} onClick={() => { /* Open Complete Modal */ }}>Complete Trip</Button>;
            case 'Completed': return (<Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, color: 'success.main', p: 1.5, border: '1px solid', borderColor: 'success.light', borderRadius: 1 }}><CheckCircleIcon /><Typography fontWeight="bold">Trip Completed</Typography></Box>);
            case 'Paused': return <Button {...actionButtonProps} color="success" startIcon={<PlayCircleOutlineIcon />} onClick={() => handleOverallStatusUpdate('In Progress')}>Resume Trip</Button>;
            default: return <Typography color="text.secondary" textAlign="center">No actions available</Typography>;
        }
    };

    const renderContent = () => {
        if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
        if (error) return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>;
        if (!trip) return null;

        return (
            <>
                <Stack spacing={2} sx={{ p: 2.5, flexGrow: 1, overflowY: 'auto' }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Stack><Typography variant="overline" lineHeight={1}>Trip ID</Typography><Typography variant="h6" fontWeight="bold">{trip.tripId}</Typography></Stack>
                        <Chip label={overallStatus} color="primary" />
                    </Stack>
                    <Divider />
                    <Box>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{mb: 1}}>
                            <Typography variant="h6" fontSize="1.1rem">Route</Typography>
                            {overallStatus === 'Assigned' && (
                                // --- THIS IS THE FIX ---
                                // The onClick handler now calls `onEditTripAction`, which is the correct prop name.
                                <Button size="small" variant="outlined" startIcon={<EditIcon />} onClick={() => onEditTripAction(trip.legs[0].kuormaId)}>
                                    Edit
                                </Button>
                            )}
                        </Stack>
                        <Paper variant="outlined" sx={{ maxHeight: '40vh', overflowY: 'auto' }}>
                            <List dense sx={{ p: 0 }}>
                                {trip.legs.map((leg: ITripLeg, index: number) => (<ListItem key={leg.kuormaId} divider><ListItemText primary={`${index + 1}. ${leg.originName}`} secondary={`To: ${leg.destinationName} | Vol: ${leg.m3} m³`} /></ListItem>))}
                            </List>
                        </Paper>
                    </Box>
                    <Divider />
                    <Box>{isUpdating ? <Box sx={{display: 'flex', justifyContent: 'center'}}><CircularProgress /></Box> : getNextAction()}</Box>
                </Stack>
                <TripCreatorPanel open={isEditPanelOpen} onCloseAction={() => setIsEditPanelOpen(false)} onSaveSuccessAction={handleEditSuccess} initialData={trip} onLegsChangeAction={() => {}} />
            </>
        );
    };

    return (
        <Drawer anchor="right" open={open} onClose={onCloseAction} PaperProps={{ sx: { width: { xs: '95vw', sm: 420 }, boxShadow: 24 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1, borderBottom: 1, borderColor: 'divider' }}>
                <IconButton onClick={onCloseAction}><CloseIcon /></IconButton>
            </Box>
            {renderContent()}
            <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })} message={snackbar.message} />
        </Drawer>
    );
}