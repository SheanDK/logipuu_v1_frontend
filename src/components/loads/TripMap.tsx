// frontend/src/components/loads/TripMap.tsx
'use client';

import React, { useEffect, useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import L, { LatLngTuple, LeafletMouseEvent } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup, useMap, LayersControl, ZoomControl } from 'react-leaflet';
import FlagIcon from '@mui/icons-material/Flag';
import NavigationIcon from '@mui/icons-material/Navigation';
import { renderToStaticMarkup } from 'react-dom/server';

// --- Leaflet Icon setup ---
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: '/images/marker-icon-2x.png', iconUrl: '/images/marker-icon.png', shadowUrl: '/images/marker-shadow.png' });

// Specific icon for an active trip's numbered pickup points
const createPickupIcon = (index: number) => L.divIcon({ className: `custom-icon-pickup-${index}`, html: `<div style="background-color: #d32f2f; width: 32px; height: 32px; border-radius: 50%; display: flex; justify-content: center; align-items: center; border: 2px solid white; box-shadow: 0 3px 6px rgba(0,0,0,0.4);"><span style="color: white; font-weight: bold;">${index + 1}</span></div>`, iconSize: [36, 36], iconAnchor: [18, 36], popupAnchor: [0, -36] });

// Icon for the driver's live location (changed color to red)
const driverIcon = L.divIcon({ className: 'custom-icon-driver', html: renderToStaticMarkup(<NavigationIcon style={{ fontSize: '38px', color: '#ff0000', fill: '#ff0000d0', transform: 'rotate(-45deg)', filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.6))', stroke: 'white', strokeWidth: 0.5 }} />), iconSize: [38, 38], iconAnchor: [19, 19] });
// Icon for Puulaani (Timber Sites / Pickups)
const puulaaniIcon = L.divIcon({ className: 'custom-icon-puulaani', html: `<div style="background-color: #1976D2; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; opacity: 0.9; box-shadow: 0 1px 3px rgba(0,0,0,0.5);"></div>`, iconSize: [18, 18], iconAnchor: [9, 9] });

// Icon for Purkupaikka (Drop-off Locations)
const purkupaikkaIcon = L.divIcon({ className: 'custom-icon-purkupaikka', html: renderToStaticMarkup(<FlagIcon style={{ fontSize: '24px', color: '#000000ff', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.6))', stroke: 'white', strokeWidth: 0.5 }} />), iconSize: [24, 24], iconAnchor: [4, 24], popupAnchor: [8, -24] });


export interface TripLegForMap {
    kuormaId: number;
    originName: string;
    originCoords: { lat: number; lng: number; };
    destinationName?: string;
    destinationCoords?: { lat: number; lng: number; } | null;
}

export interface TripMapProps {
    legs: TripLegForMap[];
    puulaanit: TripLegForMap[];
    purkupaikat: TripLegForMap[];
    driverLocation: { lat: number; lng: number; } | null;
    focusedTripId?: number | null;
    onFocusCompleteAction: () => void;
    onMarkerClickAction: (tripId: number, event: LeafletMouseEvent) => void;
}

const MapFocusController = ({ focusedTripId, trips, onFocusCompleteAction }: 
    { focusedTripId: number | null | undefined, trips: TripLegForMap[], onFocusCompleteAction: () => void }) => {
    const map = useMap();
    useEffect(() => {
        if (typeof focusedTripId === 'number') {
            const selectedTrip = trips.find(t => t.kuormaId === focusedTripId);
            if (selectedTrip?.originCoords) {
                map.flyTo([selectedTrip.originCoords.lat, selectedTrip.originCoords.lng], 14);
                onFocusCompleteAction();
            }
        }
    }, [focusedTripId, trips, map, onFocusCompleteAction]);
    return null;
};

export default function TripMap({ legs, puulaanit, purkupaikat, driverLocation, focusedTripId, onFocusCompleteAction, onMarkerClickAction }: TripMapProps) {
    const bounds = useMemo(() => {
        const allCoords: LatLngTuple[] = [];
        legs.forEach(leg => {
            if (leg.originCoords) allCoords.push([leg.originCoords.lat, leg.originCoords.lng]);
            if (leg.destinationCoords) allCoords.push([leg.destinationCoords.lat, leg.destinationCoords.lng]);
        });
        puulaanit.forEach(trip => { if (trip.originCoords) allCoords.push([trip.originCoords.lat, trip.originCoords.lng]); });
        purkupaikat.forEach(trip => { if (trip.originCoords) allCoords.push([trip.originCoords.lat, trip.originCoords.lng]); });
        if (driverLocation) allCoords.push([driverLocation.lat, driverLocation.lng]);
        
        return allCoords.length > 0 ? L.latLngBounds(allCoords) : undefined;
    }, [legs, puulaanit, purkupaikat, driverLocation]);

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
            
            {/* Markers for the active trip's route */}
            {legs.map((leg, index) => (
                <React.Fragment key={`leg-${leg.kuormaId}`}>
                    {leg.originCoords && <Marker position={[leg.originCoords.lat, leg.originCoords.lng]} icon={createPickupIcon(index)}><Popup><b>Pickup #{index + 1}:</b><br />{leg.originName}</Popup></Marker>}
                    {leg.destinationCoords && <Marker position={[leg.originCoords.lat, leg.destinationCoords.lng]} icon={purkupaikkaIcon}><Popup><b>Destination:</b><br />{leg.destinationName}</Popup></Marker>}
                </React.Fragment>
            ))}
            
            {/* Markers for available Puulaani sites */}
            {puulaanit.map((trip) => (
                trip.originCoords && 
                <Marker 
                    key={`puulaani-${trip.kuormaId}`} 
                    position={[trip.originCoords.lat, trip.originCoords.lng]} 
                    icon={puulaaniIcon}
                    eventHandlers={{ click: (e) => onMarkerClickAction(trip.kuormaId, e) }}
                >
                    <Popup>{trip.originName}</Popup>
                </Marker>
            ))}
            
            {/* Markers for available Purkupaikka sites */}
            {purkupaikat.map((trip) => (
                trip.originCoords && 
                <Marker 
                    key={`purkupaikka-${trip.kuormaId}`} 
                    position={[trip.originCoords.lat, trip.originCoords.lng]} 
                    icon={purkupaikkaIcon}
                >
                     <Popup>{trip.originName}</Popup>
                </Marker>
            ))}

            {driverLocation && ( <Marker position={[driverLocation.lat, driverLocation.lng]} icon={driverIcon}><Popup>Your current location</Popup></Marker> )}
            
            <MapFocusController trips={puulaanit} {...{focusedTripId, onFocusCompleteAction}} />
        </MapContainer>
    );
}