// frontend/src/components/other-info/OtherInfoFormModal.tsx

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

import { ICreateOtherInfoDto, IUpdateOtherInfoDto, IOtherInfo, IOtherInfoFormData, OtherInfoTypeEnum } from '../../types';
import { createOtherInfo, updateOtherInfo } from '../../services/otherInfoService';
import LocationPicker from '../common/LocationPicker';

interface OtherInfoFormModalProps {
    open: boolean;
    onClose: () => void;
    onSave: (data: ICreateOtherInfoDto | IUpdateOtherInfoDto, otherInfoId?: string) => Promise<void>; 
    initialData?: IOtherInfo | null;
    isSaving: boolean;
    apiError: string | null;
}

// --- KEY CORRECTION IS HERE ---
// Define numeric enum values as a constant array for Yup's oneOf.
const OTHER_INFO_TYPES_NUMERIC = Object.values(OtherInfoTypeEnum).filter(v => typeof v === 'number') as number[];

const validationSchema = yup.object().shape({
    type: yup.number()
        .typeError('Type is required.') // Ensure it's a number
        .required('Type is required.')
        // Use oneOf with the explicitly defined numeric array.
        .oneOf(OTHER_INFO_TYPES_NUMERIC, 'Invalid type selected.'), 
    // --- END CORRECTION ---
    details: yup.string().required('Details are required.').max(500),
    latitude: yup.string().nullable().matches(/^-?\d{1,3}\.\d{6,}$/, { message: 'Invalid latitude format', excludeEmptyString: true }),
    longitude: yup.string().nullable().matches(/^-?\d{1,3}\.\d{6,}$/, { message: 'Invalid longitude format', excludeEmptyString: true }),
});

const OtherInfoFormModal: React.FC<OtherInfoFormModalProps> = ({ open, onClose, onSave, initialData, isSaving, apiError }) => {
    const [location, setLocation] = useState<{ lat: string; lng: string } | null>(null);

    const {
        handleSubmit,
        control,
        reset,
        setValue,
        formState: { errors, isValid, isDirty },
    } = useForm<IOtherInfoFormData>({
        resolver: yupResolver(validationSchema),
        defaultValues: {
            type: '', details: '', latitude: '', longitude: '',
        },
        mode: 'onChange',
    });

    useEffect(() => {
        if (open) {
            if (initialData) {
                const initialLat = initialData.latitude || '';
                const initialLng = initialData.longitude || '';
                setLocation({ lat: initialLat, lng: initialLng });
                reset({
                    type: initialData.type,
                    details: initialData.details,
                    latitude: initialLat,
                    longitude: initialLng,
                });
            } else {
                reset({ type: '', details: '', latitude: '', longitude: '' });
                setLocation(null);
            }
        }
    }, [initialData, open, reset]);

    const handleLocationChange = (lat: string, lng: string) => {
        setLocation({ lat, lng });
        setValue('latitude', lat, { shouldValidate: true, shouldDirty: true });
        setValue('longitude', lng, { shouldValidate: true, shouldDirty: true });
    };

    const onSubmitHandler: SubmitHandler<IOtherInfoFormData> = async (formData) => {
        const submissionData: ICreateOtherInfoDto | IUpdateOtherInfoDto = {
            type: formData.type as OtherInfoTypeEnum, 
            details: formData.details,
            latitude: formData.latitude || null,
            longitude: formData.longitude || null,
        };
        await onSave(submissionData, initialData?.otherInfoId);
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>{initialData ? 'Edit Other Info' : 'Add New Other Info'}</DialogTitle>
            <Box component="form" id="other-info-form" onSubmit={handleSubmit(onSubmitHandler)}>
                <DialogContent dividers>
                    {apiError && <Alert severity="error" sx={{ mb: 2 }}>{apiError}</Alert>}
                    <Grid container spacing={2} sx={{ pt: 1 }}>
                        <Grid item xs={12}>
                            <FormControl fullWidth required error={!!errors.type}>
                                <InputLabel id="type-label">Type</InputLabel>
                                <Controller name="type" control={control} render={({ field }) => (
                                    <Select {...field} labelId="type-label" label="Type" value={field.value || ''}>
                                        {/* Now map using the numeric keys, which are numbers */}
                                        {Object.keys(OtherInfoTypeEnum).filter(k => !isNaN(Number(k))).map(key => (
                                            <MenuItem key={key} value={Number(key)}>{OtherInfoTypeEnum[Number(key)]}</MenuItem>
                                        ))}
                                    </Select>
                                )}/>
                                {errors.type && <FormHelperText>{errors.type.message}</FormHelperText>}
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                            <Controller name="details" control={control} render={({ field }) => <TextField {...field} label="Details" multiline rows={3} fullWidth required error={!!errors.details} helperText={errors.details?.message} />}/></Grid>
                        <Grid item xs={12}>
                            <LocationPicker initialLat={location?.lat} initialLng={location?.lng} onLocationChange={handleLocationChange} label="Select Location on Map"/>
                            {errors.latitude && <FormHelperText error>{errors.latitude?.message}</FormHelperText>}
                            {errors.longitude && <FormHelperText error>{errors.longitude?.message}</FormHelperText>}
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ p: '16px 24px' }}>
                    <Button onClick={onClose} disabled={isSaving}>Cancel</Button>
                    <Button type="submit" form="other-info-form" variant="contained" disabled={isSaving || !isDirty || !isValid}>
                        {isSaving ? <CircularProgress size={24} /> : 'Save'}
                    </Button>
                </DialogActions>
            </Box>
        </Dialog>
    );
};

export default OtherInfoFormModal;