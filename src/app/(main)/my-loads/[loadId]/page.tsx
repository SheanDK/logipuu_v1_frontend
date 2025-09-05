// frontend/src/app/(main)/my-loads/[loadId]/page.tsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    Box, Typography, Paper, Alert, CircularProgress, Button, Stack, Divider,
    Chip, Grid, Snackbar, Card, CardContent, CardHeader, Avatar
} from '@mui/material';
import type { AlertColor } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import FlagIcon from '@mui/icons-material/Flag';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import dayjs from 'dayjs';

import { ILoadDetails, ILoadStatusUpdateDto } from '../../../../types';
import { getLoadById, updateLoadStatus } from '../../../../services/loadService';

const DetailItem = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <Box sx={{ py: 1.5 }}>
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
    
    const getNextAction = () => {
        const actionButtonProps = { size: "large" as "large", variant: "contained" as "contained", fullWidth: true, disabled: isUpdating };
        switch (load?.status) {
            case 'Assigned': return <Button {...actionButtonProps} startIcon={<PlayCircleOutlineIcon />} onClick={() => handleStatusUpdate('In Progress')}>Start Trip</Button>;
            case 'In Progress': return <Button {...actionButtonProps} startIcon={<LocationOnIcon />} onClick={() => handleStatusUpdate('At Origin')}>Arrived at Origin</Button>;
            case 'At Origin': return <Button {...actionButtonProps} startIcon={<WarehouseIcon />} onClick={() => handleStatusUpdate('En Route to Destination')}>Confirm Loading & Depart</Button>;
            case 'En Route to Destination': return <Button {...actionButtonProps} startIcon={<LocationOnIcon />} onClick={() => handleStatusUpdate('At Destination')}>Arrived at Destination</Button>;
            case 'At Destination': return <Button {...actionButtonProps} startIcon={<FlagIcon />} onClick={() => handleStatusUpdate('Completed')}>Complete Trip</Button>;
            case 'Completed': return (<Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, color: 'success.main', p: 1, border: '1px solid', borderColor: 'success.main', borderRadius: 1}}><CheckCircleIcon /><Typography fontWeight="bold">Trip Completed</Typography></Box>);
            default: return <Typography color="text.secondary" textAlign="center">No actions available for status: {load?.status}</Typography>;
        }
    };

    if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
    if (error) return <Alert severity="error" sx={{ m: 3 }}>{error}</Alert>;
    if (!load) return <Alert severity="warning" sx={{ m: 3 }}>Load details could not be found.</Alert>;

    return (
        <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: '900px', mx: 'auto' }}>
            <Button startIcon={<ArrowBackIcon />} onClick={() => router.push('/my-loads')} sx={{ mb: 2 }}>Back to Dashboard</Button>
            <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                    <Stack spacing={3}>
                        <Paper sx={{ p: {xs: 2, sm: 3} }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                                <Box><Typography variant="caption" color="text.secondary">Load #{load.kuormaId}</Typography><Typography variant="h4" component="h1" fontWeight="bold">Trip Details</Typography></Box>
                                <Chip label={load.status} color="primary" variant="filled" />
                            </Stack>
                            <Divider sx={{ my: 2 }} />
                            <Box sx={{ pt: 1 }}>{isUpdating ? <Box sx={{display: 'flex', justifyContent: 'center'}}><CircularProgress /></Box> : getNextAction()}</Box>
                        </Paper>
                        <Card variant="outlined"><CardHeader avatar={<Avatar sx={{ bgcolor: 'info.main' }}><LocationOnIcon /></Avatar>} title="Origin Details" /><CardContent><DetailItem label="Location Name" value={load.originName} /><DetailItem label="Address" value={load.originAddress} />{load.originInstructions && <DetailItem label="Special Instructions" value={<Typography variant="body2" sx={{whiteSpace: 'pre-wrap'}}>{load.originInstructions}</Typography>} />}</CardContent></Card>
                        <Card variant="outlined"><CardHeader avatar={<Avatar sx={{ bgcolor: 'success.main' }}><WarehouseIcon /></Avatar>} title="Destination Details" /><CardContent><DetailItem label="Location Name" value={load.destinationName} /><DetailItem label="Address" value={load.destinationAddress} /></CardContent></Card>
                    </Stack>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: {xs: 2, sm: 3}, position: 'sticky', top: '80px' }}>
                        <Typography variant="h6" gutterBottom>Trip Info</Typography>
                        <Divider sx={{ mb: 1 }} />
                        <DetailItem label="Date" value={dayjs(load.pvm).format('DD MMMM YYYY')} />
                        <DetailItem label="Customer" value={load.asiakkaanNimi} />
                        <DetailItem label="Vehicle" value={load.rekNro} />
                        <DetailItem label="Driver" value={load.kuljettajanNimi} />
                        <DetailItem label="Driving Order No." value={load.ajomaaraysNro} />
                        <Divider sx={{ my: 1 }} />
                        <DetailItem label="Timber Type" value={load.taskTimberTypeName} />
                        <DetailItem label="Volume for this trip" value={`${load.taskVolume} m³`} />
                        <Divider sx={{ my: 1 }} />
                        {load.lisatiedot && <DetailItem label="General Notes" value={<Typography variant="body2" sx={{whiteSpace: 'pre-wrap'}}>{load.lisatiedot}</Typography>} />}
                    </Paper>
                </Grid>
            </Grid>
            <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}><Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert></Snackbar>
        </Box>
    );
}