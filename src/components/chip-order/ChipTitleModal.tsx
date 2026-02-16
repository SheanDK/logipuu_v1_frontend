//frontend/src/components/chip-order/ChipTitleModal.tsx

'use client';

import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, TextField, Stack, Autocomplete, Box, Typography,
    Divider, MenuItem, Checkbox, FormControlLabel, Switch
} from '@mui/material';
import { chipTitleService } from '@/services/chipTitleService';
import * as clientService from '@/services/clientService';
import { fetchAllTimberStacks } from '@/services/timberStackService';
import { fetchAllDropoffLocations } from '@/services/unloadingSiteService';
import apiClient from '@/services/apiClient';
import { useTranslation } from '@/i18n/useTranslation';

const ChipTitleModal = ({ open, onClose, onSuccess, titleData }: any) => {
    const { t } = useTranslation(['chip-management']);
    const [step, setStep] = useState<'form' | 'summary'>('form');
    const [customers, setCustomers] = useState<any[]>([]);
    const [origins, setOrigins] = useState<any[]>([]);
    const [destinations, setDestinations] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        nimike_nimi: '', lyhenne: '', asiakas_id: '', lahto_paikka_id: '', purku_paikka_id: '',
        tuote_nro: '', tuote_tyyppi_nimi: '', laskutusperuste: 'Tons', ohjeet_kuljettajalle: '',
        req_kpl: false, req_m3: false, req_ton: false, req_h: false, req_odotus: false, req_km: false,
        aktiivinen: true
    });

    useEffect(() => {
        if (open) {
            setStep('form');
            if (titleData) {
                // FIXED: Mapping with CamelCase/SnakeCase protection for "Instructions" field
                setFormData({
                    nimike_nimi: titleData.nimikeNimi || titleData.nimike_nimi || '',
                    lyhenne: titleData.lyhenne || '',
                    asiakas_id: titleData.asiakasId || titleData.asiakas_id || '',
                    lahto_paikka_id: titleData.lahtoPaikkaId || titleData.lahto_paikka_id || '',
                    purku_paikka_id: titleData.purkuPaikkaId || titleData.purku_paikka_id || '',
                    tuote_nro: titleData.tuoteNro || titleData.tuote_nro || '',
                    tuote_tyyppi_nimi: titleData.tuoteTyyppiNimi || titleData.tuote_tyyppi_nimi || '',
                    laskutusperuste: titleData.laskutusperuste || 'Tons',
                    ohjeet_kuljettajalle: titleData.ohjeetKuljettajalle || titleData.ohjeet_kuljettajalle || '',
                    req_kpl: !!(titleData.reqKpl || titleData.req_kpl),
                    req_m3: !!(titleData.reqM3 || titleData.req_m3),
                    req_ton: !!(titleData.reqTon || titleData.req_ton),
                    req_h: !!(titleData.reqH || titleData.req_h),
                    req_odotus: !!(titleData.reqOdotus || titleData.req_odotus),
                    req_km: !!(titleData.reqKm || titleData.req_km),
                    aktiivinen: titleData.aktiivinen !== false
                });
            } else {
                resetForm();
            }
            loadData();
        }
    }, [open, titleData]);

    const resetForm = () => {
        setFormData({
            nimike_nimi: '', lyhenne: '', asiakas_id: '', lahto_paikka_id: '', purku_paikka_id: '',
            tuote_nro: '', tuote_tyyppi_nimi: '', laskutusperuste: 'Tons', ohjeet_kuljettajalle: '',
            req_kpl: false, req_m3: false, req_ton: false, req_h: false, req_odotus: false, req_km: false,
            aktiivinen: true
        });
    };

    const loadData = async () => {
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
    };

    const handleSave = async () => {
        try {
            if (titleData) {
                // FIXED: update method call (Ensure this exists in your chipTitleService)
                await chipTitleService.update(titleData.titleId || titleData.title_id, formData);
            } else {
                await chipTitleService.create(formData);
            }
            onSuccess();
            onClose();
        } catch (error) { console.error(error); }
    };

    const SummaryBox = ({ label, value }: { label: string, value: any }) => (
        <Box sx={{ width: '50%', mb: 2 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 'bold', display: 'block' }}>{label}</Typography>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>{value || '-'}</Typography>
        </Box>
    );

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
            <DialogTitle sx={{ fontWeight: 'bold', bgcolor: '#f8f9fa', color: '#333' }}>
                {step === 'form' ? (titleData ? t('chip-management:modal.editTitle') : t('chip-management:modal.createTitle')) : t('chip-management:modal.summaryTitle')}
            </DialogTitle>

            <DialogContent dividers>
                {step === 'form' ? (
                    <Stack spacing={3} sx={{ mt: 1 }}>
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                            <TextField label={`${t('chip-management:modal.titleName')} *`} fullWidth size="small" sx={{ flex: 2 }} value={formData.nimike_nimi} onChange={(e) => setFormData({ ...formData, nimike_nimi: e.target.value })} />
                            <TextField label={t('chip-management:modal.abbr')} fullWidth size="small" sx={{ flex: 1 }} value={formData.lyhenne} onChange={(e) => setFormData({ ...formData, lyhenne: e.target.value })} />
                            <FormControlLabel control={<Switch size="small" checked={formData.aktiivinen} onChange={(e) => setFormData({ ...formData, aktiivinen: e.target.checked })} />} label={t('chip-management:modal.active')} />
                        </Box>

                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <Autocomplete options={customers} size="small" sx={{ flex: 1 }} getOptionLabel={(o) => o.asiakkaanNimi || ''}
                                isOptionEqualToValue={(option, value) => String(option.asiakkaanId) === String(value.asiakkaanId)}
                                renderOption={(props, option) => { const { key, ...op } = props; return <Box component="li" key={option.asiakkaanId} {...op}>{option.asiakkaanNimi}</Box>; }}
                                value={customers.find(c => String(c.asiakkaanId) === String(formData.asiakas_id)) || null}
                                onChange={(_, v) => setFormData({ ...formData, asiakas_id: v ? v.asiakkaanId : '' })}
                                renderInput={(params) => <TextField {...params} label={`${t('chip-management:modal.customer')} *`} />} />

                            <Autocomplete options={products} size="small" sx={{ flex: 1 }} getOptionLabel={(o) => o.puutavara || ''}
                                isOptionEqualToValue={(option, value) => String(option.puutavaraNro) === String(value.puutavaraNro)}
                                renderOption={(props, option) => { const { key, ...op } = props; return <Box component="li" key={option.puutavaraNro} {...op}>{option.puutavara}</Box>; }}
                                value={products.find(p => String(p.puutavaraNro) === String(formData.tuote_nro)) || null}
                                onChange={(_, v) => setFormData({ ...formData, tuote_nro: v ? v.puutavaraNro : '' })}
                                renderInput={(params) => <TextField {...params} label={`${t('chip-management:modal.product')} *`} />} />
                        </Box>

                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <Autocomplete options={origins} size="small" sx={{ flex: 1 }} getOptionLabel={(o) => o.nimi || ''}
                                isOptionEqualToValue={(option, value) => String(option.puulaaniId) === String(value.puulaaniId)}
                                renderOption={(props, option) => { const { key, ...op } = props; return <Box component="li" key={option.puulaaniId} {...op}>{option.nimi}</Box>; }}
                                value={origins.find(o => String(o.puulaaniId) === String(formData.lahto_paikka_id)) || null}
                                onChange={(_, v) => setFormData({ ...formData, lahto_paikka_id: v ? v.puulaaniId : '' })}
                                renderInput={(params) => <TextField {...params} label={`${t('chip-management:modal.loadingPoint')} *`} />} />

                            <Autocomplete options={destinations} size="small" sx={{ flex: 1 }} getOptionLabel={(o) => o.purkupaikka || ''}
                                isOptionEqualToValue={(option, value) => String(option.purkupaikkaId) === String(value.purkupaikkaId)}
                                renderOption={(props, option) => { const { key, ...op } = props; return <Box component="li" key={option.purkupaikkaId} {...op}>{option.purkupaikka}</Box>; }}
                                value={destinations.find(d => String(d.purkupaikkaId) === String(formData.purku_paikka_id)) || null}
                                onChange={(_, v) => setFormData({ ...formData, purku_paikka_id: v ? v.purkupaikkaId : '' })}
                                renderInput={(params) => <TextField {...params} label={`${t('chip-management:modal.demolitionPoint')} *`} />} />
                        </Box>

                        <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: '8px', bgcolor: '#fafafa' }}>
                            <Typography variant="caption" fontWeight="bold" sx={{ color: '#a38f6d', mb: 1.5, display: 'block' }}>{t('chip-management:modal.requestedInfo')}</Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                                {['req_kpl', 'req_m3', 'req_ton', 'req_h', 'req_odotus', 'req_km'].map((field: any) => (
                                    <FormControlLabel key={field} control={<Checkbox size="small" checked={(formData as any)[field]} onChange={(e) => setFormData({ ...formData, [field]: e.target.checked })} />} label={<Typography variant="body2">{field.split('_')[1].toUpperCase()}</Typography>} />
                                ))}
                            </Box>
                        </Box>

                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField select label={t('chip-management:modal.invoicingBasis')} fullWidth size="small" sx={{ flex: 1 }} value={formData.laskutusperuste} onChange={(e) => setFormData({ ...formData, laskutusperuste: e.target.value })}>
                                <MenuItem value="Tons">{t('chip-management:modal.basis.tons')}</MenuItem>
                                <MenuItem value="M3">{t('chip-management:modal.basis.m3')}</MenuItem>
                                <MenuItem value="pcs">{t('chip-management:modal.basis.pcs')}</MenuItem>
                            </TextField>
                            <TextField label={t('chip-management:modal.instructions')} fullWidth multiline rows={2} sx={{ flex: 2 }} value={formData.ohjeet_kuljettajalle} onChange={(e) => setFormData({ ...formData, ohjeet_kuljettajalle: e.target.value })} />
                        </Box>
                    </Stack>
                ) : (
                    <Box sx={{ p: 1 }}>
                        <Typography variant="subtitle1" sx={{ color: '#a38f6d', fontWeight: 'bold', mb: 3 }}>{t('chip-management:modal.confirmMsg')}</Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
                            <SummaryBox label={t('chip-management:modal.titleName')} value={formData.nimike_nimi} />
                            <SummaryBox label={t('chip-management:modal.customer')} value={customers.find(c => String(c.asiakkaanId) === String(formData.asiakas_id))?.asiakkaanNimi} />
                            <SummaryBox label={t('chip-management:table.loading')} value={origins.find(o => String(o.puulaaniId) === String(formData.lahto_paikka_id))?.nimi} />
                            <SummaryBox label={t('chip-management:table.demolition')} value={destinations.find(d => String(d.purkupaikkaId) === String(formData.purku_paikka_id))?.purkupaikka} />
                        </Box>
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="caption" fontWeight="bold">{t('chip-management:modal.instructionsTitle')}:</Typography>
                        <Typography variant="body2" sx={{ fontStyle: 'italic', mt: 1 }}>{formData.ohjeet_kuljettajalle || t('chip-management:modal.noInstructions')}</Typography>
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{ p: 2, bgcolor: '#f8f9fa' }}>
                <Button onClick={onClose} color="inherit">{t('chip-management:modal.cancel')}</Button>
                {step === 'form' ? (
                    <Button variant="contained" onClick={() => setStep('summary')} sx={{ bgcolor: '#a38f6d', borderRadius: '20px', px: 4 }}>{t('chip-management:modal.summary')}</Button>
                ) : (
                    <>
                        <Button onClick={() => setStep('form')} sx={{ color: '#a38f6d' }}>{t('chip-management:modal.back')}</Button>
                        <Button variant="contained" onClick={handleSave} sx={{ bgcolor: '#4caf50', borderRadius: '20px', px: 4 }}>{t('chip-management:modal.save')}</Button>
                    </>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default ChipTitleModal;