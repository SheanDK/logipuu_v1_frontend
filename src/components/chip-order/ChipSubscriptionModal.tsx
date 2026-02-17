//frontend\src\components\chip-order\ChipSubscriptionModal.tsx

'use client';

import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, TextField, Autocomplete, Stack, Box, Typography,
    Tabs, Tab, FormControlLabel, Checkbox, MenuItem, Divider,
    Radio, RadioGroup, IconButton
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import dayjs, { Dayjs } from 'dayjs';

// Icons
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';

// Components & Services
import chipService from '@/services/chipService';
import { chipTitleService } from '@/services/chipTitleService';
import { useTranslation } from '@/i18n/useTranslation';
import { useParams } from 'next/navigation';
import DeleteConfirmationDialog from '../common/DeleteConfirmationDialog';

const ChipSubscriptionModal = ({ open, onClose, onSuccess, initialData }: any) => {
    const { t } = useTranslation(['chip-management']);
    const { lng } = useParams();
    const [titles, setTitles] = useState<any[]>([]);
    const [tabValue, setTabValue] = useState(0);
    const [selectedDate, setSelectedDate] = useState<Dayjs | null>(dayjs());

    // 1. FIXED: නව Dialog එක සඳහා අවශ්‍ය States
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    const initialDistribution = {
        Monday: { qty: 0, info: '' }, Tuesday: { qty: 0, info: '' }, Wednesday: { qty: 0, info: '' },
        Thursday: { qty: 0, info: '' }, Friday: { qty: 0, info: '' }, Saturday: { qty: 0, info: '' }, Sunday: { qty: 0, info: '' },
    };

    const [formData, setFormData] = useState({
        title_id: '', flexibility_type: 'No Flexibility', weeks_left: 1, pcs_per_day: 0,
        valid_until_notice: false, repetition_type: 'repetition', pvm_loppu: '', repeat_every_day: 0, further_info: '',
        distribution: initialDistribution
    });

    useEffect(() => {
        if (open) {
            chipTitleService.getAll().then(setTitles);
            if (initialData) {
                const rawDist = initialData.weekly_distribution || initialData.weeklyDistribution || {};
                const dbDist = typeof rawDist === 'string' ? JSON.parse(rawDist) : rawDist;
                const mergedDist = { ...initialDistribution };
                Object.keys(dbDist).forEach((key) => {
                    const normalizedKey = key.charAt(0).toUpperCase() + key.slice(1).toLowerCase();
                    if (mergedDist.hasOwnProperty(normalizedKey)) {
                        const val = dbDist[key];
                        (mergedDist as any)[normalizedKey] = {
                            qty: typeof val === 'object' ? (val.qty || 0) : (val || 0),
                            info: typeof val === 'object' ? (val.info || '') : ''
                        };
                    }
                });
                setFormData({
                    title_id: initialData.titleId || initialData.title_id || '',
                    flexibility_type: initialData.flexibility_type || 'No Flexibility',
                    weeks_left: initialData.weeksFull || initialData.weeks_full || 0,
                    pcs_per_day: initialData.pcsPerDay || initialData.pcs_per_day || 0,
                    valid_until_notice: !!initialData.valid_until_notice,
                    repetition_type: initialData.pvm_loppu ? 'end_date' : 'repetition',
                    pvm_loppu: initialData.pvm_loppu || '',
                    repeat_every_day: initialData.repeat_every_day || 0,
                    further_info: initialData.further_info || initialData.lisatiedot || '',
                    distribution: mergedDist
                });
                if (initialData.pvm_alku) setSelectedDate(dayjs(initialData.pvm_alku));
                setTabValue(2);
            } else {
                resetFormState();
            }
        }
    }, [open, initialData]);

    const resetFormState = () => {
        setFormData({
            title_id: '', flexibility_type: 'No Flexibility', weeks_left: 1, pcs_per_day: 0,
            valid_until_notice: false, repetition_type: 'repetition', pvm_loppu: '', repeat_every_day: 0, further_info: '',
            distribution: initialDistribution
        });
        setSelectedDate(dayjs());
        setTabValue(0);
    };

    // 2. FIXED: Delete Handlers
    const handleDeleteDialogOpen = () => setDeleteDialogOpen(true);
    const handleDeleteDialogClose = () => setDeleteDialogOpen(false);

    const handleDeleteConfirm = async () => {
        if (!initialData?.orderId) return;
        try {
            await chipService.deleteOrder(initialData.orderId);
            handleDeleteDialogClose();
            onSuccess(t('notifications.deleteSuccess'), "success");
            onClose();
        } catch (err) {
            onSuccess(t('notifications.error'), "error");
        }
    };

    const handleAdjustAllDays = (amount: number) => {
        const newDist = { ...formData.distribution };
        Object.keys(newDist).forEach((day) => {
            const currentQty = (newDist as any)[day].qty || 0;
            (newDist as any)[day].qty = Math.max(0, Number(currentQty) + amount);
        });
        setFormData({ ...formData, distribution: newDist });
    };

    const handleDayChange = (day: string, field: 'qty' | 'info', value: any) => {
        setFormData(prev => ({
            ...prev,
            distribution: { ...prev.distribution, [day]: { ...(prev.distribution as any)[day], [field]: value } }
        }));
    };

    const handleSave = async () => {
        try {
            const selectedTitle = titles.find(t => String(t.titleId || t.title_id) === String(formData.title_id));
            let totalTavoite = tabValue === 2
                ? Object.values(formData.distribution).reduce((a, b) => a + Number(b.qty), 0) * formData.weeks_left
                : formData.pcs_per_day * (tabValue === 0 ? 5 : 7) * formData.weeks_left;

            const payload = {
                ...formData,
                pvm_alku: selectedDate?.format('YYYY-MM-DD'),
                asiakas_id: selectedTitle?.asiakasId || selectedTitle?.asiakas_id,
                tuote_tyyppi: selectedTitle?.productName || '',
                kuormia_tavoite: totalTavoite,
                weekly_distribution: formData.distribution
            };

            if (initialData) await chipService.updateOrder(initialData.orderId, payload);
            else await chipService.createOrder(payload);

            onSuccess(initialData ? t('notifications.updateSuccess') : t('notifications.createSuccess'), "success");
            onClose();
        } catch (err) { console.error(err); }
    };

    const dayLabels = [
        { key: 'mon', name: 'Monday' }, { key: 'tue', name: 'Tuesday' }, { key: 'wed', name: 'Wednesday' },
        { key: 'thu', name: 'Thursday' }, { key: 'fri', name: 'Friday' }, { key: 'sat', name: 'Saturday' }, { key: 'sun', name: 'Sunday' }
    ];

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={lng === 'fi' ? 'fi' : 'en-gb'}>
            <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
                <DialogTitle component="div" sx={{ fontWeight: 'bold', bgcolor: '#f8f9fa', borderBottom: '1px solid #eee', color: '#333' }}>
                    <Typography variant="h6" component="span" fontWeight="bold">
                        {initialData ? t('chip-management:orderModal.editTitle') : t('chip-management:orderModal.createTitle')}
                    </Typography>
                </DialogTitle>

                <DialogContent dividers sx={{ p: 0 }}>
                    <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ px: 2, pt: 1, '& .MuiTabs-indicator': { backgroundColor: '#a38f6d' }, '& .MuiTab-root.Mui-selected': { color: '#a38f6d' } }}>
                        <Tab label={t('orderModal.tabs.monFri')} sx={{ fontWeight: 'bold', fontSize: '12px' }} />
                        <Tab label={t('orderModal.tabs.maSu')} sx={{ fontWeight: 'bold', fontSize: '12px' }} />
                        <Tab label={t('orderModal.tabs.free')} sx={{ fontWeight: 'bold', fontSize: '12px' }} />
                    </Tabs>
                    <Divider />

                    <Stack spacing={2.5} sx={{ p: 3 }}>
                        {/* Common Header Fields */}
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField label={t('orderModal.startDate')} type="date" size="small" sx={{ flex: 1 }} InputLabelProps={{ shrink: true }}
                                value={selectedDate?.format('YYYY-MM-DD')} onChange={(e) => setSelectedDate(dayjs(e.target.value))} />

                            <Autocomplete sx={{ flex: 2 }} size="small" options={titles} getOptionLabel={(o) => o.nimikeNimi || ''}
                                isOptionEqualToValue={(o, v) => String(o.titleId || o.title_id) === String(v.titleId || v.title_id)}
                                renderOption={(props, option) => { const { key, ...op } = props; return <Box component="li" key={option.titleId || option.title_id} {...op}>{option.nimikeNimi}</Box>; }}
                                value={titles.find(t => String(t.titleId || t.title_id) === String(formData.title_id)) || null}
                                onChange={(_, v) => setFormData({ ...formData, title_id: v ? (v.titleId || v.title_id) : '' })}
                                renderInput={(p) => <TextField {...p} label={t('orderModal.title')} />} />

                            <TextField select label={t('orderModal.flex')} size="small" sx={{ flex: 1.2 }} value={formData.flexibility_type} onChange={(e) => setFormData({ ...formData, flexibility_type: e.target.value })}>
                                <MenuItem value="No Flexibility">{t('flexOptions.noFlex')}</MenuItem>
                                <MenuItem value="Within a week">{t('flexOptions.withinWeek')}</MenuItem>
                            </TextField>
                        </Box>

                        {/* TABS Logic ... (මීට පෙර ලියූ logic එලෙසම පවතී) */}
                        {tabValue === 2 ? (
                            <Box sx={{ display: 'flex', gap: 3 }}>
                                <Stack spacing={2} sx={{ flex: 1.2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                                        <RadioGroup row value={formData.repetition_type} onChange={(e) => setFormData({ ...formData, repetition_type: e.target.value })}>
                                            <FormControlLabel value="repetition" control={<Radio size="small" sx={{ color: '#a38f6d' }} />} label={<Typography variant="caption">{t('orderModal.repetition')}</Typography>} />
                                            <FormControlLabel value="end_date" control={<Radio size="small" sx={{ color: '#a38f6d' }} />} label={<Typography variant="caption">{t('orderModal.endDate')}</Typography>} />
                                        </RadioGroup>
                                        <Box sx={{ bgcolor: '#fdfaf5', p: 0.5, borderRadius: '8px', border: '1px solid #eee', display: 'flex', alignItems: 'center' }}>
                                            <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#a38f6d', px: 1 }}>{t('orderModal.allDays')}:</Typography>
                                            <IconButton size="small" onClick={() => handleAdjustAllDays(-1)} sx={{ color: '#d32f2f' }}><RemoveCircleOutlineIcon fontSize="small" /></IconButton>
                                            <IconButton size="small" onClick={() => handleAdjustAllDays(1)} sx={{ color: '#2e7d32' }}><AddCircleOutlineIcon fontSize="small" /></IconButton>
                                        </Box>
                                    </Box>

                                    <Box sx={{ border: '1px solid #eee', borderRadius: '8px', overflow: 'hidden' }}>
                                        {dayLabels.map((day) => (
                                            <Box key={day.name} sx={{ display: 'flex', borderBottom: '1px solid #f5f5f5', '&:last-child': { borderBottom: 0 } }}>
                                                <Box sx={{ width: 80, bgcolor: '#fafafa', p: 1, borderRight: '1px solid #eee', display: 'flex', alignItems: 'center' }}>
                                                    <Typography variant="caption" sx={{ fontSize: '10px', fontWeight: 'bold' }}>{t(`days.${day.key}`)}</Typography>
                                                </Box>
                                                <TextField variant="standard" size="small" type="number" sx={{ width: 50, px: 1, '& input': { textAlign: 'center' } }}
                                                    value={(formData.distribution as any)[day.name].qty} onChange={(e) => handleDayChange(day.name, 'qty', e.target.value)} />
                                                <TextField placeholder={t('orderModal.dailyInfoPlaceholder')} fullWidth variant="standard" sx={{ px: 1, '& input': { fontSize: '12px' } }}
                                                    value={(formData.distribution as any)[day.name].info} onChange={(e) => handleDayChange(day.name, 'info', e.target.value)} />
                                            </Box>
                                        ))}
                                    </Box>
                                </Stack>
                                <Box sx={{ flex: 0.8, border: '1px solid #eee', borderRadius: '8px', bgcolor: '#fff' }}>
                                    <DateCalendar value={selectedDate} onChange={(newVal) => setSelectedDate(newVal)} sx={{ '& .MuiPickersDay-root.Mui-selected': { backgroundColor: '#a38f6d !important' }, width: '100%' }} />
                                </Box>
                            </Box>
                        ) : (
                            <Stack spacing={2}>
                                <TextField label={t('orderModal.furtherInfo')} size="small" fullWidth value={formData.further_info} onChange={(e) => setFormData({ ...formData, further_info: e.target.value })} />
                                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                    <TextField label={t('orderModal.pcsPerDay')} type="number" size="small" sx={{ width: 120 }} value={formData.pcs_per_day} onChange={(e) => setFormData({ ...formData, pcs_per_day: Number(e.target.value) })} />
                                    <TextField label={t('orderModal.weeks')} type="number" size="small" sx={{ width: 100 }} value={formData.weeks_left} onChange={(e) => setFormData({ ...formData, weeks_left: Number(e.target.value) })} />
                                    <FormControlLabel control={<Checkbox size="small" checked={formData.valid_until_notice} onChange={(e) => setFormData({ ...formData, valid_until_notice: e.target.checked })} />} label={<Typography variant="caption">{t('orderModal.validUntilNotice')}</Typography>} />
                                </Box>
                            </Stack>
                        )}
                    </Stack>
                </DialogContent>

                <DialogActions sx={{ p: 2, bgcolor: '#f8f9fa', borderTop: '1px solid #eee', justifyContent: 'space-between' }}>
                    <Button onClick={onClose} variant="outlined" sx={{ borderRadius: '20px', color: '#666', borderColor: '#ccc', px: 3 }}>
                        {t('orderModal.cancel')}
                    </Button>
                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                        {initialData && (
                            <IconButton
                                sx={{ bgcolor: '#f44336', color: 'white', '&:hover': { bgcolor: '#d32f2f' } }}
                                onClick={handleDeleteDialogOpen} // FIXED
                            >
                                <DeleteIcon fontSize="small" />
                            </IconButton>
                        )}
                        <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave} sx={{ bgcolor: '#a38f6d', '&:hover': { bgcolor: '#8c7a5d' }, borderRadius: '20px', px: 4, fontWeight: 'bold' }}>
                            {t('orderModal.save')}
                        </Button>
                    </Box>
                </DialogActions>
            </Dialog>

            {/* 3. FIXED: Delete Confirmation Dialog එක ඇතුළත් කිරීම */}
            <DeleteConfirmationDialog
                open={deleteDialogOpen}
                onClose={handleDeleteDialogClose}
                onConfirm={handleDeleteConfirm}
                title={t('orderModal.deleteTitle')}
                message={t('orderModal.deleteMessage')}
            />
        </LocalizationProvider>
    );
};

export default ChipSubscriptionModal;