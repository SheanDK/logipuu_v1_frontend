// frontend/src/components/map/markers/PuulaaniMarker.tsx
'use client';

import React, { useMemo, useRef, useEffect } from 'react';
import { Marker, Popup } from 'react-leaflet';
import { Box, Typography, Button, Divider, Stack } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit'; 
import { getPuulaaniIcon } from '../../../utils/mapUtils';
import { IMapTimberStack, IClientBasicInfo } from '../../../types';
import { useLayout } from '../../../contexts/LayoutContext';
import L from 'leaflet';
import { useTranslation } from '@/i18n/useTranslation';

const DetailRow = ({ label, value }: { label: string; value: string | number }) => (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="body2" color="text.secondary">{label}:</Typography>
        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{value}</Typography>
    </Box>
);


interface PuulaaniMarkerProps {
    marker: IMapTimberStack;
    customer: IClientBasicInfo;
    isDraggable: boolean;
    onEdit: (marker: IMapTimberStack) => void;
    onLocationChange: (id: number, newLocation: { latitude: number, longitude: number }) => void;
    onDoubleClick: (marker: IMapTimberStack) => void;
}

const PuulaaniMarker: React.FC<PuulaaniMarkerProps> = ({
    marker, customer, isDraggable, onEdit, onLocationChange, onDoubleClick
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
            <Popup>
                <Box sx={{ width: 220, p: 1 }}> {/* Add some padding to the main box */}
                    <Typography variant="h6" component="div" sx={{ 
                        fontWeight: 'bold', 
                        overflowWrap: 'break-word',
                        mb: 1,
                        px: 1 // Add horizontal padding to the title
                    }}>
                        {marker.name}
                    </Typography>

                    <Divider />

                    {/* --- FIX 1: Reduce the row gap --- */}
                    <Stack spacing={-4} sx={{ my: 0, px: 0.5 }}>
                        <DetailRow label="Client" value={customer.clientName} />
                        <DetailRow label="Total" value={`${marker.totalVolume.toFixed(2)} m³`} />
                        <DetailRow label="Remaining" value={`${marker.remainingVolume.toFixed(2)} m³`} />
                        <DetailRow label="Status" value={marker.isActive ? 'Active' : 'Inactive'} />
                    </Stack>
                    
                    {/* --- FIX 2: Center-align the button --- */}
                    
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1.5 }}>
                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={<EditIcon />}
                            onClick={() => onEdit(marker)}
                        >
                            Details / Edit
                        </Button>
                    </Box>
                </Box>
            </Popup>
        </Marker>
    );
};

export default PuulaaniMarker;