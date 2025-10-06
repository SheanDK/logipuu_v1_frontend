// frontend/src/components/map/markers/PurkupaikkaMarker.tsx
'use client';

import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import { Box, Typography, Button, Divider } from '@mui/material';
import { purkupaikkaIcon } from '../../../utils/mapUtils';
import { IMapDropoffLocation } from '../../../types';
import { useLayout } from '@/contexts/LayoutContext';
import { useTranslation } from '@/i18n/useTranslation';

interface PurkupaikkaMarkerProps {
    marker: IMapDropoffLocation;
    onEdit: (marker: IMapDropoffLocation) => void;
    onDelete: (marker: IMapDropoffLocation) => void;
}

const PurkupaikkaMarker: React.FC<PurkupaikkaMarkerProps> = ({ marker, onEdit, onDelete }) => {
    const { dropoffIcon, dropoffIconSize } = useLayout();
    const icon = purkupaikkaIcon(dropoffIcon, dropoffIconSize);
    const { t } = useTranslation(['purkupaikkaMarker', 'common']);

    return (
        <Marker
            position={[marker.latitude, marker.longitude]}
            icon={icon}
        >
            <Popup minWidth={250}>
                <Box>
                    <Typography variant="h6" gutterBottom>{t('popup.title')}: {marker.name}</Typography>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="body2"><strong>{t('popup.client')}:</strong> {marker.clientName}</Typography>
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                        <Button size="small" variant="outlined" onClick={() => onEdit(marker)}>{t('common:buttons.edit')}</Button>
                        <Button size="small" color="error" onClick={() => onDelete(marker)}>{t('common:buttons.delete')}</Button>
                    </Box>
                </Box>
            </Popup>
        </Marker>
    );
};

export default PurkupaikkaMarker;