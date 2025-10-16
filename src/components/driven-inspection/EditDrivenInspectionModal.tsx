// frontend/src/components/driven-inspection/EditDrivenInspectionModal.tsx
'use client';

import dayjs from 'dayjs';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

import React, { useEffect, useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    IconButton,
    Grid,
    TextField,
    CircularProgress,
    Alert,
    Box,
    Stack
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { ICreateKuormaFromPtlDto, IDrivenInspectionListItem, IUpdateDrivenInspectionRowDto } from '@/types';
import { createDrivenInspectionEntry, updateDrivenInspectionRow } from '@/services/drivenInspectionService';

const validationSchema = z.object({
    date: z.instanceof(dayjs as any, { message: "Invalid date" }).nullable(),
    receptionNo: z.string().max(50, "Max 50 characters").nullable().optional(),
    drivingRoute: z.string().max(100, "Max 100 characters").nullable().optional(),
    cubicMeters: z.number().positive("Must be a positive number").nullable().optional(),
    freightKm: z.number().min(0, "Cannot be negative").nullable().optional(),
    hours: z.number().min(0, "Cannot be negative").nullable().optional(),
    pcs: z.number().min(0, "Cannot be negative").nullable().optional(),
    additionalInformation: z.string().max(500, "Max 500 characters").nullable().optional(),
});

type FormData = z.infer<typeof validationSchema>;

interface EditInspectionModalProps {
    open: boolean;
    initialData: IDrivenInspectionListItem;
    onClose: () => void;
    onSaveSuccess: (updatedItem: any) => void;
}

const EditInspectionModal: React.FC<EditInspectionModalProps> = ({ open, initialData, onClose, onSaveSuccess }) => {
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { control, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(validationSchema),
    });

    useEffect(() => {
        if (open) {
            reset({
                date: initialData.date ? dayjs(initialData.date) : null,
                receptionNo: initialData.receptionNo || null,
                drivingRoute: initialData.drivingRoute || null,
                cubicMeters: initialData.cubicMeters || null,
                freightKm: initialData.freightKm || null,
                hours: initialData.hours || null,
                pcs: initialData.pcs || null,
                additionalInformation: initialData.additionalInformation || null,
            });
        }
    }, [open, initialData, reset]);

    const onSubmit: SubmitHandler<FormData> = async (data) => {
        setIsSaving(true);
        setError(null);

        try {
            // --- FIX: Declare a variable to hold the result of the API call ---
            let savedItem;

            // --- SMART SAVE LOGIC ---
            if (initialData.kuormaId) {
                // --- UPDATE existing record ---
                const dto: IUpdateDrivenInspectionRowDto = {
                    date: data.date ? dayjs(data.date).format('YYYY-MM-DD') : null,
                    receptionNo: data.receptionNo,
                    drivingRoute: data.drivingRoute,
                    cubicMeters: data.cubicMeters,
                    freightKm: data.freightKm,
                    hours: data.hours,
                    pcs: data.pcs,
                    additionalInfo: data.additionalInformation,
                };
                // --- FIX: Assign the returned value from the API call ---
                savedItem = await updateDrivenInspectionRow(initialData.kuormaId, dto);
            } else {
                // --- CREATE new record ---
                const dto: ICreateKuormaFromPtlDto = {
                    puutavaraId: initialData.puutavaraId, // Essential link
                    receptionNo: data.receptionNo,
                    drivingRoute: data.drivingRoute,
                    cubicMeters: data.cubicMeters,
                    freightKm: data.freightKm,
                    hours: data.hours,
                    pcs: data.pcs,
                    additionalInfo: data.additionalInformation,
                };
                // --- FIX: Assign the returned value from the API call ---
                savedItem = await createDrivenInspectionEntry(dto);
            }

            // --- FIX: Now 'savedItem' is defined and can be passed to the parent component ---
            onSaveSuccess(savedItem);

        } catch (err: any) {
            setError(err?.response?.data?.message || 'Failed to save changes.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            {/* The form and its layout remain the same */}
            <form onSubmit={handleSubmit(onSubmit)}>
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    Edit Inspection Details (ID: {initialData.kuormaId || 'N/A'})
                    <IconButton onClick={onClose}><CloseIcon /></IconButton>
                </DialogTitle>
                <DialogContent dividers sx={{ px: 3, pt: 1, pb: 2 }}>
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                    <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                            <Typography variant="body2" color="text.secondary">
                                <strong>Driving Order:</strong> {initialData.drivingOrderNo || 'N/A'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                <strong>Customer:</strong> {initialData.customerName || 'N/A'}
                            </Typography>
                        </Box>
                    </Box>

                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                            gap: 2,
                        }}
                    >
                        <Box>
                            <Controller
                                name="date"
                                control={control}
                                render={({ field }) => (
                                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                                        <DatePicker
                                            label="Date"
                                            value={field.value || null} // Ensure value is not undefined
                                            onChange={(newValue) => field.onChange(newValue)}
                                            slotProps={{
                                                textField: {
                                                    size: 'small',
                                                    fullWidth: true,
                                                    error: !!errors.date,
                                                    // --- THIS IS THE FIX ---
                                                    // Ensure the helperText is always a string or undefined.
                                                    // The `String()` constructor handles different types gracefully.
                                                    helperText: errors.date ? String(errors.date.message) : '',
                                                }
                                            }}
                                        />
                                    </LocalizationProvider>
                                )}
                            />
                        </Box>
                        <Box>
                            <Controller name="cubicMeters" control={control} render={({ field }) => (
                                <TextField {...field} value={field.value ?? ''} label="Cubic Metres (m³)" type="number" fullWidth variant="outlined" size="small" onChange={e => field.onChange(e.target.value === '' ? null : Number(e.target.value))} error={!!errors.cubicMeters} helperText={errors.cubicMeters?.message} />
                            )} />
                        </Box>
                        <Box>
                            <Controller name="receptionNo" control={control} render={({ field }) => (
                                <TextField {...field} value={field.value ?? ''} label="Reception No." fullWidth variant="outlined" size="small" error={!!errors.receptionNo} helperText={errors.receptionNo?.message} />
                            )} />
                        </Box>
                        <Box>
                            <Controller name="freightKm" control={control} render={({ field }) => (
                                <TextField {...field} value={field.value ?? ''} label="Freight (km)" type="number" fullWidth variant="outlined" size="small" onChange={e => field.onChange(e.target.value === '' ? null : Number(e.target.value))} error={!!errors.freightKm} helperText={errors.freightKm?.message} />
                            )} />
                        </Box>
                        <Box>
                            <Controller name="drivingRoute" control={control} render={({ field }) => (
                                <TextField {...field} value={field.value ?? ''} label="Driving Route" fullWidth variant="outlined" size="small" error={!!errors.drivingRoute} helperText={errors.drivingRoute?.message} />
                            )} />
                        </Box>
                        <Box>
                            <Controller name="pcs" control={control} render={({ field }) => (
                                <TextField {...field} value={field.value ?? ''} label="Pcs" type="number" fullWidth variant="outlined" size="small" onChange={e => field.onChange(e.target.value === '' ? null : Number(e.target.value))} error={!!errors.pcs} helperText={errors.pcs?.message} />
                            )} />
                        </Box>
                        <Box>
                            <Controller name="hours" control={control} render={({ field }) => (
                                <TextField {...field} value={field.value ?? ''} label="Hours" type="number" fullWidth variant="outlined" size="small" onChange={e => field.onChange(e.target.value === '' ? null : Number(e.target.value))} error={!!errors.hours} helperText={errors.hours?.message} />
                            )} />
                        </Box>
                        <Box>
                            <Controller name="additionalInformation" control={control} render={({ field }) => (
                                <TextField {...field} value={field.value ?? ''} label="Additional Information" multiline rows={2} fullWidth variant="outlined" size="small" error={!!errors.additionalInformation} helperText={errors.additionalInformation?.message} />
                            )} />
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={onClose} disabled={isSaving}>Cancel</Button>
                    <Button type="submit" variant="contained" disabled={isSaving}>
                        {isSaving ? <CircularProgress size={24} /> : 'Save Changes'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default EditInspectionModal;