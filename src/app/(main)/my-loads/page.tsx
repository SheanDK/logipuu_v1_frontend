// frontend/src/app/(main)/my-loads/page.tsx

'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import {
    Box,
    Button,
    CircularProgress,
    Alert,
    Paper,
    Snackbar,
    IconButton,
    Stack
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ListIcon from '@mui/icons-material/List';

import { ILoadListItem, ITripDetails } from '../../../types';
import { fetchMyLoads, getTripById } from '../../../services/loadService';
import { TripLegForMap, TripMapProps } from '../../../components/loads/TripMap';
import { TripLeg } from '../../../components/loads/TripCreatorPanel';

// --- DYNAMIC IMPORTS ---
// Dynamically import components that are not needed for the initial server-side render.
// This improves initial page load performance.
const TripMap = dynamic<TripMapProps>(() => import('../../../components/loads/TripMap'), {
    ssr: false,
    loading: () => <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><CircularProgress /></Box>
});
const TripCreatorPanel = dynamic(() => import('../../../components/loads/TripCreatorPanel'), { ssr: false });
const ActiveTripsSheet = dynamic(() => import('../../../components/loads/ActiveTripsSheet'), { ssr: false });
const TripDetailsPanel = dynamic(() => import('../../../components/loads/TripDetailsPanel'), { ssr: false });


/**
 * The main map-centric dashboard for the driver. This page serves as the central hub
 * for viewing active trips, creating new trips, and managing trip details.
 */
