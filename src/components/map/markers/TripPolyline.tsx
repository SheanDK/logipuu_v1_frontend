// frontend/src/components/map/markers/TripPolyline.tsx
'use client';

import React from 'react';
import { Polyline, Popup, CircleMarker } from 'react-leaflet';
import { Box, Typography, Chip, Divider } from '@mui/material';
import { IMapTrip } from '@/types';

interface TripPolylineProps {
    trip: IMapTrip;
}

export default function TripPolyline({ trip }: TripPolylineProps) {
    const positions: [number, number][] = [
        [trip.originCoords.lat, trip.originCoords.lng],
        [trip.destinationCoords.lat, trip.destinationCoords.lng]
    ];

    const polylineOptions = {
        color: '#FF5722', // A distinct orange color
        weight: 3,
        opacity: 0.8,
        dashArray: '5, 10',
    };

    return (
        <>
            <CircleMarker center={positions[0]} radius={5} pathOptions={{ color: '#1976D2', fillColor: '#fff', fillOpacity: 1 }} />
            <CircleMarker center={positions[1]} radius={5} pathOptions={{ color: '#388E3C', fillColor: '#fff', fillOpacity: 1 }} />
            <Polyline positions={positions} pathOptions={polylineOptions}>
                <Popup minWidth={250}>
                    <Box>
                        <Typography variant="subtitle1" fontWeight="bold">Trip #{trip.tripId}</Typography>
                        <Chip label={trip.status} size="small" color="info" sx={{mb: 1}}/>
                        <Divider sx={{mb: 1}}/>
                        <Typography variant="body2"><strong>Driver:</strong> {trip.driverName || 'N/A'}</Typography>
                        <Typography variant="body2"><strong>Vehicle:</strong> {trip.vehicleRegNo || 'N/A'}</Typography>
                        <Typography variant="body2"><strong>From:</strong> {trip.originName}</Typography>
                        <Typography variant="body2"><strong>To:</strong> {trip.destinationName}</Typography>
                    </Box>
                </Popup>
            </Polyline>
        </>
    );
}