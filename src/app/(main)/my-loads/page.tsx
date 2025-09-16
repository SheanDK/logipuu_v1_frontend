// frontend/src/app/(main)/my-loads/page.tsx
'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { 
    Box, Typography, Paper, Alert, CircularProgress, Button, Card, CardContent, 
    Divider, Stack, Grid, CardHeader, Tooltip, CardActionArea, IconButton, Chip
} from '@mui/material';
import type { AlertColor } from '@mui/material';
import { useRouter } from 'next/navigation';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EditIcon from '@mui/icons-material/Edit';
import Snackbar from '@mui/material/Snackbar';
import dayjs from 'dayjs';
import 'dayjs/locale/fi';

import LoadFormModal from '../../../components/loads/LoadFormModal';
import { ILoadListItem, ILoadDetails } from '../../../types';
import { fetchMyLoads, fetchMyLastCompletedLoad, getLoadById } from '../../../services/loadService';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

dayjs.locale('fi');

// A compact card for the "Upcoming" list
const UpcomingLoadRow = ({ load, onViewDetails }: { load: ILoadListItem, onViewDetails: (id: number) => void }) => (
    <Paper 
        variant="outlined" 
        onClick={() => onViewDetails(load.kuormaId)}
        sx={{ 
            p: 1.5, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            cursor: 'pointer',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
                borderColor: 'primary.main',
                boxShadow: (theme) => theme.shadows[2]
            }
        }}
    >
        <Box>
            <Typography variant="body2" fontWeight="bold">{load.lahto} &#8594; {load.kohde}</Typography>
            <Typography variant="caption" color="text.secondary">{dayjs(load.pvm).format('dddd, DD MMMM YYYY')}</Typography>
        </Box>
        <ChevronRightIcon color="action" />
    </Paper>
);

// A card to display the last completed trip
const LastCompletedCard = ({ load }: { load: ILoadListItem }) => (
    <Paper variant="outlined" sx={{ p: 2, backgroundColor: '#f5f5f5', borderStyle: 'dashed' }}>
        <Stack spacing={1}>
            <Box sx={{display: 'flex', alignItems: 'center', gap: 1, color: 'success.main'}}>
                <CheckCircleOutlineIcon />
                <Typography variant="h6" sx={{fontSize: '1rem', fontWeight: 'bold'}}>Last Completed Trip</Typography>
            </Box>
            <Typography variant="body2" fontWeight="bold">{load.lahto} &#8594; {load.kohde}</Typography>
            <Typography variant="caption" color="text.secondary">
                On {dayjs(load.pvm).format('dddd, DD MMMM YYYY')}
            </Typography>
        </Stack>
    </Paper>
);


