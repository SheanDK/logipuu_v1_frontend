﻿// frontend/src/components/drivers/TimberDashboard.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Box, Paper, CircularProgress, Alert, Button, Stack, List, ListItemText, Divider, Typography, ListItemButton, SpeedDial, SpeedDialAction, SpeedDialIcon, Card, CardActionArea, CardContent } from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import MapIcon from '@mui/icons-material/Map';
import ListIcon from '@mui/icons-material/List';
import RestoreIcon from '@mui/icons-material/Restore';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FactoryIcon from '@mui/icons-material/Factory';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';

import dynamic from 'next/dynamic';
import { io, Socket } from 'socket.io-client';
import { useDriverSession } from '@/contexts/DriverSessionContext';
import { useAuth } from '@/contexts/AuthContext';
import { useSnackbar } from 'notistack';
import { useTranslation } from 'react-i18next';

// --- Types ---
import { TripMapProps, TripLegForMap } from '../loads/TripMap';
import { PuulaaniDetails, ICreateLoadDto, LoadTypeEnum, IMapFilterState, IWoodEntry, IMapTimberStack } from '@/types';

// --- Services ---
import { getDriverMapData, DriverMapData, getActiveTripForDriver, updateTimberEntryStatus } from '@/services/driverViewService';
import { getTimberStackFullDetails } from '@/services/timberStackService';
import { createBulkLoad, deleteLoad, getLoadForEdit, updateLoad, updateLoadStatus, updateTripStatus } from '@/services/loadService';
import { useMapData } from '@/hooks/useMapData'; // Ensure this hook is imported

// --- Child Components ---
const TripMap = dynamic<TripMapProps>(
    () => import('../loads/TripMap'), 
    { 
        ssr: false, 
        loading: () => (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <CircularProgress />
            </Box>
        ) 
    }
);
const PuulaaniDetailsPanel = dynamic(() => import('../loads/PuulaaniDetailsPanel'), { ssr: false });
const CreateLoadModal = dynamic(() => import('../loads/CreateLoadModal'), { ssr: false });
const ActiveTripPanel = dynamic(() => import('./ActiveTripPanel'), { ssr: false });
const ConfirmationDialog = dynamic(() => import('../common/ConfirmationDialog'), { ssr: false });
const ActiveTripDetailsModal = dynamic(() => import('./ActiveTripDetailsModal'), { ssr: false });

// --- HELPER FUNCTION: Calculate totals from entries ---
// const calculateTotalsFromEntries = (entries: IWoodEntry[]) => {
//     if (!entries || entries.length === 0) {
//         return { total: 0, hauled: 0, remaining: 0 };
//     }
//     const total = entries.reduce((sum, entry) => sum + (Number(entry.kuutiot) || 0), 0);
//     const hauled = entries.reduce((sum, entry) => sum + (Number(entry.haettu) || 0), 0);
//     const remaining = total - hauled;
    
//     return { total, hauled, remaining };
// };

// --- Inner Components ---

const MapView = ({ puulaanit, purkupaikat, activeTripLegs, onMarkerClick, currentLocation, focusedPuulaaniId, onFocusComplete, markerFilters, onFilterChangeAction }: {
    puulaanit: TripLegForMap[],
    purkupaikat: TripLegForMap[],
    activeTripLegs: TripLegForMap[],
    onMarkerClick: (id: number) => void,
    currentLocation: { lat: number; lng: number } | null,
    focusedPuulaaniId: number | null,
    onFocusComplete: () => void,
    markerFilters: { showPuulaanit: boolean; showPurkupaikat: boolean; },
    onFilterChangeAction: (filterName: 'showPuulaanit' | 'showPurkupaikat') => void,
}) => {
    return (<TripMap 
        legs={activeTripLegs} 
        puulaanit={puulaanit} 
        purkupaikat={purkupaikat} 
        driverLocation={currentLocation} 
        onMarkerClickAction={onMarkerClick as any} 
        focusedTripId={focusedPuulaaniId} 
        onFocusCompleteAction={onFocusComplete}
        markerFilters={markerFilters}
        onFilterChangeAction={onFilterChangeAction}
    />);
};

