// frontend/src/app/(main)/my-loads/page.tsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { 
    Box, Typography, Paper, Alert, CircularProgress, Button, Card, CardContent, 
    CardActionArea, Divider, Stack, Grid, CardHeader, IconButton
} from '@mui/material';
import type { AlertColor } from '@mui/material';
import { useRouter } from 'next/navigation';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined';
import Snackbar from '@mui/material/Snackbar';

import LoadFormModal from '../../../components/loads/LoadFormModal';
import { ILoadListItem, ILoad } from '../../../types';
import { fetchMyLoads } from '../../../services/loadService';
import dayjs from 'dayjs';

// Dedicated component for a single load card for better code organization
const LoadCard = ({ load, onClick }: { load: ILoadListItem, onClick: (id: number) => void }) => (
    <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <CardHeader
            titleTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
            title={dayjs(load.pvm).format('DD MMMM YYYY')}
            action={
                <Typography variant="caption" color="primary.main" sx={{ fontWeight: 'bold', mr: 1 }}>
                    #{load.kuormaId}
                </Typography>
            }
            sx={{ pb: 1 }}
        />
        <Divider />
        <CardContent sx={{ flexGrow: 1 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
                <Box>
                    <Typography variant="caption" color="text.secondary">Origin</Typography>
                    <Typography fontWeight="bold" variant="h6">{load.lahto}</Typography>
                </Box>
                <ArrowForwardIcon sx={{ color: 'grey.400' }} />
                <Box>
                    <Typography variant="caption" color="text.secondary">Destination</Typography>
                    <Typography fontWeight="bold" variant="h6">{load.kohde}</Typography>
                </Box>
            </Stack>
            <Divider sx={{ my: 1.5 }} />
            <Grid container spacing={2}>
                <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Customer</Typography>
                    <Typography variant="body2">{load.asiakkaanNimi}</Typography>
                </Grid>
                <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Vehicle</Typography>
                    <Typography variant="body2">{load.rekNro}</Typography>
                </Grid>
            </Grid>
        </CardContent>
        <Divider />
        <CardActionArea onClick={() => onClick(load.kuormaId)} sx={{ p: 1.5, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
            <Typography variant="button" color="primary" sx={{ mr: 0.5 }}>View Details</Typography>
            <ChevronRightIcon color="primary" />
        </CardActionArea>
    </Card>
);

export default function DriverDashboardPage() {
    const router = useRouter();
    const [myLoads, setMyLoads] = useState<ILoadListItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: AlertColor }>({ open: false, message: '', severity: 'info' });

    const loadData = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await fetchMyLoads();
            setMyLoads(data);
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to fetch your assigned loads.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);
    
    const handleSaveSuccess = (message: string) => {
        setIsCreateModalOpen(false);
        loadData(); // Refresh the list of active loads
        setSnackbar({ open: true, message, severity: 'success' });
    };

    const handleLoadClick = (loadId: number) => {
        router.push(`/my-loads/${loadId}`);
    };

    return (
        <Box sx={{ p: { xs: 2, sm: 3 }, width: '100%' }}>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 3 }}>
                Driver Dashboard
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            
            <Grid container spacing={3}>
                <Grid item xs={12} md={6} lg={5}>
                    <Paper 
                        variant="outlined" 
                        sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 200 }}
                    >
                        <Typography variant="h5" gutterBottom>Start a New Trip</Typography>
                        <Typography color="text.secondary" textAlign="center" sx={{ mb: 2 }}>Select a customer, puulaani, and task to begin a new load.</Typography>
                        <Button 
                            variant="contained" 
                            size="large"
                            startIcon={<AddCircleOutlineIcon />}
                            onClick={() => setIsCreateModalOpen(true)}
                        >
                            Create New Load
                        </Button>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={6} lg={7}>
                     <Paper variant="outlined" sx={{ p: 3, height: '100%', minHeight: 200 }}>
                        <Typography variant="h6" gutterBottom>My Active Loads</Typography>
                        {isLoading ? <CircularProgress /> :
                         myLoads.length > 0 ? (
                            <Stack spacing={2}>
                                {myLoads.map((load) => (
                                    <LoadCard key={load.kuormaId} load={load} onClick={handleLoadClick} />
                                ))}
                            </Stack>
                         ) : (
                             <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'text.secondary', py: 3 }}>
                                <InboxOutlinedIcon sx={{ fontSize: 48, mb: 1 }} />
                                <Typography>You have no active loads.</Typography>
                             </Box>
                         )}
                    </Paper>
                </Grid>
            </Grid>

            {isCreateModalOpen && (
                 <LoadFormModal 
                    open={isCreateModalOpen} 
                    onCloseAction={() => setIsCreateModalOpen(false)} 
                    onSaveSuccessAction={handleSaveSuccess}
                    initialData={null}
                />
            )}

            <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}