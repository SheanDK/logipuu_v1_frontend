// src/components/map/markers/MuuMerkkiMarker.tsx
'use client';

import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import { Box, Typography, Button, Divider } from '@mui/material';
import { getMuuMerkkiIcon } from '../../../utils/mapUtils';
import { IMapOtherMarker } from '../../../types';
import { useTranslation } from '@/i18n/useTranslation';
import { useLayout } from '@/contexts/LayoutContext';

interface MuuMerkkiMarkerProps {
    marker: IMapOtherMarker;
    onEdit: (marker: IMapOtherMarker) => void;
    onDelete: (marker: IMapOtherMarker) => void;
}

const MuuMerkkiMarker: React.FC<MuuMerkkiMarkerProps> = ({ marker, onEdit, onDelete }) => {
    const { otherMarkerIconSize = 22 } = useLayout() as any; 
    const icon = getMuuMerkkiIcon(marker, otherMarkerIconSize, marker.color); 
    const { t } = useTranslation(['muuMerkkiMarker', 'common'])

    return (
        <Marker 
            position={[marker.latitude, marker.longitude]} 
            icon={icon}
        >
            <Popup minWidth={250}>
                <Box>
                    <Typography variant="h6" gutterBottom>{marker.name}</Typography>
                    <Divider sx={{ my: 1 }} />
                    {marker.additionalInfo && (
                        <Typography variant="body2"><strong>{t('popup.title')}:</strong> {marker.additionalInfo}</Typography>
                    )}
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                        <Button size="small" variant="outlined" onClick={() => onEdit(marker)}>{t('common:buttons.edit')}</Button>
                        <Button size="small" color="error" onClick={() => onDelete(marker)}>{t('common:buttons.delete')}</Button>
                    </Box>
                </Box>
            </Popup>
        </Marker>
    );
};

export default MuuMerkkiMarker;