const ListView = ({ puulaanit, onPuulaaniClick }: { puulaanit: any[], onPuulaaniClick: (id: number) => void }) => {
     const { t } = useTranslation('timberDashboard'); 

    return (
        <Paper 
            elevation={0} 
            sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column', 
                backgroundColor: 'transparent' 
            }}
        >
            <Typography variant="h6" gutterBottom sx={{ p: 2, pb: 1, mt: 6, flexShrink: 0, fontWeight: 'bold' }}>
               {t('titles.timberSites', 'Timber Sites')}
            </Typography>
            
            <Box sx={{ flexGrow: 1, overflowY: 'auto', px: 1 }}>
                <Stack spacing={1.5} pb={2}> 
                    {puulaanit.map((p) => {
                        const statusColor = p.isCompleted ? 'info.main' : (p.isActive ? 'success.main' : 'text.disabled');
                        
                        return (
                            <Card 
                                key={p.id} 
                                elevation={2}
                                sx={{ 
                                    borderRadius: 2, 
                                    cursor: 'pointer',
                                    borderLeft: `6px solid`,
                                    borderLeftColor: statusColor,
                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                    '&:hover': { transform: 'translateY(-1px)', boxShadow: 1 }
                                }}
                                onClick={() => onPuulaaniClick(p.id)}
                            >
                                <CardActionArea>
                                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}> 
                                        <Stack spacing={0.5}>
                                            <Typography variant="subtitle1" sx={{lineHeight: 1 }}>
                                                {p.name}
                                            </Typography>

                                            <Stack 
                                                direction="row" 
                                                alignItems="center" 
                                                justifyContent="space-between" 
                                                flexWrap="wrap" 
                                                gap={1}
                                            >
                                                <Stack direction="row" spacing={0.5} alignItems="center" sx={{ minWidth: 0 }}>
                                                    <FactoryIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                                    <Typography variant="body2" color="text.secondary" noWrap>
                                                        {p.clientName || t('unknownClient', 'Unknown Client')}
                                                    </Typography>
                                                </Stack>

                                                <Stack direction="row" spacing={2} alignItems="center">
                                                    <Stack direction="row" spacing={0.5} alignItems="center">
                                                        <Inventory2Icon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                                        <Typography variant="caption" color="text.secondary">
                                                             {t('stats.total')}: <b>{p.totalVolume ? p.totalVolume.toFixed(2) : '0.00'}</b>
                                                        </Typography>
                                                    </Stack>

                                                    <Stack direction="row" spacing={0.5} alignItems="center">
                                                        <LocalShippingIcon sx={{ fontSize: 16, color: statusColor }} />
                                                        <Typography variant="caption" color={statusColor} fontWeight="bold">
                                                            {t('stats.rem')}: {p.remainingVolume ? p.remainingVolume.toFixed(2) : '0.00'}
                                                        </Typography>
                                                    </Stack>
                                                </Stack>
                                            </Stack>
                                        </Stack>
                                    </CardContent>
                                </CardActionArea>
                            </Card>
                        );
                    })}
                </Stack>
            </Box>
        </Paper>
    );
};

interface ActiveTripForDashboard {
    status: string;
    ajomaaraysNro: string | null;
    asiakkaanNimi: string;
    rekNro: string;
    legs: any[]; 
}

interface TimberDashboardProps { onBackAction: () => void; }

