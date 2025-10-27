// frontend/src/components/drivers/TimberDashboard.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Box, Paper, CircularProgress, Alert, Button, Stack, List, ListItemText, Divider, Typography, ListItemButton, SpeedDial, SpeedDialAction, SpeedDialIcon } from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import MapIcon from '@mui/icons-material/Map';
import ListIcon from '@mui/icons-material/List';
import RestoreIcon from '@mui/icons-material/Restore';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import dynamic from 'next/dynamic';
import { io, Socket } from 'socket.io-client';
import { LeafletMouseEvent } from 'leaflet';
import { useDriverSession } from '@/contexts/DriverSessionContext';
import { useAuth } from '@/contexts/AuthContext';
import { useSnackbar } from 'notistack';
import { useTranslation } from 'react-i18next';

// --- Types ---
import { TripMapProps, TripLegForMap } from '../loads/TripMap';
import { PuulaaniDetails, ICreateLoadDto, LoadTypeEnum } from '@/types';

// --- Services ---
import {  getDriverMapData, DriverMapData, getActiveTripForDriver, updateTimberEntryStatus } from '@/services/driverViewService';
import { getTimberStackFullDetails, updateTimberStackFull } from '@/services/timberStackService';
import { createLoad, deleteLoad, getLoadById, getLoadForEdit, updateLoad, updateLoadStatus } from '@/services/loadService';

// --- Child Components ---
const TripMap = dynamic<TripMapProps>(() => import('../loads/TripMap'), { ssr: false, loading: () => <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><CircularProgress /></Box> });
const PuulaaniDetailsPanel = dynamic(() => import('../loads/PuulaaniDetailsPanel'), { ssr: false });
const CreateLoadModal = dynamic(() => import('../loads/CreateLoadModal'), { ssr: false });
const ActiveTripPanel = dynamic(() => import('./ActiveTripPanel'), { ssr: false });
const ConfirmationDialog = dynamic(() => import('../common/ConfirmationDialog'), { ssr: false });

// --- Inner Components ---
const MapView = ({ puulaanit, purkupaikat, onMarkerClick, currentLocation }: {
    puulaanit: any[],
    purkupaikat: any[],
    onMarkerClick: (id: number, event: LeafletMouseEvent) => void,
    currentLocation: { lat: number; lng: number } | null
}) => {
    const puulaaniMarkers: TripLegForMap[] = useMemo(() => puulaanit.map(p => ({ kuormaId: p.id, originName: p.name, originCoords: { lat: Number(p.latitude), lng: Number(p.longitude) } })), [puulaanit]);
    const purkupaikkaMarkers: TripLegForMap[] = useMemo(() => purkupaikat.map(p => ({ kuormaId: p.id * -1, originName: p.name, originCoords: { lat: Number(p.latitude), lng: Number(p.longitude) } })), [purkupaikat]);

    return (<TripMap legs={[]} puulaanit={puulaaniMarkers} purkupaikat={purkupaikkaMarkers} driverLocation={currentLocation} onMarkerClickAction={onMarkerClick} {...{ focusedTripId: null, onFocusCompleteAction: () => { } }} />);
};

const ListView = ({ puulaanit, onPuulaaniClick }: { puulaanit: any[], onPuulaaniClick: (id: number) => void }) => (
    // Corrected layout for ListView
    <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h6" gutterBottom sx={{ p: 2, pb: 1, flexShrink: 0 }}>Timber Sites (Puulaanit)</Typography>
        <Divider />
        <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
            <List>{puulaanit.map((p, index) => (<React.Fragment key={p.id}><ListItemButton onClick={() => onPuulaaniClick(p.id)}><ListItemText primary={p.name} /></ListItemButton>{index < puulaanit.length - 1 && <Divider />}</React.Fragment>))}</List>
        </Box>
    </Paper>
);

interface TimberDashboardProps { onBackAction: () => void; }