export default function DriverMapDashboard() {
    // --- STATE MANAGEMENT ---

    // Data states
    const [activeTrips, setActiveTrips] = useState<ILoadListItem[]>([]);
    const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [previewMarkers, setPreviewMarkers] = useState<TripLegForMap[]>([]);

    // UI Control States
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);

    // Panel & Sheet Visibility States
    const [isCreatorPanelOpen, setIsCreatorPanelOpen] = useState(false);
    const [isTripSheetOpen, setIsTripSheetOpen] = useState(false);
    const [isDetailsPanelOpen, setIsDetailsPanelOpen] = useState(false);

    // Contextual States for Panels
    const [focusedTripId, setFocusedTripId] = useState<number | null>(null);
    const [selectedTripIdForView, setSelectedTripIdForView] = useState<number | null>(null);
    const [tripDataForEdit, setTripDataForEdit] = useState<ITripDetails | null>(null);


    // --- DATA FETCHING ---

    const loadData = useCallback(async () => {
        // Only show the main loader on the very first fetch.
        if (activeTrips.length === 0) setIsLoading(true);
        setError(null);
        try {
            const data = await fetchMyLoads();
            setActiveTrips(data);
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to fetch active trips.");
        } finally {
            setIsLoading(false);
        }
    }, [activeTrips.length]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    useEffect(() => {
        let watchId: number | null = null;
        if (navigator.geolocation) {
            watchId = navigator.geolocation.watchPosition(
                (position) => setCurrentLocation({ lat: position.coords.latitude, lng: position.coords.longitude }),
                (err) => console.error("Geolocation error:", err),
                { enableHighAccuracy: true }
            );
        }
        return () => { if (watchId) navigator.geolocation.clearWatch(watchId); };
    }, []);


    // --- MEMOIZED COMPUTATIONS ---

    const mapMarkers = useMemo((): TripLegForMap[] =>
        activeTrips
            .filter(trip => trip.originLat && trip.originLng)
            .map(trip => ({
                kuormaId: trip.kuormaId,
                originName: trip.lahto || 'Unknown Origin',
                originCoords: { lat: trip.originLat!, lng: trip.originLng! }
            })),
        [activeTrips]
    );


    // --- HANDLERS ---
    // Wrapped in useCallback to prevent re-creation on re-renders, breaking child component memoization.

    const handleMapFocus = useCallback((tripId: number | null) => {
        setFocusedTripId(tripId);
        setIsTripSheetOpen(false);
    }, []);

    const handleFocusCompleteAction = useCallback(() => {
        setFocusedTripId(null);
    }, []);

    const handleViewDetails = useCallback((tripId: number | null) => {
        setSelectedTripIdForView(tripId);
        setIsDetailsPanelOpen(true);
        setIsTripSheetOpen(false);
    }, []);

     const handleEditTrip = useCallback(async (tripId: number) => {
        // 1. Close the list sheet
        setIsTripSheetOpen(false);
        setIsLoading(true); // Show a loading indicator
        setError(null);

        try {
            // 2. Fetch the FULL trip details using the provided ID
            const tripDetailsToEdit = await getTripById(tripId);

            if (tripDetailsToEdit) {
                // 3. Set the fetched data into state
                setTripDataForEdit(tripDetailsToEdit);
                // 4. Open the creator panel in edit mode
                setIsCreatorPanelOpen(true);
            } else {
                setError("Could not find the trip details to edit.");
            }
        } catch (err) {
            setError("Failed to fetch trip details for editing.");
        } finally {
            setIsLoading(false); // Hide loading indicator
        }
    }, []);

     const handleLegsChange = useCallback((legs: TripLeg[]) => {
        const markers = legs
            .filter(leg => leg.originCoords || leg.destinationCoords)
            .map((leg, index) => ({
                // Using a temporary negative ID to avoid conflicts with real trip IDs
                kuormaId: -(index + 1), 
                originName: leg.lahto || leg.puulaaniName || 'Pickup',
                originCoords: leg.originCoords!,
                destinationName: leg.kohde || leg.purkupaikkaName || 'Drop-off',
                destinationCoords: leg.destinationCoords,
            }));
        setPreviewMarkers(markers);
    }, []);

    const handleCreatorPanelClose = useCallback(() => {
        setIsCreatorPanelOpen(false);
        setPreviewMarkers([]); // Clear markers when panel is closed
        setTripDataForEdit(null);
    }, []);
    
    const handleSaveSuccess = useCallback((message: string) => {
        setIsCreatorPanelOpen(false);
        setPreviewMarkers([]); // Clear markers on successful save
        setSnackbarMessage(message);
        loadData();
    }, [loadData]);

    
    // --- RENDER LOGIC ---

    if (isLoading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress /></Box>;
    }

    return (
        <Box sx={{ height: '100%', width: '100%', position: 'relative', overflow: 'hidden' }}>
            {error && (<Alert severity="error" sx={{ position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 1200 }}>{error}</Alert>)}

            <TripMap 
                // --- FIX: Pass the preview markers to the 'legs' prop for detailed display ---
                legs={previewMarkers} 
                // The 'otherTrips' prop will show the already saved trips
                otherTrips={mapMarkers} 
                driverLocation={currentLocation} 
                focusedTripId={focusedTripId} 
                onFocusCompleteAction={handleFocusCompleteAction}
            />

            <Paper elevation={4} sx={{ position: 'absolute', top: 16, left: 16, zIndex: 1000, p: 1, backgroundColor: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(5px)', borderRadius: 2 }}>
                <Stack direction="row" spacing={1}>
                    <Button variant="contained" startIcon={<AddIcon />} onClick={() => setIsCreatorPanelOpen(true)}>Create Trip</Button>
                    <IconButton onClick={() => setIsTripSheetOpen(true)} title="Show Active Trips List"><ListIcon /></IconButton>
                </Stack>
            </Paper>

            <TripCreatorPanel 
                open={isCreatorPanelOpen} 
                onCloseAction={handleCreatorPanelClose} 
                onSaveSuccessAction={handleSaveSuccess}
                // --- FIX: Pass the new handler to receive leg updates ---
                onLegsChangeAction={handleLegsChange} 
                initialData={tripDataForEdit}
            />

            <ActiveTripsSheet
                open={isTripSheetOpen}
                onCloseAction={() => setIsTripSheetOpen(false)} // Corrected
                trips={activeTrips}
                onTripSelectAction={handleMapFocus} // Corrected
                onViewDetailsAction={handleViewDetails} // Corrected
                onEditTripAction={handleEditTrip} // Corrected
            />

            <TripDetailsPanel
                open={isDetailsPanelOpen}
                onCloseAction={() => setIsDetailsPanelOpen(false)}
                tripId={selectedTripIdForView}
                onTripUpdateAction={loadData}
                onEditTripAction={handleEditTrip}
            />

            <Snackbar
                open={!!snackbarMessage}
                autoHideDuration={5000}
                onClose={() => setSnackbarMessage(null)}
                message={snackbarMessage}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            />
        </Box>
    );
}