// frontend/src/components/loads/MapViewModal.tsx
'use client';

import React, { useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, Box, Typography, IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import L, { LatLngBoundsExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup, useMap, LayersControl } from 'react-leaflet';

// Leaflet Icon Fix (necessary when using custom icons or if default icons are broken)
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: '/images/marker-icon-2x.png',
    iconUrl: '/images/marker-icon.png',
    shadowUrl: '/images/marker-shadow.png',
});

// Custom icon for Origin
const originIcon = L.divIcon({
    className: 'custom-icon-origin',
    html: `<div style="background-color: #2196f3; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; color: white; font-weight: bold;">O</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
});

// Custom icon for Destination
const destinationIcon = L.divIcon({
    className: 'custom-icon-destination',
    html: `<div style="background-color: #4caf50; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; color: white; font-weight: bold;">D</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
});


interface MapViewModalProps {
    open: boolean;
    onCloseAction: () => void;
    origin: { lat: number; lng: number; name: string };
    destination: { lat: number; lng: number; name: string };
}

// A helper component to automatically adjust the map view to fit both markers
const MapBoundsFitter = ({ bounds }: { bounds: LatLngBoundsExpression }) => {
    const map = useMap();
    useEffect(() => {
        if (bounds) {
            map.fitBounds(bounds, { padding: [50, 50] }); // Add some padding
        }
    }, [map, bounds]);
    return null;
};

export default function MapViewModal({ open, onCloseAction, origin, destination }: MapViewModalProps) {
    // Define the geographical bounds that include both origin and destination
    const bounds: LatLngBoundsExpression = [
        [origin.lat, origin.lng],
        [destination.lat, destination.lng]
    ];

    return (
        <Dialog 
            open={open} 
            onClose={onCloseAction} 
            fullWidth 
            maxWidth="lg" 
            PaperProps={{ sx: { height: '90vh' } }}
        >
            <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" component="div">Route Map</Typography>
                <IconButton aria-label="close" onClick={onCloseAction} sx={{ color: (theme) => theme.palette.grey[500] }}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent dividers sx={{ p: 0, overflow: 'hidden' }}>
                <MapContainer
                    bounds={bounds}
                    scrollWheelZoom={true}
                    style={{ height: '100%', width: '100%' }}
                >
                    <LayersControl position="topright">
                        <LayersControl.BaseLayer checked name="OpenStreetMap">
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                        </LayersControl.BaseLayer>
                        <LayersControl.BaseLayer name="Satellite View">
                            <TileLayer
                                url='https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}'
                                maxZoom={20}
                                subdomains={['mt1','mt2','mt3']}
                                attribution='&copy; Google'
                            />
                        </LayersControl.BaseLayer>
                    </LayersControl>
                    
                    <Marker position={[origin.lat, origin.lng]} icon={originIcon}>
                        <Popup><b>Origin:</b><br />{origin.name}</Popup>
                    </Marker>
                    
                    <Marker position={[destination.lat, destination.lng]} icon={destinationIcon}>
                        <Popup><b>Destination:</b><br />{destination.name}</Popup>
                    </Marker>
                    
                    {/* This component will handle the map zoom and center */}
                    <MapBoundsFitter bounds={bounds} />
                </MapContainer>
            </DialogContent>
        </Dialog>
    );
}