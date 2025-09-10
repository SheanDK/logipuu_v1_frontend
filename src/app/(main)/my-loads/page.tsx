// frontend/src/app/(main)/my-loads/page.tsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { 
    Box, Typography, Paper, Alert, CircularProgress, Button, Card, CardContent, 
    CardActionArea, Divider, Stack, Grid, CardHeader, Chip, Tooltip, IconButton
} from '@mui/material';
import type { AlertColor } from '@mui/material';
import { useRouter } from 'next/navigation';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined';
import EditIcon from '@mui/icons-material/Edit';
import Snackbar from '@mui/material/Snackbar';
import dayjs from 'dayjs';

import LoadFormModal from '../../../components/loads/LoadFormModal';
import { ILoadListItem, ILoad, ILoadDetails } from '../../../types';
import { fetchMyLoads, getLoadById } from '../../../services/loadService';

// Card component for displaying a single active load
const ActiveLoadCard = ({ load, onViewDetails, onEdit }: { load: ILoadListItem, onViewDetails: (id: number) => void, onEdit: (load: ILoadListItem) => void }) => {
    const canEdit = load.status === 'Assigned';

    return (
        <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardHeader
                titleTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                title={dayjs(load.pvm).format('DD MMMM YYYY')}
                action={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {canEdit && (
                            <Tooltip title="Edit Load Details">
                                <IconButton onClick={(e) => { e.stopPropagation(); onEdit(load); }} size="small" sx={{ mr: 1 }}>
                                    <EditIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        )}
                        <Chip label={load.status || 'Assigned'} size="small" color={canEdit ? "warning" : "primary"} variant="outlined" />
                    </Box>
                }
            />
            <Divider />
            <CardContent sx={{ flexGrow: 1 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                    <Box><Typography variant="caption">Origin</Typography><Typography fontWeight="bold" variant="h6">{load.lahto}</Typography></Box>
                    <ArrowForwardIcon sx={{ color: 'grey.400' }} />
                    <Box><Typography variant="caption">Destination</Typography><Typography fontWeight="bold" variant="h6">{load.kohde}</Typography></Box>
                </Stack>
            </CardContent>
            <Divider />
            <CardActionArea onClick={() => onViewDetails(load.kuormaId)} sx={{ p: 1.5, display: 'flex', justifyContent: 'flex-end' }}>
                <Typography variant="button" color="primary" sx={{ mr: 0.5 }}>View & Update Status</Typography>
                <ChevronRightIcon color="primary" />
            </CardActionArea>
        </Card>
    );
};

export default function DriverDashboardPage() {
    const router = useRouter();
    const [myLoads, setMyLoads] = useState<ILoadListItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedLoadForEditing, setSelectedLoadForEditing] = useState<ILoadDetails | null>(null);
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: AlertColor }>({ open: false, message: '', severity: 'info' });

    const loadData = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await fetchMyLoads();
            setMyLoads(data);
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to fetch your loads.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const handleOpenEditModal = async (loadItem: ILoadListItem) => {
        try {
            const fullLoadData = await getLoadById(loadItem.kuormaId);
            setSelectedLoadForEditing(fullLoadData);
            setIsCreateModalOpen(true); // Re-use the same modal for both create and edit
        } catch (err) {
            setSnackbar({ open: true, message: 'Failed to fetch load details for editing.', severity: 'error' });
        }
    };
    
    const handleCloseModal = () => {
        setIsCreateModalOpen(false);
        setSelectedLoadForEditing(null);
    };

    const handleSaveSuccess = (message: string) => {
        handleCloseModal();
        loadData();
        setSnackbar({ open: true, message, severity: 'success' });
    };

    const activeLoad = myLoads.find(load => load.status !== 'Completed');

    return (
        <Box sx={{ p: { xs: 2, sm: 3 }, width: '100%' }}>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 3 }}>
                Driver Dashboard
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            
            <Grid container spacing={3}>
                <Grid item xs={12} md={activeLoad ? 12 : 6} lg={activeLoad ? 12 : 5}>
                    {isLoading ? <CircularProgress /> :
                     activeLoad ? (
                        <Paper variant="outlined" sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom>My Active Load</Typography>
                            <ActiveLoadCard 
                                load={activeLoad} 
                                onViewDetails={(id) => router.push(`/my-loads/${id}`)}
                                onEdit={handleOpenEditModal}
                            />
                        </Paper>
                     ) : (
                         <Paper variant="outlined" sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 200 }}>
                            <AddCircleOutlineIcon color="primary" sx={{ fontSize: 48, mb: 2 }} />
                            <Typography variant="h5" gutterBottom>Start a New Trip</Typography>
                            <Typography color="text.secondary" textAlign="center" sx={{ mb: 3 }}>Select a customer, puulaani, and task to begin a new load.</Typography>
                            <Button variant="contained" size="large" onClick={() => setIsCreateModalOpen(true)}>
                                Create New Load
                            </Button>
                        </Paper>
                     )}
                </Grid>
            </Grid>
            
            {isCreateModalOpen && (
                 <LoadFormModal 
                    open={isCreateModalOpen} 
                    onClose={handleCloseModal} 
                    onSaveSuccess={handleSaveSuccess}
                    initialData={selectedLoadForEditing}
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