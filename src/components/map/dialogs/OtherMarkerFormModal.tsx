// frontend/src/components/map/dialogs/OtherMarkerFormModal.tsx
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, TextField,
    Grid, CircularProgress, Alert, Stack, Typography, IconButton, Paper, Tooltip
} from '@mui/material';
import { useForm, Controller, SubmitHandler, FieldValues } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { OtherMarkerFormData, ICreateOtherMarkerDto, IUpdateOtherMarkerDto, IMapOtherMarker } from '@/types';
import IconPickerModal from './IconPickerModal';
import * as MuiIcons from '@mui/icons-material';
import CloseIcon from '@mui/icons-material/Close';
import CheckIcon from '@mui/icons-material/Check';
import { useTranslation } from '@/i18n/useTranslation';


interface OtherMarkerFormModalProps {
    open: boolean;
    onCloseAction: () => void;
    onSaveAction: (data: ICreateOtherMarkerDto | IUpdateOtherMarkerDto, id?: number) => Promise<void>;
    isSaving: boolean;
    error: string | null;
    initialData: IMapOtherMarker | null;
}

const PRESET_COLORS = ['#D32F2F', '#388E3C', '#1976D2', '#FBC02D', '#E64A19', '#7B1FA2', '#00796B', '#5D4037', '#424242'];

