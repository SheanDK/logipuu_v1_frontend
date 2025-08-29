// frontend/src/components/map/markers/VehicleMarker.tsx
'use client';

import React from 'react';
import { Marker, Popup, Tooltip } from 'react-leaflet';
import { Box, Typography, Divider } from '@mui/material';
import L from 'leaflet';
import { renderToStaticMarkup } from 'react-dom/server';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import { IVehicleLocation } from '../../../types';

// Function to create a custom icon for vehicles
const getVehicleIcon = (): L.DivIcon => {
    const html = renderToStaticMarkup(
        React.createElement('div', {
            style: {
                width: '32px',
                height: '32px',
                backgroundColor: '#1976d2', // Blue color for vehicles
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 5px rgba(0,0,0,0.5)',
                border: '2px solid white',
            }
        }, React.createElement(DirectionsCarIcon, {
            style: {
                fontSize: '20px',
                color: 'white',
            }
        }))
    );
    return L.divIcon({
        html,
        className: 'custom-vehicle-icon',
        iconSize: [36, 36],
        iconAnchor: [18, 18],
    });
};

interface VehicleMarkerProps {
    vehicle: IVehicleLocation;
}

const VehicleMarker: React.FC<VehicleMarkerProps> = ({ vehicle }) => {
    const icon = getVehicleIcon();
    const lastUpdated = vehicle.timestamp ? new Date(vehicle.timestamp).toLocaleTimeString('fi-FI') : 'N/A';

    return (
        <Marker 
            position={[vehicle.lat, vehicle.lng]} 
            icon={icon}
        >
            <Tooltip permanent direction="top" offset={[0, -15]}>
                <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                    {vehicle.id}
                </Typography>
            </Tooltip>
            <Popup minWidth={200}>
                <Box>
                    <Typography variant="h6" component="div" gutterBottom>
                        Vehicle: {vehicle.id}
                    </Typography>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="body2"><strong>Latitude:</strong> {vehicle.lat.toFixed(6)}</Typography>
                    <Typography variant="body2"><strong>Longitude:</strong> {vehicle.lng.toFixed(6)}</Typography>
                    <Typography variant="body2"><strong>Last Update:</strong> {lastUpdated}</Typography>
                </Box>
            </Popup>
        </Marker>
    );
};

export default VehicleMarker;