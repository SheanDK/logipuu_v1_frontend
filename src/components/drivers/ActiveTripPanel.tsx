// frontend/src/components/drivers/ActiveTripPanel.tsx
'use client';

import React from 'react';
import { Box, Paper, Typography, Stack, Button, IconButton, Chip, CircularProgress, Divider } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import NavigationIcon from '@mui/icons-material/Navigation';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

interface ActiveTripPanelProps {
    activeLoad: any;
    open: boolean;
    onStatusUpdateAction: (newStatus: string) => void;
    onToggleVisibilityAction: () => void;
    isUpdating: boolean;
}

export default function ActiveTripPanel({ activeLoad, open, onStatusUpdateAction, onToggleVisibilityAction, isUpdating }: ActiveTripPanelProps) {
    if (!activeLoad) return null;

    const { 
        puulaaniName, 
        puulaaniLat, 
        puulaaniLng,
        purkupaikkaName,
        purkupaikkaLat,
        purkupaikkaLng,
        puutavaralaji
    } = activeLoad.details || {};

    const handleNavigation = (type: 'pickup' | 'dropoff') => {
        let destination;
        if (type === 'pickup' && puulaaniLat && puulaaniLng) {
            destination = `${puulaaniLat},${puulaaniLng}`;
        } else if (type === 'dropoff' && purkupaikkaLat && purkupaikkaLng) {
            destination = `${purkupaikkaLat},${purkupaikkaLng}`;
        } else {
            alert("Location coordinates not available for this navigation point.");
            return;
        }
        const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`;
        window.open(googleMapsUrl, '_blank');
    };

    return (
        <Paper 
            elevation={12} 
            sx={{ 
                position: 'fixed', 
                bottom: { xs: 0, sm: 24 }, 
                left: { xs: 0, sm: '50%' }, 
                zIndex: 1200, 
                width: { xs: '100%', sm: 400 }, 
                borderRadius: { xs: '16px 16px 0 0', sm: 3 },
                transition: 'transform 0.3s ease-in-out, opacity 0.3s ease-in-out',
                transform: open 
                    ? (
                        {
                           xs: 'translateY(0)',
                           sm: 'translate(-50%, 0)'
                        }
                      )
                    : (
                        {
                           xs: 'translateY(100%)',
                           sm: 'translate(-50%, calc(100% + 24px))' // Hide it completely below the screen on desktop
                        }
                    ),
                opacity: open ? 1 : 0,
                pointerEvents: open ? 'auto' : 'none'
            }}
        >
            <Box sx={{ p: 2 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="h6">Active Trip</Typography>
                    <Chip label={activeLoad.status} color="primary" size="small" />
                    <IconButton size="small" onClick={onToggleVisibilityAction}><CloseIcon /></IconButton>
                </Stack>
                <Typography variant="body2" color="text.secondary">
                    Hauling <b>{puutavaralaji || 'N/A'}</b> from <b>{puulaaniName || 'N/A'}</b> to <b>{purkupaikkaName || 'N/A'}</b>
                </Typography>
                <Divider sx={{ my: 2 }} />
                
                {isUpdating ? <Box sx={{display:'flex', justifyContent: 'center'}}><CircularProgress size={24} /></Box> : (
                    <Stack spacing={1}>
                        <Stack direction="row" spacing={1}>
                            <Button fullWidth variant="outlined" startIcon={<NavigationIcon />} onClick={() => handleNavigation('pickup')}>To Pickup</Button>
                            <Button fullWidth variant="outlined" startIcon={<NavigationIcon />} onClick={() => handleNavigation('dropoff')}>To Drop-off</Button>
                        </Stack>
                        
                        {activeLoad.status === 'In Progress' && <Button fullWidth variant="contained" color="warning" startIcon={<PauseIcon />} onClick={() => onStatusUpdateAction('Paused')}>Pause Trip</Button>}
                        {activeLoad.status === 'Paused' && <Button fullWidth variant="contained" color="info" startIcon={<PlayArrowIcon />} onClick={() => onStatusUpdateAction('In Progress')}>Resume Trip</Button>}
                        
                        <Button fullWidth variant="contained" color="success" startIcon={<CheckCircleIcon />} onClick={() => onStatusUpdateAction('Completed')}>Complete Trip</Button>
                    </Stack>
                )}
            </Box>
        </Paper>
    );
}