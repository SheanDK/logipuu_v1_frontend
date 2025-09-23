// frontend/src/components/loads/TripMap.tsx

'use client';

import React, { useEffect, useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import L, { LatLngBoundsExpression, LatLngTuple } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup, useMap, LayersControl, ZoomControl } from 'react-leaflet';
import FlagIcon from '@mui/icons-material/Flag';
import NavigationIcon from '@mui/icons-material/Navigation';
import { renderToStaticMarkup } from 'react-dom/server';

// --- Leaflet Icon setup ---
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: '/images/marker-icon-2x.png', iconUrl: '/images/marker-icon.png', shadowUrl: '/images/marker-shadow.png' });

// Numbered icon for the main trip's pickup points
const createPickupIcon = (index: number) => L.divIcon({ className: `custom-icon-pickup-${index}`, html: `<div style="background-color: #1976D2; width: 32px; height: 32px; border-radius: 50%; display: flex; justify-content: center; align-items: center; border: 2px solid white; box-shadow: 0 3px 6px rgba(0,0,0,0.4);"><span style="color: white; font-weight: bold;">${index + 1}</span></div>`, iconSize: [36, 36], iconAnchor: [18, 36], popupAnchor: [0, -36] });
// Icon for the driver's live location
const driverIcon = L.divIcon({ className: 'custom-icon-driver', html: renderToStaticMarkup(<NavigationIcon style={{ fontSize: '38px', color: '#ff5722', transform: 'rotate(-45deg)', filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.6))', stroke: 'white', strokeWidth: 0.5 }} />), iconSize: [38, 38], iconAnchor: [19, 19] });
// Icon for other active trip locations (dashboard view)
const otherTripIcon = L.divIcon({ className: 'custom-icon-other-trip', html: `<div style="background-color: #757575; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; opacity: 0.8; box-shadow: 0 1px 3px rgba(0,0,0,0.4);"></div>`, iconSize: [16, 16], iconAnchor: [8, 8] });
// Icon for destination/drop-off points
const destinationIcon = L.divIcon({ className: 'custom-icon-destination', html: renderToStaticMarkup(<FlagIcon style={{ fontSize: '36px', color: '#4CAF50', filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.6))', stroke: 'white', strokeWidth: 0.5 }} />), iconSize: [36, 36], iconAnchor: [5, 36], popupAnchor: [12, -36] });
// --- End of Icon setup ---

// This interface is now correctly defined AND exported
export interface TripLegForMap {
    kuormaId: number;
    originName: string;
    originCoords: { lat: number; lng: number; };
    destinationName?: string;
    destinationCoords?: { lat: number; lng: number; } | null;
}

// These are the props our NEW map component expects
export interface TripMapProps {
    legs: TripLegForMap[];
    otherTrips: TripLegForMap[];
    driverLocation: { lat: number; lng: number; } | null;
    focusedTripId?: number | null;
    onFocusCompleteAction: () => void; // It is now a required prop
}

const MapFocusController = ({ focusedTripId, trips, onFocusCompleteAction }: { focusedTripId: number | null | undefined, trips: TripLegForMap[], onFocusCompleteAction: () => void }) => {
    const map = useMap();

    useEffect(() => {
        if (typeof focusedTripId === 'number') {
            const selectedTrip = trips.find(t => t.kuormaId === focusedTripId);
            if (selectedTrip?.originCoords) {
                map.flyTo([selectedTrip.originCoords.lat, selectedTrip.originCoords.lng], 14);
                // This call is now valid
                onFocusCompleteAction();
            }
        }
    }, [focusedTripId, trips, map, onFocusCompleteAction]);

    return null;
};

// --- FIX 2: Accept and pass down the onFocusComplete prop ---
export default function TripMap({ legs, otherTrips, driverLocation, focusedTripId, onFocusCompleteAction }: TripMapProps) {
    const bounds = useMemo(() => {
        const allCoords: LatLngTuple[] = [];
        legs.forEach(leg => {
            if (leg.originCoords) allCoords.push([leg.originCoords.lat, leg.originCoords.lng]);
            if (leg.destinationCoords) allCoords.push([leg.destinationCoords.lat, leg.destinationCoords.lng]);
        });
        otherTrips.forEach(trip => {
            if (trip.originCoords) allCoords.push([trip.originCoords.lat, trip.originCoords.lng]);
        });
        if (driverLocation) allCoords.push([driverLocation.lat, driverLocation.lng]);
        
        return allCoords.length > 0 ? L.latLngBounds(allCoords) : undefined;
    }, [legs, otherTrips, driverLocation]);

    if (!bounds) {
        return (
            <Box sx={{height: '100%', width: '100%', bgcolor: 'grey.300', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                <Typography color="text.secondary">No locations to display on map.</Typography>
            </Box>
        );
    }

    return (
        <MapContainer
            bounds={bounds}
            boundsOptions={{ paddingTopLeft: [280, 20], paddingBottomRight: [20, 20] }}
            scrollWheelZoom={true}
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
        >
            <ZoomControl position="bottomleft" />
            <LayersControl position="bottomleft">
                <LayersControl.BaseLayer checked name="Street Map"><TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" /></LayersControl.BaseLayer>
                <LayersControl.BaseLayer name="Satellite"><TileLayer url='https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}' maxZoom={20} subdomains={['mt1','mt2','mt3']} attribution='&copy; Google' /></LayersControl.BaseLayer>
            </LayersControl>
            
            {/* Markers for the main trip (if any) */}
            {legs.map((leg, index) => (
                <React.Fragment key={`leg-${leg.kuormaId}`}>
                    {leg.originCoords && <Marker position={[leg.originCoords.lat, leg.originCoords.lng]} icon={createPickupIcon(index)}><Popup><b>Pickup #{index + 1}:</b><br />{leg.originName}</Popup></Marker>}
                    {leg.destinationCoords && <Marker position={[leg.destinationCoords.lat, leg.destinationCoords.lng]} icon={destinationIcon}><Popup><b>Destination:</b><br />{leg.destinationName}</Popup></Marker>}
                </React.Fragment>
            ))}
            
            {/* Markers for OTHER active trips */}
            {otherTrips.map((trip) => (
                trip.originCoords && <Marker key={`other-${trip.kuormaId}`} position={[trip.originCoords.lat, trip.originCoords.lng]} icon={otherTripIcon}><Popup><b>Upcoming Pickup:</b><br />{trip.originName}</Popup></Marker>
            ))}

            {/* Marker for driver location */}
            {driverLocation && ( <Marker position={[driverLocation.lat, driverLocation.lng]} icon={driverIcon}><Popup>Your current location</Popup></Marker> )}
            
            <MapFocusController 
                focusedTripId={focusedTripId} 
                trips={otherTrips} 
                onFocusCompleteAction={onFocusCompleteAction} 
            />
        </MapContainer>
    );
}