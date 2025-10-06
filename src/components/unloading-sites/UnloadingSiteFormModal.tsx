// frontend/src/components/unloading-sites/UnloadingSiteFormModal.tsx

// file not in use

'use client';

import React, { useEffect, useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
    Grid, CircularProgress, FormControl, InputLabel, Select, MenuItem, FormHelperText, Box,
    Alert
} from '@mui/material';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import { IClient, ICreateUnloadingSiteDto, IUpdateUnloadingSiteDto, IUnloadingSite, IUnloadingSiteFormData } from '../../types';
import { fetchAllClients } from '../../services/clientService';
import { createUnloadingSite, updateUnloadingSite } from '../../services/unloadingSiteService';
import LocationPicker from '../common/LocationPicker';

interface UnloadingSiteFormModalProps {
    open: boolean;
    onClose: () => void;
    onSave: (data: ICreateUnloadingSiteDto | IUpdateUnloadingSiteDto, unloadingSiteId?: string) => Promise<void>; 
    initialData?: IUnloadingSite | null;
    isSaving: boolean;
    apiError: string | null;
}

const validationSchema = yup.object().shape({
    // --- KEY CORRECTION IS HERE ---
    clientId: yup.mixed<number | ''>() // Allow number or empty string
        .required('Client is required.')
        .transform((value, originalValue) => {
            // If original value is an empty string, transform to undefined for .required()
            return originalValue === '' ? undefined : Number(value);
        })
        .test('is-number-or-undefined', 'Client is required.', (value) => {
            // Custom test to ensure it's a number if it's not undefined
            return value === undefined || typeof value === 'number';
        })
        .defined(), // Ensure the field is defined (not undefined after transform)
    // --- END CORRECTION ---
    unloadingSiteName: yup.string().required('Unloading site name is required.').max(100),
    latitude: yup.string().nullable().matches(/^-?\d{1,3}\.\d{6,}$/, { message: 'Invalid latitude format', excludeEmptyString: true }),
    longitude: yup.string().nullable().matches(/^-?\d{1,3}\.\d{6,}$/, { message: 'Invalid longitude format', excludeEmptyString: true }),
});

const UnloadingSiteFormModal: React.FC<UnloadingSiteFormModalProps> = ({ open, onClose, onSave, initialData, isSaving, apiError }) => {
    const [allClients, setAllClients] = useState<IClient[]>([]);
    const [location, setLocation] = useState<{ lat: string; lng: string } | null>(null);

    const {
        handleSubmit,
        control,
        reset,
        setValue,
        formState: { errors, isValid, isDirty },
    } = useForm<IUnloadingSiteFormData>({
        resolver: yupResolver(validationSchema),
        defaultValues: {
            clientId: '', // Set default to empty string
            unloadingSiteName: '', 
            latitude: '', 
            longitude: '',
        },
        mode: 'onChange',
    });

    useEffect(() => {
        if (open) {
            const getClients = async () => {
                try {
                    const clientsData = await fetchAllClients();
                    setAllClients(clientsData);
                } catch (err) {
                    console.error("Failed to load clients:", err);
                }
            };
            getClients();
        }
    }, [open]);

    useEffect(() => {
        if (open) {
            if (initialData) {
                const initialLat = initialData.latitude || '';
                const initialLng = initialData.longitude || '';
                setLocation({ lat: initialLat, lng: initialLng });
                reset({
                    clientId: initialData.clientId,
                    unloadingSiteName: initialData.unloadingSiteName,
                    latitude: initialLat,
                    longitude: initialLng,
                });
            } else {
                reset({ clientId: '', unloadingSiteName: '', latitude: '', longitude: '' });
                setLocation(null);
            }
        }
    }, [initialData, open, reset]);

    const handleLocationChange = (lat: string, lng: string) => {
        setLocation({ lat, lng });
        setValue('latitude', lat, { shouldValidate: true, shouldDirty: true });
        setValue('longitude', lng, { shouldValidate: true, shouldDirty: true });
    };

    const onSubmitHandler: SubmitHandler<IUnloadingSiteFormData> = async (formData) => {
        // Ensure clientId is a number for submission.
        if (typeof formData.clientId !== 'number') {
            // This should be caught by validation, but good to have a safeguard.
            console.error("Client ID is not a number, cannot submit.");
            return;
        }

        const submissionData: ICreateUnloadingSiteDto | IUpdateUnloadingSiteDto = {
            clientId: formData.clientId, // Now guaranteed to be a number.
            unloadingSiteName: formData.unloadingSiteName,
            latitude: formData.latitude || null,
            longitude: formData.longitude || null,
        };
        await onSave(submissionData, initialData?.unloadingSiteId);
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>{initialData ? 'Edit Unloading Site' : 'Add New Unloading Site'}</DialogTitle>
            <Box component="form" id="unloading-site-form" onSubmit={handleSubmit(onSubmitHandler)}>
                <DialogContent dividers>
                    {apiError && <Alert severity="error" sx={{ mb: 2 }}>{apiError}</Alert>}
                    <Grid container spacing={2} sx={{ pt: 1 }}>
                        <Grid item xs={12}>
                            <FormControl fullWidth required error={!!errors.clientId}>
                                <InputLabel id="client-label">Client</InputLabel>
                                <Controller name="clientId" control={control} render={({ field }) => (
                                    <Select {...field} labelId="client-label" label="Client" value={field.value || ''}>
                                        <MenuItem value=""><em>Select Client</em></MenuItem> {/* Placeholder */}
                                        {allClients.map((client) => (<MenuItem key={client.id} value={Number(client.id)}>{client.clientName}</MenuItem>))}
                                    </Select>
                                )}/>
                                {errors.clientId && <FormHelperText>{errors.clientId.message}</FormHelperText>}
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                            <Controller name="unloadingSiteName" control={control} render={({ field }) => <TextField {...field} label="Unloading Site Name" fullWidth required error={!!errors.unloadingSiteName} helperText={errors.unloadingSiteName?.message} />}/></Grid>
                        <Grid item xs={12}>
                            <LocationPicker initialLat={location?.lat} initialLng={location?.lng} onLocationChange={handleLocationChange} label="Select Location on Map"/>
                            {errors.latitude && <FormHelperText error>{errors.latitude?.message}</FormHelperText>}
                            {errors.longitude && <FormHelperText error>{errors.longitude?.message}</FormHelperText>}
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ p: '16px 24px' }}>
                    <Button onClick={onClose} disabled={isSaving}>Cancel</Button>
                    <Button type="submit" form="unloading-site-form" variant="contained" disabled={isSaving || !isDirty || !isValid}>
                        {isSaving ? <CircularProgress size={24} /> : 'Save'}
                    </Button>
                </DialogActions>
            </Box>
        </Dialog>
    );
};

export default UnloadingSiteFormModal;