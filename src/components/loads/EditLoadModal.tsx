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

import { IUpdateLoadDto, ITripDetails, IUser } from '@/types';
import { updateLoad } from '@/services/loadService';
import { useTranslation } from 'react-i18next';

interface EditLoadFormData {
    pvm: Date | null;
    ajomaaraysNro: string;
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
        ajomaaraysNro: yup.string().nullable(),
        vastaanottoNro: yup.string().nullable(),
        reitti: yup.string().nullable(),
        m3: yup.number().typeError('Must be a number').nullable().transform((v, o) => (o === '' ? 0 : v)),
        km: yup.number().typeError('Must be a number').nullable().transform((v, o) => (o === '' ? 0 : v)),
        tunnit: yup.number().typeError('Must be a number').nullable().transform((v, o) => (o === '' ? 0 : v)),
        kpl: yup.number().typeError('Must be a number').nullable().transform((v, o) => (o === '' ? 0 : v)),
        lisatiedot: yup.string().nullable(),
    });

interface EditLoadModalProps {
    open: boolean;
    onCloseAction: () => void;
    onSaveSuccessAction: (message: string) => void;
    loadData: any; 
    currentUser: IUser;
}

export default function EditLoadModal({ open, onCloseAction, onSaveSuccessAction, loadData, currentUser }: EditLoadModalProps) {
    const { t } = useTranslation(['editLoadModal', 'common']);
    const schema = useMemo(() => buildSchema(t), [t]);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const { control, handleSubmit, reset, formState: { errors } } = useForm<EditLoadFormData>({
        resolver: yupResolver(schema) as any,
        mode: 'onChange',
    });


    const loadToEdit = useMemo(() => {
        if (!loadData) return null;
        if (loadData.legs && loadData.legs.length > 0) {
            return loadData.legs[0];
        }
        return loadData;
    }, [loadData]);

    
    const displayId = useMemo(() => {
        if (!loadToEdit) return '';
        if (loadToEdit.kuormaId) return loadToEdit.kuormaId;
        if (loadToEdit.tripId && typeof loadToEdit.tripId === 'string') {
            return loadToEdit.tripId.replace(/^\D+/g, ''); // Extract digits
        }
        return '';
    }, [loadToEdit]);

    useEffect(() => {
        if (loadToEdit && open) {
            reset({
                pvm: loadToEdit.pvm ? dayjs(loadToEdit.pvm).toDate() : new Date(),
                ajomaaraysNro: loadToEdit.ajomaaraysNro || loadToEdit.ajomaarays_nro || '',
                vastaanottoNro: loadToEdit.vastaanottoNro || loadToEdit.vastaanotto_nro || '',
                reitti: loadToEdit.reitti || loadToEdit.kohde || '',
                m3: parseFloat(loadToEdit.m3) || 0,
                km: parseFloat(loadToEdit.km) || 0,
                tunnit: parseFloat(loadToEdit.tunnit || loadToEdit.jako) || 0,
                kpl: parseFloat(loadToEdit.kpl) || 0,
                lisatiedot: loadToEdit.lisatiedot || ''
            });
        }
    }, [loadToEdit, open, reset]);

    const onSubmit: SubmitHandler<EditLoadFormData> = async (formData) => {
        if (!loadToEdit) return;
        setIsSaving(true);
        setError(null);

        const payload: IUpdateLoadDto = {
            pvm: formData.pvm!,
            ajomaaraysNro: formData.ajomaaraysNro || null,
            vastaanottoNro: formData.vastaanottoNro || null,
            reitti: formData.reitti || null,
            m3: formData.m3,
            km: formData.km,
            tunnit: formData.tunnit,
            kpl: formData.kpl,
            lisatiedot: formData.lisatiedot || null,
        };

        try {
            await updateLoad(Number(displayId), payload, currentUser);
            onSaveSuccessAction(t('editLoadModal:snackbar.updated', { id: displayId }));
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
                    <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
                         {t('editLoadModal:title', { id: displayId, defaultValue: `Edit Load #${displayId}` })}
                    </Typography>
                    <IconButton onClick={onCloseAction}><CloseIcon /></IconButton>
                </DialogTitle>
                <Box component="form" onSubmit={handleSubmit(onSubmit)}>
                    <DialogContent dividers>
                        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                        
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
                                name="ajomaaraysNro"
                                control={control}
                                render={({ field }) => (
                                    <TextField {...field} label={t('editLoadModal:fields.drivingOrderNo', {defaultValue: 'Driving Order No'})} fullWidth size="small" />
                                )}
                            />
                        </Box>

                        <Box sx={{ mb: 2 }}>
                            <Controller
                                name="vastaanottoNro"
                                control={control}
                                render={({ field }) => <TextField {...field} label={t('editLoadModal:fields.receptionNo')} fullWidth size="small" />}
                            />
                        </Box>

                        <Box sx={{ mb: 2 }}>
                            <Controller
                                name="reitti"
                                control={control}
                                render={({ field }) => <TextField {...field} label={t('editLoadModal:fields.route', {defaultValue: 'Route'})} fullWidth size="small" />}
                            />
                        </Box>

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