export default function OtherMarkerFormModal({ open, onCloseAction, onSaveAction, isSaving, error, initialData }: OtherMarkerFormModalProps) {
    const isEditMode = useMemo(() => !!initialData, [initialData]);
    const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
    const { t } = useTranslation(['otherMarkerFormModal', 'common']);

    const schema = useMemo(() => yup.object({
    name: yup.string().required(t('otherMarker:validation.nameRequired')),
    iconType: yup.string().nullable().required(t('otherMarker:validation.iconRequired')),
    color: yup
      .string()
      .required(t('otherMarker:validation.colorRequired'))
      .matches(/^#([0-9A-Fa-f]{6})$/i, t('otherMarker:validation.hexInvalid')),
    additionalInfo: yup.string().ensure(),
  }), [t]);

    
    const { control, handleSubmit, reset, setValue, watch, formState: { errors, isValid, isDirty } } = useForm<OtherMarkerFormData>({
        resolver: yupResolver(schema) as any,
        defaultValues: { name: '', iconType: 'Place', color: '#424242', additionalInfo: '' },
    });

    useEffect(() => {
        if (open) {
            if (isEditMode && initialData) {
                reset({ name: initialData.name, iconType: initialData.iconType, color: initialData.color, additionalInfo: initialData.additionalInfo || '' });
            } else {
                reset({ name: '', iconType: 'Place', color: '#424242', additionalInfo: '' });
            }
        }
    }, [open, isEditMode, initialData, reset]);

    const selectedIconName = watch('iconType');
    const selectedColor = watch('color');

    const IconComponent = useMemo(() => {
        if (selectedIconName && MuiIcons[selectedIconName as keyof typeof MuiIcons]) {
            return MuiIcons[selectedIconName as keyof typeof MuiIcons];
        }
        return MuiIcons.HelpOutline;
    }, [selectedIconName]);

    const onSubmit: SubmitHandler<OtherMarkerFormData> = (data) => {
        const payload = { name: data.name, iconType: data.iconType!, color: data.color, additionalInfo: data.additionalInfo || null };
        onSaveAction(payload, initialData?.id);
    };

    const handleColorSelect = (color: string) => {
        setValue('color', color, { shouldValidate: true, shouldDirty: true });
    };

    return (
        <>
            <Dialog open={open} onClose={onCloseAction} maxWidth="sm" fullWidth>
                 <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" component="div">{isEditMode ? t('title.edit') : t('title.create')}</Typography>
                    <IconButton aria-label={t('common:buttons.close')} onClick={onCloseAction} sx={{ color: (theme) => theme.palette.grey[500] }}><CloseIcon /></IconButton>
                </DialogTitle>
                <Box component="form" id="other-marker-form" onSubmit={handleSubmit(onSubmit as SubmitHandler<FieldValues>)}>
                    <DialogContent dividers sx={{ p: { xs: 2, sm: 3 } }}>
                        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                        <Stack spacing={2.5}>
                            <Controller name="name" control={control} render={({ field }) => (
                                <TextField {...field} label={t('fields.name')} fullWidth required autoFocus error={!!errors.name} helperText={errors.name?.message} />
                            )}/>
                            
                            <Paper variant="outlined" sx={{ p: 2, borderColor: 'divider' }}>
                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems="center">
                                    
                                    {/* --- FIX: Removed 'item', 'xs', and 'sm' props --- */}
                                    <Stack sx={{ textAlign: 'center', alignItems: 'center' }} spacing={1}>
                                        <Typography variant="overline" color="text.secondary">{t('labels.preview').toUpperCase()}</Typography>
                                        <Box sx={{ width: 80, height: 80, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0f0f0', border: `2px solid ${selectedColor}` }}>
                                            <IconComponent sx={{ fontSize: 40, color: selectedColor, transition: 'color 0.3s' }} />
                                        </Box>
                                        <Button size="small" onClick={() => setIsIconPickerOpen(true)}>{t('buttons.changeIcon')}</Button>
                                        {errors.iconType && <Typography variant="caption" display="block" color="error">{errors.iconType.message}</Typography>}
                                    </Stack>

                                    {/* --- FIX: Removed 'item', 'xs', and 'sm' props --- */}
                                    <Stack spacing={1.5} sx={{ width: '100%' }}>
                                        <Typography variant="overline" color="text.secondary">{t('labels.color').toUpperCase()}</Typography>
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                            {PRESET_COLORS.map(color => (
                                                <Tooltip title={color} key={color}>
                                                    <Box onClick={() => handleColorSelect(color)} sx={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: color, cursor: 'pointer', border: '2px solid', borderColor: selectedColor.toLowerCase() === color.toLowerCase() ? 'primary.main' : 'transparent', transition: 'all 0.2s ease-in-out', display: 'flex', alignItems: 'center', justifyContent: 'center', '&:hover': { transform: 'scale(1.1)' } }}>
                                                        {selectedColor.toLowerCase() === color.toLowerCase() && <CheckIcon sx={{ color: '#fff', fontSize: 18 }} />}
                                                    </Box>
                                                </Tooltip>
                                            ))}
                                        </Box>
                                        
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, pt: 1 }}>
                                            <Typography variant="body2" color="text.secondary">{t('labels.custom')}:</Typography>
                                            <Controller name="color" control={control} render={({ field }) => (
                                                <Box sx={{ position: 'relative', width: 80, height: 28, borderRadius: 1, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
                                                    <Box sx={{ width: '100%', height: '100%', backgroundColor: field.value }} />
                                                    <input type="color" {...field} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, border: 'none', cursor: 'pointer' }}/>
                                                </Box>
                                            )}/>
                                        </Box>
                                        {errors.color && <Typography variant="caption" display="block" color="error">{errors.color.message}</Typography>}
                                    </Stack>
                                </Stack>
                            </Paper>
                            
                            <Controller name="additionalInfo" control={control} render={({ field }) => (
                                <TextField {...field} label={t('fields.additionalInfo')} multiline rows={3} fullWidth />
                            )}/>
                        </Stack>
                    </DialogContent>
                    <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                         <Button onClick={onCloseAction}>{t('common:buttons.cancel')}</Button>
                         <Button type="submit" form="other-marker-form" variant="contained" disabled={isSaving || (isEditMode && !isDirty) || !isValid}>
                            {isSaving ? <CircularProgress size={24} /> : (isEditMode ?  t('buttons.update') : t('buttons.create'))}
                        </Button>
                    </DialogActions>
                </Box>
            </Dialog>

            <IconPickerModal open={isIconPickerOpen} onCloseAction={() => setIsIconPickerOpen(false)} onSelectAction={(iconName) => { setValue('iconType', iconName, { shouldValidate: true, shouldDirty: true }); setIsIconPickerOpen(false); }} />
        </>
    );
}