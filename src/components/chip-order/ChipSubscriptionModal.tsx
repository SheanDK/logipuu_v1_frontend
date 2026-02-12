//app\[lng]\(main)\chip-management\planning\page.tsx

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

import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import chipService from '@/services/chipService';
import { chipTitleService } from '@/services/chipTitleService';

const ChipSubscriptionModal = ({ open, onClose, onSuccess, initialData }: any) => {
    const [titles, setTitles] = useState<any[]>([]);
    const [tabValue, setTabValue] = useState(0); // 0: MON-FRI, 1: MA-SU, 2: FREE
    const [selectedDate, setSelectedDate] = useState<Dayjs | null>(dayjs());

    const [formData, setFormData] = useState({
        title_id: '',
        flexibility_type: 'No Flexibility',
        weeks_left: 1,
        pcs_per_day: 0,
        valid_until_notice: false,
        repetition_type: 'repetition',
        pvm_loppu: '',
        repeat_every_day: 0,
        further_info: '',
        distribution: {
            Monday: { qty: 0, info: '' },
            Tuesday: { qty: 0, info: '' },
            Wednesday: { qty: 0, info: '' },
            Thursday: { qty: 0, info: '' },
            Friday: { qty: 0, info: '' },
            Saturday: { qty: 0, info: '' },
            Sunday: { qty: 0, info: '' },
        }
    });

    useEffect(() => {
        if (open) {
            chipTitleService.getAll().then(setTitles);
            if (initialData) {
                setFormData({ ...formData, ...initialData });
                if (initialData.pvm_alku) setSelectedDate(dayjs(initialData.pvm_alku));
            } else {
                setSelectedDate(dayjs());
            }
        }
    }, [open, initialData]);

    const handleDayChange = (day: string, field: 'qty' | 'info', value: any) => {
        setFormData(prev => ({
            ...prev,
            distribution: {
                ...prev.distribution,
                [day]: { ...(prev.distribution as any)[day], [field]: value }
            }
        }));
    };

    const handleSave = async () => {
        try {
            const selectedTitle = titles.find(t => String(t.titleId || t.title_id) === String(formData.title_id));

            // Logic to calculate total based on tab
            let totalLoads = 0;
            if (tabValue === 0) totalLoads = formData.pcs_per_day * 5 * formData.weeks_left;
            else if (tabValue === 1) totalLoads = formData.pcs_per_day * 7 * formData.weeks_left;
            else totalLoads = Object.values(formData.distribution).reduce((sum, d) => sum + Number(d.qty), 0) * formData.weeks_left;

            await chipService.createOrder({
                ...formData,
                pvm_alku: selectedDate?.format('YYYY-MM-DD'),
                asiakas_id: selectedTitle?.asiakasId || selectedTitle?.asiakas_id,
                tuote_tyyppi: selectedTitle?.productName || '',
                kuormia_tavoite: totalLoads
            });
            onSuccess();
            onClose();
        } catch (err) { console.error(err); }
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
                <DialogTitle sx={{ fontWeight: 'bold', bgcolor: '#f8f9fa', borderBottom: '1px solid #eee', color: '#333' }}>
                    {initialData ? 'Order modification' : 'Create an order'}
                </DialogTitle>

                <DialogContent sx={{ p: 0 }}>
                    {/* TABS */}
                    <Tabs
                        value={tabValue}
                        onChange={(_, v) => setTabValue(v)}
                        sx={{ px: 2, pt: 1, '& .MuiTabs-indicator': { backgroundColor: '#a38f6d' }, '& .MuiTab-root.Mui-selected': { color: '#a38f6d' } }}
                    >
                        <Tab label="MON-FRI" sx={{ fontWeight: 'bold', fontSize: '12px' }} />
                        <Tab label="MA-SU" sx={{ fontWeight: 'bold', fontSize: '12px' }} />
                        <Tab label="FREE" sx={{ fontWeight: 'bold', fontSize: '12px' }} />
                    </Tabs>
                    <Divider />

                    <Stack spacing={2.5} sx={{ p: 3 }}>
                        {/* Common Header Fields */}
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField label="Start date" type="date" size="small" sx={{ flex: 1 }} InputLabelProps={{ shrink: true }}
                                value={selectedDate?.format('YYYY-MM-DD')} onChange={(e) => setSelectedDate(dayjs(e.target.value))} />

                            <Autocomplete
                                sx={{ flex: 2 }} size="small" options={titles}
                                getOptionLabel={(o) => o.nimikeNimi || ''}
                                value={titles.find(t => String(t.titleId || t.title_id) === String(formData.title_id)) || null}
                                onChange={(_, v) => setFormData({ ...formData, title_id: v?.titleId || v?.title_id || '' })}
                                renderInput={(p) => <TextField {...p} label="Title" />}
                            />

                            <TextField select label="Flex" size="small" sx={{ flex: 1 }} value={formData.flexibility_type}
                                onChange={(e) => setFormData({ ...formData, flexibility_type: e.target.value })}>
                                <MenuItem value="No Flexibility">No Flexibility</MenuItem>
                                <MenuItem value="Within a week">Within a week</MenuItem>
                            </TextField>
                        </Box>

                        {/* CONDITIONAL INTERFACE */}
                        {tabValue < 2 ? (
                            /* --- SIMPLIFIED VIEW (MON-FRI & MA-SU) --- */
                            <Stack spacing={2}>
                                <TextField label="Further information" size="small" fullWidth value={formData.further_info}
                                    onChange={(e) => setFormData({ ...formData, further_info: e.target.value })} />
                                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                    <TextField label="Pcs per day" type="number" size="small" sx={{ width: 150 }}
                                        value={formData.pcs_per_day} onChange={(e) => setFormData({ ...formData, pcs_per_day: Number(e.target.value) })} />
                                    <TextField label="Weeks left" type="number" size="small" sx={{ width: 120 }}
                                        value={formData.weeks_left} onChange={(e) => setFormData({ ...formData, weeks_left: Number(e.target.value) })} />
                                    <FormControlLabel control={<Checkbox size="small" checked={formData.valid_until_notice} onChange={(e) => setFormData({ ...formData, valid_until_notice: e.target.checked })} />} label={<Typography variant="body2">Valid until further notice</Typography>} />
                                </Box>
                            </Stack>
                        ) : (
                            /* --- ADVANCED VIEW (FREE TAB ONLY) --- */
                            <Box sx={{ display: 'flex', gap: 3 }}>
                                <Stack spacing={2} sx={{ flex: 1.2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                                        <RadioGroup row value={formData.repetition_type} onChange={(e) => setFormData({ ...formData, repetition_type: e.target.value })}>
                                            <FormControlLabel value="repetition" control={<Radio size="small" />} label={<Typography variant="caption">Repetition Left</Typography>} />
                                            <FormControlLabel value="end_date" control={<Radio size="small" />} label={<Typography variant="caption">Ends date</Typography>} />
                                        </RadioGroup>
                                        <TextField label="Weeks" size="small" type="number" sx={{ width: 70 }} value={formData.weeks_left} onChange={(e) => setFormData({ ...formData, weeks_left: Number(e.target.value) })} />
                                        <FormControlLabel control={<Checkbox size="small" checked={formData.valid_until_notice} onChange={(e) => setFormData({ ...formData, valid_until_notice: e.target.checked })} />} label={<Typography variant="caption">Valid until notice</Typography>} />
                                    </Box>

                                    <Box sx={{ border: '1px solid #eee', borderRadius: '8px', overflow: 'hidden' }}>
                                        {Object.keys(formData.distribution).map((day) => (
                                            <Box key={day} sx={{ display: 'flex', borderBottom: '1px solid #f5f5f5', '&:last-child': { borderBottom: 0 } }}>
                                                <Box sx={{ width: 80, bgcolor: '#fafafa', p: 1, borderRight: '1px solid #eee', display: 'flex', alignItems: 'center' }}>
                                                    <Typography variant="caption" sx={{ fontSize: '10px', fontWeight: 'bold' }}>{day.substring(0, 3).toUpperCase()}</Typography>
                                                </Box>
                                                <TextField variant="standard" size="small" type="number" sx={{ width: 50, px: 1 }}
                                                    value={(formData.distribution as any)[day].qty} onChange={(e) => handleDayChange(day, 'qty', e.target.value)} />
                                                <TextField placeholder="Daily info..." fullWidth variant="standard" sx={{ px: 1, '& input': { fontSize: '12px' } }}
                                                    value={(formData.distribution as any)[day].info} onChange={(e) => handleDayChange(day, 'info', e.target.value)} />
                                            </Box>
                                        ))}
                                    </Box>
                                </Stack>

                                <Box sx={{ flex: 0.8, border: '1px solid #eee', borderRadius: '8px', bgcolor: '#fff' }}>
                                    <DateCalendar
                                        value={selectedDate}
                                        onChange={(newVal) => setSelectedDate(newVal)}
                                        sx={{
                                            '& .MuiPickersDay-root.Mui-selected': { backgroundColor: '#a38f6d !important' },
                                            width: '100%'
                                        }}
                                    />
                                </Box>
                            </Box>
                        )}
                    </Stack>
                </DialogContent>

                <DialogActions sx={{ p: 2, bgcolor: '#f8f9fa', borderTop: '1px solid #eee', justifyContent: 'space-between' }}>
                    <Button onClick={onClose} variant="outlined" sx={{ borderRadius: '20px', color: '#666', borderColor: '#ccc', px: 3 }}>
                        CANCEL
                    </Button>

                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                        <IconButton sx={{ bgcolor: '#f44336', color: 'white', '&:hover': { bgcolor: '#d32f2f' } }}>
                            <DeleteIcon fontSize="small" />
                        </IconButton>
                        <Button
                            variant="contained" startIcon={<SaveIcon />} onClick={handleSave}
                            sx={{ bgcolor: '#00bcd4', borderRadius: '20px', px: 4, fontWeight: 'bold' }}
                        >
                            SAVE
                        </Button>
                    </Box>
                </DialogActions>
            </Dialog>
        </LocalizationProvider>
    );
};

export default ChipSubscriptionModal;