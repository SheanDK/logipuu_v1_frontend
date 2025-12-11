// frontend/src/components/loads/EditLoadModal.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, TextField,
    CircularProgress, Alert, Typography, IconButton
} from '@mui/material';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import CloseIcon from '@mui/icons-material/Close';

// Import IUser type
import { IUpdateLoadDto, ITripDetails, IUser } from '@/types';
import { updateLoad } from '@/services/loadService';

import { useTranslation } from 'react-i18next';

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

const buildSchema = (t: (k: string, o?: any) => string) =>
    yup.object({
        pvm: yup.date().required().nullable(),
        vastaanottoNro: yup.string().nullable(),
        reitti: yup.string().nullable(),
        m3: yup.number().nullable().transform((v, o) => (o === '' ? null : v)),
        km: yup.number().nullable().transform((v, o) => (o === '' ? null : v)),
        tunnit: yup.number().nullable().transform((v, o) => (o === '' ? null : v)),
        kpl: yup.number().nullable().transform((v, o) => (o === '' ? null : v)),
        lisatiedot: yup.string().nullable(),
    });

// --- FIX 2: Update the Interface to accept currentUser ---
interface EditLoadModalProps {
    open: boolean;
    onCloseAction: () => void;
    onSaveSuccessAction: (message: string) => void;
    loadData: ITripDetails;
    currentUser: IUser; // <-- This line is crucial
}

export default function EditLoadModal({ 
    open, 
    onCloseAction, 
    onSaveSuccessAction, 
    loadData, 
    currentUser // <-- Destructure it here
}: EditLoadModalProps) {
    
    const { t } = useTranslation(['editLoadModal', 'common']);
    const schema = useMemo(() => buildSchema(t), [t]);

    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const { control, handleSubmit, reset, formState: { errors, isDirty, isValid } } = useForm<EditLoadFormData>({
        resolver: yupResolver(schema) as any, mode: 'onChange',
    });

    const loadToEdit = loadData?.legs?.[0];

    useEffect(() => {
        if (loadToEdit) {
            reset({
                pvm: dayjs(loadToEdit.pvm).toDate(),
                vastaanottoNro: (loadToEdit as any).vastaanottoNro || '',
                reitti: (loadToEdit as any).reitti || '',
                m3: Number(loadToEdit.m3) || 0,
                km: (loadToEdit as any).km || 0,
                tunnit: (loadToEdit as any).tunnit || 0,
                kpl: (loadToEdit as any).kpl || 0,
                lisatiedot: loadToEdit.lisatiedot || ''
            });
        }
    }, [loadToEdit, reset]);

    const onSubmit: SubmitHandler<EditLoadFormData> = async (formData) => {
        if (!loadToEdit) return;

        setIsSaving(true);
        setError(null);

        const payload: IUpdateLoadDto = {
            pvm: formData.pvm!,
            vastaanottoNro: formData.vastaanottoNro || null,
            reitti: formData.reitti || null,
            m3: formData.m3,
            km: formData.km,
            tunnit: formData.tunnit,
            kpl: formData.kpl,
            lisatiedot: formData.lisatiedot || null,
        };

        try {
            // Pass currentUser to the service function
            await updateLoad(loadToEdit.kuormaId, payload, currentUser);
            
            onSaveSuccessAction(t('editLoadModal:snackbar.updated', { id: loadToEdit.kuormaId }));
        } catch (err: any) {
            setError(err?.response?.data?.message || t('editLoadModal:errors.updateFailed'));
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Dialog open={open} onClose={onCloseAction} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" component="div">
                        {t('editLoadModal:title', { id: loadToEdit?.kuormaId })}
                    </Typography>
                    <IconButton onClick={onCloseAction}><CloseIcon /></IconButton>
                </DialogTitle>
                <Box component="form" onSubmit={handleSubmit(onSubmit)}>
                    <DialogContent dividers>
                        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                        
                        {/* Form Fields (Date, Reception No, etc.) */}
                         <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 2 }}>
                            <Controller
                                name="pvm"
                                control={control}
                                render={({ field }) => (
                                    <DatePicker
                                        label={t('editLoadModal:fields.date')}
                                        value={field.value ? dayjs(field.value) : null}
                                        onChange={(date) => field.onChange(date?.toDate() ?? null)}
                                        format="DD.MM.YYYY"
                                        slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                                    />
                                )}
                            />
                            <Controller
                                name="vastaanottoNro"
                                control={control}
                                render={({ field }) => <TextField {...field} label={t('editLoadModal:fields.receptionNo')} fullWidth size="small" />}
                            />
                        </Box>

                         {/* ... Other fields (Route, M3, KM, etc) ... */}
                         <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, 1fr)' }, gap: 2, mb: 2 }}>
                             <Controller name="m3" control={control} render={({ field }) => <TextField {...field} label="m3" type="number" fullWidth size="small" />} />
                             <Controller name="km" control={control} render={({ field }) => <TextField {...field} label="km" type="number" fullWidth size="small" />} />
                             <Controller name="tunnit" control={control} render={({ field }) => <TextField {...field} label="h" type="number" fullWidth size="small" />} />
                             <Controller name="kpl" control={control} render={({ field }) => <TextField {...field} label="kpl" type="number" fullWidth size="small" />} />
                         </Box>
                         
                         <Controller name="lisatiedot" control={control} render={({ field }) => <TextField {...field} label="Info" multiline rows={2} fullWidth size="small" />} />

                    </DialogContent>
                    <DialogActions>
                        <Button onClick={onCloseAction}>{t('common:buttons.cancel')}</Button>
                        <Button type="submit" variant="contained" disabled={isSaving}>
                            {isSaving ? <CircularProgress size={24} /> : t('editLoadModal:actions.update')}
                        </Button>
                    </DialogActions>
                </Box>
            </Dialog>
        </LocalizationProvider>
    );
}