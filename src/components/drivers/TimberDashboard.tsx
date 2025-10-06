// frontend/src/components/drivers/TimberDashboard.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Box, Paper, CircularProgress, Alert, Fab, List, ListItemText, Divider, Typography, Button, Stack, ListItemButton, SpeedDial, SpeedDialAction, SpeedDialIcon } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import MapIcon from '@mui/icons-material/Map';
import ListIcon from '@mui/icons-material/List';
import dynamic from 'next/dynamic';
import { useDriverSession } from '@/contexts/DriverSessionContext';
import { LeafletMouseEvent } from 'leaflet';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useAuth } from '@/contexts/AuthContext';
import { useSnackbar } from 'notistack';

// --- Types ---
import { TripMapProps, TripLegForMap } from '../loads/TripMap';
import { PuulaaniDetails, ICreateLoadDto, LoadTypeEnum } from '@/types';

// --- Services ---
import { getDriverMapData, DriverMapData } from '@/services/driverViewService';
import { getTimberStackFullDetails, updateTimberStackFull } from '@/services/timberStackService';
import { createLoad, getLoadById, updateLoad } from '@/services/loadService'; // <-- Import getLoadById and updateLoad
import { getLoadForEdit } from '@/services/loadService';

// --- Child Components ---
const TripMap = dynamic<TripMapProps>(() => import('../loads/TripMap'), { ssr: false, loading: () => <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><CircularProgress /></Box> });
const PuulaaniDetailsPanel = dynamic(() => import('../loads/PuulaaniDetailsPanel'), { ssr: false });
const CreateLoadModal = dynamic(() => import('../loads/CreateLoadModal'), { ssr: false });

// --- Inner Components ---
const MapView = ({ puulaanit, purkupaikat, onMarkerClick, currentLocation }: { puulaanit: any[], purkupaikat: any[], onMarkerClick: (id: number, event: LeafletMouseEvent) => void, currentLocation: { lat: number; lng: number } | null }) => {
    const puulaaniMarkers: TripLegForMap[] = useMemo(() => puulaanit.map(p => ({ kuormaId: p.id, originName: p.name, originCoords: { lat: Number(p.latitude), lng: Number(p.longitude) }})), [puulaanit]);
    const purkupaikkaMarkers: TripLegForMap[] = useMemo(() => purkupaikat.map(p => ({ kuormaId: p.id * -1, originName: p.name, originCoords: { lat: Number(p.latitude), lng: Number(p.longitude) }})), [purkupaikat]);
    return (<TripMap legs={[]} puulaanit={puulaaniMarkers} purkupaikat={purkupaikkaMarkers} driverLocation={currentLocation} onMarkerClickAction={onMarkerClick} {...{focusedTripId: null, onFocusCompleteAction: ()=>{}}}/>);
};

const ListView = ({ puulaanit, onPuulaaniClick }: { puulaanit: any[], onPuulaaniClick: (id: number) => void }) => (
    <Box sx={{ p: 2, height: '100%' }}>
        <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" gutterBottom>Timber Sites (Puulaanit)</Typography>
            <Box sx={{flexGrow: 1, overflowY: 'auto'}}>
                <List>{puulaanit.map((p, index) => (<React.Fragment key={p.id}><ListItemButton onClick={() => onPuulaaniClick(p.id)}><ListItemText primary={p.name} /></ListItemButton>{index < puulaanit.length - 1 && <Divider />}</React.Fragment>))}</List>
            </Box>
        </Paper>
    </Box>
);

interface TimberDashboardProps {
    onBackAction: () => void;
}