export default function TimberDashboard({ onBackAction }: TimberDashboardProps) {
    const { selectedVehicleId, setActiveTrip: setContextActiveTrip } = useDriverSession();
    const { user, token } = useAuth();
    const { enqueueSnackbar } = useSnackbar();
    const theme = useTheme();
    const { t } = useTranslation('timberDashboard');
    const socketRef = useRef<Socket | null>(null);
    const watchIdRef = useRef<number | null>(null);

    // State declarations
    const [view, setView] = useState<'map' | 'list'>('map');
    const [mapData, setMapData] = useState<DriverMapData | null>(null); // Initial map data load
    const [isLoading, setIsLoading] = useState(true); // Handled by useMapData now
    const [error, setError] = useState<string | null>(null); // Handled by useMapData now
    const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number; } | null>(null);
    const [selectedPuulaaniDetails, setSelectedPuulaaniDetails] = useState<PuulaaniDetails | null>(null);
    const [isPanelLoading, setIsPanelLoading] = useState(false);
    const [isCreateLoadModalOpen, setIsCreateLoadModalOpen] = useState(false);
    const [isSpeedDialOpen, setIsSpeedDialOpen] = useState(false);
    const [loadToEdit, setLoadToEdit] = useState<any | null>(null);
    const [loadToDelete, setLoadToDelete] = useState<any | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [activeTrip, setActiveTrip] = useState<ActiveTripForDashboard | null>(null); 
    const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const [isCompleteConfirmationOpen, setIsCompleteConfirmationOpen] = useState(false);
    const [isTripPanelVisible, setIsTripPanelVisible] = useState(true);
    const [focusedPuulaaniId, setFocusedPuulaaniId] = useState<number | null>(null);
    const [markerFilters, setMarkerFilters] = useState({ showPuulaanit: true, showPurkupaikat: true });
    const [isTripDetailsModalOpen, setIsTripDetailsModalOpen] = useState(false);
    const [recentlyModifiedPuulaaniId, setRecentlyModifiedPuulaaniId] = useState<number | null>(null);
    
    // Use the existing hook to fetch map data (Puulaanit, Purkupaikat)
    // We initialize filters with the vehicle ID to get relevant data
    const [filters] = useState<IMapFilterState>({
        status: 'active', // or 'all'
        clientId: null,
        vehicleId: selectedVehicleId ? String(selectedVehicleId) : null,
        markerTypes: ['puulaani', 'purkupaikka']
    });

    // Fetch data using the hook. This gives us 'clientList' needed for mapping.
    const { data, lists} = useMapData(filters);
    const { timberStacks, dropoffLocations } = data;
    const { clientList } = lists; // <--- HERE IS clientList

    const isDarkMode = theme.palette.mode === 'dark';
    const controlSurface = alpha(theme.palette.background.paper, isDarkMode ? 0.85 : 0.94);
    const controlBorder = alpha(theme.palette.divider, isDarkMode ? 0.6 : 0.28);
    const controlShadow = isDarkMode ? '0 12px 32px rgba(0,0,0,0.65)' : '0 16px 24px rgba(15,23,42,0.16)';

    const handleFilterChange = (filterName: 'showPuulaanit' | 'showPurkupaikat') => {
        setMarkerFilters(prev => ({ ...prev, [filterName]: !prev[filterName] }));
    };

    const fetchMapData = useCallback(() => {
        if (!selectedVehicleId) { 
            setError('No vehicle selected');
            setIsLoading(false); 
            return; 
        }
        setIsLoading(true);
        getDriverMapData(selectedVehicleId)
            .then(data => setMapData(data))
            .catch(() => setError('Failed to load map data'))
            .finally(() => setIsLoading(false));
    }, [selectedVehicleId]); 

    useEffect(() => { fetchMapData(); }, [fetchMapData]);
    // --- Unified useEffect for Geolocation and Socket.IO ---
    useEffect(() => {
        const startGpsWatcher = () => {
            if (watchIdRef.current !== null) {
                return;
            }
            if (!navigator.geolocation) {
                console.error("[GPS] Geolocation is not supported.");
                return;
            }

            const positionOptions: PositionOptions = {
                enableHighAccuracy: false,
                timeout: 20000,
                maximumAge: 10000 
            };
            
            watchIdRef.current = navigator.geolocation.watchPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setCurrentLocation({ lat: latitude, lng: longitude });

                    if (socketRef.current?.connected) {
                        socketRef.current.emit('updateLocation', { lat: latitude, lng: longitude });
                    }
                },
                (error) => {
                    console.error('[GPS] Watch position error:', { code: error.code, message: error.message });
                },
                positionOptions
            );
        };

        const stopGpsWatcher = () => {
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
                watchIdRef.current = null;
            }
        };
        
        // --- Socket Connection Lifecycle ---
        if (activeTrip && !socketRef.current) {
            if (!token || !selectedVehicleId) {
                return;
            }
            const socket = io(process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000', {
                auth: { token, vehicleId: selectedVehicleId }
            });
            socketRef.current = socket;

            socket.on('connect', () => {
                if (activeTrip.status !== 'Paused') {
                    startGpsWatcher();
                }
            });
            socket.on('disconnect', () => { });

        } else if (!activeTrip && socketRef.current) {
            stopGpsWatcher();
            socketRef.current.disconnect();
            socketRef.current = null;
        }

        if (activeTrip) {
            if (activeTrip.status === 'Paused') {
                stopGpsWatcher();
            } else {
                startGpsWatcher();
            }
        }
        
        return () => {
            if (socketRef.current) {
                stopGpsWatcher();
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };

    }, [activeTrip, token, selectedVehicleId, enqueueSnackbar]);

    const handleToggleTripDetails = () => {
        setIsTripDetailsModalOpen(prev => !prev);
    };

    const handleBackActionWithConfirmation = () => {
        if (activeTrip) {
            setIsConfirmationOpen(true);
        } else {
            onBackAction();
        }
    };
    
    const handleViewChange = (newView: 'map' | 'list') => {
        setSelectedPuulaaniDetails(null);
        setFocusedPuulaaniId(null);
        setView(newView);
    };

    const openDetailsPanel = useCallback(async (puulaaniId: number) => {
        if (puulaaniId < 0 || isPanelLoading) return;
        setIsTripPanelVisible(false);
        setIsPanelLoading(true);
        setSelectedPuulaaniDetails(null);
        try {
            const puulaaniData = await getTimberStackFullDetails(puulaaniId);
            setSelectedPuulaaniDetails(puulaaniData);
        } catch (err) {
            enqueueSnackbar(t('toasts.puulaaniLoadError'), { variant: 'error' });
        } finally {
            setIsPanelLoading(false);
        }
    }, [isPanelLoading, enqueueSnackbar, t]);

    const handleListItemClick = (id: number) => {
        setSelectedPuulaaniDetails(null);
        setFocusedPuulaaniId(id);
        setView('map');
    };

    const handleMapMarkerClick = (clickedId: number) => {
        if (selectedPuulaaniDetails?.puulaani.puulaaniId === clickedId) {
            setSelectedPuulaaniDetails(null);
            return;
        }
        openDetailsPanel(clickedId);
    };

    const handleFocusComplete = useCallback(() => {
        setFocusedPuulaaniId(null);
    }, []);
    
    const handleEditLoad = async (loadId: number) => {
        try {
            const loadData = await getLoadForEdit(loadId);
            setLoadToEdit(loadData);
            setIsCreateLoadModalOpen(true);
        } catch (err) {
            enqueueSnackbar(t('toasts.editLoadFetchError'), { variant: 'error' });
        }
    };
    
    const handleCreateOrUpdateLoad = async (data: any, isEdit: boolean) => {
        const puulaaniIdForHighlight = selectedPuulaaniDetails?.puulaani.puulaaniId;
        if (!user || typeof user.driverNumericId !== 'number' || !selectedVehicleId) {
            enqueueSnackbar(t('toasts.invalidSession'), { variant: 'error' }); 
            return;
        }
        const currentPuulaaniId = selectedPuulaaniDetails?.puulaani.puulaaniId;
        const driverId = user.driverNumericId;
        const vehicleId = Number(selectedVehicleId);
        const drivingOrderNo = activeTrip?.ajomaaraysNro || null; 

        if (isEdit) {
            try {
                const payload = {
                    vastaanottoNro: data.receptionNo, 
                    m3: Number(data.volume), 
                    km: Number(data.km),
                    reitti: data.route, 
                    lisatiedot: data.notes
                };
                await updateLoad(data.kuormaId, payload);
                enqueueSnackbar(t('toasts.loadUpdated'), { variant: 'success' });
            } catch (err: any) { 
                enqueueSnackbar(err.response?.data?.message || t('toasts.loadUpdateFailed'), { variant: 'error' }); 
            }
        } else {
            const legsToCreate: ICreateLoadDto[] = data.map((leg: any) => ({
                tyyppi: LoadTypeEnum.PUULAANI,
                asiakasId: Number(leg.taskDetails.asiakasId),
                pvm: new Date(),
                 ajomaaraysNro: drivingOrderNo,
                lisatiedot: leg.notes || null,
                kalustoNro: vehicleId,
                kuljId: driverId,
                puulaaniId: Number(leg.taskDetails.puulaaniId),
                puutavaraId: Number(leg.taskDetails.puutavaraId),
                lahto: selectedPuulaaniDetails?.puulaani.nimi,
                kohde: leg.taskDetails.purkupaikkaName,
                m3: Number(leg.volume),
                km: Number(leg.km) || 0,
                vastaanottoNro: leg.receptionNo || null,
            }));

            try {
                await createBulkLoad(legsToCreate);
                enqueueSnackbar(t('toasts.loadsCreated', { count: legsToCreate.length }), { variant: 'success' });
                
                if (puulaaniIdForHighlight) {
                    setRecentlyModifiedPuulaaniId(puulaaniIdForHighlight);
                    setTimeout(() => {
                        setRecentlyModifiedPuulaaniId(null);
                    }, 5000);
                }

            } catch (err: any) {
                enqueueSnackbar(err.response?.data?.message || t('toasts.genericError'), { variant: 'error' });
            }
        }
        
        setIsCreateLoadModalOpen(false);
        setLoadToEdit(null);
        
        try {
            const updatedTripData = await getActiveTripForDriver();
            if (updatedTripData && updatedTripData.legs.length > 0) {
                setActiveTrip(updatedTripData);
            }
        } catch (err) {
            console.error("Failed to refresh active trip after load operation:", err);
        }

        if (currentPuulaaniId) {
            openDetailsPanel(currentPuulaaniId); 
        }

        fetchMapData();
    };

    const handleSavePuulaani = async (updatedDetails: PuulaaniDetails) => {
        try {
            const payload = updatedDetails.timberEntries.map(e => ({
                puutavaraId: e.puutavaraId,
                valmis: e.valmis
            }));

            await updateTimberEntryStatus(updatedDetails.puulaani.puulaaniId, payload);
            enqueueSnackbar(t('toasts.statusesUpdated'), { variant: 'success' });
            fetchMapData();
            handleMapMarkerClick(updatedDetails.puulaani.puulaaniId);
            openDetailsPanel(updatedDetails.puulaani.puulaaniId);

        } catch (err: any) {
            enqueueSnackbar(err.response?.data?.message || t('toasts.saveFailed'), { variant: 'error' });
        }
    };

     const handleDeleteLoad = async () => {
        if (!loadToDelete) return;
        const parentPuulaaniId = selectedPuulaaniDetails?.puulaani.puulaaniId;

        setIsDeleting(true);
        try {
            await deleteLoad(loadToDelete.kuormaId);
            enqueueSnackbar(t('toasts.loadDeleted'), { variant: 'success' });
            setLoadToDelete(null);
            
            // --- FIX 1: Fetch the updated active trip data ---
            const updatedTripData = await getActiveTripForDriver();

            // 2. Update the main active trip state
            if (updatedTripData && updatedTripData.legs.length > 0) {
                setActiveTrip(updatedTripData);
                setContextActiveTrip(updatedTripData.ajomaaraysNro || String(updatedTripData.legs[0].kuormaId));
            } else {
                // If the trip is now empty (all loads deleted), clear the active trip state
                setActiveTrip(null);
                setContextActiveTrip(null);
            }
            
            // 3. If a parent puulaani was open, refresh its details panel.
            if (parentPuulaaniId) {
                console.log(`Load deleted. Refreshing details for Puulaani ID: ${parentPuulaaniId}`);
                await openDetailsPanel(parentPuulaaniId); // This ensures the Loads list is refreshed
            }
            
            // 4. Also refresh the main map data in the background.
            fetchMapData();

        } catch (err: any) {
            enqueueSnackbar(err.response?.data?.message || t('toasts.deleteFailed'), { variant: 'error' });
            setLoadToDelete(null); 
        } finally {
            setIsDeleting(false);
        }
    };

    useEffect(() => {
        const checkForActiveTrip = async () => {
            try {
                const tripData = await getActiveTripForDriver();
                if (tripData && tripData.legs.length > 0) {
                    setActiveTrip(tripData);
                    setContextActiveTrip(tripData.ajomaaraysNro || String(tripData.legs[0].kuormaId));
                }
            } catch (err) { 
                console.error("Failed to check for active trip", err); 
            }
        };
        checkForActiveTrip();
    }, [setContextActiveTrip]);

    const handleStartTrip = async (load: any) => {
        // load.ajomaaraysNro is NULL for the first load created without an existing active trip.
        // The loadService.createBulkLoad handles giving it a number on creation, but if 
        // the user is starting a trip from an ASSIGNED single load, it might still be null.
        if (!load.ajomaaraysNro) {
             enqueueSnackbar('Cannot start trip: Load data is missing a driving order number.', { variant: 'error' });
             return;
        }

        setIsUpdatingStatus(true);
        try {
            // --- FIX 1: Use updateTripStatus (which is designed for ajomaaraysNro) ---
            // This will change the status of ALL loads associated with this ajomaaraysNro.
            await updateTripStatus(load.ajomaaraysNro, { status: 'In Progress' });
            
            const tripData = await getActiveTripForDriver();
            if (tripData) {
                setActiveTrip(tripData);
                setContextActiveTrip(tripData.ajomaaraysNro || String(tripData.legs[0].kuormaId));
                setSelectedPuulaaniDetails(null);
                setIsTripPanelVisible(true);
                enqueueSnackbar(t('toasts.tripStarted'), { variant: 'success' });
            }
        } catch (err: any) {
            enqueueSnackbar(err.response?.data?.message || t('toasts.tripStartFailed'), { variant: 'error' });
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    const handleStatusUpdate = async (newStatus: string) => {
        if (!activeTrip || !activeTrip.ajomaaraysNro) {
            enqueueSnackbar('Active trip information is missing.', { variant: 'error' });
            return;
        }
        setIsCompleteConfirmationOpen(false);
        setIsUpdatingStatus(true);
        try {
            await updateTripStatus(activeTrip.ajomaaraysNro, { status: newStatus });
            const updatedTripData = await getActiveTripForDriver();

            if (newStatus === 'Completed' || !updatedTripData) {
                setActiveTrip(null);
                setContextActiveTrip(null);
                enqueueSnackbar(t('toasts.tripCompleted'), { variant: 'success' });
                fetchMapData();
            } else {
                setActiveTrip(updatedTripData);
                enqueueSnackbar(t('toasts.tripStatusUpdated', { status: newStatus }), { variant: 'info' });
            }
        } catch (err: any) {
            enqueueSnackbar(err.response?.data?.message || t('toasts.statusUpdateFailed'), { variant: 'error' });
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    // --- NEW HANDLER to open the confirmation dialog ---
    const handleCompleteTripRequest = () => {
        setIsCompleteConfirmationOpen(true);
    };

    const handleNewLoadRequest = (details: PuulaaniDetails) => {
        setSelectedPuulaaniDetails(details);
        setIsCreateLoadModalOpen(true);
    };


     const actions = [
        { icon: <ArrowBackIcon />, name: t('buttons.changeMode'), handler: onBackAction },
        { icon: view === 'map' ? <ListIcon /> : <MapIcon />, name: view === 'map' ? t('buttons.listView') : t('buttons.mapView'), handler: () => handleViewChange(view === 'map' ? 'list' : 'map') }
    ];

     const totalAssignedLoadsCount = useMemo(() => {
        if (!activeTrip || !activeTrip.legs) return 0;
        return activeTrip.legs.filter(leg => leg.status === 'Assigned').length;
    }, [activeTrip]);
    
    // --- FINAL FIX FOR FILTERING LOGIC & MAPPING ---
    const { finalPuulaanit, finalPurkupaikat, activeTripLegs } = useMemo(() => {
        const allPuulaanit = timberStacks || []; // Use timberStacks from useMapData
        const allPurkupaikat = dropoffLocations || []; // Use dropoffLocations from useMapData
        
        let legs: TripLegForMap[] = [];
        const activeTripPuulaaniIds = new Set<number>();
        const activeTripPurkupaikkaIds = new Set<number>();

        if (activeTrip && activeTrip.legs) {
            legs = activeTrip.legs.map((leg: any) => {
                if (leg.puulaaniId) activeTripPuulaaniIds.add(leg.puulaaniId);
                const purkupaikka = allPurkupaikat.find(p => p.name === leg.purkupaikkaName);
                if (purkupaikka) activeTripPurkupaikkaIds.add(purkupaikka.id);
                
                return {
                    kuormaId: leg.kuormaId,
                    originName: leg.puulaaniName,
                    originCoords: (leg.puulaaniLat && leg.puulaaniLng) ? { lat: Number(leg.puulaaniLat), lng: Number(leg.puulaaniLng) } : { lat: 0, lng: 0 },
                    destinationName: leg.purkupaikkaName,
                    destinationCoords: (leg.purkupaikkaLat && leg.purkupaikkaLng) ? { lat: Number(leg.purkupaikkaLat), lng: Number(leg.purkupaikkaLng) } : null,
                };
            }).filter((leg: any) => leg.originCoords.lat !== 0); 
        }

        const generalPuulaanit = allPuulaanit.filter(p => !activeTripPuulaaniIds.has(p.id));
        const generalPurkupaikat = allPurkupaikat.filter(p => !activeTripPurkupaikkaIds.has(p.id));
        
        // --- ENHANCED MAPPING FOR PUULAANI ---
        const mapPuulaaniToDisplay = (p: any): any => {
            const client = clientList.find(c => String(c.id) === String(p.clientId));
            
            let totalVolume = Number(p.totalVolume || 0);
            let remainingVolume = Number(p.remainingVolume || 0);

            const customerInfo = {
                id: String(p.clientId),
                name: client?.name || p.clientName || 'Unknown Client',
                clientId: String(p.clientId),
                clientName: client?.name || p.clientName || 'Unknown Client',
                targetColor: p.clientColor || p.color || '#808080'
            };

            return {
                id: p.id,
                kuormaId: p.id,
                name: p.name,
                clientName: customerInfo.name, // For List View
                
                // --- FIX: Add the 'customer' object for the Map View marker popup ---
                customer: customerInfo,

                totalVolume: totalVolume,
                remainingVolume: remainingVolume,
                originCoords: { lat: Number(p.latitude), lng: Number(p.longitude) },
                color: p.clientColor || p.color || customerInfo.targetColor, // Use the most appropriate color
                isActive: p.isActive,
                isCompleted: p.isCompleted
            };
        };

        const mapToTripLeg = (p: any): TripLegForMap => ({
            kuormaId: p.id,
            originName: p.name,
            originCoords: { lat: Number(p.latitude), lng: Number(p.longitude) },
            color: p.color
        });

        return { 
            // Apply the mapping function to the array
            finalPuulaanit: markerFilters.showPuulaanit ? generalPuulaanit.map(mapPuulaaniToDisplay) : [], 
            finalPurkupaikat: markerFilters.showPurkupaikat ? generalPurkupaikat.map(mapToTripLeg) : [],
            activeTripLegs: legs 
        };
    }, [timberStacks, dropoffLocations, activeTrip, markerFilters, clientList, t]); // Dependencies updated

    if (isLoading) { return <CircularProgress />; }
    if (error) { return <Alert severity="error">{error}</Alert>; }

    return (
        <Box sx={{ height: '100%', width: '100%', position: 'relative' }}>
             <Box sx={{ height: '100%', width: '100%', display: view === 'map' ? 'block' : 'none' }}>
                 <MapView
                    puulaanit={finalPuulaanit}
                    purkupaikat={finalPurkupaikat}
                    activeTripLegs={activeTripLegs}
                    onMarkerClick={handleMapMarkerClick}
                    currentLocation={currentLocation}
                    focusedPuulaaniId={recentlyModifiedPuulaaniId || focusedPuulaaniId}
                    onFocusComplete={handleFocusComplete}
                    markerFilters={markerFilters}
                    onFilterChangeAction={handleFilterChange}
                />
            </Box>
            <Box sx={{ height: '100%', display: view === 'list' ? 'block' : 'none' }}>
                <Box sx={{ pt: {xs: 8, sm: 10}, height: '100%', p: {xs: 1, sm: 2} }}>
                    <ListView 
                        puulaanit={finalPuulaanit} // Use finalPuulaanit here to get mapped data
                        onPuulaaniClick={handleListItemClick}
                    />
                </Box>
            </Box>

            
            {/* Desktop Controls */}
            <Paper 
                elevation={0} 
                sx={{ 
                    position: 'absolute', 
                    top: 16, 
                    left: 16, 
                    zIndex: 1000, 
                    p: 1, 
                    backgroundColor: controlSurface, 
                    backdropFilter: 'blur(10px)', 
                    borderRadius: 2, 
                    border: `1px solid ${controlBorder}`, 
                    boxShadow: controlShadow, 
                    display: { xs: 'none', sm: 'flex' } 
                }}
            >
                <Stack direction="row" spacing={1}>
                    <Button 
                        variant="outlined" 
                        size="small" 
                        startIcon={<ArrowBackIcon />} 
                        onClick={handleBackActionWithConfirmation}
                    >
                        {t('buttons.changeMode')}
                    </Button>
                    <Button 
                        variant="outlined" 
                        size="small" 
                        startIcon={view === 'map' ? <ListIcon /> : <MapIcon />} 
                        onClick={() => handleViewChange(view === 'map' ? 'list' : 'map')}
                    >
                        {view === 'map' ? t('buttons.listView') : t('buttons.mapView')}
                    </Button>
                    {activeTrip && !isTripPanelVisible && (
                        <Button 
                            variant="contained" 
                            size="small" 
                            color="primary" 
                            startIcon={<RestoreIcon />} 
                            onClick={() => setIsTripPanelVisible(true)}
                        >
                            {t('buttons.showActiveTrip')}
                        </Button>
                    )}
                </Stack>
            </Paper>
            
            {/* Puulaani Details Panel */}
            <PuulaaniDetailsPanel 
                details={selectedPuulaaniDetails} 
                isLoading={isPanelLoading} 
                onCloseAction={() => setSelectedPuulaaniDetails(null)} 
                onCreateLoadAction={handleNewLoadRequest} 
                onSaveAction={handleSavePuulaani} 
                onEditLoadAction={handleEditLoad} 
                onDeleteLoadAction={(load) => setLoadToDelete(load)} 
                onStartTripAction={handleStartTrip} 
                activeLoadId={activeTrip?.legs.find((leg: any) => leg.status !== 'Assigned')?.kuormaId || null}
                hasActiveTrip={!!activeTrip}
                isOffline={!navigator.onLine}
                totalAssignedLoadsCount={totalAssignedLoadsCount}
            />
            
            {/* Create Load Modal */}
            <CreateLoadModal 
                open={isCreateLoadModalOpen} 
                onCloseAction={() => { 
                    setIsCreateLoadModalOpen(false); 
                    setLoadToEdit(null); 
                }} 
                puulaaniDetails={selectedPuulaaniDetails} 
                onSubmitAction={handleCreateOrUpdateLoad} 
                initialLoadData={loadToEdit} 
            />
            
            {/* Active Trip Panel */}
            <ActiveTripPanel 
                activeTrip={activeTrip} 
                open={isTripPanelVisible} 
                onToggleVisibilityAction={() => setIsTripPanelVisible((prev) => !prev)} 
                onStatusUpdateAction={handleStatusUpdate} 
                isUpdating={isUpdatingStatus} 
                onConfirmCompleteAction={handleCompleteTripRequest}
                onOpenDetailsAction={handleToggleTripDetails}
            />
            
            {/* Delete Confirmation Dialog */}
            <ConfirmationDialog 
                open={!!loadToDelete} 
                onClose={() => setLoadToDelete(null)} 
                onConfirm={handleDeleteLoad} 
                title="Confirm Load Deletion" 
                message={`Are you sure you want to delete this load? (Timber: ${loadToDelete?.puutavaralaji || 'N/A'})`} 
                isConfirming={isDeleting} 
                confirmButtonText="Delete" 
                confirmButtonColor="error" 
            />
            
            {/* Back Action Confirmation */}
            <ConfirmationDialog
                open={isConfirmationOpen}
                onClose={() => setIsConfirmationOpen(false)}
                onConfirm={() => { 
                    setIsConfirmationOpen(false); 
                    onBackAction(); 
                }}
                title="Active Trip Warning"
                message="You have an active trip in progress. Changing mode will not stop the trip. Are you sure you want to proceed?"
                confirmButtonText="Yes, Proceed"
                confirmButtonColor="warning"
            />

           
            <ConfirmationDialog
                open={isCompleteConfirmationOpen}
                onClose={() => setIsCompleteConfirmationOpen(false)}
                // When confirmed, call the actual status update function
                onConfirm={() => handleStatusUpdate('Completed')}
                title={t('dialogs.complete.title', 'Confirm Trip Completion')}
                message={t('dialogs.complete.message', 'Are you sure you want to mark this entire trip as completed?')}
                isConfirming={isUpdatingStatus}
                confirmButtonText={t('dialogs.complete.confirm', 'Yes, Complete')}
                confirmButtonColor="success"
            />
            
             <ActiveTripDetailsModal
                open={isTripDetailsModalOpen}
                onCloseAction={handleToggleTripDetails}
                activeTrip={activeTrip}
            />
            
            
            {/* Mobile Speed Dial */}
            <SpeedDial
                ariaLabel="Actions" 
                sx={{ 
                    position: 'absolute', 
                    bottom: 16, 
                    right: 16, 
                    display: { xs: 'flex', sm: 'none' }, 
                    zIndex: 1200 
                }}
                icon={<SpeedDialIcon />} 
                onClose={() => setIsSpeedDialOpen(false)} 
                onOpen={() => setIsSpeedDialOpen(true)} 
                open={isSpeedDialOpen}
                hidden={!!selectedPuulaaniDetails || (!!activeTrip && isTripPanelVisible)}
            >
                {actions.map((action) => (
                    <SpeedDialAction 
                        key={action.name} 
                        icon={action.icon} 
                        tooltipTitle={action.name} 
                        onClick={() => { 
                            action.handler(); 
                            setIsSpeedDialOpen(false); 
                        }} 
                    />
                ))}
            </SpeedDial>
        </Box>
    );
}