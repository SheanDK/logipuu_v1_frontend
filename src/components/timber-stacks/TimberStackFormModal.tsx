// src/components/timber-stacks/TimberStackFormModal.tsx

//file not in use


'use client';

import React, { useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Grid,
    CircularProgress, FormControlLabel, Checkbox, Box, Alert, Autocomplete, FormHelperText,
    FormControl, InputLabel
} from '@mui/material';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import { useTranslation } from 'react-i18next';

import { ITimberStack, ICreateTimberStackDto, IUpdateTimberStackDto, ITimberStackFormData, IClientBasicInfo } from '../../types';

const validationSchema = yup.object().shape({
    name: yup.string().required('Stack name is required').max(200),
    clientId: yup.string().nullable().required('Client is required'),
    date: yup.mixed<Dayjs>().nullable().required('Date is required').typeError('A valid date is required'),
    totalVolume: yup.number().transform(v => (isNaN(v) ? null : v)).nullable().min(0).required('Total volume is required'),
    kilometers: yup.number().transform(v => (isNaN(v) ? null : v)).nullable().min(0),
    isActive: yup.boolean().required(),
    isCompleted: yup.boolean().required(),
    vehicleNumbers: yup.string().nullable(),
    additionalInfo: yup.string().nullable(),
    dispatchOrderNo: yup.string().nullable(),
    latitude: yup.number().nullable(),
    longitude: yup.number().nullable(),
});

interface TimberStackFormModalProps {
    open: boolean;
    onClose: () => void;
    onSave: (data: ICreateTimberStackDto | IUpdateTimberStackDto, id?: number) => Promise<void>;
    initialData?: ITimberStack | null;
    isSaving: boolean;
    apiError: string | null;
    clientList: IClientBasicInfo[];
}