export default function TimberDashboard({ onBackAction }: TimberDashboardProps) {
    const { selectedVehicleId } = useDriverSession();
    const { user } = useAuth();
    const { enqueueSnackbar } = useSnackbar();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
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
    

    const fetchMapData = useCallback(() => {
        if (!selectedVehicleId) { setError("No vehicle selected."); setIsLoading(false); return; }
        setIsLoading(true);
        getDriverMapData(selectedVehicleId)
            .then(data => setMapData(data)).catch(() => setError("Failed to load map data."))
            .finally(() => setIsLoading(false));
    }, [selectedVehicleId]);

    useEffect(() => { fetchMapData(); }, [fetchMapData]);
    useEffect(() => {
        let watchId: number | null = null;
        if (navigator.geolocation) {
            watchId = navigator.geolocation.watchPosition((p) => setCurrentLocation({ lat: p.coords.latitude, lng: p.coords.longitude }), (e) => console.error("Geolocation Error:", e), { enableHighAccuracy: true });
        }
        return () => { if (watchId) navigator.geolocation.clearWatch(watchId); };
    }, []);

    const handleMarkerClick = useCallback(async (puulaaniId: number) => {
        if (puulaaniId < 0) return;
        setIsPanelLoading(true); setSelectedPuulaaniDetails(null);
        try {
            const puulaaniData = await getTimberStackFullDetails(puulaaniId);
            setSelectedPuulaaniDetails(puulaaniData);
        } catch (err) { enqueueSnackbar("Failed to load Puulaani details.", { variant: 'error' }); } 
        finally { setIsPanelLoading(false); }
    }, [enqueueSnackbar]);
    
     const handleEditLoad = async (loadId: number) => {
        try {
            const loadData = await getLoadForEdit(loadId);
            setLoadToEdit(loadData);
            setIsCreateLoadModalOpen(true); // Open the modal in edit mode
        } catch (err) {
            enqueueSnackbar("Failed to fetch load details for editing.", { variant: 'error' });
        }
    };


    // --- FIX: Define the handleCreateOrUpdateLoad function ---
    const handleCreateOrUpdateLoad = async (data: any, isEdit: boolean) => {
        if (!user || typeof user.driverNumericId !== 'number' || !selectedVehicleId) {
            enqueueSnackbar("User or vehicle session is invalid.", { variant: 'error' });
            return;
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
                enqueueSnackbar('Load updated successfully!', { variant: 'success' });
            } catch (err: any) {
                enqueueSnackbar(err.response?.data?.message || "Failed to update load.", { variant: 'error' });
            }
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
                enqueueSnackbar('Load(s) created successfully!', { variant: 'success' });
            } catch (err: any) {
                enqueueSnackbar(err.response?.data?.message || "An error occurred.", { variant: 'error' });
            }
        }
        setIsCreateLoadModalOpen(false);
        setLoadToEdit(null);
        if (selectedPuulaaniDetails) {
            handleMarkerClick(selectedPuulaaniDetails.puulaani.puulaaniId);
        }
        fetchMapData();
    };
    const handleSavePuulaani = async (updatedDetails: PuulaaniDetails) => {
        try {
            // --- THIS IS THE FIX ---
            // Create a payload that strictly matches the backend DTO (IUpdateTimberStackFullDto)
            // by converting all necessary string values to numbers.
            const payload = {
                puulaani: {
                    // Spread all properties from the updated puulaani object
                    ...updatedDetails.puulaani,
                    
                    // Explicitly convert string numbers to actual numbers
                    pvm: new Date(updatedDetails.puulaani.pvm),
                    kok: Number(updatedDetails.puulaani.kok),
                    jaljella: Number(updatedDetails.puulaani.jaljella),
                    km: Number(updatedDetails.puulaani.km) || null, // Handle null case
                    sijaintiLat: Number(updatedDetails.puulaani.sijaintiLat) || null,
                    sijaintiLong: Number(updatedDetails.puulaani.sijaintiLong) || null,
                },
                autot: updatedDetails.autot,
                puutavarat: updatedDetails.timberEntries.map(e => ({
                    puutavara_id: e.puutavaraId,
                    puutavaranro: e.puutavaraNro,
                    purkupaikka_id: e.purkupaikkaId,
                    kuutiot: Number(e.kuutiot),
                    haettu: Number(e.haettu),
                    valmis: e.valmis 
                })),
            };
            
            await updateTimberStackFull(updatedDetails.puulaani.puulaaniId, payload);
            enqueueSnackbar('Puulaani details saved!', { variant: 'success' });
            handleMarkerClick(updatedDetails.puulaani.puulaaniId);

        } catch(err: any) {
            enqueueSnackbar(err.response?.data?.message || err.message || 'Failed to save changes.', { variant: 'error' });
        }
    };
    
     const actions = [
        { icon: <ArrowBackIcon />, name: 'Change Mode', handler: onBackAction },
        { icon: view === 'map' ? <ListIcon /> : <MapIcon />, name: view === 'map' ? 'Show List' : 'Show Map', handler: () => setView(view === 'map' ? 'list' : 'map') },
    ];

    const handleViewChange = (newView: 'map' | 'list') => {
        // --- THIS IS THE FIX ---
        // Before changing the view, always close any open detail panels.
        setSelectedPuulaaniDetails(null);
        setView(newView);
    };

    if (isLoading) { return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><CircularProgress /></Box>; }
    if (error) { return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>; }

    return (
        <Box sx={{ height: '100%', width: '100%', position: 'relative' }}>
            {view === 'map' ? (
                <MapView puulaanit={mapData?.puulaanit || []} purkupaikat={mapData?.purkupaikat || []} onMarkerClick={(id) => handleMarkerClick(id)} currentLocation={currentLocation} />
            ) : (
                <Box sx={{ pt: {xs: 1, sm: 8}, height: '100%' }}><ListView puulaanit={mapData?.puulaanit || []} onPuulaaniClick={(id) => { handleMarkerClick(id); setView('map'); }}/></Box>
            )}

             <PuulaaniDetailsPanel 
                details={selectedPuulaaniDetails} 
                isLoading={isPanelLoading} 
                onCloseAction={() => setSelectedPuulaaniDetails(null)} 
                onCreateLoadAction={(details) => {
                    setSelectedPuulaaniDetails(details);
                    setIsCreateLoadModalOpen(true);
                }} 
                onSaveAction={handleSavePuulaani}
                onEditLoadAction={handleEditLoad} // This is now correctly passed
            />
            
            <CreateLoadModal 
                open={isCreateLoadModalOpen} 
                onCloseAction={() => { setIsCreateLoadModalOpen(false); setLoadToEdit(null); }} 
                puulaaniDetails={selectedPuulaaniDetails} 
                onSubmitAction={handleCreateOrUpdateLoad} 
                initialLoadData={loadToEdit}
            />

            <Paper elevation={4} sx={{ position: 'absolute', top: 16, left: 16, zIndex: 1000, p: 1, backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: 2, display: { xs: 'none', sm: 'flex' } }}>
                <Stack direction="row" spacing={1}>
                    <Button variant="outlined" size="small" startIcon={<ArrowBackIcon />} onClick={onBackAction}>Change Mode</Button>
                    <Button variant="outlined" size="small" startIcon={view === 'map' ? <ListIcon /> : <MapIcon />} onClick={() => handleViewChange(view === 'map' ? 'list' : 'map')}>
                            {view === 'map' ? 'List View' : 'Map View'}
                        </Button>
                </Stack>
            </Paper>

            <SpeedDial
                ariaLabel="Actions"
                sx={{ position: 'absolute', bottom: 16, right: 16, display: { xs: 'flex', sm: 'none' } }}
                icon={<SpeedDialIcon />}
                onClose={() => setIsSpeedDialOpen(false)} onOpen={() => setIsSpeedDialOpen(true)} open={isSpeedDialOpen}
                hidden={!!selectedPuulaaniDetails}
            >
                {actions.map((action) => (<SpeedDialAction key={action.name} icon={action.icon} tooltipTitle={action.name} onClick={() => { action.handler(); setIsSpeedDialOpen(false); }}/>))}
            </SpeedDial>
        </Box>
    );
}