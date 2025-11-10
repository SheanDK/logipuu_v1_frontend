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

// Use ITripDetails which is what the parent page will provide
import { IUpdateLoadDto, ITripDetails } from '@/types';
import { updateLoad } from '@/services/loadService';

import { useTranslation } from 'react-i18next';

// Form data now matches the editable fields
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
        pvm: yup
            .date()
            .required(t('editLoadModal:validation.date.required'))
            .typeError(t('editLoadModal:validation.date.invalid')),
        vastaanottoNro: yup.string().nullable(),
        reitti: yup.string().nullable(),
        m3: yup
            .number()
            .transform(v => (isNaN(v as any) ? null : v))
            .typeError(t('editLoadModal:validation.number'))
            .min(0, t('editLoadModal:validation.min', { min: 0 }))
            .nullable(),
        km: yup
            .number()
            .transform(v => (isNaN(v as any) ? null : v))
            .typeError(t('editLoadModal:validation.number'))
            .min(0, t('editLoadModal:validation.min', { min: 0 }))
            .nullable(),
        tunnit: yup
            .number()
            .transform(v => (isNaN(v as any) ? null : v))
            .typeError(t('editLoadModal:validation.number'))
            .min(0, t('editLoadModal:validation.min', { min: 0 }))
            .nullable(),
        kpl: yup
            .number()
            .transform(v => (isNaN(v as any) ? null : v))
            .typeError(t('editLoadModal:validation.number'))
            .min(0, t('editLoadModal:validation.min', { min: 0 }))
            .nullable(),
        lisatiedot: yup.string().nullable(),
    });


interface EditLoadModalProps {
    open: boolean;
    onCloseAction: () => void;
    onSaveSuccessAction: (message: string) => void;
    loadData: ITripDetails; // Expect the full TripDetails object
}

export default function EditLoadModal({ open, onCloseAction, onSaveSuccessAction, loadData }: EditLoadModalProps) {
    const { t } = useTranslation(['editLoadModal', 'common']);
    const schema = useMemo(() => buildSchema(t), [t]);

    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { control, handleSubmit, reset, formState: { errors, isDirty, isValid } } = useForm<EditLoadFormData>({
        resolver: yupResolver(schema) as any, mode: 'onChange',
    });

    // Get the first leg, which is the primary record we are editing in this context
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
        if (!loadToEdit) {
            setError(t('editLoadModal:errors.missingData'));
            return;
        }

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
            // Use the correct kuormaId from the leg
            await updateLoad(loadToEdit.kuormaId, payload);
            onSaveSuccessAction(
                t('editLoadModal:snackbar.updated', { id: (loadToEdit as any).kuormaId })
            );
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
                        {t('editLoadModal:title', {
                            id: loadToEdit ? (loadToEdit as any).kuormaId : '—',
                        })}
                    </Typography>
                    <IconButton aria-label={t('common:buttons.close')} onClick={onCloseAction}><CloseIcon /></IconButton>
                </DialogTitle>
                <Box component="form" id="edit-load-form" onSubmit={handleSubmit(onSubmit)}>
                    <DialogContent dividers sx={{ p: { xs: 2, sm: 3 } }}>
                        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                        {/* Row 1: Date + Reception No (2 columns on >= sm) */}
                        <Box
                            sx={{
                                display: 'grid',
                                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                                gap: 2,
                                mb: 2,
                            }}
                        >
                            <Controller
                                name="pvm"
                                control={control}
                                render={({ field }) => (
                                    <DatePicker
                                        label={t('editLoadModal:fields.date')}
                                        value={field.value ? dayjs(field.value) : null}
                                        onChange={(date) => field.onChange(date?.toDate() ?? null)}
                                        format="DD.MM.YYYY"
                                        slotProps={{
                                            textField: {
                                                fullWidth: true,
                                                required: true,
                                                error: !!errors.pvm,
                                                helperText: errors.pvm?.message,
                                            },
                                        }}
                                    />
                                )}
                            />

                            <Controller
                                name="vastaanottoNro"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        value={field.value ?? ''}
                                        label={t('editLoadModal:fields.receptionNo')}
                                        fullWidth
                                        error={!!errors.vastaanottoNro}
                                        helperText={errors.vastaanottoNro?.message}
                                    />
                                )}
                            />
                        </Box>

                        {/* Row 2: Route (full width) */}
                        <Box sx={{ mb: 2 }}>
                            <Controller
                                name="reitti"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        value={field.value ?? ''}
                                        label={t('editLoadModal:fields.route')}
                                        fullWidth
                                        error={!!errors.reitti}
                                        helperText={errors.reitti?.message}
                                    />
                                )}
                            />
                        </Box>

                        {/* Row 3: Number fields (4 columns on >= sm, 2 columns on xs) */}
                        <Box
                            sx={{
                                display: 'grid',
                                gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, 1fr)' },
                                gap: 2,
                                mb: 2,
                            }}
                        >
                            <Controller
                                name="m3"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        value={field.value ?? ''}
                                        type="number"
                                        label={t('editLoadModal:fields.cubicMetres')}
                                        fullWidth
                                        error={!!errors.m3}
                                        helperText={errors.m3?.message}
                                    />
                                )}
                            />
                            <Controller
                                name="km"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        value={field.value ?? ''}
                                        type="number"
                                        label={t('editLoadModal:fields.freightKm')}
                                        fullWidth
                                        error={!!errors.km}
                                        helperText={errors.km?.message}
                                    />
                                )}
                            />
                            <Controller
                                name="tunnit"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        value={field.value ?? ''}
                                        type="number"
                                        label={t('editLoadModal:fields.hours')}
                                        fullWidth
                                        error={!!errors.tunnit}
                                        helperText={errors.tunnit?.message}
                                    />
                                )}
                            />
                            <Controller
                                name="kpl"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        value={field.value ?? ''}
                                        type="number"
                                        label={t('editLoadModal:fields.pcs')}
                                        fullWidth
                                        error={!!errors.kpl}
                                        helperText={errors.kpl?.message}
                                    />
                                )}
                            />
                        </Box>

                        {/* Row 4: Additional info (full width) */}
                        <Box>
                            <Controller
                                name="lisatiedot"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        value={field.value ?? ''}
                                        label={t('editLoadModal:fields.additionalInfo')}
                                        multiline
                                        rows={3}
                                        fullWidth
                                        error={!!errors.lisatiedot}
                                        helperText={errors.lisatiedot?.message}
                                    />
                                )}
                            />
                        </Box>
                    </DialogContent>
                    <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                        <Button onClick={onCloseAction} disabled={isSaving}>{t('common:buttons.cancel')}</Button>
                        <Button type="submit" form="edit-load-form" variant="contained" disabled={isSaving || !isDirty || !isValid}>{isSaving ? <CircularProgress size={24} /> : t('editLoadModal:actions.update')}</Button>
                    </DialogActions>
                </Box>
            </Dialog>
        </LocalizationProvider>
    );
}