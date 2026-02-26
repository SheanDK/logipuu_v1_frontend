// frontend/src/components/chip-order/ChipTitleModal.tsx

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, TextField, Autocomplete, Stack, Box, Typography,
    Divider, MenuItem, Checkbox, FormControlLabel, Switch
} from '@mui/material';

import { useNotification } from '@/contexts/NotificationContext';
import { chipTitleService } from '@/services/chipTitleService';
import * as clientService from '@/services/clientService';
import { fetchAllTimberStacks } from '@/services/timberStackService';
import { fetchAllDropoffLocations } from '@/services/unloadingSiteService';
import apiClient from '@/services/apiClient';
import { useTranslation } from '@/i18n/useTranslation';
import type { IBackendClient, IBackendPuulaani, IBackendPurkupaikkaResponse, IChipTitleFormData } from '@/types';
import NewAreaModal from './NewAreaModal';

const ChipTitleModal = ({ open, onClose, onSuccess, titleData }: any) => {
    const { t } = useTranslation(['chip-management', 'common']);
    const { showNotification } = useNotification();

    const infoSuggestions = (t('chip-management:modal.infoSuggestions', { returnObjects: true }) as unknown as string[]) || [];

    const [step, setStep] = useState<'form' | 'summary'>('form');
    const [customers, setCustomers] = useState<IBackendClient[]>([]);
    const [origins, setOrigins] = useState<IBackendPuulaani[]>([]);
    const [destinations, setDestinations] = useState<IBackendPurkupaikkaResponse[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [newAreaModal, setNewAreaModal] = useState({ open: false, type: 'Loading' });

    const [formData, setFormData] = useState<IChipTitleFormData>({
        title_id: '',
        title_number: '',
        customer_id: '',
        loading_point_id: '',
        unloading_point_id: '',
        product_number: '',
        title_name: '',
        abbreviation: '',
        invoicing_basis: 'Tons',
        driver_instructions: '',
        req_pcs: false,
        req_m3: false,
        req_ton: false,
        req_hr: false,
        req_waiting: false,
        req_km: false,
        req_details: false,
        req_details_info: '',
        is_active: true,
        created_at: ''
    });

    const loadData = useCallback(async () => {
        try {
            const [clients, timber, dropoff, prodRes] = await Promise.all([
                clientService.fetchAllClients(),
                fetchAllTimberStacks({ status: 'all', clientId: '', vehicleId: '', markerTypes: [] }),
                fetchAllDropoffLocations(),
                apiClient.get('/wood-types')
            ]);
            setCustomers(clients || []);
            setOrigins(timber || []);
            setDestinations(dropoff || []);
            setProducts(prodRes.data || []);
        } catch (error) { console.error('Load error:', error); }
    }, []);

    useEffect(() => {
        if (open) {
            setStep('form');
            if (titleData) {
                setFormData({
                    ...titleData,
                    req_pcs: !!titleData.req_pcs,
                    req_m3: !!titleData.req_m3,
                    req_ton: !!titleData.req_ton,
                    req_hr: !!titleData.req_hr,
                    req_waiting: !!titleData.req_waiting,
                    req_km: !!titleData.req_km,
                    req_details: !!titleData.req_details,
                    is_active: titleData.is_active !== false
                });
            } else {
                setFormData({
                    title_id: '', title_number: '', customer_id: '', loading_point_id: '', unloading_point_id: '',
                    product_number: '', title_name: '', abbreviation: '', invoicing_basis: 'Tons',
                    driver_instructions: '', req_pcs: false, req_m3: false, req_ton: false, req_hr: false,
                    req_waiting: false, req_km: false, req_details: false, req_details_info: '',
                    is_active: true, created_at: ''
                });
            }
            loadData();
        }
    }, [open, titleData, loadData]);

    const handleQuickAreaSave = async (data: any) => {
        try {
            const endpoint = data.type === 'Loading' ? '/locations/quick-puulaani' : '/locations/quick-purkupaikka';
            const res = await apiClient.post(endpoint, data);
            if (res.data && res.data.id) {
                await loadData();
                if (data.type === 'Loading') setFormData(prev => ({ ...prev, loading_point_id: String(res.data.id) }));
                else setFormData(prev => ({ ...prev, unloading_point_id: String(res.data.id) }));
                showNotification(t('chip-management:notifications.areaCreateSuccess'), "success");
                setNewAreaModal({ ...newAreaModal, open: false });
            }
        } catch (error) { console.error("Quick Save Error:", error); }
    };

    const handleSave = async () => {
        const payload = {
            ...formData,
            customer_id: Number(formData.customer_id),
            loading_point_id: Number(formData.loading_point_id),
            unloading_point_id: Number(formData.unloading_point_id),
            product_number: Number(formData.product_number),
        };

        try {
            if (titleData) {
                await chipTitleService.update(titleData.title_id, payload);
                showNotification(t('common:notifications.updateSuccess'), "success");
            } else {
                await chipTitleService.create(payload);
                showNotification(t('common:notifications.createSuccess'), "success");
            }
            onSuccess();
            onClose();
        } catch (error: any) { showNotification(t('common:notifications.error'), "error"); }
    };

    const SummaryBox = ({ label, value }: { label: string, value: any }) => (
        <Box sx={{ width: '48%', mb: 1.5 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 'bold', display: 'block', textTransform: 'uppercase', fontSize: '10px' }}>{label}</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{value || '-'}</Typography>
        </Box>
    );

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
            <DialogTitle component="div" sx={{ fontWeight: 'bold', bgcolor: '#f8f9fa', borderBottom: '1px solid #eee' }}>
                <Typography variant="h6" component="span" sx={{ fontWeight: 800 }}>
                    {step === 'form'
                        ? (titleData ? t('chip-management:modal.editTitle') : t('chip-management:modal.createTitle'))
                        : t('chip-management:modal.summaryTitle')}
                </Typography>
            </DialogTitle>

            <DialogContent dividers sx={{ p: 3 }}>
                {step === 'form' ? (
                    <Stack spacing={2.5}>
                        <Stack direction="row" spacing={2} alignItems="center">
                            <TextField label={`${t('chip-management:modal.titleName')} *`} fullWidth size="small" sx={{ flex: 2 }} value={formData.title_name} onChange={(e) => setFormData({ ...formData, title_name: e.target.value })} />
                            <TextField label={t('chip-management:modal.abbr')} fullWidth size="small" sx={{ flex: 1 }} value={formData.abbreviation} onChange={(e) => setFormData({ ...formData, abbreviation: e.target.value })} />
                            <FormControlLabel control={<Switch size="small" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} />} label={t('chip-management:modal.active')} />
                        </Stack>

                        <Stack direction="row" spacing={2}>
                            <Autocomplete options={customers} size="small" sx={{ flex: 1 }} getOptionLabel={(o) => o.asiakkaanNimi || ''} value={customers.find(c => String(c.asiakkaanId) === String(formData.customer_id)) || null} onChange={(_, v) => setFormData({ ...formData, customer_id: v ? String(v.asiakkaanId) : '' })} renderInput={(params) => <TextField {...params} label={`${t('chip-management:modal.customer')} *`} />} />
                            <Autocomplete options={products} size="small" sx={{ flex: 1 }} getOptionLabel={(o) => o.puutavara || ''} value={products.find(p => String(p.puutavaraNro) === String(formData.product_number)) || null} onChange={(_, v) => setFormData({ ...formData, product_number: v ? String(v.puutavaraNro) : '' })} renderInput={(params) => <TextField {...params} label={`${t('chip-management:modal.product')} *`} />} />
                        </Stack>

                        <Stack direction="row" spacing={2}>
                            <Autocomplete
                                fullWidth size="small" sx={{ flex: 1 }}
                                options={origins}
                                getOptionLabel={(o) => o.nimi || ''}
                                filterOptions={(options, params) => {
                                    const filtered = options.filter(o => (o.nimi || '').toLowerCase().includes(params.inputValue.toLowerCase()));
                                    return [{ nimi: `+ ${t('chip-management:modal.newArea')}`, puulaaniId: 'NEW' } as any, ...filtered];
                                }}
                                isOptionEqualToValue={(option, value) => String(option.puulaaniId) === String(value.puulaaniId)}
                                renderOption={(props, option) => {
                                    const { key, ...op } = props;
                                    const isNew = String(option.puulaaniId) === 'NEW';
                                    return <Box component="li" key={option.puulaaniId} {...op} sx={{ fontWeight: isNew ? 'bold' : 'normal', color: isNew ? '#2e7d32' : 'inherit' }}>{option.nimi}</Box>;
                                }}
                                value={origins.find(o => String(o.puulaaniId) === String(formData.loading_point_id)) || null}
                                onChange={(_, v: any) => String(v?.puulaaniId) === 'NEW' ? setNewAreaModal({ open: true, type: 'Loading' }) : setFormData({ ...formData, loading_point_id: v ? String(v.puulaaniId) : '' })}
                                renderInput={(params) => <TextField {...params} label={`${t('chip-management:modal.loadingPoint')} *`} />}
                            />

                            <Autocomplete
                                fullWidth size="small" sx={{ flex: 1 }}
                                options={destinations}
                                getOptionLabel={(o) => o.purkupaikka || ''}
                                filterOptions={(options, params) => {
                                    const filtered = options.filter(o => (o.purkupaikka || '').toLowerCase().includes(params.inputValue.toLowerCase()));
                                    return [{ purkupaikka: `+ ${t('chip-management:modal.newArea')}`, purkupaikkaId: 'NEW' } as any, ...filtered];
                                }}
                                isOptionEqualToValue={(option, value) => String(option.purkupaikkaId) === String(value.purkupaikkaId)}
                                renderOption={(props, option) => {
                                    const { key, ...op } = props;
                                    const isNew = String(option.purkupaikkaId) === 'NEW';
                                    return <Box component="li" key={option.purkupaikkaId} {...op} sx={{ fontWeight: isNew ? 'bold' : 'normal', color: isNew ? '#2e7d32' : 'inherit' }}>{option.purkupaikka}</Box>;
                                }}
                                value={destinations.find(d => String(d.purkupaikkaId) === String(formData.unloading_point_id)) || null}
                                onChange={(_, v: any) => String(v?.purkupaikkaId) === 'NEW' ? setNewAreaModal({ open: true, type: 'Demolition' }) : setFormData({ ...formData, unloading_point_id: v ? String(v.purkupaikkaId) : '' })}
                                renderInput={(params) => <TextField {...params} label={`${t('chip-management:modal.demolitionPoint')} *`} />}
                            />
                        </Stack>

                        <Box sx={{ p: 2.5, border: '1px solid #e0e0e0', borderRadius: '8px', bgcolor: '#fdfdfd' }}>
                            <Typography variant="caption" fontWeight="900" sx={{ color: '#a38f6d', mb: 2, display: 'block', textTransform: 'uppercase' }}>
                                {t('chip-management:modal.requestedInfoHeader')}
                            </Typography>

                            <Stack spacing={2}>
                                <Stack direction="row" spacing={3} alignItems="center" flexWrap="wrap">
                                    <FormControlLabel control={<Checkbox size="small" checked={formData.req_pcs} onChange={(e) => setFormData({ ...formData, req_pcs: e.target.checked })} />} label={<Typography variant="caption">{t('chip-management:modal.pieces')}</Typography>} />
                                    <FormControlLabel control={<Checkbox size="small" checked={formData.req_m3} onChange={(e) => setFormData({ ...formData, req_m3: e.target.checked })} />} label={<Typography variant="caption">{t('chip-management:modal.cubes')}</Typography>} />

                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <Typography variant="caption">{t('chip-management:modal.tons')}:</Typography>
                                        <TextField select size="small" value={formData.req_ton ? 'Taara/Br' : 'Not requested'}
                                            onChange={(e) => setFormData({ ...formData, req_ton: e.target.value !== 'Not requested' })}
                                            sx={{ width: 140, '& .MuiInputBase-input': { py: 0.5, fontSize: '12px' } }}>
                                            <MenuItem value="Not requested">{t('chip-management:modal.notRequested')}</MenuItem>
                                            <MenuItem value="Taara/Br">Taara/Br</MenuItem>
                                            <MenuItem value="Net">Net</MenuItem>
                                        </TextField>
                                    </Stack>

                                    <FormControlLabel control={<Checkbox size="small" checked={formData.req_hr} onChange={(e) => setFormData({ ...formData, req_hr: e.target.checked })} />} label={<Typography variant="caption">{t('chip-management:modal.hours')}</Typography>} />
                                    <FormControlLabel control={<Checkbox size="small" checked={formData.req_waiting} onChange={(e) => setFormData({ ...formData, req_waiting: e.target.checked })} />} label={<Typography variant="caption">{t('chip-management:modal.waiting')}</Typography>} />
                                    <FormControlLabel control={<Checkbox size="small" checked={formData.req_km} onChange={(e) => setFormData({ ...formData, req_km: e.target.checked })} />} label={<Typography variant="caption">{t('chip-management:modal.mileage')}</Typography>} />
                                </Stack>

                                <Divider />

                                <Stack direction="row" spacing={3} alignItems="center">
                                    <FormControlLabel
                                        control={<Checkbox size="small" checked={formData.req_details} onChange={(e) => setFormData({ ...formData, req_details: e.target.checked })} />}
                                        label={<Typography variant="caption">{t('chip-management:modal.furtherInfo')}:</Typography>}
                                    />
                                    {formData.req_details && (
                                        <Stack direction="row" spacing={1} alignItems="center" sx={{ flex: 1 }}>
                                            <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>{t('chip-management:modal.detailsLabel')}:</Typography>
                                            <Autocomplete
                                                freeSolo
                                                fullWidth
                                                size="small"
                                                options={infoSuggestions}
                                                value={formData.req_details_info}
                                                onInputChange={(_, newValue) => setFormData({ ...formData, req_details_info: newValue })}
                                                renderInput={(params) => (
                                                    <TextField
                                                        {...params}
                                                        placeholder={t('chip-management:modal.typeInstructionsPlaceholder')}
                                                        sx={{ '& .MuiInputBase-input': { fontSize: '12px' } }}
                                                    />
                                                )}
                                            />
                                        </Stack>
                                    )}
                                </Stack>
                            </Stack>
                        </Box>

                        <Stack direction="row" spacing={2} alignItems="flex-start">
                            <TextField select label={`${t('chip-management:modal.invoicingBasis')} *`} fullWidth size="small" sx={{ flex: 1 }} value={formData.invoicing_basis} onChange={(e) => setFormData({ ...formData, invoicing_basis: e.target.value })}>
                                <MenuItem value="Tons">{t('chip-management:modal.basis.tons')}</MenuItem>
                                <MenuItem value="M3">{t('chip-management:modal.basis.m3')}</MenuItem>
                                <MenuItem value="pcs">{t('chip-management:modal.basis.pcs')}</MenuItem>
                            </TextField>
                            <TextField label={t('chip-management:modal.instructions')} fullWidth multiline rows={3} sx={{ flex: 2 }} value={formData.driver_instructions} onChange={(e) => setFormData({ ...formData, driver_instructions: e.target.value })} />
                        </Stack>
                    </Stack>
                ) : (
                    <Stack spacing={1}>
                        <Typography variant="subtitle2" sx={{ color: '#a38f6d', fontWeight: 'bold', mb: 2 }}>{t('chip-management:modal.verifyDetails')}:</Typography>
                        <Stack direction="row" flexWrap="wrap" justifyContent="space-between">
                            <SummaryBox label={t('chip-management:modal.titleName')} value={formData.title_name} />
                            <SummaryBox label={t('chip-management:modal.abbr')} value={formData.abbreviation} />
                            <SummaryBox label={t('chip-management:modal.customer')} value={customers.find(c => String(c.asiakkaanId) === String(formData.customer_id))?.asiakkaanNimi} />
                            <SummaryBox label={t('chip-management:modal.product')} value={products.find(p => String(p.puutavaraNro) === String(formData.product_number))?.puutavara} />
                            <SummaryBox label={t('chip-management:modal.loadingPoint')} value={origins.find(o => String(o.puulaaniId) === String(formData.loading_point_id))?.nimi} />
                            <SummaryBox label={t('chip-management:modal.demolitionPoint')} value={destinations.find(d => String(d.purkupaikkaId) === String(formData.unloading_point_id))?.purkupaikka} />
                            <SummaryBox label={t('chip-management:modal.invoicingBasis')} value={formData.invoicing_basis} />
                            <SummaryBox label={t('chip-management:modal.active')} value={formData.is_active ? t('common:yes') : t('common:no')} />
                        </Stack>

                        <Divider sx={{ my: 1.5 }} />

                        <Box>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 'bold', display: 'block', mb: 1, textTransform: 'uppercase' }}>{t('chip-management:modal.requestedDataSummary')}</Typography>
                            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                {[
                                    formData.req_pcs && t('chip-management:modal.pieces'),
                                    formData.req_m3 && t('chip-management:modal.cubes'),
                                    formData.req_ton && t('chip-management:modal.tons'),
                                    formData.req_hr && t('chip-management:modal.hours'),
                                    formData.req_waiting && t('chip-management:modal.waiting'),
                                    formData.req_km && t('chip-management:modal.mileage'),
                                    formData.req_details && `${t('chip-management:modal.info')}: ${formData.req_details_info}`
                                ].filter(Boolean).map((text: any, i) => (
                                    <Box key={i} sx={{ px: 1.5, py: 0.5, bgcolor: '#f0f7ff', borderRadius: '15px', fontSize: '11px', color: '#0070e0', fontWeight: 'bold', border: '1px solid #c2e0ff' }}>{text}</Box>
                                ))}
                            </Stack>
                        </Box>
                    </Stack>
                )}
            </DialogContent>

            <DialogActions sx={{ p: 2, bgcolor: '#f8f9fa' }}>
                <Button onClick={onClose} color="inherit" sx={{ fontWeight: 'bold' }}>{t('common:buttons.cancel')}</Button>
                {step === 'form' ? (
                    <Button variant="contained" onClick={() => setStep('summary')} sx={{ bgcolor: '#a38f6d', borderRadius: '20px', px: 4, fontWeight: 'bold' }}>{t('chip-management:modal.summary')}</Button>
                ) : (
                    <>
                        <Button onClick={() => setStep('form')} sx={{ color: '#a38f6d', fontWeight: 'bold' }}>{t('common:buttons.back')}</Button>
                        <Button variant="contained" onClick={handleSave} sx={{ bgcolor: '#4caf50', borderRadius: '20px', px: 4, fontWeight: 'bold' }}>{t('chip-management:modal.saveItem')}</Button>
                    </>
                )}
            </DialogActions>

            <NewAreaModal
                open={newAreaModal.open}
                type={newAreaModal.type}
                onClose={() => setNewAreaModal({ ...newAreaModal, open: false })}
                onSave={handleQuickAreaSave}
            />
        </Dialog>
    );
};

export default ChipTitleModal;