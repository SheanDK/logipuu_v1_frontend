// frontend/src/components/common/LocationPicker.tsx
'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Box, Typography, Button, IconButton } from '@mui/material';
import LocationSearchingIcon from '@mui/icons-material/LocationSearching'; // Icon for 'locate me'


// Default center and zoom for the map
const DEFAULT_CENTER = { lat: 62.2426, lng: 25.7473 }; // Center of Finland
const DEFAULT_ZOOM = 6;

// Custom icon for the draggable marker
const draggableIcon = new L.Icon({
    iconUrl: '/images/wing.png', // Ensure this marker icon is in public/images
    iconRetinaUrl: '/images/marker-icon-2x.png',
    shadowUrl: '/images/marker-shadow.png',
    iconSize: [40, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [0, 0],
});

interface LocationPickerProps {
    initialLat?: string | number | null;
    initialLng?: string | number | null;
    onLocationChange: (lat: string, lng: string) => void;
    label?: string; // Optional label for the picker
}

const LocationPicker: React.FC<LocationPickerProps> = ({ initialLat, initialLng, onLocationChange, label }) => {
    const [position, setPosition] = useState<{ lat: number; lng: number }>(() => {
        const lat = typeof initialLat === 'string' ? parseFloat(initialLat) : initialLat;
        const lng = typeof initialLng === 'string' ? parseFloat(initialLng) : initialLng;
        return (lat && lng && !isNaN(lat) && !isNaN(lng)) ? { lat, lng } : DEFAULT_CENTER;
    });
    const markerRef = useRef<L.Marker | null>(null);

    // Effect to update position when initialLat/Lng props change
    useEffect(() => {
        const lat = typeof initialLat === 'string' ? parseFloat(initialLat) : initialLat;
        const lng = typeof initialLng === 'string' ? parseFloat(initialLng) : initialLng;
        if (lat && lng && !isNaN(lat) && !isNaN(lng) && (position.lat !== lat || position.lng !== lng)) {
            setPosition({ lat, lng });
        }
    }, [initialLat, initialLng]);

    // Component to handle map events like click and locate
    const MapEvents = () => {
        const map = useMapEvents({
            click(e) {
                const newPos = e.latlng;
                setPosition(newPos);
                onLocationChange(newPos.lat.toFixed(6), newPos.lng.toFixed(6));
            },
            locationfound(e) {
                const newPos = e.latlng;
                setPosition(newPos);
                onLocationChange(newPos.lat.toFixed(6), newPos.lng.toFixed(6));
                map.flyTo(newPos, map.getZoom() < 12 ? 12 : map.getZoom()); // Fly to user location
            },
            locationerror(e) {
                console.error("Geolocation error:", e.message);
                alert(`Error getting your location: ${e.message}`);
            },
        });

        // Function to trigger geolocation
        const locateUser = () => {
            map.locate({ setView: false, maxZoom: 16 });
        };

        return (
            <IconButton
                sx={{ position: 'absolute', top: 10, right: 10, zIndex: 1000, backgroundColor: 'white', '&:hover': { backgroundColor: 'lightgray' } }}
                onClick={locateUser}
                aria-label="locate me"
            >
                <LocationSearchingIcon />
            </IconButton>
        );
    };

    // Callback for marker drag end
    const eventHandlers = useMemo(
        () => ({
            dragend() {
                const marker = markerRef.current;
                if (marker) {
                    const newPos = marker.getLatLng();
                    setPosition(newPos);
                    onLocationChange(newPos.lat.toFixed(6), newPos.lng.toFixed(6));
                }
            },
        }),
        [onLocationChange],
    );

    return (
        <Box sx={{ width: '800px', height: '250px', borderRadius: 1, overflow: 'hidden', border: '1px solid #ccc', position: 'relative' }}>
            {label && <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>{label}</Typography>}
            <MapContainer
                center={position} // Map centers on the marker position
                zoom={DEFAULT_ZOOM}
                scrollWheelZoom={true}
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer
                    attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker
                    draggable={true}
                    eventHandlers={eventHandlers}
                    position={position}
                    ref={markerRef}
                    icon={draggableIcon}
                >
                </Marker>
                <MapEvents />
            </MapContainer>
            <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                    Lat: {position.lat.toFixed(6)}, Lng: {position.lng.toFixed(6)}
                </Typography>
            </Box>
        </Box>
    );
};

export default LocationPicker;