// src/components/clients/ClientFormModal.tsx
'use client';

import React, { useEffect, useMemo } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
    Grid, CircularProgress, FormControlLabel, Checkbox, Box, Alert, Typography,
} from '@mui/material';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import { IClient, ICreateClientDto, IUpdateClientDto, IClientFormData, ClientTypeEnum } from '../../types';
import { checkTargetColorExists } from '../../services/clientService';
import NativeColorPicker from '../common/ColorPicker';

// Validation schema is now a function that accepts the editing client's ID
const validationSchema = (editingClientId?: string) => yup.object().shape({
    clientName: yup.string().required('Client Name is required').max(50),
    vatId: yup.string().nullable(),
    address: yup.string().nullable(),
    postalCode: yup.string().nullable(),
    city: yup.string().nullable(),
    phoneNo: yup.string().nullable(),
    contactPerson: yup.string().nullable(),
    email: yup.string().email('Enter a valid email.').nullable(),
    additionalInfo: yup.string().nullable(),

    targetColor: yup.string()
        .nullable()
        .when('isPuulaani', {
            is: true,
            then: (schema) => schema
                .required('Target Color is required for Puulaani clients.')
                .matches(/^#([0-9A-Fa-f]{6})$/i, { message: 'Must be a valid 6-digit hex color.', excludeEmptyString: true })
                .test(
                    'is-color-unique',
                    'This color is already in use.',
                    async (value) => {
                        if (!value) return true;
                        try {
                            const isTaken = await checkTargetColorExists(value, editingClientId);
                            return !isTaken;
                        } catch (error) {
                            console.error("Async color validation failed:", error);
                            return true;
                        }
                    }
                ),
        }),

    isPuulaani: yup.boolean().required(),
    isRahtikirja: yup.boolean().required(),
    isActive: yup.boolean().required(),
}).test(
    'at-least-one-type-selected',
    'At least one client type must be selected.',
    (values) => values.isPuulaani || values.isRahtikirja
);

// --- KEY CORRECTION: Add missing props to the interface ---
interface ClientFormModalProps {
    open: boolean;
    onClose: () => void;
    onSave: (data: ICreateClientDto | IUpdateClientDto, clientId?: string) => Promise<void>;
    initialData?: IClient | null;
    isSaving: boolean;
    usedColors: string[]; // This was missing
    currentClientColor: string | null; // This was missing
    apiError: string | null;
}
// --- END CORRECTION ---

const ClientFormModal: React.FC<ClientFormModalProps> = ({ open, onClose, onSave, initialData, isSaving, usedColors, currentClientColor, apiError }) => {

    const resolver = useMemo(
        () => yupResolver(validationSchema(initialData?.clientId)) as any,
        [initialData?.clientId]
    );

    const {
        handleSubmit,
        control,
        reset,
        watch,
        setValue,
        trigger,
        formState: { errors, isValid, isDirty },
    } = useForm<IClientFormData>({
        resolver,
        mode: 'onChange',
        reValidateMode: 'onChange',
        defaultValues: {
            clientName: '', vatId: '', address: '', postalCode: '', city: '',
            phoneNo: '', contactPerson: '', email: '', additionalInfo: '',
            targetColor: '#FFFFFF', isPuulaani: false, isRahtikirja: false, isActive: true,
        },
    });

    const isPuulaaniChecked = watch('isPuulaani');

    useEffect(() => {
        if (open) {
            if (initialData) {
                const isRahtikirja =
                    initialData.type === ClientTypeEnum.RAHTIKIRJA ||
                    initialData.type === ClientTypeEnum.BOTH;

                reset({
                    clientName: initialData.clientName,
                    vatId: initialData.vatId || '',
                    address: initialData.address || '',
                    postalCode: initialData.postalCode || '',
                    city: initialData.city || '',
                    phoneNo: initialData.phoneNo || '',
                    contactPerson: initialData.contactPerson || '',
                    email: initialData.email || '',
                    additionalInfo: initialData.additionalInfo || '',
                    targetColor: initialData.targetColor || '#FFFFFF',
                    isPuulaani: initialData.type === ClientTypeEnum.PUULAANI || initialData.type === ClientTypeEnum.BOTH,
                    isRahtikirja: initialData.type === ClientTypeEnum.RAHTIKIRJA || initialData.type === ClientTypeEnum.BOTH,
                    isActive: initialData.isActive,
                }, {
                    keepDirty: false,
                    keepErrors: false,
                    keepTouched: false,
                });
            } else {
                reset({
                    clientName: '', vatId: '', address: '', postalCode: '', city: '',
                    phoneNo: '', contactPerson: '', email: '', additionalInfo: '',
                    targetColor: '#FFFFFF', isPuulaani: false, isRahtikirja: false, isActive: true,
                }, {
                    keepDirty: false,
                    keepErrors: false,
                    keepTouched: false,
                });
            }
        }
    }, [initialData, open, reset, trigger]);

    useEffect(() => {
        const subscription = watch((values, { name }) => {
            if (name === 'isPuulaani' && !values.isPuulaani) {
                setValue('targetColor', '#FFFFFF', { shouldValidate: true, shouldDirty: true });
            }
        });
        return () => subscription.unsubscribe();
    }, [watch, setValue]);

    const onSubmitHandler: SubmitHandler<IClientFormData> = async (formData) => {
        let typeValue: ClientTypeEnum;
        if (formData.isPuulaani && formData.isRahtikirja) typeValue = ClientTypeEnum.BOTH;
        else if (formData.isPuulaani) typeValue = ClientTypeEnum.PUULAANI;
        else typeValue = ClientTypeEnum.RAHTIKIRJA;

        const TRANSPARENT = 'transparent';

        const submissionData: ICreateClientDto = {
            clientName: formData.clientName,
            vatId: formData.vatId || null,
            address: formData.address || null,
            postalCode: formData.postalCode || null,
            city: formData.city || null,
            phoneNo: formData.phoneNo || null,
            contactPerson: formData.contactPerson || null,
            email: formData.email || null,
            additionalInfo: formData.additionalInfo || null,
            targetColor: formData.isPuulaani ? formData.targetColor : '#808080',
            type: typeValue,
            isActive: formData.isActive,
        };

        //console.log("Submitting client data:", submissionData);


        await onSave(submissionData, initialData?.clientId);
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                <Typography variant="h5" component="span">{initialData ? 'Edit Client' : 'Add New Client'}</Typography>
            </DialogTitle>
            <Box component="form" onSubmit={handleSubmit(onSubmitHandler)} id="client-form" noValidate>
                <DialogContent dividers>
                    {apiError && <Alert severity="error" sx={{ mb: 2 }}>{apiError}</Alert>}
                    <Grid container spacing={2} sx={{ pt: 1 }}>
                        <Grid item xs={12} sm={6}><Controller name="clientName" control={control} render={({ field }) => (<TextField {...field} label="Client Name" fullWidth required autoFocus error={!!errors.clientName} helperText={errors.clientName?.message} />)} /></Grid>
                        <Grid item xs={12} sm={6}><Controller name="vatId" control={control} render={({ field }) => (<TextField {...field} value={field.value ?? ''} label="VAT ID" fullWidth error={!!errors.vatId} helperText={errors.vatId?.message} />)} /></Grid>
                        <Grid item xs={12}><Controller name="address" control={control} render={({ field }) => (<TextField {...field} value={field.value ?? ''} label="Address" fullWidth error={!!errors.address} helperText={errors.address?.message} />)} /></Grid>
                        <Grid item xs={12} sm={6}><Controller name="postalCode" control={control} render={({ field }) => (<TextField {...field} value={field.value ?? ''} label="Postal Code" fullWidth error={!!errors.postalCode} helperText={errors.postalCode?.message} />)} /></Grid>
                        <Grid item xs={12} sm={6}><Controller name="city" control={control} render={({ field }) => (<TextField {...field} value={field.value ?? ''} label="City" fullWidth error={!!errors.city} helperText={errors.city?.message} />)} /></Grid>
                        <Grid item xs={12} sm={6}><Controller name="phoneNo" control={control} render={({ field }) => (<TextField {...field} value={field.value ?? ''} label="Phone Number" fullWidth error={!!errors.phoneNo} helperText={errors.phoneNo?.message} />)} /></Grid>
                        <Grid item xs={12} sm={6}><Controller name="contactPerson" control={control} render={({ field }) => (<TextField {...field} value={field.value ?? ''} label="Contact Person" fullWidth error={!!errors.contactPerson} helperText={errors.contactPerson?.message} />)} /></Grid>
                        <Grid item xs={12} sm={6}><Controller name="email" control={control} render={({ field }) => (<TextField {...field} value={field.value ?? ''} label="Email" fullWidth type="email" error={!!errors.email} helperText={errors.email?.message} />)} /></Grid>
                        <Grid item xs={12}><Controller name="additionalInfo" control={control} render={({ field }) => (<TextField {...field} value={field.value ?? ''} label="Additional Info" fullWidth multiline rows={2} error={!!errors.additionalInfo} helperText={errors.additionalInfo?.message} />)} /></Grid>

                        <Grid item xs={12}>
                            <Box>
                                <Typography variant="subtitle2" gutterBottom>Type *</Typography>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <Controller name="isPuulaani" control={control} render={({ field }) => (<FormControlLabel control={<Checkbox {...field} checked={field.value} />} label="Puulaani" />)} />
                                    <Controller name="isRahtikirja" control={control} render={({ field }) => (<FormControlLabel control={<Checkbox {...field} checked={field.value} />} label="Rahtikirja" />)} />
                                </Box>
                                {(errors as any).isPuulaani && (<Typography color="error" variant="caption">{(errors as any).isPuulaani.message}</Typography>)}
                            </Box>
                        </Grid>

                        {isPuulaaniChecked && (
                            <Grid item xs={12} sm={6}>
                                <Controller
                                    name="targetColor"
                                    control={control}
                                    render={({ field }) => (<NativeColorPicker label="Target Color" value={field.value || '#FFFFFF'} onChange={field.onChange} required={isPuulaaniChecked} error={!!errors.targetColor} helperText={errors.targetColor?.message} disabled={isSaving} />)}
                                />
                            </Grid>
                        )}

                        <Grid item xs={12} sm={isPuulaaniChecked ? 6 : 12}>
                            <Controller name="isActive" control={control} render={({ field }) => (<FormControlLabel control={<Checkbox {...field} checked={field.value} />} label="Active" />)} />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={onClose} color="inherit" variant="outlined" disabled={isSaving}>Cancel</Button>
                    <Button type="submit" form="client-form" color="primary" variant="contained" disabled={isSaving || !isDirty || !isValid}>
                        {isSaving ? <CircularProgress size={24} color="inherit" /> : (initialData ? 'Save Changes' : 'Add Client')}
                    </Button>
                </DialogActions>
            </Box>
        </Dialog>
    );
};

export default ClientFormModal;