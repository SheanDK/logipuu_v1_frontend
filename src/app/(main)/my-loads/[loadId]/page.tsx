// frontend/src/app/(main)/my-loads/[loadId]/page.tsx
'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
    Box, Typography, Paper, Alert, CircularProgress, Button, Stack, Divider,
    Chip, Snackbar, IconButton, Tooltip, Drawer
} from '@mui/material';
import type { AlertColor } from '@mui/material';
import dayjs from 'dayjs';

// Import Icons
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import InfoIcon from '@mui/icons-material/Info';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import FlagIcon from '@mui/icons-material/Flag';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PauseCircleOutlineIcon from '@mui/icons-material/PauseCircleOutline';
import CloseIcon from '@mui/icons-material/Close';

import { ILoadDetails, ILoadStatusUpdateDto, ICompleteLoadDto } from '../../../../types';
import { getLoadById, updateLoadStatus, completeLoad } from '../../../../services/loadService';

// Dynamic imports
const TripMap = dynamic(() => import('../../../../components/loads/TripMap'), { ssr: false });
const CompleteLoadModal = dynamic(() => import('../../../../components/loads/CompleteLoadModal'), { ssr: false });

const DetailItem = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <Box sx={{ mb: 2 }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.2 }}>{label}</Typography>
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
    const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
    const [isInfoDrawerOpen, setIsInfoDrawerOpen] = useState(false);
    const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
    const watchIdRef = useRef<number | null>(null);

    const fetchLoadDetails = useCallback(async () => {
        if (!loadId || isNaN(loadId)) { setError("Invalid Load ID."); setIsLoading(false); return; }
        try {
            setIsLoading(true); setError(null);
            const data = await getLoadById(loadId);
            setLoad(data);
        } catch (err: any) { setError(err.response?.data?.message || "Failed to fetch load details.");
        } finally { setIsLoading(false); }
    }, [loadId]);

    useEffect(() => {
        const trackableStatuses = ['In Progress', 'At Origin', 'En Route to Destination', 'At Destination'];
        
        if (load && trackableStatuses.includes(load.status)) {
            if (navigator.geolocation && watchIdRef.current === null) {
                console.log("Starting location tracking...");
                watchIdRef.current = navigator.geolocation.watchPosition(
                    (position) => {
                        const { latitude, longitude } = position.coords;
                        console.log(`New location: ${latitude}, ${longitude}`);
                        setCurrentLocation({ lat: latitude, lng: longitude });
                        // TODO - Phase 3: Emit location to socket server
                        // socket.emit('locationUpdate', { loadId: load.kuormaId, lat: latitude, lng: longitude });
                    },
                    (err) => {
                        console.error("Geolocation error:", err);
                        setSnackbar({ open: true, message: 'Could not get your location. Please enable location services.', severity: 'error' });
                    },
                    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
                );
            }
        } else {
            if (watchIdRef.current !== null) {
                console.log("Stopping location tracking...");
                navigator.geolocation.clearWatch(watchIdRef.current);
                watchIdRef.current = null;
            }
        }

        return () => {
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
            }
        };
    }, [load]);

    useEffect(() => { fetchLoadDetails(); }, [fetchLoadDetails]);

    const handleStatusUpdate = async (newStatus: string) => {
        if (!load) return;
        setIsUpdating(true);
        try {
            const payload: ILoadStatusUpdateDto = { status: newStatus };
            const updatedLoad = await updateLoadStatus(load.kuormaId, payload);
            setLoad(prev => prev ? { ...prev, status: updatedLoad.status } : null);
            setSnackbar({ open: true, message: `Status updated to "${newStatus}"`, severity: 'success' });
        } catch (err: any) { setSnackbar({ open: true, message: err.response?.data?.message || 'Failed to update status.', severity: 'error' });
        } finally { setIsUpdating(false); }
    };
    
    const handleCompleteTrip = async (actuals: { actualM3: number, actualKm: number }) => {
        if (!load) return;
        setIsUpdating(true);
        try {
            const payload: ICompleteLoadDto = actuals;
            const completedLoad = await completeLoad(load.kuormaId, payload);
            await fetchLoadDetails();
            setSnackbar({ open: true, message: 'Trip completed successfully!', severity: 'success' });
            setIsCompleteModalOpen(false);
        } catch (err: any) { setSnackbar({ open: true, message: err.response?.data?.message || 'Failed to complete trip.', severity: 'error' });
        } finally { setIsUpdating(false); }
    };

    const getNextAction = () => {
        const actionButtonProps = { size: "large" as "large", variant: "contained" as "contained", fullWidth: true, disabled: isUpdating };
        switch (load?.status) {
            case 'Assigned': return <Button {...actionButtonProps} startIcon={<PlayCircleOutlineIcon />} onClick={() => handleStatusUpdate('In Progress')}>Start Trip</Button>;
            case 'In Progress': return <Button {...actionButtonProps} startIcon={<LocationOnIcon />} onClick={() => handleStatusUpdate('At Origin')}>Arrived at Origin</Button>;
            case 'At Origin': return <Button {...actionButtonProps} startIcon={<WarehouseIcon />} onClick={() => handleStatusUpdate('En Route to Destination')}>Confirm Loading & Depart</Button>;
            case 'En Route to Destination': return <Button {...actionButtonProps} startIcon={<LocationOnIcon />} onClick={() => handleStatusUpdate('At Destination')}>Arrived at Destination</Button>;
            case 'At Destination': return <Button {...actionButtonProps} startIcon={<FlagIcon />} onClick={() => setIsCompleteModalOpen(true)}>Complete Trip</Button>;
            case 'Completed': return (<Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, color: 'success.main', p: 1, border: '1px solid', borderColor: 'success.light', borderRadius: 1, bgcolor: 'success.lighter' }}><CheckCircleIcon /><Typography fontWeight="bold">Trip Completed</Typography></Box>);
            case 'Paused': return <Button {...actionButtonProps} color="success" startIcon={<PlayCircleOutlineIcon />} onClick={() => handleStatusUpdate('In Progress')}>Resume Trip</Button>;
            default: return <Typography color="text.secondary" textAlign="center">No actions available</Typography>;
        }
    };

    if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 64px)' }}><CircularProgress /></Box>;
    if (error) return <Alert severity="error" sx={{ m: 3 }}>{error}</Alert>;
    if (!load) return <Alert severity="warning" sx={{ m: 3 }}>Load details could not be found.</Alert>;

    return (
        <Box sx={{ height: 'calc(100vh - 64px)', width: '100%', position: 'relative', overflow: 'hidden' }}>
            
            <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }}>
                {load.originLat && load.originLng && load.destinationLat && load.destinationLng ? (
                    <TripMap
                        origin={{ lat: load.originLat, lng: load.originLng, name: load.originName }}
                        destination={{ lat: load.destinationLat, lng: load.destinationLng, name: load.destinationName }}
                        driverLocation={currentLocation}
                    />
                ) : (
                    <Box sx={{height: '100%', width: '100%', bgcolor: 'grey.300', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                        <Typography color="text.secondary">Map not available (missing coordinates).</Typography>
                    </Box>
                )}
            </Box>

            <Paper 
                elevation={4}
                sx={{ 
                    position: 'absolute', top: { xs: 8, sm: 16 }, left: { xs: 8, sm: 16 }, right: { xs: 8, sm: 16 }, 
                    p: 2, zIndex: 1, maxWidth: 500, mx: 'auto',
                    backgroundColor: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(8px)', borderRadius: 2
                }}
            >
                <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                    <Tooltip title="Back to Dashboard"><IconButton onClick={() => router.push('/my-loads')}><ArrowBackIcon /></IconButton></Tooltip>
                    <Box textAlign="center">
                        <Typography variant="h6" fontWeight="bold">Trip #{load.kuormaId}</Typography>
                        <Chip label={load.status} color="primary" size="small" />
                    </Box>
                    <Tooltip title="Show Trip Info"><IconButton onClick={() => setIsInfoDrawerOpen(true)}><InfoIcon /></IconButton></Tooltip>
                </Stack>
                <Divider sx={{ my: 1.5 }} />
                <Stack direction="row" spacing={1} alignItems="center">
                    {isUpdating ? <CircularProgress size={24} sx={{mx: 'auto'}}/> : getNextAction()}
                    {load.status !== 'Assigned' && load.status !== 'Completed' && load.status !== 'Paused' && (
                        <Tooltip title="Pause Trip"><IconButton color="warning" onClick={() => handleStatusUpdate('Paused')} disabled={isUpdating}><PauseCircleOutlineIcon /></IconButton></Tooltip>
                    )}
                </Stack>
            </Paper>

            <Drawer anchor="right" open={isInfoDrawerOpen} onClose={() => setIsInfoDrawerOpen(false)} PaperProps={{sx: { width: { xs: '90vw', sm: 380 }, backgroundColor: 'rgba(255, 255, 255, 0.75)', backdropFilter: 'blur(10px)', border: 'none' }}}>
                <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ flex: 1, overflowY: 'auto', pt: (theme) => `calc(${theme.mixins.toolbar.minHeight}px + 16px)`, px: 2, pb: 2 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{mb: 2}}>
                             <Typography variant="h6">Trip Information</Typography>
                             <IconButton onClick={() => setIsInfoDrawerOpen(false)}><CloseIcon /></IconButton>
                        </Stack>
                        <Divider sx={{mb: 2}}/>
                        <DetailItem label="Date" value={dayjs(load.pvm).format('DD MMMM YYYY')} />
                        <DetailItem label="Customer" value={load.asiakkaanNimi} />
                        <DetailItem label="Vehicle" value={load.rekNro} />
                        <DetailItem label="Driver" value={load.kuljettajanNimi} />
                        <Divider sx={{ my: 1 }} />
                        <DetailItem label="Origin" value={load.originName} />
                        <DetailItem label="Destination" value={load.destinationName} />
                        <DetailItem label="Timber Type" value={load.taskTimberTypeName} />
                        <DetailItem label="Assigned Volume" value={`${load.taskVolume} m³`} />
                        <Divider sx={{ my: 1 }} />
                        {load.originInstructions && <DetailItem label="Origin Instructions" value={load.originInstructions} />}
                        {load.lisatiedot && <DetailItem label="General Notes" value={load.lisatiedot} />}
                    </Box>
                </Box>
            </Drawer>
            
            {isCompleteModalOpen && (<CompleteLoadModal open={isCompleteModalOpen} onCloseAction={() => setIsCompleteModalOpen(false)} onSubmitAction={handleCompleteTrip} isSubmitting={isUpdating} initialVolume={load.taskVolume}/>)}
            <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                           <Box sx={{ width: '100%', p: 2 }}><Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%', boxShadow: 6 }}>{snackbar.message}</Alert></Box>
                       </Snackbar>
            {/* <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
            </Snackbar> */}
        </Box>
    );
}