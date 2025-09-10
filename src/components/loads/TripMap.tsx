// frontend/src/components/loads/TripMap.tsx
'use client';

import React, { useEffect } from 'react';
import { Box, Button } from '@mui/material';
import L, { LatLngBoundsExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup, useMap, LayersControl } from 'react-leaflet';
import NavigationIcon from '@mui/icons-material/Navigation';

// Leaflet Icon Fix
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: '/images/marker-icon-2x.png',
    iconUrl: '/images/marker-icon.png',
    shadowUrl: '/images/marker-shadow.png',
});

const originIcon = L.divIcon({
    className: 'custom-icon-origin',
    html: `<div style="background-color: #1976D2; width: 32px; height: 32px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; justify-content: center; align-items: center; border: 2px solid white; box-shadow: 0 3px 6px rgba(0,0,0,0.4);"><span style="color: white; font-weight: bold; transform: rotate(45deg);">O</span></div>`,
    iconSize: [36, 36], iconAnchor: [18, 36],
});

const destinationIcon = L.divIcon({
    className: 'custom-icon-destination',
    html: `<div style="background-color: #388E3C; width: 32px; height: 32px; border-radius: 50%; display: flex; justify-content: center; align-items: center; border: 2px solid white; box-shadow: 0 3px 6px rgba(0,0,0,0.4);"><span style="color: white; font-weight: bold;">D</span></div>`,
    iconSize: [36, 36], iconAnchor: [18, 18],
});

interface TripMapProps {
    origin: { lat: number; lng: number; name: string };
    destination: { lat: number; lng: number; name: string };
}

const MapBoundsFitter = ({ bounds }: { bounds: LatLngBoundsExpression }) => {
    const map = useMap();
    useEffect(() => {
        if (bounds) {
            map.fitBounds(bounds, { padding: [40, 40] });
        }
    }, [map, bounds]);
    return null;
};

export default function TripMap({ origin, destination }: TripMapProps) {
    const bounds: LatLngBoundsExpression = [ [origin.lat, origin.lng], [destination.lat, destination.lng] ];
    const directionsUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}`;

    return (
        <Box sx={{ height: 300, width: '100%', borderRadius: 1, overflow: 'hidden', position: 'relative' }}>
            <MapContainer
                bounds={bounds}
                scrollWheelZoom={true}
                style={{ height: '100%', width: '100%' }}
            >
                <LayersControl position="topright">
                    <LayersControl.BaseLayer checked name="Street Map"><TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" /></LayersControl.BaseLayer>
                    <LayersControl.BaseLayer name="Satellite"><TileLayer url='https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}' maxZoom={20} subdomains={['mt1','mt2','mt3']} attribution='&copy; Google' /></LayersControl.BaseLayer>
                </LayersControl>
                <Marker position={[origin.lat, origin.lng]} icon={originIcon}><Popup><b>Origin:</b><br />{origin.name}</Popup></Marker>
                <Marker position={[destination.lat, destination.lng]} icon={destinationIcon}><Popup><b>Destination:</b><br />{destination.name}</Popup></Marker>
                <MapBoundsFitter bounds={bounds} />
            </MapContainer>
            <Button
                variant="contained"
                startIcon={<NavigationIcon />}
                href={directionsUrl}
                target="_blank" // Open in a new tab (or the native maps app on mobile)
                rel="noopener noreferrer"
                sx={{
                    position: 'absolute',
                    top: 16,
                    left: 16,
                    zIndex: 1000, // Make sure it's on top of the map
                }}
            >
                Get Directions
            </Button>
        </Box>
    );
}