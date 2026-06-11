// frontend/src/components/map/markers/PurkupaikkaMarker.tsx
'use client';

import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import { Box, Typography, Button, Divider, Chip, Stack } from '@mui/material';
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
        <Marker position={[marker.latitude, marker.longitude]} icon={icon}>
            <Popup minWidth={250}>
                <Box sx={{ p: 1 }}>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                        {marker.name}
                    </Typography>


                    {(marker as any).isChipDestination && (
                        <Chip
                            label="Chip Destination"
                            size="small"
                            color="primary"
                            sx={{ mb: 1, fontWeight: 'bold', fontSize: '0.7rem' }}
                        />
                    )}

                    <Divider sx={{ my: 1 }} />
                    <Typography variant="body2"><strong>{t('popup.client')}:</strong> {marker.clientName}</Typography>

                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', gap: 1 }}>
                        <Button size="small" variant="outlined" onClick={() => onEdit(marker)}>{t('common:buttons.edit')}</Button>
                        <Button size="small" color="error" onClick={() => onDelete(marker)}>{t('common:buttons.delete')}</Button>
                    </Box>
                </Box>
            </Popup>
        </Marker>
    );
};

export default PurkupaikkaMarker;