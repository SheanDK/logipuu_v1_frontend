// frontend/src/components/chip-order/NewAreaModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, TextField, Stack, Box, Typography, Switch,
    FormControlLabel, Autocomplete, IconButton, InputAdornment,
    Divider, Chip, CircularProgress
} from '@mui/material';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import SearchIcon from '@mui/icons-material/Search';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

import * as clientService from '@/services/clientService';
import apiClient from '@/services/apiClient';
import { useTranslation } from '@/i18n/useTranslation';
import type { IBackendClient } from '@/types';

// Leaflet Icon Fix
const markerIcon = new L.Icon({
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

function ChangeView({ center }: { center: L.LatLngExpression }) {
    const map = useMap();
    map.setView(center);
    return null;
}

function LocationMarker({ position, setPosition }: any) {
    useMapEvents({
        click(e) { setPosition(e.latlng); },
    });
    return position ? <Marker position={position} icon={markerIcon} /> : null;
}

const NewAreaModal = ({ open, onClose, onSave, type }: any) => {
    const { t } = useTranslation(['chip-management']);
    const [isOrigin, setIsOrigin] = useState(type === 'Loading');
    const [customers, setCustomers] = useState<IBackendClient[]>([]);
    const [mapCenter, setMapCenter] = useState<L.LatLngExpression>([62.2426, 25.7473]);
    const [pos, setPos] = useState<L.LatLng | null>(new L.LatLng(62.2426, 25.7473));
    const [isSearching, setIsSearching] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        address: '',
        instructions: '',
        radius: 500,
        customer_ids: [] as string[]
    });

    useEffect(() => {
        if (open) {
            clientService.fetchAllClients().then(setCustomers);
            setIsOrigin(type === 'Loading');
        }
    }, [open, type]);

    // Address Search
    const handleAddressSearch = async () => {
        if (!formData.address || isSearching) return;

        setIsSearching(true);
        try {
            const response = await apiClient.get(
                `/locations/search-address?q=${encodeURIComponent(formData.address)}`
            );

            const data = response.data;
            if (data && data.length > 0) {
                const newPos = new L.LatLng(parseFloat(data[0].lat), parseFloat(data[0].lon));
                setPos(newPos);
                setMapCenter([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
            }
        } catch (error) {
            console.error("Geocoding error:", error);
        } finally {
            setIsSearching(false);
        }
    };

    const handleLocalSave = async () => {
        if (!formData.name || !pos || formData.customer_ids.length === 0) {
            alert(t('modal.fillRequired') || "Please fill all required fields");
            return;
        }

        await onSave({
            name: formData.name,
            address: formData.address,
            instructions: formData.instructions,
            customer_ids: formData.customer_ids,
            lat: pos.lat,
            lng: pos.lng,
            type: isOrigin ? 'Loading' : 'Demolition'
        });
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
            <DialogTitle component="div" sx={{ fontWeight: 'bold', bgcolor: '#f8f9fa', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee' }}>
                <Typography variant="h6" component="span" sx={{ fontWeight: 800 }}>{t('modal.newArea')}</Typography>
                <FormControlLabel
                    control={<Switch checked={isOrigin} onChange={(e) => setIsOrigin(e.target.checked)} sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#a38f6d' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#a38f6d' } }} />}
                    label={isOrigin ? t('modal.loadingPoint') : t('modal.demolitionPoint')}
                />
            </DialogTitle>

            <DialogContent dividers>
                <Box sx={{ display: 'flex', gap: 3, height: '550px' }}>
                    {/* LEFT SIDE: FORM */}
                    <Stack spacing={2.5} sx={{ flex: 1, overflowY: 'auto', pr: 1, pt: 1 }}>
                        <TextField
                            label={`${t('modal.titleName')} *`}
                            fullWidth size="small"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />

                        <TextField
                            label={t('modal.address')}
                            fullWidth size="small"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            onKeyPress={(e) => e.key === 'Enter' && handleAddressSearch()}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton onClick={handleAddressSearch} size="small" color="primary" disabled={isSearching}>
                                            {isSearching ? <CircularProgress size={20} /> : <SearchIcon />}
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }}
                        />

                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField label={t('modal.coordinates')} fullWidth size="small" disabled
                                value={pos ? `${pos.lat.toFixed(5)}, ${pos.lng.toFixed(5)}` : ''}
                                InputProps={{ startAdornment: <InputAdornment position="start"><MyLocationIcon fontSize="small" /></InputAdornment> }}
                            />
                            <TextField label={`${t('modal.radius')} (m)`} type="number" size="small" sx={{ width: '150px' }} value={formData.radius} onChange={(e) => setFormData({ ...formData, radius: Number(e.target.value) })} />
                        </Box>

                        <TextField label={t('modal.instructions')} multiline rows={3} fullWidth size="small" value={formData.instructions} onChange={(e) => setFormData({ ...formData, instructions: e.target.value })} />

                        <Autocomplete
                            multiple
                            options={customers}
                            getOptionLabel={(o) => o.asiakkaanNimi || ''}
                            isOptionEqualToValue={(option, value) => String(option.asiakkaanId) === String(value.asiakkaanId)}
                            value={customers.filter(c => formData.customer_ids.includes(String(c.asiakkaanId)))}
                            onChange={(_, newValue) => {
                                setFormData({ ...formData, customer_ids: newValue.map(v => String(v.asiakkaanId)) });
                            }}
                            renderInput={(params) => (
                                <TextField {...params} label={`${t('modal.customerCode')} *`} size="small" />
                            )}
                            renderTags={(tagValue, getTagProps) =>
                                tagValue.map((option, index) => {
                                    const { key, ...tagProps } = getTagProps({ index });
                                    return <Chip key={key} label={option.asiakkaanNimi} size="small" {...tagProps} />;
                                })
                            }
                        />

                        <Divider />

                        <Box>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Typography variant="subtitle2" fontWeight="bold">{t('modal.files')}</Typography>
                                <Button variant="contained" size="small" startIcon={<CloudUploadIcon />} sx={{ bgcolor: '#00bcd4' }}>{t('modal.upload')}</Button>
                            </Stack>
                            <Box sx={{ mt: 1, p: 4, border: '1px solid #eee', borderRadius: '4px', textAlign: 'center', bgcolor: '#fafafa' }}>
                                <Typography variant="caption" color="textDisabled">{t('modal.noFiles')}</Typography>
                            </Box>
                        </Box>
                    </Stack>

                    {/* RIGHT SIDE: MAP */}
                    <Box sx={{ flex: 1.2, border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden', position: 'relative' }}>
                        <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                            <ChangeView center={mapCenter} />
                            <LocationMarker position={pos} setPosition={setPos} />
                        </MapContainer>
                        <Box sx={{ position: 'absolute', bottom: 10, left: 10, zIndex: 1000, bgcolor: 'rgba(255,255,255,0.9)', p: 1, borderRadius: '4px', border: '1px solid #ccc' }}>
                            <Typography variant="caption" fontWeight="bold">{t('modal.clickMap') || "Click map to set precise location"}</Typography>
                        </Box>
                    </Box>
                </Box>
            </DialogContent>

            <DialogActions sx={{ p: 2, bgcolor: '#f8f9fa' }}>
                <Button onClick={onClose} color="inherit" sx={{ fontWeight: 'bold' }}>{t('modal.cancel') || "CANCEL"}</Button>
                <Button
                    variant="contained"
                    onClick={handleLocalSave}
                    sx={{ bgcolor: '#a38f6d', '&:hover': { bgcolor: '#8c7a5d' }, borderRadius: '25px', px: 4, fontWeight: 'bold' }}
                >
                    {t('modal.saveArea') || "SAVE AREA"}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default NewAreaModal;