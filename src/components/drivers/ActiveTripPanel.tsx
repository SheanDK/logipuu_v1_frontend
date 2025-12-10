// frontend/src/components/drivers/ActiveTripPanel.tsx
'use client';

import React, { useMemo } from 'react';
import { Box, Paper, Typography, Stack, Button, IconButton, Chip, CircularProgress, Divider, List, ListItem, ListItemText, ListItemIcon, ListItemButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import NavigationIcon from '@mui/icons-material/Navigation';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FlagIcon from '@mui/icons-material/Flag';
import { useTranslation } from 'react-i18next';

// This interface should match the camelCased data structure from the backend.
interface TripLeg {
    kuormaId: string;
    status: string;
    purkupaikkaName: string;
    purkupaikkaLat: string | null; // <-- Should be camelCase
    purkupaikkaLng: string | null; // <-- Should be camelCase
    puulaaniName?: string;
    puutavaralaji?: string;
    ajomaaraysNro?: string;
}

interface ActiveTripPanelProps {
    activeTrip: {
        ajomaaraysNro: string | null;
        legs: TripLeg[]; // Use the strongly typed interface
    } | null;
    open: boolean;
    onStatusUpdateAction: (newStatus: string) => void;
    onToggleVisibilityAction: () => void;
    isUpdating: boolean;
    onConfirmCompleteAction: () => void;
    onOpenDetailsAction: () => void;
}



interface ActiveTripPanelProps {
    activeTrip: {
        ajomaaraysNro: string | null;
        legs: TripLeg[]; // Use the strongly typed interface
    } | null;
    open: boolean;
    onStatusUpdateAction: (newStatus: string) => void;
    onToggleVisibilityAction: () => void;
    isUpdating: boolean;
    onConfirmCompleteAction: () => void;
    onOpenDetailsAction: () => void;
}

export default function ActiveTripPanel({ 
    activeTrip, 
    open, 
    onStatusUpdateAction, 
    onToggleVisibilityAction, 
    isUpdating, 
    onConfirmCompleteAction, 
    onOpenDetailsAction
}: ActiveTripPanelProps) {
    
    const { t } = useTranslation('activeTripPanel');

    // The component now receives and uses a strongly-typed 'legs' array.
    const processedLegs: TripLeg[] = activeTrip?.legs || [];

    const primaryLeg = useMemo(() => {
        if (processedLegs.length === 0) return null;
        return processedLegs.find(leg => leg.status !== 'Assigned') || processedLegs[0];
    }, [processedLegs]);

    const overallStatus = primaryLeg?.status || 'Unknown';

    const getTranslatedStatus = (status: string) => {
        const statusMap: { [key: string]: string } = {
            'In Progress': 'inProgress',
            'Paused': 'paused',
            'Completed': 'completed',
            'En Route to Destination': 'enRouteToDestination',
            'Assigned': 'assigned',
            'At Origin': 'atOrigin',
            'At Destination': 'atDestination'
        };
        const statusKey = statusMap[status] || 'na'; // Default to 'na' if status is unknown
        // Use the 'status' namespace defined in your JSON files
        return t(`status.${statusKey}`);
    };
    
    const translatedStatusLabel = getTranslatedStatus(overallStatus);

    const dropOffGroups = useMemo(() => {
        if (processedLegs.length === 0) return [];
        const groups = new Map<string, TripLeg[]>();
        processedLegs.forEach((leg) => {
            const dropOffName = leg.purkupaikkaName || t('activeTrip.unknownDestination');
            if (!groups.has(dropOffName)) {
                groups.set(dropOffName, []);
            }
            groups.get(dropOffName)!.push(leg);
        });
        return Array.from(groups.entries());
    }, [processedLegs, t]);

    if (!activeTrip || processedLegs.length === 0) {
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
            <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%', maxHeight: '70vh' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="h6">{t('activeTrip.title')}</Typography>
                    <Chip label={translatedStatusLabel} color="error" size="medium" />
                    <IconButton size="small" onClick={onToggleVisibilityAction}>
                        <CloseIcon />
                    </IconButton>
                </Stack>
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                    {t('activeTrip.currentDestinations')}
                </Typography>

                <Box sx={{ flexGrow: 1, overflowY: 'auto', minHeight: 0 }}>
                    <List dense>
                    {dropOffGroups.map(([dropOffName, legsInGroup]) => (
                        <ListItem
                            key={dropOffName}
                            disablePadding
                            secondaryAction={
                                <IconButton 
                                    edge="end" 
                                    aria-label="navigate"
                                    onClick={() => {
                                        // --- THE FIX IS HERE ---
                                        // Use the correct camelCase property names.
                                        handleNavigation(legsInGroup[0].purkupaikkaLat, legsInGroup[0].purkupaikkaLng);
                                    }}
                                >
                                    <NavigationIcon />
                                </IconButton>
                            }
                        >
                            <ListItemButton onClick={onOpenDetailsAction}>
                                <ListItemIcon><FlagIcon /></ListItemIcon>
                                <ListItemText 
                                    primary={dropOffName} 
                                    secondary={`${legsInGroup.length} ${legsInGroup.length > 1 ? t('activeTrip.loads') : t('activeTrip.load')}`} 
                                />
                            </ListItemButton>
                        </ListItem>
                    ))}
                </List>
                </Box>
                <Divider sx={{ my: 2, flexShrink: 0 }} />
                    <Box flexShrink={0}>
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
                
            </Box>
        </Paper>
    );
}