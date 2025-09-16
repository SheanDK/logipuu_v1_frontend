// frontend/src/components/loads/TripMap.tsx
'use client';

import React, { useEffect, useMemo } from 'react';
import { Box, Button } from '@mui/material';
import L, { LatLngBoundsExpression, LatLngTuple } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup, useMap, LayersControl } from 'react-leaflet';
import NavigationIcon from '@mui/icons-material/Navigation';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import { renderToStaticMarkup } from 'react-dom/server';

// Leaflet Icon Fix
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
    html: `<div style="background-color: #1976D2; width: 32px; height: 32px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; justify-content: center; align-items: center; border: 2px solid white; box-shadow: 0 3px 6px rgba(0,0,0,0.4);"><span style="color: white; font-weight: bold; transform: rotate(45deg);">O</span></div>`,
    iconSize: [36, 36], 
    iconAnchor: [18, 36],
});

// Custom icon for Destination
const destinationIcon = L.divIcon({
    className: 'custom-icon-destination',
    html: `<div style="background-color: #388E3C; width: 32px; height: 32px; border-radius: 50%; display: flex; justify-content: center; align-items: center; border: 2px solid white; box-shadow: 0 3px 6px rgba(0,0,0,0.4);"><span style="color: white; font-weight: bold;">D</span></div>`,
    iconSize: [36, 36], 
    iconAnchor: [18, 18],
});

// Custom icon for the driver's live location
const driverIcon = L.divIcon({
    className: 'custom-icon-driver',
    html: renderToStaticMarkup(
        <LocalShippingIcon style={{ 
            fontSize: '36px', 
            color: '#ff5722', 
            filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.6))',
            stroke: 'white',
            strokeWidth: 0.5,
        }} />
    ),
    iconSize: [36, 36],
    iconAnchor: [18, 18], // Center of the icon
});

interface TripMapProps {
    origin: { lat: number; lng: number; name: string };
    destination: { lat: number; lng: number; name: string };
    driverLocation: { lat: number; lng: number; } | null;
}

const MapUpdater = ({ bounds, driverLocation }: { bounds: LatLngBoundsExpression, driverLocation: LatLngTuple | null }) => {
    const map = useMap();

    useEffect(() => {
        // --- THIS IS THE FIX ---
        // We ensure that `bounds` is treated as an array of tuples before accessing by index.
        const boundsAsTuples = bounds as LatLngTuple[];

        if (driverLocation) {
            // If tracking is active, create new bounds including the driver and the original destination
            const newBounds = L.latLngBounds([driverLocation, boundsAsTuples[1]]);
            map.fitBounds(newBounds, { padding: [50, 50], maxZoom: 16 });
        } else {
            // Default behavior: fit both origin and destination
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [map, bounds, driverLocation]); // Re-run when location changes
    
    return null;
};
export default function TripMap({ origin, destination, driverLocation }: TripMapProps) {
    const bounds: LatLngTuple[] = [ [origin.lat, origin.lng], [destination.lat, destination.lng] ];
    const directionsUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}`;
    const driverLocationTuple: LatLngTuple | null = driverLocation ? [driverLocation.lat, driverLocation.lng] : null;

    return (
        <>
            <MapContainer
                center={driverLocationTuple || bounds[0]}
                zoom={13}
                scrollWheelZoom={true}
                style={{ height: '100%', width: '100%', zIndex: 0 }}
                zoomControl={false} // Disable default zoom to avoid overlap with LayersControl
            >
                {/* --- THIS IS THE FIX --- */}
                {/* Use LayersControl to provide different map views */}
                <LayersControl position="bottomleft">
                    <LayersControl.BaseLayer checked name="Standard Map">
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                    </LayersControl.BaseLayer>
                    <LayersControl.BaseLayer name="Satellite">
                        <TileLayer
                            url='https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}'
                            maxZoom={20}
                            subdomains={['mt1','mt2','mt3']}
                            attribution='&copy; Google'
                        />
                    </LayersControl.BaseLayer>
                    <LayersControl.BaseLayer name="Topographic">
                        <TileLayer
                            attribution='Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
                            url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
                        />
                    </LayersControl.BaseLayer>
                </LayersControl>
                
                <Marker position={bounds[0]} icon={originIcon}><Popup><b>Origin:</b><br />{origin.name}</Popup></Marker>
                <Marker position={bounds[1]} icon={destinationIcon}><Popup><b>Destination:</b><br />{destination.name}</Popup></Marker>
                
                {driverLocationTuple && (
                    <Marker position={driverLocationTuple} icon={driverIcon}>
                        <Popup>Your current location</Popup>
                    </Marker>
                )}
                
                <MapUpdater bounds={bounds} driverLocation={driverLocationTuple} />
            </MapContainer>
            
            <Button
                variant="contained"
                startIcon={<NavigationIcon />}
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                    position: 'absolute',
                    top: { xs: 100, sm: 10 },
                    left: { xs: '50%', sm: 10 },
                    transform: { xs: 'translateX(- ৫০%)', sm: 'none' },
                    zIndex: 1,
                }}
            >
                Get Directions
            </Button>
        </>
    );
}