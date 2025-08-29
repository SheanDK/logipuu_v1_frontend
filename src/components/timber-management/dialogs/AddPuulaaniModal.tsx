// frontend/src/components/map/dialogs/AddPuulaaniModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
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

interface AddPuulaaniModalProps {
    open: boolean;
    onCloseAction: () => void;
    onNextAction: (data: Partial<PendingPuulaaniData>) => void;
    clientList: IClientBasicInfo[];
}

const addSchema = yup.object({
    name: yup.string().required('Object Name is required'),
    clientId: yup.string().required('Customer is required'),
    date: yup.mixed<Dayjs>().nullable().required('Date is required'),
    latitude: yup.number().typeError('Select a location from the map').required('Latitude is required'),
    longitude: yup.number().typeError('Select a location from the map').required('Longitude is required'),
});

type AddPuulaaniFormData = yup.InferType<typeof addSchema>;

export default function AddPuulaaniModal({ open, onCloseAction, onNextAction, clientList }: AddPuulaaniModalProps) {
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
    // --- THIS IS THE FIX ---
    // The 'data.clientId' from the form is already a string,
    // which is what the PendingPuulaaniData type expects.
    // No conversion is needed.
    const pendingData: Partial<PendingPuulaaniData> = {
        name: data.name,
        clientId: data.clientId, // Keep it as a string
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
        // --- THIS IS THE CHANGE: maxWidth is now 'xs' for a more compact view ---
        <Dialog open={open} onClose={onCloseAction} maxWidth="md" fullWidth> 
            <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" component="div">Create New Puulaani (Step 1)</Typography>
                <IconButton aria-label="close" onClick={onCloseAction} sx={{ color: (theme) => theme.palette.grey[500] }}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <Box component="form" id="add-puulaani-form" onSubmit={handleSubmit(onSubmit as SubmitHandler<FieldValues>)}>
                <DialogContent dividers sx={{ p: { xs: 2, sm: 3 }, backgroundColor: '#f7f7f7' }}>
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                    
                    <Stack spacing={3}>
                        
                        <Paper variant="outlined" sx={{ p: 2.5 }}>
                            <Typography variant="overline" color="text.secondary" gutterBottom>
                                Primary Details
                            </Typography>
                            <Stack spacing={2} sx={{ mt: 1 }}>
                                <Controller name="name" control={control} render={({ field }) => ( <TextField {...field} label="Object Name" fullWidth required autoFocus error={!!errors.name} helperText={errors.name?.message} size="small" /> )}/>
                                <FormControl fullWidth required error={!!errors.clientId} size="small">
                                    <InputLabel>Customer</InputLabel>
                                    <Controller name="clientId" control={control} render={({ field }) => ( 
                                        <Select {...field} label="Customer" value={field.value || ''}>
                                            {clientList.map((c) => ( <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem> ))} 
                                        </Select> 
                                    )}/>
                                    {errors.clientId && <FormHelperText>{errors.clientId.message}</FormHelperText>}
                                </FormControl>
                                <LocalizationProvider dateAdapter={AdapterDayjs}>
                                    <Controller name="date" control={control} render={({ field }) => ( <DatePicker {...field} value={field.value || null} label="Date" format="DD.MM.YYYY" slotProps={{ textField: { fullWidth: true, required: true, error: !!errors.date, size: 'small' } }}/> )}/>
                                </LocalizationProvider>
                            </Stack>
                        </Paper>

                        <Paper variant="outlined" sx={{ p: 2.5 }}>
                            <Typography variant="overline" color="text.secondary" gutterBottom>
                                Location on Map
                            </Typography>
                            <Stack spacing={1} sx={{ mt: 1 }}>
                                <LocationPicker 
                                    initialLat={latValue}
                                    initialLng={lngValue}
                                    onLocationChange={handleLocationChange}
                                />
                                <Grid container spacing={2}>
                                    <Grid item xs={6}>
                                        <Controller name="latitude" control={control} render={({ field }) => ( <TextField {...field} value={field.value || ''} label="Latitude" fullWidth required InputProps={{ readOnly: true }} error={!!errors.latitude} helperText={errors.latitude?.message} size="small" /> )}/>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Controller name="longitude" control={control} render={({ field }) => ( <TextField {...field} value={field.value || ''} label="Longitude" fullWidth required InputProps={{ readOnly: true }} error={!!errors.longitude} helperText={errors.longitude?.message} size="small" /> )}/>
                                    </Grid>
                                </Grid>
                            </Stack>
                        </Paper>

                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                     <Button onClick={onCloseAction}>Cancel</Button>
                     <Button type="submit" form="add-puulaani-form" variant="contained" disabled={isSaving || !isValid}>
                        {isSaving ? <CircularProgress size={24} /> : 'Save & Continue'}
                    </Button>
                </DialogActions>
            </Box>
        </Dialog>
    );
}