const TimberStackFormModal: React.FC<TimberStackFormModalProps> = ({
    open, onClose, onSave, initialData, isSaving, apiError, clientList
}) => {
    const isEditMode = !!initialData;
    const {
        handleSubmit,
        control,
        reset,
        formState: { errors, isValid, isDirty },
    } = useForm<ITimberStackFormData>({
        resolver: yupResolver(validationSchema) as any,
        defaultValues: {
            name: '', clientId: null, date: null, totalVolume: null, kilometers: null,
            isActive: true, isCompleted: false, vehicleNumbers: '', additionalInfo: '',
            dispatchOrderNo: '', latitude: null, longitude: null,
        },
        mode: 'onChange',
    });

    useEffect(() => {
        if (open) {
            if (initialData) {
                reset({
                    name: initialData.name,
                    clientId: String(initialData.clientId),
                    date: initialData.date ? dayjs(initialData.date) : null,
                    totalVolume: initialData.totalVolume,
                    kilometers: initialData.kilometers,
                    isActive: initialData.isActive,
                    isCompleted: initialData.isCompleted,
                    vehicleNumbers: initialData.vehicleNumbers || '',
                    additionalInfo: initialData.additionalInfo || '',
                    dispatchOrderNo: initialData.dispatchOrderNo || '',
                    latitude: initialData.latitude,
                    longitude: initialData.longitude,
                });
            } else {
                reset({
                    name: '', clientId: null, date: dayjs(), totalVolume: null, kilometers: null,
                    isActive: true, isCompleted: false, vehicleNumbers: '', additionalInfo: '',
                    dispatchOrderNo: '', latitude: null, longitude: null,
                });
            }
        }
    }, [initialData, open, reset]);

    const onSubmitHandler: SubmitHandler<ITimberStackFormData> = async (formData) => {
        const sanitizeString = (value: string | null | undefined): string | undefined => (value && value.trim() !== '') ? value.trim() : undefined;
        const sanitizeNumber = (value: number | null | undefined): number | undefined => (value === null || value === undefined || isNaN(value)) ? undefined : Number(value);

        if (isEditMode && initialData) {
            const updatePayload: IUpdateTimberStackDto = {
                name: formData.name,
                vehicleNumbers: sanitizeString(formData.vehicleNumbers),
                additionalInfo: sanitizeString(formData.additionalInfo),
                totalVolume: sanitizeNumber(formData.totalVolume),
                kilometers: sanitizeNumber(formData.kilometers),
                isActive: formData.isActive,
                isCompleted: formData.isCompleted,
                dispatchOrderNo: sanitizeString(formData.dispatchOrderNo),
            };
            await onSave(updatePayload, initialData.timberStackId);
        } else {
            if (!formData.clientId || !formData.date || formData.totalVolume === null) return;
            const createPayload: ICreateTimberStackDto = {
                name: formData.name,
                clientId: Number(formData.clientId),
                date: formData.date.format('YYYY-MM-DD'),
                totalVolume: formData.totalVolume,
                remainingVolume: formData.totalVolume,
                kilometers: sanitizeNumber(formData.kilometers),
                isActive: formData.isActive,
                isCompleted: formData.isCompleted,
                vehicleNumbers: sanitizeString(formData.vehicleNumbers),
                additionalInfo: sanitizeString(formData.additionalInfo),
                dispatchOrderNo: sanitizeString(formData.dispatchOrderNo),
                latitude: formData.latitude ?? undefined,
                longitude: formData.longitude ?? undefined,
            };
            await onSave(createPayload);
        }
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
                <DialogTitle>{isEditMode ? 'Edit Timber Stack' : 'Add New Timber Stack'}</DialogTitle>
                <Box component="form" id="timber-stack-form" onSubmit={handleSubmit(onSubmitHandler)}>
                    <DialogContent dividers>
                        {apiError && <Alert severity="error" sx={{ mb: 2 }}>{apiError}</Alert>}
                        <Grid container spacing={2} sx={{ pt: 1 }}>
                            <Grid item xs={12} sm={6}><Controller name="name" control={control} render={({ field }) => <TextField {...field} value={field.value ?? ''} label="Stack Name" fullWidth required autoFocus error={!!errors.name} helperText={errors.name?.message} />}/></Grid>
                            <Grid item xs={12} sm={6}><Controller name="clientId" control={control} render={({ field }) => (<Autocomplete options={clientList} getOptionLabel={(o) => o.name} value={clientList.find(c => c.id === field.value) || null} onChange={(_, nv) => field.onChange(nv ? nv.id : null)} isOptionEqualToValue={(o,v) => o.id === v.id} disabled={isEditMode} renderInput={(params) => <TextField {...params} label="Client" required error={!!errors.clientId} helperText={errors.clientId?.message} />} />)}/></Grid>
                            <Grid item xs={12} sm={4}><Controller name="date" control={control} render={({ field }) => <DatePicker label="Date" {...field} value={field.value} disabled={isEditMode} slotProps={{ textField: { fullWidth: true, required: true, error: !!errors.date, helperText: errors.date?.message as string } }} />}/></Grid>
                            <Grid item xs={12} sm={4}><Controller name="totalVolume" control={control} render={({ field }) => <TextField {...field} value={field.value ?? ''} label="Total Volume (m³)" type="number" fullWidth required error={!!errors.totalVolume} helperText={errors.totalVolume?.message} />}/></Grid>
                            <Grid item xs={12} sm={4}><Controller name="kilometers" control={control} render={({ field }) => <TextField {...field} value={field.value ?? ''} label="Distance (km)" type="number" fullWidth error={!!errors.kilometers} helperText={errors.kilometers?.message} />}/></Grid>
                            <Grid item xs={12}><Controller name="dispatchOrderNo" control={control} render={({ field }) => <TextField {...field} value={field.value ?? ''} label="Dispatch Order No." fullWidth error={!!errors.dispatchOrderNo} helperText={errors.dispatchOrderNo?.message} />}/></Grid>
                            <Grid item xs={12}><Controller name="vehicleNumbers" control={control} render={({ field }) => <TextField {...field} value={field.value ?? ''} label="Vehicle Registration Nos. (comma separated)" fullWidth error={!!errors.vehicleNumbers} helperText={errors.vehicleNumbers?.message} />}/></Grid>
                            <Grid item xs={12}><Controller name="additionalInfo" control={control} render={({ field }) => <TextField {...field} value={field.value ?? ''} label="Additional Info" multiline rows={3} fullWidth error={!!errors.additionalInfo} helperText={errors.additionalInfo?.message} />}/></Grid>
                            <Grid item xs={12} sm={6}><FormControlLabel control={<Controller name="isActive" control={control} render={({ field }) => <Checkbox {...field} checked={Boolean(field.value)} />}/>} label="Active" /></Grid>
                            <Grid item xs={12} sm={6}><FormControlLabel control={<Controller name="isCompleted" control={control} render={({ field }) => <Checkbox {...field} checked={Boolean(field.value)} />}/>} label="Completed" /></Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions sx={{ p: '16px 24px' }}>
                        <Button onClick={onClose} disabled={isSaving}>Cancel</Button>
                        <Button type="submit" form="timber-stack-form" variant="contained" disabled={isSaving || !isDirty || !isValid}>{isSaving ? <CircularProgress size={24} /> : 'Save'}</Button>
                    </DialogActions>
                </Box>
            </Dialog>
        </LocalizationProvider>
    );
};

export default TimberStackFormModal;