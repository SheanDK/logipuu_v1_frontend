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
    <Box sx={{
        display: 'flex',
        alignItems: 'flex-start',
        width: '100%'
    }}>
        <Typography
            variant="body2"
            color="text.secondary"
            sx={{
                flexShrink: 0,
                width: '50px'
            }}
        >
            {label}:
        </Typography>
        <Typography
            variant="body2"
            sx={{
                fontWeight: 'bold',
                textAlign: 'right',
                wordBreak: 'break-word',
                flexGrow: 1
            }}
        >
            {value}
        </Typography>
    </Box>
);

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

    // --- වැදගත්ම නිවැරදි කිරීම (CRITICAL FIX) ---
    // ඛණ්ඩාංක null හෝ undefined ද කියා පරීක්ෂා කිරීම.
    // එසේ නම්, පද්ධතිය crash නොවී Marker එක පෙන්වීම මඟ හරියි.
    if (marker.latitude === null || marker.latitude === undefined ||
        marker.longitude === null || marker.longitude === undefined) {
        console.warn(`Skipping render for Marker ID ${marker.id} due to missing coordinates.`);
        return null;
    }

    return (
        <Marker
            position={[marker.latitude, marker.longitude]}
            icon={icon}
            draggable={isDraggable}
            eventHandlers={eventHandlers}
            ref={markerRef}
        >
            <Popup>
                <Box sx={{ width: 220, p: 1 }}>
                    <Typography variant="h6" component="div" sx={{
                        fontWeight: 'bold',
                        overflowWrap: 'break-word',
                        mb: 1,
                        px: 1
                    }}>
                        {marker.name}
                    </Typography>

                    <Divider />

                    <Stack spacing={0.5} sx={{ my: 1, px: 1 }}>
                        <DetailRow label="Client" value={customer.clientName} />
                        <DetailRow label="Total" value={`${(marker.totalVolume || 0).toFixed(2)} m³`} />
                        <DetailRow label="Rem." value={`${(marker.remainingVolume || 0).toFixed(2)} m³`} />
                        <DetailRow label="Status" value={marker.isActive ? 'Active' : 'Inactive'} />
                    </Stack>

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