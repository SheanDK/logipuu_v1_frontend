// frontend/src/app/(main)/my-loads/[loadId]/page.tsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
    Box, Typography, Paper, Alert, CircularProgress, Button, Stack, Divider,
    Chip, Grid, Snackbar, Card, CardContent, CardHeader, Avatar, IconButton, Tooltip
} from '@mui/material';
import type { AlertColor } from '@mui/material';
import dayjs from 'dayjs';

// Import Icons
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import FlagIcon from '@mui/icons-material/Flag';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PauseCircleOutlineIcon from '@mui/icons-material/PauseCircleOutline';

// Import services and types
import { ILoadDetails, ILoadStatusUpdateDto, ICompleteLoadDto } from '../../../../types';
import { getLoadById, updateLoadStatus, completeLoad } from '../../../../services/loadService';

// Dynamically import heavy components to optimize initial page load
const CompleteLoadModal = dynamic(() => import('../../../../components/loads/CompleteLoadModal'), { ssr: false });
const TripMap = dynamic(() => import('../../../../components/loads/TripMap'), { ssr: false });

// Helper component for displaying details
const DetailItem = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <Box sx={{ mb: 2 }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{label}</Typography>
        <Typography variant="body1" fontWeight="500">{value || 'N/A'}</Typography>
    </Box>
);

