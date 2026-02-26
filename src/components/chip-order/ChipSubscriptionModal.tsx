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
import { PickersDay, PickersDayProps } from '@mui/x-date-pickers/PickersDay';

// Locales for calendar
import 'dayjs/locale/fi';
import 'dayjs/locale/en-gb';

import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import chipService from '@/services/chipService';
import { chipTitleService } from '@/services/chipTitleService';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import { useTranslation } from '@/i18n/useTranslation';
import { useParams } from 'next/navigation';
import DeleteConfirmationDialog from '../common/DeleteConfirmationDialog';

const ChipSubscriptionModal = ({ open, onClose, onSuccess, initialData }: any) => {
    const { t } = useTranslation(['chip-management', 'common']);
    const { lng } = useParams();
    const [titles, setTitles] = useState<any[]>([]);
    const [tabValue, setTabValue] = useState(0);
    const [selectedDate, setSelectedDate] = useState<Dayjs | null>(dayjs());
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    const initialDistribution = {
        Monday: { qty: 0, info: '' }, Tuesday: { qty: 0, info: '' }, Wednesday: { qty: 0, info: '' },
        Thursday: { qty: 0, info: '' }, Friday: { qty: 0, info: '' }, Saturday: { qty: 0, info: '' }, Sunday: { qty: 0, info: '' },
    };

    const [formData, setFormData] = useState({
        title_id: '',
        flexibility_type: 'No Flexibility',
        weeks_left: 1,
        pcs_per_day: 0,
        valid_until_notice: false,
        repetition_type: 'repetition',
        end_date: '',
        repeat_every_day: 0,
        further_info: '',
        distribution: initialDistribution
    });

    const renderHighlightedDay = (props: PickersDayProps) => {
        const { day, outsideCurrentMonth, ...other } = props;

        const startDate = selectedDate ? selectedDate.startOf('day') : null;
        if (!startDate || outsideCurrentMonth) {
            return <PickersDay {...props} />;
        }

        if (day.isBefore(startDate)) {
            return <PickersDay {...props} />;
        }

        const activeWeekdays = Object.keys(formData.distribution).filter(
            (d) => Number((formData.distribution as any)[d].qty) > 0
        );

        let endDate: Dayjs | null = null;
        if (formData.valid_until_notice) {
            endDate = day.add(1, 'year');
        } else if (formData.repetition_type === 'repetition') {
            endDate = startDate.add(formData.weeks_left, 'week').subtract(1, 'day');
        } else if (formData.repetition_type === 'end_date' && formData.end_date) {
            endDate = dayjs(formData.end_date);
        }

        const dayName = day.format('dddd');
        const isWorkingDay = activeWeekdays.includes(dayName);
        const isWithinRange = endDate ? !day.isAfter(endDate, 'day') : true;

        const isSelected = isWorkingDay && isWithinRange;

        return (
            <PickersDay
                {...other}
                day={day}
                outsideCurrentMonth={outsideCurrentMonth}
                sx={{
                    ...(isSelected && {
                        bgcolor: '#499ec5ff !important',
                        color: 'white !important',
                        borderRadius: '50%',
                        '&:hover': { bgcolor: '#499ec5ff !important' },
                    }),
                    ...(day.isSame(dayjs(), 'day') && !isSelected && {
                        border: '1px solid #a38f6d',
                    })
                }}
            />
        );
    };

    useEffect(() => {
        if (open) {
            chipTitleService.getAll().then(setTitles);

            if (initialData) {
                console.log("🛠 Loading Initial Data:", initialData);

                const parseDate = (dateStr: string) => {
                    if (!dateStr) return dayjs();
                    if (dateStr.includes('.')) {
                        const [d, m, y] = dateStr.split('.');
                        return dayjs(`${y}-${m}-${d}`);
                    }
                    return dayjs(dateStr);
                };
                setSelectedDate(parseDate(initialData.startDate || initialData.start_date));

                const rawDist = initialData.weeklyDistribution || initialData.weekly_dist || {};
                const dbDist = typeof rawDist === 'string' ? JSON.parse(rawDist) : rawDist;

                // FIX: Extract meta first to avoid scope errors
                const meta = dbDist._metadata || {};

                const normalizedDist = { ...initialDistribution };
                Object.keys(dbDist).forEach((key) => {
                    if (key === '_metadata') return;
                    const normalizedKey = key.charAt(0).toUpperCase() + key.slice(1).toLowerCase();
                    if (normalizedDist.hasOwnProperty(normalizedKey)) {
                        const val = dbDist[key];
                        (normalizedDist as any)[normalizedKey] = {
                            qty: typeof val === 'object' ? (val.qty || 0) : (val || 0),
                            info: typeof val === 'object' ? (val.info || '') : ''
                        };
                    }
                });

                // FIX: Define activeDays before using it for pcsFromDist and autoTab
                const distValues = Object.values(normalizedDist) as { qty: number, info: string }[];
                const activeDays = distValues.filter(day => Number(day.qty) > 0);
                const weeklySum = distValues.reduce((sum: number, day: any) => sum + Number(day.qty || 0), 0);
                const pcsFromDist = activeDays.length > 0 ? Number(activeDays[0].qty) : 0;
                const targetQty: number = Number(initialData.targetQty || initialData.target_qty || 0);

                const hasCustomInfo = distValues.some(day => day.info && day.info.trim() !== "");
                const hasWeekendWork = Number((normalizedDist as any).Saturday?.qty || 0) > 0 ||
                    Number((normalizedDist as any).Sunday?.qty || 0) > 0;

                let autoTab = 2;
                if (!hasCustomInfo && !hasWeekendWork && activeDays.length === 5) autoTab = 0;
                else if (!hasCustomInfo && activeDays.length === 7) autoTab = 1;

                setTabValue(autoTab);

                setFormData({
                    title_id: initialData.titleId || initialData.title_id || '',
                    flexibility_type: meta.flex || initialData.flexibility_type || 'No Flexibility',
                    weeks_left: meta.weeks || initialData.weeks_left || (weeklySum > 0 ? Math.round(targetQty / weeklySum) : 1),
                    pcs_per_day: pcsFromDist,
                    valid_until_notice: meta.valid ?? (initialData.endDate ? false : true),
                    repetition_type: (initialData.endDate || initialData.end_date) ? 'end_date' : 'repetition',
                    end_date: initialData.endDate || initialData.end_date || '',
                    repeat_every_day: meta.repeat || 0,
                    further_info: initialData.notes || initialData.further_info || '',
                    distribution: normalizedDist
                });

            } else {
                resetFormState();
            }
        }
    }, [open, initialData]);

    const resetFormState = () => {
        setFormData({
            title_id: '',
            flexibility_type: 'No Flexibility',
            weeks_left: 1,
            pcs_per_day: 0,
            valid_until_notice: false,
            repetition_type: 'repetition',
            end_date: '',
            repeat_every_day: 0,
            further_info: '',
            distribution: initialDistribution
        });
        setSelectedDate(dayjs());
        setTabValue(0);
    };

    const handleAdjustAllDays = (amount: number) => {
        const newDist = { ...formData.distribution };
        Object.keys(newDist).forEach((day) => {
            const current = (newDist as any)[day].qty || 0;
            (newDist as any)[day].qty = Math.max(0, Number(current) + amount);
        });
        setFormData({ ...formData, distribution: newDist });
    };

    // FIX: Only one declaration of handleDayChange
    const handleDayChange = (day: string, field: 'qty' | 'info', value: any) => {
        setFormData(prev => ({
            ...prev,
            distribution: { ...prev.distribution, [day]: { ...(prev.distribution as any)[day], [field]: value } }
        }));
    };

    const handleDeleteConfirm = async () => {
        if (!initialData?.orderId) return;
        try {
            await chipService.deleteOrder(initialData.orderId);
            setDeleteDialogOpen(false);
            onSuccess("Subscription deleted successfully", "success");
            onClose();
        } catch (err) { onSuccess("Failed to delete", "error"); }
    };

    const handleSave = async () => {
        if (!formData.title_id) {
            alert("please select a chip order");
            return;
        }

        let totalTavoite = 0;
        let finalDistribution: any = { ...formData.distribution };

        if (tabValue === 0 || tabValue === 1) {
            const daysInWeek = tabValue === 0 ? 5 : 7;
            totalTavoite = formData.pcs_per_day * daysInWeek * formData.weeks_left;
            const daysToFill = tabValue === 0 ? ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] : Object.keys(initialDistribution);
            Object.keys(finalDistribution).forEach(day => {
                finalDistribution[day] = { qty: daysToFill.includes(day) ? formData.pcs_per_day : 0, info: finalDistribution[day].info || '' };
            });
        } else {
            totalTavoite = Object.values(formData.distribution).reduce((a, b: any) => a + Number(b.qty), 0) * formData.weeks_left;
        }

        finalDistribution._metadata = {
            flex: formData.flexibility_type,
            weeks: formData.weeks_left,
            valid: formData.valid_until_notice,
            repeat: formData.repeat_every_day
        };

        const payload = {
            title_id: Number(formData.title_id),
            start_date: selectedDate?.format('YYYY-MM-DD'),
            target_qty: totalTavoite,
            notes: formData.further_info,
            weekly_dist: finalDistribution,
            is_active: true
        };

        try {
            if (initialData) {
                await chipService.updateOrder(initialData.orderId, payload);
            } else {
                await chipService.createOrder(payload);
            }
            onSuccess("Successfully Saved", "success");
            onClose();
        } catch (err: any) {
            console.error("❌ API Error:", err.response?.data || err.message);
            alert("cannot save data: " + (err.response?.data?.error || "Unknown Error"));
        }
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

                <DialogContent sx={{ p: 0 }}>
                    <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ px: 2, pt: 1, '& .MuiTabs-indicator': { backgroundColor: '#a38f6d' }, '& .MuiTab-root.Mui-selected': { color: '#a38f6d' } }}>
                        <Tab label={t('chip-management:orderModal.tabs.monFri')} sx={{ fontWeight: 'bold', fontSize: '12px' }} />
                        <Tab label={t('chip-management:orderModal.tabs.laSu')} sx={{ fontWeight: 'bold', fontSize: '12px' }} />
                        <Tab label={t('chip-management:orderModal.tabs.free')} sx={{ fontWeight: 'bold', fontSize: '12px' }} />
                    </Tabs>
                    <Divider />

                    <Stack spacing={2.5} sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField label={t('chip-management:orderModal.startDate')} type="date" size="small" sx={{ flex: 1 }} InputLabelProps={{ shrink: true }}
                                value={selectedDate?.format('YYYY-MM-DD')} onChange={(e) => setSelectedDate(dayjs(e.target.value))} />

                            <Autocomplete
                                sx={{ flex: 2 }}
                                size="small"
                                options={titles}
                                getOptionLabel={(option: any) => {
                                    if (!option) return '';
                                    const name = option.title_name || '';
                                    const abbr = option.abbreviation ? `(${option.abbreviation})` : '';
                                    return (name || abbr) ? `${name} ${abbr}`.trim() : '';
                                }}
                                getOptionKey={(option: any) => option.title_id || option.titleId}
                                isOptionEqualToValue={(o: any, v: any) =>
                                    String(o.title_id || o.titleId) === String(v.title_id || v.titleId)
                                }
                                renderOption={(props, option: any) => {
                                    const { key, ...otherProps } = props;
                                    return (
                                        <Box component="li" key={otherProps.id} {...otherProps} sx={{ fontSize: '13px' }}>
                                            {option.title_name} {option.abbreviation ? `(${option.abbreviation})` : ''}
                                        </Box>
                                    );
                                }}
                                value={titles.find((t: any) =>
                                    String(t.title_id || t.titleId) === String(formData.title_id)
                                ) || null}
                                onChange={(_, v: any) => {
                                    const selectedId = v ? (v.title_id || v.titleId) : '';
                                    setFormData(prev => ({ ...prev, title_id: selectedId }));
                                }}
                                renderInput={(p) => <TextField {...p} label={t('chip-management:orderModal.title')} />}
                            />

                            <TextField select label={t('chip-management:orderModal.flex')} size="small" sx={{ flex: 1.2 }} value={formData.flexibility_type} onChange={(e) => setFormData({ ...formData, flexibility_type: e.target.value })}>
                                <MenuItem value="No Flexibility">{t('chip-management:flexOptions.noFlex')}</MenuItem>
                                <MenuItem value="1-3 Days">{t('chip-management:flexOptions.1_3days')}</MenuItem>
                                <MenuItem value="Within a week">{t('chip-management:flexOptions.withinWeek')}</MenuItem>
                                <MenuItem value="Steadily throughout the week">{t('chip-management:flexOptions.steadily')}</MenuItem>
                            </TextField>
                        </Box>

                        <TextField label={t('chip-management:orderModal.furtherInfo')} size="small" fullWidth value={formData.further_info} onChange={(e) => setFormData({ ...formData, further_info: e.target.value })} />

                        {tabValue === 2 ? (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: '#fdfaf5', p: 1.5, borderRadius: '8px', border: '1px solid #eee' }}>
                                    <RadioGroup row value={formData.repetition_type} onChange={(e) => setFormData({ ...formData, repetition_type: e.target.value })}>
                                        <FormControlLabel value="repetition" control={<Radio size="small" sx={{ color: '#a38f6d' }} />} label={<Typography variant="caption" fontWeight="bold">Repetition Left</Typography>} />
                                        <FormControlLabel value="end_date" control={<Radio size="small" sx={{ color: '#a38f6d' }} />} label={<Typography variant="caption" fontWeight="bold">Ends date</Typography>} />
                                    </RadioGroup>
                                </Box>

                                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', px: 1 }}>
                                    <FormControlLabel
                                        control={<Checkbox size="small" checked={formData.valid_until_notice} onChange={(e) => setFormData({ ...formData, valid_until_notice: e.target.checked })} />}
                                        label={<Typography variant="caption" sx={{ fontWeight: 'bold' }}>Valid until further notice</Typography>}
                                    />
                                    <TextField label="Weeks left" type="number" size="small" sx={{ width: 100 }} disabled={formData.valid_until_notice || formData.repetition_type !== 'repetition'} value={formData.weeks_left} onChange={(e) => setFormData({ ...formData, weeks_left: Number(e.target.value) })} />
                                    <TextField label="End date" type="date" size="small" sx={{ width: 140 }} InputLabelProps={{ shrink: true }} disabled={formData.valid_until_notice || formData.repetition_type !== 'end_date'} value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} />
                                    <TextField label="Repeat every day" type="number" size="small" sx={{ width: 120 }} value={formData.repeat_every_day} onChange={(e) => setFormData({ ...formData, repeat_every_day: Number(e.target.value) })} />
                                </Box>

                                <Box sx={{ display: 'flex', gap: 2 }}>
                                    <Box sx={{ flex: 1.3 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, px: 1, bgcolor: '#f5f5f5', py: 0.5, borderRadius: '4px' }}>
                                            <Typography variant="caption" fontWeight="bold" color="textSecondary">WEEKLY DISTRIBUTION</Typography>
                                            <Stack direction="row" alignItems="center" spacing={0.5}>
                                                <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#a38f6d', mr: 1 }}>ALL DAYS:</Typography>
                                                <IconButton size="small" onClick={() => handleAdjustAllDays(-1)} sx={{ color: '#d32f2f', p: 0 }}><RemoveCircleOutlineIcon fontSize="small" /></IconButton>
                                                <IconButton size="small" onClick={() => handleAdjustAllDays(1)} sx={{ color: '#2e7d32', p: 0 }}><AddCircleOutlineIcon fontSize="small" /></IconButton>
                                            </Stack>
                                        </Box>

                                        <Box sx={{ border: '1px solid #eee', borderRadius: '8px', overflow: 'hidden' }}>
                                            {dayLabels.map((day) => (
                                                <Box key={day.name} sx={{ display: 'flex', borderBottom: '1px solid #f5f5f5', '&:last-child': { borderBottom: 0 }, alignItems: 'center', p: 0.8 }}>
                                                    <Box sx={{ width: 90 }}>
                                                        <Typography variant="caption" sx={{ fontSize: '11px', fontWeight: 900, color: '#444' }}>{day.name}</Typography>
                                                        <TextField
                                                            variant="outlined" size="small" type="number"
                                                            sx={{ width: 65, '& .MuiOutlinedInput-input': { p: '4px 6px', fontSize: '12px', textAlign: 'center' } }}
                                                            value={(formData.distribution as any)[day.name].qty}
                                                            onChange={(e) => handleDayChange(day.name, 'qty', e.target.value)}
                                                        />
                                                    </Box>
                                                    <TextField
                                                        placeholder="Further information..."
                                                        fullWidth variant="outlined" size="small"
                                                        sx={{ ml: 1, '& .MuiOutlinedInput-input': { p: '4px 10px', fontSize: '12px' } }}
                                                        value={(formData.distribution as any)[day.name].info}
                                                        onChange={(e) => handleDayChange(day.name, 'info', e.target.value)}
                                                    />
                                                </Box>
                                            ))}
                                        </Box>
                                    </Box>

                                    <Box sx={{ flex: 0.7, border: '1px solid #eee', borderRadius: '8px', bgcolor: '#fff', p: 1 }}>
                                        <DateCalendar
                                            value={selectedDate}
                                            onChange={(newVal) => setSelectedDate(newVal)}
                                            slots={{ day: renderHighlightedDay }}
                                            sx={{
                                                '& .MuiPickersDay-root.Mui-selected': { backgroundColor: '#a38f6d !important' },
                                                width: '100%',
                                                height: 'auto'
                                            }}
                                        />
                                    </Box>
                                </Box>
                            </Box>
                        ) : (
                            <Stack spacing={2}>
                                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                    <TextField label={t('chip-management:orderModal.pcsPerDay')} type="number" size="small" sx={{ width: 120 }} value={formData.pcs_per_day} onChange={(e) => setFormData({ ...formData, pcs_per_day: Number(e.target.value) })} />
                                    <TextField label={t('chip-management:orderModal.weeks')} type="number" size="small" sx={{ width: 100 }} value={formData.weeks_left} onChange={(e) => setFormData({ ...formData, weeks_left: Number(e.target.value) })} />
                                    <FormControlLabel control={<Checkbox size="small" checked={formData.valid_until_notice} onChange={(e) => setFormData({ ...formData, valid_until_notice: e.target.checked })} />} label={<Typography variant="caption">{t('chip-management:orderModal.validUntilNotice')}</Typography>} />
                                </Box>
                            </Stack>
                        )}
                    </Stack>
                </DialogContent>

                <DialogActions sx={{ p: 2, bgcolor: '#f8f9fa', borderTop: '1px solid #eee', justifyContent: 'space-between' }}>
                    <Button onClick={onClose} variant="outlined" sx={{ borderRadius: '20px', color: '#666', borderColor: '#ccc', px: 3 }}>
                        {t('chip-management:orderModal.cancel')}
                    </Button>
                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                        {initialData && <IconButton sx={{ bgcolor: '#f44336', color: 'white', '&:hover': { bgcolor: '#d32f2f' } }} onClick={() => setDeleteDialogOpen(true)}><DeleteIcon fontSize="small" /></IconButton>}
                        <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave} sx={{ bgcolor: '#a38f6d', '&:hover': { bgcolor: '#8c7a5d' }, borderRadius: '20px', px: 4, fontWeight: 'bold' }}>
                            {t('chip-management:orderModal.save')}
                        </Button>
                    </Box>
                </DialogActions>
            </Dialog>

            <DeleteConfirmationDialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                onConfirm={handleDeleteConfirm}
                title="Delete Subscription"
                message="Are you sure you want to delete this subscription? This action cannot be undone."
            />
        </LocalizationProvider>
    );
};

export default ChipSubscriptionModal;