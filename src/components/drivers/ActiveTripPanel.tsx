// frontend/src/components/drivers/ActiveTripPanel.tsx
'use client';

import React, { useMemo } from 'react';
import { Box, Paper, Typography, Stack, Button, IconButton, Chip, CircularProgress, Divider, List, ListItem, ListItemText, ListItemIcon } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import NavigationIcon from '@mui/icons-material/Navigation';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FlagIcon from '@mui/icons-material/Flag';
import { useTranslation } from 'react-i18next';

// Trip leg interface - matches backend snake_case format
interface TripLeg {
    kuorma_id: string;
    status: string;
    purkupaikka_name: string;  // Backend sends snake_case
    purkupaikka_lat: string | null;
    purkupaikka_lng: string | null;
    puulaani_name?: string;
    puutavaralaji?: string;
    ajomaarays_nro?: string;
}

interface ActiveTripPanelProps {
    activeTrip: {
        ajomaaraysNro: string | null;
        legs: TripLeg[];
    } | null;
    open: boolean;
    onStatusUpdateAction: (newStatus: string) => void;
    onToggleVisibilityAction: () => void;
    isUpdating: boolean;
    onConfirmCompleteAction: () => void;
}

export default function ActiveTripPanel({ 
    activeTrip, 
    open, 
    onStatusUpdateAction, 
    onToggleVisibilityAction, 
    isUpdating,
    onConfirmCompleteAction  
}: ActiveTripPanelProps) {
    // FIX: ALWAYS call hooks at the top level, BEFORE any conditional returns
    const { t } = useTranslation('activeTripPanel');

    // FIX: Compute values safely, handling null/undefined cases
    const primaryLeg = useMemo(() => {
         if (!activeTrip || !activeTrip.legs || activeTrip.legs.length === 0) return null;
        return activeTrip.legs.find(leg => leg.status !== 'Assigned') || activeTrip.legs[0];
    }, [activeTrip]);

    const overallStatus = primaryLeg?.status || 'Unknown';

    const dropOffGroups = useMemo(() => {
        if (!activeTrip?.legs || activeTrip.legs.length === 0) 
            return [];
        
        const groups = new Map<string, TripLeg[]>();
        
        activeTrip.legs.forEach((leg: TripLeg) => {
            // Use snake_case as backend sends it
            const dropOffName = leg.purkupaikka_name || t('activeTrip.unknownDestination');
            
            if (!groups.has(dropOffName)) {
                groups.set(dropOffName, []);
            }
            groups.get(dropOffName)!.push(leg);
        });
        
        return Array.from(groups.entries());
    }, [activeTrip, t]);

    // FIX: NOW we can do conditional returns AFTER all hooks
    if (!activeTrip || !activeTrip.legs || activeTrip.legs.length === 0) {
        return null;
    }

    const handleNavigation = (lat?: string | null, lng?: string | null) => {
        if (lat && lng) {
            const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
            window.open(googleMapsUrl, '_blank');
        } else {
            alert(t('activeTrip.alertNoCoords'));
        }
    };

    return (
        <Paper
            elevation={12}
            sx={{
                position: 'fixed',
                bottom: { xs: 0, sm: 24 },
                left: { xs: 0, sm: '50%' },
                zIndex: 1200,
                width: { xs: '100%', sm: 600 },
                borderRadius: { xs: '16px 16px 0 0', sm: 3 },
                transition: 'transform 0.3s ease-in-out, opacity 0.3s ease-in-out',
                transform: open
                    ? { xs: 'translateY(0)', sm: 'translate(-50%, 0)' }
                    : { xs: 'translateY(100%)', sm: 'translate(-50%, calc(100% + 24px))' },
                opacity: open ? 1 : 0,
                pointerEvents: open ? 'auto' : 'none'
            }}
        >
            <Box sx={{ p: 2 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="h6">{t('activeTrip.title')}</Typography>
                    <Chip label={overallStatus} color="error" size="medium" />
                    <IconButton size="small" onClick={onToggleVisibilityAction}>
                        <CloseIcon />
                    </IconButton>
                </Stack>
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                    {t('activeTrip.currentDestinations')}
                </Typography>

                <List dense>
                    {dropOffGroups.map(([dropOffName, legs]) => (
                        <ListItem 
                            key={dropOffName}
                            secondaryAction={
                                <IconButton 
                                    edge="end" 
                                    onClick={() => handleNavigation(legs[0].purkupaikka_lat, legs[0].purkupaikka_lng)}
                                >
                                    <NavigationIcon />
                                </IconButton>
                            }
                        >
                            <ListItemIcon>
                                <FlagIcon />
                            </ListItemIcon>
                            <ListItemText 
                                primary={dropOffName} 
                                secondary={`${legs.length} ${legs.length > 1 ? t('activeTrip.loads') : t('activeTrip.load')}`} 
                            />
                        </ListItem>
                    ))}
                </List>

                <Divider sx={{ my: 2 }} />

                {isUpdating ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <CircularProgress size={24} />
                    </Box>
                ) : (
                    <Stack spacing={1}>
                        {overallStatus === 'In Progress' && (
                            <Button 
                                fullWidth 
                                variant="contained" 
                                color="warning" 
                                startIcon={<PauseIcon />} 
                                onClick={() => onStatusUpdateAction('Paused')}
                            >
                                {t('activeTrip.pause')}
                            </Button>
                        )}
                        {overallStatus === 'Paused' && (
                            <Button 
                                fullWidth 
                                variant="contained" 
                                color="info" 
                                startIcon={<PlayArrowIcon />} 
                                onClick={() => onStatusUpdateAction('In Progress')}
                            >
                                {t('activeTrip.resume')}
                            </Button>
                        )}
                        <Button 
                            fullWidth 
                            variant="contained" 
                            color="success" 
                            startIcon={<CheckCircleIcon />}
                            onClick={onConfirmCompleteAction} 
                            //onClick={() => onStatusUpdateAction('Completed')}
                        >
                            {t('activeTrip.complete')}
                        </Button>
                    </Stack>
                )}
            </Box>
        </Paper>
    );
}