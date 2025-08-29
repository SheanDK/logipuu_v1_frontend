// src/components/map/markers/MuuMerkkiMarker.tsx
'use client';

import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import { Box, Typography, Button, Divider } from '@mui/material';
import { getMuuMerkkiIcon } from '../../../utils/mapUtils';
import { IMapOtherMarker } from '../../../types';

interface MuuMerkkiMarkerProps {
    marker: IMapOtherMarker;
    onEdit: (marker: IMapOtherMarker) => void;
    onDelete: (marker: IMapOtherMarker) => void;
}

const MuuMerkkiMarker: React.FC<MuuMerkkiMarkerProps> = ({ marker, onEdit, onDelete }) => {
    const icon = getMuuMerkkiIcon(marker);

    return (
        <Marker 
            position={[marker.latitude, marker.longitude]} 
            icon={icon}
        >
            <Popup minWidth={250}>
                <Box>
                    <Typography variant="h6" gutterBottom>{marker.name}</Typography>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="body2"><strong>Type:</strong> {marker.iconType}</Typography>
                    {marker.additionalInfo && (
                        <Typography variant="body2"><strong>Info:</strong> {marker.additionalInfo}</Typography>
                    )}
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                        <Button size="small" variant="outlined" onClick={() => onEdit(marker)}>Edit</Button>
                        <Button size="small" color="error" onClick={() => onDelete(marker)}>Delete</Button>
                    </Box>
                </Box>
            </Popup>
        </Marker>
    );
};

export default MuuMerkkiMarker;