export default function TimberDashboard({ onBackAction }: TimberDashboardProps) {
    const { selectedVehicleId, setActiveTrip } = useDriverSession();
    const { user, token } = useAuth();
    const { enqueueSnackbar } = useSnackbar();
    const theme = useTheme();
    const isDarkMode = theme.palette.mode === 'dark';
    const controlSurface = alpha(theme.palette.background.paper, isDarkMode ? 0.85 : 0.94);
    const controlBorder = alpha(theme.palette.divider, isDarkMode ? 0.6 : 0.28);
    const controlShadow = isDarkMode ? '0 12px 32px rgba(0,0,0,0.65)' : '0 16px 24px rgba(15,23,42,0.16)';
    
    const [view, setView] = useState<'map' | 'list'>('map');
    const [mapData, setMapData] = useState<DriverMapData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number; } | null>(null);
    const [selectedPuulaaniDetails, setSelectedPuulaaniDetails] = useState<PuulaaniDetails | null>(null);
    const [isPanelLoading, setIsPanelLoading] = useState(false);
    const [isCreateLoadModalOpen, setIsCreateLoadModalOpen] = useState(false);
    const [isSpeedDialOpen, setIsSpeedDialOpen] = useState(false);
    const [loadToEdit, setLoadToEdit] = useState<any | null>(null);
    const [loadToDelete, setLoadToDelete] = useState<any | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [activeLoad, setActiveLoad] = useState<any | null>(null);
    const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
    const [confirmationState, setConfirmationState] = useState({ title: '', message: '', onConfirm: () => {} });
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const [isTripPanelVisible, setIsTripPanelVisible] = useState(true);
    const { t } = useTranslation('timberDashboard');

    const socketRef = useRef<Socket | null>(null);
    const watchIdRef = useRef<number | null>(null);

    const fetchMapData = useCallback(() => {
        if (!selectedVehicleId) { setError(t('errors.noVehicle'));  setIsLoading(false); return; }
        setIsLoading(true);
        getDriverMapData(selectedVehicleId)
            .then(data => setMapData(data)).catch(() => setError(t('errors.mapLoad')))
            .finally(() => setIsLoading(false));
    }, [selectedVehicleId]);

    useEffect(() => { fetchMapData(); }, [fetchMapData]);

    // --- Unified useEffect for Geolocation and Socket.IO ---
    useEffect(() => {
        const startGpsWatcher = () => {
            if (watchIdRef.current !== null) {
                console.log("[GPS] Watcher is already running.");
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
                        console.log(`[GPS] Emitting location: ${latitude}, ${longitude}`);
                        socketRef.current.emit('updateLocation', { lat: latitude, lng: longitude });
                    }
                },
                (error) => {
                    console.error('[GPS] Watch position error:', { code: error.code, message: error.message });
                    enqueueSnackbar(`GPS Error: ${error.message}`, { variant: 'error' });
                },
                positionOptions
            );
            console.log("[GPS] Watcher started.");
        };

        const stopGpsWatcher = () => {
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
                watchIdRef.current = null;
                console.log('[GPS] Watcher stopped.');
            }
        };
        
        // --- Socket Connection Lifecycle ---
        if (activeLoad && !socketRef.current) {
            if (!token || !selectedVehicleId) {
                console.error("[Socket] Pre-condition failed: No token or selected vehicle.");
                return;
            }
            const socket = io(process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000', {
                auth: { token, vehicleId: selectedVehicleId }
            });
            socketRef.current = socket;
            console.log('[Socket] Connecting...');

            socket.on('connect', () => {
                console.log(`[Socket] Connected with ID: ${socket.id}`);
                if (activeLoad.status !== 'Paused') {
                    startGpsWatcher();
                }
            });
            socket.on('disconnect', () => { console.log('[Socket] Disconnected.'); });

        } else if (!activeLoad && socketRef.current) {
            stopGpsWatcher();
            socketRef.current.disconnect();
            socketRef.current = null;
            console.log('[Socket] Disconnecting due to trip completion.');
        }

        // --- GPS Watcher Lifecycle based on PAUSE/RESUME ---
        if (activeLoad) {
            if (activeLoad.status === 'Paused') {
                stopGpsWatcher();
            } else { // 'In Progress' or other active statuses
                startGpsWatcher();
            }
        }
        
        // --- Cleanup on component unmount ---
        return () => {
            if (socketRef.current) {
                stopGpsWatcher();
                socketRef.current.disconnect();
                socketRef.current = null;
                console.log('[Socket] Disconnected on component unmount.');
            }
        };

    }, [activeLoad, token, selectedVehicleId, enqueueSnackbar]);


    const handleViewChange = (newView: 'map' | 'list') => {
        setSelectedPuulaaniDetails(null);
        setView(newView);
    };

    const handleMarkerClick = useCallback(async (puulaaniId: number) => {
        if (puulaaniId < 0) return;
        setIsTripPanelVisible(false);
        setIsPanelLoading(true);
        setSelectedPuulaaniDetails(null);
        try {
            const puulaaniData = await getTimberStackFullDetails(puulaaniId);
            setSelectedPuulaaniDetails(puulaaniData);
        } catch (err) { enqueueSnackbar(t('toasts.puulaaniLoadError'), { variant: 'error' }); }
        finally { setIsPanelLoading(false); }
    }, [enqueueSnackbar]);
    

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
        if (!user || typeof user.driverNumericId !== 'number' || !selectedVehicleId) {
            enqueueSnackbar(t('toasts.invalidSession'), { variant: 'error' }); return;
        }
        const driverId = user.driverNumericId;
        const vehicleId = Number(selectedVehicleId);

        if (isEdit) {
            try {
                const payload = {
                    vastaanottoNro: data.receptionNo, m3: Number(data.volume), km: Number(data.km),
                    reitti: data.route, lisatiedot: data.notes
                };
                await updateLoad(data.kuormaId, payload);
                enqueueSnackbar(t('toasts.loadUpdated'), { variant: 'success' });
            } catch (err: any) { enqueueSnackbar(err.response?.data?.message || t('toasts.loadUpdateFailed'), { variant: 'error' }); }
        } else {
            const legPromises = data.map((leg: any) => {
                const payload: ICreateLoadDto = {
                    tyyppi: LoadTypeEnum.PUULAANI, asiakasId: Number(leg.taskDetails.asiakasId), pvm: new Date(),
                    ajomaaraysNro: null, lisatiedot: leg.notes || null, kalustoNro: vehicleId, kuljId: driverId,
                    puulaaniId: Number(leg.taskDetails.puulaaniId), puutavaraId: Number(leg.taskDetails.puutavaraId),
                    lahto: selectedPuulaaniDetails?.puulaani.nimi, kohde: leg.taskDetails.purkupaikkaName,
                    m3: Number(leg.volume), km: Number(leg.km) || 0, vastaanottoNro: leg.receptionNo || null,
                };
                return createLoad(payload);
            });
            try {
                await Promise.all(legPromises);
                enqueueSnackbar(t('toasts.loadsCreated'), { variant: 'success' });
            } catch (err: any) { enqueueSnackbar(err.response?.data?.message || t('toasts.genericError'), { variant: 'error' }); }
        }
        setIsCreateLoadModalOpen(false);
        setLoadToEdit(null);
        if (selectedPuulaaniDetails) { handleMarkerClick(selectedPuulaaniDetails.puulaani.puulaaniId); }
        fetchMapData();
    };

    const handleSavePuulaani = async (updatedDetails: PuulaaniDetails) => {
        try {

            // Create a payload that only contains the information needed to update statuses.
            const payload = updatedDetails.timberEntries.map(e => ({
                puutavaraId: e.puutavaraId,
                valmis: e.valmis
            }));

            // Call the new, dedicated service function for drivers
            await updateTimberEntryStatus(updatedDetails.puulaani.puulaaniId, payload);

            enqueueSnackbar(t('toasts.statusesUpdated'), { variant: 'success' });

            // Refresh the panel data to confirm changes from the server
            handleMarkerClick(updatedDetails.puulaani.puulaaniId);

        } catch (err: any) {
            enqueueSnackbar(err.response?.data?.message || t('toasts.saveFailed'), { variant: 'error' });
        }
    };

    const handleDeleteLoad = async () => {
        if (!loadToDelete) return;
        setIsDeleting(true);
        try {
            await deleteLoad(loadToDelete.kuormaId);
            enqueueSnackbar(t('toasts.loadDeleted'), { variant: 'success' });
            setLoadToDelete(null);
            if (selectedPuulaaniDetails) {
                handleMarkerClick(selectedPuulaaniDetails.puulaani.puulaaniId);
            }
        } catch (err: any) {
            enqueueSnackbar(err.response?.data?.message || t('toasts.deleteFailed'), { variant: 'error' });
        } finally {
            setIsDeleting(false);
        }
    };

     useEffect(() => {
        const checkForActiveTrip = async () => {
            try {
                const trip = await getActiveTripForDriver();
                if (trip) {
                    const detailsForPanel = {
                        puulaaniName: trip.puulaaniName,
                        puulaaniLat: trip.puulaaniLat,
                        puulaaniLng: trip.puulaaniLng,
                        purkupaikkaName: trip.purkupaikkaName,
                        purkupaikkaLat: trip.purkupaikkaLat,
                        purkupaikkaLng: trip.purkupaikkaLng,
                        puutavaralaji: trip.puutavaralaji
                    };
                    setActiveLoad({ ...trip, details: detailsForPanel });
                    setActiveTrip(String(trip.kuormaId));
                }
            } catch (err) {
                console.error("Failed to check for active trip", err);
            }
        };
        checkForActiveTrip();
    }, [setActiveTrip]);

    const handleStartTrip = async (load: any) => {
        if (!selectedPuulaaniDetails) return;
        setIsUpdatingStatus(true);
        try {
            const updatedLoad = await updateLoadStatus(load.kuormaId, { status: 'In Progress' });
            const timberEntry = selectedPuulaaniDetails.timberEntries.find(e => e.puutavaraId === load.puutavaraId);
            const detailsForPanel = {
                puulaaniName: selectedPuulaaniDetails.puulaani.nimi,
                puulaaniLat: selectedPuulaaniDetails.puulaani.sijaintiLat,
                puulaaniLng: selectedPuulaaniDetails.puulaani.sijaintiLong,
                purkupaikkaName: timberEntry?.purkupaikkaName,
                purkupaikkaLat: timberEntry?.purkupaikkaLat,
                purkupaikkaLng: timberEntry?.purkupaikkaLng,
                puutavaralaji: load.puutavaralaji
            };
            setActiveLoad({ ...updatedLoad, details: detailsForPanel });
            setActiveTrip(String(updatedLoad.kuormaId));
            setSelectedPuulaaniDetails(null);
            setIsTripPanelVisible(true);
            enqueueSnackbar(t('toasts.tripStarted'), { variant: 'success' });
        } catch (err: any) {
            enqueueSnackbar(err.response?.data?.message || t('toasts.tripStartFailed'), { variant: 'error' });
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    const handleStatusUpdate = async (newStatus: string) => {
        if (!activeLoad) return;
        setIsUpdatingStatus(true);
        try {
            const updatedLoad = await updateLoadStatus(activeLoad.kuormaId, { status: newStatus });
            if (newStatus === 'Completed') {
                setActiveLoad(null);
                setActiveTrip(null);
                enqueueSnackbar(t('toasts.tripCompleted'), { variant: 'success' });
                fetchMapData();
            } else {
                // --- THIS IS THE FIX ---
                // Explicitly define the type of the 'prev' parameter
                setActiveLoad((prev: any) => ({ ...prev, ...updatedLoad }));
                enqueueSnackbar(t('toasts.tripStatusUpdated', { status: newStatus }), { variant: 'info' });
            }
        } catch (err: any) {
            enqueueSnackbar(err.response?.data?.message || t('toasts.statusUpdateFailed'), { variant: 'error' });
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    const handleBackActionWithConfirmation = () => {
        if (activeLoad) {
            setIsConfirmationOpen(true);
        } else {
            onBackAction();
        }
    };

    const handleNewLoadRequest = (details: PuulaaniDetails) => {
        // --- THIS IS THE FIX ---
        // Check if a trip is already active
        if (activeLoad) {
            // If active, show a warning instead of opening the create modal
            enqueueSnackbar("Please complete or cancel the current active trip before starting a new one.", { variant: 'warning' });
        } else {
            setSelectedPuulaaniDetails(details);
            setIsCreateLoadModalOpen(true);
        }
    };



    // --- FIX: 'actions' variable was declared twice ---
    const speedDialActions = [
        { icon: <ArrowBackIcon />, name: 'Change Mode', handler: onBackAction },
        { icon: view === 'map' ? <ListIcon /> : <MapIcon />, name: view === 'map' ? 'Show List' : 'Show Map', handler: () => handleViewChange(view === 'map' ? 'list' : 'map') },
    ];

    const actions = [
        { icon: <ArrowBackIcon />, name: 'Change Mode', handler: onBackAction },
        { icon: view === 'map' ? <ListIcon /> : <MapIcon />, name: view === 'map' ? 'Show List' : 'Show Map', handler: () => handleViewChange(view === 'map' ? 'list' : 'map') }
    ];

    if (isLoading) { return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><CircularProgress /></Box>; }
    if (error) { return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>; }

    return (
        <Box sx={{ height: '100%', width: '100%', position: 'relative' }}>
        
            {/* The Map and List views will now take up the entire screen space */}
            <Box sx={{ height: '100%', width: '100%', display: view === 'map' ? 'block' : 'none' }}>
                <MapView
                    puulaanit={mapData?.puulaanit || []}
                    purkupaikat={mapData?.purkupaikat || []}
                    onMarkerClick={(id) => handleMarkerClick(id)}
                    currentLocation={currentLocation}
                />
            </Box>

            <Box sx={{ height: '100%', display: view === 'list' ? 'block' : 'none' }}>
                {/* Add padding to the top of the list view to avoid being covered by the floating controls */}
                <Box sx={{ pt: {xs: 8, sm: 10}, height: '100%', p: {xs: 1, sm: 2} }}>
                    <ListView 
                        puulaanit={mapData?.puulaanit || []}
                        onPuulaaniClick={(id) => {
                            handleMarkerClick(id);
                            setView('map');
                        }}
                    />
                </Box>
            </Box>

            {/* --- THIS IS THE FIX: Part 2 - Render floating controls on top --- */}

            {/* Floating Control Panel for Desktop */}
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
                    <Button variant="outlined" size="small" startIcon={<ArrowBackIcon />} onClick={handleBackActionWithConfirmation}>{t('buttons.changeMode')}</Button>
                    <Button variant="outlined" size="small" startIcon={view === 'map' ? <ListIcon /> : <MapIcon />} onClick={() => handleViewChange(view === 'map' ? 'list' : 'map')}>
                        {view === 'map' ? t('buttons.listView') : t('buttons.mapView')}
                    </Button>
                    {activeLoad && !isTripPanelVisible && (
                        <Button variant="contained" size="small" color="primary" startIcon={<RestoreIcon />} onClick={() => setIsTripPanelVisible(true)}>
                            {t('buttons.showActiveTrip')}
                        </Button>
                    )}
                </Stack>
            </Paper>

            {/* All other floating components */}
            <PuulaaniDetailsPanel 
                details={selectedPuulaaniDetails} 
                isLoading={isPanelLoading} 
                onCloseAction={() => setSelectedPuulaaniDetails(null)} 
                 onCreateLoadAction={handleNewLoadRequest} 
                onSaveAction={handleSavePuulaani} 
                onEditLoadAction={handleEditLoad} 
                onDeleteLoadAction={(load) => setLoadToDelete(load)} 
                onStartTripAction={handleStartTrip} 
                activeLoadId={activeLoad?.kuormaId || null}
                hasActiveTrip={!!activeLoad}
                isOffline={!navigator.onLine}
            />
            <CreateLoadModal open={isCreateLoadModalOpen} onCloseAction={() => { setIsCreateLoadModalOpen(false); setLoadToEdit(null); }} puulaaniDetails={selectedPuulaaniDetails} onSubmitAction={handleCreateOrUpdateLoad} initialLoadData={loadToEdit} />
            <ActiveTripPanel activeLoad={activeLoad} open={isTripPanelVisible} onToggleVisibilityAction={() => setIsTripPanelVisible((prev) => !prev)} onStatusUpdateAction={handleStatusUpdate} isUpdating={isUpdatingStatus} />
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

            {/* SpeedDial for Mobile (already a floating component) */}
            <SpeedDial
                ariaLabel="Actions" sx={{ position: 'absolute', bottom: 16, right: 16, display: { xs: 'flex', sm: 'none' }, zIndex: 1200 }}
                icon={<SpeedDialIcon />} onClose={() => setIsSpeedDialOpen(false)} onOpen={() => setIsSpeedDialOpen(true)} open={isSpeedDialOpen}
                hidden={!!selectedPuulaaniDetails || (!!activeLoad && isTripPanelVisible)}
            >
                {actions.map((action) => (<SpeedDialAction key={action.name} icon={action.icon} tooltipTitle={action.name} onClick={() => { action.handler(); setIsSpeedDialOpen(false); }} />))}
            </SpeedDial>
        </Box>
    );
}
