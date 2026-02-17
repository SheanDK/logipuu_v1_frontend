//frontend/src/components/chip-order/ChipTitleModal.tsx

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
import type { IBackendClient, IBackendPuulaani, IBackendPurkupaikkaResponse } from '@/types';
import NewAreaModal from './NewAreaModal';

interface IChipTitleFormData {
    nimike_nimi: string;
    lyhenne: string;
    asiakas_id: string | number;
    lahto_paikka_id: string | number;
    purku_paikka_id: string | number;
    tuote_nro: string | number;
    tuote_tyyppi_nimi: string;
    laskutusperuste: string;
    ohjeet_kuljettajalle: string;
    req_kpl: boolean;
    req_m3: boolean;
    req_ton: boolean;
    req_h: boolean;
    req_odotus: boolean;
    req_km: boolean;
    aktiivinen: boolean;
}

const ChipTitleModal = ({ open, onClose, onSuccess, titleData }: any) => {
    const { t } = useTranslation(['chip-management']);
    const { showNotification } = useNotification();

    const [step, setStep] = useState<'form' | 'summary'>('form');
    const [customers, setCustomers] = useState<IBackendClient[]>([]);
    const [origins, setOrigins] = useState<IBackendPuulaani[]>([]);
    const [destinations, setDestinations] = useState<IBackendPurkupaikkaResponse[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [newAreaModal, setNewAreaModal] = useState({ open: false, type: 'Loading' });

    const [formData, setFormData] = useState<IChipTitleFormData>({
        nimike_nimi: '',
        lyhenne: '',
        asiakas_id: '',
        lahto_paikka_id: '',
        purku_paikka_id: '',
        tuote_nro: '',
        tuote_tyyppi_nimi: '',
        laskutusperuste: 'Tons',
        ohjeet_kuljettajalle: '',
        req_kpl: false,
        req_m3: false,
        req_ton: false,
        req_h: false,
        req_odotus: false,
        req_km: false,
        aktiivinen: true
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
                    nimike_nimi: titleData.nimikeNimi ?? titleData.nimike_nimi ?? '',
                    lyhenne: titleData.lyhenne ?? '',
                    asiakas_id: titleData.asiakasId ?? titleData.asiakas_id ?? '',
                    lahto_paikka_id: titleData.lahtoPaikkaId ?? titleData.lahto_paikka_id ?? '',
                    purku_paikka_id: titleData.purkuPaikkaId ?? titleData.purku_paikka_id ?? '',
                    tuote_nro: titleData.tuoteNro ?? titleData.tuote_nro ?? '',
                    tuote_tyyppi_nimi: titleData.tuoteTyyppiNimi ?? titleData.tuote_tyyppi_nimi ?? '',
                    laskutusperuste: titleData.laskutusperuste ?? 'Tons',
                    ohjeet_kuljettajalle: titleData.ohjeetKuljettajalle ?? titleData.ohjeet_kuljettajalle ?? '',
                    req_kpl: !!(titleData.reqKpl || titleData.req_kpl),
                    req_m3: !!(titleData.reqM3 || titleData.req_m3),
                    req_ton: !!(titleData.reqTon || titleData.req_ton),
                    req_h: !!(titleData.reqH || titleData.req_h),
                    req_odotus: !!(titleData.reqOdotus || titleData.req_odotus),
                    req_km: !!(titleData.reqKm || titleData.req_km),
                    aktiivinen: titleData.aktiivinen !== false
                });
            } else {
                setFormData({
                    nimike_nimi: '', lyhenne: '', asiakas_id: '', lahto_paikka_id: '', purku_paikka_id: '',
                    tuote_nro: '', tuote_tyyppi_nimi: '', laskutusperuste: 'Tons', ohjeet_kuljettajalle: '',
                    req_kpl: false, req_m3: false, req_ton: false, req_h: false, req_odotus: false, req_km: false,
                    aktiivinen: true
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
                if (data.type === 'Loading') {
                    setFormData(prev => ({ ...prev, lahto_paikka_id: res.data.id }));
                } else {
                    setFormData(prev => ({ ...prev, purku_paikka_id: res.data.id }));
                }
                showNotification(t('notifications.areaCreateSuccess'), "success");
                setNewAreaModal({ ...newAreaModal, open: false });
            }
        } catch (error) {
            console.error("Quick Save Error:", error);
            showNotification(t('notifications.areaCreateError'), "error");
        }
    };

    const handleSave = async () => {
        try {
            if (titleData) {
                await chipTitleService.update(titleData.titleId || titleData.title_id, formData);
                showNotification(t('notifications.titleUpdateSuccess'), "success");
            } else {
                await chipTitleService.create(formData);
                showNotification(t('notifications.titleCreateSuccess'), "success");
            }
            onSuccess();
            onClose();
        } catch (error) {
            showNotification(t('notifications.titleError'), "error");
        }
    };

    const SummaryBox = ({ label, value }: { label: string, value: any }) => (
        <Box sx={{ width: '48%', mb: 2 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 'bold', display: 'block', textTransform: 'uppercase', fontSize: '10px' }}>
                {label}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {value || '-'}
            </Typography>
        </Box>
    );

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
            <DialogTitle component="div" sx={{ fontWeight: 'bold', bgcolor: '#f8f9fa', borderBottom: '1px solid #eee' }}>
                <Typography variant="h6" component="span" sx={{ fontWeight: 700 }}>
                    {step === 'form' ? (titleData ? t('modal.editTitle') : t('modal.createTitle')) : t('modal.summaryTitle')}
                </Typography>
            </DialogTitle>

            <DialogContent dividers>
                {step === 'form' ? (
                    <Stack spacing={3} sx={{ mt: 1 }}>
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                            <TextField label={`${t('modal.titleName')} *`} fullWidth size="small" sx={{ flex: 2 }}
                                value={formData.nimike_nimi || ''}
                                onChange={(e) => setFormData({ ...formData, nimike_nimi: e.target.value })}
                            />
                            <TextField label={t('modal.abbr')} fullWidth size="small" sx={{ flex: 1 }}
                                value={formData.lyhenne || ''}
                                onChange={(e) => setFormData({ ...formData, lyhenne: e.target.value })}
                            />
                            <FormControlLabel
                                control={<Switch size="small" checked={!!formData.aktiivinen} onChange={(e) => setFormData({ ...formData, aktiivinen: e.target.checked })} />}
                                label={t('modal.active')}
                            />
                        </Box>

                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <Autocomplete
                                options={customers} size="small" sx={{ flex: 1 }}
                                getOptionLabel={(o) => o.asiakkaanNimi || ''}
                                isOptionEqualToValue={(option, value) => String(option.asiakkaanId) === String(value.asiakkaanId)}
                                renderOption={(props, option) => { const { key, ...op } = props; return <Box component="li" key={option.asiakkaanId} {...op}>{option.asiakkaanNimi}</Box>; }}
                                value={customers.find(c => String(c.asiakkaanId) === String(formData.asiakas_id)) || null}
                                onChange={(_, v) => setFormData({ ...formData, asiakas_id: v ? v.asiakkaanId : '' })}
                                renderInput={(params) => <TextField {...params} label={`${t('modal.customer')} *`} />}
                            />

                            <Autocomplete
                                options={products} size="small" sx={{ flex: 1 }}
                                getOptionLabel={(o) => o.puutavara || ''}
                                isOptionEqualToValue={(option, value) => String(option.puutavaraNro) === String(value.puutavaraNro)}
                                renderOption={(props, option) => { const { key, ...op } = props; return <Box component="li" key={option.puutavaraNro} {...op}>{option.puutavara}</Box>; }}
                                value={products.find(p => String(p.puutavaraNro) === String(formData.tuote_nro)) || null}
                                onChange={(_, v) => setFormData({ ...formData, tuote_nro: v ? v.puutavaraNro : '' })}
                                renderInput={(params) => <TextField {...params} label={`${t('modal.product')} *`} />}
                            />
                        </Box>

                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <Autocomplete
                                fullWidth size="small" sx={{ flex: 1 }}
                                options={origins}
                                getOptionLabel={(o) => o.nimi || ''}
                                filterOptions={(options, params) => {
                                    const filtered = options.filter(o => (o.nimi || '').toLowerCase().includes(params.inputValue.toLowerCase()));
                                    return [{ nimi: `+ ${t('modal.newArea')}`, puulaaniId: 'NEW' } as any, ...filtered];
                                }}
                                isOptionEqualToValue={(option, value) => String(option.puulaaniId) === String(value.puulaaniId)}
                                renderOption={(props, option) => {
                                    const { key, ...op } = props;
                                    const isNew = String(option.puulaaniId) === 'NEW';
                                    return <Box component="li" key={option.puulaaniId} {...op} sx={{ fontWeight: isNew ? 'bold' : 'normal', color: isNew ? '#2e7d32' : 'inherit' }}>{option.nimi}</Box>;
                                }}
                                value={origins.find(o => String(o.puulaaniId) === String(formData.lahto_paikka_id)) || null}
                                onChange={(_, v: any) => String(v?.puulaaniId) === 'NEW' ? setNewAreaModal({ open: true, type: 'Loading' }) : setFormData({ ...formData, lahto_paikka_id: v ? v.puulaaniId : '' })}
                                renderInput={(params) => <TextField {...params} label={`${t('modal.loadingPoint')} *`} />}
                            />

                            <Autocomplete
                                fullWidth size="small" sx={{ flex: 1 }}
                                options={destinations}
                                getOptionLabel={(o) => o.purkupaikka || ''}
                                filterOptions={(options, params) => {
                                    const filtered = options.filter(o => (o.purkupaikka || '').toLowerCase().includes(params.inputValue.toLowerCase()));
                                    return [{ purkupaikka: `+ ${t('modal.newArea')}`, purkupaikkaId: 'NEW' } as any, ...filtered];
                                }}
                                isOptionEqualToValue={(option, value) => String(option.purkupaikkaId) === String(value.purkupaikkaId)}
                                renderOption={(props, option) => {
                                    const { key, ...op } = props;
                                    const isNew = String(option.purkupaikkaId) === 'NEW';
                                    return <Box component="li" key={option.purkupaikkaId} {...op} sx={{ fontWeight: isNew ? 'bold' : 'normal', color: isNew ? '#2e7d32' : 'inherit' }}>{option.purkupaikka}</Box>;
                                }}
                                value={destinations.find(d => String(d.purkupaikkaId) === String(formData.purku_paikka_id)) || null}
                                onChange={(_, v: any) => String(v?.purkupaikkaId) === 'NEW' ? setNewAreaModal({ open: true, type: 'Demolition' }) : setFormData({ ...formData, purku_paikka_id: v ? v.purkupaikkaId : '' })}
                                renderInput={(params) => <TextField {...params} label={`${t('modal.demolitionPoint')} *`} />}
                            />
                        </Box>

                        <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: '8px', bgcolor: '#fafafa' }}>
                            <Typography variant="caption" fontWeight="bold" sx={{ color: '#a38f6d', mb: 1.5, display: 'block' }}>{t('modal.requestedInfo')}</Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                                {[
                                    { key: 'req_kpl', label: t('modal.pieces') },
                                    { key: 'req_m3', label: t('modal.cubes') },
                                    { key: 'req_ton', label: t('modal.tonsFull') },
                                    { key: 'req_h', label: t('modal.hoursFull') },
                                    { key: 'req_odotus', label: t('modal.waiting') },
                                    { key: 'req_km', label: t('modal.mileageFull') }
                                ].map((f) => (
                                    <FormControlLabel key={f.key} control={<Checkbox size="small" checked={!!(formData as any)[f.key]} onChange={(e) => setFormData({ ...formData, [f.key]: e.target.checked })} />} label={<Typography variant="caption">{f.label}</Typography>} />
                                ))}
                            </Box>
                        </Box>

                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField select label={`${t('modal.invoicingBasis')} *`} fullWidth size="small" sx={{ flex: 1 }} value={formData.laskutusperuste || 'Tons'} onChange={(e) => setFormData({ ...formData, laskutusperuste: e.target.value })}>
                                <MenuItem value="Tons">{t('modal.basis.tons')}</MenuItem><MenuItem value="M3">{t('modal.basis.m3')}</MenuItem><MenuItem value="pcs">{t('modal.basis.pcs')}</MenuItem>
                            </TextField>
                            <TextField
                                label={t('modal.instructions')} fullWidth multiline rows={2} sx={{ flex: 2 }}
                                value={formData.ohjeet_kuljettajalle || ''}
                                onChange={(e) => setFormData({ ...formData, ohjeet_kuljettajalle: e.target.value })}
                            />
                        </Box>
                    </Stack>
                ) : (
                    /* Summary View Logic */
                    <Box sx={{ p: 1 }}>
                        <Typography variant="subtitle1" sx={{ color: '#a38f6d', fontWeight: 'bold', mb: 3 }}>
                            {t('modal.confirmMsg')}
                        </Typography>

                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            <SummaryBox label={t('modal.titleName')} value={formData.nimike_nimi} />
                            <SummaryBox label={t('modal.abbr')} value={formData.lyhenne} />
                            <SummaryBox label={t('modal.customer')} value={customers.find(c => String(c.asiakkaanId) === String(formData.asiakas_id))?.asiakkaanNimi} />
                            <SummaryBox label={t('modal.product')} value={products.find(p => String(p.puutavaraNro) === String(formData.tuote_nro))?.puutavara} />
                            <SummaryBox label={t('modal.loadingPoint')} value={origins.find(o => String(o.puulaaniId) === String(formData.lahto_paikka_id))?.nimi} />
                            <SummaryBox label={t('modal.demolitionPoint')} value={destinations.find(d => String(d.purkupaikkaId) === String(formData.purku_paikka_id))?.purkupaikka} />
                            <SummaryBox label={t('modal.invoicingBasis')} value={formData.laskutusperuste ? t(`modal.basis.${formData.laskutusperuste.toLowerCase()}`) : '-'} />
                            <SummaryBox label={t('modal.active')} value={formData.aktiivinen ? t('modal.active') : '-'} />
                        </Box>

                        <Divider sx={{ my: 2 }} />

                        <Box sx={{ mb: 2 }}>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 'bold', display: 'block', mb: 1 }}>{t('modal.requestedData')}</Typography>
                            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                                {[
                                    formData.req_kpl && t('modal.pieces'),
                                    formData.req_m3 && t('modal.cubes'),
                                    formData.req_ton && t('modal.tonsFull'),
                                    formData.req_h && t('modal.hoursFull'),
                                    formData.req_odotus && t('modal.waiting'),
                                    formData.req_km && t('modal.mileageFull')
                                ].filter(Boolean).map((text: any, i) => (
                                    <Box key={i} sx={{ px: 1.5, py: 0.5, bgcolor: '#f0f7ff', borderRadius: '15px', fontSize: '11px', color: '#0070e0', fontWeight: 'bold', border: '1px solid #c2e0ff' }}>
                                        {text}
                                    </Box>
                                ))}
                            </Stack>
                        </Box>

                        <Box sx={{ mt: 2, p: 2, bgcolor: '#fdfaf5', borderRadius: '8px', border: '1px solid #f0e6d2' }}>
                            <Typography variant="caption" sx={{ color: '#a38f6d', fontWeight: 'bold', display: 'block', mb: 0.5 }}>{t('modal.driverInstructions')}</Typography>
                            <Typography variant="body2" sx={{ fontStyle: 'italic', color: '#555' }}>{formData.ohjeet_kuljettajalle || t('modal.noInstructionsProvided')}</Typography>
                        </Box>
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{ p: 2, bgcolor: '#f8f9fa' }}>
                <Button onClick={onClose} color="inherit">{t('modal.cancel')}</Button>
                {step === 'form' ? (
                    <Button variant="contained" onClick={() => setStep('summary')} sx={{ bgcolor: '#a38f6d', borderRadius: '20px', px: 4 }}>{t('modal.summary')}</Button>
                ) : (
                    <>
                        <Button onClick={() => setStep('form')} sx={{ color: '#a38f6d' }}>{t('modal.back')}</Button>
                        <Button variant="contained" onClick={handleSave} sx={{ bgcolor: '#4caf50', borderRadius: '20px', px: 4 }}>{t('modal.saveItem')}</Button>
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