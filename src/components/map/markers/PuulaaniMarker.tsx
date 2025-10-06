// frontend/src/components/map/markers/PuulaaniMarker.tsx
'use client';

import React, { useMemo, useRef, useEffect } from 'react';
import { Marker, Popup } from 'react-leaflet';
import { Box, Typography, Button, Divider } from '@mui/material';
import { getPuulaaniIcon } from '../../../utils/mapUtils';
import { IMapTimberStack, IClientBasicInfo } from '../../../types';
import { useLayout } from '../../../contexts/LayoutContext';
import L from 'leaflet';
import { useTranslation } from '@/i18n/useTranslation';

interface PuulaaniMarkerProps {
    marker: IMapTimberStack;
    customer: IClientBasicInfo;
    isDraggable: boolean;
    onEdit: (marker: IMapTimberStack) => void;
    onDelete: (marker: IMapTimberStack) => void;
    onLocationChange: (id: number, newLocation: { latitude: number, longitude: number }) => void;
    onDoubleClick: (marker: IMapTimberStack) => void;
}

const PuulaaniMarker: React.FC<PuulaaniMarkerProps> = ({
    marker, customer, isDraggable, onEdit, onDelete, onLocationChange, onDoubleClick
}) => {

    const { puulaaniIcon, puulaaniIconSize } = useLayout();
    const icon = getPuulaaniIcon(marker.clientColor, puulaaniIcon, puulaaniIconSize);
    const markerRef = useRef<L.Marker>(null);
    const { t } = useTranslation('puulaaniMarker');

    useEffect(() => {
        if (markerRef.current) {
            if (isDraggable) {
                markerRef.current.dragging?.enable();
            } else {
                markerRef.current.dragging?.disable();
            }
        }
    }, [isDraggable]);

    const eventHandlers = useMemo(() => ({
        dragend() {
            const currentMarker = markerRef.current;
            if (currentMarker != null && isDraggable) {
                const { lat, lng } = currentMarker.getLatLng();
                onLocationChange(marker.id, { latitude: lat, longitude: lng });
            }
        },
        dblclick() {
            onDoubleClick(marker);
        }
    }), [marker, isDraggable, onLocationChange, onDoubleClick]);

    const fmt = (n: number) =>
        n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const statusText = marker.isActive ? t('status.active') : t('status.inactive');
    const completedSuffix = marker.isCompleted ? ` ${t('status.completed')}` : '';

    return (
        <Marker
            position={[marker.latitude, marker.longitude]}
            icon={icon}
            draggable={isDraggable}
            eventHandlers={eventHandlers}
            ref={markerRef}
        >
            <Popup minWidth={250}>
                <Box>
                    <Typography variant="h6" gutterBottom>{marker.name}</Typography>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="body2"><strong>{t('popup.client')}:</strong> {customer?.name ?? '–'}</Typography>
                    <Typography variant="body2"><strong>{t('popup.total')}:</strong> {fmt(marker.totalVolume)} m³</Typography>
                    <Typography variant="body2"><strong>{t('popup.remaining')}:</strong> {fmt(marker.remainingVolume)} m³</Typography>
                    <Typography variant="body2"><strong>{t('popup.status')}:</strong> {statusText} {completedSuffix}</Typography>
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                        <Button size="small" variant="outlined" onClick={() => onEdit(marker)}> {t('buttons.detailsEdit')}</Button>
                        <Button size="small" color="error" onClick={() => onDelete(marker)}> {t('buttons.delete')}</Button>
                    </Box>
                </Box>
            </Popup>
        </Marker>
    );
};

export default PuulaaniMarker;