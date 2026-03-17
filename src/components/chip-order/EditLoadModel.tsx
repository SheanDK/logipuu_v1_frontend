// frontend/src/components/chip-order/EditLoadModel.tsx
'use client';
import React, { useEffect, useState } from 'react';
import {
    Dialog, DialogContent, DialogActions, Button, TextField,
    Stack, Box, Table, TableBody, TableCell, TableContainer, TableHead,
    TableRow, Typography, CircularProgress, alpha, useTheme,
    Paper, IconButton
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import chipPlanningService from '@/services/chipPlanningService';
import { useSnackbar } from 'notistack';
import { useTranslation } from '@/i18n/useTranslation';
import CloseIcon from '@mui/icons-material/Close';
import dayjs from 'dayjs';

const EditLoadModel = ({ open, loadData, onClose, onSave, onDelete }: any) => {
    const { t } = useTranslation(['chip-management', 'common']);
    const theme = useTheme();
    const isDarkMode = theme.palette.mode === 'dark';
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { control, handleSubmit, reset } = useForm({
        defaultValues: {
            scheduled_date: '',
            load_notes: '',
            actual_m3: 0,
            actual_ton: 0,
            actual_pcs: 0,
            actual_hr: 0,
            actual_km: 0,
            actual_waiting: 0,
            actual_details: ''
        }
    });

    useEffect(() => {
        if (loadData && open) {
            // HTML5 date input එකට අගය ලබා දීමේදී එය YYYY-MM-DD කියන format එකට තිබිය යුතුයි.
            const formattedDate = (loadData.scheduled_date || loadData.scheduledDate || loadData.date || loadData.pvm) 
                ? dayjs(loadData.scheduled_date || loadData.scheduledDate || loadData.date || loadData.pvm).format('YYYY-MM-DD') 
                : '';

            reset({
                scheduled_date: formattedDate,
                load_notes: loadData.load_notes || loadData.loadNotes || '',
                actual_m3: loadData.actual_m3 ?? loadData.actualM3 ?? 0,
                actual_ton: loadData.actual_ton ?? loadData.actualTon ?? 0,
                actual_pcs: loadData.actual_pcs ?? loadData.actualPcs ?? 0,
                actual_hr: loadData.actual_hr ?? loadData.actualHr ?? 0,
                actual_km: loadData.actual_km ?? loadData.actualKm ?? 0,
                actual_waiting: loadData.actual_waiting ?? loadData.actualWaiting ?? 0,
                actual_details: loadData.actual_details || loadData.actualDetails || loadData.driverNotes || ''
            });
        }
    }, [loadData, open, reset]);

    const onSubmit = async (data: any) => {
        setIsSubmitting(true);
        try {
            // සියලුම අගයන් අනිවාර්යයෙන්ම සංඛ්‍යා (Numbers) ලෙස පත් කර යැවීම
            const formattedData = {
                scheduled_date: data.scheduled_date,
                actual_m3: Number(data.actual_m3 || 0),
                actual_ton: Number(data.actual_ton || 0),
                actual_pcs: Number(data.actual_pcs || 0),
                actual_km: Number(data.actual_km || 0),
                actual_hr: Number(data.actual_hr || 0),
                actual_waiting: Number(data.actual_waiting || 0),
                actual_details: data.actual_details // සටහන්
            };

            // Table එකේ ඇති onSave ශ්‍රිතය අමතයි
            await onSave(loadData.loadId || loadData.load_id, data.actual_details, formattedData);
        } catch (error) {
            console.error("Update failed", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="lg"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: '12px',
                    bgcolor: isDarkMode ? '#1e1e1e' : '#fff',
                    backgroundImage: 'none',
                    maxHeight: '90vh'
                }
            }}
        >
            {/* TITLE STRIP (SS එකට සමානව) */}
            <Box sx={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                bgcolor: isDarkMode ? '#252525' : '#fdfaf5',
                borderBottom: '1px solid', borderColor: 'divider', px: 3, py: 2
            }}>
                <Typography sx={{ fontWeight: 800, fontSize: '1rem' }}>
                    Edit Chip Transport Details #{loadData?.load_id || loadData?.id}
                </Typography>
                <IconButton size="small" onClick={onClose} sx={{ color: 'text.secondary' }}>
                    <CloseIcon fontSize="small" />
                </IconButton>
            </Box>

            <DialogContent sx={{ p: 3, pt: 4 }}>
                <Stack spacing={4}>
                    {/* Top Row: Date + Notes */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 3 }}>
                        <Controller name="scheduled_date" control={control} render={({ field }) => (
                            <TextField {...field} type="date" label="Scheduled Date" size="small" InputLabelProps={{ shrink: true }} fullWidth />
                        )} />
                        <Controller name="actual_details" control={control} render={({ field }) => (
                            <TextField {...field} label="Instructions / Details" size="small" fullWidth placeholder="Add driver notes..." />
                        )} />
                    </Box>

                    {/* Load Metrics Table */}
                    <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5, color: '#a38f6d', textTransform: 'uppercase', fontSize: '11px' }}>
                            Load Metrics
                        </Typography>
                        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '8px', overflow: 'hidden' }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ bgcolor: isDarkMode ? '#252525' : '#f8f9fa' }}>
                                        <TableCell sx={{ fontWeight: 'bold', fontSize: '11px' }}>VEHICLE</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', fontSize: '11px', textAlign: 'center' }}>m³</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', fontSize: '11px', textAlign: 'center' }}>TONS</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', fontSize: '11px', textAlign: 'center' }}>PCS</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', fontSize: '11px', textAlign: 'center' }}>KM</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', fontSize: '11px', textAlign: 'center' }}>HR</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', fontSize: '11px', textAlign: 'center' }}>WAIT</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    <TableRow>
                                        <TableCell sx={{ py: 1.5 }}>
                                            <Typography variant="body2" fontWeight="700">{loadData?.rekNro || 'N/A'}</Typography>
                                        </TableCell>

                                        {/* Input Fields loop */}
                                        {['actual_m3', 'actual_ton', 'actual_pcs', 'actual_km', 'actual_hr', 'actual_waiting'].map((col) => (
                                            <TableCell key={col} sx={{ p: 0.8 }}>
                                                <Controller
                                                    name={col as any}
                                                    control={control}
                                                    render={({ field }) => (
                                                        <TextField
                                                            {...field}
                                                            type="number"
                                                            size="small"
                                                            variant="outlined"
                                                            fullWidth
                                                            sx={{
                                                                '& .MuiOutlinedInput-input': { p: '6px 8px', fontSize: '12px', textAlign: 'center' },
                                                                '& .MuiOutlinedInput-root': { bgcolor: isDarkMode ? '#2c2c2c' : '#fff' }
                                                            }}
                                                        />
                                                    )}
                                                />
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                </Stack>
            </DialogContent>

            {/* BOTTOM STRIP (SS එකට සමානව) */}
            <DialogActions sx={{ p: 2.5, borderTop: '1px solid', borderColor: 'divider', bgcolor: isDarkMode ? '#252525' : '#fdfaf5' }}>
                <Button onClick={onClose} disabled={isSubmitting} color="inherit" sx={{ fontWeight: 'bold', borderRadius: '20px', px: 3 }}>
                    CANCEL
                </Button>
                <Button
                    variant="contained"
                    onClick={handleSubmit(onSubmit)}
                    disabled={isSubmitting}
                    sx={{
                        bgcolor: '#a38f6d', borderRadius: '25px', px: 4, fontWeight: 'bold',
                        '&:hover': { bgcolor: '#8c7a5d' }
                    }}
                >
                    {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'SAVE CHANGES'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default EditLoadModel;
