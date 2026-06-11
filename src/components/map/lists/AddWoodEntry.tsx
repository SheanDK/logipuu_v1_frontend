// frontend/src/components/map/lists/AddWoodEntry.tsx
'use client';

import React, { useMemo } from 'react';
import { FormControl, InputLabel, Select, MenuItem, TextField, Button, Box, FormHelperText, Paper, ListItemIcon, ListItemText } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { IAddTimberStackWoodEntryFormData, IPuutavaraItem, IMapDropoffLocation } from '../../../types';
import { useTranslation } from '@/i18n/useTranslation';
import { useTheme } from '@mui/material/styles';

interface AddWoodEntryProps {
    onAddAction: (data: IAddTimberStackWoodEntryFormData) => void;
    woodTypeList: IPuutavaraItem[];
    dropoffLocationList: IMapDropoffLocation[];
    onAddNewUnloadingSite?: () => void;
}

export function AddWoodEntry({ onAddAction, woodTypeList, dropoffLocationList, onAddNewUnloadingSite }: AddWoodEntryProps) {
    const { t } = useTranslation(['addWoodEntry', 'common']);
    const theme = useTheme();

    const addWoodEntrySchema = useMemo(
        () =>
            yup.object({
                woodTypeId: yup
                    .number()
                    .nullable()
                    .required(t('entryForm.errors.woodTypeRequired')),
                dropoffLocationId: yup
                    .number()
                    .nullable()
                    .required(t('entryForm.errors.dropoffRequired')),
                volume: yup
                    .number()
                    .typeError(t('entryForm.errors.number'))
                    .nullable()
                    .min(0.01, t('entryForm.errors.volumeMin'))
                    .required(t('entryForm.errors.volumeRequired')),
            }),
        [t]
    );

    const { control, handleSubmit, reset, formState: { errors, isValid }, getValues } = useForm<IAddTimberStackWoodEntryFormData>({
        resolver: yupResolver(addWoodEntrySchema) as any,
        defaultValues: {
            woodTypeId: null,
            dropoffLocationId: null,
            volume: null,
        }
    });

    const handleAddClick = () => {
        handleSubmit(() => {
            const values = getValues();
            onAddAction(values);
            reset();
        })();
    };

    return (
        <Paper elevation={0} sx={{ backgroundColor: 'transparent', mt: 1 }}>
            <Box sx={{ width: '100%', border: '1px solid #ccc', p: 1.5, borderRadius: 1 }}>
                <Box
                    sx={{
                        display: 'grid',
                        gap: 2,
                        alignItems: 'center',
                        gridTemplateColumns: { xs: '1fr', sm: 'repeat(12, 1fr)' },
                    }}
                >
                    <Box sx={{ gridColumn: { xs: '1 / -1', sm: 'span 4' }, minWidth: 150 }}>
                        <FormControl fullWidth size="small" error={!!errors.woodTypeId}>
                            <InputLabel>{t('entryForm.labels.woodType')}</InputLabel>
                            <Controller name="woodTypeId" control={control} render={({ field }) => (
                                <Select {...field} label={t('entryForm.labels.woodType')} value={field.value ?? ''}>
                                    <MenuItem value="" disabled><em>{t('entryForm.labels.woodType')}</em></MenuItem>
                                    {woodTypeList.map((p) => (<MenuItem key={p.puutavaraNro} value={p.puutavaraNro}>{p.puutavara}</MenuItem>))}
                                </Select>
                            )} />
                            {errors.woodTypeId && <FormHelperText>{errors.woodTypeId.message}</FormHelperText>}
                        </FormControl>
                    </Box>

                    <Box sx={{ gridColumn: { xs: '1 / -1', sm: 'span 4' }, minWidth: 150 }}>
                        <FormControl fullWidth size="small" error={!!errors.dropoffLocationId}>
                            <InputLabel>{t('entryForm.labels.unloadingSite')}</InputLabel>
                            <Controller name="dropoffLocationId" control={control} render={({ field }) => (
                                <Select
                                    {...field}
                                    label={t('entryForm.labels.unloadingSite')}
                                    value={field.value ?? ''}
                                    onChange={(e) => {
                                        if (String(e.target.value) !== '__NEW__') {
                                            field.onChange(e);
                                        }
                                    }}
                                >
                                    <MenuItem value="" disabled><em>{t('entryForm.placeholders.selectSite')}</em></MenuItem>

                                    {/* + New Unloading Site option */}
                                    {onAddNewUnloadingSite && (
                                        <MenuItem
                                            value="__NEW__"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onAddNewUnloadingSite();
                                            }}
                                            sx={{
                                                color: theme.palette.success.main,
                                                fontWeight: 'bold',
                                                borderBottom: `1px solid ${theme.palette.divider}`,
                                                mb: 0.5,
                                            }}
                                        >
                                            <ListItemIcon sx={{ color: theme.palette.success.main, minWidth: 28 }}>
                                                <AddIcon fontSize="small" />
                                            </ListItemIcon>
                                            <ListItemText primary={t('entryForm.placeholders.newUnloadingSite')} />
                                        </MenuItem>
                                    )}

                                    {dropoffLocationList.map((p) => (
                                        <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                                    ))}
                                </Select>
                            )} />
                            {errors.dropoffLocationId && <FormHelperText>{errors.dropoffLocationId.message}</FormHelperText>}
                        </FormControl>
                    </Box>

                    <Box sx={{ gridColumn: { xs: '1 / -1', sm: 'span 2' } }}>
                        <Controller name="volume" control={control} render={({ field }) => (
                            <TextField
                                {...field} fullWidth size="small" type="number" label={t('entryForm.labels.volume')}
                                value={field.value ?? ''}
                                onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                                error={!!errors.volume} helperText={errors.volume?.message}
                            />
                        )} />
                    </Box>

                    <Box sx={{ gridColumn: { xs: '1 / -1', sm: 'span 2' } }}>
                        <Button
                            variant="contained" size="medium"
                            disabled={!isValid}
                            onClick={handleAddClick}
                            startIcon={<AddIcon />}
                            fullWidth
                        >
                            {t('common:buttons.add')}
                        </Button>
                    </Box>
                </Box>
            </Box>
        </Paper>
    );
}