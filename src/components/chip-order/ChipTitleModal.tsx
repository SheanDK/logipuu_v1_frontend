// frontend/src/components/chip-order/ChipTitleModal.tsx

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, TextField, Autocomplete, Stack, Box, Typography,
    Divider, MenuItem, Checkbox, FormControlLabel, Switch, useTheme, alpha
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
    const theme = useTheme();
    const isDarkMode = theme.palette.mode === 'dark';

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

    // Retrieving data for update
    useEffect(() => {
        if (open) {
            setStep('form');
            if (titleData) {
                setFormData({
                    title_id: titleData.title_id ?? titleData.titleId ?? '',
                    title_number: titleData.title_number ?? titleData.titleNumber ?? '',
                    customer_id: String(titleData.customer_id ?? titleData.customerId ?? ''),
                    loading_point_id: String(titleData.loading_point_id ?? titleData.loadingPointId ?? ''),
                    unloading_point_id: String(titleData.unloading_point_id ?? titleData.unloadingPointId ?? ''),
                    product_number: String(titleData.product_number ?? titleData.productNumber ?? ''),
                    title_name: titleData.title_name ?? titleData.titleName ?? '',
                    abbreviation: titleData.abbreviation ?? '',
                    invoicing_basis: titleData.invoicing_basis ?? titleData.invoicingBasis ?? 'Tons',
                    driver_instructions: titleData.driver_instructions ?? titleData.driverInstructions ?? '',
                    req_pcs: !!(titleData.req_pcs ?? titleData.reqPcs),
                    req_m3: !!(titleData.req_m3 ?? titleData.reqM3),
                    req_ton: !!(titleData.req_ton ?? titleData.reqTon),
                    req_hr: !!(titleData.req_hr ?? titleData.reqHr),
                    req_waiting: !!(titleData.req_waiting ?? titleData.reqWaiting),
                    req_km: !!(titleData.req_km ?? titleData.reqKm),
                    req_details: !!(titleData.req_details ?? titleData.reqDetails),
                    req_details_info: titleData.req_details_info ?? titleData.reqDetailsInfo ?? '',
                    is_active: titleData.is_active !== false,
                    created_at: titleData.created_at ?? ''
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
                await chipTitleService.update(titleData.title_id || titleData.titleId, payload);
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
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 'bold', display: 'block', textTransform: 'uppercase', fontSize: '10px' }}>{label}</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>{value || '-'}</Typography>
        </Box>
    );

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" PaperProps={{ sx: { borderRadius: '12px' } }}>
            <DialogTitle component="div" sx={{ fontWeight: 'bold', bgcolor: isDarkMode ? 'background.paper' : '#f8f9fa', borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography variant="h6" component="span" sx={{ fontWeight: 800, color: theme.palette.text.primary }}>
                    {step === 'form'
                        ? (titleData ? t('chip-management:modal.editTitle') : t('chip-management:modal.createTitle'))
                        : t('chip-management:modal.summaryTitle')}
                </Typography>
            </DialogTitle>

            <DialogContent dividers sx={{ p: 3, bgcolor: theme.palette.background.default }}>
                {step === 'form' ? (
                    <Stack spacing={2.5}>
                        {/* Title & Abbr Section */}
                        <Stack direction="row" spacing={2} alignItems="center">
                            <TextField label={`${t('chip-management:modal.titleName')} *`} fullWidth size="small" sx={{ flex: 2 }} value={formData.title_name} onChange={(e) => setFormData({ ...formData, title_name: e.target.value })} />
                            <TextField label={t('chip-management:modal.abbr')} fullWidth size="small" sx={{ flex: 1 }} value={formData.abbreviation} onChange={(e) => setFormData({ ...formData, abbreviation: e.target.value })} />
                            <FormControlLabel control={<Switch size="small" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} />} label={t('chip-management:modal.active')} />
                        </Stack>

                        {/* Customer & Product Section */}
                        <Stack direction="row" spacing={2}>
                            <Autocomplete options={customers} size="small" sx={{ flex: 1 }} getOptionLabel={(o) => o.asiakkaanNimi || ''} value={customers.find(c => String(c.asiakkaanId) === String(formData.customer_id)) || null} onChange={(_, v) => setFormData({ ...formData, customer_id: v ? String(v.asiakkaanId) : '' })} renderInput={(params) => <TextField {...params} label={`${t('chip-management:modal.customer')} *`} />} />
                            <Autocomplete options={products} size="small" sx={{ flex: 1 }} getOptionLabel={(o) => o.puutavara || ''} value={products.find(p => String(p.puutavaraNro) === String(formData.product_number)) || null} onChange={(_, v) => setFormData({ ...formData, product_number: v ? String(v.puutavaraNro) : '' })} renderInput={(params) => <TextField {...params} label={`${t('chip-management:modal.product')} *`} />} />
                        </Stack>

                        {/* Origins & Destinations Section */}
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
                                    return <Box component="li" key={option.puulaaniId} {...op} sx={{ fontWeight: isNew ? 'bold' : 'normal', color: isNew ? theme.palette.success.main : 'inherit' }}>{option.nimi}</Box>;
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
                                    return <Box component="li" key={option.purkupaikkaId} {...op} sx={{ fontWeight: isNew ? 'bold' : 'normal', color: isNew ? theme.palette.success.main : 'inherit' }}>{option.purkupaikka}</Box>;
                                }}
                                value={destinations.find(d => String(d.purkupaikkaId) === String(formData.unloading_point_id)) || null}
                                onChange={(_, v: any) => String(v?.purkupaikkaId) === 'NEW' ? setNewAreaModal({ open: true, type: 'Demolition' }) : setFormData({ ...formData, unloading_point_id: v ? String(v.purkupaikkaId) : '' })}
                                renderInput={(params) => <TextField {...params} label={`${t('chip-management:modal.demolitionPoint')} *`} />}
                            />
                        </Stack>

                        {/* Information Requested Box (SS1 Logic) */}
                        <Box sx={{ p: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: '8px', bgcolor: isDarkMode ? alpha(theme.palette.common.white, 0.03) : '#fdfdfd' }}>
                            <Typography variant="caption" fontWeight="900" sx={{ color: theme.palette.primary.main, mb: 2, display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                {t('chip-management:modal.requestedInfoHeader')}
                            </Typography>

                            <Stack spacing={2}>
                                <Stack direction="row" spacing={3} alignItems="center" flexWrap="wrap">
                                    <FormControlLabel control={<Checkbox size="small" checked={formData.req_pcs} onChange={(e) => setFormData({ ...formData, req_pcs: e.target.checked })} />} label={<Typography variant="caption">{t('chip-management:modal.pieces')}</Typography>} />
                                    <FormControlLabel control={<Checkbox size="small" checked={formData.req_m3} onChange={(e) => setFormData({ ...formData, req_m3: e.target.checked })} />} label={<Typography variant="caption">{t('chip-management:modal.cubes')}</Typography>} />

                                    {/* Tons Style Dropdown */}
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
                                    <FormControlLabel control={<Checkbox size="small" checked={formData.req_details} onChange={(e) => setFormData({ ...formData, req_details: e.target.checked })} />} label={<Typography variant="caption">{t('chip-management:modal.furtherInfo')}:</Typography>} />
                                    {formData.req_details && (
                                        <Stack direction="row" spacing={1} alignItems="center" sx={{ flex: 1 }}>
                                            <Autocomplete
                                                freeSolo
                                                fullWidth
                                                size="small"
                                                options={infoSuggestions}
                                                value={formData.req_details_info}
                                                onInputChange={(_, newValue) => setFormData({ ...formData, req_details_info: newValue })}
                                                renderInput={(params) => (
                                                    <TextField {...params} placeholder={t('chip-management:modal.typeInstructionsPlaceholder')} sx={{ '& .MuiInputBase-input': { fontSize: '12px' } }} />
                                                )}
                                            />
                                        </Stack>
                                    )}
                                </Stack>
                            </Stack>
                        </Box>

                        {/* Invoicing & Instructions Section */}
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
                    /* Summary View Logic */
                    <Stack spacing={1}>
                        <Typography variant="subtitle2" sx={{ color: theme.palette.primary.main, fontWeight: 'bold', mb: 2 }}>{t('chip-management:modal.verifyDetails')}:</Typography>
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
                            <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 'bold', display: 'block', mb: 1, textTransform: 'uppercase' }}>{t('chip-management:modal.requestedDataSummary')}</Typography>
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
                                    <Box key={i} sx={{ px: 1.5, py: 0.5, bgcolor: isDarkMode ? alpha(theme.palette.primary.main, 0.1) : '#f0f7ff', borderRadius: '15px', fontSize: '11px', color: isDarkMode ? theme.palette.primary.light : '#0070e0', fontWeight: 'bold', border: '1px solid', borderColor: isDarkMode ? theme.palette.primary.main : '#c2e0ff' }}>{text}</Box>
                                ))}
                            </Stack>
                        </Box>
                    </Stack>
                )}
            </DialogContent>

            <DialogActions sx={{ p: 2, bgcolor: isDarkMode ? 'background.paper' : '#f8f9fa' }}>
                <Button onClick={onClose} color="inherit" sx={{ fontWeight: 'bold' }}>{t('common:buttons.cancel')}</Button>
                {step === 'form' ? (
                    <Button variant="contained" onClick={() => setStep('summary')} sx={{ bgcolor: theme.palette.primary.main, borderRadius: '20px', px: 4, fontWeight: 'bold' }}>{t('chip-management:modal.summary')}</Button>
                ) : (
                    <>
                        <Button onClick={() => setStep('form')} sx={{ color: theme.palette.primary.main, fontWeight: 'bold' }}>{t('common:buttons.back')}</Button>
                        <Button variant="contained" onClick={handleSave} sx={{ bgcolor: theme.palette.success.main, borderRadius: '20px', px: 4, fontWeight: 'bold', '&:hover': { bgcolor: theme.palette.success.dark } }}>{t('chip-management:modal.saveItem')}</Button>
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