export default function LoadDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const loadId = Number(params.loadId);

    const [load, setLoad] = useState<ILoadDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: AlertColor }>({ open: false, message: '', severity: 'info' });
    
    // State for the completion modal
    const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);

    const fetchLoadDetails = useCallback(async () => {
        if (!loadId || isNaN(loadId)) {
            setError("Invalid Load ID.");
            setIsLoading(false);
            return;
        }
        try {
            setIsLoading(true);
            setError(null);
            const data = await getLoadById(loadId);
            setLoad(data);
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to fetch load details.");
        } finally {
            setIsLoading(false);
        }
    }, [loadId]);

    useEffect(() => {
        fetchLoadDetails();
    }, [fetchLoadDetails]);

    const handleStatusUpdate = async (newStatus: string) => {
        if (!load) return;
        setIsUpdating(true);
        try {
            const payload: ILoadStatusUpdateDto = { status: newStatus };
            const updatedLoad = await updateLoadStatus(load.kuormaId, payload);
            setLoad(prevLoad => prevLoad ? { ...prevLoad, status: updatedLoad.status } : null);
            setSnackbar({ open: true, message: `Status updated to "${newStatus}"`, severity: 'success' });
        } catch (err: any) {
            setSnackbar({ open: true, message: err.response?.data?.message || 'Failed to update status.', severity: 'error' });
        } finally {
            setIsUpdating(false);
        }
    };
    
    const handleCompleteTrip = async (actuals: { actualM3: number; actualKm: number }) => {
    if (!load) return;
    setIsUpdating(true);
    try {
        const payload: ICompleteLoadDto = actuals;
        const completedLoadResponse = await completeLoad(load.kuormaId, payload);
        
        // --- THIS IS THE FIX ---
        // Instead of replacing the whole detailed object, we update the existing one.
        setLoad(prevDetails => {
            if (!prevDetails) return null;
            
            // Create a new object by spreading the previous details,
            // and then overwrite only the properties that changed.
            return {
                ...prevDetails,
                status: completedLoadResponse.status,
                taskVolume: completedLoadResponse.m3, // Assuming you want to update the volume with actual_m3
                // If you added actual_km to ILoadDetails, you can update it here too.
            };
        });

        setSnackbar({ open: true, message: 'Trip completed successfully!', severity: 'success' });
        setIsCompleteModalOpen(false);

    } catch (err: any) {
        setSnackbar({ open: true, message: err.response?.data?.message || 'Failed to complete trip.', severity: 'error' });
    } finally {
        setIsUpdating(false);
    }
};

    const getNextAction = () => {
        const actionButtonProps = { size: "large" as "large", variant: "contained" as "contained", fullWidth: true, disabled: isUpdating };
        switch (load?.status) {
            case 'Assigned': return <Button {...actionButtonProps} startIcon={<PlayCircleOutlineIcon />} onClick={() => handleStatusUpdate('In Progress')}>Start Trip</Button>;
            case 'In Progress': return <Button {...actionButtonProps} startIcon={<LocationOnIcon />} onClick={() => handleStatusUpdate('At Origin')}>Arrived at Origin</Button>;
            case 'At Origin': return <Button {...actionButtonProps} startIcon={<WarehouseIcon />} onClick={() => handleStatusUpdate('En Route to Destination')}>Confirm Loading & Depart</Button>;
            case 'En Route to Destination': return <Button {...actionButtonProps} startIcon={<LocationOnIcon />} onClick={() => handleStatusUpdate('At Destination')}>Arrived at Destination</Button>;
            case 'At Destination': return <Button {...actionButtonProps} startIcon={<FlagIcon />} onClick={() => setIsCompleteModalOpen(true)}>Complete Trip</Button>;
            case 'Completed': return (<Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, color: 'success.main', p: 1.5, border: '1px solid', borderColor: 'success.light', borderRadius: 2, bgcolor: 'success.lighter' }}><CheckCircleIcon /><Typography fontWeight="bold">Trip Completed</Typography></Box>);
            case 'Paused': return <Button {...actionButtonProps} color="success" startIcon={<PlayCircleOutlineIcon />} onClick={() => handleStatusUpdate('In Progress')}>Resume Trip</Button>;
            default: return <Typography color="text.secondary" textAlign="center">No actions available</Typography>;
        }
    };

    if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
    if (error) return <Alert severity="error" sx={{ m: 3 }}>{error}</Alert>;
    if (!load) return <Alert severity="warning" sx={{ m: 3 }}>Load details could not be found.</Alert>;

    return (
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <Button startIcon={<ArrowBackIcon />} onClick={() => router.push('/my-loads')} sx={{ mb: 2 }}>
                Back to Dashboard
            </Button>
            <Grid container spacing={3}>
                <Grid item xs={12} md={7} lg={8}>
                    <Stack spacing={3}>
                        <Paper sx={{ p: {xs: 2, sm: 3} }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                                <Box>
                                    <Typography variant="h4" component="h1" fontWeight="bold">Trip Details #{load.kuormaId}</Typography>
                                </Box>
                                <Chip label={load.status} color="primary" variant="filled" />
                            </Stack>
                            <Divider sx={{ my: 2 }} />
                            <Stack direction="row" spacing={1}>
                                <Box sx={{ flexGrow: 1 }}>{isUpdating ? <CircularProgress size={24} /> : getNextAction()}</Box>
                                {load.status !== 'Assigned' && load.status !== 'Completed' && load.status !== 'Paused' && (
                                    <Tooltip title="Pause Trip">
                                        <span><IconButton sx={{border: '1px solid', borderColor: 'divider'}} onClick={() => handleStatusUpdate('Paused')} disabled={isUpdating}><PauseCircleOutlineIcon /></IconButton></span>
                                    </Tooltip>
                                )}
                            </Stack>
                        </Paper>

                        {/* --- NEW INTEGRATED MAP VIEW --- */}
                        {load.originLat && load.originLng && load.destinationLat && load.destinationLng ? (
                            <Paper variant="outlined" sx={{ height: 350, width: '100%' }}>
                                <TripMap
                                    origin={{ lat: load.originLat, lng: load.originLng, name: load.originName }}
                                    destination={{ lat: load.destinationLat, lng: load.destinationLng, name: load.destinationName }}
                                />
                            </Paper>
                        ) : (
                            <Paper variant='outlined' sx={{p: 2, textAlign: 'center', color: 'text.secondary'}}>Map not available for this trip (missing coordinates).</Paper>
                        )}

                        <Card variant="outlined">
                            <CardHeader avatar={<Avatar sx={{ bgcolor: 'info.main' }}><LocationOnIcon /></Avatar>} title="Origin Details" />
                            <CardContent>
                                <DetailItem label="Location Name" value={load.originName} />
                                <DetailItem label="Address" value={load.originAddress} />
                                {load.originInstructions && <DetailItem label="Special Instructions" value={<Typography variant="body2" sx={{whiteSpace: 'pre-wrap'}}>{load.originInstructions}</Typography>} />}
                            </CardContent>
                        </Card>

                        <Card variant="outlined">
                            <CardHeader avatar={<Avatar sx={{ bgcolor: 'success.main' }}><WarehouseIcon /></Avatar>} title="Destination Details" />
                            <CardContent>
                                <DetailItem label="Location Name" value={load.destinationName} />
                                <DetailItem label="Address" value={load.destinationAddress} />
                            </CardContent>
                        </Card>
                    </Stack>
                </Grid>
                
                <Grid item xs={12} md={5} lg={4}>
                    <Paper sx={{ p: {xs: 2, sm: 3}, position: 'sticky', top: '80px' }}>
                        <Typography variant="h6" gutterBottom>Trip Info</Typography>
                        <Divider sx={{ mb: 2 }} />
                        <DetailItem label="Date" value={dayjs(load.pvm).format('DD MMMM YYYY')} />
                        <DetailItem label="Customer" value={load.asiakkaanNimi} />
                        <DetailItem label="Vehicle" value={load.rekNro} />
                        <DetailItem label="Driver" value={load.kuljettajanNimi} />
                        <DetailItem label="Driving Order No." value={load.ajomaaraysNro} />
                        <Divider sx={{ my: 1 }} />
                        <DetailItem label="Timber Type" value={load.taskTimberTypeName} />
                        <DetailItem label="Assigned Volume" value={`${load.taskVolume} m³`} />
                        <Divider sx={{ my: 1 }} />
                        {load.lisatiedot && <DetailItem label="General Notes" value={<Typography variant="body2" sx={{whiteSpace: 'pre-wrap'}}>{load.lisatiedot}</Typography>} />}
                    </Paper>
                </Grid>
            </Grid>

            {isCompleteModalOpen && (
                <CompleteLoadModal
                    open={isCompleteModalOpen}
                    onCloseAction={() => setIsCompleteModalOpen(false)}
                    onSubmitAction={handleCompleteTrip}
                    isSubmitting={isUpdating}
                    initialVolume={load.taskVolume}
                />
            )}
            
            <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
            </Snackbar>
        </Box>
    );
}