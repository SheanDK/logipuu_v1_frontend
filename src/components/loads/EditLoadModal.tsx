// frontend/src/components/loads/EditLoadModal.tsx
'use client';

import React, { useEffect, useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, TextField,
    Grid, CircularProgress, Alert, Stack, Typography, IconButton
} from '@mui/material';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import CloseIcon from '@mui/icons-material/Close';

import { ILoadDetails, IUpdateLoadDto } from '@/types';
import { updateLoad } from '@/services/loadService';

interface EditLoadFormData {
    pvm: Date | null;
    vastaanottoNro: string;
    reitti: string;
    m3: number;
    km: number;
    tunnit: number;
    kpl: number;
    lisatiedot: string;
}

const schema = yup.object({
    pvm: yup.date().required('Date is required').typeError('A valid date is required'),
    vastaanottoNro: yup.string().nullable(),
    reitti: yup.string().nullable(),
    m3: yup.number().typeError('Must be a number').min(0).nullable(),
    km: yup.number().typeError('Must be a number').min(0).nullable(),
    tunnit: yup.number().typeError('Must be a number').min(0).nullable(),
    kpl: yup.number().typeError('Must be a number').min(0).nullable(),
    lisatiedot: yup.string().nullable(),
});

interface EditLoadModalProps {
    open: boolean;
    onCloseAction: () => void;
    onSaveSuccessAction: (message: string) => void;
    loadData: ILoadDetails;
}

export default function EditLoadModal({ open, onCloseAction, onSaveSuccessAction, loadData }: EditLoadModalProps) {
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { control, handleSubmit, reset, formState: { errors, isDirty, isValid } } = useForm<EditLoadFormData>({
        resolver: yupResolver(schema) as any, mode: 'onChange',
    });

    useEffect(() => {
        if (loadData) {
            reset({
                pvm: dayjs(loadData.pvm).toDate(),
                vastaanottoNro: loadData.vastaanottoNro || '',
                reitti: loadData.reitti || '',
                m3: loadData.m3 || 0,
                km: loadData.km || 0,
                tunnit: loadData.tunnit || 0,
                kpl: loadData.kpl || 0,
                lisatiedot: loadData.lisatiedot || ''
            });
        }
    }, [loadData, reset]);

    const onSubmit: SubmitHandler<EditLoadFormData> = async (formData) => {
        setIsSaving(true);
        setError(null);
        const payload: IUpdateLoadDto = {
            pvm: formData.pvm!, vastaanottoNro: formData.vastaanottoNro || null, reitti: formData.reitti || null,
            m3: formData.m3, km: formData.km, tunnit: formData.tunnit, kpl: formData.kpl, lisatiedot: formData.lisatiedot || null,
        };
        try {
            await updateLoad(loadData.kuormaId, payload);
            onSaveSuccessAction('Load updated successfully!');
        } catch (err: any) {
            setError(err.response?.data?.message || "An error occurred while updating the load.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Dialog open={open} onClose={onCloseAction} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" component="div">Edit Load #{loadData.kuormaId}</Typography>
                    <IconButton aria-label="close" onClick={onCloseAction}><CloseIcon /></IconButton>
                </DialogTitle>
                <Box component="form" id="edit-load-form" onSubmit={handleSubmit(onSubmit)}>
                    <DialogContent dividers sx={{ p: { xs: 2, sm: 3 } }}>
                        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}><Controller name="pvm" control={control} render={({ field }) => (<DatePicker label="Date" value={field.value ? dayjs(field.value) : null} onChange={(date) => field.onChange(date?.toDate() ?? null)} slotProps={{ textField: { fullWidth: true, required: true, error: !!errors.pvm, helperText: errors.pvm?.message } }}/>)}/></Grid>
                            <Grid item xs={12} sm={6}><Controller name="vastaanottoNro" control={control} render={({ field }) => <TextField {...field} value={field.value ?? ''} label="Reception No." fullWidth error={!!errors.vastaanottoNro} helperText={errors.vastaanottoNro?.message} />}/></Grid>
                            <Grid item xs={12}><Controller name="reitti" control={control} render={({ field }) => <TextField {...field} value={field.value ?? ''} label="Driving Route" fullWidth error={!!errors.reitti} helperText={errors.reitti?.message} />}/></Grid>
                            <Grid item xs={6} sm={3}><Controller name="m3" control={control} render={({ field }) => <TextField {...field} value={field.value ?? ''} type="number" label="Cubic Metres (m³)" fullWidth error={!!errors.m3} helperText={errors.m3?.message} />}/></Grid>
                            <Grid item xs={6} sm={3}><Controller name="km" control={control} render={({ field }) => <TextField {...field} value={field.value ?? ''} type="number" label="Freight (km)" fullWidth error={!!errors.km} helperText={errors.km?.message} />}/></Grid>
                            <Grid item xs={6} sm={3}><Controller name="tunnit" control={control} render={({ field }) => <TextField {...field} value={field.value ?? ''} type="number" label="Hours" fullWidth error={!!errors.tunnit} helperText={errors.tunnit?.message} />}/></Grid>
                            <Grid item xs={6} sm={3}><Controller name="kpl" control={control} render={({ field }) => <TextField {...field} value={field.value ?? ''} type="number" label="Pcs" fullWidth error={!!errors.kpl} helperText={errors.kpl?.message} />}/></Grid>
                            <Grid item xs={12}><Controller name="lisatiedot" control={control} render={({ field }) => <TextField {...field} value={field.value ?? ''} label="Additional Information" multiline rows={3} fullWidth error={!!errors.lisatiedot} helperText={errors.lisatiedot?.message} />}/></Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                         <Button onClick={onCloseAction} disabled={isSaving}>Cancel</Button>
                         <Button type="submit" form="edit-load-form" variant="contained" disabled={isSaving || !isDirty || !isValid}>{isSaving ? <CircularProgress size={24} /> : 'Update Load'}</Button>
                    </DialogActions>
                </Box>
            </Dialog>
        </LocalizationProvider>
    );
}