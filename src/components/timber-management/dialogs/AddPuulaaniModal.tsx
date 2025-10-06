// frontend/src/components/map/dialogs/AddPuulaaniModal.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, TextField,
    FormControl, InputLabel, Select, MenuItem, FormHelperText, IconButton, Typography, Stack, Grid, Paper,
    Alert,
    CircularProgress
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useForm, Controller, SubmitHandler, FieldValues } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';

import LocationPicker from '@/components/common/LocationPicker'; 
import { IClientBasicInfo, PendingPuulaaniData } from '@/types';
import { useTranslation } from 'react-i18next';

interface AddPuulaaniModalProps {
    open: boolean;
    onCloseAction: () => void;
    onNextAction: (data: Partial<PendingPuulaaniData>) => void;
    clientList: IClientBasicInfo[];
}

// Build schema with i18n
const getSchema = (t: (k: string, o?: any) => string) => yup.object({
  name: yup.string().required(t('addPuulaaniModal:validation.name.required')),
  clientId: yup.string().required(t('addPuulaaniModal:validation.client.required')),
  date: yup.mixed<Dayjs>().nullable().required(t('addPuulaaniModal:validation.date.required')),
  latitude: yup
    .number()
    .typeError(t('addPuulaaniModal:validation.location.selectOnMap'))
    .required(t('addPuulaaniModal:validation.latitude.required')),
  longitude: yup
    .number()
    .typeError(t('addPuulaaniModal:validation.location.selectOnMap'))
    .required(t('addPuulaaniModal:validation.longitude.required')),
});

type AddPuulaaniFormData = yup.InferType<ReturnType<typeof getSchema>>;

export default function AddPuulaaniModal({ open, onCloseAction, onNextAction, clientList }: AddPuulaaniModalProps) {
    const { t } = useTranslation(['addPuulaaniModal', 'common']);

  const addSchema = useMemo(() => getSchema(t), [t]);

    const { control, handleSubmit, reset, setValue, watch, formState: { errors, isValid } } = useForm<AddPuulaaniFormData>({
        resolver: yupResolver(addSchema),
        defaultValues: { name: '', clientId: '', date: dayjs(), latitude: undefined, longitude: undefined }
    });

    const [isSaving, setIsSaving] = useState(false);

    const [error, setError] = useState<string | null>(null);
    const latValue = watch('latitude');
    const lngValue = watch('longitude');

    useEffect(() => {
        if (open) {
            reset({ name: '', clientId: '', date: dayjs(), latitude: undefined, longitude: undefined });
        }
    }, [open, reset]);
    
    const handleLocationChange = (lat: string, lng: string) => {
        setValue('latitude', parseFloat(lat), { shouldValidate: true });
        setValue('longitude', parseFloat(lng), { shouldValidate: true });
    };

    const onSubmit: SubmitHandler<AddPuulaaniFormData> = (data) => {
    const pendingData: Partial<PendingPuulaaniData> = {
        name: data.name,
        clientId: data.clientId, 
        date: data.date as Dayjs,
        latitude: data.latitude,
        longitude: data.longitude,
        isActive: true,
        isCompleted: false,
        additionalInfo: '',
        dispatchOrderNo: ''
    };
    onNextAction(pendingData);
};

     return (

        <Dialog open={open} onClose={onCloseAction} maxWidth="md" fullWidth> 
            <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" component="div">{t('addPuulaaniModal:title')}</Typography>
                <IconButton aria-label={t('addPuulaaniModal:actions.closeAria')} onClick={onCloseAction} sx={{ color: (theme) => theme.palette.grey[500] }}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <Box component="form" id="add-puulaani-form" onSubmit={handleSubmit(onSubmit as SubmitHandler<FieldValues>)}>
                <DialogContent dividers sx={{ p: { xs: 2, sm: 3 }, backgroundColor: '#f7f7f7' }}>
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                    
                    <Stack spacing={3}>
                        
                        <Paper variant="outlined" sx={{ p: 2.5 }}>
                            <Typography variant="overline" color="text.secondary" gutterBottom>
                                {t('addPuulaaniModal:sections.primaryDetails')}
                            </Typography>
                            <Stack spacing={2} sx={{ mt: 1 }}>
                                <Controller name="name" control={control} render={({ field }) => ( <TextField {...field} label={t('addPuulaaniModal:fields.name')} fullWidth required autoFocus error={!!errors.name} helperText={errors.name?.message} size="small" /> )}/>
                                <FormControl fullWidth required error={!!errors.clientId} size="small">
                                    <InputLabel>{t('addPuulaaniModal:fields.client')}</InputLabel>
                                    <Controller name="clientId" control={control} render={({ field }) => ( 
                                        <Select {...field} label={t('addPuulaaniModal:fields.client')} value={field.value || ''}>
                                            {clientList.map((c) => ( <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem> ))} 
                                        </Select> 
                                    )}/>
                                    {errors.clientId && <FormHelperText>{errors.clientId.message}</FormHelperText>}
                                </FormControl>
                                <LocalizationProvider dateAdapter={AdapterDayjs}>
                                    <Controller name="date" control={control} render={({ field }) => ( <DatePicker {...field} value={field.value || null} label={t('addPuulaaniModal:fields.date')} format="DD.MM.YYYY" slotProps={{ textField: { fullWidth: true, required: true, error: !!errors.date, size: 'small' } }}/> )}/>
                                </LocalizationProvider>
                            </Stack>
                        </Paper>

                        <Paper variant="outlined" sx={{ p: 2.5 }}>
                            <Typography variant="overline" color="text.secondary" gutterBottom>
                                {t('addPuulaaniModal:sections.mapLocation')}
                            </Typography>
                            <Stack spacing={1} sx={{ mt: 1 }}>
                                <LocationPicker 
                                    initialLat={latValue}
                                    initialLng={lngValue}
                                    onLocationChange={handleLocationChange}
                                />
                                <Grid container spacing={2}>
                                    <Grid item xs={6}>
                                        <Controller name="latitude" control={control} render={({ field }) => ( <TextField {...field} value={field.value || ''} label={t('addPuulaaniModal:fields.latitude')} fullWidth required InputProps={{ readOnly: true }} error={!!errors.latitude} helperText={errors.latitude?.message} size="small" /> )}/>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Controller name="longitude" control={control} render={({ field }) => ( <TextField {...field} value={field.value || ''} label={t('addPuulaaniModal:fields.longitude')} fullWidth required InputProps={{ readOnly: true }} error={!!errors.longitude} helperText={errors.longitude?.message} size="small" /> )}/>
                                    </Grid>
                                </Grid>
                            </Stack>
                        </Paper>

                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                     <Button onClick={onCloseAction}>{t('common:buttons.cancel')}</Button>
                     <Button type="submit" form="add-puulaani-form" variant="contained" disabled={isSaving || !isValid}>
                        {isSaving ? <CircularProgress size={24} /> : t('addPuulaaniModal:actions.saveContinue')}
                    </Button>
                </DialogActions>
            </Box>
        </Dialog>
    );
}