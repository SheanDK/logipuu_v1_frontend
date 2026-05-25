// frontend/src/components/map/markers/PuulaaniMarker.tsx
'use client';

import React, { useMemo, useRef, useEffect } from 'react';
import { Marker, Popup } from 'react-leaflet';
import { Box, Typography, Button, Divider, Stack, alpha } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
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

const BROWN = '#a38f6d';
const BROWN_DARK = '#8e7a5a';

const PuulaaniMarker: React.FC<PuulaaniMarkerProps> = ({
    marker, customer, isDraggable, onEdit, onLocationChange, onDoubleClick
}) => {
    const { puulaaniIcon, puulaaniIconSize } = useLayout();
    const icon = getPuulaaniIcon(marker.clientColor, puulaaniIcon, puulaaniIconSize);
    const markerRef = useRef<L.Marker>(null);
    const { t } = useTranslation(['timberDashboard']);

    useEffect(() => {
        if (markerRef.current) {
            if (isDraggable) markerRef.current.dragging?.enable();
            else markerRef.current.dragging?.disable();
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
        dblclick: () => onDoubleClick(marker)
    }), [marker, isDraggable, onLocationChange, onDoubleClick]);

    if (marker.latitude == null || marker.longitude == null) return null;

    return (
        <Marker
            position={[marker.latitude, marker.longitude]}
            icon={icon}
            draggable={isDraggable}
            eventHandlers={eventHandlers}
            ref={markerRef}
        >
            <Popup className="compact-popup" minWidth={230} maxWidth={230}>
                <Box sx={{ width: 230, fontFamily: 'inherit' }}>

                    {/* ── Header ── */}
                    <Box sx={{
                        py: 1.0,
                        px: 1.0,
                        bgcolor: BROWN,
                        textAlign: 'center',
                        borderRadius: '1px 1px 0 0',
                    }}>
                        <Typography
                            variant="subtitle2"
                            fontWeight="bold"
                            noWrap
                            sx={{ color: '#fff', fontSize: '0.85rem', letterSpacing: 0.2 }}
                        >
                            {t('common.titlepopup', { defaultValue: 'Timber Stack Details' })}
                        </Typography>
                    </Box>

                    {/* ── Body rows ── */}
                    <Box sx={{ bgcolor: '#fff', px: 2, pt: 0.5, pb: 0 }}>

                        <PopupRow
                            label={t('common.customer')}
                            value={customer.clientName}
                        />
                        <Divider sx={{ borderColor: '#e0e0e0' }} />

                        <PopupRow
                            label={t('common.total')}
                            value={`${(marker.totalVolume || 0).toFixed(2)} m³`}
                        />
                        <Divider sx={{ borderColor: '#e0e0e0' }} />

                        <PopupRow
                            label={t('common.rem')}
                            value={`${(marker.remainingVolume || 0).toFixed(2)} m³`}
                        />
                        <Divider sx={{ borderColor: '#e0e0e0' }} />

                        {/* Status row */}
                        <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="center"
                            sx={{ py: 0.1 }}
                        >
                            <Typography sx={{ fontSize: '0.8rem', color: '#555' }}>
                                {t('common.status')}
                            </Typography>
                            <Typography
                                sx={{
                                    fontSize: '0.8rem',
                                    fontWeight: 700,
                                    color: marker.isActive ? '#2e7d32' : '#c62828',
                                }}
                            >
                                {marker.isActive ? t('common.active') : t('common.inactive')}
                            </Typography>
                        </Stack>

                    </Box>

                    {/* ── Edit button ── */}
                    <Box sx={{ bgcolor: '#fff', px: 1.0, pb: 1, pt: 0.2 }}>
                        <Button
                            fullWidth
                            variant="contained"
                            size="small"
                            startIcon={<EditIcon sx={{ fontSize: '0.85rem' }} />}
                            onClick={() => onEdit(marker)}
                            sx={{
                                bgcolor: BROWN,
                                color: '#fff',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                letterSpacing: 0.8,
                                py: 0.6,
                                borderRadius: '3px',
                                boxShadow: 'none',
                                textTransform: 'uppercase',
                                '&:hover': {
                                    bgcolor: BROWN_DARK,
                                    boxShadow: 'none',
                                },
                            }}
                        >
                            {t('common.detailsEdit')}
                        </Button>
                    </Box>

                </Box>
            </Popup>
        </Marker>
    );
};

// ── Reusable label/value row ──
const PopupRow = ({ label, value }: { label: string; value: string | number }) => (
    <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="flex-start"
        spacing={2}
        sx={{ py: 0.4, width: '100%' }}
    >
        <Typography
            sx={{
                fontSize: '0.8rem',
                color: '#555',
                flexShrink: 0,
                width: '75px'
            }}
        >
            {label}
        </Typography>
        <Typography
            sx={{
                fontSize: '0.8rem',
                fontWeight: 600,
                color: '#111',
                textAlign: 'right',
                wordBreak: 'break-word',
                flexGrow: 1
            }}
        >
            {value}
        </Typography>
    </Stack>
);

export default PuulaaniMarker;