export default function DriverDashboardPage() {
    const router = useRouter();
    const [myLoads, setMyLoads] = useState<ILoadListItem[]>([]);
    const [lastCompletedLoad, setLastCompletedLoad] = useState<ILoadListItem | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: AlertColor }>({ open: false, message: '', severity: 'info' });
    const [selectedLoadForEditing, setSelectedLoadForEditing] = useState<ILoadDetails | null>(null);

    const loadData = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            const [activeData, lastCompletedData] = await Promise.all([
                fetchMyLoads(),
                fetchMyLastCompletedLoad()
            ]);
            setMyLoads(activeData);
            setLastCompletedLoad(lastCompletedData);
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to fetch dashboard data.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const handleOpenCreateModal = () => {
        setSelectedLoadForEditing(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = async (loadItem: ILoadListItem) => {
        try {
            const fullLoadData = await getLoadById(loadItem.kuormaId);
            setSelectedLoadForEditing(fullLoadData);
            setIsModalOpen(true);
        } catch (err) {
            setSnackbar({ open: true, message: 'Failed to fetch load details for editing.', severity: 'error' });
        }
    };
    
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedLoadForEditing(null);
    };

    const handleSaveSuccess = (message: string) => {
        handleCloseModal();
        loadData();
        setSnackbar({ open: true, message, severity: 'success' });
    };

    const handleViewDetailsClick = (loadId: number) => {
        router.push(`/my-loads/${loadId}`);
    };
    
    const { nextLoad, upcomingLoads } = useMemo(() => {
        if (!myLoads || myLoads.length === 0) return { nextLoad: null, upcomingLoads: [] };
        const [firstLoad, ...rest] = myLoads;
        return { nextLoad: firstLoad, upcomingLoads: rest };
    }, [myLoads]);

    if (isLoading) { return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>; }
    if (error) { return <Alert severity="error" sx={{ m: 3 }}>{error}</Alert>; }

    return (
        <Box sx={{ p: { xs: 2, sm: 3 }, width: '100%' }}>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 3 }}>
                Driver Dashboard
            </Typography>
            
            {nextLoad ? (
                <Grid container spacing={3}>
                    <Grid item xs={12} md={5}>
                        <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                             {/* <Typography variant="h6" gutterBottom>Upcoming Queue</Typography> */}
                             {upcomingLoads.length > 0 ? (
                                <Stack spacing={1.5}>
                                    {upcomingLoads.map(load => (
                                        <UpcomingLoadRow key={load.kuormaId} load={load} onViewDetails={handleViewDetailsClick} />
                                    ))}
                                </Stack>
                             ) : lastCompletedLoad ? (
                                <LastCompletedCard load={lastCompletedLoad} />
                             ) : (
                                <Box sx={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80%', color: 'text.secondary', textAlign: 'center'}}>
                                    <CheckCircleIcon sx={{fontSize: 40, mb: 1}} color="success" />
                                    <Typography>Your queue is clear!</Typography>
                                    <Typography variant="caption">No other trips after the current one.</Typography>
                                </Box>
                             )}
                        </Paper>
                    </Grid>

                    <Grid item xs={12} md={7}>
                        <Paper sx={{ p: 3, border: 2, borderColor: 'primary.main', height: '100%' }}>
                            <Typography variant="h5" gutterBottom>Your Next Trip</Typography>
                            <Divider sx={{mb: 2}}/>
                            <Stack direction="row" alignItems="center" spacing={2} sx={{mb: 2}}>
                                <Box>
                                    <Typography variant="caption">Origin</Typography>
                                    <Typography fontWeight="bold" variant="h5">{nextLoad.lahto}</Typography>
                                </Box>
                                <ArrowForwardIcon fontSize="large" sx={{ color: 'grey.400' }} />
                                <Box>
                                    <Typography variant="caption">Destination</Typography>
                                    <Typography fontWeight="bold" variant="h5">{nextLoad.kohde}</Typography>
                                </Box>
                            </Stack>
                             <Typography variant="body2" color="text.secondary">
                                For customer <strong>{nextLoad.asiakkaanNimi}</strong> on <strong>{dayjs(nextLoad.pvm).format('dddd, DD MMMM')}</strong> with vehicle <strong>{nextLoad.rekNro}</strong>.
                            </Typography>
                            <Button
                                variant="contained"
                                size="large"
                                fullWidth
                                startIcon={<PlayCircleOutlineIcon />}
                                onClick={() => handleViewDetailsClick(nextLoad.kuormaId)}
                                sx={{ mt: 3 }}
                            >
                                View Details & Start Trip
                            </Button>
                        </Paper>
                    </Grid>
                    
                </Grid>
            ) : (
                <Paper variant="outlined" sx={{ p: 4, mt: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', backgroundColor: 'grey.50', minHeight: 300 }}>
                    <InboxOutlinedIcon sx={{ fontSize: 60, color: 'grey.400', mb: 2 }} />
                    <Typography variant="h6" gutterBottom>No Active Loads Assigned</Typography>
                    <Typography color="text.secondary" sx={{ mb: 3, maxWidth: '400px' }}>
                        You have no pending tasks. You can start a new trip yourself if one is available.
                    </Typography>
                    <Button variant="contained" size="large" startIcon={<AddCircleOutlineIcon />} onClick={handleOpenCreateModal}>
                        Create New Load
                    </Button>
                </Paper>
            )}

            {isModalOpen && (
                <LoadFormModal 
                   open={isModalOpen} 
                   onCloseAction={handleCloseModal} 
                   onSaveSuccessAction={handleSaveSuccess}
                   initialData={selectedLoadForEditing}
               />
           )}
           <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
               <Box sx={{ width: '100%', p: 2 }}><Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%', boxShadow: 6 }}>{snackbar.message}</Alert></Box>
           </Snackbar>
        </Box>
    );
}